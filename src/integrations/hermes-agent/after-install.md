# StringRay Hermes Plugin Installed

**Restart your Hermes session** for the plugin to take effect.

## What's Installed

| Component | Description |
|-----------|-------------|
| `strray_validate` | Pre-commit validation with quality gates |
| `strray_codex_check` | Code review against 60 Codex error-prevention rules |
| `strray_health` | Framework health check |
| `pre_tool_call` hook | Quality gates + nudges before every tool call |
| `post_tool_call` hook | Post-processors + file tracking after every tool call |

## Quick Test

After restarting Hermes, try:

```
/strray status
```

Or use the tools directly — `strray_health` will confirm the bridge is connected.

## MCP Servers

The plugin works alongside StringRay's MCP servers (if configured in your
Hermes config). The plugin's native tools provide offline/offline-first
validation, while MCP servers offer deeper framework integration.

## Files

The plugin lives at `~/.hermes/plugins/strray-hermes/`. It is auto-updated
when you run `npm install` or `npm update` in a project with `strray-ai`
as a dependency.
