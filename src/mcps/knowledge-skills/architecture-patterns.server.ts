/**
 * StrRay Architecture Patterns MCP Server
 *
 * Knowledge skill for architectural pattern recognition,
 * design pattern recommendations, and system architecture guidance
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "../../framework-logger.js";

class StrRayArchitecturePatternsServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "strray-architecture-patterns",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    // Server initialization - removed unnecessary startup logging
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "analyze-architecture",
            description:
              "Analyze current system architecture and identify patterns",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
                focusPatterns: { type: "array", items: { type: "string" } },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "recommend-patterns",
            description:
              "Recommend architectural patterns for specific use cases",
            inputSchema: {
              type: "object",
              properties: {
                useCase: { type: "string" },
                constraints: { type: "array", items: { type: "string" } },
                scale: { type: "string", enum: ["small", "medium", "large"] },
              },
              required: ["useCase"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "analyze-architecture":
          return await this.analyzeArchitecture(args);
        case "recommend-patterns":
          return await this.recommendPatterns(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async analyzeArchitecture(args: any): Promise<any> {
    const { projectRoot, focusPatterns } = args;

    // Simplified architecture analysis
    const analysis = {
      patterns: ["MVC", "Repository"],
      recommendations: ["Consider microservices for scaling"],
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ projectRoot, analysis }, null, 2),
        },
      ],
    };
  }

  private async recommendPatterns(args: any): Promise<any> {
    const { useCase, constraints, scale } = args;

    const recommendations = {
      patterns: ["Layered Architecture"],
      reasoning: "Based on use case analysis",
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ useCase, recommendations }, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Server startup - removed unnecessary startup logging

    const cleanup = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);

  // Set a timeout to force exit if graceful shutdown fails
  const timeout = setTimeout(() => {
    console.error('Graceful shutdown timeout, forcing exit...');
    process.exit(1);
  }, 5000); // 5 second timeout

  try {
    if (this.server && typeof this.server.close === 'function') {
      await this.server.close();
    }
    clearTimeout(timeout);
    console.log("StrRay MCP Server shut down gracefully");
    process.exit(0);
  } catch (error) {
    clearTimeout(timeout);
    console.error("Error during server shutdown:", error);
    process.exit(1);
  }
};


// Handle multiple shutdown signals
process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGHUP', () => cleanup('SIGHUP'));

// Monitor parent process (opencode) and shutdown if it dies
const checkParent = () => {
  try {
    process.kill(process.ppid, 0); // Check if parent is alive
    setTimeout(checkParent, 1000); // Check again in 1 second
  } catch (error) {
    // Parent process died, shut down gracefully
    console.log('Parent process (opencode) died, shutting down MCP server...');
    cleanup('parent-process-death');
  }
};

// Start monitoring parent process
setTimeout(checkParent, 2000); // Start checking after 2 seconds

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  cleanup('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  cleanup('unhandledRejection');
});

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayArchitecturePatternsServer();
  server.run().catch(console.error);
}

export default StrRayArchitecturePatternsServer;
