/**
 * StringRay AI v1.1.1 - Session State Manager
 *
 * Manages cross-session state sharing, dependency tracking,
 * and coordination for complex workflows.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StringRayStateManager } from "../state/state-manager";
import { SessionCoordinator } from "../delegation/session-coordinator";
import { frameworkLogger } from "../framework-logger";

export interface SessionDependency {
  sessionId: string;
  dependsOn: string[];
  dependedBy: string[];
  state: "pending" | "active" | "completed" | "failed";
  priority: number;
  metadata: Record<string, any>;
}

export interface SessionGroup {
  groupId: string;
  sessionIds: string[];
  coordinatorSession: string;
  state: "forming" | "active" | "completing" | "completed" | "failed";
  sharedState: Map<string, any>;
  createdAt: number;
  completedAt?: number;
}

export interface MigrationPlan {
  sessionId: string;
  targetCoordinator: string;
  stateTransfer: Map<string, any>;
  migrationSteps: string[];
  rollbackSteps: string[];
}

export interface FailoverConfig {
  sessionId: string;
  backupCoordinators: string[];
  failoverThreshold: number;
  autoFailover: boolean;
}

export class SessionStateManager {
  private stateManager: StringRayStateManager;
  private sessionCoordinator: SessionCoordinator;
  private dependencies = new Map<string, SessionDependency>();
  private sessionGroups = new Map<string, SessionGroup>();
  private failoverConfigs = new Map<string, FailoverConfig>();

  constructor(
    stateManager: StringRayStateManager,
    sessionCoordinator: SessionCoordinator,
  ) {
    this.stateManager = stateManager;
    this.sessionCoordinator = sessionCoordinator;
  }

  /**
   * Share state between sessions
   */
  shareState(
    fromSessionId: string,
    toSessionId: string,
    key: string,
    value: any,
  ): boolean {
    try {
      const fromSession =
        this.sessionCoordinator.getSessionStatus(fromSessionId);
      const toSession = this.sessionCoordinator.getSessionStatus(toSessionId);

      if (!fromSession || !toSession) {
        return false;
      }

      this.sessionCoordinator.shareContext(
        fromSessionId,
        `shared:${toSessionId}:${key}`,
        value,
        "state_manager",
      );
      this.sessionCoordinator.shareContext(
        toSessionId,
        `received:${fromSessionId}:${key}`,
        value,
        "state_manager",
      );

      frameworkLogger.log("session-state-manager", "state-shared", "info", {
        fromSessionId,
        toSessionId,
        key,
      });
      return true;
    } catch (error) {
      console.error(`❌ Session State Manager: Failed to share state:`, error);
      return false;
    }
  }

  /**
   * Broadcast state to multiple sessions
   */
  broadcastState(
    fromSessionId: string,
    targetSessionIds: string[],
    key: string,
    value: any,
  ): number {
    let successCount = 0;

    for (const targetSessionId of targetSessionIds) {
      if (this.shareState(fromSessionId, targetSessionId, key, value)) {
        successCount++;
      }
    }

    frameworkLogger.log("session-state-manager", "state-broadcasted", "info", {
      key,
      successCount,
      totalCount: targetSessionIds.length,
    });
    return successCount;
  }

  /**
   * Register session dependency
   */
  registerDependency(
    sessionId: string,
    dependsOn: string[],
    metadata: Record<string, any> = {},
  ): void {
    const dependency: SessionDependency = {
      sessionId,
      dependsOn,
      dependedBy: [],
      state: "pending",
      priority: 1,
      metadata,
    };

    for (const depId of dependsOn) {
      let dep = this.dependencies.get(depId);
      if (!dep) {
        // Create dependency entry for sessions that are depended upon
        dep = {
          sessionId: depId,
          dependsOn: [],
          dependedBy: [],
          state: "pending",
          priority: 1,
          metadata: {},
        };
        this.dependencies.set(depId, dep);
      }
      dep.dependedBy.push(sessionId);
    }

    this.dependencies.set(sessionId, dependency);
    this.persistDependencies();

    frameworkLogger.log(
      "session-state-manager",
      "dependency-registered",
      "info",
      { sessionId, dependsOn },
    );
  }

  /**
   * Update dependency state
   */
  updateDependencyState(
    sessionId: string,
    state: SessionDependency["state"],
  ): void {
    const dependency = this.dependencies.get(sessionId);
    if (dependency) {
      dependency.state = state;
      this.persistDependencies();

      if (state === "completed" || state === "failed") {
        this.propagateDependencyUpdate(sessionId, state);
      }

      frameworkLogger.log(
        "session-state-manager",
        "dependency-state-updated",
        "info",
        { sessionId, state },
      );
    }
  }

  /**
   * Get dependency chain for a session
   */
  getDependencyChain(sessionId: string): {
    dependencies: string[];
    dependents: string[];
    canStart: boolean;
  } {
    const dependency = this.dependencies.get(sessionId);
    if (!dependency) {
      return { dependencies: [], dependents: [], canStart: true };
    }

    const canStart = dependency.dependsOn.every((depId) => {
      const dep = this.dependencies.get(depId);
      return dep?.state === "completed";
    });

    return {
      dependencies: dependency.dependsOn,
      dependents: dependency.dependedBy,
      canStart,
    };
  }

  /**
   * Create session group for complex workflows
   */
  createSessionGroup(
    groupId: string,
    sessionIds: string[],
    coordinatorSession: string,
  ): SessionGroup {
    const group: SessionGroup = {
      groupId,
      sessionIds,
      coordinatorSession,
      state: "forming",
      sharedState: new Map(),
      createdAt: Date.now(),
    };

    this.sessionGroups.set(groupId, group);
    this.persistSessionGroups();

    for (const sessionId of sessionIds) {
      this.sessionCoordinator.shareContext(
        sessionId,
        `group:${groupId}:membership`,
        {
          groupId,
          role: sessionId === coordinatorSession ? "coordinator" : "member",
          members: sessionIds,
        },
        "state_manager",
      );
    }

    frameworkLogger.log(
      "session-state-manager",
      "session-group-created",
      "info",
      { groupId, sessionCount: sessionIds.length },
    );
    return group;
  }

  /**
   * Update session group state
   */
  updateSessionGroupState(groupId: string, state: SessionGroup["state"]): void {
    const group = this.sessionGroups.get(groupId);
    if (group) {
      group.state = state;

      if (state === "completed" || state === "failed") {
        group.completedAt = Date.now();
      }

      this.persistSessionGroups();

      for (const sessionId of group.sessionIds) {
        this.sessionCoordinator.shareContext(
          sessionId,
          `group:${groupId}:state`,
          {
            state,
            updatedAt: Date.now(),
          },
          "state_manager",
        );
      }

      frameworkLogger.log(
        "session-state-manager",
        "session-group-state-updated",
        "info",
        { groupId, state },
      );
    }
  }

  /**
   * Share state within a session group
   */
  shareGroupState(
    groupId: string,
    key: string,
    value: any,
    fromSessionId: string,
  ): boolean {
    const group = this.sessionGroups.get(groupId);
    if (!group || !group.sessionIds.includes(fromSessionId)) {
      return false;
    }

    group.sharedState.set(key, { value, fromSessionId, timestamp: Date.now() });

    for (const sessionId of group.sessionIds) {
      if (sessionId !== fromSessionId) {
        this.sessionCoordinator.shareContext(
          sessionId,
          `group:${groupId}:${key}`,
          value,
          fromSessionId,
        );
      }
    }

    this.persistSessionGroups();
    return true;
  }

  /**
   * Get session group state
   */
  getGroupState(groupId: string, key: string): any {
    const group = this.sessionGroups.get(groupId);
    return group?.sharedState.get(key)?.value;
  }

  /**
   * Plan session migration
   */
  planMigration(sessionId: string, targetCoordinator: string): MigrationPlan {
    const currentState = this.sessionCoordinator.getSessionStatus(sessionId);
    if (!currentState) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const plan: MigrationPlan = {
      sessionId,
      targetCoordinator,
      stateTransfer: new Map<string, any>([
        ["active", currentState.active],
        ["agentCount", currentState.agentCount],
      ]),
      migrationSteps: [
        "validate_target_coordinator",
        "transfer_active_delegations",
        "transfer_pending_communications",
        "transfer_shared_context",
        "update_dependencies",
        "cleanup_source",
      ],
      rollbackSteps: [
        "restore_delegations",
        "restore_communications",
        "restore_context",
        "revert_dependencies",
        "revert_cleanup",
        "restore_coordinator",
      ],
    };

    frameworkLogger.log("session-state-manager", "migration-planned", "info", {
      sessionId,
      targetCoordinator,
    });
    return plan;
  }

  /**
   * Validate migration plan before execution
   */
  async validateMigrationPlan(plan: MigrationPlan): Promise<{
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

    // Validate migration steps - match the steps created by planMigration
    const requiredSteps = [
      "validate_target_coordinator",
      "transfer_active_delegations",
      "transfer_pending_communications",
      "transfer_shared_context",
      "update_dependencies",
      "cleanup_source",
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

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate rollback capability for a migration plan
   */
  validateRollbackCapability(plan: MigrationPlan): {
    canRollback: boolean;
    reason?: string;
  } {
    const rollbackSteps = plan.rollbackSteps || [];

    if (rollbackSteps.length === 0) {
      return {
        canRollback: false,
        reason: "No rollback steps defined",
      };
    }

    const migrationSteps = plan.migrationSteps || [];
    if (rollbackSteps.length !== migrationSteps.length) {
      return {
        canRollback: false,
        reason: "Rollback steps don't match migration steps",
      };
    }

    return { canRollback: true };
  }

  /**
   * Find orphaned agents in dependency graph
   */
  findOrphanedAgents(allAgents: string[], dependencies: any): string[] {
    const agentsWithDeps = new Set(Object.keys(dependencies));

    // Add agents that are dependencies of others
    for (const deps of Object.values(dependencies)) {
      for (const dep of deps as string[]) {
        agentsWithDeps.add(dep);
      }
    }

    return allAgents.filter((agent) => !agentsWithDeps.has(agent));
  }

  /**
   * Execute session migration
   */
  async executeMigration(plan: MigrationPlan): Promise<boolean> {
    const jobId = `migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const rollbackData: any[] = [];

    try {
      frameworkLogger.log(
        "session-state-manager",
        "migration-executing",
        "info",
        { jobId, sessionId: plan.sessionId },
      );

      for (const step of plan.migrationSteps) {
        console.log(`  → Executing step: ${step}`);

        switch (step) {
          case "backup_current_state": {
            const sessionState = this.sessionCoordinator.getSessionStatus(
              plan.sessionId,
            );
            const dependencies = this.dependencies.get(plan.sessionId);
            const group = Array.from(this.sessionGroups.values()).find((g) =>
              g.sessionIds.includes(plan.sessionId),
            );

            rollbackData.push({
              step,
              sessionState,
              dependencies,
              group,
            });
            break;
          }

          case "update_coordinator": {
            this.stateManager.set(`session:${plan.sessionId}:coordinator`, {
              coordinatorId: plan.targetCoordinator,
              migratedAt: new Date(),
            });
            break;
          }

          case "transfer_dependencies": {
            const deps = this.dependencies.get(plan.sessionId);
            if (deps) {
              this.stateManager.set(
                `session:${plan.sessionId}:dependencies`,
                deps,
              );
            }
            break;
          }

          case "transfer_communications": {
            const sessionStatus = this.sessionCoordinator.getSessionStatus(
              plan.sessionId,
            );
            if (sessionStatus) {
              this.stateManager.set(
                `session:${plan.sessionId}:status`,
                sessionStatus,
              );
            }
            break;
          }

          case "transfer_context": {
            // Transfer all shared context keys for this session
            // Note: This is a simplified implementation
            const session = this.sessionCoordinator["sessions"].get(
              plan.sessionId,
            );
            if (session) {
              const contextMap = Object.fromEntries(
                session.coordinationState.sharedContext,
              );
              this.stateManager.set(
                `session:${plan.sessionId}:shared`,
                contextMap,
              );
            }
            break;
          }

          case "update_session_groups": {
            for (const [groupId, group] of this.sessionGroups) {
              if (group.sessionIds.includes(plan.sessionId)) {
                const updatedGroup = {
                  ...group,
                  coordinatorId: plan.targetCoordinator,
                };
                this.sessionGroups.set(groupId, updatedGroup);
                this.persistSessionGroups();
                break;
              }
            }
            break;
          }

          case "notify_agents": {
            await this.sessionCoordinator.sendMessage(
              plan.sessionId,
              "system",
              "orchestrator",
              `Session migrated to coordinator: ${plan.targetCoordinator}`,
              "high",
            );
            break;
          }

          case "verify_migration": {
            const coordinatorData = this.stateManager.get(
              `session:${plan.sessionId}:coordinator`,
            );
            if (
              !coordinatorData ||
              (coordinatorData as any).coordinatorId !== plan.targetCoordinator
            ) {
              throw new Error(
                `Migration verification failed: coordinator not updated properly`,
              );
            }
            break;
          }
        }
      }

      frameworkLogger.log(
        "session-state-manager",
        "migration-completed",
        "success",
        { jobId, sessionId: plan.sessionId },
      );
      return true;
    } catch (error) {
      console.error(
        `❌ Session State Manager: Migration failed for ${plan.sessionId}:`,
        error,
      );
      await this.rollbackMigration(plan, rollbackData);
      return false;
    }
  }

  /**
   * Configure failover for a session
   */
  configureFailover(
    sessionId: string,
    backupCoordinators: string[],
    failoverThreshold: number,
    autoFailover: boolean,
  ): void {
    const config: FailoverConfig = {
      sessionId,
      backupCoordinators,
      failoverThreshold,
      autoFailover,
    };

    this.failoverConfigs.set(sessionId, config);
    this.persistFailoverConfigs();

    frameworkLogger.log(
      "session-state-manager",
      "failover-configured",
      "info",
      { sessionId, backupCount: backupCoordinators.length },
    );
  }

  /**
   * Execute failover for a session
   */
  async executeFailover(sessionId: string): Promise<boolean> {
    const config = this.failoverConfigs.get(sessionId);
    if (!config) {
      return false;
    }

    for (const backupCoordinator of config.backupCoordinators) {
      try {
        const plan = this.planMigration(sessionId, backupCoordinator);
        if (await this.executeMigration(plan)) {
          frameworkLogger.log(
            "session-state-manager",
            "failover-successful",
            "success",
            { sessionId, backupCoordinator },
          );
          return true;
        }
      } catch (error) {
        console.error(
          `❌ Session State Manager: Failover attempt failed for ${backupCoordinator}:`,
          error,
        );
      }
    }

    console.error(
      `❌ Session State Manager: All failover attempts failed for ${sessionId}`,
    );
    return false;
  }

  /**
   * Get coordination statistics
   */
  getCoordinationStats(): {
    totalDependencies: number;
    activeDependencies: number;
    totalGroups: number;
    activeGroups: number;
    failoverConfigs: number;
  } {
    return {
      totalDependencies: this.dependencies.size,
      activeDependencies: Array.from(this.dependencies.values()).filter(
        (d) => d.state === "active",
      ).length,
      totalGroups: this.sessionGroups.size,
      activeGroups: Array.from(this.sessionGroups.values()).filter(
        (g) => g.state === "active",
      ).length,
      failoverConfigs: this.failoverConfigs.size,
    };
  }

  private propagateDependencyUpdate(
    sessionId: string,
    state: SessionDependency["state"],
  ): void {
    const dependency = this.dependencies.get(sessionId);
    if (!dependency) return;

    for (const dependentId of dependency.dependedBy) {
      const dependent = this.dependencies.get(dependentId);
      if (dependent && dependent.state === "pending") {
        const canStart = dependent.dependsOn.every((depId) => {
          const dep = this.dependencies.get(depId);
          return dep?.state === "completed";
        });

        if (canStart) {
          this.sessionCoordinator.shareContext(
            dependentId,
            "dependency:ready",
            {
              sessionId: dependentId,
              trigger: sessionId,
              state,
            },
            "state_manager",
          );
        }
      }
    }
  }

  private async rollbackMigration(
    plan: MigrationPlan,
    rollbackData: any[] = [],
  ): Promise<void> {
    console.log(
      `↩️ Session State Manager: Rolling back migration for ${plan.sessionId}`,
    );

    // Restore from backup data if available
    for (const backup of rollbackData.reverse()) {
      try {
        switch (backup.step) {
          case "backup_current_state":
            if (backup.sessionState) {
              this.stateManager.set(
                `session:${plan.sessionId}:status`,
                backup.sessionState,
              );
            }
            if (backup.dependencies) {
              this.dependencies.set(plan.sessionId, backup.dependencies);
              this.persistDependencies();
            }
            if (backup.group) {
              this.sessionGroups.set(backup.group.id, backup.group);
              this.persistSessionGroups();
            }
            break;
        }
        console.log(`  ← Restored ${backup.step}`);
      } catch (error) {
        console.warn(`  ⚠️ Failed to restore ${backup.step}:`, error);
      }
    }

    // Execute rollback steps
    for (const step of plan.rollbackSteps.reverse()) {
      console.log(`  ← Rolling back step: ${step}`);
    }
  }

  private persistDependencies(): void {
    const deps = Object.fromEntries(this.dependencies);
    this.stateManager.set("state_manager:dependencies", deps);
  }

  private persistSessionGroups(): void {
    const groups = Object.fromEntries(this.sessionGroups);
    this.stateManager.set("state_manager:groups", groups);
  }

  private persistFailoverConfigs(): void {
    const configs = Object.fromEntries(this.failoverConfigs);
    this.stateManager.set("state_manager:failover", configs);
  }

  shutdown(): void {
    frameworkLogger.log("session-state-manager", "shutdown-complete", "info");
  }
}

export const createSessionStateManager = (
  stateManager: StringRayStateManager,
  sessionCoordinator: SessionCoordinator,
): SessionStateManager => {
  return new SessionStateManager(stateManager, sessionCoordinator);
};
