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

// Check for basic-only flag to prevent recursive comprehensive testing
const isBasicOnly = process.argv.includes("--basic-only");

// Path configuration for cross-environment compatibility
// Check if we're running from a test environment (directory name contains 'stringray-' or 'test-')
const cwd = process.cwd();
const dirName = cwd.split("/").pop() || "";
const fs = await import("fs");
const path = await import("path");

// More robust detection: check for installed strray-ai package
const deployedPluginPath = path.join(
  cwd,
  "node_modules",
  "strray-ai",
  "dist",
  "plugin",
  "plugins",
);
const isDeployedEnvironment = fs.existsSync(
  path.join(cwd, "node_modules", "strray-ai"),
);

// Also check directory name patterns for backward compatibility
const isTestEnvironment =
  dirName.includes("stringray-") ||
  dirName.includes("final-stringray") ||
  dirName.includes("test-") ||
  dirName.includes("deploy-verify") ||
  dirName.includes("final-test") ||
  dirName.includes("jelly") ||
  isDeployedEnvironment;

// When running from within an installed package, use relative path
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isInstalledPackage = __dirname.includes("node_modules/strray-ai");
const PLUGIN_PATH =
  process.env.STRINGRAY_PLUGIN_PATH ||
  (isInstalledPackage
    ? "../dist/plugin/plugins" // Relative to scripts/ directory
    : isTestEnvironment
      ? "node_modules/strray-ai/dist/plugin/plugins"
      : "dist/plugin/plugins");

console.log("🧪 Testing StringRay Plugin Loading...");
console.log("=====================================\n");
console.log("Current working directory:", process.cwd());
console.log("Script location:", import.meta.url);

(async () => {
  try {
    // Import the plugin using relative path for consumer compatibility
    const pluginModule =
      await import("../dist/plugin/plugins/strray-codex-injection.js");
    const plugin = pluginModule.default;
    console.log("✅ Plugin loaded successfully");

    // Test the system transform hook
    const testOutput = { system: [] };
    if (plugin && plugin["experimental.chat.system.transform"]) {
      await plugin["experimental.chat.system.transform"]({}, testOutput);
      console.log("✅ System transform hook executed");
      console.log("📝 System messages added:", testOutput.system.length);
    } else {
      console.log("❌ System transform hook not found");
      console.log("Plugin object:", typeof plugin, plugin ? Object.keys(plugin) : "null/undefined");
    }

    console.log("✅ System transform hook executed");
    console.log(`📝 System messages added: ${testOutput.system?.length || 0}`);

    if (testOutput.system && testOutput.system.length > 0) {
      const firstMessage = testOutput.system[0];
      const messageContent = typeof firstMessage === 'string' ? firstMessage : firstMessage.content || '';
      console.log(
        `✨ Welcome message: ${messageContent.substring(0, 80)}...`,
      );

      // Check if codex content is included
      const allContent = testOutput.system.map(msg =>
        typeof msg === 'string' ? msg : msg.content || ''
      ).join("\\n");
      const hasCodex = allContent.includes("StringRay Framework Codex v1.2.25");
      const hasTerms = allContent.includes("Progressive Prod-Ready Code");

      console.log(`📚 Codex context injected: ${hasCodex ? "✅" : "❌"}`);
      console.log(`📋 Codex terms included: ${hasTerms ? "✅" : "❌"}`);

      if (hasCodex && hasTerms) {
        console.log("\n🎉 StringRay Framework Plugin Test: PASSED");
        console.log("✨ Framework is ready for oh-my-opencode integration");

        // Run comprehensive deployment tests unless basic-only flag is set
        if (!isBasicOnly) {
          await runComprehensiveTests();
        } else {
          // Basic test passed and basic-only flag was set - exit successfully
          process.exit(0);
        }
      } else {
        console.log("\n❌ StringRay Framework Plugin Test: FAILED");
        process.exit(1);
      }
    } else {
      console.log("❌ No system messages generated");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Plugin loading failed:", error);
    process.exit(1);
  }
})();

// Comprehensive deployment validation function
async function runComprehensiveTests() {
  console.log("\n🔬 Running comprehensive deployment validation...\n");

  // Get the directory path in ES modules
  const { fileURLToPath } = await import("url");
  const { dirname } = await import("path");
  const __dirname = dirname(fileURLToPath(import.meta.url));

  const tests = [
    {
      name: "MCP Configuration Validation",
      command: `node ${__dirname}/test-path-resolver.mjs`,
      description: "Validates MCP server configuration and path resolution",
    },
    {
      name: "Plugin System Validation",
      command: `node ${__dirname}/test-stringray-plugin.mjs --basic-only`,
      description: "Tests basic plugin loading without comprehensive tests",
    },
    {
      name: "Codex Integration Test",
      command: `node ${__dirname}/validate-codex.js`,
      description: "Validates codex parsing and injection functionality",
    },
    {
      name: "Process Communication Test",
      command: `node ${__dirname}/test-comprehensive-path-resolution.mjs`,
      description: "Tests path resolution and process communication",
    },
    {
      name: "Simple Prompt Orchestration Test",
      command: `node ${__dirname}/test-simple-prompt.mjs`,
      description: "Tests basic prompt orchestration with simple task",
    },
    {
      name: "Complex Multi-Agent Orchestration Test",
      command: `node ${__dirname}/test-complex-orchestration.mjs`,
      description:
        "Tests complex multi-agent orchestration with interdependent tasks",
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`🧪 Running ${test.name}...`);
    console.log(`   ${test.description}`);

    try {
      const { spawn } = await import("child_process");
      const [cmd, ...args] = test.command.split(" ");

      await new Promise((resolve, reject) => {
        const child = spawn(cmd, args, {
          stdio: ["pipe", "pipe", "pipe"],
          cwd: process.cwd(),
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("close", (code) => {
          if (code === 0) {
            console.log(`   ✅ PASSED\n`);
            passed++;
            resolve();
          } else {
            console.log(`   ❌ FAILED (exit code: ${code})`);
            if (stderr) console.log(`   Error: ${stderr.slice(0, 200)}...`);
            console.log("");
            failed++;
            resolve(); // Continue with other tests
          }
        });

        child.on("error", (error) => {
          console.log(`   ❌ FAILED (spawn error: ${error.message})`);
          console.log("");
          failed++;
          resolve();
        });
      });
    } catch (error) {
      console.log(`   ❌ FAILED (exception: ${error.message})`);
      console.log("");
      failed++;
    }
  }

  console.log("📊 Comprehensive Test Results:");
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(
    `   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`,
  );

  if (failed === 0) {
    console.log("\n🎉 ALL COMPREHENSIVE TESTS PASSED!");
    console.log(
      "✨ StringRay Framework is fully operational and ready for production use.",
    );
    process.exit(0);
  } else {
    console.log(
      `\n⚠️  ${failed} test(s) failed. Please check the framework configuration.`,
    );
    process.exit(1);
  }
}
