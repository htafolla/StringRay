import { complexityAnalyzer } from './node_modules/strray-ai/dist/plugin/src/delegation/complexity-analyzer.js';

console.log('=== ULTRA-COMPLEX SCENARIO TEST ===');

// Create an ultra-complex scenario that should trigger orchestrator-led
const ultraComplexScenario = {
  name: 'Ultra-Complex Enterprise Operation',
  operation: 'debug', // debug has weight 2.0
  context: {
    files: Array.from({length: 50}, (_, i) => `component${i}.js`), // 50 files
    changes: 5000, // massive changes
    dependencies: 25, // high dependencies
    risk: 'critical', // critical risk multiplier 1.6
    estimatedDuration: 480 // 8 hours
  }
};

console.log(`🔍 ${ultraComplexScenario.name}:`);
console.log(`   Operation: ${ultraComplexScenario.operation} (weight: 2.0)`);
console.log(`   Files: ${ultraComplexScenario.context.files.length}`);
console.log(`   Changes: ${ultraComplexScenario.context.changes}`);
console.log(`   Dependencies: ${ultraComplexScenario.context.dependencies}`);
console.log(`   Risk Level: ${ultraComplexScenario.context.risk} (multiplier: 1.6)`);
console.log(`   Estimated Duration: ${ultraComplexScenario.context.estimatedDuration}min`);

const metrics = complexityAnalyzer.analyzeComplexity(ultraComplexScenario.operation, ultraComplexScenario.context);
const complexity = complexityAnalyzer.calculateComplexityScore(metrics);

console.log(`\n📊 COMPLEXITY ANALYSIS RESULTS:`);
console.log(`   Raw Score: ${complexity.score}`);
console.log(`   Level: ${complexity.level}`);
console.log(`   Recommended Strategy: ${complexity.recommendedStrategy}`);
console.log(`   Estimated Agents: ${complexity.estimatedAgents}`);
console.log(`   Reasoning: ${complexity.reasoning.join(', ')}`);

if (complexity.recommendedStrategy === 'orchestrator-led') {
  console.log(`\n🎯 ORCHESTRATOR WILL BE TRIGGERED!`);
  console.log(`   Reason: Complexity score ${complexity.score} >= 95`);
} else {
  console.log(`\n⚠️ Orchestrator NOT triggered`);
  console.log(`   Reason: Complexity score ${complexity.score} < 95`);
}

console.log('\n=== ULTRA-COMPLEX TEST COMPLETE ===');