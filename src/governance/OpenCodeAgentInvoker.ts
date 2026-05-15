import type { InferenceProposal } from '../inference/inference-cycle.js';
import type { ProposalDeliberationInvoker, AgentReview } from './AgentInvoker.js';
import { GOVERNANCE_AGENTS } from '../inference/inference-cycle.js';

type InvokeArchitect = (prompt: string) => Promise<string>;
type ParseVotes = (
  output: string,
  proposals: InferenceProposal[]
) => Array<{
  proposalId: string;
  agentName: string;
  decision: string;
  confidence: number;
  reasoning: string;
}>;

/**
 * AgentInvoker implementation that uses the current OpenCode mechanism:
 * one `opencode run --agent architect` that distributes todos to sub-agents.
 */
export class OpenCodeAgentInvoker implements ProposalDeliberationInvoker {
  constructor(
    private readonly invokeArchitect: InvokeArchitect,
    private readonly parseVotes: ParseVotes
  ) {}

  async deliberate(proposal: InferenceProposal): Promise<AgentReview[]> {
    const subAgents = GOVERNANCE_AGENTS[proposal.type] ?? ['code-reviewer'];
    const allAgents = ['architect', ...subAgents];

    const promptLines = [
      `You are the architect agent. Evaluate the following proposal and create tasks for the relevant sub-agents to vote, then cast your own vote.`,
      ``,
      `Proposal Type: [${proposal.type}]`,
      `Title: ${proposal.title}`,
      `Description: ${proposal.description}`,
      `Evidence:`,
      ...proposal.evidence.map((e) => `  - ${e}`),
      ``,
      `Agents that must vote on this proposal: ${allAgents.join(', ')}`,
      ``,
      `Instructions:`,
      `- First cast your own vote as "architect".`,
      `- Then create a task for each sub-agent asking them to vote.`,
      ``,
      `Output format (exact, one block per agent):`,
      `PROPOSAL: 1`,
    ];

    for (const agent of allAgents) {
      promptLines.push(`  AGENT: ${agent}`);
      promptLines.push(`  DECISION: approve|reject|abstain`);
      promptLines.push(`  CONFIDENCE: 0.XX`);
      promptLines.push(`  REASONING: <brief reason>`);
    }

    const jsonOutput = await this.invokeArchitect(promptLines.join('\n'));
    const votes = this.parseVotes(jsonOutput, [proposal]);

    return votes.map((v) => ({
      agent: v.agentName,
      decision: v.decision,
      confidence: v.confidence,
      reasoning: v.reasoning,
    }));
  }
}
