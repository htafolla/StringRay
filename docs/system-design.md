# 0xRay System Design

**Version**: 1.22.61

---

## What is 0xRay?

A self-healing AI governance OS - an orchestration framework that:

1. **Intercepts prompts (Plugin)** → Injects Codex rules before AI responds
2. **Routes tasks** to specialized agents based on complexity
3. **Enforces compliance** via 60 codex rules
4. **Coordinates multi-agent** workflows with voting/delegation
5. **Processes code** via pre/post pipeline hooks

### What It Actually Does

| Hook | Function |
|------|----------|
| Plugin | Captures every prompt → validates against Codex → injects rules |
| MCP | Provides tools (lint, test, build, security) to Hermes |
| Processors | Run before/after commands → auto-fix, validate, version |
| Agents | 26 specialized AI workers (research, code, security, etc.) |

### Honest Assessment

It's a **belt-and-suspenders** system with:
- Multiple layers of validation (codex, validators, processors)
- Multiple agent types doing similar things
- Lots of guardsrails against bad AI outputs
- Self-repairing where it catches its own mistakes

**The core truth:** It exists because AI code often needs fixing, so we built a system that tries to catch and fix issues before they ship.

### How It Relates to Other Tools

```
┌──────────┬──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│ Tool     │ What It Is                                   │ What 0xRay Does                              │
├──────────┼──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ OpenCode │ AI coding assistant (Electron app)           │ 0xRay runs AS plugin inside it               │
│ Hermes   │ Another AI agent                             │ 0xRay provides MCP tools TO it               │
│ OpenClaw │ Messaging gateway (WhatsApp, Telegram)   │ 0xRay connects TO it via WebSocket          │
└──────────┴──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

**0xRay is NOT a competitor — it's a layer on top:**

```
              0xRay = Governance + Orchestration + Compliance

                          ↓
             ┌────────────┼────────────┐
             ▼            ▼            ▼
       OpenCode      Hermes       OpenClaw
      (plugin)       (MCP)         (WS)
```

Without hosts (OpenCode/Hermes/OpenClaw), 0xRay is just code. It's middleware, not the main thing.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 ENTRY POINTS                                 │
├──────────────────────┬──────────────────────────────┬───────────────────────┤
│ CLI (src/cli/)       │ Plugin (OpenCode)            │ MCP (Hermes)          │
│ - commands           │ strray-codex-injection       │ 14+ servers           │
│ - index.ts           │                             │ for agents            │
└──────────────────────┴──────────────────────────────┴───────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 CORE (src/core/)                             │
│                                                                              │
│ boot-orchestrator  →  kernel Patterns  →  Codex                              │
│ context-loader     →  config-loader    →  Injector                           │
│ activity-logger   →  framework-logger  →  Model router                      │
└──────────────────────────────────────────────────────────────────────────────┘
                  │                        │                        │
                  ▼                        ▼                        ▼
┌─────────────────────────────┬─────────────────────────────┬─────────────────────────────┐
│         AGENTS              │          SKILLS             │        PROCESSORS           │
│       (26 agents)           │        (43 skills)          │        (16 procs)          │
│                             │                             │                             │
│ - architect                │ - api-design                │ - processor-              │
│ - researcher              │ - researcher              │   manager                 │
│ - security                │ - code-review              │ - typescript              │
│ - code-review             │ - boot-orchestrator        │ - versioning             │
│ - refactorer             │ - security                │ - test-auto-creation     │
│ - testing-lead           │ - enforcer                │ - codex-validation       │
│ - bug-triage              │ - etc.                    │ - console-log-guard      │
└─────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
                  │                        │                        │
                  ▼                        ▼                        ▼
┌─────────────────────────────┬─────────────────────────────┬─────────────────────────────┐
│       DELEGATION            │        INTEGRATIONS         │        ENFORCEMENT          │
│                             │                             │                             │
│ - agent-delegator           │ - OpenClaw                 │ - rule-enforcer           │
│ - voting-coordinator        │ - Hermes                  │ - validators             │
│ - complexity-analyzer     │ - plugins                 │ - code-quality            │
│ - task-skill-router       │ - cross-language           │ - session-security       │
└─────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

## Module Summary

| Module | Count | Files |
|--------|-------|-------|
| Core | 20 | boot-orchestrator, kernel, codex, context... |
| Agents | 28 | architect, researcher, security... |
| Skills | 44 | api-design, boot-orchestrator... |
| MCPs | 15 | framework-help, lint, test... |
| Processors | 16 | processor-manager, typescript... |

## How Community Extensions Fit

```
┌─────────────────────────────────────────┐
│            0xRay (Governance)           │
├─────────────────────────────────────────┤
│  Core: Codex, Agents, Skills, Processors│
│  + Community Extensions                 │
└─────────────────────────────────────────┘
         ↑                    ↑
    ┌────┴────┐       ┌────┴────┐
    │ Skills  │       │  MCPs  │
    │ Registry│       │ Registry│
    ├─────────┤       ├─────────┤
    │ antigrav│       │ xmcp   │
    │ 1300+   │       │ X API  │
    ├─────────┤       ├─────────┤
    │ agency  │       │github-mcp│
    │ 170+    │       │GitHub  │
    ├─────────┤       ├─────────┤
    │ builtin │       │builtin  │
    │   43    │       │   14    │
    └─────────┘       └─────────┘
```

## Commands

### MCP Commands (Community MCPs)

```bash
# List available MCPs
npx strray-ai mcp-list

# Install an MCP
npx strray-ai mcp-install xmcp

# Show installed MCPs
npx strray-ai mcp-status

# Remove an MCP
npx strray-ai mcp-remove xmcp
```

**Note:** If colon commands (`mcp:list`) don't work on your setup, use hyphen format (`mcp-list`).

### Setup After Install

1. **Configure env vars:**
   ```bash
   export X_BEARER_TOKEN=your_token
   # or
   export GITHUB_TOKEN=ghp_xxx
   ```

2. **Add to your MCP client** (Claude Desktop, Cursor, etc.)

3. **Start the MCP:**
   ```bash
   cd .opencode/mcps/xmcp
   npm install
   npm start
   ```

4. **Restart your MCP client** to load the new server

### Skill Commands