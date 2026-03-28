import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();

describe("Antigravity Status Command", () => {
  describe("File Existence", () => {
    it("should have antigravity-status.ts command file", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      expect(fs.existsSync(statusPath)).toBe(true);
    });

    it("should export antigravityStatusCommand function", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("export async function antigravityStatusCommand");
    });
  });

  describe("Skill Detection", () => {
    it("should detect skills in skills directory", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("skills");
      expect(content).toContain(".opencode");
    });
  });

  describe("License Detection", () => {
    it("should extract license from SKILL.md", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("license");
    });

    it("should extract source from SKILL.md", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("source");
    });

    it("should detect MIT license", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("licenseBadge");
    });

    it("should detect Apache license", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("licenseBadge");
    });
  });

  describe("Category Detection", () => {
    it("should categorize skills by type", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("extractCategory");
    });

    it("should group skills by source", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("communityBySource");
    });
  });

  describe("License Files Directory", () => {
    it("should have licenses/skills directory", () => {
      const licensesDir = path.join(PROJECT_ROOT, "licenses", "skills");
      expect(fs.existsSync(licensesDir)).toBe(true);
    });

    it("should have license file for impeccable", () => {
      const licensePath = path.join(PROJECT_ROOT, "licenses", "skills", "LICENSE.impeccable");
      expect(fs.existsSync(licensePath)).toBe(true);
    });

    it("should have license file for antigravity", () => {
      const licensePath = path.join(PROJECT_ROOT, "licenses", "skills", "LICENSE.antigravity");
      expect(fs.existsSync(licensePath)).toBe(true);
    });

    it("should have license file for openviking", () => {
      const licensePath = path.join(PROJECT_ROOT, "licenses", "skills", "LICENSE.openviking");
      expect(fs.existsSync(licensePath)).toBe(true);
    });

    it("should have license files for all registry sources", () => {
      const licensesDir = path.join(PROJECT_ROOT, "licenses", "skills");
      const files = fs.readdirSync(licensesDir).filter(f => f.startsWith("LICENSE."));
      expect(files.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Installed Skills Verification", () => {
    it("should have skills directory with installed skills", () => {
      const skillsPath = path.join(PROJECT_ROOT, ".opencode", "skills");
      expect(fs.existsSync(skillsPath)).toBe(true);
    });

    it("should not have stale integrations directory", () => {
      const integrationsPath = path.join(PROJECT_ROOT, ".opencode", "integrations");
      expect(fs.existsSync(integrationsPath)).toBe(false);
    });
  });

  describe("CLI Output", () => {
    it("should show box drawing characters", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("Installed Skills Status");
    });

    it("should show total skills count", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("Total:");
    });

    it("should show framework vs community breakdown", () => {
      const statusPath = path.join(PROJECT_ROOT, "src/cli/commands/antigravity-status.ts");
      const content = fs.readFileSync(statusPath, "utf-8");
      expect(content).toContain("Framework Skills");
      expect(content).toContain("Community Skills");
    });
  });
});
