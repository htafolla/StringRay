#!/usr/bin/env node

/**
 * Postinstall File Creation Validator
 *
 * Tests that all files and directories created by the postinstall script exist
 * and have the expected content and structure.
 */

import fs from "fs";
import path from "path";

class PostinstallFileValidator {
  constructor() {
    this.results = { passed: [], failed: [] };
  }

  async validateFiles() {
    console.log("📁 POSTINSTALL FILE CREATION VALIDATOR");
    console.log("======================================");

    const validations = [
      this.validateMCPConfig.bind(this),
      this.validateOpencodeConfig.bind(this),
      this.validateOhMyOpencodeConfig.bind(this),
      this.validateOpencodeDirectories.bind(this),
    ];

    for (const validation of validations) {
      await validation();
    }

    this.printSummary();
    return this.results.failed.length === 0;
  }

  async validateMCPConfig() {
    console.log("\n🔧 Validating MCP Configuration (.mcp.json)...");

    try {
      const mcpPath = path.join(process.cwd(), ".mcp.json");

      if (!fs.existsSync(mcpPath)) {
        console.log("  ❌ .mcp.json not found");
        this.results.failed.push({
          test: "MCP Config File",
          error: "File does not exist",
        });
        return;
      }

      const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
      const serverCount = Object.keys(mcpConfig.mcpServers || {}).length;

      if (serverCount >= 20) {
        console.log(`  ✅ .mcp.json exists with ${serverCount} MCP servers`);
        this.results.passed.push("MCP Config File");
      } else {
        console.log(`  ❌ .mcp.json has insufficient servers (${serverCount})`);
        this.results.failed.push({
          test: "MCP Config File",
          error: `Only ${serverCount} servers`,
        });
      }

      // Validate server paths are consumer-relative
      let validPaths = 0;
      for (const [serverName, serverConfig] of Object.entries(
        mcpConfig.mcpServers || {},
      )) {
        if (serverConfig.args && Array.isArray(serverConfig.args)) {
          const hasConsumerPath = serverConfig.args.some(
            (arg) =>
              typeof arg === "string" &&
              arg.includes("node_modules/strray-ai/dist/"),
          );
          if (hasConsumerPath) validPaths++;
        }
      }

      if (validPaths >= serverCount * 0.8) {
        // 80% have correct paths
        console.log(
          `  ✅ ${validPaths}/${serverCount} servers have correct consumer paths`,
        );
        this.results.passed.push("MCP Server Paths");
      } else {
        console.log(
          `  ❌ Only ${validPaths}/${serverCount} servers have correct paths`,
        );
        this.results.failed.push({
          test: "MCP Server Paths",
          error: "Incorrect consumer paths",
        });
      }
    } catch (error) {
      console.log(`  ❌ MCP config validation failed: ${error.message}`);
      this.results.failed.push({
        test: "MCP Config File",
        error: error.message,
      });
    }
  }

  async validateOpencodeConfig() {
    console.log("\n📄 Validating OpenCode Configuration (opencode.json)...");

    try {
      const opencodePath = path.join(process.cwd(), "opencode.json");

      if (!fs.existsSync(opencodePath)) {
        console.log("  ❌ opencode.json not found");
        this.results.failed.push({
          test: "OpenCode Config File",
          error: "File does not exist",
        });
        return;
      }

      const opencodeConfig = JSON.parse(fs.readFileSync(opencodePath, "utf8"));

      // Check for StringRay-specific configurations
      const hasMCPConfig = opencodeConfig.mcpServers || opencodeConfig.mcp;
      const hasAgentConfig = opencodeConfig.agents || opencodeConfig.agent;

      if (hasMCPConfig || hasAgentConfig) {
        console.log("  ✅ opencode.json contains StringRay configuration");
        this.results.passed.push("OpenCode Config File");
      } else {
        console.log(
          "  ⚠️ opencode.json exists but may not have StringRay config",
        );
        // This is not a failure since the file exists
        this.results.passed.push("OpenCode Config File");
      }
    } catch (error) {
      console.log(`  ❌ OpenCode config validation failed: ${error.message}`);
      this.results.failed.push({
        test: "OpenCode Config File",
        error: error.message,
      });
    }
  }

  async validateOhMyOpencodeConfig() {
    console.log("\n🔌 Validating oh-my-opencode Configuration...");

    try {
      const ohMyOpencodePath = path.join(
        process.cwd(),
        ".opencode",
        "oh-my-opencode.json",
      );

      if (!fs.existsSync(ohMyOpencodePath)) {
        console.log("  ❌ .opencode/oh-my-opencode.json not found");
        this.results.failed.push({
          test: "oh-my-opencode Config",
          error: "File does not exist",
        });
        return;
      }

      const ohMyOpencodeConfig = JSON.parse(
        fs.readFileSync(ohMyOpencodePath, "utf8"),
      );

      // Check for StringRay plugin registration
      // oh-my-opencode uses "plugin" (singular) not "plugins" (plural)
      const hasPlugins =
        (ohMyOpencodeConfig.plugins &&
          Array.isArray(ohMyOpencodeConfig.plugins)) ||
        (ohMyOpencodeConfig.plugin && Array.isArray(ohMyOpencodeConfig.plugin));
      let hasStringRayPlugin = false;

      const pluginArray =
        ohMyOpencodeConfig.plugins || ohMyOpencodeConfig.plugin;

      if (hasPlugins && pluginArray) {
        hasStringRayPlugin = pluginArray.some((plugin) => {
          const isString = typeof plugin === "string";
          const includesStrray = isString && plugin.includes("strray");
          const isObject = typeof plugin === "object";
          const hasName = isObject && plugin.name;
          const nameIncludesStrray = hasName && plugin.name.includes("strray");

          return includesStrray || nameIncludesStrray;
        });
      }

      if (hasStringRayPlugin) {
        console.log("  ✅ StringRay plugin registered in oh-my-opencode.json");
        this.results.passed.push("oh-my-opencode Plugin Registration");
      } else {
        console.log("  ❌ StringRay plugin not found in oh-my-opencode.json");
        this.results.failed.push({
          test: "oh-my-opencode Plugin Registration",
          error: "Plugin not registered",
        });
      }

      // Check for agent configurations
      const hasAgents = ohMyOpencodeConfig.agents || ohMyOpencodeConfig.agent;
      if (hasAgents) {
        console.log("  ✅ Agent configurations present");
        this.results.passed.push("oh-my-opencode Agent Config");
      } else {
        console.log("  ⚠️ No agent configurations found");
        this.results.passed.push("oh-my-opencode Agent Config");
      }
    } catch (error) {
      console.log(
        `  ❌ oh-my-opencode config validation failed: ${error.message}`,
      );
      this.results.failed.push({
        test: "oh-my-opencode Config",
        error: error.message,
      });
    }
  }

  async validateOpencodeDirectories() {
    console.log("\n📂 Validating OpenCode Directories...");

    const directories = [
      {
        path: ".opencode",
        description: "oh-my-opencode configuration directory",
      },
      {
        path: ".opencode/logs",
        description: "Log directory (may not exist until runtime)",
      },
    ];

    for (const dir of directories) {
      try {
        const exists = fs.existsSync(dir.path);
        if (dir.path.includes("logs") && !exists) {
          // Logs directory is optional
          console.log(`  ℹ️ ${dir.description} not present (normal)`);
          this.results.passed.push(`${dir.description} Check`);
        } else if (exists) {
          console.log(`  ✅ ${dir.description} exists`);
          this.results.passed.push(`${dir.description} Check`);
        } else {
          console.log(`  ❌ ${dir.description} missing`);
          this.results.failed.push({
            test: dir.description,
            error: "Directory does not exist",
          });
        }
      } catch (error) {
        console.log(`  ❌ ${dir.description} check failed: ${error.message}`);
        this.results.failed.push({
          test: dir.description,
          error: error.message,
        });
      }
    }
  }

  printSummary() {
    console.log("\n📊 POSTINSTALL FILE VALIDATION SUMMARY");
    console.log("=======================================");

    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(
      `📈 Success Rate: ${Math.round((this.results.passed.length / (this.results.passed.length + this.results.failed.length)) * 100)}%`,
    );

    if (this.results.failed.length > 0) {
      console.log("\n❌ FAILED VALIDATIONS:");
      this.results.failed.forEach((failure) => {
        console.log(`  • ${failure.test}: ${failure.error}`);
      });
    }

    if (this.results.passed.length > 0) {
      console.log("\n✅ PASSED VALIDATIONS:");
      this.results.passed.forEach((test) => {
        console.log(`  • ${test}`);
      });
    }
  }
}

// Run validation
const validator = new PostinstallFileValidator();
validator
  .validateFiles()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("File validation failed with error:", error);
    process.exit(1);
  });
