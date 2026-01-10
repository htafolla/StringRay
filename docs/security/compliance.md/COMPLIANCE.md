# StrRay Extension - oh-my-opencode Compliance Guide

## Overview

This document outlines the compliance status of the StrRay 1.0.0 framework with oh-my-opencode's official standards and provides guidance for maintaining compatibility.

## Compliance Status

### ✅ **Fully Compliant Areas**

- Directory structure and file organization
- Agent and command markdown formats
- MCP server configuration and integration
- Workflow YAML structure and automation
- Official oh-my-opencode schema properties

### ⚠️ **Partial Compliance (Custom Extensions)**

- `universal_development_framework` - Framework-specific enhancements
- `model_routing` - Custom agent model assignments
- `framework_thresholds` - Project-specific quality metrics
- These are **allowed** by schema but may change with oh-my-opencode updates

### ❌ **Previously Non-Compliant (Now Fixed)**

- Removed non-standard properties that violated schema
- Migrated mode switching to official disabled_agents approach
- Eliminated custom extensions that bypassed validation

## Maintenance Guidelines

### Schema Validation

```bash
# Validate configuration against official schema
curl -s https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json > schema.json
# Use a JSON Schema validator to check oh-my-opencode.json
```

### Update Procedures

1. **Before oh-my-opencode updates**: Backup current configuration
2. **Test compatibility**: Run schema validation on new versions
3. **Migrate extensions**: Adapt custom properties to new schema requirements
4. **Validate functionality**: Ensure all StringRay features work with updated config

### Extension Best Practices

- Document all custom properties and their purposes
- Provide fallback configurations for schema-breaking changes
- Test custom extensions independently of core oh-my-opencode functionality
- Consider contributing useful extensions back to oh-my-opencode upstream

## Migration from Previous Versions

### Before (Non-compliant)

```json
{
  "mode": {"current": "lite"},
  "framework_thresholds": {...},
  "universal_development_framework": {...}
}
```

### After (Compliant)

```json
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  "disabled_agents": ["oracle", "librarian", "explore"],
  "agents": {
    "librarian": { "model": "opencode/grok-code" }
  }
}
```

## Risk Mitigation

### Future Compatibility

- **Low Risk**: Standard properties unlikely to change
- **Medium Risk**: Custom extensions may require updates
- **High Risk**: Major oh-my-opencode version changes

### Monitoring

- Regular schema validation checks
- Automated testing of configuration loading
- Documentation of custom extension dependencies

## Support

For questions about oh-my-opencode compliance:

- Check official documentation: https://github.com/code-yeongyu/oh-my-opencode
- Validate configurations against schema
- Test with minimal configurations first

---

_This compliance guide ensures StrRay Extension maintains compatibility with oh-my-opencode while preserving enhanced functionality._
