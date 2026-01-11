#!/bin/bash

# Test graceful shutdown handling
echo "🧪 Testing graceful shutdown handling..."
echo "This will start the boot orchestrator and then interrupt it to test graceful shutdown"

# Start the boot orchestrator in background
node -e "
(async () => {
  console.log('Starting boot orchestrator...');
  const { bootOrchestrator } = await import('./dist/boot-orchestrator.js');
  console.log('Boot orchestrator loaded, memory monitor should be running...');
  
  // Keep it running so we can interrupt it
  setTimeout(() => {
    console.log('Boot orchestrator still running (will be interrupted)...');
  }, 2000);
  
  // Keep process alive
  setInterval(() => {}, 1000);
})();
" &
BOOT_PID=$!

# Wait a moment then send SIGINT
sleep 3
echo "Sending SIGINT to test graceful shutdown..."
kill -INT $BOOT_PID

# Wait for cleanup
sleep 2

echo ""
echo "✅ Graceful shutdown test completed"
echo "Check memory monitor logs to confirm proper cleanup"