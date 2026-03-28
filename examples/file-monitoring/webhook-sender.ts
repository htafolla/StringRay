/**
 * Generic Webhook Sender for File Monitoring
 *
 * A production-ready webhook sender that can be configured
 * for any webhook endpoint. Supports batching,
 * rate limiting, exponential backoff retry, and circuit breaker.
 *
 * @version 1.0.0
 * @since 2026-03-13
 */

import * as crypto from 'crypto';
import pLimit from 'p-limit';

/**
 * File operation event schema
 */
export interface FileEvent {
  eventId: string;
  timestamp: number;
  operation: 'read' | 'write' | 'edit' | 'create' | 'delete';
  filePath: string;
  fileSize?: number;
  fileHash?: string;
  sessionId?: string;
  agent?: string;
  toolName?: string;
  contentSnippet?: string;
  lineNumbers?: {
    start: number;
    end: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Webhook sender configuration
 */
export interface WebhookSenderConfig {
  url: string;
  apiKey?: string;
  secret?: string;
  batchSize?: number;
  retryAttempts?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
  timeoutMs?: number;
}

/**
 * Circuit breaker state
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Generic webhook sender class
 */
export class WebhookSender {
  private config: WebhookSenderConfig;
  private eventQueue: FileEvent[] = [];
  private minuteBuckets = new Map<number, number>();
  private hourBuckets = new Map<number, number>();
  private rateLimiter: pLimit.Limit;
  private circuitState: CircuitState = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private flushTimeout?: NodeJS.Timeout;

  constructor(config: WebhookSenderConfig) {
    this.config = {
      batchSize: 10,
      retryAttempts: 5,
      initialRetryDelay: 1000,
      maxRetryDelay: 30000,
      rateLimitPerMinute: 60,
      rateLimitPerHour: 1000,
      timeoutMs: 30000,
      ...config,
    };

    this.rateLimiter = pLimit(this.config.rateLimitPerMinute || 60);
  }

  /**
   * Track a file operation event
   */
  async trackEvent(event: FileEvent): Promise<void> {
    this.eventQueue.push(event);

    // Flush if batch is ready
    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      await this.flush();
    } else {
      // Schedule flush if not already scheduled
      if (!this.flushTimeout) {
        this.flushTimeout = setTimeout(() => this.flush(), 5000);
      }
    }
  }

  /**
   * Track multiple file operation events
   */
  async trackEvents(events: FileEvent[]): Promise<void> {
    this.eventQueue.push(...events);
    await this.flush();
  }

  /**
   * Flush queued events to webhook
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout);
        this.flushTimeout = undefined;
      }
      return;
    }

    const batch = {
      events: [...this.eventQueue],
      batchId: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    this.eventQueue = [];

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = undefined;
    }

    try {
      await this.rateLimiter(() => this.sendBatch(batch));
    } catch (error) {
      console.error('Failed to send file event batch:', error);
      // Re-queue for retry
      this.eventQueue.unshift(...batch.events);
      throw error;
    }
  }

  /**
   * Send batch of events to webhook
   */
  private async sendBatch(batch: { events: FileEvent[]; batchId: string; timestamp: number }): Promise<void> {
    if (!this.canAttempt()) {
      throw new Error('Circuit breaker is open');
    }

    const payload = JSON.stringify(batch);
    const signature = this.config.secret
      ? this.generateSignature(payload)
      : undefined;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'StringRay-FileMonitor/1.0.0',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
          ...(signature && { 'X-Webhook-Signature': signature }),
        },
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const isRetryable = this.isRetryableStatus(response.status);

        if (!isRetryable) {
          this.recordFailure();
          throw new Error(`Non-retryable error: HTTP ${response.status}`);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.recordSuccess();
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof Error && error.name === 'AbortError') {
        this.recordFailure();
        throw new Error(`Request timeout after ${this.config.timeoutMs}ms`);
      }

      // Check if error is retryable
      if (!this.isRetryableError(error)) {
        this.recordFailure();
        throw error;
      }

      // Retry logic is handled by caller via retryAttempts
      throw error;
    }
  }

  /**
   * Send with exponential backoff retry
   */
  async sendWithRetry(event: FileEvent): Promise<void> {
    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        await this.trackEvent(event);
        return;
      } catch (error) {
        const isLastAttempt = attempt === this.config.retryAttempts!;

        if (isLastAttempt) {
          console.error(`Max retries reached for event: ${event.eventId}`, error);
          throw error;
        }

        const delay = this.calculateRetryDelay(attempt);
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Check if request is retryable based on status code
   */
  private isRetryableStatus(status: number): boolean {
    // 5xx errors are retryable
    if (status >= 500) return true;
    // 429 is rate limit - retryable
    if (status === 429) return true;
    // 4xx errors are not retryable
    return false;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors are retryable
      if (error.message.includes('ECONNREFUSED')) return true;
      if (error.message.includes('ETIMEDOUT')) return true;
      if (error.message.includes('ENOTFOUND')) return true;
      if (error.message.includes('ECONNRESET')) return true;
      if (error.message.includes('timeout')) return true;

      // HTTP errors
      const httpError = error as any;
      if (httpError.status && typeof httpError.status === 'number') {
        return this.isRetryableStatus(httpError.status);
      }
    }

    return false;
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(payload: string): string {
    const hmac = crypto.createHmac('sha256', this.config.secret!);
    const timestamp = Math.floor(Date.now() / 1000);
    hmac.update(`${timestamp}.${payload}`);
    return `t=${timestamp},v1=${hmac.digest('hex')}`;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.initialRetryDelay!;
    const multiplier = Math.pow(2, attempt - 1);
    const delay = baseDelay * multiplier;
    const maxDelay = this.config.maxRetryDelay!;
    return Math.min(delay, maxDelay);
  }

  /**
   * Check if circuit breaker allows attempts
   */
  private canAttempt(): boolean {
    if (this.circuitState === 'open') {
      const resetTime = this.lastFailureTime + 60000; // 1 minute
      if (Date.now() > resetTime) {
        this.circuitState = 'half-open';
        return true;
      }
      return false;
    }
    return true;
  }

  /**
   * Record successful request
   */
  private recordSuccess(): void {
    this.failures = 0;
    this.circuitState = 'closed';
  }

  /**
   * Record failed request
   */
  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= 5) {
      this.circuitState = 'open';
      console.warn('Circuit breaker opened due to repeated failures');
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Get current statistics
   */
  getStats(): {
    queueSize: number;
    circuitState: CircuitState;
    failures: number;
  } {
    return {
      queueSize: this.eventQueue.length,
      circuitState: this.circuitState,
      failures: this.failures,
    };
  }

  /**
   * Shutdown the sender
   */
  shutdown(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = undefined;
    }

    // Flush remaining events
    if (this.eventQueue.length > 0) {
      this.flush().catch(console.error);
    }
  }
}

/**
 * Create webhook sender instance
 */
export function createWebhookSender(config: WebhookSenderConfig): WebhookSender {
  return new WebhookSender(config);
}

/**
 * Convenience function to create from environment variables
 */
export function createWebhookSenderFromEnv(): WebhookSender | null {
  const url = process.env.WEBHOOK_URL;
  if (!url) return null;

  return new WebhookSender({
    url,
    apiKey: process.env.WEBHOOK_API_KEY,
    secret: process.env.WEBHOOK_SECRET,
    batchSize: parseInt(process.env.WEBHOOK_BATCH_SIZE || '10'),
    retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '5'),
    rateLimitPerMinute: parseInt(process.env.WEBHOOK_RATE_LIMIT_MINUTE || '60'),
  });
}
