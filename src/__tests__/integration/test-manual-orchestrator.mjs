import { strRayOrchestrator } from './node_modules/strray-ai/dist/plugin/orchestrator.js';

console.log('=== MANUAL ORCHESTRATOR TRIGGER TEST ===');
console.log('Initial status:', strRayOrchestrator.getStatus());

console.log('\nCreating simple task...');
const simpleTask = {
  id: 'manual-simple-test',
  type: 'test',
  description: 'Manual simple task trigger'
};

console.log('Executing simple task...');
const simpleResult = await strRayOrchestrator.executeComplexTask('Simple Manual Test', [simpleTask]);
console.log('Simple task result:', simpleResult);

console.log('\nFinal status:', strRayOrchestrator.getStatus());
console.log('=== TEST COMPLETE ===');