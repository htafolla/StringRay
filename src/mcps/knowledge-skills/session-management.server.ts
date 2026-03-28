/**
 * Session Management MCP Server
 *
 * Tools for managing user sessions and persistent state.
 * Provides session lifecycle management, state persistence, and cleanup utilities.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { frameworkLogger } from "../../core/framework-logger.js";

interface Tool {
  name: string;
  description: string;
  inputSchema: object;
}

// In-memory session store for MCP server context
interface SessionData {
  id: string;
  data: Record<string, unknown>;
  createdAt: number;
  lastAccessed: number;
  expiresAt: number | undefined;
}

class SessionManagementServer {
  private server: Server;
  private sessions: Map<string, SessionData> = new Map();
  private tools: Tool[] = [
    {
      name: "create_session",
      description:
        "Create a new session with optional data and expiration",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Optional custom session ID (generated if not provided)",
          },
          data: {
            type: "object",
            description: "Initial session data",
          },
          ttl: {
            type: "number",
            description: "Time to live in seconds (optional)",
          },
        },
      },
    },
    {
      name: "get_session",
      description:
        "Retrieve session data by session ID",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Session ID to retrieve",
          },
        },
        required: ["sessionId"],
      },
    },
    {
      name: "update_session",
      description:
        "Update session data",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Session ID to update",
          },
          data: {
            type: "object",
            description: "Data to merge with existing session",
          },
          extendTtl: {
            type: "number",
            description: "Extend TTL by this many seconds",
          },
        },
        required: ["sessionId", "data"],
      },
    },
    {
      name: "delete_session",
      description:
        "Delete a session",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Session ID to delete",
          },
        },
        required: ["sessionId"],
      },
    },
    {
      name: "list_sessions",
      description:
        "List all active sessions",
      inputSchema: {
        type: "object",
        properties: {
          includeExpired: {
            type: "boolean",
            default: false,
            description: "Include expired sessions in the list",
          },
          limit: {
            type: "number",
            default: 50,
            description: "Maximum number of sessions to return",
          },
        },
      },
    },
    {
      name: "session_exists",
      description:
        "Check if a session exists and is valid",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "Session ID to check",
          },
        },
        required: ["sessionId"],
      },
    },
    {
      name: "cleanup_expired_sessions",
      description:
        "Clean up all expired sessions",
      inputSchema: {
        type: "object",
        properties: {
          dryRun: {
            type: "boolean",
            default: false,
            description: "If true, only return what would be deleted without deleting",
          },
        },
      },
    },
  ];

  constructor() {
    this.server = new Server(
      { name: "session-management", version: "1.15.6" },
      { capabilities: { tools: {} } },
    );

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        switch (name) {
          case "create_session":
            return this.handleCreateSession(args);
          case "get_session":
            return this.handleGetSession(args);
          case "update_session":
            return this.handleUpdateSession(args);
          case "delete_session":
            return this.handleDeleteSession(args);
          case "list_sessions":
            return this.handleListSessions(args);
          case "session_exists":
            return this.handleSessionExists(args);
          case "cleanup_expired_sessions":
            return this.handleCleanupExpiredSessions(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private isExpired(session: SessionData): boolean {
    if (!session.expiresAt) return false;
    return Date.now() > session.expiresAt;
  }

  private handleCreateSession(args: any) {
    const { sessionId, data = {}, ttl } = args;
    const id = sessionId || this.generateSessionId();

    const now = Date.now();
    const session: SessionData = {
      id,
      data,
      createdAt: now,
      lastAccessed: now,
      expiresAt: ttl ? now + ttl * 1000 : undefined,
    };

    this.sessions.set(id, session);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              sessionId: id,
              createdAt: new Date(session.createdAt).toISOString(),
              expiresAt: session.expiresAt
                ? new Date(session.expiresAt).toISOString()
                : "never",
              data: session.data,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private handleGetSession(args: any) {
    const { sessionId } = args;
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: "Session not found",
                sessionId,
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }

    if (this.isExpired(session)) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: "Session has expired",
                sessionId,
                expiredAt: session.expiresAt,
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }

    // Update last accessed
    session.lastAccessed = Date.now();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              sessionId: session.id,
              createdAt: new Date(session.createdAt).toISOString(),
              lastAccessed: new Date(session.lastAccessed).toISOString(),
              expiresAt: session.expiresAt
                ? new Date(session.expiresAt).toISOString()
                : "never",
              data: session.data,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private handleUpdateSession(args: any) {
    const { sessionId, data, extendTtl } = args;
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: "Session not found",
                sessionId,
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }

    // Merge data
    session.data = { ...session.data, ...data };
    session.lastAccessed = Date.now();

    // Extend TTL if requested
    if (extendTtl && session.expiresAt) {
      session.expiresAt = session.expiresAt + extendTtl * 1000;
    } else if (extendTtl && !session.expiresAt) {
      session.expiresAt = Date.now() + extendTtl * 1000;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              sessionId: session.id,
              updatedAt: new Date(session.lastAccessed).toISOString(),
              expiresAt: session.expiresAt
                ? new Date(session.expiresAt).toISOString()
                : "never",
              data: session.data,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private handleDeleteSession(args: any) {
    const { sessionId } = args;
    const existed = this.sessions.has(sessionId);
    this.sessions.delete(sessionId);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              sessionId,
              deleted: existed,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private handleListSessions(args: any) {
    const { includeExpired = false, limit = 50 } = args;
    const now = Date.now();

    const sessions = Array.from(this.sessions.values())
      .filter((session) => {
        if (includeExpired) return true;
        if (!session.expiresAt) return true;
        return now < session.expiresAt;
      })
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .slice(0, limit)
      .map((session) => ({
        sessionId: session.id,
        createdAt: new Date(session.createdAt).toISOString(),
        lastAccessed: new Date(session.lastAccessed).toISOString(),
        expiresAt: session.expiresAt
          ? new Date(session.expiresAt).toISOString()
          : "never",
        isExpired: session.expiresAt ? now > session.expiresAt : false,
        dataKeys: Object.keys(session.data),
      }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total: sessions.length,
              includeExpired,
              sessions,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private handleSessionExists(args: any) {
    const { sessionId } = args;
    const session = this.sessions.get(sessionId);

    const exists = session && !this.isExpired(session);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              sessionId,
              exists,
              ...(session && !this.isExpired(session)
                ? {
                    createdAt: new Date(session.createdAt).toISOString(),
                    lastAccessed: new Date(session.lastAccessed).toISOString(),
                  }
                : {}),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private handleCleanupExpiredSessions(args: any) {
    const { dryRun = false } = args;
    const now = Date.now();
    let cleaned = 0;
    const expiredIds: string[] = [];

    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt && now > session.expiresAt) {
        expiredIds.push(id);
        if (!dryRun) {
          this.sessions.delete(id);
        }
        cleaned++;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              dryRun,
              cleaned,
              expiredSessionIds: expiredIds,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    await frameworkLogger.log("mcp-session-management", "server-started", "success");

    const cleanup = async (signal: string) => {
      frameworkLogger.log("mcps/session-management", "shutdown", "info", { signal });

      const timeout = setTimeout(() => {
        frameworkLogger.log("mcps/session-management", "shutdown", "error", { message: "Graceful shutdown timeout, forcing exit..." });
        process.exit(1);
      }, 5000);

      try {
        if (this.server && typeof this.server.close === "function") {
          await this.server.close();
        }
        clearTimeout(timeout);
        frameworkLogger.log("mcps/session-management", "shutdown", "success");
        process.exit(0);
      } catch (error) {
        clearTimeout(timeout);
        frameworkLogger.log("mcps/session-management", "shutdown", "error", { message: `Error during server shutdown: ${String(error)}` });
        process.exit(1);
      }
    };

    process.on("SIGINT", () => cleanup("SIGINT"));
    process.on("SIGTERM", () => cleanup("SIGTERM"));
    process.on("SIGHUP", () => cleanup("SIGHUP"));

    const checkParent = () => {
      try {
        process.kill(process.ppid, 0);
        setTimeout(checkParent, 1000);
      } catch {
        frameworkLogger.log("mcps/session-management", "parent-death", "info");
        cleanup("parent-process-death");
      }
    };

    setTimeout(checkParent, 2000);

    process.on("uncaughtException", (error) => {
      frameworkLogger.log("mcps/session-management", "uncaughtException", "error", { error: String(error) });
      cleanup("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      frameworkLogger.log("mcps/session-management", "unhandledRejection", "error", { error: String(reason) });
      cleanup("unhandledRejection");
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SessionManagementServer();
  server.run().catch((error) => frameworkLogger.log("mcps/session-management", "run", "error", { error: String(error) }));
}

export default SessionManagementServer;
