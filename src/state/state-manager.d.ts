export interface StateManager {
    get: <T>(key: string) => T | undefined;
    set: <T>(key: string, value: T) => void;
    clear: (key: string) => void;
}
export interface EnterpriseStateConfig {
    distributedMode: boolean;
    redisUrl?: string;
    instanceId?: string;
    conflictResolution: "last-write-wins" | "version-based" | "manual";
    backupInterval: number;
    maxBackups: number;
    encryptionEnabled: boolean;
    auditLogging: boolean;
}
export declare class StringRayStateManager implements StateManager {
    private store;
    private persistencePath;
    private persistenceEnabled;
    private writeQueue;
    private initialized;
    private earlyOperationsQueue;
    private enterpriseConfig;
    private distributedManager?;
    private stateVersions;
    private stateAuditLog;
    private backupTimer?;
    private isDistributedMode;
    constructor(persistencePath?: string, persistenceEnabled?: boolean, enterpriseConfig?: Partial<EnterpriseStateConfig>);
    private initializeEnterpriseFeatures;
    private startBackupSystem;
    private createStateBackup;
    private initializePersistence;
    private persistToDisk;
    private isSerializable;
    private schedulePersistence;
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    clear(key: string): void;
    /**
     * Clear all state (for testing purposes)
     */
    clearAll(): void;
    private handleDistributedSync;
    private logStateOperation;
    /**
     * Enterprise method: Get state version for conflict resolution
     */
    getStateVersion(key: string): number;
    /**
     * Enterprise method: Get audit log for compliance
     */
    getAuditLog(limit?: number): Array<{
        timestamp: number;
        operation: string;
        key: string;
        userId?: string;
    }>;
    /**
     * Enterprise method: Resolve state conflicts
     */
    resolveConflict(key: string, localValue: any, remoteValue: any, localVersion: number, remoteVersion: number): any;
    isPersistenceEnabled(): boolean;
    getPersistenceStats(): {
        enabled: boolean;
        initialized: boolean;
        keysInMemory: number;
        pendingWrites: number;
    };
}
export { StringRayStateManager as StrRayStateManager };
//# sourceMappingURL=state-manager.d.ts.map