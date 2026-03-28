/**
 * Hermes Agent Integration
 *
 * Bridges StringRay framework components to the Hermes CLI agent.
 * Manages the bridge.mjs subprocess and wires tool event hooks
 * through the framework's quality gate, processors, and state manager.
 *
 * Extends BaseIntegration for consistent lifecycle management with
 * the integration registry.
 *
 * @version 2.0.0
 * @since 2026-03-27
 */

import { execFile, type ExecFileOptions } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { homedir } from "os";
import {
  BaseIntegration,
  type IntegrationConfig,
  type HealthResult,
} from "../base/index.js";
import { frameworkLogger, generateJobId } from "../../core/framework-logger.js";
import type {
  HermesAgentConfig,
  HermesAgentStatistics,
  BridgeRequest,
  BridgeResponse,
  BridgeHealthResponse,
  BridgePreProcessResponse,
  BridgePostProcessResponse,
  BridgeValidateResponse,
  BridgeCodexCheckResponse,
  BridgeStatsResponse,
  PreToolCallEvent,
  PostToolCallEvent,
  QualityGateBlockEvent,
} from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Tools that produce/modify code and need quality gate + processors */
const CODE_TOOLS = new Set([
  "write_file",
  "patch",
  "execute_code",
  "write",
  "edit",
]);

/** Tools native to Hermes (not MCP) that should get nudged */
const NUDGE_TOOLS = new Set(["terminal", "search_files"]);

/**
 * Hermes Agent Integration
 *
 * Manages the bridge subprocess and provides tool event hooks
 * that pipe through StringRay's quality gate and processor pipeline.
 */
export class HermesAgentIntegration extends BaseIntegration {
  private bridgePath: string;
  private pluginDir: string;
  private projectRoot: string;
  private bridgeTimeout: number;
  private hooksEnabled: boolean;
  private loggingEnabled: boolean;

  /** Runtime statistics (separate from base IntegrationStats) */
  private hermesStats: HermesAgentStatistics;

  /** Bridge health cache */
  private cachedHealth: BridgeHealthResponse | null = null;
  private lastHealthCheck = 0;
  private readonly HEALTH_CACHE_TTL = 30_000; // 30s

  constructor(config?: Partial<IntegrationConfig> & HermesAgentConfig) {
    super("hermes-agent", "2.0.0", config);

    this.bridgePath = config?.bridgePath || join(__dirname, "bridge.mjs");
    this.pluginDir =
      config?.pluginDir || join(homedir(), ".hermes", "plugins", "strray-hermes");
    this.projectRoot = config?.projectRoot || process.cwd();
    this.bridgeTimeout = config?.bridgeTimeout || 15_000;
    this.hooksEnabled = config?.hooksEnabled ?? true;
    this.loggingEnabled = config?.loggingEnabled ?? true;

    this.hermesStats = this.createEmptyStats();
  }

  // ==========================================================================
  // BaseIntegration Implementation
  // ==========================================================================

  protected async performInitialization(): Promise<void> {
    await this.log("info", "Initializing Hermes Agent integration...");

    // Validate bridge script exists
    if (!existsSync(this.bridgePath)) {
      await this.log("info", `Bridge script not found at ${this.bridgePath}`);
      // Don't fail — tools will fall back to CLI
      return;
    }

    // Validate plugin directory exists
    if (!existsSync(this.pluginDir)) {
      await this.log("info", `Plugin directory not found at ${this.pluginDir}`);
      // Don't fail — may be a consumer install
    }

    // Perform initial health check
    const health = await this.checkBridgeHealth();
    this.cachedHealth = health;
    this.lastHealthCheck = Date.now();

    if (health.status === "ok" && health.framework === "loaded") {
      const componentCount = Object.entries(health.components)
        .filter(([, v]) => v)
        .length;
      await this.log(
        "info",
        `Bridge connected — framework v${health.version} with ${componentCount}/4 components`,
      );
    } else {
      await this.log(
        "info",
        `Bridge health: framework=${health.framework}, components=${JSON.stringify(health.components)}`,
      );
    }

    // Store project root from health response
    if (health.projectRoot && health.projectRoot !== "unknown") {
      this.projectRoot = health.projectRoot;
    }
  }

  protected async performShutdown(): Promise<void> {
    await this.log("info", "Shutting down Hermes Agent integration...");
    this.cachedHealth = null;
  }

  protected async performHealthCheck(): Promise<HealthResult> {
    const health = await this.checkBridgeHealth();
    this.cachedHealth = health;
    this.lastHealthCheck = Date.now();

    if (health.status === "ok" && health.framework === "loaded") {
      const componentCount = Object.entries(health.components)
        .filter(([, v]) => v)
        .length;
      return {
        healthy: true,
        message: `Framework v${health.version} loaded (${componentCount}/4 components)`,
        details: {
          version: health.version,
          components: health.components,
          nodeVersion: health.nodeVersion,
          projectRoot: health.projectRoot,
          stats: this.hermesStats,
        },
      };
    }

    return {
      healthy: false,
      message: `Framework not loaded — ${health.framework}`,
      details: {
        version: health.version,
        components: health.components,
        projectRoot: health.projectRoot,
        stats: this.hermesStats,
      },
    };
  }

  // ==========================================================================
  // Bridge Communication
  // ==========================================================================

  /**
   * Send a command to the bridge subprocess
   */
  async sendToBridge<T extends BridgeResponse>(
    request: BridgeRequest,
    timeout?: number,
  ): Promise<T> {
    const effectiveTimeout = timeout ?? this.bridgeTimeout;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const options: ExecFileOptions = {
        cwd: this.projectRoot,
        timeout: effectiveTimeout,
        maxBuffer: 1024 * 1024, // 1MB
        env: {
          ...process.env,
          STRRAY_HOME: this.projectRoot,
        },
      };

      const input = JSON.stringify(request);

      const child = execFile(
        "node",
        [this.bridgePath, "--cwd", this.projectRoot],
        options,
        (error, stdout, stderr) => {
          const duration = Date.now() - startTime;

          if (error) {
            this.hermesStats.bridgeErrors++;
            this.recordError(error);

            const isTimeout = "killed" in error && (error as Record<string, unknown>).killed === true;
            reject(
              new Error(
                isTimeout
                  ? `Bridge timeout after ${duration}ms`
                  : `Bridge error: ${error.message}`,
              ),
            );
            return;
          }

          try {
            const stdoutStr = typeof stdout === "string" ? stdout : String(stdout);
            const response = JSON.parse(stdoutStr.trim()) as T;
            resolve(response);
          } catch {
            this.hermesStats.bridgeErrors++;
            const stdoutStr = typeof stdout === "string" ? stdout : "";
            reject(
              new Error(
                `Bridge returned invalid JSON: ${stdoutStr.substring(0, 200)}`,
              ),
            );
          }
        },
      );

      // Write request to stdin and close
      if (child.stdin) {
        child.stdin.write(input);
        child.stdin.end();
      }
    });
  }

  /**
   * Check bridge health (with caching)
   */
  async checkBridgeHealth(): Promise<BridgeHealthResponse> {
    const now = Date.now();
    if (
      this.cachedHealth &&
      now - this.lastHealthCheck < this.HEALTH_CACHE_TTL
    ) {
      return this.cachedHealth;
    }

    try {
      const response = await this.sendToBridge<BridgeHealthResponse>({
        command: "health",
      });
      return response;
    } catch {
      return {
        status: "error",
        framework: "not_loaded",
        version: "unknown",
        projectRoot: this.projectRoot,
        components: {
          qualityGate: false,
          processorManager: false,
          stateManager: false,
          featuresConfig: false,
        },
        nodeVersion: process.version,
      };
    }
  }

  // ==========================================================================
  // Tool Hook Methods
  // ==========================================================================

  /**
   * Pre-tool-call hook
   *
   * Called before a tool executes. Runs quality gate and pre-processors
   * for code-producing tools. Returns instructions for the caller.
   */
  async onPreToolCall(
    tool: string,
    args: Record<string, unknown> | null,
    toolId: string,
  ): Promise<{ allowed: boolean; nudge?: string; bridgeResult?: unknown }> {
    this.hermesStats.totalToolCalls++;

    // Emit event
    const event: PreToolCallEvent = {
      tool,
      args: args || {},
      toolId,
      timestamp: Date.now(),
    };
    this.getEventEmitter().emit("pre-tool-call", event);

    // StringRay MCP tools — skip bridge entirely
    if (this.isStrrayMcp(tool)) {
      this.hermesStats.strrayMcpCalls++;
      return { allowed: true };
    }

    // Native non-code tools — nudge if applicable
    if (NUDGE_TOOLS.has(tool)) {
      this.hermesStats.nativeToolCalls++;
      const nudge = this.getToolNudge(tool);
      return { allowed: true, nudge };
    }

    // Code-producing tools — run bridge
    if (CODE_TOOLS.has(tool)) {
      this.hermesStats.codeOperations++;
      this.hermesStats.qualityGateRuns++;

      try {
        const result =
          await this.sendToBridge<BridgePreProcessResponse>({
            command: "pre-process",
            tool,
            args: args || {},
          });

        if (result.passed) {
          if (result.processors?.ran) {
            this.hermesStats.preProcessorRuns++;
          }
          return { allowed: true, bridgeResult: result };
        } else {
          // Quality gate blocked
          this.hermesStats.qualityGateBlocks++;
          const blockEvent: QualityGateBlockEvent = {
            tool,
            args: args || {},
            violations: result.qualityGate?.violations || [],
            toolId,
            timestamp: Date.now(),
          };
          this.getEventEmitter().emit("quality-gate-block", blockEvent);

          return {
            allowed: false,
            nudge: `Quality gate blocked: ${(result.qualityGate?.violations || []).join(", ")}`,
            bridgeResult: result,
          };
        }
      } catch (error) {
        // Bridge failure — allow tool but log
        this.hermesStats.bridgeErrors++;
        this.recordError(
          error instanceof Error ? error : new Error(String(error)),
        );
        return { allowed: true };
      }
    }

    // Other native tools — no bridge
    this.hermesStats.nativeToolCalls++;
    return { allowed: true };
  }

  /**
   * Post-tool-call hook
   *
   * Called after a tool executes. Runs post-processors
   * for code-producing tools.
   */
  async onPostToolCall(
    tool: string,
    args: Record<string, unknown> | null,
    result: unknown,
    error: string | null,
    toolId: string,
  ): Promise<void> {
    // Emit event
    const event: PostToolCallEvent = {
      tool,
      args: args || {},
      result,
      error,
      toolId,
      timestamp: Date.now(),
    };
    this.getEventEmitter().emit("post-tool-call", event);

    // Skip non-code tools and StringRay MCP tools
    if (!CODE_TOOLS.has(tool) || this.isStrrayMcp(tool)) {
      return;
    }

    try {
      const postResult =
        await this.sendToBridge<BridgePostProcessResponse>({
          command: "post-process",
          tool,
          args: args || {},
          result,
          error: error || undefined,
        });

      if (postResult.processors?.ran) {
        this.hermesStats.postProcessorRuns++;
      }
    } catch {
      // Bridge failure — silent
      this.hermesStats.bridgeErrors++;
    }
  }

  // ==========================================================================
  // Tool Methods (mirrors Python plugin tools)
  // ==========================================================================

  /**
   * Run strray_validate — validate files against quality gate
   */
  async validate(
    files: string[],
    operation: string = "validate",
  ): Promise<BridgeValidateResponse> {
    return this.sendToBridge<BridgeValidateResponse>({
      command: "validate",
      files,
      operation,
    });
  }

  /**
   * Run strray_codex_check — check code against codex rules
   */
  async codexCheck(
    code: string | undefined,
    focusAreas?: string[],
  ): Promise<BridgeCodexCheckResponse> {
    // If no code provided, fall back to health check
    if (!code) {
      const health = await this.checkBridgeHealth();
      return {
        passed: health.status === "ok",
        violations: [],
        checks: [],
        focusAreas: focusAreas?.join(",") || "all",
      };
    }

    return this.sendToBridge<BridgeCodexCheckResponse>({
      command: "codex-check",
      code,
      focusAreas,
    });
  }

  /**
   * Run strray_health — framework health check
   */
  async health(): Promise<BridgeHealthResponse> {
    return this.checkBridgeHealth();
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if a tool name belongs to a StringRay MCP server
   */
  isStrrayMcp(tool: string): boolean {
    return tool.startsWith("mcp_strray_");
  }

  /**
   * Get a nudge message for a native tool
   */
  private getToolNudge(tool: string): string | undefined {
    if (tool === "terminal") {
      return 'Tip: Consider using "execute_code" for multi-step code operations with StringRay enforcement.';
    }
    if (tool === "search_files") {
      return 'Tip: Consider using "execute_code" with hermes_tools for complex search operations.';
    }
    return undefined;
  }

  /**
   * Create empty statistics object
   */
  private createEmptyStats(): HermesAgentStatistics {
    return {
      totalToolCalls: 0,
      codeOperations: 0,
      qualityGateRuns: 0,
      qualityGateBlocks: 0,
      preProcessorRuns: 0,
      postProcessorRuns: 0,
      strrayMcpCalls: 0,
      nativeToolCalls: 0,
      bridgeErrors: 0,
      sessionId: generateJobId("hermes-agent"),
      startedAt: new Date().toISOString(),
    };
  }

  /**
   * Get current Hermes Agent statistics
   */
  getHermesStats(): Readonly<HermesAgentStatistics> {
    return { ...this.hermesStats };
  }

  /**
   * Reset statistics (e.g., new session)
   */
  resetStats(): void {
    this.hermesStats = this.createEmptyStats();
  }

  /**
   * Get the bridge path
   */
  getBridgePath(): string {
    return this.bridgePath;
  }

  /**
   * Get the plugin directory path
   */
  getPluginDir(): string {
    return this.pluginDir;
  }

  /**
   * Get the project root
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }

  /**
   * Check if hooks are enabled
   */
  isHooksEnabled(): boolean {
    return this.hooksEnabled;
  }

  /**
   * Enable or disable hooks
   */
  setHooksEnabled(enabled: boolean): void {
    this.hooksEnabled = enabled;
    this.emitEvent("config-updated", { hooksEnabled: enabled });
  }

  /**
   * Get the bridge stats response
   */
  async getBridgeStats(): Promise<BridgeStatsResponse> {
    return this.sendToBridge<BridgeStatsResponse>({
      command: "stats",
    });
  }
}

// ============================================================================
// Singleton
// ============================================================================

let globalInstance: HermesAgentIntegration | null = null;

/**
 * Get or create the global Hermes Agent integration instance
 */
export function getHermesAgentIntegration(
  config?: Partial<IntegrationConfig> & HermesAgentConfig,
): HermesAgentIntegration {
  if (!globalInstance) {
    globalInstance = new HermesAgentIntegration(config);
  }
  return globalInstance;
}

/**
 * Initialize the global Hermes Agent integration
 */
export async function initializeHermesAgentIntegration(
  config?: Partial<IntegrationConfig> & HermesAgentConfig,
): Promise<HermesAgentIntegration> {
  const integration = getHermesAgentIntegration(config);
  if (integration.status === "uninitialized") {
    await integration.initialize();
  }
  return integration;
}

/**
 * Shutdown the global Hermes Agent integration
 */
export async function shutdownHermesAgentIntegration(): Promise<void> {
  if (globalInstance) {
    await globalInstance.shutdown();
    globalInstance = null;
  }
}
