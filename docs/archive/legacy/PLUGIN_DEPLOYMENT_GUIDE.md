# StringRay AI Plugin Deployment Guide

**Version**: 1.9.0 | **Architecture**: Facade Pattern | **Framework**: StringRay AI

## Overview

This guide provides comprehensive instructions for deploying the StringRay AI framework plugin in your development environment. With StringRay v1.15.1, deployment is simplified through the **Facade Pattern Architecture**, which delivers 87% code reduction while maintaining full functionality.

---

## Prerequisites

- Node.js 18+ or Bun
- OpenCode installed and running
- Basic understanding of TypeScript/JavaScript development

---

## Installation

### 1. Install StringRay AI

```bash
npm install strray-ai
```

### 2. Run Postinstall Setup

```bash
node node_modules/strray-ai/scripts/node/postinstall.cjs
```

This will:
- Configure OpenCode integration
- Set up framework directories
- Initialize plugin components
- **Set up facade layer** (v1.15.1) with 26 internal modules

### 3. Verify Installation

```bash
npx strray-ai status
```

**Expected output:**
```
StringRay AI Framework v1.15.1
Status: ✅ Healthy
Architecture: Facade Pattern
Facades:
  - RuleEnforcer: ✅ Healthy (6 modules)
  - TaskSkillRouter: ✅ Healthy (14 modules)
  - MCPClient: ✅ Healthy (8 modules)
```

---

## Configuration

### OpenCode Integration

The plugin automatically configures the following agents:

- **@enforcer**: Code quality and compliance validation
- **@architect**: System design and technical decisions
- **@code-reviewer**: Code review and standards validation
- **@bug-triage-specialist**: Error investigation and fixes
- **@security-auditor**: Security vulnerability detection
- **@refactorer**: Technical debt elimination
- **@testing-lead**: Testing strategy and coverage
- **@researcher**: Codebase exploration and documentation

### Facade Configuration (v1.15.1)

Create `.opencode/strray/config.json` for advanced settings:

```json
{
  "codexEnforcement": true,
  "performanceMonitoring": true,
  "maxConcurrentAgents": 5,
  "architecture": "facade-pattern",
  "facades": {
    "ruleEnforcer": {
      "enabled": true,
      "modules": ["all"],
      "cacheEnabled": true,
      "cacheTTL": 300
    },
    "taskSkillRouter": {
      "enabled": true,
      "modules": ["all"],
      "routingAlgorithm": "ml-based",
      "confidenceThreshold": 0.8
    },
    "mcpClient": {
      "enabled": true,
      "modules": ["all"],
      "connectionPooling": true,
      "maxConnections": 10
    }
  }
}
```

---

## Usage

### Basic Commands

```bash
# Code quality analysis using RuleEnforcer facade
@enforcer analyze this code for issues

# System design assistance
@architect design database schema

# Code review
@code-reviewer review pull request

# Security audit
@security-auditor scan for vulnerabilities
```

### Facade-Based Operations (v1.15.1)

```typescript
import { 
  RuleEnforcer, 
  TaskSkillRouter, 
  MCPClient 
} from "@strray/framework";

// RuleEnforcer Facade
const enforcer = new RuleEnforcer(orchestrator);
const validation = await enforcer.validate({
  files: ["src/**/*.ts"],
  rules: ["codex-compliance"],
  severity: "error"
});

// TaskSkillRouter Facade
const router = new TaskSkillRouter(orchestrator);
const route = await router.routeTask({
  task: "implement user authentication",
  context: { projectType: "nodejs" }
});

// MCP Client Facade
const mcpClient = new MCPClient(orchestrator);
const skills = await mcpClient.discoverSkills();
```

### Multi-Agent Orchestration

```bash
# Complex task delegation
@orchestrator implement user authentication system

# Results: orchestrator → architect → code-reviewer → testing-lead
# Routed automatically via TaskSkillRouter facade
```

---

## Facade Architecture in Deployment

### Deployment Structure

```
.opencode/
├── opencode.json                    # OpenCode configuration
├── strray/
│   ├── config.json                  # Facade configuration
│   ├── features.json                # Feature flags
│   └── facades/                     # Facade state (auto-generated)
│       ├── rule-enforcer/
│       ├── task-skill-router/
│       └── mcp-client/
├── agents/                          # Agent definitions
│   ├── enforcer.md
│   ├── architect.md
│   └── ...
└── init.sh                          # Initialization script
```

### Facade Initialization

During deployment, facades initialize automatically:

```typescript
// src/core/strray-activation.ts
async function activateStrRayFramework() {
  // Phase 1: Core components
  await initializeBootOrchestrator();
  await initializeStateManagement();
  
  // Phase 2: Facade layer (v1.15.1)
  await initializeFacades();
  
  // Phase 3: Module loading
  await loadFacadeModules();
  
  console.log("✅ StringRay AI v1.15.1 activated");
  console.log("   Facades: RuleEnforcer, TaskSkillRouter, MCPClient");
}
```

### Module Loading

Facades load modules on-demand:

```typescript
// RuleEnforcer loads modules as needed
const enforcer = new RuleEnforcer(orchestrator);
// No modules loaded yet

await enforcer.validate({ ... });
// Loads: ValidationEngine, RuleRegistry, CodexValidator

await enforcer.getMetrics();
// Loads: MetricsCollector
```

---

## Troubleshooting

### Facade Not Loading

```bash
# Check facade status
npx strray-ai status

# Expected output should show all facades healthy
# If not:

# 1. Verify configuration
cat .opencode/strray/config.json | jq '.facades'

# 2. Check logs
cat .opencode/logs/strray-plugin-$(date +%Y-%m-%d).log | grep -i "facade"

# 3. Reinitialize facades
npx strray-ai init --reset-facades
```

### Agent Commands Not Working

```bash
# List available agents
npx strray-ai agents list

# Check framework status with facade details
npx strray-ai status --verbose

# Test specific facade
npx strray-ai enforcer test
npx strray-ai router test
npx strray-ai mcp test
```

### Module Errors

```typescript
// Check available modules
const enforcer = new RuleEnforcer(orchestrator);
console.log(enforcer.getAvailableModules());

// Expected: ["validation-engine", "rule-registry", ...]

// If modules missing:
// 1. Check facade configuration
// 2. Verify installation
// 3. Reinstall strray-ai
```

---

## Performance Optimization

### Facade-Level Optimizations

**1. Enable Module Caching:**

```json
{
  "facades": {
    "ruleEnforcer": {
      "cacheEnabled": true,
      "cacheTTL": 300,
      "maxCacheSize": 1000
    }
  }
}
```

**2. Connection Pooling (MCP Client):**

```json
{
  "facades": {
    "mcpClient": {
      "connectionPooling": true,
      "minConnections": 2,
      "maxConnections": 10,
      "idleTimeout": 30000
    }
  }
}
```

**3. Lazy Loading:**

```typescript
// Modules loaded on-demand (default behavior)
const router = new TaskSkillRouter(orchestrator);
// Fast initialization - no overhead

// Pre-load modules if needed
await router.preloadModules(["skill-matcher", "agent-selector"]);
```

### Bundle Size Management

- **Facade layer**: Only ~1,218 lines (vs 8,230 previously)
- **Automatic code splitting**: Modules loaded separately
- **Lazy loading**: Features loaded on demand
- **Optimized dependencies**: Smaller bundle size (1.1MB vs 2.5MB)

### Memory Management

- **Facade memory**: ~12MB per facade (vs 45MB previously)
- **Automatic garbage collection**: Modules cleaned up when idle
- **Pool-based object reuse**: Connection pooling reduces allocations
- **Session cleanup**: Automatic cleanup of facade sessions

---

## Enterprise Features

### Security Hardening

- **Input validation and sanitization**: All facade inputs validated
- **Secure credential management**: Encrypted storage
- **Audit logging**: Complete audit trail of facade operations
- **Plugin sandboxing**: Extensions run in isolated environments

### Monitoring & Analytics

```typescript
// Facade performance metrics
const status = await orchestrator.getStatus();

status.facades.forEach(facade => {
  console.log(`
    Facade: ${facade.name}
    Status: ${facade.status}
    Response Time: ${facade.metrics.averageResponseTime}ms
    Cache Hit Rate: ${facade.metrics.cacheHitRate}%
    Active Modules: ${facade.activeModules}
  `);
});
```

### Distributed Deployment

```typescript
// Multi-instance facade configuration
{
  "facades": {
    "distributed": true,
    "loadBalancing": "round-robin",
    "failover": {
      "enabled": true,
      "maxRetries": 3,
      "healthCheckInterval": 30000
    }
  }
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Node.js 18+ installed
- [ ] OpenCode running
- [ ] StringRay AI installed (v1.15.1)
- [ ] Postinstall script executed
- [ ] Plugin status verified
- [ ] Facades healthy (RuleEnforcer, TaskSkillRouter, MCPClient)
- [ ] Agent commands tested

### Configuration

- [ ] Facade configuration created (`.opencode/strray/config.json`)
- [ ] Feature flags set appropriately
- [ ] Module caching enabled
- [ ] Connection pooling configured (if using MCP)
- [ ] Performance monitoring enabled

### Testing

- [ ] RuleEnforcer facade validates code
- [ ] TaskSkillRouter routes tasks correctly
- [ ] MCP Client discovers and calls skills
- [ ] All agents responding
- [ ] Module access working (advanced)

### Production

- [ ] Security hardening applied
- [ ] Monitoring configured
- [ ] Backup/recovery tested
- [ ] Documentation updated
- [ ] Team trained on facade APIs

---

## Migration from v1.8.x

### No Breaking Changes

**All existing deployments continue to work without changes.**

### Optional: Adopt Facade APIs

```typescript
// Existing code (still works)
const enforcer = orchestrator.getAgent("enforcer");
await enforcer.validate({ ... });

// New facade API (recommended for new code)
const enforcer = new RuleEnforcer(orchestrator);
await enforcer.validate({ ... });
```

### Performance Benefits After Migration

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Deployment time | 45s | 12s | 73% faster |
| Bundle size | 2.5MB | 1.1MB | 56% smaller |
| Memory usage | 45MB | 12MB | 73% reduction |
| Startup time | 1.2s | 0.3s | 75% faster |

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/htafolla/stringray/issues
- Documentation: https://stringray.dev
- Facade API Docs: https://stringray.dev/docs/facades
- Community: https://github.com/htafolla/stringray/discussions

---

_Framework Version: 1.9.0 | Architecture: Facade Pattern | Last Updated: 2026-03-12_
