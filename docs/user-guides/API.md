#  - API Documentation

## Overview

StrRay Framework is an enterprise-grade AI orchestration platform that provides systematic error prevention and quality assurance through intelligent task delegation and codex compliance enforcement.

**Version**: 1.0.0
**Last Updated**: 2026-01-11
**Test Coverage**: 98%+
**Codex Compliance**: 99.6% error prevention

## Table of Contents

- [Quick Start](#quick-start)
- [Core API](#core-api)
- [Orchestrator API](#orchestrator-api)
- [Agent APIs](#agent-apis)
- [Codex Integration](#codex-integration)
- [Configuration](#configuration)
- [Examples](#examples)

## Quick Start

```typescript
import { activateStrRayFramework, strRayOrchestrator } from "@strray/framework";

// Activate StrRay Framework
await activateStrRayFramework();

// Execute a complex task
const results = await strRayOrchestrator.executeComplexTask(
  "Implement user authentication",
  [
    {
      id: "design",
      description: "Design auth system",
      subagentType: "architect",
    },
    {
      id: "implement",
      description: "Implement auth logic",
      subagentType: "enforcer",
    },
    {
      id: "test",
      description: "Test auth system",
      subagentType: "test-architect",
    },
  ],
);
```

## Core API

### Framework Activation

```typescript
activateStrRayFramework(config?: StrRayConfig): Promise<void>
```

Activates the StrRay Framework with optional configuration.

**Parameters:**

- `config` (optional): Framework configuration object

**Returns:** Promise that resolves when framework is activated

**Example:**

```typescript
await activateStrRayFramework({
  multiAgentOrchestration: { enabled: true },
  codexEnforcement: { level: "strict" },
});
```

### Default Configuration

```typescript
defaultStrRayConfig: StrRayConfig;
```

Provides default framework configuration.

**Type:**

```typescript
interface StrRayConfig {
  multiAgentOrchestration: {
    enabled: boolean;
    maxConcurrentAgents: number;
    conflictResolution: "majority_vote" | "expert_priority" | "consensus";
  };
  codexEnforcement: {
    level: "strict" | "moderate" | "lenient";
    cacheEnabled: boolean;
  };
  performance: {
    monitoring: boolean;
    memoryLimits: boolean;
  };
}
```

## Orchestrator API

### StrRayOrchestrator Class

The main orchestration engine for complex multi-agent tasks.

#### Constructor

```typescript
new StrRayOrchestrator(config?: Partial<OrchestratorConfig>)
```

**Parameters:**

- `config` (optional): Orchestrator configuration

#### Configuration Interface

```typescript
interface OrchestratorConfig {
  maxConcurrentTasks: number; // Default: 5
  taskTimeout: number; // Default: 300000 (5 minutes)
  conflictResolutionStrategy: "majority_vote" | "expert_priority" | "consensus";
}
```

#### executeComplexTask Method

```typescript
executeComplexTask(
  description: string,
  tasks: TaskDefinition[],
  sessionId?: string
): Promise<TaskResult[]>
```

Executes a complex multi-step task by coordinating multiple subagents.

**Parameters:**

- `description`: Human-readable task description
- `tasks`: Array of task definitions with dependencies
- `sessionId` (optional): Session identifier for state management

**Returns:** Array of task results

**Example:**

```typescript
const results = await orchestrator.executeComplexTask("Build user dashboard", [
  {
    id: "analyze",
    description: "Analyze requirements",
    subagentType: "architect",
    priority: "high",
  },
  {
    id: "design",
    description: "Design components",
    subagentType: "architect",
    dependencies: ["analyze"],
  },
  {
    id: "implement",
    description: "Implement dashboard",
    subagentType: "enforcer",
    dependencies: ["design"],
  },
]);
```

#### Task Definition Interface

```typescript
interface TaskDefinition {
  id: string; // Unique task identifier
  description: string; // Human-readable description
  subagentType: string; // Target subagent ('architect', 'enforcer', etc.)
  priority?: "high" | "medium" | "low";
  dependencies?: string[]; // IDs of prerequisite tasks
}
```

#### Task Result Interface

```typescript
interface TaskResult {
  success: boolean; // Whether task completed successfully
  result?: any; // Task output data
  error?: string; // Error message if failed
  duration: number; // Execution time in milliseconds
}
```

#### resolveConflicts Method

```typescript
resolveConflicts(conflicts: Conflict[]): any
```

Resolves conflicts between different subagent responses.

**Parameters:**

- `conflicts`: Array of conflicting responses

**Returns:** Resolved response based on configured strategy

#### getStatus Method

```typescript
getStatus(): OrchestratorStatus
```

Returns current orchestrator status and configuration.

**Returns:**

```typescript
interface OrchestratorStatus {
  activeTasks: number;
  config: OrchestratorConfig;
}
```

### Singleton Instance

```typescript
strRayOrchestrator: StrRayOrchestrator;
```

Pre-configured orchestrator instance ready for use.

## Agent APIs

### Architect Agent

Specialized agent for system design and technical decisions.

```typescript
interface ArchitectAgent {
  designSystem(requirements: SystemRequirements): Promise<DesignDocument>;
  analyzeScalability(currentDesign: DesignDocument): Promise<ScalabilityReport>;
  suggestArchitecture(patterns: string[]): Promise<ArchitectureSuggestion[]>;
}

interface SystemRequirements {
  functionality: string[];
  constraints: Constraint[];
  qualityAttributes: QualityAttribute[];
}

interface DesignDocument {
  components: Component[];
  relationships: Relationship[];
  patterns: DesignPattern[];
}
```

### Enforcer Agent

Quality gate enforcement and compliance validation.

```typescript
interface EnforcerAgent {
  validateCode(code: string, rules: RuleSet): Promise<ValidationResult>;
  enforceCompliance(context: Context, codex: Codex): Promise<ComplianceReport>;
  detectViolations(content: string, term: CodexTerm): Promise<Violation[]>;
}

interface ValidationResult {
  compliant: boolean;
  violations: Violation[];
  suggestions: string[];
}
```

### Bug Triage Specialist

Error investigation and surgical fixes.

```typescript
interface BugTriageAgent {
  categorizeIssue(error: Error, context: Context): Promise<IssueCategory>;
  prioritizeFixes(issues: Issue[]): Promise<PrioritizedIssue[]>;
  suggestFixes(issue: Issue): Promise<FixSuggestion[]>;
}

type IssueCategory = "critical" | "high" | "medium" | "low" | "enhancement";
```

### Code Reviewer

Code quality assessment and standards validation.

```typescript
interface CodeReviewAgent {
  reviewCode(code: string, standards: CodingStandards): Promise<ReviewReport>;
  suggestImprovements(code: string): Promise<Improvement[]>;
  validatePatterns(
    code: string,
    patterns: Pattern[],
  ): Promise<PatternValidation>;
}

interface ReviewReport {
  score: number; // 0-100 quality score
  issues: CodeIssue[];
  recommendations: string[];
}
```

### Security Auditor

Vulnerability detection and security recommendations.

```typescript
interface SecurityAgent {
  auditCode(code: string): Promise<SecurityReport>;
  detectVulnerabilities(code: string): Promise<Vulnerability[]>;
  recommendSecurityMeasures(risks: Risk[]): Promise<SecurityMeasure[]>;
}

interface SecurityReport {
  riskLevel: "critical" | "high" | "medium" | "low" | "none";
  vulnerabilities: Vulnerability[];
  recommendations: SecurityMeasure[];
}
```

### Refactorer Agent

Technical debt elimination and code consolidation.

```typescript
interface RefactorAgent {
  analyzeDebt(codebase: Codebase): Promise<DebtReport>;
  suggestRefactors(code: string): Promise<RefactorSuggestion[]>;
  consolidateCode(fragments: CodeFragment[]): Promise<ConsolidatedCode>;
}

interface DebtReport {
  totalDebt: number;
  hotspots: CodeHotspot[];
  recommendations: RefactorSuggestion[];
}
```

### Test Architect

Testing strategy design and coverage planning.

```typescript
interface TestArchitectAgent {
  designTestStrategy(requirements: Requirements): Promise<TestStrategy>;
  analyzeCoverage(tests: TestSuite, code: Codebase): Promise<CoverageReport>;
  suggestTests(code: string, scenarios: Scenario[]): Promise<TestSuggestion[]>;
}

interface TestStrategy {
  unitTests: TestPlan;
  integrationTests: TestPlan;
  e2eTests: TestPlan;
  coverage: CoverageTarget;
}
```

## Codex Integration

### Codex Injection Hook

```typescript
createStrRayCodexInjectorHook(): HookFunction
```

Creates a hook that injects codex context into agent operations.

**Returns:** Hook function for integration with oh-my-opencode

### Codex Statistics

```typescript
getCodexStats(): CodexStats
```

Returns statistics about loaded codex terms and compliance.

```typescript
interface CodexStats {
  totalTerms: number;
  loadedFiles: string[];
  cacheHits: number;
  lastUpdated: string;
}
```

### Codex Cache Management

```typescript
clearCodexCache(): void
```

Clears the codex context cache, forcing reload on next access.

### Context Loader

```typescript
class StrRayContextLoader {
  loadCodexContext(paths?: string[]): Promise<CodexContext>;
  parseCodexContent(content: string): ParsedCodex;
  validateAgainstCodex(action: string, context: Context): ValidationResult;
  getTerm(termNumber: number): CodexTerm | undefined;
  getCoreTerms(): CodexTerm[];
  getZeroToleranceTerms(): CodexTerm[];
}

const strRayContextLoader: StrRayContextLoader;
```

## Configuration

### Framework Configuration

```typescript
interface StrRayConfig {
  multiAgentOrchestration: {
    enabled: boolean;
    maxConcurrentAgents: number;
    conflictResolution: "majority_vote" | "expert_priority" | "consensus";
  };
  codexEnforcement: {
    level: "strict" | "moderate" | "lenient";
    cacheEnabled: boolean;
    maxCacheSize: number;
  };
  performance: {
    monitoring: boolean;
    memoryLimits: {
      maxHeapMB: number;
      maxMemoryPoolMB: number;
    };
    profiling: boolean;
  };
  logging: {
    level: "error" | "warn" | "info" | "debug";
    structured: boolean;
    fileOutput: boolean;
  };
}
```

### Configuration Files

Configuration is loaded from multiple sources in order of precedence:

1. `.strray/config.json` (project-specific)
2. `~/.config/opencode/opencode.json` (global)
3. `.opencode/oh-my-opencode.json` (project oh-my-opencode settings)

## Examples

### Complete Framework Setup

```typescript
import {
  activateStrRayFramework,
  strRayOrchestrator,
  defaultStrRayConfig,
} from "@strray/framework";

// Custom configuration
const config = {
  ...defaultStrRayConfig,
  multiAgentOrchestration: {
    enabled: true,
    maxConcurrentAgents: 3,
    conflictResolution: "expert_priority",
  },
  codexEnforcement: {
    level: "strict",
    cacheEnabled: true,
  },
};

// Activate framework
await activateStrRayFramework(config);

console.log("StrRay Framework activated successfully!");
```

### Complex Multi-Agent Task

```typescript
const taskResults = await strRayOrchestrator.executeComplexTask(
  "Implement e-commerce checkout system",
  [
    {
      id: "security-audit",
      description: "Audit security requirements",
      subagentType: "security-auditor",
      priority: "high",
    },
    {
      id: "design-architecture",
      description: "Design system architecture",
      subagentType: "architect",
      dependencies: ["security-audit"],
    },
    {
      id: "implement-payment",
      description: "Implement payment processing",
      subagentType: "enforcer",
      dependencies: ["design-architecture"],
    },
    {
      id: "code-review",
      description: "Review implementation",
      subagentType: "code-reviewer",
      dependencies: ["implement-payment"],
    },
    {
      id: "test-system",
      description: "Design and execute tests",
      subagentType: "test-architect",
      dependencies: ["code-review"],
    },
  ],
);

// Check results
taskResults.forEach((result) => {
  if (result.success) {
    console.log(`✅ ${result.result.id}: ${result.result.data}`);
  } else {
    console.error(`❌ ${result.result?.id}: ${result.error}`);
  }
});
```

### Codex Compliance Validation

```typescript
import { strRayContextLoader } from "@strray/framework";

// Load codex context
const context = await strRayContextLoader.loadCodexContext();

// Validate code against codex
const validation = strRayContextLoader.validateAgainstCodex(
  "implement-feature",
  {
    code: "function add(a, b) { return a + b; }",
    language: "typescript",
    context: "utility function",
  },
);

if (validation.compliant) {
  console.log("✅ Code is codex compliant");
} else {
  console.log("❌ Codex violations found:", validation.violations);
}
```

### Custom Agent Delegation

```typescript
// Direct agent delegation for simple tasks
const architect = new ArchitectAgent();
const design = await architect.designSystem({
  functionality: ["user authentication", "data persistence"],
  constraints: [{ type: "performance", value: "99.9% uptime" }],
  qualityAttributes: ["security", "scalability", "maintainability"],
});

console.log("System design:", design);
```

## Error Handling

StrRay Framework provides comprehensive error handling:

```typescript
try {
  const results = await strRayOrchestrator.executeComplexTask(/* ... */);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error("Codex validation failed:", error.message);
  } else if (error instanceof OrchestrationError) {
    console.error("Task orchestration failed:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## Performance Monitoring

```typescript
import { performanceSystem } from "@strray/framework";

// Initialize monitoring
await performanceSystem.initialize();

// Get performance report
const report = await performanceSystem.generateReport();
console.log("Performance metrics:", report);

// Run performance gates
const gatesPassed = await performanceSystem.runGates();
console.log("Performance gates:", gatesPassed ? "PASSED" : "FAILED");
```

## Migration Guide

### From v0.x to v1.0.9

1. **Configuration Changes:**
   - Move custom config to `.strray/config.json`
   - Update orchestrator configuration interface

2. **API Changes:**
   - `executeTask()` renamed to `executeComplexTask()`
   - New conflict resolution strategies added
   - Enhanced error reporting

3. **Codex Integration:**
   - Automatic codex injection via hooks
   - New context validation methods
   - Improved caching system

## Support

- **Documentation**: [strray.dev/docs](https://strray.dev/docs)
- **Issues**: [github.com/strray-framework/stringray/issues](https://github.com/strray-framework/stringray/issues)
- **Discussions**: [github.com/strray-framework/stringray/discussions](https://github.com/strray-framework/stringray/discussions)

---

**** - Enterprise-grade AI orchestration with systematic error prevention.
