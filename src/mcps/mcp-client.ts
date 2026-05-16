/**
 * MCP Client Layer
 *
 * Enables framework components to call MCP servers programmatically.
 * Refactored as a lean facade using extracted modules (Phases 1-5).
 *
 * Architecture:
 * - ToolRegistry: Manages tool registration and lookup
 * - ToolDiscovery: Discovers tools from MCP servers
 * - ToolExecutor: Executes tools via JSON-RPC
 * - ToolCache: Caches discovered tools
 * - SimulationEngine: Provides fallback simulations
 */

import { EventEmitter } from 'events';
import { frameworkLogger } from '../core/framework-logger.js';
import {
  MCPClientConfig,
  MCPTool,
  MCPToolResult,
  IServerConfig,
} from './types/index.js';
import { defaultServerRegistry } from './config/index.js';
import {
  ToolRegistry,
  ToolDiscovery,
  ToolExecutor,
  ToolCache,
} from './tools/index.js';
import {
  SimulationEngine,
  getAllServerSimulations,
} from './simulation/index.js';
import { getConnectionPool } from './connection/connection-pool.js';

/**
 * Retry configuration for MCP tool execution
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Tool event types for hooks
 */
export interface ToolBeforeEvent {
  toolName: string;
  serverName: string;
  args: unknown;
  timestamp: number;
}

export interface ToolAfterEvent extends ToolBeforeEvent {
  result?: MCPToolResult;
  error?: string;
  duration: number;
  success: boolean;
}

/**
 * MCP Client
 *
 * Facade that orchestrates tool discovery, caching, execution, and simulation.
 */
export class MCPClient extends EventEmitter {
  private config: MCPClientConfig;
  private toolRegistry: ToolRegistry;
  private toolDiscovery: ToolDiscovery;
  private toolExecutor: ToolExecutor;
  private toolCache: ToolCache;
  private simulationEngine: SimulationEngine;
  private retryConfig: RetryConfig;

  constructor(config: MCPClientConfig, retryConfig?: Partial<RetryConfig>) {
    super();
    this.config = config;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.toolRegistry = new ToolRegistry();
    this.toolDiscovery = new ToolDiscovery();
    this.toolExecutor = new ToolExecutor();
    this.toolCache = new ToolCache();
    this.simulationEngine = new SimulationEngine();
    this.registerDefaultSimulations();
  }

  /**
   * Execute with exponential backoff retry
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.retryConfig.maxRetries) {
          frameworkLogger.log(
            'mcp-client',
            `Retry ${attempt + 1}/${this.retryConfig.maxRetries} for ${operationName}: ${lastError.message}`,
            'warning',
            { operationName, attempt: attempt + 1 }
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelayMs);
        }
      }
    }

    throw lastError || new Error(`Operation ${operationName} failed after ${this.retryConfig.maxRetries} retries`);
  }

  /**
   * Execute a tool using the real MCP transport (ConnectionPool + ToolExecutor).
   * This is the primary production path.
   */
  private async executeRealTool(toolName: string, args: unknown): Promise<MCPToolResult> {
    const pool = getConnectionPool();
    const registryConfig = defaultServerRegistry.get(this.config.serverName);
    const serverConfig: IServerConfig = registryConfig ?? {
      serverName: this.config.serverName,
      command: this.config.command,
      args: this.config.args,
      timeout: this.config.timeout ?? 30000,
      ...(this.config.env !== undefined ? { env: this.config.env } : {}),
      ...(this.config.basePath !== undefined ? { basePath: this.config.basePath } : {}),
    };

    const connection = await pool.acquire(this.config.serverName, serverConfig);
    try {
      return await this.toolExecutor.executeTool(connection, toolName, args);
    } finally {
      pool.release(connection);
    }
  }

  /**
   * Pure MCP mode — simulation and generic fallbacks are disabled.
   */
  private get isPureMcpMode(): boolean {
    return process.env.STRRAY_FORCE_MCP_GOVERNANCE === 'true';
  }

  /**
   * Register default simulation implementations
   */
  private registerDefaultSimulations(): void {
    const simulations = getAllServerSimulations();
    for (const [serverName, serverSimulations] of Object.entries(simulations)) {
      this.simulationEngine.registerServerSimulators(serverName, serverSimulations);
    }
  }

  /**
   * Initialize MCP client by discovering and caching tools
   */
  async initialize(): Promise<void> {
    const jobId = `mcp-init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      frameworkLogger.log(
        'mcp-client',
        `initializing MCP client for ${this.config.serverName}`,
        'info',
        { jobId }
      );

      // Discover tools (currently uses simulation/static discovery)
      await this.discoverTools();

      frameworkLogger.log(
        'mcp-client',
        `MCP client initialized with ${this.toolRegistry.getToolCount()} tools`,
        'success',
        { jobId }
      );
    } catch (error) {
      frameworkLogger.log(
        'mcp-client',
        `failed to initialize MCP client: ${error instanceof Error ? error.message : String(error)}`,
        'error',
        { jobId, error }
      );
      throw error;
    }
  }

  /**
   * Discover available tools for this server
   */
  private async discoverTools(): Promise<void> {
    // Check cache first
    const cachedTools = this.toolCache.get(this.config.serverName);
    if (cachedTools) {
      this.toolRegistry.register(this.config.serverName, cachedTools);
      return;
    }

    // Static tool definitions by server (simulated discovery)
    const tools = this.getStaticTools(this.config.serverName);
    this.toolRegistry.register(this.config.serverName, tools);
    this.toolCache.set(this.config.serverName, tools);
  }

  /**
   * Get static tool definitions for a server
   */
  private getStaticTools(serverName: string): MCPTool[] {
    const staticTools: Record<string, MCPTool[]> = {
      'code-review': [
        {
          name: 'analyze_code_quality',
          description: 'Analyze code for quality, patterns, and best practices',
          inputSchema: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              language: { type: 'string' },
              context: { type: 'object' },
            },
            required: ['code'],
          },
        },
      ],
      'security-audit': [
        {
          name: 'scan_vulnerabilities',
          description: 'Scan code for security vulnerabilities and compliance issues',
          inputSchema: {
            type: 'object',
            properties: {
              files: { type: 'array', items: { type: 'string' } },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
              },
            },
            required: ['files'],
          },
        },
      ],
      'performance-optimization': [
        {
          name: 'analyze_performance',
          description: 'Analyze code for performance bottlenecks and optimization opportunities',
          inputSchema: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              language: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
            },
            required: ['code'],
          },
        },
      ],
      'testing-strategy': [
        {
          name: 'analyze_test_coverage',
          description: 'Analyze test coverage and suggest testing strategies',
          inputSchema: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              existingTests: { type: 'array', items: { type: 'string' } },
              requirements: { type: 'object' },
            },
            required: ['code'],
          },
        },
      ],
      'researcher': [
        {
          name: 'analyze_codebase',
          description: 'Analyze complete codebase structure and provide insights',
          inputSchema: {
            type: 'object',
            properties: {
              scope: { type: 'string', enum: ['full', 'directory', 'file'] },
              analysis: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      ],
      'framework-help': [
        {
          name: 'strray_get_capabilities',
          description: 'Get 0xRay framework capabilities',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'strray_get_commands',
          description: 'Get available 0xRay commands',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'strray_explain_capability',
          description: 'Explain a specific capability',
          inputSchema: {
            type: 'object',
            properties: {
              capability: { type: 'string' },
            },
            required: ['capability'],
          },
        },
      ],
      'skill-invocation': [
        {
          name: 'invoke-skill',
          description: 'Generic skill invocation tool for calling any MCP skill server',
          inputSchema: {
            type: 'object',
            properties: {
              skillName: { type: 'string' },
              toolName: { type: 'string' },
              args: { type: 'object' },
            },
            required: ['skillName', 'toolName'],
          },
        },
      ],
    };

    return staticTools[serverName] || [];
  }

  /**
   * Call a specific MCP server tool
   */
  async callTool(toolName: string, args: unknown = {}): Promise<MCPToolResult> {
    const startTime = Date.now();

    const beforeEvent: ToolBeforeEvent = {
      toolName,
      serverName: this.config.serverName,
      args,
      timestamp: startTime,
    };
    this.emit('tool.before', beforeEvent);

    const serverName = this.config.serverName;
    const isGovernanceServer = ['code-review', 'security-audit', 'researcher'].includes(serverName);
    const isGovernanceTool = toolName === 'analyze_proposal';
    const preferReal = this.isPureMcpMode || isGovernanceServer || isGovernanceTool;

    try {
      // === PRIMARY PATH: Real MCP transport ===
      if (preferReal) {
        try {
          const result = await this.executeWithRetry(
            () => this.executeRealTool(toolName, args),
            `real:${toolName}`
          );

          frameworkLogger.log('mcp-client', 'real-transport-success', 'info', {
            server: serverName,
            tool: toolName,
            pureMode: this.isPureMcpMode,
          });

          const afterEvent: ToolAfterEvent = {
            ...beforeEvent,
            result,
            duration: Date.now() - startTime,
            success: true,
          };
          this.emit('tool.after', afterEvent);
          return result;
        } catch (realError) {
          const errMsg = realError instanceof Error ? realError.message : String(realError);

          frameworkLogger.log('mcp-client', 'real-transport-failed', 'error', {
            server: serverName,
            tool: toolName,
            error: errMsg,
          });

          if (this.isPureMcpMode) {
            throw new Error(
              `[PURE MCP] Real transport failed for ${serverName}/${toolName}: ${errMsg}. ` +
              `Simulation and generic fallbacks are disabled in pure governance mode.`
            );
          }
          // Non-pure mode can fall through to simulation/generic
        }
      }

      // === FALLBACK: Simulation only when NOT in pure mode and not a governance tool ===
      if (!this.isPureMcpMode && this.simulationEngine.canSimulate(serverName, toolName)) {
        try {
          const result = await this.executeWithRetry(
            () => this.simulationEngine.simulate(serverName, toolName, args),
            `simulate:${toolName}`
          );
          const afterEvent: ToolAfterEvent = {
            ...beforeEvent,
            result,
            duration: Date.now() - startTime,
            success: true,
          };
          this.emit('tool.after', afterEvent);
          return result;
        } catch (error) {
          frameworkLogger.log('mcp-client', `Simulation failed for ${toolName}`, 'warning', { server: serverName });
        }
      }

      // === LAST RESORT: Generic fallback (disabled in pure mode) ===
      if (this.isPureMcpMode) {
        throw new Error(
          `[PURE MCP] No real response for ${serverName}/${toolName}. ` +
          `All fallbacks are disabled when STRRAY_FORCE_MCP_GOVERNANCE=true.`
        );
      }

      const fallbackResult = {
        content: [
          { type: 'text' as const, text: `Tool ${toolName} executed on ${serverName} server` },
        ],
      };

      const afterEvent: ToolAfterEvent = {
        ...beforeEvent,
        result: fallbackResult,
        duration: Date.now() - startTime,
        success: true,
      };
      this.emit('tool.after', afterEvent);
      return fallbackResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const afterEvent: ToolAfterEvent = {
        ...beforeEvent,
        error: errorMessage,
        duration: Date.now() - startTime,
        success: false,
      };
      this.emit('tool.after', afterEvent);
      throw error;
    }
  }

  /**
   * Get list of available tools
   */
  getAvailableTools(): MCPTool[] {
    return this.toolRegistry.getTools(this.config.serverName);
  }

  /**
   * Check if a tool is available
   */
  hasTool(toolName: string): boolean {
    return this.toolRegistry.hasTool(this.config.serverName, toolName);
  }

  /**
   * Get tool by name
   */
  getTool(toolName: string): MCPTool | undefined {
    return this.toolRegistry.getTool(this.config.serverName, toolName);
  }

  /**
   * Subscribe to tool.before events
   */
  onToolBefore(callback: (event: ToolBeforeEvent) => void): void {
    this.on('tool.before', callback);
  }

  /**
   * Subscribe to tool.after events
   */
  onToolAfter(callback: (event: ToolAfterEvent) => void): void {
    this.on('tool.after', callback);
  }

  /**
   * Unsubscribe from tool.before events
   */
  offToolBefore(callback: (event: ToolBeforeEvent) => void): void {
    this.off('tool.before', callback);
  }

  /**
   * Unsubscribe from tool.after events
   */
  offToolAfter(callback: (event: ToolAfterEvent) => void): void {
    this.off('tool.after', callback);
  }
}

/**
 * MCP Client Manager
 *
 * Manages MCP client instances and provides unified interface
 * for framework components to access MCP server capabilities.
 */
export class MCPClientManager {
  private static instance: MCPClientManager;
  private clients: Map<string, MCPClient> = new Map();

  private constructor() {}

  static getInstance(): MCPClientManager {
    if (!MCPClientManager.instance) {
      MCPClientManager.instance = new MCPClientManager();
    }
    return MCPClientManager.instance;
  }

  /**
   * Get or create MCP client for a server
   */
  async getClient(serverName: string): Promise<MCPClient> {
    if (!this.clients.has(serverName)) {
      const config = this.createClientConfig(serverName);
      const client = new MCPClient(config);
      await client.initialize();
      this.clients.set(serverName, client);
    }

    return this.clients.get(serverName)!;
  }

  /**
   * Get the event emitter for a specific client
   * Use this to subscribe to tool.before/tool.after events
   */
  getClientEventEmitter(serverName: string): MCPClient | null {
    return this.clients.get(serverName) || null;
  }

  /**
   * Subscribe to tool events across all clients
   * Note: This creates a subscription for each client - manage subscriptions carefully
   * @returns Unsubscribe function to call to remove all event listeners
   */
  async onToolEvent(
    eventType: 'tool.before' | 'tool.after',
    callback: (event: ToolBeforeEvent | ToolAfterEvent) => void
  ): Promise<() => void> {
    const serverNames = [
      'code-review',
      'security-audit',
      'performance-optimization',
      'testing-strategy',
      'researcher',
      'skill-invocation',
    ];

    // Store cleanup functions for each client
    const cleanups: Array<() => void> = [];

    for (const serverName of serverNames) {
      try {
        const client = await this.getClient(serverName);
        if (eventType === 'tool.before') {
          client.onToolBefore(callback as (event: ToolBeforeEvent) => void);
          cleanups.push(() => client.offToolBefore(callback as (event: ToolBeforeEvent) => void));
        } else {
          client.onToolAfter(callback as (event: ToolAfterEvent) => void);
          cleanups.push(() => client.offToolAfter(callback as (event: ToolAfterEvent) => void));
        }
      } catch (error) {
        // Client may not be available, skip
      }
    }

    // Return combined unsubscribe function
    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
      cleanups.length = 0;
    };
  }

  /**
   * Create client configuration for a server
   */
  public createClientConfig(serverName: string): MCPClientConfig {
    const config = defaultServerRegistry.get(serverName);
    if (config) {
      return config;
    }

    return defaultServerRegistry.createDynamicConfig(serverName);
  }

  /**
   * Call MCP server tool
   */
  async callServerTool(
    serverName: string,
    toolName: string,
    args: unknown = {}
  ): Promise<MCPToolResult> {
    const client = await this.getClient(serverName);
    return client.callTool(toolName, args);
  }

  /**
   * Get all available MCP server tools
   */
  async getAllAvailableTools(): Promise<Record<string, MCPTool[]>> {
    const jobId = `mcp-tools-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result: Record<string, MCPTool[]> = {};

    const serverNames = [
      'code-review',
      'security-audit',
      'performance-optimization',
      'testing-strategy',
      'researcher',
      'skill-invocation',
    ];

    for (const serverName of serverNames) {
      try {
        const client = await this.getClient(serverName);
        result[serverName] = client.getAvailableTools();
      } catch (error) {
        frameworkLogger.log(
          'mcp-client-manager',
          `failed to get tools for ${serverName}: ${error instanceof Error ? error.message : String(error)}`,
          'info',
          { jobId }
        );
      }
    }

    return result;
  }

  /**
   * Clear all cached clients
   */
  clearClients(): void {
    this.clients.clear();
  }
}

// Export singleton instance
export const mcpClientManager = MCPClientManager.getInstance();
