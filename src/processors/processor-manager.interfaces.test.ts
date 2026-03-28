/**
 * Tests for Processor Manager type interfaces
 *
 * @version 1.0.0
 * @since 2026-03-23
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ProcessorManager,
  ProcessorConfig,
  ProcessorHealth,
  ProcessorMetrics,
  ProcessorContextValidation,
  PostProcessorData,
  LegacyContext,
  TestExecutionResult,
  GenericTestResult,
} from "./processor-manager.js";

describe("ProcessorManager Interfaces", () => {
  describe("ProcessorConfig", () => {
    it("should accept valid processor config", () => {
      const config: ProcessorConfig = {
        name: "test-processor",
        type: "pre",
        priority: 1,
        enabled: true,
      };

      expect(config.name).toBe("test-processor");
      expect(config.type).toBe("pre");
      expect(config.priority).toBe(1);
      expect(config.enabled).toBe(true);
    });

    it("should accept optional fields", () => {
      const config: ProcessorConfig = {
        name: "test-processor",
        type: "post",
        priority: 0,
        enabled: false,
        timeout: 5000,
        retryAttempts: 3,
      };

      expect(config.timeout).toBe(5000);
      expect(config.retryAttempts).toBe(3);
    });
  });

  describe("ProcessorHealth", () => {
    it("should represent healthy status", () => {
      const health: ProcessorHealth = {
        name: "test-processor",
        status: "healthy",
        lastExecution: Date.now(),
        successRate: 0.98,
        averageDuration: 100,
        errorCount: 2,
      };

      expect(health.status).toBe("healthy");
      expect(health.successRate).toBeGreaterThan(0.95);
    });

    it("should represent degraded status", () => {
      const health: ProcessorHealth = {
        name: "test-processor",
        status: "degraded",
        lastExecution: Date.now(),
        successRate: 0.85,
        averageDuration: 200,
        errorCount: 15,
      };

      expect(health.status).toBe("degraded");
    });

    it("should represent failed status", () => {
      const health: ProcessorHealth = {
        name: "test-processor",
        status: "failed",
        lastExecution: Date.now(),
        successRate: 0.5,
        averageDuration: 500,
        errorCount: 50,
      };

      expect(health.status).toBe("failed");
    });
  });

  describe("ProcessorMetrics", () => {
    it("should track execution counts", () => {
      const metrics: ProcessorMetrics = {
        totalExecutions: 100,
        successfulExecutions: 95,
        failedExecutions: 5,
        averageDuration: 150,
        lastExecutionTime: Date.now(),
        healthStatus: "healthy",
      };

      expect(metrics.totalExecutions).toBe(100);
      expect(metrics.successfulExecutions).toBe(95);
      expect(metrics.failedExecutions).toBe(5);
    });
  });

  describe("ProcessorContextValidation", () => {
    it("should represent valid context", () => {
      const validation: ProcessorContextValidation = {
        valid: true,
        errors: [],
      };

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should represent invalid context with errors", () => {
      const validation: ProcessorContextValidation = {
        valid: false,
        errors: ["Missing required field: operation", "Invalid type for field: priority"],
      };

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(2);
    });
  });

  describe("PostProcessorData", () => {
    it("should contain operation and data", () => {
      const data: PostProcessorData = {
        operation: "file-write",
        data: { filePath: "/test/file.ts" },
        preResults: [],
      };

      expect(data.operation).toBe("file-write");
      expect(data.data).toBeDefined();
    });

    it("should be optional for tool and directory", () => {
      const data: PostProcessorData = {
        operation: "test",
      };

      expect(data.operation).toBe("test");
      expect(data.tool).toBeUndefined();
      expect(data.directory).toBeUndefined();
    });
  });

  describe("LegacyContext", () => {
    it("should accept arbitrary key-value pairs", () => {
      const context: LegacyContext = {
        operation: "test",
        filePath: "/test.ts",
        count: 42,
        enabled: true,
      };

      expect(context.operation).toBe("test");
      expect(context.filePath).toBe("/test.ts");
      expect(context.count).toBe(42);
      expect(context.enabled).toBe(true);
    });

    it("should support nested objects", () => {
      const context: LegacyContext = {
        nested: {
          deep: {
            value: "found",
          },
        },
      };

      expect((context.nested as any).deep.value).toBe("found");
    });
  });

  describe("TestExecutionResult", () => {
    it("should represent successful test run", () => {
      const result: TestExecutionResult = {
        testsExecuted: 50,
        passed: 48,
        failed: 2,
        exitCode: 0,
        success: true,
      };

      expect(result.success).toBe(true);
      expect(result.passed).toBe(48);
      expect(result.failed).toBe(2);
    });

    it("should represent failed test run", () => {
      const result: TestExecutionResult = {
        testsExecuted: 50,
        passed: 30,
        failed: 20,
        exitCode: 1,
        success: false,
        error: "Test suite failed",
      };

      expect(result.success).toBe(false);
      expect(result.failed).toBe(20);
      expect(result.passed).toBe(30);
    });
  });

  describe("GenericTestResult", () => {
    it("should support coverage analysis result", () => {
      const result: GenericTestResult = {
        success: true,
        coverage: {
          lines: 85.5,
          branches: 70.2,
          functions: 90.0,
        },
      };

      expect(result.success).toBe(true);
      expect(result.coverage).toBeDefined();
    });

    it("should support version compliance result", () => {
      const result: GenericTestResult = {
        success: true,
        compliant: true,
        errors: [],
        warnings: ["Minor version mismatch in dependency"],
        checkedAt: new Date().toISOString(),
      };

      expect(result.compliant).toBe(true);
      expect(result.checkedAt).toBeDefined();
    });

    it("should support codex compliance result", () => {
      const result: GenericTestResult = {
        success: true,
        compliant: true,
        violations: [],
        warnings: [],
        termsChecked: 150,
        operation: "file-write",
      };

      expect(result.termsChecked).toBe(150);
    });

    it("should support regression testing result", () => {
      const result: GenericTestResult = {
        success: true,
        regressions: [],
        issues: [],
      };

      expect(result.regressions).toHaveLength(0);
      expect(result.issues).toHaveLength(0);
    });

    it("should support state validation result", () => {
      const result: GenericTestResult = {
        success: true,
        stateValid: true,
      };

      expect(result.stateValid).toBe(true);
    });

    it("should support refactoring logging result", () => {
      const result: GenericTestResult = {
        success: true,
        logged: true,
        message: "Agent completion logged",
      };

      expect(result.logged).toBe(true);
    });
  });
});
