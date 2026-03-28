/**
 * Estimation MCP Server
 * 
 * Provides tools for tracking and validating estimates
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { frameworkLogger } from "../core/framework-logger.js";
import { getEstimationValidator } from "../validation/estimation-validator.js";

/**
 * Estimation MCP Server
 * Tracks estimates vs actuals and provides calibrated predictions
 */
class EstimationServer {
  private server: Server;
  private validator = getEstimationValidator();

  constructor() {
    this.server = new Server(
      {
        name: "estimation-validator", version: "1.15.11",
      },
      {
        capabilities: { tools: {} },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "validate-estimate",
            description: "Validate an estimate against historical data",
            inputSchema: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  description: "Task category (e.g., 'refactoring', 'testing', 'documentation')",
                },
                estimate: {
                  type: "number",
                  description: "Estimated time in minutes",
                },
                description: {
                  type: "string",
                  description: "Brief description of the task",
                },
              },
              required: ["category", "estimate"],
            },
          },
          {
            name: "start-tracking",
            description: "Start tracking time for a task",
            inputSchema: {
              type: "object",
              properties: {
                taskId: { type: "string" },
                category: { type: "string" },
                estimate: { type: "number" },
                description: { type: "string" },
              },
              required: ["taskId", "category", "estimate"],
            },
          },
          {
            name: "complete-tracking",
            description: "Complete tracking for a task",
            inputSchema: {
              type: "object",
              properties: {
                taskId: { type: "string" },
              },
              required: ["taskId"],
            },
          },
          {
            name: "get-accuracy-report",
            description: "Get estimation accuracy report",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        if (args == null) {
          throw new Error(`Tool '${name}' called with no arguments`);
        }

        switch (name) {
          case "validate-estimate":
            return this.handleValidateEstimate(args as { category: string; estimate: number; description?: string });
          
          case "start-tracking":
            return this.handleStartTracking(args as { taskId: string; category: string; estimate: number; description?: string });
          
          case "complete-tracking":
            return this.handleCompleteTracking(args as { taskId: string });
          
          case "get-accuracy-report":
            return this.handleGetReport();
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: `Error handling tool '${request.params.name}': ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    });
  }

  private handleValidateEstimate(args: { category: string; estimate: number; description?: string }): { content: Array<{ type: string; text: string }> } {
    const validation = this.validator.validateEstimate(args.category, args.estimate);
    
    const calibrated = this.validator.getCalibratedEstimate(args.category, args.estimate);

    let response = `📊 Estimate Validation: ${args.description || args.category}\n\n`;
    response += `Your estimate: ${args.estimate} minutes\n`;
    response += `Calibrated estimate: ${calibrated.calibratedEstimate} minutes (${Math.round(calibrated.calibrationFactor * 100)}% of estimate)\n`;
    response += `Confidence: ${Math.round(calibrated.confidence * 100)}%\n\n`;

    if (!validation.isReasonable) {
      response += `⚠️ ${validation.warning}\n\n`;
      response += `Suggested: ${validation.suggestedEstimate} minutes\n`;
    } else if (validation.warning) {
      response += `ℹ️ ${validation.warning}\n`;
    } else {
      response += `✅ Estimate looks reasonable based on historical data.\n`;
    }

    return { content: [{ type: "text", text: response }] };
  }

  private handleStartTracking(args: { taskId: string; category: string; estimate: number; description?: string }): { content: Array<{ type: string; text: string }> } {
    this.validator.startEstimate(
      args.taskId,
      args.description || args.taskId,
      args.category,
      args.estimate
    );

    return {
      content: [{
        type: "text",
        text: `⏱️ Started tracking "${args.taskId}"\nCategory: ${args.category}\nEstimated: ${args.estimate} minutes`,
      }],
    };
  }

  private handleCompleteTracking(args: { taskId: string }): { content: Array<{ type: string; text: string }> } {
    this.validator.completeEstimate(args.taskId);

    return {
      content: [{
        type: "text",
        text: `✅ Completed tracking "${args.taskId}"\nTime recorded and calibration updated.`,
      }],
    };
  }

  private handleGetReport(): { content: Array<{ type: string; text: string }> } {
    const report = this.validator.getAccuracyReport();

    let response = `📈 Estimation Accuracy Report\n\n`;
    response += `Overall Accuracy: ${Math.round(report.overallAccuracy * 100)}%\n\n`;

    if (report.categoryBreakdown.length > 0) {
      response += `Category Breakdown:\n`;
      for (const cat of report.categoryBreakdown) {
        const emoji = cat.trend === 'under' ? '🐌' : cat.trend === 'over' ? '⚡' : '✅';
        response += `${emoji} ${cat.category}: ${cat.sampleSize} samples, avg ratio ${cat.avgRatio.toFixed(2)}\n`;
      }
      response += `\n`;
    }

    if (report.recommendations.length > 0) {
      response += `Recommendations:\n`;
      for (const rec of report.recommendations) {
        response += `• ${rec}\n`;
      }
    } else {
      response += `✅ Your estimates are well-calibrated!\n`;
    }

    return { content: [{ type: "text", text: response }] };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    frameworkLogger.log("estimation-server", "start", "info", {
      message: "Estimation Validator Server started",
    });
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new EstimationServer();
  server.start().catch((error) => frameworkLogger.log("mcps/estimation", "run", "error", { error: String(error) }));
}

export { EstimationServer };
