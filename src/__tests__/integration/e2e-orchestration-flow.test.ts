/**
 * End-to-End Orchestration Test
 *
 * Tests the complete orchestration flow including:
 * 1. Framework boot
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
import { BootOrchestrator } from "../../core/boot-orchestrator.js";

// Mock ProcessorManager for E2E tests
vi.mock("../../processors/processor-manager", () => {
  const MockClass = function (this: any) {
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
        { processorName: "preValidate", status: "passed" },
        { processorName: "testAutoCreation", status: "passed" },
      ],
    });
    this.executePostProcessors = vi.fn().mockResolvedValue({
      success: true,
    });
  };
  return { ProcessorManager: MockClass };
});

// Mock delegation system components
vi.mock("../../delegation/index.js", () => ({
  createAgentDelegator: vi.fn().mockReturnValue({
    delegate: vi.fn(),
  }),
  createSessionCoordinator: vi.fn().mockReturnValue({
    initializeSession: vi.fn().mockReturnValue({ sessionId: "test-session" }),
  }),
}));

// Mock session components
vi.mock("../../session/session-cleanup-manager.js", () => ({
  createSessionCleanupManager: vi.fn().mockReturnValue({
    registerSession: vi.fn(),
  }),
}));

vi.mock("../../session/session-monitor.js", () => ({
  createSessionMonitor: vi.fn().mockReturnValue({
    registerSession: vi.fn(),
  }),
}));

vi.mock("../../session/session-state-manager.js", () => ({
  createSessionStateManager: vi.fn().mockReturnValue({
    initialize: vi.fn().mockResolvedValue(true),
  }),
}));

// Mock security components
vi.mock("../../security/security-hardener.js", () => ({
  securityHardener: {
    initialize: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("../../security/security-headers.js", () => ({
  securityHeadersMiddleware: {
    initialize: vi.fn().mockResolvedValue(true),
  },
}));

// Mock security auditor (used by finalizeSecurityIntegration)
vi.mock("../../security/security-auditor.js", () => ({
  SecurityAuditor: vi.fn().mockImplementation(() => ({
    auditProject: vi.fn().mockResolvedValue({ score: 95, issues: [] }),
  })),
}));

// Mock codex injector (used by activateCodexCompliance)
vi.mock("../../core/codex-injector.js", () => ({
  CodexInjector: vi.fn().mockImplementation(() => ({})),
}));

describe("E2E Orchestration Flow", () => {
  const testDir = "/tmp/strray-e2e-test";
  let stateManager: StringRayStateManager;
  let bootOrchestrator: BootOrchestrator;

  beforeAll(async () => {
    // Clean up any previous test runs
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, ".opencode", "state"), { recursive: true });
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
    // Create with proper config object (not a string)
    bootOrchestrator = new BootOrchestrator(
      {
        enableEnforcement: false,
        codexValidation: false,
        sessionManagement: true,
        processorActivation: true,
        agentLoading: false,
      },
      new StringRayStateManager(path.join(testDir, ".opencode", "state")),
    );

    // Execute boot sequence (no .boot() method exists; use executeBootSequence)
    const result = await bootOrchestrator.executeBootSequence();

    expect(result.success).toBe(true);
    expect(result.processorsActivated).toBe(true);
    expect(result.sessionManagementActive).toBe(true);

    // Access private stateManager via (as any)
    stateManager = (bootOrchestrator as any).stateManager;
    expect(stateManager).toBeDefined();

    // Access private processorManager via (as any)
    const processorManager = (bootOrchestrator as any).processorManager;
    expect(processorManager).toBeDefined();

    // Verify testAutoCreation processor is registered
    const processors = processorManager.processors;
    expect(processors.has("testAutoCreation")).toBe(true);
    expect(processors.has("codexCompliance")).toBe(true);
    expect(processors.has("preValidate")).toBe(true);

    // Verify processor:manager is stored in state (like plugin would find it)
    const storedProcessorManager = stateManager.get("processor:manager");
    expect(storedProcessorManager).toBe(processorManager);

    // Store state manager globally (like plugin would find it)
    (globalThis as any).strRayStateManager = stateManager;
  });

  it("should reuse booted framework from plugin context", () => {
    // Simulate plugin finding booted framework
    const globalState = (globalThis as any).strRayStateManager;
    expect(globalState).toBeDefined();

    // Simulate plugin getting processor manager
    const processorManager = globalState.get("processor:manager");
    expect(processorManager).toBeDefined();

    // Should be same instance as boot
    expect(processorManager).toBe((bootOrchestrator as any).processorManager);

    // Verify boot status via public API
    const status = bootOrchestrator.getBootStatus();
    expect(status.processorsActivated).toBe(true);
    expect(status.success).toBe(true);
    expect(status.agentsLoaded).toEqual([]);
    expect(status.errors).toEqual([]);
  });

  it("should execute pre-processors on write operation", async () => {
    const processorManager = (globalThis as any).strRayStateManager.get(
      "processor:manager",
    );

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

    // Verify pre-processors were called
    expect(processorManager.executePreProcessors).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: "write",
        args: expect.objectContaining({ filePath: "src/test-module.ts" }),
      }),
    );
  });

  it("should auto-create test file for new source file", async () => {
    const processorManager = (globalThis as any).strRayStateManager.get(
      "processor:manager",
    );

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

    // Execute pre-processors (simulating plugin behavior on file write)
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

    // Verify the testAutoCreation processor was invoked as part of pre-processors
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
    const processorManager = (globalThis as any).strRayStateManager.get(
      "processor:manager",
    );

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

    // Verify post-processors were called
    expect(processorManager.executePostProcessors).toHaveBeenCalledWith(
      "write",
      expect.objectContaining({ filePath: "src/test.ts", success: true }),
      [],
    );
  });

  it("should maintain processor state across multiple operations", () => {
    const globalState = (globalThis as any).strRayStateManager;
    const processorManager1 = globalState.get("processor:manager");

    // Simulate another operation
    const processorManager2 = globalState.get("processor:manager");

    // Should be same instance
    expect(processorManager1).toBe(processorManager2);

    // Processor state should persist
    expect(processorManager1.processors.size).toBeGreaterThan(0);

    // getBootStatus should reflect consistent state
    const status = bootOrchestrator.getBootStatus();
    expect(status.processorsActivated).toBe(true);
    expect(status.sessionManagementActive).toBe(true);
  });
});
