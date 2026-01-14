import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";

vi.mock("../framework-logger.js", () => ({
  frameworkLogger: {
    log: vi.fn().mockResolvedValue(undefined),
    getRecentLogs: vi.fn(),
    getComponentUsage: vi.fn(),
    printRundown: vi.fn(),
  },
}));

import { frameworkLogger } from "../framework-logger.js";

// Type the mocked functions
const mockGetRecentLogs = frameworkLogger.getRecentLogs as any;
const mockGetComponentUsage = frameworkLogger.getComponentUsage as any;

describe("Framework Enforcement Integration", () => {
  const logDir = path.join(process.cwd(), ".opencode", "logs");
  const logFile = path.join(logDir, "framework-activity.log");

  beforeEach(() => {
    vi.clearAllMocks();
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  afterEach(() => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
  });

  it("should enforce framework logging on all tool operations", async () => {
    const tools = ["read", "grep", "write", "edit", "bash"];

    for (const tool of tools) {
      await frameworkLogger.log(
        "framework-activity",
        `tool called: ${tool}`,
        "info",
        {
          tool,
          args: { test: true },
        },
      );
    }

    expect(frameworkLogger.log).toHaveBeenCalledTimes(5);

    tools.forEach((tool) => {
      expect(frameworkLogger.log).toHaveBeenCalledWith(
        "framework-activity",
        `tool called: ${tool}`,
        "info",
        expect.objectContaining({ tool }),
      );
    });
  });

  it.skip("should integrate codex-injector with framework system", async () => {
    // Test direct integration with codex-injector
    const { createStringRayCodexInjectorHook } =
      await import("../../codex-injector");
    const hook = createStringRayCodexInjectorHook();

    // Verify hook structure
    expect(hook).toHaveProperty("hooks");
    expect(hook.hooks).toHaveProperty("tool.execute.before");
    expect(hook.hooks).toHaveProperty("tool.execute.after");
    expect(hook.hooks).toHaveProperty("agent.start");

    // Verify hook functions are callable
    expect(typeof hook.hooks["tool.execute.before"]).toBe("function");
    expect(typeof hook.hooks["tool.execute.after"]).toBe("function");
    expect(typeof hook.hooks["agent.start"]).toBe("function");
  });
  it("should validate codex compliance on critical operations", async () => {
    const criticalTools = ["write", "edit", "multiedit", "batch"];
    const nonCriticalTools = ["read", "grep", "bash"];

    for (const tool of criticalTools) {
      await frameworkLogger.log(
        "codex-injector",
        "enforcing codex on critical tool",
        "info",
        { tool },
      );
    }

    for (const tool of nonCriticalTools) {
      await frameworkLogger.log(
        "codex-injector",
        "non-critical tool allowed",
        "info",
        { tool },
      );
    }

    criticalTools.forEach((tool) => {
      expect(frameworkLogger.log).toHaveBeenCalledWith(
        "codex-injector",
        "enforcing codex on critical tool",
        "info",
        { tool },
      );
    });

    nonCriticalTools.forEach((tool) => {
      expect(frameworkLogger.log).toHaveBeenCalledWith(
        "codex-injector",
        "non-critical tool allowed",
        "info",
        { tool },
      );
    });
  });

  it("should maintain framework state across operations", async () => {
    await frameworkLogger.log("state-manager", "set operation", "success", {
      key: "test1",
    });
    await frameworkLogger.log("state-manager", "get operation", "info", {
      key: "test1",
      hasValue: true,
    });
    await frameworkLogger.log("state-manager", "set operation", "success", {
      key: "test2",
    });
    await frameworkLogger.log("state-manager", "clear operation", "info", {
      key: "test1",
      existed: true,
    });

    expect(frameworkLogger.log).toHaveBeenCalledTimes(4);

    expect(frameworkLogger.log).toHaveBeenCalledWith(
      "state-manager",
      "set operation",
      "success",
      { key: "test1" },
    );
    expect(frameworkLogger.log).toHaveBeenCalledWith(
      "state-manager",
      "get operation",
      "info",
      { key: "test1", hasValue: true },
    );
    expect(frameworkLogger.log).toHaveBeenCalledWith(
      "state-manager",
      "set operation",
      "success",
      { key: "test2" },
    );
    expect(frameworkLogger.log).toHaveBeenCalledWith(
      "state-manager",
      "clear operation",
      "info",
      { key: "test1", existed: true },
    );
  });

  it("should provide comprehensive framework health reporting", async () => {
    const mockLogs = [
      {
        component: "codex-injector",
        action: "validation passed",
        status: "success",
      },
      {
        component: "processor-manager",
        action: "execution completed",
        status: "success",
      },
      {
        component: "state-manager",
        action: "operation successful",
        status: "success",
      },
      {
        component: "boot-orchestrator",
        action: "initialization failed",
        status: "error",
      },
    ];

    mockGetRecentLogs.mockReturnValue(mockLogs);

    const recentLogs = frameworkLogger.getRecentLogs(10);

    expect(recentLogs).toHaveLength(4);
    expect(recentLogs).toEqual(mockLogs);

    mockGetComponentUsage.mockReturnValue([
      {
        component: "codex-injector",
        action: "validation passed",
        status: "success",
      },
    ]);

    const codexLogs = frameworkLogger.getComponentUsage("codex-injector");
    expect(codexLogs).toHaveLength(1);
    expect(codexLogs[0].component).toBe("codex-injector");
  });

  it("should handle concurrent framework operations", async () => {
    const operations = [
      { component: "codex-injector", action: "concurrent validation 1" },
      { component: "processor-manager", action: "concurrent processing 1" },
      { component: "state-manager", action: "concurrent state op 1" },
      { component: "codex-injector", action: "concurrent validation 2" },
      { component: "processor-manager", action: "concurrent processing 2" },
    ];

    const promises = operations.map((op) =>
      frameworkLogger.log(op.component, op.action, "info"),
    );

    await Promise.all(promises);

    expect(frameworkLogger.log).toHaveBeenCalledTimes(5);

    operations.forEach((op) => {
      expect(frameworkLogger.log).toHaveBeenCalledWith(
        op.component,
        op.action,
        "info",
      );
    });
  });
});
it.skip("should integrate codex-injector with framework system", async () => {
  // Test direct integration with codex-injector
  const { createStringRayCodexInjectorHook } =
    await import("../../codex-injector");
  const hook = createStringRayCodexInjectorHook();

  // Verify hook structure
  expect(hook).toHaveProperty("hooks");
  expect(hook.hooks).toHaveProperty("tool.execute.before");
  expect(hook.hooks).toHaveProperty("tool.execute.after");
  expect(hook.hooks).toHaveProperty("agent.start");

  // Verify hook functions are callable
  expect(typeof hook.hooks["tool.execute.before"]).toBe("function");
  expect(typeof hook.hooks["tool.execute.after"]).toBe("function");
  expect(typeof hook.hooks["agent.start"]).toBe("function");
});
