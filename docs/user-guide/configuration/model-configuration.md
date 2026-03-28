# StrRay Model Configuration Guide

## Overview

This guide explains how to configure and update AI models in the StrRay framework.

## Key Configuration Files

### 1. Primary Model Configuration: `OpenCode.json`

**Location**: `.opencode/OpenCode.json`

**Purpose**: Defines which AI model each agent uses and basic framework settings

```json
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/OpenCode/master/assets/OpenCode.schema.json",
  "google_auth": false,
  "preemptive_compaction": true,
  "plugins": ["stringray-ai"],
  "model_routing": {
    "enforcer": "openrouter/xai-grok-2-1212-fast-1",
    "architect": "openrouter/xai-grok-2-1212-fast-1",
    "orchestrator": "openrouter/xai-grok-2-1212-fast-1",
    "bug-triage-specialist": "openrouter/xai-grok-2-1212-fast-1",
    "code-reviewer": "openrouter/xai-grok-2-1212-fast-1",
    "security-auditor": "openrouter/xai-grok-2-1212-fast-1",
    "refactorer": "openrouter/xai-grok-2-1212-fast-1",
    "testing-lead": "openrouter/xai-grok-2-1212-fast-1"
  },
  "logging": {
    "enabled": true,
    "refactoring_log_path": "logs/agents/refactoring-log.md",
    "auto_capture": true,
    "format": "markdown",
    "include_timestamps": true,
    "categories": ["refactoring", "analysis", "performance", "security"]
  }
}
```

### 2. Framework Settings: Python ConfigManager

**Location**: `src/core/config-loader.ts`

**Purpose**: Comprehensive framework configuration loaded at runtime

```python
# StrRay Framework Configuration
defaults = {
    "strray_version": "1.1.1",
    "codex_enabled": True,
    "codex_version": "v1.7.5",
    "codex_terms": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...],
    "agent_capabilities": {
        "enforcer": ["compliance-monitoring", "threshold-enforcement"],
        "architect": ["design-review", "architecture-validation"],
        # ... other agents
    },
    "monitoring_metrics": ["bundle-size", "test-coverage", ...],
    "automation_hooks": {...},
    # ... additional framework settings
}
```

## Configuration Architecture

The StrRay framework uses a **hybrid configuration system**:

- **OpenCode.json**: OpenCode-compatible settings (model routing, plugins, basic config)
- **Python ConfigManager**: Runtime framework configuration (codex terms, agent capabilities, monitoring)

This separation ensures:

- Schema compliance with OpenCode
- Runtime flexibility for framework settings
- Clear separation of concerns

## Updating Models

### Step-by-Step Process

1. **Edit the OpenCode.json file:**

   ```bash
   nano .opencode/OpenCode.json
   ```

2. **Update model assignments in the `model_routing` section:**

   ```json
   {
     "model_routing": {
       "enforcer": "openrouter/xai-grok-2-1212-fast-1",
       "architect": "openrouter/xai-grok-2-1212-fast-1",
       "orchestrator": "openrouter/xai-grok-2-1212-fast-1"
     }
   }
   ```

3. **Restart the framework:**

   ```bash
   OpenCode restart
   ```

4. **Validate changes:**
   ```bash
   OpenCode status
   ```

## Important Notes

- **Static Configuration**: Models cannot be changed dynamically during runtime
- **Restart Required**: Changes require framework restart to take effect
- **Validation**: Always run `OpenCode config validate` after changes
- **Backup**: Keep backups of working configurations

## Available Models

- `openrouter/xai-grok-2-1212-fast-1` (recommended, cost-effective, updated standard)
- Check [OpenCode](https://opencode.ai) for free models and update to your preferred option
- `openai/gpt-4o` (versatile)
- `openai/gpt-4o-mini` (fast, cost-effective)

**Note**: All agents now use `openrouter/xai-grok-2-1212-fast-1` by default. Legacy Anthropic models have been deprecated and replaced.

## Troubleshooting

- If models don't update: Check file permissions and restart framework
- If validation fails: Ensure model names match available providers
- If agents don't respond: Verify API keys are configured for the model provider
