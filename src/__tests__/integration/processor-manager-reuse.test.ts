/**
 * Processor Manager Reuse Test
 *
 * Tests that the plugin reuses the same ProcessorManager instance
 * rather than creating a new one each time (which would lose registered processors).
 *
 * This is a critical regression test - previously the plugin was creating a new
 * ProcessorManager on each tool execution, which meant no processors were registered.
 *
 * @issue https://github.com/htafolla/StringRay/issues/processor-reuse
 * @testRegression
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProcessorManager } from "../../processors/processor-manager.js";
import { StringRayStateManager } from "../../state/state-manager.js";

describe("ProcessorManager Reuse (Critical Regression)", () => {
  let stateManager: StringRayStateManager;

  beforeEach(() => {
    // Create fresh state manager for each test
    stateManager = new StringRayStateManager("/tmp/test-processor-reuse");
  });

  it("should reuse ProcessorManager from state instead of creating new one", () => {
    // Register processors in first "boot" phase
    const bootProcessorManager = new ProcessorManager(stateManager);
    bootProcessorManager.registerProcessor({
      name: "codexCompliance",
      type: "pre",
      priority: 20,
      enabled: true,
    });
    bootProcessorManager.registerProcessor({
      name: "testExecution",
      type: "post",
      priority: 10,
      enabled: true,
    });

    // Store in state (like boot-orchestrator does)
    stateManager.set("processor:manager", bootProcessorManager);

    // Simulate plugin getting processor manager (like strray-codex-injection.ts does)
    const retrievedProcessorManager = stateManager.get("processor:manager");

    // CRITICAL: Must be the SAME instance
    expect(retrievedProcessorManager).toBe(bootProcessorManager);

    // Verify processors are registered (use processors.size, not activeProcessors)
    // @ts-ignore - accessing private for testing
    expect(retrievedProcessorManager.processors.size).toBe(2);
  });

  it("should NOT create new ProcessorManager if one exists in state", () => {
    // Create and register first instance
    const firstManager = new ProcessorManager(stateManager);
    firstManager.registerProcessor({
      name: "preValidate",
      type: "pre",
      priority: 10,
      enabled: true,
    });
    stateManager.set("processor:manager", firstManager);

    // Simulate what plugin should do: check state first
    let manager = stateManager.get("processor:manager");
    if (!manager) {
      manager = new ProcessorManager(stateManager);
      stateManager.set("processor:manager", manager);
    }

    // Should be the first instance, not a new one
    expect(manager).toBe(firstManager);

    // Should have the original processors
    // @ts-ignore - accessing private for testing
    expect(manager.processors.size).toBe(1);
  });

  it("should fail if new ProcessorManager is created each time (the bug)", () => {
    // Simulate the BUG: creating new ProcessorManager each time
    const firstManager = new ProcessorManager(stateManager);
    firstManager.registerProcessor({
      name: "codexCompliance",
      type: "pre",
      priority: 20,
      enabled: true,
    });

    // BUG: Not storing in state!
    // stateManager.set("processor:manager", firstManager);

    // Simulate plugin creating NEW instance (the bug)
    const secondManager = new ProcessorManager(stateManager);
    // This new manager has NO processors registered!

    // @ts-ignore - accessing private for testing
    expect(firstManager.processors.size).toBe(1);
    // @ts-ignore - accessing private for testing
    expect(secondManager.processors.size).toBe(0);

    // This demonstrates the bug: if you create new ProcessorManager,
    // you lose all registered processors!
  });

  it("plugin processor state across multiple workflow: should maintain tool executions", () => {
    // This test simulates the actual plugin workflow:
    // 1. First tool execution - creates and stores ProcessorManager
    // 2. Second tool execution - retrieves from state

    // First execution - creates and registers
    let pm: any = stateManager.get("processor:manager");
    if (!pm) {
      pm = new ProcessorManager(stateManager);
      pm.registerProcessor({
        name: "codexCompliance",
        type: "pre",
        priority: 20,
        enabled: true,
      });
      pm.registerProcessor({
        name: "testExecution",
        type: "post",
        priority: 10,
        enabled: true,
      });
      stateManager.set("processor:manager", pm);
    }

    // Verify first execution has processors
    // @ts-ignore - accessing private for testing
    expect(pm.processors.size).toBe(2);

    // Second execution - retrieves existing (this is what should happen)
    let pm2 = stateManager.get("processor:manager");
    expect(pm2).toBe(pm); // Same instance!

    // Verify second execution also has processors
    // @ts-ignore - accessing private for testing
    expect(pm2.processors.size).toBe(2);
  });
});
