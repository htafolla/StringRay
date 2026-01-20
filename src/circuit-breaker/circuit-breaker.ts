/**
 * StringRay AI v1.1.1 - Circuit Breaker Pattern Implementation
 *
 * Enterprise-grade circuit breaker pattern for distributed systems with failure
 * thresholds, recovery mechanisms, and graceful degradation.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { EventEmitter } from "events";

export enum CircuitState {
  CLOSED = "closed", // Normal operation
  OPEN = "open", // Circuit is open, failing fast
  HALF_OPEN = "half_open", // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  recoveryTimeout: number; // Time in ms before attempting recovery
  monitoringPeriod: number; // Time window in ms for failure counting
  successThreshold: number; // Number of successes needed in half-open state
  timeout: number; // Request timeout in ms
  name: string; // Circuit breaker name for logging
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  timeouts: number;
  totalRequests: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}

export interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  executionTime: number;
  circuitState: CircuitState;
}

/**
 * Circuit Breaker Pattern Implementation
 */
export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private timeouts: number = 0;
  private totalRequests: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private nextAttemptTime: number = 0;
  private config: CircuitBreakerConfig;
  private failureWindow: number[] = []; // Timestamps of recent failures

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    super();

    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 60000, // 1 minute
      successThreshold: 3,
      timeout: 30000, // 30 seconds
      name: "default-circuit-breaker",
      ...config,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<CircuitBreakerResult<T>> {
    const startTime = Date.now();
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        // Circuit is open, fail fast
        const result: CircuitBreakerResult<T> = {
          success: false,
          error: new Error(`Circuit breaker is OPEN for ${this.config.name}`),
          executionTime: Date.now() - startTime,
          circuitState: this.state,
        };

        this.emit("callRejected", result);
        return result;
      } else {
        // Time to try half-open
        this.state = CircuitState.HALF_OPEN;
        this.emit("stateChanged", CircuitState.HALF_OPEN);
      }
    }

    try {
      // Execute the operation with timeout
      const result = await this.executeWithTimeout(operation);

      // Success
      this.onSuccess();
      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        circuitState: this.state,
      };
    } catch (error) {
      // Failure
      const circuitResult = this.onFailure(error as Error);
      circuitResult.executionTime = Date.now() - startTime;

      // Try fallback if provided
      if (fallback && !circuitResult.success) {
        try {
          const fallbackResult = await fallback();
          return {
            success: true,
            data: fallbackResult,
            executionTime: Date.now() - startTime,
            circuitState: this.state,
          };
        } catch (fallbackError) {
          // Fallback also failed
          this.emit("fallbackFailed", fallbackError);
        }
      }

      return circuitResult;
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.timeouts++;
        reject(new Error(`Operation timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);

      operation()
        .then((result) => {
          clearTimeout(timeoutId);
          this.successes++;
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          this.failures++;
          reject(error);
        });
    });
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;

    // Clean old failures from window
    this.cleanFailureWindow();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        // Recovery successful
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.consecutiveFailures = 0;
        this.emit("stateChanged", CircuitState.CLOSED);
        console.log(
          `🔄 Circuit Breaker ${this.config.name}: CLOSED (recovered)`,
        );
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset consecutive failures on success
      this.consecutiveFailures = 0;
    }

    this.emit("success");
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: Error): CircuitBreakerResult<any> {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;

    // Add to failure window
    this.failureWindow.push(Date.now());
    this.cleanFailureWindow();

    const result: CircuitBreakerResult<any> = {
      success: false,
      error,
      executionTime: 0, // Will be set by caller
      circuitState: this.state,
    };

    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED) {
      const recentFailures = this.failureWindow.length;

      if (recentFailures >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
        this.emit("stateChanged", CircuitState.OPEN);
        console.log(
          `🔴 Circuit Breaker ${this.config.name}: OPEN (failure threshold exceeded)`,
        );
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Failed in half-open state, go back to open
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      this.emit("stateChanged", CircuitState.OPEN);
      console.log(
        `🔴 Circuit Breaker ${this.config.name}: OPEN (half-open failure)`,
      );
    }

    this.emit("failure", result);
    return result;
  }

  /**
   * Clean old failures from monitoring window
   */
  private cleanFailureWindow(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.failureWindow = this.failureWindow.filter((time) => time > cutoff);
  }

  /**
   * Manually trip the circuit breaker
   */
  trip(): void {
    if (this.state !== CircuitState.OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      this.emit("stateChanged", CircuitState.OPEN);
      console.log(
        `🔴 Circuit Breaker ${this.config.name}: OPEN (manually tripped)`,
      );
    }
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    if (this.state !== CircuitState.CLOSED) {
      this.state = CircuitState.CLOSED;
      this.failures = 0;
      this.consecutiveFailures = 0;
      this.consecutiveSuccesses = 0;
      this.failureWindow = [];
      this.emit("stateChanged", CircuitState.CLOSED);
      console.log(
        `🟢 Circuit Breaker ${this.config.name}: CLOSED (manually reset)`,
      );
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      timeouts: this.timeouts,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses,
    };
  }

  /**
   * Get circuit breaker state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Check if circuit breaker is allowing calls
   */
  canExecute(): boolean {
    return (
      this.state === CircuitState.CLOSED ||
      this.state === CircuitState.HALF_OPEN ||
      (this.state === CircuitState.OPEN && Date.now() >= this.nextAttemptTime)
    );
  }

  /**
   * Get time until next attempt (when circuit is open)
   */
  getTimeToNextAttempt(): number {
    if (this.state !== CircuitState.OPEN) return 0;
    return Math.max(0, this.nextAttemptTime - Date.now());
  }
}

/**
 * Distributed Circuit Breaker Registry
 * Manages multiple circuit breakers for different services
 */
export class CircuitBreakerRegistry extends EventEmitter {
  private breakers = new Map<string, CircuitBreaker>();
  private globalConfig: Partial<CircuitBreakerConfig>;

  constructor(globalConfig: Partial<CircuitBreakerConfig> = {}) {
    super();
    this.globalConfig = globalConfig;
  }

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(
    serviceName: string,
    config?: Partial<CircuitBreakerConfig>,
  ): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const breakerConfig = {
        ...this.globalConfig,
        ...config,
        name: serviceName,
      };

      const breaker = new CircuitBreaker(breakerConfig);

      // Forward events
      breaker.on("stateChanged", (state) =>
        this.emit("breakerStateChanged", serviceName, state),
      );
      breaker.on("success", () => this.emit("breakerSuccess", serviceName));
      breaker.on("failure", (result) =>
        this.emit("breakerFailure", serviceName, result),
      );
      breaker.on("callRejected", (result) =>
        this.emit("breakerCallRejected", serviceName, result),
      );

      this.breakers.set(serviceName, breaker);
    }

    return this.breakers.get(serviceName)!;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>,
  ): Promise<CircuitBreakerResult<T>> {
    const breaker = this.getBreaker(serviceName, config);
    return breaker.execute(operation, fallback);
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }

    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Trip all circuit breakers
   */
  tripAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.trip();
    }
  }

  /**
   * Get circuit breaker names
   */
  getBreakerNames(): string[] {
    return Array.from(this.breakers.keys());
  }

  /**
   * Remove a circuit breaker
   */
  removeBreaker(serviceName: string): boolean {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.removeAllListeners();
      this.breakers.delete(serviceName);
      return true;
    }
    return false;
  }
}

// Factory functions
export const createCircuitBreaker = (
  config: Partial<CircuitBreakerConfig> = {},
): CircuitBreaker => {
  return new CircuitBreaker(config);
};

export const createCircuitBreakerRegistry = (
  config: Partial<CircuitBreakerConfig> = {},
): CircuitBreakerRegistry => {
  return new CircuitBreakerRegistry(config);
};
