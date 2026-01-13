/**
 * Integration tests for Post-Processor system
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PostProcessor } from "../../postprocessor/PostProcessor";
import { StrRayStateManager } from "../../state/state-manager";
import { SessionMonitor } from "../../session/session-monitor";
import { setupStandardMocks } from "../utils/test-utils";

describe("PostProcessor Integration", () => {
  let postProcessor: PostProcessor;
  let stateManager: StrRayStateManager;
  let sessionMonitor: SessionMonitor;

  beforeEach(async () => {
    // Use standardized mocking
    setupStandardMocks();

    // Use proper state manager for integration testing
    stateManager = new StrRayStateManager(
      `/test/postprocessor-${Date.now()}.json`,
    );
    await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for initialization

    sessionMonitor = {
      performHealthCheck: () => Promise.resolve({ success: true }),
      collectMetrics: () => Promise.resolve({}),
      registerSession: () => {},
      unregisterSession: () => {},
      getHealthStatus: () => null,
      getMetricsHistory: () => [],
      shutdown: () => {},
    } as any;

    postProcessor = new PostProcessor(stateManager, sessionMonitor);
  });

  describe("PostProcessor Instantiation", () => {
    it("should create PostProcessor with proper dependencies", () => {
      expect(postProcessor).toBeDefined();
      expect(postProcessor).toBeInstanceOf(PostProcessor);
    });

    it("should have all required internal components", () => {
      // Check that internal components are initialized
      expect(postProcessor["monitoringEngine"]).toBeDefined();
      expect(postProcessor["failureAnalysisEngine"]).toBeDefined();
      expect(postProcessor["autoFixEngine"]).toBeDefined();
      expect(postProcessor["fixValidator"]).toBeDefined();
      expect(postProcessor["reportValidator"]).toBeDefined();
      expect(postProcessor["redeployCoordinator"]).toBeDefined();
      expect(postProcessor["escalationEngine"]).toBeDefined();
      expect(postProcessor["successHandler"]).toBeDefined();
    });

    it("should have trigger components", () => {
      expect(postProcessor["triggers"]).toBeDefined();
      expect(postProcessor["triggers"].gitHook).toBeDefined();
      expect(postProcessor["triggers"].webhook).toBeDefined();
      expect(postProcessor["triggers"].api).toBeDefined();
    });
  });
});
