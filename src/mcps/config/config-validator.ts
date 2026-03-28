/**
 * Configuration Validator
 * 
 * Validates MCP server configurations for completeness and correctness.
 * 
 * Extracted from mcp-client.ts as part of Phase 2 refactoring.
 */

import { IServerConfig } from '../types/index.js';

/**
 * Result of a configuration validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates MCP server configurations
 */
export class ConfigValidator {
  /**
   * Validate a single server configuration
   */
  validate(config: IServerConfig): ValidationResult {
    const errors: string[] = [];

    // Validate serverName
    if (!config.serverName || typeof config.serverName !== 'string') {
      errors.push('serverName is required and must be a string');
    }

    // Validate command
    if (!config.command || typeof config.command !== 'string') {
      errors.push('command is required and must be a string');
    }

    // Validate args
    if (!config.args || !Array.isArray(config.args)) {
      errors.push('args is required and must be an array');
    } else {
      // Check that all args are strings
      const nonStringArgs = config.args.filter(arg => typeof arg !== 'string');
      if (nonStringArgs.length > 0) {
        errors.push('all args must be strings');
      }
    }

    // Validate timeout (optional but must be number if provided)
    if (config.timeout !== undefined && typeof config.timeout !== 'number') {
      errors.push('timeout must be a number when provided');
    }

    // Validate timeout is positive
    if (config.timeout !== undefined && config.timeout <= 0) {
      errors.push('timeout must be a positive number');
    }

    // Validate env (optional but must be object if provided)
    if (config.env !== undefined) {
      if (typeof config.env !== 'object' || config.env === null) {
        errors.push('env must be an object when provided');
      } else {
        // Check that all env values are strings
        const nonStringEnvValues = Object.entries(config.env).filter(
          ([, value]) => typeof value !== 'string'
        );
        if (nonStringEnvValues.length > 0) {
          errors.push('all env values must be strings');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate multiple server configurations
   */
  validateAll(configs: IServerConfig[]): ValidationResult {
    const allErrors: string[] = [];

    for (const config of configs) {
      const result = this.validate(config);
      if (!result.valid) {
        allErrors.push(...result.errors.map(e => `${config.serverName || 'unknown'}: ${e}`));
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Validate and filter - returns only valid configs
   */
  filterValid(configs: IServerConfig[]): IServerConfig[] {
    return configs.filter(config => this.validate(config).valid);
  }

  /**
   * Get validation errors for all invalid configs
   */
  getValidationErrors(configs: IServerConfig[]): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    for (const config of configs) {
      const result = this.validate(config);
      if (!result.valid) {
        errors[config.serverName || 'unknown'] = result.errors;
      }
    }

    return errors;
  }
}

/**
 * Default singleton instance of the config validator
 */
export const defaultConfigValidator = new ConfigValidator();
