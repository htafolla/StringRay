/**
 * StringRay AI v1.1.1 - Configuration Loader
 *
 * Loads and validates StringRay-specific configuration from oh-my-opencode.json
 *
 * @version 1.0.0
 * @since 2026-01-09
 */
export interface MultiAgentOrchestrationConfig {
    enabled: boolean;
    coordination_model: "async-multi-agent" | "sync-multi-agent";
    max_concurrent_agents: number;
    task_distribution_strategy: "capability-based" | "load-balanced" | "round-robin";
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
export interface StringRayConfig {
    multi_agent_orchestration: MultiAgentOrchestrationConfig;
    sisyphus_orchestrator: SisyphusOrchestratorConfig;
    disabled_agents: string[];
}
export declare class StringRayConfigLoader {
    private configPath;
    private cachedConfig;
    private cacheExpiry;
    private lastLoadTime;
    constructor(configPath?: string);
    /**
     * Load StringRay configuration from .strray/strray-config.json
     */
    loadConfig(): StringRayConfig;
    /**
     * Parse configuration data with validation
     */
    private parseConfig;
    /**
     * Parse multi-agent orchestration configuration
     */
    private parseMultiAgentConfig;
    /**
     * Parse Sisyphus orchestrator configuration
     */
    private parseSisyphusConfig;
    /**
     * Get default configuration
     */
    private getDefaultConfig;
    /**
     * Validate enum values
     */
    private validateEnum;
    /**
     * Clear configuration cache
     */
    clearCache(): void;
}
export declare const strRayConfigLoader: StringRayConfigLoader;
//# sourceMappingURL=config-loader.d.ts.map