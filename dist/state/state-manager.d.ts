export interface StateManager {
    get: <T>(key: string) => T | undefined;
    set: <T>(key: string, value: T) => void;
    clear: (key: string) => void;
}
export declare class StrRayStateManager implements StateManager {
    private store;
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    clear(key: string): void;
}
//# sourceMappingURL=state-manager.d.ts.map