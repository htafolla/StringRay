# StrRay Framework - Agents API Reference

## Overview

The StrRay Framework provides 8 specialized AI agents for enterprise-grade development workflows. Each agent operates in `subagent` mode with comprehensive tool access and intelligent delegation capabilities.

## Agent Architecture

### Core Agent Interface

```typescript
interface AgentConfig {
  name: string;
  model: string;
  description: string;
  mode: "subagent";
  system: string;
  temperature: number;
  tools: {
    include: string[];
    exclude?: string[];
  };
  permission: {
    edit: "allow" | "deny";
    bash: Record<string, "allow" | "deny">;
  };
}
```

## Agents Reference

### 1. Enforcer Agent

**Purpose**: Runtime error detection and prevention with systematic validation.

#### Configuration

```typescript
const enforcer: AgentConfig = {
  name: "enforcer",
  model: "opencode/grok-code",
  description:
    "StrRay Framework enforcer with error handling, compliance monitoring, and systematic validation - Advanced Error Preventer",
  mode: "subagent",
  temperature: 0.1,
  tools: {
    include: [
      "read",
      "grep",
      "run_terminal_cmd",
      "background_task",
      "lsp_*",
      "lsp_diagnostics",
      "lsp_code_actions",
      "security-scan",
      "enforcer-daily-scan",
      "framework-compliance-audit",
      "pre-commit-introspection",
      "interactive-validator",
    ],
  },
  permission: {
    edit: "allow",
    bash: {
      git: "allow",
      npm: "allow",
      bun: "allow",
      security: "allow",
      enforcer: "allow",
      eslint: "allow",
      prettier: "allow",
    },
  },
};
```

#### Capabilities

- **Error Prevention**: 99.6% systematic error prevention
- **Static Analysis**: Type checking and validation
- **Runtime Monitoring**: Circuit breaker patterns
- **Compliance Enforcement**: Universal Development Codex v1.2.22
- **Performance Budgeting**: Memory (256MB), CPU (80%), timeout (45s)

#### Command Integration

- `security-scan`: Automated security vulnerability scanning
- `enforcer-daily-scan`: Daily framework compliance monitoring
- `framework-compliance-audit`: Comprehensive codex validation
- `pre-commit-introspection`: Pre-commit validation and fixes
- `interactive-validator`: Real-time code validation

### 2. Architect Agent

**Purpose**: System design, dependency mapping, and architectural integrity.

#### Configuration

```typescript
const architect: AgentConfig = {
  name: "architect",
  model: "opencode/grok-code",
  description:
    "StrRay Framework architect with system design, dependency mapping, and architectural validation - Advanced Architecture Sentinel",
  mode: "subagent",
  temperature: 0.3,
  tools: {
    include: [
      "read",
      "grep",
      "run_terminal_cmd",
      "background_task",
      "performance-analysis",
      "framework-compliance-audit",
      "model-health-check",
      "sisyphus-validation",
    ],
  },
  permission: {
    edit: "allow",
    bash: {
      git: "allow",
      npm: "allow",
      bun: "allow",
      architect: "allow",
      design: "allow",
    },
  },
};
```

#### Capabilities

- **Dependency Mapping**: Comprehensive dependency analysis and visualization
- **Global State Management**: Conflict resolution and synchronization
- **Complexity Analysis**: 6-metric task evaluation for optimal delegation
- **Design Pattern Validation**: SOLID principles and clean architecture
- **System Architecture**: Microservices and event sourcing patterns

#### Command Integration

- `performance-analysis`: System performance and bottleneck analysis
- `framework-compliance-audit`: Architecture compliance validation
- `model-health-check`: System health and dependency monitoring
- `sisyphus-validation`: Complex system validation and testing

### 3. Orchestrator Agent

**Purpose**: Multi-agent coordination and enterprise task orchestration.

#### Configuration

```typescript
const orchestrator: AgentConfig = {
  name: "orchestrator",
  model: "opencode/grok-code",
  description:
    "StrRay Framework orchestrator with multi-agent coordination, workflow management, and enterprise task orchestration - Advanced Enterprise Coordinator",
  mode: "subagent",
  temperature: 0.3,
  tools: {
    include: [
      "read",
      "grep",
      "run_terminal_cmd",
      "background_task",
      "performance-analysis",
      "framework-compliance-audit",
      "model-health-check",
      "sisyphus-validation",
    ],
  },
  permission: {
    edit: "allow",
    bash: {
      git: "allow",
      npm: "allow",
      bun: "allow",
      orchestrate: "allow",
      coordinate: "allow",
    },
  },
};
```

#### Capabilities

- **Subagent Delegation**: Intelligent task distribution to specialized agents
- **Workflow Coordination**: Multi-step operation management and sequencing
- **Resource Management**: Load balancing and capacity optimization
- **Progress Tracking**: Real-time monitoring and milestone validation
- **Conflict Resolution**: Expert priority and consensus algorithms

#### Command Integration

- `performance-analysis`: Workflow performance monitoring and optimization
- `framework-compliance-audit`: Orchestration compliance and validation
- `model-health-check`: System orchestration health assessment
- `sisyphus-validation`: Complex workflow validation

### 4. Bug Triage Specialist Agent

**Purpose**: Systematic error investigation and surgical fix implementation.

#### Configuration

```typescript
const bugTriageSpecialist: AgentConfig = {
  name: "bug-triage-specialist",
  model: "opencode/grok-code",
  description:
    "StrRay Framework bug triage specialist with error investigation, root cause analysis, and surgical code fixes - Advanced Bug Investigation Specialist",
  mode: "subagent",
  temperature: 0.3,
  tools: {
    include: [
      "read",
      "grep",
      "run_terminal_cmd",
      "background_task",
      "performance-analysis",
      "framework-compliance-audit",
      "model-health-check",
      "security-scan",
    ],
  },
  permission: {
    edit: "allow",
    bash: {
      git: "allow",
      npm: "allow",
      bun: "allow",
      debug: "allow",
      triage: "allow",
    },
  },
};
```

#### Capabilities

- **Error Investigation**: Systematic analysis of error causes and conditions
- **Root Cause Analysis**: Deep investigation to identify fundamental issues
- **Impact Assessment**: Evaluation of system-wide effects and dependencies
- **Surgical Code Fixes**: Precise, targeted corrections with minimal changes
- **Regression Testing**: Comprehensive validation to prevent reoccurrences

#### Command Integration

- `performance-analysis`: Error impact assessment and bottleneck detection
- `framework-compliance-audit`: Error compliance and system health validation
- `model-health-check`: Error monitoring and health assessment
- `security-scan`: Security-related bug investigation

### 5. Code Reviewer Agent

**Purpose**: Code quality assessment and standards validation.

#### Configuration

```typescript
const codeReviewer: AgentConfig = {
  name: "code-reviewer",
  model: "opencode/grok-code",
  description:
    "StrRay Framework code reviewer with quality assessment, standards validation, and comprehensive error reporting - Advanced Code Guardian",
  mode: "subagent",
  temperature: 0.3,
  tools: {
    include: [
      "read",
      "grep",
      "run_terminal_cmd",
      "background_task",
      "auto-format",
      "lint",
      "security-scan",
      "framework-compliance-audit",
    ],
  },
  permission: {
    edit: "allow",
    bash: {
      git: "allow",
      npm: "allow",
      bun: "allow",
      review: "allow",
      quality: "allow",
    },
  },
};
```

#### Capabilities

- **Code Quality Assessment**: Comprehensive evaluation of code quality and standards
- **Security Validation**: Security vulnerability detection and prevention
- **Performance Analysis**: Performance impact assessment and optimization
- **Standards Enforcement**: Framework-specific standards and best practices
- **Documentation Review**: Documentation completeness and technical accuracy

#### Command Integration

- `auto-format`: Automated code formatting and style fixes
- `lint`: ESLint validation and error reporting
- `security-scan`: Security vulnerability assessment
- `framework-compliance-audit`: Code quality and compliance validation

### 6. Security Auditor Agent

**Purpose**: Vulnerability detection and compliance validation.

#### Configuration

```typescript
const securityAuditor: AgentConfig = {
  name: "security-auditor",
  model: "opencode/grok-code",
  description:
    "StrRay Framework security auditor with vulnerability detection, compliance validation, and automated remediation - Advanced Security Guardian",
  mode: "subagent",
  temperature: 0.3,
  tools: {
    include: [
      "read",
      "grep",
      "run_terminal_cmd",
      "background_task",
      "security-scan",
      "framework-compliance-audit",
      "model-health-check",
      "lint",
    ],
  },
  permission: {
    edit: "allow",
    bash: {
      git: "allow",
      npm: "allow",
      bun: "allow",
      security: "allow",
      audit: "allow",
    },
  },
};
```

#### Capabilities

- **Vulnerability Detection**: Automated scanning and identification of security weaknesses
- **Compliance Monitoring**: Regulatory compliance validation and reporting
- **Threat Assessment**: Real-time threat monitoring and risk analysis
- **Security Hardening**: Infrastructure and application security enhancement
- **Incident Response**: Security event handling and recovery coordination

#### Command Integration

- `security-scan`: Automated vulnerability scanning and assessment
- `framework-compliance-audit`: Security compliance validation
- `model-health-check`: Security health monitoring
- `lint`: Security-focused code analysis

### 7. Refactorer Agent

**Purpose**: Technical debt elimination and code consolidation.

#### Configuration

```typescript
const refactorer: AgentConfig = {
  name: "refactorer",
  model: "opencode/grok-code",
  description:
    "StrRay Framework refactorer with technical debt elimination, code consolidation, and surgical improvements - Advanced Code Optimization Specialist",
  mode: "subagent",
  temperature: 0.3,
  tools: {
    include: [
      "read",
      "grep",
      "run_terminal_cmd",
      "background_task",
      "performance-analysis",
      "framework-compliance-audit",
      "model-health-check",
      "auto-format",
    ],
  },
  permission: {
    edit: "allow",
    bash: {
      git: "allow",
      npm: "allow",
      bun: "allow",
      refactor: "allow",
      optimize: "allow",
    },
  },
};
```

#### Capabilities

- **Technical Debt Elimination**: Systematic removal of accumulated technical debt
- **Surgical Code Improvements**: Precise, targeted code enhancements
- **Code Consolidation**: Eliminate duplication and improve maintainability
- **Performance Optimization**: Enhance efficiency and resource utilization
- **Architecture Refinement**: Improve system design and component structure

#### Command Integration

- `performance-analysis`: Refactoring impact assessment and performance validation
- `framework-compliance-audit`: Code quality and technical debt evaluation
- `model-health-check`: Refactoring validation and health monitoring
- `auto-format`: Code formatting and style improvements

### 8. Test Architect Agent

**Purpose**: Test coverage optimization and automated test generation.

#### Configuration

```typescript
const testArchitect: AgentConfig = {
  name: "test-architect",
  model: "opencode/grok-code",
  description:
    "StrRay Framework test architect with comprehensive testing strategy, coverage optimization, and automated test generation - Advanced Test Validator",
  mode: "subagent",
  temperature: 0.3,
  tools: {
    include: [
      "read",
      "grep",
      "run_terminal_cmd",
      "background_task",
      "security-scan",
      "performance-analysis",
      "framework-compliance-audit",
      "model-health-check",
    ],
  },
  permission: {
    edit: "allow",
    bash: {
      git: "allow",
      npm: "allow",
      bun: "allow",
      test: "allow",
      quality: "allow",
    },
  },
};
```

#### Capabilities

- **Test Auto-Creation**: Automated test generation for new components and functions
- **Coverage Analysis**: Comprehensive coverage assessment and gap identification
- **Quality Metrics**: Test quality tracking and improvement recommendations
- **Integration Testing**: Component interaction and workflow validation
- **Performance Validation**: Load testing and scalability assessment

#### Command Integration

- `security-scan`: Security-focused test generation and validation
- `performance-analysis`: Performance testing and regression detection
- `framework-compliance-audit`: Test compliance and quality validation
- `model-health-check`: Test coverage and health assessment

## Agent Communication Protocol

### Delegation System

Agents communicate through the StrRay delegation system:

```typescript
interface DelegationRequest {
  agentName: string;
  operation: string;
  context: any;
  priority: "low" | "medium" | "high" | "critical";
  timeout?: number;
}

interface DelegationResponse {
  success: boolean;
  result: any;
  executionTime: number;
  agentUsed: string;
  error?: string;
}
```

### Complexity Analysis

Tasks are automatically routed based on complexity scoring:

```typescript
interface ComplexityMetrics {
  fileCount: number; // Files affected (0-20 points)
  changeVolume: number; // Lines changed (0-25 points)
  operationType: string; // create|modify|refactor|analyze|debug|test
  dependencies: number; // Component dependencies (0-15 points)
  riskLevel: string; // low|medium|high|critical
  estimatedDuration: number; // Minutes (0-15 points)
}

interface ComplexityResult {
  score: number; // Total complexity score (0-100)
  category: "simple" | "moderate" | "complex" | "enterprise";
  recommendedAgent: string;
  estimatedTime: number;
}
```

## Usage Examples

### Basic Agent Invocation

```typescript
import { callStrRayAgent } from "strray-framework";

const result = await callStrRayAgent({
  agentName: "enforcer",
  operation: "validate-code",
  context: {
    files: ["src/main.ts"],
    rules: ["no-any", "strict-types"],
  },
});
```

### Complex Multi-Agent Workflow

```typescript
import { orchestrateWorkflow } from "strray-framework";

const workflow = await orchestrateWorkflow({
  name: "feature-development",
  tasks: [
    {
      agent: "architect",
      operation: "design-system",
      context: { requirements: featureSpec },
    },
    {
      agent: "code-reviewer",
      operation: "validate-implementation",
      dependencies: ["architect"],
    },
    {
      agent: "test-architect",
      operation: "generate-tests",
      dependencies: ["code-reviewer"],
    },
  ],
});
```

## Error Handling

### Agent-Specific Errors

```typescript
try {
  const result = await callStrRayAgent(request);
} catch (error) {
  if (error.code === "AGENT_UNAVAILABLE") {
    // Fallback to simulation mode
  } else if (error.code === "COMPLEXITY_TOO_HIGH") {
    // Escalate to orchestrator
  } else if (error.code === "VALIDATION_FAILED") {
    // Handle codex violations
  }
}
```

### Circuit Breaker Pattern

Agents implement automatic failure handling:

```typescript
interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime: number;
  resetTimeout: number;
}
```

## Performance Considerations

### Resource Limits

| Agent                 | Memory Limit | CPU Limit | Timeout | Concurrent Tasks |
| --------------------- | ------------ | --------- | ------- | ---------------- |
| enforcer              | 256MB        | 80%       | 45s     | 3                |
| architect             | 512MB        | 90%       | 120s    | 5                |
| orchestrator          | 1GB          | 95%       | 300s    | 10               |
| bug-triage-specialist | 384MB        | 85%       | 90s     | 2                |
| code-reviewer         | 256MB        | 75%       | 60s     | 4                |
| security-auditor      | 512MB        | 95%       | 180s    | 2                |
| refactorer            | 768MB        | 90%       | 240s    | 3                |
| test-architect        | 384MB        | 80%       | 120s    | 4                |

### Optimization Strategies

- **Caching**: Response caching with TTL-based invalidation
- **Batch Processing**: Parallel execution for multiple similar tasks
- **Resource Pooling**: Shared resource allocation across agents
- **Lazy Loading**: On-demand agent initialization

## Monitoring and Observability

### Metrics Collection

```typescript
interface AgentMetrics {
  agentName: string;
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  resourceUsage: {
    memoryPeak: number;
    cpuAverage: number;
    cacheHitRate: number;
  };
}
```

### Health Checks

```typescript
interface AgentHealth {
  agentName: string;
  status: "healthy" | "degraded" | "unhealthy";
  lastRequest: Date;
  consecutiveFailures: number;
  circuitBreakerState: CircuitBreakerState;
}
```

## Security Considerations

### Permission Model

- **Edit Permissions**: File modification capabilities
- **Bash Permissions**: Command execution restrictions
- **Network Access**: External service communication controls
- **Resource Limits**: Memory and CPU usage constraints

### Audit Trail

All agent operations are logged for compliance:

````typescript
interface AuditEntry {
  timestamp: Date;
  agentName: string;
  operation: string;
  userId: string;
  ipAddress: string;
  success: boolean;
  executionTime: number;
  resourceUsage: ResourceUsage;
}
```</content>
</xai:function_call">Successfully wrote to src/docs/AGENTS_API_REFERENCE.md
````
