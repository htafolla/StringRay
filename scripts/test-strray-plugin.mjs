#!/usr/bin/env node

/**
 * StrRay Plugin Loading Test
 *
 * Tests that the StrRay codex injection plugin loads correctly
 * and properly injects codex content into system prompts.
 *
 * @version 1.0.0
 * @since 2026-01-12
 */

// Path configuration for cross-environment compatibility
const PLUGIN_PATH = process.env.STRRAY_PLUGIN_PATH || '../dist/plugin/plugins';

import strrayCodexPlugin from `${PLUGIN_PATH}/strray-codex-injection.js`;

console.log('🧪 Testing StrRay Plugin Loading...');
console.log('=====================================\n');

(async () => {
  try {
    const plugin = await strrayCodexPlugin({});
    console.log('✅ Plugin loaded successfully');

    // Test the system transform hook
    const testOutput = { system: [] };
    await plugin['experimental.chat.system.transform']({}, testOutput);

    console.log('✅ System transform hook executed');
    console.log(`📝 System messages added: ${testOutput.system?.length || 0}`);

    if (testOutput.system && testOutput.system.length > 0) {
      console.log(`✨ Welcome message: ${testOutput.system[0].substring(0, 80)}...`);

      // Check if codex content is included
      const allContent = testOutput.system.join('\n');
      const hasCodex = allContent.includes('StrRay Codex Context');
      const hasTerms = allContent.includes('#### 1.');

      console.log(`📚 Codex context injected: ${hasCodex ? '✅' : '❌'}`);
      console.log(`📋 Codex terms included: ${hasTerms ? '✅' : '❌'}`);

      if (hasCodex && hasTerms) {
        console.log('\n🎉 StrRay Framework Plugin Test: PASSED');
        console.log('✨ Framework is ready for oh-my-opencode integration');
      } else {
        console.log('\n❌ StrRay Framework Plugin Test: FAILED');
        process.exit(1);
      }
    } else {
      console.log('❌ No system messages generated');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Plugin loading failed:', error);
    process.exit(1);
  }
})();