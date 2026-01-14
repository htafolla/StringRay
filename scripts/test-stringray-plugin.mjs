#!/usr/bin/env node

/**
 * StringRay Plugin Loading Test
 *
 * Tests that the StringRay codex injection plugin loads correctly
 * and properly injects codex content into system prompts.
 *
 * @version 1.0.0
 * @since 2026-01-13
 */

// Path configuration for cross-environment compatibility
// Check if we're running from a test environment (directory name contains 'stringray-' or 'test-')
const cwd = process.cwd();
const dirName = cwd.split('/').pop() || '';
const isTestEnvironment = dirName.includes('stringray-') || dirName.includes('final-stringray') || dirName.includes('test-');
const PLUGIN_PATH = process.env.STRINGRAY_PLUGIN_PATH ||
  (isTestEnvironment ? 'node_modules/stringray/dist/plugin/plugins' : 'dist/plugin/plugins');

console.log('🧪 Testing StringRay Plugin Loading...');
console.log('=====================================\n');

(async () => {
  try {
    // Dynamic import for cross-environment compatibility
    const fullPath = new URL(`${PLUGIN_PATH}/stringray-codex-injection.js`, `file://${cwd}/`).href;
    const { default: stringrayCodexPlugin } = await import(fullPath);
    const plugin = await stringrayCodexPlugin({});
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
      const hasCodex = allContent.includes('StringRay Framework Codex v1.2.20');
      const hasTerms = allContent.includes('Progressive Prod-Ready Code');

      console.log(`📚 Codex context injected: ${hasCodex ? '✅' : '❌'}`);
      console.log(`📋 Codex terms included: ${hasTerms ? '✅' : '❌'}`);

      if (hasCodex && hasTerms) {
        console.log('\n🎉 StringRay Framework Plugin Test: PASSED');
        console.log('✨ Framework is ready for oh-my-opencode integration');
      } else {
        console.log('\n❌ StringRay Framework Plugin Test: FAILED');
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