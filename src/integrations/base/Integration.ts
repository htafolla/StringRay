/**
 * Base Integration Class
 *
 * Abstract base class providing common lifecycle management, event emission,
 * configuration handling, and logging for all StringRay integrations.
 *
 * @version 1.0.0
 * @since 2026-03-15
 */

import { EventEmitter } from "events";
import {
  frameworkLogger,
  generateJobId,
} from "../../core/framework-logger.js";
import type { LogStatus } from "../../core/framework-logger.js";
import {
  type IntegrationConfig,
  type IntegrationStatus,
  type IntegrationStats,
  type HealthResult,
  type IntegrationEvent,
  type IntegrationEventType,
  type IIntegration,
  type IEventedIntegration,
  type LogLevel,
  DEFAULT_INTEGRATION_CONFIG,
  HEALTHY_RESULT,
  createIntegrationStats,
  createUnhealthyResult,
  IntegrationNotInitializedError,
  IntegrationAlreadyInitializedError,
  IntegrationInitializationError,
} from "./types.js";

/**
 * Abstract base class for all StringRay integrations
 *
 * Provides:
 * - Lifecycle management (initialize/shutdown)
 * - Configuration handling with defaults
 * - Event emission for integration events
 * - Common statistics tracking (uptime, errors)
 * - Logging integration with framework logger
 *
 * @example
 * ```typescript
 * class MyIntegration extends BaseIntegration {
 *   constructor() {
 *     super('my-integration', '1.0.0');
 *   }
 *
 *   protected async performInitialization(): Promise<void> {
 *     // Custom initialization logic
 *   }
 *
 *   protected async performShutdown(): Promise<void> {
 *     // Custom cleanup logic
 *   }
 *
 *   protected async performHealthCheck(): Promise<HealthResult> {
 *     return { healthy: true, message: 'OK' };
 *   }
 * }
 * ```
 */
export abstract class BaseIntegration
  extends EventEmitter
  implements IIntegration, IEventedIntegration
{
  /** Unique name of the integration */
  public readonly name: string;

  /** Version of the integration */
  public readonly version: string;

  /** Current lifecycle status */
  protected _status: IntegrationStatus = "uninitialized";

  /** Current configuration */
  protected config: IntegrationConfig;

  /** Statistics tracking */
  protected stats: IntegrationStats;

  /** Start time for uptime calculation */
  protected startTime: number = 0;

  /** Job ID for current operation */
  protected jobId: string;

  /**
   * Create a new base integration
   *
   * @param name - Unique name for this integration
   * @param version - Version string
   * @param initialConfig - Optional initial configuration
   */
  constructor(name: string, version: string, initialConfig?: Partial<IntegrationConfig>) {
    super();
    this.name = name;
    this.version = version;
    this.config = { ...DEFAULT_INTEGRATION_CONFIG, ...initialConfig };
    this.stats = createIntegrationStats();
    this.jobId = generateJobId(`integration-${name}`);
  }

  // ==========================================================================
  // IIntegration Implementation
  // ==========================================================================

  /**
   * Get current integration status (readonly accessor)
   */
  get status(): IntegrationStatus {
    return this._status;
  }

  /**
   * Initialize the integration
   *
   * Calls performInitialization() after setting up the base state.
   * Handles errors and emits appropriate events.
   *
   * @param config - Optional partial configuration to merge
   */
  async initialize(config?: Partial<IntegrationConfig>): Promise<void> {
    // Validate not already initialized
    if (this._status === "initialized" || this._status === "initializing") {
      throw new IntegrationAlreadyInitializedError(this.name);
    }

    // Merge configuration
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Generate new job ID for initialization
    this.jobId = generateJobId(`integration-${this.name}`);

    // Update status
    this._status = "initializing";
    this.emitEvent("initializing", { config: this.config });

    await this.log("info", `Initializing ${this.name} v${this.version}`);

    try {
      // Call subclass initialization
      await this.performInitialization();

      // Update status and stats
      this._status = "initialized";
      this.startTime = Date.now();
      this.stats = createIntegrationStats();

      this.emitEvent("initialized", { version: this.version });
      await this.log("success", `${this.name} initialized successfully`);
    } catch (error) {
      this._status = "error";
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await this.log("error", `Failed to initialize ${this.name}: ${errorMessage}`);
      
      this.emitEvent("error", { 
        error: errorMessage 
      }, error instanceof Error ? error : undefined);

      throw new IntegrationInitializationError(
        this.name,
        error instanceof Error ? error : new Error(errorMessage),
      );
    }
  }

  /**
   * Gracefully shutdown the integration
   *
   * Calls performShutdown() to clean up resources.
   *
   * @example
   * ```typescript
   * // Using await
   * await integration.shutdown();
   * ```
   */
  async shutdown(): Promise<void> {
    if (this._status === "shutdown" || this._status === "uninitialized") {
      return;
    }

    await this.log("info", `Shutting down ${this.name}...`);

    this._status = "shutting-down";
    this.emitEvent("shutting-down", {});

    try {
      // Call subclass shutdown
      await this.performShutdown();

      // Update status
      this._status = "shutdown";
      this.startTime = 0;

      this.emitEvent("shutdown", {});
      await this.log("success", `${this.name} shutdown complete`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await this.log("error", `Error during shutdown of ${this.name}: ${errorMessage}`);
      
      this.emitEvent("error", { 
        message: errorMessage,
        phase: "shutdown"
      }, error instanceof Error ? error : undefined);

      // Still mark as shutdown even if there was an error
      this._status = "shutdown";
    }
  }

  /**
   * Perform a health check
   *
   * Default implementation checks status and calls performHealthCheck().
   * Subclasses should override performHealthCheck() for custom checks.
   *
   * @returns Health result indicating integration health
   *
   * @example
   * ```typescript
   * const health = await integration.healthCheck();
   * if (!health.healthy) {
   *   console.error('Integration unhealthy:', health.message);
   * }
   * ```
   */
  async healthCheck(): Promise<HealthResult> {
    // Check if initialized
    if (this._status !== "initialized") {
      return createUnhealthyResult(
        `${this.name} is not initialized (status: ${this._status})`,
        { status: this._status },
      );
    }

    // Call subclass health check
    try {
      const result = await this.performHealthCheck();
      this.emitEvent("health-check", { healthy: result.healthy });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return createUnhealthyResult(`Health check failed: ${errorMessage}`, {
        error: errorMessage,
      });
    }
  }

  /**
   * Get current integration statistics
   *
   * Calculates uptime since initialization and includes error count.
   *
   * @returns Current stats object
   *
   * @example
   * ```typescript
   * const stats = integration.getStats();
   * console.log(`Uptime: ${stats.uptime}ms, Errors: ${stats.errors}`);
   * ```
   */
  getStats(): IntegrationStats {
    // Calculate uptime
    const uptime = this.startTime > 0 ? Date.now() - this.startTime : 0;

    return {
      ...this.stats,
      uptime,
    };
  }

  // ==========================================================================
  // IEventedIntegration Implementation
  // ==========================================================================

  /**
   * Get the event emitter for this integration
   *
   * Returns `this` since BaseIntegration extends EventEmitter.
   *
   * @returns The event emitter instance
   */
  getEventEmitter(): EventEmitter {
    return this;
  }

  // ==========================================================================
  // Protected Methods for Subclasses
  // ==========================================================================

  /**
   * Ensure the integration is initialized
   *
   * @throws IntegrationNotInitializedError if not initialized
   */
  protected ensureInitialized(): void {
    if (this._status !== "initialized") {
      throw new IntegrationNotInitializedError(this.name);
    }
  }

  /**
   * Record an error in statistics
   *
   * @param error - Optional error to record
   */
  protected recordError(error?: Error): void {
    this.stats.errors++;
    if (this.config.debug && error) {
      this.log("error", error.message).catch((e) => frameworkLogger.log("integration", "log-error-fallback", "error", { error: e }));
    }
  }

  /**
   * Update custom statistics
   *
   * @param customStats - Partial stats to merge
   */
  protected updateCustomStats(customStats: Record<string, unknown>): void {
    this.stats.custom = { ...this.stats.custom, ...customStats };
  }

  /**
   * Get current configuration
   *
   * @returns Current configuration object (copy)
   */
  protected getConfig(): IntegrationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   *
   * @param config - Partial configuration to merge
   */
  protected updateConfig(config: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...config };
    this.emitEvent("config-updated", { config: this.config });
  }

  // ==========================================================================
  // Logging
  // ==========================================================================

  /**
   * Log a message using the framework logger
   *
   * @param status - Log status level
   * @param message - Message to log
   * @param details - Optional details object
   */
  protected async log(
    status: LogStatus,
    message: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    // Only log if enabled and level is appropriate
    if (!this.config.enabled) {
      return;
    }

    const statusToLevel: Record<string, number> = {
      error: 0,
      warning: 1,
      warn: 1,
      info: 2,
      debug: 3,
      success: 2, // map success to info level
    };

    const currentLevel = statusToLevel[this.config.logLevel] ?? 2;
    const statusLevel = statusToLevel[status] ?? 2;

    // Skip if below log level
    if (statusLevel > currentLevel && status !== "success") {
      return;
    }

    // Map 'success' to 'info' for framework logger
    const loggerStatus = status === "success" ? "info" : status;

    try {
      await frameworkLogger.log(
        this.name,
        message,
        loggerStatus,
        {
          ...details,
          version: this.version,
          status: this._status,
          jobId: this.jobId,
        },
        this.jobId,
      );
    } catch {
      // Silent fail - logging should never break application
    }
  }

  // ==========================================================================
  // Event Emission
  // ==========================================================================

  /**
   * Emit a typed integration event
   *
   * @param type - Event type
   * @param data - Event data
   * @param error - Optional error
   */
  protected emitEvent(
    type: IntegrationEventType,
    data: Record<string, unknown> = {},
    error?: Error,
  ): void {
    const event: IntegrationEvent = {
      type,
      timestamp: Date.now(),
      data,
      error,
    };

    // Emit specific event
    this.emit(type, event);

    // Also emit generic 'any' event
    this.emit("event", event);
  }

  // ==========================================================================
  // Abstract Methods (must be implemented by subclasses)
  // ==========================================================================

  /**
   * Perform integration-specific initialization
   *
   * Called during initialize() after base setup.
   * Subclasses should implement custom initialization logic here.
   *
   * @example
   * ```typescript
   * protected async performInitialization(): Promise<void> {
   *   // Connect to external service
   *   await this.connect();
   *
   *   // Setup event handlers
   *   this.on('data', this.handleData);
   * }
   * ```
   */
  protected abstract performInitialization(): Promise<void>;

  /**
   * Perform integration-specific shutdown
   *
   * Called during shutdown() for cleanup.
   * Subclasses should implement cleanup logic here.
   *
   * @example
   * ```typescript
   * protected async performShutdown(): Promise<void> {
   *   // Remove event handlers
   *   this.off('data', this.handleData);
   *
   *   // Close connections
   *   await this.disconnect();
   * }
   * ```
   */
  protected abstract performShutdown(): Promise<void>;

  /**
   * Perform integration-specific health check
   *
   * Called by healthCheck() to determine integration health.
   * Subclasses should implement custom health checks here.
   *
   * @returns Health result
   *
   * @example
   * ```typescript
   * protected async performHealthCheck(): Promise<HealthResult> {
   *   const connected = await this.isConnected();
   *
   *   if (connected) {
   *     return { healthy: true, message: 'Connection active' };
   *   }
   *
   *   return { healthy: false, message: 'Not connected' };
   * }
   * ```
   */
  protected abstract performHealthCheck(): Promise<HealthResult>;

  // ==========================================================================
  // Static Methods
  // ==========================================================================

  /**
   * Check if an object is a BaseIntegration instance
   *
   * @param value - Value to check
   * @returns True if value is a BaseIntegration
   */
  static isBaseIntegration(value: unknown): value is BaseIntegration {
    return value instanceof BaseIntegration;
  }
}

/**
 * Create a simple integration with minimal implementation
 *
 * Useful for testing or simple integrations that don't need much logic.
 *
 * @param name - Integration name
 * @param version - Integration version
 * @param healthCheck - Custom health check function
 * @param shutdown - Custom shutdown function
 * @returns New integration instance
 *
 * @example
 * ```typescript
 * const simple = createSimpleIntegration(
 *   'simple',
 *   '1.0.0',
 *   async () => ({ healthy: true, message: 'OK' }),
 *   async () => {}
 * );
 *
 * await simple.initialize();
 * ```
 */
export function createSimpleIntegration(
  name: string,
  version: string,
  healthCheck: () => Promise<HealthResult>,
  shutdown: () => Promise<void> = async () => {},
): BaseIntegration {
  class SimpleIntegration extends BaseIntegration {
    protected async performInitialization(): Promise<void> {
      // No-op for simple integration
    }

    protected async performShutdown(): Promise<void> {
      await shutdown();
    }

    protected async performHealthCheck(): Promise<HealthResult> {
      return healthCheck();
    }
  }

  return new SimpleIntegration(name, version);
}

export type {
  IntegrationConfig,
  IntegrationStatus,
  IntegrationStats,
  HealthResult,
  IntegrationEvent,
  IntegrationEventType,
  IIntegration,
  IEventedIntegration,
  LogLevel,
};
