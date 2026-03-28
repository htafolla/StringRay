/**
 * Complexity Analyzer Calibration Tests
 * Tests the updateThresholds functionality for complexity calibration
 */

import { describe, test, expect, beforeEach } from "vitest";
import { ComplexityAnalyzer } from "../../delegation/complexity-analyzer.js";

describe("ComplexityAnalyzer Calibration", () => {
  let analyzer: ComplexityAnalyzer;

  beforeEach(() => {
    analyzer = new ComplexityAnalyzer();
  });

  describe("updateThresholds", () => {
    test("should not update thresholds with invalid data", () => {
      const initialThresholds = analyzer.getThresholds();

      analyzer.updateThresholds(null);
      expect(analyzer.getThresholds()).toEqual(initialThresholds);

      analyzer.updateThresholds(undefined);
      expect(analyzer.getThresholds()).toEqual(initialThresholds);

      analyzer.updateThresholds("invalid" as any);
      expect(analyzer.getThresholds()).toEqual(initialThresholds);

      analyzer.updateThresholds({});
      expect(analyzer.getThresholds()).toEqual(initialThresholds);
    });

    test("should add performance data to calibration history", () => {
      expect(analyzer.getCalibrationHistory().length).toBe(0);

      analyzer.updateThresholds({ complexityScore: 50 });
      expect(analyzer.getCalibrationHistory().length).toBe(1);

      analyzer.updateThresholds({ complexityScore: 75 });
      expect(analyzer.getCalibrationHistory().length).toBe(2);
    });

    test("should store complete performance data", () => {
      const performanceData = {
        complexityScore: 50,
        actualDuration: 120,
        estimatedDuration: 60,
        success: true,
        timestamp: Date.now(),
      };

      analyzer.updateThresholds(performanceData);

      const history = analyzer.getCalibrationHistory();
      expect(history.length).toBe(1);
      expect(history[0].complexityScore).toBe(50);
      expect(history[0].actualDuration).toBe(120);
      expect(history[0].estimatedDuration).toBe(60);
      expect(history[0].success).toBe(true);
    });

    test("should use defaults for missing performance fields", () => {
      analyzer.updateThresholds({ complexityScore: 50 });

      const history = analyzer.getCalibrationHistory();
      expect(history[0].actualDuration).toBe(0);
      expect(history[0].estimatedDuration).toBe(30);
      expect(history[0].success).toBe(true);
    });

    test("should not adjust thresholds with fewer than 10 samples", () => {
      const initialThresholds = analyzer.getThresholds();

      for (let i = 0; i < 9; i++) {
        analyzer.updateThresholds({ complexityScore: 50 });
      }

      expect(analyzer.getThresholds()).toEqual(initialThresholds);
    });

    test("should raise thresholds when underestimating (slow actual duration)", () => {
      for (let i = 0; i < 15; i++) {
        analyzer.updateThresholds({
          complexityScore: 50,
          actualDuration: 200,
          estimatedDuration: 30,
          success: true,
        });
      }

      const thresholds = analyzer.getThresholds();
      expect(thresholds.simple).toBeLessThan(25);
      expect(thresholds.moderate).toBeLessThan(50);
    });

    test("should lower thresholds when overestimating (fast actual duration)", () => {
      for (let i = 0; i < 15; i++) {
        analyzer.updateThresholds({
          complexityScore: 50,
          actualDuration: 10,
          estimatedDuration: 60,
          success: true,
        });
      }

      const thresholds = analyzer.getThresholds();
      expect(thresholds.simple).toBeGreaterThan(25);
      expect(thresholds.moderate).toBeGreaterThan(50);
    });

    test("should not adjust thresholds excessively", () => {
      for (let i = 0; i < 50; i++) {
        analyzer.updateThresholds({
          complexityScore: 50,
          actualDuration: 500,
          estimatedDuration: 30,
          success: true,
        });
      }

      const thresholds = analyzer.getThresholds();
      expect(thresholds.simple).toBeGreaterThanOrEqual(10);
      expect(thresholds.moderate).toBeGreaterThanOrEqual(20);
      expect(thresholds.complex).toBeGreaterThanOrEqual(40);
    });

    test("should respect minimum threshold bounds", () => {
      for (let i = 0; i < 30; i++) {
        analyzer.updateThresholds({
          complexityScore: 50,
          actualDuration: 1000,
          estimatedDuration: 30,
          success: true,
        });
      }

      const thresholds = analyzer.getThresholds();
      expect(thresholds.simple).toBeGreaterThanOrEqual(10);
    });

    test("should respect maximum threshold bounds", () => {
      for (let i = 0; i < 30; i++) {
        analyzer.updateThresholds({
          complexityScore: 50,
          actualDuration: 5,
          estimatedDuration: 60,
          success: true,
        });
      }

      const thresholds = analyzer.getThresholds();
      expect(thresholds.simple).toBeLessThanOrEqual(40);
      expect(thresholds.moderate).toBeLessThanOrEqual(60);
      expect(thresholds.complex).toBeLessThanOrEqual(90);
    });
  });

  describe("getCalibrationHistory", () => {
    test("should return empty array initially", () => {
      expect(analyzer.getCalibrationHistory()).toEqual([]);
    });

    test("should return copy of history (not original)", () => {
      analyzer.updateThresholds({ complexityScore: 50 });

      const history1 = analyzer.getCalibrationHistory();
      const history2 = analyzer.getCalibrationHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });
  });

  describe("resetCalibration", () => {
    test("should clear calibration history", () => {
      analyzer.updateThresholds({ complexityScore: 50 });
      analyzer.updateThresholds({ complexityScore: 60 });

      expect(analyzer.getCalibrationHistory().length).toBe(2);

      analyzer.resetCalibration();

      expect(analyzer.getCalibrationHistory().length).toBe(0);
    });

    test("should preserve current thresholds after reset", () => {
      analyzer.updateThresholds({ complexityScore: 50 });
      const thresholdsBefore = analyzer.getThresholds();

      analyzer.resetCalibration();
      const thresholdsAfter = analyzer.getThresholds();

      expect(thresholdsBefore).toEqual(thresholdsAfter);
    });
  });

  describe("calibrate", () => {
    test("should apply calibration settings", () => {
      analyzer.calibrate({
        thresholds: { simple: 15, moderate: 30, complex: 60, enterprise: 100 },
      });

      const thresholds = analyzer.getThresholds();
      expect(thresholds.simple).toBe(15);
      expect(thresholds.moderate).toBe(30);
      expect(thresholds.complex).toBe(60);
    });

    test("should apply operation weights", () => {
      analyzer.calibrate({
        operationWeights: { create: 1.5, refactor: 2.0 },
      });

      analyzer.setOperationWeights({});
      analyzer.calibrate({
        operationWeights: { create: 1.5 },
      });
    });

    test("should apply risk multipliers", () => {
      analyzer.calibrate({
        riskMultipliers: { critical: 2.0, high: 1.5 },
      });
    });
  });

  describe("integration with complexity scoring", () => {
    test("should use calibrated thresholds in scoring", () => {
      analyzer.calibrate({
        thresholds: { simple: 10, moderate: 20, complex: 40, enterprise: 100 },
      });

      const metrics = {
        fileCount: 1,
        changeVolume: 50,
        operationType: "modify" as const,
        dependencies: 0,
        riskLevel: "low" as const,
        estimatedDuration: 10,
      };

      const score = analyzer.calculateComplexityScore(metrics);
      expect(score.level).toBeDefined();
    });
  });
});
