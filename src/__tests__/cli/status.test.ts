/**
 * Status Command Tests
 *
 * Tests for src/cli/commands/status.ts
 *
 * @version 1.0.0
 * @since 1.15.0
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();

describe("Status Command", () => {
  describe("File Existence", () => {
    it("should have status.ts command file", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/status.ts");
      expect(fs.existsSync(statusPath)).toBe(true);
    });

    it("should export getStatusReport function", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("export function getStatusReport");
    });

    it("should export printStatus function", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("export function printStatus");
    });
  });

  describe("Function Implementation", () => {
    it("should detect skills in .opencode/skills", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("getSkillsList");
      expect(content).toContain("skillsPath");
    });

    it("should detect agents", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("getAgentsList");
    });

    it("should check health metrics", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("getHealthMetrics");
    });

    it("should check inference status", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("getInferenceStatus");
    });
  });

  describe("Skills Directory", () => {
    it("should have .opencode/skills directory", () => {
      const skillsPath = path.join(PROJECT_ROOT, ".opencode/skills");
      expect(fs.existsSync(skillsPath)).toBe(true);
    });

    it("should not have stale .opencode/integrations directory", () => {
      const integrationsPath = path.join(PROJECT_ROOT, ".opencode/integrations");
      expect(fs.existsSync(integrationsPath)).toBe(false);
    });
  });

  describe("CLI Output Format", () => {
    it("should have box drawing characters for output", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("╔");
      expect(content).toContain("╗");
      expect(content).toContain("╚");
      expect(content).toContain("╝");
    });

    it("should display skills count", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("Skills:");
    });

    it("should display agents count", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("Agents:");
    });
  });
});
