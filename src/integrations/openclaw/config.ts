/**
 * OpenClaw Configuration Loader
 *
 * Handles loading, validation, and management of OpenClaw integration configuration.
 *
 * @version 1.0.0
 * @since 2026-03-14
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  OpenClawIntegrationConfig,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
} from './types.js';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: OpenClawIntegrationConfig = {
  gatewayUrl: 'ws://127.0.0.1:18789',
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  apiServer: {
    enabled: true,
    port: 18431,
    host: '127.0.0.1',
  },
  hooks: {
    enabled: true,
    toolBefore: true,
    toolAfter: true,
    includeArgs: true,
    includeResult: true,
  },
  enabled: true,
  debug: false,
  logLevel: 'info',
};

/**
 * Environment variable mappings
 */
const ENV_MAPPINGS: Record<string, string> = {
  OPENCLAW_GATEWAY_URL: 'gatewayUrl',
  OPENCLAW_AUTH_TOKEN: 'authToken',
  OPENCLAW_DEVICE_ID: 'deviceId',
  OPENCLAW_API_KEY: 'apiServer.apiKey',
  OPENCLAW_API_PORT: 'apiServer.port',
  OPENCLAW_ENABLED: 'enabled',
  OPENCLAW_DEBUG: 'debug',
};

/**
 * Configuration loader class
 */
export class OpenClawConfigLoader {
  private config: OpenClawIntegrationConfig | null = null;
  private configPath: string;
  private loadedAt: number = 0;

  constructor(configPath?: string) {
    this.configPath = configPath || 
      path.join(process.cwd(), '.strray', 'config', 'openclaw.json');
  }

  /**
   * Load configuration from file with environment variable overrides
   */
  load(): OpenClawIntegrationConfig {
    try {
      // Load from file if exists
      let userConfig: Partial<OpenClawIntegrationConfig> = {};
      
      if (fs.existsSync(this.configPath)) {
        const configContent = fs.readFileSync(this.configPath, 'utf-8');
        userConfig = JSON.parse(configContent);
      }

      // Apply environment variable overrides
      userConfig = this.applyEnvironmentOverrides(userConfig);

      // Merge with defaults
      this.config = this.mergeWithDefaults(userConfig);

      // Validate configuration
      const validation = this.validateConfig(this.config);
      if (!validation.valid) {
        throw new Error(
          `Configuration validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      this.loadedAt = Date.now();
      return this.config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to load OpenClaw configuration: ${error.message}`
        );
      }
      throw new Error('Failed to load OpenClaw configuration: Unknown error');
    }
  }

  /**
   * Reload configuration from file
   */
  reload(): OpenClawIntegrationConfig {
    this.config = null;
    this.loadedAt = 0;
    return this.load();
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenClawIntegrationConfig {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }

  /**
   * Get configuration age in milliseconds
   */
  getConfigAge(): number {
    if (!this.loadedAt) return 0;
    return Date.now() - this.loadedAt;
  }

  /**
   * Check if configuration needs reload
   */
  needsReload(maxAgeMs: number = 60000): boolean {
    return this.getConfigAge() > maxAgeMs;
  }

  /**
   * Apply environment variable overrides
   */
  private applyEnvironmentOverrides(
    config: Partial<OpenClawIntegrationConfig>
  ): Partial<OpenClawIntegrationConfig> {
    const result = { ...config };

    for (const [envVar, configPath] of Object.entries(ENV_MAPPINGS)) {
      const envValue = process.env[envVar];
      
      if (envValue !== undefined) {
        // Parse value based on expected type
        let parsedValue: unknown = envValue;
        
        // Handle boolean values
        if (envValue.toLowerCase() === 'true') {
          parsedValue = true;
        } else if (envValue.toLowerCase() === 'false') {
          parsedValue = false;
        }
        
        // Handle numeric values
        else if (/^\d+$/.test(envValue)) {
          parsedValue = parseInt(envValue, 10);
        }

        // Set nested value
        const keys = configPath.split('.');
        let current: Record<string, unknown> = result as unknown as Record<string, unknown>;
        
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i]!;
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key] as Record<string, unknown>;
        }
        
        current[keys[keys.length - 1]!] = parsedValue;
      }
    }

    return result;
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(
    userConfig: Partial<OpenClawIntegrationConfig>
  ): OpenClawIntegrationConfig {
    // Handle nested defaults
    const apiServerDefaults: OpenClawIntegrationConfig['apiServer'] = DEFAULT_CONFIG.apiServer || { enabled: true, port: 18431, host: '127.0.0.1' };
    const hooksDefaults: OpenClawIntegrationConfig['hooks'] = DEFAULT_CONFIG.hooks || { enabled: true, toolBefore: true, toolAfter: true, includeArgs: true, includeResult: true };

    const result: OpenClawIntegrationConfig = {
      gatewayUrl: userConfig.gatewayUrl || DEFAULT_CONFIG.gatewayUrl || 'ws://127.0.0.1:18789',
      autoReconnect: userConfig.autoReconnect ?? DEFAULT_CONFIG.autoReconnect ?? true,
      maxReconnectAttempts: userConfig.maxReconnectAttempts ?? DEFAULT_CONFIG.maxReconnectAttempts ?? 5,
      reconnectDelay: userConfig.reconnectDelay ?? DEFAULT_CONFIG.reconnectDelay ?? 1000,
      apiServer: {
        enabled: userConfig.apiServer?.enabled ?? apiServerDefaults.enabled ?? true,
        port: userConfig.apiServer?.port ?? apiServerDefaults.port ?? 18431,
        host: userConfig.apiServer?.host ?? apiServerDefaults.host ?? '127.0.0.1',
        ...(userConfig.apiServer?.apiKey !== undefined ? { apiKey: userConfig.apiServer.apiKey } : {}),
      },
      hooks: {
        enabled: userConfig.hooks?.enabled ?? hooksDefaults.enabled ?? true,
        toolBefore: userConfig.hooks?.toolBefore ?? hooksDefaults.toolBefore ?? true,
        toolAfter: userConfig.hooks?.toolAfter ?? hooksDefaults.toolAfter ?? true,
        includeArgs: userConfig.hooks?.includeArgs ?? hooksDefaults.includeArgs ?? true,
        includeResult: userConfig.hooks?.includeResult ?? hooksDefaults.includeResult ?? true,
      },
      enabled: userConfig.enabled ?? DEFAULT_CONFIG.enabled ?? true,
      debug: userConfig.debug ?? DEFAULT_CONFIG.debug ?? false,
      logLevel: userConfig.logLevel ?? DEFAULT_CONFIG.logLevel ?? 'info',
    };

    if (userConfig.authToken !== undefined) result.authToken = userConfig.authToken;
    if (userConfig.deviceId !== undefined) result.deviceId = userConfig.deviceId;
    if (userConfig.deviceKeyPair !== undefined) result.deviceKeyPair = userConfig.deviceKeyPair;

    return result;
  }

  /**
   * Validate configuration
   */
  validateConfig(config: OpenClawIntegrationConfig): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];
    const warnings: ConfigValidationWarning[] = [];

    // Validate gateway URL
    if (!config.gatewayUrl) {
      errors.push({
        field: 'gatewayUrl',
        message: 'gatewayUrl is required',
        code: 'MISSING_REQUIRED',
      });
    } else {
      try {
        const url = new URL(config.gatewayUrl);
        if (!['ws:', 'wss:'].includes(url.protocol)) {
          errors.push({
            field: 'gatewayUrl',
            message: 'gatewayUrl must be a WebSocket URL (ws:// or wss://)',
            code: 'INVALID_PROTOCOL',
          });
        }
      } catch {
        errors.push({
          field: 'gatewayUrl',
          message: 'gatewayUrl is not a valid URL',
          code: 'INVALID_URL',
        });
      }
    }

    // Validate API server port
    if (config.apiServer?.enabled) {
      if (!config.apiServer.port || config.apiServer.port < 1 || config.apiServer.port > 65535) {
        errors.push({
          field: 'apiServer.port',
          message: 'apiServer.port must be between 1 and 65535',
          code: 'INVALID_PORT',
        });
      }

      // Warn if binding to non-localhost
      if (config.apiServer.host && !['localhost', '127.0.0.1', '::1'].includes(config.apiServer.host)) {
        warnings.push({
          field: 'apiServer.host',
          message: 'Binding API server to non-localhost address may expose API externally',
        });
      }
    }

    // Validate reconnection settings
    if (config.maxReconnectAttempts < 0) {
      errors.push({
        field: 'maxReconnectAttempts',
        message: 'maxReconnectAttempts must be non-negative',
        code: 'INVALID_VALUE',
      });
    }

    if (config.reconnectDelay < 0) {
      errors.push({
        field: 'reconnectDelay',
        message: 'reconnectDelay must be non-negative',
        code: 'INVALID_VALUE',
      });
    }

    // Validate log level
    const validLogLevels = ['error', 'warn', 'info', 'debug'];
    if (config.logLevel && !validLogLevels.includes(config.logLevel)) {
      errors.push({
        field: 'logLevel',
        message: `logLevel must be one of: ${validLogLevels.join(', ')}`,
        code: 'INVALID_VALUE',
      });
    }

    // Warnings for potentially problematic configs
    if (config.apiServer?.enabled && !config.apiServer.apiKey) {
      warnings.push({
        field: 'apiServer.apiKey',
        message: 'API server is enabled without an API key - consider adding one for security',
      });
    }

    if (config.autoReconnect && config.maxReconnectAttempts === 0) {
      warnings.push({
        field: 'autoReconnect',
        message: 'autoReconnect is true but maxReconnectAttempts is 0',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Check if configuration file exists
   */
  configExists(): boolean {
    return fs.existsSync(this.configPath);
  }

  /**
   * Create sample configuration file
   */
  createSampleConfig(): void {
    const configDir = path.dirname(this.configPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const sampleConfig: OpenClawIntegrationConfig = {
      gatewayUrl: 'ws://127.0.0.1:18789',
      // SECURITY WARNING: authToken MUST be configured before use.
      // Leaving this empty will prevent authenticated connections.
      authToken: process.env.OPENCLAW_AUTH_TOKEN || '',
      deviceId: process.env.OPENCLAW_DEVICE_ID || 'your-device-id',
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      apiServer: {
        enabled: true,
        port: 18431,
        host: '127.0.0.1',
        ...(process.env.OPENCLAW_API_KEY ? { apiKey: process.env.OPENCLAW_API_KEY } : {}),
      },
      hooks: {
        enabled: true,
        toolBefore: true,
        toolAfter: true,
        includeArgs: true,
        includeResult: true,
      },
      enabled: true, // Disabled by default until configured
      debug: false,
      logLevel: 'info',
    };

    fs.writeFileSync(
      this.configPath,
      JSON.stringify(sampleConfig, null, 2) + os.EOL,
      'utf-8',
    );
  }

  /**
   * Get config for API server only
   */
  getAPIServerConfig() {
    const config = this.getConfig();
    return config.apiServer;
  }

  /**
   * Get config for hooks only
   */
  getHooksConfig() {
    const config = this.getConfig();
    return config.hooks;
  }

  /**
   * Check if integration is enabled
   */
  isEnabled(): boolean {
    return this.getConfig().enabled;
  }

  /**
   * Check if API server is enabled
   */
  isAPIServerEnabled(): boolean {
    return this.getConfig().apiServer?.enabled ?? false;
  }

  /**
   * Check if hooks are enabled
   */
  areHooksEnabled(): boolean {
    const config = this.getConfig();
    return config.hooks?.enabled ?? false;
  }
}

// Export singleton instance
export const configLoader = new OpenClawConfigLoader();

// Export factory function
export function createConfigLoader(configPath?: string): OpenClawConfigLoader {
  return new OpenClawConfigLoader(configPath);
}
