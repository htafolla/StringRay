#!/usr/bin/env node

/**
 * Simple Consumer Readiness Check
 *
 * Quick validation that the consumer environment is properly set up
 * after npm install. This is the minimal validation needed for npm publish.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConsumerReadinessCheck {
  constructor() {
    this.checks = [];
    // Check if we're running from a consumer environment (not the source directory)
    const cwd = process.cwd();
    this.isConsumerEnvironment = !cwd.includes("dev/stringray") && cwd.includes("dev/jelly");
  }

  async runChecks() {
    console.log("🔍 CONSUMER READINESS CHECK");
    console.log("===========================");
    console.log(
      `Environment: ${this.isConsumerEnvironment ? "Consumer" : "Development"}`,
    );
    console.log("");

    // Core file existence checks
    this.checkFile(".mcp.json", "MCP server configuration");
    this.checkFile("opencode.json", "OpenCode configuration");
    this.checkFile(
      ".opencode/oh-my-opencode.json",
      "oh-my-opencode configuration",
    );

    // MCP server validation
    this.checkMCPServers();

    // Plugin registration
    this.checkPluginRegistration();

    // Sisyphus disabled
    this.checkSisyphusDisabled();

    this.printSummary();

    const allPassed = this.checks.every((check) => check.passed);
    console.log("");
    console.log(
      allPassed
        ? "🎉 Consumer environment is ready!"
        : "⚠️ Consumer environment has issues",
    );
    return allPassed;
  }

  checkFile(filePath, description) {
    const exists = fs.existsSync(filePath);
    this.checks.push({
      name: description,
      passed: exists,
      details: exists ? "File exists" : "File missing",
    });
    console.log(
      `${exists ? "✅" : "❌"} ${description}: ${exists ? "Present" : "Missing"}`,
    );
  }

  checkMCPServers() {
    try {
      const mcpConfig = JSON.parse(fs.readFileSync(".mcp.json", "utf8"));
      const serverCount = Object.keys(mcpConfig.mcpServers || {}).length;
      const hasServers = serverCount >= 16; // At least 16 servers

      this.checks.push({
        name: "MCP server configuration",
        passed: hasServers,
        details: `${serverCount} servers configured`,
      });
      console.log(
        `${hasServers ? "✅" : "❌"} MCP servers: ${serverCount} configured (${hasServers ? "OK" : "Too few"})`,
      );
    } catch (error) {
      this.checks.push({
        name: "MCP server configuration",
        passed: false,
        details: "Invalid JSON or missing file",
      });
      console.log("❌ MCP servers: Configuration error");
    }
  }

  checkPluginRegistration() {
    try {
      const config = JSON.parse(
        fs.readFileSync(".opencode/oh-my-opencode.json", "utf8"),
      );
      const pluginArray = config.plugins || config.plugin || [];
      const hasStringRayPlugin =
        Array.isArray(pluginArray) &&
        pluginArray.some(
          (plugin) => typeof plugin === "string" && plugin.includes("strray"),
        );

      this.checks.push({
        name: "StringRay plugin registration",
        passed: hasStringRayPlugin,
        details: hasStringRayPlugin ? "Plugin registered" : "Plugin not found",
      });
      console.log(
        `${hasStringRayPlugin ? "✅" : "❌"} Plugin registration: ${hasStringRayPlugin ? "Registered" : "Missing"}`,
      );
    } catch (error) {
      this.checks.push({
        name: "StringRay plugin registration",
        passed: false,
        details: "Configuration error",
      });
      console.log("❌ Plugin registration: Configuration error");
    }
  }

  checkSisyphusDisabled() {
    try {
      const config = JSON.parse(
        fs.readFileSync(".opencode/oh-my-opencode.json", "utf8"),
      );
      const sisyphusDisabled =
        config.sisyphus_agent?.disabled === true ||
        (config.disabled_agents && config.disabled_agents.includes("Sisyphus"));

      this.checks.push({
        name: "Sisyphus orchestrator disabled",
        passed: sisyphusDisabled,
        details: sisyphusDisabled ? "Disabled" : "Not disabled",
      });
      console.log(
        `${sisyphusDisabled ? "✅" : "❌"} Sisyphus orchestrator: ${sisyphusDisabled ? "Disabled" : "Enabled"}`,
      );
    } catch (error) {
      this.checks.push({
        name: "Sisyphus orchestrator disabled",
        passed: false,
        details: "Configuration error",
      });
      console.log("❌ Sisyphus orchestrator: Configuration error");
    }
  }

  printSummary() {
    const passed = this.checks.filter((c) => c.passed).length;
    const total = this.checks.length;

    console.log("");
    console.log("📊 SUMMARY");
    console.log("==========");
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);

    if (passed < total) {
      console.log("");
      console.log("❌ FAILED CHECKS:");
      this.checks
        .filter((c) => !c.passed)
        .forEach((check) => {
          console.log(`  • ${check.name}: ${check.details}`);
        });
    }
  }
}

// Run the check
const checker = new ConsumerReadinessCheck();
checker
  .runChecks()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Readiness check failed:", error);
    process.exit(1);
  });
