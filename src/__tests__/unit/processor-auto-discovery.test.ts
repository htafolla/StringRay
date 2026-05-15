import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ProcessorManager } from "../../processors/processor-manager.js";
import { StringRayStateManager } from "../../state/state-manager.js";

describe("Processor Auto-Discovery", () => {
  let tmpDir: string;
  let implementationsDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "strray-discovery-test-"));
    implementationsDir = path.join(tmpDir, "implementations");
    fs.mkdirSync(implementationsDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("should skip test files during discovery", async () => {
    fs.writeFileSync(path.join(implementationsDir, "something.test.js"), "// test file");
    fs.writeFileSync(path.join(implementationsDir, "other.spec.js"), "// spec file");

    const stateManager = new StringRayStateManager();
    const manager = new ProcessorManager(stateManager);

    const discovered = await manager.discoverProcessors(tmpDir);

expect(discovered).toEqual([]);
  }, 30000);

  it("should not overwrite hardcoded factories", async () => {
    const stateManager = new StringRayStateManager();
    const manager = new ProcessorManager(stateManager);

    const factoriesBefore = (manager as any).factories.size;

    await manager.discoverProcessors(tmpDir);

    expect((manager as any).factories.size).toBe(factoriesBefore);
  }, 30000);

  it("should handle missing implementations directory gracefully", async () => {
    const stateManager = new StringRayStateManager();
    const manager = new ProcessorManager(stateManager);

    const discovered = await manager.discoverProcessors("/nonexistent/path");

    expect(discovered).toEqual([]);
  });

  it("should handle malformed files gracefully", async () => {
    fs.writeFileSync(path.join(implementationsDir, "broken.js"), "this is not valid JS {{{");

    const stateManager = new StringRayStateManager();
    const manager = new ProcessorManager(stateManager);

    const discovered = await manager.discoverProcessors(tmpDir);

    expect(discovered).toEqual([]);
  });

  it("should discover processors from default implementations directory", async () => {
    const stateManager = new StringRayStateManager();
    const manager = new ProcessorManager(stateManager);

    const discovered = await manager.discoverProcessors();

    expect(discovered.length).toBeGreaterThan(0);
    expect(discovered).toContain("preValidate");
    expect(discovered).toContain("errorBoundary");
    expect(discovered).toContain("regressionTesting");
    expect(discovered).toContain("coverageAnalysis");
    expect(discovered).toContain("stateValidation");
    expect(discovered).toContain("testExecution");
  }, 60000);

  it("should skip constructors that require arguments", async () => {
    const processorCode = `
export class NeedsArgsProcessor {
  readonly name = "needsArgs";
  readonly type = "pre";
  readonly priority = 50;
  enabled = true;

  constructor(private dep: any) {}

  async execute(ctx: any) { return { success: true, data: null, duration: 0, processorName: this.name }; }
}
`;
    fs.writeFileSync(path.join(implementationsDir, "needs-args.js"), processorCode);

    const stateManager = new StringRayStateManager();
    const manager = new ProcessorManager(stateManager);

    const discovered = await manager.discoverProcessors(tmpDir);

    expect(discovered).not.toContain("needsArgs");
  });

  it("should register discovered processor as a factory", async () => {
    const stateManager = new StringRayStateManager();
    const manager = new ProcessorManager(stateManager);

    await manager.discoverProcessors();

    const factory = (manager as any).factories.get("preValidate");
    expect(factory).toBeDefined();
    expect(typeof factory.execute).toBe("function");
  }, 60000);

  it("should discover PostProcessor subclasses", async () => {
    const stateManager = new StringRayStateManager();
    const manager = new ProcessorManager(stateManager);

    const discovered = await manager.discoverProcessors();

    expect(discovered).toContain("regressionTesting");
    expect(discovered).toContain("coverageAnalysis");
  }, 60000);

  it("should registerProcessorInstance create factory from IProcessor", async () => {
    const stateManager = new StringRayStateManager();
    const manager = new ProcessorManager(stateManager);

    const mockProcessor = {
      name: "mockProcessor",
      type: "pre" as const,
      priority: 99,
      enabled: true,
      execute: async (_ctx: any) => ({
        success: true,
        data: { mock: true },
        duration: 0,
        processorName: "mockProcessor",
      }),
    };

    const factoryCountBefore = (manager as any).factories.size;
    manager.registerProcessorInstance(mockProcessor as any);
    const factoryCountAfter = (manager as any).factories.size;

    expect(factoryCountAfter).toBe(factoryCountBefore + 1);

    const factory = (manager as any).factories.get("mockProcessor");
    const result = await factory.execute({});
    expect(result).toEqual({ mock: true });
  });

  it("should not overwrite existing factory via registerProcessorInstance", async () => {
    const stateManager = new StringRayStateManager();
    const manager = new ProcessorManager(stateManager);

    const factoriesBefore = (manager as any).factories.size;

    const mockProcessor = {
      name: "preValidate",
      type: "pre" as const,
      priority: 999,
      enabled: true,
      execute: async () => ({ success: true, data: null, duration: 0, processorName: "preValidate" }),
    };

    manager.registerProcessorInstance(mockProcessor as any);

    expect((manager as any).factories.size).toBe(factoriesBefore);
  });
});
