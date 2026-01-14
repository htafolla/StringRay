/**
 * StrRay Session Management MCP Server
 *
 * Provides programmatic access to session data and integrates with
 * existing session management components including SessionCoordinator,
 * SessionCleanupManager, and SessionMonitor.
 *
 * Implements session_list, session_read, session_search, and session_info tools.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

class StrRaySessionManagementServer {
  server;
  stateManager;
  sessionCoordinator;

  constructor() {
    this.server = new Server(
      {
        name: "strray-session-management",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize with mock state manager and session coordinator for demo
    // In production, these would be injected from the framework
    this.initializeComponents();
    this.setupToolHandlers();
    console.log("StrRay Session Management MCP Server initialized");
  }

  initializeComponents() {
    // Mock state manager - in real implementation, this would be the actual StrRayStateManager
    this.stateManager = {
      get: (key) => {
        // Mock session data for demonstration
        const mockSessions = {
          session_001: {
            sessionId: "session_001",
            startTime: Date.now() - 3600000, // 1 hour ago
            activeDelegations: new Map([
              ["del_001", { agents: ["enforcer", "architect"] }],
            ]),
            agentInteractions: new Map([
              [
                "enforcer",
                [
                  {
                    agentName: "enforcer",
                    timestamp: Date.now(),
                    action: "codex-validation",
                    result: "passed",
                    duration: 150,
                    success: true,
                  },
                ],
              ],
            ]),
            conflictHistory: [],
            coordinationState: {
              activeAgents: new Set(["enforcer", "architect", "orchestrator"]),
              pendingCommunications: [],
              sharedContext: new Map([
                ["context_001", { type: "codex", version: "1.2.20" }],
              ]),
              sessionMetrics: {
                totalInteractions: 5,
                successfulInteractions: 4,
                failedInteractions: 1,
                averageResponseTime: 120,
                conflictResolutionRate: 1.0,
                coordinationEfficiency: 0.8,
              },
            },
            isActive: true,
          },
          session_002: {
            sessionId: "session_002",
            startTime: Date.now() - 1800000, // 30 minutes ago
            activeDelegations: new Map(),
            agentInteractions: new Map([
              [
                "test-architect",
                [
                  {
                    agentName: "test-architect",
                    timestamp: Date.now(),
                    action: "test-generation",
                    result: "10 tests created",
                    duration: 200,
                    success: true,
                  },
                ],
              ],
            ]),
            conflictHistory: [
              {
                conflictId: "conf_001",
                timestamp: Date.now(),
                agents: ["code-reviewer", "security-auditor"],
                resolution: "consensus",
                outcome: "approved",
              },
            ],
            coordinationState: {
              activeAgents: new Set(["test-architect", "code-reviewer"]),
              pendingCommunications: [
                {
                  id: "comm_001",
                  fromAgent: "test-architect",
                  toAgent: "code-reviewer",
                  message: "Test coverage analysis complete",
                  timestamp: Date.now(),
                  priority: "medium",
                },
              ],
              sharedContext: new Map(),
              sessionMetrics: {
                totalInteractions: 3,
                successfulInteractions: 3,
                failedInteractions: 0,
                averageResponseTime: 80,
                conflictResolutionRate: 1.0,
                coordinationEfficiency: 0.9,
              },
            },
            isActive: true,
          },
        };

        if (key.startsWith("session:")) {
          const sessionId = key.split(":")[1];
          return mockSessions[sessionId];
        }
        return undefined;
      },
      set: (key, value) => {
        console.log(`Mock state set: ${key}`, value);
      },
      clear: (key) => {
        console.log(`Mock state cleared: ${key}`);
      },
    };

    // Mock session coordinator
    this.sessionCoordinator = {
      getSessionStatus: (sessionId) => {
        const session = this.stateManager.get(`session:${sessionId}`);
        if (session) {
          return {
            sessionId: session.sessionId,
            active: session.isActive,
            agentCount: session.coordinationState.activeAgents.size,
            startTime: session.startTime,
            metrics: session.coordinationState.sessionMetrics,
          };
        }
        return null;
      },
    };
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "session_list",
            description:
              "List all OpenCode sessions with optional filtering. Returns session IDs with metadata including message count, date range, and agents used.",
            inputSchema: {
              type: "object",
              properties: {
                limit: {
                  type: "number",
                  description: "Maximum number of sessions to return",
                },
                from_date: {
                  type: "string",
                  description:
                    "Filter sessions from this date (ISO 8601 format)",
                },
                to_date: {
                  type: "string",
                  description:
                    "Filter sessions until this date (ISO 8601 format)",
                },
                project_path: {
                  type: "string",
                  description: "Filter by project path",
                },
              },
            },
          },
          {
            name: "session_read",
            description:
              "Read messages and history from an OpenCode session. Returns formatted view of session messages with role, timestamp, and content.",
            inputSchema: {
              type: "object",
              properties: {
                session_id: {
                  type: "string",
                  description: "Session ID to read",
                },
                include_todos: {
                  type: "boolean",
                  description: "Include todo list if available",
                  default: false,
                },
                include_transcript: {
                  type: "boolean",
                  description: "Include transcript log if available",
                  default: false,
                },
                limit: {
                  type: "number",
                  description: "Maximum number of messages to return",
                },
              },
              required: ["session_id"],
            },
          },
          {
            name: "session_search",
            description:
              "Search for content within OpenCode session messages. Performs full-text search across session messages and returns matching excerpts with context.",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query string" },
                session_id: {
                  type: "string",
                  description: "Search within specific session only",
                },
                case_sensitive: {
                  type: "boolean",
                  description: "Case-sensitive search",
                  default: false,
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return",
                  default: 20,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "session_info",
            description:
              "Get metadata and statistics about an OpenCode session. Returns detailed information about a session including message count, date range, agents used, and available data sources.",
            inputSchema: {
              type: "object",
              properties: {
                session_id: {
                  type: "string",
                  description: "Session ID to inspect",
                },
              },
              required: ["session_id"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        switch (name) {
          case "session_list":
            return await this.sessionList(args);
          case "session_read":
            return await this.sessionRead(args);
          case "session_search":
            return await this.sessionSearch(args);
          case "session_info":
            return await this.sessionInfo(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in session management tool ${name}:`, error);
        throw error;
      }
    });
  }

  // Tool implementations

  async sessionList(args) {
    const { limit, from_date, to_date, project_path } = args || {};

    console.log(`📋 Session Management: Listing sessions with filters`, {
      limit,
      from_date,
      to_date,
      project_path,
    });

    // Get all sessions from state manager (in real implementation, this would scan all session keys)
    const sessions = [
      this.stateManager.get("session:session_001"),
      this.stateManager.get("session:session_002"),
    ].filter(Boolean);

    // Apply filters
    let filteredSessions = sessions;

    if (from_date) {
      const fromTime = new Date(from_date).getTime();
      filteredSessions = filteredSessions.filter(
        (s) => s.startTime >= fromTime,
      );
    }

    if (to_date) {
      const toTime = new Date(to_date).getTime();
      filteredSessions = filteredSessions.filter((s) => s.startTime <= toTime);
    }

    if (limit) {
      filteredSessions = filteredSessions.slice(0, limit);
    }

    const sessionSummaries = filteredSessions.map((session) => ({
      sessionId: session.sessionId,
      messages: session.agentInteractions
        ? Array.from(session.agentInteractions.values()).flat().length
        : 0,
      first: new Date(session.startTime).toISOString().split("T")[0],
      last: new Date(
        Math.max(
          ...(Array.from(session.agentInteractions?.values() || [])
            .flat()
            .map((i) => i.timestamp) || [session.startTime]),
        ),
      )
        .toISOString()
        .split("T")[0],
      agents: Array.from(session.coordinationState.activeAgents),
    }));

    return {
      content: [
        {
          type: "text",
          text: `| Session ID | Messages | First | Last | Agents |\n|------------|----------|-------|------|--------|\n${sessionSummaries
            .map(
              (s) =>
                `| ${s.sessionId} | ${s.messages} | ${s.first} | ${s.last} | ${s.agents.join(", ")} |`,
            )
            .join("\n")}`,
        },
      ],
    };
  }

  async sessionRead(args) {
    const { session_id, include_todos, include_transcript, limit } = args;

    console.log(`📖 Session Management: Reading session ${session_id}`, {
      include_todos,
      include_transcript,
      limit,
    });

    const session = this.stateManager.get(`session:${session_id}`);
    if (!session) {
      throw new Error(`Session ${session_id} not found`);
    }

    const messages = [];
    for (const [agentName, interactions] of session.agentInteractions) {
      for (const interaction of interactions.slice(
        0,
        limit || interactions.length,
      )) {
        messages.push({
          messageId: `msg_${interaction.timestamp}_${agentName}`,
          role: agentName,
          timestamp: new Date(interaction.timestamp).toISOString(),
          content: `${interaction.action}: ${JSON.stringify(interaction.result)}`,
          duration: interaction.duration,
          success: interaction.success,
        });
      }
    }

    // Sort by timestamp
    messages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    let output = `Session: ${session_id}\nMessages: ${messages.length}\nDate Range: ${new Date(session.startTime).toISOString()} to ${new Date().toISOString()}\n\n`;

    for (const msg of messages) {
      output += `[Message ${msg.messageId}] ${msg.role} (${msg.timestamp})\n${msg.content}\n\n`;
    }

    if (include_todos && session.activeDelegations.size > 0) {
      output += `## Active Delegations (Todos)\n`;
      for (const [delegationId, delegation] of session.activeDelegations) {
        output += `- ${delegationId}: ${delegation.agents.join(", ")}\n`;
      }
      output += "\n";
    }

    if (include_transcript && session.conflictHistory.length > 0) {
      output += `## Conflict History (Transcript)\n`;
      for (const conflict of session.conflictHistory) {
        output += `- ${conflict.conflictId}: ${conflict.agents.join(", ")} resolved via ${conflict.resolution}\n`;
      }
      output += "\n";
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }

  async sessionSearch(args) {
    const { query, session_id, case_sensitive, limit = 20 } = args;

    console.log(`🔍 Session Management: Searching for "${query}"`, {
      session_id,
      case_sensitive,
      limit,
    });

    const sessions = session_id
      ? [this.stateManager.get(`session:${session_id}`)].filter(Boolean)
      : [
          this.stateManager.get("session:session_001"),
          this.stateManager.get("session:session_002"),
        ].filter(Boolean);

    const results = [];
    const searchFlags = case_sensitive ? "g" : "gi";

    for (const session of sessions) {
      const sessionId = session.sessionId;

      // Search in agent interactions
      for (const [agentName, interactions] of session.agentInteractions) {
        for (const interaction of interactions) {
          const content = `${interaction.action}: ${JSON.stringify(interaction.result)}`;
          const regex = new RegExp(query, searchFlags);
          const matches = content.match(regex);

          if (matches) {
            results.push({
              sessionId,
              messageId: `msg_${interaction.timestamp}_${agentName}`,
              role: agentName,
              timestamp: new Date(interaction.timestamp).toISOString(),
              excerpt:
                content.length > 200
                  ? content.substring(0, 200) + "..."
                  : content,
              matchCount: matches.length,
            });

            if (results.length >= limit) break;
          }
        }
        if (results.length >= limit) break;
      }

      if (results.length >= limit) break;
    }

    const output = `Found ${results.length} matches${session_id ? ` in session ${session_id}` : " across sessions"}:\n\n${results
      .map(
        (r) =>
          `[${r.sessionId}] Message ${r.messageId} (${r.role})\n...${r.excerpt}...\n`,
      )
      .join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }

  async sessionInfo(args) {
    const { session_id } = args;

    console.log(
      `📊 Session Management: Getting info for session ${session_id}`,
    );

    const session = this.stateManager.get(`session:${session_id}`);
    if (!session) {
      throw new Error(`Session ${session_id} not found`);
    }

    const messageCount = Array.from(session.agentInteractions.values()).flat()
      .length;
    const firstMessage = Math.min(
      ...Array.from(session.agentInteractions.values())
        .flat()
        .map((i) => i.timestamp),
    );
    const lastMessage = Math.max(
      ...Array.from(session.agentInteractions.values())
        .flat()
        .map((i) => i.timestamp),
    );

    const duration = lastMessage - session.startTime;
    const durationStr =
      duration < 60000
        ? `${Math.round(duration / 1000)}s`
        : duration < 3600000
          ? `${Math.round(duration / 60000)}m`
          : `${Math.round(duration / 3600000)}h ${Math.round((duration % 3600000) / 60000)}m`;

    const agentNames = Array.from(session.coordinationState.activeAgents);

    const output = `Session ID: ${session.sessionId}
Messages: ${messageCount}
Date Range: ${new Date(session.startTime).toISOString()} to ${new Date(lastMessage || session.startTime).toISOString()}
Duration: ${durationStr}
Agents Used: ${agentNames.join(", ")}
Has Todos: ${session.activeDelegations.size > 0 ? "Yes" : "No"} (${session.activeDelegations.size} items)
Has Transcript: ${session.conflictHistory.length > 0 ? "Yes" : "No"} (${session.conflictHistory.length} entries)
Active: ${session.isActive}
Metrics: ${JSON.stringify(session.coordinationState.sessionMetrics, null, 2)}`;

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Session Management MCP Server started");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRaySessionManagementServer();
  server.run().catch(console.error);
}

export default StrRaySessionManagementServer;
