# 0xRay — Multi-Agent Orchestration & Governance Framework

**v1.22.68** — 41 MCP servers · 44 skills · 60 codex terms · 2,229 tests

0xRay extends [OpenCode](https://opencode.ai), [Hermes Agent](https://github.com/nilslice/hermes), [OpenClaw](https://github.com/openclaw/openclaw), and [Grok Build](https://x.ai/build) with multi-agent orchestration and Codex compliance validation via 41 MCP servers. Tasks route to specialized agents based on complexity with governance enforcement.

## Quick Start

```bash
npm install strray-ai

npx strray-ai --help
npx strray-ai opencode install        # Install OpenCode plugin (agents, hooks, config)
npx strray-ai grok install           # Install Grok CLI plugin
npx strray-ai hermes install         # Install Hermes Agent plugin
npx strray-ai openclaw install       # Configure OpenClaw integration
```

### Standalone Mode

For use with Hermes Agent, Grok Build, or any MCP-compatible runtime without OpenCode:

```bash
npx strray-ai install --standalone
```

This installs only the MCP servers.

## Features

- **41 Specialized MCP Servers** — Autonomous agents that read/write code, run commands, and enforce compliance
- **Codex Enforcement** — Universal Development Codex (60 terms) across core, architecture, testing, performance, security, operations, governance
- **44 Framework Skills** + 10 curated community sources (170+ additional skills available)
- **Complexity-Based Routing** — Intelligent task delegation based on complexity scoring
- **Skills Registry** — Browse and install community skills from GitHub repos
- **Webhook Integration** — GitHub, GitLab, Bitbucket, Stripe
- **Standalone MCP Servers** — Works with Hermes Agent, Grok Build, or any MCP-compatible runtime
- **OpenClaw Integration** — WebSocket bridge to OpenClaw gateway for chat orchestration

### Who is it for?

- **Developers** using OpenCode, Hermes, Grok Build, or any MCP-compatible runtime
- **Teams** needing consistent code quality and error prevention
- **Enterprises** requiring security, compliance, and audit capabilities

## Usage

```bash
# System design
@architect design database schema for e-commerce

# Code review
@code-reviewer review authentication module

# Security audit
@security-auditor scan for vulnerabilities

# Testing
@testing-lead create tests for payment system
```

## 🤖 Available Agents

| Agent | Purpose | Status |
|-------|---------|--------|
| architect | System design & technical decisions | Active |
| security-auditor | Vulnerability detection | Active |
| code-reviewer | Quality assessment | Active |
| refactorer | Technical debt elimination | Active |
| testing-lead | Testing strategy & coverage | Active |
| bug-triage-specialist | Error investigation | Active |
| researcher | Codebase exploration | Active |

[View all 42 agents →](AGENTS.md)

## MCP Server Ecosystem

0xRay exposes 41 MCP servers that work across runtimes. Key servers include:

| MCP Server | Tools | Purpose |
|-----------|-------|---------|
| `strray-researcher` | search_codebase, find_implementation, get_documentation | Codebase search & documentation |
| `strray-orchestrator` | orchestrate_task, analyze_complexity, get_orchestration_status | Multi-agent task planning |
| `strray-enforcer` | rule_validation, codex_enforcement, quality_gate_check | Codex compliance & quality gates |
| `strray-governance` | evaluate_proposal, get_governance_status | Dynamo Solar SSOT governance |
| `strray-security-scan` | security_scan, dependency_audit | Vulnerability scanning |
| `strray-architect-tools` | codebase_structure, dependency_analysis, architecture_assessment | Architecture analysis |
| `strray-lint` | lint, lint_check | ESLint validation |
| `strray-auto-format` | auto_format, format_check | Code formatting |
| `strray-state-manager` | get_state, set_state, delete_state, list_state | Persistent state |

## 🛡️ Governance System

0xRay ships a governance engine operating at two levels:

**Framework-level** (inference cycle, MCP):
- Dynamo Solar SSOT: Multi-factor decision matrix (resonance, isotopic ratio, vortex volume, historical coherence, solar activity)
- Pure MCP transport — real proposal voting with researcher deliberation
- CodexPolicyService — single source of truth for Codex loading
- PreToolUse hooks enforce Codex before code changes

**Project-level** (pre-commit, PreToolUse hooks):
- Quality gates
- Pre-commit validation
- Custom policy integration

### Tuning

| Parameter | Default | Effect |
|-----------|---------|--------|
| PHI weight | 1.666 | Proposal resonance sensitivity |
| TAU weight | 0.865 | Temporal coherence threshold |
| Min resonance | 0.70 | Minimum vote to proceed |
| Codex strictness | standard | `standard` / `strict` / `lenient` |

## 📦 OpenClaw Integration

0xRay integrates with **OpenClaw** — a self-hosted AI gateway connecting messaging platforms (WhatsApp, Telegram, Discord, Slack) to AI coding agents.

- **WebSocket Connection**: Connect to OpenClaw Gateway at `ws://127.0.0.1:18789`
- **Skill Invocation**: OpenClaw skills invoke 0xRay agents via HTTP API (port 18431)
- **Tool Events**: Forward tool events to OpenClaw for real-time tracking
- **Offline Buffering**: Events queued when disconnected, sent on reconnect

## 🎯 Skills

0xRay ships with **44 framework skills** and provides a registry of **10 curated community sources** with 170+ additional skills.

```bash
# Show starter packs and available sources
npx strray-ai skill:install

# Install a specific source
npx strray-ai skill:install agency-agents
npx strray-ai skill:install superpowers
npx strray-ai skill:install anthropic-skills
```

### Skills Registry

| Source | Skills | License | Description |
|--------|--------|---------|-------------|
| [agency-agents](https://github.com/msitarzewski/agency-agents) | 170+ | MIT | AI agency agent definitions |
| [superpowers](https://github.com/obra/superpowers) | 14 | MIT | TDD, debugging, code review workflows |
| [anthropic-skills](https://github.com/anthropics/skills) | 10+ | MIT | Official Anthropic Claude Code skills |
| [antigravity](https://github.com/sickn33/antigravity-awesome-skills) | 1300+ | MIT | Curated community skills |
| [impeccable](https://github.com/pbakaus/impeccable) | 1 | Apache 2.0 | AI frontend design language |
| [minimax](https://github.com/MiniMax-AI/skills) | 20+ | MIT | Frontend, mobile, shader skills |
| [gemini-skills](https://github.com/google-gemini/gemini-skills) | 10+ | Apache 2.0 | Official Google Gemini skills |
| [ai-web3-security](https://github.com/pashov/ai-web3-security) | 10+ | MIT | Web3 security auditing |
| [vuejs-nuxt](https://github.com/robert-zaremba/ai-agent-skills) | 5+ | MIT | Vue.js 3, Nuxt 4+ skills |
| [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 1 | MIT | Professional UI/UX design |

## 📁 Project Structure

```
stringray/
├── src/
│   ├── __tests__/              # Test suites
│   ├── agents/                 # Agent implementations
│   ├── analytics/              # Pattern analysis & learning
│   ├── cli/                    # CLI commands
│   ├── core/                   # Core framework
│   ├── enforcement/            # Codex enforcement
│   ├── integrations/           # External integrations
│   │   ├── base/               # BaseIntegration framework
│   │   └── openclaw/           # OpenClaw integration
│   ├── mcps/                   # MCP server implementations
│   ├── orchestrator/           # Multi-agent orchestration
│   ├── governance/             # Governance engine
│   ├── plugins/                # Plugin system
│   ├── reporting/              # Report generation
│   └── security/               # Security systems
├── docs/
│   ├── reflections/            # Deep technical reflections
│   └── research/               # Research documents
├── .strray/config/             # Framework configuration
│   └── features.json           # Feature flags
├── .opencode/                  # OpenCode configuration
│   ├── agents/                 # Agent configs
│   └── strray/                 # Codex & config
└── scripts/                    # Build & utility scripts
```

## ⚙️ Configuration

Configuration lives in `.strray/config/`:

```json
{
  "token_optimization": {
    "enabled": true,
    "max_context_tokens": 16000,
    "compression_enabled": true
  },
  "model_routing": { "enabled": true },
  "multi_agent_orchestration": { "enabled": true },
  "security": {
    "codex_enforcement": true,
    "codex_strictness": "standard"
  }
}
```

### Feature Flags

Edit `.strray/config/features.json` to toggle features:

| Feature | Default | Description |
|---------|---------|-------------|
| token_optimization | enabled | Context token management |
| model_routing | enabled | AI model routing |
| batch_operations | enabled | File batch processing |
| multi_agent_orchestration | enabled | Agent coordination |
| autonomous_reporting | disabled | Automatic reporting |
| activity_logging | enabled | Activity logging |
| security.codex_enforcement | true | Codex compliance |
| performance_monitoring | enabled | Performance tracking |

### Token Management

```json
{
  "token_optimization": {
    "max_context_tokens": 20000,
    "warning_threshold": 15000,
    "compression_enabled": true
  }
}
```

### Version Pinning

```json
{
  "version_pinning": {
    "strray_ai": "^1.22.0",
    "opencode": "^2.14.0",
    "skills": { "antigravity": "latest", "impeccable": "latest" }
  }
}
```

## 🔧 CLI Tools

```bash
# Core commands
npx strray-ai status              # Check configuration
npx strray-ai validate            # Validate installation
npx strray-ai capabilities       # Show all features
npx strray-ai health             # Health check
npx strray-ai report             # Generate reports

# Skills management
npx strray-ai skill:install              # Show starter packs
npx strray-ai skill:registry list        # Show all registry sources
npx strray-ai antigravity status         # Show installed skills

# Agent management
npx strray-ai publish-agent --agent orchestrator

# Integration installs
npx strray-ai opencode install          # Install OpenCode plugin
npx strray-ai grok install              # Install Grok CLI plugin
npx strray-ai hermes install            # Install Hermes Agent plugin
npx strray-ai openclaw install          # Configure OpenClaw integration

# Configuration
npx strray-ai config get --feature <name>
npx strray-ai config set --feature <name> --value <val>
```

## 🧪 Testing

```bash
npm test                          # Run all tests
npm run test:unit                 # Unit tests
npm run test:comprehensive        # Full suite
npm run test:pipelines            # Pipeline integration tests
npm run typecheck                 # TypeScript checks
```

## 🔌 Framework Integration

```typescript
import { StringRayIntegration } from 'strray-ai/integration';

const integration = new StringRayIntegration(postProcessor);

// Express
app.use('/webhooks', integration.getWebhookApp());
app.use('/api/post-process', integration.getAPIApp());
```

**Supported Webhooks:** GitHub, GitLab, Bitbucket, Stripe

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| [Agent Configuration](docs/AGENT_CONFIG.md) | Agent setup |
| [Configuration Reference](docs/CONFIGURATION.md) | Complete settings |
| [Agent Documentation](AGENTS.md) | Agent specifications |
| [Universal Codex](.opencode/strray/codex.json) | 60-term codex |

## ⚡ OpenCode Integration

0xRay extends OpenCode with agents, Codex enforcement, skills, and governance hooks:

```bash
npx strray-ai opencode install
```

- 42 agent configurations for autonomous task handling
- Codex enforcement with 60 error-prevention terms
- 44 framework skills + 10 community sources
- Pre/post processing hooks for quality gates
- MCP server discovery from `.opencode/` config

## 💬 Grok CLI Integration (First-Class)

0xRay is a first-class plugin in Grok CLI:

```bash
npx strray-ai grok install
```

- Full plugin with PreToolUse governance hooks
- `.mcp.json` registration for `strray-governance` + `strray-skills`
- Real Dynamo Solar SSOT governance inside Grok sessions

## 🎯 Hermes Agent Integration

0xRay installs as a native Hermes Agent plugin with validation tools and quality gates:

```bash
npx strray-ai hermes install
```

- `strray_validate` — Pre-commit validation with quality gates
- `strray_codex_check` — Code review against 60 Codex rules
- `strray_health` — Framework health check
- `strray_hooks` — Git hooks management
- `pre_tool_call` / `post_tool_call` hooks for tool awareness

0xRay's MCP servers also work as native tools. Add entries to `~/.hermes/config.yaml` to connect all 10+ MCP servers.

## 🌐 OpenClaw Integration

0xRay connects to OpenClaw Gateway for chat platform orchestration:

```bash
npx strray-ai openclaw install
```

Creates `.strray/config/openclaw.json` with WebSocket gateway, API server, and tool hooks configuration.

## 🙏 Support

If 0xRay helps you build better software:

- ⭐ **Star the repo** on [GitHub](https://github.com/htafolla/stringray)
- 🐛 **Report issues** at [github.com/htafolla/stringray/issues](https://github.com/htafolla/stringray/issues)

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
