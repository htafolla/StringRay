import { describe, it, expect } from "vitest";
import {
  builtinAgents,
  enforcer,
  architect,
  orchestrator,
  bugTriageSpecialist,
  codeReviewer,
  securityAuditor,
  refactorer,
  testArchitect,
} from "../../agents/index.js";
import type { AgentConfig } from "../../agents/types.js";

describe("Agent Index Registry", () => {
  describe("Builtin Agents Registry", () => {
    it("should export a valid builtinAgents registry", () => {
      expect(builtinAgents).toBeDefined();
      expect(typeof builtinAgents).toBe("object");
      expect(builtinAgents).not.toBeNull();
    });

    it("should contain expected specialized agents", () => {
      const expectedAgents = [
        "enforcer",
        "architect",
        "orchestrator",
        "bug-triage-specialist",
        "code-reviewer",
        "security-auditor",
        "refactorer",
        "test-architect",
      ];

      expectedAgents.forEach((agentName) => {
        expect(builtinAgents).toHaveProperty(agentName);
      });

      expect(Object.keys(builtinAgents).length).toBeGreaterThanOrEqual(8);
    });

    it("should have all agents as valid AgentConfig objects", () => {
      Object.values(builtinAgents).forEach((agent) => {
        expect(agent).toBeDefined();
        expect(typeof agent).toBe("object");
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("model");
        expect(agent).toHaveProperty("description");
      });
    });

    it("should have agents with correct names matching their keys", () => {
      Object.entries(builtinAgents).forEach(([key, agent]) => {
        expect(agent.name.toLowerCase()).toBe(key.toLowerCase());
      });
    });

    it("should have agents configured appropriately", () => {
      Object.values(builtinAgents).forEach((agent) => {
        expect(["subagent", "primary"]).toContain(agent.mode);
      });
    });

    it("should have agents with consistent model configuration", () => {
      Object.values(builtinAgents).forEach((agent) => {
        expect(agent.model).toBeDefined();
        expect(typeof agent.model).toBe("string");
      });
    });

    it("should have agents with appropriate temperature settings", () => {
      Object.values(builtinAgents).forEach((agent) => {
        expect(agent.temperature).toBeGreaterThanOrEqual(0.1);
      });
    });
  });

  describe("Individual Agent Exports", () => {
    it("should export all individual agents", () => {
      expect(enforcer).toBeDefined();
      expect(architect).toBeDefined();
      expect(orchestrator).toBeDefined();
      expect(bugTriageSpecialist).toBeDefined();
      expect(codeReviewer).toBeDefined();
      expect(securityAuditor).toBeDefined();
      expect(refactorer).toBeDefined();
      expect(testArchitect).toBeDefined();
    });

    it("should have individual exports match registry entries", () => {
      expect(enforcer).toBe(builtinAgents.enforcer);
      expect(architect).toBe(builtinAgents.architect);
      expect(orchestrator).toBe(builtinAgents.orchestrator);
    });

    it("should have all individual exports as valid AgentConfig objects", () => {
      const agents = [
        enforcer,
        architect,
        orchestrator,
        bugTriageSpecialist,
        codeReviewer,
        securityAuditor,
        refactorer,
        testArchitect,
      ];

      agents.forEach((agent) => {
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("model");
        expect(agent).toHaveProperty("description");
      });
    });
  });

  describe("Registry Integrity", () => {
    it("should have no duplicate agent names", () => {
      const names = Object.values(builtinAgents).map((agent) => agent.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("should have no duplicate keys", () => {
      const keys = Object.keys(builtinAgents);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it("should have consistent naming between keys and agent names", () => {
      Object.entries(builtinAgents).forEach(([key, agent]) => {
        expect(agent.name.toLowerCase()).toBe(key.toLowerCase());
      });
    });
  });
});
