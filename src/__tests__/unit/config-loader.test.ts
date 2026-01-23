import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  StringRayConfigLoader,
  strRayConfigLoader,
  StringRayConfig,
  MultiAgentOrchestrationConfig,
  SisyphusOrchestratorConfig,
} from "../../config-loader";
import * as fs from "fs";
import * as path from "path";

// Mock fs module
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock path module
vi.mock("path", () => ({
  resolve: vi.fn(),
}));

describe("StringRayConfigLoader", () => {
  let loader: StringRayConfigLoader;
  let mockFs: any;
  let mockPath: any;

  const mockConfigContent = JSON.stringify({
    multi_agent_orchestration: {
      enabled: true,
      coordination_model: "async-multi-agent",
      max_concurrent_agents: 5,
      task_distribution_strategy: "capability-based",
      conflict_resolution: "expert-priority",
      progress_tracking: true,
      session_persistence: false,
    },
    sisyphus_orchestrator: {
      enabled: false,
      relentless_execution: true,
      todo_enforcement: false,
      max_retries: 5,
      backoff_strategy: "linear",
      progress_persistence: false,
    },
    disabled_agents: ["test-architect"],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance for clean test state
    (StringRayConfigLoader as any).instance = null;
    loader = new StringRayConfigLoader();
    mockFs = vi.mocked(fs);
    mockPath = vi.mocked(path);

    // Clear cache to ensure fresh state
    loader.clearCache();

    // Default path.resolve behavior
    mockPath.resolve.mockImplementation((...args: string[]) => args.join("/"));
  });

  afterEach(() => {
    loader.clearCache();
  });

  describe("constructor", () => {
    it("should use default path when no configPath provided", () => {
      const loader = new StringRayConfigLoader();
      expect((loader as any).configPath).toBe(".strray/config.json");
    });

    it("should use provided configPath", () => {
      const customPath = "/custom/path/config.json";
      const loader = new StringRayConfigLoader(customPath);
      expect((loader as any).configPath).toBe(customPath);
    });
  });

  describe("singleton pattern", () => {
    it("should export singleton instance", () => {
      const instance1 = new StringRayConfigLoader();
      expect(strRayConfigLoader).toBeInstanceOf(StringRayConfigLoader);
    });
  });

  describe("loadConfig", () => {
    it("should return cached config on subsequent calls", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockConfigContent);

      const firstResult = loader.loadConfig();
      expect(firstResult.multi_agent_orchestration.enabled).toBe(true);

      // Second call should return cached result
      mockFs.existsSync.mockClear();
      mockFs.readFileSync.mockClear();

      const secondResult = loader.loadConfig();
      expect(secondResult.multi_agent_orchestration.enabled).toBe(true);
      expect(mockFs.existsSync).not.toHaveBeenCalled();
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it("should load config from file when file exists", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockConfigContent);

      const config = loader.loadConfig();

      expect(config.multi_agent_orchestration.enabled).toBe(true);
      expect(config.multi_agent_orchestration.max_concurrent_agents).toBe(5);
      expect(config.sisyphus_orchestrator.enabled).toBe(false);
      expect(config.disabled_agents).toEqual(["test-architect"]);
    });

    it("should return default config when file does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const config = loader.loadConfig();

      expect(config.multi_agent_orchestration.enabled).toBe(true);
      expect(config.multi_agent_orchestration.coordination_model).toBe("async-multi-agent");
      expect(config.sisyphus_orchestrator.enabled).toBe(true);
      expect(config.disabled_agents).toEqual([]);
    });

    it("should handle file read errors gracefully", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error("File read error");
      });

      const config = loader.loadConfig();

      // Should return default config on error
      expect(config.multi_agent_orchestration.enabled).toBe(true);
      expect(config.disabled_agents).toEqual([]);
    });

    it("should handle invalid JSON gracefully", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue("invalid json");

      const config = loader.loadConfig();

      // Should return default config on parse error
      expect(config.multi_agent_orchestration.enabled).toBe(true);
    });
  });

  describe("parseConfig", () => {
    it("should parse valid config data correctly", () => {
      const configData = {
        multi_agent_orchestration: {
          enabled: false,
          coordination_model: "sync-multi-agent",
          max_concurrent_agents: 10,
          task_distribution_strategy: "load-balanced",
          conflict_resolution: "majority-vote",
          progress_tracking: false,
          session_persistence: false,
        },
        sisyphus_orchestrator: {
          enabled: true,
          relentless_execution: false,
          todo_enforcement: true,
          max_retries: 10,
          backoff_strategy: "fixed",
          progress_persistence: true,
        },
        disabled_agents: ["architect", "enforcer"],
      };

      const config = (loader as any).parseConfig(configData);

      expect(config.multi_agent_orchestration.enabled).toBe(false);
      expect(config.multi_agent_orchestration.coordination_model).toBe("sync-multi-agent");
      expect(config.multi_agent_orchestration.max_concurrent_agents).toBe(10);
      expect(config.sisyphus_orchestrator.enabled).toBe(true);
      expect(config.disabled_agents).toEqual(["architect", "enforcer"]);
    });

    it("should handle missing config sections", () => {
      const configData = {};

      const config = (loader as any).parseConfig(configData);

      expect(config.multi_agent_orchestration).toBeDefined();
      expect(config.sisyphus_orchestrator).toBeDefined();
      expect(config.disabled_agents).toEqual([]);
    });

    it("should handle null/undefined config data", () => {
      const config = (loader as any).parseConfig(null);

      expect(config.multi_agent_orchestration).toBeDefined();
      expect(config.disabled_agents).toEqual([]);
    });
  });

  describe("parseMultiAgentConfig", () => {
    it("should parse valid multi-agent config", () => {
      const configData = {
        enabled: true,
        coordination_model: "sync-multi-agent",
        max_concurrent_agents: 8,
        task_distribution_strategy: "round-robin",
        conflict_resolution: "consensus",
        progress_tracking: false,
        session_persistence: true,
      };

      const config = (loader as any).parseMultiAgentConfig(configData);

      expect(config.enabled).toBe(true);
      expect(config.coordination_model).toBe("sync-multi-agent");
      expect(config.max_concurrent_agents).toBe(8);
      expect(config.task_distribution_strategy).toBe("round-robin");
      expect(config.conflict_resolution).toBe("consensus");
      expect(config.progress_tracking).toBe(false);
      expect(config.session_persistence).toBe(true);
    });

    it("should use defaults for missing values", () => {
      const configData = {};

      const config = (loader as any).parseMultiAgentConfig(configData);

      expect(config.enabled).toBe(true);
      expect(config.coordination_model).toBe("async-multi-agent");
      expect(config.max_concurrent_agents).toBe(3);
      expect(config.task_distribution_strategy).toBe("capability-based");
      expect(config.conflict_resolution).toBe("expert-priority");
      expect(config.progress_tracking).toBe(true);
      expect(config.session_persistence).toBe(true);
    });

    it("should clamp max_concurrent_agents to valid range", () => {
      expect((loader as any).parseMultiAgentConfig({ max_concurrent_agents: 0 }).max_concurrent_agents).toBe(1);
      expect((loader as any).parseMultiAgentConfig({ max_concurrent_agents: 15 }).max_concurrent_agents).toBe(10);
      expect((loader as any).parseMultiAgentConfig({ max_concurrent_agents: 5 }).max_concurrent_agents).toBe(5);
    });

    it("should validate enum values", () => {
      const config = (loader as any).parseMultiAgentConfig({
        coordination_model: "invalid-model",
        task_distribution_strategy: "invalid-strategy",
        conflict_resolution: "invalid-resolution",
      });

      expect(config.coordination_model).toBe("async-multi-agent");
      expect(config.task_distribution_strategy).toBe("capability-based");
      expect(config.conflict_resolution).toBe("expert-priority");
    });
  });

  describe("parseSisyphusConfig", () => {
    it("should parse valid sisyphus config", () => {
      const configData = {
        enabled: false,
        relentless_execution: false,
        todo_enforcement: true,
        max_retries: 8,
        backoff_strategy: "fixed",
        progress_persistence: false,
      };

      const config = (loader as any).parseSisyphusConfig(configData);

      expect(config.enabled).toBe(false);
      expect(config.relentless_execution).toBe(false);
      expect(config.todo_enforcement).toBe(true);
      expect(config.max_retries).toBe(8);
      expect(config.backoff_strategy).toBe("fixed");
      expect(config.progress_persistence).toBe(false);
    });

    it("should use defaults for missing values", () => {
      const configData = {};

      const config = (loader as any).parseSisyphusConfig(configData);

      expect(config.enabled).toBe(true);
      expect(config.relentless_execution).toBe(true);
      expect(config.todo_enforcement).toBe(true);
      expect(config.max_retries).toBe(3);
      expect(config.backoff_strategy).toBe("exponential");
      expect(config.progress_persistence).toBe(true);
    });

    it("should clamp max_retries to valid range", () => {
      expect((loader as any).parseSisyphusConfig({ max_retries: -1 }).max_retries).toBe(0);
      expect((loader as any).parseSisyphusConfig({ max_retries: 15 }).max_retries).toBe(10);
      expect((loader as any).parseSisyphusConfig({ max_retries: 5 }).max_retries).toBe(5);
    });

    it("should validate backoff_strategy enum", () => {
      const config = (loader as any).parseSisyphusConfig({
        backoff_strategy: "invalid-strategy",
      });

      expect(config.backoff_strategy).toBe("exponential");
    });
  });

  describe("getDefaultConfig", () => {
    it("should return complete default configuration", () => {
      const config = (loader as any).getDefaultConfig();

      expect(config.multi_agent_orchestration).toEqual({
        enabled: true,
        coordination_model: "async-multi-agent",
        max_concurrent_agents: 3,
        task_distribution_strategy: "capability-based",
        conflict_resolution: "expert-priority",
        progress_tracking: true,
        session_persistence: true,
      });

      expect(config.sisyphus_orchestrator).toEqual({
        enabled: true,
        relentless_execution: true,
        todo_enforcement: true,
        max_retries: 3,
        backoff_strategy: "exponential",
        progress_persistence: true,
      });

      expect(config.disabled_agents).toEqual([]);
    });
  });

  describe("validateEnum", () => {
    it("should return value when it exists in allowed values", () => {
      expect((loader as any).validateEnum("option1", ["option1", "option2"], "default")).toBe("option1");
      expect((loader as any).validateEnum("option2", ["option1", "option2"], "default")).toBe("option2");
    });

    it("should return default value when input is not in allowed values", () => {
      expect((loader as any).validateEnum("invalid", ["option1", "option2"], "default")).toBe("default");
      expect((loader as any).validateEnum("", ["option1", "option2"], "default")).toBe("default");
      expect((loader as any).validateEnum(null, ["option1", "option2"], "default")).toBe("default");
      expect((loader as any).validateEnum(undefined, ["option1", "option2"], "default")).toBe("default");
    });
  });

  describe("clearCache", () => {
    it("should clear cached config and reset last load time", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockConfigContent);

      // Load config to populate cache
      loader.loadConfig();
      expect((loader as any).cachedConfig).toBeDefined();
      expect((loader as any).lastLoadTime).toBeGreaterThan(0);

      // Clear cache
      loader.clearCache();

      expect((loader as any).cachedConfig).toBeNull();
      expect((loader as any).lastLoadTime).toBe(0);
    });
  });

  describe("cache expiry", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should reload config after cache expiry", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockConfigContent);

      // Load config
      const config1 = loader.loadConfig();
      const loadTime1 = (loader as any).lastLoadTime;

      // Advance time past cache expiry
      vi.advanceTimersByTime(31000); // 31 seconds

      // Load again - should reload from file
      const config2 = loader.loadConfig();
      const loadTime2 = (loader as any).lastLoadTime;

      expect(loadTime2).toBeGreaterThan(loadTime1);
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
    });

    it("should use cached config within expiry time", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockConfigContent);

      // Load config
      loader.loadConfig();

      // Advance time but not past expiry
      vi.advanceTimersByTime(29000); // 29 seconds

      // Load again - should use cache
      mockFs.readFileSync.mockClear();
      loader.loadConfig();

      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });
  });
});