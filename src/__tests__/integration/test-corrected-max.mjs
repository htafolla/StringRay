import { complexityAnalyzer } from './node_modules/strray-ai/dist/plugin/src/delegation/complexity-analyzer.js';

console.log('=== CORRECTED MAXIMUM COMPLEXITY - ORCHESTRATOR TRIGGER ===');

// Create maximum complexity scenario with correct field names
const maxComplexityScenario = {
  name: 'CORRECTED MAXIMUM COMPLEXITY - Orchestrator Trigger Test',
  operation: 'debug', // highest weight: 2.0
  context: {
    files: Array.from({length: 100}, (_, i) => `massive${i}.js`), // 100 files = 20 points
    changeVolume: 10000, // CORRECT field name: 10,000 changes = 25 points max
    dependencies: 50, // 50 dependencies = 15 points max
    risk: 'critical', // critical risk = 1.6x multiplier
    estimatedDuration: 1000 // 1000 min = 15 points max
  }
};

console.log(`🔥 ${maxComplexityScenario.name}:`);
console.log(`   Operation: ${maxComplexityScenario.operation} (weight: 2.0)`);
console.log(`   Files: ${maxComplexityScenario.context.files.length} (20 pts max)`);
console.log(`   Change Volume: ${maxComplexityScenario.context.changeVolume} (25 pts max)`);
console.log(`   Dependencies: ${maxComplexityScenario.context.dependencies} (15 pts max)`);
console.log(`   Risk Level: ${maxComplexityScenario.context.risk} (1.6x multiplier)`);
console.log(`   Duration: ${maxComplexityScenario.context.estimatedDuration}min (15 pts max)`);

const metrics = complexityAnalyzer.analyzeComplexity(maxComplexityScenario.operation, maxComplexityScenario.context);
const complexity = complexityAnalyzer.calculateComplexityScore(metrics);

console.log(`\n📊 COMPLEXITY ANALYSIS RESULTS:`);
console.log(`   Raw Score: ${complexity.score}`);
console.log(`   Level: ${complexity.level}`);
console.log(`   Recommended Strategy: ${complexity.recommendedStrategy}`);
console.log(`   Estimated Agents: ${complexity.estimatedAgents}`);
console.log(`   Reasoning: ${complexity.reasoning.join(', ')}`);

if (complexity.score >= 95) {
  console.log(`\n🚀 ORCHESTRATOR WILL BE TRIGGERED!`);
  console.log(`   Score ${complexity.score} >= 95 threshold ✓`);
  console.log(`   This activates the full orchestration workflow!`);
} else {
  console.log(`\n⚠️ Orchestrator NOT triggered`);
  console.log(`   Score ${complexity.score} < 95 required`);
}

console.log('\n=== CORRECTED MAXIMUM COMPLEXITY TEST COMPLETE ===');