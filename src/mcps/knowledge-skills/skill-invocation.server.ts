import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { mcpClientManager } from "../mcp-client.js";

class SkillInvocationServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "strray/skill-invocation", version: "1.15.17",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "invoke-skill",
            description:
              "Generic skill invocation tool for calling any MCP skill server",
            inputSchema: {
              type: "object",
              properties: {
                skillName: {
                  type: "string",
                  enum: [
                    // Core skills
                    "code-review",
                    "code-reviewer",
                    "security-audit",
                    "security-auditor",
                    "security-scan",
                    "performance-optimization",
                    "testing-strategy",
                    "testing-lead",
                    "testing-best-practices",
                    "project-analysis",
                    "database-design",
                    "devops-deployment",
                    "api-design",
                    "ui-ux-design",
                    "documentation-generation",
                    "refactoring-strategies",
                    "architecture-patterns",
                    // Additional skills
                    "bug-triage-specialist",
                    "log-monitor",
                    "mobile-development",
                    "git-workflow",
                    "state-manager",
                    "session-management",
                    "boot-orchestrator",
                    "processor-pipeline",
                    "code-analyzer",
                    "lint",
                    "auto-format",
                    "model-health-check",
                    "framework-compliance-audit",
                  ],
                  description: "Name of the skill to invoke",
                },
                toolName: {
                  type: "string",
                  description: "Name of the tool within the skill to execute",
                },
                args: {
                  type: "object",
                  description: "Arguments to pass to the skill tool",
                },
              },
              required: ["skillName", "toolName"],
            },
          },
          {
            name: "skill-code-review",
            description:
              "Invoke code review skill for comprehensive code analysis",
            inputSchema: {
              type: "object",
              properties: {
                code: { type: "string", description: "Code to analyze" },
                language: {
                  type: "string",
                  description: "Programming language",
                },
                context: { type: "object", description: "Additional context" },
              },
              required: ["code"],
            },
          },
          {
            name: "skill-security-audit",
            description:
              "Invoke security audit skill for vulnerability scanning",
            inputSchema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string" },
                  description: "Files to audit",
                },
                severity: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"],
                  description: "Minimum severity level",
                },
              },
              required: ["files"],
            },
          },
          {
            name: "skill-performance-optimization",
            description:
              "Invoke performance optimization skill for bottleneck analysis",
            inputSchema: {
              type: "object",
              properties: {
                code: { type: "string", description: "Code to analyze" },
                language: {
                  type: "string",
                  description: "Programming language",
                },
                metrics: {
                  type: "array",
                  items: { type: "string" },
                  description: "Performance metrics to analyze",
                },
              },
              required: ["code"],
            },
          },
          {
            name: "skill-testing-strategy",
            description: "Invoke testing strategy skill for test planning",
            inputSchema: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "Code to analyze for testing",
                },
                existingTests: {
                  type: "array",
                  items: { type: "string" },
                  description: "Existing test files",
                },
                requirements: {
                  type: "object",
                  description: "Testing requirements and constraints",
                },
              },
              required: ["code"],
            },
          },
          {
            name: "skill-project-analysis",
            description: "Invoke project analysis skill for codebase insights",
            inputSchema: {
              type: "object",
              properties: {
                scope: {
                  type: "string",
                  enum: ["full", "directory", "file"],
                  description: "Analysis scope",
                },
                analysis: {
                  type: "array",
                  items: { type: "string" },
                  description: "Types of analysis to perform",
                },
              },
            },
          },
          {
            name: "skill-database-design",
            description:
              "Invoke database design skill for schema design and query optimization",
            inputSchema: {
              type: "object",
              properties: {
                schema: {
                  type: "string",
                  description: "Database schema or entities",
                },
                databaseType: {
                  type: "string",
                  enum: ["postgresql", "mysql", "mongodb", "dynamodb"],
                  description: "Target database type",
                },
              },
              required: ["schema"],
            },
          },
          {
            name: "skill-devops-deployment",
            description:
              "Invoke DevOps deployment skill for CI/CD and infrastructure",
            inputSchema: {
              type: "object",
              properties: {
                projectType: { type: "string", description: "Type of project" },
                cloudProvider: {
                  type: "string",
                  enum: ["aws", "gcp", "azure"],
                  description: "Target cloud provider",
                },
              },
              required: ["projectType"],
            },
          },
          {
            name: "skill-api-design",
            description: "Invoke API design skill for REST/GraphQL endpoints",
            inputSchema: {
              type: "object",
              properties: {
                resources: {
                  type: "array",
                  items: { type: "string" },
                  description: "API resources",
                },
                style: {
                  type: "string",
                  enum: ["rest", "graphql"],
                  description: "API style",
                },
              },
              required: ["resources"],
            },
          },
          {
            name: "skill-ui-ux-design",
            description: "Invoke UI/UX design skill for component design",
            inputSchema: {
              type: "object",
              properties: {
                component: {
                  type: "string",
                  description: "Component to design",
                },
                framework: {
                  type: "string",
                  enum: ["react", "vue", "angular", "svelte"],
                  description: "Target framework",
                },
              },
              required: ["component"],
            },
          },
          {
            name: "skill-documentation-generation",
            description: "Invoke documentation skill for API docs and README",
            inputSchema: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["api", "readme", "guide"],
                  description: "Documentation type",
                },
                code: { type: "string", description: "Code to document" },
              },
              required: ["type"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "invoke-skill":
            return await this.handleInvokeSkill(args);
          case "skill-code-review":
            return await this.handleSkillCodeReview(args);
          case "skill-security-audit":
            return await this.handleSkillSecurityAudit(args);
          case "skill-performance-optimization":
            return await this.handleSkillPerformanceOptimization(args);
          case "skill-testing-strategy":
            return await this.handleSkillTestingStrategy(args);
          case "skill-project-analysis":
            return await this.handleSkillProjectAnalysis(args);
          case "skill-database-design":
            return await this.handleSkillDatabaseDesign(args);
          case "skill-devops-deployment":
            return await this.handleSkillDevopsDeployment(args);
          case "skill-api-design":
            return await this.handleSkillApiDesign(args);
          case "skill-ui-ux-design":
            return await this.handleSkillUiUxDesign(args);
          case "skill-documentation-generation":
            return await this.handleSkillDocumentationGeneration(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`,
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  }

  private async handleInvokeSkill(args: any) {
    const { skillName, toolName, args: toolArgs = {} } = args;

    const result = await mcpClientManager.callServerTool(
      skillName,
      toolName,
      toolArgs,
    );

    return {
      content: [
        {
          type: "text",
          text: `Skill ${skillName} invoked successfully with tool ${toolName}`,
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSkillCodeReview(args: any) {
    const result = await mcpClientManager.callServerTool(
      "code-review",
      "analyze_code_quality",
      args,
    );

    return {
      content: [
        {
          type: "text",
          text: "Code review analysis completed:",
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSkillSecurityAudit(args: any) {
    const result = await mcpClientManager.callServerTool(
      "security-audit",
      "scan_vulnerabilities",
      args,
    );

    return {
      content: [
        {
          type: "text",
          text: "Security audit completed:",
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSkillPerformanceOptimization(args: any) {
    const result = await mcpClientManager.callServerTool(
      "performance-optimization",
      "analyze_performance",
      args,
    );

    return {
      content: [
        {
          type: "text",
          text: "Performance analysis completed:",
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSkillTestingStrategy(args: any) {
    const result = await mcpClientManager.callServerTool(
      "testing-strategy",
      "analyze_test_coverage",
      args,
    );

    return {
      content: [
        {
          type: "text",
          text: "Testing strategy analysis completed:",
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSkillProjectAnalysis(args: any) {
    const result = await mcpClientManager.callServerTool(
      "researcher",
      "analyze-project-health",
      args,
    );

    return {
      content: [
        {
          type: "text",
          text: "Project analysis completed:",
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSkillDatabaseDesign(args: any) {
    const result = await mcpClientManager.callServerTool(
      "database-design",
      "schema_analysis",
      args,
    );

    return {
      content: [
        {
          type: "text",
          text: "Database design analysis completed:",
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSkillDevopsDeployment(args: any) {
    const result = await mcpClientManager.callServerTool(
      "devops-deployment",
      "pipeline_generation",
      args,
    );

    return {
      content: [
        {
          type: "text",
          text: "DevOps deployment configuration completed:",
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSkillApiDesign(args: any) {
    const result = await mcpClientManager.callServerTool(
      "api-design",
      "endpoint_design",
      args,
    );

    return {
      content: [
        {
          type: "text",
          text: "API design completed:",
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSkillUiUxDesign(args: any) {
    const result = await mcpClientManager.callServerTool(
      "ui-ux-design",
      "design_component",
      args,
    );

    return {
      content: [
        {
          type: "text",
          text: "UI/UX design completed:",
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSkillDocumentationGeneration(args: any) {
    const result = await mcpClientManager.callServerTool(
      "documentation-generation",
      "generate_documentation",
      args,
    );

    return {
      content: [
        {
          type: "text",
          text: "Documentation generation completed:",
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SkillInvocationServer();
  server.run().catch(() => {});
}

export { SkillInvocationServer };
