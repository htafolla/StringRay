import { describe, it, expect, beforeEach } from "vitest";
import { SessionSecurityValidator } from "../../validation/session-security-validator";

describe("SessionSecurityValidator", () => {
  let validator: SessionSecurityValidator;

  beforeEach(() => {
    // Mock dependencies
    const mockStateManager = {
      get: () => null
    };

    const mockSessionCoordinator = {
      getSessionStatus: (sessionId: string) => {
        if (sessionId === 'non-existent-session') {
          return null;
        }
        return { status: 'active', agentCount: 3 };
      },
      getSessionAgents: () => ['agent1', 'agent2'],
      getSharedContext: () => null,
      getCommunications: () => []
    };

    const mockSecurityScanner = {
      scanForVulnerabilities: async () => ({ vulnerabilities: [] }),
      validateEncryption: async () => ({ valid: true })
    };

    validator = new SessionSecurityValidator(mockSessionCoordinator, mockStateManager, mockSecurityScanner);
  });

  describe("validateAccessControl", () => {
    it("should validate access control for existing sessions", async () => {
      const result = await validator.validateAccessControl('test-session');

      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.permissions).toBeDefined();
      expect(result.permissions.readAccess).toBeDefined();
      expect(result.permissions.writeAccess).toBeDefined();
      expect(result.permissions.adminAccess).toBeDefined();
    });

    it("should reject non-existent sessions", async () => {
      const result = await validator.validateAccessControl('non-existent-session');

      expect(result.valid).toBe(false);
      expect(result.issues).toContain("Session non-existent-session not found");
    });
  });

  describe("validateDataIntegrity", () => {
    it("should validate data integrity", async () => {
      const result = await validator.validateDataIntegrity('test-session');

      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(typeof result.integrityScore).toBe('number');
      expect(Array.isArray(result.encryptedFields)).toBe(true);
    });
  });

  describe("validateIsolation", () => {
    it("should validate session isolation", async () => {
      const result = await validator.validateIsolation('test-session');

      expect(result.valid).toBe(true);
      expect(['strong', 'moderate', 'weak']).toContain(result.isolationLevel);
    });
  });

  describe("validateAuditTrail", () => {
    it("should validate audit trail", async () => {
      const result = await validator.validateAuditTrail('test-session');

      expect(result.valid).toBe(true);
      expect(typeof result.auditCoverage).toBe('number');
    });
  });
});