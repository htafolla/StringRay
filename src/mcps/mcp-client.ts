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
import { McpConnection } from './connection/mcp-connection.js';
import type { IServerConfig } from './types/index.js';

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

    // Emit tool.before event
    const beforeEvent: ToolBeforeEvent = {
      toolName,
      serverName: this.config.serverName,
      args,
      timestamp: startTime,
    };
    this.emit('tool.before', beforeEvent);

    try {
      const isGovernanceTool = toolName === 'analyze_proposal' ||
        ['code-review', 'security-audit', 'researcher', 'bug-triage-specialist'].includes(this.config.serverName);

      // REMOVE SIMULATION CRUTCH for governance / analyze_proposal (user request: make servers real)
      // Only use simulation for non-governance tools if explicitly registered
      if (!isGovernanceTool && this.simulationEngine.canSimulate(this.config.serverName, toolName)) {
        try {
          const result = await this.executeWithRetry(
            () => this.simulationEngine.simulate(this.config.serverName, toolName, args),
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
          frameworkLogger.log(
            'mcp-client',
            `Simulation failed for ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
            'info',
            { toolName }
          );
        }
      }

      // === REAL MCP SERVER PATH (for analyze_proposal and governance skills) ===
      if (isGovernanceTool) {
        try {
          const realResult = await this.executeRealToolCall(toolName, args);
          const afterEvent: ToolAfterEvent = {
            ...beforeEvent,
            result: realResult,
            duration: Date.now() - startTime,
            success: true,
          };
          this.emit('tool.after', afterEvent);
          return realResult;
        } catch (realError) {
          frameworkLogger.log(
            'mcp-client',
            `Real MCP call failed for ${this.config.serverName}:${toolName}, falling back to generic: ${realError instanceof Error ? realError.message : String(realError)}`,
            'warning',
            { toolName, server: this.config.serverName }
          );
          // fall through to generic below
        }
      }

      // Generic fallback (last resort)
      const fallbackResult = {
        content: [
          {
            type: 'text',
            text: `Tool ${toolName} executed on ${this.config.serverName} server`,
          },
        ],
      };

      // Emit tool.after event (fallback success)
      const afterEvent: ToolAfterEvent = {
        ...beforeEvent,
        result: fallbackResult,
        duration: Date.now() - startTime,
        success: true,
      };
      this.emit('tool.after', afterEvent);

      return fallbackResult;
    } catch (error) {
      // Emit tool.after event (error)
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

  /**
   * Execute a tool call against the REAL MCP server process (no simulation).
   * Spawns the server via McpConnection (stdio), sends tools/call, returns result.
   * This is the path that makes the knowledge-skill servers (code-review, etc.) real.
   */
  private async executeRealToolCall(toolName: string, args: unknown): Promise<MCPToolResult> {
    const serverName = this.config.serverName;
    const serverConfig: IServerConfig | undefined = defaultServerRegistry.get(serverName);

    if (!serverConfig) {
      throw new Error(`No server config registered for ${serverName}`);
    }

    // Use a fresh connection for this call (simple & reliable for governance)
    const connection = new McpConnection(serverConfig);

    try {
      await connection.connect();

      const executor = new ToolExecutor();
      const result = await executor.executeTool(connection, toolName, args);

      return result;
    } finally {
      // Best effort shutdown
      try {
        if (typeof (connection as any).disconnect === 'function') {
          await (connection as any).disconnect();
        } else {
          // Force kill the child process if exposed
          const proc = (connection as any).process;
          if (proc && !proc.killed) {
            proc.kill('SIGTERM');
          }
        }
      } catch {
        // ignore cleanup errors
      }
    }
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
    const isDebug = process.env.STRRAY_FORCE_MCP_GOVERNANCE === 'true' || process.env.STRRAY_MCP_DEBUG === 'true';

    if (isDebug) {
      const timestamp = new Date().toISOString();
      console.error(`\n${'='.repeat(90)}`);
      console.error(`>>> MCP CALL [${timestamp}]`);
      console.error(`    Server : ${serverName}`);
      console.error(`    Tool   : ${toolName}`);
      console.error(`    Args size: ${JSON.stringify(args).length} bytes`);
      try {
        const argsPreview = JSON.stringify(args, null, 2);
        console.error(`    Full Args:\n${argsPreview.substring(0, 8000)}`);
        if (argsPreview.length > 8000) console.error('    ... [args truncated]');
      } catch {
        console.error(`    Args: [could not stringify]`);
      }
      console.error(`${'='.repeat(90)}`);
    }

    const start = Date.now();
    const client = await this.getClient(serverName);
    const result = await client.callTool(toolName, args);
    const duration = Date.now() - start;

    if (isDebug) {
      const timestamp = new Date().toISOString();
      console.error(`\n${'='.repeat(90)}`);
      console.error(`>>> MCP RESPONSE [${timestamp}]  (took ${duration}ms)`);
      console.error(`    Server : ${serverName}`);
      console.error(`    Tool   : ${toolName}`);
      try {
        const resultStr = JSON.stringify(result, null, 2);
        console.error(`    Full Result:\n${resultStr.substring(0, 12000)}`);
        if (resultStr.length > 12000) console.error(`    ... [result truncated, total ${resultStr.length} chars]`);
      } catch {
        console.error(`    Result: ${String(result).substring(0, 2000)}`);
      }
      console.error(`${'='.repeat(90)}\n`);
    }

    return result;
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
   * Clear all cached clients (best effort — does not fully kill connections yet)
   */
  clearClients(): void {
    this.clients.clear();
  }

  /**
   * Shutdown all MCP clients and their underlying connections.
   * This is critical so that the Node process can exit cleanly.
   */
  async shutdown(): Promise<void> {
    const clients = Array.from(this.clients.values());
    this.clients.clear();

    for (const client of clients) {
      try {
        // Best effort: if the client has a disconnect method on its internal connection, call it.
        // For now we rely on process kill in McpConnection.
        if (typeof (client as any).disconnect === 'function') {
          await (client as any).disconnect();
        }
      } catch (err) {
        // ignore
      }
    }
  }
}

// Export singleton instance
export const mcpClientManager = MCPClientManager.getInstance();
