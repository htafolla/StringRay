import { describe, it, expect } from "vitest";
import { securityAuditor } from "../../agents/security-auditor";
import type { AgentConfig } from "../../agents/types";

describe("Security Auditor Agent Configuration", () => {
  it("should be a valid AgentConfig object", () => {
    const config: AgentConfig = securityAuditor;
    expect(config).toBeDefined();
  });

  describe("Basic Configuration", () => {
    it("should have correct name and model", () => {
      expect(securityAuditor.name).toBe("security-auditor");
      expect(securityAuditor.model).toBe("opencode/grok-code");
    });

    it("should be configured as subagent mode", () => {
      expect(securityAuditor.mode).toBe("subagent");
    });

    it("should have low temperature for consistent security decisions", () => {
      expect(securityAuditor.temperature).toBe(0.1);
    });
  });

  describe("Description and System Prompt", () => {
    it("should have appropriate security-focused description", () => {
      expect(securityAuditor.description).toContain(
        "StringRay Framework security auditor",
      );
      expect(securityAuditor.description).toContain("compliance monitoring");
      expect(securityAuditor.description).toContain("vulnerability detection");
    });

    it("should have comprehensive security auditor system prompt", () => {
      const system = securityAuditor.system;
      expect(system).toContain("StringRay Security Auditor");
      expect(system).toContain("comprehensive security validation");
      expect(system).toContain("compliance monitoring");
    });
  });

  describe("Core Responsibilities", () => {
    it("should define 5 core security responsibilities", () => {
      const system = securityAuditor.system;
      expect(system).toContain("Vulnerability Detection");
      expect(system).toContain("Compliance Monitoring");
      expect(system).toContain("Threat Analysis");
      expect(system).toContain("Security Validation");
      expect(system).toContain("Audit Trail Management");
    });

    it("should specify vulnerability detection capabilities", () => {
      const system = securityAuditor.system;
      expect(system).toContain("Identify security vulnerabilities");
      expect(system).toContain("potential attack vectors");
    });

    it("should include compliance monitoring focus", () => {
      const system = securityAuditor.system;
      expect(system).toContain("adherence to security standards");
      expect(system).toContain("best practices");
    });

    it("should specify threat analysis responsibilities", () => {
      const system = securityAuditor.system;
      expect(system).toContain("systematic threat modeling");
      expect(system).toContain("risk assessment");
    });

    it("should include audit trail management", () => {
      const system = securityAuditor.system;
      expect(system).toContain("comprehensive security audit logs");
      expect(system).toContain("reporting");
    });
  });

  describe("Key Facilities", () => {
    it("should specify security-specific facilities", () => {
      const system = securityAuditor.system;
      expect(system).toContain("Key Facilities Available");
      expect(system).toContain("Comprehensive logging");
      expect(system).toContain("audit trails");
      expect(system).toContain("sensitive data filtering");
    });

    it("should define security processor pipeline", () => {
      const system = securityAuditor.system;
      expect(system).toContain("Processor pipeline");
      expect(system).toContain("securityPreValidate");
      expect(system).toContain("vulnerabilityScan");
      expect(system).toContain("threatAnalysis");
      expect(system).toContain("securityCompliance");
    });

    it("should specify integration hooks", () => {
      const system = securityAuditor.system;
      expect(system).toContain("Integration hooks");
      expect(system).toContain("pre/post security validation");
      expect(system).toContain("threat monitoring");
      expect(system).toContain("compliance tracking");
    });

    it("should mention security sandboxing", () => {
      const system = securityAuditor.system;
      expect(system).toContain("Security sandboxed execution");
      expect(system).toContain("elevated permissions for security tools");
    });

    it("should include webhook endpoints", () => {
      const system = securityAuditor.system;
      expect(system).toContain("Webhook endpoints");
      expect(system).toContain("security alerts");
      expect(system).toContain("compliance notifications");
    });
  });

  describe("Security Audit Process", () => {
    it("should define 5-phase security audit process", () => {
      const system = securityAuditor.system;
      expect(system).toContain("Security Audit Process");
      expect(system).toContain("Input Validation");
      expect(system).toContain("Authentication & Authorization");
      expect(system).toContain("Data Protection");
      expect(system).toContain("Vulnerability Scanning");
      expect(system).toContain("Compliance Verification");
    });

    it("should specify input validation requirements", () => {
      const system = securityAuditor.system;
      expect(system).toContain("all inputs are properly validated");
      expect(system).toContain("sanitized");
    });

    it("should include authentication and authorization review", () => {
      const system = securityAuditor.system;
      expect(system).toContain("access controls");
      expect(system).toContain("permission systems");
    });

    it("should specify data protection assessment", () => {
      const system = securityAuditor.system;
      expect(system).toContain("encryption");
      expect(system).toContain("data handling");
      expect(system).toContain("privacy compliance");
    });
  });

  describe("Security Audit Guidelines", () => {
    it("should specify security-by-design principles", () => {
      const system = securityAuditor.system;
      expect(system).toContain("security-by-design principles");
    });

    it("should reference zero-trust architecture", () => {
      const system = securityAuditor.system;
      expect(system).toContain("zero-trust architecture");
    });

    it("should reference OWASP Top 10", () => {
      const system = securityAuditor.system;
      expect(system).toContain("OWASP Top 10");
    });

    it("should specify actionable remediation", () => {
      const system = securityAuditor.system;
      expect(system).toContain("actionable remediation recommendations");
    });

    it("should emphasize audit trail maintenance", () => {
      const system = securityAuditor.system;
      expect(system).toContain("detailed audit trails");
      expect(system).toContain("compliance");
    });
  });

  describe("Integration Points", () => {
    it("should define comprehensive security integration points", () => {
      const system = securityAuditor.system;
      expect(system).toContain("Integration Points");
      expect(system).toContain("Vulnerability scanning tools");
      expect(system).toContain("Compliance monitoring");
      expect(system).toContain("Threat intelligence");
      expect(system).toContain("Security information and event management");
      expect(system).toContain("Automated remediation");
    });
  });

  describe("Tools Configuration", () => {
    it("should have security-focused tool permissions", () => {
      expect(securityAuditor.tools?.include).toContain("read");
      expect(securityAuditor.tools?.include).toContain("grep");
      expect(securityAuditor.tools?.include).toContain("lsp_*");
      expect(securityAuditor.tools?.include).toContain("run_terminal_cmd");
      expect(securityAuditor.tools?.include).toContain("grep_app_searchGitHub");
      expect(securityAuditor.tools?.include).toContain("webfetch");
    });

    it("should have 10 security-specific tools including skill invocation", () => {
      expect(securityAuditor.tools?.include).toHaveLength(10);
    });
  });

  describe("Permissions Configuration", () => {
    it("should allow edit operations", () => {
      expect(securityAuditor.permission?.edit).toBe("allow");
    });

    it("should have comprehensive bash permissions for security tools", () => {
      const bashPerms = securityAuditor.permission?.bash;
      expect(bashPerms).toBeDefined();
      expect(typeof bashPerms).toBe("object");

      expect((bashPerms as any)?.git).toBe("allow");
      expect((bashPerms as any)?.npm).toBe("allow");
      expect((bashPerms as any)?.bun).toBe("allow");
      expect((bashPerms as any)?.security).toBe("allow");
      expect((bashPerms as any)?.audit).toBe("allow");
    });

    it("should not have webfetch permissions defined", () => {
      expect(securityAuditor.permission?.webfetch).toBeUndefined();
    });
  });

  describe("Security Goal", () => {
    it("should define clear security maintenance goal", () => {
      const system = securityAuditor.system;
      expect(system).toContain("maintain the highest levels of security");
      expect(system).toContain("compliance");
      expect(system).toContain("secure system operations");
    });
  });
});
