import { describe, it, expect } from "vitest";
import { architect } from "../../agents/architect.js";
import type { AgentConfig } from "../../agents/types.js";

describe("Architect Agent Configuration", () => {
  it("should be a valid AgentConfig object", () => {
    const config: AgentConfig = architect;
    expect(config).toBeDefined();
  });

  describe("Basic Configuration", () => {
    it("should have correct name and model", () => {
      expect(architect.name).toBe("architect");
      expect(architect.model).toBe("opencode/grok-code");
    });

    it("should be configured as subagent mode", () => {
      expect(architect.mode).toBe("subagent");
    });

    it("should have low temperature for consistent design decisions", () => {
      expect(architect.temperature).toBe(0.1);
    });
  });

  describe("Core Responsibilities", () => {
    it("should define 4 core responsibilities", () => {
      const system = architect.system;
      expect(system).toContain("State Management");
      expect(system).toContain("Delegation System");
      expect(system).toContain("System Design");
      expect(system).toContain("Dependency Mapping");
    });

    it("should specify state management focus", () => {
      const system = architect.system;
      expect(system).toContain("Maintain global state");
      expect(system).toContain("prevent state duplication");
    });

    it("should include delegation intelligence", () => {
      const system = architect.system;
      expect(system).toContain("Analyze task complexity");
      expect(system).toContain("route to appropriate specialized agents");
    });
  });

  describe("Key Facilities", () => {
    it("should specify architectural facilities", () => {
      const system = architect.system;
      expect(system).toContain("Global State Coordinator");
      expect(system).toContain("Complexity Analysis Engine");
      expect(system).toContain("Delegation System");
      expect(system).toContain("state synchronization");
    });

    it("should define processor pipeline", () => {
      const system = architect.system;
      expect(system).toContain("Processor Pipeline");
      expect(system).toContain("stateValidation");
      expect(system).toContain("dependencyMapping");
      expect(system).toContain("architectureReview");
      expect(system).toContain("delegationOptimization");
    });
  });

  describe("Architectural Principles", () => {
    it("should follow shared global state principle", () => {
      const system = architect.system;
      expect(system).toContain("shared global state where possible");
      expect(system).toContain("single source of truth");
    });

    it("should implement SOLID principles", () => {
      const system = architect.system;
      expect(system).toContain("SOLID principles");
      expect(system).toContain("clean architecture");
    });

    it("should reference Universal Development Codex", () => {
      const system = architect.system;
      expect(system).toContain("Universal Development Codex v1.2.22");
    });
  });

  describe("Tools Configuration", () => {
    it("should have architecture-specific tools", () => {
      expect(architect.tools?.include).toContain("read");
      expect(architect.tools?.include).toContain("grep");
      expect(architect.tools?.include).toContain("lsp_*");
      expect(architect.tools?.include).toContain("run_terminal_cmd");
      expect(architect.tools?.include).toContain("background_task");
      expect(architect.tools?.include).toContain("lsp_goto_definition");
      expect(architect.tools?.include).toContain("lsp_find_references");
    });
  });

  describe("Integration Points", () => {
    it("should define architectural integration points", () => {
      const system = architect.system;
      expect(system).toContain("Integration Points");
      expect(system).toContain("State Manager");
      expect(system).toContain("Delegation System");
      expect(system).toContain("Boot Orchestrator");
      expect(system).toContain("Monitoring System");
    });
  });
});
