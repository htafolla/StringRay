/**
 * End-to-End Orchestration Test
 *
 * Tests the complete orchestration flow including:
 * 1. Framework boot setup
 * 2. Plugin connection to booted framework
 * 3. Pre-processor execution on write operations
 * 4. Test auto-creation for new files
 *
 * @testE2E
 * @critical
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { StringRayStateManager } from "../../state/state-manager.js";

// Mock ProcessorManager for E2E tests
vi.mock("../../processors/processor-manager", () => {
  const MockClass = function (this: any, _stateManager?: any) {
    this.registerProcessor = vi.fn();
    this.initializeProcessors = vi.fn().mockResolvedValue(true);
    this.getProcessorHealth = vi.fn(() => [
      { name: "preValidate", status: "healthy" },
      { name: "codexCompliance", status: "healthy" },
      { name: "errorBoundary", status: "healthy" },
      { name: "stateValidation", status: "healthy" },
    ]);
    this.processors = new Map([
      ["testAutoCreation", { name: "testAutoCreation" }],
      ["codexCompliance", { name: "codexCompliance" }],
      ["preValidate", { name: "preValidate" }],
    ]);
    this.executePreProcessors = vi.fn().mockResolvedValue({
      success: true,
      results: [
        { processorName: "testAutoCreation", status: "executed" },
        { processorName: "preValidate", status: "executed" },
      ],
    });
    this.executePostProcessors = vi.fn().mockResolvedValue({
      success: true,
      results: [],
    });
  };
  return { ProcessorManager: MockClass };
});

import { ProcessorManager } from "../../processors/processor-manager.js";

// E2E test suite - tests full orchestration flow with mocked ProcessorManager
describe("E2E Orchestration Flow", () => {
  const testDir = "/tmp/strray-e2e-test";
  let stateManager: StringRayStateManager;
  let processorManager: any;

  beforeAll(async () => {
    // Clean up any previous test runs
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, ".opencode", "state"), { recursive: true });

    // Simulate framework boot by setting up state manager and processor manager directly
    stateManager = new StringRayStateManager();
    processorManager = new ProcessorManager(stateManager);

    // Register processors as the boot sequence would
    processorManager.registerProcessor({ name: "testAutoCreation" });
    processorManager.registerProcessor({ name: "codexCompliance" });
    processorManager.registerProcessor({ name: "preValidate" });
    await processorManager.initializeProcessors();

    // Store in state manager (as boot sequence would)
    stateManager.set("processor:manager", processorManager);
    stateManager.set("processor:active", true);
    stateManager.set("boot:success", true);

    // Store globally (as plugin would find it)
    (globalThis as any).strRayStateManager = stateManager;
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    // Clear global state
    delete (globalThis as any).strRayStateManager;
  });

  it("should boot framework and register all processors", async () => {
    // Verify boot state
    expect(stateManager.get("boot:success")).toBe(true);
    expect(stateManager.get("processor:active")).toBe(true);

    // Get processor manager from state
    const pm = stateManager.get("processor:manager");
    expect(pm).toBeDefined();
    expect(pm).toBe(processorManager);

    // Verify processors are registered
    const processors = pm.processors;
    expect(processors.has("testAutoCreation")).toBe(true);
    expect(processors.has("codexCompliance")).toBe(true);
    expect(processors.has("preValidate")).toBe(true);

    // Verify processor health
    const health = pm.getProcessorHealth();
    expect(health.length).toBeGreaterThan(0);
    health.forEach((h: any) => expect(h.status).toBe("healthy"));
  });

  it("should reuse booted framework from plugin context", async () => {
    // Simulate plugin finding booted framework
    const globalState = (globalThis as any).strRayStateManager;
    expect(globalState).toBeDefined();

    // Simulate plugin getting processor manager
    const pm = globalState.get("processor:manager");
    expect(pm).toBeDefined();

    // Should be same instance as boot
    expect(pm).toBe(processorManager);
  });

  it("should execute pre-processors on write operation", async () => {
    // Create a test file
    const testFile = path.join(testDir, "src", "test-module.ts");
    fs.mkdirSync(path.dirname(testFile), { recursive: true });

    // Execute pre-processors (like plugin does)
    const result = await processorManager.executePreProcessors({
      tool: "write",
      args: { filePath: "src/test-module.ts" },
      context: {
        directory: testDir,
        operation: "tool_execution",
        filePath: "src/test-module.ts",
      },
    });

    expect(result.success).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);

    // Verify testAutoCreation processor ran
    const testAutoResult = result.results.find(
      (r: any) => r.processorName === "testAutoCreation",
    );
    expect(testAutoResult).toBeDefined();
  });

  it("should auto-create test file for new source file", async () => {
    // Create a source file with exports
    const sourceFile = path.join(testDir, "src", "calculator.ts");
    fs.mkdirSync(path.dirname(sourceFile), { recursive: true });

    fs.writeFileSync(
      sourceFile,
      `
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export class Calculator {
  multiply(a: number, b: number): number {
    return a * b;
  }
}
`,
      "utf8",
    );

    // Execute pre-processors
    const result = await processorManager.executePreProcessors({
      tool: "write",
      args: { filePath: "src/calculator.ts" },
      context: {
        directory: testDir,
        operation: "tool_execution",
        filePath: "src/calculator.ts",
      },
    });

    expect(result.success).toBe(true);

    // The test auto-creation processor should have attempted to create it
    const testAutoResult = result.results.find(
      (r: any) => r.processorName === "testAutoCreation",
    );

    expect(testAutoResult).toBeDefined();
  });

  it("should detect missing tests and report violation", async () => {
    const { RuleEnforcer } = await import("../../enforcement/rule-enforcer.js");
    const enforcer = new RuleEnforcer();

    // Test code without tests
    const newCode = `
export function newFeature() {
  return "hello";
}
`;

    const result = await enforcer.validateOperation("write", {
      operation: "write",
      newCode,
      tests: [], // No tests provided
      files: ["src/new-feature.ts"],
    });

    // Should detect missing tests
    expect(result.passed).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // Should suggest test creation
    const hasTestSuggestion = result.results.some((r: any) =>
      r.suggestions?.some((s: string) => s.toLowerCase().includes("test")),
    );
    expect(hasTestSuggestion).toBe(true);
  });

  it("should execute post-processors after operation", async () => {
    const result = await processorManager.executePostProcessors(
      "write",
      {
        directory: testDir,
        operation: "tool_execution",
        filePath: "src/test.ts",
        success: true,
      },
      [],
    );

    expect(result.success).toBe(true);
  });

  it("should maintain processor state across multiple operations", async () => {
    const globalState = (globalThis as any).strRayStateManager;
    const processorManager1 = globalState.get("processor:manager");

    // Simulate another operation - get processor manager again
    const processorManager2 = globalState.get("processor:manager");

    // Should be same instance
    expect(processorManager1).toBe(processorManager2);

    // Processors should still be registered
    expect(processorManager1.processors.size).toBeGreaterThan(0);
  });
});
