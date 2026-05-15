import type { ProposalDeliberationInvoker, AgentReview } from './AgentInvoker.js';
import type { InferenceProposal } from '../inference/inference-cycle.js';
import { mcpClientManager } from '../mcps/mcp-client.js';
import { GOVERNANCE_AGENTS } from '../inference/inference-cycle.js';

/**
 * Maps agent names (from GOVERNANCE_AGENTS) to their corresponding
 * Knowledge Skill MCP server names in src/mcps/knowledge-skills/
 */
const AGENT_TO_SKILL_SERVER: Record<string, string> = {
  'code-reviewer': 'code-review',
  'researcher': 'researcher',
  'security-auditor': 'security-audit',
  'bug-triage-specialist': 'bug-triage-specialist',
  'refactorer': 'refactoring-strategies',
  'architect': 'architect-tools',
  'strategist': 'strategist',
  // Add more as needed
};

/**
 * MCP-based AgentInvoker.
 * Calls individual 0xRay Knowledge Skill servers via MCP.
 *
 * This is the portable implementation that works from Grok CLI, Hermes, OpenClaw, etc.
 */
export class MCPAgentInvoker implements ProposalDeliberationInvoker {
  async deliberate(proposal: InferenceProposal): Promise<AgentReview[]> {
    const agentNames = GOVERNANCE_AGENTS[proposal.type] ?? ['code-reviewer'];
    const reviews: AgentReview[] = [];

    for (const agentName of agentNames) {
      const serverName = AGENT_TO_SKILL_SERVER[agentName] || agentName;

      try {
        // Try to call a common analysis/review tool on the skill server.
        // Many knowledge skills expose "analyze", "review", or a tool named after the skill.
        const result = await mcpClientManager.callServerTool(serverName, 'analyze', {
          title: proposal.title,
          description: proposal.description,
          evidence: proposal.evidence,
          proposalType: proposal.type,
        });

        // Best-effort extraction of decision/reasoning from the skill response.
        // Real skills should return structured data in the future.
        const text = typeof result === 'string' ? result : JSON.stringify(result);
        const decision = this.extractDecision(text);
        const confidence = this.extractConfidence(text);
        const reasoning = this.extractReasoning(text) || text.slice(0, 600);

        reviews.push({
          agent: agentName,
          decision,
          confidence,
          reasoning,
        });
      } catch (error: any) {
        reviews.push({
          agent: agentName,
          decision: 'abstain',
          confidence: 0.3,
          reasoning: `Failed to call skill "${serverName}": ${error?.message || error}`,
        });
      }
    }

    return reviews;
  }

  private extractDecision(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('approve') || lower.includes('pass')) return 'approve';
    if (lower.includes('reject') || lower.includes('fail')) return 'reject';
    return 'abstain';
  }

  private extractConfidence(text: string): number {
    const match = text.match(/confidence[:\s]*([0-9.]+)/i);
    if (match && match[1]) {
      const val = parseFloat(match[1]);
      return Math.min(1, Math.max(0, val));
    }
    return 0.7;
  }

  private extractReasoning(text: string): string {
    // Try to find a "reasoning" or "summary" section
    const match = text.match(/(?:reasoning|summary|analysis)[:\s]*(.+)/is);
    if (match && match[1]) {
      return match[1].trim().slice(0, 800);
    }
    return text.trim().slice(0, 600);
  }
}
