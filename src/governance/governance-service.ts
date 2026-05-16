/**
 * GovernanceService
 *
 * The central orchestrator for 0xRay governance.
 * It coordinates:
 *   - The three real skill MCP servers (via MCPClientManager)
 *   - The required external Dynamo/Solar governance
 *   - Merging logic from governance-core
 *
 * This service is used by:
 *   - governance.server.ts (MCP exposure)
 *   - OpenClaw API server
 *   - Future integrations (Hermes, etc.)
 *   - Reflection governance flows
 */

import { mcpClientManager } from '../mcps/mcp-client.js';
import { GovernanceClient } from '../integrations/governance/governance-client.js';
import { callInProcessSkill } from '../mcps/in-process-skill-registry.js';
import {
  GovernanceProposal,
  GovernanceVote,
  GovernanceResult,
  GovernanceContext,
  GovernOptions,
  GovernanceRequest,
  GovernanceResponse,
} from './governance-types';
import { applyDecisionMatrix, mergeVotes } from './governance-core';
import { frameworkLogger } from '../core/framework-logger.js';

export class GovernanceService {
  private externalClient: GovernanceClient;

  constructor() {
    this.externalClient = new GovernanceClient();
  }

  /**
   * Main entry point: Govern a set of proposals using real skill servers + required external.
   */
  async govern(request: GovernanceRequest): Promise<GovernanceResponse> {
    const { proposals, context, options } = request;
    const requireExternal = options?.requireExternalDynamo ?? true;

    frameworkLogger.log('governance-service', 'govern-start', 'info', {
      proposalCount: proposals.length,
      context,
    });

    // 1. Call the three real skill MCPs (one call per server, returns array of votes, one per proposal)
    const [codeReviewVotes, securityVotes, researcherVotes] = await Promise.all([
      this.callSkillServer("code-review", proposals, context),
      this.callSkillServer("security-audit", proposals, context),
      this.callSkillServer("researcher", proposals, context),
    ]);

    // 2. Always call external Dynamo (required) - returns array of arrays (one inner array per proposal)
    const externalVotes = await this.callExternalDynamo(proposals, requireExternal);

    // 3. Merge everything
    const results: GovernanceResult[] = proposals.map((proposal, index) => {
      const votes: GovernanceVote[] = [
        codeReviewVotes[index] || { server: "code-review", decision: "abstain", confidence: 0.3, reasoning: "missing" },
        securityVotes[index] || { server: "security-audit", decision: "abstain", confidence: 0.3, reasoning: "missing" },
        researcherVotes[index] || { server: "researcher", decision: "abstain", confidence: 0.3, reasoning: "missing" },
        ...(externalVotes[index] || []),
      ];

      const merged = mergeVotes(votes);

      return {
        proposalId: proposal.id,
        finalDecision: merged.finalDecision,
        averageConfidence: merged.averageConfidence,
        votes,
        reasoningSummary: merged.reasoningSummary,
      };
    });

    const approved = results.filter(r => r.finalDecision === 'approve').length;
    const needsRevision = results.filter(r => r.finalDecision === 'needs_revision').length;
    const rejected = results.filter(r => r.finalDecision === 'reject').length;

    return {
      results,
      overallDecision: approved > proposals.length * 0.6 ? 'approve' : 'needs_revision',
      summary: {
        total: proposals.length,
        approved,
        needsRevision,
        rejected,
      },
    };
  }

  private async callSkillServer(
    serverName: string,
    proposals: GovernanceProposal[],
    context?: GovernanceContext
  ): Promise<GovernanceVote[]> {
    const votes: GovernanceVote[] = [];
    const useInProcess = process.env.VERCEL === '1';

    for (const proposal of proposals) {
      try {
        let text = '';

        if (useInProcess) {
          // Vercel / serverless path — use in-process skill instances (no child processes)
          const result = await callInProcessSkill(serverName, 'analyze_proposal', {
            proposalTitle: proposal.title,
            proposalDescription: proposal.description,
            evidence: proposal.evidence || [],
            proposalType: proposal.type,
            context,
          });
          text = (result as any)?.content?.[0]?.text || '';
        } else {
          // Normal path — real MCP transport
          const result = await mcpClientManager.callServerTool(serverName, 'analyze_proposal', {
            proposalTitle: proposal.title,
            proposalDescription: proposal.description,
            evidence: proposal.evidence || [],
            proposalType: proposal.type,
            context,
          });
          text = (result as any)?.content?.[0]?.text || '';
        }

        const vote = this.parseVoteFromText(serverName, text);
        votes.push(vote);
      } catch (error) {
        frameworkLogger.log('governance-service', 'skill-call-error', 'error', {
          server: serverName,
          proposal: proposal.title,
          error: error instanceof Error ? error.message : String(error),
          mode: useInProcess ? 'in-process' : 'mcp',
        });

        votes.push({
          server: serverName,
          decision: 'abstain',
          confidence: 0.3,
          reasoning: `Call to ${serverName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    return votes;
  }

  private async callExternalDynamo(
    proposals: GovernanceProposal[],
    requireExternal: boolean
  ): Promise<GovernanceVote[][]> {
    const results: GovernanceVote[][] = [];

    for (const proposal of proposals) {
      try {
        const proposalText = `${proposal.title}\n\n${proposal.description}\n\nEvidence: ${(proposal.evidence || []).join('; ')}`;

        const external = await this.externalClient.governWithSolar({
          proposal: proposalText,
          baseVoteWeight: proposal.confidence || 0.8,
        });

        const decision = (external.finalRecommendation || external.originalRecommendation || 'NEEDS_REVISION').toLowerCase();
        const conf = 0.85 + (external.confidenceAdjustment || 0);

        results.push([{
          server: 'external-dynamo',
          decision: decision.includes('pass') || decision === 'approve' ? 'approve' : 'needs_revision',
          confidence: Math.min(0.99, Math.max(0.6, conf)),
          reasoning: `Solar-adjusted governance (${(external.solarContext as any)?.activityLevel || 'unknown'} solar)`,
          weight: external.adjustedVoteWeight || 1.0,
        }]);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        frameworkLogger.log('governance-service', 'external-dynamo-error', 'error', { error: msg });

        if (requireExternal) {
          throw new Error(`External Dynamo governance is required but failed: ${msg}`);
        }

        results.push([{
          server: 'external-dynamo',
          decision: 'abstain',
          confidence: 0.3,
          reasoning: `External governance unavailable: ${msg}`,
        }]);
      }
    }

    return results;
  }

  private parseVoteFromText(server: string, text: string): GovernanceVote {
    const decisionMatch = text.match(/DECISION:\s*(approve|reject|abstain|needs_revision)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*([0-9.]+)/);
    const reasoningMatch = text.match(/REASONING:\s*([\s\S]+?)(?:\n|$)/);

    return {
      server,
      decision: (decisionMatch?.[1]?.toLowerCase() as any) || 'abstain',
      confidence: parseFloat(confidenceMatch?.[1] || '0.5'),
      reasoning: reasoningMatch?.[1]?.trim() || 'No reasoning provided',
    };
  }
}

// Singleton for convenience
let governanceServiceInstance: GovernanceService | null = null;

export function getGovernanceService(): GovernanceService {
  if (!governanceServiceInstance) {
    governanceServiceInstance = new GovernanceService();
  }
  return governanceServiceInstance;
}
