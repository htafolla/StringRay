export interface StateManager {
    get: <T>(key: string) => T | undefined;
    set: <T>(key: string, value: T) => void;
    clear: (key: string) => void;
}
export declare class StrRayStateManager implements StateManager {
    private store;
    private persistencePath;
    private persistenceEnabled;
    private writeQueue;
    private initialized;
    private earlyOperationsQueue;
    constructor(persistencePath?: string, persistenceEnabled?: boolean);
    private initializePersistence;
    private persistToDisk;
    private isSerializable;
    private schedulePersistence;
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    clear(key: string): void;
    isPersistenceEnabled(): boolean;
    getPersistenceStats(): {
        enabled: boolean;
        initialized: boolean;
        keysInMemory: number;
        pendingWrites: number;
    };
}
//# sourceMappingURL=state-manager.d.ts.map