---
name: hermes-agent
description: Manage StringRay framework from Hermes Agent — install, configure, health-check, report, and publish. Covers CLI commands and MCP server integration for Hermes.
version: 1.0.0
author: StringRay AI
license: MIT
metadata:
  hermes:
    tags: [StringRay, CLI, MCP, Framework, Orchestration]
    related_skills: []
prerequisites:
  commands: [npx]
---

# StringRay Agent for Hermes

Manage the StringRay AI framework from within Hermes Agent. Covers CLI commands (install, health, report, skills) and MCP server integration.

## When to Use

Use this skill when:
- User asks about StringRay status, health, or configuration
- User wants to install, validate, or fix StringRay
- User asks for reports, analytics, or capability info
- User wants to manage skills (install, list, status)
- User wants to publish agents to AgentStore
- User asks how to connect StringRay MCP servers to Hermes
- User asks about StringRay capabilities or available agents

## CLI Commands

### Setup and Diagnostics

```bash
# Install StringRay in current project (detects/installs OpenCode, configures agents, sets up Codex)
npx strray-ai install

# Initialize StringRay configuration only (lighter than install)
npx strray-ai init

# Check framework configuration and plugin status
npx strray-ai status

# Validate installation and dependencies
npx strray-ai validate

# Full health check on framework components
npx strray-ai health

# Diagnose issues without fixing them
npx strray-ai doctor

# Auto-fix common framework issues (restores missing config files)
npx strray-ai fix

# Debug command for troubleshooting
npx strray-ai debug
```

### Reporting and Analytics

```bash
# Generate full analysis report
npx strray-ai report

# Performance-focused report
npx strray-ai report --type performance

# Agent invocation report
npx strray-ai report --type agent-usage

# Save report to file
npx strray-ai report -o report.json

# Pattern analysis and insights
npx strray-ai analytics

# Analyze last N task completions
npx strray-ai analytics --limit 50
```

### Capabilities

```bash
# Show all available StringRay capabilities, agents, and features
npx strray-ai capabilities
```

### Skills Management

```bash
# Show starter packs and available registry sources
npx strray-ai skill:install

# Install from registry
npx strray-ai skill:install agency-agents    # 170+ agency agent definitions
npx strray-ai skill:install superpowers       # 14 agentic workflow skills (TDD, debugging, etc.)
npx strray-ai skill:install minimax           # Frontend, fullstack, Android, iOS skills
npx strray-ai skill:install gemini-skills     # Official Google Gemini skills
npx strray-ai skill:install anthropic-skills  # Official Anthropic/Claude skills

# Install from any git repo
npx strray-ai skill:install <github-url>

# Install from specific subdirectory in a repo
npx strray-ai skill:install <github-url> --path skills/typescript

# List all 10 bundled registry sources
npx strray-ai skill:registry list

# Show all installed skills with license info
npx strray-ai antigravity status
```

### Agent Publishing

```bash
# Package agent for AgentStore
npx strray-ai publish-agent --agent <name>

# Preview without publishing
npx strray-ai publish-agent --agent <name> --dry-run

# Publish specific version
npx strray-ai publish-agent --agent <name> --version 2.0.0
```

### Inference

```bash
# Run autonomous inference improvement cycle
npx strray-ai inference:improve

# Start/stop autonomous inference tuner service
npx strray-ai inference:tuner
```

## MCP Server Integration with Hermes

StringRay ships 15 MCP servers that Hermes can connect to. Each exposes tools Hermes calls directly — no prompts, no proxies.

### Server Overview

| MCP Server | Key Tools | Purpose |
|-----------|----------|---------|
| `strray-architect-tools` | codebase_structure, dependency_analysis, context_analysis, architecture_assessment | Project analysis and architectural health |
| `strray-auto-format` | auto_format, format_check | Prettier + ESLint + TypeScript formatting |
| `strray-enforcer` | rule_validation, codex_enforcement, quality_gate_check, run_pre_commit_validation | Codex compliance and quality gates |
| `strray-estimation` | validate_estimate, start_tracking, complete_tracking, get_accuracy_report | Task estimation and time tracking |
| `strray-framework-help` | strray_get_capabilities, strray_get_commands, strray_explain_capability | Framework reference and docs |
| `strray-lint` | lint, lint_check | ESLint validation with auto-fix |
| `strray-orchestrator` | orchestrate_task, analyze_complexity, get_orchestration_status, optimize_orchestration | Multi-agent task planning |
| `strray-researcher` | search_codebase, find_implementation, get_documentation | Codebase search and pattern finding |
| `strray-security-scan` | security_scan, dependency_audit | Vulnerability scanning |
| `strray-state-manager` | get_state, set_state, delete_state, list_state, backup_state, restore_state | Persistent key-value state |

### Setup

Add to `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  strray-architect-tools:
    command: node
    args: ["./node_modules/strray-ai/dist/mcps/architect-tools.server.js"]
    timeout: 30
  strray-auto-format:
    command: node
    args: ["./node_modules/strray-ai/dist/mcps/auto-format.server.js"]
    timeout: 30
  strray-enforcer:
    command: node
    args: ["./node_modules/strray-ai/dist/mcps/enforcer-tools.server.js"]
    timeout: 30
  strray-estimation:
    command: node
    args: ["./node_modules/strray-ai/dist/mcps/estimation.server.js"]
    timeout: 30
  strray-framework-help:
    command: node
    args: ["./node_modules/strray-ai/dist/mcps/framework-help.server.js"]
    timeout: 30
  strray-lint:
    command: node
    args: ["./node_modules/strray-ai/dist/mcps/lint.server.js"]
    timeout: 30
  strray-orchestrator:
    command: node
    args: ["./node_modules/strray-ai/dist/mcps/orchestrator/server.js"]
    timeout: 60
  strray-researcher:
    command: node
    args: ["./node_modules/strray-ai/dist/mcps/researcher.server.js"]
    timeout: 60
  strray-security-scan:
    command: node
    args: ["./node_modules/strray-ai/dist/mcps/security-scan.server.js"]
    timeout: 30
  strray-state-manager:
    command: node
    args: ["./node_modules/strray-ai/dist/mcps/state-manager.server.js"]
    timeout: 30
```

### Tool Naming Convention

Hermes prefixes MCP tools as `mcp_strray_<server>_<tool>`. For example:
- `mcp_strray_architect_tools_codebase_structure`
- `mcp_strray_enforcer_rule_validation`
- `mcp_strray_lint_lint`

This is automatic and not configurable.

### How MCP and CLI Complement Each Other

| Capability | MCP Server | CLI Command |
|-----------|-----------|-------------|
| Analyze code | architect-tools | — |
| Lint/format | lint, auto-format | — |
| Security scan | security-scan | — |
| Orchestrate tasks | orchestrator | — |
| Manage state | state-manager | — |
| **Install framework** | — | `install`, `init` |
| **Health check** | — | `health`, `validate`, `doctor` |
| **Generate reports** | — | `report`, `analytics` |
| **Install skills** | — | `skill:install` |
| **Publish agents** | — | `publish-agent` |
| **View capabilities** | framework-help | `capabilities` |

MCP servers = runtime tools (analyze, lint, scan, orchestrate while coding)
CLI commands = framework management (install, configure, report, publish)

## Quick Decision Guide

| User Says | Run |
|----------|-----|
| "Is StringRay set up?" | `npx strray-ai health` |
| "Fix StringRay" | `npx strray-ai fix` |
| "What can StringRay do?" | `npx strray-ai capabilities` |
| "How are agents performing?" | `npx strray-ai report --type agent-usage` |
| "Install the X skill pack" | `npx strray-ai skill:install <name>` |
| "What skills are installed?" | `npx strray-ai antigravity status` |
| "Publish agent X" | `npx strray-ai publish-agent --agent X` |
| "Set up MCP in Hermes" | Add config to `~/.hermes/config.yaml` (see above) |

## Native Hermes Plugin

StringRay ships a native Hermes Agent plugin (`src/integrations/hermes-agent/`) that provides:

**3 Tools:**
| Tool | Purpose |
|------|---------|
| `strray_validate` | Pre-commit validation on files — codex, rules, quality gates |
| `strray_codex_check` | Validate code against the 60-term Universal Development Codex |
| `strray_health` | Framework health check — version, agents, MCP status |

**2 Hooks:**
| Hook | Purpose |
|------|---------|
| `pre_tool_call` | Tracks stats, nudges when native tools used instead of StringRay MCP equivalents |
| `post_tool_call` | Logs tool usage, tracks file operations for enforcement context |

**Slash Command:**
- `/strray status` — Plugin and MCP health
- `/strray stats` — Session tool usage statistics
- `/strray help` — Show available commands

**Install:**
```bash
# Copy plugin to Hermes plugins directory
cp -r src/integrations/hermes-agent ~/.hermes/plugins/strray-hermes/
# Restart Hermes — plugin auto-loads
```

The plugin works alongside the MCP servers. The MCP servers provide deep analysis tools (linting, security scanning, architecture assessment, orchestration), while the native plugin provides quick CLI-based health/validate/codex tools and enforcement hooks.

## Pitfalls

- `install` is heavyweight — detects and may install OpenCode. Use `init` for config-only.
- `report` goes to stdout. Use `-o <file>` to save to disk.
- `skill:install` with a GitHub URL clones the repo. Requires network.
- Some commands look for `.opencode/` in CWD. Run from project root.
- `publish-agent` requires AgentStore auth. Fails silently without it.
- Orchestrator MCP server path is nested: `dist/mcps/orchestrator/server.js` (not `orchestrator.server.js`).
- Use absolute paths in MCP args if Hermes CWD differs from project root.
- Increase timeout to 60s for orchestrator and researcher — they do heavier analysis.
- Plugin hooks use `logger.info` for nudges — these show as `[strray] Tip: ...` in Hermes logs.
- `strray_codex_check` with `code` parameter does lightweight local check. For full validation, use MCP server `mcp_strray_enforcer_codex_enforcement`.
