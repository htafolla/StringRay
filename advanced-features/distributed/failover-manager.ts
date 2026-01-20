/**
 * StringRay AI v1.1.1 - Distributed Failover Manager
 *
 * Enterprise-grade failover mechanisms with automatic instance recovery,
 * state synchronization, and zero-downtime failovers for multi-instance deployments.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { EventEmitter } from "events";
import { DistributedStateManager, InstanceHealth } from "./state-manager";
import { BackendInstance } from "./load-balancer";

export interface FailoverConfig {
  enableAutoFailover: boolean;
  failoverTimeout: number;
  maxFailoverAttempts: number;
  healthCheckGracePeriod: number;
  stateSyncTimeout: number;
  backupInstanceCount: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface FailoverEvent {
  type:
    | "instance_failure"
    | "failover_started"
    | "failover_completed"
    | "failover_failed"
    | "recovery_started"
    | "recovery_completed";
  instanceId: string;
  timestamp: number;
  details?: any;
}

export interface CircuitBreakerState {
  instanceId: string;
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

/**
 * Distributed Failover Manager - Handles instance failures and recovery
 */
export class DistributedFailoverManager extends EventEmitter {
  private config: FailoverConfig;
  private stateManager: DistributedStateManager;
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private failoverHistory: FailoverEvent[] = [];
  private recoveryTimers = new Map<string, NodeJS.Timeout>();
  private healthCheckTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    config: Partial<FailoverConfig> = {},
    stateManager: DistributedStateManager,
  ) {
    super();

    this.config = {
      enableAutoFailover: true,
      failoverTimeout: 30000,
      maxFailoverAttempts: 3,
      healthCheckGracePeriod: 10000,
      stateSyncTimeout: 15000,
      backupInstanceCount: 2,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      ...config,
    };

    this.stateManager = stateManager;
    this.initializeFailoverManager();
  }

  private async initializeFailoverManager(): Promise<void> {
    // Watch for instance health changes
    this.watchInstanceHealth();

    // Start circuit breaker monitoring
    this.startCircuitBreakerMonitoring();

    console.log(
      `🛡️ Failover Manager: Initialized with auto-failover ${this.config.enableAutoFailover ? "enabled" : "disabled"}`,
    );
  }

  /**
   * Handle instance failure
   */
  async handleInstanceFailure(
    instanceId: string,
    reason: string,
  ): Promise<void> {
    console.log(
      `❌ Failover Manager: Instance failure detected: ${instanceId} (${reason})`,
    );

    const event: FailoverEvent = {
      type: "instance_failure",
      instanceId,
      timestamp: Date.now(),
      details: { reason },
    };

    this.failoverHistory.push(event);
    this.emit("instanceFailure", event);

    // Update circuit breaker
    this.updateCircuitBreaker(instanceId, true);

    // Trigger failover if enabled
    if (this.config.enableAutoFailover) {
      await this.initiateFailover(instanceId);
    }
  }

  /**
   * Initiate failover for failed instance
   */
  private async initiateFailover(failedInstanceId: string): Promise<void> {
    const event: FailoverEvent = {
      type: "failover_started",
      instanceId: failedInstanceId,
      timestamp: Date.now(),
    };

    this.failoverHistory.push(event);
    this.emit("failoverStarted", event);

    try {
      // Find backup instances
      const backupInstances = await this.findBackupInstances(failedInstanceId);

      if (backupInstances.length === 0) {
        throw new Error("No backup instances available");
      }

      // Attempt failover to first available backup
      for (const backupInstance of backupInstances) {
        try {
          const success = await this.attemptFailover(
            failedInstanceId,
            backupInstance,
          );
          if (success) {
            const successEvent: FailoverEvent = {
              type: "failover_completed",
              instanceId: failedInstanceId,
              timestamp: Date.now(),
              details: { backupInstance: backupInstance.id },
            };

            this.failoverHistory.push(successEvent);
            this.emit("failoverCompleted", successEvent);
            return;
          }
        } catch (error) {
          console.error(
            `❌ Failover Manager: Failover attempt failed for ${backupInstance.id}:`,
            error,
          );
        }
      }

      // All failover attempts failed
      throw new Error("All failover attempts failed");
    } catch (error) {
      console.error(
        `❌ Failover Manager: Failover failed for ${failedInstanceId}:`,
        error,
      );

      const failEvent: FailoverEvent = {
        type: "failover_failed",
        instanceId: failedInstanceId,
        timestamp: Date.now(),
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };

      this.failoverHistory.push(failEvent);
      this.emit("failoverFailed", failEvent);
    }
  }

  /**
   * Attempt failover to specific backup instance
   */
  private async attemptFailover(
    failedInstanceId: string,
    backupInstance: BackendInstance,
  ): Promise<boolean> {
    try {
      // Check if backup instance is healthy
      if (!(await this.isInstanceHealthy(backupInstance.id))) {
        return false;
      }

      // Synchronize state from failed instance
      const stateTransferred = await this.synchronizeInstanceState(
        failedInstanceId,
        backupInstance.id,
      );

      if (!stateTransferred) {
        console.warn(
          `⚠️ Failover Manager: State synchronization failed for ${backupInstance.id}`,
        );
      }

      // Transfer active sessions
      await this.transferActiveSessions(failedInstanceId, backupInstance.id);

      // Update routing
      await this.updateRoutingTables(failedInstanceId, backupInstance.id);

      // Mark failover as successful
      await this.stateManager.set(
        `failover:${failedInstanceId}:active`,
        backupInstance.id,
      );

      console.log(
        `✅ Failover Manager: Successfully failed over ${failedInstanceId} to ${backupInstance.id}`,
      );
      return true;
    } catch (error) {
      console.error(`❌ Failover Manager: Failover attempt failed:`, error);
      return false;
    }
  }

  /**
   * Handle instance recovery
   */
  async handleInstanceRecovery(instanceId: string): Promise<void> {
    console.log(
      `🔄 Failover Manager: Instance recovery detected: ${instanceId}`,
    );

    const event: FailoverEvent = {
      type: "recovery_started",
      instanceId,
      timestamp: Date.now(),
    };

    this.failoverHistory.push(event);
    this.emit("recoveryStarted", event);

    try {
      // Wait for health check grace period
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.healthCheckGracePeriod),
      );

      // Verify instance is stable
      if (!(await this.verifyInstanceStability(instanceId))) {
        throw new Error("Instance failed stability check");
      }

      // Synchronize state back to recovered instance
      const backupInstanceId = await this.stateManager.get<string>(
        `failover:${instanceId}:active`,
      );

      if (backupInstanceId) {
        await this.synchronizeInstanceState(backupInstanceId, instanceId);
        await this.transferActiveSessions(backupInstanceId, instanceId);
        await this.updateRoutingTables(backupInstanceId, instanceId);

        // Clear failover state
        await this.stateManager.delete(`failover:${instanceId}:active`);
      }

      // Reset circuit breaker
      this.updateCircuitBreaker(instanceId, false);

      const recoveryEvent: FailoverEvent = {
        type: "recovery_completed",
        instanceId,
        timestamp: Date.now(),
      };

      this.failoverHistory.push(recoveryEvent);
      this.emit("recoveryCompleted", recoveryEvent);

      console.log(
        `✅ Failover Manager: Instance recovery completed: ${instanceId}`,
      );
    } catch (error) {
      console.error(
        `❌ Failover Manager: Instance recovery failed: ${instanceId}:`,
        error,
      );
    }
  }

  /**
   * Find suitable backup instances
   */
  private async findBackupInstances(
    failedInstanceId: string,
  ): Promise<BackendInstance[]> {
    const allInstances = await this.stateManager.getActiveInstances();

    // Filter healthy instances excluding the failed one
    const healthyInstances = allInstances
      .filter(
        (instance) =>
          instance.instanceId !== failedInstanceId &&
          instance.status === "healthy" &&
          this.isCircuitBreakerClosed(instance.instanceId),
      )
      .sort((a, b) => a.loadFactor - b.loadFactor) // Sort by load (lowest first)
      .slice(0, this.config.backupInstanceCount);

    // Convert to BackendInstance format
    return healthyInstances.map((instance) => ({
      id: instance.instanceId,
      host: this.extractHostFromInstanceId(instance.instanceId),
      port: 3000, // Default port
      weight: 1,
      healthy: true,
      connections: 0,
      lastHealthCheck: instance.lastHeartbeat,
      responseTime: 0,
      failureCount: 0,
    }));
  }

  /**
   * Synchronize state between instances
   */
  private async synchronizeInstanceState(
    fromInstanceId: string,
    toInstanceId: string,
  ): Promise<boolean> {
    try {
      // Get all state keys for the source instance
      const stateKeys = await this.getInstanceStateKeys(fromInstanceId);

      // Transfer state in batches
      const batchSize = 10;
      for (let i = 0; i < stateKeys.length; i += batchSize) {
        const batch = stateKeys.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (key) => {
            const value = await this.stateManager.get(
              key.replace(fromInstanceId, ""),
            );
            if (value !== undefined) {
              const newKey = key.replace(fromInstanceId, toInstanceId);
              await this.stateManager.set(newKey, value);
            }
          }),
        );
      }

      console.log(
        `🔄 Failover Manager: Synchronized ${stateKeys.length} state keys from ${fromInstanceId} to ${toInstanceId}`,
      );
      return true;
    } catch (error) {
      console.error(
        `❌ Failover Manager: State synchronization failed:`,
        error,
      );
      return false;
    }
  }

  /**
   * Transfer active sessions to backup instance
   */
  private async transferActiveSessions(
    fromInstanceId: string,
    toInstanceId: string,
  ): Promise<void> {
    // This would integrate with session management system
    // For now, notify via distributed state
    await this.stateManager.set(`session:transfer:${fromInstanceId}`, {
      toInstance: toInstanceId,
      timestamp: Date.now(),
    });

    console.log(
      `🔄 Failover Manager: Initiated session transfer from ${fromInstanceId} to ${toInstanceId}`,
    );
  }

  /**
   * Update routing tables after failover
   */
  private async updateRoutingTables(
    oldInstanceId: string,
    newInstanceId: string,
  ): Promise<void> {
    await this.stateManager.set(
      `routing:${oldInstanceId}:redirect`,
      newInstanceId,
    );
    await this.stateManager.set(`routing:${newInstanceId}:active`, true);

    console.log(
      `🔄 Failover Manager: Updated routing tables: ${oldInstanceId} → ${newInstanceId}`,
    );
  }

  /**
   * Circuit breaker management
   */
  private updateCircuitBreaker(instanceId: string, hadFailure: boolean): void {
    let breaker = this.circuitBreakers.get(instanceId);

    if (!breaker) {
      breaker = {
        instanceId,
        state: "closed",
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
      };
      this.circuitBreakers.set(instanceId, breaker);
    }

    if (hadFailure) {
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();

      if (breaker.failureCount >= this.config.circuitBreakerThreshold) {
        breaker.state = "open";
        breaker.nextAttemptTime =
          Date.now() + this.config.circuitBreakerTimeout;
        console.log(
          `🔴 Circuit Breaker: Opened for ${instanceId} (${breaker.failureCount} failures)`,
        );
      }
    } else {
      // Success - reset failure count
      breaker.failureCount = 0;
      breaker.state = "closed";
      console.log(`🟢 Circuit Breaker: Closed for ${instanceId}`);
    }
  }

  private isCircuitBreakerClosed(instanceId: string): boolean {
    const breaker = this.circuitBreakers.get(instanceId);
    if (!breaker) return true;

    if (breaker.state === "open" && Date.now() > breaker.nextAttemptTime) {
      // Try half-open state
      breaker.state = "half-open";
      return true;
    }

    return breaker.state === "closed" || breaker.state === "half-open";
  }

  private startCircuitBreakerMonitoring(): void {
    setInterval(() => {
      const now = Date.now();

      for (const [instanceId, breaker] of this.circuitBreakers) {
        if (breaker.state === "half-open" && now > breaker.nextAttemptTime) {
          // Reset to closed after successful half-open attempt
          breaker.state = "closed";
          breaker.failureCount = 0;
          console.log(`🟡 Circuit Breaker: Reset to closed for ${instanceId}`);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Watch for instance health changes
   */
  private watchInstanceHealth(): void {
    // Watch for health status changes
    this.stateManager.watch(
      "health:changed",
      async (healthData: InstanceHealth) => {
        if (healthData.status === "failed") {
          await this.handleInstanceFailure(
            healthData.instanceId,
            "Health check failed",
          );
        } else if (healthData.status === "healthy") {
          // Check if this was a recovery
          const wasFailed = await this.stateManager.get(
            `failover:${healthData.instanceId}:active`,
          );
          if (wasFailed) {
            await this.handleInstanceRecovery(healthData.instanceId);
          }
        }
      },
    );
  }

  /**
   * Check if instance is healthy
   */
  private async isInstanceHealthy(instanceId: string): Promise<boolean> {
    try {
      const health = await this.stateManager.get<InstanceHealth>(
        `health:${instanceId}`,
      );
      return health?.status === "healthy" || false;
    } catch {
      return false;
    }
  }

  /**
   * Verify instance stability after recovery
   */
  private async verifyInstanceStability(instanceId: string): Promise<boolean> {
    // Perform multiple health checks over time
    const checks = 3;
    const interval = 2000;

    for (let i = 0; i < checks; i++) {
      if (!(await this.isInstanceHealthy(instanceId))) {
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return true;
  }

  private extractHostFromInstanceId(instanceId: string): string {
    // Extract host from instance ID (simplified)
    return "localhost";
  }

  private async getInstanceStateKeys(instanceId: string): Promise<string[]> {
    // This would query Redis for all keys matching the instance pattern
    // For now, return empty array
    return [];
  }

  /**
   * Get failover statistics
   */
  getFailoverStats(): {
    totalFailovers: number;
    successfulFailovers: number;
    failedFailovers: number;
    activeFailovers: number;
    circuitBreakersOpen: number;
  } {
    const failovers = this.failoverHistory.filter(
      (e) => e.type === "failover_completed",
    );
    const failed = this.failoverHistory.filter(
      (e) => e.type === "failover_failed",
    );
    const active = this.failoverHistory.filter(
      (e) =>
        e.type === "failover_started" &&
        !this.failoverHistory.some(
          (fe) =>
            (fe.type === "failover_completed" ||
              fe.type === "failover_failed") &&
            fe.instanceId === e.instanceId &&
            fe.timestamp > e.timestamp,
        ),
    );

    const openBreakers = Array.from(this.circuitBreakers.values()).filter(
      (b) => b.state === "open",
    ).length;

    return {
      totalFailovers: failovers.length + failed.length,
      successfulFailovers: failovers.length,
      failedFailovers: failed.length,
      activeFailovers: active.length,
      circuitBreakersOpen: openBreakers,
    };
  }

  /**
   * Get failover history
   */
  getFailoverHistory(limit = 50): FailoverEvent[] {
    return this.failoverHistory.slice(-limit);
  }

  /**
   * Shutdown failover manager
   */
  async shutdown(): Promise<void> {
    // Clear all timers
    for (const timer of this.recoveryTimers.values()) {
      clearTimeout(timer);
    }
    for (const timer of this.healthCheckTimers.values()) {
      clearTimeout(timer);
    }

    this.recoveryTimers.clear();
    this.healthCheckTimers.clear();

    console.log("🛑 Failover Manager: Shutdown complete");
  }
}

// Factory function
export const createDistributedFailoverManager = (
  config: Partial<FailoverConfig> = {},
  stateManager: DistributedStateManager,
): DistributedFailoverManager => {
  return new DistributedFailoverManager(config, stateManager);
};
