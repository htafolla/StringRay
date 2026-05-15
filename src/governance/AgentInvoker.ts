import type { InferenceProposal } from '../inference/inference-cycle.js';

export interface AgentReview {
  agent: string;
  decision: string;
  confidence: number;
  reasoning: string;
}

/**
 * High-level interface for running multi-agent deliberation on a proposal.
 * Use this for governance / inference, not the low-level AgentInvoker callback.
 */
export interface ProposalDeliberationInvoker {
  deliberate(proposal: InferenceProposal): Promise<AgentReview[]>;
}

