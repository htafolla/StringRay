/**
 * Publish Agent Command Tests
 *
 * Tests for src/cli/commands/publish-agent.ts
 *
 * @version 1.0.0
 * @since 1.15.0
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();

describe("Publish Agent Command", () => {
  describe("File Existence", () => {
    it("should have publish-agent.ts command file", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      expect(fs.existsSync(publishPath)).toBe(true);
    });

    it("should export publishAgentCommand function", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("export async function publishAgentCommand");
    });
  });

  describe("Command Arguments", () => {
    it("should require --agent flag", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("--agent");
      expect(content).toContain("required");
    });

    it("should support --version flag", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("--version");
    });

    it("should support --dry-run flag", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("--dry-run");
    });
  });

  describe("Agent Discovery", () => {
    it("should search agents directory", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("agents/");
    });

    it("should search .opencode/agents directory", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain(".opencode/agents");
    });

    it("should support both .yml and .yaml extensions", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain(".yml");
      expect(content).toContain(".yaml");
    });
  });

  describe("Manifest Generation", () => {
    it("should extract name from config", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("createAgentManifest");
    });

    it("should include version in manifest", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("version");
    });

    it("should include license in manifest", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("license");
    });

    it("should extract YAML fields from agent config", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("extractYamlField");
    });
  });

  describe("Package Creation", () => {
    it("should create package directory", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("packageAgent");
    });

    it("should create publish directory", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("publish");
    });

    it("should write agent.json manifest", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("agent.json");
    });
  });

  describe("CLI Output", () => {
    it("should show box drawing characters", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("╔");
    });

    it("should show agent name in output", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("Agent:");
    });

    it("should show package location", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("Package location");
    });
  });

  describe("Error Handling", () => {
    it("should show error when agent not found", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("not found");
    });

    it("should show available agents on error", () => {
      const publishPath = path.join(PROJECT_ROOT, "src/cli/commands/publish-agent.ts");
      const content = fs.readFileSync(publishPath, "utf-8");
      expect(content).toContain("Available agents");
    });
  });
});
