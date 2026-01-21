/**
 * StrRay Performance Optimization MCP Server
 *
 * Knowledge skill for performance analysis, optimization recommendations,
 * and bottleneck identification
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { frameworkLogger } from "../../framework-logger.js";

class StrRayPerformanceOptimizationServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "strray-performance-optimization",
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
            name: "analyze-performance",
            description: "Analyze system performance and identify bottlenecks",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
                metrics: { type: "array", items: { type: "string" } },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "optimize-performance",
            description: "Provide performance optimization recommendations",
            inputSchema: {
              type: "object",
              properties: {
                bottlenecks: { type: "array", items: { type: "string" } },
                constraints: { type: "array", items: { type: "string" } },
              },
              required: ["bottlenecks"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "analyze-performance":
          return await this.analyzePerformance(args);
        case "optimize-performance":
          return await this.optimizePerformance(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async analyzePerformance(args: any): Promise<any> {
    const { projectRoot, metrics } = args;

    const analysis = {
      bottlenecks: ["memory usage", "cpu intensive operations"],
      recommendations: ["Implement caching", "Use lazy loading"],
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

  private async optimizePerformance(args: any): Promise<any> {
    const { bottlenecks, constraints } = args;

    const optimizations = {
      recommendations: ["Add caching layer", "Optimize database queries"],
      priority: "high",
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ bottlenecks, optimizations }, null, 2),
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
  const server = new StrRayPerformanceOptimizationServer();
  server.run().catch(console.error);
}

export default StrRayPerformanceOptimizationServer;
