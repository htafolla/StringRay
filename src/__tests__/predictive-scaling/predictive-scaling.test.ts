/**
 * StrRay Framework v1.0.0 - Predictive Scaling System Tests
 *
 * Basic tests to verify the predictive scaling system functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PredictiveResourceManager } from "../../predictive-scaling/predictive-resource-manager";
import { AutoHealingEngine } from "../../predictive-scaling/auto-healing-engine";
import { AdvancedHealthMonitor } from "../../predictive-scaling/advanced-health-monitor";

describe("Predictive Scaling System", () => {
  let resourceManager: PredictiveResourceManager;
  let healingEngine: AutoHealingEngine;
  let healthMonitor: AdvancedHealthMonitor;

  beforeEach(() => {
    resourceManager = new PredictiveResourceManager({
      enabled: true,
      mlConfig: {
        algorithm: "linear_regression",
        trainingWindow: 1, // 1 hour for testing
        predictionHorizon: 5, // 5 minutes
        confidenceThreshold: 0.5,
        featureEngineering: true,
        hyperparameterTuning: false,
        crossValidation: true,
        modelUpdateInterval: 3600
      }
    });

    healingEngine = new AutoHealingEngine({
      enabled: true,
      failureDetection: {
        enabled: true,
        checkInterval: 10, // 10 seconds for testing
        failureThresholds: {
          serviceDown: {
            timeout: 60,
            retries: 3
          },
          highLatency: {
            threshold: 2000,
            duration: 60
          },
          highErrorRate: {
            threshold: 0.05,
            duration: 60
          },
          resourceExhaustion: {
            cpuThreshold: 95,
            memoryThreshold: 90,
            diskThreshold: 95
          }
        }
      }
    });

    healthMonitor = new AdvancedHealthMonitor({
      enabled: true,
      monitoring: {
        checkInterval: 5, // 5 seconds for testing
        metricsRetention: 86400,
        anomalyDetection: {
          enabled: true,
          sensitivity: "medium",
          minDataPoints: 50,
          zScoreThreshold: 3
        },
        predictiveAnalytics: {
          enabled: true,
          lookbackWindow: 24,
          predictionHorizon: 6,
          confidenceThreshold: 0.8
        }
      }
    });
  });

  afterEach(() => {
    resourceManager.shutdown();
    healingEngine.shutdown();
    healthMonitor.shutdown();
  });

  describe("PredictiveResourceManager", () => {
    it("should initialize correctly", () => {
      expect(resourceManager).toBeDefined();
    });

    it("should record metrics", () => {
      const metrics = {
        timestamp: Date.now(),
        cpu: {
          usage: 50,
          loadAverage: 1.5,
          cores: 4
        },
        memory: {
          used: 60,
          total: 100,
          swapUsed: 10,
          swapTotal: 20
        },
        disk: {
          readBytes: 1000000,
          writeBytes: 500000,
          iops: 100,
          utilization: 40
        },
        network: {
          bytesIn: 1000000,
          bytesOut: 500000,
          packetsIn: 1000,
          packetsOut: 500,
          errors: 0
        },
        system: {
          uptime: 3600,
          loadAverage: [1.5, 1.2, 1.0] as [number, number, number],
          processCount: 100
        }
      };

      resourceManager.recordMetrics(metrics);
      expect(true).toBe(true); // Just verify no errors
    });

    it("should generate scaling recommendations", async () => {
      // Add some test data first
      for (let i = 0; i < 10; i++) {
        resourceManager.recordMetrics({
          timestamp: Date.now() - i * 60000, // 1 minute intervals
          system: {
            cpu: 80 + Math.random() * 20,
            memory: 70 + Math.random() * 30,
            disk: 50 + Math.random() * 30,
            network: 40 + Math.random() * 40,
            loadAverage: [2.0, 1.8, 1.5],
            uptime: 3600 + i * 60
          },
          application: {
            activeConnections: 100 + Math.random() * 50,
            requestRate: 60 + Math.random() * 40,
            errorRate: Math.random() * 0.05,
            responseTime: {
              p50: 200 + Math.random() * 100,
              p95: 500 + Math.random() * 200,
              p99: 1000 + Math.random() * 500
            }
          },
          services: {},
          dependencies: {}
        });
      }

      const recommendations = await resourceManager.getScalingRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe("AutoHealingEngine", () => {
    it("should initialize correctly", () => {
      expect(healingEngine).toBeDefined();
    });

    it("should get health status", () => {
      const status = healingEngine.getHealthStatus();
      expect(status).toHaveProperty("overall");
      expect(status).toHaveProperty("components");
      expect(status).toHaveProperty("activeFailures");
      expect(status).toHaveProperty("activeRecoveries");
    });

    it("should trigger failure detection", async () => {
      const failures = await healingEngine.triggerFailureDetection();
      expect(Array.isArray(failures)).toBe(true);
    });
  });

  describe("AdvancedHealthMonitor", () => {
    it("should initialize correctly", () => {
      expect(healthMonitor).toBeDefined();
    });

    it("should perform health assessment", async () => {
      const assessment = await healthMonitor.performHealthAssessment();
      expect(assessment).toHaveProperty("overall");
      expect(assessment).toHaveProperty("score");
      expect(assessment).toHaveProperty("issues");
      expect(assessment).toHaveProperty("recommendations");
      expect(typeof assessment.score).toBe("number");
      expect(assessment.score).toBeGreaterThanOrEqual(0);
      expect(assessment.score).toBeLessThanOrEqual(100);
    });

    it("should get metrics history", () => {
      const history = healthMonitor.getMetricsHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});