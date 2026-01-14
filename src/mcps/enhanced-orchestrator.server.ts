/**
 * Enhanced Multi-Agent Orchestrator MCP Server
 *
 * Provides clickable agent monitoring and orchestration capabilities via MCP protocol
 * Integrates with oh-my-opencode and opencode ecosystems
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { enhancedMultiAgentOrchestrator } from "../orchestrator/enhanced-multi-agent-orchestrator.js";

class EnhancedMultiAgentOrchestratorServer {
  private server: Server;

  constructor() {
        this.server = new Server(
      {
        name: "enhanced-multi-agent-orchestrator",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    console.log("Enhanced Multi-Agent Orchestrator MCP Server initialized");
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "spawn-agent",
            description:
              "Spawn an agent with clickable monitoring and dependency management",
            inputSchema: {
              type: "object",
              properties: {
                agentType: {
                  type: "string",
                  description:
                    "Type of agent to spawn (architect, enforcer, librarian, etc.)",
                },
                task: {
                  type: "string",
                  description: "Task description for the agent to execute",
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                  description: "Task priority level",
                },
                dependencies: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Agent IDs that must complete before this agent starts",
                },
                timeout: {
                  type: "number",
                  description: "Timeout in milliseconds (optional)",
                },
              },
              required: ["agentType", "task"],
            },
          },
          {
            name: "get-monitoring-interface",
            description:
              "Get real-time monitoring interface for all active agents",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "cancel-agent",
            description: "Cancel a running agent execution",
            inputSchema: {
              type: "object",
              properties: {
                agentId: {
                  type: "string",
                  description: "ID of the agent to cancel",
                },
              },
              required: ["agentId"],
            },
          },
          {
            name: "get-orchestration-stats",
            description: "Get comprehensive orchestration statistics",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "execute-complex-task",
            description:
              "Execute a complex multi-step task with automatic agent orchestration",
            inputSchema: {
              type: "object",
              properties: {
                description: {
                  type: "string",
                  description: "Overall task description",
                },
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        description: "Unique task identifier",
                      },
                      description: {
                        type: "string",
                        description: "Task description",
                      },
                      subagentType: {
                        type: "string",
                        description: "Agent type to handle this task",
                      },
                      priority: {
                        type: "string",
                        enum: ["low", "medium", "high", "critical"],
                      },
                      dependencies: {
                        type: "array",
                        items: { type: "string" },
                        description: "Task IDs this task depends on",
                      },
                    },
                    required: ["id", "description", "subagentType"],
                  },
                  description: "Array of tasks to execute",
                },
                sessionId: {
                  type: "string",
                  description: "Optional session identifier for tracking",
                },
              },
              required: ["description", "tasks"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new Error("Arguments are required");
      }

      try {
        switch (name) {
          case "spawn-agent":
            const agent = await enhancedMultiAgentOrchestrator.spawnAgent({
              agentType: args.agentType as string,
              task: args.task as string,
              priority:
                (args.priority as "low" | "medium" | "high" | "critical") ||
                "medium",
              dependencies: (args.dependencies as string[]) || [],
              timeout: args.timeout as number,
            });

            return {
              content: [
                {
                  type: "text",
                  text: `Agent spawned successfully: ${agent.id} (${agent.agentType}) - Clickable: ${agent.clickable}, Monitorable: ${agent.monitorable}`,
                },
              ],
            };

          case "get-monitoring-interface":
            const monitoringData =
              enhancedMultiAgentOrchestrator.getMonitoringInterface();

            return {
              content: [
                {
                  type: "text",
                  text: `Monitoring Interface Data:\n${JSON.stringify(monitoringData, null, 2)}`,
                },
              ],
            };

          case "cancel-agent":
            const cancelled = await enhancedMultiAgentOrchestrator.cancelAgent(
              args.agentId as string,
            );

            return {
              content: [
                {
                  type: "text",
                  text: `Agent ${args.agentId as string} cancellation: ${cancelled ? "SUCCESS" : "FAILED"}`,
                },
              ],
            };

          case "get-orchestration-stats":
            const stats = enhancedMultiAgentOrchestrator.getStatistics();

            return {
              content: [
                {
                  type: "text",
                  text: `Orchestration Statistics:\n${JSON.stringify(stats, null, 2)}`,
                },
              ],
            };

          case "execute-complex-task":
            // Import the main orchestrator for complex task execution
            const { StringRayOrchestrator } = await import("../orchestrator.js");

            const orchestrator = new StringRayOrchestrator({
              maxConcurrentTasks: 5,
              conflictResolutionStrategy: "expert_priority",
            });

            const results = await orchestrator.executeComplexTask(
              args.description as string,
              args.tasks as any[],
              args.sessionId as string,
            );

            return {
              content: [
                {
                  type: "text",
                  text: `Complex task completed: ${args.description}\nResults: ${JSON.stringify(results, null, 2)}`,
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("Enhanced Multi-Agent Orchestrator MCP Server running");
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new EnhancedMultiAgentOrchestratorServer();
  server.run().catch(console.error);
}

export { EnhancedMultiAgentOrchestratorServer };
