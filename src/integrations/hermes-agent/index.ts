/**
 * Hermes Agent Integration - Main Module
 *
 * Exports the TypeScript integration class that bridges StringRay
 * framework components to the Hermes CLI agent via bridge.mjs.
 *
 * @version 2.0.0
 * @since 2026-03-27
 */

// Integration class
export {
  HermesAgentIntegration,
  getHermesAgentIntegration,
  initializeHermesAgentIntegration,
  shutdownHermesAgentIntegration,
} from "./hermes-agent-integration.js";

// Types
export type {
  HermesAgentConfig,
  HermesAgentStatistics,
  BridgeCommand,
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
