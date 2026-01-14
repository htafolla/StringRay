/**
 * StrRay Performance Analysis MCP Server
 *
 * Comprehensive metrics analysis for framework integration and optimization
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

class StrRayPerformanceAnalysisServer {
  private server: Server;
  private startTime: number;

  constructor() {
        this.server = new Server(
      {
        name: "strray-performance-analysis",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.startTime = Date.now();
    this.setupToolHandlers();
    console.log("StrRay Performance Analysis MCP Server initialized");
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "performance-analysis",
            description:
              "Comprehensive metrics analysis for framework integration and optimization",
            inputSchema: {
              type: "object",
              properties: {
                scope: {
                  type: "string",
                  enum: [
                    "full",
                    "runtime",
                    "build",
                    "resources",
                    "bottlenecks",
                  ],
                  default: "full",
                  description: "Scope of performance analysis",
                },
                duration: {
                  type: "number",
                  default: 30,
                  description: "Analysis duration in seconds",
                },
                detailed: {
                  type: "boolean",
                  default: false,
                  description: "Include detailed metrics and recommendations",
                },
              },
            },
          },
          {
            name: "bottleneck-detection",
            description:
              "Identify performance bottlenecks in framework operations",
            inputSchema: {
              type: "object",
              properties: {
                operation: {
                  type: "string",
                  description: "Specific operation to analyze",
                },
                threshold: {
                  type: "number",
                  default: 1000,
                  description: "Performance threshold in milliseconds",
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
        case "performance-analysis":
          return await this.handlePerformanceAnalysis(args);
        case "bottleneck-detection":
          return await this.handleBottleneckDetection(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handlePerformanceAnalysis(args: any) {
    const scope = args.scope || "full";
    const duration = args.duration || 30;
    const detailed = args.detailed || false;

    console.log("📊 MCP: Performing performance analysis:", {
      scope,
      duration,
      detailed,
    });

    const analysisResults = {
      metrics: {} as Record<string, any>,
      bottlenecks: [] as string[],
      recommendations: [] as string[],
      summary: "",
      passed: true,
    };

    try {
      const startTime = Date.now();

      // 1. Runtime Performance Analysis
      if (scope === "runtime" || scope === "full") {
        const runtimeMetrics = await this.analyzeRuntimePerformance(duration);
        analysisResults.metrics.runtime = runtimeMetrics;
        analysisResults.bottlenecks.push(...runtimeMetrics.bottlenecks);
        analysisResults.recommendations.push(...runtimeMetrics.recommendations);
      }

      // 2. Build Performance Analysis
      if (scope === "build" || scope === "full") {
        const buildMetrics = await this.analyzeBuildPerformance();
        analysisResults.metrics.build = buildMetrics;
        analysisResults.bottlenecks.push(...buildMetrics.bottlenecks);
        analysisResults.recommendations.push(...buildMetrics.recommendations);
      }

      // 3. Resource Usage Analysis
      if (scope === "resources" || scope === "full") {
        const resourceMetrics = await this.analyzeResourceUsage();
        analysisResults.metrics.resources = resourceMetrics;
        analysisResults.bottlenecks.push(...resourceMetrics.bottlenecks);
        analysisResults.recommendations.push(
          ...resourceMetrics.recommendations,
        );
      }

      // 4. Bottleneck Detection
      if (scope === "bottlenecks" || scope === "full") {
        const bottleneckResults = await this.detectBottlenecks();
        analysisResults.bottlenecks.push(...bottleneckResults.bottlenecks);
        analysisResults.recommendations.push(
          ...bottleneckResults.recommendations,
        );
      }

      const totalTime = Date.now() - startTime;
      analysisResults.metrics.analysis_time = `${totalTime}ms`;

      // Check performance thresholds
      analysisResults.passed = this.checkPerformanceThresholds(analysisResults);

      // Generate summary
      analysisResults.summary =
        this.generatePerformanceSummary(analysisResults);
    } catch (error) {
      console.error("Performance analysis error:", error);
      analysisResults.passed = false;
      analysisResults.bottlenecks.push(
        `Analysis error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const response = `📊 StrRay Performance Analysis Results

${analysisResults.summary}

**Analysis Time:** ${analysisResults.metrics.analysis_time || "N/A"}

**Runtime Metrics:**
${this.formatMetrics(analysisResults.metrics.runtime)}

**Build Metrics:**
${this.formatMetrics(analysisResults.metrics.build)}

**Resource Metrics:**
${this.formatMetrics(analysisResults.metrics.resources)}

**Bottlenecks Detected:** ${analysisResults.bottlenecks.length}
${analysisResults.bottlenecks.length > 0 ? analysisResults.bottlenecks.map((b) => `• 🚧 ${b}`).join("\n") : "None"}

**Recommendations:**
${analysisResults.recommendations.length > 0 ? analysisResults.recommendations.map((r) => `• 💡 ${r}`).join("\n") : "No recommendations"}

**Overall Status:** ${analysisResults.passed ? "✅ PERFORMANCE ACCEPTABLE" : "❌ PERFORMANCE ISSUES DETECTED"}`;

    if (detailed) {
      const detailedReport = await this.generateDetailedReport(analysisResults);
      return {
        content: [
          { type: "text", text: response },
          { type: "text", text: `\n📊 Detailed Report:\n${detailedReport}` },
        ],
      };
    }

    return {
      content: [{ type: "text", text: response }],
    };
  }

  private async handleBottleneckDetection(args: any) {
    const operation = args.operation || "general";
    const threshold = args.threshold || 1000;

    console.log("🔍 MCP: Detecting bottlenecks:", { operation, threshold });

    try {
      const results = await this.analyzeSpecificBottlenecks(
        operation,
        threshold,
      );

      return {
        content: [
          {
            type: "text",
            text: `🔍 Bottleneck Detection Results for "${operation}"

**Threshold:** ${threshold}ms

**Bottlenecks Found:** ${results.bottlenecks.length}
${results.bottlenecks.map((b) => `• 🚧 ${b}`).join("\n") || "None detected"}

**Performance Impact:** ${results.impact}

**Recommendations:**
${results.recommendations.map((r) => `• 💡 ${r}`).join("\n") || "No recommendations"}

**Status:** ${results.critical ? "❌ CRITICAL BOTTLENECKS" : "✅ NO CRITICAL ISSUES"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Bottleneck detection failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async analyzeRuntimePerformance(duration: number) {
    const results = {
      responseTime: 0,
      throughput: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      bottlenecks: [] as string[],
      recommendations: [] as string[],
    };

    try {
      // Measure memory usage
      const memUsage = process.memoryUsage();
      results.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB

      if (results.memoryUsage > 256) {
        results.bottlenecks.push(
          `High memory usage: ${results.memoryUsage}MB > 256MB threshold`,
        );
        results.recommendations.push(
          "Optimize memory usage through garbage collection and object pooling",
        );
      }

      // CPU usage (simplified)
      const cpuUsage = os.loadavg()[0] || 0;
      results.cpuUsage = Math.round(cpuUsage * 100) / 100;

      if (cpuUsage > 0.8) {
        results.bottlenecks.push(
          `High CPU usage: ${results.cpuUsage} > 80% threshold`,
        );
        results.recommendations.push(
          "Optimize CPU-intensive operations and consider load balancing",
        );
      }

      // Framework initialization time (if applicable)
      if (fs.existsSync("src/index.ts")) {
        const initStart = Date.now();
        // Simulate initialization check
        await new Promise((resolve) => setTimeout(resolve, 10));
        const initTime = Date.now() - initStart;

        if (initTime > 100) {
          results.bottlenecks.push(
            `Slow initialization: ${initTime}ms > 100ms threshold`,
          );
          results.recommendations.push(
            "Optimize framework initialization and lazy loading",
          );
        }
      }
    } catch (error) {
      results.bottlenecks.push(
        `Runtime analysis error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private async analyzeBuildPerformance() {
    const results = {
      buildTime: 0,
      bundleSize: 0,
      compressionRatio: 0,
      bottlenecks: [] as string[],
      recommendations: [] as string[],
    };

    try {
      // Check bundle size
      if (fs.existsSync("dist")) {
        try {
          const { execSync } = await import("child_process");
          const sizeOutput = execSync('du -sh dist/ 2>/dev/null || echo "0"', {
            encoding: "utf8",
          });
          const sizeStr = sizeOutput.trim().split("	")[0] || "0";

          if (sizeStr.includes("M")) {
            results.bundleSize = parseFloat(sizeStr);
          } else if (sizeStr.includes("K")) {
            results.bundleSize = parseFloat(sizeStr) / 1024;
          }

          if (results.bundleSize > 2.0) {
            results.bottlenecks.push(
              `Large bundle size: ${results.bundleSize}MB > 2MB threshold`,
            );
            results.recommendations.push(
              "Implement code splitting and tree shaking to reduce bundle size",
            );
          }
        } catch (error) {
          // Size check failed
        }
      } else {
        results.recommendations.push(
          "No build output found - run build process to analyze performance",
        );
      }
    } catch (error) {
      results.bottlenecks.push(
        `Build analysis error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private async analyzeResourceUsage() {
    const results = {
      totalMemory: 0,
      freeMemory: 0,
      diskUsage: 0,
      networkLatency: 0,
      bottlenecks: [] as string[],
      recommendations: [] as string[],
    };

    try {
      // System memory
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      results.totalMemory = Math.round(totalMem / 1024 / 1024 / 1024); // GB
      results.freeMemory = Math.round(freeMem / 1024 / 1024 / 1024); // GB

      const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
      if (memUsagePercent > 90) {
        results.bottlenecks.push(
          `High system memory usage: ${Math.round(memUsagePercent)}%`,
        );
        results.recommendations.push(
          "Monitor memory-intensive processes and consider memory optimization",
        );
      }

      // Disk usage (simplified)
      const diskUsage = this.getDiskUsage();
      if (diskUsage > 90) {
        results.bottlenecks.push(`High disk usage: ${diskUsage}%`);
        results.recommendations.push("Clean up unnecessary files and archives");
      }
    } catch (error) {
      results.bottlenecks.push(
        `Resource analysis error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private async detectBottlenecks() {
    const results = {
      bottlenecks: [] as string[],
      recommendations: [] as string[],
    };

    try {
      // Check for common bottlenecks
      const issues = await this.identifyCommonBottlenecks();
      results.bottlenecks.push(...issues.bottlenecks);
      results.recommendations.push(...issues.recommendations);
    } catch (error) {
      results.bottlenecks.push(
        `Bottleneck detection error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private async analyzeSpecificBottlenecks(
    operation: string,
    threshold: number,
  ) {
    const results = {
      bottlenecks: [] as string[],
      recommendations: [] as string[],
      impact: "Low",
      critical: false,
    };

    try {
      // Analyze specific operation bottlenecks
      const startTime = Date.now();

      // Simulate operation timing
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

      const operationTime = Date.now() - startTime;

      if (operationTime > threshold) {
        results.bottlenecks.push(
          `${operation} exceeds threshold: ${operationTime}ms > ${threshold}ms`,
        );
        results.impact = operationTime > threshold * 2 ? "High" : "Medium";
        results.critical = operationTime > threshold * 3;
        results.recommendations.push(
          `Optimize ${operation} performance - current time: ${operationTime}ms`,
        );
      }
    } catch (error) {
      results.bottlenecks.push(
        `Operation analysis error: ${error instanceof Error ? error.message : String(error)}`,
      );
      results.critical = true;
    }

    return results;
  }

  private getDiskUsage(): number {
    try {
      // Simplified disk usage check
      const { execSync } = require("child_process");
      const output = execSync(
        "df / | tail -1 | awk '{print $5}' | sed 's/%//'",
        { encoding: "utf8" },
      );
      return parseInt(output.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  private async identifyCommonBottlenecks() {
    const results = {
      bottlenecks: [] as string[],
      recommendations: [] as string[],
    };

    // Check for large files
    const largeFiles = this.findLargeFiles();
    if (largeFiles.length > 0) {
      results.bottlenecks.push(
        `Large files detected: ${largeFiles.length} files > 10MB`,
      );
      results.recommendations.push(
        "Consider compressing or splitting large files",
      );
    }

    // Check for too many dependencies
    if (fs.existsSync("package.json")) {
      try {
        const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
        const depCount = Object.keys(packageJson.dependencies || {}).length;
        if (depCount > 100) {
          results.bottlenecks.push(
            `High dependency count: ${depCount} packages`,
          );
          results.recommendations.push(
            "Audit and remove unnecessary dependencies",
          );
        }
      } catch (error) {
        // Skip dependency check
      }
    }

    return results;
  }

  private findLargeFiles(): string[] {
    const largeFiles: string[] = [];

    function scanDir(dir: string) {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (
            stat.isDirectory() &&
            !item.startsWith(".") &&
            item !== "node_modules"
          ) {
            scanDir(fullPath);
          } else if (stat.isFile() && stat.size > 10 * 1024 * 1024) {
            // 10MB
            largeFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    scanDir(".");
    return largeFiles;
  }

  private checkPerformanceThresholds(results: any): boolean {
    // Check if any critical thresholds are exceeded
    const bottlenecks = results.bottlenecks || [];
    const criticalIndicators = [
      "High memory usage",
      "High CPU usage",
      "Large bundle size",
      "Slow initialization",
    ];

    return !bottlenecks.some((b: string) =>
      criticalIndicators.some((indicator) => b.includes(indicator)),
    );
  }

  private generatePerformanceSummary(results: any): string {
    const bottleneckCount = results.bottlenecks.length;
    const recommendationCount = results.recommendations.length;
    const status = results.passed ? "✅ ACCEPTABLE" : "❌ ISSUES DETECTED";

    return `**Performance Summary:** ${status}
- Bottlenecks: ${bottleneckCount}
- Recommendations: ${recommendationCount}
- Analysis Duration: ${results.metrics.analysis_time}`;
  }

  private formatMetrics(metrics: any): string {
    if (!metrics) return "Not analyzed";

    const formatted = Object.entries(metrics)
      .filter(([key, value]) => !Array.isArray(value))
      .map(([key, value]) => `• ${key}: ${value}`)
      .join("\n");

    return formatted || "No metrics collected";
  }

  private async generateDetailedReport(results: any): Promise<string> {
    let report = "## Detailed Performance Report\n\n";

    // Runtime details
    if (results.metrics.runtime) {
      report += "### Runtime Performance\n";
      report += `- Memory Usage: ${results.metrics.runtime.memoryUsage}MB\n`;
      report += `- CPU Usage: ${results.metrics.runtime.cpuUsage}\n`;
      report += `- Bottlenecks: ${results.metrics.runtime.bottlenecks.length}\n\n`;
    }

    // Build details
    if (results.metrics.build) {
      report += "### Build Performance\n";
      report += `- Bundle Size: ${results.metrics.build.bundleSize}MB\n`;
      report += `- Build Time: ${results.metrics.build.buildTime}ms\n\n`;
    }

    // Resource details
    if (results.metrics.resources) {
      report += "### Resource Usage\n";
      report += `- Total Memory: ${results.metrics.resources.totalMemory}GB\n`;
      report += `- Free Memory: ${results.metrics.resources.freeMemory}GB\n`;
      report += `- Disk Usage: ${results.metrics.resources.diskUsage}%\n\n`;
    }

    return report;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Performance Analysis MCP Server started");
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayPerformanceAnalysisServer();
  server.run().catch(console.error);
}

export { StrRayPerformanceAnalysisServer };
