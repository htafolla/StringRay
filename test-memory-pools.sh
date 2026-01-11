#!/bin/bash

# Test Memory Pool Integration
echo "🧪 Testing Memory Pool Integration..."

# Test the memory pools
node -e "
(async () => {
  const { memoryPoolManager, createSessionPool, createMetricsPool, createAlertPool } = await import('./dist/utils/memory-pool.js');
  const { PerformanceOptimizer } = await import('./dist/optimization/performance-optimizer.js');

  console.log('Creating memory pools...');

  // Test session pool
  const sessionPool = createSessionPool(50);
  console.log('Session pool created');

  // Test metrics pool
  const metricsPool = createMetricsPool(100);
  console.log('Metrics pool created');

  // Test alert pool
  const alertPool = createAlertPool(25);
  console.log('Alert pool created');

  // Test pool usage
  console.log('Testing pool operations...');
  const session = sessionPool.get();
  session.id = 'test-session';
  session.createdAt = Date.now();

  const metric = metricsPool.get();
  metric.type = 'test';
  metric.value = 42;

  const alert = alertPool.get();
  alert.type = 'info';
  alert.message = 'Test alert';

  // Return objects to pools
  sessionPool.release(session);
  metricsPool.release(metric);
  alertPool.release(alert);

  console.log('Pool operations completed');

  // Check pool status
  const sessionStatus = sessionPool.getStatus();
  console.log('Session pool status:', sessionStatus);

  // Test performance optimizer integration
  const optimizer = new PerformanceOptimizer();
  const poolStats = optimizer.getMemoryPoolStats();
  console.log('Performance optimizer pool stats:', Object.keys(poolStats));

  console.log('✅ Memory pool integration test completed successfully');
})();
" 2>/dev/null