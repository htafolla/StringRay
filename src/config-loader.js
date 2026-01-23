/**
 * StringRay AI v1.1.1 - Configuration Loader
 *
 * Loads and validates StringRay-specific configuration from oh-my-opencode.json
 *
 * @version 1.0.0
 * @since 2026-01-09
 */
import * as fs from "fs";
import * as path from "path";
export class StringRayConfigLoader {
    configPath;
    cachedConfig = null;
    cacheExpiry = 30000; // 30 seconds
    lastLoadTime = 0;
    constructor(configPath) {
        this.configPath = configPath || ".strray/config.json";
    }
    /**
     * Load StringRay configuration from .strray/strray-config.json
     */
    loadConfig() {
        const now = Date.now();
        // Return cached config if still valid
        if (this.cachedConfig && now - this.lastLoadTime < this.cacheExpiry) {
            return this.cachedConfig;
        }
        try {
            const configPath = path.resolve(process.cwd(), this.configPath);
            if (!fs.existsSync(configPath)) {
                return this.getDefaultConfig();
            }
            const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            const config = this.parseConfig(configData);
            this.cachedConfig = config;
            this.lastLoadTime = now;
            return config;
        }
        catch (error) {
            console.error(`❌ Failed to load StringRay config:`, error);
            return this.getDefaultConfig();
        }
    }
    /**
     * Parse configuration data with validation
     */
    parseConfig(configData) {
        // Handle null/undefined config data
        if (!configData) {
            return this.getDefaultConfig();
        }
        return {
            multi_agent_orchestration: this.parseMultiAgentConfig(configData.multi_agent_orchestration),
            sisyphus_orchestrator: this.parseSisyphusConfig(configData.sisyphus_orchestrator),
            disabled_agents: Array.isArray(configData.disabled_agents)
                ? configData.disabled_agents
                : [],
        };
    }
    /**
     * Parse multi-agent orchestration configuration
     */
    parseMultiAgentConfig(config) {
        return {
            enabled: config?.enabled ?? true,
            coordination_model: this.validateEnum(config?.coordination_model, ["async-multi-agent", "sync-multi-agent"], "async-multi-agent"),
            max_concurrent_agents: Math.max(1, Math.min(10, config?.max_concurrent_agents ?? 3)),
            task_distribution_strategy: this.validateEnum(config?.task_distribution_strategy, ["capability-based", "load-balanced", "round-robin"], "capability-based"),
            conflict_resolution: this.validateEnum(config?.conflict_resolution, ["expert-priority", "majority-vote", "consensus"], "expert-priority"),
            progress_tracking: config?.progress_tracking ?? true,
            session_persistence: config?.session_persistence ?? true,
        };
    }
    /**
     * Parse Sisyphus orchestrator configuration
     */
    parseSisyphusConfig(config) {
        return {
            enabled: config?.enabled ?? true,
            relentless_execution: config?.relentless_execution ?? true,
            todo_enforcement: config?.todo_enforcement ?? true,
            max_retries: Math.max(0, Math.min(10, config?.max_retries ?? 3)),
            backoff_strategy: this.validateEnum(config?.backoff_strategy, ["exponential", "linear", "fixed"], "exponential"),
            progress_persistence: config?.progress_persistence ?? true,
        };
    }
    /**
     * Get default configuration
     */
    getDefaultConfig() {
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
    validateEnum(value, allowedValues, defaultValue) {
        return allowedValues.includes(value) ? value : defaultValue;
    }
    /**
     * Clear configuration cache
     */
    clearCache() {
        this.cachedConfig = null;
        this.lastLoadTime = 0;
    }
}
// Export singleton instance
export const strRayConfigLoader = new StringRayConfigLoader();
//# sourceMappingURL=config-loader.js.map