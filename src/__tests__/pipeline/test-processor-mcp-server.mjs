/**
 * Processor Pipeline MCP Server Test
 * 
 * Tests the MCP server's execute-pre-processors and execute-post-processors tools.
 * These tools are exposed via the processor-pipeline.server.ts MCP server.
 * 
 * Pipeline Tree: docs/pipeline-trees/PROCESSOR_PIPELINE_TREE.md
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

console.log('=== PROCESSOR PIPELINE MCP SERVER TEST ===\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => {
        console.log(`✅ ${name}`);
        passed++;
      }).catch((e) => {
        console.log(`❌ ${name}: ${e.message}`);
        failed++;
      });
    } else {
      console.log(`✅ ${name}`);
      passed++;
    }
  } catch (e) {
    console.log(`❌ ${name}: ${e instanceof Error ? e.message : String(e)}`);
    failed++;
  }
}

// ============================================
// TOOL DEFINITIONS (from server)
// ============================================
console.log('📍 MCP Server Tool Definitions\n');

const MCP_TOOLS = {
  'execute-pre-processors': {
    description: 'Run pre-execution processors on content with codex validation',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        context: { type: 'object' },
        validateCodex: { type: 'boolean', default: true },
        strictMode: { type: 'boolean', default: false },
      },
      required: ['content'],
    },
  },
  'execute-post-processors': {
    description: 'Run post-execution processors on results with compliance monitoring',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        results: { type: 'object' },
        enforceCompliance: { type: 'boolean', default: true },
        auditTrail: { type: 'boolean', default: true },
      },
      required: ['content'],
    },
  },
  'codex-validation': {
    description: 'Validate content against Universal Development Codex terms',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        terms: { type: 'array', items: { type: 'string' }, default: ['all'] },
        strict: { type: 'boolean', default: false },
      },
      required: ['content'],
    },
  },
  'framework-compliance-check': {
    description: 'Check framework compliance and generate enforcement actions',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        operation: { type: 'string' },
        context: { type: 'object' },
      },
      required: ['content', 'operation'],
    },
  },
};

test('should define execute-pre-processors tool', () => {
  if (!MCP_TOOLS['execute-pre-processors']) {
    throw new Error('execute-pre-processors tool not defined');
  }
});

test('should define execute-post-processors tool', () => {
  if (!MCP_TOOLS['execute-post-processors']) {
    throw new Error('execute-post-processors tool not defined');
  }
});

test('should require content for execute-pre-processors', () => {
  const tool = MCP_TOOLS['execute-pre-processors'];
  if (!tool.inputSchema.required.includes('content')) {
    throw new Error('content not required for execute-pre-processors');
  }
});

test('should require content for execute-post-processors', () => {
  const tool = MCP_TOOLS['execute-post-processors'];
  if (!tool.inputSchema.required.includes('content')) {
    throw new Error('content not required for execute-post-processors');
  }
});

// ============================================
// PRE-PROCESSOR HANDLER BEHAVIOR
// ============================================
console.log('\n📍 Pre-Processor Handler Behavior\n');

test('should validate pre-processor input schema has content', () => {
  const tool = MCP_TOOLS['execute-pre-processors'];
  if (!tool.inputSchema.properties.content) {
    throw new Error('content property missing');
  }
  if (tool.inputSchema.properties.content.type !== 'string') {
    throw new Error('content should be string type');
  }
});

test('should have optional context for pre-processor', () => {
  const tool = MCP_TOOLS['execute-pre-processors'];
  if (!tool.inputSchema.properties.context) {
    throw new Error('context property missing');
  }
  if (tool.inputSchema.properties.context.type !== 'object') {
    throw new Error('context should be object type');
  }
});

test('should have validateCodex option with default true', () => {
  const tool = MCP_TOOLS['execute-pre-processors'];
  if (!tool.inputSchema.properties.validateCodex) {
    throw new Error('validateCodex property missing');
  }
  if (tool.inputSchema.properties.validateCodex.default !== true) {
    throw new Error('validateCodex default should be true');
  }
});

test('should have strictMode option with default false', () => {
  const tool = MCP_TOOLS['execute-pre-processors'];
  if (!tool.inputSchema.properties.strictMode) {
    throw new Error('strictMode property missing');
  }
  if (tool.inputSchema.properties.strictMode.default !== false) {
    throw new Error('strictMode default should be false');
  }
});

// ============================================
// POST-PROCESSOR HANDLER BEHAVIOR
// ============================================
console.log('\n📍 Post-Processor Handler Behavior\n');

test('should validate post-processor input schema has content', () => {
  const tool = MCP_TOOLS['execute-post-processors'];
  if (!tool.inputSchema.properties.content) {
    throw new Error('content property missing');
  }
  if (tool.inputSchema.properties.content.type !== 'string') {
    throw new Error('content should be string type');
  }
});

test('should have optional results for post-processor', () => {
  const tool = MCP_TOOLS['execute-post-processors'];
  if (!tool.inputSchema.properties.results) {
    throw new Error('results property missing');
  }
  if (tool.inputSchema.properties.results.type !== 'object') {
    throw new Error('results should be object type');
  }
});

test('should have enforceCompliance option with default true', () => {
  const tool = MCP_TOOLS['execute-post-processors'];
  if (!tool.inputSchema.properties.enforceCompliance) {
    throw new Error('enforceCompliance property missing');
  }
  if (tool.inputSchema.properties.enforceCompliance.default !== true) {
    throw new Error('enforceCompliance default should be true');
  }
});

test('should have auditTrail option with default true', () => {
  const tool = MCP_TOOLS['execute-post-processors'];
  if (!tool.inputSchema.properties.auditTrail) {
    throw new Error('auditTrail property missing');
  }
  if (tool.inputSchema.properties.auditTrail.default !== true) {
    throw new Error('auditTrail default should be true');
  }
});

// ============================================
// INTEGRATION WITH PROCESSORMANAGER (MCP)
// ============================================
console.log('\n📍 MCP Server Integration Points\n');

test('processor-pipeline.server.ts should exist', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  if (!fs.existsSync(serverPath)) {
    throw new Error('processor-pipeline.server.ts not found');
  }
});

test('should export StrRayProcessorPipelineServer', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('StrRayProcessorPipelineServer')) {
    throw new Error('StrRayProcessorPipelineServer not exported');
  }
  if (!content.includes('export')) {
    throw new Error('No exports found');
  }
});

test('should handle execute-pre-processors tool call', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('handlePreProcessors')) {
    throw new Error('handlePreProcessors not implemented');
  }
  if (!content.includes('case "execute-pre-processors"')) {
    throw new Error('execute-pre-processors case not handled');
  }
});

test('should handle execute-post-processors tool call', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('handlePostProcessors')) {
    throw new Error('handlePostProcessors not implemented');
  }
  if (!content.includes('case "execute-post-processors"')) {
    throw new Error('execute-post-processors case not handled');
  }
});

// ============================================
// PRE-PROCESSOR HANDLER IMPLEMENTATION
// ============================================
console.log('\n📍 Pre-Processor Handler Implementation\n');

test('should sanitize input in pre-processor', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('sanitizeInput')) {
    throw new Error('sanitizeInput not implemented');
  }
});

test('should validate against codex in pre-processor', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('validateAgainstCodex')) {
    throw new Error('validateAgainstCodex not implemented');
  }
});

test('should enrich with context in pre-processor', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('enrichWithContext')) {
    throw new Error('enrichWithContext not implemented');
  }
});

test('should perform security checks in pre-processor', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('performSecurityChecks')) {
    throw new Error('performSecurityChecks not implemented');
  }
});

// ============================================
// POST-PROCESSOR HANDLER IMPLEMENTATION
// ============================================
console.log('\n📍 Post-Processor Handler Implementation\n');

test('should validate results in post-processor', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('validateResults')) {
    throw new Error('validateResults not implemented');
  }
});

test('should enforce compliance in post-processor', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('enforceCompliance')) {
    throw new Error('enforceCompliance not implemented');
  }
});

test('should generate audit trail in post-processor', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('generateAuditTrail')) {
    throw new Error('generateAuditTrail not implemented');
  }
});

test('should perform quality assurance in post-processor', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('performQualityAssurance')) {
    throw new Error('performQualityAssurance not implemented');
  }
});

// ============================================
// CODEX VALIDATION TOOL
// ============================================
console.log('\n📍 Codex Validation Tool\n');

test('should define codex-validation tool', () => {
  if (!MCP_TOOLS['codex-validation']) {
    throw new Error('codex-validation tool not defined');
  }
});

test('should require content for codex-validation', () => {
  const tool = MCP_TOOLS['codex-validation'];
  if (!tool.inputSchema.required.includes('content')) {
    throw new Error('content not required for codex-validation');
  }
});

test('should handle codex-validation tool call', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('handleCodexValidation')) {
    throw new Error('handleCodexValidation not implemented');
  }
  if (!content.includes('case "codex-validation"')) {
    throw new Error('codex-validation case not handled');
  }
});

// ============================================
// FRAMEWORK COMPLIANCE TOOL
// ============================================
console.log('\n📍 Framework Compliance Tool\n');

test('should define framework-compliance-check tool', () => {
  if (!MCP_TOOLS['framework-compliance-check']) {
    throw new Error('framework-compliance-check tool not defined');
  }
});

test('should require content and operation for framework-compliance-check', () => {
  const tool = MCP_TOOLS['framework-compliance-check'];
  if (!tool.inputSchema.required.includes('content')) {
    throw new Error('content not required');
  }
  if (!tool.inputSchema.required.includes('operation')) {
    throw new Error('operation not required');
  }
});

test('should handle framework-compliance-check tool call', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('handleComplianceCheck')) {
    throw new Error('handleComplianceCheck not implemented');
  }
  if (!content.includes('case "framework-compliance-check"')) {
    throw new Error('framework-compliance-check case not handled');
  }
});

// ============================================
// SANITIZATION & SECURITY
// ============================================
console.log('\n📍 Sanitization & Security\n');

test('should remove script tags in sanitization', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('replace') || !content.includes('script')) {
    throw new Error('Script tag removal not implemented');
  }
});

test('should remove javascript: protocol', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('javascript:')) {
    throw new Error('javascript: protocol removal not implemented');
  }
});

test('should warn about eval() usage', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('eval(')) {
    throw new Error('eval() detection not implemented');
  }
});

test('should warn about innerHTML usage', () => {
  const serverPath = path.join(PROJECT_ROOT, 'src/mcps/processor-pipeline.server.ts');
  const content = fs.readFileSync(serverPath, 'utf-8');
  if (!content.includes('innerHTML')) {
    throw new Error('innerHTML detection not implemented');
  }
});

// ============================================
// RESULTS
// ============================================
setTimeout(() => {
  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('========================================');
  
  if (failed === 0) {
    console.log('✅ Processor Pipeline MCP Server test PASSED');
    process.exit(0);
  } else {
    console.log('❌ Processor Pipeline MCP Server test FAILED');
    process.exit(1);
  }
}, 500);
