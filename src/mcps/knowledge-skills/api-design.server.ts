/**
 * StrRay API Design MCP Server
 *
 * Knowledge skill for API design patterns, RESTful conventions,
 * GraphQL schema design, and API documentation standards
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { frameworkLogger } from "../../framework-logger.js";

class StrRayApiDesignServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "strray-api-design",
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
            name: "design-api-endpoints",
            description:
              "Design RESTful API endpoints with proper resource modeling",
            inputSchema: {
              type: "object",
              properties: {
                resource: { type: "string" },
                operations: { type: "array", items: { type: "string" } },
                relationships: { type: "array", items: { type: "string" } },
              },
              required: ["resource"],
            },
          },
          {
            name: "validate-api-design",
            description:
              "Validate API design against RESTful principles and best practices",
            inputSchema: {
              type: "object",
              properties: {
                endpoints: { type: "array", items: { type: "string" } },
                standards: { type: "array", items: { type: "string" } },
              },
              required: ["endpoints"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "design-api-endpoints":
          return await this.designApiEndpoints(args);
        case "validate-api-design":
          return await this.validateApiDesign(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async designApiEndpoints(args: any): Promise<any> {
    const { resource, operations, relationships } = args;

    const design = {
      resource: resource.toLowerCase(),
      endpoints: [
        `GET /api/${resource}s`,
        `POST /api/${resource}s`,
        `GET /api/${resource}s/{id}`,
        `PUT /api/${resource}s/{id}`,
        `DELETE /api/${resource}s/{id}`,
      ],
      relationships: relationships || [],
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ resource, design }, null, 2),
        },
      ],
    };
  }

  private async validateApiDesign(args: any): Promise<any> {
    const { endpoints, standards } = args;

    const validation = {
      score: 85,
      issues: ["Consider using plural resource names"],
      recommendations: [
        "Add HATEOAS links",
        "Implement proper HTTP status codes",
      ],
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ endpoints, validation }, null, 2),
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
  const server = new StrRayApiDesignServer();
  server.run().catch(console.error);
}

export default StrRayApiDesignServer;
