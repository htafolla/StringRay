# OpenClaw Integration - Full Implementation Guide

**Date:** 2026-03-23  
**Status:** ✅ Implemented  
**Type:** Runtime Integration (WebSocket + HTTP API)  
**Version:** 1.0.0  

---

## Overview

OpenClaw is a self-hosted AI gateway that connects messaging platforms (WhatsApp, Telegram, Discord, Slack, iMessage) to AI coding agents. The StringRay integration connects to OpenClaw via WebSocket and exposes an HTTP API server for skills to invoke StringRay capabilities.

---

## What It Is

| Aspect | Description |
|--------|-------------|
| **Type** | Runtime integration (active connection) |
| **Connection** | WebSocket to OpenClaw Gateway (ws://127.0.0.1:18789) |
| **API Server** | HTTP server on port 18431 |
| **Protocol** | OpenClaw Gateway Protocol v3 |
| **Channels** | WhatsApp, Telegram, Discord, Slack, iMessage, SMS, Email |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OPENCLAW INTEGRATION ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │   User       │────▶│  OpenClaw    │────▶│   StringRay   │
   │  (WhatsApp,  │     │   Gateway    │     │    Skills    │
   │  Discord,    │     │              │     │              │
   │  Telegram)   │◀────│              │◀────│              │
   └──────────────┘     └──────────────┘     └──────────────┘
                            │                        ▲
                            │                        │
                            ▼                        │
                    ┌──────────────┐                │
                    │  WebSocket   │                │
                    │   Client     │                │
                    └──────────────┘                │
                            │                        │
                            ▼                        │
                    ┌──────────────────────────────────┐
                    │       Tool Hooks                │
                    │   (tool.before / tool.after)    │
                    └──────────────────────────────────┘
```

---

## Components

### 1. WebSocket Client (`src/integrations/openclaw/client.ts`)

Manages connection to OpenClaw Gateway:
- WebSocket connection with protocol v3 handshake
- Request/response handling via unique IDs
- Auto-reconnection with exponential backoff
- State management (disconnected → connecting → connected → authorized)

### 2. Configuration Loader (`src/integrations/openclaw/config.ts`)

Loads and validates configuration:
- JSON config file at `.opencode/openclaw/config.json`
- Environment variable overrides
- Schema validation with helpful error messages

### 3. HTTP API Server (`src/integrations/openclaw/api-server.ts`)

Exposes StringRay capabilities to OpenClaw skills:
- `GET /health` - Health check
- `POST /api/agent/invoke` - Invoke agent commands
- `GET /api/agent/status` - Agent status

### 4. Tool Hooks (`src/integrations/openclaw/hooks/strray-hooks.ts`)

Captures and forwards StringRay tool events:
- `tool.before` - Before tool execution
- `tool.after` - After tool execution
- Includes arguments, results, duration, timestamps

---

## Integration Points in StringRay

### Base Integration Class

Extends `BaseIntegration` for lifecycle management:

```typescript
// src/integrations/openclaw/index.ts
export class OpenClawIntegration extends BaseIntegration {
  // Components
  private configLoader: OpenClawConfigLoader;
  private client: OpenClawClient | null = null;
  private apiServer: StringRayAPIServer | null = null;
  private hooksManager: OpenClawHooksManager | null = null;
  
  // Lifecycle
  protected async performInitialization(): Promise<void> { ... }
  protected async performShutdown(): Promise<void> { ... }
  protected async performHealthCheck(): Promise<HealthResult> { ... }
}
```

### MCP Integration

Hooks into MCP client for tool events:

```typescript
// Wire hooks to MCPClient tool events
this.mcpToolBeforeUnsubscribe = await mcpClientManager.onToolEvent('tool.before', async (event) => {
  await this.hooksManager!.onToolBefore({ ... });
});

this.mcpToolAfterUnsubscribe = await mcpClientManager.onToolEvent('tool.after', async (event) => {
  await this.hooksManager!.onToolAfter({ ... });
});
```

---

## How to Use

### 1. Install Dependencies

```bash
npm install ws
```

### 2. Configure OpenClaw

Create `.opencode/openclaw/config.json`:

```json
{
  "gatewayUrl": "ws://127.0.0.1:18789",
  "authToken": "your-auth-token",
  "deviceId": "your-device-id",
  "apiServer": {
    "enabled": true,
    "port": 18431,
    "host": "127.0.0.1",
    "apiKey": "your-api-key"
  },
  "hooks": {
    "enabled": true
  },
  "enabled": true
}
```

### 3. Initialize Integration

```typescript
import { initializeOpenClawIntegration } from './src/integrations/openclaw/index.js';

const integration = await initializeOpenClawIntegration();

// Or with custom agent invoker
const integration = await initializeOpenClawIntegration('/path/to/config.json', myAgentInvoker);
```

### 4. Using Commands

After installation, use these commands in any OpenClaw channel:

| Command | Description |
|---------|-------------|
| `/strray` | Show status |
| `/strray-analyze <file>` | Analyze code |
| `/strray-code <file>` | Code review |
| `/strray-file <file>` | Read file |
| `/strray-exec <command>` | Execute command |

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gatewayUrl` | string | `ws://127.0.0.1:18789` | OpenClaw WebSocket URL |
| `authToken` | string | - | Authentication token |
| `deviceId` | string | - | Device ID for pairing |
| `apiServer.enabled` | boolean | `true` | Enable HTTP API server |
| `apiServer.port` | number | `18431` | API server port |
| `apiServer.host` | string | `127.0.0.1` | API server host |
| `apiServer.apiKey` | string | - | API key for auth |
| `hooks.enabled` | boolean | `true` | Enable tool hooks |
| `autoReconnect` | boolean | `true` | Auto reconnect |
| `enabled` | boolean | `true` | Enable integration |

### Environment Variable Overrides

| Variable | Config Path |
|----------|-------------|
| `OPENCLAW_GATEWAY_URL` | gatewayUrl |
| `OPENCLAW_AUTH_TOKEN` | authToken |
| `OPENCLAW_DEVICE_ID` | deviceId |
| `OPENCLAW_API_KEY` | apiServer.apiKey |
| `OPENCLAW_API_PORT` | apiServer.port |
| `OPENCLAW_ENABLED` | enabled |

---

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.15.18",
  "uptime": 3600000,
  "openclaw": {
    "connected": true,
    "state": "authorized"
  }
}
```

### POST /api/agent/invoke

Invoke an agent command.

**Request:**
```json
{
  "command": "analyze",
  "args": { "file": "src/index.ts" },
  "sessionId": "optional-session-id",
  "agent": "code-reviewer",
  "timeout": 30000
}
```

**Response:**
```json
{
  "success": true,
  "result": { ... },
  "sessionId": "...",
  "executionTime": 1500
}
```

### GET /api/agent/status

Get agent status.

**Response:**
```json
{
  "status": "ready",
  "activeSessions": 2,
  "availableAgents": 26
}
```

---

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `ws` | ^8.0.0 | WebSocket client |
| (built-in) | - | EventEmitter for events |

---

## Error Handling

### Error Codes

| Code | Description | Recoverable |
|------|-------------|-------------|
| `CONNECTION_FAILED` | Cannot connect to Gateway | Yes |
| `AUTH_FAILED` | Authentication failed | No |
| `REQUEST_TIMEOUT` | Request timed out | Yes |
| `SERVER_ERROR` | Server error | Yes |

### Error Classes

- `OpenClawError` - Base error class
- `OpenClawConnectionError` - Connection failures
- `OpenClawAuthError` - Authentication failures
- `OpenClawTimeoutError` - Request timeouts
- `OpenClawConfigError` - Configuration errors

---

## Related Files

| File | Purpose |
|------|---------|
| `src/integrations/openclaw/index.ts` | Main integration module |
| `src/integrations/openclaw/types.ts` | TypeScript types |
| `src/integrations/openclaw/config.ts` | Configuration loader |
| `src/integrations/openclaw/client.ts` | WebSocket client |
| `src/integrations/openclaw/api-server.ts` | HTTP API server |
| `src/integrations/openclaw/hooks/strray-hooks.ts` | Tool hooks |
| `docs/research/openclaw/researcher-summary.md` | Research documentation |
| `docs/research/openclaw/architect-summary.md` | Architecture documentation |

---

## Security Considerations

1. **Localhost Only** - API server binds to 127.0.0.1 by default
2. **API Keys** - Optional API key for HTTP endpoint authentication
3. **Device Tokens** - Store securely, never log
4. **Scope-Based** - Limit permissions to required operations

---

**Status:** ✅ Implemented - Full runtime integration with WebSocket, API server, and tool hooks