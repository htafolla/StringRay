# StrRay Model Configuration Guide

## Overview

This guide explains how to configure and update AI models in the StrRay framework.

## Key Configuration Files

### 1. Primary Model Configuration: `oh-my-opencode.json`

**Location**: `.opencode/oh-my-opencode.json`

**Purpose**: Defines which AI model each agent uses

```json
{
  "model_routing": {
    "enforcer": "opencode/grok-code",
    "architect": "opencode/grok-code",
    "orchestrator": "opencode/grok-code",
    "bug-triage-specialist": "opencode/grok-code",
    "code-reviewer": "opencode/grok-code",
    "security-auditor": "opencode/grok-code",
    "refactorer": "opencode/grok-code",
    "test-architect": "opencode/grok-code"
  }
}
```

### 2. Framework Settings: `enforcer-config.json`

**Location**: `.opencode/enforcer-config.json`

**Purpose**: Framework thresholds and automation settings

## Updating Models

### Step-by-Step Process

1. **Edit the configuration file:**

   ```bash
   nano .opencode/oh-my-opencode.json
   ```

2. **Update model assignments:**

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
