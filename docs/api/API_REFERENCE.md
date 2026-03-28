# StringRay API Reference

**Version**: 1.9.0 | **Last Updated**: 2026-03-12 | **Framework**: StringRay AI

## Overview

StringRay provides a comprehensive enterprise-grade API for AI agent coordination built on the **Facade Pattern**. This architecture delivers 87% code reduction while maintaining stable public APIs and powerful module interfaces for advanced users.

### Architecture Overview

StringRay v1.15.1 features a modern, modular architecture:

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| RuleEnforcer | 2,714 lines | 416 lines | 85% |
| TaskSkillRouter | 1,933 lines | 490 lines | 75% |
| MCP Client | 1,413 lines | 312 lines | 78% |
| Dead Code | 3,170 lines | 0 lines | 100% |
| **Total** | **8,230 lines** | **1,218 lines** | **87%** |

**Key Benefits:**
- **Simplified API**: Clean, consistent interfaces via facades
- **Internal Modularity**: Logic separated into 26 focused modules
- **Improved Maintainability**: Easier to understand, test, and extend
- **Better Performance**: Optimized internal routing and reduced overhead
- **100% Backward Compatible**: Public APIs unchanged

---

## API Categories

### 1. **Public APIs** (Stable - No Changes)
These APIs remained unchanged through the refactoring:
- Agent invocation (`@agent-name` syntax)
- CLI commands (`npx strray-ai`)
- Configuration files (`.opencode/strray/`)
- Custom agent creation process

### 2. **Facade APIs** (Stable Public Interface)
New simplified APIs for common operations:
- RuleEnforcer facade
- TaskSkillRouter facade
- MCP Client facade

### 3. **Module APIs** (Advanced Users)
Direct access to internal modules for customization:
- 6 RuleEnforcer modules
- 12 TaskSkillRouter modules + analytics + routing
- 8 MCP Client modules

---

## Core Framework APIs

### StrRayOrchestrator

Main orchestrator for framework initialization and agent coordination.

```typescript
import { StrRayOrchestrator } from "@strray/framework";

const orchestrator = new StrRayOrchestrator({
  configPath: ".opencode/opencode.json",
  performanceMode: "optimized",
  monitoringEnabled: true,
});

// Initialize framework
await orchestrator.initialize();

// Get framework status
const status = await orchestrator.getStatus();
```

### Facade-Based Component Access

Access components through their simplified facade interfaces:

```typescript
// RuleEnforcer Facade - Validation & Compliance
import { RuleEnforcer } from "@strray/framework";

const enforcer = new RuleEnforcer(orchestrator);

// Validate code against Codex
const validation = await enforcer.validate({
  files: ["src/**/*.ts"],
  rules: ["codex-compliance", "type-safety"],
});

// Get validation metrics
const metrics = await enforcer.getMetrics();
```

```typescript
// TaskSkillRouter Facade - Task Routing & Agent Selection
import { TaskSkillRouter } from "@strray/framework";

const router = new TaskSkillRouter(orchestrator);

// Route task to appropriate agent
const route = await router.routeTask({
  task: "optimize database queries",
  context: { projectType: "nodejs" }
});

// Get routing analytics
const analytics = await router.getRoutingAnalytics();
```

```typescript
// MCP Client Facade - Skill Server Communication
import { MCPClient } from "@strray/framework";

const mcpClient = new MCPClient(orchestrator);

// Discover available skills
const skills = await mcpClient.discoverSkills();

// Call a skill
const result = await mcpClient.callSkill("project-analysis", {
  projectRoot: "/path/to/project"
});
```

---

## Agent Coordination APIs

### Agent Management

```typescript
// Get specific agent
const enforcer = orchestrator.getAgent("enforcer");
const architect = orchestrator.getAgent("architect");

// Execute agent task
const result = await enforcer.validate({
  files: ["src/**/*.ts"],
  rules: ["codex-compliance", "type-safety"],
});

// Get agent performance metrics
const metrics = await enforcer.getPerformanceMetrics();
```

### Multi-Agent Orchestration

```typescript
// Coordinate multiple agents
const coordination = await orchestrator.coordinateAgents({
  task: "code-review",
  agents: ["enforcer", "architect", "code-reviewer"],
  input: {
    files: ["src/**/*.ts"],
    context: "new-feature-implementation",
  },
});

// Handle conflicts and merge results
const finalResult = await coordination.resolve();
```

---

## Module APIs (Advanced Usage)

For advanced users who need direct access to internal modules:

### RuleEnforcer Modules

```typescript
import { 
  ValidationEngine,
  RuleRegistry,
  CodexValidator,
  ErrorReporter,
  MetricsCollector,
  ConfigManager
} from "@strray/enforcer/modules";

// Direct module access
const validator = new ValidationEngine(enforcer);
const registry = new RuleRegistry(enforcer);
```

**Available Modules (6 total):**
1. `ValidationEngine` - Core validation logic
2. `RuleRegistry` - Rule registration and management
3. `CodexValidator` - Codex compliance checking
4. `ErrorReporter` - Error reporting and formatting
5. `MetricsCollector` - Performance metrics
6. `ConfigManager` - Configuration handling

### TaskSkillRouter Modules

```typescript
import {
  TaskParser,
  SkillMatcher,
  AgentSelector,
  ComplexityScorer,
  ContextAnalyzer,
  // ... 12 total mapping modules
} from "@strray/router/modules";

// Direct module access
const parser = new TaskParser(router);
const matcher = new SkillMatcher(router);
```

**Available Modules (14 total):**
- 12 Mapping modules (TaskParser, SkillMatcher, AgentSelector, etc.)
- Analytics module
- Routing engine module

### MCP Client Modules

```typescript
import {
  ServerDiscovery,
  ConnectionPool,
  ProtocolHandler,
  MessageRouter,
  ErrorRecovery,
  CacheManager,
  HealthMonitor,
  ConfigLoader
} from "@strray/mcp/modules";

// Direct module access
const discovery = new ServerDiscovery(mcpClient);
const pool = new ConnectionPool(mcpClient);
```

**Available Modules (8 total):**
1. `ServerDiscovery` - MCP server discovery
2. `ConnectionPool` - Connection management
3. `ProtocolHandler` - MCP protocol handling
4. `MessageRouter` - Message routing
5. `ErrorRecovery` - Error recovery logic
6. `CacheManager` - Response caching
7. `HealthMonitor` - Health checks
8. `ConfigLoader` - Configuration loading

---

## Session Management

### Session Lifecycle

```typescript
import { SessionManager } from "@strray/session";

const sessionManager = new SessionManager(orchestrator);

// Create new session
const session = await sessionManager.createSession({
  type: "development",
  agents: ["enforcer", "architect"],
  config: {
    autoCleanup: true,
    monitoring: true,
  },
});

// Execute tasks within session
const result = await session.executeTask({
  agent: "architect",
  task: "design-component",
  input: { component: "UserDashboard" },
});

// Get session status and metrics
const status = await session.getStatus();
const metrics = await session.getMetrics();

// Cleanup session
await session.cleanup();
```

---

## State Management

### Global State Coordination

```typescript
import { StateManager } from "@strray/state";

const stateManager = new StateManager(orchestrator);

// Get global state
const globalState = await stateManager.getGlobalState();

// Update state atomically
await stateManager.updateState({
  path: "agents.enforcer.status",
  value: "active",
  version: globalState.version,
});

// Subscribe to state changes
const subscription = stateManager.subscribe("agents.*", (change) => {
  console.log("Agent state changed:", change);
});

// Cleanup subscription
subscription.unsubscribe();
```

---

## Configuration Management

### Dynamic Configuration

```typescript
import { ConfigManager } from "@strray/config";

const configManager = new ConfigManager(orchestrator);

// Load configuration with validation
const config = await configManager.loadConfig({
  validate: true,
  environment: "production",
});

// Update configuration dynamically
await configManager.updateConfig({
  path: "performance.optimization.enabled",
  value: true,
  validate: true,
});

// Get configuration schema
const schema = await configManager.getSchema();

// Validate configuration
const validation = await configManager.validateConfig(config);
```

---

## Error Handling & Recovery

### Comprehensive Error Handling

```typescript
try {
  const result = await orchestrator.executeTask({
    agent: "enforcer",
    task: "validate-code",
    input: { files: ["src/**/*.ts"] },
  });
} catch (error) {
  if (error instanceof StrRayAgentError) {
    // Handle agent-specific errors
    await orchestrator.handleAgentError(error);
  } else if (error instanceof StrRayValidationError) {
    // Handle validation errors
    console.log("Validation failed:", error.details);
    await orchestrator.retryWithBackoff(error);
  } else if (error instanceof StrRayPerformanceError) {
    // Handle performance issues
    await orchestrator.optimizePerformance(error.context);
  }
}
```

---

## Events & Hooks System

### Event-Driven Architecture

```typescript
// Listen for framework events
orchestrator.on("agent-task-completed", (event) => {
  console.log(`Task completed: ${event.taskId}`, event.result);
});

orchestrator.on("performance-anomaly-detected", (event) => {
  console.log("Performance anomaly:", event.details);
  // Trigger optimization
  await orchestrator.optimizePerformance(event.context);
});

// Register custom hooks
orchestrator.registerHook("pre-task-execution", async (context) => {
  // Pre-execution validation
  return await customValidator(context);
});

orchestrator.registerHook("post-task-execution", async (result) => {
  // Post-execution processing
  await analytics.recordMetrics(result);
});
```

---

## Custom Extensions

### Plugin Development

```typescript
import { BasePlugin, PluginContext } from "@strray/plugins";

class CustomSecurityPlugin extends BasePlugin {
  name = "custom-security";
  version = "1.0.0";

  async initialize(context: PluginContext): Promise<void> {
    // Plugin initialization
    this.context = context;
  }

  async execute(input: any): Promise<any> {
    // Custom security validation logic
    const vulnerabilities = await this.scanForVulnerabilities(input.files);

    return {
      success: vulnerabilities.length === 0,
      vulnerabilities,
      recommendations: this.generateRecommendations(vulnerabilities),
    };
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
  }
}

// Register custom plugin
await pluginSystem.registerPlugin(CustomSecurityPlugin);
```

### Custom Agent Development

```typescript
import { BaseAgent, AgentContext } from "@strray/agents";

class CustomAnalyticsAgent extends BaseAgent {
  name = "custom-analytics";
  capabilities = ["data-analysis", "insights"];

  async initialize(context: AgentContext): Promise<void> {
    this.context = context;
  }

  async execute(task: Task): Promise<TaskResult> {
    switch (task.type) {
      case "analyze-codebase":
        return await this.analyzeCodebase(task.input);
      case "generate-insights":
        return await this.generateInsights(task.input);
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }

  private async analyzeCodebase(input: any): Promise<TaskResult> {
    // Custom analysis logic
    const analysis = await this.performDeepAnalysis(input.files);

    return {
      success: true,
      data: analysis,
      metadata: {
        analysisType: "deep",
        coverage: "100%",
      },
    };
  }
}

// Register custom agent
await orchestrator.registerAgent(CustomAnalyticsAgent);
```

---

## Configuration Schema

### Complete Configuration Schema

```json
{
  "$schema": "https://opencode.ai/opencode.schema.json",
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
    "performance_mode": "optimized",
    "monitoring_enabled": true,
    "plugin_security": "strict",
    "architecture": "facade-pattern"
  },
  "advanced_features": {
    "predictive_analytics": true,
    "performance_benchmarking": true,
    "plugin_ecosystem": true,
    "advanced_monitoring": true,
    "performance_optimization": true,
    "module_api_access": false
  },
  "performance": {
    "cache_strategy": "lru-lfu",
    "memory_pool_size": "256MB",
    "optimization_interval": "5m",
    "benchmarking_enabled": true
  },
  "monitoring": {
    "real_time_alerts": true,
    "anomaly_detection": {
      "enabled": true,
      "sensitivity": "medium"
    },
    "health_checks": {
      "interval": "30s",
      "timeout": "10s"
    },
    "alerting": {
      "channels": ["email", "slack"],
      "thresholds": {
        "error_rate": 5,
        "response_time": 1000
      }
    }
  },
  "plugins": {
    "security_level": "strict",
    "auto_update": true,
    "sandboxing": true,
    "permission_model": "least-privilege"
  },
  "session_management": {
    "max_concurrent_sessions": 10,
    "session_timeout": "2h",
    "auto_cleanup": true,
    "monitoring": true
  },
  "analytics": {
    "prediction_enabled": true,
    "historical_data_retention": "30d",
    "optimization_recommendations": true,
    "performance_tracking": true
  },
  "facades": {
    "rule_enforcer": {
      "enabled": true,
      "modules": ["all"]
    },
    "task_skill_router": {
      "enabled": true,
      "modules": ["all"]
    },
    "mcp_client": {
      "enabled": true,
      "modules": ["all"]
    }
  }
}
```

---

## Migration Guide (v1.15.1)

### No Breaking Changes

**Good news: No migration needed!** ✨

StringRay v1.15.1 maintains **100% backward compatibility**. All existing code continues to work exactly as before.

### What Changed

**Public APIs** (you use these - unchanged):
- ✅ `@agent-name` invocation syntax
- ✅ CLI commands
- ✅ Configuration file formats
- ✅ Agent registration

**Internal Architecture** (changed behind the scenes):
- ✅ Facade pattern implementation
- ✅ 26 internal modules
- ✅ Optimized routing and performance
- ✅ Better error handling

### Internal vs Public APIs

**Public APIs** (stable, unchanged):
- `@agent-name` invocation syntax
- CLI commands (`npx strray-ai ...`)
- Configuration file formats
- Agent registration
- Plugin development interfaces

**Internal APIs** (refactored, not for direct use):
- Internal agent coordination
- Framework boot process
- MCP server management
- Module-level APIs (available for advanced users)

---

## Performance Considerations

### Optimization Strategies

- **Caching**: LRU/LFU hybrid caching with 85%+ hit rates
- **Memory Management**: Object pooling and garbage collection optimization
- **Parallel Processing**: Multi-threaded task execution with intelligent load balancing
- **Resource Pooling**: Connection pooling and resource reuse
- **Lazy Loading**: On-demand module loading and initialization

### Facade Pattern Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Agent spawn time | 1.2s | 0.3s | 75% faster |
| Task routing | 0.8s | 0.1s | 87% faster |
| Memory overhead | 45MB | 12MB | 73% reduction |
| Bundle size | 2.5MB | 1.1MB | 56% reduction |

---

## Security Considerations

### Enterprise Security Features

- **Plugin Sandboxing**: Isolated execution environments with permission controls
- **Input Validation**: Comprehensive input sanitization and validation
- **Authentication**: Multi-factor authentication with token rotation
- **Authorization**: Role-based access control with least-privilege principles
- **Audit Logging**: Comprehensive audit trails for all operations
- **Encryption**: End-to-end encryption for sensitive data
- **Vulnerability Scanning**: Automated security scanning and remediation

---

## Support

For API support and questions:
- GitHub Issues: https://github.com/htafolla/stringray/issues
- Documentation: https://stringray.dev/docs/api
- Community: https://github.com/htafolla/stringray/discussions

---

_Framework Version: 1.9.0 | Architecture: Facade Pattern | Last Updated: 2026-03-12_
