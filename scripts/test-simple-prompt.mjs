#!/usr/bin/env node

/**
 * Simple Prompt Orchestration Test
 * Tests basic prompt orchestration with simple task
 */

(async () => {
  try {
    console.log('Testing simple prompt orchestration...');

    // Import the orchestrator
    const { StringRayOrchestrator } = await import('../dist/orchestrator.js');

    // Create orchestrator instance
    const orchestrator = new StringRayOrchestrator({
      maxConcurrentTasks: 2
    });

    // Execute simple task
    const result = await orchestrator.executeComplexTask('Create a simple hello world function', [
      {
        id: 'simple-task',
        description: 'Create a simple hello world function',
        subagentType: 'orchestrator',
        priority: 'high'
      }
    ]);

    console.log('Simple prompt test result:', result.length > 0 ? 'PASSED' : 'FAILED');
    console.log('Tasks completed:', result.length);

    process.exit(result.length > 0 ? 0 : 1);

  } catch (error) {
    console.error('Simple prompt test failed:', error.message);
    process.exit(1);
  }
})();