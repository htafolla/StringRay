import { describe, it, expect } from "vitest";
import { enforcer } from "../../agents/enforcer.js";
import type { AgentConfig } from "../../agents/types.js";

describe("Enforcer Agent Configuration", () => {
  it("should be a valid AgentConfig object", () => {
    // Type check - this will fail at compile time if not valid
    const config: AgentConfig = enforcer;
    expect(config).toBeDefined();
  });

  describe("Basic Configuration", () => {
    it("should have correct name and model", () => {
      expect(enforcer.name).toBe("enforcer");
      expect(enforcer.model).toBe("opencode/grok-code");
    });

    it("should be configured as subagent mode", () => {
      expect(enforcer.mode).toBe("subagent");
    });

    it("should have low temperature for deterministic responses", () => {
      expect(enforcer.temperature).toBe(0.1);
    });
  });

  describe("Description and System Prompt", () => {
    it("should have appropriate description", () => {
      expect(enforcer.description).toContain("StringRay Framework enforcer");
      expect(enforcer.description).toContain("error handling");
      expect(enforcer.description).toContain("compliance monitoring");
    });

    it("should have comprehensive system prompt", () => {
      const system = enforcer.system;
      expect(system).toContain("StringRay Enforcer");
      expect(system).toContain("framework compliance");
      expect(system).toContain("error prevention");
      expect(system).toContain("Universal Development Codex v1.2.24");
      expect(system).toContain("99.6% error prevention");
      expect(system).toContain("256MB memory");
    });

    it("should define core responsibilities", () => {
      const system = enforcer.system;
      expect(system).toContain("Error Handling & Prevention");
      expect(system).toContain("Performance Facilities");
      expect(system).toContain("Compliance Monitoring");
      expect(system).toContain("Validation & Enforcement");
    });

    it("should specify key facilities", () => {
      const system = enforcer.system;
      expect(system).toContain("Error boundary layers");
      expect(system).toContain("circuit breaker patterns");
      expect(system).toContain("Performance monitoring");
      expect(system).toContain("256MB memory");
      expect(system).toContain("80% CPU");
      expect(system).toContain("45s timeout");
      expect(system).toContain("JSON format");
    });
  });

  describe("Tools Configuration", () => {
    it("should have appropriate tool permissions", () => {
      expect(enforcer.tools?.include).toContain("read");
      expect(enforcer.tools?.include).toContain("grep");
      expect(enforcer.tools?.include).toContain("lsp_*");
      expect(enforcer.tools?.include).toContain("run_terminal_cmd");
      expect(enforcer.tools?.include).toContain("lsp_diagnostics");
      expect(enforcer.tools?.include).toContain("lsp_code_actions");
    });

    it("should not have exclude restrictions", () => {
      expect(enforcer.tools?.exclude).toBeUndefined();
    });
  });

  describe("Permissions Configuration", () => {
    it("should allow edit operations", () => {
      expect(enforcer.permission?.edit).toBe("allow");
    });

    it("should have specific bash command permissions", () => {
      const bashPerms = enforcer.permission?.bash;
      expect(bashPerms).toBeDefined();
      expect(typeof bashPerms).toBe("object");

      // Check individual command permissions
      expect((bashPerms as any)?.git).toBe("allow");
      expect((bashPerms as any)?.npm).toBe("allow");
      expect((bashPerms as any)?.bun).toBe("allow");
      expect((bashPerms as any)?.eslint).toBe("allow");
      expect((bashPerms as any)?.prettier).toBe("allow");
    });

    it("should not have webfetch permissions defined", () => {
      expect(enforcer.permission?.webfetch).toBeUndefined();
    });
  });

  describe("Processor Pipeline", () => {
    it("should define processor pipeline", () => {
      const system = enforcer.system;
      expect(system).toContain("Processor pipeline");
      expect(system).toContain("codexValidation");
      expect(system).toContain("thresholdCheck");
      expect(system).toContain("complianceReporting");
      expect(system).toContain("violationLogging");
    });

    it("should specify integration hooks", () => {
      const system = enforcer.system;
      expect(system).toContain("Integration hooks");
      expect(system).toContain("pre/post validation");
      expect(system).toContain("error boundary monitoring");
      expect(system).toContain("performance tracking");
    });
  });

  describe("Codex Compliance", () => {
    it("should reference Universal Development Codex v1.2.24", () => {
      const system = enforcer.system;
      expect(system).toContain("Universal Development Codex v1.2.24");
    });

    it("should specify error prevention target", () => {
      const system = enforcer.system;
      expect(system).toContain("99.6% error prevention");
    });

    it("should mention zero tolerance policy", () => {
      const system = enforcer.system;
      expect(system).toContain("zero-tolerance");
    });

    it("should require validation against all 43 codex terms", () => {
      const system = enforcer.system;
      expect(system).toContain("all 43 codex terms");
    });
  });

  describe("Performance Limits", () => {
    it("should specify memory limit", () => {
      const system = enforcer.system;
      expect(system).toContain("256MB memory");
    });

    it("should specify CPU limit", () => {
      const system = enforcer.system;
      expect(system).toContain("80% CPU");
    });

    it("should specify timeout limit", () => {
      const system = enforcer.system;
      expect(system).toContain("45s timeout");
    });
  });

  describe("Operational Guidelines", () => {
    it("should provide actionable error message guidance", () => {
      const system = enforcer.system;
      expect(system).toContain("actionable error messages");
      expect(system).toContain("context");
    });

    it("should require structured logging", () => {
      const system = enforcer.system;
      expect(system).toContain("structured logging");
      expect(system).toContain("JSON format");
    });

    it("should maintain system stability goal", () => {
      const system = enforcer.system;
      expect(system).toContain("maintain system stability");
      expect(system).toContain("production-ready code quality");
    });
  });
});
