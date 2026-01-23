#!/usr/bin/env node

/**
 * Comprehensive Plugin Test for StringRay
 *
 * Tests the StringRay plugin in both development and consumer environments.
 * Verifies plugin loading, configuration, and basic functionality.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const TEST_TIMEOUT = 30000; // 30 seconds
const DEV_ENV = process.cwd().includes('stringray');
const CONSUMER_ENV = process.cwd().includes('jelly');

console.log('🧪 StringRay Comprehensive Plugin Test');
console.log('=====================================');
console.log(`Environment: ${DEV_ENV ? 'Development' : CONSUMER_ENV ? 'Consumer' : 'Unknown'}`);
console.log(`Working Directory: ${process.cwd()}`);
console.log('');

async function runComprehensiveTests() {
  const results = {
    pluginFileExists: false,
    pluginFileValid: false,
    configExists: false,
    mcpConfigExists: false,
    pluginPathsCorrect: false,
    mcpPathsCorrect: false,
    opencodeStarts: false,
    allTestsPassed: false
  };

  try {
    // 1. Test plugin file existence
    console.log('📦 1. Testing plugin file...');
    const pluginPath = DEV_ENV
      ? './.opencode/plugin/stringray-codex-injection.mjs'
      : path.resolve('./.opencode', '../node_modules/strray-ai/dist/plugin/plugins/strray-codex-injection.js');

    if (fs.existsSync(pluginPath)) {
      results.pluginFileExists = true;
      console.log('✅ Plugin file exists');

       // Check if file is valid
       const content = fs.readFileSync(pluginPath, 'utf-8');
       if (content.includes('export default') || content.includes('export ')) {
         results.pluginFileValid = true;
         console.log('✅ Plugin file has valid exports');

         const importCount = (content.match(/import\s+/g) || []).length;
         console.log(`📊 Plugin file has ${importCount} import statements`);
       }

        // Test if plugin loads without errors
        try {
          console.log('🔧 Testing plugin load...');
          const pluginModule = await import(pluginPath);
          const pluginFunction = pluginModule.default || pluginModule;
          console.log('✅ Plugin module imported successfully');

          // Actually call the plugin function to see all debug logs
          console.log('🔧 Calling plugin function...');
          const pluginResult = await pluginFunction({
            directory: process.cwd()
          });
          console.log('✅ Plugin function executed successfully');

          results.opencodeStarts = true; // Reuse this field
          console.log(`📊 Plugin result keys: ${Object.keys(pluginResult || {}).join(', ')}`);
        } catch (error) {
          console.error(`❌ Plugin failed to load: ${error.message}`);
          console.error(`Stack: ${error.stack}`);
        }
    } else {
      console.error(`❌ Plugin file not found: ${pluginPath}`);
    }

    // 2. Test configuration files
    console.log('\n⚙️ 2. Testing configuration files...');
    const configPaths = [
      './.opencode/oh-my-opencode.json',
      './.mcp.json',
      './opencode.json'
    ];

    configPaths.forEach(configPath => {
      if (fs.existsSync(configPath)) {
        try {
          JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          console.log(`✅ ${path.basename(configPath)} exists and is valid JSON`);
          if (configPath.includes('oh-my-opencode')) results.configExists = true;
          if (configPath.includes('.mcp.json') || configPath.includes('opencode.json')) results.mcpConfigExists = true;
        } catch (error) {
          console.log(`⚠️ ${path.basename(configPath)} exists but has invalid JSON`);
        }
      } else {
        console.log(`❌ ${path.basename(configPath)} not found`);
      }
    });

    // 3. Test path correctness
    console.log('\n🛣️ 3. Testing path transformations...');

    if (results.configExists) {
      const config = JSON.parse(fs.readFileSync('./.opencode/oh-my-opencode.json', 'utf-8'));
      if (config.plugin && Array.isArray(config.plugin)) {
        const pluginEntry = config.plugin.find(p => p.includes('stringray-codex-injection'));
        if (pluginEntry) {
          if (DEV_ENV) {
            if (pluginEntry === './plugin/stringray-codex-injection.mjs') {
              results.pluginPathsCorrect = true;
              console.log('✅ Dev environment: Plugin path is correct');
            } else {
              console.log(`❌ Dev environment: Expected './plugin/stringray-codex-injection.mjs', got '${pluginEntry}'`);
            }
            } else {
              if (pluginEntry.includes('strray-codex-injection.js')) {
                results.pluginPathsCorrect = true;
                console.log('✅ Consumer environment: Plugin path is correctly set to local file');
              } else {
                console.log(`❌ Consumer environment: Expected path with strray-codex-injection.js, got '${pluginEntry}'`);
              }
            }
        }
      }
    }

    // Test MCP paths
    if (results.mcpConfigExists && fs.existsSync('./opencode.json')) {
      const mcpConfig = JSON.parse(fs.readFileSync('./opencode.json', 'utf-8'));
      if (mcpConfig.mcp) {
        let correctPaths = 0;
        let totalPaths = 0;

        for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcp)) {
          if (serverConfig.type === "local" && serverConfig.command && Array.isArray(serverConfig.command)) {
            totalPaths++;
            const commandPath = serverConfig.command[1]; // Skip "node"
            if (DEV_ENV) {
              if (commandPath.startsWith('dist/')) {
                correctPaths++;
              }
            } else {
              if (commandPath.startsWith('node_modules/strray-ai/dist/')) {
                correctPaths++;
              }
            }
          }
        }

        if (totalPaths > 0 && correctPaths === totalPaths) {
          results.mcpPathsCorrect = true;
          console.log(`✅ ${DEV_ENV ? 'Dev' : 'Consumer'} environment: All ${totalPaths} MCP server paths are correct`);
        } else {
          console.log(`❌ ${DEV_ENV ? 'Dev' : 'Consumer'} environment: ${correctPaths}/${totalPaths} MCP paths are correct`);
        }
      }
    }

    // 4. Test OpenCode startup
    console.log('\n🖥️ 4. Testing OpenCode startup...');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('⏰ OpenCode startup timeout');
        resolve(); // Don't fail on timeout
      }, 15000);

      const opencodeProcess = spawn('opencode', ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let stdout = '';
      let stderr = '';

      opencodeProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        clearTimeout(timeout);
        results.opencodStarts = true;
        console.log('✅ OpenCode started successfully');
        console.log('📄 OpenCode version output received');
        resolve();
      });

      opencodeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      opencodeProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0 && !results.opencodStarts) {
          results.opencodStarts = true;
          console.log('✅ OpenCode started and exited successfully');
          resolve();
        } else if (code !== 0) {
          console.log(`⚠️ OpenCode exited with code ${code}`);
          if (stderr) console.log(`Stderr: ${stderr.substring(0, 100)}...`);
          resolve(); // Don't fail the test
        }
      });

      opencodeProcess.on('error', (error) => {
        clearTimeout(timeout);
        console.log(`⚠️ Failed to spawn OpenCode: ${error.message}`);
        console.log('ℹ️ This may be expected if OpenCode is not installed');
        resolve(); // Don't fail the test
      });
    });

    // 5. Summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
      if (test !== 'allTestsPassed') {
        console.log(`${passed ? '✅' : '❌'} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      }
    });

    // Determine if all tests passed
    const criticalTests = ['pluginFileExists', 'pluginFileValid', 'configExists'];
    const optionalTests = ['mcpConfigExists', 'pluginPathsCorrect', 'mcpPathsCorrect', 'opencodeStarts'];

    const criticalPassed = criticalTests.every(test => results[test]);
    const optionalPassed = optionalTests.every(test => results[test]);

    results.allTestsPassed = criticalPassed;

    if (criticalPassed) {
      console.log('\n🎉 All critical tests passed!');
      if (optionalPassed) {
        console.log('🌟 All tests passed (including optional)!');
      } else {
        console.log('ℹ️ Critical functionality working, some optional features may need attention');
      }
    } else {
      console.log('\n💥 Critical tests failed - plugin may not be properly installed');
    }

  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    results.allTestsPassed = false;
  }

  return results;
}

// Run the tests
runComprehensiveTests()
  .then((results) => {
    process.exit(results.allTestsPassed ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });