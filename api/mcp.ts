import { Hono, Context } from 'hono'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import { EventEmitter } from 'node:events'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
// New clean governance core (src/governance/)
import { getGovernanceService } from '../src/governance/governance-service.js'
import type { GovernanceRequest } from '../src/governance/governance-types.js'
import { frameworkLogger } from '../src/core/framework-logger.js'

// ===== Governance Enabled Check (cold-start cached) =====
let governanceEnabled = true
let governanceReason = ''
try {
  const featuresPaths = [
    path.join(process.cwd(), '.opencode', 'strray', 'features.json'),
    path.join(process.cwd(), '.strray', 'features.json'),
  ]
  for (const fp of featuresPaths) {
    if (fs.existsSync(fp)) {
      const features = JSON.parse(fs.readFileSync(fp, 'utf-8'))
      if (features.governance && features.governance.enabled === false) {
        governanceEnabled = false
        governanceReason = features.governance.default_free_message || 'Governance is disabled via features.json'
      }
      break
    }
  }
} catch {
  // features.json not available — default to enabled
}

// ===== Pub/Sub (in-memory EventEmitter, no Redis dep) =====
const bus = new EventEmitter()
bus.setMaxListeners(100)

async function publish(channel: string, message: string): Promise<boolean> {
  return bus.emit(channel, message)
}

async function subscribe(channel: string, cb: (msg: string) => void): Promise<() => Promise<void>> {
  bus.on(channel, cb)
  return async () => { bus.off(channel, cb) }
}

// ===== Types =====
interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

// ===== Session Registry =====
const sessions = new Map<string, { createdAt: number; clientInfo: Record<string, unknown> }>()

function createSession(clientInfo?: Record<string, unknown>): string {
  const id = crypto.randomUUID()
  sessions.set(id, { createdAt: Date.now(), clientInfo: clientInfo ?? {} })
  return id
}

// ===== Tool Definitions =====
const TOOLS: ToolDefinition[] = [
  {
    name: 'govern_proposals',
    description: 'Run proposals through the governance system. ' +
      'Internal deliberation via 3 skill MCPs + required Dynamo Solar SSOT filter ' +
      '(sunlight physics + neural net + temporal first principles).',
    inputSchema: {
      type: 'object',
      properties: {
        proposals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['fix', 'refactor', 'guard', 'automate', 'codify', 'strategic', 'compliance'] },
              title: { type: 'string' },
              description: { type: 'string' },
              evidence: { type: 'array', items: { type: 'string' } },
              source: { type: 'string' },
              confidence: { type: 'number' },
            },
            required: ['type', 'title', 'description'],
          },
        },
        context: { type: 'object', description: 'Optional context (project, phase, etc.)' },
        options: {
          type: 'object',
          properties: {
            require_external: { type: 'boolean', default: true, description: 'Whether external Dynamo/Solar governance is required (default: true)' },
          },
        },
      },
      required: ['proposals'],
    },
  },
  {
    name: 'govern_health',
    description: 'Health check for the governance MCP server.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'govern_sessions',
    description: 'List active governance sessions.',
    inputSchema: { type: 'object', properties: {} },
  },
]

// ===== JSON-RPC Helpers =====
function mcpResult(id: unknown, result: unknown) {
  return { jsonrpc: '2.0', id, result }
}

function mcpError(id: unknown, code: number, message: string, data?: unknown) {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } }
}

// ===== MCP Message Handler (shared by POST / and POST /messages) =====
async function handleMCPMessage(_sessionId: string, msg: any): Promise<any> {
  const { jsonrpc, id, method, params } = msg || {}
  if (jsonrpc !== '2.0' || id === undefined || id === null) return null

  try {
    switch (method) {
      case 'initialize': {
        const sessionId = createSession(params?.clientInfo)
        return mcpResult(id, {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'governance', version: '1.0.0' },
          _session: { id: sessionId },
        })
      }

      case 'ping':
        return mcpResult(id, {})

      case 'tools/list':
        return mcpResult(id, { tools: TOOLS })

      case 'tools/call': {
        const { name, arguments: args } = params || {}
        if (!name) return mcpError(id, -32602, 'Missing tool name')

        if (name === 'govern_proposals') {
          const inputProposals = args?.proposals || []

          // Map to the canonical GovernanceRequest shape
          const request: GovernanceRequest = {
            proposals: inputProposals.map((p: any, i: number) => ({
              id: p.id || `prop-${Date.now()}-${i}`,
              type: p.type || 'fix',
              title: p.title || 'Untitled Proposal',
              description: p.description || p.details || '',
              evidence: p.evidence || [],
              source: 'vercel-http',
              confidence: p.confidence || 0.8,
            })),
            context: { source: 'vercel-governance-mcp' },
            options: { requireExternalDynamo: true },
          }

          // Ensure Dynamo Solar SSOT integration is initialized (important for serverless cold starts)
          const { initializeGovernanceIntegration } = await import('../src/integrations/governance/index.js')
          try {
            await initializeGovernanceIntegration()
          } catch {
            // If Dynamo is unreachable, GovernanceService will handle it based on requireExternalDynamo
          }

          // Use the shared GovernanceService (supports in-process on Vercel)
          const service = getGovernanceService()
          const response = await service.govern(request)

          return mcpResult(id, {
            content: [{
              type: 'text',
              text: JSON.stringify({
                summary: `Governed ${response.summary.total} proposals via internal skill MCPs + Dynamo Solar SSOT filter`,
                overallDecision: response.overallDecision,
                results: response.results,
                engine: 'GovernanceService + real MCPs (code-review, security-audit, researcher) + Solar',
              }, null, 2),
            }],
          })
        }

        if (name === 'govern_health') {
          return mcpResult(id, { content: [{ type: 'text', text: JSON.stringify({ status: 'ok', time: Date.now(), sessions: sessions.size }) }] })
        }

        if (name === 'govern_sessions') {
          return mcpResult(id, {
            content: [{
              type: 'text',
              text: JSON.stringify({
                count: sessions.size,
                sessions: Array.from(sessions.entries()).map(([id, s]) => ({ id, createdAt: s.createdAt })),
              }, null, 2),
            }],
          })
        }

        return mcpError(id, -32601, `Unknown tool: ${name}`)
      }

      default:
        return mcpError(id, -32601, `Method not found: ${method}`)
    }
  } catch (err: any) {
    return mcpError(id, -32603, 'Internal error', err.message)
  }
}

// ===== SSE session registry =====
const activeSessions = new Map<string, true>()

// ===== Governance Gate Middleware =====
async function governanceGate(c: Context, next: () => Promise<void>) {
  if (!governanceEnabled) {
    if (c.req.method === 'GET' && (c.req.path === '/' || c.req.path === '/health')) {
      // Allow info/health endpoints even when disabled
      return next()
    }
    c.status(503)
    return c.json({
      status: 'disabled',
      reason: governanceReason,
      doc: 'Set governance.enabled=true in .opencode/strray/features.json',
    })
  }
  return next()
}

// ===== Hono App =====
const app = new Hono()

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.use('/*', governanceGate)

// ===== GET /sse — SSE streaming =====
app.get('/sse', (c: Context) => {
  const sessionId = crypto.randomUUID()
  const channel = `session:${sessionId}`
  activeSessions.set(sessionId, true)

  const cleanup = () => {
    activeSessions.delete(sessionId)
    unsub().catch(() => {})
  }
  c.req.raw.signal.addEventListener('abort', cleanup)

  let unsub: () => Promise<void> = () => Promise.resolve()

  return streamSSE(c, async (stream) => {
    unsub = await subscribe(channel, async (raw: string) => {
      try { await stream.writeSSE({ data: raw }) } catch { cleanup() }
    })

    await stream.writeSSE({
      event: 'endpoint',
      data: `/messages?sessionId=${sessionId}`,
    })

    await new Promise<void>((resolve) => {
      c.req.raw.signal.addEventListener('abort', () => resolve())
    })
  })
})

// ===== POST /messages — SSE session message handler =====
app.post('/messages', async (c: Context) => {
  const sessionId = c.req.query('sessionId')
  if (!sessionId) {
    return c.json({ error: 'Missing session ID — include ?sessionId= in URL' }, 400)
  }

  const body = await c.req.json()
  const result = await handleMCPMessage(sessionId, body)
  if (result) {
    const delivered = await publish(`session:${sessionId}`, JSON.stringify(result))
    if (!delivered) {
      frameworkLogger.log('vercel-governance-mcp', 'sse-publish-failed', 'warning', {
        sessionId,
        reason: 'No active SSE subscriber for session',
      })
    }
  }

  return c.json({ ok: true })
})

// ===== GET /, /docs, /health, /tools =====
app.get('/', (c) => {
  return c.json({
    name: 'governance',
    version: '1.0.0',
    description: '0xRay Governance MCP Server — Streamable HTTP (MCP 2024-11-05)',
    endpoints: {
      'GET /': 'Server info',
      'GET /docs': 'Server info (alias)',
      'GET /health': 'Health check',
      'GET /tools': 'List available MCP tools',
      'GET /sse': 'SSE streaming (session-based transport)',
      'POST /': 'JSON-RPC endpoint (Streamable HTTP)',
      'POST /messages': 'JSON-RPC via SSE session (?sessionId=)',
    },
  })
})

app.get('/docs', (c) => {
  return c.json({
    name: 'governance',
    version: '1.0.0',
    protocol: 'Streamable HTTP (MCP 2024-11-05)',
    description: '0xRay Governance MCP Server — orchestrates code-review, security-audit, ' +
      'and researcher skill servers plus external Dynamo/Solar governance. Supports SSE sessions.',
    endpoints: {
      'GET /': 'Server info and documentation',
      'GET /docs': 'This documentation',
      'GET /health': 'Health check',
      'GET /tools': 'List available MCP tools',
      'GET /sse': 'SSE streaming endpoint (creates session, subscribes to pub/sub)',
      'POST /': 'JSON-RPC endpoint for MCP Streamable HTTP transport',
      'POST /messages?sessionId=': 'Send JSON-RPC messages to an SSE session',
    },
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
    sessions: { count: sessions.size, active: activeSessions.size },
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok', time: Date.now(), sessions: sessions.size, activeSSE: activeSessions.size })
})

app.get('/tools', (c) => {
  return c.json({ tools: TOOLS, count: TOOLS.length })
})

// ===== POST / — Direct JSON-RPC (Streamable HTTP) =====
app.post('/', async (c) => {
  try {
    const msg = await c.req.json()
    const { id } = msg

    // Notification (no id) → 202
    if (id === undefined || id === null) {
      c.status(202)
      return c.body(null)
    }

    const sessionId = createSession()
    const result = await handleMCPMessage(sessionId, msg)
    if (result) return c.json(result)

    return c.json(mcpError(id, -32603, 'Handler produced no result'))
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    c.status(400)
    return c.json({ jsonrpc: '2.0', error: { code: -32700, message: msg } })
  }
})

export default app
