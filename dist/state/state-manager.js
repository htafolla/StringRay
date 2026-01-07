export class StrRayStateManager {
    store = new Map();
    get(key) {
        return this.store.get(key);
    }
    set(key, value) {
        this.store.set(key, value);
    }
    clear(key) {
        this.store.delete(key);
    }
}
//# sourceMappingURL=state-manager.js.map