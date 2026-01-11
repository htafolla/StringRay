import { frameworkLogger } from "../framework-logger.js";
export class StrRayStateManager {
    constructor() {
        this.store = new Map();
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
        this.store.set(key, value);
        frameworkLogger.log("state-manager", "set operation", "success", { key });
    }
    clear(key) {
        const existed = this.store.has(key);
        this.store.delete(key);
        frameworkLogger.log("state-manager", "clear operation", existed ? "success" : "info", { key, existed });
    }
}
