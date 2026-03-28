/**
 * Unit Tests for Consent Manager
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { ConsentManager, ConsentConfiguration, ConsentCategory } from "../../../analytics/consent-manager.js";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import * as os from "os";

describe("ConsentManager", () => {
  let consentManager: ConsentManager;
  let testConfigPath: string;

  beforeEach(() => {
    // Use unique temp directory per test to ensure isolation
    const testDir = path.join(os.tmpdir(), "strray-consent-tests", `test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    if (!fsSync.existsSync(testDir)) {
      fsSync.mkdirSync(testDir, { recursive: true });
    }
    testConfigPath = path.join(testDir, "test-consent.json");
    consentManager = new ConsentManager(testConfigPath);
  });

  afterEach(async () => {
    // Clean up test config
    try {
      await fs.unlink(testConfigPath).catch(() => {});
      const queueDir = path.join(path.dirname(testConfigPath), "analytics");
      await fs.rm(queueDir, { recursive: true, force: true }).catch(() => {});
    } catch {
      // Ignore cleanup errors
    }
  });

  test("should create default config when not exists", async () => {
    // Clean up any existing config to ensure test isolation
    try { await fs.unlink(testConfigPath).catch(() => {}); } catch {}
    
    const config = await consentManager.initialize();
    
    expect(config.analyticsEnabled).toBe(false);
    expect(config.categories.reflections).toBe(false);
    expect(config.categories.logs).toBe(false);
    expect(config.categories.metrics).toBe(false);
    expect(config.categories.patterns).toBe(false);
    expect(config.projectId).toMatch(/^project-/);
  });

  test("should load existing config", async () => {
    // Create existing config
    const existingConfig: ConsentConfiguration = {
      analyticsEnabled: true,
      consentDate: new Date(),
      consentVersion: "1.0",
      lastOptOut: undefined,
      categories: {
        reflections: true,
        logs: true,
        metrics: false,
        patterns: true
      },
      projectId: "test-project-123"
    };
    
    await fs.writeFile(testConfigPath, JSON.stringify(existingConfig, null, 2), "utf-8");
    
    const loadedConfig = await consentManager.initialize();
    
    expect(loadedConfig.analyticsEnabled).toBe(true);
    expect(loadedConfig.categories.reflections).toBe(true);
    expect(loadedConfig.categories.logs).toBe(true);
    expect(loadedConfig.categories.metrics).toBe(false);
    expect(loadedConfig.categories.patterns).toBe(true);
    expect(loadedConfig.projectId).toBe("test-project-123");
  });

  test("should enable consent with all categories", async () => {
    await consentManager.enableConsent(["reflections", "logs", "metrics", "patterns"]);
    
    const config = await consentManager.getStatus();
    
    expect(config.analyticsEnabled).toBe(true);
    expect(config.categories.reflections).toBe(true);
    expect(config.categories.logs).toBe(true);
    expect(config.categories.metrics).toBe(true);
    expect(config.categories.patterns).toBe(true);
    expect(config.consentDate).toBeInstanceOf(Date);
    expect(config.projectId).toBeDefined();
  });

  test("should enable consent with specific categories", async () => {
    await consentManager.enableConsent(["reflections", "metrics"]);
    
    const config = await consentManager.getStatus();
    
    expect(config.analyticsEnabled).toBe(true);
    expect(config.categories.reflections).toBe(true);
    expect(config.categories.metrics).toBe(true);
    expect(config.categories.logs).toBe(false); // Not enabled
    expect(config.categories.patterns).toBe(false); // Not enabled
  });

  test("should disable consent", async () => {
    // First enable consent
    await consentManager.enableConsent(["reflections"]);
    
    const beforeConfig = await consentManager.getStatus();
    expect(beforeConfig.analyticsEnabled).toBe(true);
    
    // Now disable
    await consentManager.disableConsent();
    
    const afterConfig = await consentManager.getStatus();
    expect(afterConfig.analyticsEnabled).toBe(false);
    expect(afterConfig.lastOptOut).toBeInstanceOf(Date);
    
    // All categories should be disabled
    expect(afterConfig.categories.reflections).toBe(false);
    expect(afterConfig.categories.logs).toBe(false);
    expect(afterConfig.categories.metrics).toBe(false);
    expect(afterConfig.categories.patterns).toBe(false);
  });

  test("should check canSubmit correctly", () => {
    // When disabled, should not allow submission
    expect(consentManager.canSubmit("reflections")).toBe(false);
    expect(consentManager.canSubmit("logs")).toBe(false);
    
    // When enabled, should allow submission
    consentManager["config"] = {
      analyticsEnabled: true,
      consentDate: new Date(),
      consentVersion: "1.0",
      lastOptOut: undefined,
      categories: {
        reflections: true,
        logs: false,
        metrics: false,
        patterns: false
      },
      projectId: "test-project"
    } as ConsentConfiguration;
    
    expect(consentManager.canSubmit("reflections")).toBe(true);
    expect(consentManager.canSubmit("logs")).toBe(false);
  });

  test("should get categories correctly", () => {
    consentManager["config"] = {
      analyticsEnabled: true,
      consentDate: new Date(),
      consentVersion: "1.0",
      lastOptOut: undefined,
      categories: {
        reflections: true,
        logs: false,
        metrics: true,
        patterns: false
      },
      projectId: "test-project"
    } as ConsentConfiguration;
    
    const categories = consentManager.getCategories();
    
    expect(categories).toHaveLength(4);
    
    const enabledCategories = categories.filter(c => c.enabled);
    expect(enabledCategories).toHaveLength(2);
    
    const reflectionsCat = categories.find(c => c.name === "reflections");
    expect(reflectionsCat?.enabled).toBe(true);
    
    const logsCat = categories.find(c => c.name === "logs");
    expect(logsCat?.enabled).toBe(false);
  });

  test("should enable specific category", async () => {
    consentManager["config"] = {
      analyticsEnabled: true,
      consentDate: new Date(),
      consentVersion: "1.0",
      lastOptOut: undefined,
      categories: {
        reflections: false,
        logs: false,
        metrics: false,
        patterns: false
      },
      projectId: "test-project"
    } as ConsentConfiguration;
    
    await consentManager.enableCategory("metrics");
    
    const config = await consentManager.getStatus();
    expect(config.categories.metrics).toBe(true);
    expect(config.categories.reflections).toBe(false); // Should remain false
  });

  test("should disable specific category", async () => {
    consentManager["config"] = {
      analyticsEnabled: true,
      consentDate: new Date(),
      consentVersion: "1.0",
      lastOptOut: undefined,
      categories: {
        reflections: true,
        logs: true,
        metrics: true,
        patterns: true
      },
      projectId: "test-project"
    } as ConsentConfiguration;
    
    await consentManager.disableCategory("metrics");
    
    const config = await consentManager.getStatus();
    expect(config.categories.metrics).toBe(false);
    expect(config.categories.reflections).toBe(true); // Should remain true
  });

  test("should throw error for invalid category", async () => {
    consentManager["config"] = {
      analyticsEnabled: true,
      consentDate: new Date(),
      consentVersion: "1.0",
      lastOptOut: undefined,
      categories: {
        reflections: true,
        logs: true,
        metrics: true,
        patterns: true
      },
      projectId: "test-project"
    } as ConsentConfiguration;
    
    await expect(
      consentManager.enableCategory("invalid-category")
    ).rejects.toThrow("Invalid category: invalid-category");
  });
});