/**
 * Agent Registry Integration Tests
 *
 * Tests that new agents are properly registered and accessible
 * through the agent index and built-in registry.
 *
 * @version 1.0.0
 * @since 2026-02-02
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { builtinAgents } from "../../agents/index.js";
import { analyzer } from "../../agents/analyzer.js";

// Mock model router
vi.mock("../../core/model-router.js", () => ({
  modelRouter: {
    getValidatedModel: vi.fn((agentName: string) => `${agentName}-model`),
  },
}));

describe("Agent Registry Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("New Agent Registration", () => {
    it("should register code-analyzer in builtin agents", () => {
      expect(builtinAgents["code-analyzer"]).toBeDefined();
      expect(builtinAgents["code-analyzer"].name).toBe("code-analyzer");
    });

    it("should maintain existing agents", () => {
      // Check existing agents are still registered
      expect(builtinAgents["enforcer"]).toBeDefined();
      expect(builtinAgents["architect"]).toBeDefined();
      expect(builtinAgents["researcher"]).toBeDefined();
      expect(builtinAgents["orchestrator"]).toBeDefined();
    });
  });

  describe("Agent Configuration Consistency", () => {
    it("should have consistent structure for analyzer", () => {
      const agent = builtinAgents["code-analyzer"];

      expect(agent).toHaveProperty("name");
      expect(agent).toHaveProperty("capabilities");
      expect(agent).toHaveProperty("maxComplexity");
      expect(agent).toHaveProperty("enabled");
      expect(agent).toHaveProperty("description");
      expect(agent).toHaveProperty("mode");
      expect(agent).toHaveProperty("system");
      expect(agent).toHaveProperty("temperature");
      expect(agent).toHaveProperty("tools");
      expect(agent).toHaveProperty("permission");
    });
  });

  describe("Agent Capabilities", () => {
    it("should load analyzer capabilities", () => {
      const agent = builtinAgents["code-analyzer"];
      const expectedCapabilities = [
        "code-analysis",
        "system-analysis",
        "dependency-analysis",
        "performance-analysis",
        "security-analysis",
        "architecture-analysis",
        "technical-debt-assessment",
        "integration-analysis",
        "comprehensive-reporting",
      ];
      expect(agent.capabilities).toEqual(expectedCapabilities);
    });
  });

  describe("Agent Models", () => {
    it("should provide model getter for analyzer", () => {
      const agent = builtinAgents["code-analyzer"];
      // Model is optional - only check if defined
      if (agent.model) {
        expect(typeof agent.model).toBe("string");
        expect(agent.model).toContain("analyzer");
      }
    });
  });

  describe("Tool Permissions", () => {
    it("should restrict analyzer tools appropriately", () => {
      const agent = builtinAgents["code-analyzer"];

      expect(agent.tools?.include).toContain("read");
      expect(agent.tools?.include).toContain("security-audit_*");
      expect(agent.tools?.include).toContain("performance-analysis_*");
      expect(agent.tools?.exclude).toContain("background_task");
      expect(agent.permission?.edit).toBe("deny");
      expect(agent.permission?.bash).toBe("ask");
    });
  });

  describe("Agent Modes", () => {
    it("should have correct mode for analyzer", () => {
      const agent = builtinAgents["code-analyzer"];
      expect(agent.mode).toBe("subagent");
    });
  });

  describe("Complexity Settings", () => {
    it("should have appropriate complexity for analyzer", () => {
      const agent = builtinAgents["code-analyzer"];
      expect(agent.maxComplexity).toBe(100);
      expect(agent.enabled).toBe(true);
    });
  });

  describe("Temperature Settings", () => {
    it("should have appropriate temperature for analyzer", () => {
      const agent = builtinAgents["code-analyzer"];
      expect(agent.temperature).toBe(0.2);
    });
  });

  describe("System Prompts", () => {
    it("should have comprehensive system prompt for code-analyzer", () => {
      const agent = builtinAgents["code-analyzer"];

      expect(agent.system).toContain("Analyzer subagent");
      expect(agent.system).toContain("StringRay");
      expect(agent.system).toContain("Universal analysis specialist");
    });
  });

  describe("Integration Safety", () => {
    it("should not break existing agent functionality", () => {
      // Ensure existing agents still work
      const existingAgents = ["enforcer", "architect", "researcher"];

      existingAgents.forEach((agentName) => {
        expect(builtinAgents[agentName]).toBeDefined();
        expect(typeof builtinAgents[agentName]).toBe("object");
      });
    });

    it("should maintain registry integrity", () => {
      const agentCount = Object.keys(builtinAgents).length;

      // Should have original agents plus 2 new ones
      expect(agentCount).toBeGreaterThan(10);

      // All agents should have required properties
      Object.values(builtinAgents).forEach((agent) => {
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("capabilities");
      });
    });
  });

  describe("Direct Import Access", () => {
    it("should allow direct import of analyzer", () => {
      expect(analyzer).toBeDefined();
      expect(analyzer.name).toBe("code-analyzer");
    });
  });

  describe("Configuration Values", () => {
    it("should have correct description for analyzer", () => {
      const agent = builtinAgents["code-analyzer"];

      expect(agent.description).toContain("Universal analysis specialist");
      expect(agent.description).toContain("technical artifacts");
    });
  });
});
