/**
 * Orchestrator MCP Server - Facade
 * 
 * Main entry point for the orchestrator MCP server
 * Provides a clean API while hiding internal complexity
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { frameworkLogger } from '../../core/framework-logger.js';
import { StringRayStateManager } from '../../state/state-manager.js';
import { MultiAgentOrchestrationCoordinator } from '../../orchestrator/multi-agent-orchestration-coordinator.js';

import { TaskHandler } from './handlers/task-handler.js';
import { ComplexityHandler } from './handlers/complexity-handler.js';
import { StatusHandler } from './handlers/status-handler.js';
import type { OrchestrationTask, OrchestrationResult } from './types.js';

/**
 * Orchestrator MCP Server
 * Enterprise-grade orchestration with advanced task management and agent coordination
 */
export class OrchestratorServer {
  private server: Server;
  private activeTasks: Map<string, unknown> = new Map();
  private taskHistory: Array<{
    sessionId: string;
    description: string;
    tasks: number;
    result: OrchestrationResult;
    timestamp: string;
  }> = [];
  
  // Handlers
  private taskHandler: TaskHandler;
  private complexityHandler: ComplexityHandler;
  private statusHandler: StatusHandler;
  
  // Actual orchestration coordinator
  private coordinator: MultiAgentOrchestrationCoordinator;

  constructor() {
    // Initialize actual coordinator
    const stateManager = new StringRayStateManager();
    this.coordinator = new MultiAgentOrchestrationCoordinator(stateManager);
    
    // Initialize handlers
    this.taskHandler = new TaskHandler();
    this.complexityHandler = new ComplexityHandler();
    this.statusHandler = new StatusHandler();

    // Create MCP server
    this.server = new Server(
      {
        name: 'orchestrator',
        version: '1.14.1',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.initializeTools();
    this.setupToolHandlers();

    frameworkLogger.log('orchestrator.server', 'initialize', 'info', {
      message: 'StringRay Orchestrator MCP Server initialized',
    });
  }

  /**
   * Initialize tool definitions
   */
  private initializeTools(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'orchestrate-task',
            description:
              'Execute complex multi-step tasks with intelligent agent delegation and progress tracking',
            inputSchema: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                tasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      description: { type: 'string' },
                      type: { type: 'string' },
                      priority: {
                        type: 'string',
                        enum: ['critical', 'high', 'medium', 'low'],
                        default: 'medium',
                      },
                      dependencies: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                      estimatedComplexity: {
                        type: 'number',
                        minimum: 1,
                        maximum: 100,
                      },
                    },
                    required: ['id', 'description', 'type'],
                  },
                },
                sessionId: { type: 'string' },
                executionMode: {
                  type: 'string',
                  enum: ['parallel', 'sequential', 'optimized'],
                  default: 'optimized',
                },
                timeout: { type: 'number', default: 300000 },
              },
              required: ['description', 'tasks'],
            },
          },
          {
            name: 'analyze-complexity',
            description:
              'Analyze task complexity and recommend optimal orchestration strategy',
            inputSchema: {
              type: 'object',
              properties: {
                tasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      description: { type: 'string' },
                      type: { type: 'string' },
                      files: { type: 'array', items: { type: 'string' } },
                      dependencies: { type: 'number' },
                      riskLevel: {
                        type: 'string',
                        enum: ['low', 'medium', 'high', 'critical'],
                      },
                    },
                  },
                },
              },
              required: ['tasks'],
            },
          },
          {
            name: 'get-orchestration-status',
            description:
              'Get comprehensive status of active orchestrations and agent utilization',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                detailed: { type: 'boolean', default: false },
              },
            },
          },
          {
            name: 'cancel-orchestration',
            description: 'Cancel active orchestration tasks with cleanup',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
                taskId: { type: 'string' },
                force: { type: 'boolean', default: false },
              },
            },
          },
          {
            name: 'optimize-orchestration',
            description:
              'Analyze and optimize orchestration patterns for better performance',
            inputSchema: {
              type: 'object',
              properties: {
                history: { type: 'boolean', default: true },
                recommendations: { type: 'boolean', default: true },
              },
            },
          },
        ],
      };
    });
  }

  /**
   * Set up tool request handlers
   */
  private setupToolHandlers(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'orchestrate-task':
            return await this.taskHandler.handleOrchestrateTask(args as {
              description: string;
              tasks?: OrchestrationTask[];
              sessionId?: string;
              executionMode?: string;
              timeout?: number;
            }, { taskHistory: this.taskHistory, activeTasks: this.activeTasks });
            
          case 'analyze-complexity':
            return await this.complexityHandler.handleAnalyzeComplexity(args as {
              tasks: OrchestrationTask[];
            });
            
          case 'get-orchestration-status':
            return await this.statusHandler.handleGetOrchestrationStatus(args as {
              sessionId?: string;
              detailed?: boolean;
            }, { taskHistory: this.taskHistory, activeTasks: this.activeTasks });
            
          case 'cancel-orchestration':
            return await this.statusHandler.handleCancelOrchestration(args as {
              sessionId?: string;
              taskId?: string;
              force?: boolean;
            }, { taskHistory: this.taskHistory, activeTasks: this.activeTasks });
            
          case 'optimize-orchestration':
            return await this.statusHandler.handleOptimizeOrchestration(args as {
              history?: boolean;
              recommendations?: boolean;
            });
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error handling tool '${request.params.name}': ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    await frameworkLogger.log('orchestrator.server', 'start', 'info', {
      message: 'StringRay Orchestrator MCP Server started',
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    await frameworkLogger.log('orchestrator.server', 'shutdown', 'info', {
      message: 'StringRay Orchestrator MCP Server shutting down',
    });
    await this.server.close();
  }
}

// Export singleton factory
let serverInstance: OrchestratorServer | null = null;

export function createOrchestratorServer(): OrchestratorServer {
  if (!serverInstance) {
    serverInstance = new OrchestratorServer();
  }
  return serverInstance;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createOrchestratorServer();
  server.start().catch((error) => {
    frameworkLogger.log('orchestrator.server', 'fatal-error', 'error', {
      message: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}
