/**
 * Session Migration Validator
 * Validates session migration operations and state integrity
 */
export class SessionMigrationValidator {
  private stateManager: any;
  private sessionCoordinator: any;

  constructor(stateManager: any, sessionCoordinator: any) {
    this.stateManager = stateManager;
    this.sessionCoordinator = sessionCoordinator;
  }

  /**
   * Validate migration plan before execution
   */
  async validateMigrationPlan(plan: any): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate session exists
    const sessionStatus = this.sessionCoordinator.getSessionStatus(
      plan.sessionId,
    );
    if (!sessionStatus) {
      errors.push(`Session ${plan.sessionId} does not exist`);
      return { valid: false, errors, warnings };
    }

    // Validate target coordinator
    if (!plan.targetCoordinator) {
      errors.push("Target coordinator not specified");
    }

    // Validate migration steps
    const requiredSteps = [
      "backup_current_state",
      "update_coordinator",
      "transfer_dependencies",
      "transfer_context",
      "notify_agents",
      "verify_migration",
    ];

    for (const requiredStep of requiredSteps) {
      if (!plan.migrationSteps.includes(requiredStep)) {
        errors.push(`Missing required migration step: ${requiredStep}`);
      }
    }

    // Check for shared context that needs to be transferred
    const sharedContext = this.sessionCoordinator.getSharedContext(
      plan.sessionId,
      "*",
    );
    if (sharedContext) {
      warnings.push(`Session has shared context that will be transferred`);
    }

    // Validate session activity
    const lastActivity = sessionStatus.lastActivity;
    const timeSinceActivity = Date.now() - lastActivity;
    if (timeSinceActivity < 5000) {
      // Less than 5 seconds
      warnings.push("Session is very active - migration may cause disruption");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate migration execution results
   */
  async validateMigrationResult(
    plan: any,
    success: boolean,
  ): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    if (!success) {
      issues.push("Migration execution failed");
      return { valid: false, issues };
    }

    // Verify coordinator update
    const coordinatorData = this.stateManager.get(
      `session:${plan.sessionId}:coordinator`,
    );
    if (
      !coordinatorData ||
      coordinatorData.coordinatorId !== plan.targetCoordinator
    ) {
      issues.push("Coordinator not properly updated after migration");
    }

    // Verify session is still active
    const sessionStatus = this.sessionCoordinator.getSessionStatus(
      plan.sessionId,
    );
    if (!sessionStatus || sessionStatus.status !== "active") {
      issues.push("Session not properly maintained after migration");
    }

    // Verify shared context transferred
    const context = this.stateManager.get(`session:${plan.sessionId}:shared`);
    if (!context) {
      issues.push("Session shared context not properly transferred");
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validate rollback capability
   */
  validateRollbackCapability(plan: any): {
    canRollback: boolean;
    reason?: string;
  } {
    // Check if all migration steps have rollback procedures
    const rollbackSteps = plan.rollbackSteps || [];

    if (rollbackSteps.length === 0) {
      return {
        canRollback: false,
        reason: "No rollback steps defined",
      };
    }

    // Verify rollback steps match migration steps
    const migrationSteps = plan.migrationSteps || [];
    if (rollbackSteps.length !== migrationSteps.length) {
      return {
        canRollback: false,
        reason: "Rollback steps don't match migration steps",
      };
    }

    return { canRollback: true };
  }
}
