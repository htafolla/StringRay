import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/framework-logger", () => ({
  frameworkLogger: {
    log: vi.fn(),
  },
}));

vi.mock("../../src/codex-injector", () => ({
  createStrRayCodexInjectorHook: vi.fn(() => ({})),
}));

vi.mock("../../src/orchestrator", () => ({
  strRayOrchestrator: {},
}));

describe("Framework Activation", () => {
  it("should activate framework components without errors", async () => {
    const { activateStrRayFramework, defaultStrRayConfig } =
      await import("../../src/strray-activation");

    const result = await activateStrRayFramework();

    expect(result).toBeUndefined();
  });

  it("should handle activation failures gracefully", async () => {
    const { activateStrRayFramework } =
      await import("../../src/strray-activation");

    // Test with config that enables disabled components
    const result = await activateStrRayFramework({
      enableBootOrchestrator: true,
      enableStateManagement: true,
      enableProcessors: true,
    });

    // Should still complete (errors are handled internally)
    expect(result).toBeUndefined();
  });
});
