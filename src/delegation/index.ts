/**
 * 0xRay AI v1.22.61 - Delegation System
 *
 * Complete automatic multi-agent delegation system with complexity assessment
 * and session-based coordination.
 *
 * @version 1.1.0
 * @since 2026-01-07
 */

export {
  ComplexityAnalyzer,
  complexityAnalyzer,
} from "./complexity-analyzer.js";
export { AgentDelegator, createAgentDelegator } from "./agent-delegator.js";
export {
  SessionCoordinator,
  createSessionCoordinator,
} from "./session-coordinator.js";
export {
  RoutingOutcomeTracker,
  routingOutcomeTracker,
} from "./analytics/index.js";
export { RoutingAnalytics } from "./analytics/index.js";
export { LearningEngine, learningEngine } from "./analytics/index.js";

export {
  VotingCoordinator,
  createVotingCoordinator,
} from "./voting-coordinator.js";
export {
  WeightedVotingAggregator,
  createWeightedVotingAggregator,
  createDetailedVotingResult,
  DEFAULT_HISTORICAL_CONFIG,
  DEFAULT_CONFIDENCE_CONFIG,
} from "./weighted-voting-aggregator.js";
export {
  AdaptiveStrategySelector,
  adaptiveStrategySelector,
  selectVotingStrategy,
} from "./strategy-selector.js";
export {
  getAgentExpertise,
  getAgentExpertiseLevel,
  getVotingWeight,
  getAgentsWithExpertiseDomain,
  getTopExpertsForDomain,
} from "./agent-expertise.js";

export type {
  VotingSession,
  VotingStrategy,
  VoteChoice,
  VotingResult,
  VotingResultDetail,
  AgentExpertise,
  StrategySelectionContext,
  VotingHistoryEntry,
  AdaptiveStrategyConfig,
  VotingMetrics,
  ConflictResolutionRequest,
  ConflictResolutionResponse,
} from "./voting-types.js";

export type {
  ComplexityMetrics,
  ComplexityScore,
  ComplexityThresholds,
} from "./complexity-analyzer.js";

export type {
  DelegationRequest,
  DelegationResult,
  AgentCapability,
  DelegationMetrics,
} from "./agent-delegator.js";

export type {
  SessionContext,
  AgentInteraction,
  ConflictRecord,
  CoordinationState,
  Communication,
  SessionMetrics,
} from "./session-coordinator.js";

export {
  AgentMetricsSystem,
  getAgentMetricsSystem,
  initializeAgentMetrics,
  resetAgentMetricsSystem,
} from "../metrics/agent-metrics.js";

export type {
  AgentInvocation,
  AgentType,
  ComplexityLevel,
  AgentInvocationSummary,
  TimePeriodSummary,
  ComplexitySummary,
  AggregatedAgentMetrics,
  MetricsRetentionConfig,
  MetricsExport,
  AgentMetricsFilter,
} from "../metrics/agent-metrics.js";
