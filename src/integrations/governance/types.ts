/**
 * Inference Governance Integration Types
 *
 * Type definitions for the chrono-warp-drive Dynamo governance endpoint integration.
 * Provides external governance checking for inference-driven proposals.
 *
 * @version 1.0.0
 * @since 2026-05-11
 */

import type { InferenceProposal } from '../../inference/inference-cycle.js';

// ============================================================================
// Governance Request/Response Types (from chrono-warp-drive API)
// ============================================================================

/**
 * Governance check request payload
 * Matches the Dynamo /governance endpoint format
 */
export interface GovernanceCheckRequest {
  proposalId: string;
  proposalText: string;
  codeDiff?: string;
  agentReviews: string[];
  historicalSignalIds?: string[];
}

/**
 * Governance check response from Dynamo endpoint
 */
export interface GovernanceCheckResponse {
  success: boolean;
  proposalId: string;
  governanceIsotopeId: string;
  resonanceScore: number;
  isotopicRatio: number;
  vortexVolume: number;
  historicalCoherence: number;
  recommendation: 'PASS' | 'NEEDS_REVISION' | 'REJECT';
  confidence: number;
  voteWeight: number;
  reasons: string[];
}

// ============================================================================
// Integration Configuration Types
// ============================================================================

/**
 * Governance integration configuration
 */
export interface GovernanceIntegrationConfig {
  /** Whether the integration is enabled */
  enabled: boolean;
  /** Governance endpoint URL */
  endpointUrl: string;
  /** Request timeout in milliseconds */
  requestTimeoutMs: number;
  /** Minimum confidence threshold for proposals */
  minConfidenceThreshold: number;
  /** Decision logic configuration */
  decisionLogic: {
    /** Minimum confidence for PASS recommendation */
    passConfidenceMin: number;
    /** Maximum confidence for NEEDS_REVISION (below this is PASS, above is REJECT) */
    revisionConfidenceMax: number;
    /** Multiplier for vote weight from governance */
    voteWeightMultiplier: number;
  };
}

/**
 * Default governance configuration
 */
export const DEFAULT_GOVERNANCE_CONFIG: GovernanceIntegrationConfig = {
  enabled: false,
  endpointUrl: 'https://mcp-production-80e2.up.railway.app/governance',
  requestTimeoutMs: 10000,
  minConfidenceThreshold: 0.5,
  decisionLogic: {
    passConfidenceMin: 0.9,
    revisionConfidenceMax: 0.89,
    voteWeightMultiplier: 1.0,
  },
};

// ============================================================================
// Solar Governance Types (govern_with_solar tool)
// ============================================================================

/**
 * Solar activity levels from NOAA GOES data
 */
export type SolarActivityLevel = 'quiet' | 'moderate' | 'active' | 'storm';

/**
 * Solar context returned by govern_with_solar
 */
export interface SolarContext {
  /** Current solar activity level */
  solarActivityLevel: SolarActivityLevel;
  /** Solar isotopic resonance score (0-1) — canonical field */
  solarIsotopicResonance: number;
  /** Alias for backward compatibility */
  solarResonance?: number;
  /** Modifier applied to vote weight based on solar activity */
  solarActivityModifier: number;
  /** Human-readable recommendation based on solar conditions */
  recommendation: string;
}

/**
 * Solar-enhanced governance check request
 */
export interface SolarGovernanceCheckRequest {
  /** The proposal text to evaluate */
  proposal: string;
  /** Starting vote weight (0.5 - 1.5) */
  baseVoteWeight?: number;
}

/**
 * Solar-enhanced governance check response
 */
export interface SolarGovernanceCheckResponse {
  /** Original recommendation before solar adjustments */
  originalRecommendation: string;
  /** Real-time solar context from NOAA GOES */
  solarContext: SolarContext;
  /** Vote weight after solar adjustment */
  adjustedVoteWeight: number;
  /** Final recommendation with solar warning appended if applicable */
  finalRecommendation: string;
  /** Confidence adjustment applied due to solar activity */
  confidenceAdjustment: number;
  /** Trinitarium Moral Overlay — moral alignment score (0-1) */
trinitariumMoralScore?: number | undefined;
  moralTension?: 'Aligned' | 'Mild' | 'Significant' | 'Critical' | undefined;
  trinitariumGematriaFusion?: number | undefined;
  detectedVirtues?: string[] | undefined;
  detectedConcerns?: string[] | undefined;
}

/**
 * Solar-enhanced vote result — extends standard vote with solar context
 */
export interface SolarGovernanceVoteResult extends GovernanceVoteResult {
  /** Solar context that influenced the decision */
  solarContext: SolarContext;
  /** Confidence adjustment from solar activity */
  solarConfidenceAdjustment: number;
}

// ============================================================================
// Governance Vote Types
// ============================================================================

/**
 * Governance vote result after applying decision logic
 */
export interface GovernanceVoteResult {
  /** Final vote decision */
  vote: 'YES' | 'NO' | 'ABSTAIN';
  /** Vote weight (affected by governance confidence) */
  weight: number;
  /** Human-readable reason for the vote */
  reason: string;
  /** Raw governance response for audit trail */
  governanceResponse: GovernanceCheckResponse;
  /** Whether the proposal passed governance */
  passed: boolean;
  /** Moral-Numerological Tension from Trinitarium Moral Overlay */
moralTension?: 'Aligned' | 'Mild' | 'Significant' | 'Critical' | undefined;
  moralScore?: number | undefined;
  moralFusion?: number | undefined;
  detectedVirtues?: string[] | undefined;
  detectedConcerns?: string[] | undefined;
}

/**
 * Batch governance check for multiple proposals
 */
export interface BatchGovernanceCheck {
  proposals: InferenceProposal[];
  results: GovernanceVoteResult[];
  batchId: string;
  timestamp: number;
}

// ============================================================================
// Client Types
// ============================================================================

/**
 * HTTP client configuration
 */
export interface GovernanceClientConfig {
  baseUrl: string;
  timeoutMs: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * Client statistics
 */
export interface GovernanceClientStats {
  requestsTotal: number;
  requestsSucceeded: number;
  requestsFailed: number;
  averageResponseTimeMs: number;
  lastRequestAt?: number;
  errors: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Governance error codes
 */
export enum GovernanceErrorCode {
  REQUEST_FAILED = 'REQUEST_FAILED',
  TIMEOUT = 'TIMEOUT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFIG_INVALID = 'CONFIG_INVALID',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
}

/**
 * Base governance error
 */
export class GovernanceError extends Error {
  constructor(
    message: string,
    public code: GovernanceErrorCode,
    public recoverable: boolean,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'GovernanceError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Request timeout error
 */
export class GovernanceTimeoutError extends GovernanceError {
  constructor(timeoutMs: number) {
    super(
      `Governance request timed out after ${timeoutMs}ms`,
      GovernanceErrorCode.TIMEOUT,
      true,
      { timeoutMs },
    );
    this.name = 'GovernanceTimeoutError';
  }
}

/**
 * Network error
 */
export class GovernanceNetworkError extends GovernanceError {
  constructor(url: string, originalError: Error) {
    super(
      `Network error calling governance endpoint: ${originalError.message}`,
      GovernanceErrorCode.NETWORK_ERROR,
      true,
      { url, originalError: originalError.message },
    );
    this.name = 'GovernanceNetworkError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard for valid governance response
 */
export function isValidGovernanceResponse(response: unknown): response is GovernanceCheckResponse {
  if (typeof response !== 'object' || response === null) return false;
  const r = response as Record<string, unknown>;
  return (
    typeof r.success === 'boolean' &&
    typeof r.proposalId === 'string' &&
    typeof r.governanceIsotopeId === 'string' &&
    typeof r.recommendation === 'string' &&
    ['PASS', 'NEEDS_REVISION', 'REJECT'].includes(r.recommendation) &&
    typeof r.confidence === 'number' &&
    typeof r.voteWeight === 'number'
  );
}

/**
 * Type guard for governance error
 */
export function isGovernanceError(error: unknown): error is GovernanceError {
  return (
    error instanceof GovernanceError ||
    (error instanceof Error && error.name === 'GovernanceError')
  );
}
