/**
 * Universal Registry Bridge
 *
 * Connects StringRay to external agent registries.
 * Enables dynamic agent configuration loading from external sources.
 *
 * @version 1.0.0
 * @since 2026-02-14
 */

import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { frameworkLogger } from "../core/framework-logger.js";
import type { AgentConfig } from "../agents/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ExternalRegistryConfig {
  type: "file" | "http" | "npm";
  location: string;
  refreshInterval?: number; // milliseconds
}

export interface RegistryAgentDefinition {
  name: string;
  description: string;
  version: string;
  capabilities?: string[];
  config?: Record<string, unknown>;
}

export interface BridgeOptions {
  registries: ExternalRegistryConfig[];
  cacheDir?: string;
  autoRefresh?: boolean;
}

export class UniversalRegistryBridge {
  private registries: ExternalRegistryConfig[];
  private cacheDir: string;
  private autoRefresh: boolean;
  private cache: Map<string, RegistryAgentDefinition[]> = new Map();
  private logger = frameworkLogger;

  constructor(options: BridgeOptions) {
    this.registries = options.registries || [];
    this.cacheDir =
      options.cacheDir || join(__dirname, "../../.opencode/strray/registry-cache");
    this.autoRefresh = options.autoRefresh ?? true;
  }

  /**
   * Load agents from all configured registries
   */
  async loadAgents(): Promise<RegistryAgentDefinition[]> {
    const allAgents: RegistryAgentDefinition[] = [];

    for (const registry of this.registries) {
      try {
        const agents = await this.fetchFromRegistry(registry);
        allAgents.push(...agents);
        this.logger.log(
          "universal-registry-bridge",
          `Loaded ${agents.length} agents from ${registry.type} registry: ${registry.location}`,
          "info",
        );
      } catch (error) {
        this.logger.log(
          "universal-registry-bridge",
          `Failed to load from registry ${registry.location}: ${error}`,
          "info",
        );
      }
    }

    return allAgents;
  }

  /**
   * Fetch agents from a specific registry
   */
  private async fetchFromRegistry(
    registry: ExternalRegistryConfig,
  ): Promise<RegistryAgentDefinition[]> {
    // Check cache first
    const cacheKey = `${registry.type}:${registry.location}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !this.autoRefresh) {
      return cached;
    }

    let agents: RegistryAgentDefinition[];

    switch (registry.type) {
      case "file":
        agents = await this.loadFromFile(registry.location);
        break;
      case "http":
        agents = await this.loadFromHttp(registry.location);
        break;
      case "npm":
        agents = await this.loadFromNpm(registry.location);
        break;
      default:
        this.logger.log(
          "universal-registry-bridge",
          `Unknown registry type: ${registry.type}`,
          "info",
        );
        return [];
    }

    this.cache.set(cacheKey, agents);
    return agents;
  }

  /**
   * Load agents from a local file
   */
  private async loadFromFile(
    location: string,
  ): Promise<RegistryAgentDefinition[]> {
    const filePath = resolve(location);

    if (!existsSync(filePath)) {
      throw new Error(`Registry file not found: ${filePath}`);
    }

    const content = await readFile(filePath, "utf-8");
    const ext = location.toLowerCase();

    if (ext.endsWith(".json")) {
      return JSON.parse(content);
    } else if (ext.endsWith(".yaml") || ext.endsWith(".yml")) {
      // Simple YAML parser for agent definitions
      return this.parseYamlAgents(content);
    }

    throw new Error(`Unsupported file format: ${location}`);
  }

  /**
   * Simple YAML parser for agent definitions
   * Handles basic agent registry format
   */
  private parseYamlAgents(content: string): RegistryAgentDefinition[] {
    const agents: RegistryAgentDefinition[] = [];
    const lines = content.split("\n");
    let currentAgent: RegistryAgentDefinition | null = null;
    let inAgent = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("agents:")) {
        continue;
      }

      // Check for new agent entry (name: xxx)
      const nameMatch = trimmed.match(/^-\s*name:\s*(.+)$/);
      if (nameMatch && nameMatch[1]) {
        if (inAgent && currentAgent) {
          agents.push(currentAgent);
        }
        currentAgent = {
          name: nameMatch[1].trim(),
          description: "",
          version: "1.15.11",
        };
        inAgent = true;
        continue;
      }

      if (inAgent && currentAgent) {
        const descMatch = trimmed.match(/^description:\s*(.+)$/);
        if (descMatch && descMatch[1]) {
          currentAgent.description = descMatch[1].trim();
          continue;
        }

        const versionMatch = trimmed.match(/^version:\s*(.+)$/);
        if (versionMatch && versionMatch[1]) {
          currentAgent.version = versionMatch[1].trim();
          continue;
        }
      }
    }

    // Push last agent
    if (inAgent && currentAgent) {
      agents.push(currentAgent);
    }

    return agents;
  }

  /**
   * Load agents from HTTP endpoint
   */
  private async loadFromHttp(
    location: string,
  ): Promise<RegistryAgentDefinition[]> {
    try {
      const response = await fetch(location);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch from ${location}: ${error}`);
    }
  }

  /**
   * Load agents from npm package
   */
  private async loadFromNpm(
    packageName: string,
  ): Promise<RegistryAgentDefinition[]> {
    try {
      const response = await fetch(
        `https://registry.npmjs.org/${packageName}/latest`,
      );
      if (!response.ok) {
        throw new Error(`npm API error: ${response.status}`);
      }
      const pkg = await response.json();

      // Look for agent definitions in package exports
      if (pkg.stringray?.agents) {
        return pkg.stringray.agents;
      }

      return [];
    } catch (error) {
      throw new Error(`Failed to load npm package ${packageName}: ${error}`);
    }
  }

  /**
   * Convert registry definition to AgentConfig
   */
  toAgentConfig(registryDef: RegistryAgentDefinition): Partial<AgentConfig> {
    return {
      name: registryDef.name,
      description: registryDef.description,
      capabilities: registryDef.capabilities || [],
    };
  }

  /**
   * Get cached agents from a specific registry
   */
  getCached(
    registryType: string,
    location: string,
  ): RegistryAgentDefinition[] | undefined {
    return this.cache.get(`${registryType}:${location}`);
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log(
      "universal-registry-bridge",
      "Registry cache cleared",
      "info",
    );
  }

  /**
   * Add a new registry dynamically
   */
  addRegistry(registry: ExternalRegistryConfig): void {
    this.registries.push(registry);
    this.logger.log(
      "universal-registry-bridge",
      `Added registry: ${registry.type}:${registry.location}`,
      "info",
    );
  }

  /**
   * Get all configured registries
   */
  getRegistries(): ExternalRegistryConfig[] {
    return [...this.registries];
  }
}

/**
 * Create a bridge from integration config
 */
export async function createRegistryBridge(
  configPath?: string,
): Promise<UniversalRegistryBridge> {
  const defaultPath = resolve(
    process.cwd(),
    ".stringray/integration/registries.json",
  );
  const path = configPath || defaultPath;

  let registries: ExternalRegistryConfig[] = [];

  if (existsSync(path)) {
    try {
      const content = await readFile(path, "utf-8");
      const config = JSON.parse(content);
      registries = config.registries || [];
    } catch (error) {
      frameworkLogger.log(
        "universal-registry-bridge",
        `Failed to load registry config from ${path}: ${error}`,
        "info",
      );
    }
  }

  return new UniversalRegistryBridge({
    registries,
    autoRefresh: true,
  });
}

/**
 * Default bridge instance for quick access
 */
let defaultBridge: UniversalRegistryBridge | null = null;

export function getDefaultBridge(): UniversalRegistryBridge {
  if (!defaultBridge) {
    defaultBridge = new UniversalRegistryBridge({
      registries: [],
      autoRefresh: false,
    });
  }
  return defaultBridge;
}
