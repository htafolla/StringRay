/**
 * StringRay AI v1.1.1 - Agent Configuration Validator
 *
 * Validates agent configuration files for correctness and completeness
 * ensuring all required fields are present and properly formatted.
 *
 * @version 1.0.0
 * @since 2026-01-23
 */
import { frameworkLogger } from "../framework-logger";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
export class AgentConfigValidator {
    requiredFields = ["name", "description", "version", "model", "mode"];
    validModes = ["primary", "subagent"];
    validLogLevels = ["debug", "info", "warn", "error"];
    validLogFormats = ["json", "text"];
    validPriorities = ["low", "medium", "high", "critical"];
    validProcessorTypes = ["validation", "orchestration", "monitoring"];
    /**
     * Validate agent configuration from file
     */
    async validateConfigFile(filePath) {
        const jobId = `validate-config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return {
                    valid: false,
                    errors: [`Configuration file does not exist: ${filePath}`],
                    warnings: [],
                    config: null,
                };
            }
            // Read and parse file
            const content = fs.readFileSync(filePath, "utf8");
            let config;
            if (filePath.endsWith(".yml") || filePath.endsWith(".yaml")) {
                config = yaml.parse(content);
            }
            else if (filePath.endsWith(".json")) {
                config = JSON.parse(content);
            }
            else {
                return {
                    valid: false,
                    errors: [`Unsupported file format: ${path.extname(filePath)}`],
                    warnings: [],
                    config: null,
                };
            }
            const result = this.validateConfig(config);
            frameworkLogger.log("agent-config-validator", `Configuration validation ${result.valid ? "passed" : "failed"} for ${filePath}`, result.valid ? "success" : "error", { jobId, filePath, errorCount: result.errors.length, warningCount: result.warnings.length });
            return {
                ...result,
                config: result.valid ? config : null,
            };
        }
        catch (error) {
            frameworkLogger.log("agent-config-validator", `Configuration validation error for ${filePath}`, "error", { jobId, error: error instanceof Error ? error.message : String(error) });
            return {
                valid: false,
                errors: [`Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`],
                warnings: [],
                config: null,
            };
        }
    }
    /**
     * Validate agent configuration object
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];
        // Check required fields
        for (const field of this.requiredFields) {
            if (!config[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        // Validate mode
        if (config.mode && !this.validModes.includes(config.mode)) {
            errors.push(`Invalid mode '${config.mode}'. Must be one of: ${this.validModes.join(", ")}`);
        }
        // Validate logging configuration
        if (config.logging) {
            this.validateLoggingConfig(config.logging, errors, warnings);
        }
        // Validate processor pipeline
        if (config.processor_pipeline) {
            this.validateProcessorPipeline(config.processor_pipeline, errors, warnings);
        }
        // Validate performance configuration
        if (config.performance) {
            this.validatePerformanceConfig(config.performance, errors, warnings);
        }
        // Validate security configuration
        if (config.security) {
            this.validateSecurityConfig(config.security, errors, warnings);
        }
        // Validate error handling configuration
        if (config.error_handling) {
            this.validateErrorHandlingConfig(config.error_handling, errors, warnings);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            config: null,
        };
    }
    /**
     * Validate logging configuration
     */
    validateLoggingConfig(logging, errors, warnings) {
        if (logging.level && !this.validLogLevels.includes(logging.level)) {
            errors.push(`Invalid log level '${logging.level}'. Must be one of: ${this.validLogLevels.join(", ")}`);
        }
        if (logging.format && !this.validLogFormats.includes(logging.format)) {
            errors.push(`Invalid log format '${logging.format}'. Must be one of: ${this.validLogFormats.join(", ")}`);
        }
        if (logging.destinations && !Array.isArray(logging.destinations)) {
            errors.push("logging.destinations must be an array");
        }
        if (logging.retention_days && (typeof logging.retention_days !== "number" || logging.retention_days < 1)) {
            errors.push("logging.retention_days must be a positive number");
        }
    }
    /**
     * Validate processor pipeline configuration
     */
    validateProcessorPipeline(pipeline, errors, warnings) {
        if (!Array.isArray(pipeline)) {
            errors.push("processor_pipeline must be an array");
            return;
        }
        pipeline.forEach((processor, index) => {
            if (!processor.name) {
                errors.push(`processor_pipeline[${index}]: missing 'name' field`);
            }
            if (!processor.type) {
                errors.push(`processor_pipeline[${index}]: missing 'type' field`);
            }
            else if (!this.validProcessorTypes.includes(processor.type)) {
                errors.push(`processor_pipeline[${index}]: invalid type '${processor.type}'. Must be one of: ${this.validProcessorTypes.join(", ")}`);
            }
            if (!processor.priority) {
                errors.push(`processor_pipeline[${index}]: missing 'priority' field`);
            }
            else if (!this.validPriorities.includes(processor.priority)) {
                errors.push(`processor_pipeline[${index}]: invalid priority '${processor.priority}'. Must be one of: ${this.validPriorities.join(", ")}`);
            }
            if (processor.timeout_ms && (typeof processor.timeout_ms !== "number" || processor.timeout_ms < 0)) {
                errors.push(`processor_pipeline[${index}]: timeout_ms must be a non-negative number`);
            }
            if (processor.retry_attempts && (typeof processor.retry_attempts !== "number" || processor.retry_attempts < 0)) {
                errors.push(`processor_pipeline[${index}]: retry_attempts must be a non-negative number`);
            }
        });
    }
    /**
     * Validate performance configuration
     */
    validatePerformanceConfig(performance, errors, warnings) {
        if (performance.timeout_ms && (typeof performance.timeout_ms !== "number" || performance.timeout_ms < 0)) {
            errors.push("performance.timeout_ms must be a non-negative number");
        }
        if (performance.concurrency_limit && (typeof performance.concurrency_limit !== "number" || performance.concurrency_limit < 1)) {
            errors.push("performance.concurrency_limit must be a positive number");
        }
        if (performance.memory_limit_mb && (typeof performance.memory_limit_mb !== "number" || performance.memory_limit_mb < 1)) {
            errors.push("performance.memory_limit_mb must be a positive number");
        }
        if (performance.cpu_limit_percent && (typeof performance.cpu_limit_percent !== "number" || performance.cpu_limit_percent < 1 || performance.cpu_limit_percent > 100)) {
            errors.push("performance.cpu_limit_percent must be between 1 and 100");
        }
    }
    /**
     * Validate security configuration
     */
    validateSecurityConfig(security, errors, warnings) {
        if (security.permission_level && typeof security.permission_level !== "string") {
            errors.push("security.permission_level must be a string");
        }
        if (security.data_classification && typeof security.data_classification !== "string") {
            errors.push("security.data_classification must be a string");
        }
    }
    /**
     * Validate error handling configuration
     */
    validateErrorHandlingConfig(errorHandling, errors, warnings) {
        if (errorHandling.retry_attempts && (typeof errorHandling.retry_attempts !== "number" || errorHandling.retry_attempts < 0)) {
            errors.push("error_handling.retry_attempts must be a non-negative number");
        }
        if (errorHandling.circuit_breaker) {
            const cb = errorHandling.circuit_breaker;
            if (cb.failure_threshold && (typeof cb.failure_threshold !== "number" || cb.failure_threshold < 1)) {
                errors.push("error_handling.circuit_breaker.failure_threshold must be a positive number");
            }
            if (cb.recovery_timeout_ms && (typeof cb.recovery_timeout_ms !== "number" || cb.recovery_timeout_ms < 0)) {
                errors.push("error_handling.circuit_breaker.recovery_timeout_ms must be a non-negative number");
            }
        }
    }
    /**
     * Validate all agent configurations in a directory
     */
    async validateAllAgentConfigs(agentConfigDir = ".opencode/agents") {
        const results = [];
        try {
            const files = fs.readdirSync(agentConfigDir);
            const configFiles = files.filter(f => f.endsWith(".yml") || f.endsWith(".yaml") || f.endsWith(".json"));
            for (const file of configFiles) {
                const filePath = path.join(agentConfigDir, file);
                const result = await this.validateConfigFile(filePath);
                results.push({ file, result });
            }
        }
        catch (error) {
            frameworkLogger.log("agent-config-validator", "Failed to read agent config directory", "error", { error: error instanceof Error ? error.message : String(error) });
        }
        const summary = {
            total: results.length,
            valid: results.filter(r => r.result.valid).length,
            invalid: results.length - results.filter(r => r.result.valid).length,
        };
        frameworkLogger.log("agent-config-validator", `Validated ${summary.total} agent configurations: ${summary.valid} valid, ${summary.invalid} invalid`, summary.invalid > 0 ? "error" : "info");
        return { results, summary };
    }
}
// Export singleton instance
export const agentConfigValidator = new AgentConfigValidator();
//# sourceMappingURL=agent-config-validator.js.map