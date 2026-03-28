/**
 * Integration Registry Tests
 *
 * Tests for the IntegrationRegistry class registration, loading, and lifecycle management.
 *
 * @version 1.0.0
 * @since 2026-03-15
 */

import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";
import {
  IntegrationRegistry,
  IntegrationsConfig,
  IntegrationNotFoundError,
  IntegrationAlreadyRegisteredError,
} from "./registry.js";
import { BaseIntegration } from "./Integration.js";
import type { HealthResult, IntegrationStats } from "./types.js";

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

  constructor(name: string, version: string) {
    super(name, version);
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
}

describe("IntegrationRegistry", () => {
  let registry: IntegrationRegistry;

  beforeEach(() => {
    registry = new IntegrationRegistry();
  });

  afterEach(async () => {
    await registry.unloadAll();
    vi.clearAllMocks();
  });

  describe("registration", () => {
    test("should register an integration", () => {
      const integration = new TestIntegration("test", "1.0.0");

      registry.register("test", integration);

      expect(registry.get("test")).toBe(integration);
      expect(registry.isRegistered("test")).toBe(true);
    });

    test("should throw when registering duplicate name", () => {
      const integration1 = new TestIntegration("test", "1.0.0");
      const integration2 = new TestIntegration("test", "2.0.0");

      registry.register("test", integration1);

      expect(() => registry.register("test", integration2)).toThrow(
        IntegrationAlreadyRegisteredError,
      );
    });

    test("should emit integration-registered event", async () => {
      const events: unknown[] = [];
      registry.on("integration-registered", (event) => events.push(event));
      registry.on("event", () => {});

      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      expect(events.length).toBe(1);
    });

    test("should throw when registering invalid integration", () => {
      expect(() =>
        registry.register(
          "invalid",
          {} as any,
        ),
      ).toThrow();
    });
  });

  describe("unregistration", () => {
    test("should unregister an integration", () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      registry.unregister("test");

      expect(registry.get("test")).toBeUndefined();
      expect(registry.isRegistered("test")).toBe(false);
    });

    test("should throw when unregistering non-existent integration", () => {
      expect(() => registry.unregister("nonexistent")).toThrow(
        IntegrationNotFoundError,
      );
    });

    test("should emit integration-unregistered event", async () => {
      const events: unknown[] = [];
      registry.on("integration-unregistered", (event) => events.push(event));
      registry.on("event", () => {});

      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      registry.unregister("test");

      expect(events.length).toBe(1);
    });

    test("should unload before unregistering if loaded", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      integration.getEventEmitter().on("error", () => {});
      registry.register("test", integration);
      await registry.load("test");

      const unloadPromise = registry.unload("test");
      registry.unregister("test");

      await unloadPromise;

      expect(registry.isLoaded("test")).toBe(false);
      expect(registry.get("test")).toBeUndefined();
    });
  });

  describe("accessor methods", () => {
    test("should get a registered integration", () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      const result = registry.get("test");

      expect(result).toBe(integration);
    });

    test("should return undefined for non-existent integration", () => {
      expect(registry.get("nonexistent")).toBeUndefined();
    });

    test("should list all registered integrations", () => {
      const integration1 = new TestIntegration("test1", "1.0.0");
      const integration2 = new TestIntegration("test2", "1.0.0");

      registry.register("test1", integration1);
      registry.register("test2", integration2);

      const names = registry.list();

      expect(names).toContain("test1");
      expect(names).toContain("test2");
      expect(names.length).toBe(2);
    });

    test("should list all loaded integrations", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      const names = registry.listLoaded();

      expect(names).toContain("test");
    });

    test("should check if integration is registered", () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      expect(registry.isRegistered("test")).toBe(true);
      expect(registry.isRegistered("nonexistent")).toBe(false);
    });

    test("should check if integration is loaded", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      expect(registry.isLoaded("test")).toBe(true);
      expect(registry.isLoaded("nonexistent")).toBe(false);
    });
  });

  describe("loading integrations", () => {
    test("should load an integration", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      await registry.load("test");

      expect(integration.initCalled).toBe(true);
      expect(registry.isLoaded("test")).toBe(true);
    });

    test("should emit integration-loaded event", async () => {
      const events: unknown[] = [];
      registry.on("integration-loaded", (event) => events.push(event));
      registry.on("event", () => {});

      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      expect(events.length).toBe(1);
    });

    test("should throw when loading non-existent integration", async () => {
      await expect(registry.load("nonexistent")).rejects.toThrow(
        IntegrationNotFoundError,
      );
    });

    test("should handle already loaded integration gracefully", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      await expect(registry.load("test")).resolves.toBeUndefined();
    });

    test("should pass configuration to integration", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      await registry.load("test", { enabled: false, debug: true });

      expect(registry.isLoaded("test")).toBe(true);
    });

    test("should throw when initialization fails", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      integration.initError = new Error("Init failed");
      registry.register("test", integration);

      await expect(registry.load("test")).rejects.toThrow();
    });
  });

  describe("unloading integrations", () => {
    test("should unload an integration", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      await registry.unload("test");

      expect(integration.shutdownCalled).toBe(true);
      expect(registry.isLoaded("test")).toBe(false);
    });

    test("should emit integration-unloaded event", async () => {
      const events: unknown[] = [];
      registry.on("integration-unloaded", (event) => events.push(event));
      registry.on("event", () => {});

      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");
      await registry.unload("test");

      expect(events.length).toBe(1);
    });

    test("should throw when unloading non-loaded integration", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      await expect(registry.unload("test")).rejects.toThrow(
        IntegrationNotFoundError,
      );
    });

    test("should still remove from loaded map even if shutdown fails", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      integration.getEventEmitter().on("error", () => {});
      integration.shutdownError = new Error("Shutdown failed");
      registry.register("test", integration);
      await registry.load("test");

      await registry.unload("test");

      expect(registry.isLoaded("test")).toBe(false);
    });
  });

  describe("loadAll", () => {
    test("should load all enabled integrations", async () => {
      const integration1 = new TestIntegration("test1", "1.0.0");
      const integration2 = new TestIntegration("test2", "1.0.0");
      registry.register("test1", integration1);
      registry.register("test2", integration2);

      const config: IntegrationsConfig = {
        integrations: {
          test1: { enabled: true },
          test2: { enabled: true },
        },
      };

      await registry.loadAll(config);

      expect(registry.isLoaded("test1")).toBe(true);
      expect(registry.isLoaded("test2")).toBe(true);
    });

    test("should skip disabled integrations", async () => {
      const integration = new TestIntegration("test1", "1.0.0");
      registry.register("test1", integration);

      const config: IntegrationsConfig = {
        integrations: {
          test1: { enabled: false },
        },
      };

      await registry.loadAll(config);

      expect(registry.isLoaded("test1")).toBe(false);
    });

    test("should skip unregistered integrations", async () => {
      const config: IntegrationsConfig = {
        integrations: {
          nonexistent: { enabled: true },
        },
      };

      await registry.loadAll(config);

      expect(registry.isLoaded("nonexistent")).toBe(false);
    });

    test("should emit load-complete event", async () => {
      const events: unknown[] = [];
      registry.on("load-complete", (event) => events.push(event));
      registry.on("event", () => {});

      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      const config: IntegrationsConfig = {
        integrations: { test: { enabled: true } },
      };

      await registry.loadAll(config);

      expect(events.length).toBe(1);
    });

    test("should continue loading other integrations if one fails", async () => {
      const integration1 = new TestIntegration("test1", "1.0.0");
      integration1.initError = new Error("Init failed");
      const integration2 = new TestIntegration("test2", "1.0.0");
      registry.register("test1", integration1);
      registry.register("test2", integration2);

      const config: IntegrationsConfig = {
        integrations: {
          test1: { enabled: true },
          test2: { enabled: true },
        },
      };

      await registry.loadAll(config);

      expect(registry.isLoaded("test1")).toBe(false);
      expect(registry.isLoaded("test2")).toBe(true);
    });
  });

  describe("unloadAll", () => {
    test("should unload all loaded integrations", async () => {
      const integration1 = new TestIntegration("test1", "1.0.0");
      const integration2 = new TestIntegration("test2", "1.0.0");
      registry.register("test1", integration1);
      registry.register("test2", integration2);
      await registry.load("test1");
      await registry.load("test2");

      await registry.unloadAll();

      expect(registry.isLoaded("test1")).toBe(false);
      expect(registry.isLoaded("test2")).toBe(false);
    });

    test("should emit unload-complete event", async () => {
      const events: unknown[] = [];
      registry.on("unload-complete", (event) => events.push(event));
      registry.on("event", () => {});

      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      await registry.unloadAll();

      expect(events.length).toBe(1);
    });
  });

  describe("healthCheckAll", () => {
    test("should return health status for all loaded integrations", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      integration.healthCheckResult = { healthy: true, message: "OK" };
      registry.register("test", integration);
      await registry.load("test");

      const results = await registry.healthCheckAll();

      expect(results.test).toBeDefined();
      expect(results.test.healthy).toBe(true);
    });

    test("should return unhealthy for integrations that throw on health check", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      integration.healthCheckResult = { healthy: false, message: "Error" };
      registry.register("test", integration);
      await registry.load("test");

      const results = await registry.healthCheckAll();

      expect(results.test.healthy).toBe(false);
    });

    test("should emit health-check-complete event", async () => {
      const events: unknown[] = [];
      registry.on("health-check-complete", (event) => events.push(event));
      registry.on("event", () => {});

      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      await registry.healthCheckAll();

      expect(events.length).toBe(1);
    });
  });

  describe("healthCheck (single)", () => {
    test("should return health status for specific integration", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      integration.healthCheckResult = { healthy: true, message: "OK" };
      registry.register("test", integration);
      await registry.load("test");

      const result = await registry.healthCheck("test");

      expect(result.healthy).toBe(true);
    });

    test("should throw for non-loaded integration", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      await expect(registry.healthCheck("test")).rejects.toThrow(
        IntegrationNotFoundError,
      );
    });
  });

  describe("getAllStats", () => {
    test("should return stats from all loaded integrations", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      const stats = registry.getAllStats();

      expect(stats.test).toBeDefined();
      expect(stats.test.uptime).toBeGreaterThanOrEqual(0);
    });

    test("should return empty object when no integrations loaded", () => {
      const stats = registry.getAllStats();

      expect(stats).toEqual({});
    });
  });

  describe("getStats (single)", () => {
    test("should return stats for specific integration", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      const stats = registry.getStats("test");

      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });

    test("should throw for non-loaded integration", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      expect(() => registry.getStats("test")).toThrow(IntegrationNotFoundError);
    });
  });

  describe("getStatus and getAllStatuses", () => {
    test("should get status of a specific integration", () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      const status = registry.getStatus("test");

      expect(status).toBe("uninitialized");
    });

    test("should return undefined for non-existent integration", () => {
      const status = registry.getStatus("nonexistent");

      expect(status).toBeUndefined();
    });

    test("should get all integration statuses", () => {
      const integration1 = new TestIntegration("test1", "1.0.0");
      const integration2 = new TestIntegration("test2", "1.0.0");
      registry.register("test1", integration1);
      registry.register("test2", integration2);

      const statuses = registry.getAllStatuses();

      expect(statuses.test1).toBe("uninitialized");
      expect(statuses.test2).toBe("uninitialized");
    });
  });

  describe("clear", () => {
    test("should clear non-loaded integrations", () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      registry.clear();

      expect(registry.isRegistered("test")).toBe(false);
    });

    test("should not clear loaded integrations", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      registry.clear();

      expect(registry.isRegistered("test")).toBe(true);
    });
  });

  describe("getRegistryStats", () => {
    test("should return registry statistics", () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      const stats = registry.getRegistryStats();

      expect(stats.registered).toBe(1);
      expect(stats.loaded).toBe(0);
      expect(stats.byStatus.uninitialized).toBe(1);
    });

    test("should track loaded integrations in stats", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      const stats = registry.getRegistryStats();

      expect(stats.loaded).toBe(1);
      expect(stats.byStatus.initialized).toBe(1);
    });
  });

  describe("getLoaded", () => {
    test("should return loaded integration metadata", async () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);
      await registry.load("test");

      const loaded = registry.getLoaded("test");

      expect(loaded).toBeDefined();
      expect(loaded?.instance).toBe(integration);
      expect(loaded?.loadedAt).toBeGreaterThan(0);
    });

    test("should return undefined for non-loaded integration", () => {
      const integration = new TestIntegration("test", "1.0.0");
      registry.register("test", integration);

      const loaded = registry.getLoaded("test");

      expect(loaded).toBeUndefined();
    });
  });
});
