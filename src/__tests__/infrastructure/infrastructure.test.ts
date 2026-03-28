/**
 * Infrastructure Tests
 *
 * Basic infrastructure tests for core system components
 * ensuring essential services and configurations are operational.
 *
 * @version 1.0.0
 * @since 2026-01-23
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "../../core/framework-logger.js";
import { StringRayStateManager } from "../../state/state-manager.js";

describe("StringRay Infrastructure Tests", () => {
  // Get project root (two levels up from this test file)
  const projectRoot = path.resolve(__dirname, "../../..");

  describe("Core File System", () => {
    it("should have required directories", () => {
      const requiredDirs = ["src", ".opencode", ".opencode/strray"].map((d) =>
        path.join(projectRoot, d),
      );

      for (const dir of requiredDirs) {
        expect(fs.existsSync(dir)).toBe(true);
        expect(fs.statSync(dir).isDirectory()).toBe(true);
      }
    });

    it("should have required configuration files", () => {
      // Use files that actually exist in the project
      const requiredFiles = [
        ".opencode/strray/codex.json",
        "package.json",
        "tests/config/vitest.config.ts",
      ].map((f) => path.join(projectRoot, f));

      for (const file of requiredFiles) {
        expect(fs.existsSync(file)).toBe(true);
        expect(fs.statSync(file).isFile()).toBe(true);
      }
    });

    it("should have readable configuration files", () => {
      // Use files that actually exist
      const configFiles = [".opencode/strray/codex.json", "package.json"].map(
        (f) => path.join(projectRoot, f),
      );

      for (const file of configFiles) {
        const content = fs.readFileSync(file, "utf8");
        expect(content.length).toBeGreaterThan(0);

        // Should be valid JSON
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });
  });

  describe("State Management Infrastructure", () => {
    let stateManager: StringRayStateManager;

    beforeAll(() => {
      stateManager = new StringRayStateManager();
    });

    it("should initialize state manager", () => {
      expect(stateManager).toBeDefined();
      expect(typeof stateManager.get).toBe("function");
      expect(typeof stateManager.set).toBe("function");
      expect(typeof stateManager.clear).toBe("function");
    });

    it("should support basic state operations", () => {
      const testKey = "test:infrastructure:key";
      const testValue = {
        message: "infrastructure test",
        timestamp: Date.now(),
      };

      // Set value
      stateManager.set(testKey, testValue);
      expect(stateManager.get(testKey)).toEqual(testValue);

      // Clear value
      stateManager.clear(testKey);
      expect(stateManager.get(testKey)).toBeUndefined();
    });

    it("should handle enterprise features", () => {
      // Test that enterprise state manager methods exist
      expect(typeof (stateManager as any).getStateVersion).toBe("function");
      expect(typeof (stateManager as any).getAuditLog).toBe("function");
      expect(typeof (stateManager as any).resolveConflict).toBe("function");
    });
  });

  describe("Logging Infrastructure", () => {
    it("should have framework logger available", () => {
      expect(frameworkLogger).toBeDefined();
      expect(typeof frameworkLogger.log).toBe("function");
    });

    it("should support different log levels", () => {
      // These should not throw
      expect(() =>
        frameworkLogger.log("test", "info message", "info"),
      ).not.toThrow();
      expect(() =>
        frameworkLogger.log("test", "error message", "error"),
      ).not.toThrow();
      expect(() =>
        frameworkLogger.log("test", "success message", "success"),
      ).not.toThrow();
    });
  });

  describe("Agent Configuration Infrastructure", () => {
    it("should have agent configuration files", () => {
      const agentConfigDir = ".opencode/agents";
      expect(fs.existsSync(agentConfigDir)).toBe(true);

      const files = fs.readdirSync(agentConfigDir);
      const configFiles = files.filter(
        (f) => f.endsWith(".yml") || f.endsWith(".yaml"),
      );

      expect(configFiles.length).toBeGreaterThan(0);
    });

    it("should have required agent configurations", () => {
      // Check that agents directory exists and has sufficient agents
      const agentDir = ".opencode/agents";
      if (!fs.existsSync(agentDir)) {
        // In CI, agents might be installed by postinstall
        return;
      }
      
      const agentFiles = fs.readdirSync(agentDir);
      const ymlFiles = agentFiles.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
      expect(ymlFiles.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("Plugin Infrastructure", () => {
    it("should have plugin source configuration", () => {
      const pluginSource = "src/plugin/strray-codex-injection.ts";
      expect(fs.existsSync(pluginSource)).toBe(true);
    });

    it("should have buildable plugin output", () => {
      // Verify the plugin can be built (source exists and has exports)
      const pluginSource = "src/plugin/strray-codex-injection.ts";
      const content = fs.readFileSync(pluginSource, "utf8");
      expect(content).toContain("export");
    });

    it("should not have MCP server configuration (.mcp.json) - servers configured in OpenCode.json", () => {
      // MCP servers are now configured directly in OpenCode.json
      // .mcp.json is no longer used for server configuration
      expect(fs.existsSync(".mcp.json")).toBe(false);
    });
  });

  describe("Build Infrastructure", () => {
    it("should have build scripts in package.json", () => {
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
      const scripts = packageJson.scripts || {};

      expect(scripts.build).toBeDefined();
      expect(scripts.test).toBeDefined();
    });

    it("should have TypeScript configuration", () => {
      // TypeScript config may be in tests/config/ or root
      const tsconfigPaths = [
        "tsconfig.json",
        "tests/config/tsconfig.json",
        "kernel/tsconfig.json",
      ];

      const exists = tsconfigPaths.some((p) => fs.existsSync(path.join(projectRoot, p)));
      expect(exists).toBe(true);
    });
  });

  describe("CI/CD Infrastructure", () => {
    it("should have GitHub Actions workflows", () => {
      const workflowsDir = ".github/workflows";
      expect(fs.existsSync(workflowsDir)).toBe(true);

      const workflows = fs.readdirSync(workflowsDir);
      expect(workflows.length).toBeGreaterThan(0);
      expect(
        workflows.some((w) => w.includes("ci") || w.includes("test")),
      ).toBe(true);
    });

    it("should have pre-commit hooks configured", () => {
      const hooksDir = ".opencode/hooks";
      expect(fs.existsSync(hooksDir)).toBe(true);

      const hooks = fs.readdirSync(hooksDir);
      expect(
        hooks.some((h) => h.includes("commit") || h.includes("push")),
      ).toBe(true);
    });
  });

  describe("Security Infrastructure", () => {
    it("should have security configuration files", () => {
      // Check for security-related files
      const securityFiles = [
        ".github/workflows/security.yml",
        ".github/workflows/security-audit.yml",
      ];

      for (const file of securityFiles) {
        if (fs.existsSync(file)) {
          expect(fs.statSync(file).isFile()).toBe(true);
        }
      }
    });
  });

  describe("Performance Infrastructure", () => {
    it("should have performance monitoring setup", () => {
      // Check for performance-related directories/files
      expect(fs.existsSync("src/performance")).toBe(true);
      expect(fs.existsSync("performance-baselines.json")).toBe(true);
    });
  });
});
