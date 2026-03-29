# OpenClaw Integration - Research Summary

**Date:** 2026-03-23 (Updated)  
**Researcher:** StringRay Research Agent  
**Status:** ✅ Implemented  

---

## Executive Summary

**OpenClaw** is a **self-hosted AI gateway** that connects messaging platforms (WhatsApp, Telegram, Discord, Slack, iMessage, SMS, Email) to AI coding agents.

StringRay's integration consists of:
1. **WebSocket Client** - Connects to OpenClaw Gateway at ws://127.0.0.1:18789
2. **HTTP API Server** - Exposes StringRay capabilities on port 18431
3. **Tool Hooks** - Captures and forwards tool execution events

This is a **runtime integration** (active connection), unlike the Antigravity skills which are a static library.

---

## Implementation Status

| Component | Status | File |
|-----------|--------|------|
| WebSocket Client | ✅ Implemented | `src/integrations/openclaw/client.ts` |
| Configuration Loader | ✅ Implemented | `src/integrations/openclaw/config.ts` |
| TypeScript Types | ✅ Implemented | `src/integrations/openclaw/types.ts` |
| HTTP API Server | ✅ Implemented | `src/integrations/openclaw/api-server.ts` |
| Tool Hooks | ✅ Implemented | `src/integrations/openclaw/hooks/strray-hooks.ts` |
| Main Integration | ✅ Implemented | `src/integrations/openclaw/index.ts` |
| Tests | ✅ Implemented | `src/integrations/openclaw/*.test.ts` |

---

## Integration Architecture

```
User (WhatsApp/Telegram/Discord)
    │
    ▼
OpenClaw Gateway
    │
    ▼
Skill: stringray-orchestrator
    │
    │ HTTP POST to localhost:18431/api/agent/invoke
    ▼
StringRay HTTP API Server (port 18431)
    │
    ├── POST /health
    ├── POST /api/agent/invoke
    └── GET /api/agent/status
    │
    ▼
StringRay Orchestrator
    │
    ▼
Tool Hooks (tool.before / tool.after)
    │
    ▼
OpenClaw Gateway (real-time updates)
    │
    ▼
User (via messaging app)
```

---

## How It Works

### 1. WebSocket Connection

The client connects to OpenClaw Gateway using Protocol v3:

```typescript
// Handshake
{
  "minProtocol": 3,
  "maxProtocol": 3,
  "client": {
    "id": "strray-integration",
    "version": "1.15.18",
    "platform": "node",
    "mode": "operator"
  },
  "role": "operator",
  "scopes": ["operator.read", "operator.write"],
  "auth": {
    "token": "device-token"
  }
}
```

### 2. HTTP API Server

Skills invoke StringRay via HTTP:

```javascript
// In OpenClaw skill
const response = await fetch('http://localhost:18431/api/agent/invoke', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: 'analyze',
    args: { file: 'src/index.ts' }
  })
});
const result = await response.json();
```

### 3. Tool Hooks

StringRay forwards tool events to OpenClaw:

```typescript
// Subscribed to MCP client events
mcpClientManager.onToolEvent('tool.before', (event) => {
  hooksManager.onToolBefore({ ... });
});

mcpClientManager.onToolEvent('tool.after', (event) => {
  hooksManager.onToolAfter({ ... });
});
```

---

## Authentication

### Obtaining Device Tokens

**Option 1: QR Code Pairing (Recommended)**
```bash
openclaw device pair --name "StringRay Integration"
# Scan QR with mobile app
openclaw device list
```

**Option 2: CLI Token Generation**
```bash
openclaw device create \
  --name "StringRay Production" \
  --type server \
  --scopes "operator.read,operator.write,events.subscribe"
```

**Option 3: Environment Variables**
```bash
export OPENCLAW_DEVICE_ID=strray-dev-xxxxx
export OPENCLAW_DEVICE_TOKEN=oc_dev_xxxxxxxxxxxxxxxxxxxxx
```

---

## Configuration

```json
{
  "gatewayUrl": "ws://127.0.0.1:18789",
  "authToken": "your-auth-token",
  "deviceId": "your-device-id",
  "autoReconnect": true,
  "maxReconnectAttempts": 5,
  "reconnectDelay": 1000,
  "apiServer": {
    "enabled": true,
    "port": 18431,
    "host": "127.0.0.1",
    "apiKey": "optional-api-key"
  },
  "hooks": {
    "enabled": true,
    "toolBefore": true,
    "toolAfter": true,
    "includeArgs": true,
    "includeResult": true
  },
  "enabled": true,
  "debug": false,
  "logLevel": "info"
}
```

---

## Available Commands

After installing skills in OpenClaw:

| Command | Description |
|---------|-------------|
| `/strray` | Show StringRay status |
| `/strray-analyze <file>` | Analyze code file |
| `/strray-code <file>` | Code review |
| `/strray-file <file>` | Read file contents |
| `/strray-exec <command>` | Execute command |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/agent/invoke` | POST | Invoke agent command |
| `/api/agent/status` | GET | Agent status |

---

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `ws` | ^8.0.0 | WebSocket client for OpenClaw Gateway |

---

## Error Handling

The integration handles:
- Connection failures with auto-reconnect
- Authentication errors with clear messages
- Request timeouts (30s default)
- Configuration validation with helpful errors

Error codes include:
- `CONNECTION_FAILED` - Cannot reach Gateway
- `AUTH_FAILED` - Invalid device token
- `REQUEST_TIMEOUT` - Request took too long
- `CONFIG_INVALID` - Configuration errors

---

## Security

- **Localhost binding** - API server binds to 127.0.0.1 by default
- **API key optional** - Can secure HTTP endpoint
- **Device tokens** - Should be stored securely, never logged
- **Scope-based** - Permissions limited to required operations

---

## Differences from Antigravity

| Aspect | Antigravity | OpenClaw |
|--------|-------------|----------|
| **Type** | Skills library (static) | Runtime integration (active) |
| **Connection** | None (skill files only) | WebSocket + HTTP |
| **Skills** | 22 curated skills | Custom stringray-orchestrator |
| **Usage** | Via skill router | Via messaging apps |
| **Real-time** | No | Yes (tool events) |

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `docs/research/openclaw/README.md` | Full implementation guide |
| `docs/research/openclaw/architect-summary.md` | Architecture details |
| `src/integrations/openclaw/README.md` | Code documentation |

---

## Next Steps

1. ✅ Integration implemented
2. ⏳ Test with live OpenClaw instance
3. ⏳ Install skills in OpenClaw directory
4. ⏳ Configure device authentication
5. ⏳ Test command invocation via messaging app

---

**Status:** ✅ Implemented and documented

*Updated: 2026-03-23 with implementation status*