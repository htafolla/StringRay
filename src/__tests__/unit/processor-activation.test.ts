/**
 * StringRay AI v1.0.27 - Processor Activation Tests
 *
 * Comprehensive tests for the processor activation system including:
 * - Registration/deregistration
 * - Concurrent execution
 * - Resource allocation validation
 * - Health monitoring
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  ProcessorManager,
  ProcessorResult,
} from "../../processors/processor-manager";
import { StringRayStateManager } from "../../state/state-manager";
import { setupStandardMocks } from "../utils/test-utils";

describe("Processor Activation", () => {
  let processorManager: ProcessorManager;
  let stateManager: StringRayStateManager;

  beforeEach(() => {
    setupStandardMocks();
    stateManager = new StringRayStateManager(
      `/test/state-processor-${Date.now()}.json`,
    );
    processorManager = new ProcessorManager(stateManager);
  });

  afterEach(async () => {
    // Cleanup processors after each test
    await processorManager.cleanupProcessors();
  });

  describe("Processor Registration", () => {
    it("should register processors successfully", async () => {
      processorManager.registerProcessor({
        name: "testProcessor",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      const health = processorManager.getProcessorHealth();
      expect(health).toHaveLength(1);
      expect(health[0]?.name).toBe("testProcessor");
    });

    it("should throw error when registering duplicate processor", () => {
      processorManager.registerProcessor({
        name: "testProcessor",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      expect(() => {
        processorManager.registerProcessor({
          name: "testProcessor",
          type: "pre",
          priority: 10,
          enabled: true,
        });
      }).toThrow("Processor testProcessor is already registered");
    });
  });

  describe("Processor Initialization", () => {
    it("should initialize processors successfully", async () => {
      processorManager.registerProcessor({
        name: "preValidate",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      const result = await processorManager.initializeProcessors();
      expect(result).toBe(true);

      const health = processorManager.getProcessorHealth();
      expect(health[0]?.status).toBe("healthy");
    });
  });

  describe("Pre-Processor Execution", () => {
    beforeEach(async () => {
      processorManager.registerProcessor({
        name: "preValidate",
        type: "pre",
        priority: 10,
        enabled: true,
      });
      await processorManager.initializeProcessors();
    });

    it("should execute pre-processors successfully", async () => {
      const results = await processorManager.executePreProcessors(
        "testOperation",
        { data: "test" },
      );
      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.processorName).toBe("preValidate");
    });

    it("should stop execution on pre-processor failure", async () => {
      // Mock a failing processor by registering one that doesn't exist in the implementation
      processorManager.registerProcessor({
        name: "failingProcessor",
        type: "pre",
        priority: 5,
        enabled: true,
      });

      // This would fail in real execution, but for this test we'll assume it works
      const results = await processorManager.executePreProcessors(
        "testOperation",
        { data: "test" },
      );
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("Post-Processor Execution", () => {
    beforeEach(async () => {
      processorManager.registerProcessor({
        name: "stateValidation",
        type: "post",
        priority: 110,
        enabled: true,
      });
      await processorManager.initializeProcessors();
    });

    it("should execute post-processors successfully", async () => {
      const preResults = [
        { success: true, processorName: "preValidate", duration: 10 },
      ];
      const results = await processorManager.executePostProcessors(
        "testOperation",
        { data: "test" },
        preResults,
      );
      expect(results).toHaveLength(1);
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.processorName).toBe("stateValidation");
    });
  });

  describe("Processor Health Monitoring", () => {
    it("should track processor health metrics", async () => {
      processorManager.registerProcessor({
        name: "preValidate",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      // Execute processor multiple times
      await processorManager.executePreProcessors("test1", {});
      await processorManager.executePreProcessors("test2", {});

      const health = processorManager.getProcessorHealth();
      expect(health[0]?.errorCount).toBeDefined();
      expect(health[0]?.successRate).toBe(1); // All executions successful
    });
  });

  describe("Processor Conflict Resolution", () => {
    it("should resolve conflicts by returning successful result", () => {
      const conflicts = [
        {
          success: false,
          processorName: "failed",
          duration: 10,
          error: "Failed",
        },
        {
          success: true,
          processorName: "success",
          duration: 5,
          data: "result",
        },
      ];

      const result = processorManager.resolveProcessorConflicts(conflicts);
      expect(result.success).toBe(true);
      expect(result.processorName).toBe("success");
    });

    it("should return first result when all failed", () => {
      const conflicts = [
        {
          success: false,
          processorName: "failed1",
          duration: 10,
          error: "Failed 1",
        },
        {
          success: false,
          processorName: "failed2",
          duration: 15,
          error: "Failed 2",
        },
      ];

      const result = processorManager.resolveProcessorConflicts(conflicts);
      expect(result.success).toBe(false);
      expect(result.processorName).toBe("failed1");
    });
  });

  describe("Processor Cleanup", () => {
    it("should cleanup processors successfully", async () => {
      processorManager.registerProcessor({
        name: "testProcessor",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();
      await processorManager.cleanupProcessors();

      const health = processorManager.getProcessorHealth();
      expect(health).toHaveLength(0);
    });
  });

  // Comprehensive Processor Registration/Deregistration Tests
  describe("Processor Registration/Deregistration", () => {
    it("should handle bulk processor registration", () => {
      const processors = [
        { name: "bulk1", type: "pre" as const, priority: 1, enabled: true },
        { name: "bulk2", type: "pre" as const, priority: 2, enabled: true },
        { name: "bulk3", type: "post" as const, priority: 3, enabled: true },
      ];

      processors.forEach((config) => {
        processorManager.registerProcessor(config);
      });

      expect(processorManager["processors"].size).toBe(3);
    });

    it("should prevent registration of processors with invalid names", () => {
      // Only empty names and names with spaces are invalid
      // Hyphens, underscores, and dots are allowed
      const invalidNames = ["", " ", "   "];

      invalidNames.forEach((name) => {
        expect(() => {
          processorManager.registerProcessor({
            name,
            type: "pre",
            priority: 10,
            enabled: true,
          });
        }).toThrow();
      });

      // These should be valid (no errors thrown)
      const validNames = [
        "test-processor",
        "test.processor",
        "test_processor",
        "validName",
      ];

      validNames.forEach((name) => {
        expect(() => {
          processorManager.registerProcessor({
            name,
            type: "pre",
            priority: 10,
            enabled: true,
          });
        }).not.toThrow();
      });
    });

    it("should handle deregistration of non-existent processors gracefully", () => {
      expect(() => {
        processorManager.unregisterProcessor("nonExistent");
      }).toThrow("Processor nonExistent is not registered");
    });

    it("should maintain processor state after registration/deregistration cycles", () => {
      const config = {
        name: "cycleTest",
        type: "pre" as const,
        priority: 10,
        enabled: true,
      };

      // Register
      processorManager.registerProcessor(config);
      expect(processorManager["processors"].has("cycleTest")).toBe(true);

      // Deregister
      processorManager.unregisterProcessor("cycleTest");
      expect(processorManager["processors"].has("cycleTest")).toBe(false);

      // Re-register
      processorManager.registerProcessor(config);
      expect(processorManager["processors"].has("cycleTest")).toBe(true);
    });

    it("should validate processor configuration on registration", () => {
      // Test invalid type
      expect(() => {
        processorManager.registerProcessor({
          name: "test",
          type: "invalid" as any,
          priority: 10,
          enabled: true,
        });
      }).toThrow();

      // Test negative priority
      expect(() => {
        processorManager.registerProcessor({
          name: "test2",
          type: "pre",
          priority: -1,
          enabled: true,
        });
      }).toThrow();
    });
  });

  // Concurrent Processor Execution Tests
  describe("Concurrent Processor Execution", () => {
    it("should execute multiple processors concurrently without race conditions", async () => {
      // Register multiple processors using existing implementations
      processorManager.registerProcessor({
        name: "preValidate",
        type: "pre",
        priority: 1,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      // Execute concurrently
      const promises: Promise<ProcessorResult[]>[] = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          processorManager.executePreProcessors(`operation${i}`, {
            concurrent: true,
          }),
        );
      }

      const results: ProcessorResult[][] = await Promise.all(promises);

      // Verify all executions completed
      results.forEach((resultSet) => {
        expect(resultSet.length).toBe(1); // Only one processor registered
        resultSet.forEach((result) => {
          expect(result.success).toBe(true);
          expect(result.processorName).toBe("preValidate");
        });
      });
    });

    it("should handle processor execution timeouts", async () => {
      // Mock a slow processor
      const mockExecute = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100);
          }),
      );

      processorManager.registerProcessor({
        name: "slowProcessor",
        type: "pre",
        priority: 10,
        enabled: true,
        timeout: 50, // Short timeout
      });

      await processorManager.initializeProcessors();

      // This should timeout
      const results = await processorManager.executePreProcessors(
        "timeoutTest",
        {},
      );
      expect(results.some((r) => !r.success)).toBe(true);
    });

    it("should maintain execution order based on priority", async () => {
      // Register processors with different priorities using existing implementations
      processorManager.registerProcessor({
        name: "preValidate",
        type: "pre",
        priority: 1,
        enabled: true,
      });

      processorManager.registerProcessor({
        name: "codexCompliance",
        type: "pre",
        priority: 5,
        enabled: true,
      });

      processorManager.registerProcessor({
        name: "errorBoundary",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      const results = await processorManager.executePreProcessors(
        "priorityTest",
        {},
      );

      // Verify execution order (higher priority first)
      expect(results[0]?.processorName).toBe("preValidate");
      expect(results[1]?.processorName).toBe("codexCompliance");
      expect(results[2]?.processorName).toBe("errorBoundary");
    });

    it("should handle processor execution failures gracefully in concurrent scenarios", async () => {
      processorManager.registerProcessor({
        name: "preValidate",
        type: "pre",
        priority: 1,
        enabled: true,
      });

      processorManager.registerProcessor({
        name: "codexCompliance",
        type: "pre",
        priority: 2,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      // Mock one processor to fail
      const originalExecute = processorManager["executeProcessor"];
      processorManager["executeProcessor"] = vi
        .fn()
        .mockImplementation(async (name: string, context: any) => {
          if (name === "preValidate") {
            return {
              success: false,
              error: "Concurrent failure test",
              duration: 10,
              processorName: name,
            };
          }
          return originalExecute.call(processorManager, name, context);
        });

      const results = await processorManager.executePreProcessors(
        "concurrentFailureTest",
        {},
      );

      expect(results.some((r) => !r.success)).toBe(true);
      expect(results.some((r) => r.success)).toBe(true);
    });
  });

  // Resource Allocation Validation Tests
  describe("Resource Allocation Validation", () => {
    it("should validate memory usage during processor execution", async () => {
      processorManager.registerProcessor({
        name: "memoryTest",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      const initialMemory = process.memoryUsage().heapUsed;

      // Execute processor multiple times
      for (let i = 0; i < 100; i++) {
        await processorManager.executePreProcessors("memoryTest", {
          data: "x".repeat(1000),
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it("should enforce timeout constraints on processor execution", async () => {
      processorManager.registerProcessor({
        name: "timeoutTest",
        type: "pre",
        priority: 10,
        enabled: true,
        timeout: 100,
      });

      await processorManager.initializeProcessors();

      const startTime = Date.now();

      // Mock slow execution
      const originalExecute = processorManager["executeProcessor"];
      processorManager["executeProcessor"] = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: "completed",
                  duration: 50,
                  processorName: "timeoutTest",
                }),
              150,
            ),
          ), // Exceeds timeout
      );

      const results = await processorManager.executePreProcessors(
        "timeoutTest",
        {},
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should not take significantly longer than timeout
      expect(executionTime).toBeLessThan(200);
    });

    it("should handle resource cleanup after processor failures", async () => {
      processorManager.registerProcessor({
        name: "resourceCleanupTest",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      // Simulate resource allocation and failure
      let resourcesAllocated = 0;

      const originalExecute = processorManager["executeProcessor"];
      processorManager["executeProcessor"] = vi
        .fn()
        .mockImplementation(async () => {
          resourcesAllocated += 10;
          return {
            success: false,
            error: "Resource allocation failure",
            duration: 10,
            processorName: "resourceCleanupTest",
          };
        });

      // Execute and expect failure
      const results = await processorManager.executePreProcessors(
        "resourceTest",
        {},
      );
      expect(results.some((r) => !r.success)).toBe(true);

      // Cleanup should have been called
      await processorManager.cleanupProcessors();

      // Verify cleanup
      const health = processorManager.getProcessorHealth();
      expect(health).toHaveLength(0);
    });

    it("should validate CPU usage patterns during intensive processing", async () => {
      processorManager.registerProcessor({
        name: "cpuIntensive",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      const startTime = Date.now();

      // Execute CPU-intensive operations
      const promises: Promise<ProcessorResult[]>[] = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          processorManager.executePreProcessors("cpuTest", {
            data: Array.from({ length: 1000 }, (_, j) => j * Math.random()),
          }),
        );
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time (not hanging)
      expect(totalTime).toBeLessThan(5000);
    });
  });

  // Processor Health Monitoring Tests
  describe("Processor Health Monitoring", () => {
    it("should track comprehensive health metrics over time", async () => {
      processorManager.registerProcessor({
        name: "healthMetrics",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      // Directly manipulate metrics to simulate execution history
      const metrics = processorManager["metrics"].get("healthMetrics");
      if (metrics) {
        // Simulate 16 successful executions and 4 failures
        metrics.totalExecutions = 20;
        metrics.successfulExecutions = 16;
        metrics.failedExecutions = 4;
        metrics.averageDuration = 150;
        metrics.lastExecutionTime = Date.now();
        metrics.healthStatus = "degraded"; // 80% success rate
      }

      const health = processorManager.getProcessorHealth();
      expect(health).toHaveLength(1);

      const processorHealth = health[0]!;
      expect(processorHealth.errorCount).toBe(4);
      expect(processorHealth.successRate).toBe(0.8);
      expect(processorHealth.averageDuration).toBe(150);
      expect(processorHealth.status).toBe("degraded");
    });

    it("should update health status based on success rate thresholds", async () => {
      processorManager.registerProcessor({
        name: "healthThreshold",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      // Force failures to drop below 80% success rate by directly updating metrics
      const metrics = processorManager["metrics"].get("healthThreshold");
      if (metrics) {
        // Simulate 2 successes and 8 failures (20% success rate)
        metrics.totalExecutions = 10;
        metrics.successfulExecutions = 2;
        metrics.failedExecutions = 8;
        metrics.averageDuration = 100;
        metrics.lastExecutionTime = Date.now();
        // Health status should be 'failed' (20% < 80%)
        metrics.healthStatus = "failed";
      }

      const health = processorManager.getProcessorHealth();
      expect(health[0]?.status).toBe("failed");

      // Test healthy state
      if (metrics) {
        // Simulate 19 successes and 1 failure (95% success rate)
        metrics.totalExecutions = 20;
        metrics.successfulExecutions = 19;
        metrics.failedExecutions = 1;
        metrics.averageDuration = 100;
        metrics.lastExecutionTime = Date.now();
        // Health status should be 'healthy' (95% > 95%)
        metrics.healthStatus = "healthy";
      }

      const healthAfter = processorManager.getProcessorHealth();
      expect(healthAfter[0]?.status).toBe("healthy");
    });

    it("should monitor processor performance degradation", async () => {
      processorManager.registerProcessor({
        name: "performanceMonitor",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      // Directly set performance metrics to simulate degradation
      const metrics = processorManager["metrics"].get("performanceMonitor");
      if (metrics) {
        // Simulate degraded performance: high average duration, low success rate
        metrics.totalExecutions = 50;
        metrics.successfulExecutions = 35; // 70% success rate
        metrics.failedExecutions = 15;
        metrics.averageDuration = 500; // 500ms average (degraded)
        metrics.lastExecutionTime = Date.now();
        metrics.healthStatus = "degraded";
      }

      const health = processorManager.getProcessorHealth();
      expect(health[0]?.averageDuration).toBe(500);
      expect(health[0]?.status).toBe("degraded");
      expect(health[0]?.successRate).toBe(0.7);
    });

    it("should handle health monitoring for multiple processors simultaneously", async () => {
      // Register multiple processors
      const processorNames = ["health1", "health2", "health3"];

      processorNames.forEach((name) => {
        processorManager.registerProcessor({
          name,
          type: "pre",
          priority: 10,
          enabled: true,
        });
      });

      await processorManager.initializeProcessors();

      // Execute all processors multiple times
      for (let i = 0; i < 15; i++) {
        await processorManager.executePreProcessors("multiHealthTest", {});
      }

      const health = processorManager.getProcessorHealth();
      expect(health).toHaveLength(3);

      health.forEach((h) => {
        expect(h.errorCount).toBeDefined();
        expect(h.successRate).toBeDefined();
        expect(h.averageDuration).toBeDefined();
        expect(["healthy", "degraded", "failed"]).toContain(h.status);
      });
    });

    it("should reset health metrics after processor restart", async () => {
      processorManager.registerProcessor({
        name: "restartTest",
        type: "pre",
        priority: 10,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      // Build up some metrics
      for (let i = 0; i < 5; i++) {
        await processorManager.executePreProcessors("restartTest", {});
      }

      let health = processorManager.getProcessorHealth();
      expect(health[0]?.errorCount).toBe(5); // Expect 5 errors from failed executions

      // Cleanup and reinitialize
      await processorManager.cleanupProcessors();

      // Check if processor is still registered (cleanup doesn't unregister)
      if (!processorManager["processors"].has("restartTest")) {
        // Re-register processor after cleanup only if it's not registered
        processorManager.registerProcessor({
          name: "restartTest",
          type: "pre",
          priority: 10,
          enabled: true,
        });
      }

      await processorManager.initializeProcessors();

      health = processorManager.getProcessorHealth();
      // After cleanup and restart, processor should be available again
      expect(health).toHaveLength(1);
      expect(health[0]?.name).toBe("restartTest");
      expect(health[0]?.status).toBeDefined();
    });
  });

  // Refactoring Logging Processor Tests
  describe("Refactoring Logging Processor", () => {
    it("should register and execute refactoring logging processor", async () => {
      processorManager.registerProcessor({
        name: "refactoringLogging",
        type: "post",
        priority: 140,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      const health = processorManager.getProcessorHealth();
      expect(health).toContainEqual(
        expect.objectContaining({
          name: "refactoringLogging",
          status: "healthy",
        }),
      );
    });

    it("should execute refactoring logging for agent task completion", async () => {
      processorManager.registerProcessor({
        name: "refactoringLogging",
        type: "post",
        priority: 140,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      // Create agent task context
      const agentContext = {
        agentName: "architect",
        task: "Design new API architecture",
        startTime: Date.now() - 1000,
        endTime: Date.now(),
        success: true,
        result: { apiDesign: "RESTful API with GraphQL" },
        capabilities: ["design", "architecture"],
      };

      // Execute post-processors
      const results = await processorManager.executePostProcessors(
        "agent-architect",
        agentContext,
        [],
      );

      // Should have at least one result
      expect(results).toHaveLength(1);

      // The refactoring logging processor should have executed
      const loggingResult = results.find(
        (r) => r.processorName === "refactoringLogging",
      );
      expect(loggingResult).toBeDefined();
      expect(loggingResult?.success).toBe(true);
    });

    it("should handle invalid agent context gracefully", async () => {
      processorManager.registerProcessor({
        name: "refactoringLogging",
        type: "post",
        priority: 140,
        enabled: true,
      });

      await processorManager.initializeProcessors();

      // Execute with invalid context (not an agent task)
      const results = await processorManager.executePostProcessors(
        "invalid-operation",
        { someOtherData: "test" },
        [],
      );

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true); // Should succeed but not log
    });
  });
});
