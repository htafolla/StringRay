import type { IncomingMessage, ServerResponse } from "node:http";

const SERVER_INFO = {
  name: "governance",
  version: "1.0.0",
  protocol: "Streamable HTTP (MCP 2024-11-05)",
  description:
    "0xRay Governance MCP Server — orchestrates code-review, security-audit, " +
    "and researcher skill servers plus external Dynamo/Solar governance for " +
    "comprehensive proposal governance.",
  endpoints: {
    "GET /": "Server info and documentation",
    "GET /health": "Health check",
    "GET /tools": "List available MCP tools",
    "POST /": "JSON-RPC endpoint for MCP Streamable HTTP transport",
  },
  tools: [
    {
      name: "govern_proposals",
      description:
        "Run proposals through the full governance system. " +
        "Consults code-review, security-audit, researcher skill servers " +
        "plus external Dynamo/Solar governance. Supports regulatory " +
        "compliance proposals (AML/KYC, PSD2, GDPR).",
      input: {
        proposals: [
          {
            id: "string (optional)",
            type: "fix | refactor | guard | automate | codify | strategic | compliance",
            title: "string (required)",
            description: "string (required)",
            evidence: "string[] (optional)",
            source: "string (optional)",
            confidence: "number (optional, 0-1)",
          },
        ],
      },
    },
    {
      name: "govern_reflection",
      description:
        "Parse a reflection file and run extracted proposals through governance.",
      input: {
        reflectionPath: "string (optional, path to .md file)",
        reflectionContent: "string (optional, raw markdown)",
      },
    },
  ],
};

const TOOLS_LIST = {
  tools: [
    {
      name: "govern_proposals",
      description:
        "Run one or more proposals through the full 0xRay governance system. " +
        "Always consults the three real skill MCP servers (code-review, security-audit, researcher) " +
        "and the required external Dynamo/Solar governance. Returns merged structured decisions. " +
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
                  enum: [
                    "fix",
                    "refactor",
                    "guard",
                    "automate",
                    "codify",
                    "strategic",
                    "compliance",
                  ],
                },
                title: { type: "string" },
                description: { type: "string" },
                evidence: { type: "array", items: { type: "string" } },
                source: { type: "string" },
                confidence: { type: "number" },
              },
              required: ["type", "title", "description"],
            },
          },
          context: {
            type: "object",
            description: "Optional context (project, phase, etc.)",
          },
          options: {
            type: "object",
            properties: {
              require_external: {
                type: "boolean",
                default: true,
                description:
                  "Whether external Dynamo/Solar governance is required (default: true)",
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
        "Parse a reflection (or reflection file) and run its extracted proposals " +
        "through the full governance system.",
      inputSchema: {
        type: "object",
        properties: {
          reflectionPath: { type: "string" },
          reflectionContent: { type: "string" },
          context: { type: "object" },
        },
      },
    },
  ],
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const method = req.method || "GET";
  const path = url.pathname;

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET endpoints
  if (method === "GET") {
    switch (path) {
      case "/":
      case "/docs":
        json(res, SERVER_INFO);
        return;
      case "/health":
        json(res, { status: "ok", time: Date.now() });
        return;
      case "/tools":
        json(res, TOOLS_LIST);
        return;
      default:
        json(res, { error: "Not found", path }, 404);
        return;
    }
  }

  // POST / — JSON-RPC / Streamable HTTP
  if (method === "POST") {
    try {
      const raw = await readBody(req);
      const message = JSON.parse(raw);
      const reqId = message.id;

      // Notification (no id) → 202 empty
      if (reqId === undefined || reqId === null) {
        res.writeHead(202);
        res.end();
        return;
      }

      // Handle initialize
      if (message.method === "initialize") {
        json(res, {
          jsonrpc: "2.0",
          id: reqId,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "governance", version: "1.0.0" },
          },
        });
        return;
      }

      // Handle ping
      if (message.method === "ping") {
        json(res, { jsonrpc: "2.0", id: reqId, result: {} });
        return;
      }

      // Handle tools/list
      if (message.method === "tools/list") {
        json(res, { jsonrpc: "2.0", id: reqId, result: TOOLS_LIST });
        return;
      }

      // Handle tools/call
      if (message.method === "tools/call") {
        json(res, {
          jsonrpc: "2.0",
          id: reqId,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    message:
                      "Full governance processing requires GovernanceServer initialization. " +
                      "For now, use the stdio-based server for complete governance workflows.",
                    toolCalled: message.params?.name,
                    args: message.params?.arguments,
                  },
                  null,
                  2,
                ),
              },
            ],
          },
        });
        return;
      }

      // Unknown method
      json(
        res,
        {
          jsonrpc: "2.0",
          id: reqId,
          error: { code: -32601, message: `Method not found: ${message.method}` },
        },
        404,
      );
      return;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      json(res, { error: msg }, 400);
      return;
    }
  }

  json(res, { error: "Method not allowed" }, 405);
}
