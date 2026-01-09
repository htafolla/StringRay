import { describe, it, expect } from "vitest";
import { bugTriageSpecialist } from "../../agents/bug-triage-specialist.js";
import type { AgentConfig } from "../../agents/types.js";

describe("Bug Triage Specialist Agent Configuration", () => {
  it("should be a valid AgentConfig object", () => {
    const config: AgentConfig = bugTriageSpecialist;
    expect(config).toBeDefined();
  });

  describe("Basic Configuration", () => {
    it("should have correct name and model", () => {
      expect(bugTriageSpecialist.name).toBe("bug-triage-specialist");
      expect(bugTriageSpecialist.model).toBe("opencode/grok-code");
    });

    it("should be configured as subagent mode", () => {
      expect(bugTriageSpecialist.mode).toBe("subagent");
    });

    it("should have low temperature for consistent triage decisions", () => {
      expect(bugTriageSpecialist.temperature).toBe(0.1);
    });
  });

  describe("Description and System Prompt", () => {
    it("should have appropriate bug triage description", () => {
      expect(bugTriageSpecialist.description).toContain(
        "StrRay Framework bug triage specialist",
      );
      expect(bugTriageSpecialist.description).toContain(
        "systematic error investigation",
      );
      expect(bugTriageSpecialist.description).toContain("surgical fixes");
    });

    it("should have comprehensive bug triage specialist system prompt", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("StrRay Bug Triage Specialist");
      expect(system).toContain("systematic error investigation");
      expect(system).toContain("surgical code fixes");
    });
  });

  describe("Core Responsibilities", () => {
    it("should define 5 core bug triage responsibilities", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("Error Investigation");
      expect(system).toContain("Surgical Fixes");
      expect(system).toContain("Impact Assessment");
      expect(system).toContain("Recovery Strategy");
      expect(system).toContain("Performance Optimization");
    });

    it("should specify systematic error investigation", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("systematic root cause analysis");
      expect(system).toContain("comprehensive investigation depth");
    });

    it("should specify surgical fixes approach", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("precise, targeted fixes");
      expect(system).toContain("root causes");
      expect(system).toContain("without side effects");
    });

    it("should include impact assessment", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("error severity");
      expect(system).toContain("system-wide impact");
    });

    it("should specify recovery strategy development", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("graceful error recovery mechanisms");
    });

    it("should include performance optimization", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("performance bottlenecks");
    });
  });

  describe("Key Facilities", () => {
    it("should specify systematic investigation facilities", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("Systematic investigation");
      expect(system).toContain("30-second root cause timeout");
    });

    it("should include error boundary layers", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("Error boundary layers");
      expect(system).toContain("3 levels");
      expect(system).toContain("circuit breaker patterns");
    });

    it("should specify performance profiling", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("Performance profiling");
      expect(system).toContain("triage efficiency tracking");
    });

    it("should include bottleneck detection", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("Bottleneck detection");
      expect(system).toContain("resource usage monitoring");
    });

    it("should define bug triage processor pipeline", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("Processor pipeline");
      expect(system).toContain("error-analysis");
      expect(system).toContain("root-cause-investigation");
      expect(system).toContain("fix-validation");
      expect(system).toContain("impact-assessment");
    });
  });

  describe("Investigation Process", () => {
    it("should define 5-phase investigation process", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("Investigation Process");
      expect(system).toContain("Error Classification");
      expect(system).toContain("Root Cause Analysis");
      expect(system).toContain("Impact Assessment");
      expect(system).toContain("Surgical Fix Development");
      expect(system).toContain("Validation & Testing");
    });

    it("should specify error classification", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("severity");
      expect(system).toContain("critical, high, medium, low");
    });

    it("should include root cause analysis", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("underlying causes");
      expect(system).toContain("symptoms");
    });

    it("should specify impact assessment", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("system-wide effects");
      expect(system).toContain("dependencies");
    });

    it("should specify surgical fix development", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("targeted fixes");
      expect(system).toContain("minimal changes");
    });

    it("should include validation and testing", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("resolve issues");
      expect(system).toContain("introducing new problems");
    });
  });

  describe("Bug Triage Guidelines", () => {
    it("should emphasize systematic investigation", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("systematic investigation");
      expect(system).toContain("never guess");
    });

    it("should specify surgical fixes", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("surgical fixes");
      expect(system).toContain("change only what's necessary");
    });

    it("should require thorough validation", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("Validate fixes thoroughly");
      expect(system).toContain("deployment");
    });

    it("should maintain error boundary integrity", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("error boundary integrity");
    });

    it("should specify documentation requirements", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("detailed fix documentation");
    });
  });

  describe("Integration Points", () => {
    it("should define comprehensive bug triage integration points", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("Integration Points");
      expect(system).toContain("Error monitoring");
      expect(system).toContain("Performance tracking");
      expect(system).toContain("Code analysis");
      expect(system).toContain("Automated testing");
    });
  });

  describe("Tools Configuration", () => {
    it("should have comprehensive bug triage tools", () => {
      expect(bugTriageSpecialist.tools?.include).toContain("read");
      expect(bugTriageSpecialist.tools?.include).toContain("grep");
      expect(bugTriageSpecialist.tools?.include).toContain("lsp_*");
      expect(bugTriageSpecialist.tools?.include).toContain("run_terminal_cmd");
      expect(bugTriageSpecialist.tools?.include).toContain("ast_grep_search");
      expect(bugTriageSpecialist.tools?.include).toContain("ast_grep_replace");
      expect(bugTriageSpecialist.tools?.include).toContain("lsp_diagnostics");
      expect(bugTriageSpecialist.tools?.include).toContain("lsp_code_actions");
    });

    it("should have 8 bug triage-specific tools", () => {
      expect(bugTriageSpecialist.tools?.include).toHaveLength(8);
    });
  });

  describe("Permissions Configuration", () => {
    it("should allow edit operations", () => {
      expect(bugTriageSpecialist.permission?.edit).toBe("allow");
    });

    it("should have bug triage tool permissions", () => {
      const bashPerms = bugTriageSpecialist.permission?.bash;
      expect(bashPerms).toBeDefined();
      expect(typeof bashPerms).toBe("object");

      expect((bashPerms as any)?.git).toBe("allow");
      expect((bashPerms as any)?.npm).toBe("allow");
      expect((bashPerms as any)?.bun).toBe("allow");
      expect((bashPerms as any)?.test).toBe("allow");
    });
  });

  describe("Bug Triage Goal", () => {
    it("should define clear bug elimination goal", () => {
      const system = bugTriageSpecialist.system;
      expect(system).toContain("eliminate bugs");
      expect(system).toContain("systematic investigation");
      expect(system).toContain("strengthen system reliability");
    });
  });
});
