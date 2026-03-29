/**
 * Features Configuration Loader
 *
 * Loads and validates the unified features configuration from features.json
 * Supports token optimization, model routing, batch operations, and more.
 *
 * @version 1.0.0
 * @since 2026-01-25
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Type Definitions
// ============================================================================

export interface TokenOptimizationConfig {
  enabled: boolean;
  max_context_tokens: number;
  prune_after_task: boolean;
  summarize_tool_outputs: boolean;
  context_compression: {
    enabled: boolean;
    threshold_tokens: number;
    compression_ratio: number;
  };
}

export interface TaskRouting {
  model: string;
  max_tokens: number;
  description: string;
}

export interface ModelRoutingConfig {
  enabled: boolean;
  default_model?: string;
  fallback_model?: string;
  task_routing?: {
    file_read?: TaskRouting;
    grep_search?: TaskRouting;
    simple_edit?: TaskRouting;
    bulk_refactor?: TaskRouting;
    architecture_review?: TaskRouting;
    security_audit?: TaskRouting;
    git_operations?: TaskRouting;
    documentation?: TaskRouting;
    code_generation?: TaskRouting;
    debugging?: TaskRouting;
  };
}

export interface BatchOperationsConfig {
  enabled: boolean;
  prefer_sed_for_replacements: boolean;
  parallel_file_updates: boolean;
  max_concurrent_edits: number;
  auto_batch_threshold: number;
}

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

export interface AutonomousReportingConfig {
  enabled: boolean;
  interval_minutes: number;
  auto_schedule: boolean;
  include_health_assessment: boolean;
  include_agent_activities: boolean;
  include_pipeline_operations: boolean;
  include_critical_issues: boolean;
  include_recommendations: boolean;
  report_retention_days: number;
  notification_channels: string[];
}

export interface AgentManagementConfig {
  disabled_agents: string[];
  agent_models: Record<string, string>;
  performance_limits: {
    max_task_duration_ms: number;
    max_memory_usage_mb: number;
    max_tokens_per_request: number;
  };
}

export interface RefactoringConfig {
  enabled: boolean;
  automatic_detection: boolean;
  require_user_approval: boolean;
  max_complexity_threshold: number;
  safe_mode: boolean;
  batch_mode: boolean;
}

export interface ActivityLoggingConfig {
  enabled: boolean;
  level: "debug" | "info" | "warn" | "error";
  include_performance_metrics: boolean;
  include_agent_states: boolean;
  include_token_usage: boolean;
  retention_days: number;
  log_to_file: boolean;
  log_path: string;
}

export interface SecurityConfig {
  enabled: boolean;
  prompt_sanitization: boolean;
  vulnerability_scanning: boolean;
  code_review_enforcement: boolean;
  security_score_threshold: number;
}

export interface PerformanceMonitoringConfig {
  enabled: boolean;
  real_time_metrics: boolean;
  benchmark_tracking: boolean;
  token_tracking: boolean;
  cost_tracking: boolean;
  alerting: {
    enabled: boolean;
    performance_degradation_threshold: number;
    error_rate_threshold: number;
    cost_threshold_daily: number;
  };
}

export interface CachingConfig {
  enabled: boolean;
  file_content_cache: boolean;
  search_result_cache: boolean;
  cache_ttl_seconds: number;
  max_cache_size_mb: number;
}

export interface FeaturesConfig {
  version: string;
  description: string;
  token_optimization: TokenOptimizationConfig;
  model_routing: ModelRoutingConfig;
  batch_operations: BatchOperationsConfig;
  multi_agent_orchestration: MultiAgentOrchestrationConfig;
  autonomous_reporting: AutonomousReportingConfig;
  agent_management: AgentManagementConfig;
  refactoring: RefactoringConfig;
  activity_logging: ActivityLoggingConfig;
  security: SecurityConfig;
  performance_monitoring: PerformanceMonitoringConfig;
  caching: CachingConfig;
}

// ============================================================================
// Task Type Detection
// ============================================================================

export type TaskType =
  | "file_read"
  | "grep_search"
  | "simple_edit"
  | "bulk_refactor"
  | "architecture_review"
  | "security_audit"
  | "git_operations"
  | "documentation"
  | "code_generation"
  | "debugging"
  | "unknown";

/**
 * Detect task type from tool name and context
 */
export function detectTaskType(
  toolName: string,
  context?: { fileCount?: number; isComplex?: boolean },
): TaskType {
  const toolLower = toolName.toLowerCase();

  // File operations
  if (toolLower.includes("read") || toolLower === "cat") {
    return "file_read";
  }

  // Search operations
  if (
    toolLower.includes("grep") ||
    toolLower.includes("search") ||
    toolLower.includes("find")
  ) {
    return "grep_search";
  }

  // Git operations
  if (
    toolLower.includes("git") ||
    toolLower.includes("commit") ||
    toolLower.includes("push")
  ) {
    return "git_operations";
  }

  // Edit operations - check complexity
  if (
    toolLower.includes("edit") ||
    toolLower.includes("write") ||
    toolLower.includes("sed")
  ) {
    const fileCount = context?.fileCount ?? 1;
    const isComplex = context?.isComplex ?? false;

    if (fileCount > 5 || isComplex) {
      return "bulk_refactor";
    }
    return "simple_edit";
  }

  // Documentation
  if (
    toolLower.includes("doc") ||
    toolLower.includes("readme") ||
    toolLower.includes("markdown")
  ) {
    return "documentation";
  }

  // Security
  if (
    toolLower.includes("security") ||
    toolLower.includes("audit") ||
    toolLower.includes("vulnerability")
  ) {
    return "security_audit";
  }

  // Architecture
  if (
    toolLower.includes("architect") ||
    toolLower.includes("design") ||
    toolLower.includes("structure")
  ) {
    return "architecture_review";
  }

  // Code generation
  if (
    toolLower.includes("generate") ||
    toolLower.includes("create") ||
    toolLower.includes("implement")
  ) {
    return "code_generation";
  }

  // Debugging
  if (
    toolLower.includes("debug") ||
    toolLower.includes("fix") ||
    toolLower.includes("error")
  ) {
    return "debugging";
  }

  return "unknown";
}

// ============================================================================
// Features Config Loader
// ============================================================================

export class FeaturesConfigLoader {
  private featuresPath: string;
  private cachedConfig: FeaturesConfig | null = null;
  private cacheExpiry: number = 30000; // 30 seconds
  private lastLoadTime: number = 0;

  constructor(featuresPath?: string) {
    this.featuresPath = featuresPath || ".opencode/strray/features.json";
  }

  /**
   * Load features configuration
   */
  public loadConfig(): FeaturesConfig {
    const now = Date.now();

    // Return cached config if still valid
    if (this.cachedConfig && now - this.lastLoadTime < this.cacheExpiry) {
      return this.cachedConfig;
    }

    try {
      const configPath = path.resolve(process.cwd(), this.featuresPath);

      if (!fs.existsSync(configPath)) {
        return this.getDefaultConfig();
      }

      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const config = this.mergeWithDefaults(configData);

      this.cachedConfig = config;
      this.lastLoadTime = now;

      return config;
    } catch (error) {
      // Silent fallback to defaults on error - frameworkLogger not available here
      return this.getDefaultConfig();
    }
  }

  /**
   * Get model for a specific task type
   */
  public getModelForTask(taskType: TaskType): string {
    const config = this.loadConfig();

    if (!config.model_routing?.enabled) {
      return config.model_routing?.default_model || "claude-sonnet-4";
    }

    const taskRouting = config.model_routing?.task_routing;
    const taskConfig = taskRouting
      ? taskRouting[taskType as keyof typeof taskRouting]
      : undefined;
    if (taskConfig) {
      return taskConfig.model;
    }

    return config.model_routing?.default_model || "claude-sonnet-4";
  }

  /**
   * Get max tokens for a specific task type
   */
  public getMaxTokensForTask(taskType: TaskType): number {
    const config = this.loadConfig();
    const taskRouting = config.model_routing?.task_routing;
    const taskConfig = taskRouting
      ? taskRouting[taskType as keyof typeof taskRouting]
      : undefined;

    if (taskConfig) {
      return taskConfig.max_tokens;
    }

    return 4000; // Default
  }

  /**
   * Check if a feature is enabled
   */
  public isFeatureEnabled(feature: keyof FeaturesConfig): boolean {
    const config = this.loadConfig();
    const featureConfig = config[feature];

    if (
      typeof featureConfig === "object" &&
      featureConfig !== null &&
      "enabled" in featureConfig
    ) {
      return (featureConfig as { enabled: boolean }).enabled;
    }

    return false;
  }

  /**
   * Get token optimization settings
   */
  public getTokenOptimization(): TokenOptimizationConfig {
    return this.loadConfig().token_optimization;
  }

  /**
   * Get batch operation settings
   */
  public getBatchOperations(): BatchOperationsConfig {
    return this.loadConfig().batch_operations;
  }

  /**
   * Check if agent is disabled
   */
  public isAgentDisabled(agentName: string): boolean {
    const config = this.loadConfig();
    return config.agent_management.disabled_agents.includes(agentName);
  }

  /**
   * Get agent model assignment
   */
  public getAgentModel(agentName: string): string {
    const config = this.loadConfig();
    return (
      config.agent_management?.agent_models?.[agentName] ||
      config.model_routing?.default_model ||
      "claude-sonnet-4"
    );
  }

  /**
   * Merge loaded config with defaults
   */
  private mergeWithDefaults(
    configData: Partial<FeaturesConfig>,
  ): FeaturesConfig {
    const defaults = this.getDefaultConfig();

    return {
      ...defaults,
      ...configData,
      token_optimization: {
        ...defaults.token_optimization,
        ...configData.token_optimization,
        context_compression: {
          ...defaults.token_optimization.context_compression,
          ...configData.token_optimization?.context_compression,
        },
      },
      model_routing: {
        ...defaults.model_routing,
        ...configData.model_routing,
        task_routing: {
          ...defaults.model_routing.task_routing,
          ...configData.model_routing?.task_routing,
        },
      },
      batch_operations: {
        ...defaults.batch_operations,
        ...configData.batch_operations,
      },
      multi_agent_orchestration: {
        ...defaults.multi_agent_orchestration,
        ...configData.multi_agent_orchestration,
      },
      autonomous_reporting: {
        ...defaults.autonomous_reporting,
        ...configData.autonomous_reporting,
      },
      agent_management: {
        ...defaults.agent_management,
        ...configData.agent_management,
        performance_limits: {
          ...defaults.agent_management.performance_limits,
          ...configData.agent_management?.performance_limits,
        },
      },
      refactoring: {
        ...defaults.refactoring,
        ...configData.refactoring,
      },
      activity_logging: {
        ...defaults.activity_logging,
        ...configData.activity_logging,
      },
      security: {
        ...defaults.security,
        ...configData.security,
      },
      performance_monitoring: {
        ...defaults.performance_monitoring,
        ...configData.performance_monitoring,
        alerting: {
          ...defaults.performance_monitoring.alerting,
          ...configData.performance_monitoring?.alerting,
        },
      },
      caching: {
        ...defaults.caching,
        ...configData.caching,
      },
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): FeaturesConfig {
    return {
      version: "1.15.18",
      description: "StringRay Framework - Unified Feature Configuration",

      token_optimization: {
        enabled: true,
        max_context_tokens: 50000,
        prune_after_task: true,
        summarize_tool_outputs: true,
        context_compression: {
          enabled: true,
          threshold_tokens: 40000,
          compression_ratio: 0.5,
        },
      },

      model_routing: {
        enabled: true,
        // Use OpenCode's default model for all tasks
        // Task-based model selection can be configured in opencode.json
      },

      batch_operations: {
        enabled: true,
        prefer_sed_for_replacements: true,
        parallel_file_updates: true,
        max_concurrent_edits: 10,
        auto_batch_threshold: 5,
      },

      multi_agent_orchestration: {
        enabled: true,
        coordination_model: "async-multi-agent",
        max_concurrent_agents: 3,
        task_distribution_strategy: "capability-based",
        conflict_resolution: "expert-priority",
        progress_tracking: true,
        session_persistence: true,
      },

      autonomous_reporting: {
        enabled: false,
        interval_minutes: 60,
        auto_schedule: false,
        include_health_assessment: true,
        include_agent_activities: true,
        include_pipeline_operations: true,
        include_critical_issues: true,
        include_recommendations: true,
        report_retention_days: 30,
        notification_channels: ["console"],
      },

      agent_management: {
        disabled_agents: [],
        agent_models: {
          // Use default model from OpenCode configuration
        },
        performance_limits: {
          max_task_duration_ms: 30000,
          max_memory_usage_mb: 512,
          max_tokens_per_request: 16000,
        },
      },

      refactoring: {
        enabled: true,
        automatic_detection: true,
        require_user_approval: false,
        max_complexity_threshold: 80,
        safe_mode: true,
        batch_mode: true,
      },

      activity_logging: {
        enabled: false,  // Disabled by default to reduce verbose logging
        level: "warn",   // Only log warnings and errors by default
        include_performance_metrics: false,
        include_agent_states: false,
        include_token_usage: true,  // Keep token usage for debugging
        retention_days: 3,  // Shorter retention
        log_to_file: false,  // Don't log to file by default
        log_path: ".opencode/logs",
      },

      security: {
        enabled: true,
        prompt_sanitization: true,
        vulnerability_scanning: true,
        code_review_enforcement: true,
        security_score_threshold: 70,
      },

      performance_monitoring: {
        enabled: true,
        real_time_metrics: true,
        benchmark_tracking: true,
        token_tracking: true,
        cost_tracking: true,
        alerting: {
          enabled: true,
          performance_degradation_threshold: 20,
          error_rate_threshold: 5,
          cost_threshold_daily: 10.0,
        },
      },

      caching: {
        enabled: true,
        file_content_cache: true,
        search_result_cache: true,
        cache_ttl_seconds: 300,
        max_cache_size_mb: 50,
      },
    };
  }

  /**
   * Clear configuration cache
   */
  public clearCache(): void {
    this.cachedConfig = null;
    this.lastLoadTime = 0;
  }

  /**
   * Save current configuration to file
   */
  public saveConfig(config: Partial<FeaturesConfig>): void {
    try {
      const configPath = path.resolve(process.cwd(), this.featuresPath);
      const currentConfig = this.loadConfig();
      const mergedConfig = this.mergeWithDefaults({
        ...currentConfig,
        ...config,
      });

      fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2));
      this.clearCache();
    } catch (error) {
      // Silent fail - frameworkLogger not available here
      throw error;
    }
  }

  /**
   * Enable a feature
   */
  public enableFeature(feature: keyof FeaturesConfig): void {
    const config = this.loadConfig();
    const featureConfig = config[feature];

    if (
      typeof featureConfig === "object" &&
      featureConfig !== null &&
      "enabled" in featureConfig
    ) {
      (featureConfig as { enabled: boolean }).enabled = true;
      this.saveConfig({
        [feature]: featureConfig,
      } as unknown as Partial<FeaturesConfig>);
    }
  }

  /**
   * Disable a feature
   */
  public disableFeature(feature: keyof FeaturesConfig): void {
    const config = this.loadConfig();
    const featureConfig = config[feature];

    if (
      typeof featureConfig === "object" &&
      featureConfig !== null &&
      "enabled" in featureConfig
    ) {
      (featureConfig as { enabled: boolean }).enabled = false;
      this.saveConfig({
        [feature]: featureConfig,
      } as unknown as Partial<FeaturesConfig>);
    }
  }
}

// Export singleton instance
export const featuresConfigLoader = new FeaturesConfigLoader();

// Export convenience functions
export const getModelForTask = (taskType: TaskType) =>
  featuresConfigLoader.getModelForTask(taskType);

export const isFeatureEnabled = (feature: keyof FeaturesConfig) =>
  featuresConfigLoader.isFeatureEnabled(feature);

export const getTokenOptimization = () =>
  featuresConfigLoader.getTokenOptimization();

export const getBatchOperations = () =>
  featuresConfigLoader.getBatchOperations();
