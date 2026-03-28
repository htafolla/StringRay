# StringRay Extensibility Guide

StringRay provides multiple ways to extend and customize its functionality. This document describes the three main extensibility mechanisms: **Hooks**, **Triggers**, and **Integrations**.

---

## 1. Hooks System

Hooks allow you to intercept and customize framework behavior at specific points during execution.

### Available Hooks

| Hook Type | Location | Status | Description |
|-----------|----------|--------|-------------|
| **Framework Hooks** | `src/hooks/framework-hooks.ts` | ⚠️ Stub | Framework init/destroy |
| **Validation Hooks** | `src/hooks/validation-hooks.ts` | ✅ Working | Codex version validation |
| **Tool Hooks** | `.opencode/plugin/strray-codex-injection.js` | ✅ Working | tool.before/tool.after events |

### Using Validation Hooks

```typescript
import { useVersionValidation, useCodexValidation } from './hooks/validation-hooks.js';

// Version consistency validation
const versionValidator = useVersionValidation();
const isValid = await versionValidator.validateVersionConsistency({
  filesChanged: ['src/index.ts'],
  operation: 'commit'
});

// Codex validation
const codexValidator = useCodexValidation();
const isValidCodex = codexValidator.preValidate(data);
```

### Tool Event Hooks (OpenCode Integration)

The `strray-codex-injection.js` plugin hooks into OpenCode:

```typescript
// Runs before any tool executes
tool.execute.before: (toolName, args) => {
  // Log tool execution, validate, or modify args
}

// Runs after any tool executes
tool.execute.after: (toolName, args, result) => {
  // Process results, send to external systems
}
```

---

## 2. Triggers System

Triggers execute post-processing actions based on specific events (git commits, API calls, webhooks).

### Available Triggers

| Trigger | File | Description |
|---------|------|-------------|
| **GitHookTrigger** | `src/postprocessor/triggers/GitHookTrigger.ts` | Runs validation after git commit/push |
| **APITrigger** | `src/postprocessor/triggers/APITrigger.ts` | REST API endpoint for manual triggers |
| **WebhookTrigger** | `src/postprocessor/triggers/WebhookTrigger.ts` | Webhook handlers for GitHub/GitLab/Stripe |

### GitHookTrigger

Installs into `.git/hooks/`:

```bash
# Installs to .git/hooks/post-commit and .git/hooks/post-push
```

Generated shell scripts run validation asynchronously with log rotation.

### APITrigger

Express-based REST endpoint:

```typescript
// POST /api/post-process
// Headers: X-API-Key: your-key
const response = await fetch('http://localhost:18431/api/post-process', {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key' },
  body: JSON.stringify({ files: ['src/index.ts'] })
});
```

### WebhookTrigger

Supports GitHub, GitLab, Bitbucket, Stripe:

```typescript
// Validates webhook signatures
const trigger = new WebhookTrigger({
  github: { secret: 'your-webhook-secret' },
  gitlab: { token: 'your-gitlab-token' },
  stripe: { secret: 'your-stripe-secret' }
});
```

---

## 3. Integrations System

Integrations connect StringRay to external services and platforms.

### Base Integration Class

```typescript
import { BaseIntegration } from './integrations/base/Integration.js';

class MyIntegration extends BaseIntegration {
  constructor() {
    super('my-integration', '1.0.0', { enabled: true });
  }

  async initialize(): Promise<void> {
    await this.log('info', 'Initializing my integration');
    // Setup connection, load config, etc.
  }

  async shutdown(): Promise<void> {
    await this.log('info', 'Shutting down');
    // Cleanup
  }
}
```

### Available Integrations

| Integration | Status | Description |
|-------------|--------|-------------|
| **OpenClaw Integration** | ✅ Working | WebSocket client to OpenClaw Gateway |
| **BaseIntegration** | ✅ Working | Abstract base class for integrations |

### OpenClaw Integration

Connects StringRay to OpenClaw Gateway:

```typescript
import { initializeOpenClawIntegration } from './integrations/openclaw/index.js';

const openclaw = await initializeOpenClawIntegration('/path/to/config.json');
await openclaw.connect();

// Send tool events to OpenClaw
openclaw.getHooksManager()?.onToolBefore({
  toolName: 'write',
  args: { filePath: 'test.ts' }
});
```

### Creating a Custom Integration

```typescript
import { BaseIntegration } from './integrations/base/Integration.js';

class SlackIntegration extends BaseIntegration {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    super('slack', '1.0.0', { enabled: true });
    this.webhookUrl = webhookUrl;
  }

  async initialize(): Promise<void> {
    // Initialize Slack client
  }

  async notify(message: string): Promise<void> {
    // Send notification
  }
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    StringRay Framework                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │    Hooks    │    │   Triggers  │    │ Integrations │   │
│  ├─────────────┤    ├─────────────┤    ├─────────────┤   │
│  │ validation  │    │    Git      │    │  OpenClaw   │   │
│  │   tool      │    │    API      │    │   Custom    │   │
│  │ framework   │    │  Webhook   │    │             │   │
│  └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Extensibility Comparison

| Feature | Hooks | Triggers | Integrations |
|---------|-------|----------|--------------|
| **When** | During execution | After events | On-demand |
| **Use case** | Modify/validate | Automate workflows | Connect services |
| **Sync/Async** | Both | Async | Both |
| **Examples** | Validate before commit | Run after push | Send Slack notification |

---

## What's NOT a Plugin

The following are **NOT** third-party plugins (they're framework code):

- `strray-codex-injection.js` - OpenCode integration, not a plugin
- MCP servers in `src/mcps/` - Framework services
- Agent definitions - Framework components

StringRay does not currently support third-party plugins. The extensibility model is through hooks, triggers, and integrations.

---

## Future: Plugin System

If third-party plugin support is needed, it would require:

1. `PluginRegistry` - Load and manage plugins
2. `PluginSandbox` - Secure execution environment
3. Plugin marketplace - Distribution mechanism

Currently not implemented - see `src/plugins/` (deleted - was dead code).
