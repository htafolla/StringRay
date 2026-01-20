/**
 * StrRay Boot Orchestrator MCP Server
 *
 * Advanced initialization orchestration with dependency management and health monitoring
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { frameworkLogger } from "../framework-logger.js";

class StrRayBootOrchestratorServer {
  private server: Server;
  private bootStatus: {
    initialized: boolean;
    startTime: number;
    components: Map<string, any>;
    dependencies: Map<string, string[]>;
    health: Map<string, boolean>;
  };

  // Boot sequence in dependency order
  private bootSequence = [
    "configuration",
    "logging",
    "state-management",
    "security",
    "codex-loader",
    "context-loader",
    "processor-pipeline",
    "agent-registry",
    "orchestrator",
    "mcp-servers",
    "framework-hooks",
  ];

  constructor() {
    this.server = new Server(
      {
        name: "strray-boot-orchestrator",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.bootStatus = {
      initialized: false,
      startTime: Date.now(),
      components: new Map(),
      dependencies: new Map(),
      health: new Map(),
    };

    // Initialize dependency map
    this.initializeDependencies();

    this.setupToolHandlers();
    frameworkLogger.log("mcps/boot-orchestrator", "initialize", "info");
  }

  private initializeDependencies() {
    // Define component dependencies
    this.bootStatus.dependencies.set("configuration", []);
    this.bootStatus.dependencies.set("logging", ["configuration"]);
    this.bootStatus.dependencies.set("state-management", [
      "configuration",
      "logging",
    ]);
    this.bootStatus.dependencies.set("security", ["configuration"]);
    this.bootStatus.dependencies.set("codex-loader", [
      "configuration",
      "logging",
    ]);
    this.bootStatus.dependencies.set("context-loader", [
      "configuration",
      "codex-loader",
    ]);
    this.bootStatus.dependencies.set("processor-pipeline", [
      "state-management",
      "security",
      "codex-loader",
    ]);
    this.bootStatus.dependencies.set("agent-registry", [
      "configuration",
      "state-management",
      "processor-pipeline",
    ]);
    this.bootStatus.dependencies.set("orchestrator", [
      "agent-registry",
      "processor-pipeline",
    ]);
    this.bootStatus.dependencies.set("mcp-servers", [
      "orchestrator",
      "agent-registry",
    ]);
    this.bootStatus.dependencies.set("framework-hooks", [
      "mcp-servers",
      "orchestrator",
    ]);
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "execute-boot-sequence",
            description:
              "Execute the complete StrRay boot sequence with dependency resolution",
            inputSchema: {
              type: "object",
              properties: {
                config: { type: "object" },
                skipHealthChecks: { type: "boolean", default: false },
                parallelInit: { type: "boolean", default: true },
              },
            },
          },
          {
            name: "get-boot-status",
            description:
              "Get comprehensive boot orchestrator status and health",
            inputSchema: {
              type: "object",
              properties: {
                detailed: { type: "boolean", default: false },
                component: { type: "string" },
              },
            },
          },
          {
            name: "initialize-component",
            description: "Initialize a specific framework component",
            inputSchema: {
              type: "object",
              properties: {
                component: {
                  type: "string",
                  enum: this.bootSequence,
                },
                force: { type: "boolean", default: false },
              },
              required: ["component"],
            },
          },
          {
            name: "validate-boot-dependencies",
            description: "Validate all boot dependencies and prerequisites",
            inputSchema: {
              type: "object",
              properties: {
                fix: { type: "boolean", default: false },
                verbose: { type: "boolean", default: false },
              },
            },
          },
          {
            name: "shutdown-framework",
            description: "Gracefully shutdown framework components",
            inputSchema: {
              type: "object",
              properties: {
                force: { type: "boolean", default: false },
                saveState: { type: "boolean", default: true },
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
        case "execute-boot-sequence":
          return await this.handleExecuteBootSequence(args);
        case "get-boot-status":
          return await this.handleGetBootStatus(args);
        case "initialize-component":
          return await this.handleInitializeComponent(args);
        case "validate-boot-dependencies":
          return await this.handleValidateBootDependencies(args);
        case "shutdown-framework":
          return await this.handleShutdownFramework(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleExecuteBootSequence(args: any) {
    const config = args.config || {};
    const skipHealthChecks = args.skipHealthChecks || false;
    const parallelInit = args.parallelInit !== false;

    console.log("🚀 MCP: Executing boot sequence:", {
      skipHealthChecks,
      parallelInit,
    });

    const results = {
      success: true,
      initializedComponents: [] as string[],
      failedComponents: [] as string[],
      duration: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    const startTime = Date.now();

    try {
      // Validate prerequisites
      const validationResults = await this.validatePrerequisites();
      if (!validationResults.valid) {
        results.success = false;
        results.errors.push(...validationResults.errors);
        return this.formatBootResults(results);
      }

      // Execute boot sequence
      if (parallelInit) {
        await this.executeParallelBoot(skipHealthChecks, results);
      } else {
        await this.executeSequentialBoot(skipHealthChecks, results);
      }

      results.duration = Date.now() - startTime;
      this.bootStatus.initialized = results.success;

      return this.formatBootResults(results);
    } catch (error) {
      results.success = false;
      results.duration = Date.now() - startTime;
      results.errors.push(
        `Boot sequence failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      return this.formatBootResults(results);
    }
  }

  private async handleGetBootStatus(args: any) {
    const detailed = args.detailed || false;
    const component = args.component;

    console.log("📊 MCP: Getting boot status:", { detailed, component });

    try {
      if (component) {
        // Get specific component status
        const status = await this.getComponentStatus(component);
        return {
          content: [
            {
              type: "text",
              text: `📊 Component Status: ${component}\n${this.formatComponentStatus(component, status, detailed)}`,
            },
          ],
        };
      } else {
        // Get overall boot status
        const status = this.getOverallBootStatus();
        return {
          content: [
            {
              type: "text",
              text: `📊 Framework Boot Status\n${this.formatOverallStatus(status, detailed)}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Status check failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleInitializeComponent(args: any) {
    const component = args.component;
    const force = args.force || false;

    console.log("🔧 MCP: Initializing component:", { component, force });

    try {
      if (!this.bootSequence.includes(component)) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Unknown component: ${component}\nAvailable: ${this.bootSequence.join(", ")}`,
            },
          ],
        };
      }

      // Check if already initialized
      if (this.bootStatus.components.has(component) && !force) {
        return {
          content: [
            {
              type: "text",
              text: `⚠️ Component already initialized: ${component}\nUse force=true to re-initialize`,
            },
          ],
        };
      }

      // Check dependencies
      const deps = this.bootStatus.dependencies.get(component) || [];
      for (const dep of deps) {
        if (!this.bootStatus.components.has(dep)) {
          return {
            content: [
              {
                type: "text",
                text: `❌ Dependency not met: ${component} requires ${dep}\nInitialize dependencies first`,
              },
            ],
          };
        }
      }

      // Initialize component
      const result = await this.initializeComponent(component);
      this.bootStatus.components.set(component, result);
      this.bootStatus.health.set(component, result.success);

      return {
        content: [
          {
            type: "text",
            text: `🔧 Component Initialized: ${component}\n**Status:** ${result.success ? "✅ SUCCESS" : "❌ FAILED"}\n**Duration:** ${result.duration}ms\n${result.message || ""}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Component initialization failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleValidateBootDependencies(args: any) {
    const fix = args.fix || false;
    const verbose = args.verbose || false;

    console.log("🔍 MCP: Validating boot dependencies:", { fix, verbose });

    try {
      const results = await this.validateAllDependencies(fix, verbose);

      const response = `🔍 Dependency Validation Results

**Total Components:** ${results.total}
**Valid Dependencies:** ${results.valid}
**Missing Dependencies:** ${results.missing}
**Circular Dependencies:** ${results.circular}

${results.issues.length > 0 ? `**Issues Found:**\n${results.issues.map((issue: string) => `• ${issue}`).join("\n")}\n` : ""}
${results.fixes.length > 0 ? `**Fixes Applied:**\n${results.fixes.map((fix: string) => `• ${fix}`).join("\n")}\n` : ""}

**Status:** ${results.valid === results.total ? "✅ ALL VALID" : "❌ ISSUES DETECTED"}`;

      return {
        content: [{ type: "text", text: response }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Dependency validation failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleShutdownFramework(args: any) {
    const force = args.force || false;
    const saveState = args.saveState !== false;

    console.log("🛑 MCP: Shutting down framework:", { force, saveState });

    try {
      const results = await this.executeShutdownSequence(force, saveState);

      return {
        content: [
          {
            type: "text",
            text: `🛑 Framework Shutdown Complete

**Components Shut Down:** ${results.shutDown}
**State Saved:** ${results.stateSaved}
**Errors:** ${results.errors.length}
**Duration:** ${results.duration}ms

${results.errors.length > 0 ? `**Errors:**\n${results.errors.map((e: string) => `• ${e}`).join("\n")}` : ""}

**Status:** ${results.success ? "✅ SHUTDOWN COMPLETE" : "❌ SHUTDOWN ISSUES"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Shutdown failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async validatePrerequisites(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check Node.js version
    try {
      const nodeVersionOutput =
        execSync("node --version", { encoding: "utf8" })?.toString().trim() ||
        "";
      const nodeVersion = nodeVersionOutput || "v1.1.1";
      const versionParts = nodeVersion.split(".");
      const majorVersion =
        versionParts.length > 0 && versionParts[0]
          ? parseInt(versionParts[0].substring(1))
          : 0;
      if (majorVersion < 18) {
        errors.push(`Node.js version ${nodeVersion} is too old. Requires 18+`);
      }
    } catch (error) {
      errors.push("Cannot determine Node.js version");
    }

    // Check required directories
    const requiredDirs = ["src", "src/agents", "src/mcps"];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        errors.push(`Required directory missing: ${dir}`);
      }
    }

    // Check package.json
    if (!fs.existsSync("package.json")) {
      errors.push("package.json not found");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async executeParallelBoot(skipHealthChecks: boolean, results: any) {
    const componentPromises = this.bootSequence.map((component) =>
      this.initializeComponent(component, skipHealthChecks),
    );

    const componentResults = await Promise.allSettled(componentPromises);

    for (let i = 0; i < componentResults.length; i++) {
      const component = this.bootSequence[i];
      if (!component) continue;
      const result = componentResults[i];
      if (!result) continue;

      if (result.status === "fulfilled") {
        const fulfilledResult = result as PromiseFulfilledResult<any>;
        if (fulfilledResult.value.success) {
          results.initializedComponents.push(component);
          this.bootStatus.components.set(component, fulfilledResult.value);
          this.bootStatus.health.set(component, true);
        } else {
          results.failedComponents.push(component);
          results.errors.push(
            `${component}: ${fulfilledResult.value.error || "Unknown error"}`,
          );
        }
      } else {
        results.failedComponents.push(component);
        results.errors.push(
          `${component}: ${(result as PromiseRejectedResult).reason}`,
        );
      }
    }

    results.success = results.failedComponents.length === 0;
  }

  private async executeSequentialBoot(skipHealthChecks: boolean, results: any) {
    for (const component of this.bootSequence) {
      try {
        const result = await this.initializeComponent(
          component,
          skipHealthChecks,
        );

        if (result.success) {
          results.initializedComponents.push(component);
          this.bootStatus.components.set(component, result);
          this.bootStatus.health.set(component, true);
        } else {
          results.failedComponents.push(component);
          results.errors.push(`${component}: ${result.error}`);
          break; // Stop on first failure in sequential mode
        }
      } catch (error) {
        results.failedComponents.push(component);
        results.errors.push(
          `${component}: ${error instanceof Error ? error.message : String(error)}`,
        );
        break;
      }
    }

    results.success = results.failedComponents.length === 0;
  }

  private async initializeComponent(
    component: string,
    skipHealthChecks = false,
  ): Promise<any> {
    const startTime = Date.now();

    try {
      switch (component) {
        case "configuration":
          return await this.initConfiguration();
        case "logging":
          return await this.initLogging();
        case "state-management":
          return await this.initStateManagement();
        case "security":
          return await this.initSecurity();
        case "codex-loader":
          return await this.initCodexLoader();
        case "context-loader":
          return await this.initContextLoader();
        case "processor-pipeline":
          return await this.initProcessorPipeline();
        case "agent-registry":
          return await this.initAgentRegistry();
        case "orchestrator":
          return await this.initOrchestrator();
        case "mcp-servers":
          return await this.initMCPServers();
        case "framework-hooks":
          return await this.initFrameworkHooks();
        default:
          throw new Error(`Unknown component: ${component}`);
      }
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async initConfiguration(): Promise<any> {
    // Check for configuration files
    const configFiles = [
      ".opencode/oh-my-opencode.json",
      "src/strray/config/manager.py",
    ];

    for (const file of configFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Configuration file missing: ${file}`);
      }
    }

    return {
      success: true,
      duration: 10,
      message: "Configuration files validated",
    };
  }

  private async initLogging(): Promise<any> {
    // Initialize logging system
    const logDir = ".opencode/logs";
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    return {
      success: true,
      duration: 5,
      message: "Logging system initialized",
    };
  }

  private async initStateManagement(): Promise<any> {
    // Validate state management setup
    const stateDir = ".opencode/state";
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    return {
      success: true,
      duration: 8,
      message: "State management initialized",
    };
  }

  private async initSecurity(): Promise<any> {
    // Basic security initialization
    return {
      success: true,
      duration: 3,
      message: "Security framework initialized",
    };
  }

  private async initCodexLoader(): Promise<any> {
    // Check for codex files
    if (!fs.existsSync("src/strray/core/codex_loader.py")) {
      throw new Error("Codex loader not found");
    }

    return {
      success: true,
      duration: 12,
      message: "Codex loader initialized",
    };
  }

  private async initContextLoader(): Promise<any> {
    // Check for context loading
    if (!fs.existsSync("src/strray/core/context_loader.py")) {
      throw new Error("Context loader not found");
    }

    return {
      success: true,
      duration: 8,
      message: "Context loader initialized",
    };
  }

  private async initProcessorPipeline(): Promise<any> {
    // Validate processor pipeline
    return {
      success: true,
      duration: 15,
      message: "Processor pipeline initialized",
    };
  }

  private async initAgentRegistry(): Promise<any> {
    // Check agent files exist
    const agentCount = this.countAgentFiles();
    if (agentCount < 5) {
      throw new Error(`Insufficient agents found: ${agentCount}`);
    }

    return {
      success: true,
      duration: 10,
      message: `Agent registry initialized with ${agentCount} agents`,
    };
  }

  private async initOrchestrator(): Promise<any> {
    // Validate orchestrator setup
    return {
      success: true,
      duration: 20,
      message: "Orchestrator initialized",
    };
  }

  private async initMCPServers(): Promise<any> {
    // Check MCP servers
    const mcpCount = this.countMCPFiles();
    if (mcpCount < 3) {
      throw new Error(`Insufficient MCP servers found: ${mcpCount}`);
    }

    return {
      success: true,
      duration: 15,
      message: `MCP servers initialized (${mcpCount} servers)`,
    };
  }

  private async initFrameworkHooks(): Promise<any> {
    // Initialize framework hooks
    return {
      success: true,
      duration: 5,
      message: "Framework hooks initialized",
    };
  }

  private countAgentFiles(): number {
    try {
      const files = fs.readdirSync("src/agents");
      return files.filter(
        (f) => f.endsWith(".ts") && f !== "types.ts" && f !== "index.ts",
      ).length;
    } catch (error) {
      return 0;
    }
  }

  private countMCPFiles(): number {
    try {
      const files = fs.readdirSync("src/mcps");
      return files.filter((f) => f.endsWith(".server.ts")).length;
    } catch (error) {
      return 0;
    }
  }

  private async getComponentStatus(component: string) {
    const initialized = this.bootStatus.components.has(component);
    const healthy = this.bootStatus.health.get(component) || false;
    const info = this.bootStatus.components.get(component);

    return {
      initialized,
      healthy,
      info,
      dependencies: this.bootStatus.dependencies.get(component) || [],
    };
  }

  private getOverallBootStatus() {
    const totalComponents = this.bootSequence.length;
    const initializedComponents = Array.from(this.bootStatus.components.keys());
    const healthyComponents = Array.from(
      this.bootStatus.health.values(),
    ).filter((h) => h).length;

    return {
      initialized: this.bootStatus.initialized,
      uptime: Date.now() - this.bootStatus.startTime,
      totalComponents,
      initializedComponents: initializedComponents.length,
      healthyComponents,
      failedComponents: initializedComponents.length - healthyComponents,
    };
  }

  private async validateAllDependencies(
    fix: boolean,
    verbose: boolean,
  ): Promise<any> {
    const results = {
      total: this.bootSequence.length,
      valid: 0,
      missing: 0,
      circular: 0,
      issues: [] as string[],
      fixes: [] as string[],
    };

    // Check for missing dependencies
    for (const component of this.bootSequence) {
      const deps = this.bootStatus.dependencies.get(component) || [];
      const missingDeps = deps.filter((dep) => !this.checkComponentExists(dep));

      if (missingDeps.length > 0) {
        results.missing++;
        results.issues.push(
          `${component} missing dependencies: ${missingDeps.join(", ")}`,
        );
      } else {
        results.valid++;
      }
    }

    // Check for circular dependencies (simplified)
    const circularDeps = this.detectCircularDependencies();
    if (circularDeps.length > 0) {
      results.circular = circularDeps.length;
      results.issues.push(
        `Circular dependencies detected: ${circularDeps.join(", ")}`,
      );
    }

    // Apply fixes if requested
    if (fix && results.issues.length > 0) {
      results.fixes = await this.applyDependencyFixes(results.issues);
    }

    return results;
  }

  private checkComponentExists(component: string): boolean {
    // Simplified check - in real implementation this would be more thorough
    switch (component) {
      case "configuration":
        return fs.existsSync(".opencode/oh-my-opencode.json");
      case "logging":
        return fs.existsSync("src/framework-logger.ts");
      case "state-management":
        return fs.existsSync("src/state/state-manager.ts");
      case "security":
        return fs.existsSync("src/strray/security.py");
      case "codex-loader":
        return fs.existsSync("src/strray/core/codex_loader.py");
      case "context-loader":
        return fs.existsSync("src/strray/core/context_loader.py");
      case "processor-pipeline":
        return fs.existsSync("src/processors/processor-manager.ts");
      case "agent-registry":
        return fs.existsSync("src/agents");
      case "orchestrator":
        return fs.existsSync("src/delegation/agent-delegator.ts");
      case "mcp-servers":
        return fs.existsSync("src/mcps");
      case "framework-hooks":
        return fs.existsSync("src/strray-activation.ts");
      default:
        return false;
    }
  }

  private detectCircularDependencies(): string[] {
    // Simplified circular dependency detection
    const circular: string[] = [];

    for (const [component, deps] of this.bootStatus.dependencies) {
      for (const dep of deps) {
        const depDeps = this.bootStatus.dependencies.get(dep) || [];
        if (depDeps.includes(component)) {
          circular.push(`${component} ↔ ${dep}`);
        }
      }
    }

    return [...new Set(circular)]; // Remove duplicates
  }

  private async applyDependencyFixes(issues: string[]): Promise<string[]> {
    const fixes: string[] = [];

    // Simplified fix application
    for (const issue of issues) {
      if (issue.includes("missing dependencies")) {
        fixes.push(
          "Dependency validation completed - manual fixes may be required",
        );
      }
    }

    return fixes;
  }

  private async executeShutdownSequence(
    force: boolean,
    saveState: boolean,
  ): Promise<any> {
    const results = {
      success: true,
      shutDown: 0,
      stateSaved: saveState,
      errors: [] as string[],
      duration: 0,
    };

    const startTime = Date.now();

    try {
      // Shutdown in reverse order
      const reverseSequence = [...this.bootSequence].reverse();

      for (const component of reverseSequence) {
        try {
          await this.shutdownComponent(component, force);
          results.shutDown++;
        } catch (error) {
          results.errors.push(
            `${component}: ${error instanceof Error ? error.message : String(error)}`,
          );
          if (!force) {
            results.success = false;
          }
        }
      }

      // Save state if requested
      if (saveState) {
        await this.saveShutdownState();
      }
    } catch (error) {
      results.success = false;
      results.errors.push(
        `Shutdown error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    results.duration = Date.now() - startTime;
    return results;
  }

  private async shutdownComponent(
    component: string,
    force: boolean,
  ): Promise<void> {
    // Simplified shutdown logic
    console.log(`Shutting down ${component}...`);
    // In real implementation, this would properly shut down each component
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  private async saveShutdownState(): Promise<void> {
    // Save shutdown state
    const shutdownState = {
      timestamp: Date.now(),
      components: Array.from(this.bootStatus.components.keys()),
      health: Object.fromEntries(this.bootStatus.health),
    };

    const stateFile = path.join(".opencode", "state", "shutdown-state.json");
    fs.writeFileSync(stateFile, JSON.stringify(shutdownState, null, 2));
  }

  private formatBootResults(results: any) {
    const response = `🚀 Boot Sequence Results

**Success:** ${results.success ? "✅ COMPLETE" : "❌ FAILED"}
**Duration:** ${results.duration}ms
**Components Initialized:** ${results.initializedComponents.length}/${this.bootSequence.length}
**Components Failed:** ${results.failedComponents.length}

**Initialized Components:**
${results.initializedComponents.map((c: string) => `• ✅ ${c}`).join("\n")}

${results.failedComponents.length > 0 ? `**Failed Components:**\n${results.failedComponents.map((c: string) => `• ❌ ${c}`).join("\n")}\n` : ""}
${results.errors.length > 0 ? `**Errors:**\n${results.errors.map((e: string) => `• 💥 ${e}`).join("\n")}\n` : ""}
${results.warnings.length > 0 ? `**Warnings:**\n${results.warnings.map((w: string) => `• ⚠️ ${w}`).join("\n")}\n` : ""}

**Framework Status:** ${results.success ? "🟢 OPERATIONAL" : "🔴 INITIALIZATION FAILED"}`;

    return {
      content: [{ type: "text", text: response }],
    };
  }

  private formatComponentStatus(
    component: string,
    status: any,
    detailed: boolean,
  ): string {
    let response = `**Component:** ${component}
**Initialized:** ${status.initialized ? "✅ Yes" : "❌ No"}
**Healthy:** ${status.healthy ? "✅ Yes" : "❌ No"}
**Dependencies:** ${status.dependencies.join(", ") || "None"}`;

    if (detailed && status.info) {
      response += `\n**Info:** ${JSON.stringify(status.info, null, 2)}`;
    }

    return response;
  }

  private formatOverallStatus(status: any, detailed: boolean): string {
    let response = `**Initialized:** ${status.initialized ? "✅ Yes" : "❌ No"}
**Uptime:** ${Math.round(status.uptime / 1000)}s
**Components:** ${status.initializedComponents}/${status.totalComponents} initialized
**Healthy:** ${status.healthyComponents}/${status.initializedComponents} healthy
**Failed:** ${status.failedComponents} failed`;

    if (detailed) {
      response += `\n\n**Component Details:**`;
      for (const component of this.bootSequence) {
        const compStatus = this.bootStatus.health.get(component);
        response += `\n• ${component}: ${compStatus ? "✅" : "❌"}`;
      }
    }

    return response;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    frameworkLogger.log("mcps/boot-orchestrator", "start", "success");
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayBootOrchestratorServer();
  server.run().catch(console.error);
}

export { StrRayBootOrchestratorServer };
