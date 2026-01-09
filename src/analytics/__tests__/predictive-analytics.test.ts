import { SimplePredictiveAnalytics, TaskExecutionRecord } from '../predictive-analytics';

describe('SimplePredictiveAnalytics', () => {
  let analytics: SimplePredictiveAnalytics;

  beforeEach(() => {
    analytics = new SimplePredictiveAnalytics();
  });

  describe('predictOptimalAgent', () => {
    it('should predict agent with highest specialization match', () => {
      // Setup agent with high specialization
      const taskResult: TaskExecutionRecord = {
        taskId: 'task1',
        taskType: 'code-review',
        complexity: 8,
        executionTime: 15000,
        success: true,
        timestamp: Date.now(),
        agentId: 'agent1'
      };

      analytics.updateAgentMetrics('agent1', taskResult);

      const result = analytics.predictOptimalAgent('code-review', 8);

      expect(result.agentId).toBe('agent1');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.estimatedDuration).toBeGreaterThan(0);
    });

    it('should return empty agent for unknown tasks', () => {
      const result = analytics.predictOptimalAgent('unknown-task', 5);

      expect(result.agentId).toBe('');
      expect(result.confidence).toBe(0);
    });
  });

  describe('updateAgentMetrics', () => {
    it('should update specialization scores', () => {
      const taskResult: TaskExecutionRecord = {
        taskId: 'task1',
        taskType: 'code-review',
        complexity: 8,
        executionTime: 15000,
        success: true,
        timestamp: Date.now(),
        agentId: 'agent1'
      };

      analytics.updateAgentMetrics('agent1', taskResult);

      // Check that metrics were updated (internal access for testing)
      const metrics = (analytics as any).agentMetrics.get('agent1');
      expect(metrics).toBeDefined();
      expect(metrics.specializationScore['code-review']).toBeGreaterThan(0);
    });

    it('should maintain task history limit', () => {
      const agentId = 'agent1';

      // Add 150 tasks (over the 100 limit)
      for (let i = 0; i < 150; i++) {
        const taskResult: TaskExecutionRecord = {
          taskId: `task${i}`,
          taskType: 'code-review',
          complexity: 7,
          executionTime: 12000,
          success: true,
          timestamp: Date.now(),
          agentId
        };

        analytics.updateAgentMetrics(agentId, taskResult);
      }

      const metrics = (analytics as any).agentMetrics.get(agentId);
      expect(metrics.taskHistory.length).toBeLessThanOrEqual(100);
    });
  });
});