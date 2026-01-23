# StringRay AI Plugin Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the StringRay AI framework plugin in your development environment.

## Prerequisites

- Node.js 18+ or Bun
- oh-my-opencode installed and running
- Basic understanding of TypeScript/JavaScript development

## Installation

### 1. Install StringRay AI

```bash
npm install strray-ai
```

### 2. Run Postinstall Setup

```bash
node node_modules/strray-ai/scripts/postinstall.cjs
```

This will:
- Configure oh-my-opencode integration
- Set up framework directories
- Initialize plugin components

### 3. Verify Installation

```bash
npx strray-ai status
```

## Configuration

### oh-my-opencode Integration

The plugin automatically configures the following agents:

- **@enforcer**: Code quality and compliance validation
- **@architect**: System design and technical decisions
- **@code-reviewer**: Code review and standards validation
- **@bug-triage-specialist**: Error investigation and fixes
- **@security-auditor**: Security vulnerability detection
- **@refactorer**: Technical debt elimination
- **@test-architect**: Testing strategy and coverage
- **@librarian**: Codebase exploration and documentation

### Advanced Configuration

Create `.strray/config.json` for advanced settings:

```json
{
  "codexEnforcement": true,
  "performanceMonitoring": true,
  "maxConcurrentAgents": 5
}
```

## Usage

### Basic Commands

```bash
# Code quality analysis
@enforcer analyze this code for issues

# System design assistance
@architect design database schema

# Code review
@code-reviewer review pull request

# Security audit
@security-auditor scan for vulnerabilities
```

### Multi-Agent Orchestration

```bash
# Complex task delegation
@orchestrator implement user authentication system

# Results: orchestrator → architect → code-reviewer → test-architect
```

## Troubleshooting

### Plugin Not Loading

```bash
# Check oh-my-opencode configuration
cat .opencode/oh-my-opencode.json

# Verify plugin registration
grep "strray" .opencode/oh-my-opencode.json
```

### Agent Commands Not Working

```bash
# List available agents
opencode agent list

# Check framework status
npx strray-ai status
```

## Performance Optimization

### Bundle Size Management

- Automatic code splitting
- Lazy loading of features
- Optimized dependencies

### Memory Management

- Automatic garbage collection
- Pool-based object reuse
- Session cleanup

## Enterprise Features

### Security Hardening

- Input validation and sanitization
- Secure credential management
- Audit logging

### Monitoring & Analytics

- Performance metrics collection
- Error tracking and reporting
- Usage analytics

## Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] oh-my-opencode running
- [ ] StringRay AI installed
- [ ] Postinstall script executed
- [ ] Plugin status verified
- [ ] Agent commands tested
- [ ] Configuration optimized

## Support

For issues and questions:
- GitHub Issues: https://github.com/htafolla/stringray/issues
- Documentation: https://stringray.dev
- Community: https://github.com/htafolla/stringray/discussions