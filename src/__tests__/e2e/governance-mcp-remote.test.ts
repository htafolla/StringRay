/**
 * E2E tests for the remote Governance MCP server (Streamable HTTP).
 *
 * These tests can target:
 * - Local development: http://localhost:3000 (or whatever port api/mcp.ts runs on)
 * - Vercel preview / production: https://stringray.vercel.app or the dedicated governance subdomain
 *
 * Set GOVERNANCE_MCP_URL env var to override the target.
 *
 * Note: The live Vercel deployment may lag behind this branch until merged to master.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.GOVERNANCE_MCP_URL || 'http://localhost:8787';

let serverReachable = false;

describe('Remote Governance MCP Server E2E', () => {
  beforeAll(async () => {
    try {
      const res = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(4000) });
      serverReachable = res.ok;
    } catch {
      serverReachable = false;
    }

    if (!serverReachable) {
      console.warn(`Governance MCP server not reachable at ${BASE_URL}. Skipping all remote MCP E2E tests.`);
      console.warn('To run against production: GOVERNANCE_MCP_URL=https://stringray.vercel.app npx vitest run src/__tests__/e2e/governance-mcp-remote.test.ts');
    }
  });

  it.skipIf(!serverReachable)('should respond to health/info endpoint', async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBeDefined();
  });

  it.skipIf(!serverReachable)('should return tools via JSON-RPC tools/list', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.jsonrpc).toBe('2.0');
    expect(body.result?.tools).toBeDefined();
    expect(Array.isArray(body.result.tools)).toBe(true);

    const toolNames = body.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain('govern_proposals');
    expect(toolNames).toContain('govern_reflection');
  });

  it.skipIf(!serverReachable)('should handle govern_proposals (with external disabled for test stability)', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'govern_proposals',
          arguments: {
            proposals: [
              {
                type: 'fix',
                title: 'Test proposal from E2E',
                description: 'This is a test proposal sent to the remote MCP server',
              },
            ],
            options: {
              require_external: false, // Avoid hard dependency on live Dynamo in CI
            },
          },
        },
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.jsonrpc).toBe('2.0');
    expect(body.result?.content).toBeDefined();

    const text = JSON.parse(body.result.content[0].text);
    expect(text.results).toBeDefined();
    expect(Array.isArray(text.results)).toBe(true);
  });

  it.skipIf(!serverReachable)('should support SSE connection (basic check)', async () => {
    // We just verify the endpoint responds with proper headers for SSE
    const res = await fetch(`${BASE_URL}/sse`, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
      },
    });

    // The server should at least not 404 and return event-stream content type
    expect([200, 101]).toContain(res.status);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType).toContain('text/event-stream');
  });
});
