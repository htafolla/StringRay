import { describe, it, expect } from "vitest";
import { refactorer } from "../../agents/refactorer.js";
import type { AgentConfig } from "../../agents/types.js";

describe("Refactorer Agent Configuration", () => {
  it("should be a valid AgentConfig object", () => {
    const config: AgentConfig = refactorer;
    expect(config).toBeDefined();
  });

  describe("Basic Configuration", () => {
    it("should have correct name and model", () => {
      expect(refactorer.name).toBe("refactorer");
      expect(refactorer.model).toBe("opencode/grok-code");
    });

    it("should be configured as subagent mode", () => {
      expect(refactorer.mode).toBe("subagent");
    });

    it("should have low temperature for consistent refactoring decisions", () => {
      expect(refactorer.temperature).toBe(0.1);
    });
  });

  describe("Description and System Prompt", () => {
    it("should have appropriate refactoring description", () => {
      expect(refactorer.description).toContain(
        "StringRay Framework refactorer",
      );
      expect(refactorer.description).toContain("technical debt elimination");
      expect(refactorer.description).toContain("code consolidation");
    });

    it("should have comprehensive refactorer system prompt", () => {
      const system = refactorer.system;
      expect(system).toContain("StringRay Refactorer");
      expect(system).toContain("technical debt elimination");
      expect(system).toContain("surgical code improvements");
    });
  });

  describe("Core Responsibilities", () => {
    it("should define 5 core refactoring responsibilities", () => {
      const system = refactorer.system;
      expect(system).toContain("Technical Debt Elimination");
      expect(system).toContain("Code Consolidation");
      expect(system).toContain("Surgical Refactoring");
      expect(system).toContain("Performance Optimization");
      expect(system).toContain("Maintainability Enhancement");
    });

    it("should specify technical debt elimination focus", () => {
      const system = refactorer.system;
      expect(system).toContain("reduce code complexity");
      expect(system).toContain("maintainability issues");
    });

    it("should include code consolidation capabilities", () => {
      const system = refactorer.system;
      expect(system).toContain("Merge duplicate code");
      expect(system).toContain("eliminate redundancy");
      expect(system).toContain("preserving functionality");
    });

    it("should specify surgical refactoring approach", () => {
      const system = refactorer.system;
      expect(system).toContain("precise code improvements");
      expect(system).toContain("without introducing regressions");
    });

    it("should include performance optimization", () => {
      const system = refactorer.system;
      expect(system).toContain("code efficiency");
      expect(system).toContain("resource utilization");
    });

    it("should specify maintainability enhancement", () => {
      const system = refactorer.system;
      expect(system).toContain("readability");
      expect(system).toContain("testability");
      expect(system).toContain("long-term maintainability");
    });
  });

  describe("Key Facilities", () => {
    it("should specify code analysis facilities", () => {
      const system = refactorer.system;
      expect(system).toContain("Code analysis");
      expect(system).toContain("technical debt assessment");
      expect(system).toContain("30-second timeout");
    });

    it("should include refactoring validation capabilities", () => {
      const system = refactorer.system;
      expect(system).toContain("Refactoring validation");
      expect(system).toContain("impact analysis");
      expect(system).toContain("10-second timeout");
    });

    it("should specify consolidation metrics", () => {
      const system = refactorer.system;
      expect(system).toContain("Consolidation metrics");
      expect(system).toContain("efficiency tracking");
    });

    it("should define refactoring processor pipeline", () => {
      const system = refactorer.system;
      expect(system).toContain("Processor pipeline");
      expect(system).toContain("code-analysis");
      expect(system).toContain("technical-debt-assessment");
      expect(system).toContain("refactoring-validation");
      expect(system).toContain("consolidation-impact");
    });

    it("should specify AST manipulation tools", () => {
      const system = refactorer.system;
      expect(system).toContain("AST manipulation tools");
      expect(system).toContain("surgical code transformations");
    });
  });

  describe("Refactoring Process", () => {
    it("should define 5-phase refactoring process", () => {
      const system = refactorer.system;
      expect(system).toContain("Refactoring Process");
      expect(system).toContain("Debt Assessment");
      expect(system).toContain("Impact Analysis");
      expect(system).toContain("Surgical Implementation");
      expect(system).toContain("Validation & Testing");
      expect(system).toContain("Consolidation");
    });

    it("should specify debt assessment phase", () => {
      const system = refactorer.system;
      expect(system).toContain("technical debt indicators");
      expect(system).toContain("complexity metrics");
    });

    it("should include impact analysis", () => {
      const system = refactorer.system;
      expect(system).toContain("refactoring effects");
      expect(system).toContain("system performance");
      expect(system).toContain("functionality");
    });

    it("should specify surgical implementation", () => {
      const system = refactorer.system;
      expect(system).toContain("targeted improvements");
      expect(system).toContain("minimal changes");
    });

    it("should include validation and testing", () => {
      const system = refactorer.system;
      expect(system).toContain("maintains existing behavior");
    });

    it("should specify consolidation phase", () => {
      const system = refactorer.system;
      expect(system).toContain("merge duplicate code");
      expect(system).toContain("patterns");
    });
  });

  describe("Refactoring Guidelines", () => {
    it("should specify functionality preservation", () => {
      const system = refactorer.system;
      expect(system).toContain("preserve existing functionality");
      expect(system).toContain("99.7% retention rate");
    });

    it("should emphasize gradual changes", () => {
      const system = refactorer.system;
      expect(system).toContain("gradual changes");
      expect(system).toContain("minimize risk");
    });

    it("should focus on meaningful improvements", () => {
      const system = refactorer.system;
      expect(system).toContain("meaningful architectural improvements");
    });

    it("should require comprehensive validation", () => {
      const system = refactorer.system;
      expect(system).toContain("comprehensive testing");
    });

    it("should specify documentation requirements", () => {
      const system = refactorer.system;
      expect(system).toContain("Document refactoring rationale");
      expect(system).toContain("benefits");
    });
  });

  describe("Integration Points", () => {
    it("should define comprehensive refactoring integration points", () => {
      const system = refactorer.system;
      expect(system).toContain("Integration Points");
      expect(system).toContain("Code analysis and AST manipulation");
      expect(system).toContain("Performance profiling");
      expect(system).toContain("Automated testing");
      expect(system).toContain("Code quality metrics");
      expect(system).toContain("Version control");
    });
  });

  describe("Tools Configuration", () => {
    it("should have comprehensive refactoring tools", () => {
      expect(refactorer.tools?.include).toContain("read");
      expect(refactorer.tools?.include).toContain("grep");
      expect(refactorer.tools?.include).toContain("lsp_*");
      expect(refactorer.tools?.include).toContain("run_terminal_cmd");
      expect(refactorer.tools?.include).toContain("ast_grep_search");
      expect(refactorer.tools?.include).toContain("ast_grep_replace");
      expect(refactorer.tools?.include).toContain("lsp_rename");
      expect(refactorer.tools?.include).toContain("lsp_prepare_rename");
    });

    it("should have 8 refactoring-specific tools", () => {
      expect(refactorer.tools?.include).toHaveLength(8);
    });
  });

  describe("Permissions Configuration", () => {
    it("should allow edit operations", () => {
      expect(refactorer.permission?.edit).toBe("allow");
    });

    it("should have refactoring tool permissions", () => {
      const bashPerms = refactorer.permission?.bash;
      expect(bashPerms).toBeDefined();
      expect(typeof bashPerms).toBe("object");

      expect((bashPerms as any)?.git).toBe("allow");
      expect((bashPerms as any)?.npm).toBe("allow");
      expect((bashPerms as any)?.bun).toBe("allow");
      expect((bashPerms as any)?.test).toBe("allow");
    });
  });

  describe("Refactoring Goal", () => {
    it("should define clear refactoring maintenance goal", () => {
      const system = refactorer.system;
      expect(system).toContain("continuously improve code quality");
      expect(system).toContain("maintainability");
      expect(system).toContain("eliminating technical debt");
      expect(system).toContain("systematic, validated refactoring");
    });
  });
});
