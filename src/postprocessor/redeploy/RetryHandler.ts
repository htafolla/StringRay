/**
 * Retry Handler for Redeploy Operations
 */

export class RetryHandler {
  constructor(private config: { maxRetries: number; baseDelay: number; backoffStrategy: 'linear' | 'exponential' } = {
    maxRetries: 3,
    baseDelay: 30000,
    backoffStrategy: 'exponential'
  }) {}

  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    shouldRetry?: (error: any, attempt: number) => boolean
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on the last attempt
        if (attempt === this.config.maxRetries) {
          break;
        }

        // Check if we should retry this error
        if (shouldRetry && !shouldRetry(error, attempt)) {
          break;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt);
        console.log(`⏳ Operation failed (attempt ${attempt + 1}), retrying in ${delay}ms...`);
        await this.wait(delay);
      }
    }

    throw lastError;
  }

  /**
   * Calculate delay based on backoff strategy
   */
  private calculateDelay(attempt: number): number {
    const { baseDelay, backoffStrategy } = this.config;

    switch (backoffStrategy) {
      case 'exponential':
        return baseDelay * Math.pow(2, attempt);

      case 'linear':
        return baseDelay * (attempt + 1);

      default:
        return baseDelay;
    }
  }

  /**
   * Wait for the specified duration
   */
  private async wait(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  /**
   * Default retry conditions for deployment operations
   */
  static shouldRetryDeployment(error: any, attempt: number): boolean {
    // Don't retry certain types of errors
    const nonRetryableErrors = [
      'authentication_failed',
      'authorization_failed',
      'invalid_configuration',
      'quota_exceeded'
    ];

    if (nonRetryableErrors.some(type => error.type?.includes(type))) {
      return false;
    }

    // Don't retry after too many attempts for transient errors
    if (attempt >= 2 && error.type === 'transient') {
      return false;
    }

    // Retry network and timeout errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }

    // Retry 5xx HTTP errors
    if (error.statusCode >= 500 && error.statusCode < 600) {
      return true;
    }

    // Default: retry for most errors
    return true;
  }

  /**
   * Specialized retry handler for deployment operations
   */
  async executeDeploymentWithRetry<T>(
    deploymentOperation: () => Promise<T>
  ): Promise<T> {
    return this.executeWithRetry(
      deploymentOperation,
      RetryHandler.shouldRetryDeployment
    );
  }

  /**
   * Specialized retry handler for API calls
   */
  async executeApiCallWithRetry<T>(
    apiCall: () => Promise<T>
  ): Promise<T> {
    return this.executeWithRetry(
      apiCall,
      (error, attempt) => {
        // Retry on network errors and 5xx status codes
        return error.code === 'ECONNRESET' ||
               error.code === 'ETIMEDOUT' ||
               (error.statusCode >= 500 && error.statusCode < 600);
      }
    );
  }

  /**
   * Get retry statistics
   */
  getStats(): { maxRetries: number; baseDelay: number; backoffStrategy: string } {
    return { ...this.config };
  }
}