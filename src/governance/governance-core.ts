/**
 * Pure governance decision logic.
 * This module contains the PHI/TAU matrix and merging rules.
 * It has no side effects and does not call any MCPs.
 *
 * This is the shared "pure logic" that both the Governance MCP
 * and any HTTP deployment (Vercel) can use.
 */

import type { GovernanceProposal, GovernanceVote, GovernanceResult } from './governance-types.js';

// Blurrn constants (from chrono-warp-drive)
const PHI = 1.666;
const TAU = 0.865;

export interface DecisionMatrixInput {
  resonance: number;
  isotopicRatio: number;
  vortexVolume?: number;
  historicalCoherence?: number;
  solarActivity?: 'quiet' | 'moderate' | 'active' | 'storm';
}

export interface DecisionMatrixOutput {
  recommendation: 'PASS' | 'NEEDS_REVISION' | 'REJECT';
  confidence: number;
  voteWeight: number;
  reasons: string[];
}

/**
 * The core PHI/TAU decision matrix.
 * Extracted so it can be shared between local MCP and deployed HTTP versions.
 */
export function applyDecisionMatrix(input: DecisionMatrixInput): DecisionMatrixOutput {
  const {
    resonance,
    isotopicRatio,
    vortexVolume = Number.MAX_SAFE_INTEGER, // large default so the low-mass check only triggers on explicit small values
    historicalCoherence = 0.8,
    solarActivity = 'quiet',
  } = input;

  const reasons: string[] = [];
  let recommendation: DecisionMatrixOutput['recommendation'] = 'NEEDS_REVISION';
  let confidence = 0.75;
  let voteWeight = 1.0;

  if (resonance >= 0.92 && isotopicRatio >= 0.95) {
    recommendation = 'PASS';
    confidence = 0.97;
    voteWeight = 1.4;
    reasons.push('High symbiotic resonance (PHI-aligned)');
  } else if (resonance >= 0.82 && isotopicRatio >= 0.88) {
    recommendation = 'PASS';
    confidence = 0.89;
    voteWeight = 1.15;
    reasons.push('Solid alignment above TAU threshold');
  } else if (resonance < 0.75 || isotopicRatio < 0.80) {
    recommendation = 'REJECT';
    confidence = 0.84;
    reasons.push('Signal below critical threshold (1 - TAU)');
  } else {
    reasons.push('Moderate resonance - requires refinement');
  }

  if (vortexVolume < 2.5e25) {
    reasons.push('Low inertial mass (W x M = V)');
    if (recommendation === 'PASS') recommendation = 'NEEDS_REVISION';
  }

  if (historicalCoherence < 0.70) {
    reasons.push('Weak historical alignment with past decisions');
    if (recommendation === 'PASS') recommendation = 'NEEDS_REVISION';
  } else if (historicalCoherence > 0.90) {
    reasons.push('Strong continuity with previous governance');
    voteWeight *= 1.1;
  }

  // Solar adjustment (from chrono-warp-drive)
  if (solarActivity === 'active' || solarActivity === 'storm') {
    voteWeight *= 0.92;
    reasons.push('Elevated solar activity - increased caution applied');
  }

  return {
    recommendation,
    confidence: Math.min(0.99, Math.max(0.5, confidence)),
    voteWeight: Math.max(0.5, Math.min(1.8, voteWeight)),
    reasons,
  };
}

/**
 * Simple weighted merge of votes from multiple servers + external.
 */
export function mergeVotes(votes: GovernanceVote[]): {
  finalDecision: GovernanceResult['finalDecision'];
  averageConfidence: number;
  reasoningSummary: string;
} {
  if (votes.length === 0) {
    return {
      finalDecision: 'abstain',
      averageConfidence: 0.5,
      reasoningSummary: 'No votes received',
    };
  }

  const approveWeight = votes
    .filter(v => v.decision === 'approve')
    .reduce((sum, v) => sum + (v.weight ?? 1) * v.confidence, 0);

  const totalWeight = votes.reduce((sum, v) => sum + (v.weight ?? 1) * v.confidence, 0);

  const avgConfidence = totalWeight > 0 ? totalWeight / votes.length : 0.5;

  let finalDecision: GovernanceResult['finalDecision'] = 'needs_revision';
  if (totalWeight > 0) {
    const approveRatio = approveWeight / totalWeight;
    if (approveRatio > 0.66) {
      finalDecision = 'approve';
    } else if (approveRatio < 0.33) {
      finalDecision = 'reject';
    }
  } else {
    // All votes had zero confidence — default to needs_revision
    finalDecision = 'needs_revision';
  }

  const reasons = votes.map(v => `${v.server}: ${v.reasoning}`).join(' | ');

  return {
    finalDecision,
    averageConfidence: Math.round(avgConfidence * 100) / 100,
    reasoningSummary: reasons,
  };
}
