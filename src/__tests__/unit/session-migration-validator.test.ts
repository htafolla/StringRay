import { describe, it, expect, beforeEach } from "vitest";
import { SessionMigrationValidator } from "../../validation/session-migration-validator";

describe("SessionMigrationValidator", () => {
  let validator: SessionMigrationValidator;

  beforeEach(() => {
    // Mock dependencies
    const mockStateManager = {
      get: (key: string) => {
        if (key.includes("coordinator")) {
          return { coordinatorId: "new-coordinator" };
        }
        if (key.includes("shared")) {
          return { transferred: true };
        }
        return null;
      },
    };
    const mockSessionCoordinator = {
      getSessionStatus: (sessionId: string) => {
        if (sessionId === "non-existent-session") {
          return null;
        }
        return { active: true, agentCount: 3, status: "active" };
      },
      getSharedContext: () => ({ someData: "test" }),
    };

    validator = new SessionMigrationValidator(
      mockStateManager,
      mockSessionCoordinator,
    );
  });

  describe("validateMigrationPlan", () => {
    it("should validate a complete migration plan", async () => {
      const plan = {
        sessionId: "test-session",
        targetCoordinator: "new-coordinator",
        migrationSteps: [
          "backup_current_state",
          "update_coordinator",
          "transfer_dependencies",
          "transfer_context",
          "notify_agents",
          "verify_migration",
        ],
      };

      const result = await validator.validateMigrationPlan(plan);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain(
        "Session has shared context that will be transferred",
      );
    });

    it("should reject plan without target coordinator", async () => {
      const plan = {
        sessionId: "test-session",
        migrationSteps: ["backup_current_state"],
      };

      const result = await validator.validateMigrationPlan(plan);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Target coordinator not specified");
    });

    it("should reject plan for non-existent session", async () => {
      const plan = {
        sessionId: "non-existent-session",
        targetCoordinator: "new-coordinator",
        migrationSteps: ["backup_current_state"],
      };

      const result = await validator.validateMigrationPlan(plan);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Session non-existent-session does not exist",
      );
    });

    it("should reject plan with missing migration steps", async () => {
      const plan = {
        sessionId: "test-session",
        targetCoordinator: "new-coordinator",
        migrationSteps: ["backup_current_state"], // Missing required steps
      };

      const result = await validator.validateMigrationPlan(plan);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Missing required migration step: update_coordinator",
      );
    });
  });

  describe("validateMigrationResult", () => {
    it("should validate successful migration", async () => {
      const plan = {
        sessionId: "test-session",
        targetCoordinator: "new-coordinator",
        migrationSteps: ["backup_current_state"],
      };

      const result = await validator.validateMigrationResult(plan, true);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it("should identify issues in failed migration", async () => {
      const plan = {
        sessionId: "test-session",
        targetCoordinator: "new-coordinator",
        migrationSteps: ["backup_current_state"],
      };

      const result = await validator.validateMigrationResult(plan, false);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain("Migration execution failed");
    });
  });
});
