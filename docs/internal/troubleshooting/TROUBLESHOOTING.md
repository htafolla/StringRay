# StrRay Framework - Centralized Troubleshooting Reference

## Overview

This guide provides solutions for common issues encountered when using the StrRay framework. Issues are organized by category with step-by-step resolution procedures.

## Installation Issues

### Framework Not Found After Installation

**Symptoms**:

- `strray: command not found`
- Framework commands not recognized

**Solutions**:

1. **Check PATH Configuration**:

   ```bash
   # Check if StrRay is in PATH
   which strray

   # Add to PATH if missing
   export PATH="$HOME/.npm-global/bin:$PATH"
   ```

2. **Reinstall Globally**:

   ```bash
   npm uninstall -g @strray/framework
   npm install -g @strray/framework
   ```

3. **Verify Installation**:
   ```bash
   strray --version
   npm list -g @strray/framework
   ```

### Permission Denied Errors

**Symptoms**:

- `EACCES: permission denied`
- Cannot write to installation directory

**Solutions**:

1. **Fix npm Permissions**:

   ```bash
   # Create npm-global directory
   mkdir ~/.npm-global
   npm config set prefix ~/.npm-global

   # Add to PATH
   export PATH="$HOME/.npm-global/bin:$PATH"
   ```

2. **Use sudo (not recommended)**:

   ```bash
   sudo npm install -g @strray/framework
   ```

3. **Use Node Version Manager**:

   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v1.1.1/install.sh | bash

   # Install and use Node.js
   nvm install node
   nvm use node
   ```

### Dependency Installation Failures

**Symptoms**:

- `npm install` fails
- Missing peer dependencies
- Network timeout errors

**Solutions**:

1. **Clear Cache and Retry**:

   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Use Different Registry**:

   ```bash
   npm config set registry https://registry.npmjs.org/
   npm install
   ```

3. **Install Peer Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

## Configuration Issues

### Invalid Configuration File

**Symptoms**:

- `Configuration validation failed`
- Agents not loading properly

**Solutions**:

1. **Validate Configuration**:

   ```bash
   strray config validate
   ```

2. **Reset to Defaults**:

   ```bash
   strray config reset
   ```

3. **Check JSON Syntax**:
   ```bash
   # Validate JSON syntax
   cat .strray/config.json | jq .
   ```

### Environment Variables Not Loading

**Symptoms**:

- Environment-specific settings not applied
- API keys not recognized

**Solutions**:

1. **Check .env File Location**:

   ```bash
   ls -la .env*
   ```

2. **Verify Variable Format**:

   ```bash
   # Correct format
   STRRAY_ENV=production
   API_KEY=your_key_here
   ```

3. **Load Environment Manually**:
   ```bash
   source .env
   strray config reload
   ```

## Agent Issues

### Agent Not Responding

**Symptoms**:

- Agent commands timeout
- No response to trigger keywords

**Solutions**:

1. **Check Agent Status**:

   ```bash
   strray agent status
   ```

2. **Restart Agent**:

   ```bash
   strray agent restart <agent-name>
   ```

3. **Check Agent Logs**:
   ```bash
   strray logs agent <agent-name>
   ```

### Agent Permission Errors

**Symptoms**:

- `Permission denied` for tool execution
- Agent cannot access required resources

**Solutions**:

1. **Check Agent Permissions**:

   ```bash
   strray agent permissions <agent-name>
   ```

2. **Update Permissions**:

   ```bash
   strray config set agents.<agent>.permissions "read,write,bash"
   ```

3. **Verify Tool Permissions**:
   ```bash
   strray tools permissions
   ```

## Tool Integration Issues

### Tool Not Available

**Symptoms**:

- `Tool not found` errors
- Commands fail due to missing tools

**Solutions**:

1. **Check Tool Installation**:

   ```bash
   strray tools list
   ```

2. **Install Missing Tools**:

   ```bash
   strray tools install <tool-name>
   ```

3. **Manual Tool Installation**:
   ```bash
   # Example for git
   which git || apt-get install git
   ```

### Tool Execution Timeout

**Symptoms**:

- Commands hang indefinitely
- `Timeout exceeded` errors

**Solutions**:

1. **Increase Timeout**:

   ```bash
   strray config set tools.timeout 300000
   ```

2. **Run in Background**:

   ```bash
   strray task "long running task" --async
   ```

3. **Check System Resources**:
   ```bash
   # Check memory and CPU usage
   top
   free -h
   ```

## Performance Issues

### Slow Response Times

**Symptoms**:

- Commands take longer than expected
- Framework feels sluggish

**Solutions**:

1. **Check System Resources**:

   ```bash
   # Monitor resource usage
   htop
   iostat -x 1
   ```

2. **Clear Cache**:

   ```bash
   strray cache clear
   ```

3. **Optimize Configuration**:
   ```bash
   strray config set performance.mode optimized
   ```

### Memory Issues

**Symptoms**:

- `Out of memory` errors
- System becomes unresponsive

**Solutions**:

1. **Increase Memory Limits**:

   ```bash
   # For Node.js
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. **Monitor Memory Usage**:

   ```bash
   strray monitor memory
   ```

3. **Reduce Parallel Operations**:
   ```bash
   strray config set tools.parallel false
   ```

## Network and Connectivity Issues

### Connection Timeouts

**Symptoms**:

- Network requests fail
- External service integration issues

**Solutions**:

1. **Check Network Connectivity**:

   ```bash
   ping 8.8.8.8
   curl -I https://registry.npmjs.org
   ```

2. **Configure Proxy**:

   ```bash
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

3. **Use Different DNS**:
   ```bash
   echo "nameserver 8.8.8.8" > /etc/resolv.conf
   ```

### SSL/TLS Certificate Issues

**Symptoms**:

- `certificate verify failed` errors
- Cannot connect to HTTPS endpoints

**Solutions**:

1. **Update CA Certificates**:

   ```bash
   # Ubuntu/Debian
   sudo apt-get install ca-certificates
   sudo update-ca-certificates
   ```

2. **Disable SSL Verification (temporary)**:

   ```bash
   npm config set strict-ssl false
   ```

3. **Use Custom Certificate**:
   ```bash
   export NODE_EXTRA_CA_CERTS=/path/to/custom-ca.pem
   ```

## File System Issues

### Permission Denied on Files

**Symptoms**:

- Cannot read/write project files
- File access errors

**Solutions**:

1. **Check File Permissions**:

   ```bash
   ls -la <problematic-file>
   ```

2. **Fix Permissions**:

   ```bash
   chmod 644 <file>
   chmod 755 <directory>
   ```

3. **Change Ownership**:
   ```bash
   sudo chown -R $(whoami) <project-directory>
   ```

### File Not Found Errors

**Symptoms**:

- Configuration files missing
- Required files not located

**Solutions**:

1. **Check File Existence**:

   ```bash
   find . -name "*.json" -type f
   ```

2. **Regenerate Missing Files**:

   ```bash
   strray init --force
   ```

3. **Restore from Backup**:
   ```bash
   strray backup restore
   ```

## Logging and Debugging

### Enable Debug Logging

```bash
# Enable debug mode
strray config set logging.level debug

# View logs
strray logs tail

# Search logs
strray logs grep "error"
```

### Generate Diagnostic Report

```bash
# Create comprehensive diagnostic
strray diagnose --full > diagnostic-$(date +%Y%m%d).txt

# Include system information
uname -a >> diagnostic.txt
node --version >> diagnostic.txt
npm --version >> diagnostic.txt
```

## Framework-Specific Issues

### Codex Integration Problems

**Symptoms**:

- Codex principles not applied
- Framework behavior inconsistent

**Solutions**:

1. **Verify Codex Version**:

   ```bash
   strray config get framework.codex
   ```

2. **Update Framework**:

   ```bash
   strray update framework
   ```

3. **Reset to Codex Defaults**:
   ```bash
   strray codex reset
   ```

### Plugin Loading Issues

**Symptoms**:

- Custom plugins not loading
- Plugin functionality missing

**Solutions**:

1. **Check Plugin Directory**:

   ```bash
   ls -la .strray/plugins/
   ```

2. **Validate Plugin Structure**:

   ```bash
   strray plugins validate
   ```

3. **Reload Plugins**:
   ```bash
   strray plugins reload
   ```

## Emergency Procedures

### Framework Lockup

If StrRay becomes unresponsive:

1. **Kill Process**:

   ```bash
   pkill -f strray
   ```

2. **Clear Locks**:

   ```bash
   rm -f .strray/locks/*
   ```

3. **Restart Framework**:
   ```bash
   strray daemon restart
   ```

### Data Recovery

For configuration or project data loss:

1. **Check Backups**:

   ```bash
   ls -la .strray/backups/
   ```

2. **Restore from Backup**:

   ```bash
   strray backup restore latest
   ```

3. **Reinitialize**:
   ```bash
   strray init --clean
   ```

## Getting Additional Help

### Community Support

- **Forum**: https://community.strray.dev
- **Discord**: https://discord.gg/strray
- **GitHub Issues**: https://github.com/strray/framework/issues

### Professional Support

- **Enterprise Support**: support@strray.dev
- **Documentation**: https://docs.strray.dev
- **Training**: https://learn.strray.dev

### Diagnostic Commands

```bash
# Quick health check
strray health

# Full system diagnostic
strray diagnose --comprehensive

# Performance analysis
strray analyze performance

# Generate support ticket data
strray support generate-ticket
```

## Prevention Best Practices

### Regular Maintenance

```bash
# Weekly maintenance
strray maintenance weekly

# Update framework
strray update all

# Clean caches
strray cache clean
```

### Monitoring Setup

```bash
# Enable monitoring
strray monitor enable

# Set up alerts
strray alerts configure

# Performance tracking
strray metrics enable
```

### Backup Strategy

```bash
# Automated backups
strray backup schedule daily

# Verify backups
strray backup verify

# Offsite backup
strray backup sync s3://my-backup-bucket
```
