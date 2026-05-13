/**
 * Governance HTTP Client
 *
 * Client for calling the chrono-warp-drive Dynamo governance endpoint.
 * Handles HTTP requests, retries, and response validation.
 *
 * @version 1.0.0
 * @since 2026-05-11
 */

import type {
  GovernanceCheckRequest,
  GovernanceCheckResponse,
  GovernanceClientConfig,
  GovernanceClientStats,
} from './types.js';
import {
  GovernanceError,
  GovernanceErrorCode,
  GovernanceTimeoutError,
  GovernanceNetworkError,
} from './types.js';
import { frameworkLogger } from '../../core/framework-logger.js';

/**
 * HTTP client for governance endpoint
 */
export class GovernanceClient {
  private config: GovernanceClientConfig;
  private stats: GovernanceClientStats;

  constructor(config: Partial<GovernanceClientConfig> = {}) {
    this.config = {
      baseUrl: 'https://mcp-production-80e2.up.railway.app',
      timeoutMs: 10000,
      retryAttempts: 3,
      retryDelayMs: 1000,
      ...config,
    };
    this.stats = {
      requestsTotal: 0,
      requestsSucceeded: 0,
      requestsFailed: 0,
      averageResponseTimeMs: 0,
      errors: 0,
    };
  }

  /**
   * Check a single proposal with the governance endpoint
   */
  async checkProposal(
    request: GovernanceCheckRequest,
  ): Promise<GovernanceCheckResponse> {
    const startTime = Date.now();
    this.stats.requestsTotal++;

    const url = `${this.config.baseUrl}/governance`;

    frameworkLogger.log(
      'governance-client',
      'check-proposal-start',
      'info',
      {
        proposalId: request.proposalId,
        url,
      },
    );

    try {
      const response = await this.makeRequest(url, request);
      
      const duration = Date.now() - startTime;
      this.updateResponseTime(duration);
      this.stats.requestsSucceeded++;
      this.stats.lastRequestAt = Date.now();

      frameworkLogger.log(
        'governance-client',
        'check-proposal-success',
        'info',
        {
          proposalId: request.proposalId,
          recommendation: response.recommendation,
          confidence: response.confidence,
          durationMs: duration,
        },
      );

      return response;
    } catch (error) {
      this.stats.requestsFailed++;
      this.stats.errors++;

      frameworkLogger.log(
        'governance-client',
        'check-proposal-error',
        'error',
        {
          proposalId: request.proposalId,
          error: error instanceof Error ? error.message : String(error),
        },
      );

      throw error;
    }
  }

  /**
   * Check multiple proposals in batch
   */
  async checkProposals(
    requests: GovernanceCheckRequest[],
  ): Promise<GovernanceCheckResponse[]> {
    frameworkLogger.log(
      'governance-client',
      'batch-check-start',
      'info',
      { count: requests.length },
    );

    const results: GovernanceCheckResponse[] = [];
    
    // Process sequentially to avoid overwhelming the endpoint
    for (const request of requests) {
      try {
        const result = await this.checkProposal(request);
        results.push(result);
      } catch (error) {
        frameworkLogger.log(
          'governance-client',
          'batch-check-item-error',
          'warning',
          {
            proposalId: request.proposalId,
            error: error instanceof Error ? error.message : String(error),
          },
        );
        // Continue with other proposals even if one fails
      }
    }

    frameworkLogger.log(
      'governance-client',
      'batch-check-complete',
      'info',
      {
        requested: requests.length,
        succeeded: results.length,
        failed: requests.length - results.length,
      },
    );

    return results;
  }

  /**
   * Make HTTP request with retries
   */
  private async makeRequest(
    url: string,
    body: GovernanceCheckRequest,
  ): Promise<GovernanceCheckResponse> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < (this.config.retryAttempts || 1); attempt++) {
      try {
        return await this.doRequest(url, body);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on client errors (4xx)
        if (error instanceof GovernanceError && !error.recoverable) {
          throw error;
        }

        // Wait before retry
        if (attempt < (this.config.retryAttempts || 1) - 1) {
          await this.delay(this.config.retryDelayMs || 1000);
        }
      }
    }

    throw lastError || new GovernanceError(
      'All retry attempts failed',
      GovernanceErrorCode.REQUEST_FAILED,
      false,
    );
  }

  /**
   * Perform single HTTP request
   */
  private async doRequest(
    url: string,
    body: GovernanceCheckRequest,
  ): Promise<GovernanceCheckResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new GovernanceError(
          `HTTP ${response.status}: ${response.statusText}`,
          GovernanceErrorCode.REQUEST_FAILED,
          response.status >= 500, // Retry on server errors
          { status: response.status, statusText: response.statusText },
        );
      }

      const data = await response.json() as GovernanceCheckResponse;
      
      // Validate response structure
      if (!this.isValidResponse(data)) {
        throw new GovernanceError(
          'Invalid governance response structure',
          GovernanceErrorCode.INVALID_RESPONSE,
          false,
          { response: data },
        );
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof GovernanceError) {
        throw error;
      }

      // Handle fetch-specific errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new GovernanceTimeoutError(this.config.timeoutMs);
        }
        throw new GovernanceNetworkError(url, error);
      }

      throw new GovernanceError(
        String(error),
        GovernanceErrorCode.REQUEST_FAILED,
        true,
      );
    }
  }

  /**
   * Validate governance response structure
   */
  private isValidResponse(response: unknown): boolean {
    if (typeof response !== 'object' || response === null) return false;
    const r = response as Record<string, unknown>;
    
    return (
      typeof r.success === 'boolean' &&
      typeof r.proposalId === 'string' &&
      typeof r.governanceIsotopeId === 'string' &&
      typeof r.resonanceScore === 'number' &&
      typeof r.isotopicRatio === 'number' &&
      typeof r.vortexVolume === 'number' &&
      typeof r.historicalCoherence === 'number' &&
      typeof r.recommendation === 'string' &&
      ['PASS', 'NEEDS_REVISION', 'REJECT'].includes(r.recommendation) &&
      typeof r.confidence === 'number' &&
      typeof r.voteWeight === 'number' &&
      Array.isArray(r.reasons) &&
      r.reasons.every((r: unknown) => typeof r === 'string')
    );
  }

  /**
   * Update average response time
   */
  private updateResponseTime(durationMs: number): void {
    const total = this.stats.requestsSucceeded;
    this.stats.averageResponseTimeMs = 
      (this.stats.averageResponseTimeMs * (total - 1) + durationMs) / total;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get client statistics
   */
  getStats(): GovernanceClientStats {
    return { ...this.stats };
  }

  /**
   * Update client configuration
   */
  updateConfig(config: Partial<GovernanceClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      requestsTotal: 0,
      requestsSucceeded: 0,
      requestsFailed: 0,
      averageResponseTimeMs: 0,
      errors: 0,
    };
  }
}

/**
 * Create governance client with config from features.json
 */
export function createGovernanceClientFromConfig(): GovernanceClient {
  // Config will be loaded by the integration, this is a factory
  return new GovernanceClient();
}
