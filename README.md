# ⚡ StringRay AI

**Enterprise AI Orchestration Framework for OpenCode/Claude Code**

[![Version](https://img.shields.io/badge/version-1.14.10-blue?style=flat-square)](https://npmjs.com/package/strray-ai)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-2368%20passed-brightgreen?style=flat-square)](src/__tests__)
[![GitHub stars](https://img.shields.io/github/stars/htafolla/stringray?style=social)](https://github.com/htafolla/stringray)

> **Intelligent Multi-Agent Coordination with 99.6% Systematic Error Prevention**

StringRay extends OpenCode/Claude Code with intelligent multi-agent orchestration, Codex compliance validation, and enterprise-grade security. It automatically routes tasks to specialized agents based on complexity and provides systematic error prevention.

## What is StringRay?

StringRay is a **one-command level-up** for OpenCode. Instead of installing OpenCode first, then adding StringRay, just run:

```bash
npx strray-ai install
```

This single command:
1. Detects if OpenCode is installed
2. Auto-installs OpenCode if missing
3. Layers on the full StringRay kernel (Codex, orchestrator, enforcer, processors, MCP, reflections)
4. Installs 30 framework skills
5. Sets up the skills registry with 10 curated community sources
6. Adds CLI commands for agent publishing, skills management, and status

**Goal:** Any developer can run one command and instantly get a production-grade, governed agent runtime.

### Who is it for?

- **Developers** using OpenCode or Claude Code who want AI-assisted development
- **Teams** needing consistent code quality and error prevention
- **Enterprises** requiring security, compliance, and audit capabilities

## 🚀 Quick Start

```bash
# Install StringRay (auto-configures OpenCode on install)
npm install strray-ai

# That's it! StringRay is now active.
# Restart OpenCode/Claude Code to load the plugin.
```

**What happens during install?**
- Copies OpenCode configuration files to your project
- Configures 26 agents with proper capabilities
- Sets up Codex enforcement rules
- Enables webhook triggers for CI/CD integration
- Ready to use with Claude Code immediately

## ✨ Features

- **🤖 26 Specialized Agents** - Autonomous agents that read/write code, run commands, and enforce compliance
- **📏 99.6% Error Prevention** - Universal Development Codex (60 terms)
- **⚡ 43 Framework Skills** + 10 curated community sources (170+ additional skills available)
- **🛡️ Enterprise Security** - Comprehensive validation and scanning
- **📦 Skills Registry** - Browse and install community skills from GitHub repos
- **🔄 Complexity-Based Routing** - Intelligent task delegation
- **🔌 Webhook Integration** - GitHub, GitLab, Bitbucket, Stripe
- **✅ 2368 Tests** - Production-ready with comprehensive test coverage

## 🤖 Available Agents

| Agent | Purpose |
|-------|---------|
| `@enforcer` | Codex compliance & error prevention |
| `@orchestrator` | Complex multi-step task coordination |
| `@architect` | System design & technical decisions |
| `@security-auditor` | Vulnerability detection |
| `@code-reviewer` | Quality assessment |
| `@refactorer` | Technical debt elimination |
| `@testing-lead` | Testing strategy & coverage |
| `@bug-triage-specialist` | Error investigation |
| `@researcher` | Codebase exploration |

> **Note:** StringRay auto-configures all agents during installation. To customize agent settings, see the [Agent Configuration Guide](https://github.com/htafolla/stringray/blob/main/docs/AGENT_CONFIG.md).

[View all 26 agents →](https://github.com/htafolla/stringray/blob/main/AGENTS.md)

## 📦 OpenClaw Integration

StringRay integrates with **OpenClaw** - a self-hosted AI gateway that connects messaging platforms (WhatsApp, Telegram, Discord, Slack) to AI coding agents.

### What It Does

- **WebSocket Connection**: Connect to OpenClaw Gateway at `ws://127.0.0.1:18789`
- **Skill Invocation**: OpenClaw skills invoke StringRay agents via HTTP API (port 18431)
- **Tool Events**: Forward tool.before/tool.after events to OpenClaw for real-time tracking
- **Offline Buffering**: Events queued when disconnected, sent on reconnect

### Quick Setup

```bash
# Configure in .opencode/openclaw/config.json
{
  "gatewayUrl": "ws://127.0.0.1:18789",
  "authToken": "your-device-token",
  "deviceId": "your-device-id",
  "apiServer": { "enabled": true, "port": 18431 },
  "hooks": { "enabled": true, "toolBefore": true, "toolAfter": true }
}

# Initialize in code
import { initializeOpenClawIntegration } from 'strray-ai';
const integration = await initializeOpenClawIntegration();
```

See [OpenClaw Integration Guide](src/integrations/openclaw/README.md) for details.

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| [Agent Configuration](https://github.com/htafolla/stringray/blob/main/docs/AGENT_CONFIG.md) | Copy-paste opencode.json agent setup |
| [Configuration Reference](https://github.com/htafolla/stringray/blob/main/docs/CONFIGURATION.md) | Complete features.json settings |
| [Agent Documentation](https://github.com/htafolla/stringray/blob/main/AGENTS.md) | Detailed agent specifications |
| [Universal Codex](https://github.com/htafolla/stringray/blob/main/.opencode/strray/codex.json) | 60-term codex reference |
| [Troubleshooting](https://github.com/htafolla/stringray/blob/main/docs/TROUBLESHOOTING.md) | Common issues & solutions |

## 🔧 CLI Tools

StringRay provides CLI utilities for managing and monitoring your installation:

```bash
# Core commands
npx strray-ai status              # Check configuration and plugin status
npx strray-ai validate            # Validate installation and dependencies
npx strray-ai capabilities       # Show all available features
npx strray-ai health             # Run health check on framework components
npx strray-ai report             # Generate usage and performance reports

# Agent management
npx strray-ai publish-agent --agent orchestrator  # Package agent for AgentStore

# Skills management
npx strray-ai skill:install              # Show starter packs + available sources
npx strray-ai skill:install agency-agents  # Install from registry (auto-detects format)
npx strray-ai skill:install <github-url>  # Install from any repo
npx strray-ai skill:registry list      # Show all registry sources
npx strray-ai antigravity status       # Show installed skills with licenses
```

**Note:** Installation is automatic via `npm install strray-ai`. The postinstall hook configures everything automatically.

## ⚙️ Configuration

### Default Configuration

StringRay works out of the box with sensible defaults. The npm postinstall hook automatically sets up:

```
.opencode/
├── agents/         # 24+ agent configurations
├── skills/         # Framework skills
├── strray/
│   ├── codex.json      # Codex rules
│   ├── features.json   # Feature flags
│   └── config.json    # Token/memory management
└── hooks/          # Pre/post processing hooks
```

### Customizing Agents

Edit `.opencode/agents/` to customize agent behavior:

```yaml
# Example: Customize enforcer agent
name: enforcer
maxComplexity: 40  # Only handle simple tasks
temperature: 0.2   # More precise responses
enabled: true
```

### Feature Flags

Edit `.opencode/strray/features.json` to enable/disable features:

```json
{
  "codexEnforcement": true,
  "agentGovernance": true,
  "analytics": true,
  "webhooks": true
}
```

### Token Management

Edit `.opencode/strray/config.json` to adjust token limits:

```json
{
  "token_management": {
    "maxPromptTokens": 20000,
    "warningThreshold": 15000
  }
}
```

See [Configuration Reference](https://github.com/htafolla/stringray/blob/main/docs/CONFIGURATION.md) for full options.

### Version Pinning

StringRay supports pinning versions for reproducible installations:

```json
{
  "version_pinning": {
    "strray_ai": "^1.15.0",
    "opencode": "^2.14.0",
    "skills": {
      "antigravity": "latest",
      "impeccable": "latest",
      "openviking": "latest",
      "claude_seo": "latest"
    }
  }
}
```

Add to `.opencode/strray/features.json` to pin specific versions.

## 📁 Project Structure

```
stringray/
├── src/
│   ├── __tests__/              # Test suites (unit, integration, performance)
│   ├── agents/                 # Agent implementations
│   ├── analytics/              # Pattern analysis & learning
│   ├── cli/                    # CLI commands
│   ├── circuit-breaker/        # Resilience patterns
│   ├── core/                   # Core framework
│   ├── delegation/             # Task routing & delegation
│   ├── enforcement/            # Codex enforcement
│   ├── infrastructure/         # IaC validation
│   ├── integrations/           # External integrations
│   │   ├── base/              # BaseIntegration framework
│   │   └── openclaw/          # OpenClaw integration
│   ├── mcps/                  # MCP server implementations
│   ├── monitoring/            # System monitoring
│   ├── orchestrator/          # Multi-agent orchestration
│   ├── performance/           # Performance optimization
│   ├── plugins/              # Plugin system
│   ├── postprocessor/         # Post-processing pipeline
│   ├── reporting/             # Report generation
│   ├── security/              # Security systems
│   ├── session/               # Session management
│   ├── test-utils/            # Test utilities and helpers
│   ├── validation/            # Agent config & estimation validators
│   └── jobs/                  # Background job management
├── .opencode/                 # OpenCode configuration
│   ├── agents/               # Agent configs (26 agents)
│   ├── strray/               # StringRay config
│   │   ├── codex.json        # 60-term development codex
│   │   ├── features.json     # Feature flags
│   │   └── config.json       # Token management
│   └── hooks/                # Git hooks
├── skills/                    # StringRay skills
├── docs/                      # Documentation
│   ├── reflections/          # Deep technical reflections
│   └── research/             # Research documents
└── scripts/                   # Build & utility scripts
```

## 💬 Usage

```bash
# Code quality enforcement
@enforcer analyze this code for issues

# Complex task orchestration  
@orchestrator implement user authentication system

# System design
@architect design database schema for e-commerce

# Security audit
@security-auditor scan for vulnerabilities
```

## 🔌 Framework Integration

StringRay integrates with your existing infrastructure via webhooks and APIs:

```bash
# CLI tool for integration
npx strray-integration --help
```

```typescript
// Programmatic integration
import { StringRayIntegration } from 'strray-ai/integration';

const postProcessor = new PostProcessor(stateManager);
const integration = new StringRayIntegration(postProcessor);

// Express
app.use('/webhooks', integration.getWebhookApp());
app.use('/api/post-process', integration.getAPIApp());

// Fastify
fastify.register(integration.getWebhookRouter(), { prefix: '/webhooks' });
fastify.register(integration.getAPIRouter(), { prefix: '/api/post-process' });
```

**Supported Webhooks:**
- GitHub (push, PR, issues)
- GitLab (push, merge requests)
- Bitbucket (push, pull requests)
- Stripe (subscriptions, payments)

## 🎯 Skills

StringRay ships with **30 framework skills** and provides a registry of **10 curated community sources** with 170+ additional skills.

### Skills Registry

Browse and install skills from verified GitHub repositories:

```bash
# Show starter packs and available sources
npx strray-ai skill:install

# Install a specific source
npx strray-ai skill:install agency-agents
npx strray-ai skill:install superpowers
npx strray-ai skill:install anthropic-skills

# Install from any GitHub repo (auto-detects format)
npx strray-ai skill:install https://github.com/user/skills-repo

# Manage the registry
npx strray-ai skill:registry list              # Show all sources
npx strray-ai skill:registry add --name X --url Y --desc "..." --license MIT
npx strray-ai skill:registry remove --name X
```

#### Starter Packs

| Pack | Sources | Skills | Best For |
|------|---------|--------|----------|
| **Minimal Viable Power** | superpowers, anthropic-skills | 20+ | Solo devs, quick setup |
| **Full Pro Setup** | + agency-agents, impeccable, minimax | 200+ | Professional development |
| **Agency/Team Mode** | + gemini-skills, ai-web3-security | 220+ | Teams, security audits |
| **Specialized** | + vuejs-nuxt, ui-ux-pro-max | 230+ | Nuxt/Vue, UI/UX work |

#### Registry Sources

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

### Impeccable - AI Frontend Design

[Impeccable](https://github.com/pbakaus/impeccable) is a design language skill that teaches AI coding assistants professional frontend design:

```bash
/audit           # Find issues
/critique       # UX design review
/polish          # Pre-ship refinement
/typeset         # Fix typography
/arrange         # Fix layout & spacing
```

### Framework Skills (30 Built-in)

StringRay includes 30 core skills for orchestration, compliance, architecture, and more — installed to `.opencode/skills/` automatically.

## License Information

All community skill sources are properly licensed. License files are in `licenses/skills/`:

| Source | License | File |
|--------|---------|------|
| agency-agents | MIT | `licenses/skills/LICENSE.agency-agents` |
| superpowers | MIT | `licenses/skills/LICENSE.superpowers` |
| anthropic-skills | MIT | `licenses/skills/LICENSE.anthropic-skills` |
| antigravity | MIT | `licenses/skills/LICENSE.antigravity` |
| impeccable | Apache 2.0 | `licenses/skills/LICENSE.impeccable` |
| minimax | MIT | `licenses/skills/LICENSE.minimax` |
| gemini-skills | Apache 2.0 | `licenses/skills/LICENSE.gemini-skills` |
| ai-web3-security | MIT | `licenses/skills/LICENSE.ai-web3-security` |
| vuejs-nuxt | MIT | `licenses/skills/LICENSE.vuejs-nuxt` |
| ui-ux-pro-max | MIT | `licenses/skills/LICENSE.ui-ux-pro-max` |

## 🙏 Support & Star

If StringRay helps you build better software, please consider:

- ⭐ **Starring the repo** on [GitHub](https://github.com/htafolla/stringray)
- 📢 **Sharing** with your team
- 🐛 **Reporting issues** at [github.com/htafolla/stringray/issues](https://github.com/htafolla/stringray/issues)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

*Built with precision for enterprise-grade AI orchestration*
