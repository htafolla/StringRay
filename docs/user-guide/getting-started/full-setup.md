# StrRay Framework Installation & Model Configuration Guide

## Overview

StrRay (StringRay) is an advanced AI agent orchestration framework that extends OpenCode with systematic error prevention and production-ready development practices. This guide covers installation and model configuration.

**Important Update**: All agents now use `openrouter/xai-grok-2-1212-fast-1` as the default model. Legacy Anthropic models have been deprecated and replaced to ensure consistency and reliability.

## Prerequisites

- **OpenCode** installed and configured
- **OpenCode** framework installed
- **Node.js** 18+ (for framework scripts)
- **Python** 3.8+ (for validation scripts)
- **Terminal/Shell** access

## Installation Steps

### Step 1: Install OpenCode

```bash
# Install OpenCode globally
npm install -g OpenCode
# OR
bun install -g OpenCode
```

### Step 2: Initialize StrRay Framework

```bash
# Navigate to your project directory
cd /path/to/your/project

# Initialize StrRay framework
npm run init

# This creates:
# - .opencode/ directory with framework files
# - OpenCode.json with agent configurations
# - Framework automation hooks
```

### Step 3: Verify Installation

```bash
# Check framework status
OpenCode status

# Should show:
# ✅  loaded
# ✅ Agents: 25 configured
# ✅ MCP Servers: 15 loaded
# ✅ Automation Hooks: 4 active
```

## Model Configuration

StrRay uses **static model assignment** - each agent is assigned a specific model that cannot be changed dynamically during runtime.

### Configuration Files

#### Primary Configuration: `OpenCode.json`

**Location**: `.opencode/OpenCode.json`

**Purpose**: Defines model assignments for each agent

```json
{
  "$schema": "https://opencode.ai/OpenCode.schema.json",
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
  "framework": {
    "name": "strray",
    "version": "1.15.11",
    "codex_terms": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "15",
      "24",
      "29",
      "32",
      "38",
      "42",
      "43"
    ]
  }
}
```

#### Secondary Configuration: `enforcer-config.json`

**Location**: `.opencode/enforcer-config.json`

**Purpose**: Framework-specific settings and thresholds

```json
{
  "bundle_size_limit": "2MB",
  "test_coverage_threshold": 85,
  "error_prevention_level": "strict",
  "automation_hooks": [
    "pre-commit-introspection",
    "auto-format",
    "security-scan",
    "enforcer-daily-scan"
  ]
}
```

## Updating Models

### Important: Model Migration Required

If you have an existing StrRay installation with older Anthropic models, you **must update** your `.opencode/OpenCode.json` file to use `openrouter/xai-grok-2-1212-fast-1` for all agents. The framework will not function properly with deprecated models.

Run this command to update your configuration:

```bash
# Backup your current config
cp .opencode/OpenCode.json .opencode/OpenCode.json.backup

# Update all models to openrouter/xai-grok-2-1212-fast-1
OpenCode config set model.all openrouter/xai-grok-2-1212-fast-1
```

### Method 1: Edit Configuration File (Recommended)

1. **Open the configuration file:**

   ```bash
   # Edit the primary model configuration
   nano .opencode/OpenCode.json
   ```

2. **Update model assignments:**

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
       "testing-lead": "openrouter/xai-grok-2-1212-fast-1"
     }
   }
   ```

3. **Restart the framework:**
   ```bash
   # Restart OpenCode to apply changes
   OpenCode restart
   ```

### Method 2: Use Framework Commands

```bash
# Update a specific agent's model
OpenCode config set model.enforcer openrouter/xai-grok-2-1212-fast-1

# Update all agents to use the same model (recommended)
OpenCode config set model.all openrouter/xai-grok-2-1212-fast-1

# Validate configuration
OpenCode config validate
```

### Method 3: Interactive Configuration

```bash
# Launch interactive model configuration
OpenCode models configure

# Follow prompts to update agent models
```

## Model Validation

### Pre-Flight Checks

```bash
# Validate model availability
OpenCode models check

# Test model connectivity
OpenCode models test --agent enforcer

# Validate configuration syntax
OpenCode config validate
```

### Runtime Validation

```bash
# Check framework compliance
OpenCode status --compliance

# Run model health checks
bash .opencode/scripts/model-health-check.sh

# Validate all agent models
bash .opencode/scripts/model-validator.sh
```

## Available Models

StrRay supports all OpenCode-compatible models. Recommended configurations:

### Cost-Effective Setup

```json
{
  "enforcer": "openrouter/xai-grok-2-1212-fast-1",
  "architect": "openrouter/xai-grok-2-1212-fast-1",
  "orchestrator": "openrouter/xai-grok-2-1212-fast-1",
  "bug-triage-specialist": "openrouter/xai-grok-2-1212-fast-1",
  "code-reviewer": "openrouter/xai-grok-2-1212-fast-1",
  "security-auditor": "openrouter/xai-grok-2-1212-fast-1",
  "refactorer": "openrouter/xai-grok-2-1212-fast-1",
  "testing-lead": "openrouter/xai-grok-2-1212-fast-1"
}
```

### High-Capability Setup

```json
{
  "enforcer": "openrouter/xai-grok-2-1212-fast-1",
  "architect": "openrouter/xai-grok-2-1212-fast-1",
  "orchestrator": "openrouter/xai-grok-2-1212-fast-1",
  "bug-triage-specialist": "openrouter/xai-grok-2-1212-fast-1",
  "code-reviewer": "openrouter/xai-grok-2-1212-fast-1",
  "security-auditor": "openrouter/xai-grok-2-1212-fast-1",
  "refactorer": "openrouter/xai-grok-2-1212-fast-1",
  "testing-lead": "openrouter/xai-grok-2-1212-fast-1"
}
```

## Troubleshooting

### Common Issues

**"Model not available" error:**

```bash
# Check model availability
opencode models

# Verify API keys are configured
opencode auth status
```

**Configuration not applying:**

```bash
# Restart the framework
OpenCode restart

# Clear cache
rm -rf .opencode/cache/
```

**Validation failures:**

```bash
# Run detailed validation
bash .opencode/scripts/model-validator.sh --verbose

# Check framework logs
tail -f .opencode/logs/strray-init-*.log
```

## Advanced Configuration

### Custom Model Routing

For complex scenarios, you can implement custom model routing logic:

```json
{
  "model_routing": {
    "dynamic": true,
    "fallback_model": "openrouter/xai-grok-2-1212-fast-1",
    "agent_specific": {
      "enforcer": ["openrouter/xai-grok-2-1212-fast-1"],
      "architect": ["openrouter/xai-grok-2-1212-fast-1"]
    }
  }
}
```

### Environment-Specific Models

```bash
# Development models (cost-effective)
export STRRAY_ENV=development

# Production models (high-capability)
export STRRAY_ENV=production
```

## Framework Features

Once installed and configured, StrRay provides:

- **60 Codex Terms**: Systematic error prevention
- **25 Specialized Agents**: Enforcer, Architect, Orchestrator, etc.
- **15 MCP Servers**: Project analysis, testing strategy, etc.
- **4 Automation Hooks**: Pre-commit checks, formatting, etc.
- **Real-time Compliance**: Bundle size, test coverage monitoring

## Next Steps

1. **Install** OpenCode and StrRay framework
2. **Configure** models in `OpenCode.json`
3. **Validate** configuration with framework tools
4. **Test** agent functionality
5. **Monitor** compliance and performance

For detailed agent capabilities, see the [AGENTS.md](../AGENTS.md) documentation.
