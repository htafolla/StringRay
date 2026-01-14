# StrRay Model Configuration Guide

## Overview

This guide explains how to configure and update AI models in the StrRay framework.

## Key Configuration Files

### 1. Primary Model Configuration: `oh-my-opencode.json`

**Location**: `.opencode/oh-my-opencode.json`

**Purpose**: Defines which AI model each agent uses and basic framework settings

```json
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  "google_auth": false,
  "preemptive_compaction": true,
  "plugins": ["stringray-ai"],
  "model_routing": {
    "enforcer": "opencode/grok-code",
    "architect": "opencode/grok-code",
    "orchestrator": "opencode/grok-code",
    "bug-triage-specialist": "opencode/grok-code",
    "code-reviewer": "opencode/grok-code",
    "security-auditor": "opencode/grok-code",
    "refactorer": "opencode/grok-code",
    "test-architect": "opencode/grok-code"
  },
  "logging": {
    "enabled": true,
    "refactoring_log_path": ".opencode/REFACTORING_LOG.md",
    "auto_capture": true,
    "format": "markdown",
    "include_timestamps": true,
    "categories": ["refactoring", "analysis", "performance", "security"]
  }
}
```

### 2. Framework Settings: Python ConfigManager

**Location**: `src/strray/config/manager.py`

**Purpose**: Comprehensive framework configuration loaded at runtime

```python
# StrRay Framework Configuration
defaults = {
    "strray_version": "1.0.0",
    "codex_enabled": True,
    "codex_version": "v1.2.20",
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

- **oh-my-opencode.json**: oh-my-opencode-compatible settings (model routing, plugins, basic config)
- **Python ConfigManager**: Runtime framework configuration (codex terms, agent capabilities, monitoring)

This separation ensures:

- Schema compliance with oh-my-opencode
- Runtime flexibility for framework settings
- Clear separation of concerns

## Updating Models

### Step-by-Step Process

1. **Edit the oh-my-opencode.json file:**

   ```bash
   nano .opencode/oh-my-opencode.json
   ```

2. **Update model assignments in the `model_routing` section:**

   ```json
   {
     "model_routing": {
       "enforcer": "opencode/grok-code",
       "architect": "opencode/grok-code",
       "orchestrator": "opencode/grok-code"
     }
   }
   ```

3. **Restart the framework:**

   ```bash
   oh-my-opencode restart
   ```

4. **Validate changes:**
   ```bash
   oh-my-opencode status
   ```

## Important Notes

- **Static Configuration**: Models cannot be changed dynamically during runtime
- **Restart Required**: Changes require framework restart to take effect
- **Validation**: Always run `oh-my-opencode config validate` after changes
- **Backup**: Keep backups of working configurations

## Available Models

- `opencode/grok-code` (recommended, cost-effective, updated standard)
- Check [OpenCode](https://opencode.ai) for free models and update to your preferred option
- `openai/gpt-4o` (versatile)
- `openai/gpt-4o-mini` (fast, cost-effective)

**Note**: All agents now use `opencode/grok-code` by default. Legacy Anthropic models have been deprecated and replaced.

## Troubleshooting

- If models don't update: Check file permissions and restart framework
- If validation fails: Ensure model names match available providers
- If agents don't respond: Verify API keys are configured for the model provider
