# StringRay Universal Hook Protocol

Agent-host-agnostic JSON interface for StringRay enforcement.

## Overview

The hook protocol lets any agent host (OpenCode, Hermes, Claude Desktop, custom agents in any language) integrate StringRay's quality gates and codex enforcement without importing a single Node.js module.

**Transport modes:**
- **Stdin/Stdout** — `echo '{"command":"pre_tool_call",...}' | node bridge.mjs`
- **HTTP** — `POST http://localhost:18431` with JSON body
- **Library** — `import { formatCodexPrompt } from 'strray-ai'` (Node.js only)

## Events

### pre_tool_call

Called before a tool executes. Can block the action by returning `{ blocked: true }`.

```json
{
  "command": "pre_tool_call",
  "tool": "write_file",
  "args": { "path": "src/foo.ts", "content": "..." },
  "sessionId": "optional-session-id"
}
```

Response:

```json
{
  "status": "ok",
  "blocked": false,
  "warnings": [],
  "violations": []
}
```

Blocked response:

```json
{
  "status": "blocked",
  "blocked": true,
  "violations": [
    {
      "rule": "resolve-all-errors",
      "severity": "blocking",
      "reason": "Unhandled promise in async function"
    }
  ]
}
```

### post_tool_call

Called after a tool executes. Can inject context into the output.

```json
{
  "command": "post_tool_call",
  "tool": "write_file",
  "args": { "path": "src/foo.ts" },
  "result": { "success": true },
  "sessionId": "optional-session-id"
}
```

Response:

```json
{
  "status": "ok",
  "injections": [],
  "metrics": { "validationTimeMs": 12 }
}
```

### validate

Run quality gate validation on files without blocking execution.

```json
{
  "command": "validate",
  "files": ["src/foo.ts", "src/bar.ts"],
  "options": { "strict": true }
}
```

Response:

```json
{
  "status": "ok",
  "passed": true,
  "violations": [],
  "warnings": [
    { "file": "src/foo.ts", "line": 42, "rule": "no-console-in-production", "message": "Use frameworkLogger instead" }
  ]
}
```

### codex-check

Check specific code against codex rules.

```json
{
  "command": "codex-check",
  "code": "function foo() { console.log('hello'); }",
  "operation": "create"
}
```

Response:

```json
{
  "status": "ok",
  "passed": false,
  "violations": [
    { "rule": "no-console-in-production", "severity": "blocking", "message": "console.log found" }
  ]
}
```

### get-codex-prompt

Get formatted codex terms for system prompt injection. No enforcement — just returns the text.

```json
{
  "command": "get-codex-prompt",
  "severityFilter": ["blocking"],
  "compressed": true
}
```

Response:

```json
{
  "status": "ok",
  "prompt": "## StringRay Universal Development Codex v1.7.8\n...",
  "termCount": 12,
  "totalTerms": 60,
  "version": "1.15.11",
  "charCount": 2048
}
```

### get-config

Get full framework configuration.

```json
{
  "command": "get-config"
}
```

Response:

```json
{
  "status": "ok",
  "projectRoot": "/path/to/project",
  "codex": { "path": ".strray/codex.json", "version": "1.15.11", "termCount": 60 },
  "features": { "token_optimization": { "enabled": true } }
}
```

### health

Framework health check.

```json
{
  "command": "health"
}
```

### hooks

Manage git hooks.

```json
{ "command": "hooks", "action": "install", "hooks": ["pre-commit", "pre-push"] }
{ "command": "hooks", "action": "uninstall" }
{ "command": "hooks", "action": "list" }
{ "command": "hooks", "action": "status" }
```

## Error Responses

All errors follow this schema:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Error codes: `UNKNOWN_COMMAND`, `INVALID_JSON`, `FILE_NOT_FOUND`, `VALIDATION_FAILED`, `BRIDGE_ERROR`.

## Integration Examples

### Node.js (subprocess)

```javascript
import { execFile } from 'child_process';

async function preToolCall(tool, args) {
  const { stdout } = await execFile('node', ['node_modules/strray-ai/dist/core/bridge.mjs'], {
    input: JSON.stringify({ command: 'pre_tool_call', tool, args }),
    maxBuffer: 1024 * 1024,
  });
  return JSON.parse(stdout);
}

const result = await preToolCall('write_file', { path: 'foo.ts' });
if (result.blocked) {
  throw new Error(`Blocked: ${result.violations.map(v => v.reason).join('; ')}`);
}
```

### Python (subprocess)

```python
import subprocess, json

def pre_tool_call(tool: str, args: dict) -> dict:
    payload = {"command": "pre_tool_call", "tool": tool, "args": args}
    result = subprocess.run(
        ["node", "node_modules/strray-ai/dist/core/bridge.mjs"],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)

# Get codex prompt for system injection
result = subprocess.run(
    ["node", "node_modules/strray-ai/dist/core/bridge.mjs"],
    input=json.dumps({"command": "get-codex-prompt", "compressed": True}),
    capture_output=True, text=True,
)
codex_prompt = json.loads(result.stdout)["prompt"]
```

### Shell (curl, HTTP mode)

```bash
# Start bridge in HTTP mode
node node_modules/strray-ai/dist/core/bridge.mjs --http --port 18431 &

# Validate files
curl -s -X POST http://localhost:18431 \
  -d '{"command":"validate","files":["src/index.ts"]}' | jq .

# Health check (GET convenience endpoint)
curl -s http://localhost:18431/health | jq .
```

### Claude Desktop / MCP

StringRay ships MCP servers. If your agent supports MCP, no bridge needed — connect to the StringRay MCP server directly. MCP is the preferred integration for MCP-compatible agents.

## Config Resolution

All commands respect the standard config priority chain:

1. `STRRAY_CONFIG_DIR/` — environment variable override
2. `.strray/` — preferred lightweight root
3. `.opencode/strray/` — legacy OpenCode root

Set `--cwd /path` or `STRRAY_CONFIG_DIR` to point to a specific project.
