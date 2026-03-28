/**
 * LearningEngine Tests
 *
 * Unit tests for the LearningEngine class.
 *
 * @version 1.0.0
 * @since 2026-03-12
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LearningEngine } from '../learning-engine.js';

const INTEGRATION_TIMEOUT = 30000;

describe('LearningEngine', () => {
  let engine: LearningEngine;

  beforeEach(() => {
    engine = new LearningEngine(false);
  });

  describe('constructor', () => {
    it('should create with default disabled state', () => {
      expect(engine.isEnabled()).toBe(false);
    });

    it('should create with enabled state when specified', () => {
      const enabledEngine = new LearningEngine(true);
      expect(enabledEngine.isEnabled()).toBe(true);
    });
  });

  describe('getP9LearningStats', () => {
    it('should return default stats when no learning', () => {
      const stats = engine.getP9LearningStats();
      expect(stats.totalLearnings).toBe(0);
      expect(stats.successRate).toBe(1.0);
      expect(stats.lastLearning).toBeNull();
      expect(stats.averageLearningTime).toBe(0);
      expect(stats.enabled).toBe(false);
    });

    it('should return updated stats after learning', async () => {
      engine.setEnabled(true);
      await engine.triggerLearning();

      const stats = engine.getP9LearningStats();
      expect(stats.totalLearnings).toBe(1);
      expect(stats.lastLearning).toBeInstanceOf(Date);
      expect(stats.enabled).toBe(true);
    });
  });

  describe('getPatternDriftAnalysis', () => {
    it('should return placeholder drift analysis', () => {
      const analysis = engine.getPatternDriftAnalysis();
      expect(analysis.driftDetected).toBe(false);
      expect(analysis.affectedPatterns).toHaveLength(0);
      expect(analysis.severity).toBe('low');
    });
  });

  describe('getAdaptiveThresholds', () => {
    it('should return placeholder thresholds', () => {
      const thresholds = engine.getAdaptiveThresholds();
      expect(thresholds.overall.confidenceMin).toBe(0.7);
      expect(thresholds.overall.confidenceMax).toBe(0.95);
      expect(thresholds.overall.frequencyMin).toBe(5);
      expect(thresholds.overall.frequencyMax).toBe(100);
    });
  });

  describe('triggerLearning', () => {
    it('should not trigger when disabled', async () => {
      const result = await engine.triggerLearning();
      expect(result.learningStarted).toBe(false);
      expect(result.patternsAnalyzed).toBe(0);
      expect(result.adaptations).toBe(0);
    });

    it('should trigger when enabled', async () => {
      engine.setEnabled(true);
      const result = await engine.triggerLearning();
      expect(result.learningStarted).toBe(true);
    });

    it('should record learning in history', async () => {
      engine.setEnabled(true);
      await engine.triggerLearning();

      const history = engine.getLearningHistory();
      expect(history).toHaveLength(1);
      expect(history[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('setEnabled', () => {
    it('should enable learning', () => {
      expect(engine.isEnabled()).toBe(false);
      engine.setEnabled(true);
      expect(engine.isEnabled()).toBe(true);
    });

    it('should disable learning', () => {
      engine.setEnabled(true);
      expect(engine.isEnabled()).toBe(true);
      engine.setEnabled(false);
      expect(engine.isEnabled()).toBe(false);
    });
  });

  describe('getLearningHistory', () => {
    it('should return empty array initially', () => {
      const history = engine.getLearningHistory();
      expect(history).toHaveLength(0);
    });

    it('should return copy of history', async () => {
      engine.setEnabled(true);
      await engine.triggerLearning();

      const history1 = engine.getLearningHistory();
      const history2 = engine.getLearningHistory();

      expect(history1).toEqual(history2);
      expect(history1).not.toBe(history2);
    });
  });

  describe('clearHistory', () => {
    it('should clear learning history', async () => {
      engine.setEnabled(true);
      await engine.triggerLearning();

      expect(engine.getLearningHistory()).toHaveLength(1);
      engine.clearHistory();
      expect(engine.getLearningHistory()).toHaveLength(0);
    });
  });

  describe('analyzePattern', () => {
    it('should return placeholder analysis', () => {
      const analysis = engine.analyzePattern('test-pattern');
      expect(analysis.optimized).toBe(false);
      expect(analysis.recommendations).toHaveLength(0);
      expect(analysis.confidence).toBe(0.5);
    });
  });

  describe('suggestImprovements', () => {
    it('should return empty array', () => {
      const suggestions = engine.suggestImprovements();
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('integration', () => {
    it('should track multiple learning sessions', async () => {
      engine.setEnabled(true);

      await engine.triggerLearning();
      await engine.triggerLearning();
      await engine.triggerLearning();

      const stats = engine.getP9LearningStats();
      expect(stats.totalLearnings).toBe(3);

      const history = engine.getLearningHistory();
      expect(history).toHaveLength(3);
    }, INTEGRATION_TIMEOUT);

    it('should maintain stats after disable/enable', async () => {
      engine.setEnabled(true);
      await engine.triggerLearning();

      engine.setEnabled(false);
      await engine.triggerLearning(); // Should not record

      engine.setEnabled(true);
      await engine.triggerLearning();

      const stats = engine.getP9LearningStats();
      expect(stats.totalLearnings).toBe(2);
    }, INTEGRATION_TIMEOUT);
  });
});
