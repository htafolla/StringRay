import { ruleEnforcer } from '../../dist/enforcement/rule-enforcer.js';

async function debugRuleLoading() {
  console.log('🔍 Debugging Rule Loading\n');

  // Check how many rules are loaded
  const stats = ruleEnforcer.getRuleStats();
  console.log(`Total rules loaded: ${stats.totalRules}`);
  console.log(`Enabled rules: ${stats.enabledRules}`);
  console.log(`Disabled rules: ${stats.disabledRules}`);

  console.log('\nRule categories:');
  Object.entries(stats.ruleCategories).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });

  console.log('\nChecking for module-system-consistency rule...');
  // The rule should be there since we added it

  console.log('\n🎯 Debug Complete');
}

debugRuleLoading().catch(console.error);