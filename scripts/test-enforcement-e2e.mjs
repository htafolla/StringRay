#!/usr/bin/env node

/**
 * E2E Enforcement Validation Script
 * Tests codex enforcement in production build
 */

import { ruleEnforcer } from '../src/enforcement/rule-enforcer.js';

async function testOverEngineeringEnforcement() {
  console.log('🚀 Testing Over-Engineering Enforcement E2E\n');

  // Test 1: Over-engineered code should be BLOCKED
  const overEngineeredCode = `
    class AbstractFactoryStrategyObserver implements Strategy, Observer, Decorator {
      private observers: Observer[] = [];
      private strategies: Map<string, any> = new Map();

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

      private createStrategy(config: any): any {
        if (config.type === 'advanced') {
          return new AdvancedStrategy();
        } else if (config.type === 'basic') {
          return new BasicStrategy();
        } else {
          return new DefaultStrategy();
        }
      }
    }
  `;

  console.log('📝 Testing OVER-ENGINEERED code...');
  const result1 = await ruleEnforcer.validateOperation('write', {
    operation: 'write',
    newCode: overEngineeredCode,
    files: ['src/over-engineered.ts']
  });

  const blocked1 = !result1.passed;
  console.log(`❌ BLOCKED: ${blocked1 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`📊 Violations: ${result1.errors.length}`);

  if (result1.errors.length > 0) {
    console.log('🚫 VIOLATIONS:');
    result1.errors.slice(0, 2).forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Simple code should PASS
  const simpleCode = `
    export class UserService {
      private users: Map<string, User> = new Map();

      createUser(name: string, email: string): User {
        if (!name || !email) {
          throw new Error('Required fields');
        }
        const user = { id: Date.now().toString(), name, email };
        this.users.set(user.id, user);
        return user;
      }
    }
  `;

  console.log('📝 Testing SIMPLE code...');
  const result2 = await ruleEnforcer.validateOperation('write', {
    operation: 'write',
    newCode: simpleCode,
    files: ['src/simple-service.ts']
  });

  const passed2 = result2.passed;
  console.log(`✅ PASSED: ${passed2 ? 'YES ✅' : 'NO ❌'}`);
  console.log(`📊 Violations: ${result2.errors.length}`);

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Rule statistics
  console.log('📊 Rule Enforcement Statistics:');
  const stats = ruleEnforcer.getRuleStats();
  console.log(`Total Rules: ${stats.totalRules}`);
  console.log(`Enabled Rules: ${stats.enabledRules}`);
  console.log('Categories:', JSON.stringify(stats.ruleCategories, null, 2));

  console.log('\n' + '='.repeat(60));

  // Final assessment
  const overallSuccess = blocked1 && passed2 && stats.totalRules >= 11;
  console.log(`🎯 E2E VALIDATION: ${overallSuccess ? 'SUCCESS ✅' : 'FAILED ❌'}`);

  if (overallSuccess) {
    console.log('✅ Codex enforcement is working correctly in production!');
    console.log('✅ Over-engineered code is blocked');
    console.log('✅ Simple code is allowed');
    console.log('✅ All rules are properly registered');
  } else {
    console.log('❌ Enforcement validation failed');
    if (!blocked1) console.log('   - Over-engineered code was not blocked');
    if (!passed2) console.log('   - Simple code was incorrectly blocked');
    if (stats.totalRules < 11) console.log(`   - Only ${stats.totalRules}/11 rules registered`);
  }

  process.exit(overallSuccess ? 0 : 1);
}

testOverEngineeringEnforcement().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});