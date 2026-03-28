/**
 * RoutingOutcomeTracker Tests
 *
 * Unit tests for the RoutingOutcomeTracker class.
 *
 * @version 1.0.0
 * @since 2026-03-12
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RoutingOutcomeTracker } from '../outcome-tracker.js';

describe('RoutingOutcomeTracker', () => {
  let tracker: RoutingOutcomeTracker;

  beforeEach(() => {
    tracker = new RoutingOutcomeTracker();
  });

  describe('recordOutcome', () => {
    it('should record outcomes with timestamps', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      expect(tracker.getCount()).toBe(1);
      const outcomes = tracker.getOutcomes();
      expect(outcomes[0].taskId).toBe('test-1');
      expect(outcomes[0].timestamp).toBeInstanceOf(Date);
    });

    it('should record multiple outcomes', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      tracker.recordOutcome({
        taskId: 'test-2',
        taskDescription: 'test task 2',
        routedAgent: 'code-reviewer',
        routedSkill: 'code-review',
        confidence: 0.85,
        success: false,
      });

      expect(tracker.getCount()).toBe(2);
    });

    it('should respect max outcomes limit', () => {
      const smallTracker = new RoutingOutcomeTracker(5);

      for (let i = 0; i < 10; i++) {
        smallTracker.recordOutcome({
          taskId: `test-${i}`,
          taskDescription: `test task ${i}`,
          routedAgent: 'testing-lead',
          routedSkill: 'testing-strategy',
          confidence: 0.9,
          success: true,
        });
      }

      expect(smallTracker.getCount()).toBe(5);
      // Should keep most recent
      const outcomes = smallTracker.getOutcomes();
      expect(outcomes[0].taskId).toBe('test-5');
      expect(outcomes[4].taskId).toBe('test-9');
    });
  });

  describe('getOutcomes', () => {
    it('should return all outcomes when no agent filter', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      tracker.recordOutcome({
        taskId: 'test-2',
        taskDescription: 'test task 2',
        routedAgent: 'code-reviewer',
        routedSkill: 'code-review',
        confidence: 0.85,
        success: true,
      });

      const outcomes = tracker.getOutcomes();
      expect(outcomes).toHaveLength(2);
    });

    it('should filter outcomes by agent', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      tracker.recordOutcome({
        taskId: 'test-2',
        taskDescription: 'test task 2',
        routedAgent: 'code-reviewer',
        routedSkill: 'code-review',
        confidence: 0.85,
        success: true,
      });

      tracker.recordOutcome({
        taskId: 'test-3',
        taskDescription: 'test task 3',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.92,
        success: false,
      });

      const testingOutcomes = tracker.getOutcomes('testing-lead');
      expect(testingOutcomes).toHaveLength(2);
      expect(testingOutcomes.every((o) => o.routedAgent === 'testing-lead')).toBe(
        true
      );
    });

    it('should return empty array for unknown agent', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      const outcomes = tracker.getOutcomes('unknown-agent');
      expect(outcomes).toHaveLength(0);
    });
  });

  describe('getSuccessRate', () => {
    it('should calculate correct success rate', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      tracker.recordOutcome({
        taskId: 'test-2',
        taskDescription: 'test task 2',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.9,
        success: false,
      });

      tracker.recordOutcome({
        taskId: 'test-3',
        taskDescription: 'test task 3',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.92,
        success: true,
      });

      const successRate = tracker.getSuccessRate('testing-lead');
      expect(successRate).toBe(2 / 3);
    });

    it('should return 0 for agent with no outcomes', () => {
      const successRate = tracker.getSuccessRate('unknown-agent');
      expect(successRate).toBe(0);
    });

    it('should ignore outcomes without success field', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      tracker.recordOutcome({
        taskId: 'test-2',
        taskDescription: 'test task 2',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.9,
        // success is undefined
      });

      const successRate = tracker.getSuccessRate('testing-lead');
      expect(successRate).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should calculate stats for all agents', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      tracker.recordOutcome({
        taskId: 'test-2',
        taskDescription: 'test task 2',
        routedAgent: 'code-reviewer',
        routedSkill: 'code-review',
        confidence: 0.85,
        success: false,
      });

      tracker.recordOutcome({
        taskId: 'test-3',
        taskDescription: 'test task 3',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.92,
        success: true,
      });

      const stats = tracker.getStats();
      expect(stats).toHaveLength(2);

      const testingStats = stats.find((s) => s.agent === 'testing-lead');
      expect(testingStats?.total).toBe(2);
      expect(testingStats?.successRate).toBe(1);

      const reviewStats = stats.find((s) => s.agent === 'code-reviewer');
      expect(reviewStats?.total).toBe(1);
      expect(reviewStats?.successRate).toBe(0);
    });

    it('should return empty array when no outcomes with success', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        // success is undefined
      });

      const stats = tracker.getStats();
      expect(stats).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should clear all outcomes', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      expect(tracker.getCount()).toBe(1);
      tracker.clear();
      expect(tracker.getCount()).toBe(0);
    });
  });

  describe('getCount', () => {
    it('should return correct count', () => {
      expect(tracker.getCount()).toBe(0);

      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      expect(tracker.getCount()).toBe(1);
    });
  });

  describe('toJSON', () => {
    it('should export to JSON string', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      const json = tracker.toJSON();
      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].taskId).toBe('test-1');
    });
  });

  describe('getPromptData', () => {
    it('should convert outcomes to prompt data points', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      const promptData = tracker.getPromptData();
      expect(promptData).toHaveLength(1);
      expect(promptData[0].taskId).toBe('test-1');
      expect(promptData[0].prompt).toBe('test task 1');
      expect(promptData[0].outcome?.success).toBe(true);
    });
  });

  describe('getRoutingDecisions', () => {
    it('should convert outcomes to routing decisions', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      const decisions = tracker.getRoutingDecisions();
      expect(decisions).toHaveLength(1);
      expect(decisions[0].taskId).toBe('test-1');
      expect(decisions[0].agent).toBe('testing-lead');
      expect(decisions[0].skill).toBe('testing-strategy');
    });
  });

  describe('applyRoutingRefinements', () => {
    it('should apply changes to existing outcomes', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      tracker.applyRoutingRefinements([
        {
          taskId: 'test-1',
          agent: 'code-reviewer',
          skill: 'code-review',
          confidence: 0.88,
        },
      ]);

      const outcomes = tracker.getOutcomes();
      expect(outcomes[0].routedAgent).toBe('code-reviewer');
      expect(outcomes[0].routedSkill).toBe('code-review');
      expect(outcomes[0].confidence).toBe(0.88);
    });

    it('should not apply changes for non-existent tasks', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      tracker.applyRoutingRefinements([
        {
          taskId: 'non-existent',
          agent: 'code-reviewer',
        },
      ]);

      const outcomes = tracker.getOutcomes();
      expect(outcomes[0].routedAgent).toBe('testing-lead');
    });
  });
});
