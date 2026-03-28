/**
 * Unit tests for PostProcessorChainValidator
 *
 * @version 1.0.0
 * @since 2026-03-28
 */

import { describe, it, expect } from "vitest";
import { PostProcessorChainValidator } from "../../processors/postprocessor-chain-validator.js";

describe("postprocessor-chain-validator", () => {
  describe("PostProcessorChainValidator", () => {
    // -----------------------------------------------------------------------
    // validateChain
    // -----------------------------------------------------------------------

    describe("validateChain", () => {
      it("should validate successful chain", () => {
        const validator = new PostProcessorChainValidator();
        const results = [
          { name: "proc-a", success: true, duration: 10, priority: 1 },
          { name: "proc-b", success: true, duration: 20, priority: 2 },
          { name: "proc-c", success: true, duration: 15, priority: 3 },
        ];

        const validation = validator.validateChain(results);
        expect(validation.valid).toBe(true);
        expect(validation.issues).toHaveLength(0);
      });

      it("should detect failed processors", () => {
        const validator = new PostProcessorChainValidator();
        const results = [
          { name: "proc-a", success: true, duration: 10, priority: 1 },
          { name: "proc-b", success: false, duration: 5, priority: 2 },
          { name: "proc-c", success: true, duration: 15, priority: 3 },
        ];

        const validation = validator.validateChain(results);
        expect(validation.valid).toBe(false);
        expect(validation.issues).toHaveLength(1);
        expect(validation.issues[0].severity).toBe("error");
        expect(validation.issues[0].processorName).toBe("proc-b");
        expect(validation.issues[0].message).toContain("failed");
      });

      it("should validate priority ordering", () => {
        const validator = new PostProcessorChainValidator();
        const results = [
          { name: "proc-high", success: true, duration: 10, priority: 10 },
          { name: "proc-low", success: true, duration: 5, priority: 2 },
        ];

        const validation = validator.validateChain(results);
        expect(validation.valid).toBe(true); // priority issue is a warning, not error
        expect(validation.issues).toHaveLength(1);
        expect(validation.issues[0].severity).toBe("warning");
        expect(validation.issues[0].processorName).toBe("proc-low");
        expect(validation.issues[0].message).toContain("priority");
      });

      it("should report skipped processors (zero duration)", () => {
        const validator = new PostProcessorChainValidator();
        const results = [
          { name: "proc-a", success: true, duration: 10, priority: 1 },
          { name: "proc-b", success: true, duration: 0, priority: 2 },
        ];

        const validation = validator.validateChain(results);
        expect(validation.valid).toBe(true);
        expect(validation.issues).toHaveLength(1);
        expect(validation.issues[0].severity).toBe("warning");
        expect(validation.issues[0].processorName).toBe("proc-b");
        expect(validation.issues[0].message).toContain("skipped");
      });

      it("should detect multiple failures and warnings together", () => {
        const validator = new PostProcessorChainValidator();
        const results = [
          { name: "proc-a", success: true, duration: 10, priority: 1 },
          { name: "proc-b", success: false, duration: 5, priority: 10 },
          { name: "proc-c", success: true, duration: 0, priority: 2 },
        ];

        const validation = validator.validateChain(results);
        expect(validation.valid).toBe(false); // at least one error
        const errors = validation.issues.filter((i) => i.severity === "error");
        const warnings = validation.issues.filter((i) => i.severity === "warning");
        expect(errors.length).toBeGreaterThanOrEqual(1);
        expect(warnings.length).toBeGreaterThanOrEqual(1);
      });

      it("should handle empty chain", () => {
        const validator = new PostProcessorChainValidator();
        const validation = validator.validateChain([]);

        expect(validation.valid).toBe(true);
        expect(validation.issues).toHaveLength(0);

        const report = validator.getChainReport();
        expect(report.totalProcessors).toBe(0);
        expect(report.successful).toBe(0);
        expect(report.averageDuration).toBe(0);
      });

      it("should handle results without priority field", () => {
        const validator = new PostProcessorChainValidator();
        const results = [
          { name: "proc-a", success: true, duration: 10 },
          { name: "proc-b", success: true, duration: 20 },
        ];

        const validation = validator.validateChain(results);
        expect(validation.valid).toBe(true);
        expect(validation.issues).toHaveLength(0);
      });

      it("should not flag priority issues when only one has priority", () => {
        const validator = new PostProcessorChainValidator();
        const results = [
          { name: "proc-a", success: true, duration: 10, priority: 5 },
          { name: "proc-b", success: true, duration: 20 },
        ];

        const validation = validator.validateChain(results);
        expect(validation.valid).toBe(true);
        expect(validation.issues).toHaveLength(0);
      });
    });

    // -----------------------------------------------------------------------
    // getChainReport
    // -----------------------------------------------------------------------

    describe("getChainReport", () => {
      it("should generate chain report", () => {
        const validator = new PostProcessorChainValidator();
        const results = [
          { name: "proc-a", success: true, duration: 10, priority: 1 },
          { name: "proc-b", success: true, duration: 30, priority: 2 },
          { name: "proc-c", success: false, duration: 5, priority: 3 },
        ];

        validator.validateChain(results);
        const report = validator.getChainReport();

        expect(report.totalProcessors).toBe(3);
        expect(report.successful).toBe(2);
        expect(report.failed).toBe(1);
        expect(report.skipped).toBe(0);
        expect(report.averageDuration).toBeCloseTo(15, 0);
        expect(report.executedInPriorityOrder).toBe(true);
        expect(report.issues).toHaveLength(1);
      });

      it("should return default report before validation", () => {
        const validator = new PostProcessorChainValidator();
        const report = validator.getChainReport();
        expect(report.totalProcessors).toBe(0);
        expect(report.issues).toHaveLength(0);
      });

      it("should reflect priority ordering violations", () => {
        const validator = new PostProcessorChainValidator();
        const results = [
          { name: "high", success: true, duration: 10, priority: 10 },
          { name: "low", success: true, duration: 20, priority: 1 },
        ];

        validator.validateChain(results);
        const report = validator.getChainReport();
        expect(report.executedInPriorityOrder).toBe(false);
      });
    });
  });
});
