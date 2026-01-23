/**
 * StringRay AI v1.1.1 - Agent Configuration Validator
 *
 * Validates agent configuration files for correctness and completeness
 * ensuring all required fields are present and properly formatted.
 *
 * @version 1.0.0
 * @since 2026-01-23
 */
export interface AgentConfig {
    name: string;
    description: string;
    version: string;
    model: string;
    mode: "primary" | "subagent";
    logging?: {
        level: string;
        format: string;
        destinations: string[];
        retention_days?: number;
        sensitive_data_filtering?: boolean;
        audit_trail?: boolean;
    };
    processor_pipeline?: Array<{
        name: string;
        type: string;
        priority: "low" | "medium" | "high" | "critical";
        timeout_ms?: number;
        retry_attempts?: number;
    }>;
    capabilities?: string[];
    error_handling?: {
        retry_attempts?: number;
        circuit_breaker?: {
            enabled?: boolean;
            failure_threshold?: number;
            recovery_timeout_ms?: number;
        };
        fallback_strategy?: string;
        alert_on_failure?: boolean;
    };
    performance?: {
        timeout_ms?: number;
        concurrency_limit?: number;
        memory_limit_mb?: number;
        cpu_limit_percent?: number;
    };
    security?: {
        sandboxed_execution?: boolean;
        permission_level?: string;
        data_classification?: string;
        encryption_required?: boolean;
    };
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    config: AgentConfig | null;
}
export declare class AgentConfigValidator {
    private readonly requiredFields;
    private readonly validModes;
    private readonly validLogLevels;
    private readonly validLogFormats;
    private readonly validPriorities;
    private readonly validProcessorTypes;
    /**
     * Validate agent configuration from file
     */
    validateConfigFile(filePath: string): Promise<ValidationResult>;
    /**
     * Validate agent configuration object
     */
    validateConfig(config: any): ValidationResult;
    /**
     * Validate logging configuration
     */
    private validateLoggingConfig;
    /**
     * Validate processor pipeline configuration
     */
    private validateProcessorPipeline;
    /**
     * Validate performance configuration
     */
    private validatePerformanceConfig;
    /**
     * Validate security configuration
     */
    private validateSecurityConfig;
    /**
     * Validate error handling configuration
     */
    private validateErrorHandlingConfig;
    /**
     * Validate all agent configurations in a directory
     */
    validateAllAgentConfigs(agentConfigDir?: string): Promise<{
        results: Array<{
            file: string;
            result: ValidationResult;
        }>;
        summary: {
            total: number;
            valid: number;
            invalid: number;
        };
    }>;
}
export declare const agentConfigValidator: AgentConfigValidator;
//# sourceMappingURL=agent-config-validator.d.ts.map