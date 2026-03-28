# StrRay Framework - Enterprise API Reference

**Version**: 1.9.0 | **Architecture**: Facade Pattern | **Framework**: StringRay AI

## Table of Contents

1. [API Overview](#api-overview)
2. [Facade APIs](#facade-apis)
3. [Core Framework APIs](#core-framework-apis)
4. [Agent APIs](#agent-apis)
5. [Performance APIs](#performance-apis)
6. [Security APIs](#security-apis)
7. [Monitoring APIs](#monitoring-apis)
8. [Plugin APIs](#plugin-apis)
9. [Module APIs (Advanced)](#module-apis-advanced)
10. [REST API Endpoints](#rest-api-endpoints)
11. [WebSocket APIs](#websocket-apis)
12. [Integration APIs](#integration-apis)

---

## API Overview

The StrRay Framework v1.15.1 provides comprehensive enterprise APIs built on the **Facade Pattern** architecture, delivering:

- **87% Code Reduction**: Simplified facade interfaces over complex internal modules
- **Stable Public APIs**: 100% backward compatible with existing integrations
- **Module Access**: Direct access to 26 internal modules for advanced customization
- **Enterprise Features**: Full monitoring, security, and scalability support

### API Architecture Principles

- **Facade Pattern**: Simplified interfaces for common operations
- **Type Safety**: Full TypeScript definitions for all APIs
- **Async/Await**: All operations return Promises for proper async handling
- **Error Handling**: Structured error responses with detailed information
- **Versioning**: Semantic versioning with backward compatibility
- **Modularity**: Internal logic separated into focused modules

### Authentication & Authorization

```typescript
// API key authentication
const client = new StrRayClient({
  apiKey: "your-api-key",
  baseUrl: "https://api.strray.framework",
});

// OAuth2 authentication
const client = new StrRayClient({
  oauth2: {
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
    tokenUrl: "https://auth.strray.framework/oauth2/token",
  },
});
```

---

## Facade APIs

The new facade pattern provides simplified interfaces for the three major components:

### RuleEnforcer Facade

Centralized validation and compliance checking.

```typescript
import { RuleEnforcer } from "@strray/framework";

const enforcer = new RuleEnforcer(orchestrator);

// Validate against Codex
const result = await enforcer.validate({
  files: ["src/**/*.ts"],
  rules: ["codex-compliance", "type-safety", "no-any"],
  severity: "error"
});

// Get validation summary
const summary = await enforcer.getValidationSummary();

// Check specific rule
const ruleCheck = await enforcer.checkRule("no-console", "src/app.ts");
```

**Facade Benefits:**
- **Before**: 2,714 lines of monolithic code
- **After**: 416-line facade + 6 focused modules
- **Reduction**: 85% less code to understand

### TaskSkillRouter Facade

Intelligent task routing and agent selection.

```typescript
import { TaskSkillRouter } from "@strray/framework";

const router = new TaskSkillRouter(orchestrator);

// Route task to best agent
const route = await router.routeTask({
  task: "optimize database queries",
  context: {
    projectType: "nodejs",
    complexity: "high",
    urgency: "critical"
  }
});

// Get routing decision
console.log(route.agent); // "database-engineer"
console.log(route.confidence); // 0.95

// Get routing history
const history = await router.getRoutingHistory({
  timeframe: "24h",
  minConfidence: 0.8
});
```

**Facade Benefits:**
- **Before**: 1,933 lines of complex routing logic
- **After**: 490-line facade + 14 focused modules
- **Reduction**: 75% less code, better maintainability

### MCP Client Facade

Unified interface for MCP server communication.

```typescript
import { MCPClient } from "@strray/framework";

const mcpClient = new MCPClient(orchestrator);

// Discover available skills
const skills = await mcpClient.discoverSkills();

// Call skill with automatic retry
const result = await mcpClient.callSkill("project-analysis", {
  projectRoot: "/path/to/project",
  includeMetrics: true
});

// Get server health
const health = await mcpClient.getServerHealth();

// Batch call multiple skills
const batchResults = await mcpClient.batchCall([
  { skill: "project-analysis", params: { ... } },
  { skill: "security-audit", params: { ... } }
]);
```

**Facade Benefits:**
- **Before**: 1,413 lines of connection management
- **After**: 312-line facade + 8 focused modules
- **Reduction**: 78% less code, better error handling

---

## Core Framework APIs

### StrRayClient

Main client for interacting with the StrRay Framework.

#### Constructor

```typescript
constructor(config: StrRayClientConfig)
```

**Parameters:**

- `config.apiKey?: string` - API key for authentication
- `config.oauth2?: OAuth2Config` - OAuth2 configuration
- `config.baseUrl?: string` - Base URL for API calls (default: 'https://api.strray.framework')
- `config.timeout?: number` - Request timeout in milliseconds (default: 30000)
- `config.retries?: number` - Number of retry attempts (default: 3)

#### Methods

##### initialize()

```typescript
async initialize(): Promise<void>
```

Initializes the client connection and validates authentication.

**Throws:**

- `AuthenticationError` - Invalid credentials
- `NetworkError` - Connection issues
- `FrameworkError` - Framework not available

##### getStatus()

```typescript
async getStatus(): Promise<SystemStatus>
```

Retrieves current system status and health information.

**Returns:**

```typescript
interface SystemStatus {
  version: string;
  status: "healthy" | "degraded" | "unhealthy";
  agents: AgentStatus[];
  uptime: number;
  lastHealthCheck: Date;
  architecture: {
    type: "facade-pattern";
    facades: string[];
    modules: number;
  };
}
```

##### shutdown()

```typescript
async shutdown(): Promise<void>
```

Gracefully shuts down the client and cleans up resources.

### Framework Configuration

```typescript
interface StrRayClientConfig {
  apiKey?: string;
  oauth2?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scopes?: string[];
  };
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  facades?: {
    enableModuleAccess?: boolean; // Enable direct module APIs
  };
}
```

---

## Agent APIs

### Agent Management

#### listAgents()

```typescript
async listAgents(): Promise<AgentInfo[]>
```

Lists all available agents and their capabilities.

**Returns:**

```typescript
interface AgentInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: "active" | "inactive" | "error";
  version: string;
  lastActive: Date;
}
```

#### getAgentStatus()

```typescript
async getAgentStatus(agentId: string): Promise<AgentStatus>
```

Gets detailed status information for a specific agent.

**Parameters:**

- `agentId: string` - Unique agent identifier

**Returns:**

```typescript
interface AgentStatus {
  id: string;
  name: string;
  status: "active" | "inactive" | "error";
  health: "healthy" | "degraded" | "unhealthy";
  tasksProcessed: number;
  averageResponseTime: number;
  errorRate: number;
  lastTask: Date;
  capabilities: AgentCapability[];
}
```

### Task Execution

#### submitTask()

```typescript
async submitTask(task: TaskRequest): Promise<TaskResponse>
```

Submits a task for agent processing.

**Parameters:**

```typescript
interface TaskRequest {
  type: string;
  agent?: string; // Specific agent, or auto-assigned
  priority?: "low" | "normal" | "high" | "critical";
  payload: any;
  timeout?: number;
  callbacks?: {
    onProgress?: (progress: TaskProgress) => void;
    onComplete?: (result: TaskResult) => void;
    onError?: (error: TaskError) => void;
  };
}
```

**Returns:**

```typescript
interface TaskResponse {
  taskId: string;
  status: "queued" | "processing" | "completed" | "failed";
  estimatedDuration: number;
  assignedAgent: string;
}
```

#### getTaskStatus()

```typescript
async getTaskStatus(taskId: string): Promise<TaskStatus>
```

Retrieves the current status of a submitted task.

**Parameters:**

- `taskId: string` - Task identifier returned from submitTask()

**Returns:**

```typescript
interface TaskStatus {
  taskId: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number; // 0-100
  startTime: Date;
  estimatedCompletion: Date;
  assignedAgent: string;
  result?: TaskResult;
  error?: TaskError;
}
```

#### cancelTask()

```typescript
async cancelTask(taskId: string): Promise<boolean>
```

Cancels a running or queued task.

**Parameters:**

- `taskId: string` - Task identifier

**Returns:**

- `true` if cancellation was successful
- `false` if task could not be cancelled

---

## Performance APIs

### Performance Monitoring

#### getPerformanceMetrics()

```typescript
async getPerformanceMetrics(timeRange?: TimeRange): Promise<PerformanceMetrics>
```

Retrieves comprehensive performance metrics.

**Parameters:**

```typescript
interface TimeRange {
  start: Date;
  end?: Date;
  granularity?: "1m" | "5m" | "1h" | "1d";
}
```

**Returns:**

```typescript
interface PerformanceMetrics {
  bundleSize: BundleMetrics;
  webVitals: WebVitalsMetrics;
  runtime: RuntimeMetrics;
  regressions: RegressionMetrics[];
  alerts: PerformanceAlert[];
  facades: {
    ruleEnforcer: FacadeMetrics;
    taskSkillRouter: FacadeMetrics;
    mcpClient: FacadeMetrics;
  };
}
```

### Facade Performance Metrics

```typescript
interface FacadeMetrics {
  callsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  moduleUtilization: Record<string, number>;
}
```

### Performance Budget Management

#### setPerformanceBudget()

```typescript
async setPerformanceBudget(budget: PerformanceBudget): Promise<void>
```

Sets performance budget constraints.

**Parameters:**

```typescript
interface PerformanceBudget {
  bundleSize: {
    uncompressed: number; // bytes
    gzipped: number; // bytes
  };
  webVitals: {
    firstContentfulPaint: number; // milliseconds
    timeToInteractive: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
  };
  facadeOverhead?: {
    maxResponseTime: number; // milliseconds
    maxMemoryUsage: number; // MB
  };
  customMetrics?: Record<string, number>;
}
```

---

## Security APIs

### Security Auditing

#### performSecurityAudit()

```typescript
async performSecurityAudit(target: SecurityAuditTarget): Promise<SecurityAuditResult>
```

Performs comprehensive security audit.

**Parameters:**

```typescript
interface SecurityAuditTarget {
  type: "code" | "dependencies" | "infrastructure" | "configuration";
  scope: string | string[];
  includeDependencies?: boolean;
  severity?: SecuritySeverity;
  customRules?: SecurityRule[];
  checkFacades?: boolean; // Audit facade implementations
}
```

**Returns:**

```typescript
interface SecurityAuditResult {
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    infoIssues: number;
  };
  issues: SecurityIssue[];
  compliance: ComplianceStatus;
  remediation: SecurityRemediation[];
  reportId: string;
  facadeSecurity: {
    ruleEnforcer: SecurityStatus;
    taskSkillRouter: SecurityStatus;
    mcpClient: SecurityStatus;
  };
}
```

---

## Module APIs (Advanced)

Direct access to internal modules for advanced customization:

### Accessing Modules

```typescript
import { 
  ValidationEngine,
  RuleRegistry,
  CodexValidator 
} from "@strray/enforcer/modules";

// Get module from facade
const enforcer = new RuleEnforcer(orchestrator);
const validationEngine = enforcer.getModule("validation-engine");

// Use module directly
const result = await validationEngine.validate({
  files: ["src/**/*.ts"],
  rules: registry.getRules("strict")
});
```

### Available Modules

**RuleEnforcer (6 modules):**
1. `ValidationEngine` - Core validation logic
2. `RuleRegistry` - Rule management
3. `CodexValidator` - Codex compliance
4. `ErrorReporter` - Error reporting
5. `MetricsCollector` - Performance metrics
6. `ConfigManager` - Configuration

**TaskSkillRouter (14 modules):**
1. `TaskParser` - Task parsing
2. `SkillMatcher` - Skill matching
3. `AgentSelector` - Agent selection
4. `ComplexityScorer` - Complexity scoring
5. `ContextAnalyzer` - Context analysis
6. `KeywordExtractor` - Keyword extraction
7. `IntentClassifier` - Intent classification
8. `ConfidenceScorer` - Confidence scoring
9. `HistoryAnalyzer` - Historical analysis
10. `FallbackHandler` - Fallback logic
11. `CacheManager` - Result caching
12. `LoadBalancer` - Load balancing
13. `RoutingEngine` - Core routing
14. `AnalyticsCollector` - Analytics

**MCP Client (8 modules):**
1. `ServerDiscovery` - Server discovery
2. `ConnectionPool` - Connection pooling
3. `ProtocolHandler` - Protocol handling
4. `MessageRouter` - Message routing
5. `ErrorRecovery` - Error recovery
6. `CacheManager` - Response caching
7. `HealthMonitor` - Health monitoring
8. `ConfigLoader` - Configuration

---

## REST API Endpoints

### Base URL

```
https://api.strray.framework/v1
```

### Authentication

All endpoints require authentication via API key or OAuth2.

```
Authorization: Bearer <token>
```

### Facade Endpoints

#### GET /facades

Get all available facades and their status.

**Response:**

```json
{
  "facades": [
    {
      "name": "rule-enforcer",
      "version": "1.15.11",
      "status": "healthy",
      "modules": 6,
      "metrics": {
        "callsPerMinute": 150,
        "averageResponseTime": 45
      }
    },
    {
      "name": "task-skill-router",
      "version": "1.15.11",
      "status": "healthy",
      "modules": 14,
      "metrics": {
        "callsPerMinute": 200,
        "averageResponseTime": 25
      }
    }
  ]
}
```

#### POST /facades/{facadeName}/execute

Execute a facade method.

**Request:**

```json
{
  "method": "validate",
  "params": {
    "files": ["src/**/*.ts"],
    "rules": ["codex-compliance"]
  }
}
```

---

## WebSocket APIs

### Connection

```javascript
const ws = new WebSocket("wss://api.strray.framework/v1/ws");
```

### Real-time Facade Events

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === "facade-call") {
    console.log("Facade called:", data.facade, data.method);
  }
  
  if (data.type === "module-metric") {
    console.log("Module metric:", data.module, data.metric);
  }
};
```

---

## Integration APIs

### CI/CD Integration

#### Webhook Endpoints

```typescript
// GitHub Actions integration with facade metrics
const result = await client.integrateWithCI({
  provider: "github-actions",
  repository: "my-org/my-repo",
  workflow: "ci.yml",
  triggers: ["push", "pull-request"],
  facadeReporting: true, // Include facade performance metrics
});
```

### Migration from Legacy APIs

```typescript
// Old API (still works - backward compatible)
const enforcer = orchestrator.getAgent("enforcer");
await enforcer.validate({ ... });

// New facade API (recommended)
const enforcer = new RuleEnforcer(orchestrator);
await enforcer.validate({ ... });

// Direct module access (advanced)
const engine = enforcer.getModule("validation-engine");
await engine.validate({ ... });
```

---

## Version Compatibility

### Current Version: 1.9.0

**Facade Pattern Architecture:**
- **Public APIs**: 100% backward compatible
- **Facade APIs**: New in v1.15.1
- **Module APIs**: New in v1.15.1 (advanced users)

### Migration Path

No migration required for existing code. The facade pattern adds new APIs while maintaining all existing ones.

**To use new features:**
1. Import facades from `@strray/framework`
2. Access modules via `facade.getModule()` for advanced use cases
3. Monitor performance improvements automatically

---

## Support

For enterprise API support:
- Documentation: https://stringray.dev/docs/enterprise-api
- GitHub Issues: https://github.com/htafolla/stringray/issues
- Enterprise Support: enterprise@stringray.dev

---

_Framework Version: 1.9.0 | Architecture: Facade Pattern | Last Updated: 2026-03-12_
