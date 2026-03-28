/**
 * Integration Base Types
 *
 * Common TypeScript interfaces for StringRay integrations.
 * Provides a standardized foundation for all integration types.
 *
 * @version 1.0.0
 * @since 2026-03-15
 */

import type { EventEmitter } from "events";

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Log levels for integration logging
 */
export type LogLevel = "error" | "warn" | "info" | "debug";

/**
 * Integration configuration options
 */
export interface IntegrationConfig {
  /** Whether the integration is enabled */
  enabled: boolean;
  /** Enable debug mode for additional logging */
  debug: boolean;
  /** Log level for the integration */
  logLevel: LogLevel;
  /** Optional custom configuration options */
  custom?: Record<string, unknown>;
}

/**
 * Default integration configuration
 */
export const DEFAULT_INTEGRATION_CONFIG: IntegrationConfig = {
  enabled: true,
  debug: false,
  logLevel: "info",
};

// ============================================================================
// Status Types
// ============================================================================

/**
 * Integration lifecycle status
 */
export type IntegrationStatus = 
  | "uninitialized" 
  | "initializing" 
  | "initialized" 
  | "error" 
  | "shutting-down" 
  | "shutdown";

/**
 * Health check result
 */
export interface HealthResult {
  /** Whether the integration is healthy */
  healthy: boolean;
  /** Human-readable message describing the health status */
  message: string;
  /** Optional additional details about the health status */
  details?: Record<string, unknown>;
}

/**
 * Default healthy result
 */
export const HEALTHY_RESULT: HealthResult = {
  healthy: true,
  message: "Integration is healthy",
};

/**
 * Default unhealthy result
 */
export function createUnhealthyResult(message: string, details?: Record<string, unknown>): HealthResult {
  return {
    healthy: false,
    message,
    details,
  };
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Base integration statistics
 */
export interface IntegrationStats {
  /** Time since initialization in milliseconds */
  uptime: number;
  /** Number of errors encountered */
  errors: number;
  /** Optional custom statistics */
  custom?: Record<string, unknown>;
}

/**
 * Creates a default integration stats object
 */
export function createIntegrationStats(): IntegrationStats {
  return {
    uptime: 0,
    errors: 0,
  };
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Base integration events
 */
export type IntegrationEventType =
  | "initialized"
  | "initializing"
  | "shutdown"
  | "shutting-down"
  | "error"
  | "health-check"
  | "stats-updated"
  | "config-updated";

/**
 * Integration event payload
 */
export interface IntegrationEvent<T = unknown> {
  /** Event type */
  type: IntegrationEventType;
  /** Timestamp when the event occurred */
  timestamp: number;
  /** Event data */
  data?: T;
  /** Optional error if event represents an error */
  error?: Error;
}

// ============================================================================
// Interface Types
// ============================================================================

/**
 * Integration interface
 * All StringRay integrations must implement this interface
 */
export interface IIntegration {
  /** Unique name of the integration */
  readonly name: string;
  /** Version of the integration */
  readonly version: string;
  /** Current lifecycle status */
  readonly status: IntegrationStatus;

  /**
   * Initialize the integration with optional configuration
   * @param config - Optional partial configuration to merge with defaults
   */
  initialize(config?: Partial<IntegrationConfig>): Promise<void>;

  /**
   * Gracefully shutdown the integration
   * Should clean up resources and close connections
   */
  shutdown(): Promise<void>;

  /**
   * Perform a health check
   * @returns Promise resolving to health result
   */
  healthCheck(): Promise<HealthResult>;

  /**
   * Get current integration statistics
   * @returns Current stats object
   */
  getStats(): IntegrationStats;
}

/**
 * Extended integration interface with event support
 */
export interface IEventedIntegration extends IIntegration {
  /** Get the event emitter for this integration */
  getEventEmitter(): EventEmitter;
}

// ============================================================================
// Factory Types
// ============================================================================

/**
 * Integration factory function type
 */
export type IntegrationFactory<T extends IIntegration = IIntegration> = (
  config?: Partial<IntegrationConfig>,
) => T;

/**
 * Integration constructor type
 */
export type IntegrationConstructor<T extends IIntegration = IIntegration> = new (
  config?: Partial<IntegrationConfig>,
) => T;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error class for integration errors
 */
export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "IntegrationError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when integration is not initialized
 */
export class IntegrationNotInitializedError extends IntegrationError {
  constructor(integrationName: string) {
    super(
      `Integration '${integrationName}' is not initialized. Call initialize() first.`,
      "NOT_INITIALIZED",
      false,
      { integrationName },
    );
    this.name = "IntegrationNotInitializedError";
  }
}

/**
 * Error thrown when integration is already initialized
 */
export class IntegrationAlreadyInitializedError extends IntegrationError {
  constructor(integrationName: string) {
    super(
      `Integration '${integrationName}' is already initialized.`,
      "ALREADY_INITIALIZED",
      false,
      { integrationName },
    );
    this.name = "IntegrationAlreadyInitializedError";
  }
}

/**
 * Error thrown during integration initialization
 */
export class IntegrationInitializationError extends IntegrationError {
  constructor(integrationName: string, originalError: Error) {
    super(
      `Failed to initialize integration '${integrationName}': ${originalError.message}`,
      "INITIALIZATION_FAILED",
      true,
      { integrationName, originalError: originalError.message },
    );
    this.name = "IntegrationInitializationError";
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard to check if an object is an integration
 */
export function isIntegration(value: unknown): value is IIntegration {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "version" in value &&
    "status" in value &&
    "initialize" in value &&
    "shutdown" in value &&
    "healthCheck" in value &&
    "getStats" in value
  );
}

/**
 * Type guard to check if an object is a health result
 */
export function isHealthy(result: HealthResult): boolean {
  return result.healthy === true;
}
