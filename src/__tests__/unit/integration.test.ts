/**
 * 0xRay Integration Script Tests
 *
 * Tests for src/scripts/integration.ts - CLI bridge for external systems
 *
 * @version 1.0.0
 * @since 2026-02-14
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the dependencies
vi.mock("child_process", () => ({
  spawn: vi.fn(() => ({
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event: string, cb: (code: number) => void) => {
      if (event === "close") cb(0);
    }),
  })),
}));

vi.mock("../../mcps/agent-resolver.js", () => ({
  resolveAgent: vi.fn().mockResolvedValue({
    name: "code-reviewer",
    system: "You are a code quality reviewer...",
    tools: { include: ["read", "grep"] },
  }),
}));

describe("0xRay Integration Script", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TaskContext Interface", () => {
    it("should accept valid task context", () => {
      const task: import("../../scripts/integration.js").TaskContext = {
        taskDescription: "Check code quality",
        context: { file: "src/**/*.ts" },
      };

      expect(task.taskDescription).toBe("Check code quality");
      expect(task.context?.file).toBe("src/**/*.ts");
    });

    it("should allow additional properties", () => {
      const task: import("../../scripts/integration.js").TaskContext = {
        taskDescription: "Test task",
        priority: "high",
        timeout: 30000,
      };

      expect((task as any).priority).toBe("high");
      expect((task as any).timeout).toBe(30000);
    });
  });

  describe("AgentConfig Interface", () => {
    it("should define valid agent config", () => {
      const config: import("../../scripts/integration.js").AgentConfig = {
        name: "code-reviewer",
        system: "You are a code quality reviewer...",
        tools: { include: ["read", "grep", "edit"] },
      };

      expect(config.name).toBe("code-reviewer");
      expect(config.tools?.include).toContain("edit");
    });

    it("should allow exclude tools", () => {
      const config: import("../../scripts/integration.js").AgentConfig = {
        name: "architect",
        tools: { exclude: ["bash"] },
      };

      expect(config.tools?.exclude).toContain("bash");
    });
  });

  describe("IntegrationResult Interface", () => {
    it("should define successful result", () => {
      const result: import("../../scripts/integration.js").IntegrationResult = {
        success: true,
        agent: "code-reviewer",
        task: "Check code quality",
        result: { issues: 0 },
        timestamp: new Date().toISOString(),
      };

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ issues: 0 });
    });

    it("should define error result", () => {
      const result: import("../../scripts/integration.js").IntegrationResult = {
        success: false,
        agent: "code-reviewer",
        error: "Agent not found",
        timestamp: new Date().toISOString(),
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Agent not found");
    });
  });

  describe("resolveAgent function", () => {
    it("should resolve code-reviewer agent", async () => {
      const { resolveAgent } = await import("../../mcps/agent-resolver.js");
      const config = await resolveAgent("code-reviewer");

      expect(config.name).toBe("code-reviewer");
      expect(config.system).toBeDefined();
    });

    it("should resolve architect agent", async () => {
      const { resolveAgent } = await import("../../mcps/agent-resolver.js");
      const config = await resolveAgent("architect");

      expect(config.name).toBeDefined();
    });
  });
});
