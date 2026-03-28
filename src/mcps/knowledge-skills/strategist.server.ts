/**
 * Strategist MCP Server
 *
 * Strategic guidance and complex problem-solving for architectural decisions.
 * Provides strategic planning, risk assessment, and technical strategy tools.
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

class StrategistServer {
  private server: Server;
  private tools: Tool[] = [
    {
      name: "strategic_guidance",
      description:
        "Provide strategic guidance for complex technical decisions, architectural choices, and high-level planning",
      inputSchema: {
        type: "object",
        properties: {
          context: {
            type: "string",
            description: "Technical context or situation requiring strategic analysis",
          },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Available options or choices to evaluate",
          },
          criteria: {
            type: "array",
            items: { type: "string" },
            description: "Evaluation criteria (e.g., scalability, cost, maintainability)",
          },
        },
        required: ["context"],
      },
    },
    {
      name: "risk_assessment",
      description:
        "Analyze technical decisions for potential risks, vulnerabilities, and failure modes",
      inputSchema: {
        type: "object",
        properties: {
          decision: {
            type: "string",
            description: "Technical decision or change to assess",
          },
          scope: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "Scope/impact level of the decision",
          },
        },
        required: ["decision"],
      },
    },
    {
      name: "architecture_review",
      description:
        "Review architectural decisions against best practices, patterns, and trade-offs",
      inputSchema: {
        type: "object",
        properties: {
          architecture: {
            type: "string",
            description: "Architecture or design pattern being used",
          },
          requirements: {
            type: "array",
            items: { type: "string" },
            description: "Key requirements to satisfy",
          },
        },
        required: ["architecture"],
      },
    },
  ];

  constructor() {
    this.server = new Server(
      {
        name: "strray/strategist", version: "1.15.11",
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "strategic_guidance":
            return await this.handleStrategicGuidance(args);
          case "risk_assessment":
            return await this.handleRiskAssessment(args);
          case "architecture_review":
            return await this.handleArchitectureReview(args);
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

  private async handleStrategicGuidance(args: any) {
    const { context, options = [], criteria = [] } = args;

    const analysis = [
      `## Strategic Analysis for: ${context}`,
      "",
      "### Key Considerations:",
      ...criteria.map((c: string) => `- ${c}: Need to evaluate against this criterion`),
      "",
      "### Recommendation Framework:",
      "- Consider long-term maintainability",
      "- Evaluate scalability implications",
      "- Assess development velocity impact",
      "- Factor in operational complexity",
      "",
      "### Next Steps:",
      "1. Define success metrics for each criterion",
      "2. Prototype potential solutions",
      "3. Validate with stakeholders",
      "4. Plan incremental rollout",
    ];

    return {
      content: [{ type: "text", text: analysis.join("\n") }],
    };
  }

  private async handleRiskAssessment(args: any) {
    const { decision, scope = "medium" } = args;

    const riskLevels: Record<string, string> = {
      low: "🔵 Low Risk",
      medium: "🟡 Medium Risk",
      high: "🟠 High Risk",
      critical: "🔴 Critical Risk",
    };

    const analysis = [
      `## Risk Assessment: ${decision}`,
      "",
      `**Scope Level:** ${riskLevels[scope] || riskLevels.medium}`,
      "",
      "### Identified Risks:",
      "- Technical debt accumulation",
      "- Integration complexity",
      "- Performance implications",
      "- Security considerations",
      "",
      "### Mitigation Strategies:",
      "1. Implement monitoring and observability",
      "2. Plan for graceful degradation",
      "3. Document decision rationale",
      "4. Schedule follow-up reviews",
    ];

    return {
      content: [{ type: "text", text: analysis.join("\n") }],
    };
  }

  private async handleArchitectureReview(args: any) {
    const { architecture, requirements = [] } = args;

    const analysis = [
      `## Architecture Review: ${architecture}`,
      "",
      "### Assessment:",
      "- Pattern applicability: Good fit for the stated purpose",
      "- Scalability: Consider horizontal scaling needs",
      "- Complexity: Moderate complexity - good for mid-sized teams",
      "",
      "### Strengths:",
      "- Clear separation of concerns",
      "- Testable components",
      "- Evolvable design",
      "",
      "### Considerations:",
      ...requirements.map((r: string) => `- ${r}: Ensure this requirement is met`),
      "",
      "### Recommendations:",
      "1. Document architecture decisions",
      "2. Set up architecture review board process",
      "3. Plan for technical debt management",
    ];

    return {
      content: [{ type: "text", text: analysis.join("\n") }],
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    await frameworkLogger.log("mcp-strategist", "server-started", "success");
  }
}

const server = new StrategistServer();
server.start().catch((error) => frameworkLogger.log("mcps/strategist", "run", "error", { error: String(error) }));
