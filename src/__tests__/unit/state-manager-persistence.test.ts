import { describe, it, expect, beforeEach, vi } from "vitest";
import { StrRayStateManager } from "../../state/state-manager.js";

// Mock fs and path modules for testing
const mockFs = {
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
};

const mockPath = {
  dirname: vi.fn(),
};

vi.mock("fs", () => mockFs);
vi.mock("path", () => mockPath);

vi.mock("../framework-logger.js", () => ({
  frameworkLogger: {
    log: vi.fn(),
  },
}));

describe("StrRayStateManager - Persistence Features", () => {
  let stateManager: StrRayStateManager;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    mockFs.existsSync.mockReturnValue(false);
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.readFileSync.mockReturnValue("{}");
    mockFs.writeFileSync.mockImplementation(() => {});
    mockPath.dirname.mockReturnValue("/test/dir");

    // Create fresh state manager for each test
    stateManager = new StrRayStateManager("/test/state.json", true);

    // Wait for async initialization to complete
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  describe("Persistence Initialization", () => {
    it("should handle persistence disabled", async () => {
      const noPersistManager = new StrRayStateManager(
        "/test/state.json",
        false,
      );

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(noPersistManager.isPersistenceEnabled()).toBe(false);
    });

    it("should initialize with persistence enabled by default", async () => {
      expect(stateManager.isPersistenceEnabled()).toBe(true);
    });

    it("should create persistence directory if it doesn't exist", async () => {
      vi.mocked(mockFs.existsSync).mockReturnValue(false);

      const newManager = new StrRayStateManager("/test/state.json", true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockFs.mkdirSync).toHaveBeenCalledWith("/test/dir", {
        recursive: true,
      });
    });

    it("should load existing state from disk", async () => {
      const existingState = { "test-key": "test-value", "number-key": 42 };
      vi.mocked(mockFs.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFileSync).mockReturnValue(
        JSON.stringify(existingState),
      );

      const newManager = new StrRayStateManager("/test/state.json", true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(newManager.get("test-key")).toBe("test-value");
      expect(newManager.get("number-key")).toBe(42);
    });

    it("should handle corrupted state file gracefully", async () => {
      vi.mocked(mockFs.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFileSync).mockReturnValue("{ invalid json");

      const newManager = new StrRayStateManager("/test/state.json", true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should disable persistence on corruption
      expect(newManager.isPersistenceEnabled()).toBe(false);
    });
  });

  describe("Basic Operations", () => {
    it("should set and get values", () => {
      stateManager.set("test-key", "test-value");
      expect(stateManager.get("test-key")).toBe("test-value");
    });

    it("should handle multiple set operations", () => {
      stateManager.set("key1", "value1");
      stateManager.set("key2", "value2");
      stateManager.set("key3", "value3");

      expect(stateManager.get("key1")).toBe("value1");
      expect(stateManager.get("key2")).toBe("value2");
      expect(stateManager.get("key3")).toBe("value3");
    });

    it("should handle all data types", () => {
      stateManager.set("string", "hello");
      stateManager.set("number", 42);
      stateManager.set("boolean", true);
      stateManager.set("object", { nested: "value" });
      stateManager.set("array", [1, 2, 3]);
      stateManager.set("null", null);
      stateManager.set("undefined", undefined);

      expect(stateManager.get("string")).toBe("hello");
      expect(stateManager.get("number")).toBe(42);
      expect(stateManager.get("boolean")).toBe(true);
      expect(stateManager.get("object")).toEqual({ nested: "value" });
      expect(stateManager.get("array")).toEqual([1, 2, 3]);
      expect(stateManager.get("null")).toBe(null);
      expect(stateManager.get("undefined")).toBe(undefined);
    });

    it("should return undefined for non-existent keys", () => {
      expect(stateManager.get("non-existent")).toBeUndefined();
    });

    it("should handle clear operations", () => {
      stateManager.set("test-key", "test-value");
      expect(stateManager.get("test-key")).toBe("test-value");

      stateManager.clear("test-key");
      expect(stateManager.get("test-key")).toBeUndefined();
    });

    it("should handle clearing non-existent keys", () => {
      expect(() => stateManager.clear("non-existent")).not.toThrow();
    });
  });

  describe("Persistence Operations", () => {
    it("should schedule persistence on set operations", async () => {
      stateManager.set("test-key", "test-value");

      // Wait for debounced persistence
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        "/test/state.json",
        expect.stringContaining("test-key"),
      );
    });

    it("should persist immediately on clear operations", async () => {
      stateManager.set("test-key", "test-value");
      stateManager.clear("test-key");

      // Clear triggers immediate persistence (no debouncing)
      // Wait a bit for async persistence to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it("should debounce multiple set operations", async () => {
      stateManager.set("key1", "value1");
      stateManager.set("key2", "value2");
      stateManager.set("key3", "value3");

      // Wait for debouncing to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Each key gets its own debounced write (no global debouncing)
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3);
    });

    it("should only persist serializable data", async () => {
      const circular: any = { self: null };
      circular.self = circular;

      stateManager.set("circular", circular);
      stateManager.set("normal", "value");

      await new Promise((resolve) => setTimeout(resolve, 150));

      const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
      expect(writtenData["normal"]).toBe("value");
      expect(writtenData["circular"]).toBeUndefined();
    });
  });

  describe("Persistence Statistics", () => {
    it("should provide accurate persistence statistics", () => {
      stateManager.set("key1", "value1");
      stateManager.set("key2", "value2");

      const stats = stateManager.getPersistenceStats();

      expect(stats.enabled).toBe(true);
      expect(stats.initialized).toBe(true);
      expect(stats.keysInMemory).toBe(2);
      expect(stats.pendingWrites).toBe(2); // Each key has its own pending write
    });

    it("should track pending writes", async () => {
      stateManager.set("key1", "value1");
      stateManager.set("key2", "value2");

      // Check stats before persistence completes
      const stats = stateManager.getPersistenceStats();
      expect(stats.pendingWrites).toBe(2); // Each key has its own pending write

      // Wait for persistence to complete
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should have no pending writes after completion
      const finalStats = stateManager.getPersistenceStats();
      expect(finalStats.pendingWrites).toBe(0);
    });

    it("should report correct stats when persistence disabled", async () => {
      const noPersistManager = new StrRayStateManager(
        "/test/state.json",
        false,
      );
      await new Promise((resolve) => setTimeout(resolve, 10));

      noPersistManager.set("test", "value");

      const stats = noPersistManager.getPersistenceStats();
      expect(stats.enabled).toBe(false);
      expect(stats.initialized).toBe(true);
      expect(stats.keysInMemory).toBe(1);
      expect(stats.pendingWrites).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle persistence write failures gracefully", async () => {
      vi.mocked(mockFs.writeFileSync).mockImplementation(() => {
        throw new Error("Disk write failed");
      });

      // Should not throw error to caller
      expect(() => stateManager.set("test", "value")).not.toThrow();

      // Wait for persistence attempt
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Value should still be in memory
      expect(stateManager.get("test")).toBe("value");
    });

    it("should disable persistence on initialization failure", async () => {
      vi.mocked(mockFs.mkdirSync).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const failingManager = new StrRayStateManager("/test/state.json", true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(failingManager.isPersistenceEnabled()).toBe(false);
    });
  });

  describe("Early Access Handling", () => {
    it("should handle get operations before initialization", () => {
      // Create manager without waiting for initialization
      const earlyManager = new StrRayStateManager("/test/state.json", true);

      // Should return undefined for early access
      expect(earlyManager.get("early-key")).toBeUndefined();
    });

    it("should queue set operations before initialization", async () => {
      const earlyManager = new StrRayStateManager("/test/state.json", true);

      // Set before initialization completes
      earlyManager.set("early-key", "early-value");

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should eventually persist
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(earlyManager.get("early-key")).toBe("early-value");
    });
  });
});
