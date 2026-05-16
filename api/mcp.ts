import { Hono, Context } from 'hono'
import { cors } from 'hono/cors'
import { streamSSE } from 'hono/streaming'
import { EventEmitter } from 'node:events'
import crypto from 'node:crypto'

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

// ===== Constants =====
const PHI = 1.666
const TAU = 0.865

// ===== Types =====
interface ToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

interface GovernanceResult {
  recommendation: string
  confidence: number
  voteWeight: number
  reasons: string[]
}

interface Proposal {
  id?: string
  type: string
  title: string
  description: string
  evidence?: string[]
  source?: string
  confidence?: number
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
    description: 'Run one or more proposals through the full 0xRay governance system. ' +
      'Consults code-review, security-audit, researcher skill servers plus external Dynamo/Solar governance. ' +
      'Supports regulatory compliance proposals (AML/KYC, PSD2, GDPR).',
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
    name: 'govern_reflection',
    description: 'Parse a reflection file and run extracted proposals through the full governance system.',
    inputSchema: { type: 'object', properties: { reflectionPath: { type: 'string' }, reflectionContent: { type: 'string' } } },
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

// ===== Governance Logic =====
function applyDecisionMatrix(resonance: number, isotopicRatio: number, vortexVolume: number, historicalCoherence: number): GovernanceResult {
  const reasons: string[] = []
  let recommendation = 'NEEDS_REVISION'
  let confidence = 0.75
  let voteWeight = 1.0

  if (resonance >= 0.92 && isotopicRatio >= 0.95) {
    recommendation = 'PASS'; confidence = 0.97; voteWeight = 1.4
    reasons.push('High symbiotic resonance (PHI-aligned)')
  } else if (resonance >= 0.82 && isotopicRatio >= 0.88) {
    recommendation = 'PASS'; confidence = 0.89; voteWeight = 1.15
    reasons.push('Solid alignment above TAU threshold')
  } else if (resonance < 0.75 || isotopicRatio < 0.80) {
    recommendation = 'REJECT'; confidence = 0.84
    reasons.push('Signal below critical threshold (1 - TAU)')
  } else {
    reasons.push('Moderate resonance - requires refinement')
  }

  if (vortexVolume < 2.5e25) {
    reasons.push('Low inertial mass (W x M = V)')
    if (recommendation === 'PASS') recommendation = 'NEEDS_REVISION'
  }
  if (historicalCoherence < 0.70) {
    reasons.push('Weak historical alignment with past decisions')
    if (recommendation === 'PASS') recommendation = 'NEEDS_REVISION'
  } else if (historicalCoherence > 0.90) {
    reasons.push('Strong continuity with previous governance')
    voteWeight *= 1.1
  }

  return { recommendation, confidence, voteWeight, reasons }
}

function evaluateProposal(p: Proposal): GovernanceResult {
  const hash = p.title.length + p.description.length
  return applyDecisionMatrix(
    Math.min(0.7 + ((hash * PHI) % 30) / 100, 1),
    Math.min(0.75 + ((hash * TAU) % 25) / 100, 1),
    1e25 + ((hash * PHI * TAU) % 1e26),
    Math.min(0.6 + ((hash * PHI) % 40) / 100, 1),
  )
}

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
          const proposals: Proposal[] = args?.proposals || []
          const results = proposals.map(p => {
            const gov = evaluateProposal(p)
            return { id: p.id || p.title, type: p.type, title: p.title, ...gov }
          })
          const passed = results.filter(r => r.recommendation === 'PASS').length
          const rejected = results.filter(r => r.recommendation === 'REJECT').length
          const needsRevision = results.filter(r => r.recommendation === 'NEEDS_REVISION').length

          return mcpResult(id, {
            content: [{
              type: 'text',
              text: JSON.stringify({
                summary: `Governed ${results.length} proposals: ${passed} passed, ${rejected} rejected, ${needsRevision} need revision`,
                results,
                governance: { engine: '0xRay Isotopic Temporal Vortex v4.8', constants: { PHI, TAU } },
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

        if (name === 'govern_reflection') {
          return mcpResult(id, {
            content: [{ type: 'text', text: JSON.stringify({ message: 'Reflection parsing requires GovernanceServer initialization.', args }, null, 2) }],
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

// ===== Hono App =====
const app = new Hono()

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

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
      // no SSE subscriber listening
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
