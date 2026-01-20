export interface StateManager {
  get: <T>(key: string) => T | undefined;
  set: <T>(key: string, value: T) => void;
  clear: (key: string) => void;
}

import { frameworkLogger } from "../framework-logger.js";

export class StringRayStateManager implements StateManager {
  private store = new Map<string, unknown>();
  private persistencePath: string;
  private persistenceEnabled: boolean;
  private writeQueue = new Map<string, NodeJS.Timeout>();
  private initialized = false;
  private earlyOperationsQueue: string[] = []; // Queue keys that need persistence after init

  constructor(persistencePath = ".opencode/state", persistenceEnabled = true) {
    this.persistencePath = persistencePath;
    this.persistenceEnabled = persistenceEnabled;
    this.initializePersistence();
  }

  private async initializePersistence(): Promise<void> {
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
        frameworkLogger.log(
          "state-manager",
          "processed queued early operations",
          "info",
          {
            operationsProcessed: this.earlyOperationsQueue.length,
          },
        );
      }
    } catch (error) {
      frameworkLogger.log(
        "state-manager",
        "persistence initialization failed",
        "error",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );
      // Continue without persistence rather than failing
      this.persistenceEnabled = false;
      this.initialized = true;
    }
  }

  private async persistToDisk(): Promise<void> {
    if (!this.persistenceEnabled || !this.initialized) return;

    try {
      const fs = await import("fs");

      // Convert Map to object for JSON serialization
      const data: Record<string, unknown> = {};
      for (const [key, value] of this.store.entries()) {
        // Only persist serializable data
        if (this.isSerializable(value)) {
          data[key] = value;
        }
      }

      fs.writeFileSync(this.persistencePath, JSON.stringify(data, null, 2));
    } catch (error) {
      frameworkLogger.log("state-manager", "disk persistence failed", "error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private isSerializable(value: unknown): boolean {
    try {
      JSON.stringify(value);
      return true;
    } catch {
      return false;
    }
  }

  private schedulePersistence(key: string): void {
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

  get<T>(key: string): T | undefined {
    const value = this.store.get(key) as T | undefined;
    frameworkLogger.log("state-manager", "get operation", "info", {
      key,
      hasValue: value !== undefined,
    });
    return value;
  }

  set<T>(key: string, value: T): void {
    // Store in memory immediately, even if persistence isn't ready yet
    this.store.set(key, value);

    // If initialized, schedule persistence
    if (this.initialized && this.persistenceEnabled) {
      this.schedulePersistence(key);
    } else if (!this.initialized) {
      // Queue for persistence once initialized
      if (!this.earlyOperationsQueue.includes(key)) {
        this.earlyOperationsQueue.push(key);
      }
      frameworkLogger.log(
        "state-manager",
        "set called before initialization, queued for persistence",
        "debug",
        { key },
      );
    }

    frameworkLogger.log("state-manager", "set operation", "success", { key });
  }

  clear(key: string): void {
    // Ensure persistence is initialized
    if (!this.initialized) {
      frameworkLogger.log(
        "state-manager",
        "clear called before initialization",
        "error",
        { key },
      );
      return;
    }

    const existed = this.store.has(key);
    this.store.delete(key);

    // Immediately persist the deletion
    if (this.persistenceEnabled && existed) {
      this.persistToDisk();
    }

    frameworkLogger.log(
      "state-manager",
      "clear operation",
      existed ? "success" : "info",
      { key, existed },
    );
  }

  // New method to check if persistence is enabled
  isPersistenceEnabled(): boolean {
    return this.persistenceEnabled;
  }

  // New method to get persistence stats
  getPersistenceStats(): {
    enabled: boolean;
    initialized: boolean;
    keysInMemory: number;
    pendingWrites: number;
  } {
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
