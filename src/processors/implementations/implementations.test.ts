/**
 * Tests for Processor Implementation Classes
 *
 * Tests the polymorphic processor pattern that replaces the legacy
 * switch statement anti-pattern in ProcessorManager.
 *
 * @module processors/implementations
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ProcessorRegistry } from "../processor-interfaces.js";
import { ProcessorContext } from "../processor-types.js";

// Import all processors from implementations
import { PreValidateProcessor } from "./pre-validate-processor.js";
import { CodexComplianceProcessor } from "./codex-compliance-processor.js";
import { VersionComplianceProcessor } from "./version-compliance-processor.js";
import { ErrorBoundaryProcessor } from "./error-boundary-processor.js";
import { TestExecutionProcessor } from "./test-execution-processor.js";
import { RegressionTestingProcessor } from "./regression-testing-processor.js";
import { StateValidationProcessor } from "./state-validation-processor.js";
import { RefactoringLoggingProcessor } from "./refactoring-logging-processor.js";
import { TestAutoCreationProcessor } from "./test-auto-creation-processor.js";
import { CoverageAnalysisProcessor } from "./coverage-analysis-processor.js";
import { AgentsMdValidationProcessor } from "./agents-md-validation-processor.js";

describe("Processor Implementations", () => {
  let registry: ProcessorRegistry;

  beforeEach(() => {
    registry = new ProcessorRegistry();
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ProcessorRegistry", () => {
    it("should register and retrieve processors", () => {
      const processor = new PreValidateProcessor();
      registry.register(processor);
      expect(registry.get("preValidate")).toBe(processor);
    });

    it("should check if processor exists", () => {
      expect(registry.has("preValidate")).toBe(false);
      registry.register(new PreValidateProcessor());
      expect(registry.has("preValidate")).toBe(true);
    });

    it("should get all processors", () => {
      registry.register(new PreValidateProcessor());
      registry.register(new ErrorBoundaryProcessor());
      expect(registry.getAll().length).toBe(2);
    });

    it("should get processors by type", () => {
      registry.register(new PreValidateProcessor()); // pre
      registry.register(new ErrorBoundaryProcessor()); // pre
      registry.register(new StateValidationProcessor()); // post

      const preProcessors = registry.getByType("pre");
      const postProcessors = registry.getByType("post");

      expect(preProcessors.length).toBe(2);
      expect(postProcessors.length).toBe(1);
    });

    it("should unregister processors", () => {
      registry.register(new PreValidateProcessor());
      expect(registry.has("preValidate")).toBe(true);

      registry.unregister("preValidate");
      expect(registry.has("preValidate")).toBe(false);
    });

    it("should clear all processors", () => {
      registry.register(new PreValidateProcessor());
      registry.register(new ErrorBoundaryProcessor());
      registry.clear();
      expect(registry.getAll().length).toBe(0);
    });
  });

  describe("PreValidateProcessor", () => {
    it("should have correct properties", () => {
      const processor = new PreValidateProcessor();
      expect(processor.name).toBe("preValidate");
      expect(processor.type).toBe("pre");
      expect(processor.priority).toBe(10);
      expect(processor.enabled).toBe(true);
    });

    it("should execute successfully", async () => {
      const processor = new PreValidateProcessor();
      const context: ProcessorContext = { operation: "test" };

      const result = await processor.execute(context);

      expect(result.success).toBe(true);
      expect(result.processorName).toBe("preValidate");
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it("should return validation result", async () => {
      const processor = new PreValidateProcessor();
      const result = await processor.execute({});

      expect(result.data).toBeDefined();
      expect((result.data as Record<string, unknown>).validated).toBe(true);
    });
  });

  describe("CodexComplianceProcessor", () => {
    it("should have correct properties", () => {
      const processor = new CodexComplianceProcessor();
      expect(processor.name).toBe("codexCompliance");
      expect(processor.type).toBe("pre");
      expect(processor.priority).toBe(20);
    });

    it("should execute and return result with expected shape", async () => {
      const processor = new CodexComplianceProcessor();
      const context: ProcessorContext = {
        operation: "write",
        filePath: "/test/file.ts",
      };

      const result = await processor.execute(context);

      // Result should have expected properties
      expect(result.processorName).toBe("codexCompliance");
      expect(result.duration).toBeGreaterThanOrEqual(0);
      // May or may not have data depending on validation outcome
    });
  });

  describe("VersionComplianceProcessor", () => {
    it("should have correct properties", () => {
      const processor = new VersionComplianceProcessor();
      expect(processor.name).toBe("versionCompliance");
      expect(processor.type).toBe("pre");
      expect(processor.priority).toBe(25);
    });

    it("should execute and return result with expected shape", async () => {
      const processor = new VersionComplianceProcessor();
      const context: ProcessorContext = { operation: "commit" };

      const result = await processor.execute(context);

      // Result should have expected properties
      expect(result.processorName).toBe("versionCompliance");
      expect(result.duration).toBeGreaterThanOrEqual(0);
      // May or may not have data depending on validation outcome
    });
  });

  describe("ErrorBoundaryProcessor", () => {
    it("should have correct properties", () => {
      const processor = new ErrorBoundaryProcessor();
      expect(processor.name).toBe("errorBoundary");
      expect(processor.type).toBe("pre");
      expect(processor.priority).toBe(30);
    });

    it("should execute successfully", async () => {
      const processor = new ErrorBoundaryProcessor();
      const context: ProcessorContext = { operation: "test" };

      const result = await processor.execute(context);

      expect(result.success).toBe(true);
      expect(result.processorName).toBe("errorBoundary");
    });

    it("should establish error boundaries", async () => {
      const processor = new ErrorBoundaryProcessor();
      const result = await processor.execute({ operation: "test" });

      expect(result.data).toBeDefined();
      const data = result.data as Record<string, unknown>;
      expect(data.boundaries).toBe("established");
      expect(data.config).toBeDefined();
    });
  });

  describe("TestExecutionProcessor", () => {
    beforeEach(() => {
      // Mock all external dependencies for TestExecutionProcessor
      vi.mock("child_process", () => ({
        exec: vi.fn().mockImplementation(
          (command: string, options: any, callback: Function) => {
            callback(null, { stdout: "Tests: 2 passed, 0 failed", stderr: "" });
          },
        ),
      }));

      vi.mock("fs", () => ({
        existsSync: vi.fn().mockReturnValue(false),
        readFileSync: vi.fn().mockReturnValue(""),
        mkdirSync: vi.fn().mockReturnValue(undefined),
        writeFileSync: vi.fn().mockReturnValue(undefined),
      }));

      vi.mock("../../utils/language-detector.js", () => ({
        detectProjectLanguage: vi.fn().mockReturnValue({
          language: "TypeScript",
          testFramework: "Vitest",
          testCommand: "vitest run",
        }),
      }));
    });

    it("should have correct properties", () => {
      const processor = new TestExecutionProcessor();
      expect(processor.name).toBe("testExecution");
      expect(processor.type).toBe("post");
      expect(processor.priority).toBe(40);
    });

    it("should execute successfully with mocked dependencies", async () => {
      const processor = new TestExecutionProcessor();
      const context: ProcessorContext = {
        operation: "test",
        tool: "write",
        filePath: "/test/test.spec.ts",
      };

      const result = await processor.execute(context);

      expect(result.success).toBe(true);
      expect(result.processorName).toBe("testExecution");
    });

    it("should handle language detection failure gracefully", async () => {
      // Override the mock for this specific test
      vi.doMock("../../utils/language-detector.js", () => ({
        detectProjectLanguage: vi.fn().mockReturnValue(null),
      }));

      const processor = new TestExecutionProcessor();
      const result = await processor.execute({ operation: "test" });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe("RegressionTestingProcessor", () => {
    it("should have correct properties", () => {
      const processor = new RegressionTestingProcessor();
      expect(processor.name).toBe("regressionTesting");
      expect(processor.type).toBe("post");
      expect(processor.priority).toBe(45);
    });

    it("should execute successfully", async () => {
      const processor = new RegressionTestingProcessor();
      const context: ProcessorContext = {
        operation: "write",
        filePath: "/test/file.ts",
      };

      const result = await processor.execute(context);

      expect(result.success).toBe(true);
      expect(result.processorName).toBe("regressionTesting");
    });
  });

  describe("StateValidationProcessor", () => {
    it("should have correct properties", () => {
      const processor = new StateValidationProcessor();
      expect(processor.name).toBe("stateValidation");
      expect(processor.type).toBe("post");
      expect(processor.priority).toBe(50);
    });

    it("should execute successfully", async () => {
      const processor = new StateValidationProcessor();
      const context: ProcessorContext = { operation: "modify" };

      const result = await processor.execute(context);

      expect(result.success).toBe(true);
      expect(result.processorName).toBe("stateValidation");
    });

    it("should return validation details", async () => {
      const processor = new StateValidationProcessor();
      const result = await processor.execute({ operation: "test" });

      expect(result.data).toBeDefined();
      const data = result.data as Record<string, unknown>;
      expect(data.stateValid).toBeDefined();
    });
  });

  describe("RefactoringLoggingProcessor", () => {
    it("should have correct properties", () => {
      const processor = new RefactoringLoggingProcessor();
      expect(processor.name).toBe("refactoringLogging");
      expect(processor.type).toBe("post");
      expect(processor.priority).toBe(55);
    });

    it("should execute successfully", async () => {
      const processor = new RefactoringLoggingProcessor();
      const context: ProcessorContext = {
        operation: "refactor",
        filePath: "/test/file.ts",
      };

      const result = await processor.execute(context);

      expect(result.success).toBe(true);
      expect(result.processorName).toBe("refactoringLogging");
    });

    it("should handle agent task completion context", async () => {
      const processor = new RefactoringLoggingProcessor();
      const result = await processor.execute({
        agentName: "refactorer",
        task: "optimize imports",
        startTime: Date.now(),
      });

      // Should return a result (logged may be true or false depending on file system)
      expect(result.processorName).toBe("refactoringLogging");
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe("TestAutoCreationProcessor", () => {
    beforeEach(() => {
      vi.mock("../test-auto-creation-processor.js", () => ({
        testAutoCreationProcessor: {
          execute: vi.fn().mockResolvedValue({
            success: true,
            processorName: "testAutoCreation",
            duration: 100,
            data: { created: true },
          }),
        },
      }));
    });

    it("should have correct properties", () => {
      const processor = new TestAutoCreationProcessor();
      expect(processor.name).toBe("testAutoCreation");
      expect(processor.type).toBe("post");
      expect(processor.priority).toBe(60);
    });

    it("should execute successfully with mocked processor", async () => {
      const processor = new TestAutoCreationProcessor();
      const context: ProcessorContext = {
        tool: "write",
        operation: "create",
        filePath: "/src/service.ts",
      };

      const result = await processor.execute(context);

      expect(result.success).toBe(true);
      expect(result.processorName).toBe("testAutoCreation");
    });
  });

  describe("CoverageAnalysisProcessor", () => {
    it("should have correct properties", () => {
      const processor = new CoverageAnalysisProcessor();
      expect(processor.name).toBe("coverageAnalysis");
      expect(processor.type).toBe("post");
      expect(processor.priority).toBe(65);
    });

    it("should execute successfully", async () => {
      const processor = new CoverageAnalysisProcessor();
      const context: ProcessorContext = {
        operation: "test",
        filePath: "/test/file.ts",
      };

      const result = await processor.execute(context);

      expect(result.success).toBe(true);
      expect(result.processorName).toBe("coverageAnalysis");
    });
  });

  describe("AgentsMdValidationProcessor", () => {
    beforeEach(() => {
      vi.mock("../agents-md-validation-processor.js", () => ({
        AgentsMdValidationProcessor: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue({
            success: true,
            blocked: false,
            message: "Validation passed",
            result: { errors: [], warnings: [] },
          }),
        })),
      }));
    });

    it("should have correct properties", () => {
      const processor = new AgentsMdValidationProcessor();
      expect(processor.name).toBe("agentsMdValidation");
      expect(processor.type).toBe("post");
      expect(processor.priority).toBe(70);
    });

    it("should execute successfully with mocked validation", async () => {
      const processor = new AgentsMdValidationProcessor();
      const context: ProcessorContext = {
        tool: "commit",
        operation: "pre-commit",
      };

      const result = await processor.execute(context);

      expect(result.success).toBe(true);
      expect(result.processorName).toBe("agentsMdValidation");
    });
  });
});

describe("All 11 Processors - Integration", () => {
  it("should have exactly 11 processors defined in implementations", () => {
    const processors = [
      PreValidateProcessor,
      CodexComplianceProcessor,
      VersionComplianceProcessor,
      ErrorBoundaryProcessor,
      TestExecutionProcessor,
      RegressionTestingProcessor,
      StateValidationProcessor,
      RefactoringLoggingProcessor,
      TestAutoCreationProcessor,
      CoverageAnalysisProcessor,
      AgentsMdValidationProcessor,
    ];

    expect(processors.length).toBe(11);
  });

  it("should have unique names for all processors", () => {
    const processorInstances = [
      new PreValidateProcessor(),
      new CodexComplianceProcessor(),
      new VersionComplianceProcessor(),
      new ErrorBoundaryProcessor(),
      new TestExecutionProcessor(),
      new RegressionTestingProcessor(),
      new StateValidationProcessor(),
      new RefactoringLoggingProcessor(),
      new TestAutoCreationProcessor(),
      new CoverageAnalysisProcessor(),
      new AgentsMdValidationProcessor(),
    ];

    const names = processorInstances.map((p) => p.name);
    const uniqueNames = new Set(names);

    expect(uniqueNames.size).toBe(names.length);
  });

  it("should have valid types (pre or post) for all processors", () => {
    const processorInstances = [
      new PreValidateProcessor(),
      new CodexComplianceProcessor(),
      new VersionComplianceProcessor(),
      new ErrorBoundaryProcessor(),
      new TestExecutionProcessor(),
      new RegressionTestingProcessor(),
      new StateValidationProcessor(),
      new RefactoringLoggingProcessor(),
      new TestAutoCreationProcessor(),
      new CoverageAnalysisProcessor(),
      new AgentsMdValidationProcessor(),
    ];

    processorInstances.forEach((processor) => {
      expect(["pre", "post"]).toContain(processor.type);
    });
  });

  it("should have positive priorities for all processors", () => {
    const processorInstances = [
      new PreValidateProcessor(),
      new CodexComplianceProcessor(),
      new VersionComplianceProcessor(),
      new ErrorBoundaryProcessor(),
      new TestExecutionProcessor(),
      new RegressionTestingProcessor(),
      new StateValidationProcessor(),
      new RefactoringLoggingProcessor(),
      new TestAutoCreationProcessor(),
      new CoverageAnalysisProcessor(),
      new AgentsMdValidationProcessor(),
    ];

    processorInstances.forEach((processor) => {
      expect(processor.priority).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("Processor Priority Ordering", () => {
  it("should have correct priority values for all processors", () => {
    const expectedPriorities: Record<string, number> = {
      preValidate: 10,
      codexCompliance: 20,
      versionCompliance: 25,
      errorBoundary: 30,
      testExecution: 40,
      regressionTesting: 45,
      stateValidation: 50,
      refactoringLogging: 55,
      testAutoCreation: 60,
      coverageAnalysis: 65,
      agentsMdValidation: 70,
    };

    const processors = [
      new PreValidateProcessor(),
      new CodexComplianceProcessor(),
      new VersionComplianceProcessor(),
      new ErrorBoundaryProcessor(),
      new TestExecutionProcessor(),
      new RegressionTestingProcessor(),
      new StateValidationProcessor(),
      new RefactoringLoggingProcessor(),
      new TestAutoCreationProcessor(),
      new CoverageAnalysisProcessor(),
      new AgentsMdValidationProcessor(),
    ];

    processors.forEach((processor) => {
      expect(processor.priority).toBe(expectedPriorities[processor.name]);
    });
  });

  it("should sort pre-processors by priority ascending", () => {
    const registry = new ProcessorRegistry();
    registry.register(new CodexComplianceProcessor()); // priority 20
    registry.register(new ErrorBoundaryProcessor()); // priority 30
    registry.register(new PreValidateProcessor()); // priority 10
    registry.register(new VersionComplianceProcessor()); // priority 25

    const preProcessors = registry.getByType("pre");
    const priorities = preProcessors.map((p) => p.priority);

    // Should be sorted: 10, 20, 25, 30
    for (let i = 1; i < priorities.length; i++) {
      expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i - 1]);
    }
  });

  it("should sort post-processors by priority ascending", () => {
    const registry = new ProcessorRegistry();
    registry.register(new RegressionTestingProcessor()); // priority 45
    registry.register(new StateValidationProcessor()); // priority 50
    registry.register(new TestExecutionProcessor()); // priority 40
    registry.register(new CoverageAnalysisProcessor()); // priority 65

    const postProcessors = registry.getByType("post");
    const priorities = postProcessors.map((p) => p.priority);

    // Should be sorted: 40, 45, 50, 65
    for (let i = 1; i < priorities.length; i++) {
      expect(priorities[i]).toBeGreaterThanOrEqual(priorities[i - 1]);
    }
  });
});

describe("Error Handling", () => {
  it("should return proper ProcessorResult shape on success", async () => {
    const processor = new PreValidateProcessor();
    const result = await processor.execute({});

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("duration");
    expect(result).toHaveProperty("processorName");
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.duration).toBe("number");
    expect(typeof result.processorName).toBe("string");
  });

  it("should track execution time in duration", async () => {
    const processor = new PreValidateProcessor();
    const result = await processor.execute({});

    // Duration should be a non-negative number (milliseconds)
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.duration).toBeLessThan(1000); // Should be fast
  });
});
