# StrRay Framework Migration Guide

## Overview

This document describes the comprehensive migration and consolidation efforts implemented in Phases 2 and 3 of the StrRay simplification plan, including configuration flattening and hook consolidation.

## Phase 2: Configuration Migration

### Migration Summary

**Before (Nested Structure):**

```json
{
  "strray_framework": {
    "version": "1.1.0",
    "enabled_agents": ["enforcer", "architect"],
    "agent_capabilities": {
      "enforcer": ["compliance-monitoring"]
    }
  }
}
```

**After (Flattened Structure):**

```json
{
  "version": "1.1.0",
  "enabled_agents": ["enforcer", "architect"],
  "agent_capabilities_enforcer": ["compliance-monitoring"]
}
```

### Key Changes

#### 1. Root Level Promotion

- `strray_framework.version` → `version`
- `strray_framework.strray_mode` → `strray_mode`
- `strray_framework.enabled_agents` → `enabled_agents`

#### 2. Object Flattening with Prefixes

- `agent_capabilities.*` → `agent_capabilities_*`
- `sisyphus_*` → `sisyphus_*`
- `monitoring_*` → `monitoring_*`
- `hooks_*` → `hooks_*`

#### 3. Model Configuration

- `model_routing.default` → `model_default`
- `model_routing.fallback` → `model_fallback`

#### 4. Framework Thresholds

- `framework_thresholds.bundle_size` → `bundle_size_threshold`
- `framework_thresholds.test_coverage` → `test_coverage_threshold`
- `framework_thresholds.duplication_rate` → `duplication_rate_threshold`
- `framework_thresholds.error_rate` → `error_rate_threshold`

### Consumer Script Updates

#### enforcer-daily-scan.md

**Before:**

```bash
BUNDLE_THRESHOLD="2MB"  # hardcoded
COVERAGE_THRESHOLD=85   # hardcoded
```

**After:**

```bash
BUNDLE_THRESHOLD=$(jq -r '.bundle_size_threshold' "$CONFIG_FILE")
COVERAGE_THRESHOLD=$(jq -r '.test_coverage_threshold' "$CONFIG_FILE")
```

#### bundle-analysis.js

**Before:**

```javascript
const BUNDLE_THRESHOLDS = {
  total: { size: 2048, gzip: 350 }, // hardcoded fallback
};
```

**After:**

```javascript
const config = loadConfig(); // exits on failure
const BUNDLE_THRESHOLDS = {
  total: {
    size: parseFloat(config.bundle_size_threshold) * 1024,
    gzip: 350,
  },
};
```

#### test-performance.js

**Before:**

```javascript
const CORE_THRESHOLD = config?.core_test_threshold || 2000; // fallback
```

**After:**

```javascript
const config = loadConfig(); // exits on failure
const CORE_THRESHOLD = config.core_test_threshold;
```

### Validation Scripts

#### config-validator.sh

- Validates all required flattened keys exist
- Checks agent count (must be exactly 8)
- Verifies agent capability keys are present
- Confirms automation hook configurations

#### config-loader.sh

- Provides structured config loading with error handling
- Returns specific error codes for different failure modes
- Includes comprehensive logging for troubleshooting

### Migration Testing

#### Unit Tests Added

- Config parsing validation
- Key existence verification
- Type checking for numeric values
- Agent capability structure validation

#### Integration Tests

- End-to-end config consumption by consumer scripts
- Error handling verification
- Performance impact assessment

### Breaking Changes

#### Hard Requirements

- Config file must exist at `strray/strray-config.json`
- All required keys must be present
- jq must be available for config parsing
- No fallback values provided

#### Error Behavior

- Scripts exit with error code 1 on config failures
- Clear error messages indicate specific failure modes
- No silent degradation or default value usage

## Phase 3: Hook Consolidation

### Consolidation Summary

**Before (8 Individual Hooks):**

```json
{
  "hooks_pre_commit": ["pre-commit-introspection"],
  "hooks_post_commit": ["auto-format"],
  "hooks_daily": ["enforcer-daily-scan"],
  "hooks_security": ["security-scan"],
  "hooks_deployment": ["post-deployment-audit"],
  "hooks_summary": ["summary-logger"],
  "hooks_job_completion": ["job-summary-logger"],
  "hooks_model_health": ["model-health-check"]
}
```

**After (4 Consolidated Hooks):**

```json
{
  "hooks_commit": ["pre-commit-introspection", "auto-format"],
  "hooks_monitor": [
    "enforcer-daily-scan",
    "security-scan",
    "model-health-check"
  ],
  "hooks_deploy": ["post-deployment-audit"],
  "hooks_log": ["summary-logger", "job-summary-logger"]
}
```

### Hook Categories

#### 1. `commit` - Commit-Related Operations

**Purpose**: Pre and post-commit quality assurance and formatting
**Original Hooks**: `pre_commit`, `post_commit`
**Included Scripts**:

- `pre-commit-introspection` - Code quality checks before commits
- `auto-format` - Code formatting after commits

#### 2. `monitor` - Monitoring and Health Checks

**Purpose**: Ongoing system monitoring, security scanning, and health validation
**Original Hooks**: `daily`, `security`, `model_health`
**Included Scripts**:

- `enforcer-daily-scan` - Daily compliance and threshold monitoring
- `security-scan` - Security vulnerability scanning
- `model-health-check` - AI model availability and performance validation

#### 3. `deploy` - Deployment Operations

**Purpose**: Post-deployment validation and auditing
**Original Hooks**: `deployment`
**Included Scripts**:

- `post-deployment-audit` - Deployment verification and compliance checks

#### 4. `log` - Logging and Summary Operations

**Purpose**: Automated logging of system activities and job completions
**Original Hooks**: `summary`, `job_completion`
**Included Scripts**:

- `summary-logger` - General activity summary logging
- `job-summary-logger` - Job completion and AI summary logging

### Hook Dispatcher

#### Usage

The `hook-dispatcher.sh` script manages consolidated hooks with backward compatibility:

```bash
# Execute consolidated hooks
./scripts/hook-dispatcher.sh commit    # Pre/post-commit operations
./scripts/hook-dispatcher.sh monitor   # Monitoring operations
./scripts/hook-dispatcher.sh deploy    # Deployment operations
./scripts/hook-dispatcher.sh log       # Logging operations

# Legacy hook types (automatically mapped)
./scripts/hook-dispatcher.sh pre_commit    # → commit
./scripts/hook-dispatcher.sh daily         # → monitor
./scripts/hook-dispatcher.sh security      # → monitor
./scripts/hook-dispatcher.sh deployment    # → deploy
./scripts/hook-dispatcher.sh summary       # → log
```

#### Features

- **Consolidated Execution**: Executes all scripts within a hook category
- **Backward Compatibility**: Automatically maps legacy hook types to consolidated categories
- **Error Handling**: Continues execution even if individual hooks fail
- **Logging**: Comprehensive execution logging with success/failure tracking
- **Graceful Degradation**: Succeeds if at least one hook in a category executes successfully

#### Execution Flow

1. **Hook Type Resolution**: Maps legacy types to consolidated categories
2. **Configuration Loading**: Reads hook scripts from flattened config
3. **Sequential Execution**: Executes each hook script in the category
4. **Result Aggregation**: Reports success/failure for each hook
5. **Overall Status**: Returns success if any hook in the category succeeded

## Migration Impact

### Benefits Achieved

**Reduced Complexity**: 8 hook configurations → 4 consolidated categories (50% reduction)
**Improved Maintainability**: Logical grouping of related operations and direct key access
**Enhanced Reliability**: Consolidated execution with better error handling and explicit error handling
**Backward Compatibility**: Legacy hook calls still work through automatic mapping
**Performance**: Reduced JSON parsing overhead and better batch execution

### Breaking Changes

**Configuration**: Config file must exist with all required flattened keys
**Error Handling**: Scripts now exit on config failures instead of using fallbacks
**Hook Categories**: Legacy hook types automatically map to consolidated categories (no breaking changes for consumers)

### Performance Impact

**Improved**: Consolidated hooks reduce configuration overhead and provide better batch execution. Flattened config reduces parsing overhead.

## Testing

### Hook Dispatcher Tests

```bash
# Test consolidated hook execution
./scripts/hook-dispatcher.sh commit
./scripts/hook-dispatcher.sh monitor

# Test backward compatibility mapping
./scripts/hook-dispatcher.sh pre_commit  # Should map to commit
./scripts/hook-dispatcher.sh daily       # Should map to monitor
```

### Configuration Tests

- Config parsing validation
- Key existence verification
- Type checking for numeric values
- Agent capability structure validation
- End-to-end config consumption by consumer scripts

### Integration Tests

- Verify all hook scripts execute correctly within their consolidated categories
- Test error handling when individual hooks fail
- Validate logging output for execution tracking
- Confirm backward compatibility for legacy hook calls
- Error handling verification for config failures
- Performance impact assessment

## Future Extensions

### Adding New Hooks

**To add a hook to an existing category:**

```json
{
  "hooks_monitor": [
    "enforcer-daily-scan",
    "security-scan",
    "model-health-check",
    "new-monitor-script"
  ]
}
```

**To add a new hook category:**

```json
{
  "hooks_new_category": ["script1", "script2"]
}
```

### Adding New Agents

```json
{
  "enabled_agents": ["enforcer", "architect", "new_agent"],
  "agent_capabilities_new_agent": ["capability1", "capability2"]
}
```

### Adding New Thresholds

```json
{
  "new_threshold": 42
}
```

## Troubleshooting

### Common Issues

**Hook Not Found**: Check that script exists in expected location and has execute permissions
**Configuration Error**: Verify hook is properly listed in consolidated category or required config keys exist
**Execution Failure**: Check script logs and ensure dependencies are available
**Mapping Issues**: Legacy hook types should automatically map to consolidated categories
**Config Loading Failure**: Ensure config file exists and jq is available

### Debug Mode

Enable verbose logging by modifying hook dispatcher or config loader to show detailed execution information.

## Rollback Procedure

If migration issues occur:

1. **Individual Hook Execution**: Call hook scripts directly instead of through dispatcher
2. **Config Reversion**: Restore backup config: `cp strray-backup/strray-config.json strray/strray-config.json`
3. **Consumer Script Reversion**: Revert consumer scripts to use nested structure or hardcoded values
4. **Dispatcher Bypass**: Execute hooks using original method until issues resolved
5. **Remove flattened config dependencies**: Restore nested structure usage

## Validation Checklist

- [ ] Config file exists and is valid JSON with all required flattened keys
- [ ] All consolidated hook categories execute successfully
- [ ] Legacy hook type mapping works correctly
- [ ] Consumer scripts load config successfully without fallbacks
- [ ] Error handling provides graceful degradation and clear error messages
- [ ] Logging captures execution details
- [ ] Backward compatibility maintained
- [ ] Performance not degraded
- [ ] Documentation updated
