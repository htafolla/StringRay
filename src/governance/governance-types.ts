/**
 * Core types for the 0xRay Governance System.
 * These types are used by the GovernanceService, Governance MCP,
 * and all integrations.
 */

export type ProposalType =
  | 'fix'
  | 'refactor'
  | 'guard'
  | 'automate'
  | 'codify'
  | 'strategic'
  | 'compliance';

export interface GovernanceProposal {
  id: string;
  type: ProposalType;
  title: string;
  description: string;
  evidence?: string[];
  source?: 'inference' | 'reflection' | 'manual' | 'ci' | 'phase-planning';
  confidence?: number; // 0-1
  metadata?: Record<string, unknown>;
}

export interface GovernanceVote {
  server: string; // e.g. "code-review", "security-audit", "researcher", "external-dynamo"
  decision: 'approve' | 'reject' | 'abstain' | 'needs_revision';
  confidence: number; // 0-1
  reasoning: string;
  weight?: number; // for weighted voting
}

export interface GovernanceResult {
  proposalId: string;
  finalDecision: 'approve' | 'reject' | 'needs_revision' | 'abstain';
  averageConfidence: number;
  votes: GovernanceVote[];
  reasoningSummary: string;
  recommendedActions?: string[];
  externalContext?: Record<string, unknown>; // Solar activity, etc.
}

export interface GovernanceContext {
  project?: string;
  phase?: string;
  source?: string;
  reflectionId?: string;
  inferenceCycleId?: string;
}

export interface GovernOptions {
  requireExternalDynamo?: boolean; // default true
  minConfidence?: number;
  enableSolarAdjustment?: boolean;
}

export interface GovernanceRequest {
  proposals: GovernanceProposal[];
  context?: GovernanceContext;
  options?: GovernOptions;
}

export interface GovernanceResponse {
  results: GovernanceResult[];
  overallDecision: 'approve' | 'needs_revision' | 'reject';
  summary: {
    total: number;
    approved: number;
    needsRevision: number;
    rejected: number;
  };
}
