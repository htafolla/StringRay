/**
 * Inference Governance Integration
 *
 * Integrates chrono-warp-drive Dynamo governance endpoint for external
 * inference checking in governance decision-making.
 *
 * @version 1.0.0
 * @since 2026-05-11
 */

import { BaseIntegration } from '../base/index.js';
import type {
  GovernanceIntegrationConfig,
  GovernanceCheckRequest,
  GovernanceCheckResponse,
  GovernanceVoteResult,
  BatchGovernanceCheck,
} from './types.js';
import { DEFAULT_GOVERNANCE_CONFIG } from './types.js';
import { GovernanceClient } from './governance-client.js';
import type { InferenceProposal } from '../../inference/inference-cycle.js';
import { frameworkLogger } from '../../core/framework-logger.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Main Governance Integration class
 * 
 * Provides external governance checking for inference proposals via the
 * chrono-warp-drive Dynamo /governance endpoint.
 */
export class InferenceGovernanceIntegration extends BaseIntegration {
  private client: GovernanceClient | null = null;
  private configData: GovernanceIntegrationConfig = DEFAULT_GOVERNANCE_CONFIG;

  constructor() {
    super('inference-governance', '1.0.0', { 
      enabled: false, 
      debug: false, 
      logLevel: 'info' 
    });
  }

  /**
   * Perform integration-specific initialization
   */
  protected async performInitialization(): Promise<void> {
    await this.loadConfig();

    if (!this.configData.enabled) {
      await this.log('info', 'Governance integration disabled in configuration');
      return;
    }

    await this.log('info', 'Initializing governance client...');

    this.client = new GovernanceClient({
      baseUrl: this.configData.endpointUrl.replace('/governance', ''),
      timeoutMs: this.configData.requestTimeoutMs,
    });

    await this.log('success', 'Governance client initialized', {
      endpoint: this.configData.endpointUrl,
      timeout: this.configData.requestTimeoutMs,
    });
  }

  /**
   * Perform integration-specific shutdown
   */
  protected async performShutdown(): Promise<void> {
    await this.log('info', 'Shutting down governance integration');
    this.client = null;
  }

  /**
   * Perform health check
   */
  protected async performHealthCheck(): Promise<{ 
    healthy: boolean; 
    message: string; 
    details?: Record<string, unknown> 
  }> {
    if (!this.client) {
      return {
        healthy: false,
        message: 'Governance client not initialized',
      };
    }

    const stats = this.client.getStats();
    
    // Healthy if we have no recent errors
    const isHealthy = stats.errors === 0 || stats.requestsSucceeded > stats.errors;

    return {
      healthy: isHealthy,
      message: isHealthy 
        ? 'Governance client healthy' 
        : 'Governance client has errors',
      details: {
        requestsTotal: stats.requestsTotal,
        requestsSucceeded: stats.requestsSucceeded,
        requestsFailed: stats.requestsFailed,
        errors: stats.errors,
        averageResponseTimeMs: stats.averageResponseTimeMs,
      },
    };
  }

  /**
   * Check if governance is enabled and available
   */
  isAvailable(): boolean {
    return this.configData.enabled && this.client !== null && this.status === 'initialized';
  }

  /**
   * Check a single inference proposal with external governance
   */
  async checkProposal(
    proposal: InferenceProposal,
    agentReviews: string[] = [],
    historicalIds: string[] = [],
  ): Promise<GovernanceVoteResult> {
    if (!this.isAvailable()) {
      throw new Error('Governance integration not available');
    }

    const request: GovernanceCheckRequest = {
      proposalId: proposal.id,
      proposalText: `${proposal.title}\n\n${proposal.description}`,
      agentReviews,
      historicalSignalIds: historicalIds,
    };

    const response = await this.client!.checkProposal(request);
    return this.applyDecisionLogic(response);
  }

  /**
   * Check multiple proposals with external governance
   */
  async checkProposals(
    proposals: InferenceProposal[],
    agentReviews: string[] = [],
    historicalIds: string[] = [],
  ): Promise<BatchGovernanceCheck> {
    if (!this.isAvailable()) {
      throw new Error('Governance integration not available');
    }

    const batchId = `governance-batch-${Date.now()}`;
    const timestamp = Date.now();

    frameworkLogger.log(
      'inference-governance',
      'batch-check-start',
      'info',
      { batchId, proposalCount: proposals.length },
    );

    const results: GovernanceVoteResult[] = [];

    for (const proposal of proposals) {
      try {
        const result = await this.checkProposal(proposal, agentReviews, historicalIds);
        results.push(result);
      } catch (error) {
        frameworkLogger.log(
          'inference-governance',
          'check-proposal-error',
          'warning',
          {
            proposalId: proposal.id,
            error: error instanceof Error ? error.message : String(error),
          },
        );
        
        // Fallback to local decision
        results.push(this.createFallbackVote(proposal));
      }
    }

    frameworkLogger.log(
      'inference-governance',
      'batch-check-complete',
      'info',
      {
        batchId,
        proposalCount: proposals.length,
        passedCount: results.filter(r => r.passed).length,
      },
    );

    return {
      proposals,
      results,
      batchId,
      timestamp,
    };
  }

  /**
   * Apply decision logic based on governance response
   */
  private applyDecisionLogic(response: GovernanceCheckResponse): GovernanceVoteResult {
    const { decisionLogic } = this.configData;
    
    let vote: 'YES' | 'NO' | 'ABSTAIN';
    let passed: boolean;

    switch (response.recommendation) {
      case 'PASS':
        vote = 'YES';
        passed = true;
        break;
      
      case 'REJECT':
        vote = 'NO';
        passed = false;
        break;
      
      case 'NEEDS_REVISION':
      default:
        vote = 'ABSTAIN';
        passed = false;
        break;
    }

    // Calculate weighted vote
    const weight = response.voteWeight * decisionLogic.voteWeightMultiplier;

    // Build reason string
    const reason = [
      `Governance ${response.recommendation} (confidence: ${(response.confidence * 100).toFixed(1)}%)`,
      ...response.reasons.slice(0, 2), // Include up to 2 reasons
    ].join('; ');

    return {
      vote,
      weight,
      reason,
      governanceResponse: response,
      passed,
    };
  }

  /**
   * Create fallback vote when governance is unavailable
   */
  private createFallbackVote(proposal: InferenceProposal): GovernanceVoteResult {
    return {
      vote: proposal.confidence >= 0.7 ? 'YES' : 'ABSTAIN',
      weight: 1.0,
      reason: 'Fallback: governance endpoint unavailable',
      governanceResponse: {
        success: false,
        proposalId: proposal.id,
        governanceIsotopeId: 'fallback',
        resonanceScore: 0,
        isotopicRatio: 0,
        vortexVolume: 0,
        historicalCoherence: 0,
        recommendation: 'NEEDS_REVISION',
        confidence: proposal.confidence,
        voteWeight: 1.0,
        reasons: ['Governance endpoint unavailable, using local confidence'],
      },
      passed: proposal.confidence >= 0.7,
    };
  }

  /**
   * Load configuration from features.json
   */
  private async loadConfig(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), '.opencode', 'strray', 'features.json');
      
      if (!fs.existsSync(configPath)) {
        await this.log('warning', 'features.json not found, using defaults');
        return;
      }

      const content = fs.readFileSync(configPath, 'utf-8');
      const features = JSON.parse(content);

      if (features.inference_governance) {
        this.configData = {
          ...DEFAULT_GOVERNANCE_CONFIG,
          enabled: features.inference_governance.enabled ?? false,
          endpointUrl: features.inference_governance.endpoint_url ?? DEFAULT_GOVERNANCE_CONFIG.endpointUrl,
          requestTimeoutMs: features.inference_governance.request_timeout_ms ?? DEFAULT_GOVERNANCE_CONFIG.requestTimeoutMs,
          minConfidenceThreshold: features.inference_governance.min_confidence_threshold ?? DEFAULT_GOVERNANCE_CONFIG.minConfidenceThreshold,
          decisionLogic: {
            passConfidenceMin: features.inference_governance.decision_logic?.pass_confidence_min ?? DEFAULT_GOVERNANCE_CONFIG.decisionLogic.passConfidenceMin,
            revisionConfidenceMax: features.inference_governance.decision_logic?.revision_confidence_max ?? DEFAULT_GOVERNANCE_CONFIG.decisionLogic.revisionConfidenceMax,
            voteWeightMultiplier: features.inference_governance.decision_logic?.vote_weight_multiplier ?? DEFAULT_GOVERNANCE_CONFIG.decisionLogic.voteWeightMultiplier,
          },
        };
      }

      await this.log('info', 'Configuration loaded', {
        enabled: this.configData.enabled,
        endpoint: this.configData.endpointUrl,
      });
    } catch (error) {
      await this.log('error', 'Failed to load configuration', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Use defaults on error
      this.configData = DEFAULT_GOVERNANCE_CONFIG;
    }
  }

  /**
   * Get governance-specific configuration
   */
  getGovernanceConfig(): GovernanceIntegrationConfig {
    return { ...this.configData };
  }

  /**
   * Get client statistics
   */
  getClientStats() {
    return this.client?.getStats() ?? {
      requestsTotal: 0,
      requestsSucceeded: 0,
      requestsFailed: 0,
      averageResponseTimeMs: 0,
      errors: 0,
    };
  }
}

// ============================================================================
// Global Integration Instance
// ============================================================================

let globalIntegration: InferenceGovernanceIntegration | null = null;

/**
 * Initialize the global governance integration
 */
export async function initializeGovernanceIntegration(): Promise<InferenceGovernanceIntegration> {
  if (globalIntegration) {
    return globalIntegration;
  }

  globalIntegration = new InferenceGovernanceIntegration();
  await globalIntegration.initialize();
  return globalIntegration;
}

/**
 * Get the global governance integration
 */
export function getGovernanceIntegration(): InferenceGovernanceIntegration | null {
  return globalIntegration;
}

/**
 * Shutdown the global governance integration
 */
export async function shutdownGovernanceIntegration(): Promise<void> {
  if (globalIntegration) {
    await globalIntegration.shutdown();
    globalIntegration = null;
  }
}

// ============================================================================
// Exports
// ============================================================================

export * from './types.js';
export * from './governance-client.js';
