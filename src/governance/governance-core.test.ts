import { describe, it, expect } from 'vitest';
import { applyDecisionMatrix, mergeVotes } from './governance-core.js';
import type { GovernanceVote } from './governance-types.js';

describe('governance-core', () => {
  describe('applyDecisionMatrix', () => {
    it('returns PASS for high resonance and isotopic ratio', () => {
      const result = applyDecisionMatrix({
        resonance: 0.95,
        isotopicRatio: 0.97,
      });
      expect(result.recommendation).toBe('PASS');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('returns REJECT for low resonance', () => {
      const result = applyDecisionMatrix({
        resonance: 0.6,
        isotopicRatio: 0.9,
      });
      expect(result.recommendation).toBe('REJECT');
    });

    it('applies solar activity caution', () => {
      const normal = applyDecisionMatrix({ resonance: 0.88, isotopicRatio: 0.90, solarActivity: 'quiet' });
      const storm = applyDecisionMatrix({ resonance: 0.88, isotopicRatio: 0.90, solarActivity: 'storm' });
      expect(storm.voteWeight).toBeLessThan(normal.voteWeight);
    });
  });

  describe('mergeVotes', () => {
    it('approves when majority approve with good weight', () => {
      const votes: GovernanceVote[] = [
        { server: 'code-review', decision: 'approve', confidence: 0.9, reasoning: 'good' },
        { server: 'security-audit', decision: 'approve', confidence: 0.85, reasoning: 'good' },
        { server: 'researcher', decision: 'needs_revision', confidence: 0.7, reasoning: 'ok' },
        { server: 'external-dynamo', decision: 'approve', confidence: 0.88, reasoning: 'solar ok', weight: 1.2 },
      ];
      const merged = mergeVotes(votes);
      expect(merged.finalDecision).toBe('approve');
      expect(merged.averageConfidence).toBeGreaterThan(0.8);
    });

    it('returns abstain when no votes', () => {
      const merged = mergeVotes([]);
      expect(merged.finalDecision).toBe('abstain');
    });
  });
});
