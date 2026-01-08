import { describe, it, expect, beforeEach } from 'vitest';
import { StrRayOrchestrator, TaskDefinition } from '../../../orchestrator.js';

describe('Orchestrator Concurrent Execution', () => {
  let orchestrator: StrRayOrchestrator;

  beforeEach(() => {
    orchestrator = new StrRayOrchestrator({
      maxConcurrentTasks: 3,
      taskTimeout: 10000
    });
  });

  it('should execute tasks concurrently up to maxConcurrentTasks limit', async () => {
    const tasks: TaskDefinition[] = [
      { id: 'task-1', description: 'Task 1', subagentType: 'architect' },
      { id: 'task-2', description: 'Task 2', subagentType: 'librarian' },
      { id: 'task-3', description: 'Task 3', subagentType: 'enforcer' },
      { id: 'task-4', description: 'Task 4', subagentType: 'architect' },
      { id: 'task-5', description: 'Task 5', subagentType: 'librarian' }
    ];

    const startTime = Date.now();
    const results = await orchestrator.executeComplexTask('Concurrent test', tasks);
    const endTime = Date.now();

    expect(results).toHaveLength(5);
    expect(results.every(r => r.success)).toBe(true);
    
    // Should complete faster than sequential execution (5 tasks * ~1000ms each = 5000ms)
    // Concurrent execution should complete in less than 3000ms
    expect(endTime - startTime).toBeLessThan(3000);
  });

  it('should respect maxConcurrentTasks configuration', async () => {
    // Test with maxConcurrentTasks = 1 (should execute sequentially)
    const sequentialOrchestrator = new StrRayOrchestrator({
      maxConcurrentTasks: 1,
      taskTimeout: 10000
    });

    const tasks: TaskDefinition[] = [
      { id: 'seq-1', description: 'Sequential 1', subagentType: 'architect' },
      { id: 'seq-2', description: 'Sequential 2', subagentType: 'librarian' },
      { id: 'seq-3', description: 'Sequential 3', subagentType: 'enforcer' }
    ];

    const startTime = Date.now();
    const results = await sequentialOrchestrator.executeComplexTask('Sequential test', tasks);
    const endTime = Date.now();

    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);
    
    // Should take longer than concurrent execution (at least 3 seconds)
    expect(endTime - startTime).toBeGreaterThan(2500);
  });
});
