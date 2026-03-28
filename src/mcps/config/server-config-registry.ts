/**
 * Server Configuration Registry
 * 
 * Manages server configurations with support for default servers
 * and runtime configuration registration.
 * 
 * Extracted from mcp-client.ts as part of Phase 2 refactoring.
 */

import { IServerConfig } from '../types/index.js';

/**
 * Registry for managing MCP server configurations
 */
export class ServerConfigRegistry {
  private configs: Map<string, IServerConfig> = new Map();

  constructor() {
    this.registerDefaultConfigs();
  }

  /**
   * Register all default server configurations
   */
  private registerDefaultConfigs(): void {
    // For consumer projects: default to node_modules/strray-ai/dist/
    // For local dev: use STRRAY_DEV_PATH env var (e.g., "dist")
    const basePath = process.env.STRRAY_DEV_PATH
      ? process.env.STRRAY_DEV_PATH
      : 'node_modules/strray-ai/dist';

    // Code Review Server
    this.register({
      serverName: 'code-review',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/code-review.server.js`],
      timeout: 30000,
    });

    // Security Audit Server
    this.register({
      serverName: 'security-audit',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/security-audit.server.js`],
      timeout: 45000,
    });

    // Performance Optimization Server
    this.register({
      serverName: 'performance-optimization',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/performance-optimization.server.js`],
      timeout: 30000,
    });

    // Testing Strategy Server
    this.register({
      serverName: 'testing-strategy',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/testing-strategy.server.js`],
      timeout: 25000,
    });

    // Researcher Server
    this.register({
      serverName: 'researcher',
      command: 'node',
      args: [`${basePath}/mcps/researcher.server.js`],
      timeout: 60000,
    });

    // Framework Help Server
    this.register({
      serverName: 'framework-help',
      command: 'node',
      args: [`${basePath}/mcps/framework-help.server.js`],
      timeout: 15000,
    });

    // Skill Invocation Server
    this.register({
      serverName: 'skill-invocation',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/skill-invocation.server.js`],
      timeout: 30000,
    });

    // Code Analyzer Server
    this.register({
      serverName: 'session-management',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/session-management.server.js`],
      timeout: 30000,
    });

    // Code Analyzer Server
    this.register({
      serverName: 'code-analyzer',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/code-analyzer.server.js`],
      timeout: 45000,
    });

    // Enforcer Server
    this.register({
      serverName: 'enforcer',
      command: 'node',
      args: [`${basePath}/mcps/enforcer-tools.server.js`],
      timeout: 30000,
    });

    // Orchestrator Server
    this.register({
      serverName: 'orchestrator',
      command: 'node',
      args: [`${basePath}/mcps/orchestrator.server.js`],
      timeout: 60000,
    });

    // Estimation Validator Server
    this.register({
      serverName: 'estimation-validator',
      command: 'node',
      args: [`${basePath}/mcps/estimation.server.js`],
      timeout: 30000,
    });

    // Architect Server
    this.register({
      serverName: 'architect',
      command: 'node',
      args: [`${basePath}/mcps/architect-tools.server.js`],
      timeout: 45000,
    });

    // Bug Triage Specialist Server
    this.register({
      serverName: 'bug-triage-specialist',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/bug-triage-specialist.server.js`],
      timeout: 30000,
    });

    // Log Monitor Server
    this.register({
      serverName: 'log-monitor',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/log-monitor.server.js`],
      timeout: 30000,
    });

    // Aliases to match features.json agent names
    // Code Reviewer (alias for code-review)
    this.register({
      serverName: 'code-reviewer',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/code-review.server.js`],
      timeout: 30000,
    });

    // Security Auditor (alias for security-audit)
    this.register({
      serverName: 'security-auditor',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/security-audit.server.js`],
      timeout: 45000,
    });

    // Refactorer Server
    this.register({
      serverName: 'refactorer',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/refactoring-strategies.server.js`],
      timeout: 40000,
    });

    // Testing Lead (alias for testing-strategy)
    this.register({
      serverName: 'testing-lead',
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/testing-strategy.server.js`],
      timeout: 30000,
    });
  }

  /**
   * Register a new server configuration
   */
  register(config: IServerConfig): void {
    this.configs.set(config.serverName, config);
  }

  /**
   * Get a server configuration by name
   */
  get(serverName: string): IServerConfig | undefined {
    return this.configs.get(serverName);
  }

  /**
   * Check if a server configuration exists
   */
  has(serverName: string): boolean {
    return this.configs.has(serverName);
  }

  /**
   * Get all registered server configurations
   */
  getAll(): IServerConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get all registered server names
   */
  getServerNames(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Clear all registered configurations
   */
  clear(): void {
    this.configs.clear();
  }

  /**
   * Create a dynamic configuration for an unknown server
   * Uses the knowledge-skills directory as default location
   */
  createDynamicConfig(serverName: string): IServerConfig {
    const basePath = process.env.STRRAY_DEV_PATH
      ? process.env.STRRAY_DEV_PATH
      : 'node_modules/strray-ai/dist';

    return {
      serverName,
      command: 'node',
      args: [`${basePath}/mcps/knowledge-skills/${serverName}.server.js`],
      timeout: 30000,
    };
  }
}

/**
 * Default singleton instance of the server config registry
 */
export const defaultServerRegistry = new ServerConfigRegistry();
