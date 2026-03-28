# Agent Configuration Guide

This guide explains how to configure agents in your `opencode.json` for StringRay v1.15.1.

---

## What's New in v1.15.1

StringRay v1.15.1 introduces a **Facade Pattern** architecture for improved maintainability and performance:

**Architecture Changes:**
- **87% Code Reduction**: 8,230 → 1,218 lines (3,170 lines dead code removed)
- **3 Facades**: RuleEnforcer, TaskSkillRouter, MCP Client - each with modular internal structure
- **100% Backward Compatible**: All existing agent configurations work without changes

**Key Improvements:**
- Better agent coordination performance
- More reliable multi-agent orchestration
- Cleaner internal APIs (facades hide complexity)
- Enhanced error handling and recovery

No migration needed - your existing `opencode.json` configuration continues to work exactly as before.

---

## Default Configuration

StringRay automatically configures these core agents when you install `strray-ai`. The postinstall script copies `opencode.json` to your project root with all agents enabled by default.

## Copy-Paste Agent Configuration

Add this section to your `opencode.json` to enable all 27 StringRay agents:

```json
"agent": {
  "enforcer": {
    "temperature": 1.0,
    "mode": "primary"
  },
  "architect": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "orchestrator": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "testing-lead": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "bug-triage-specialist": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "code-reviewer": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "security-auditor": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "refactorer": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "researcher": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "log-monitor": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "storyteller": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "strategist": {
    "temperature": 1.0,
    "mode": "subagent"
  },
  "frontend-engineer": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "backend-engineer": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "mobile-developer": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "database-engineer": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "devops-engineer": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "performance-engineer": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "seo-consultant": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "content-creator": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "growth-strategist": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "tech-writer": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "multimodal-looker": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "code-analyzer": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "documentation-writer": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "testing-strategy": {
    "temperature": 0.7,
    "mode": "subagent"
  }
}
```

## Agent Modes Explained

| Mode | Description |
|------|-------------|
| `primary` | The main agent that handles initial requests |
| `subagent` | Specialized agent invoked by other agents |

## Temperature Settings

| Value | Use Case |
|-------|----------|
| `0.0 - 0.3` | Precise, deterministic tasks (code review, security) |
| `0.4 - 0.7` | Balanced tasks (architecture, refactoring) |
| `0.8 - 1.0` | Creative/Exploratory tasks (new features, prototyping) |

## Core Agents (All 27)

These 25 agents form the complete StringRay framework v1.15.1:

### Primary Agent
| Agent | Purpose | Recommended Mode |
|-------|---------|------------------|
| `enforcer` | Codex compliance & error prevention | `primary` |

### Core Specialized Agents
| Agent | Purpose | Recommended Mode |
|-------|---------|------------------|
| `orchestrator` | Complex multi-step task coordination | `subagent` |
| `architect` | System design & technical decisions | `subagent` |
| `bug-triage-specialist` | Error investigation & debugging | `subagent` |
| `code-reviewer` | Quality assessment | `subagent` |
| `security-auditor` | Vulnerability detection | `subagent` |
| `refactorer` | Technical debt elimination | `subagent` |
| `testing-lead` | Testing strategy & coverage | `subagent` |
| `researcher` | Codebase exploration | `subagent` |
| `log-monitor` | Performance monitoring | `subagent` |
| `storyteller` | Narrative deep reflections | `subagent` |
| `strategist` | Strategic planning | `subagent` |

### Domain-Specific Agents
| Agent | Purpose |
|-------|---------|
| `frontend-engineer` | React, Vue, Angular development |
| `backend-engineer` | Node.js, Python, Go APIs |
| `mobile-developer` | iOS, Android, React Native, Flutter |
| `database-engineer` | Schema design, migrations |
| `devops-engineer` | CI/CD, containers, infrastructure |
| `performance-engineer` | Optimization, profiling |
| `seo-consultant` | SEO optimization |
| `content-creator` | Content optimization |
| `growth-strategist` | Marketing strategy |
| `tech-writer` | Technical docs |
| `multimodal-looker` | Image/video analysis |
| `code-analyzer` | Code analysis |
| `documentation-writer` | Documentation creation |
| `testing-strategy` | Test planning |

To enable specialized agents, add them to your `opencode.json`:

```json
"agent": {
  "frontend-engineer": {
    "temperature": 0.7,
    "mode": "subagent"
  },
  "mobile-developer": {
    "temperature": 0.7,
    "mode": "subagent"
  }
}
```

## Disabling Agents

To disable an agent, set `disable: true`:

```json
"agent": {
  "enforcer": {
    "disable": true
  }
}
```

## Full opencode.json Example

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/big-pickle",
  // NOTE: "plugin" array is for npm packages only (e.g., "my-plugin" or "@org/plugin")
  // For local plugins, place .js files in .opencode/plugin/ directory - OpenCode auto-loads them
  "mcp": {
    "enforcer": {
      "type": "local",
      "command": ["node", "./node_modules/strray-ai/dist/mcps/enforcer-tools.server.js"],
      "enabled": true
    },
    "orchestrator": {
      "type": "local",
      "command": ["node", "./node_modules/strray-ai/dist/mcps/orchestrator.server.js"],
      "enabled": true
    }
  },
  "agent": {
    "enforcer": {
      "temperature": 1.0,
      "mode": "primary"
    },
    "architect": {
      "temperature": 1.0,
      "mode": "subagent"
    },
    "orchestrator": {
      "temperature": 1.0,
      "mode": "subagent"
    },
    "testing-lead": {
      "temperature": 1.0,
      "mode": "subagent"
    },
    "bug-triage-specialist": {
      "temperature": 1.0,
      "mode": "subagent"
    },
    "code-reviewer": {
      "temperature": 1.0,
      "mode": "subagent"
    },
    "security-auditor": {
      "temperature": 1.0,
      "mode": "subagent"
    },
    "refactorer": {
      "temperature": 1.0,
      "mode": "subagent"
    },
    "researcher": {
      "temperature": 1.0,
      "mode": "subagent"
    },
    "log-monitor": {
      "temperature": 1.0,
      "mode": "subagent"
    }
  }
}
```

## Architecture Notes (v1.15.1 Facade Pattern)

StringRay v1.15.1 uses a **Facade Pattern** architecture:

### Facade Benefits
- **Simplified Configuration**: Clean APIs hide internal complexity
- **Better Coordination**: Improved multi-agent orchestration performance
- **Reliability**: Enhanced error handling and recovery
- **Maintainability**: Changes are localized to specific facade modules

### Key Facades Affecting Agent Configuration
- **RuleEnforcer Facade** (416 lines): Manages codex compliance and enforcement rules
- **TaskSkillRouter Facade** (490 lines): Handles task routing to appropriate agents
- **MCP Client Facade** (312 lines): Manages MCP server communication

All facades expose clean configuration interfaces that work seamlessly with your `opencode.json` settings.

## Next Steps

- [View Agent Documentation](AGENTS.md) - Detailed agent capabilities
- [Configuration Reference](CONFIGURATION.md) - Full features.json settings
- [Universal Codex](.opencode/strray/codex.json) - 60-term codex reference

---

**Version:** 1.9.0  
**Architecture:** Facade Pattern (87% code reduction)  
**Agents:** N specialized agents  
**Last Updated:** 2026-03-12
