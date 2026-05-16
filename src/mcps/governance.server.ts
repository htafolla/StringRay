/**
 * 0xRay Governance MCP Server
 *
 * First-class Governance Service that orchestrates the real individual
 * skill MCP servers (code-review, security-audit, researcher) plus the
 * required Dynamo Solar SSOT filter.
 *
 * This is the primary governance entry point for all integrations
 * (Hermes, OpenCode, OpenClaw, Grok CLI, Jelly, CI/CD).
 *
 * It always runs proposals through the three real skill servers
 * and the Dynamo Solar SSOT filter (required by default).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { mcpClientManager } from "./mcp-client.js";
import { frameworkLogger } from "../core/framework-logger.js";
import * as fs from "fs";
import * as path from "path";
import { createGracefulShutdown } from "../utils/shutdown-handler.js";
import { getGovernanceService } from "../governance/governance-service.js";
import type { GovernanceRequest } from "../governance/governance-types.js";

interface GovernanceProposalInput {
  id?: string;
  type: 'fix' | 'refactor' | 'guard' | 'automate' | 'codify' | 'strategic' | 'compliance';
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

  private validateGovernProposalsArgs(value: unknown): GovernProposalsArgs {
    if (!value || typeof value !== 'object') {
      throw new Error('govern_proposals requires an object argument');
    }
    const obj = value as Record<string, unknown>;
    if (!Array.isArray(obj.proposals)) {
      throw new Error('govern_proposals requires a "proposals" array');
    }
    for (let i = 0; i < obj.proposals.length; i++) {
      const p = obj.proposals[i] as Record<string, unknown>;
      if (!p || typeof p !== 'object') {
        throw new Error(`proposals[${i}] must be an object`);
      }
      if (typeof p.type !== 'string' || !['fix', 'refactor', 'guard', 'automate', 'codify', 'strategic', 'compliance'].includes(p.type)) {
        throw new Error(`proposals[${i}].type must be one of: fix, refactor, guard, automate, codify, strategic, compliance`);
      }
      if (typeof p.title !== 'string') {
        throw new Error(`proposals[${i}].title must be a string`);
      }
      if (typeof p.description !== 'string') {
        throw new Error(`proposals[${i}].description must be a string`);
      }
    }
    return value as GovernProposalsArgs;
  }

  private validateGovernReflectionArgs(value: unknown): GovernReflectionArgs {
    if (!value || typeof value !== 'object') {
      throw new Error('govern_reflection requires an object argument');
    }
    return value as GovernReflectionArgs;
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "govern_proposals",
            description:
              "Run one or more proposals through the full 0xRay governance system. " +
              "Internal deliberation via 3 skill MCPs + required Dynamo Solar SSOT filter. " +
              "Returns merged structured decisions. " +
              "Supports regulatory compliance proposals: AML/KYC, PSD2, GDPR content moderation, " +
              "and other compliance-related governance scenarios.",
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
                        enum: ["fix", "refactor", "guard", "automate", "codify", "strategic", "compliance"],
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
            return await this.handleGovernProposals(this.validateGovernProposalsArgs(args));
          case "govern_reflection":
            return await this.handleGovernReflection(this.validateGovernReflectionArgs(args));
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
    const service = getGovernanceService();

    const request: GovernanceRequest = {
      proposals: args.proposals.map((p, i) => ({
        id: p.id || `prop-${Date.now()}-${i}`,
        type: p.type,
        title: p.title,
        description: p.description,
        evidence: p.evidence || [],
        source: "manual",
        confidence: p.confidence || 0.8,
      })),
      context: args.context || {},
      options: {
        requireExternalDynamo: args.options?.require_external ?? true,
      },
    };

    frameworkLogger.log("governance-mcp", "delegating-to-governance-service", "info", {
      proposalCount: request.proposals.length,
    });

    const response = await service.govern(request);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2),
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

    frameworkLogger.log("governance-mcp", "parsing-reflection", "info", { reflectionPath, contentLength: content.length });

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

    frameworkLogger.log("governance-mcp", "reflection-proposals-found", "info", { count: proposals.length });

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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    createGracefulShutdown({
      serverName: "governance.server",
      server: this.server,
    });
  }

  async connect(transport: Transport) {
    await this.server.connect(transport);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GovernanceServer();
  server.run().catch((error) => {
    frameworkLogger.log("governance-mcp", "startup-error", "error", { error: String(error) });
    process.exit(1);
  });
}

export { GovernanceServer };
