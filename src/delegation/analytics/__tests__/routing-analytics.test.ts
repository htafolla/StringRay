/**
 * RoutingAnalytics Tests
 *
 * Unit tests for the RoutingAnalytics class.
 *
 * @version 1.0.0
 * @since 2026-03-12
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RoutingAnalytics } from '../routing-analytics.js';
import { RoutingOutcomeTracker } from '../outcome-tracker.js';

describe('RoutingAnalytics', () => {
  let tracker: RoutingOutcomeTracker;
  let analytics: RoutingAnalytics;

  beforeEach(() => {
    tracker = new RoutingOutcomeTracker();
    analytics = new RoutingAnalytics(tracker);
  });

  describe('getDailySummary', () => {
    it('should return daily summary with zero data when empty', () => {
      const summary = analytics.getDailySummary();
      expect(summary.totalRoutings).toBe(0);
      expect(summary.successRate).toBe(0);
      expect(summary.topAgents).toHaveLength(0);
      expect(summary.insights).toHaveLength(0);
    });

    it('should calculate daily summary correctly', () => {
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
        routedAgent: 'code-reviewer',
        routedSkill: 'code-review',
        confidence: 0.85,
        success: true,
      });

      const summary = analytics.getDailySummary();
      expect(summary.totalRoutings).toBe(3);
      expect(summary.successRate).toBeCloseTo(2 / 3, 5);
      expect(summary.topAgents).toHaveLength(2);
      expect(summary.topAgents[0].agent).toBe('testing-lead');
      expect(summary.topAgents[0].count).toBe(2);
    });

    it('should detect low success rate and add insight', () => {
      // Add many failures to get low success rate
      for (let i = 0; i < 10; i++) {
        tracker.recordOutcome({
          taskId: `test-${i}`,
          taskDescription: `test task ${i}`,
          routedAgent: 'testing-lead',
          routedSkill: 'testing-strategy',
          confidence: 0.9,
          success: false,
        });
      }

      const summary = analytics.getDailySummary();
      expect(summary.insights.length).toBeGreaterThan(0);
      expect(summary.insights[0]).toContain('Low overall success rate');
    });
  });

  describe('getFullAnalytics', () => {
    it('should return full analytics structure', () => {
      const fullAnalytics = analytics.getFullAnalytics();
      expect(fullAnalytics).toHaveProperty('promptPatterns');
      expect(fullAnalytics).toHaveProperty('routingPerformance');
      expect(fullAnalytics.promptPatterns).toHaveProperty('totalPrompts');
      expect(fullAnalytics.routingPerformance).toHaveProperty('totalRoutings');
    });

    it('should include agent metrics', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'testing-lead',
        routedSkill: 'testing-strategy',
        confidence: 0.95,
        success: true,
      });

      const fullAnalytics = analytics.getFullAnalytics();
      expect(fullAnalytics.routingPerformance.agentMetrics).toHaveLength(1);
      expect(fullAnalytics.routingPerformance.agentMetrics[0].agent).toBe(
        'testing-lead'
      );
    });

    it('should include time range', () => {
      const fullAnalytics = analytics.getFullAnalytics();
      expect(fullAnalytics.routingPerformance.timeRange).toHaveProperty('start');
      expect(fullAnalytics.routingPerformance.timeRange).toHaveProperty('end');
      expect(fullAnalytics.routingPerformance.timeRange.start).toBeInstanceOf(
        Date
      );
      expect(fullAnalytics.routingPerformance.timeRange.end).toBeInstanceOf(Date);
    });
  });

  describe('applyRoutingRefinements', () => {
    it('should detect low-performing agents when apply is false', () => {
      // Add many failures for one agent
      for (let i = 0; i < 15; i++) {
        tracker.recordOutcome({
          taskId: `test-${i}`,
          taskDescription: `test task ${i}`,
          routedAgent: 'poor-performer',
          routedSkill: 'some-skill',
          confidence: 0.9,
          success: false,
        });
      }

      const result = analytics.applyRoutingRefinements(false);
      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.appliedMappings).toBe(0);
      expect(result.changes[0].type).toBe('removed');
      expect(result.changes[0].reason).toContain('Low success rate');
    });

    it('should apply changes when apply is true', () => {
      for (let i = 0; i < 15; i++) {
        tracker.recordOutcome({
          taskId: `test-${i}`,
          taskDescription: `test task ${i}`,
          routedAgent: 'poor-performer',
          routedSkill: 'some-skill',
          confidence: 0.9,
          success: false,
        });
      }

      const result = analytics.applyRoutingRefinements(true);
      expect(result.removedMappings).toBeGreaterThan(0);
    });

    it('should return empty changes when no issues', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'good-performer',
        routedSkill: 'some-skill',
        confidence: 0.95,
        success: true,
      });

      const result = analytics.applyRoutingRefinements(false);
      expect(result.changes).toHaveLength(0);
    });
  });

  describe('generateInsights', () => {
    it('should return empty data message when no data', () => {
      const insights = analytics.generateInsights();
      expect(insights).toContain('No routing data available yet');
    });

    it('should identify most used agent', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'popular-agent',
        routedSkill: 'some-skill',
        confidence: 0.95,
        success: true,
      });

      tracker.recordOutcome({
        taskId: 'test-2',
        taskDescription: 'test task 2',
        routedAgent: 'popular-agent',
        routedSkill: 'some-skill',
        confidence: 0.95,
        success: true,
      });

      tracker.recordOutcome({
        taskId: 'test-3',
        taskDescription: 'test task 3',
        routedAgent: 'rare-agent',
        routedSkill: 'some-skill',
        confidence: 0.95,
        success: true,
      });

      const insights = analytics.generateInsights();
      expect(insights.some((i) => i.includes('Most used agent'))).toBe(true);
      expect(insights.some((i) => i.includes('popular-agent'))).toBe(true);
    });

    it('should identify best performing agent', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'good-agent',
        routedSkill: 'some-skill',
        confidence: 0.95,
        success: true,
      });

      tracker.recordOutcome({
        taskId: 'test-2',
        taskDescription: 'test task 2',
        routedAgent: 'bad-agent',
        routedSkill: 'some-skill',
        confidence: 0.95,
        success: false,
      });

      const insights = analytics.generateInsights();
      expect(insights.some((i) => i.includes('Best performing agent'))).toBe(
        true
      );
    });

    it('should identify agents needing attention', () => {
      // Add 5+ attempts with low success rate
      for (let i = 0; i < 5; i++) {
        tracker.recordOutcome({
          taskId: `test-${i}`,
          taskDescription: `test task ${i}`,
          routedAgent: 'needs-attention',
          routedSkill: 'some-skill',
          confidence: 0.95,
          success: false,
        });
      }

      const insights = analytics.generateInsights();
      expect(
        insights.some((i) => i.includes('Agent needing attention'))
      ).toBe(true);
    });

    it('should include total routes and average success rate', () => {
      tracker.recordOutcome({
        taskId: 'test-1',
        taskDescription: 'test task 1',
        routedAgent: 'agent-1',
        routedSkill: 'some-skill',
        confidence: 0.95,
        success: true,
      });

      const insights = analytics.generateInsights();
      expect(insights.some((i) => i.includes('Total routes'))).toBe(true);
      expect(insights.some((i) => i.includes('Average success rate'))).toBe(
        true
      );
    });
  });

  describe('getRawStats', () => {
    it('should return stats as record', () => {
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
        confidence: 0.95,
        success: false,
      });

      const rawStats = analytics.getRawStats();
      expect(rawStats['testing-lead']).toBeDefined();
      expect(rawStats['testing-lead'].attempts).toBe(2);
      expect(rawStats['testing-lead'].successes).toBe(1);
      expect(rawStats['testing-lead'].successRate).toBe(0.5);
    });
  });

  describe('compareToBaseline', () => {
    it('should show improvement when above baseline', () => {
      for (let i = 0; i < 10; i++) {
        tracker.recordOutcome({
          taskId: `test-${i}`,
          taskDescription: `test task ${i}`,
          routedAgent: 'testing-lead',
          routedSkill: 'testing-strategy',
          confidence: 0.95,
          success: true,
        });
      }

      const comparison = analytics.compareToBaseline();
      expect(comparison.improved).toBe(true);
      expect(comparison.baselineRate).toBe(0.7);
      expect(comparison.currentRate).toBe(1.0);
      expect(comparison.changePercent).toBeGreaterThan(0);
    });

    it('should show decline when below baseline', () => {
      for (let i = 0; i < 10; i++) {
        tracker.recordOutcome({
          taskId: `test-${i}`,
          taskDescription: `test task ${i}`,
          routedAgent: 'testing-lead',
          routedSkill: 'testing-strategy',
          confidence: 0.95,
          success: false,
        });
      }

      const comparison = analytics.compareToBaseline();
      expect(comparison.improved).toBe(false);
      expect(comparison.currentRate).toBe(0);
    });
  });
});
