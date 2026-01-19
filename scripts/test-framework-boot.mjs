#!/usr/bin/env node

/**
 * Framework Boot Test
 *
 * Tests that the StringRay framework can boot and initialize properly
 * in the consumer environment. This validates that all components
 * can be loaded and initialized without errors.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FrameworkBootTest {
  constructor() {
    this.results = { passed: [], failed: [] };
    // Check if we're running from a consumer environment (not the source directory)
    const cwd = process.cwd();
    this.isConsumerEnvironment = !cwd.includes("dev/stringray") && cwd.includes("dev/jelly");
    this.consumerRoot = cwd; // The current working directory is the consumer root
  }

  async testFrameworkBoot() {
    console.log("🚀 FRAMEWORK BOOT TEST");
    console.log("======================");

    const tests = [
      this.testOrchestratorImport.bind(this),
      this.testStateManagerImport.bind(this),
      this.testProcessorManagerImport.bind(this),
      this.testFrameworkLoggerImport.bind(this),
      this.testPluginLoading.bind(this),
    ];

    for (const test of tests) {
      await test();
    }

    this.printSummary();
    return this.results.failed.length === 0;
  }

  async testOrchestratorImport() {
    console.log("\n🔧 Testing Orchestrator Import...");

      try {
        const orchestratorPath = this.isConsumerEnvironment
          ? "./node_modules/strray-ai/dist/plugin/orchestrator.js"
          : "../dist/plugin/orchestrator.js";
        const { StringRayOrchestrator } = await import(orchestratorPath);
        const orchestrator = new StringRayOrchestrator({ maxConcurrentTasks: 1 });

      if (
        orchestrator &&
        typeof orchestrator.executeComplexTask === "function"
      ) {
        console.log("  ✅ Orchestrator imported and instantiated successfully");
        this.results.passed.push("Orchestrator Import");
      } else {
        console.log("  ❌ Orchestrator missing required methods");
        this.results.failed.push({
          test: "Orchestrator Import",
          error: "Missing methods",
        });
      }
    } catch (error) {
      console.log(`  ❌ Orchestrator import failed: ${error.message}`);
      this.results.failed.push({
        test: "Orchestrator Import",
        error: error.message,
      });
    }
  }

  async testStateManagerImport() {
    console.log("\n💾 Testing State Manager Import...");

      try {
        const stateManagerPath = this.isConsumerEnvironment
          ? "./node_modules/strray-ai/dist/plugin/state/state-manager.js"
          : "../dist/plugin/state/state-manager.js";
        const { StringRayStateManager } = await import(stateManagerPath);
        const stateManager = new StringRayStateManager();

      if (stateManager && typeof stateManager.get === "function") {
        console.log(
          "  ✅ State Manager imported and instantiated successfully",
        );
        this.results.passed.push("State Manager Import");
      } else {
        console.log("  ❌ State Manager missing required methods");
        this.results.failed.push({
          test: "State Manager Import",
          error: "Missing methods",
        });
      }
    } catch (error) {
      console.log(`  ❌ State Manager import failed: ${error.message}`);
      this.results.failed.push({
        test: "State Manager Import",
        error: error.message,
      });
    }
  }

  async testProcessorManagerImport() {
    console.log("\n⚙️ Testing Processor Manager Import...");

    try {
      const { ProcessorManager } =
        await import("../dist/plugin/processors/processor-manager.js");

      if (
        ProcessorManager &&
        typeof ProcessorManager.prototype.registerProcessor === "function"
      ) {
        console.log("  ✅ Processor Manager imported successfully");
        this.results.passed.push("Processor Manager Import");
      } else {
        console.log("  ❌ Processor Manager class not properly defined");
        this.results.failed.push({
          test: "Processor Manager Import",
          error: "Class not defined",
        });
      }
    } catch (error) {
      console.log(`  ❌ Processor Manager import failed: ${error.message}`);
      this.results.failed.push({
        test: "Processor Manager Import",
        error: error.message,
      });
    }
  }

  async testFrameworkLoggerImport() {
    console.log("\n📝 Testing Framework Logger Import...");

    try {
      const { frameworkLogger } =
        await import("../dist/plugin/framework-logger.js");

      if (frameworkLogger && typeof frameworkLogger.log === "function") {
        console.log("  ✅ Framework Logger imported successfully");
        this.results.passed.push("Framework Logger Import");
      } else {
        console.log("  ❌ Framework Logger missing required methods");
        this.results.failed.push({
          test: "Framework Logger Import",
          error: "Missing methods",
        });
      }
    } catch (error) {
      console.log(`  ❌ Framework Logger import failed: ${error.message}`);
      this.results.failed.push({
        test: "Framework Logger Import",
        error: error.message,
      });
    }
  }

  async testPluginLoading() {
    console.log("\n🔌 Testing Plugin Loading...");

    try {
      // Test importing the main plugin
      const pluginModule =
        await import("../dist/plugin/plugins/stringray-codex-injection.js");

      if (pluginModule && typeof pluginModule.default === "function") {
        console.log("  ✅ Main plugin imported successfully");
        this.results.passed.push("Plugin Loading");
      } else {
        console.log("  ❌ Main plugin not properly exported");
        this.results.failed.push({
          test: "Plugin Loading",
          error: "Not properly exported",
        });
      }
    } catch (error) {
      console.log(`  ❌ Plugin loading failed: ${error.message}`);
      this.results.failed.push({
        test: "Plugin Loading",
        error: error.message,
      });
    }
  }

  printSummary() {
    console.log("\n📊 FRAMEWORK BOOT TEST SUMMARY");
    console.log("===============================");

    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(
      `📈 Success Rate: ${Math.round((this.results.passed.length / (this.results.passed.length + this.results.failed.length)) * 100)}%`,
    );

    if (this.results.failed.length > 0) {
      console.log("\n❌ FAILED TESTS:");
      this.results.failed.forEach((failure) => {
        console.log(`  • ${failure.test}: ${failure.error}`);
      });
    }

    if (this.results.passed.length > 0) {
      console.log("\n✅ PASSED TESTS:");
      this.results.passed.forEach((test) => {
        console.log(`  • ${test}`);
      });
    }
  }
}

// Run the test
const bootTest = new FrameworkBootTest();
bootTest
  .testFrameworkBoot()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Framework boot test failed with error:", error);
    process.exit(1);
  });
