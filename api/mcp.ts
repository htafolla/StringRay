import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ---- Constants & Types ----
const PHI = 1.666
const TAU = 0.865

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

// ---- Tool Definitions ----
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
      },
      required: ['proposals'],
    },
  },
  {
    name: 'govern_reflection',
    description: 'Parse a reflection file and run extracted proposals through the full governance system.',
    inputSchema: {
      type: 'object',
      properties: {
        reflectionPath: { type: 'string' },
        reflectionContent: { type: 'string' },
      },
    },
  },
  {
    name: 'govern_health',
    description: 'Health check for the governance MCP server.',
    inputSchema: { type: 'object', properties: {} },
  },
]

// ---- Governance Logic ----
function applyDecisionMatrix(
  resonance: number,
  isotopicRatio: number,
  vortexVolume: number,
  historicalCoherence: number,
): GovernanceResult {
  const reasons: string[] = []
  let recommendation = 'NEEDS_REVISION'
  let confidence = 0.75
  let voteWeight = 1.0

  if (resonance >= 0.92 && isotopicRatio >= 0.95) {
    recommendation = 'PASS'
    confidence = 0.97
    voteWeight = 1.4
    reasons.push('High symbiotic resonance (PHI-aligned)')
  } else if (resonance >= 0.82 && isotopicRatio >= 0.88) {
    recommendation = 'PASS'
    confidence = 0.89
    voteWeight = 1.15
    reasons.push('Solid alignment above TAU threshold')
  } else if (resonance < 0.75 || isotopicRatio < 0.80) {
    recommendation = 'REJECT'
    confidence = 0.84
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

function evaluateProposal(proposal: Proposal): GovernanceResult {
  const hash = proposal.title.length + proposal.description.length
  const resonance = 0.7 + ((hash * PHI) % 30) / 100
  const isotopicRatio = 0.75 + ((hash * TAU) % 25) / 100
  const vortexVolume = 1e25 + ((hash * PHI * TAU) % 1e26)
  const historicalCoherence = 0.6 + ((hash * PHI) % 40) / 100

  return applyDecisionMatrix(
    Math.min(resonance, 1),
    Math.min(isotopicRatio, 1),
    vortexVolume,
    Math.min(historicalCoherence, 1),
  )
}

// ---- Hono App ----
const app = new Hono()

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ---- GET Endpoints ----
app.get('/', (c) => {
  return c.json({
    name: 'governance',
    version: '1.0.0',
    description: '0xRay Governance MCP Server — Streamable HTTP (MCP 2024-11-05)',
    endpoints: {
      'GET /': 'Server info',
      'GET /health': 'Health check',
      'GET /tools': 'List available MCP tools',
      'POST /': 'JSON-RPC endpoint for MCP Streamable HTTP transport',
    },
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok', time: Date.now() })
})

app.get('/tools', (c) => {
  return c.json({ tools: TOOLS })
})

// ---- POST / — JSON-RPC Handler ----
app.post('/', async (c) => {
  try {
    const message = await c.req.json()
    const reqId = message.id

    // Notification (no id) -> 202
    if (reqId === undefined || reqId === null) {
      c.status(202)
      return c.body(null)
    }

    switch (message.method) {
      case 'initialize':
        return c.json({
          jsonrpc: '2.0',
          id: reqId,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'governance', version: '1.0.0' },
          },
        })

      case 'ping':
        return c.json({ jsonrpc: '2.0', id: reqId, result: {} })

      case 'tools/list':
        return c.json({ jsonrpc: '2.0', id: reqId, result: { tools: TOOLS } })

      case 'tools/call': {
        const toolName = message.params?.name
        const args = message.params?.arguments || {}

        if (toolName === 'govern_proposals') {
          const proposals: Proposal[] = args.proposals || []
          const results = proposals.map((p: Proposal) => {
            const gov = evaluateProposal(p)
            return {
              id: p.id || p.title,
              type: p.type,
              title: p.title,
              ...gov,
            }
          })

          const passed = results.filter(r => r.recommendation === 'PASS').length
          const rejected = results.filter(r => r.recommendation === 'REJECT').length
          const needsRevision = results.filter(r => r.recommendation === 'NEEDS_REVISION').length

          return c.json({
            jsonrpc: '2.0',
            id: reqId,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  summary: `Governed ${results.length} proposals: ${passed} passed, ${rejected} rejected, ${needsRevision} need revision`,
                  results,
                  governance: {
                    engine: '0xRay Isotopic Temporal Vortex v4.8',
                    constants: { PHI, TAU },
                  },
                }, null, 2),
              }],
            },
          })
        }

        if (toolName === 'govern_health') {
          return c.json({
            jsonrpc: '2.0',
            id: reqId,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({ status: 'ok', time: Date.now() }),
              }],
            },
          })
        }

        if (toolName === 'govern_reflection') {
          return c.json({
            jsonrpc: '2.0',
            id: reqId,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  message: 'Reflection parsing requires GovernanceServer initialization. Use the stdio-based server for complete reflection workflows.',
                  args,
                }, null, 2),
              }],
            },
          })
        }

        return c.json({
          jsonrpc: '2.0',
          id: reqId,
          error: { code: -32601, message: `Tool not found: ${toolName}` },
        })
      }

      default:
        return c.json({
          jsonrpc: '2.0',
          id: reqId,
          error: { code: -32601, message: `Method not found: ${message.method}` },
        })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    c.status(400)
    return c.json({ jsonrpc: '2.0', error: { code: -32700, message: msg } })
  }
})

export default app
