# StringRay Configuration Guide

Complete configuration reference for the StringRay AI Framework v1.15.1.

## Overview

StringRay uses a hierarchical configuration system:
1. **Default config** - Built into the framework
2. **Project config** - `.opencode/strray/features.json` in project root
3. **User config** - `~/.opencode/strray/config.json` (user-level overrides)

Configuration is loaded in order of priority: default < project < user.

---

## What's New in v1.15.1

### Facade Pattern Architecture

StringRay v1.15.1 introduces a modern **Facade Pattern** architecture with modular internal structure:

**Key Improvements:**
- **87% Code Reduction**: 8,230 → 1,218 lines (3,170 lines of dead code removed)
- **Modular Design**: Clean APIs with focused internal modules
- **Better Performance**: Faster routing and agent coordination
- **100% Backward Compatible**: All existing configurations work without changes

**Facade Components:**
- **RuleEnforcer Facade**: 416 lines (was 2,714) - 6 internal modules
- **TaskSkillRouter Facade**: 490 lines (was 1,933) - 12 mapping + analytics + routing modules  
- **MCP Client Facade**: 312 lines (was 1,413) - 8 internal modules

No migration needed - your existing `.opencode/strray/features.json` and other config files continue to work exactly as before.

---

## features.json Reference

Create `.opencode/strray/features.json` in your project root:

```json
{
  "version": "1.15.11",
  "description": "StringRay Framework Configuration",
  
  "token_optimization": {
    "enabled": true,
    "max_context_tokens": 50000,
    "prune_after_task": true,
    "summarize_tool_outputs": true,
    "context_compression": {
      "enabled": true,
      "threshold_tokens": 40000,
      "compression_ratio": 0.5
    }
  },

  "model_routing": {
    "enabled": true,
    "default_model": "claude-sonnet-4",
    "fallback_model": "claude-haiku-4",
    "task_routing": {
      "file_read": {
        "model": "claude-haiku-4",
        "max_tokens": 1000,
        "description": "Simple file reading operations"
      },
      "grep_search": {
        "model": "claude-haiku-4",
        "max_tokens": 500,
        "description": "Pattern matching and search"
      },
      "simple_edit": {
        "model": "claude-haiku-4",
        "max_tokens": 2000,
        "description": "Single-line or simple multi-line edits"
      },
      "bulk_refactor": {
        "model": "claude-sonnet-4",
        "max_tokens": 8000,
        "description": "Multi-file refactoring operations"
      },
      "architecture_review": {
        "model": "claude-opus-4",
        "max_tokens": 16000,
        "description": "Complex architectural analysis"
      },
      "security_audit": {
        "model": "claude-opus-4",
        "max_tokens": 16000,
        "description": "Security vulnerability analysis"
      },
      "git_operations": {
        "model": "claude-haiku-4",
        "max_tokens": 1000,
        "description": "Git commands and status checks"
      },
      "documentation": {
        "model": "claude-sonnet-4",
        "max_tokens": 4000,
        "description": "Documentation generation and updates"
      },
      "code_generation": {
        "model": "claude-sonnet-4",
        "max_tokens": 8000,
        "description": "New code implementation"
      },
      "debugging": {
        "model": "claude-sonnet-4",
        "max_tokens": 8000,
        "description": "Error analysis and fixes"
      }
    }
  },

  "batch_operations": {
    "enabled": true,
    "prefer_sed_for_replacements": true,
    "parallel_file_updates": true,
    "max_concurrent_edits": 10,
    "auto_batch_threshold": 5
  },

  "multi_agent_orchestration": {
    "enabled": true,
    "coordination_model": "async-multi-agent",
    "max_concurrent_agents": 8,
    "task_distribution_strategy": "capability-based",
    "conflict_resolution": "expert-priority",
    "progress_tracking": true,
    "session_persistence": true
  },

  "autonomous_reporting": {
    "enabled": false,
    "interval_minutes": 60,
    "auto_schedule": false,
    "include_health_assessment": true,
    "include_agent_activities": true,
    "include_pipeline_operations": true,
    "include_critical_issues": true,
    "include_recommendations": true,
    "report_retention_days": 30,
    "notification_channels": ["console"]
  },

  "agent_management": {
    "disabled_agents": [],
    "agent_models": {
      "enforcer": "claude-sonnet-4",
      "architect": "claude-opus-4",
      "orchestrator": "claude-sonnet-4",
      "bug-triage-specialist": "claude-sonnet-4",
      "code-reviewer": "claude-sonnet-4",
      "security-auditor": "claude-opus-4",
      "refactorer": "claude-sonnet-4",
      "testing-lead": "claude-sonnet-4",
      "researcher": "claude-sonnet-4",
      "storyteller": "claude-sonnet-4",
      "strategist": "claude-sonnet-4",
      "log-monitor": "claude-sonnet-4",
      "frontend-engineer": "claude-sonnet-4",
      "backend-engineer": "claude-sonnet-4",
      "mobile-developer": "claude-sonnet-4",
      "database-engineer": "claude-sonnet-4",
      "devops-engineer": "claude-sonnet-4",
      "performance-engineer": "claude-sonnet-4",
      "seo-consultant": "claude-sonnet-4",
      "content-creator": "claude-sonnet-4",
      "growth-strategist": "claude-sonnet-4",
      "tech-writer": "claude-sonnet-4",
      "multimodal-looker": "claude-sonnet-4",
      "code-analyzer": "claude-sonnet-4"
    },
    "performance_limits": {
      "max_task_duration_ms": 30000,
      "max_memory_usage_mb": 512,
      "max_tokens_per_request": 16000
    }
  },

  "refactoring": {
    "enabled": true,
    "automatic_detection": true,
    "require_user_approval": false,
    "max_complexity_threshold": 80,
    "safe_mode": true,
    "batch_mode": true
  },

  "activity_logging": {
    "enabled": true,
    "level": "info",
    "include_performance_metrics": true,
    "include_agent_states": true,
    "include_token_usage": true,
    "retention_days": 7,
    "log_to_file": true,
    "log_path": ".opencode/logs"
  },

  "security": {
    "enabled": true,
    "prompt_sanitization": true,
    "vulnerability_scanning": true,
    "code_review_enforcement": true,
    "security_score_threshold": 70
  },

  "performance_monitoring": {
    "enabled": true,
    "real_time_metrics": true,
    "benchmark_tracking": true,
    "token_tracking": true,
    "cost_tracking": true,
    "alerting": {
      "enabled": true,
      "performance_degradation_threshold": 20,
      "error_rate_threshold": 5,
      "cost_threshold_daily": 10.0
    }
  },

  "caching": {
    "enabled": true,
    "file_content_cache": true,
    "search_result_cache": true,
    "cache_ttl_seconds": 300,
    "max_cache_size_mb": 50
  }
}
```

---

## Configuration Parameters Reference

### Core Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `version` | string | "1.9.0" | Configuration version |
| `description` | string | - | Configuration description |

### Token Optimization

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `token_optimization.enabled` | boolean | true | Enable token optimization |
| `token_optimization.max_context_tokens` | number | 50000 | Maximum context window size |
| `token_optimization.prune_after_task` | boolean | true | Auto-prune context after tasks |
| `token_optimization.summarize_tool_outputs` | boolean | true | Summarize long tool outputs |
| `token_optimization.context_compression.enabled` | boolean | true | Enable context compression |
| `token_optimization.context_compression.threshold_tokens` | number | 40000 | Compression trigger threshold |
| `token_optimization.context_compression.compression_ratio` | number | 0.5 | Compression ratio (0-1) |

### Model Routing

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model_routing.enabled` | boolean | true | Enable intelligent model routing |
| `model_routing.default_model` | string | "claude-sonnet-4" | Default model for general tasks |
| `model_routing.fallback_model` | string | "claude-haiku-4" | Fallback model for errors |
| `model_routing.task_routing.<task>.model` | string | - | Model for specific task type |
| `model_routing.task_routing.<task>.max_tokens` | number | - | Max tokens for task |
| `model_routing.task_routing.<task>.description` | string | - | Task description |

### Multi-Agent Orchestration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `multi_agent_orchestration.enabled` | boolean | true | Enable multi-agent coordination |
| `multi_agent_orchestration.max_concurrent_agents` | number | 8 | Maximum simultaneous agents |
| `multi_agent_orchestration.coordination_model` | string | "async-multi-agent" | Coordination approach |
| `multi_agent_orchestration.task_distribution_strategy` | string | "capability-based" | How tasks are distributed |
| `multi_agent_orchestration.conflict_resolution` | string | "expert-priority" | How conflicts are resolved |
| `multi_agent_orchestration.progress_tracking` | boolean | true | Track task progress |
| `multi_agent_orchestration.session_persistence` | boolean | true | Persist session state |

### Batch Operations

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `batch_operations.enabled` | boolean | true | Enable batch processing |
| `batch_operations.prefer_sed_for_replacements` | boolean | true | Use sed for replacements |
| `batch_operations.parallel_file_updates` | boolean | true | Update files in parallel |
| `batch_operations.max_concurrent_edits` | number | 10 | Maximum parallel edits |
| `batch_operations.auto_batch_threshold` | number | 5 | Files to auto-batch |

### Agent Management

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agent_management.disabled_agents` | array | [] | List of disabled agent names |
| `agent_management.agent_models.<agent>` | string | - | Model for specific agent |
| `agent_management.performance_limits.max_task_duration_ms` | number | 30000 | Max task duration |
| `agent_management.performance_limits.max_memory_usage_mb` | number | 512 | Max memory per task |
| `agent_management.performance_limits.max_tokens_per_request` | number | 16000 | Max tokens per request |

### Activity Logging

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `activity_logging.enabled` | boolean | true | Enable activity logging |
| `activity_logging.level` | string | "info" | Log level (debug, info, warn, error) |
| `activity_logging.include_performance_metrics` | boolean | true | Include performance data |
| `activity_logging.include_agent_states` | boolean | true | Include agent state changes |
| `activity_logging.include_token_usage` | boolean | true | Include token usage |
| `activity_logging.retention_days` | number | 7 | Days to retain logs |
| `activity_logging.log_to_file` | boolean | true | Write logs to file |
| `activity_logging.log_path` | string | ".opencode/logs" | Log file directory |

### Security

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `security.enabled` | boolean | true | Enable security features |
| `security.prompt_sanitization` | boolean | true | Sanitize prompts |
| `security.vulnerability_scanning` | boolean | true | Scan for vulnerabilities |
| `security.code_review_enforcement` | boolean | true | Enforce code review |
| `security.security_score_threshold` | number | 70 | Minimum security score |

### Performance Monitoring

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `performance_monitoring.enabled` | boolean | true | Enable monitoring |
| `performance_monitoring.real_time_metrics` | boolean | true | Collect real-time metrics |
| `performance_monitoring.benchmark_tracking` | boolean | true | Track benchmarks |
| `performance_monitoring.token_tracking` | boolean | true | Track token usage |
| `performance_monitoring.cost_tracking` | boolean | true | Track API costs |
| `performance_monitoring.alerting.enabled` | boolean | true | Enable alerting |
| `performance_monitoring.alerting.performance_degradation_threshold` | number | 20 | % degradation to alert |
| `performance_monitoring.alerting.error_rate_threshold` | number | 5 | % errors to alert |
| `performance_monitoring.alerting.cost_threshold_daily` | number | 10.0 | Daily cost limit |

### Caching

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `caching.enabled` | boolean | true | Enable caching |
| `caching.file_content_cache` | boolean | true | Cache file contents |
| `caching.search_result_cache` | boolean | true | Cache grep results |
| `caching.cache_ttl_seconds` | number | 300 | Cache TTL |
| `caching.max_cache_size_mb` | number | 50 | Maximum cache size |

---

## OpenCode Configuration

### .opencode/OpenCode.json

The main OpenCode configuration file for agent routing:

```json
{
  "model_routing": {
    "enforcer": "openrouter/xai-grok-2-1212-fast-1",
    "architect": "openrouter/xai-grok-2-1212-fast-1",
    "orchestrator": "openrouter/xai-grok-2-1212-fast-1",
    "bug-triage-specialist": "openrouter/xai-grok-2-1212-fast-1",
    "code-reviewer": "openrouter/xai-grok-2-1212-fast-1",
    "security-auditor": "openrouter/xai-grok-2-1212-fast-1",
    "refactorer": "openrouter/xai-grok-2-1212-fast-1",
    "testing-lead": "openrouter/xai-grok-2-1212-fast-1",
    "researcher": "openrouter/xai-grok-2-1212-fast-1",
    "log-monitor": "openrouter/xai-grok-2-1212-fast-1",
    "storyteller": "openrouter/xai-grok-2-1212-fast-1",
    "strategist": "openrouter/xai-grok-2-1212-fast-1",
    "frontend-engineer": "openrouter/xai-grok-2-1212-fast-1",
    "backend-engineer": "openrouter/xai-grok-2-1212-fast-1",
    "mobile-developer": "openrouter/xai-grok-2-1212-fast-1",
    "database-engineer": "openrouter/xai-grok-2-1212-fast-1",
    "devops-engineer": "openrouter/xai-grok-2-1212-fast-1",
    "performance-engineer": "openrouter/xai-grok-2-1212-fast-1",
    "seo-consultant": "openrouter/xai-grok-2-1212-fast-1",
    "content-creator": "openrouter/xai-grok-2-1212-fast-1",
    "growth-strategist": "openrouter/xai-grok-2-1212-fast-1",
    "tech-writer": "openrouter/xai-grok-2-1212-fast-1",
    "multimodal-looker": "openrouter/xai-grok-2-1212-fast-1",
    "code-analyzer": "openrouter/xai-grok-2-1212-fast-1"
  },
  "framework": {
    "version": "1.15.11",
    "codexEnforcement": true,
    "jobIdLogging": true,
    "consoleLogRule": true
  },
  "pipelines": {
    "maxConcurrentAgents": 8,
    "complexityThresholds": {
      "singleAgent": 25,
      "multiAgent": 95
    }
  }
}
```

---

## MCP Server Registry

### .mcp.json

MCP server registration for StringRay tools (28 servers):

```json
{
  "mcpServers": {
    "strray/enforcer-tools": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/mcps/enforcer-tools.server.js"],
      "env": {}
    },
    "strray/architect-tools": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/mcps/architect-tools.server.js"],
      "env": {}
    },
    "strray/orchestrator": {
      "command": "node", 
      "args": ["${workspaceFolder}/dist/mcps/orchestrator.server.js"],
      "env": {}
    },
    "strray/researcher": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/mcps/knowledge-skills/project-analysis.server.js"],
      "env": {}
    },
    "strray/code-review": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/mcps/knowledge-skills/code-review.server.js"],
      "env": {}
    },
    "strray/security-audit": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/mcps/knowledge-skills/security-audit.server.js"],
      "env": {}
    },
    "strray/testing-strategy": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/mcps/knowledge-skills/testing-strategy.server.js"],
      "env": {}
    },
    "strray/performance-optimization": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/mcps/knowledge-skills/performance-optimization.server.js"],
      "env": {}
    },
    "strray/framework-help": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/mcps/framework-help.server.js"],
      "env": {}
    }
  }
}
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENCODE_PLUGIN_PATH` | Path to StringRay plugin | `./.opencode/plugin/` |
| `STRRAY_LOG_LEVEL` | Log level | `info` |
| `STRRAY_STATE_DIR` | State directory | `./.opencode/state` |
| `STRRAY_CACHE_DIR` | Cache directory | `./.opencode/cache` |
| `STRRAY_NO_TELEMETRY` | Disable telemetry | `0` |

---

## Related Documentation

- [Agent Documentation](../AGENTS.md) - Complete agent specifications
- [Universal Development Codex](./CODEX.md) - 60-term codex reference
- [MCP Server Guide](./MCP_SERVERS.md) - MCP server details
- [CLI Commands](./CLI_COMMANDS.md) - Command reference
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

---

*Configuration reference version: 1.9.0*
*Last updated: 2026-03-12*
