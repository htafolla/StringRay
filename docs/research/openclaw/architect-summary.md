# OpenClaw Integration Architecture Summary

**Date:** 2026-03-14 (Updated: 2026-03-15)
**Architect:** StringRay Architect Agent
**Status:** ✅ Updated Based on Review Feedback
**Based on:** Researcher findings + Refactorer code review

---

## 1. Executive Summary

This document outlines the architectural design for integrating StringRay with OpenClaw. Based on comprehensive research, we've determined that **OpenClaw is a self-hosted AI gateway** - not a cloud API service.

### Recommended Approach: Skill-Based Integration

The integration will allow:
- StringRay agents to be invoked from OpenClaw channels (WhatsApp, Telegram, Discord, etc.)
- OpenClaw skills to expose StringRay capabilities to users
- Bidirectional communication between StringRay and OpenClaw

### How OpenClaw Skills Invoke StringRay (CRITICAL)

**The invocation mechanism:** StringRay exposes a local HTTP API server that OpenClaw skills call directly.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        INVOCATION MECHANISM                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

  OpenClaw Skill (index.mjs)                    StringRay Server
  ─────────────────────────                     ────────────────
         │                                              │
         │  fetch('http://localhost:18431/api/          │
         │       { method: 'POST',                       │
         │         body: JSON.stringify({                │
         │           command: 'analyze',                │
         │           args: { file: 'src/index.ts' }     │
         │       })                                      │
         │ ──────────────────────────────────────────▶   │
         │                                              │
         │                                              ▼
         │                                       ┌─────────────┐
         │                                       │ HTTP Server │
         │                                       │ (Express)   │
         │                                       └─────────────┘
         │                                              │
         │  ◀────────────────────────────────────────────│
         │         { result: { issues: [...],           │
         │              metrics: {...} } }             │
         │                                              │
```

**Why HTTP?**
- OpenClaw skills natively support HTTP requests (fetch, curl)
- Works across process boundaries
- Simple to implement and debug
- Stateless and scalable

---

## 2. Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         StringRay Framework                         │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │              StringRay Orchestrator                  │    │
│  │                                                        │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │    │
│  │  │ Agent A  │  │  Agent B  │  │  Agent C  │    │    │
│  │  └────────────┘  └────────────┘  └────────────┘    │    │
│  │                                                        │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────┬───────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│              StringRay HTTP API Server                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │          API Endpoints                                  │    │
│  │  POST /api/agent/invoke     - Invoke agent with command        │    │
│  │  POST /api/tools/execute    - Execute specific tool            │    │
│  │  GET  /api/status           - Health check                     │    │
│  │  WS   /ws/events            - Event stream                     │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │          Tool Hooks (tool.before/tool.after)             │    │
│  │                                                        │    │
│  │  Captures tool invocations from all agents              │    │
│  │  Translates to OpenClaw events                    │    │
│  │  Sends via WebSocket to OpenClaw Gateway            │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│             OpenClaw Integration Module                  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │          WebSocket Client                              │    │
│  │  - Connects to ws://127.0.0.1:18789           │    │
│  │  - Implements handshake & auth                    │    │
│  │  - Sends frames (req/res/event)               │    │
│  │  - Handles reconnection                           │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │          OpenClaw Skills (in ~/.openclaw/skills/)     │    │
│  │  - stringray-orchestrator                           │    │
│  │  - stringray-tools                                  │    │
│  │  - Each contains: SKILL.md + index.mjs handler       │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│              OpenClaw Gateway (External)                     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │          Pi Agent (AI Runtime)                     │    │
│  │  - Processes user requests                         │    │
│  │  - Loads skills including StringRay skills             │    │
│  │  - Executes skills as tools                      │    │
│  │  - Manages sessions & channels                   │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │          WebSocket Control Plane                    │    │
│  │  - Accepts operator connections                │    │
│  │  - Broadcasts events (agent, presence, tick)    │    │
│  │  - Manages device pairing                    │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│              Messaging Channels                                 │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐    │
│  │  WhatsApp  │  │  Telegram   │  │  Discord    │  │  Slack     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐    │
│  │  iMessage  │  │     SMS     │  │    Email    │  │  Custom   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EVENT FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────────┘

1. USER SENDS MESSAGE
   ┌─────────────┐
   │  WhatsApp   │  "Use StringRay to analyze src/index.ts"
   └──────┬──────┘
          │
          ▼
2. MESSAGE ROUTES THROUGH OPENCLAW GATEWAY
   ┌─────────────────────────────────────────────────────────────────┐
   │              OpenClaw Gateway (ws://127.0.0.1:18789)           │
   │                                                                 │
   │  ┌───────────────────────────────────────────────────────────┐  │
   │  │              WebSocket Frames (req/res/event)            │  │
   │  └───────────────────────────────────────────────────────────┘  │
   └─────────────────────────────────────────────────────────────────┘
          │
          ▼
3. PI AGENT PROCESSES REQUEST
   ┌─────────────────────────────────────────────────────────────────┐
   │                      Pi Agent                                   │
   │                                                                 │
   │  - Receives message from channel                               │
   │  - Detects "/strray" command                                   │
   │  - Loads stringray-orchestrator skill                          │
   │  - Processes command                                           │
   └─────────────────────────────────────────────────────────────────┘
          │
          ▼
4. SKILL INVOKES STRINGRAY HTTP API
   ┌─────────────────────────────────────────────────────────────────┐
   │           StringRay Orchestrator Skill                          │
   │                                                                 │
   │  - Parses command: "/strray-code src/index.ts"                │
   │  - Calls: fetch('http://localhost:18431/api/agent/invoke',   │
   │           { method: 'POST', body: {...} })                    │
   │  - Returns results                                             │
   └─────────────────────────────────────────────────────────────────┘
          │
          ▼
5. STRINGRAY EXECUTES OPERATION
   ┌─────────────────────────────────────────────────────────────────┐
   │                   StringRay Framework                          │
   │                                                                 │
   │  ┌─────────────────────────────────────────────────────────┐  │
   │  │ Tool Hook (tool.before)                                 │  │
   │  └─────────────────────────────────────────────────────────┘  │
   │          │                                                     │
   │          ▼                                                     │
   │  ┌─────────────────────────────────────────────────────────┐  │
   │  │ Code Analysis Tool                                      │  │
   │  │ - Reads file                                            │  │
   │  │ - Analyzes code                                        │  │
   │  │ - Returns results                                      │  │
   │  └─────────────────────────────────────────────────────────┘  │
   │          │                                                     │
   │          ▼                                                     │
   │  ┌─────────────────────────────────────────────────────────┐  │
   │  │ Tool Hook (tool.after) - Event sent to OpenClaw       │  │
   │  └─────────────────────────────────────────────────────────┘  │
   └─────────────────────────────────────────────────────────────────┘
          │
          ▼
6. RESULT RETURNS TO USER
   ┌─────────────────────────────────────────────────────────────────┐
   │              OpenClaw Gateway                                   │
   │                                                                 │
   │  - Formats response                                            │
   │  - Routes to original channel                                  │
   └─────────────────────────────────────────────────────────────────┘
          │
          ▼
   ┌─────────────┐
   │  WhatsApp   │  "Analysis complete: 3 issues found..."
   └─────────────┘
```

---

## 3. Authentication Flow (How to Get Device Tokens)

### Overview

OpenClaw uses device-based authentication. The integration requires:

1. **Device ID** - A unique identifier for the integration
2. **Device Token** - Obtained through the pairing process
3. **Scopes** - Permission levels (operator.read, operator.write)

### How to Obtain Device Tokens

#### Option 1: QR Code Pairing (Recommended for Development)

```bash
# 1. Start OpenClaw Gateway
openclaw gateway start

# 2. Generate pairing QR code (from OpenClaw dashboard or CLI)
openclaw device pair --name "StringRay Integration"

# 3. Scan QR code with OpenClaw mobile app
#    This associates the device and generates a token

# 4. Retrieve the device token
openclaw device list
# Output:
# DEVICE ID           | NAME                    | TOKEN
# strray-integration  | StringRay Integration  | oc_dev_xxxxx...
```

#### Option 2: Manual Token Generation (Production)

```bash
# For server-to-server integrations
openclaw device create \
  --name "StringRay Production" \
  --type server \
  --scopes "operator.read,operator.write,events.subscribe"

# Output:
# {
#   "deviceId": "strray-prod-xxxxx",
#   "deviceToken": "oc_dev_xxxxxxxxxxxxxxxxxxxxx",
#   "expiresAt": "2027-03-15T00:00:00Z"
# }
```

#### Option 3: Environment-Based (Development)

```bash
# Set in ~/.openclaw/env (or via CLI)
OPENCLAW_DEVICE_ID=strray-dev-xxxxx
OPENCLAW_DEVICE_TOKEN=oc_dev_xxxxxxxxxxxxxxxxxxxxx
```

### Token Refresh Strategy

```typescript
// tokens expire and must be refreshed
interface TokenManager {
  async refreshToken(): Promise<DeviceToken>;
  
  async isTokenExpired(): Promise<boolean>;
  
  // Automatic refresh before expiry
  scheduleRefresh(beforeExpiryMs: number): void;
}
```

---

## 4. State Management

### Connection States

```typescript
type ConnectionState = 
  | 'disconnected'      // Initial state, no connection attempt
  | 'connecting'       // WebSocket handshake in progress
  | 'authenticating'   // Waiting for auth response
  | 'connected'        // Fully authenticated and ready
  | 'reconnecting'     // Attempting to restore connection
  | 'failed';          // Permanent failure, needs intervention
```

### State Machine

```
                    ┌──────────────┐
                    │ disconnected │
                    └──────┬───────┘
                           │ connect()
                           ▼
                    ┌──────────────┐
         ┌──────────│  connecting  │──────────┐
         │          └──────┬───────┘          │
         │                 │                   │
         │ auth success    │ auth failure     │ connection error
         ▼                 ▼                   ▼
  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐
  │authenticated│  │  failed    │  │   reconnecting   │
  └──────┬──────┘  └────────────┘  └────────┬─────────┘
         │                                    │
         │         reconnect success         │
         │         reconnect failure         │
         ▼                                    ▼
  ┌─────────────┐                    ┌─────────────┐
  │  connected   │◀───────────────────│  failed     │
  └─────────────┘                    └─────────────┘
         │
         │ disconnect()
         ▼
  ┌─────────────┐
  │ disconnected│
  └─────────────┘
```

### Reconnection Strategy

```typescript
interface ReconnectionConfig {
  maxRetries: number;          // Maximum reconnection attempts (default: 5)
  initialDelayMs: number;      // First retry delay (default: 1000)
  maxDelayMs: number;         // Maximum delay cap (default: 30000)
  backoffMultiplier: number;  // Exponential backoff (default: 2)
  jitter: number;             // Random jitter factor (default: 0.1)
}

// Example delays with default config:
// Retry 1: 1000ms + random(0-100)
// Retry 2: 2000ms + random(0-200)
// Retry 3: 4000ms + random(0-400)
// Retry 4: 8000ms + random(0-800)
// Retry 5: 16000ms + random(0-1600)
```

---

## 5. Error Handling Strategy

### Error Categories

```typescript
enum ErrorCategory {
  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  
  // Protocol errors
  INVALID_FRAME = 'INVALID_FRAME',
  UNKNOWN_METHOD = 'UNKNOWN_METHOD',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  
  // Runtime errors
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  REQUEST_FAILED = 'REQUEST_FAILED',
  
  // State errors
  NOT_CONNECTED = 'NOT_CONNECTED',
  ALREADY_CONNECTED = 'ALREADY_CONNECTED',
}
```

### Error Handling Layers

```typescript
// Layer 1: Connection-level errors
// - Automatic reconnection for transient failures
// - Clear error messages for permanent failures

// Layer 2: Request-level errors  
// - Automatic retry with exponential backoff
// - Timeout handling (default: 30s)

// Layer 3: Frame-level errors
// - Try/catch around message parsing
// - Graceful degradation on malformed frames

// Layer 4: Application-level errors
// - Skill errors returned to caller
// - Tool errors logged and reported
```

### Error Response Format

```typescript
interface OpenClawError {
  code: ErrorCategory;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  timestamp: number;
}
```

---

## 6. Implementation Roadmap

### Phase 1: Research Validation ✅
**Goal:** Verify researcher findings

- [x] Review OpenClaw documentation
- [x] Understand Gateway protocol v3
- [x] Analyze AgentSkills format
- [x] Study existing skill examples
- [x] Define integration approach
- [x] **Define invocation mechanism (HTTP API)**

### Phase 2: Foundation (Week 1)
**Goal:** Core infrastructure for OpenClaw connectivity

| Task | Description | Deliverables |
|------|-------------|--------------|
| 2.1 | WebSocket client for OpenClaw Gateway | `src/integrations/openclaw/client.ts` |
| 2.2 | Configuration loader | `src/integrations/openclaw/config.ts` |
| 2.3 | Core type definitions | `src/integrations/openclaw/types.ts` |
| 2.4 | Error classes | `src/integrations/openclaw/errors.ts` |
| 2.5 | State management | `src/integrations/openclaw/state.ts` |
| 2.6 | Token/auth management | `src/integrations/openclaw/auth.ts` |

**Success Criteria:**
- ✅ Can connect to OpenClaw Gateway with auth
- ✅ Sends and receives frames correctly
- ✅ Handles disconnections gracefully
- ✅ Configuration validation works

### Phase 3: HTTP API Server (Week 2)
**Goal:** Expose StringRay capabilities via HTTP

| Task | Description | Deliverables |
|------|-------------|--------------|
| 3.1 | HTTP API server | `src/integrations/openclaw/api/server.ts` |
| 3.2 | Agent invoke endpoint | `POST /api/agent/invoke` |
| 3.3 | Tool execute endpoint | `POST /api/tools/execute` |
| 3.4 | Status/health endpoint | `GET /api/status` |
| 3.5 | WebSocket event stream | `WS /ws/events` |

**Success Criteria:**
- ✅ HTTP server starts on configured port
- ✅ Skills can invoke agent commands
- ✅ Tool execution returns results
- ✅ Health checks work

### Phase 4: Skill Development (Week 3)
**Goal:** Create OpenClaw skills for StringRay agents

| Task | Description | Deliverables |
|------|-------------|--------------|
| 4.1 | Create stringray-orchestrator skill | `~/.openclaw/skills/stringray-orchestrator/` |
| 4.2 | Create stringray-tools skill | `~/.openclaw/skills/stringray-tools/` |
| 4.3 | Document installation process | Installation guide |

**Skills Location:** Skills go in `~/.openclaw/skills/` (user's OpenClaw directory), NOT in the StringRay codebase.

**Success Criteria:**
- ✅ Skills load successfully in OpenClaw
- ✅ Commands are discoverable
- ✅ HTTP API calls work correctly

### Phase 5: StringRay Hooks Integration (Week 4)
**Goal:** Integrate with StringRay's tool.before and tool.after hooks

| Task | Description | Deliverables |
|------|-------------|--------------|
| 5.1 | Create OpenClaw hook listeners | `src/integrations/openclaw/hooks/strray-hooks.ts` |
| 5.2 | Create event translation layer | `src/integrations/openclaw/hooks/event-translator.ts` |
| 5.3 | Create message router | `src/integrations/openclaw/hooks/message-router.ts` |
| 5.4 | Implement configuration integration | `.opencode/openclaw/hooks.json` |

**Success Criteria:**
- ✅ Hooks registered with StringRay
- ✅ Tool events captured
- ✅ Events sent to OpenClaw

### Phase 6: Testing (Week 5)
**Goal:** Comprehensive test coverage

| Task | Description | Deliverables |
|------|-------------|--------------|
| 6.1 | Unit tests | `src/integrations/openclaw/*.test.ts` |
| 6.2 | Integration tests | `src/integrations/openclaw/e2e/` |
| 6.3 | E2E tests | Full integration tests |
| 6.4 | Manual testing | Test documentation |

**Success Criteria:**
- ✅ All tests passing
- ✅ >80% code coverage

### Phase 7: Documentation (Week 6)
**Goal:** Comprehensive documentation

| Task | Description | Deliverables |
|------|-------------|--------------|
| 7.1 | User documentation | `integrations/openclaw/README.md` |
| 7.2 | Developer documentation | `integrations/openclaw/DEVELOPER.md` |
| 7.3 | Migration guide | `docs/migrations/openclaw-v1.md` |
| 7.4 | Release notes | `integrations/openclaw/CHANGELOG.md` |

**Success Criteria:**
- ✅ Complete user documentation
- ✅ Complete developer documentation

---

## 7. Risk Matrix & Mitigation

### Technical Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|------------|---------------------|
| OpenClaw Gateway unavailability | Medium | Medium | Implement graceful degradation mode; cache recent results; show clear error messages |
| WebSocket protocol version mismatch | Low | Low | Pin to protocol v3; validate on connect; implement version negotiation |
| Network issues (firewalls, DNS) | Medium | Medium | Implement exponential backoff reconnection; support proxy settings; add timeout handling |
| OpenClaw API breaking changes | Medium | Low | Follow OpenClaw documentation; implement version checking; handle unknown frames gracefully |
| Skill loading failures | Medium | Medium | Add skill validation; implement health checks; provide fallback behavior |

### Integration Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|------------|---------------------|
| Tool hook interference | Low | Low | Use priority system; provide enable/disable config; document interaction with other hooks |
| Performance overhead on tool execution | Medium | Medium | Implement async hook handling; use efficient serialization; add performance monitoring |
| State synchronization issues | Low | Low | Use event sourcing pattern; implement state versioning |

### Operational Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|------------|---------------------|
| Configuration errors | Medium | Medium | Provide schema validation; give helpful error messages; offer config wizard |
| Device pairing failures | Medium | Medium | Provide pairing UI; implement retry logic; document pairing process |
| Resource exhaustion | Low | Low | Implement connection pooling; add connection limits; use event-based flow |
| Log volume excessive | Low | Low | Use structured logging with levels; implement log rotation; add sampling |

### Security Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|------------|---------------------|
| Auth token leakage | Critical | Low | Never log tokens; use secure storage; rotate tokens regularly |
| Malicious skill injection | Medium | Low | Implement skill validation; use sandboxing; restrict skill permissions |
| Unauthorized API access | Critical | Medium | Implement API keys/secrets manager; restrict skill capabilities; use scopes |
| Man-in-the-middle attacks | Medium | Medium | Use TLS with certificate pinning; validate certificates; implement signature verification |

---

## 8. Success Criteria

### Phase Completion

| Phase | Criteria | Status |
|-------|-----------|--------|
| Phase 1 | Research tasks completed, architecture defined | ✅ |
| Phase 2 | WebSocket client, config, types, state, auth complete | ⏳ |
| Phase 3 | HTTP API server functional | ⏳ |
| Phase 4 | Skills load in OpenClaw | ⏳ |
| Phase 5 | Hooks registered, events captured | ⏳ |
| Phase 6 | All tests passing, >80% coverage | ⏳ |
| Phase 7 | Documentation complete | ⏳ |

### Quality Gates

| Gate | Target | Status |
|------|--------|--------|
| Critical bugs | 0 | ⏳ |
| All tests | 100% passing | ⏳ |
| Code review | Approved | ⏳ |
| Performance | <100ms latency | ⏳ |
| Security audit | Passed | ⏳ |

---

## 9. File Structure

```
src/integrations/openclaw/
├── types.ts                    # Protocol types (FULLY DEFINED)
├── config.ts                   # Configuration loader
├── client.ts                  # WebSocket client (FIXED)
├── errors.ts                  # Error classes
├── state.ts                   # State management (NEW)
├── auth.ts                    # Authentication flow (NEW)
├── index.ts                   # Main module
│
├── api/
│   ├── server.ts              # HTTP API server
│   ├── routes/
│   │   ├── agent.ts           # /api/agent/invoke
│   │   ├── tools.ts           # /api/tools/execute
│   │   └── status.ts          # /api/status
│   └── middleware/
│       ├── auth.ts             # API authentication
│       └── validation.ts       # Request validation
│
├── hooks/
│   ├── strray-hooks.ts        # StringRay hook integration
│   ├── tool-listener.ts       # Tool event listener
│   ├── event-translator.ts
│   └── message-router.ts
│
└── tests/
    ├── client.test.ts
    ├── config.test.ts
    └── e2e/
```

**Note:** OpenClaw skills are installed in the user's OpenClaw directory:
```
~/.openclaw/skills/
├── stringray-orchestrator/
│   ├── SKILL.md
│   └── index.mjs
└── stringray-tools/
    ├── SKILL.md
    └── index.mjs
```

---

## 10. Code Examples

### Example 1: WebSocket Client Connection (FIXED)

```typescript
// src/integrations/openclaw/client.ts

import { WebSocket } from 'ws';
import { 
  OpenClawFrame, 
  OpenClawFrameRequest, 
  OpenClawFrameResponse, 
  OpenClawFrameEvent,
  ConnectionState,
  OpenClawClientConfig,
  OpenClawError,
  ErrorCategory 
} from './types.js';
import { 
  OpenClawConnectionError, 
  OpenClawAuthenticationError,
  OpenClawProtocolError 
} from './errors.js';
import { frameworkLogger } from '../../core/framework-logger.js';

/**
 * Generates a unique request ID
 * @returns A unique string identifier for requests
 */
function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * OpenClaw WebSocket Client with proper request/response handling
 * 
 * Key fixes from review:
 * 1. sendRequest() now returns responses (not fire-and-forget)
 * 2. Added try/catch for message parsing
 * 3. Added generateId() method
 * 4. Added proper TypeScript types (no 'any')
 * 5. Added state management
 * 6. Added error handling strategy
 */
export class OpenClawClient {
  private ws: WebSocket | null = null;
  private url: string;
  private config: OpenClawClientConfig;
  private state: ConnectionState = 'disconnected';
  
  // Pending requests waiting for response
  private pendingRequests: Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  
  // Event handlers
  private eventHandlers: Map<string, Set<(event: OpenClawFrameEvent) => void>> = new Map();

  constructor(url: string, config: OpenClawClientConfig) {
    this.url = url;
    this.config = {
      maxRetries: 5,
      retryDelay: 1000,
      requestTimeout: 30000,
      ...config,
    };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Connect to OpenClaw Gateway
   */
  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      throw new Error(`Already connected or connecting (state: ${this.state})`);
    }

    this.state = 'connecting';
    frameworkLogger.log('openclaw-client', 'connecting', 'info', { url: this.url });

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          this.state = 'authenticating';
          this.sendConnectFrame().catch(reject);
        });

        this.ws.on('message', (data: Buffer) => {
          this.handleMessage(data).catch((err) => {
            frameworkLogger.log('openclaw-client', 'message-error', 'error', { 
              error: err.message 
            });
          });
        });

        this.ws.on('close', () => {
          this.handleDisconnect();
        });

        this.ws.on('error', (error) => {
          this.handleError(error);
          reject(error);
        });

        // Wait for authentication to complete
        this.waitForAuth().then(() => {
          this.state = 'connected';
          frameworkLogger.log('openclaw-client', 'connected', 'info');
          resolve();
        }).catch(reject);

      } catch (error) {
        this.state = 'failed';
        reject(error);
      }
    });
  }

  /**
   * Send a request and wait for response (FIXED: now returns actual response)
   * 
   * @param method The method to invoke
   * @param params The parameters for the method
   * @returns The response from the server
   */
  async sendRequest<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (this.state !== 'connected') {
      throw new Error(`Cannot send request: not connected (state: ${this.state})`);
    }

    const requestId = generateId();
    const frame: OpenClawFrameRequest = {
      type: 'req',
      id: requestId,
      method,
      params: params ?? {},
    };

    frameworkLogger.log('openclaw-client', 'request', 'debug', { 
      id: requestId, 
      method 
    });

    return new Promise((resolve, reject) => {
      // Set timeout for this request
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${method}`));
      }, this.config.requestTimeout);

      // Store pending request
      this.pendingRequests.set(requestId, { resolve: resolve as (value: unknown) => void, reject, timeout });

      // Send the request
      try {
        this.ws?.send(JSON.stringify(frame));
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to events
   */
  on(event: string, handler: (event: OpenClawFrameEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, handler: (event: OpenClawFrameEvent) => void): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Disconnect from Gateway
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.state = 'disconnected';
    this.clearPendingRequests();
  }

  // Private methods

  private async sendConnectFrame(): Promise<void> {
    const connectFrame: OpenClawFrameRequest = {
      type: 'req',
      id: generateId(),
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: this.config.deviceId || 'strray-integration',
          version: '1.0.0',
          platform: process.platform,
          mode: 'operator',
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write', 'events.subscribe'],
      },
    };

    // If we have a device token, include it
    if (this.config.deviceToken) {
      connectFrame.params.device = {
        id: this.config.deviceId,
        token: this.config.deviceToken,
      };
    }

    this.ws?.send(JSON.stringify(connectFrame));
  }

  /**
   * Handle incoming WebSocket message with try/catch (FIXED)
   */
  private async handleMessage(data: Buffer): Promise<void> {
    let frame: OpenClawFrame;
    
    try {
      frame = JSON.parse(data.toString());
    } catch (error) {
      frameworkLogger.log('openclaw-client', 'parse-error', 'error', { 
        error: 'Failed to parse frame',
        raw: data.toString().substring(0, 100)
      });
      return; // Gracefully ignore malformed messages
    }

    // Validate frame structure
    if (!frame || typeof frame.type !== 'string') {
      frameworkLogger.log('openclaw-client', 'invalid-frame', 'warn', { 
        message: 'Received frame with invalid structure'
      });
      return;
    }

    if (frame.type === 'res') {
      await this.handleResponse(frame as OpenClawFrameResponse);
    } else if (frame.type === 'event') {
      await this.handleEvent(frame as OpenClawFrameEvent);
    } else if (frame.type === 'req') {
      await this.handleRequest(frame as OpenClawFrameRequest);
    }
  }

  private async handleResponse(frame: OpenClawFrameResponse): Promise<void> {
    const pending = this.pendingRequests.get(frame.id);
    
    if (!pending) {
      frameworkLogger.log('openclaw-client', 'unknown-response', 'warn', { 
        id: frame.id 
      });
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(frame.id);

    if (frame.error) {
      pending.reject(new OpenClawProtocolError(
        frame.error.message || 'Unknown error',
        frame.error.code
      ));
    } else {
      pending.resolve(frame.result);
    }
  }

  private async handleEvent(frame: OpenClawFrameEvent): Promise<void> {
    const handlers = this.eventHandlers.get(frame.event);
    
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(frame);
        } catch (error) {
          frameworkLogger.log('openclaw-client', 'event-handler-error', 'error', { 
            event: frame.event,
            error: (error as Error).message
          });
        }
      }
    }
  }

  private async handleRequest(frame: OpenClawFrameRequest): Promise<void> {
    // Handle incoming requests (e.g., ping)
    frameworkLogger.log('openclaw-client', 'incoming-request', 'debug', { 
      method: frame.method 
    });
  }

  private handleDisconnect(): void {
    const previousState = this.state;
    this.state = 'disconnected';
    this.clearPendingRequests();

    if (previousState === 'connected') {
      frameworkLogger.log('openclaw-client', 'disconnected', 'info');
      this.scheduleReconnect();
    }
  }

  private handleError(error: Error): void {
    frameworkLogger.log('openclaw-client', 'error', 'error', { 
      error: error.message 
    });
    
    if (this.state === 'connecting' || this.state === 'authenticating') {
      this.state = 'failed';
    }
  }

  private scheduleReconnect(): void {
    if (this.config.maxRetries === 0) {
      frameworkLogger.log('openclaw-client', 'reconnect-disabled', 'info');
      return;
    }

    this.state = 'reconnecting';
    // Implement exponential backoff reconnection
    // ... (see state management section)
  }

  private clearPendingRequests(): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();
  }

  private waitForAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Set auth timeout
      const timeout = setTimeout(() => {
        reject(new OpenClawAuthenticationError('Authentication timeout'));
      }, 10000);

      // Listen for auth response
      this.once('connect', (frame) => {
        clearTimeout(timeout);
        resolve();
      });

      this.once('connect:error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private once(event: string, handler: (data: unknown) => void): void {
    const wrappedHandler = (frame: OpenClawFrameEvent) => {
      handler(frame);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }
}
```

### Example 2: HTTP API Server

```typescript
// src/integrations/openclaw/api/server.ts

import express, { Express, Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { OpenClawClient } from '../client.js';
import { frameworkLogger } from '../../core/framework-logger.js';

interface ApiConfig {
  port: number;
  apiKey?: string;
  corsOrigins?: string[];
}

interface AgentInvokeRequest {
  command: string;
  args?: Record<string, unknown>;
  agent?: string;
}

interface ToolExecuteRequest {
  tool: string;
  params?: Record<string, unknown>;
}

/**
 * HTTP API Server that exposes StringRay capabilities to OpenClaw skills
 * 
 * This is the critical piece that enables OpenClaw skills to invoke StringRay!
 * Skills make HTTP requests to this server.
 */
export class StringRayApiServer {
  private app: Express;
  private server: ReturnType<typeof import('http').createServer | null> = null;
  private wss: WebSocketServer | null = null;
  private openclawClient: OpenClawClient;
  private config: ApiConfig;

  constructor(config: ApiConfig, openclawClient: OpenClawClient) {
    this.config = config;
    this.openclawClient = openclawClient;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    
    // API key authentication
    if (this.config.apiKey) {
      this.app.use(this.authenticateRequest);
    }

    // Error handling
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      frameworkLogger.log('api-server', 'error', 'error', {
        error: err.message,
        path: req.path
      });
      
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message,
          retryable: false,
          timestamp: Date.now()
        }
      });
    });
  }

  private authenticateRequest(req: Request, res: Response, next: NextFunction): void {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey || apiKey !== this.config.apiKey) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing API key',
          retryable: false,
          timestamp: Date.now()
        }
      });
      return;
    }
    
    next();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/status', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        version: '1.0.0',
        openclaw: {
          connected: this.openclawClient.getState() === 'connected'
        },
        timestamp: Date.now()
      });
    });

    // Agent invoke endpoint (main entry point for skills)
    this.app.post('/api/agent/invoke', async (req: Request, res: Response) => {
      try {
        const { command, args, agent } = req.body as AgentInvokeRequest;
        
        if (!command) {
          res.status(400).json({
            error: {
              code: 'INVALID_REQUEST',
              message: 'Missing required field: command',
              retryable: false,
              timestamp: Date.now()
            }
          });
          return;
        }

        // TODO: Integrate with actual StringRay orchestrator
        // For now, this is a placeholder that shows the pattern
        const result = await this.invokeAgent(command, args, agent);
        
        res.json({
          success: true,
          result,
          timestamp: Date.now()
        });
      } catch (error) {
        const err = error as Error;
        res.status(500).json({
          error: {
            code: 'AGENT_ERROR',
            message: err.message,
            retryable: true,
            timestamp: Date.now()
          }
        });
      }
    });

    // Tool execute endpoint
    this.app.post('/api/tools/execute', async (req: Request, res: Response) => {
      try {
        const { tool, params } = req.body as ToolExecuteRequest;
        
        if (!tool) {
          res.status(400).json({
            error: {
              code: 'INVALID_REQUEST',
              message: 'Missing required field: tool',
              retryable: false,
              timestamp: Date.now()
            }
          });
          return;
        }

        // TODO: Integrate with actual tool executor
        const result = await this.executeTool(tool, params);
        
        res.json({
          success: true,
          result,
          timestamp: Date.now()
        });
      } catch (error) {
        const err = error as Error;
        res.status(500).json({
          error: {
            code: 'TOOL_ERROR',
            message: err.message,
            retryable: true,
            timestamp: Date.now()
          }
        });
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        frameworkLogger.log('api-server', 'started', 'info', {
          port: this.config.port
        });
        resolve();
      });

      // WebSocket server for event stream
      this.wss = new WebSocketServer({ 
        path: '/ws/events',
        server: this.server 
      });

      this.wss.on('connection', (ws: WebSocket) => {
        frameworkLogger.log('api-server', 'ws-client-connected', 'info');
        
        // Subscribe to OpenClaw events and forward to client
        this.openclawClient.on('*', (event) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(event));
          }
        });
      });
    });
  }

  async stop(): Promise<void> {
    this.wss?.close();
    this.server?.close();
  }

  // Placeholder methods - to be integrated with actual StringRay
  private async invokeAgent(
    command: string, 
    args?: Record<string, unknown>,
    agent?: string
  ): Promise<unknown> {
    // TODO: Integrate with StringRay orchestrator
    frameworkLogger.log('api-server', 'invoke-agent', 'debug', { 
      command, 
      args, 
      agent 
    });
    
    return { 
      command,
      executed: true,
      message: `Command '${command}' would be executed here`
    };
  }

  private async executeTool(
    tool: string, 
    params?: Record<string, unknown>
  ): Promise<unknown> {
    // TODO: Integrate with StringRay tool system
    frameworkLogger.log('api-server', 'execute-tool', 'debug', { 
      tool, 
      params 
    });
    
    return { 
      tool,
      executed: true,
      message: `Tool '${tool}' would be executed here`
    };
  }
}
```

### Example 3: OpenClaw Skill (invoke StringRay via HTTP)

```javascript
// ~/.openclaw/skills/stringray-orchestrator/index.mjs

/**
 * StringRay Orchestrator Skill
 * 
 * This skill invokes StringRay via HTTP API.
 * The API server must be running (default: http://localhost:18431)
 */

const DEFAULT_API_URL = process.env.STRINGRAY_API_URL || 'http://localhost:18431';
const DEFAULT_API_KEY = process.env.STRINGRAY_API_KEY;

/**
 * Make an API request to StringRay
 */
async function request(endpoint, body) {
  const response = await fetch(`${DEFAULT_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(DEFAULT_API_KEY ? { 'x-api-key': DEFAULT_API_KEY } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `API error: ${response.status}`);
  }

  return data;
}

/**
 * Main skill handler - called by OpenClaw
 */
export async function run(params, context) {
  const { command, args } = params;
  
  try {
    switch (command) {
      case 'analyze':
        return await analyzeCode(args?.file, args?.options);
      
      case 'code-review':
        return await codeReview(args?.file, args?.options);
      
      case 'refactor':
        return await refactorCode(args?.file, args?.instructions);
      
      case 'test':
        return await runTests(args?.file, args?.framework);
      
      case 'status':
        return await getStatus();
      
      default:
        return {
          error: `Unknown command: ${command}`,
          availableCommands: ['analyze', 'code-review', 'refactor', 'test', 'status']
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function analyzeCode(file, options = {}) {
  const response = await request('/api/agent/invoke', {
    command: 'analyze',
    args: { file, ...options }
  });
  
  return response.result;
}

async function codeReview(file, options = {}) {
  const response = await request('/api/agent/invoke', {
    command: 'code-review',
    args: { file, ...options }
  });
  
  return response.result;
}

async function refactorCode(file, instructions) {
  const response = await request('/api/agent/invoke', {
    command: 'refactor',
    args: { file, instructions }
  });
  
  return response.result;
}

async function runTests(file, framework) {
  const response = await request('/api/tools/execute', {
    tool: 'test',
    params: { file, framework }
  });
  
  return response.result;
}

async function getStatus() {
  const response = await fetch(`${DEFAULT_API_URL}/api/status`);
  return await response.json();
}
```

### Example 4: StringRay Orchestrator Skill (SKILL.md)

```yaml
---
name: stringray-orchestrator
description: |
  Main orchestration skill for StringRay AI agents.
  Provides commands to coordinate agent work and invoke StringRay APIs.
  
  Requires: StringRay API server running at http://localhost:18431
  Environment: STRINGRAY_API_URL, STRINGRAY_API_KEY

metadata:
  openclaw:
    primaryEnv: STRINGRAY_API_KEY
    emoji: 🤖

requires:
  env:
    - STRINGRAY_API_URL
    - STRINGRAY_API_KEY
  bins:
    - node

allowed-tools: []
---

# StringRay Orchestrator Commands

## /strray-analyze
Analyze code using StringRay code analysis capabilities.

Usage: `/strray-analyze <file> [options]`

Example: `/strray-analyze src/index.ts --complexity --security`

## /strray-code-review
Perform a comprehensive code review.

Usage: `/strray-code-review <file>`

Example: `/strray-code-review src/utils/helper.ts`

## /strray-refactor
Refactor code according to instructions.

Usage: `/strray-refactor <file> --instructions "<instructions>"`

Example: `/strray-refactor src/index.ts --instructions "Extract logic to separate function"`

## /strray-test
Run tests using StringRay testing capabilities.

Usage: `/strray-test [file] --framework <framework>`

Example: `/strray-test --framework vitest`

## /strray-status
Check StringRay status and capabilities.

Usage: `/strray-status`
```

### Example 5: Type Definitions (FIXED - No any types)

```typescript
// src/integrations/openclaw/types.ts

/**
 * Connection state for the OpenClaw client
 */
export type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'authenticating' 
  | 'connected' 
  | 'reconnecting' 
  | 'failed';

/**
 * OpenClaw frame types
 */
export type FrameType = 'req' | 'res' | 'event';

/**
 * Base frame structure
 */
export interface OpenClawFrame {
  type: FrameType;
  id: string;
}

/**
 * Request frame (client -> server)
 */
export interface OpenClawFrameRequest extends OpenClawFrame {
  type: 'req';
  method: string;
  params?: Record<string, unknown>;
}

/**
 * Response frame (server -> client)
 */
export interface OpenClawFrameResponse extends OpenClawFrame {
  type: 'res';
  result?: unknown;
  error?: {
    code?: string;
    message: string;
  };
}

/**
 * Event frame (server -> client)
 */
export interface OpenClawFrameEvent extends OpenClawFrame {
  type: 'event';
  event: string;
  data?: Record<string, unknown>;
}

/**
 * Client configuration
 */
export interface OpenClawClientConfig {
  deviceId?: string;
  deviceToken?: string;
  maxRetries?: number;
  retryDelay?: number;
  requestTimeout?: number;
}

/**
 * Error categories
 */
export enum ErrorCategory {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  INVALID_FRAME = 'INVALID_FRAME',
  UNKNOWN_METHOD = 'UNKNOWN_METHOD',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  REQUEST_FAILED = 'REQUEST_FAILED',
  NOT_CONNECTED = 'NOT_CONNECTED',
  ALREADY_CONNECTED = 'ALREADY_CONNECTED',
}

/**
 * Error response structure
 */
export interface OpenClawError {
  code: ErrorCategory | string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  timestamp: number;
}
```

---

## 11. Configuration Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "OpenClaw Integration Configuration",
  "properties": {
    "gatewayUrl": {
      "type": "string",
      "default": "ws://127.0.0.1:18789",
      "description": "OpenClaw WebSocket Gateway URL"
    },
    "deviceId": {
      "type": "string",
      "description": "Device ID for OpenClaw authentication"
    },
    "deviceToken": {
      "type": "string",
      "description": "Device token (obtained via pairing)"
    },
    "autoConnect": {
      "type": "boolean",
      "default": true,
      "description": "Automatically connect to OpenClaw Gateway"
    },
    "apiServer": {
      "type": "object",
      "properties": {
        "port": {
          "type": "number",
          "default": 18431,
          "description": "HTTP API server port for OpenClaw skills to invoke"
        },
        "apiKey": {
          "type": "string",
          "description": "API key for authentication (optional but recommended)"
        }
      }
    },
    "enableLogging": {
      "type": "boolean",
      "default": true,
      "description": "Enable detailed logging"
    },
    "maxRetries": {
      "type": "number",
      "default": 5,
      "description": "Maximum reconnection attempts"
    },
    "retryDelay": {
      "type": "number",
      "default": 1000,
      "description": "Initial retry delay in milliseconds"
    },
    "requestTimeout": {
      "type": "number",
      "default": 30000,
      "description": "Request timeout in milliseconds"
    },
    "enabled": {
      "type": "boolean",
      "default": true,
      "description": "Enable/disable the integration"
    }
  }
}
```

---

## 12. Testing Strategy

### Unit Tests
- WebSocket client (connection, frames, reconnection)
- Configuration loader (validation, defaults)
- Frame parsing (req/res/event)
- Error handling (all error types)
- State machine transitions

### Integration Tests
- Mock OpenClaw Gateway
- Test HTTP API endpoints
- Test skill invocation
- Test event flow

### E2E Tests
- Test with real OpenClaw Gateway
- Test all skills
- Test error scenarios
- Test on various channels

### Manual Testing
- Test on WhatsApp, Discord, Telegram
- Test different agent scenarios
- Performance testing

---

## 13. Dependencies

### Required
- `ws` - WebSocket client
- `@types/ws` - TypeScript types
- `express` - HTTP server

### Optional
- `minimatch` - Pattern matching for skill filters
- `p-limit` - Rate limiting

### Dev Dependencies
- `vitest` - Testing framework
- `@types/node` - Node.js types

---

## 14. Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Research Validation | 1 week | 1 week |
| Phase 2: Foundation | 2 weeks | 3 weeks |
| Phase 3: HTTP API Server | 1 week | 4 weeks |
| Phase 4: Skill Development | 1 week | 5 weeks |
| Phase 5: Hooks Integration | 2 weeks | 7 weeks |
| Phase 6: Testing | 2 weeks | 9 weeks |
| Phase 7: Documentation | 1 week | 10 weeks |

**Total: ~10 weeks**

---

## 15. Rollback Plan

If integration causes issues:

```bash
# Disable integration
# 1. Set enabled: false in config
# 2. Restart StringRay

# Full rollback
# 1. git checkout HEAD~1 -- src/integrations/openclaw/
# 2. Remove skills from ~/.openclaw/skills/
# 3. npm uninstall ws express
```

---

## 16. Approval & Next Steps

### Ready for Implementation
- [x] Research complete
- [x] Architecture designed
- [x] Invocation mechanism defined (HTTP API)
- [x] Risk assessment complete
- [x] Implementation plan defined

### Awaiting Approval
- [ ] Phase 2 implementation start
- [ ] Code review assignment
- [ ] Test environment setup

### Next Steps
1. Approve this plan
2. Begin Phase 2 (Foundation)
3. Create WebSocket client with fixes
4. Implement HTTP API server
5. Create skill templates

---

**Architect Status:** ✅ Design Complete - Ready for Implementation

**Recommendation:** Proceed with Phase 2 (Foundation) as outlined in this document.

---

*Document generated by StringRay Architect Agent*
*Based on research findings from StringRay Research Agent*
*Updated: 2026-03-15 with review feedback*
