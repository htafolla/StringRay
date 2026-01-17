#!/usr/bin/env node

/**
 * Simple simulation runner for testing rule enforcement
 */

// Path configuration for cross-environment compatibility
const ENFORCEMENT_PATH = process.env.STRRAY_ENFORCEMENT_PATH || '../dist/enforcement';

import { ruleEnforcer } from `${ENFORCEMENT_PATH}/rule-enforcer.js`;

async function testImportConsistencyRule() {
  console.log('🔍 Testing Import Consistency Rule...\n');

  // Test case 1: Good import (should pass)
  console.log('Test 1: Good relative import with extension');
  const goodImport = `import { UserService } from '../services/user-service.js';
import { validateEmail } from './utils/validation.js';`;

  const result1 = await ruleEnforcer.validateOperation('write', {
    operation: 'write',
    newCode: goodImport,
    files: ['test.ts']
  });

  console.log(`Result: ${result1.passed ? '✅ PASS' : '❌ FAIL'}`);
  if (result1.errors.length > 0) {
    console.log('Errors:', result1.errors);
  }
  console.log();

  // Test case 2: Bad import from src/ (should fail)
  console.log('Test 2: Bad import from src/ directory');
  const badImport = `import { helper } from '../src/utils/helper.js';`;

  const result2 = await ruleEnforcer.validateOperation('write', {
    operation: 'write',
    newCode: badImport,
    files: ['test.ts']
  });

  console.log(`Result: ${result2.passed ? '✅ PASS' : '❌ FAIL'}`);
  if (result2.errors.length > 0) {
    console.log('Errors:', result2.errors);
  }
  console.log();

  // Test case 3: Bad import from dist/ (should fail)
  console.log('Test 3: Bad import from dist/ directory');
  const distImport = `import { config } from '../dist/config.js';`;

  const result3 = await ruleEnforcer.validateOperation('write', {
    operation: 'write',
    newCode: distImport,
    files: ['test.ts']
  });

  console.log(`Result: ${result3.passed ? '✅ PASS' : '❌ FAIL'}`);
  if (result3.errors.length > 0) {
    console.log('Errors:', result3.errors);
  }
}

async function testOverEngineeringRule() {
  console.log('🏗️ Testing No Over-Engineering Rule...\n');

  // Test case 1: Simple function (should pass)
  console.log('Test 1: Simple function');
  const simpleFunc = `export function add(a: number, b: number): number {
  return a + b;
}`;

  const result1 = await ruleEnforcer.validateOperation('write', {
    operation: 'write',
    newCode: simpleFunc,
    files: ['test.ts']
  });

  console.log(`Result: ${result1.passed ? '✅ PASS' : '❌ FAIL'}`);
  if (result1.errors.length > 0) {
    console.log('Errors:', result1.errors);
  }
  console.log();

  // Test case 2: Over-engineered (should fail)
  console.log('Test 2: Over-engineered code');
  const overEngineered = `class AbstractFactoryStrategyObserver implements Strategy, Observer, Decorator {
  executeComplex(data: any): any {
    if (data) {
      if (data.type === 'strategy') {
        if (data.config) {
          if (data.config.enabled) {
            return this.createStrategy(data.config);
          }
        }
      }
    }
    return null;
  }
}`;

  const result2 = await ruleEnforcer.validateOperation('write', {
    operation: 'write',
    newCode: overEngineered,
    files: ['test.ts']
  });

  console.log(`Result: ${result2.passed ? '✅ PASS' : '❌ FAIL'}`);
  if (result2.errors.length > 0) {
    console.log('Errors:', result2.errors);
  }
}

async function main() {
  console.log('🎯 RULE ENFORCEMENT TESTING\n');

  try {
    await testImportConsistencyRule();
    console.log('─'.repeat(60));
    await testOverEngineeringRule();

    console.log('\n✅ Testing completed');
  } catch (error) {
    console.error('❌ Testing failed:', error);
  }
}

main();