import { describe, it, expect } from "vitest";
import { orchestrator } from "../../agents/orchestrator.js";
import type { AgentConfig } from "../../agents/types.js";

describe("Orchestrator Agent Configuration", () => {
  it("should be a valid AgentConfig object", () => {
    // Type check - this will fail at compile time if not valid
    const config: AgentConfig = orchestrator;
    expect(config).toBeDefined();
  });

  describe("Basic Configuration", () => {
    it("should have correct name and model", () => {
      expect(orchestrator.name).toBe("orchestrator");
      expect(orchestrator.model).toBe("opencode/grok-code");
    });

    it("should be configured as subagent mode", () => {
      expect(orchestrator.mode).toBe("subagent");
    });

    it("should have low temperature for consistent coordination", () => {
      expect(orchestrator.temperature).toBe(0.1);
    });
  });

  describe("Description and System Prompt", () => {
    it("should have appropriate description", () => {
      expect(orchestrator.description).toContain(
        "StringRay Framework orchestrator",
      );
      expect(orchestrator.description).toContain("coordination");
      expect(orchestrator.description).toContain("multi-agent orchestration");
    });

    it("should have comprehensive system prompt", () => {
      const system = orchestrator.system;
      expect(system).toContain("StringRay Orchestrator");
      expect(system).toContain("multi-agent workflows");
      expect(system).toContain("enterprise operations");
    });

    it("should define 8 core responsibilities", () => {
      const system = orchestrator.system;
      expect(system).toContain("Workflow Orchestration");
      expect(system).toContain("Subagent Delegation");
      expect(system).toContain("Session Management");
      expect(system).toContain("Progress Tracking");
      expect(system).toContain("Conflict Resolution");
      expect(system).toContain("Completion Guarantee");
      expect(system).toContain("Performance Optimization");
      expect(system).toContain("Error Recovery");
    });
  });

  describe("Key Facilities", () => {
    it("should specify multi-agent coordination facilities", () => {
      const system = orchestrator.system;
      expect(system).toContain("Multi-agent coordination");
      expect(system).toContain("async delegation");
      expect(system).toContain("Session lifecycle management");
      expect(system).toContain("Progress tracking");
      expect(system).toContain("Conflict resolution");
      expect(system).toContain("Parallel execution optimization");
      expect(system).toContain("error recovery mechanisms");
    });
  });

  describe("Operating Protocol", () => {
    it("should define 6-phase operating protocol", () => {
      const system = orchestrator.system;
      expect(system).toContain("6-phase operating protocol");
      expect(system).toContain("Analysis Mode");
      expect(system).toContain("Planning Mode");
      expect(system).toContain("Delegation Mode");
      expect(system).toContain("Execution Mode");
      expect(system).toContain("Resolution Mode");
      expect(system).toContain("Completion Mode");
    });

    it("should specify protocol phases in detail", () => {
      const system = orchestrator.system;
      expect(system).toContain("Assess task complexity");
      expect(system).toContain("Break complex tasks into manageable phases");
      expect(system).toContain(
        "Assign specialized work to appropriate subagents",
      );
      expect(system).toContain("Monitor parallel task execution");
      expect(system).toContain("Handle conflicts, errors, and bottlenecks");
      expect(system).toContain("Validate final results");
    });
  });

  describe("Orchestration Guidelines", () => {
    it("should specify orchestration principles", () => {
      const system = orchestrator.system;
      expect(system).toContain("Follow the 6-phase operating protocol");
      expect(system).toContain("Maximize parallel execution");
      expect(system).toContain("Maintain clear communication");
      expect(system).toContain("Implement proper error boundaries");
      expect(system).toContain("Ensure all tasks complete with validation");
    });
  });

  describe("Integration Points", () => {
    it("should define integration points", () => {
      const system = orchestrator.system;
      expect(system).toContain("Integration Points");
      expect(system).toContain("Session management system");
      expect(system).toContain("Agent delegation framework");
      expect(system).toContain("Progress tracking and monitoring");
      expect(system).toContain("Conflict resolution mechanisms");
      expect(system).toContain("Performance optimization tools");
    });
  });

  describe("Tools Configuration", () => {
    it("should have comprehensive tool permissions for orchestration", () => {
      expect(orchestrator.tools?.include).toContain("read");
      expect(orchestrator.tools?.include).toContain("grep");
      expect(orchestrator.tools?.include).toContain("lsp_*");
      expect(orchestrator.tools?.include).toContain("run_terminal_cmd");
      expect(orchestrator.tools?.include).toContain("background_task");
      expect(orchestrator.tools?.include).toContain("call_omo_agent");
      expect(orchestrator.tools?.include).toContain("session_*");
    });

    it("should have 13 orchestration-specific tools including skill invocation", () => {
      expect(orchestrator.tools?.include).toHaveLength(13);
    });
  });

  describe("Permissions Configuration", () => {
    it("should allow edit operations", () => {
      expect(orchestrator.permission?.edit).toBe("allow");
    });

    it("should have essential bash command permissions", () => {
      const bashPerms = orchestrator.permission?.bash;
      expect(bashPerms).toBeDefined();
      expect(typeof bashPerms).toBe("object");

      // Check essential commands for orchestration
      expect((bashPerms as any)?.git).toBe("allow");
      expect((bashPerms as any)?.npm).toBe("allow");
      expect((bashPerms as any)?.bun).toBe("allow");
    });

    it("should not have restrictive permissions", () => {
      expect(orchestrator.permission?.webfetch).toBeUndefined();
    });
  });

  describe("Subagent Integration", () => {
    it("should reference key subagents", () => {
      const system = orchestrator.system;
      expect(system).toContain("architect");
      expect(system).toContain("refactorer");
      expect(system).toContain("test-architect");
      expect(system).toContain("enforcer");
    });

    it("should specify intelligent delegation", () => {
      const system = orchestrator.system;
      expect(system).toContain("Intelligently assign tasks");
      expect(system).toContain("specialized agents");
    });
  });

  describe("Session Management", () => {
    it("should emphasize session lifecycle management", () => {
      const system = orchestrator.system;
      expect(system).toContain("Session Management");
      expect(system).toContain("session lifecycle");
      expect(system).toContain("state coordination");
      expect(system).toContain("cross-session operations");
    });
  });

  describe("Conflict Resolution", () => {
    it("should specify conflict resolution capabilities", () => {
      const system = orchestrator.system;
      expect(system).toContain("Conflict Resolution");
      expect(system).toContain("Mediate between conflicting");
      expect(system).toContain("subagent recommendations");
      expect(system).toContain("architectural decisions");
    });
  });

  describe("Completion Guarantee", () => {
    it("should ensure completion guarantee", () => {
      const system = orchestrator.system;
      expect(system).toContain("Completion Guarantee");
      expect(system).toContain("complete successfully");
      expect(system).toContain("rollback capabilities");
    });
  });

  describe("Performance Optimization", () => {
    it("should specify performance optimization focus", () => {
      const system = orchestrator.system;
      expect(system).toContain("Performance Optimization");
      expect(system).toContain("parallel execution");
      expect(system).toContain("maximum efficiency");
    });
  });

  describe("Error Recovery", () => {
    it("should implement comprehensive error handling", () => {
      const system = orchestrator.system;
      expect(system).toContain("Error Recovery");
      expect(system).toContain("comprehensive error handling");
      expect(system).toContain("recovery strategies");
    });
  });

  describe("Orchestration Goal", () => {
    it("should define clear orchestration goal", () => {
      const system = orchestrator.system;
      expect(system).toContain("flawlessly coordinate");
      expect(system).toContain("StringRay Framework operations");
      expect(system).toContain("intelligent orchestration");
      expect(system).toContain("delegation");
    });
  });
});
