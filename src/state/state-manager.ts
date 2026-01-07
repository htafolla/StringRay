export interface StateManager {
  get: <T>(key: string) => T | undefined;
  set: <T>(key: string, value: T) => void;
  clear: (key: string) => void;
}

export class StrRayStateManager implements StateManager {
  private store = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  clear(key: string): void {
    this.store.delete(key);
  }
}