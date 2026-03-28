/**
 * MCP Server Integration Tests
 *
 * Tests for new MCP servers and Antigravity integration
 */

import { describe, it, expect } from "vitest";
import * as path from "path";
import * as fs from "fs";

describe("MCP Server Files", () => {
  it("should have bug-triage-specialist server file", () => {
    const serverPath = path.join(
      process.cwd(),
      "src/mcps/knowledge-skills/bug-triage-specialist.server.ts",
    );
    expect(fs.existsSync(serverPath)).toBe(true);
  });

  it("should have log-monitor server file", () => {
    const serverPath = path.join(
      process.cwd(),
      "src/mcps/knowledge-skills/log-monitor.server.ts",
    );
    expect(fs.existsSync(serverPath)).toBe(true);
  });

  it("should have session-management server file", () => {
    const serverPath = path.join(
      process.cwd(),
      "src/mcps/knowledge-skills/session-management.server.ts",
    );
    expect(fs.existsSync(serverPath)).toBe(true);
  });

  it("should have code-analyzer server file", () => {
    const serverPath = path.join(
      process.cwd(),
      "src/mcps/knowledge-skills/code-analyzer.server.ts",
    );
    expect(fs.existsSync(serverPath)).toBe(true);
  });
});

describe("Antigravity Skills Integration", () => {
  it("should have removed Antigravity integration script (migrated to skill:install)", () => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts/integrations/install-antigravity-skills.js",
    );
    expect(fs.existsSync(scriptPath)).toBe(false);
  });

  it("should have Antigravity documentation", () => {
    const docPath = path.join(process.cwd(), "docs/superseded/legacy/ANTIGRAVITY_INTEGRATION.md");
    expect(fs.existsSync(docPath)).toBe(true);
  });

  it("should have Antigravity license file", () => {
    const licensePath = path.join(process.cwd(), "licenses/skills/LICENSE.antigravity");
    expect(fs.existsSync(licensePath)).toBe(true);
  });

  it("should list curated skills in documentation", () => {
    const docPath = path.join(process.cwd(), "docs/superseded/legacy/ANTIGRAVITY_INTEGRATION.md");
    const content = fs.readFileSync(docPath, "utf-8");

    expect(content).toContain("typescript-expert");
    expect(content).toContain("python-patterns");
    expect(content).toContain("docker-expert");
    expect(content).toContain("copywriting");
    expect(content).toContain("brainstorming");
  });
});

describe("Agent Configuration", () => {
  it("should have AGENTS.md updated", () => {
    const agentsPath = path.join(process.cwd(), "AGENTS.md");
    expect(fs.existsSync(agentsPath)).toBe(true);
    const content = fs.readFileSync(agentsPath, "utf-8");
    // Check for essential AGENTS.md content
    expect(content).toContain("StringRay");
    expect(content).toContain("Available Agents");
    expect(content).toContain("CLI Commands");
  });
});

describe("MCP Client Configuration", () => {
  it("should have MCP client with new server configs", () => {
    const configPath = path.join(process.cwd(), "src/mcps/config/server-config-registry.ts");
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, "utf-8");

    // Check for new MCP configs in registry (refactored location)
    expect(content).toContain("bug-triage-specialist");
    expect(content).toContain("log-monitor");
    expect(content).toContain("code-analyzer");
  });
});
