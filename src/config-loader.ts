/**
 * StrRay Framework v1.0.0 - Configuration Loader
 *
 * Loads and validates StrRay-specific configuration from oh-my-opencode.json
 *
 * @version 1.0.0
 * @since 2026-01-09
 */

import * as fs from "fs";
import * as path from "path";

export interface MultiAgentOrchestrationConfig {
  enabled: boolean;
  coordination_model: "async-multi-agent" | "sync-multi-agent";
  max_concurrent_agents: number;
  task_distribution_strategy:
    | "capability-based"
    | "load-balanced"
    | "round-robin";
  conflict_resolution: "expert-priority" | "majority-vote" | "consensus";
  progress_tracking: boolean;
  session_persistence: boolean;
}

export interface SisyphusOrchestratorConfig {
  enabled: boolean;
  relentless_execution: boolean;
  todo_enforcement: boolean;
  max_retries: number;
  backoff_strategy: "exponential" | "linear" | "fixed";
  progress_persistence: boolean;
}

export interface StrRayConfig {
  multi_agent_orchestration: MultiAgentOrchestrationConfig;
  sisyphus_orchestrator: SisyphusOrchestratorConfig;
  disabled_agents: string[];
}

export class StrRayConfigLoader {
  private configPath: string;
  private cachedConfig: StrRayConfig | null = null;
  private cacheExpiry: number = 30000; // 30 seconds
  private lastLoadTime: number = 0;

  constructor(configPath?: string) {
    this.configPath = configPath || ".strray/config.json";
  }

  /**
   * Load StrRay configuration from .strray/strray-config.json
   */
  public loadConfig(): StrRayConfig {
    const now = Date.now();

    // Return cached config if still valid
    if (this.cachedConfig && now - this.lastLoadTime < this.cacheExpiry) {
      return this.cachedConfig;
    }

    try {
      const configPath = path.resolve(process.cwd(), this.configPath);

      if (!fs.existsSync(configPath)) {
        console.warn(
          `⚠️  StrRay config not found at ${configPath}, using defaults`,
        );
        return this.getDefaultConfig();
      }

      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const config = this.parseConfig(configData);

      this.cachedConfig = config;
      this.lastLoadTime = now;

      return config;
    } catch (error) {
      console.error(`❌ Failed to load StrRay config:`, error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Parse configuration data with validation
   */
  private parseConfig(configData: any): StrRayConfig {
    return {
      multi_agent_orchestration: this.parseMultiAgentConfig(
        configData.multi_agent_orchestration,
      ),
      sisyphus_orchestrator: this.parseSisyphusConfig(
        configData.sisyphus_orchestrator,
      ),
      disabled_agents: Array.isArray(configData.disabled_agents)
        ? configData.disabled_agents
        : [],
    };
  }

  /**
   * Parse multi-agent orchestration configuration
   */
  private parseMultiAgentConfig(config: any): MultiAgentOrchestrationConfig {
    return {
      enabled: config?.enabled ?? true,
      coordination_model: this.validateEnum(
        config?.coordination_model,
        ["async-multi-agent", "sync-multi-agent"],
        "async-multi-agent",
      ),
      max_concurrent_agents: Math.max(
        1,
        Math.min(10, config?.max_concurrent_agents ?? 3),
      ),
      task_distribution_strategy: this.validateEnum(
        config?.task_distribution_strategy,
        ["capability-based", "load-balanced", "round-robin"],
        "capability-based",
      ),
      conflict_resolution: this.validateEnum(
        config?.conflict_resolution,
        ["expert-priority", "majority-vote", "consensus"],
        "expert-priority",
      ),
      progress_tracking: config?.progress_tracking ?? true,
      session_persistence: config?.session_persistence ?? true,
    };
  }

  /**
   * Parse Sisyphus orchestrator configuration
   */
  private parseSisyphusConfig(config: any): SisyphusOrchestratorConfig {
    return {
      enabled: config?.enabled ?? true,
      relentless_execution: config?.relentless_execution ?? true,
      todo_enforcement: config?.todo_enforcement ?? true,
      max_retries: Math.max(0, Math.min(10, config?.max_retries ?? 3)),
      backoff_strategy: this.validateEnum(
        config?.backoff_strategy,
        ["exponential", "linear", "fixed"],
        "exponential",
      ),
      progress_persistence: config?.progress_persistence ?? true,
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): StrRayConfig {
    return {
      multi_agent_orchestration: {
        enabled: true,
        coordination_model: "async-multi-agent",
        max_concurrent_agents: 3,
        task_distribution_strategy: "capability-based",
        conflict_resolution: "expert-priority",
        progress_tracking: true,
        session_persistence: true,
      },
      sisyphus_orchestrator: {
        enabled: true,
        relentless_execution: true,
        todo_enforcement: true,
        max_retries: 3,
        backoff_strategy: "exponential",
        progress_persistence: true,
      },
      disabled_agents: [],
    };
  }

  /**
   * Validate enum values
   */
  private validateEnum<T>(value: any, allowedValues: T[], defaultValue: T): T {
    return allowedValues.includes(value) ? value : defaultValue;
  }

  /**
   * Clear configuration cache
   */
  public clearCache(): void {
    this.cachedConfig = null;
    this.lastLoadTime = 0;
  }
}

// Export singleton instance
export const strRayConfigLoader = new StrRayConfigLoader();
