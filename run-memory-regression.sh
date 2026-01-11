#!/bin/bash

# Memory Regression Test Runner
echo "🧪 Running Memory Regression Tests..."

# Run the regression tests
node -e "
(async () => {
  const { MemoryRegressionTester, memoryTestTemplates } = await import('./dist/testing/memory-regression-suite.js');
  
  const tester = new MemoryRegressionTester({
    testTimeout: 15000, // 15 seconds
    memorySamplingInterval: 500, // 500ms
  });
  
  // Add standard regression tests
  tester.addTest(memoryTestTemplates.sessionOperations(50));
  tester.addTest(memoryTestTemplates.cacheOperations(200));
  tester.addTest(memoryTestTemplates.streamingOperations(100));
  
  console.log('Running memory regression tests...');
  const results = await tester.runAllTests();
  
  console.log(\`\\n📊 Test Results: \${results.filter(r => r.passed).length}/\${results.length} passed\\n\`);
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(\`\${status} \${result.testName}\`);
    console.log(\`   Memory Delta: \${result.memoryDelta.toFixed(2)}MB\`);
    console.log(\`   Leak Rate: \${result.leakRate.toFixed(2)}MB/min\`);
    console.log(\`   Duration: \${result.duration}ms\`);
    
    if (!result.passed && result.recommendations.length > 0) {
      console.log('   Recommendations:');
      result.recommendations.forEach(rec => console.log(\`     - \${rec}\`));
    }
    console.log('');
  });
  
  // Generate and display report
  const report = tester.generateReport(results);
  console.log('📋 Detailed Report:');
  console.log(report);
})();
" 2>/dev/null