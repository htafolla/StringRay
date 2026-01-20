# StrRay Framework - Complete API Reference

## Table of Contents

1. [API Overview](#api-overview)
2. [Core Framework APIs](#core-framework-apis)
3. [Agent APIs](#agent-apis)
4. [Performance APIs](#performance-apis)
5. [Security APIs](#security-apis)
6. [Monitoring APIs](#monitoring-apis)
7. [Plugin APIs](#plugin-apis)
8. [REST API Endpoints](#rest-api-endpoints)
9. [WebSocket APIs](#websocket-apis)
10. [Integration APIs](#integration-apis)

---

## API Overview

The StrRay Framework provides comprehensive APIs for enterprise integration, covering core functionality, agent coordination, performance monitoring, security auditing, and plugin management.

### API Architecture Principles

- **Type Safety**: Full TypeScript definitions for all APIs
- **Async/Await**: All operations return Promises for proper async handling
- **Error Handling**: Structured error responses with detailed information
- **Versioning**: Semantic versioning with backward compatibility
- **Documentation**: Inline JSDoc comments and comprehensive examples

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

### Agent-Specific APIs

#### Code Review Agent

```typescript
interface CodeReviewRequest {
  code: string;
  language: string;
  context?: {
    filePath?: string;
    projectType?: string;
    existingCode?: string[];
  };
  rules?: CodeReviewRule[];
}

interface CodeReviewResult {
  overall: "pass" | "fail" | "needs-improvement";
  score: number; // 0-100
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  metrics: CodeMetrics;
}
```

#### Security Audit Agent

```typescript
interface SecurityAuditRequest {
  target: "code" | "dependencies" | "infrastructure";
  scope: string | string[];
  severity: "info" | "low" | "medium" | "high" | "critical";
  includeRemediation?: boolean;
}

interface SecurityAuditResult {
  vulnerabilities: Vulnerability[];
  compliance: ComplianceStatus;
  riskScore: number;
  remediation: SecurityRemediation[];
}
```

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
}
```

#### startPerformanceMonitoring()

```typescript
async startPerformanceMonitoring(config?: MonitoringConfig): Promise<string>
```

Starts performance monitoring session.

**Parameters:**

```typescript
interface MonitoringConfig {
  duration?: number; // Monitoring duration in milliseconds
  sampleRate?: number; // Metrics sampling rate
  alerts?: AlertConfig[];
  exportPath?: string;
}
```

**Returns:** Monitoring session ID

#### stopPerformanceMonitoring()

```typescript
async stopPerformanceMonitoring(sessionId: string): Promise<PerformanceReport>
```

Stops performance monitoring and returns final report.

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
  customMetrics?: Record<string, number>;
}
```

#### checkBudgetCompliance()

```typescript
async checkBudgetCompliance(): Promise<BudgetCompliance>
```

Checks current metrics against budget constraints.

**Returns:**

```typescript
interface BudgetCompliance {
  overall: "compliant" | "warning" | "violated";
  violations: BudgetViolation[];
  recommendations: string[];
}
```

### Regression Testing

#### runPerformanceRegressionTest()

```typescript
async runPerformanceRegressionTest(test: RegressionTest): Promise<RegressionResult>
```

Runs a performance regression test.

**Parameters:**

```typescript
interface RegressionTest {
  name: string;
  description: string;
  baseline: PerformanceMetrics;
  testFunction: () => Promise<any>;
  timeout?: number;
  tolerance?: number; // percentage
}
```

**Returns:**

```typescript
interface RegressionResult {
  testName: string;
  status: "passed" | "failed" | "baseline-updated";
  deviation: number; // percentage from baseline
  duration: number;
  metrics: PerformanceMetrics;
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
}
```

#### Vulnerability Management

#### getVulnerabilities()

```typescript
async getVulnerabilities(filters?: VulnerabilityFilters): Promise<Vulnerability[]>
```

Retrieves known vulnerabilities.

**Parameters:**

```typescript
interface VulnerabilityFilters {
  severity?: SecuritySeverity;
  status?: "open" | "resolved" | "mitigated";
  component?: string;
  dateRange?: DateRange;
}
```

#### updateVulnerabilityStatus()

```typescript
async updateVulnerabilityStatus(vulnId: string, status: VulnerabilityStatus): Promise<void>
```

Updates the status of a vulnerability.

### Security Hardening

#### applySecurityHardening()

```typescript
async applySecurityHardening(target: SecurityHardeningTarget): Promise<HardeningResult>
```

Applies automated security hardening measures.

**Parameters:**

```typescript
interface SecurityHardeningTarget {
  type: "code" | "configuration" | "infrastructure";
  scope: string | string[];
  rules?: SecurityRule[];
  dryRun?: boolean;
}
```

**Returns:**

```typescript
interface HardeningResult {
  appliedFixes: SecurityFix[];
  skippedFixes: SecurityFix[];
  errors: string[];
  summary: {
    totalFixes: number;
    successfulFixes: number;
    failedFixes: number;
  };
}
```

### Security Monitoring

#### getSecurityEvents()

```typescript
async getSecurityEvents(filters?: SecurityEventFilters): Promise<SecurityEvent[]>
```

Retrieves security events and incidents.

**Parameters:**

```typescript
interface SecurityEventFilters {
  type?: SecurityEventType;
  severity?: SecuritySeverity;
  timeRange?: DateRange;
  source?: string;
}
```

#### createSecurityAlert()

```typescript
async createSecurityAlert(alert: SecurityAlert): Promise<string>
```

Creates a security alert for monitoring.

---

## Monitoring APIs

### System Monitoring

#### getSystemHealth()

```typescript
async getSystemHealth(): Promise<SystemHealth>
```

Retrieves comprehensive system health information.

**Returns:**

```typescript
interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy";
  components: Record<string, ComponentHealth>;
  metrics: SystemMetrics;
  alerts: Alert[];
  lastUpdated: Date;
}
```

#### getSystemMetrics()

```typescript
async getSystemMetrics(timeRange?: TimeRange): Promise<SystemMetrics>
```

Retrieves detailed system metrics.

### Alert Management

#### getAlerts()

```typescript
async getAlerts(filters?: AlertFilters): Promise<Alert[]>
```

Retrieves active alerts.

**Parameters:**

```typescript
interface AlertFilters {
  severity?: "info" | "warning" | "error" | "critical";
  status?: "active" | "acknowledged" | "resolved";
  component?: string;
  timeRange?: DateRange;
}
```

#### acknowledgeAlert()

```typescript
async acknowledgeAlert(alertId: string, userId?: string): Promise<void>
```

Acknowledges an alert.

#### resolveAlert()

```typescript
async resolveAlert(alertId: string, resolution?: string): Promise<void>
```

Resolves an alert with optional resolution notes.

### Dashboard APIs

#### getDashboardData()

```typescript
async getDashboardData(dashboardId: string, timeRange?: TimeRange): Promise<DashboardData>
```

Retrieves dashboard data for visualization.

**Returns:**

```typescript
interface DashboardData {
  id: string;
  name: string;
  panels: DashboardPanel[];
  timeRange: TimeRange;
  lastUpdated: Date;
}
```

#### createCustomDashboard()

```typescript
async createCustomDashboard(config: DashboardConfig): Promise<string>
```

Creates a custom monitoring dashboard.

---

## Plugin APIs

### Plugin Management

#### listPlugins()

```typescript
async listPlugins(): Promise<PluginInfo[]>
```

Lists all installed plugins.

**Returns:**

```typescript
interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
  status: "active" | "inactive" | "error";
  security: PluginSecurity;
}
```

#### installPlugin()

```typescript
async installPlugin(pluginPackage: PluginPackage): Promise<PluginInstallationResult>
```

Installs a new plugin.

**Parameters:**

```typescript
interface PluginPackage {
  source: "npm" | "git" | "local";
  identifier: string; // package name, git URL, or local path
  version?: string;
  config?: PluginConfig;
}
```

#### uninstallPlugin()

```typescript
async uninstallPlugin(pluginId: string): Promise<void>
```

Uninstalls a plugin.

### Plugin Security

#### validatePlugin()

```typescript
async validatePlugin(pluginPath: string): Promise<PluginValidationResult>
```

Validates plugin security and compatibility.

**Returns:**

```typescript
interface PluginValidationResult {
  valid: boolean;
  security: {
    safe: boolean;
    issues: SecurityIssue[];
    score: number;
  };
  compatibility: {
    compatible: boolean;
    frameworkVersion: string;
    issues: string[];
  };
  capabilities: string[];
}
```

#### updatePluginPermissions()

```typescript
async updatePluginPermissions(pluginId: string, permissions: PluginPermissions): Promise<void>
```

Updates plugin permissions.

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

### Core Endpoints

#### GET /status

Get system status.

**Response:**

```json
{
  "version": "1.1.1",
  "status": "healthy",
  "uptime": 3600000,
  "agents": [
    {
      "id": "enforcer",
      "status": "active",
      "health": "healthy"
    }
  ]
}
```

#### POST /tasks

Submit a task for processing.

**Request:**

```json
{
  "type": "code-review",
  "payload": {
    "code": "function test() { return true; }",
    "language": "javascript"
  },
  "priority": "normal"
}
```

**Response:**

```json
{
  "taskId": "task_123456",
  "status": "queued",
  "estimatedDuration": 5000
}
```

#### GET /tasks/{taskId}

Get task status.

**Response:**

```json
{
  "taskId": "task_123456",
  "status": "completed",
  "progress": 100,
  "result": {
    "overall": "pass",
    "score": 95,
    "issues": []
  }
}
```

### Performance Endpoints

#### GET /performance/metrics

Get performance metrics.

#### POST /performance/budget

Set performance budget.

#### GET /performance/regressions

Get regression test results.

### Security Endpoints

#### POST /security/audit

Perform security audit.

#### GET /security/vulnerabilities

Get vulnerabilities.

#### POST /security/harden

Apply security hardening.

### Monitoring Endpoints

#### GET /monitoring/health

Get system health.

#### GET /monitoring/alerts

Get active alerts.

#### POST /monitoring/alerts/{alertId}/acknowledge

Acknowledge alert.

---

## WebSocket APIs

### Connection

```javascript
const ws = new WebSocket("wss://api.strray.framework/v1/ws");
```

### Authentication

```javascript
ws.send(
  JSON.stringify({
    type: "auth",
    token: "your-jwt-token",
  }),
);
```

### Real-time Events

#### Task Updates

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "task-update") {
    console.log("Task progress:", data.progress);
  }
};
```

#### System Alerts

```javascript
if (data.type === "alert") {
  console.log("Alert:", data.message);
}
```

#### Performance Metrics

```javascript
if (data.type === "performance-metric") {
  console.log("Metric:", data.metric, data.value);
}
```

---

## Integration APIs

### CI/CD Integration

#### Webhook Endpoints

```typescript
// GitHub Actions integration
const result = await client.integrateWithCI({
  provider: "github-actions",
  repository: "my-org/my-repo",
  workflow: "ci.yml",
  triggers: ["push", "pull-request"],
});
```

#### Pipeline Configuration

```typescript
// Jenkins pipeline integration
const pipeline = await client.generatePipelineConfig({
  provider: "jenkins",
  stages: [
    { name: "test", commands: ["npm test"] },
    { name: "security", commands: ["npm run security-audit"] },
    { name: "performance", commands: ["npm run performance:gates"] },
  ],
});
```

### Cloud Platform Integration

#### AWS Integration

```typescript
const awsIntegration = await client.integrateWithAWS({
  services: ["lambda", "api-gateway", "cloudwatch"],
  region: "us-east-1",
  monitoring: true,
  autoScaling: true,
});
```

#### Azure Integration

```typescript
const azureIntegration = await client.integrateWithAzure({
  subscriptionId: "xxx-xxx-xxx",
  resourceGroup: "strray-rg",
  services: ["functions", "monitor", "key-vault"],
});
```

#### GCP Integration

```typescript
const gcpIntegration = await client.integrateWithGCP({
  projectId: "my-project",
  services: ["functions", "monitoring", "security-center"],
});
```

### Monitoring System Integration

#### Prometheus Integration

```typescript
const prometheusConfig = await client.generatePrometheusConfig({
  metrics: ["response_time", "error_rate", "throughput"],
  alerting: {
    rules: [
      {
        alert: "HighErrorRate",
        expr: "error_rate > 0.05",
        for: "5m",
        labels: { severity: "warning" },
      },
    ],
  },
});
```

#### DataDog Integration

```typescript
const datadogConfig = await client.integrateWithDataDog({
  apiKey: "your-datadog-api-key",
  metrics: ["performance", "security", "system"],
  dashboards: true,
  alerts: true,
});
```

This comprehensive API reference provides all the interfaces needed to integrate with and extend the StrRay Framework in enterprise environments.
