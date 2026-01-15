# StrRay Framework - Technical Migration Guide

## 📋 Migration Overview

This guide covers the technical migration procedures for StrRay Framework configuration and component updates. These procedures ensure smooth transitions between framework versions while maintaining system integrity and functionality.

## 🔄 Configuration Migration

### Phase 2: Configuration Flattening

**Objective**: Transform nested configuration structures into flat, maintainable formats.

#### Before (Nested Structure)

```json
{
  "framework": {
    "agents": {
      "enforcer": {
        "enabled": true,
        "config": {
          "thresholds": {
            "bundle_size": "2MB",
            "test_coverage": "85%"
          }
        }
      }
    }
  }
}
```

#### After (Flattened Structure)

```json
{
  "strray_agents": {
    "enabled": ["enforcer"],
    "disabled": []
  },
  "bundle_threshold": "2MB",
  "coverage_threshold": "85%"
}
```

#### Migration Steps

1. **Extract nested values** to top-level configuration keys
2. **Update key naming** to follow flat structure conventions
3. **Remove nested objects** and replace with direct property access
4. **Validate configuration** against new schema requirements

#### Validation Commands

```bash
# Check configuration syntax
python3 -c "import json; json.load(open('.opencode/oh-my-opencode.json'))"

# Validate required properties
python3 -c "
config = json.load(open('.opencode/oh-my-opencode.json'))
required = ['strray_agents', 'dynamic_models', 'ai_logging']
missing = [k for k in required if k not in config]
print('Missing:', missing) if missing else print('Configuration valid')
"
```

### Phase 3: Hook Consolidation

**Objective**: Consolidate 8 individual hooks into 4 consolidated categories for simplified maintenance.

#### Hook Consolidation Mapping

| Original Hook | Consolidated Category | Purpose                 |
| ------------- | --------------------- | ----------------------- |
| pre-commit    | commit                | Code quality validation |
| post-commit   | commit                | Automated processing    |
| pre-build     | build                 | Build preparation       |
| post-build    | build                 | Build verification      |
| pre-deploy    | deploy                | Deployment checks       |
| post-deploy   | deploy                | Deployment validation   |
| pre-test      | test                  | Test environment setup  |
| post-test     | test                  | Test result processing  |

#### Implementation Steps

1. **Identify hook usage** across configuration files
2. **Map legacy hooks** to consolidated categories
3. **Update hook dispatcher** to handle consolidated events
4. **Migrate hook configurations** to new structure

#### Backward Compatibility

```typescript
// Legacy hook support
const legacyHookMapping = {
  "pre-commit": "commit.pre",
  "post-commit": "commit.post",
  "pre-build": "build.pre",
  "post-build": "build.post",
};

// Automatic translation
function translateLegacyHook(hookName) {
  return legacyHookMapping[hookName] || hookName;
}
```

## 🛠️ Component Migration

### Agent System Migration

#### Agent Configuration Updates

```json
// Before
{
  "agents": {
    "enforcer": { "enabled": true },
    "architect": { "enabled": true }
  }
}

// After
{
  "strray_agents": {
    "enabled": ["enforcer", "architect"],
    "disabled": []
  }
}
```

#### Agent State Migration

1. **Preserve agent state** during configuration changes
2. **Update state references** to use new configuration paths
3. **Validate agent initialization** with updated configuration
4. **Test agent communication** post-migration

### MCP Server Migration

#### Server Configuration Updates

```json
// Before
{
  "mcps": {
    "testing-strategy": {
      "command": "node mcps/testing-strategy.server.js",
      "config": "mcps/testing-strategy.mcp.json"
    }
  }
}

// After (with error handling)
{
  "mcps": {
    "testing-strategy": {
      "server": "mcps/testing-strategy.server.js",
      "config": "mcps/testing-strategy.mcp.json"
    }
  }
}
```

#### MCP Integration Validation

1. **Test server startup** with new configuration format
2. **Validate tool registration** and availability
3. **Check inter-server communication** functionality
4. **Verify error handling** and recovery mechanisms

## 🔧 Hook System Migration

### Consolidated Hook Categories

#### Commit Hooks

```javascript
// Consolidated commit hook handler
function handleCommitHook(type, data) {
  if (type === "pre") {
    // Pre-commit validation
    return validateCodeQuality(data);
  } else if (type === "post") {
    // Post-commit processing
    return processCommitResults(data);
  }
}
```

#### Build Hooks

```javascript
// Build lifecycle management
function manageBuildLifecycle(phase, config) {
  switch (phase) {
    case "pre":
      return prepareBuildEnvironment(config);
    case "post":
      return validateBuildArtifacts(config);
  }
}
```

#### Deploy Hooks

```javascript
// Deployment pipeline integration
function handleDeployment(stage, environment) {
  const hooks = {
    pre: validateDeploymentReadiness,
    post: verifyDeploymentSuccess,
  };

  return hooks[stage]?.(environment);
}
```

### Hook Dispatcher Updates

#### Legacy Hook Translation

```typescript
class HookDispatcher {
  translateLegacyHook(hookName: string): string {
    const mapping = {
      "pre-commit": "commit.pre",
      "post-commit": "commit.post",
      "pre-build": "build.pre",
      "post-build": "build.post",
      "pre-deploy": "deploy.pre",
      "post-deploy": "deploy.post",
    };
    return mapping[hookName] || hookName;
  }
}
```

#### Consolidated Hook Execution

```typescript
async function executeConsolidatedHook(
  category: string,
  type: string,
  data: any,
) {
  const hookKey = `${category}.${type}`;
  const hookHandler = this.consolidatedHooks[hookKey];

  if (hookHandler) {
    return await hookHandler(data);
  }

  throw new Error(`No handler for consolidated hook: ${hookKey}`);
}
```

## ✅ Validation Procedures

### Configuration Validation

```bash
# Comprehensive validation script
#!/bin/bash

echo "🔍 StrRay Migration Validation"
echo "============================="

# 1. Configuration syntax
if python3 -c "import json; json.load(open('.opencode/oh-my-opencode.json'))"; then
  echo "✅ Configuration syntax valid"
else
  echo "❌ Configuration syntax invalid"
  exit 1
fi

# 2. Required properties
missing=$(python3 -c "
import json
config = json.load(open('.opencode/oh-my-opencode.json'))
required = ['strray_agents', 'dynamic_models', 'ai_logging']
missing = [k for k in required if k not in config]
print(','.join(missing)) if missing else print('')
")

if [ -n "$missing" ]; then
  echo "❌ Missing required properties: $missing"
  exit 1
else
  echo "✅ All required properties present"
fi

# 3. Agent configuration
agent_count=$(python3 -c "
import json
config = json.load(open('.opencode/oh-my-opencode.json'))
agents = config.get('strray_agents', {}).get('enabled', [])
print(len(agents))
")

if [ "$agent_count" -ge 6 ]; then
  echo "✅ Agent configuration valid ($agent_count agents)"
else
  echo "❌ Insufficient agents configured ($agent_count)"
  exit 1
fi

echo ""
echo "🎉 Migration validation completed successfully!"
```

### Component Testing

```bash
# Post-migration testing
npm run test:unit        # Unit test validation
npm run test:integration # Integration test suite
npm run build           # Build verification
npm run lint            # Code quality checks
```

## 🚨 Rollback Procedures

### Configuration Rollback

```bash
# Restore previous configuration
cp .opencode/oh-my-opencode.json.backup .opencode/oh-my-opencode.json

# Restart framework
bash .opencode/init.sh
```

### Hook System Rollback

```javascript
// Revert to legacy hook system
const legacyHooks = {
  "pre-commit": originalPreCommitHandler,
  "post-commit": originalPostCommitHandler,
  // ... restore all legacy hooks
};
```

### Agent System Rollback

```python
# Restore previous agent configuration
agent_config.rollback_to_version('1.0.0')
```

## 📊 Migration Metrics

### Success Metrics

- **Configuration Load Time**: < 5 seconds
- **Agent Initialization**: < 10 seconds
- **Hook Execution**: < 2 seconds per hook
- **Memory Usage**: < 100MB additional
- **Error Rate**: < 1% during migration

### Monitoring Commands

```bash
# Monitor migration progress
watch -n 5 'ps aux | grep strray'

# Check agent health
curl http://localhost:3000/api/agents/health

# Validate hook execution
tail -f .opencode/logs/hook-execution.log
```

## 📞 Support Resources

### Migration Assistance

- **Configuration Examples**: See `docs/framework/architecture/migration-examples/`
- **Troubleshooting Guide**: See `docs/framework/troubleshooting/MIGRATION_ISSUES.md`
- **Community Support**: GitHub Issues and Discussions

### Emergency Contacts

- **Framework Issues**: Create GitHub issue with "migration" label
- **Configuration Problems**: Check `docs/framework/troubleshooting/CONFIG_VALIDATION.md`
- **Agent Failures**: Review `docs/framework/agents/AGENT_DEBUGGING.md`

---

_This technical migration guide ensures smooth transitions between StrRay Framework versions while maintaining system stability and functionality._
