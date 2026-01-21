import { complexityAnalyzer } from 'strray-ai/dist/plugin/delegation/complexity-analyzer.js';

console.log('=== COMPLEXITY ANALYZER DEMONSTRATION ===');

// Test different complexity scenarios
const testScenarios = [
  {
    name: 'Simple Operation',
    operation: 'read',
    context: { files: ['single.js'], changes: 5 }
  },
  {
    name: 'Moderate Operation',
    operation: 'modify',
    context: { files: ['file1.js', 'file2.js'], changes: 50 }
  },
  {
    name: 'Complex Operation',
    operation: 'refactor',
    context: { files: ['a.js', 'b.js', 'c.js', 'd.js'], changes: 200, dependencies: 5 }
  },
  {
    name: 'Enterprise Operation',
    operation: 'refactor',
    context: { files: Array.from({length: 20}, (_, i) => `file${i}.js`), changes: 1000, dependencies: 15, risk: 'critical' }
  }
];

console.log('Testing Complexity Analyzer with different scenarios:\n');

for (const scenario of testScenarios) {
  console.log(`🔍 ${scenario.name}:`);
  console.log(`   Operation: ${scenario.operation}`);

  const metrics = complexityAnalyzer.analyzeComplexity(scenario.operation, scenario.context);
  const complexity = complexityAnalyzer.calculateComplexityScore(metrics);

  console.log(`   Files: ${scenario.context.files.length}`);
  console.log(`   Changes: ${scenario.context.changes}`);
  console.log(`   Complexity Score: ${complexity.score} (${complexity.level})`);
  console.log(`   Recommended Strategy: ${complexity.recommendedStrategy}`);
  console.log(`   Estimated Agents: ${complexity.estimatedAgents}`);
  console.log(`   Reasoning: ${complexity.reasoning.slice(0, 2).join(', ')}\n`);
}

console.log('=== COMPLEXITY ANALYZER DEMO COMPLETE ===');