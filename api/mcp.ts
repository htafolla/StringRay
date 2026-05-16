/**
 * Vercel serverless function for Governance MCP Server
 *
 * Uses Streamable HTTP transport from the MCP SDK for Grok CLI compatibility.
 * Skill server calls are routed in-process (no subprocess spawning).
 *
 * Endpoint: POST /
 * - JSON-RPC requests return inline responses
 * - Notifications return HTTP 202 with empty body
 */

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { GovernanceServer } from "../src/mcps/governance.server.js";

let transport: WebStandardStreamableHTTPServerTransport | null = null;
let server: GovernanceServer | null = null;

async function ensureInitialized(): Promise<WebStandardStreamableHTTPServerTransport> {
  if (!transport) {
    transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });
    server = new GovernanceServer();
    await server.connect(transport);
  }
  return transport;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const t = await ensureInitialized();
    return t.handleRequest(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config = {
  runtime: "nodejs",
};
