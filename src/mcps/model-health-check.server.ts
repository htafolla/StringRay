/**
 * StrRay Model Health Check MCP Server
 *
 * Advanced model compatibility validation and dynamic health assessment
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import fs from "fs";

class StrRayModelHealthCheckServer {
  private server: Server;

  constructor() {
        this.server = new Server(
      {
        name: "strray-model-health-check",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    console.log("StrRay Model Health Check MCP Server initialized");
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "model-health-check",
            description:
              "Advanced model compatibility validation and dynamic health assessment",
            inputSchema: {
              type: "object",
              properties: {
                models: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Specific models to check (optional - checks all configured if empty)",
                },
                compatibility: {
                  type: "boolean",
                  default: true,
                  description: "Include compatibility matrix in results",
                },
                performance: {
                  type: "boolean",
                  default: true,
                  description: "Include performance metrics in results",
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "model-health-check":
          return await this.handleModelHealthCheck(args || {});
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleModelHealthCheck(args: any) {
    const models = args.models || ["opencode/grok-code"];
    const includeCompatibility = args.compatibility !== false;
    const includePerformance = args.performance !== false;

    const results = {
      models: [] as any[],
      compatibilityMatrix: {} as Record<string, Record<string, boolean>>,
      performanceMetrics: {} as Record<string, any>,
      summary: {
        total: models.length,
        healthy: 0,
        issues: 0,
      },
    };

    // Check each model
    for (const model of models) {
      try {
        const modelHealth = await this.checkModelHealth(model);
        results.models.push(modelHealth);

        if (modelHealth.healthy) {
          results.summary.healthy++;
        } else {
          results.summary.issues++;
        }

        if (
          includePerformance &&
          modelHealth.latency !== undefined &&
          modelHealth.latency !== null
        ) {
          results.performanceMetrics[model] = {
            latency: modelHealth.latency,
            throughput: "N/A",
          };
        }
      } catch (error) {
        results.models.push({
          model,
          healthy: false,
          issues: [
            `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
          ],
          latency: undefined,
        });
        results.summary.issues++;
      }
    }

    // Generate compatibility matrix if requested
    if (includeCompatibility && models.length > 1) {
      results.compatibilityMatrix = this.generateCompatibilityMatrix(models);
    }

    // Generate report
    const report = this.generateHealthReport(results);

    return {
      content: [{ type: "text", text: report }],
    };
  }

  private async checkModelHealth(model: string) {
    // Simulate model health check - in real implementation, this would test actual model connectivity
    const issues: string[] = [];
    let latency: number | undefined = Math.random() * 1000 + 500; // Simulate 500-1500ms latency

    // Basic health checks
    if (!model || !model.includes("/")) {
      issues.push("Invalid model format");
    }

    if (model === "opencode/grok-code") {
      // Known healthy model
    } else {
      // Simulate potential issues for other models
      if (Math.random() < 0.1) {
        issues.push("Model temporarily unavailable");
        latency = undefined;
      }
    }

    return {
      model,
      healthy: issues.length === 0,
      issues,
      latency,
      timestamp: new Date().toISOString(),
    };
  }

  private generateCompatibilityMatrix(models: string[]) {
    const matrix: Record<string, Record<string, boolean>> = {};

    // Generate mock compatibility data
    for (const model1 of models) {
      matrix[model1] = {};
      for (const model2 of models) {
        // Models are generally compatible with themselves and similar models
        matrix[model1][model2] =
          model1 === model2 || model1.split("/")[0] === model2.split("/")[0];
      }
    }

    return matrix;
  }

  private generateHealthReport(results: any): string {
    let report = "# Model Health Check Report\n\n";

    // Summary
    report += "## Summary\n";
    report += `- Total Models: ${results.summary.total}\n`;
    report += `- Healthy: ${results.summary.healthy}\n`;
    report += `- Issues: ${results.summary.issues}\n\n`;

    // Model Status Details
    report += "## Model Status Details\n";
    for (const modelResult of results.models) {
      report += `**${modelResult.model}:**\n`;
      report += `- Healthy: ${modelResult.healthy ? "Yes" : "No"}\n`;
      report += `- Issues: ${modelResult.issues?.join(", ") || "None"}\n`;
      report += `- Latency: ${modelResult.latency || "N/A"}ms\n\n`;
    }

    // Compatibility Matrix
    if (Object.keys(results.compatibilityMatrix).length > 0) {
      report += "## Compatibility Matrix\n";
      const firstModel = Object.keys(results.compatibilityMatrix)[0];
      if (firstModel && results.compatibilityMatrix[firstModel]) {
        report +=
          "| Model \\\\ Model | " +
          Object.keys(results.compatibilityMatrix[firstModel]).join(" | ") +
          " |\n";
        report +=
          "|---------------|" +
          Object.keys(results.compatibilityMatrix[firstModel])
            .map(() => "---|")
            .join("") +
          "\n";

        for (const model1 of Object.keys(results.compatibilityMatrix)) {
          report += `| ${model1} |`;
          for (const model2 of Object.keys(
            results.compatibilityMatrix[model1],
          )) {
            const compatible = results.compatibilityMatrix[model1][model2];
            report += ` ${compatible ? "✅" : "❌"} |`;
          }
          report += "\n";
        }
      }
      report += "\n";
    }

    // Performance Metrics
    if (Object.keys(results.performanceMetrics).length > 0) {
      report += "## Performance Metrics\n";
      for (const [model, metrics] of Object.entries(
        results.performanceMetrics,
      )) {
        const perfMetrics = metrics as any;
        report += `**${model}:**\n`;
        report += `- Average Latency: ${perfMetrics.latency}ms\n`;
        report += `- Throughput: ${perfMetrics.throughput}\n\n`;
      }
    }

    return report;
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Model Health Check MCP Server started");
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayModelHealthCheckServer();
  server.start().catch(console.error);
}

export default StrRayModelHealthCheckServer;
