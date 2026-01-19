import { complexityAnalyzer } from './node_modules/strray-ai/dist/plugin/delegation/complexity-analyzer.js';

console.log('=== MAXIMUM COMPLEXITY SCENARIO - ORCHESTRATOR TRIGGER ===');

// Create maximum complexity scenario to trigger orchestrator-led
const maxComplexityScenario = {
  name: 'MAXIMUM COMPLEXITY - Orchestrator Trigger Test',
  operation: 'debug', // highest weight: 2.0
  context: {
    files: Array.from({length: 100}, (_, i) => `massive${i}.js`), // 100 files = 20 points
    changes: 10000, // 10,000 changes = 25 points max
    dependencies: 50, // 50 dependencies = 15 points max
    risk: 'critical', // critical risk = 1.6x multiplier
    estimatedDuration: 1000 // 1000 min = 15 points max
  }
};

console.log(`🔥 ${maxComplexityScenario.name}:`);
console.log(`   Operation: ${maxComplexityScenario.operation} (weight: 2.0)`);
console.log(`   Files: ${maxComplexityScenario.context.files.length} (20 pts max)`);
console.log(`   Changes: ${maxComplexityScenario.context.changes} (25 pts max)`);
console.log(`   Dependencies: ${maxComplexityScenario.context.dependencies} (15 pts max)`);
console.log(`   Risk Level: ${maxComplexityScenario.context.risk} (1.6x multiplier)`);
console.log(`   Duration: ${maxComplexityScenario.context.estimatedDuration}min (15 pts max)`);

// Calculate step by step
const metrics = complexityAnalyzer.analyzeComplexity(maxComplexityScenario.operation, maxComplexityScenario.context);
console.log(`\n📊 STEP-BY-STEP CALCULATION:`);
console.log(`   File contribution: ${Math.min(metrics.fileCount * 2, 20)} pts`);
console.log(`   Change contribution: ${Math.min(metrics.changeVolume / 10, 25)} pts`);
const baseScore = Math.min(metrics.fileCount * 2, 20) + Math.min(metrics.changeVolume / 10, 25);
console.log(`   Base score: ${baseScore} pts`);
console.log(`   Operation weight: ${complexityAnalyzer.operationWeights[metrics.operationType]}x`);
const weightedScore = baseScore * complexityAnalyzer.operationWeights[metrics.operationType];
console.log(`   After operation weight: ${weightedScore} pts`);
console.log(`   Dependencies: +${Math.min(metrics.dependencies * 3, 15)} pts`);
const withDeps = weightedScore + Math.min(metrics.dependencies * 3, 15);
console.log(`   Risk multiplier: ${complexityAnalyzer.riskMultipliers[metrics.riskLevel]}x`);
const withRisk = withDeps * complexityAnalyzer.riskMultipliers[metrics.riskLevel];
console.log(`   After risk multiplier: ${withRisk} pts`);
console.log(`   Duration: +${Math.min(metrics.estimatedDuration / 10, 15)} pts`);

const complexity = complexityAnalyzer.calculateComplexityScore(metrics);
console.log(`\n🎯 FINAL COMPLEXITY SCORE: ${complexity.score}`);
console.log(`   Level: ${complexity.level}`);
console.log(`   Strategy: ${complexity.recommendedStrategy}`);
console.log(`   Agents: ${complexity.estimatedAgents}`);

if (complexity.score >= 95) {
  console.log(`\n🚀 ORCHESTRATOR WILL BE TRIGGERED!`);
  console.log(`   Score ${complexity.score} >= 95 threshold ✓`);
  console.log(`   Strategy: orchestrator-led ✓`);
  console.log(`   This would activate the full orchestration workflow!`);
} else {
  console.log(`\n⚠️ Orchestrator threshold not reached`);
  console.log(`   Score ${complexity.score} < 95 required`);
}

console.log('\n=== MAXIMUM COMPLEXITY TEST COMPLETE ===');