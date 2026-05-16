/**
 * OpenClaw Integration - Main Module
 *
 * Combines all OpenClaw integration components into a single interface.
 *
 * @version 1.0.0
 * @since 2026-03-14
 */

import { BaseIntegration } from '../base/index.js';
import type { 
  OpenClawIntegrationConfig, 
  IntegrationStatistics,
  ClientStatistics,
  APIServerStatistics 
} from './types.js';
import { OpenClawConfigLoader } from './config.js';
import { OpenClawClient } from './client.js';
import { StringRayAPIServer } from './api-server.js';
import { initializeGovernanceIntegration } from '../governance/index.js';
import { featuresConfigLoader } from '../../core/features-config.js';
import { OpenClawHooksManager, StringRayToolEvent } from './hooks/strray-hooks.js';
import { mcpClientManager, ToolBeforeEvent, ToolAfterEvent } from '../../mcps/mcp-client.js';
import type { AgentInvoker } from './api-server.js';

/**
 * Main OpenClaw Integration class
 * Extends BaseIntegration for consistent lifecycle management
 */
export class OpenClawIntegration extends BaseIntegration {
  private configLoader: OpenClawConfigLoader;
  private client: OpenClawClient | null = null;
  private apiServer: StringRayAPIServer | null = null;
  private hooksManager: OpenClawHooksManager | null = null;
  private agentInvoker: AgentInvoker | null = null;
  
  // Event subscription tracking for cleanup
  private mcpToolBeforeUnsubscribe: (() => void) | null = null;
  private mcpToolAfterUnsubscribe: (() => void) | null = null;

  constructor(configPath?: string) {
    super('openclaw', '1.0.0', { enabled: true, debug: false, logLevel: 'info' });
    this.configLoader = new OpenClawConfigLoader(configPath);
  }

  /**
   * Set the agent invoker for the API server
   */
  setAgentInvoker(invoker: AgentInvoker): void {
    this.agentInvoker = invoker;
    if (this.apiServer) {
      this.apiServer.setAgentInvoker(invoker);
    }
  }

  /**
   * Perform integration-specific initialization
   * Called by BaseIntegration.initialize() after base setup
   */
  protected async performInitialization(): Promise<void> {
    const config = this.configLoader.getConfig();

    // Merge with base config
    this.config = { ...this.config, ...config };

    if (!config.enabled) {
      await this.log('info', 'Integration disabled in configuration');
      return;
    }

    await this.log('info', 'Initializing...');

    // Initialize API server if enabled
    if (config.apiServer?.enabled) {
      await this.log('info', 'Starting API server...');
      this.apiServer = new StringRayAPIServer(config.apiServer);
      
      if (this.agentInvoker) {
        this.apiServer.setAgentInvoker(this.agentInvoker);
      }
      
      await this.apiServer.start();
    }

    // Initialize governance (Dynamo Solar SSOT) if enabled
    const govConfig = (featuresConfigLoader as any).config?.inference_governance;
    if (govConfig?.enabled !== false) {
      try {
        await initializeGovernanceIntegration();
      } catch (err) {
        await this.log('warning', 'Failed to initialize governance during OpenClaw startup');
      }
    }

    // Initialize WebSocket client
    await this.log('info', 'Connecting to OpenClaw Gateway...');
    this.client = new OpenClawClient({
      gatewayUrl: config.gatewayUrl,
      authToken: config.authToken,
      deviceId: config.deviceId,
      deviceKeyPair: config.deviceKeyPair,
      reconnect: config.autoReconnect,
      reconnectAttempts: config.maxReconnectAttempts,
      reconnectDelay: config.reconnectDelay,
    });

    // Set up event listeners using inherited emit
    this.client.onStateChange(async (state: string, previousState: string) => {
      this.log('info', `Client state: ${previousState} → ${state}`);
      this.emit('stateChange', { previousState, newState: state });
      
      // Flush queued events when client reconnects
      if (this.hooksManager && (state === 'connected' || state === 'authorized')) {
        await this.hooksManager.handleReconnect();
      }
    });

    try {
      await this.client.connect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.log('warning', `Failed to connect to OpenClaw Gateway: ${errorMessage}`);
      // Don't fail - API server can still work independently
    }

    // Initialize hooks if enabled
    if (config.hooks?.enabled) {
      await this.log('info', 'Initializing tool hooks...');
      this.hooksManager = new OpenClawHooksManager(config.hooks);
      
      if (this.client) {
        this.hooksManager.setClient(this.client);
      }
      
      await this.hooksManager.initialize();

      // Wire hooks to MCPClient tool events
      await this.wireHooksToMCP();
    }
  }

  /**
   * Wire OpenClaw hooks to MCPClient tool events
   */
  private async wireHooksToMCP(): Promise<void> {
    if (!this.hooksManager) {
      return;
    }

    await this.log('info', 'Wiring hooks to MCP tool events...');

    // Subscribe to tool.before events and store unsubscribe function
    this.mcpToolBeforeUnsubscribe = await mcpClientManager.onToolEvent('tool.before', async (event) => {
      const toolEvent = event as ToolBeforeEvent;
      try {
        await this.hooksManager!.onToolBefore({
          toolName: toolEvent.toolName,
          toolId: `${toolEvent.serverName}:${toolEvent.toolName}`,
          args: toolEvent.args as Record<string, unknown>,
          duration: 0,
          timestamp: toolEvent.timestamp,
          agent: toolEvent.serverName,
        });
      } catch (error) {
        await this.log('error', `Error in tool.before handler: ${error}`);
      }
    });

    // Subscribe to tool.after events and store unsubscribe function
    this.mcpToolAfterUnsubscribe = await mcpClientManager.onToolEvent('tool.after', async (event) => {
      const toolEvent = event as ToolAfterEvent;
      try {
        const afterEvent: StringRayToolEvent = {
          toolName: toolEvent.toolName,
          toolId: `${toolEvent.serverName}:${toolEvent.toolName}`,
          args: toolEvent.args as Record<string, unknown>,
          duration: toolEvent.duration,
          timestamp: toolEvent.timestamp,
          agent: toolEvent.serverName,
        };
        if (toolEvent.result !== undefined) afterEvent.result = toolEvent.result;
        if (toolEvent.error !== undefined) afterEvent.error = toolEvent.error;
        await this.hooksManager!.onToolAfter(afterEvent);
      } catch (error) {
        await this.log('error', `Error in tool.after handler: ${error}`);
      }
    });

    await this.log('success', 'Hooks wired to MCP tool events');
  }

  /**
   * Perform integration-specific shutdown
   * Called by BaseIntegration.shutdown() for cleanup
   */
  protected async performShutdown(): Promise<void> {
    await this.log('info', 'Shutting down...');

    // Unsubscribe from MCP tool events (prevent memory leaks)
    if (this.mcpToolBeforeUnsubscribe) {
      this.mcpToolBeforeUnsubscribe();
      this.mcpToolBeforeUnsubscribe = null;
    }
    if (this.mcpToolAfterUnsubscribe) {
      this.mcpToolAfterUnsubscribe();
      this.mcpToolAfterUnsubscribe = null;
    }

    // Shutdown hooks
    if (this.hooksManager) {
      await this.hooksManager.shutdown();
    }

    // Disconnect client
    if (this.client) {
      this.client.disconnect();
    }

    // Stop API server
    if (this.apiServer) {
      await this.apiServer.stop();
    }
  }

  /**
   * Perform integration-specific health check
   */
  protected async performHealthCheck(): Promise<{ healthy: boolean; message: string; details?: Record<string, unknown> }> {
    const checks: { healthy: boolean; component: string; message: string }[] = [];

    // Check API server
    if (this.apiServer) {
      const apiStats = this.apiServer.getStats();
      const apiHealthy = apiStats.startedAt > 0;
      checks.push({
        healthy: apiHealthy,
        component: 'apiServer',
        message: apiHealthy ? 'API server running' : 'API server not started',
      });
    }

    // Check client connection
    if (this.client) {
      const clientState = this.client.getState();
      const clientHealthy = clientState === 'connected' || clientState === 'authorized';
      checks.push({
        healthy: clientHealthy,
        component: 'client',
        message: `Client state: ${clientState}`,
      });
    }

    // Check hooks manager
    if (this.hooksManager) {
      const hooksHealthy = this.hooksManager.isInitialized();
      const queueSize = this.hooksManager.getQueueSize();
      checks.push({
        healthy: hooksHealthy,
        component: 'hooks',
        message: hooksHealthy 
          ? `Hooks initialized (queue: ${queueSize})` 
          : 'Hooks not initialized',
      });
    }

    // Determine overall health
    const allHealthy = checks.length > 0 && checks.every(c => c.healthy);
    const anyHealthy = checks.some(c => c.healthy);

    return {
      healthy: allHealthy || (anyHealthy && checks.length > 0),
      message: checks.length === 0 
        ? 'No components to check' 
        : checks.map(c => c.message).join('; '),
      details: {
        components: checks.reduce((acc, c) => {
          acc[c.component] = c.healthy;
          return acc;
        }, {} as Record<string, boolean>),
      },
    };
  }

  /**
   * Get statistics including client, API server, and base stats
   */
  getStatistics(): IntegrationStatistics {
    return {
      client: this.client?.getStats() || this.getDefaultClientStats(),
      apiServer: this.apiServer?.getStats() || this.getDefaultAPIServerStats(),
      uptime: this.getStats().uptime,
    };
  }

  /**
   * Get the API server instance
   */
  getAPIServer(): StringRayAPIServer | null {
    return this.apiServer;
  }

  /**
   * Get the client instance
   */
  getClient(): OpenClawClient | null {
    return this.client;
  }

  /**
   * Get the hooks manager
   */
  getHooksManager(): OpenClawHooksManager | null {
    return this.hooksManager;
  }

  /**
   * Get OpenClaw-specific configuration
   */
  getOpenClawConfig(): OpenClawIntegrationConfig {
    return this.configLoader.getConfig();
  }

  /**
   * Reload configuration
   */
  reloadConfig(): void {
    this.configLoader.reload();
  }

  /**
   * Get the agent invoker
   */
  getAgentInvoker(): AgentInvoker | null {
    return this.agentInvoker;
  }

  private getDefaultClientStats(): ClientStatistics {
    return {
      messagesSent: 0,
      messagesReceived: 0,
      requestsSent: 0,
      requestsSucceeded: 0,
      requestsFailed: 0,
      reconnects: 0,
      errors: 0,
    };
  }

  private getDefaultAPIServerStats(): APIServerStatistics {
    return {
      startedAt: 0,
      requestsTotal: 0,
      requestsByEndpoint: {},
      requestsByStatus: {},
      averageResponseTime: 0,
      errors: 0,
    };
  }
}

/**
 * Global integration instance
 */
let globalIntegration: OpenClawIntegration | null = null;

/**
 * Initialize the global integration
 */
export async function initializeOpenClawIntegration(
  configPath?: string,
  agentInvoker?: AgentInvoker,
): Promise<OpenClawIntegration> {
  if (globalIntegration) {
    return globalIntegration;
  }

  globalIntegration = new OpenClawIntegration(configPath);

  if (agentInvoker) {
    globalIntegration.setAgentInvoker(agentInvoker);
  }

  await globalIntegration.initialize();

  return globalIntegration;
}

/**
 * Get the global integration
 */
export function getOpenClawIntegration(): OpenClawIntegration | null {
  return globalIntegration;
}

/**
 * Shutdown the global integration
 */
export async function shutdownOpenClawIntegration(): Promise<void> {
  if (globalIntegration) {
    await globalIntegration.shutdown();
    globalIntegration = null;
  }
}

// Export all components
export * from './types.js';
export * from './config.js';
export * from './client.js';
export * from './api-server.js';
export { OpenClawHooksManager } from './hooks/strray-hooks.js';
