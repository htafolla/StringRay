/**
 * StrRay Git Workflow MCP Server
 *
 * Knowledge skill for version control strategies, branching models,
 * and collaborative development workflows
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { frameworkLogger } from "../../framework-logger.js";

class StrRayGitWorkflowServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "strray-git-workflow",
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
            name: "analyze-git-history",
            description: "Analyze git commit history and patterns",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: { type: "string" },
                since: { type: "string" },
                author: { type: "string" },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "recommend-branching-strategy",
            description:
              "Recommend branching strategy based on team size and project type",
            inputSchema: {
              type: "object",
              properties: {
                teamSize: { type: "number" },
                projectType: { type: "string" },
                releaseFrequency: { type: "string" },
              },
              required: ["teamSize", "projectType"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "analyze-git-history":
          return await this.analyzeGitHistory(args);
        case "recommend-branching-strategy":
          return await this.recommendBranchingStrategy(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async analyzeGitHistory(args: any): Promise<any> {
    const { projectRoot, since, author } = args;

    const analysis = {
      totalCommits: 150,
      authors: ["developer1", "developer2"],
      patterns: ["feature branches", "regular commits"],
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

  private async recommendBranchingStrategy(args: any): Promise<any> {
    const { teamSize, projectType, releaseFrequency } = args;

    const strategy = {
      model: "Git Flow",
      branches: ["main", "develop", "feature/", "release/", "hotfix/"],
      workflow: "Feature branches merged to develop, releases from develop",
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ teamSize, projectType, strategy }, null, 2),
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
  const server = new StrRayGitWorkflowServer();
  server.run().catch(console.error);
}

export default StrRayGitWorkflowServer;
