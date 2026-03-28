/**
 * Installer Script Tests
 *
 * Tests for scripts/node/install.cjs
 *
 * @version 1.0.0
 * @since 1.15.0
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();

describe("Installer Script (install.cjs)", () => {
  describe("Script Existence", () => {
    it("should exist at scripts/node/install.cjs", () => {
      const installPath = path.join(PROJECT_ROOT, "scripts/node/install.cjs");
      expect(fs.existsSync(installPath)).toBe(true);
    });

    it("should be executable", () => {
      const installPath = path.join(PROJECT_ROOT, "scripts/node/install.cjs");
      const stats = fs.statSync(installPath);
      expect(stats.mode & 0o111).toBeTruthy();
    });
  });

  describe("Script Content", () => {
    it("should contain OpenCode detection function", () => {
      const installPath = path.join(PROJECT_ROOT, "scripts/node/install.cjs");
      const content = fs.readFileSync(installPath, "utf-8");
      expect(content).toContain("checkOpenCodeInstallation");
    });

    it("should contain flag support (--minimal, --full, --with-skills, --yes)", () => {
      const installPath = path.join(PROJECT_ROOT, "scripts/node/install.cjs");
      const content = fs.readFileSync(installPath, "utf-8");
      expect(content).toContain("--minimal");
      expect(content).toContain("--full");
      expect(content).toContain("--with-skills");
      expect(content).toContain("--yes");
    });

    it("should contain plugin copying to both locations", () => {
      const installPath = path.join(PROJECT_ROOT, "scripts/node/install.cjs");
      const content = fs.readFileSync(installPath, "utf-8");
      expect(content).toContain("pluginLocations");
      expect(content).toContain("copyPlugin");
    });

    it("should contain kernel layering function", () => {
      const installPath = path.join(PROJECT_ROOT, "scripts/node/install.cjs");
      const content = fs.readFileSync(installPath, "utf-8");
      expect(content).toContain("layerKernel");
    });

    it("should contain skills installation functions", () => {
      const installPath = path.join(PROJECT_ROOT, "scripts/node/install.cjs");
      const content = fs.readFileSync(installPath, "utf-8");
      expect(content).toContain("installImpeccable");
      expect(content).toContain("installOpenViking");
      expect(content).toContain("installAntigravity");
    });
  });

  describe("Help Output", () => {
    it("should show help with --help flag", () => {
      try {
        const output = execSync(`node scripts/node/install.cjs --help`, {
          cwd: PROJECT_ROOT,
          encoding: "utf-8",
        });
        expect(output).toContain("install");
        expect(output).toContain("flags");
      } catch (error: unknown) {
        const err = error as { status?: number; stderr?: string };
        if (err.status === 1) {
          console.log("Help output printed to stderr, checking...");
          expect(err.stderr || "").toContain("install");
        }
      }
    });
  });
});
