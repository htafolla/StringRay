# API Reference

**Version**: v1.0.27 | **Last Updated**: 2026-01-15 | **Framework**: StringRay AI v1.0.27

## Overview

provides a comprehensive enterprise-grade API for AI agent coordination, performance optimization, and production-ready development automation. The framework includes advanced modules for predictive analytics, secure plugin ecosystems, real-time monitoring, and sub-millisecond performance optimization.

## Core API Classes

### StrRayOrchestrator

Main orchestrator for framework initialization and agent coordination.

```typescript
import { StrRayOrchestrator } from "@strray/framework";

const orchestrator = new StrRayOrchestrator({
  configPath: ".opencode/oh-my-opencode.json",
  performanceMode: "optimized",
  monitoringEnabled: true,
});

// Initialize framework
await orchestrator.initialize();

// Get framework status
const status = await orchestrator.getStatus();
```

### Agent Coordination

#### Agent Management

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

#### Multi-Agent Orchestration

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

### Advanced Modules API

#### Performance Benchmarking

```typescript
import { PerformanceBenchmarking } from "@strray/benchmarking";

const benchmarker = new PerformanceBenchmarking(orchestrator);

// Run comprehensive benchmarking
const report = await benchmarker.runFullBenchmark({
  includeBootTime: true,
  includeTaskProcessing: true,
  includeMemoryUsage: true,
});

// Get real-time metrics
const metrics = await benchmarker.getRealTimeMetrics();
```

#### Predictive Analytics

```typescript
import { PredictiveAnalytics } from "@strray/analytics";

const analytics = new PredictiveAnalytics(orchestrator);

// Analyze agent performance patterns
const patterns = await analytics.analyzePerformancePatterns({
  timeframe: "24h",
  agents: ["all"],
});

// Get optimization recommendations
const recommendations = await analytics.getOptimizationRecommendations();

// Predict task success probability
const prediction = await analytics.predictTaskSuccess({
  task: "refactor-component",
  agent: "refactorer",
  complexity: "high",
});
```

#### Plugin Ecosystem

```typescript
import { PluginSystem } from "@strray/plugins";

const pluginSystem = new PluginSystem(orchestrator);

// Load and validate plugin
const plugin = await pluginSystem.loadPlugin({
  name: "custom-validator",
  source: "https://plugins.strray.dev/custom-validator",
  permissions: ["read-files", "validate-code"],
});

// Execute plugin in sandbox
const result = await pluginSystem.executePlugin({
  pluginId: "custom-validator",
  input: { files: ["src/**/*.ts"] },
  timeout: 30000,
});

// Get plugin health status
const health = await pluginSystem.getPluginHealth();
```

#### Advanced Monitoring

```typescript
import { AdvancedMonitor } from "@strray/monitoring";

const monitor = new AdvancedMonitor(orchestrator);

// Start real-time monitoring
await monitor.startMonitoring({
  anomalyDetection: true,
  alerting: {
    email: "devops@company.com",
    slack: "#alerts",
  },
});

// Get system health status
const health = await monitor.getSystemHealth();

// Configure custom alerts
await monitor.configureAlert({
  name: "high-error-rate",
  condition: "error_rate > 5%",
  severity: "critical",
  channels: ["email", "slack"],
});
```

#### Performance Optimization

```typescript
import { PerformanceOptimizer } from "@strray/optimization";

const optimizer = new PerformanceOptimizer(orchestrator);

// Analyze and optimize performance
const optimization = await optimizer.analyzeAndOptimize({
  targetMetrics: {
    responseTime: "< 1ms",
    memoryUsage: "< 50MB",
    cacheHitRate: "> 85%",
  },
});

// Get optimization recommendations
const recommendations = await optimizer.getOptimizationRecommendations();

// Apply performance optimizations
await optimizer.applyOptimizations(recommendations);
```

### Session Management

#### Session Lifecycle

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

#### Session Monitoring

```typescript
// Monitor session health
const health = await sessionManager.monitorSession(session.id);

// Get session analytics
const analytics = await sessionManager.getSessionAnalytics({
  sessionId: session.id,
  metrics: ["performance", "errors", "agent-utilization"],
});

// Configure session limits
await sessionManager.configureLimits({
  maxConcurrentSessions: 10,
  maxSessionDuration: "2h",
  cleanupInterval: "30m",
});
```

### State Management

#### Global State Coordination

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

### Configuration Management

#### Dynamic Configuration

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

### Error Handling & Recovery

#### Comprehensive Error Handling

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

#### Recovery Strategies

```typescript
// Automatic recovery for transient failures
const recovery = await orchestrator.recoverFromError({
  error: error,
  strategy: "exponential-backoff",
  maxRetries: 3,
});

// Circuit breaker pattern
const circuitBreaker = orchestrator.getCircuitBreaker("external-api");
if (circuitBreaker.isOpen()) {
  // Fallback logic
  return await orchestrator.executeFallback();
}
```

### Events & Hooks System

#### Event-Driven Architecture

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

orchestrator.on("plugin-health-changed", (event) => {
  if (event.status === "unhealthy") {
    await orchestrator.restartPlugin(event.pluginId);
  }
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

### Custom Extensions

#### Plugin Development

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

#### Custom Agent Development

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

### Batch Operations & Parallel Processing

#### High-Performance Batch Processing

```typescript
// Batch agent tasks
const batchResult = await orchestrator.batchExecute({
  tasks: [
    {
      agent: "enforcer",
      task: "validate-files",
      input: { files: "src/**/*.ts" },
    },
    {
      agent: "architect",
      task: "review-architecture",
      input: { files: "src/**/*.ts" },
    },
    {
      agent: "test-architect",
      task: "analyze-coverage",
      input: { files: "tests/**/*.spec.ts" },
    },
  ],
  parallel: true, // Execute in parallel
  timeout: 300000, // 5 minutes
});

// Process results
for (const result of batchResult.results) {
  if (!result.success) {
    console.log(`Task ${result.taskId} failed:`, result.error);
  }
}
```

### Configuration Schema

#### Complete Configuration Schema

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
    "performance_mode": "optimized",
    "monitoring_enabled": true,
    "plugin_security": "strict"
  },
  "advanced_features": {
    "predictive_analytics": true,
    "performance_benchmarking": true,
    "plugin_ecosystem": true,
    "advanced_monitoring": true,
    "performance_optimization": true
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
  }
}
```

### Performance Considerations

#### Optimization Strategies

- **Caching**: LRU/LFU hybrid caching with 85%+ hit rates
- **Memory Management**: Object pooling and garbage collection optimization
- **Parallel Processing**: Multi-threaded task execution with intelligent load balancing
- **Resource Pooling**: Connection pooling and resource reuse
- **Lazy Loading**: On-demand module loading and initialization

#### Monitoring & Alerting

- **Real-time Metrics**: Sub-millisecond response time tracking
- **Anomaly Detection**: Statistical process control with automated alerting
- **Performance Budgets**: Configurable thresholds with automatic optimization
- **Health Checks**: Comprehensive system health monitoring
- **Predictive Maintenance**: ML-based failure prediction and prevention

### Security Considerations

#### Enterprise Security Features

- **Plugin Sandboxing**: Isolated execution environments with permission controls
- **Input Validation**: Comprehensive input sanitization and validation
- **Authentication**: Multi-factor authentication with token rotation
- **Authorization**: Role-based access control with least-privilege principles
- **Audit Logging**: Comprehensive audit trails for all operations
- **Encryption**: End-to-end encryption for sensitive data
- **Vulnerability Scanning**: Automated security scanning and remediation

#### Security Configuration

```typescript
// Configure security policies
await orchestrator.configureSecurity({
  pluginSandboxing: {
    enabled: true,
    permissions: ["read-files", "network-access"],
    resourceLimits: {
      memory: "100MB",
      cpu: "50%",
      timeout: "30s",
    },
  },
  auditLogging: {
    enabled: true,
    retention: "1y",
    encryption: "AES-256",
  },
  vulnerabilityScanning: {
    enabled: true,
    frequency: "daily",
    autoRemediation: true,
  },
});
```

### Migration & Compatibility

#### Version Compatibility

- **v1.0.27**: Current production version with all advanced features
- **Migration Path**: Automatic migration from v0.x with backward compatibility
- **Deprecation Policy**: 6-month deprecation notice for breaking changes
- **Support**: Enterprise support for production deployments

#### Integration Patterns

```typescript
// Migrate from legacy systems
const migration = await orchestrator.migrateFromLegacy({
  sourceSystem: "legacy-framework",
  dataPath: "/path/to/legacy/data",
  preserveConfiguration: true,
});

// Validate migration
const validation = await migration.validate();

// Rollback if needed
if (!validation.success) {
  await migration.rollback();
}
```

---

_This API reference covers . The framework provides enterprise-grade capabilities for AI agent coordination, performance optimization, and production-ready development automation._
