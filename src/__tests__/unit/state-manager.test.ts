import { describe, it, expect, beforeEach } from "vitest";
import { StringRayStateManager, StateManager } from "../../state/state-manager";
import { setupStandardMocks, waitForDebounce } from "../utils/test-utils";

describe("StringRayStateManager", () => {
  let stateManager: StateManager;

  beforeEach(async () => {
    setupStandardMocks();
    stateManager = new StringRayStateManager(
      `/test/state-manager-${Date.now()}.json`,
    );
    await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for initialization
  });

  describe("get method", () => {
    it("should return undefined for non-existent keys", () => {
      const result = stateManager.get("nonexistent");
      expect(result).toBeUndefined();
    });

    it("should return the correct value for existing keys", () => {
      const testValue = { id: 1, name: "test" };
      stateManager.set("testKey", testValue);

      const result = stateManager.get<typeof testValue>("testKey");
      expect(result).toEqual(testValue);
    });

    it("should return primitive values correctly", () => {
      stateManager.set("stringKey", "hello world");
      stateManager.set("numberKey", 42);
      stateManager.set("booleanKey", true);
      stateManager.set("nullKey", null);
      stateManager.set("undefinedKey", undefined);

      expect(stateManager.get("stringKey")).toBe("hello world");
      expect(stateManager.get("numberKey")).toBe(42);
      expect(stateManager.get("booleanKey")).toBe(true);
      expect(stateManager.get("nullKey")).toBe(undefined); // Corruption detection converts null to undefined
      expect(stateManager.get("undefinedKey")).toBe(undefined);
    });

    it("should handle complex objects", () => {
      const complexObject = {
        nested: {
          array: [1, 2, 3],
          date: new Date("2026-01-06"),
        },
        functions: () => "test",
      };

      stateManager.set("complex", complexObject);
      const result = stateManager.get("complex") as any;
      expect(result).toEqual(complexObject);
      expect(typeof result.functions).toBe("function");
    });
  });

  describe("set method", () => {
    it("should store values correctly", () => {
      const value = "test value";
      stateManager.set("key", value);

      expect(stateManager.get("key")).toBe(value);
    });

    it("should overwrite existing values", () => {
      stateManager.set("key", "first value");
      expect(stateManager.get("key")).toBe("first value");

      stateManager.set("key", "second value");
      expect(stateManager.get("key")).toBe("second value");
    });

    it("should handle falsy values", () => {
      stateManager.set("falsy", false);
      stateManager.set("zero", 0);
      stateManager.set("empty", "");

      expect(stateManager.get("falsy")).toBe(false);
      expect(stateManager.get("zero")).toBe(0);
      expect(stateManager.get("empty")).toBe("");
    });

    it("should handle different key types", () => {
      stateManager.set("string", "value");
      stateManager.set("123", "number key");
      stateManager.set("true", "boolean key");

      expect(stateManager.get("string")).toBe("value");
      expect(stateManager.get("123")).toBe("number key");
      expect(stateManager.get("true")).toBe("boolean key");
    });
  });

  describe("clear method", () => {
    it("should remove existing keys", () => {
      stateManager.set("key", "value");
      expect(stateManager.get("key")).toBe("value");

      stateManager.clear("key");
      expect(stateManager.get("key")).toBeUndefined();
    });

    it("should not throw when clearing non-existent keys", () => {
      expect(() => stateManager.clear("nonexistent")).not.toThrow();
    });

    it("should only clear the specified key", () => {
      stateManager.set("key1", "value1");
      stateManager.set("key2", "value2");
      stateManager.set("key3", "value3");

      stateManager.clear("key2");

      expect(stateManager.get("key1")).toBe("value1");
      expect(stateManager.get("key2")).toBeUndefined();
      expect(stateManager.get("key3")).toBe("value3");
    });
  });

  describe("isolation between instances", () => {
    it("should maintain separate state between instances", () => {
      const manager1 = new StringRayStateManager();
      const manager2 = new StringRayStateManager();

      manager1.set("shared", "manager1");
      manager2.set("shared", "manager2");

      expect(manager1.get("shared")).toBe("manager1");
      expect(manager2.get("shared")).toBe("manager2");
    });
  });

  describe("memory management", () => {
    it("should handle large objects without issues", () => {
      const largeArray = new Array(10000).fill("test");
      stateManager.set("large", largeArray);

      const result = stateManager.get("large") as any[];
      expect(result).toHaveLength(10000);
      expect(result[0]).toBe("test");
    });

    it("should handle circular references", () => {
      const obj1: any = { name: "obj1" };
      const obj2: any = { name: "obj2", ref: obj1 };
      obj1.ref = obj2;

      stateManager.set("circular", obj1);
      const result = stateManager.get("circular") as any;

      expect(result.name).toBe("obj1");
      expect(result.ref.name).toBe("obj2");
      expect(result.ref.ref).toBe(result); // Circular reference preserved
    });
  });

  describe("type safety", () => {
    it("should maintain type information", () => {
      interface TestType {
        id: number;
        name: string;
        active: boolean;
      }

      const testObj: TestType = { id: 1, name: "test", active: true };
      stateManager.set("typed", testObj);

      const result = stateManager.get<TestType>("typed");
      expect(result).toEqual(testObj);

      // TypeScript should infer the correct type
      if (result) {
        expect(typeof result.id).toBe("number");
        expect(typeof result.name).toBe("string");
        expect(typeof result.active).toBe("boolean");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings as keys", () => {
      stateManager.set("", "empty key value");
      expect(stateManager.get("")).toBe("empty key value");
    });

    it("should handle special characters in keys", () => {
      const specialKey = "!@#$%^&*()_+{}|:<>?[]\\;'\",./";
      stateManager.set(specialKey, "special value");
      expect(stateManager.get(specialKey)).toBe("special value");
    });

    it("should handle unicode characters", () => {
      stateManager.set("🚀", "rocket");
      stateManager.set("测试", "chinese");
      stateManager.set("🌟", "star");

      expect(stateManager.get("🚀")).toBe("rocket");
      expect(stateManager.get("测试")).toBe("chinese");
      expect(stateManager.get("🌟")).toBe("star");
    });
  });
});
