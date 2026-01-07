# StrRay Framework Installation & Model Configuration Guide

## Overview

StrRay (StringRay) is an advanced AI agent orchestration framework that extends oh-my-opencode with systematic error prevention and production-ready development practices. This guide covers installation and model configuration.

**Important Update**: All agents now use `opencode/grok-code` as the default model. Legacy Anthropic models have been deprecated and replaced to ensure consistency and reliability.

## Prerequisites

- **OpenCode** installed and configured
- **oh-my-opencode** framework installed
- **Node.js** 18+ (for framework scripts)
- **Python** 3.8+ (for validation scripts)
- **Terminal/Shell** access

## Installation Steps

### Step 1: Install oh-my-opencode

```bash
# Install oh-my-opencode globally
npm install -g oh-my-opencode
# OR
bun install -g oh-my-opencode
```

### Step 2: Initialize StrRay Framework

```bash
# Navigate to your project directory
cd /path/to/your/project

# Initialize StrRay framework
oh-my-opencode init --framework strray

# This creates:
# - .opencode/ directory with framework files
# - oh-my-opencode.json with agent configurations
# - Framework automation hooks
```

### Step 3: Verify Installation

```bash
# Check framework status
oh-my-opencode status

# Should show:
# ✅ Framework: StrRay v1.0.0 loaded
# ✅ Agents: 8 configured
# ✅ MCP Skills: 6 loaded
# ✅ Automation Hooks: 4 active
```

## Model Configuration

StrRay uses **static model assignment** - each agent is assigned a specific model that cannot be changed dynamically during runtime.

### Configuration Files

#### Primary Configuration: `oh-my-opencode.json`

**Location**: `.opencode/oh-my-opencode.json`

**Purpose**: Defines model assignments for each agent

```json
{
  "$schema": "https://opencode.ai/oh-my-opencode.schema.json",
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
  "framework": {
    "name": "strray",
    "version": "1.0.0",
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

If you have an existing StrRay installation with older Anthropic models, you **must update** your `.opencode/oh-my-opencode.json` file to use `opencode/grok-code` for all agents. The framework will not function properly with deprecated models.

Run this command to update your configuration:
```bash
# Backup your current config
cp .opencode/oh-my-opencode.json .opencode/oh-my-opencode.json.backup

# Update all models to opencode/grok-code
oh-my-opencode config set model.all opencode/grok-code
```

### Method 1: Edit Configuration File (Recommended)

1. **Open the configuration file:**

   ```bash
   # Edit the primary model configuration
   nano .opencode/oh-my-opencode.json
   ```

2. **Update model assignments:**

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

3. **Restart the framework:**
   ```bash
   # Restart oh-my-opencode to apply changes
   oh-my-opencode restart
   ```

### Method 2: Use Framework Commands

```bash
# Update a specific agent's model
oh-my-opencode config set model.enforcer opencode/grok-code

# Update all agents to use the same model (recommended)
oh-my-opencode config set model.all opencode/grok-code

# Validate configuration
oh-my-opencode config validate
```

### Method 3: Interactive Configuration

```bash
# Launch interactive model configuration
oh-my-opencode models configure

# Follow prompts to update agent models
```

## Model Validation

### Pre-Flight Checks

```bash
# Validate model availability
oh-my-opencode models check

# Test model connectivity
oh-my-opencode models test --agent enforcer

# Validate configuration syntax
oh-my-opencode config validate
```

### Runtime Validation

```bash
# Check framework compliance
oh-my-opencode status --compliance

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
  "enforcer": "opencode/grok-code",
  "architect": "opencode/grok-code",
  "orchestrator": "opencode/grok-code",
  "bug-triage-specialist": "opencode/grok-code",
  "code-reviewer": "opencode/grok-code",
  "security-auditor": "opencode/grok-code",
  "refactorer": "opencode/grok-code",
  "test-architect": "opencode/grok-code"
}
```

### High-Capability Setup

```json
{
  "enforcer": "opencode/grok-code",
  "architect": "opencode/grok-code",
  "orchestrator": "opencode/grok-code",
  "bug-triage-specialist": "opencode/grok-code",
  "code-reviewer": "opencode/grok-code",
  "security-auditor": "opencode/grok-code",
  "refactorer": "opencode/grok-code",
  "test-architect": "opencode/grok-code"
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
oh-my-opencode restart

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
    "fallback_model": "opencode/grok-code",
    "agent_specific": {
      "enforcer": ["opencode/grok-code"],
      "architect": ["opencode/grok-code"]
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

- **45 Codex Terms**: Systematic error prevention
- **8 Specialized Agents**: Enforcer, Architect, Orchestrator, etc.
- **6 MCP Skills**: Project analysis, testing strategy, etc.
- **4 Automation Hooks**: Pre-commit checks, formatting, etc.
- **Real-time Compliance**: Bundle size, test coverage monitoring

## Next Steps

1. **Install** oh-my-opencode and StrRay framework
2. **Configure** models in `oh-my-opencode.json`
3. **Validate** configuration with framework tools
4. **Test** agent functionality
5. **Monitor** compliance and performance

For detailed agent capabilities, see the [AGENTS.md](../AGENTS.md) documentation.
