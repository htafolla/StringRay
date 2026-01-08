/**
 * StrRay Framework v1.0.0 - Delegation System
 *
 * Complete automatic multi-agent delegation system with complexity assessment
 * and session-based coordination.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

export { ComplexityAnalyzer, complexityAnalyzer } from "./complexity-analyzer";
export { AgentDelegator, createAgentDelegator } from "./agent-delegator";
export {
  SessionCoordinator,
  createSessionCoordinator,
} from "./session-coordinator";

// Re-export types
export type {
  ComplexityMetrics,
  ComplexityScore,
  ComplexityThresholds,
} from "./complexity-analyzer";

export type {
  DelegationRequest,
  DelegationResult,
  AgentCapability,
  DelegationMetrics,
} from "./agent-delegator";

export type {
  SessionContext,
  AgentInteraction,
  ConflictRecord,
  CoordinationState,
  Communication,
  SessionMetrics,
} from "./session-coordinator";
