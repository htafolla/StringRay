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
  GovernanceCheckResponse,
  SolarGovernanceCheckRequest,
  SolarGovernanceCheckResponse,
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
   * Call any Dynamo MCP tool via call_connected_tool proxy
   */
  private async callTool(
    toolName: string,
    params: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const url = `${this.config.baseUrl}/call_connected_tool`;
    return this.makeJsonRequest(url, { tool_name: toolName, params });
  }

  /**
   * Check a proposal with solar-enhanced governance (govern_with_solar tool)
   *
   * Brings real-time solar context from NOAA GOES into governance decisions,
   * automatically adjusting vote weight and adding warnings based on current
   * solar activity (quiet / moderate / active / storm).
   */
  async governWithSolar(
    request: SolarGovernanceCheckRequest,
  ): Promise<SolarGovernanceCheckResponse> {
    const startTime = Date.now();
    this.stats.requestsTotal++;

    frameworkLogger.log(
      'governance-client',
      'solar-check-start',
      'info',
      {
        proposalPreview: request.proposal.slice(0, 80),
        baseVoteWeight: request.baseVoteWeight ?? 1.0,
      },
    );

    try {
      const raw = await this.callTool('govern_with_solar', {
        proposal: request.proposal,
        baseVoteWeight: request.baseVoteWeight ?? 1.0,
      });
      const result = raw.result as Record<string, unknown>;

      frameworkLogger.log(
        'governance-client',
        'solar-governance-raw',
        'debug',
        { rawResponse: JSON.stringify(raw) },
      );

      const response: SolarGovernanceCheckResponse = {
        originalRecommendation: result.originalRecommendation as string,
        solarContext: result.solarContext as SolarGovernanceCheckResponse['solarContext'],
        adjustedVoteWeight: result.adjustedVoteWeight as number,
        finalRecommendation: result.finalRecommendation as string,
        confidenceAdjustment: result.confidenceAdjustment as number,
      };

      if (!this.isValidSolarResponse(response)) {
        throw new GovernanceError(
          'Invalid solar governance response structure',
          GovernanceErrorCode.INVALID_RESPONSE,
          false,
          { response },
        );
      }

      const duration = Date.now() - startTime;
      this.updateResponseTime(duration);
      this.stats.requestsSucceeded++;
      this.stats.lastRequestAt = Date.now();

      frameworkLogger.log(
        'governance-client',
        'solar-check-success',
        'info',
        {
          solarActivityLevel: response.solarContext.solarActivityLevel,
          adjustedVoteWeight: response.adjustedVoteWeight,
          confidenceAdjustment: response.confidenceAdjustment,
          durationMs: duration,
        },
      );

      return response;
    } catch (error) {
      this.stats.requestsFailed++;
      this.stats.errors++;

      frameworkLogger.log(
        'governance-client',
        'solar-check-error',
        'error',
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );

      throw error;
    }
  }

  /**
   * Evaluate a proposal with standard governance (evaluate_governance tool)
   *
   * For purely technical or low-level protocol decisions where external
   * solar modifiers are undesired.
   */
  async evaluateGovernance(
    params: {
      proposalId: string;
      proposalText: string;
      agentReviews: string[];
      codeDiff?: string;
      historicalSignalIds?: string[];
    },
  ): Promise<GovernanceCheckResponse> {
    const startTime = Date.now();
    this.stats.requestsTotal++;

    frameworkLogger.log(
      'governance-client',
      'evaluate-start',
      'info',
      {
        proposalId: params.proposalId,
        proposalPreview: params.proposalText.slice(0, 80),
        agentReviewCount: params.agentReviews.length,
      },
    );

    try {
      const raw = await this.callTool('evaluate_governance', {
        proposalId: params.proposalId,
        proposalText: params.proposalText,
        agentReviews: params.agentReviews,
        ...(params.codeDiff ? { codeDiff: params.codeDiff } : {}),
        ...(params.historicalSignalIds ? { historicalSignalIds: params.historicalSignalIds } : {}),
      });
      const result = raw.result as Record<string, unknown>;

      const response: GovernanceCheckResponse = {
        success: true,
        proposalId: (result.proposalId as string) || '',
        governanceIsotopeId: (result.governanceIsotopeId as string) || `evaluate-${Date.now()}`,
        resonanceScore: (result.resonanceScore as number) ?? 0,
        isotopicRatio: (result.isotopicRatio as number) ?? 0,
        vortexVolume: (result.vortexVolume as number) ?? 0,
        historicalCoherence: (result.historicalCoherence as number) ?? 0,
        recommendation: result.recommendation as 'PASS' | 'NEEDS_REVISION' | 'REJECT',
        confidence: result.confidence as number,
        voteWeight: result.voteWeight as number,
        reasons: Array.isArray(result.reasons)
          ? (result.reasons as string[])
          : [result.reasoning as string].filter(Boolean),
      };

      if (!this.isValidResponse(response)) {
        throw new GovernanceError(
          'Invalid evaluate governance response structure',
          GovernanceErrorCode.INVALID_RESPONSE,
          false,
          { response },
        );
      }

      const duration = Date.now() - startTime;
      this.updateResponseTime(duration);
      this.stats.requestsSucceeded++;
      this.stats.lastRequestAt = Date.now();

      frameworkLogger.log(
        'governance-client',
        'evaluate-success',
        'info',
        {
          recommendation: response.recommendation,
          confidence: response.confidence,
          voteWeight: response.voteWeight,
          durationMs: duration,
        },
      );

      return response;
    } catch (error) {
      this.stats.requestsFailed++;
      this.stats.errors++;

      frameworkLogger.log(
        'governance-client',
        'evaluate-error',
        'error',
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );

      throw error;
    }
  }

  /**
   * Make HTTP request with retries and exponential backoff
   */
  private async makeJsonRequest(
    url: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < (this.config.retryAttempts || 1); attempt++) {
      try {
        return await this.doJsonRequest(url, body);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof GovernanceError && !error.recoverable) {
          throw error;
        }

        if (attempt < (this.config.retryAttempts || 1) - 1) {
          const delay = (this.config.retryDelayMs || 1000) * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new GovernanceError(
      'All request attempts failed',
      GovernanceErrorCode.REQUEST_FAILED,
      false,
    );
  }

  /**
   * Validate solar governance response structure with range checks
   */
  private isValidSolarResponse(response: unknown): boolean {
    if (typeof response !== 'object' || response === null) return false;
    const r = response as Record<string, unknown>;

    const hasSolarContext =
      typeof r.solarContext === 'object' && r.solarContext !== null;
    if (!hasSolarContext) return false;

    const sc = r.solarContext as Record<string, unknown>;
    const validLevels = ['quiet', 'moderate', 'active', 'storm'];

    return (
      typeof r.originalRecommendation === 'string' &&
      typeof sc.solarActivityLevel === 'string' &&
      validLevels.includes(sc.solarActivityLevel) &&
      (typeof sc.solarIsotopicResonance === 'number' ||
       typeof sc.solarResonance === 'number') &&
      typeof sc.solarActivityModifier === 'number' &&
      sc.solarActivityModifier >= -1 &&
      sc.solarActivityModifier <= 1 &&
      typeof sc.recommendation === 'string' &&
      typeof r.adjustedVoteWeight === 'number' &&
      r.adjustedVoteWeight >= 0.5 &&
      r.adjustedVoteWeight <= 1.5 &&
      typeof r.finalRecommendation === 'string' &&
      typeof r.confidenceAdjustment === 'number'
    );
  }

  private async doJsonRequest(
    url: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

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
          response.status >= 500,
          { status: response.status, statusText: response.statusText },
        );
      }

      return await response.json() as Record<string, unknown>;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof GovernanceError) throw error;

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
      typeof r.proposalId === 'string' &&
      typeof r.governanceIsotopeId === 'string' &&
      typeof r.resonanceScore === 'number' &&
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


