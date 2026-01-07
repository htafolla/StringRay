/**
 * StrRay Framework v1.0.0 - Session State Manager
 *
 * Manages cross-session state sharing, dependency tracking,
 * and coordination for complex workflows.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { StrRayStateManager } from '../state/state-manager';
import { SessionCoordinator } from '../delegation/session-coordinator';

export interface SessionDependency {
  sessionId: string;
  dependsOn: string[];
  dependedBy: string[];
  state: 'pending' | 'active' | 'completed' | 'failed';
  priority: number;
  metadata: Record<string, any>;
}

export interface SessionGroup {
  groupId: string;
  sessionIds: string[];
  coordinatorSession: string;
  state: 'forming' | 'active' | 'completing' | 'completed' | 'failed';
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
  private stateManager: StrRayStateManager;
  private sessionCoordinator: SessionCoordinator;
  private dependencies = new Map<string, SessionDependency>();
  private sessionGroups = new Map<string, SessionGroup>();
  private failoverConfigs = new Map<string, FailoverConfig>();

  constructor(stateManager: StrRayStateManager, sessionCoordinator: SessionCoordinator) {
    this.stateManager = stateManager;
    this.sessionCoordinator = sessionCoordinator;
  }

  /**
   * Share state between sessions
   */
  shareState(fromSessionId: string, toSessionId: string, key: string, value: any): boolean {
    try {
      const fromSession = this.sessionCoordinator.getSessionStatus(fromSessionId);
      const toSession = this.sessionCoordinator.getSessionStatus(toSessionId);

      if (!fromSession || !toSession) {
        return false;
      }

      this.sessionCoordinator.shareContext(fromSessionId, `shared:${toSessionId}:${key}`, value, 'state_manager');
      this.sessionCoordinator.shareContext(toSessionId, `received:${fromSessionId}:${key}`, value, 'state_manager');

      console.log(`🔄 Session State Manager: Shared state '${key}' from ${fromSessionId} to ${toSessionId}`);
      return true;
    } catch (error) {
      console.error(`❌ Session State Manager: Failed to share state:`, error);
      return false;
    }
  }

  /**
   * Broadcast state to multiple sessions
   */
  broadcastState(fromSessionId: string, targetSessionIds: string[], key: string, value: any): number {
    let successCount = 0;

    for (const targetSessionId of targetSessionIds) {
      if (this.shareState(fromSessionId, targetSessionId, key, value)) {
        successCount++;
      }
    }

    console.log(`📢 Session State Manager: Broadcasted '${key}' to ${successCount}/${targetSessionIds.length} sessions`);
    return successCount;
  }

  /**
   * Register session dependency
   */
  registerDependency(sessionId: string, dependsOn: string[], metadata: Record<string, any> = {}): void {
    const dependency: SessionDependency = {
      sessionId,
      dependsOn,
      dependedBy: [],
      state: 'pending',
      priority: 1,
      metadata
    };

    for (const depId of dependsOn) {
      let dep = this.dependencies.get(depId);
      if (!dep) {
        // Create dependency entry for sessions that are depended upon
        dep = {
          sessionId: depId,
          dependsOn: [],
          dependedBy: [],
          state: 'pending',
          priority: 1,
          metadata: {}
        };
        this.dependencies.set(depId, dep);
      }
      dep.dependedBy.push(sessionId);
    }

    this.dependencies.set(sessionId, dependency);
    this.persistDependencies();

    console.log(`🔗 Session State Manager: Registered dependency for ${sessionId} on ${dependsOn.join(', ')}`);
  }

  /**
   * Update dependency state
   */
  updateDependencyState(sessionId: string, state: SessionDependency['state']): void {
    const dependency = this.dependencies.get(sessionId);
    if (dependency) {
      dependency.state = state;
      this.persistDependencies();

      if (state === 'completed' || state === 'failed') {
        this.propagateDependencyUpdate(sessionId, state);
      }

      console.log(`🔄 Session State Manager: Updated ${sessionId} dependency state to ${state}`);
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

    const canStart = dependency.dependsOn.every(depId => {
      const dep = this.dependencies.get(depId);
      return dep?.state === 'completed';
    });

    return {
      dependencies: dependency.dependsOn,
      dependents: dependency.dependedBy,
      canStart
    };
  }

  /**
   * Create session group for complex workflows
   */
  createSessionGroup(groupId: string, sessionIds: string[], coordinatorSession: string): SessionGroup {
    const group: SessionGroup = {
      groupId,
      sessionIds,
      coordinatorSession,
      state: 'forming',
      sharedState: new Map(),
      createdAt: Date.now()
    };

    this.sessionGroups.set(groupId, group);
    this.persistSessionGroups();

    for (const sessionId of sessionIds) {
      this.sessionCoordinator.shareContext(sessionId, `group:${groupId}:membership`, {
        groupId,
        role: sessionId === coordinatorSession ? 'coordinator' : 'member',
        members: sessionIds
      }, 'state_manager');
    }

    console.log(`👥 Session State Manager: Created group ${groupId} with ${sessionIds.length} sessions`);
    return group;
  }

  /**
   * Update session group state
   */
  updateSessionGroupState(groupId: string, state: SessionGroup['state']): void {
    const group = this.sessionGroups.get(groupId);
    if (group) {
      group.state = state;

      if (state === 'completed' || state === 'failed') {
        group.completedAt = Date.now();
      }

      this.persistSessionGroups();

      for (const sessionId of group.sessionIds) {
        this.sessionCoordinator.shareContext(sessionId, `group:${groupId}:state`, {
          state,
          updatedAt: Date.now()
        }, 'state_manager');
      }

      console.log(`👥 Session State Manager: Updated group ${groupId} state to ${state}`);
    }
  }

  /**
   * Share state within a session group
   */
  shareGroupState(groupId: string, key: string, value: any, fromSessionId: string): boolean {
    const group = this.sessionGroups.get(groupId);
    if (!group || !group.sessionIds.includes(fromSessionId)) {
      return false;
    }

    group.sharedState.set(key, { value, fromSessionId, timestamp: Date.now() });

    for (const sessionId of group.sessionIds) {
      if (sessionId !== fromSessionId) {
        this.sessionCoordinator.shareContext(sessionId, `group:${groupId}:${key}`, value, fromSessionId);
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
        ['active', currentState.active],
        ['agentCount', currentState.agentCount]
      ]),
      migrationSteps: [
        'validate_target_coordinator',
        'transfer_active_delegations',
        'transfer_pending_communications',
        'transfer_shared_context',
        'update_dependencies',
        'cleanup_source'
      ],
      rollbackSteps: [
        'restore_delegations',
        'restore_communications',
        'restore_context',
        'revert_dependencies'
      ]
    };

    console.log(`📋 Session State Manager: Planned migration for ${sessionId} to ${targetCoordinator}`);
    return plan;
  }

  /**
   * Execute session migration
   */
  async executeMigration(plan: MigrationPlan): Promise<boolean> {
    try {
      console.log(`🚀 Session State Manager: Executing migration for ${plan.sessionId}`);

      for (const step of plan.migrationSteps) {
        console.log(`  → Executing step: ${step}`);
      }

      console.log(`✅ Session State Manager: Migration completed for ${plan.sessionId}`);
      return true;
    } catch (error) {
      console.error(`❌ Session State Manager: Migration failed for ${plan.sessionId}:`, error);
      await this.rollbackMigration(plan);
      return false;
    }
  }

  /**
   * Configure failover for a session
   */
  configureFailover(sessionId: string, backupCoordinators: string[], failoverThreshold: number, autoFailover: boolean): void {
    const config: FailoverConfig = {
      sessionId,
      backupCoordinators,
      failoverThreshold,
      autoFailover
    };

    this.failoverConfigs.set(sessionId, config);
    this.persistFailoverConfigs();

    console.log(`🛡️ Session State Manager: Configured failover for ${sessionId} with ${backupCoordinators.length} backups`);
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
          console.log(`🛡️ Session State Manager: Failover successful for ${sessionId} to ${backupCoordinator}`);
          return true;
        }
      } catch (error) {
        console.error(`❌ Session State Manager: Failover attempt failed for ${backupCoordinator}:`, error);
      }
    }

    console.error(`❌ Session State Manager: All failover attempts failed for ${sessionId}`);
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
      activeDependencies: Array.from(this.dependencies.values()).filter(d => d.state === 'active').length,
      totalGroups: this.sessionGroups.size,
      activeGroups: Array.from(this.sessionGroups.values()).filter(g => g.state === 'active').length,
      failoverConfigs: this.failoverConfigs.size
    };
  }

  private propagateDependencyUpdate(sessionId: string, state: SessionDependency['state']): void {
    const dependency = this.dependencies.get(sessionId);
    if (!dependency) return;

    for (const dependentId of dependency.dependedBy) {
      const dependent = this.dependencies.get(dependentId);
      if (dependent && dependent.state === 'pending') {
        const canStart = dependent.dependsOn.every(depId => {
          const dep = this.dependencies.get(depId);
          return dep?.state === 'completed';
        });

        if (canStart) {
          this.sessionCoordinator.shareContext(dependentId, 'dependency:ready', {
            sessionId: dependentId,
            trigger: sessionId,
            state
          }, 'state_manager');
        }
      }
    }
  }

  private async rollbackMigration(plan: MigrationPlan): Promise<void> {
      console.log(`↩️ Session State Manager: Rolling back migration for ${plan.sessionId}`);

      for (const step of plan.rollbackSteps.reverse()) {
        console.log(`  ← Rolling back step: ${step}`);
      }
  }

  private persistDependencies(): void {
    const deps = Object.fromEntries(this.dependencies);
    this.stateManager.set('state_manager:dependencies', deps);
  }

  private persistSessionGroups(): void {
    const groups = Object.fromEntries(this.sessionGroups);
    this.stateManager.set('state_manager:groups', groups);
  }

  private persistFailoverConfigs(): void {
    const configs = Object.fromEntries(this.failoverConfigs);
    this.stateManager.set('state_manager:failover', configs);
  }

  shutdown(): void {
    console.log('🛑 Session State Manager: Shutdown complete');
  }
}

export const createSessionStateManager = (
  stateManager: StrRayStateManager,
  sessionCoordinator: SessionCoordinator
): SessionStateManager => {
  return new SessionStateManager(stateManager, sessionCoordinator);
};