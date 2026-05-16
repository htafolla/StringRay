/**
 * 0xRay Governance MCP Server
 *
 * First-class Governance Service that orchestrates the real individual
 * skill MCP servers (code-review, security-audit, researcher) plus the
 * required external Dynamo/Solar governance.
 *
 * This is the primary governance entry point for all integrations
 * (Hermes, OpenCode, OpenClaw, Grok CLI, Jelly, CI/CD).
 *
 * It always runs proposals through the three real skill servers
 * and the external Dynamo governance (Dynamo is required).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { mcpClientManager } from "./mcp-client.js";
import { frameworkLogger } from "../core/framework-logger.js";
import { InferenceGovernanceIntegration } from "../integrations/governance/index.js";
import { GovernanceClient } from "../integrations/governance/governance-client.js";
import * as fs from "fs";
import * as path from "path";
import type { InferenceProposal } from "../inference/inference-cycle.js";

interface GovernanceProposalInput {
  id?: string;
  type: 'fix' | 'refactor' | 'guard' | 'automate' | 'codify' | 'strategic';
  title: string;
  description: string;
  evidence?: string[];
  source?: string;
  confidence?: number;
}

interface GovernProposalsArgs {
  proposals: GovernanceProposalInput[];
  context?: {
    project?: string;
    phase?: string;
    source?: string;
  };
  options?: {
    require_external?: boolean; // default true (Dynamo is required)
  };
}

interface GovernReflectionArgs {
  reflectionPath?: string;
  reflectionContent?: string;
  context?: Record<string, unknown>;
}

class GovernanceServer {
  private server: Server;
  private governanceIntegration: InferenceGovernanceIntegration | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "governance",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private async ensureGovernanceIntegration() {
    if (!this.governanceIntegration) {
      this.governanceIntegration = new InferenceGovernanceIntegration();
      // Note: In real usage this would be initialized via the integration system
      // For the MCP server we initialize it directly
      try {
        await this.governanceIntegration.initialize();
      } catch (error) {
        frameworkLogger.log("governance-mcp", "external-init-warning", "warning", {
          message: "External Dynamo governance integration not fully initialized. Some features may be limited.",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return this.governanceIntegration;
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "govern_proposals",
            description:
              "Run one or more proposals through the full 0xRay governance system. " +
              "Always consults the three real skill MCP servers (code-review, security-audit, researcher) " +
              "and the required external Dynamo/Solar governance. Returns merged structured decisions.",
            inputSchema: {
              type: "object",
              properties: {
                proposals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: {
                        type: "string",
                        enum: ["fix", "refactor", "guard", "automate", "codify", "strategic"],
                      },
                      title: { type: "string" },
                      description: { type: "string" },
                      evidence: { type: "array", items: { type: "string" } },
                      source: { type: "string" },
                      confidence: { type: "number" },
                    },
                    required: ["type", "title", "description"],
                  },
                  description: "List of proposals to govern",
                },
                context: {
                  type: "object",
                  description: "Optional context about the proposals (project, phase, etc.)",
                },
                options: {
                  type: "object",
                  properties: {
                    require_external: {
                      type: "boolean",
                      default: true,
                      description: "Whether external Dynamo/Solar governance is required (default: true)",
                    },
                  },
                },
              },
              required: ["proposals"],
            },
          },
          {
            name: "govern_reflection",
            description:
              "Parse a reflection (or reflection file) and run its extracted proposals through the full governance system. " +
              "This is the primary way to govern outcomes from reflection-based workflows.",
            inputSchema: {
              type: "object",
              properties: {
                reflectionPath: {
                  type: "string",
                  description: "Path to a reflection .md file (alternative to reflectionContent)",
                },
                reflectionContent: {
                  type: "string",
                  description: "Raw reflection content (alternative to reflectionPath)",
                },
                context: { type: "object" },
              },
              required: [],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "govern_proposals":
            return await this.handleGovernProposals(args as unknown as GovernProposalsArgs);
          case "govern_reflection":
            return await this.handleGovernReflection(args as unknown as GovernReflectionArgs);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        frameworkLogger.log("governance-mcp", "tool-error", "error", {
          tool: name,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          content: [
            {
              type: "text",
              text: `Governance failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        } as CallToolResult;
      }
    });
  }

  private async handleGovernProposals(args: GovernProposalsArgs): Promise<CallToolResult> {
    const { proposals, context, options } = args;
    const requireExternal = options?.require_external ?? true;

    console.error(`[GOVERNANCE-MCP] Received ${proposals.length} proposals for governance`);

    // 1. Call the three real skill MCP servers in parallel
    const internalPromises = [
      this.callSkillServer("code-review", proposals, context),
      this.callSkillServer("security-audit", proposals, context),
      this.callSkillServer("researcher", proposals, context),
    ];

    const [codeReviewResults, securityResults, researcherResults] = await Promise.all(internalPromises);

    // 2. Always call external Dynamo/Solar governance (required, as per architecture)
    const externalResults: any[] = [];
    const govClient = new (await import("../integrations/governance/governance-client.js")).GovernanceClient();

    for (const p of proposals) {
      try {
        const proposalText = `${p.title}\n\n${p.description}\n\nEvidence: ${(p.evidence || []).join('; ')}`;
        const externalVote = await govClient.governWithSolar({
          proposal: proposalText,
          baseVoteWeight: p.confidence || 0.8,
        });
        externalResults.push({
          proposalId: p.id || p.title,
          ...externalVote,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[GOVERNANCE-MCP] External Dynamo call failed for proposal "${p.title}": ${errorMsg}`);
        if (requireExternal) {
          throw new Error(`External Dynamo/Solar governance is required but failed for "${p.title}": ${errorMsg}`);
        }
      }
    }
    console.error(`[GOVERNANCE-MCP] External Dynamo governance returned ${externalResults.length} results`);

    // 3. Merge internal + external results (simplified merging for MVP)
    const mergedResults = this.mergeGovernanceResults(
      proposals,
      codeReviewResults || [],
      securityResults || [],
      researcherResults || [],
      externalResults || []
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(mergedResults, null, 2),
        },
      ],
    };
  }

  private async handleGovernReflection(args: GovernReflectionArgs): Promise<CallToolResult> {
    const { reflectionPath, reflectionContent, context } = args;

    let content = reflectionContent;
    if (!content && reflectionPath) {
      if (!fs.existsSync(reflectionPath)) {
        throw new Error(`Reflection file not found: ${reflectionPath}`);
      }
      content = fs.readFileSync(reflectionPath, "utf-8");
    }

    if (!content) {
      throw new Error("Either reflectionPath or reflectionContent must be provided");
    }

    console.error(`[GOVERNANCE-MCP] Parsing reflection for proposals...`);

    const proposals = this.parseCodexTermsFromReflection(content);

    if (proposals.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: "No codex term proposals found in reflection.",
              proposals: [],
            }, null, 2),
          },
        ],
      };
    }

    console.error(`[GOVERNANCE-MCP] Found ${proposals.length} proposals in reflection. Sending to governance...`);

    // Delegate to the main govern_proposals logic
    return this.handleGovernProposals({
      proposals,
      context: { ...(context || {}), source: "reflection" },
      options: { require_external: true },
    });
  }

  private parseCodexTermsFromReflection(content: string): GovernanceProposalInput[] {
    const CODEX_TERM_SECTION = "## Codex Term Proposals";
    const PRIORITY_SECTION = "## Implementation Priority Matrix";

    const startIdx = content.indexOf(CODEX_TERM_SECTION);
    if (startIdx === -1) return [];

    const endIdx = content.indexOf(PRIORITY_SECTION);
    const section = endIdx !== -1
      ? content.slice(startIdx + CODEX_TERM_SECTION.length, endIdx)
      : content.slice(startIdx + CODEX_TERM_SECTION.length);

    const terms: GovernanceProposalInput[] = [];
    const blocks = section.split(/\n### /).filter(b => b.trim().length > 0);

    for (const block of blocks) {
      const nameMatch = block.match(/^([^\n]+)/);
      if (!nameMatch || !nameMatch[1]) continue;

      const name = nameMatch[1].trim();
      const catMatch = block.match(/\*\*Category\*\*:\s*(.+)/);
      const sevMatch = block.match(/\*\*Severity\*\*:\s*(.+)/);
      const ruleMatch = block.match(/\*\*Detection Rule\*\*:\s*"(.+)"/);
      const targetMatch = block.match(/\*\*Implementation Target\*\*:\s*(.+)/);

      const severity = (sevMatch?.[1]?.trim() ?? "medium").toLowerCase();
      const category = (catMatch?.[1]?.trim() ?? "design").toLowerCase();

      let type: GovernanceProposalInput['type'] = "codify";
      if (category.includes("anti-pattern")) type = "guard";
      else if (category.includes("aspirational")) type = "codify";
      else if (category.includes("process")) type = "automate";
      else if (category.includes("design")) type = "refactor";

      terms.push({
        id: `reflection-${Date.now()}-${terms.length}`,
        type,
        title: name,
        description: ruleMatch?.[1] ?? `Implement ${name}`,
        evidence: [
          `Severity: ${severity}`,
          `Target: ${targetMatch?.[1]?.trim() ?? "TBD"}`,
        ],
        source: "reflection",
        confidence: severity === "blocking" ? 0.95 : severity === "high" ? 0.85 : severity === "medium" ? 0.7 : 0.5,
      });
    }

    return terms;
  }

  private async callSkillServer(
    serverName: string,
    proposals: GovernanceProposalInput[],
    context?: any
  ): Promise<any[]> {
    const results: any[] = [];

    for (const proposal of proposals) {
      try {
        const result = await mcpClientManager.callServerTool(serverName, "analyze_proposal", {
          proposalTitle: proposal.title,
          proposalDescription: proposal.description,
          evidence: proposal.evidence || [],
          proposalType: proposal.type,
          context,
        });
        results.push({ proposalId: proposal.id || proposal.title, result });
      } catch (error) {
        results.push({
          proposalId: proposal.id || proposal.title,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  private mergeGovernanceResults(
    originalProposals: GovernanceProposalInput[],
    codeReviewResults: any[],
    securityResults: any[],
    researcherResults: any[],
    externalResults: any[] = []
  ): any {
    // This is a simplified merger. A production version would use a proper WeightedVotingAggregator.
    const merged: any[] = [];

    for (let i = 0; i < originalProposals.length; i++) {
      const prop = originalProposals[i];
      const votes: any[] = [];

      // Collect votes from internal servers
      const cr = codeReviewResults[i];
      const sa = securityResults[i];
      const re = researcherResults[i];

      if (cr?.result) votes.push({ server: "code-review", ...this.extractVote(cr.result) });
      if (sa?.result) votes.push({ server: "security-audit", ...this.extractVote(sa.result) });
      if (re?.result) votes.push({ server: "researcher", ...this.extractVote(re.result) });

      // Include external if available (Dynamo is required)
      if (externalResults && externalResults[i]) {
        votes.push({ server: "external-dynamo", ...externalResults[i] });
      }

      // Simple majority for now
      const approveCount = votes.filter((v) => v.decision === "approve").length;
      const finalDecision = approveCount > votes.length / 2 ? "approve" : "needs_revision";

      merged.push({
        proposal: prop,
        votes,
        finalDecision,
        averageConfidence: this.calculateAverageConfidence(votes),
      });
    }

    return {
      results: merged,
      summary: {
        total: merged.length,
        approved: merged.filter((r) => r.finalDecision === "approve").length,
        needsRevision: merged.filter((r) => r.finalDecision === "needs_revision").length,
      },
    };
  }

  private extractVote(result: any): { decision: string; confidence: number; reasoning: string } {
    // The skill servers return { content: [{ text: "DECISION: ...\nCONFIDENCE: ...\nREASONING: ..." }] }
    const text = result?.content?.[0]?.text || "";
    const decisionMatch = text.match(/DECISION:\s*(approve|reject|abstain)/i);
    const confidenceMatch = text.match(/CONFIDENCE:\s*([0-9.]+)/);
    const reasoningMatch = text.match(/REASONING:\s*(.+)/s);

    return {
      decision: decisionMatch?.[1]?.toLowerCase() || "abstain",
      confidence: parseFloat(confidenceMatch?.[1] || "0.5"),
      reasoning: reasoningMatch?.[1]?.trim() || "No reasoning provided",
    };
  }

  private calculateAverageConfidence(votes: any[]): number {
    if (votes.length === 0) return 0.5;
    const sum = votes.reduce((acc, v) => acc + (v.confidence || 0.5), 0);
    return sum / votes.length;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("[Governance MCP] Server started and listening on stdio");
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GovernanceServer();
  server.run().catch((error) => {
    console.error("Failed to start Governance MCP Server:", error);
    process.exit(1);
  });
}

export { GovernanceServer };
