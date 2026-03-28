/**
 * MCP Configuration Layer
 * 
 * Centralized configuration management for MCP servers.
 * 
 * This module provides:
 * - ServerConfigRegistry: Manages server configurations
 * - ConfigLoader: Loads configurations from files
 * - ConfigValidator: Validates configuration correctness
 * 
 * @example
 * ```typescript
 * import { defaultServerRegistry, ConfigLoader, ConfigValidator } from './config/index.js';
 * 
 * // Get a server config
 * const config = defaultServerRegistry.get('code-review');
 * 
 * // Load from file
 * const loader = new ConfigLoader();
 * const result = await loader.load();
 * 
 * // Validate
 * const validator = new ConfigValidator();
 * const validation = validator.validate(config);
 * ```
 */

export { ServerConfigRegistry, defaultServerRegistry } from './server-config-registry.js';
export { ConfigLoader, defaultConfigLoader } from './config-loader.js';
export { ConfigValidator, defaultConfigValidator } from './config-validator.js';
