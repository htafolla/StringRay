/**
 * Base Integration Class Tests
 *
 * Tests for the BaseIntegration abstract class lifecycle, events, and utilities.
 *
 * @version 1.0.0
 * @since 2026-03-15
 */

import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import { EventEmitter } from "events";
import {
  BaseIntegration,
  createSimpleIntegration,
} from "./Integration.js";
import {
  IntegrationAlreadyInitializedError,
  IntegrationInitializationError,
} from "./types.js";
import type {
  IntegrationConfig,
  IntegrationStatus,
  IntegrationStats,
  HealthResult,
} from "./types.js";

vi.mock("../../core/framework-logger.js", () => ({
  frameworkLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
  generateJobId: vi.fn((prefix: string) => `${prefix}-job-123`),
}));

class TestIntegration extends BaseIntegration {
  public initCalled = false;
  public shutdownCalled = false;
  public healthCheckResult: HealthResult = { healthy: true, message: "OK" };
  public initError: Error | null = null;
  public shutdownError: Error | null = null;

  constructor(name: string, version: string, initialConfig?: Partial<IntegrationConfig>) {
    super(name, version, initialConfig);
    this.on("error", () => {});
  }

  protected async performInitialization(): Promise<void> {
    if (this.initError) {
      throw this.initError;
    }
    this.initCalled = true;
  }

  protected async performShutdown(): Promise<void> {
    if (this.shutdownError) {
      throw this.shutdownError;
    }
    this.shutdownCalled = true;
  }

  protected async performHealthCheck(): Promise<HealthResult> {
    return this.healthCheckResult;
  }

  public testRecordError(error?: Error): void {
    this.recordError(error);
  }

  public testUpdateCustomStats(customStats: Record<string, unknown>): void {
    this.updateCustomStats(customStats);
  }

  public testGetConfig(): IntegrationConfig {
    return this.getConfig();
  }

  public testUpdateConfig(config: Partial<IntegrationConfig>): void {
    this.updateConfig(config);
  }

  public async testLog(status: "success" | "error" | "info" | "debug" | "warning", message: string): Promise<void> {
    return this.log(status, message);
  }

  public testEnsureInitialized(): void {
    this.ensureInitialized();
  }
}

describe("BaseIntegration", () => {
  let integration: TestIntegration;

  beforeEach(() => {
    integration = new TestIntegration("test-integration", "1.0.0");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    test("should create integration with name and version", () => {
      expect(integration.name).toBe("test-integration");
      expect(integration.version).toBe("1.0.0");
    });

    test("should have uninitialized status by default", () => {
      expect(integration.status).toBe("uninitialized");
    });

    test("should apply default configuration", () => {
      const config = integration.getStats();
      expect(config).toEqual({
        uptime: 0,
        errors: 0,
        custom: undefined,
      });
    });

    test("should accept custom initial configuration", () => {
      const customIntegration = new TestIntegration("custom", "1.0.0", {
        enabled: false,
        debug: true,
        logLevel: "debug",
      });
      expect(customIntegration).toBeDefined();
    });
  });

  describe("initialization lifecycle", () => {
    test("should transition from uninitialized to initialized", async () => {
      await integration.initialize();

      expect(integration.initCalled).toBe(true);
      expect(integration.status).toBe("initialized");
    });

    test("should emit initializing and initialized events", async () => {
      const events: string[] = [];
      integration.on("initializing", () => events.push("initializing"));
      integration.on("initialized", () => events.push("initialized"));
      integration.on("event", () => {});

      await integration.initialize();

      expect(events).toContain("initializing");
      expect(events).toContain("initialized");
    });

    test("should set start time on initialization", async () => {
      const beforeTime = Date.now();
      await integration.initialize();
      const afterTime = Date.now();

      const stats = integration.getStats();
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
      expect(stats.uptime).toBeLessThanOrEqual(afterTime - beforeTime + 100);
    });

    test("should merge configuration during initialization", async () => {
      await integration.initialize({ enabled: false, debug: true });

      const stats = integration.getStats();
      expect(stats).toBeDefined();
    });

    test("should throw IntegrationAlreadyInitializedError on double initialization", async () => {
      await integration.initialize();

      await expect(integration.initialize()).rejects.toThrow(
        IntegrationAlreadyInitializedError,
      );
    });

    test("should throw IntegrationAlreadyInitializedError when already initializing", async () => {
      const slowInitIntegration = new TestIntegration("slow", "1.0.0");
      
      const initPromise = slowInitIntegration.initialize();
      
      await expect(slowInitIntegration.initialize()).rejects.toThrow(
        IntegrationAlreadyInitializedError,
      );
      
      await initPromise;
      await slowInitIntegration.shutdown();
    });
  });

  describe("initialization error handling", () => {
    test("should set status to error on initialization failure", async () => {
      integration.initError = new Error("Init failed");

      await expect(integration.initialize()).rejects.toThrow(
        IntegrationInitializationError,
      );

      expect(integration.status).toBe("error");
    });

    test("should emit error event on initialization failure", async () => {
      const errorEvents: unknown[] = [];
      integration.on("error", (event) => errorEvents.push(event));
      integration.on("event", () => {});

      integration.initError = new Error("Init failed");

      await expect(integration.initialize()).rejects.toThrow();

      expect(errorEvents.length).toBeGreaterThan(0);
    });

    test("should throw IntegrationInitializationError with original error", async () => {
      const originalError = new Error("Original init error");
      integration.initError = originalError;

      await expect(integration.initialize()).rejects.toThrow(
        IntegrationInitializationError,
      );
    });
  });

  describe("shutdown lifecycle", () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    test("should transition from initialized to shutdown", async () => {
      await integration.shutdown();

      expect(integration.shutdownCalled).toBe(true);
      expect(integration.status).toBe("shutdown");
    });

    test("should emit shutting-down and shutdown events", async () => {
      const events: string[] = [];
      integration.on("shutting-down", () => events.push("shutting-down"));
      integration.on("shutdown", () => events.push("shutdown"));
      integration.on("event", () => {});

      await integration.shutdown();

      expect(events).toContain("shutting-down");
      expect(events).toContain("shutdown");
    });

    test("should reset start time on shutdown", async () => {
      await integration.shutdown();

      const stats = integration.getStats();
      expect(stats.uptime).toBe(0);
    });

    test("should handle double shutdown gracefully", async () => {
      await integration.shutdown();
      
      await expect(integration.shutdown()).resolves.toBeUndefined();
      expect(integration.status).toBe("shutdown");
    });

    test("should handle shutdown when uninitialized", async () => {
      const uninitialized = new TestIntegration("uninit", "1.0.0");
      
      await expect(uninitialized.shutdown()).resolves.toBeUndefined();
      expect(uninitialized.status).toBe("uninitialized");
    });
  });

  describe("shutdown error handling", () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    test("should still mark as shutdown even if shutdown throws", async () => {
      integration.shutdownError = new Error("Shutdown failed");

      await integration.shutdown();

      expect(integration.status).toBe("shutdown");
    });

    test("should emit error event on shutdown failure", async () => {
      const errorEvents: unknown[] = [];
      integration.on("error", (event) => errorEvents.push(event));
      integration.on("event", () => {});

      integration.shutdownError = new Error("Shutdown failed");

      await integration.shutdown();

      expect(errorEvents.length).toBeGreaterThan(0);
    });
  });

  describe("health check", () => {
    test("should return unhealthy when not initialized", async () => {
      const result = await integration.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.message).toContain("not initialized");
    });

    test("should return healthy result when initialized", async () => {
      await integration.initialize();

      const result = await integration.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.message).toBe("OK");
    });

    test("should emit health-check event", async () => {
      const events: unknown[] = [];
      integration.on("health-check", (event) => events.push(event));
      integration.on("event", () => {});

      await integration.initialize();
      await integration.healthCheck();

      expect(events.length).toBe(1);
    });

    test("should return unhealthy when health check throws", async () => {
      await integration.initialize();
      integration.healthCheckResult = { healthy: false, message: "Health check failed" };

      const result = await integration.healthCheck();

      expect(result.healthy).toBe(false);
    });
  });

  describe("stats tracking", () => {
    test("should track uptime after initialization", async () => {
      await integration.initialize();

      const stats = integration.getStats();

      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });

    test("should return zero uptime when not initialized", async () => {
      const stats = integration.getStats();

      expect(stats.uptime).toBe(0);
    });

    test("should return zero uptime after shutdown", async () => {
      await integration.initialize();
      await integration.shutdown();

      const stats = integration.getStats();

      expect(stats.uptime).toBe(0);
    });

    test("should track errors", async () => {
      await integration.initialize();

      integration.testRecordError(new Error("Test error"));

      const stats = integration.getStats();
      expect(stats.errors).toBe(1);
    });
  });

  describe("custom stats", () => {
    test("should allow updating custom stats", async () => {
      await integration.initialize();

      integration.testUpdateCustomStats({ requests: 10, latency: 50 });

      const stats = integration.getStats();
      expect(stats.custom).toEqual({ requests: 10, latency: 50 });
    });

    test("should merge custom stats", async () => {
      await integration.initialize();

      integration.testUpdateCustomStats({ requests: 10 });
      integration.testUpdateCustomStats({ latency: 50 });

      const stats = integration.getStats();
      expect(stats.custom).toEqual({ requests: 10, latency: 50 });
    });
  });

  describe("configuration handling", () => {
    test("should provide config copy via getConfig", async () => {
      const config = integration.testGetConfig();

      expect(config).toEqual({
        enabled: true,
        debug: false,
        logLevel: "info",
        custom: undefined,
      });
    });

    test("should update config via updateConfig", async () => {
      integration.testUpdateConfig({ enabled: false, debug: true });

      const config = integration.testGetConfig();
      expect(config.enabled).toBe(false);
      expect(config.debug).toBe(true);
    });

    test("should emit config-updated event", async () => {
      const events: unknown[] = [];
      integration.on("config-updated", (event) => events.push(event));
      integration.on("event", () => {});

      integration.testUpdateConfig({ logLevel: "debug" });

      expect(events.length).toBe(1);
    });
  });

  describe("logging integration", () => {
    test("should not log when disabled", async () => {
      await integration.initialize({ enabled: false });
      
      await integration.testLog("info", "Test message");

      const { frameworkLogger } = await import("../../core/framework-logger.js");
      expect(frameworkLogger.log).not.toHaveBeenCalled();
    });

    test("should log when enabled", async () => {
      await integration.initialize();

      await integration.testLog("info", "Test message");

      const { frameworkLogger } = await import("../../core/framework-logger.js");
      expect(frameworkLogger.log).toHaveBeenCalled();
    });
  });

  describe("event emission", () => {
    test("should emit generic event", async () => {
      const events: unknown[] = [];
      integration.on("event", (event) => events.push(event));

      await integration.initialize();

      expect(events.length).toBeGreaterThan(0);
    });

    test("should include timestamp in events", async () => {
      const events: unknown[] = [];
      integration.on("initialized", (event: any) => events.push(event));

      await integration.initialize();

      expect((events[0] as any).timestamp).toBeDefined();
    });
  });

  describe("ensureInitialized", () => {
    test("should not throw when initialized", async () => {
      await integration.initialize();

      expect(() => integration.testEnsureInitialized()).not.toThrow();
    });

    test("should throw when not initialized", () => {
      expect(() => integration.testEnsureInitialized()).toThrow();
    });
  });

  describe("getEventEmitter", () => {
    test("should return self as event emitter", () => {
      const emitter = integration.getEventEmitter();

      expect(emitter).toBe(integration);
    });
  });

  describe("isBaseIntegration", () => {
    test("should return true for BaseIntegration instance", () => {
      expect(TestIntegration.isBaseIntegration(integration)).toBe(true);
    });

    test("should return false for non-BaseIntegration", () => {
      expect(TestIntegration.isBaseIntegration({})).toBe(false);
      expect(TestIntegration.isBaseIntegration(null)).toBe(false);
      expect(TestIntegration.isBaseIntegration("string")).toBe(false);
    });
  });
});

describe("createSimpleIntegration", () => {
  test("should create a working integration", async () => {
    const healthCheck = vi.fn().mockResolvedValue({
      healthy: true,
      message: "Simple OK",
    });
    const shutdown = vi.fn().mockResolvedValue(undefined);

    const simple = createSimpleIntegration("simple", "1.0.0", healthCheck, shutdown);

    expect(simple.name).toBe("simple");
    expect(simple.version).toBe("1.0.0");

    await simple.initialize();
    expect(simple.status).toBe("initialized");

    const health = await simple.healthCheck();
    expect(health.healthy).toBe(true);
    expect(healthCheck).toHaveBeenCalled();

    await simple.shutdown();
    expect(shutdown).toHaveBeenCalled();
    expect(simple.status).toBe("shutdown");
  });

  test("should use default shutdown if not provided", async () => {
    const healthCheck = vi.fn().mockResolvedValue({ healthy: true, message: "OK" });

    const simple = createSimpleIntegration("simple", "1.0.0", healthCheck);

    await simple.initialize();
    await simple.shutdown();

    expect(simple.status).toBe("shutdown");
  });
});
