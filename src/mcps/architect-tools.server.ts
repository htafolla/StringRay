/**
 * 0xRay Architect Tools MCP Server
 *
 * Converts architect-tools.ts functions into MCP server tools
 * Provides contextual analysis capabilities via MCP protocol
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "../core/framework-logger.js";
import {
  contextAnalysis as architectContextAnalysis,
  codebaseStructure as architectCodebaseStructure,
  dependencyAnalysis as architectDependencyAnalysis,
  architectureAssessment as architectArchitectureAssessment,
} from "../architect/architect-tools.js";

interface DirectoryNode {
  name: string;
  path: string;
  type: "directory";
  children: Array<DirectoryNode | FileNode | { truncated: boolean } | { error: string }>,
}

interface FileNode {
  name: string;
  type: "file";
  extension: string;
}

class StringRayArchitectToolsServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "architect-tools", version: "1.22.61",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    frameworkLogger.log("mcps/architect-tools", "init", "info", { message: "0xRay Architect Tools MCP Server initialized" });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "context-analysis",
            description:
              "Perform comprehensive codebase intelligence gathering including structure analysis, dependency mapping, and architectural pattern recognition",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project to analyze",
                },
                depth: {
                  type: "string",
                  enum: ["overview", "detailed", "comprehensive"],
                  default: "detailed",
                  description: "Analysis depth level",
                },
                includeFiles: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific files to include in analysis",
                },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "codebase-structure",
            description:
              "Analyze file organization, module distribution, and directory hierarchy with optional metrics",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project",
                },
                includeMetrics: {
                  type: "boolean",
                  default: true,
                  description: "Include detailed metrics",
                },
                maxDepth: {
                  type: "number",
                  default: 10,
                  description: "Maximum directory depth to analyze",
                },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "dependency-analysis",
            description:
              "Map component dependencies, identify coupling patterns, and assess architectural relationships",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project",
                },
                focusAreas: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific areas to focus dependency analysis on",
                },
                includeGraphs: {
                  type: "boolean",
                  default: true,
                  description: "Include dependency graphs in output",
                },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "architecture-assessment",
            description:
              "Evaluate overall architectural health with scores, issues, and improvement recommendations",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project",
                },
                assessmentType: {
                  type: "string",
                  enum: ["quick", "comprehensive"],
                  default: "comprehensive",
                  description: "Type of assessment to perform",
                },
                focusMetrics: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "complexity",
                      "coupling",
                      "cohesion",
                      "testability",
                      "scalability",
                    ],
                  },
                  description: "Specific metrics to focus assessment on",
                },
              },
              required: ["projectRoot"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        const { name, arguments: args } = request.params;

        try {
          switch (name) {
            case "context-analysis":
              return await this.contextAnalysis(args);
            case "codebase-structure":
              return await this.codebaseStructure(args);
            case "dependency-analysis":
              return await this.dependencyAnalysis(args);
            case "architecture-assessment":
              return await this.architectureAssessment(args);
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
        } catch (error) {
          frameworkLogger.log("mcps/architect-tools", "tool", "error", { tool: name, error: String(error) });
          throw error;
        }
      },
    );
  }

  // Tool implementations — delegates to real architect-tools library

  private async contextAnalysis(args: Record<string, unknown> | undefined) {
    const projectRoot = (args?.projectRoot as string) || "";
    const depth = (args?.depth as "overview" | "detailed" | "comprehensive") || "detailed";
    const includeFiles = args?.includeFiles as string[] | undefined;

    frameworkLogger.log("mcps/architect-tools", "context-analysis", "info", { projectRoot });

    const result = await architectContextAnalysis(projectRoot, includeFiles, depth);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async codebaseStructure(args: Record<string, unknown> | undefined) {
    const projectRoot = (args?.projectRoot as string) || "";
    const includeMetrics = (args?.includeMetrics as boolean) ?? true;

    frameworkLogger.log("mcps/architect-tools", "codebase-structure", "info", { projectRoot });

    const result = await architectCodebaseStructure(projectRoot, includeMetrics);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async dependencyAnalysis(args: Record<string, unknown> | undefined) {
    const projectRoot = (args?.projectRoot as string) || "";
    const focusAreas = args?.focusAreas as string[] | undefined;

    frameworkLogger.log("mcps/architect-tools", "dependency-analysis", "info", { projectRoot });

    const result = await architectDependencyAnalysis(projectRoot, focusAreas);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async architectureAssessment(args: Record<string, unknown> | undefined) {
    const projectRoot = (args?.projectRoot as string) || "";
    const assessmentType = (args?.assessmentType as "quick" | "comprehensive") || "comprehensive";

    frameworkLogger.log("mcps/architect-tools", "architecture-assessment", "info", { projectRoot });

    const result = await architectArchitectureAssessment(projectRoot, assessmentType);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    frameworkLogger.log("mcps/architect-tools", "start", "info");

    const cleanup = async (signal: string) => {
      frameworkLogger.log("mcps/architect-tools", "shutdown", "info", { signal });

      // Set a timeout to force exit if graceful shutdown fails
      const timeout = setTimeout(() => {
        frameworkLogger.log("mcps/architect-tools", "shutdown", "error", { message: "Graceful shutdown timeout, forcing exit..." });
        process.exit(1);
      }, 5000); // 5 second timeout

      try {
        if (this.server && typeof this.server.close === "function") {
          await this.server.close();
        }
        clearTimeout(timeout);
        frameworkLogger.log("mcps/architect-tools", "shutdown", "success");
        process.exit(0);
      } catch (error) {
        clearTimeout(timeout);
        frameworkLogger.log("mcps/architect-tools", "shutdown", "error", { message: `Error during server shutdown: ${String(error)}` });
        process.exit(1);
      }
    };

    // Handle multiple shutdown signals
    process.on("SIGINT", () => cleanup("SIGINT"));
    process.on("SIGTERM", () => cleanup("SIGTERM"));
    process.on("SIGHUP", () => cleanup("SIGHUP"));

    // Monitor parent process (opencode) and shutdown if it dies
    const checkParent = () => {
      try {
        process.kill(process.ppid, 0); // Check if parent is alive
        setTimeout(checkParent, 1000); // Check again in 1 second
      } catch (error) {
        // Parent process died, shut down gracefully
        frameworkLogger.log("mcps/architect-tools", "parent-death", "info");
        cleanup("parent-process-death");
      }
    };

    // Start monitoring parent process
    setTimeout(checkParent, 2000); // Start checking after 2 seconds

    // Handle uncaught exceptions and unhandled rejections
    process.on("uncaughtException", (error) => {
      frameworkLogger.log("mcps/architect-tools", "uncaughtException", "error", { error: String(error) });
      cleanup("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      frameworkLogger.log("mcps/architect-tools", "unhandledRejection", "error", { error: String(reason) });
      cleanup("unhandledRejection");
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StringRayArchitectToolsServer();
  server.run().catch((error) => frameworkLogger.log("mcps/architect-tools", "run", "error", { error: String(error) }));
}

export default StringRayArchitectToolsServer;
