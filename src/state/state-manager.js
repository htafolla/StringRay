import { frameworkLogger, generateJobId } from "../framework-logger";
export class StringRayStateManager {
    store = new Map();
    persistencePath;
    persistenceEnabled;
    writeQueue = new Map();
    initialized = false;
    earlyOperationsQueue = []; // Queue keys that need persistence after init
    // Enterprise features
    enterpriseConfig;
    distributedManager; // DistributedStateManager
    stateVersions = new Map();
    stateAuditLog = [];
    backupTimer;
    isDistributedMode = false;
    constructor(persistencePath = ".opencode/state", persistenceEnabled = true, enterpriseConfig = {}) {
        this.persistencePath = persistencePath;
        this.persistenceEnabled = persistenceEnabled;
        this.enterpriseConfig = {
            distributedMode: false,
            conflictResolution: "version-based",
            backupInterval: 3600000, // 1 hour
            maxBackups: 10,
            encryptionEnabled: false,
            auditLogging: true,
            ...enterpriseConfig,
        };
        this.initializeEnterpriseFeatures();
        this.initializePersistence();
    }
    async initializeEnterpriseFeatures() {
        // Initialize backup system
        if (this.enterpriseConfig.backupInterval > 0) {
            this.startBackupSystem();
        }
    }
    startBackupSystem() {
        this.backupTimer = setInterval(() => {
            this.createStateBackup();
        }, this.enterpriseConfig.backupInterval);
    }
    async createStateBackup() {
        try {
            const fs = await import("fs");
            const path = await import("path");
            const backupDir = path.join(path.dirname(this.persistencePath), "backups");
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const backupPath = path.join(backupDir, `state-backup-${timestamp}.json`);
            const stateData = Object.fromEntries(this.store);
            fs.writeFileSync(backupPath, JSON.stringify(stateData, null, 2));
            // Clean up old backups
            const backups = fs.readdirSync(backupDir)
                .filter(f => f.startsWith("state-backup-"))
                .sort()
                .reverse();
            if (backups.length > this.enterpriseConfig.maxBackups) {
                const toDelete = backups.slice(this.enterpriseConfig.maxBackups);
                toDelete.forEach(backup => {
                    fs.unlinkSync(path.join(backupDir, backup));
                });
            }
            frameworkLogger.log("state-manager", "state backup created", "info", { backupPath });
        }
        catch (error) {
            frameworkLogger.log("state-manager", "state backup failed", "error", { error });
        }
    }
    async initializePersistence() {
        if (!this.persistenceEnabled) {
            this.initialized = true;
            return;
        }
        try {
            const fs = await import("fs");
            const path = await import("path");
            // Ensure persistence directory exists
            const dir = path.dirname(this.persistencePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // Handle case where persistencePath exists but is a file instead of expected location
            if (fs.existsSync(this.persistencePath)) {
                const stats = fs.statSync(this.persistencePath);
                if (stats.isFile()) {
                    // If it's a file blocking our path, remove it (it's likely old state)
                    fs.unlinkSync(this.persistencePath);
                }
                else if (!stats.isFile()) {
                    // If it's not a file (e.g., directory), use a different filename
                    this.persistencePath = path.join(this.persistencePath, "state.json");
                }
            }
            // Load existing state from disk
            if (fs.existsSync(this.persistencePath)) {
                const data = fs.readFileSync(this.persistencePath, "utf8");
                const parsed = JSON.parse(data);
                for (const [key, value] of Object.entries(parsed)) {
                    this.store.set(key, value);
                }
                frameworkLogger.log("state-manager", "persistence loaded", "success", {
                    keysLoaded: Object.keys(parsed).length,
                });
            }
            this.initialized = true;
            // Process any early operations that were queued
            if (this.persistenceEnabled && this.earlyOperationsQueue.length > 0) {
                for (const key of this.earlyOperationsQueue) {
                    this.schedulePersistence(key);
                }
                this.earlyOperationsQueue = [];
                frameworkLogger.log("state-manager", "processed queued early operations", "info", {
                    operationsProcessed: this.earlyOperationsQueue.length,
                });
            }
        }
        catch (error) {
            frameworkLogger.log("state-manager", "persistence initialization failed", "error", {
                error: error instanceof Error ? error.message : String(error),
            });
            // Continue without persistence rather than failing
            this.persistenceEnabled = false;
            this.initialized = true;
        }
    }
    async persistToDisk() {
        if (!this.persistenceEnabled || !this.initialized)
            return;
        try {
            const fs = await import("fs");
            // Convert Map to object for JSON serialization
            const data = {};
            for (const [key, value] of this.store.entries()) {
                // Only persist serializable data
                if (this.isSerializable(value)) {
                    data[key] = value;
                }
            }
            fs.writeFileSync(this.persistencePath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            frameworkLogger.log("state-manager", "disk persistence failed", "error", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    isSerializable(value) {
        try {
            JSON.stringify(value);
            return true;
        }
        catch {
            return false;
        }
    }
    schedulePersistence(key) {
        // Debounce writes to disk (100ms delay)
        const existingTimeout = this.writeQueue.get(key);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        const timeout = setTimeout(() => {
            this.persistToDisk();
            this.writeQueue.delete(key);
        }, 100);
        this.writeQueue.set(key, timeout);
    }
    get(key) {
        const value = this.store.get(key);
        // Handle enterprise audit logging
        if (this.enterpriseConfig.auditLogging) {
            this.logStateOperation("get", key);
        }
        // Handle corruption: treat null values as undefined (corrupted state)
        if (value === null) {
            frameworkLogger.log("state-manager", "detected corrupted state (null value)", "info", { key }, undefined, generateJobId('state-corruption'));
            return undefined;
        }
        return value;
    }
    set(key, value) {
        // Version management for conflict resolution
        const currentVersion = this.stateVersions.get(key) || 0;
        const newVersion = currentVersion + 1;
        this.stateVersions.set(key, newVersion);
        this.store.set(key, value);
        // Handle enterprise features
        if (this.enterpriseConfig.auditLogging) {
            this.logStateOperation("set", key, value, newVersion);
        }
        // Handle distributed synchronization
        this.handleDistributedSync("set", key, value, newVersion);
        // Queue persistence
        this.schedulePersistence(key);
    }
    clear(key) {
        // Version management for conflict resolution
        const currentVersion = this.stateVersions.get(key) || 0;
        const newVersion = currentVersion + 1;
        this.stateVersions.set(key, newVersion);
        this.store.delete(key);
        // Handle enterprise features
        if (this.enterpriseConfig.auditLogging) {
            this.logStateOperation("clear", key, undefined, newVersion);
        }
        // Handle distributed synchronization
        this.handleDistributedSync("clear", key, undefined, newVersion);
        // Queue persistence
        this.schedulePersistence(key);
    }
    /**
     * Clear all state (for testing purposes)
     */
    clearAll() {
        this.store.clear();
        this.stateVersions.clear();
        this.stateAuditLog.length = 0;
        // Handle distributed sync if needed
        if (this.isDistributedMode && this.distributedManager) {
            // Note: This would need to be implemented in distributed manager
        }
        frameworkLogger.log("state-manager", "cleared all state", "info");
    }
    async handleDistributedSync(operation, key, value, version) {
        if (!this.isDistributedMode)
            return;
        try {
            // Lazy load distributed manager to avoid import issues
            // Distributed features temporarily disabled due to compilation issues
            // TODO: Re-enable when advanced-features are properly implemented
            if (!this.distributedManager && this.enterpriseConfig.redisUrl) {
                frameworkLogger.log("state-manager", "distributed features not yet implemented", "info", {
                    redisUrl: this.enterpriseConfig.redisUrl.substring(0, 20) + "..."
                });
            }
            if (this.distributedManager) {
                if (operation === "set") {
                    await this.distributedManager.set(key, value);
                }
                else {
                    await this.distributedManager.delete(key);
                }
            }
        }
        catch (error) {
            frameworkLogger.log("state-manager", "distributed sync failed", "error", { key, operation, error });
        }
    }
    logStateOperation(operation, key, value, version) {
        const auditEntry = {
            timestamp: Date.now(),
            operation,
            key,
        };
        if (this.enterpriseConfig.instanceId) {
            auditEntry.userId = this.enterpriseConfig.instanceId;
        }
        this.stateAuditLog.push(auditEntry);
        // Keep only last 1000 audit entries
        if (this.stateAuditLog.length > 1000) {
            this.stateAuditLog = this.stateAuditLog.slice(-1000);
        }
    }
    /**
     * Enterprise method: Get state version for conflict resolution
     */
    getStateVersion(key) {
        return this.stateVersions.get(key) || 0;
    }
    /**
     * Enterprise method: Get audit log for compliance
     */
    getAuditLog(limit = 100) {
        return this.stateAuditLog.slice(-limit);
    }
    /**
     * Enterprise method: Resolve state conflicts
     */
    resolveConflict(key, localValue, remoteValue, localVersion, remoteVersion) {
        switch (this.enterpriseConfig.conflictResolution) {
            case "last-write-wins":
                return remoteVersion > localVersion ? remoteValue : localValue;
            case "version-based":
                return remoteVersion > localVersion ? remoteValue : localValue;
            case "manual":
            default:
                // Return local value by default, log conflict for manual resolution
                frameworkLogger.log("state-manager", "state conflict detected", "error", {
                    key,
                    localVersion,
                    remoteVersion,
                    resolution: "manual-intervention-required"
                });
                return localValue;
        }
    }
    // New method to check if persistence is enabled
    isPersistenceEnabled() {
        return this.persistenceEnabled;
    }
    // New method to get persistence stats
    getPersistenceStats() {
        return {
            enabled: this.persistenceEnabled,
            initialized: this.initialized,
            keysInMemory: this.store.size,
            pendingWrites: this.writeQueue.size,
        };
    }
}
// Export alias for scripts expecting StrRayStateManager (backward compatibility)
export { StringRayStateManager as StrRayStateManager };
//# sourceMappingURL=state-manager.js.map