import { strRayOrchestrator } from './node_modules/strray-ai/dist/plugin/src/orchestrator.js';

console.log('=== ORCHESTRATOR-LED EXECUTION TEST ===');
console.log('Testing enterprise-level complexity that triggers orchestrator-led strategy...');

// Create enterprise-complexity tasks
const enterpriseTasks = [
  {
    id: 'enterprise-debug',
    type: 'debug',
    description: 'Enterprise debugging across 100 files with critical dependencies'
  },
  {
    id: 'security-audit',
    type: 'security',
    description: 'Comprehensive security audit of enterprise changes'
  },
  {
    id: 'performance-validation',
    type: 'performance',
    description: 'Performance impact validation for enterprise deployment'
  }
];

console.log(`Executing ${enterpriseTasks.length} enterprise tasks...`);
console.log('This should trigger orchestrator-led strategy due to complexity...');

try {
  const result = await strRayOrchestrator.executeComplexTask('Enterprise Operation', enterpriseTasks);
  console.log('✅ Orchestrator execution completed successfully');
  console.log(`📊 Processed ${result.length} tasks`);
  console.log('🔍 Check activity logs for orchestrator-led delegation details');
} catch (error) {
  console.error('❌ Orchestrator execution failed:', error.message);
}

console.log('=== ORCHESTRATOR-LED TEST COMPLETE ===');