# OpenClaw Integration

StringRay integration for OpenClaw - a self-hosted AI gateway that connects messaging platforms to AI coding agents.

## Overview

This integration allows StringRay to:
- Connect to OpenClaw Gateway via WebSocket
- Expose StringRay capabilities through OpenClaw skills
- Send tool execution events to OpenClaw for real-time tracking
- Receive commands from OpenClaw channels (WhatsApp, Telegram, Discord, etc.)

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │────▶│  OpenClaw    │────▶│   StringRay   │
│  (WhatsApp,  │     │   Gateway    │     │    Skills    │
│  Discord,    │     │              │     │              │
│  Telegram)   │◀────│              │◀────│              │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │  WebSocket   │
                   │   Client     │
                   └──────────────┘
```

## Installation

### 1. Install Dependencies

```bash
npm install ws
```

### 2. Configure OpenClaw

Create `.strray/config/openclaw.json`:

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

### 3. Install OpenClaw Skills

Copy skills to your OpenClaw skills directory:

```bash
cp -r skills/* ~/.openclaw/skills/
```

## Usage

### Initialize Integration

```typescript
import { initializeOpenClawIntegration } from './src/integrations/openclaw/index.js';

const integration = await initializeOpenClawIntegration();

// Or with custom agent invoker
const integration = await initializeOpenClawIntegration('/path/to/config.json', myAgentInvoker);
```

### Using OpenClaw Commands

After installation, use these commands in any OpenClaw channel:

- `/strray` - Show status
- `/strray-analyze <file>` - Analyze code
- `/strray-code <file>` - Code review
- `/strray-file <file>` - Read file
- `/strray-exec <command>` - Execute command

## Configuration

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

## API Server

The integration exposes a local HTTP API on port 18431:

- `GET /health` - Health check
- `POST /api/agent/invoke` - Invoke agent
- `GET /api/agent/status` - Agent status

## Skills

### stringray-orchestrator

Main skill providing StringRay commands:

```markdown
/strray                    - Show status
/strray-analyze <file>    - Analyze code
/strray-code <file>       - Code review
/strray-file <file>       - Read file
/strray-exec <command>    - Execute command
```

## Documentation

See `docs/research/openclaw/` for detailed documentation.

## License

MIT
