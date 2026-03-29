import { frameworkLogger } from "../core/framework-logger.js";
export class StringRayStateManager {
    store = new Map();
    persistencePath;
    persistenceEnabled;
    writeQueue = new Map();
    initialized = false;
    earlyOperationsQueue = []; // Queue keys that need persistence after init
    static VERSION = "1.5.2";
    constructor(persistencePath = ".opencode/state/state.json", persistenceEnabled = true) {
        this.persistencePath = persistencePath;
        this.persistenceEnabled = persistenceEnabled;
        this.initializePersistence();
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
                const pendingOps = this.earlyOperationsQueue.length;
                for (const key of this.earlyOperationsQueue) {
                    this.schedulePersistence(key);
                }
                this.earlyOperationsQueue = [];
                frameworkLogger.log("state-manager", "processed queued early operations", "info", {
                    operationsProcessed: pendingOps,
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
        frameworkLogger.log("state-manager", "get operation", "info", {
            key,
            hasValue: value !== undefined,
        });
        return value;
    }
    set(key, value) {
        const jobId = `state-set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Store in memory immediately, even if persistence isn't ready yet
        this.store.set(key, value);
        // If initialized, schedule persistence
        if (this.initialized && this.persistenceEnabled) {
            this.schedulePersistence(key);
        }
        else if (!this.initialized) {
            // Queue for persistence once initialized
            if (!this.earlyOperationsQueue.includes(key)) {
                this.earlyOperationsQueue.push(key);
            }
            frameworkLogger.log("state-manager", "set called before initialization, queued for persistence", "debug", { jobId, key });
        }
        frameworkLogger.log("state-manager", "set operation", "success", {
            jobId,
            key,
        });
    }
    clear(key) {
        // If not initialized yet, queue the operation
        if (!this.initialized) {
            this.earlyOperationsQueue.push(key);
            frameworkLogger.log("state-manager", "clear queued for initialization", "info", { key, queueSize: this.earlyOperationsQueue.length });
            return;
        }
        const existed = this.store.has(key);
        this.store.delete(key);
        // Immediately persist the deletion
        if (this.persistenceEnabled && existed) {
            this.persistToDisk();
        }
        frameworkLogger.log("state-manager", "clear operation", existed ? "success" : "info", { key, existed });
    }
    clearAll() {
        // Ensure persistence is initialized
        if (!this.initialized) {
            frameworkLogger.log("state-manager", "clearAll called before initialization", "error", {});
            return;
        }
        const keysCount = this.store.size;
        this.store.clear();
        // Immediately persist the empty state
        if (this.persistenceEnabled && keysCount > 0) {
            this.persistToDisk();
        }
        frameworkLogger.log("state-manager", "clearAll operation", "success", {
            keysCleared: keysCount,
        });
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
    // Enterprise features for advanced state management
    getStateVersion() {
        return StringRayStateManager.VERSION || "1.1.1";
    }
    getAuditLog() {
        return []; // Simplified implementation for testing
    }
    resolveConflict(conflict) {
        // Simple resolution strategy: prefer the newer value
        frameworkLogger.log("state-manager", "conflict-resolved", "info", {
            key: conflict.key,
            strategy: "prefer-newer",
        });
        return conflict.value2; // Prefer the second value as newer
    }
}
// Export alias for scripts expecting StrRayStateManager (backward compatibility)
export { StringRayStateManager as StrRayStateManager };
//# sourceMappingURL=state-manager.js.map