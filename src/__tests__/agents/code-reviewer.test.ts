import { describe, it, expect } from "vitest";
import { codeReviewer } from "../../agents/code-reviewer";
import type { AgentConfig } from "../../agents/types";

describe("Code Reviewer Agent Configuration", () => {
  it("should be a valid AgentConfig object", () => {
    const config: AgentConfig = codeReviewer;
    expect(config).toBeDefined();
  });

  describe("Basic Configuration", () => {
    it("should have correct name and model", () => {
      expect(codeReviewer.name).toBe("code-reviewer");
      expect(codeReviewer.model).toBe("opencode/grok-code");
    });

    it("should be configured as subagent mode", () => {
      expect(codeReviewer.mode).toBe("subagent");
    });

    it("should have low temperature for consistent review standards", () => {
      expect(codeReviewer.temperature).toBe(0.1);
    });
  });

  describe("Description and System Prompt", () => {
    it("should have appropriate code review description", () => {
      expect(codeReviewer.description).toContain(
        "StringRay Framework code reviewer",
      );
      expect(codeReviewer.description).toContain("monitoring");
      expect(codeReviewer.description).toContain("analytics");
      expect(codeReviewer.description).toContain("quality assurance");
    });

    it("should have comprehensive code reviewer system prompt", () => {
      const system = codeReviewer.system;
      expect(system).toContain("StringRay Code Reviewer");
      expect(system).toContain("code quality assurance");
      expect(system).toContain("monitoring");
      expect(system).toContain("comprehensive analysis");
    });
  });

  describe("Core Responsibilities", () => {
    it("should define 5 core code review responsibilities", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Code Quality Assessment");
      expect(system).toContain("Monitoring & Analytics");
      expect(system).toContain("Best Practice Validation");
      expect(system).toContain("Security Review");
      expect(system).toContain("Performance Impact Analysis");
    });

    it("should reference Universal Development Codex", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Universal Development Codex v1.1.1");
    });

    it("should specify monitoring and analytics capabilities", () => {
      const system = codeReviewer.system;
      expect(system).toContain("review throughput");
      expect(system).toContain("quality scores");
      expect(system).toContain("performance patterns");
    });

    it("should include security review responsibilities", () => {
      const system = codeReviewer.system;
      expect(system).toContain("security vulnerabilities");
      expect(system).toContain("compliance issues");
    });

    it("should specify performance impact analysis", () => {
      const system = codeReviewer.system;
      expect(system).toContain("performance implications");
    });
  });

  describe("Key Facilities", () => {
    it("should specify monitoring facilities", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Real-time monitoring");
      expect(system).toContain("review_throughput");
      expect(system).toContain("quality_score_trends");
      expect(system).toContain("false_positive_rate");
    });

    it("should include analytics engine capabilities", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Analytics engine");
      expect(system).toContain("performance patterns");
      expect(system).toContain("predictive models");
      expect(system).toContain("defect detection");
    });

    it("should define review processor pipeline", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Processor pipeline");
      expect(system).toContain("quality-assessment");
      expect(system).toContain("compliance-validation");
      expect(system).toContain("security-review");
      expect(system).toContain("performance-impact");
    });

    it("should specify alert thresholds", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Alert thresholds");
      expect(system).toContain("20s response time");
      expect(system).toContain("2% error rate");
      expect(system).toContain("200MB memory usage");
    });
  });

  describe("Review Process", () => {
    it("should define 5-phase review process", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Review Process");
      expect(system).toContain("Static Analysis");
      expect(system).toContain("Security Scanning");
      expect(system).toContain("Performance Review");
      expect(system).toContain("Architecture Validation");
      expect(system).toContain("Documentation Review");
    });

    it("should specify static analysis phase", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Automated code quality checks");
      expect(system).toContain("linting");
    });

    it("should include security scanning", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Vulnerability detection");
      expect(system).toContain("security best practice validation");
    });

    it("should specify performance review", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Impact assessment");
      expect(system).toContain("system performance");
      expect(system).toContain("scalability");
    });

    it("should include architecture validation", () => {
      const system = codeReviewer.system;
      expect(system).toContain("design principles");
      expect(system).toContain("patterns");
    });

    it("should specify documentation review", () => {
      const system = codeReviewer.system;
      expect(system).toContain("code documentation");
      expect(system).toContain("maintainability");
    });
  });

  describe("Review Guidelines", () => {
    it("should reference all 43 codex terms validation", () => {
      const system = codeReviewer.system;
      expect(system).toContain("all 43 codex terms");
    });

    it("should prioritize correctness over style", () => {
      const system = codeReviewer.system;
      expect(system).toContain("correctness over style");
    });

    it("should provide actionable feedback", () => {
      const system = codeReviewer.system;
      expect(system).toContain("actionable feedback");
      expect(system).toContain("specific recommendations");
    });

    it("should consider multiple quality dimensions", () => {
      const system = codeReviewer.system;
      expect(system).toContain("performance");
      expect(system).toContain("security");
      expect(system).toContain("maintainability");
    });

    it("should use data-driven insights", () => {
      const system = codeReviewer.system;
      expect(system).toContain("data-driven insights");
      expect(system).toContain("monitoring and analytics");
    });
  });

  describe("Integration Points", () => {
    it("should define comprehensive code review integration points", () => {
      const system = codeReviewer.system;
      expect(system).toContain("Integration Points");
      expect(system).toContain("Code analysis and LSP integration");
      expect(system).toContain("Security scanning");
      expect(system).toContain("Performance monitoring");
      expect(system).toContain("Automated testing");
      expect(system).toContain("Documentation generation");
    });
  });

  describe("Tools Configuration", () => {
    it("should have comprehensive code analysis tools", () => {
      expect(codeReviewer.tools?.include).toContain("read");
      expect(codeReviewer.tools?.include).toContain("grep");
      expect(codeReviewer.tools?.include).toContain("lsp_*");
      expect(codeReviewer.tools?.include).toContain("run_terminal_cmd");
      expect(codeReviewer.tools?.include).toContain("lsp_diagnostics");
      expect(codeReviewer.tools?.include).toContain("lsp_code_actions");
      expect(codeReviewer.tools?.include).toContain("lsp_code_action_resolve");
    });

    it("should have 12 code review-specific tools including skill invocation", () => {
      expect(codeReviewer.tools?.include).toHaveLength(12);
    });
  });

  describe("Permissions Configuration", () => {
    it("should allow edit operations", () => {
      expect(codeReviewer.permission?.edit).toBe("allow");
    });

    it("should have code quality tool permissions", () => {
      const bashPerms = codeReviewer.permission?.bash;
      expect(bashPerms).toBeDefined();
      expect(typeof bashPerms).toBe("object");

      expect((bashPerms as any)?.git).toBe("allow");
      expect((bashPerms as any)?.npm).toBe("allow");
      expect((bashPerms as any)?.bun).toBe("allow");
      expect((bashPerms as any)?.eslint).toBe("allow");
      expect((bashPerms as any)?.prettier).toBe("allow");
    });
  });

  describe("Code Quality Goal", () => {
    it("should define clear code quality maintenance goal", () => {
      const system = codeReviewer.system;
      expect(system).toContain("highest standards of code quality");
      expect(system).toContain("actionable insights");
      expect(system).toContain("continuous improvement");
    });
  });
});
