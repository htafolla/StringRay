/**
 * Integration Registry
 *
 * Central registry for managing StringRay integrations.
 * Provides registration, loading, unloading, health checking, and stats retrieval.
 *
 * @version 1.0.0
 * @since 2026-03-15
 */

import { EventEmitter } from "events";
import {
  type IIntegration,
  type IntegrationConfig,
  type HealthResult,
  type IntegrationStats,
  type IntegrationStatus,
  createUnhealthyResult,
  createIntegrationStats,
  isIntegration,
  IntegrationError,
} from "./types.js";
import { BaseIntegration } from "./Integration.js";
import { frameworkLogger, generateJobId } from "../../core/framework-logger.js";

/**
 * Integration configuration from config file
 */
export interface IntegrationsConfig {
  integrations: Record<
    string,
    {
      enabled: boolean;
      config?: Record<string, unknown>;
    }
  >;
}

/**
 * Registry event types
 */
export type RegistryEventType =
  | "integration-registered"
  | "integration-unregistered"
  | "integration-loaded"
  | "integration-unloaded"
  | "load-complete"
  | "unload-complete"
  | "health-check-complete"
  | "error";

/**
 * Registry event
 */
export interface RegistryEvent {
  type: RegistryEventType;
  timestamp: number;
  integrationName?: string;
  data?: Record<string, unknown>;
  error?: Error;
}

/**
 * Loaded integration metadata
 */
interface LoadedIntegration {
  instance: IIntegration;
  config: IntegrationConfig;
  loadedAt: number;
}

/**
 * Error thrown when integration is not found in registry
 */
export class IntegrationNotFoundError extends Error {
  constructor(integrationName: string) {
    super(`Integration '${integrationName}' not found in registry`);
    this.name = "IntegrationNotFoundError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when integration is already registered
 */
export class IntegrationAlreadyRegisteredError extends Error {
  constructor(integrationName: string) {
    super(`Integration '${integrationName}' is already registered`);
    this.name = "IntegrationAlreadyRegisteredError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Integration Registry
 *
 * Manages registration, loading, and lifecycle of integrations.
 *
 * @example
 * ```typescript
 * const registry = new IntegrationRegistry();
 *
 * // Register an integration
 * registry.register('my-integration', new MyIntegration());
 *
 * // Get an integration
 * const integration = registry.get('my-integration');
 *
 * // List all integrations
 * const names = registry.list();
 *
 * // Load from config
 * await registry.loadAll({
 *   integrations: {
 *     'my-integration': { enabled: true }
 *   }
 * });
 * ```
 */
export class IntegrationRegistry extends EventEmitter {
  /** Map of registered integrations (name -> instance) */
  private registeredIntegrations: Map<string, IIntegration> = new Map();

  /** Map of loaded integrations (name -> metadata) */
  private loadedIntegrations: Map<string, LoadedIntegration> = new Map();

  /** Job ID for registry operations */
  private jobId: string;

  /**
   * Create a new IntegrationRegistry
   */
  constructor() {
    super();
    this.jobId = generateJobId("integration-registry");
  }

  // ==========================================================================
  // Registration Methods
  // ==========================================================================

  /**
   * Register an integration with the registry
   *
   * @param name - Unique name for the integration
   * @param integration - Integration instance to register
   * @throws IntegrationAlreadyRegisteredError if name already registered
   */
  register(name: string, integration: IIntegration): void {
    if (this.registeredIntegrations.has(name)) {
      throw new IntegrationAlreadyRegisteredError(name);
    }

    // Validate it's a proper integration
    if (!isIntegration(integration)) {
      throw new IntegrationError(
        `Invalid integration object for '${name}'. Must implement IIntegration interface.`,
        "INVALID_INTEGRATION",
        false,
        { name },
      );
    }

    this.registeredIntegrations.set(name, integration);

    this.emitEvent("integration-registered", {
      name,
      version: integration.version,
    });

    frameworkLogger.log(
      "integration-registry",
      `Registered integration: ${name} v${integration.version}`,
      "info",
      { name, version: integration.version },
      this.jobId,
    ).catch(() => {});
  }

  /**
   * Unregister an integration from the registry
   *
   * @param name - Name of the integration to unregister
   * @throws IntegrationNotFoundError if integration not found
   */
  unregister(name: string): void {
    const integration = this.registeredIntegrations.get(name);

    if (!integration) {
      throw new IntegrationNotFoundError(name);
    }

    // If loaded, unload first
    if (this.loadedIntegrations.has(name)) {
      this.unload(name).catch((error) => {
        frameworkLogger.log(
          "integration-registry",
          `Error unloading integration '${name}' during unregister: ${error}`,
          "error",
          { name, error: String(error) },
          this.jobId,
        ).catch(() => {});
      });
    }

    this.registeredIntegrations.delete(name);

    this.emitEvent("integration-unregistered", { name });

    frameworkLogger.log(
      "integration-registry",
      `Unregistered integration: ${name}`,
      "info",
      { name },
      this.jobId,
    ).catch(() => {});
  }

  // ==========================================================================
  // Accessor Methods
  // ==========================================================================

  /**
   * Get an integration by name
   *
   * @param name - Name of the integration
   * @returns Integration instance or undefined if not found
   */
  get(name: string): IIntegration | undefined {
    return this.registeredIntegrations.get(name);
  }

  /**
   * Get a loaded integration by name
   *
   * @param name - Name of the loaded integration
   * @returns Loaded integration metadata or undefined if not loaded
   */
  getLoaded(name: string): LoadedIntegration | undefined {
    return this.loadedIntegrations.get(name);
  }

  /**
   * List all registered integration names
   *
   * @returns Array of integration names
   */
  list(): string[] {
    return Array.from(this.registeredIntegrations.keys());
  }

  /**
   * List all loaded integration names
   *
   * @returns Array of loaded integration names
   */
  listLoaded(): string[] {
    return Array.from(this.loadedIntegrations.keys());
  }

  /**
   * Check if an integration is registered
   *
   * @param name - Name to check
   * @returns true if registered
   */
  isRegistered(name: string): boolean {
    return this.registeredIntegrations.has(name);
  }

  /**
   * Check if an integration is loaded
   *
   * @param name - Name to check
   * @returns true if loaded
   */
  isLoaded(name: string): boolean {
    return this.loadedIntegrations.has(name);
  }

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  /**
   * Load an integration by name
   *
   * @param name - Integration name
   * @param config - Optional integration configuration
   * @throws IntegrationNotFoundError if integration not registered
   */
  async load(name: string, config?: Partial<IntegrationConfig>): Promise<void> {
    // Check if already loaded
    if (this.loadedIntegrations.has(name)) {
      frameworkLogger.log(
        "integration-registry",
        `Integration '${name}' already loaded`,
        "warning",
        { name },
        this.jobId,
      ).catch(() => {});
      return;
    }

    const integration = this.registeredIntegrations.get(name);

    if (!integration) {
      throw new IntegrationNotFoundError(name);
    }

    // Merge configuration
    const mergedConfig: IntegrationConfig = {
      enabled: true,
      debug: false,
      logLevel: "info",
      ...config,
    };

    try {
      // Initialize the integration
      await integration.initialize(mergedConfig);

      // Store in loaded map
      this.loadedIntegrations.set(name, {
        instance: integration,
        config: mergedConfig,
        loadedAt: Date.now(),
      });

      this.emitEvent("integration-loaded", {
        name,
        version: integration.version,
      });

      frameworkLogger.log(
        "integration-registry",
        `Loaded integration: ${name}`,
        "success",
        { name, version: integration.version },
        this.jobId,
      ).catch(() => {});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.emitEvent("error", {
        name,
        error: errorMessage,
      }, error instanceof Error ? error : undefined);

      throw new IntegrationError(
        `Failed to load integration '${name}': ${errorMessage}`,
        "LOAD_FAILED",
        true,
        { name, error: errorMessage },
      );
    }
  }

  /**
   * Unload an integration by name
   *
   * @param name - Integration name
   * @throws IntegrationNotFoundError if integration not loaded
   */
  async unload(name: string): Promise<void> {
    const loaded = this.loadedIntegrations.get(name);

    if (!loaded) {
      throw new IntegrationNotFoundError(`${name} (not loaded)`);
    }

    try {
      // Shutdown the integration
      await loaded.instance.shutdown();

      // Remove from loaded map
      this.loadedIntegrations.delete(name);

      this.emitEvent("integration-unloaded", { name });

      frameworkLogger.log(
        "integration-registry",
        `Unloaded integration: ${name}`,
        "success",
        { name },
        this.jobId,
      ).catch(() => {});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Still remove from loaded map even if shutdown failed
      this.loadedIntegrations.delete(name);

      this.emitEvent("error", {
        name,
        error: errorMessage,
        phase: "unload",
      }, error instanceof Error ? error : undefined);

      frameworkLogger.log(
        "integration-registry",
        `Error unloading integration '${name}': ${errorMessage}`,
        "error",
        { name, error: errorMessage },
        this.jobId,
      ).catch(() => {});
    }
  }

  /**
   * Load all enabled integrations from configuration
   *
   * @param config - Integrations configuration
   */
  async loadAll(config: IntegrationsConfig): Promise<void> {
    const entries = Object.entries(config.integrations);
    const enabledEntries = entries.filter(([, entry]) => entry.enabled);

    frameworkLogger.log(
      "integration-registry",
      `Loading ${enabledEntries.length} enabled integrations...`,
      "info",
      { total: entries.length, enabled: enabledEntries.length },
      this.jobId,
    ).catch(() => {});

    const results: Array<{ name: string; success: boolean; error?: string }> = [];

    // Load all enabled integrations
    for (const [name, entry] of enabledEntries) {
      try {
        // Check if registered
        if (!this.registeredIntegrations.has(name)) {
          frameworkLogger.log(
            "integration-registry",
            `Skipping '${name}': not registered`,
            "warning",
            { name },
            this.jobId,
          ).catch(() => {});
          results.push({ name, success: false, error: "Not registered" });
          continue;
        }

        // Extract config from entry
        const integrationConfig: Partial<IntegrationConfig> = {
          ...(entry.config as Partial<IntegrationConfig>),
        };

        await this.load(name, integrationConfig);
        results.push({ name, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ name, success: false, error: errorMessage });

        frameworkLogger.log(
          "integration-registry",
          `Failed to load integration '${name}': ${errorMessage}`,
          "error",
          { name, error: errorMessage },
          this.jobId,
        ).catch(() => {});
      }
    }

    this.emitEvent("load-complete", {
      total: enabledEntries.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    frameworkLogger.log(
      "integration-registry",
      `Load complete: ${succeeded} succeeded, ${failed} failed`,
      failed > 0 ? "warning" : "success",
      { succeeded, failed },
      this.jobId,
    ).catch(() => {});
  }

  /**
   * Unload all loaded integrations
   */
  async unloadAll(): Promise<void> {
    const loadedNames = Array.from(this.loadedIntegrations.keys());

    frameworkLogger.log(
      "integration-registry",
      `Unloading ${loadedNames.length} integrations...`,
      "info",
      { count: loadedNames.length },
      this.jobId,
    ).catch(() => {});

    const results: Array<{ name: string; success: boolean; error?: string }> = [];

    // Unload all loaded integrations
    for (const name of loadedNames) {
      try {
        await this.unload(name);
        results.push({ name, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ name, success: false, error: errorMessage });
      }
    }

    this.emitEvent("unload-complete", {
      total: loadedNames.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    frameworkLogger.log(
      "integration-registry",
      `Unload complete: ${succeeded} succeeded, ${failed} failed`,
      failed > 0 ? "warning" : "success",
      { succeeded, failed },
      this.jobId,
    ).catch(() => {});
  }

  // ==========================================================================
  // Health and Stats Methods
  // ==========================================================================

  /**
   * Get health status of all loaded integrations
   *
   * @returns Record of integration names to health results
   */
  async healthCheckAll(): Promise<Record<string, HealthResult>> {
    const results: Record<string, HealthResult> = {};

    for (const [name, loaded] of this.loadedIntegrations) {
      try {
        results[name] = await loaded.instance.healthCheck();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results[name] = createUnhealthyResult(`Health check failed: ${errorMessage}`, {
          error: errorMessage,
        });
      }
    }

    this.emitEvent("health-check-complete", {
      total: Object.keys(results).length,
      healthy: Object.values(results).filter((r) => r.healthy).length,
      unhealthy: Object.values(results).filter((r) => !r.healthy).length,
    });

    return results;
  }

  /**
   * Get health status of a specific integration
   *
   * @param name - Integration name
   * @returns Health result
   * @throws IntegrationNotFoundError if integration not loaded
   */
  async healthCheck(name: string): Promise<HealthResult> {
    const loaded = this.loadedIntegrations.get(name);

    if (!loaded) {
      throw new IntegrationNotFoundError(`${name} (not loaded)`);
    }

    return loaded.instance.healthCheck();
  }

  /**
   * Get statistics from all loaded integrations
   *
   * @returns Record of integration names to stats
   */
  getAllStats(): Record<string, IntegrationStats> {
    const stats: Record<string, IntegrationStats> = {};

    for (const [name, loaded] of this.loadedIntegrations) {
      stats[name] = loaded.instance.getStats();
    }

    return stats;
  }

  /**
   * Get statistics from a specific integration
   *
   * @param name - Integration name
   * @returns Integration stats
   * @throws IntegrationNotFoundError if integration not loaded
   */
  getStats(name: string): IntegrationStats {
    const loaded = this.loadedIntegrations.get(name);

    if (!loaded) {
      throw new IntegrationNotFoundError(`${name} (not loaded)`);
    }

    return loaded.instance.getStats();
  }

  /**
   * Get status of a specific integration
   *
   * @param name - Integration name
   * @returns Integration status
   */
  getStatus(name: string): IntegrationStatus | undefined {
    const integration = this.registeredIntegrations.get(name);
    return integration?.status;
  }

  /**
   * Get all integration statuses
   *
   * @returns Record of integration names to statuses
   */
  getAllStatuses(): Record<string, IntegrationStatus> {
    const statuses: Record<string, IntegrationStatus> = {};

    for (const [name, integration] of this.registeredIntegrations) {
      statuses[name] = integration.status;
    }

    return statuses;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Clear all registered integrations (not loaded ones)
   */
  clear(): void {
    const names = Array.from(this.registeredIntegrations.keys());

    for (const name of names) {
      // Only unregister if not loaded (loaded ones will be handled by unloadAll)
      if (!this.loadedIntegrations.has(name)) {
        this.registeredIntegrations.delete(name);
      }
    }

    frameworkLogger.log(
      "integration-registry",
      "Cleared non-loaded integrations",
      "info",
      { cleared: names.length - this.loadedIntegrations.size },
      this.jobId,
    ).catch(() => {});
  }

  /**
   * Get registry statistics
   *
   * @returns Registry statistics
   */
  getRegistryStats(): {
    registered: number;
    loaded: number;
    byStatus: Record<IntegrationStatus, number>;
  } {
    const byStatus: Record<IntegrationStatus, number> = {
      uninitialized: 0,
      initializing: 0,
      initialized: 0,
      error: 0,
      "shutting-down": 0,
      shutdown: 0,
    };

    for (const [, integration] of this.registeredIntegrations) {
      byStatus[integration.status]++;
    }

    return {
      registered: this.registeredIntegrations.size,
      loaded: this.loadedIntegrations.size,
      byStatus,
    };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Emit a registry event
   */
  private emitEvent(
    type: RegistryEventType,
    data: Record<string, unknown> = {},
    error?: Error,
  ): void {
    const event: RegistryEvent = {
      type,
      timestamp: Date.now(),
      ...data,
      error,
    };

    this.emit(type, event);
    this.emit("event", event);
  }
}

// ==========================================================================
// Auto-Discovery
// ==========================================================================

/**
 * Integration discovery result
 */
export interface DiscoveredIntegration {
  name: string;
  path: string;
  module: unknown;
}

/**
 * Auto-discover integrations from directory index files
 *
 * This function scans the integrations directory for integration modules
 * and returns their discovered information.
 *
 * @param integrationsPath - Path to integrations directory
 * @returns Array of discovered integrations
 *
 * @example
 * ```typescript
 * const discovered = await discoverIntegrations('./src/integrations');
 * for (const d of discovered) {
 *   console.log(`Found: ${d.name} at ${d.path}`);
 * }
 * ```
 */
export async function discoverIntegrations(
  integrationsPath: string,
): Promise<DiscoveredIntegration[]> {
  const discovered: DiscoveredIntegration[] = [];

  try {
    // Dynamic import of fs and path for file scanning
    const fs = await import("fs");
    const path = await import("path");

    // Check if directory exists
    if (!fs.existsSync(integrationsPath)) {
      frameworkLogger.log(
        "integration-registry",
        `Integrations directory not found: ${integrationsPath}`,
        "warning",
        { path: integrationsPath },
      ).catch(() => {});
      return discovered;
    }

    // Read directory contents
    const entries = fs.readdirSync(integrationsPath, { withFileTypes: true });

    // Find directories with index.ts
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const integrationDir = path.join(integrationsPath, entry.name);
      const indexPath = path.join(integrationDir, "index.ts");

      // Skip base directory
      if (entry.name === "base" || entry.name === "core") continue;

      if (fs.existsSync(indexPath)) {
        try {
          // Dynamic import the module
          const module = await import(indexPath);

          // Try to get integration name from exports
          let name = entry.name;

          // Look for default export or named export with "Integration" suffix
          if (module.default && isIntegration(module.default)) {
            name = module.default.name;
          } else {
            const keys = Object.keys(module);
            const integrationKey = keys.find(
              (k) =>
                module[k] &&
                typeof module[k] === "object" &&
                "name" in (module[k] as object) &&
                "version" in (module[k] as object),
            );
            if (integrationKey) {
              name = (module[integrationKey] as IIntegration).name;
            }
          }

          discovered.push({
            name,
            path: indexPath,
            module,
          });

          frameworkLogger.log(
            "integration-registry",
            `Discovered integration: ${name}`,
            "info",
            { name, path: indexPath },
          ).catch(() => {});
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          frameworkLogger.log(
            "integration-registry",
            `Failed to load integration from ${indexPath}: ${errorMessage}`,
            "warning",
            { path: indexPath, error: errorMessage },
          ).catch(() => {});
        }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    frameworkLogger.log(
      "integration-registry",
      `Error during integration discovery: ${errorMessage}`,
      "error",
      { error: errorMessage },
    ).catch(() => {});
  }

  return discovered;
}

/**
 * Auto-register integrations from discovered modules
 *
 * @param registry - Registry instance to register with
 * @param integrationsPath - Path to integrations directory
 * @returns Number of integrations registered
 *
 * @example
 * ```typescript
 * const registry = new IntegrationRegistry();
 * const count = await autoRegisterIntegrations(registry, './src/integrations');
 * console.log(`Registered ${count} integrations`);
 * ```
 */
export async function autoRegisterIntegrations(
  registry: IntegrationRegistry,
  integrationsPath: string,
): Promise<number> {
  const discovered = await discoverIntegrations(integrationsPath);
  let registered = 0;

  for (const d of discovered) {
    try {
      // Try to find the integration export
      let integration: IIntegration | undefined;

      // Check default export
      if (d.module && typeof d.module === "object" && "default" in d.module) {
        const maybe = (d.module as Record<string, unknown>).default;
        if (isIntegration(maybe)) {
          integration = maybe as IIntegration;
        }
      }

      // Check named exports
      if (!integration) {
        const keys = Object.keys(d.module as Record<string, unknown>);
        for (const key of keys) {
          const maybe = (d.module as Record<string, unknown>)[key];
          if (isIntegration(maybe)) {
            integration = maybe as IIntegration;
            break;
          }
        }
      }

      if (integration) {
        registry.register(integration.name, integration);
        registered++;
      }
    } catch (error) {
      // Skip integrations that fail to register (already registered, etc.)
      const errorMessage = error instanceof Error ? error.message : String(error);
      frameworkLogger.log(
        "integration-registry",
        `Failed to register integration '${d.name}': ${errorMessage}`,
        "warning",
        { name: d.name, error: errorMessage },
      ).catch(() => {});
    }
  }

  return registered;
}

// ==========================================================================
// Re-export Types from types.js
// ==========================================================================

// Types are re-exported from types.js - import directly from './types.js'