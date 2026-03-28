/**
 * Hermes Agent Integration Types
 *
 * TypeScript interfaces for the Hermes Agent integration,
 * which bridges StringRay framework components to the Hermes CLI agent.
 *
 * @version 2.0.0
 * @since 2026-03-27
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Hermes Agent integration configuration
 */
export interface HermesAgentConfig {
  /** Path to the bridge.mjs script */
  bridgePath?: string;
  /** Path to the plugin directory */
  pluginDir?: string;
  /** Path to the Python plugin __init__.py */
  pluginInitPath?: string;
  /** Project root for framework loading */
  projectRoot?: string;
  /** Timeout for bridge commands in milliseconds */
  bridgeTimeout?: number;
  /** Whether to enable tool hooks */
  hooksEnabled?: boolean;
  /** Whether to enable file logging */
  loggingEnabled?: boolean;
}

/**
 * Statistics specific to the Hermes Agent integration
 */
export interface HermesAgentStatistics {
  /** Total tool calls intercepted */
  totalToolCalls: number;
  /** Code-producing tool calls */
  codeOperations: number;
  /** Quality gate runs */
  qualityGateRuns: number;
  /** Quality gate blocks (failures) */
  qualityGateBlocks: number;
  /** Pre-processor runs */
  preProcessorRuns: number;
  /** Post-processor runs */
  postProcessorRuns: number;
  /** StringRay MCP tool calls (skipped bridge) */
  strrayMcpCalls: number;
  /** Native tool calls (non-code) */
  nativeToolCalls: number;
  /** Bridge errors */
  bridgeErrors: number;
  /** Session ID */
  sessionId?: string;
  /** Session start time */
  startedAt?: string;
}

// ============================================================================
// Bridge Protocol
// ============================================================================

/**
 * Commands supported by the bridge
 */
export type BridgeCommand =
  | "health"
  | "pre-process"
  | "post-process"
  | "validate"
  | "codex-check"
  | "stats";

/**
 * Request sent to bridge.mjs via stdin
 */
export interface BridgeRequest {
  command: BridgeCommand;
  tool?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  files?: string[];
  operation?: string;
  code?: string;
  focusAreas?: string[];
}

/**
 * Health response from bridge
 */
export interface BridgeHealthResponse {
  status: "ok" | "error";
  framework: "loaded" | "not_loaded";
  version: string;
  projectRoot: string;
  components: {
    qualityGate: boolean;
    processorManager: boolean;
    stateManager: boolean;
    featuresConfig: boolean;
  };
  nodeVersion: string;
}

/**
 * Pre-process response from bridge
 */
export interface BridgePreProcessResponse {
  passed: boolean;
  duration: number;
  qualityGate: {
    passed: boolean;
    violations: string[];
    checks?: Array<{ id: string; passed: boolean; message?: string }>;
  };
  processors: {
    ran: boolean;
    success?: boolean;
    processorCount?: number;
    details?: Array<{ name: string; success: boolean; error?: string }>;
  };
}

/**
 * Post-process response from bridge
 */
export interface BridgePostProcessResponse {
  duration: number;
  processors: {
    ran: boolean;
    success?: boolean;
    processorCount?: number;
    details?: Array<{ name: string; success: boolean; error?: string }>;
  };
}

/**
 * Validate response from bridge
 */
export interface BridgeValidateResponse {
  passed: boolean;
  operation: string;
  fileResults: Array<{
    file: string;
    passed: boolean;
    violations?: string[];
  }>;
}

/**
 * Codex check response from bridge
 */
export interface BridgeCodexCheckResponse {
  passed: boolean;
  violations: string[];
  checks: Array<{ id: string; passed: boolean; message?: string }>;
  focusAreas: string;
}

/**
 * Stats response from bridge
 */
export interface BridgeStatsResponse {
  frameworkReady: boolean;
  qualityGateAvailable: boolean;
  processorsAvailable: boolean;
  nodeVersion: string;
  projectRoot: string;
}

/**
 * Union type for all bridge responses
 */
export type BridgeResponse =
  | BridgeHealthResponse
  | BridgePreProcessResponse
  | BridgePostProcessResponse
  | BridgeValidateResponse
  | BridgeCodexCheckResponse
  | BridgeStatsResponse
  | { error: string };

// ============================================================================
// Plugin Hook Events
// ============================================================================

/**
 * Event emitted when a pre-tool-call hook fires
 */
export interface PreToolCallEvent {
  tool: string;
  args: Record<string, unknown> | null;
  toolId: string;
  timestamp: number;
}

/**
 * Event emitted when a post-tool-call hook fires
 */
export interface PostToolCallEvent {
  tool: string;
  args: Record<string, unknown> | null;
  result: unknown;
  error: string | null;
  toolId: string;
  timestamp: number;
}

/**
 * Event emitted when the quality gate blocks a tool call
 */
export interface QualityGateBlockEvent {
  tool: string;
  args: Record<string, unknown>;
  violations: string[];
  toolId: string;
  timestamp: number;
}
