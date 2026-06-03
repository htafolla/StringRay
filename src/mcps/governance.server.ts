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
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
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
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { getGovernanceService } from "../governance/governance-service.js";
import { initializeGovernanceIntegration, shutdownGovernanceIntegration } from "../integrations/governance/index.js";
import { featuresConfigLoader } from "../core/features-config.js";
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
        name: "governance", version: "1.22.61",
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

  private async initializeGovernance(): Promise<void> {
    try {
      const config = featuresConfigLoader.loadConfig() as any;
      const govConfig = config?.inference_governance;
      if (govConfig?.enabled) {
        await initializeGovernanceIntegration();
        frameworkLogger.log("governance-server", "dynamo-solar-ssot-initialized", "info", {
          endpoint: govConfig.endpoint_url || "default",
        });
      } else {
        frameworkLogger.log("governance-server", "dynamo-solar-ssot-disabled", "info", {
          message: "Dynamo Solar SSOT disabled in features config, external governance will abstain",
        });
      }
    } catch (err) {
      frameworkLogger.log("governance-server", "dynamo-solar-ssot-init-error", "error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async run(): Promise<void> {
    await this.initializeGovernance();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    let parentCheckTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = async (signal: string) => {
      if (parentCheckTimer !== null) {
        clearTimeout(parentCheckTimer);
        parentCheckTimer = null;
      }

      const timeout = setTimeout(() => {
        frameworkLogger.log("mcps/governance", "shutdown", "error", { message: "Graceful shutdown timeout, forcing exit..." });
        process.exit(1);
      }, 5000);

      try {
        if (this.server && typeof this.server.close === "function") {
          await this.server.close();
        }
        clearTimeout(timeout);
        process.exit(0);
      } catch (error) {
        clearTimeout(timeout);
        frameworkLogger.log("mcps/governance", "shutdown", "error", { message: `Error during server shutdown: ${String(error)}` });
        process.exit(1);
      }
    };

    process.on("SIGINT", () => cleanup("SIGINT"));
    process.on("SIGTERM", () => cleanup("SIGTERM"));
    process.on("SIGHUP", () => cleanup("SIGHUP"));

    const checkParent = () => {
      try {
        process.kill(process.ppid, 0);
        parentCheckTimer = setTimeout(checkParent, 1000);
      } catch (error) {
        parentCheckTimer = null;
        cleanup("parent-process-death");
      }
    };

    parentCheckTimer = setTimeout(checkParent, 2000);

    process.on("uncaughtException", (error) => {
      frameworkLogger.log("mcps/governance", "uncaughtException", "error", { message: `Uncaught Exception: ${String(error)}` });
      cleanup("uncaughtException");
    });

    process.on("unhandledRejection", (reason) => {
      frameworkLogger.log("mcps/governance", "unhandledRejection", "error", { message: `Unhandled Rejection: ${String(reason)}` });
      cleanup("unhandledRejection");
    });
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport as any);
  }

  /**
   * Run as HTTP server using Streamable HTTP transport (for Grok CLI compatibility).
   */
  async runHttp(port: number = parseInt(process.env.MCP_PORT ?? "3100", 10)): Promise<void> {
    await this.initializeGovernance();

    const app = createMcpExpressApp();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    await this.server.connect(transport as any);

    app.post("/mcp", async (req: any, res: any) => {
      try {
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        process.stderr.write(`[governance.server] HTTP handler error: ${error}\n`);
        if (!res.headersSent) {
          res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
        }
      }
    });

    app.get("/health", (_req: any, res: any) => {
      res.json({ status: "ok", server: "governance" });
    });

    app.listen(port, () => {
      process.stderr.write(`[governance.server] HTTP MCP listening on port ${port}\n`);
    });

    process.on("SIGINT", () => { transport.close(); process.exit(0); });
    process.on("SIGTERM", () => { transport.close(); process.exit(0); });
  }
}

// Start the server if this file is run directly
const entryPoint = path.resolve(process.argv[1] ?? "");
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  // If --port or MCP_PORT is set, use HTTP transport (for Grok CLI compatibility)
  const cliPort = process.argv.find((a) => a.startsWith("--port="))?.split("=")[1];
  const port = parseInt(cliPort ?? process.env.MCP_PORT ?? "", 10);

  if (!isNaN(port)) {
    const server = new GovernanceServer();
    server.runHttp(port).catch((error) => {
      process.stderr.write(`[governance.server] HTTP startup error: ${error}\n`);
      process.exit(1);
    });
  } else {
    const server = new GovernanceServer();
    server.run().catch((error) => {
      process.stderr.write(`[governance.server] Fatal startup error: ${error}\n`);
      process.exit(1);
    });
  }
}

export { GovernanceServer };
