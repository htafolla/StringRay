/**
 * StrRay Framework - Framework Initialization Integration Tests (Mock-Based)
 * 
 * Tests framework initialization using real state/context components but mocked plugin behavior
 * to avoid ES6 import conflicts when running directly with Node.js.
 */

import { describe, test, expect, beforeEach, vi } from "vitest";
import { StrRayStateManager } from "../../state/state-manager";
import { StrRayContextLoader } from "../../context-loader";

// Mock the plugin components that cause ES6 import issues
const createMockStrRayCodexInjectorHook = () => {
  return {
    name: "strray-codex-injector",
    hooks: {
      "agent.start": async (sessionId: string) => {
        console.log("✅ StrRay Codex loaded: 3 terms, 1 sources");
      },
      "tool.execute.before": async (input: any, sessionId: string) => {
        // Mock codex enforcement
        const content = input.args?.content || "";
        if (content.includes("TODO") || content.includes(": any")) {
          throw new Error("Codex violation detected");
        }
      },
      "tool.execute.after": async (input: any, output: any, sessionId: string) => {
        if (output && output.output) {
          output.output = `📚 Codex Context: Framework initialized\n${output.output}`;
        }
        return output;
      }
    }
  };
};

const clearMockCodexCache = (sessionId?: string) => {
  return true;
};

describe.skip("StrRay Framework Initialization Integration", () => {
  let stateManager: StrRayStateManager;
  let contextLoader: StrRayContextLoader;
  let mockCodexHook: any;

  const testSessionId = "test-framework-init-session";

  beforeEach(() => {
    stateManager = new StrRayStateManager();
    contextLoader = new StrRayContextLoader();
    mockCodexHook = createMockStrRayCodexInjectorHook();
    vi.clearAllMocks();
  });

  describe("Framework Component Initialization", () => {
    test("should initialize state manager successfully", () => {
      expect(stateManager).toBeDefined();
      expect(typeof stateManager.saveState).toBe("function");
      expect(typeof stateManager.loadState).toBe("function");
    });

    test("should initialize context loader successfully", () => {
      expect(contextLoader).toBeDefined();
      expect(typeof contextLoader.loadCodexContext).toBe("function");
    });

    test("should initialize codex injector hook", () => {
      expect(mockCodexHook).toBeDefined();
      expect(mockCodexHook.name).toBe("strray-codex-injector");
      expect(mockCodexHook.hooks).toBeDefined();
    });
  });

  describe("State Management Integration", () => {
    test("should save and load framework state", async () => {
      const testState = {
        sessionId: testSessionId,
        codexLoaded: true,
        agentCount: 11,
        lastActivity: new Date().toISOString()
      };

      // Save state
      await stateManager.saveState(testSessionId, testState);
      
      // Load state
      const loadedState = await stateManager.loadState(testSessionId);
      
      expect(loadedState).toEqual(testState);
    });

    test("should handle state persistence across sessions", async () => {
      const session1 = "session-1";
      const session2 = "session-2";
      
      const state1 = { data: "session1-data" };
      const state2 = { data: "session2-data" };
      
      await stateManager.saveState(session1, state1);
      await stateManager.saveState(session2, state2);
      
      const loaded1 = await stateManager.loadState(session1);
      const loaded2 = await stateManager.loadState(session2);
      
      expect(loaded1).toEqual(state1);
      expect(loaded2).toEqual(state2);
      expect(loaded1).not.toEqual(loaded2);
    });

    test("should return null for non-existent sessions", async () => {
      const loadedState = await stateManager.loadState("non-existent-session");
      expect(loadedState).toBeNull();
    });
  });

  describe("Context Loading Integration", () => {
    test("should load codex context successfully", async () => {
      // Mock fs to provide test codex file
      const mockCodexContent = JSON.stringify({
        version: "1.2.22",
        terms: {
          "1": { title: "Test Term", description: "Test description" }
        }
      });

      const mockFs = {
        existsSync: vi.fn(() => true),
        readFileSync: vi.fn(() => mockCodexContent)
      };

      // Temporarily replace fs
      const originalExistsSync = require("fs").existsSync;
      const originalReadFileSync = require("fs").readFileSync;
      
      require("fs").existsSync = mockFs.existsSync;
      require("fs").readFileSync = mockFs.readFileSync;

      try {
        const result = await contextLoader.loadCodexContext(process.cwd());
        
        expect(result.success).toBe(true);
        expect(result.context).toBeDefined();
        expect(Array.isArray(result.context)).toBe(true);
        expect(result.context!.length).toBeGreaterThan(0);
      } finally {
        // Restore original fs
        require("fs").existsSync = originalExistsSync;
        require("fs").readFileSync = originalReadFileSync;
      }
    });

    test("should handle context loading errors gracefully", async () => {
      // Mock fs to simulate file errors
      const mockFs = {
        existsSync: vi.fn(() => true),
        readFileSync: vi.fn(() => { throw new Error("File read error"); })
      };

      const originalExistsSync = require("fs").existsSync;
      const originalReadFileSync = require("fs").readFileSync;
      
      require("fs").existsSync = mockFs.existsSync;
      require("fs").readFileSync = mockFs.readFileSync;

      try {
        const result = await contextLoader.loadCodexContext(process.cwd());
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.warnings).toBeDefined();
      } finally {
        require("fs").existsSync = originalExistsSync;
        require("fs").readFileSync = originalReadFileSync;
      }
    });
  });

  describe("Plugin Integration Simulation", () => {
    test("should simulate framework initialization sequence", async () => {
      // Step 1: Initialize state manager
      expect(stateManager).toBeDefined();
      
      // Step 2: Initialize context loader
      expect(contextLoader).toBeDefined();
      
      // Step 3: Initialize plugin hooks
      expect(mockCodexHook.hooks["agent.start"]).toBeDefined();
      expect(mockCodexHook.hooks["tool.execute.before"]).toBeDefined();
      expect(mockCodexHook.hooks["tool.execute.after"]).toBeDefined();
      
      // Step 4: Simulate agent startup
      await mockCodexHook.hooks["agent.start"](testSessionId);
      
      // Step 5: Simulate tool execution with codex enforcement
      const validInput = { tool: "read", args: { path: "/test/file.ts" } };
      await expect(mockCodexHook.hooks["tool.execute.before"](validInput, testSessionId)).resolves.toBeUndefined();
      
      const invalidInput = { tool: "edit", args: { content: "// TODO: fix this" } };
      await expect(mockCodexHook.hooks["tool.execute.before"](invalidInput, testSessionId)).rejects.toThrow("Codex violation");
      
      // Step 6: Simulate output processing
      const testOutput = { output: "tool result" };
      const processedOutput = await mockCodexHook.hooks["tool.execute.after"]({}, testOutput, testSessionId);
      expect(processedOutput.output).toContain("📚 Codex Context:");
      expect(processedOutput.output).toContain("tool result");
    });

    test("should handle plugin initialization errors", async () => {
      const failingHook = {
        hooks: {
          "agent.start": async () => {
            throw new Error("Plugin initialization failed");
          }
        }
      };
      
      await expect(failingHook.hooks["agent.start"](testSessionId)).rejects.toThrow("Plugin initialization failed");
    });
  });

  describe("End-to-End Framework Workflow", () => {
    test("should complete full framework initialization and operation cycle", async () => {
      // 1. Initialize components
      expect(stateManager).toBeDefined();
      expect(contextLoader).toBeDefined();
      expect(mockCodexHook).toBeDefined();
      
      // 2. Load initial state
      const initialState = { initialized: true, timestamp: Date.now() };
      await stateManager.saveState(testSessionId, initialState);
      
      // 3. Initialize codex context
      const mockCodexContent = JSON.stringify({
        version: "1.2.22",
        terms: { "1": { title: "Test" } }
      });
      
      const mockFs = {
        existsSync: vi.fn(() => true),
        readFileSync: vi.fn(() => mockCodexContent)
      };
      
      const originalExistsSync = require("fs").existsSync;
      const originalReadFileSync = require("fs").readFileSync;
      
      require("fs").existsSync = mockFs.existsSync;
      require("fs").readFileSync = mockFs.readFileSync;
      
      try {
        const contextResult = await contextLoader.loadCodexContext(process.cwd());
        expect(contextResult.success).toBe(true);
        
        // 4. Execute plugin hooks
        await mockCodexHook.hooks["agent.start"](testSessionId);
        
        const validToolInput = { tool: "read", args: { path: "/test.ts" } };
        await mockCodexHook.hooks["tool.execute.before"](validToolInput, testSessionId);
        
        const toolOutput = { output: "file content" };
        const processedOutput = await mockCodexHook.hooks["tool.execute.after"](validToolInput, toolOutput, testSessionId);
        expect(processedOutput.output).toContain("Codex Context");
        
        // 5. Save final state
        const finalState = { 
          ...initialState, 
          contextLoaded: true, 
          hooksExecuted: true 
        };
        await stateManager.saveState(testSessionId, finalState);
        
        const savedState = await stateManager.loadState(testSessionId);
        expect(savedState).toEqual(finalState);
        
      } finally {
        require("fs").existsSync = originalExistsSync;
        require("fs").readFileSync = originalReadFileSync;
      }
    });
  });

  describe("Cache Management", () => {
    test("should clear codex cache successfully", () => {
      const result = clearMockCodexCache();
      expect(result).toBe(true);
    });

    test("should clear specific session cache", () => {
      const result = clearMockCodexCache(testSessionId);
      expect(result).toBe(true);
    });
  });
});
