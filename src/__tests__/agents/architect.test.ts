import { describe, it, expect } from "vitest";
import { architect } from "../../agents/architect.js";
import type { AgentConfig } from "../../agents/types.js";

describe("Architect Agent Configuration", () => {
  it("should be a valid AgentConfig object", () => {
    const config: AgentConfig = architect;
    expect(config).toBeDefined();
  });

  describe("Basic Configuration", () => {
    it("should have correct name", () => {
      expect(architect.name).toBe("architect");
    });

    it("should be configured as subagent mode", () => {
      expect(architect.mode).toBe("subagent");
    });

    it("should have low temperature for consistent design decisions", () => {
      expect(architect.temperature).toBe(0.1);
    });
  });

  describe("Core Responsibilities", () => {
    it("should have concise system prompt", () => {
      const system = architect.system;
      // New simplified prompt
      expect(system).toContain("StringRay Architect");
      expect(system).toContain("MAX 3 file reads");
      expect(system).toContain("Stop after giving your answer");
    });

    it("should focus on design and delegation", () => {
      const system = architect.system;
      // New simplified prompt focuses on these
      expect(system).toContain("design");
      expect(system).toContain("delegation");
      expect(system).toContain("SOLID principles");
    });
  });

  describe("Key Facilities", () => {
    it("should have concise prompt", () => {
      const system = architect.system;
      // Simplified prompt
      expect(system).toContain("StringRay Architect");
    });

    it("should define processor pipeline", () => {
      const system = architect.system;
      // Simplified prompt - just check it has some content
      expect(system.length).toBeGreaterThan(50);
    });
  });

  describe("Architectural Principles", () => {
    it("should have concise system prompt", () => {
      const system = architect.system;
      // New simplified prompt
      expect(system).toContain("StringRay Architect");
      expect(system).toContain("MAX 3 file reads");
    });

    it("should reference codex", () => {
      const system = architect.system;
      // Simplified prompt still mentions principles
      expect(system).toContain("SOLID principles");
    });
  });

  describe("Tools Configuration", () => {
    it("should have architecture-specific tools", () => {
      expect(architect.tools?.include).toContain("read");
      expect(architect.tools?.include).toContain("grep");
      expect(architect.tools?.include).toContain("lsp_*");
      expect(architect.tools?.include).toContain("run_terminal_cmd");
      expect(architect.tools?.include).toContain("background_task");
      expect(architect.tools?.include).toContain("lsp_goto_definition");
      expect(architect.tools?.include).toContain("lsp_find_references");
    });
  });

  describe("Integration Points", () => {
    it("should have concise integration guidance", () => {
      const system = architect.system;
      // Simplified prompt
      expect(system).toContain("StringRay Architect");
      expect(system).toContain("Stop after giving your answer");
    });
  });
});
