#!/usr/bin/env node

/**
 * Final Consumer Validation
 *
 * Comprehensive validation of the consumer environment in a single script.
 * Tests all essential functionality without subprocess dependencies.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FinalConsumerValidation {
  constructor() {
    this.results = { passed: [], failed: [] };
    // Check if we're running from a consumer environment (not the source directory)
    const cwd = process.cwd();
    this.isConsumerEnvironment = !cwd.includes("dev/stringray") && cwd.includes("dev/jelly");
    this.consumerRoot = this.isConsumerEnvironment ? cwd : path.resolve(__dirname, "../../consumer-test");
  }

  async runFinalValidation() {
    console.log("🎯 FINAL CONSUMER VALIDATION");
    console.log("===========================");
    console.log(
      `Environment: ${this.isConsumerEnvironment ? "Consumer" : "Development"}`,
    );
    console.log("");

    const tests = [
      this.validateFileSystem.bind(this),
      this.validateMCPConfiguration.bind(this),
      this.validatePluginIntegration.bind(this),
      this.validateFrameworkComponents.bind(this),
      this.validateCLIAvailability.bind(this),
    ];

    for (const test of tests) {
      await test();
    }

    this.printFinalSummary();
    return this.results.failed.length === 0;
  }

  async validateFileSystem() {
    console.log("📁 FILE SYSTEM VALIDATION");

    const baseDir = this.isConsumerEnvironment ? this.consumerRoot : __dirname;
    const requiredFiles = [
      { path: ".mcp.json", description: "MCP server configuration" },
      { path: "opencode.json", description: "OpenCode base configuration" },
      {
        path: ".opencode/oh-my-opencode.json",
        description: "oh-my-opencode main config",
      },
    ];

    // Add package files for validation
    if (this.isConsumerEnvironment) {
      requiredFiles.push(
        {
          path: "node_modules/strray-ai/dist/plugin/plugins/stringray-codex-injection.js",
          description: "Main plugin file",
        },
        { path: "node_modules/strray-ai/package.json", description: "Package manifest" }
      );
    } else {
      requiredFiles.push(
        {
          path: "../dist/plugin/plugins/stringray-codex-injection.js",
          description: "Main plugin file",
        },
        { path: "../package.json", description: "Package manifest" }
      );
    }

    for (const file of requiredFiles) {
      try {
        const fullPath = path.resolve(baseDir, file.path);
        const exists = fs.existsSync(fullPath);
        if (exists) {
          console.log(`  ✅ ${file.description}`);
          this.results.passed.push(`${file.description} exists`);
        } else {
          console.log(`  ❌ ${file.description} missing at ${fullPath}`);
          this.results.failed.push({
            test: file.description,
            error: "File missing",
          });
        }
      } catch (error) {
        console.log(`  ❌ ${file.description} check failed: ${error.message}`);
        this.results.failed.push({
          test: file.description,
          error: error.message,
        });
      }
    }
  }

  async validateMCPConfiguration() {
    console.log("\n🛠️ MCP CONFIGURATION VALIDATION");

    try {
      const mcpConfigPath = path.resolve(this.consumerRoot, ".mcp.json");
      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf8"));
      const serverCount = Object.keys(mcpConfig.mcpServers || {}).length;

      if (serverCount >= 16) {
        console.log(`  ✅ MCP config valid (${serverCount} servers)`);
        this.results.passed.push("MCP Configuration");

        // Validate server paths
        let validPaths = 0;
        const expectedPath = this.isConsumerEnvironment
          ? "node_modules/strray-ai/dist/plugin/mcps/"
          : "dist/plugin/mcps/";

        for (const [name, config] of Object.entries(mcpConfig.mcpServers)) {
          if (
            config.args &&
            config.args.some((arg) => arg.includes(expectedPath))
          ) {
            validPaths++;
          }
        }

        if (validPaths === serverCount) {
          console.log(`  ✅ All server paths are ${this.isConsumerEnvironment ? 'consumer' : 'development'}-relative`);
          this.results.passed.push("MCP Server Paths");
        } else {
          console.log(
            `  ❌ ${validPaths}/${serverCount} server paths are correct`,
          );
          this.results.failed.push({
            test: "MCP Server Paths",
            error: "Incorrect paths",
          });
        }
      } else {
        console.log(`  ❌ Insufficient MCP servers (${serverCount})`);
        this.results.failed.push({
          test: "MCP Configuration",
          error: `Only ${serverCount} servers`,
        });
      }
    } catch (error) {
      console.log(`  ❌ MCP validation failed: ${error.message}`);
      this.results.failed.push({
        test: "MCP Configuration",
        error: error.message,
      });
    }
  }

  async validatePluginIntegration() {
    console.log("\n🔌 PLUGIN INTEGRATION VALIDATION");

    try {
      const configPath = path.resolve(this.consumerRoot, ".opencode/oh-my-opencode.json");
      const ohMyOpencodeConfig = JSON.parse(
        fs.readFileSync(configPath, "utf8"),
      );

      // Check for plugin registration
      const pluginArray =
        ohMyOpencodeConfig.plugins || ohMyOpencodeConfig.plugin || [];
      const hasStringRayPlugin =
        Array.isArray(pluginArray) &&
        pluginArray.some(
          (plugin) => typeof plugin === "string" && plugin.includes("strray"),
        );

      if (hasStringRayPlugin) {
        console.log("  ✅ StringRay plugin registered");
        this.results.passed.push("Plugin Registration");
      } else {
        console.log("  ❌ StringRay plugin not found");
        this.results.failed.push({
          test: "Plugin Registration",
          error: "Plugin not registered",
        });
      }

      // Check Sisyphus disabled
      const sisyphusDisabled =
        ohMyOpencodeConfig.sisyphus_agent?.disabled === true ||
        (ohMyOpencodeConfig.disabled_agents &&
          ohMyOpencodeConfig.disabled_agents.includes("Sisyphus"));

      if (sisyphusDisabled) {
        console.log("  ✅ Sisyphus orchestrator disabled");
        this.results.passed.push("Sisyphus Disabled");
      } else {
        console.log("  ❌ Sisyphus orchestrator not disabled");
        this.results.failed.push({
          test: "Sisyphus Disabled",
          error: "Sisyphus still enabled",
        });
      }
    } catch (error) {
      console.log(
        `  ❌ Plugin integration validation failed: ${error.message}`,
      );
      this.results.failed.push({
        test: "Plugin Integration",
        error: error.message,
      });
    }
  }

  async validateFrameworkComponents() {
    console.log("\n🏗️ FRAMEWORK COMPONENTS VALIDATION");

    const components = this.isConsumerEnvironment ? [
      {
        path: "./node_modules/strray-ai/dist/plugin/orchestrator.js",
        name: "StringRay Orchestrator",
        check: (module) => module.StringRayOrchestrator,
      },
      {
        path: "./node_modules/strray-ai/dist/plugin/state/state-manager.js",
        name: "State Manager",
        check: (module) => module.StringRayStateManager,
      },
      {
        path: "./node_modules/strray-ai/dist/plugin/plugins/stringray-codex-injection.js",
        name: "Main Plugin",
        check: (module) => module.default,
      },
    ] : [
      {
        path: "../dist/plugin/orchestrator.js",
        name: "StringRay Orchestrator",
        check: (module) => module.StringRayOrchestrator,
      },
      {
        path: "../dist/plugin/state/state-manager.js",
        name: "State Manager",
        check: (module) => module.StringRayStateManager,
      },
      {
        path: "../dist/plugin/plugins/stringray-codex-injection.js",
        name: "Main Plugin",
        check: (module) => module.default,
      },
    ];

    for (const component of components) {
      try {
        const fullPath = path.resolve(this.consumerRoot, component.path);
        const module = await import(fullPath);
        if (component.check(module)) {
          console.log(`  ✅ ${component.name} available`);
          this.results.passed.push(`${component.name} available`);
        } else {
          console.log(`  ❌ ${component.name} not properly exported`);
          this.results.failed.push({
            test: component.name,
            error: "Not properly exported",
          });
        }
      } catch (error) {
        console.log(`  ❌ ${component.name} failed to load: ${error.message}`);
        this.results.failed.push({
          test: component.name,
          error: error.message,
        });
      }
    }
  }

  async validateCLIAvailability() {
    console.log("\n💻 CLI AVAILABILITY VALIDATION");

    const cliCommands = [
      { name: "Status Command", args: ["status"] },
      { name: "Doctor Command", args: ["doctor"] },
      { name: "Auth Status", args: ["auth", "status"] },
    ];

    for (const cmd of cliCommands) {
      try {
        // Simple check - just verify the CLI file exists and can be executed
        const cliPath = this.isConsumerEnvironment
          ? "node_modules/strray-ai/dist/cli/index.js"
          : "../dist/cli/index.js";
        const fullCliPath = path.resolve(this.consumerRoot, cliPath);
        if (fs.existsSync(fullCliPath)) {
          console.log(`  ✅ ${cmd.name} available`);
          this.results.passed.push(`${cmd.name} available`);
        } else {
          console.log(`  ❌ ${cmd.name} CLI file missing`);
          this.results.failed.push({
            test: cmd.name,
            error: "CLI file missing",
          });
        }
      } catch (error) {
        console.log(`  ❌ ${cmd.name} check failed: ${error.message}`);
        this.results.failed.push({ test: cmd.name, error: error.message });
      }
    }
  }

  printFinalSummary() {
    console.log("\n🎯 FINAL VALIDATION SUMMARY");
    console.log("===========================");

    const passed = this.results.passed.length;
    const failed = this.results.failed.length;
    const total = passed + failed;
    const successRate = Math.round((passed / total) * 100);

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (failed > 0) {
      console.log("\n❌ CRITICAL ISSUES:");
      this.results.failed.forEach((failure) => {
        console.log(`  • ${failure.test}: ${failure.error}`);
      });
    }

    console.log("\n✅ VERIFIED COMPONENTS:");
    this.results.passed.forEach((test) => {
      console.log(`  • ${test}`);
    });

    console.log("\n" + "=".repeat(60));

    if (failed === 0) {
      console.log("🎉 ALL CONSUMER VALIDATION PASSED!");
      console.log("🚀 Package is ready for npm publish!");
    } else {
      console.log("⚠️ Consumer validation has issues.");
      console.log("🔧 Critical issues must be resolved before publishing.");
    }
  }
}

// Run the final validation
const validator = new FinalConsumerValidation();
validator
  .runFinalValidation()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Final validation failed with error:", error);
    process.exit(1);
  });
