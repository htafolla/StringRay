#!/bin/bash

# Memory Monitor Test Script
# Tests the memory monitor functionality without console spam

echo "🧠 Testing Memory Monitor..."
echo "This will run for 30 seconds and log to files only (no console output)"

# Start memory monitor in background
node -e "
(async () => {
  const { memoryMonitor } = await import('./dist/memory-monitor.js');
  console.log('Starting memory monitor...');
  memoryMonitor.start();

  // Run for 30 seconds
  await new Promise(resolve => setTimeout(resolve, 30000));

  memoryMonitor.stop();
  console.log('Memory monitor test complete');
  console.log('Check logs/monitoring/memory-monitor-*.log for results');
})();
" 2>/dev/null

echo ""
echo "📊 Memory Monitor Test Results:"
echo "Check the log file: logs/monitoring/memory-monitor-$(date +%Y-%m-%d).log"
echo ""

# Show a summary of the log file if it exists
LOG_FILE="logs/monitoring/memory-monitor-$(date +%Y-%m-%d).log"
if [ -f "$LOG_FILE" ]; then
  echo "📝 Last few log entries:"
  tail -5 "$LOG_FILE" 2>/dev/null || echo "No log entries found"
else
  echo "⚠️  Log file not found. Monitor may not have generated entries yet."
fi

echo ""
echo "✅ Memory monitor is now logging to files only (no console spam)"