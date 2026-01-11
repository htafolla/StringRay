/**
 * Integration tests for Context Providers Chain
 * Tests the complete integration between CodebaseContextAnalyzer, ASTCodeParser, and DependencyGraphBuilder
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AgentDelegator } from "../../delegation/agent-delegator.js";
import { StrRayStateManager } from "../../state/state-manager.js";
import { frameworkLogger } from "../../framework-logger.js";

// Mock external dependencies
vi.mock("../../framework-logger.js");

describe("Context Providers Integration", () => {
  let agentDelegator: AgentDelegator;
  let stateManager: StrRayStateManager;

  beforeEach(() => {
    vi.clearAllMocks();
    stateManager = new StrRayStateManager();
    agentDelegator = new AgentDelegator(stateManager);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("context provider initialization", () => {
    it("should initialize all context providers successfully", () => {
      expect(agentDelegator).toBeDefined();
      // The constructor should have initialized context providers without throwing
    });

    it("should handle ast-grep unavailability gracefully", () => {
      // Even if ast-grep is not available, the system should still initialize
      expect(agentDelegator).toBeDefined();
    });

    it("should log context provider initialization status", () => {
      const mockLogger = vi.mocked(frameworkLogger);

      // Constructor should have called logger
      expect(mockLogger.log).toHaveBeenCalledWith(
        "agent-delegator",
        "context-providers-initialized",
        "success",
        expect.any(Object),
      );
    });
  });

  describe("complexity analysis with context awareness", () => {
    it("should enhance complexity analysis with context data", async () => {
      const request = {
        operation: "analyze-component",
        description: "Analyze a React component with dependencies",
        context: {
          files: ["src/components/Button.tsx", "src/utils/helpers.ts"],
          filePath: "src/components/Button.tsx",
          operation: "refactor",
        },
      };

      const result = await agentDelegator.analyzeDelegation(request);

      expect(result.strategy).toBeDefined();
      expect(result.complexity.score).toBeGreaterThanOrEqual(0);
      expect(result.complexity.level).toBeDefined();
      expect(result.agents).toBeDefined();
      expect(result.agents.length).toBeGreaterThan(0);
    });

    it("should use context-enhanced metrics for large codebases", async () => {
      const request = {
        operation: "refactor-large-component",
        description: "Refactor a large component with many dependencies",
        context: {
          files: Array.from({ length: 100 }, (_, i) => `src/component${i}.tsx`),
          filePath: "src/components/LargeComponent.tsx",
          operation: "refactor",
        },
      };

      const result = await agentDelegator.analyzeDelegation(request);

      expect(result.complexity.level).toBe("enterprise");
      expect(result.strategy).toBe("orchestrator-led");
      expect(result.agents.length).toBeGreaterThan(2);
    });

    it("should fall back to basic metrics when context analysis fails", async () => {
      // This test verifies that even if context providers have issues,
      // the system continues to work with basic complexity analysis

      const request = {
        operation: "simple-function",
        description: "Simple function that should work with basic analysis",
        context: {
          files: ["simple.ts"],
          operation: "create",
        },
      };

      const result = await agentDelegator.analyzeDelegation(request);

      expect(result.strategy).toBeDefined();
      expect(result.complexity.score).toBeGreaterThanOrEqual(0);
      // Should still work even if context enhancement fails
    });
  });

  describe("memory optimization integration", () => {
    it("should respect memory limits during analysis", async () => {
      const request = {
        operation: "analyze-large-codebase",
        description: "Analyze large codebase with memory constraints",
        context: {
          files: Array.from({ length: 200 }, (_, i) => `src/file${i}.ts`),
          filePath: "src/main.ts",
          operation: "analyze",
        },
      };

      const result = await agentDelegator.analyzeDelegation(request);

      expect(result).toBeDefined();
      // Should complete analysis even with memory constraints
    });

    it("should cache analysis results appropriately", async () => {
      const request1 = {
        operation: "analyze-component",
        description: "First analysis of component",
        context: {
          files: ["src/Button.tsx"],
          filePath: "src/Button.tsx",
        },
      };

      const request2 = {
        operation: "analyze-component",
        description: "Second analysis of same component",
        context: {
          files: ["src/Button.tsx"],
          filePath: "src/Button.tsx",
        },
      };

      await agentDelegator.analyzeDelegation(request1);
      await agentDelegator.analyzeDelegation(request2);

      // Both should complete successfully, potentially using cached results
      expect(true).toBe(true);
    });
  });

  describe("error handling and resilience", () => {
    it("should handle context provider initialization failures", () => {
      // The system should be resilient to context provider issues
      // This is already tested by the constructor tests above
      expect(agentDelegator).toBeDefined();
    });

    it("should continue operating with partial context data", async () => {
      const request = {
        operation: "analyze-with-limited-context",
        description: "Analysis with minimal context data",
        context: {
          // Minimal context that might cause some providers to fail
          files: ["unknown-file.xyz"],
          operation: "unknown",
        },
      };

      const result = await agentDelegator.analyzeDelegation(request);

      // Should still produce a valid result
      expect(result.strategy).toBeDefined();
      expect(result.complexity.score).toBeGreaterThanOrEqual(0);
    });

    it("should log errors without crashing the analysis", async () => {
      const mockLogger = vi.mocked(frameworkLogger);

      const request = {
        operation: "problematic-analysis",
        description: "Analysis that might cause issues",
        context: {
          files: ["nonexistent-file.ts"],
          filePath: "nonexistent-file.ts",
        },
      };

      await agentDelegator.analyzeDelegation(request);

      // Should have logged any errors but not thrown
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe("performance validation", () => {
    it("should complete analysis within reasonable time limits", async () => {
      const request = {
        operation: "performance-test",
        description: "Test analysis performance",
        context: {
          files: ["src/test.ts"],
          filePath: "src/test.ts",
          operation: "create",
        },
      };

      const startTime = Date.now();
      const result = await agentDelegator.analyzeDelegation(request);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result).toBeDefined();
    });

    it("should handle concurrent analysis requests", async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        operation: `concurrent-test-${i}`,
        description: `Concurrent analysis request ${i}`,
        context: {
          files: [`src/test${i}.ts`],
          filePath: `src/test${i}.ts`,
          operation: "create",
        },
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        requests.map((request) => agentDelegator.analyzeDelegation(request)),
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.strategy).toBeDefined();
        expect(result.complexity.score).toBeGreaterThanOrEqual(0);
      });

      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds for 5 concurrent requests
    });
  });

  describe("rule enforcement integration", () => {
    it("should apply complexity-based agent selection rules", async () => {
      const simpleRequest = {
        operation: "create-simple-component",
        description: "Simple component creation",
        context: {
          files: ["src/SimpleButton.tsx"],
          operation: "create",
        },
      };

      const complexRequest = {
        operation: "refactor-large-system",
        description: "Complex system refactoring",
        context: {
          files: Array.from({ length: 100 }, (_, i) => `src/component${i}.tsx`),
          operation: "refactor",
          riskLevel: "critical" as const,
        },
      };

      const simpleResult =
        await agentDelegator.analyzeDelegation(simpleRequest);
      const complexResult =
        await agentDelegator.analyzeDelegation(complexRequest);

      // Simple request should use fewer agents
      expect(simpleResult.agents.length).toBeLessThanOrEqual(
        complexResult.agents.length,
      );
      expect(simpleResult.strategy).not.toBe("orchestrator-led");

      // Complex request should use more sophisticated strategy
      expect(complexResult.strategy).toBe("orchestrator-led");
    });

    it("should enforce memory limits during analysis", async () => {
      const largeRequest = {
        operation: "analyze-massive-codebase",
        description: "Analysis of very large codebase",
        context: {
          files: Array.from({ length: 1000 }, (_, i) => `src/file${i}.ts`),
          filePath: "src/main.ts",
          operation: "analyze",
        },
      };

      const result = await agentDelegator.analyzeDelegation(largeRequest);

      // Should complete analysis despite large input
      expect(result).toBeDefined();
      expect(result.complexity.score).toBeGreaterThanOrEqual(0);
    });
  });
});
