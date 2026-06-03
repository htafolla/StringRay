/**
 * 0xRay AI v1.22.61 - Security Module Index
 * Unified exports for the comprehensive security system
 */

export { SecurityScanner, securityScanner } from "./security-scanner.js";
export {
  PromptSecurityValidator,
  promptSecurityValidator,
} from "./prompt-security-validator.js";

export * from "./security-headers.js";
export * from "./security-hardening-system.js";
export * from "./security-hardener.js";
export * from "./security-auditor.js";
export {
  ComprehensiveSecurityAuditSystem,
  createSecurityAuditSystem,
  runQuickSecurityAudit,
  runDeepSecurityAudit,
  type Vulnerability,
  type VulnerabilityCategory,
  type SeverityLevel,
  type RemediationStep,
  type RemediationPlan,
  type SecurityAuditConfig,
  type SecurityAuditReport,
  type WeightedVote,
  type ArchitecturalDecision,
  type ComplianceResult,
  type ComplianceStandard,
} from "./comprehensive-security-audit.js";

export {
  SecurityOrchestrationLayer,
  createSecurityOrchestrationLayer,
  runSecurityOrchestration,
  type SecurityAgent,
  type SecurityAgentType,
  type AgentStatus,
  type SecurityTask,
  type SecurityTaskType,
  type AgentVote,
  type SecurityDecision,
  type OrchestrationConfig,
  type SecurityOrchestrationReport,
} from "./security-orchestration-layer.js";

export {
  SecurityAgentCoordinator,
  createSecurityAgentCoordinator,
  runMultiAgentSecurityScan,
  type SecurityAgentConfig,
  type SecurityAgentContext,
  type AgentVotingResult,
  type MultiAgentSecurityResult,
} from "./security-agent-coordinator.js";
