/**
 * Processor Implementations Integration Tests
 *
 * Tests real processor execution in the StringRay framework.
 * These tests verify that processors in src/processors/implementations/
 * execute correctly with actual data.
 *
 * @testIntegration
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ProcessorManager } from "../../processors/processor-manager.js";
import { StringRayStateManager } from "../../state/state-manager.js";

describe("Processor Implementations Integration Tests", () => {
  let stateManager: StringRayStateManager;
  let processorManager: ProcessorManager;

  beforeEach(() => {
    stateManager = new StringRayStateManager("/tmp/test-processor-integration");
    processorManager = new ProcessorManager(stateManager);

    processorManager.registerProcessor({
      name: "preValidate",
      type: "pre",
      priority: 10,
      enabled: true,
    });
    processorManager.registerProcessor({
      name: "codexCompliance",
      type: "pre",
      priority: 20,
      enabled: true,
    });
    processorManager.registerProcessor({
      name: "versionCompliance",
      type: "pre",
      priority: 30,
      enabled: true,
    });
    processorManager.registerProcessor({
      name: "errorBoundary",
      type: "pre",
      priority: 40,
      enabled: true,
    });
    processorManager.registerProcessor({
      name: "logProtection",
      type: "pre",
      priority: 5,
      enabled: true,
    });

    processorManager.registerProcessor({
      name: "regressionTesting",
      type: "post",
      priority: 30,
      enabled: true,
    });
    processorManager.registerProcessor({
      name: "stateValidation",
      type: "post",
      priority: 20,
      enabled: true,
    });
    processorManager.registerProcessor({
      name: "refactoringLogging",
      type: "post",
      priority: 15,
      enabled: true,
    });
    processorManager.registerProcessor({
      name: "testAutoCreation",
      type: "post",
      priority: 50,
      enabled: true,
    });
    processorManager.registerProcessor({
      name: "coverageAnalysis",
      type: "post",
      priority: 60,
      enabled: true,
    });
    processorManager.registerProcessor({
      name: "agentsMdValidation",
      type: "post",
      priority: 25,
      enabled: true,
    });
  });

  afterEach(async () => {
    await processorManager.cleanupProcessors();
  });

  describe("Pre-Processors Execution", () => {
    it("should execute all registered pre-processors", async () => {
      const result = await processorManager.executePreProcessors({
        tool: "edit",
        args: { filePath: "/test/file.ts" },
        context: { operation: "modify" },
      });

      expect(result.results).toHaveLength(5);
      expect(result.results.some((r) => r.processorName === "preValidate")).toBe(true);
      expect(result.results.some((r) => r.processorName === "codexCompliance")).toBe(true);
      expect(result.results.some((r) => r.processorName === "versionCompliance")).toBe(true);
      expect(result.results.some((r) => r.processorName === "errorBoundary")).toBe(true);
      expect(result.results.some((r) => r.processorName === "logProtection")).toBe(true);
    });

    it("should execute pre-processors and return results with processorName", async () => {
      const result = await processorManager.executePreProcessors({
        tool: "edit",
        args: { filePath: "/test/file.ts" },
        context: { operation: "modify" },
      });

      for (const procResult of result.results) {
        expect(procResult).toHaveProperty("processorName");
        expect(procResult).toHaveProperty("success");
        expect(procResult).toHaveProperty("duration");
        expect(typeof procResult.duration).toBe("number");
      }
    });
  });

  describe("Log Protection Processor", () => {
    it("should execute logProtection processor with no file path", async () => {
      const result = await processorManager.executePreProcessors({
        tool: "edit",
        args: {},
        context: { operation: "modify" },
      });

      const logProtectionResult = result.results.find(
        (r) => r.processorName === "logProtection"
      );
      expect(logProtectionResult).toBeDefined();
      expect(logProtectionResult?.success).toBe(true);
      expect(logProtectionResult?.data).toHaveProperty("allowed", true);
    });

    it("should allow non-delete operations", async () => {
      const result = await processorManager.executePreProcessors({
        tool: "edit",
        args: { filePath: "/test/file.ts" },
        context: { operation: "create" },
      });

      const logProtectionResult = result.results.find(
        (r) => r.processorName === "logProtection"
      );
      expect(logProtectionResult?.data).toHaveProperty("allowed", true);
    });

    it("should return allowed: true for non-delete operation", async () => {
      const result = await processorManager.executePreProcessors({
        tool: "read",
        args: { filePath: "/test/file.ts" },
        context: { operation: "read" },
      });

      const logProtectionResult = result.results.find(
        (r) => r.processorName === "logProtection"
      );
      expect(logProtectionResult?.data).toHaveProperty("allowed", true);
      expect(logProtectionResult?.data).toHaveProperty("reason");
    });
  });

  describe("Post-Processors Execution", () => {
    it("should execute all registered post-processors", async () => {
      const preResults = [
        {
          success: true,
          data: {},
          duration: 10,
          processorName: "preValidate",
        },
      ];

      const postResults = await processorManager.executePostProcessors(
        "modify",
        {
          operation: "modify",
          data: { test: "data" },
          tool: "edit",
          filePath: "/test/file.ts",
        },
        preResults
      );

      expect(postResults.length).toBeGreaterThanOrEqual(6);

      const processorNames = postResults.map((r) => r.processorName);
      expect(processorNames).toContain("regressionTesting");
      expect(processorNames).toContain("stateValidation");
      expect(processorNames).toContain("refactoringLogging");
      expect(processorNames).toContain("testAutoCreation");
      expect(processorNames).toContain("coverageAnalysis");
      expect(processorNames).toContain("agentsMdValidation");
    }, 30000);

    it("should return post-processor results with required properties", async () => {
      const preResults = [
        {
          success: true,
          data: {},
          duration: 10,
          processorName: "preValidate",
        },
      ];

      const postResults = await processorManager.executePostProcessors(
        "modify",
        {
          operation: "modify",
          data: { test: "data" },
          tool: "edit",
          filePath: "/test/file.ts",
        },
        preResults
      );

      for (const procResult of postResults) {
        expect(procResult).toHaveProperty("processorName");
        expect(procResult).toHaveProperty("success");
        expect(procResult).toHaveProperty("duration");
        expect(typeof procResult.duration).toBe("number");
      }
    }, 30000);
  });

  describe("Processor Metrics", () => {
    it("should provide processor health data after execution", async () => {
      await processorManager.executePreProcessors({
        tool: "edit",
        args: { filePath: "/test/file.ts" },
        context: { operation: "modify" },
      });

      const health = processorManager.getProcessorHealth();
      expect(health).toBeDefined();
      expect(Array.isArray(health)).toBe(true);
    });
  });

  describe("Processor Execution Order", () => {
    it("should execute pre-processors in priority order", async () => {
      const result = await processorManager.executePreProcessors({
        tool: "edit",
        args: { filePath: "/test/file.ts" },
        context: { operation: "modify" },
      });

      const priorities = result.results.map((r) => {
        const processor = processorManager.getProcessors().get(r.processorName);
        return processor?.priority ?? 0;
      });

      const sortedPriorities = [...priorities].sort((a, b) => a - b);
      expect(priorities).toEqual(sortedPriorities);
    });
  });

  describe("Error Handling", () => {
    it("should continue executing processors even if some fail", async () => {
      const result = await processorManager.executePreProcessors({
        tool: "edit",
        args: { filePath: "/test/file.ts" },
        context: { operation: "modify" },
      });

      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe("Registry Integration", () => {
    it("should have processors registered in the registry", () => {
      const registry = processorManager.getProcessors();
      expect(registry.get("preValidate")).toBeDefined();
      expect(registry.get("logProtection")).toBeDefined();
      expect(registry.get("codexCompliance")).toBeDefined();
      expect(registry.get("versionCompliance")).toBeDefined();
    });

    it("should retrieve processor from registry by name", () => {
      const registry = processorManager.getProcessors();
      const processor = registry.get("preValidate");
      expect(processor).toBeDefined();
      expect(processor?.name).toBe("preValidate");
      expect(processor?.type).toBe("pre");
    });
  });
});