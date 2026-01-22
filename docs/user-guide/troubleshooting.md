# Troubleshooting Guide

## Overview

This guide provides solutions for common issues encountered when using the StringRay Framework. Issues are organized by category with symptoms, causes, and step-by-step solutions.

## Quick Diagnostic Commands

```bash
# Framework health check
npx strray-ai health

# Validate installation
npx strray-ai validate

# Check framework status
npx strray-ai status

# Analyze recent activity
tail -50 logs/framework/activity.log
```

## Agent Issues

### Agent Commands Not Responding

**Symptoms**: @agent commands are ignored in oh-my-opencode

**Possible Causes**:
- Framework plugin not loaded
- oh-my-opencode configuration issues
- Agent initialization failures

**Solutions**:

1. **Check Plugin Loading**:
   ```bash
   # Restart oh-my-opencode completely
   # Check that StringRay plugin appears in loaded plugins
   ```

2. **Validate Configuration**:
   ```bash
   # Check .opencode/oh-my-opencode.json exists and is valid
   cat .opencode/oh-my-opencode.json
   ```

3. **Test Framework Health**:
   ```bash
   npx strray-ai health
   # Should show: Framework active, agents loaded
   ```

### Agent Execution Errors

**Symptoms**: Agents start but fail during execution

**Possible Causes**:
- Missing dependencies
- Permission issues
- Resource constraints

**Solutions**:

1. **Check Agent Logs**:
   ```bash
   tail -100 logs/framework/activity.log | grep "agent"
   ```

2. **Validate Permissions**:
   ```bash
   # Ensure write access to project files
   ls -la src/
   ```

3. **Check Resource Usage**:
   ```bash
   # Monitor memory and CPU during agent execution
   top -p $(pgrep -f "oh-my-opencode")
   ```

## Framework Initialization Issues

### Framework Not Starting

**Symptoms**: `npx strray-ai init` fails or hangs

**Possible Causes**:
- Node.js version incompatibility
- Missing dependencies
- Configuration conflicts

**Solutions**:

1. **Check Node.js Version**:
   ```bash
   node --version  # Should be 18+
   npm --version   # Should be compatible
   ```

2. **Clear Cache and Reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Validate Configuration**:
   ```bash
   # Check for syntax errors in config files
   node -e "console.log('Config syntax OK')"
   ```

### Codex Loading Failures

**Symptoms**: Framework starts but codex terms not applied

**Possible Causes**:
- Missing .strray/codex.json file
- Corrupted codex data
- Version mismatches

**Solutions**:

1. **Verify Codex File**:
   ```bash
   ls -la .strray/codex.json
   # File should exist and be readable
   ```

2. **Validate Codex Content**:
   ```bash
   # Check codex has required terms
   grep '"number":' .strray/codex.json | wc -l  # Should show 59
   ```

3. **Check Framework Logs**:
   ```bash
   grep "codex" logs/framework/activity.log
   ```

## Performance Issues

### Slow Response Times

**Symptoms**: Agent responses take unusually long

**Possible Causes**:
- High complexity tasks
- Resource constraints
- Network issues

**Solutions**:

1. **Check Complexity Scores**:
   ```bash
   # Monitor task complexity in logs
   grep "complexity" logs/framework/activity.log
   ```

2. **Monitor Resources**:
   ```bash
   # Check system resources
   df -h    # Disk space
   free -h  # Memory
   ```

3. **Optimize Configuration**:
   ```json
   // Reduce concurrent operations in config
   {
     "framework": {
       "maxConcurrentAgents": 2
     }
   }
   ```

### Memory Issues

**Symptoms**: Out of memory errors or degraded performance

**Possible Causes**:
- Large codebases
- Memory leaks
- Configuration issues

**Solutions**:

1. **Monitor Memory Usage**:
   ```bash
   # Check memory consumption
   ps aux | grep "oh-my-opencode"
   ```

2. **Adjust Memory Settings**:
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

3. **Process Large Codebases in Batches**:
   ```typescript
   // Split large analysis tasks
   const batches = splitFilesIntoBatches(allFiles, 50);
   for (const batch of batches) {
     await analyzeBatch(batch);
   }
   ```

## Configuration Issues

### Invalid Configuration

**Symptoms**: Framework fails to start with config errors

**Possible Causes**:
- JSON syntax errors
- Invalid property values
- Missing required fields

**Solutions**:

1. **Validate JSON Syntax**:
   ```bash
   # Check config file syntax
   python3 -m json.tool .opencode/oh-my-opencode.json
   ```

2. **Use Configuration Templates**:
   ```bash
   # Reset to known good configuration
   cp api/API_REFERENCE.md .opencode/oh-my-opencode.json
   ```

3. **Check Required Fields**:
   ```json
   // Ensure all required fields are present
   {
     "model_routing": {
       "enforcer": "opencode/grok-code"
     },
     "framework": {
       "version": "1.1.1"
     }
   }
   ```

## Network and Connectivity Issues

### MCP Server Connection Failures

**Symptoms**: Agents cannot connect to MCP servers

**Possible Causes**:
- Network restrictions
- Port conflicts
- Server startup failures

**Solutions**:

1. **Test MCP Connectivity**:
   ```bash
   # Use built-in connectivity test
   node scripts/test:mcp-connectivity.js
   ```

2. **Check Server Logs**:
   ```bash
   # Examine MCP server startup logs
   tail -50 logs/mcp-*.log
   ```

3. **Verify Network Access**:
   ```bash
   # Test basic connectivity
   curl -I http://localhost:3000/health
   ```

## Development Environment Issues

### Testing Failures

**Symptoms**: Unit tests or integration tests failing

**Possible Causes**:
- Mock configuration issues
- Environment differences
- Code changes breaking tests

**Solutions**:

1. **Run Tests with Debug Output**:
   ```bash
   npm test -- --verbose
   ```

2. **Check Mock Configuration**:
   ```typescript
   // Ensure mocks are properly configured
   vi.mock("../framework-logger.js", () => ({
     frameworkLogger: { log: vi.fn() }
   }));
   ```

3. **Validate Test Environment**:
   ```bash
   # Check test environment setup
   npm run test:setup
   ```

## Emergency Procedures

### Complete Framework Reset

**When**: Framework is in an unrecoverable state

**Procedure**:
```bash
# 1. Stop all processes
pkill -f "oh-my-opencode"
pkill -f "strray"

# 2. Clear all caches and state
rm -rf .opencode/state/*
rm -rf node_modules/.cache
rm -rf logs/framework/*

# 3. Reset configuration
cp api/API_REFERENCE.md .opencode/oh-my-opencode.json

# 4. Clean reinstall
rm -rf node_modules package-lock.json
npm install

# 5. Restart framework
npx strray-ai init
```

### Data Recovery

**When**: Important session data needs to be preserved

**Procedure**:
```bash
# 1. Backup current state
cp -r .opencode/state backup-$(date +%Y%m%d-%H%M%S)

# 2. Export important sessions
npx strray-ai export-sessions --output backup-sessions.json

# 3. Reset framework
# (follow reset procedure above)

# 4. Restore sessions
npx strray-ai import-sessions --input backup-sessions.json
```

## Getting Help

### Community Resources

- **Documentation**: Check docs/ directory for detailed guides
- **Issue Tracking**: Report bugs with full logs and configuration
- **Performance Monitoring**: Use built-in monitoring tools

### Diagnostic Information

When reporting issues, include:

```bash
# System information
uname -a
node --version
npm --version

# Framework status
npx strray-ai health

# Recent logs
tail -100 logs/framework/activity.log

# Configuration (redact sensitive data)
cat .opencode/oh-my-opencode.json | jq '.'
```

This comprehensive troubleshooting guide covers the most common issues. For complex problems not covered here, check the framework logs and consider reaching out to the development team with detailed diagnostic information.
