# StringRay Pipeline Inventory

**Version**: 1.14.0  
**Date**: 2026-03-21  
**Author**: StringRay AI Team (via @researcher agent)

---

## Executive Summary

This document catalogs all major system pipelines in the StringRay framework. Each pipeline is analyzed for its components, data flows, artifacts, and testing status.

**Total Pipelines Identified**: 7 major pipelines  
**Test Coverage**: 2521+ tests across the codebase

---

## Pipeline 1: Boot Pipeline

**Purpose**: Framework initialization and component startup orchestration

**Layers**:
- Layer 0: Configuration Loading (StringRayConfigLoader)
- Layer 1: Core Orchestrator (StringRayOrchestrator)
- Layer 2: Delegation System (AgentDelegator, SessionCoordinator)
- Layer 3: Session Management (SessionMonitor, SessionCleanupManager, SessionStateManager)
- Layer 4: Processors (ProcessorManager + 11 processors)
- Layer 5: Agents (enforcer, architect, bug-triage-specialist, code-reviewer, security-auditor, refactorer, testing-lead)
- Layer 6: Security & Compliance (SecurityHardener, CodexInjector)
- Layer 7: Inference (InferenceTuner - optional)

**Components**:
- `src/core/boot-orchestrator.ts` (BootOrchestrator class)
- `src/core/config-loader.ts`
- `src/core/context-loader.ts`
- `src/state/state-manager.ts`
- `src/security/security-hardener.ts`
- `src/security/security-headers.ts`
- `src/session/session-*.ts`

**Data Flow**:
```
SIGINT/SIGTERM Signal
    │
    ▼
LoadStringRayConfiguration()
    │
    ▼
loadOrchestrator() → "orchestrator" in state
    │
    ▼
initializeDelegationSystem() → "delegation:*" in state
    │
    ▼
initializeSessionManagement() → "session:*" in state
    │
    ▼
activateProcessors() → "processor:manager" in state
    │
    ▼
loadRemainingAgents() → "agent:*" in state
    │
    ▼
enableEnforcement() → "enforcement:active" = true
    │
    ▼
activateCodexCompliance() → "compliance:active" = true
    │
    ▼
initializeSecurityComponents() → "security:*" in state
    │
    ▼
initializeInferenceTuner() → "inference:tuner_active" = true (optional)
    │
    ▼
BootResult { success, orchestratorLoaded, sessionManagementActive, ... }
```

**Artifacts**:
- State entries in `StringRayStateManager`
- Memory baseline stored: `memory:baseline`
- Boot errors stored: `boot:errors`
- Agent list stored: `session:agents`

**Testing Status**: ✅ Well-tested
- `src/__tests__/integration/boot-orchestrator.integration.test.ts`
- `src/__tests__/integration/framework-init.test.ts`

**Notes**:
- Orchestrator-first design ensures core system is available before any processing
- Graceful shutdown handling via SIGINT/SIGTERM
- Memory monitoring auto-configured on instantiation
- Async rules loaded in background after sync initialization

---

## Pipeline 2: Inference Pipeline (Autonomous Learning)

**Purpose**: Continuous improvement of task routing decisions through autonomous learning

**Layers** (6-layer architecture):
- Layer 6: Autonomous Engines (InferenceTuner, InferenceImprovementProcessor)
- Layer 5: Learning Engines (LearningEngine, EmergingPatternDetector, PatternLearningEngine)
- Layer 4: Analytics Engines (OutcomeTracker, PatternPerformanceTracker, RoutingPerformanceAnalyzer)
- Layer 3: Routing Engines (TaskSkillRouter, RouterCore, KeywordRoutingEngine)
- Layer 2: Input Processing (PreValidationProcessor, ComplexityCalibrator, ContextEnrichmentProcessor)
- Layer 1: Output (AutonomousReportGenerator, CLI Interface)

**Components**:
- `src/services/inference-tuner.ts` (InferenceTuner class)
- `src/delegation/analytics/outcome-tracker.ts` (RoutingOutcomeTracker)
- `src/delegation/analytics/pattern-performance-tracker.ts` (PatternPerformanceTracker)
- `src/delegation/analytics/learning-engine.ts` (LearningEngine)
- `src/analytics/routing-performance-analyzer.ts`
- `src/analytics/prompt-pattern-analyzer.ts`
- `src/analytics/pattern-learning-engine.ts`
- `src/analytics/emerging-pattern-detector.ts`

**Data Flow**:
```
User Task
    │
    ▼
Input Processor (sanitization, validation)
    │
    ▼
Complexity Calibrator (score calculation)
    │
    ▼
TaskSkillRouter → Keyword Matching + History + Complexity
    │
    ▼
RouterCore (routes to agent/skill)
    │
    ├──► OutcomeTracker (records routing outcome)
    ├──► PatternPerformanceTracker (updates pattern metrics)
    ├──► LearningEngine (detects patterns)
    │
    ▼
InferenceTuner (autonomous tuning cycle)
    │
    ├──► Reload data from disk
    ├──► Check data sufficiency (5+ outcomes, 3+ patterns)
    ├──► Generate performance report
    ├──► Analyze prompt patterns
    ├──► Trigger adaptive kernel learning
    └──► Suggest new keyword mappings
    │
    ▼
Auto-apply recommendations (if successRate >= 80%)
    │
    ▼
routing-mappings.json updated
```

**Artifacts**:
- `logs/framework/pattern-metrics.json` - Pattern persistence across sessions
- `.opencode/strray/routing-mappings.json` - Keyword mappings (auto-updated)
- `logs/framework/routing-outcomes.json` - Routing history
- CLI: `npx strray-ai inference:tuner --status`

**Testing Status**: ✅ Well-tested
- Integration tests with 30s timeout for tuning cycles
- Pattern persistence validated (ESM compatibility)
- `src/delegation/analytics/__tests__/learning-engine.test.ts`

**Notes**:
- InferenceTuner is optional; configured via `autoStartInferenceTuner` in BootSequenceConfig
- Tuning cycle runs every 60 seconds by default (configurable)
- Minimum thresholds: 5+ outcomes, 3+ patterns, 80% success rate
- CLI commands: `--start`, `--stop`, `--run-once`, `--status`

---

## Pipeline 3: Orchestration Pipeline (Multi-Agent Coordination)

**Purpose**: Coordinate complex multi-step tasks across multiple specialized agents

**Layers**:
- Layer 1: Task Definition (TaskDefinition interface)
- Layer 2: Complexity Analysis (ComplexityAnalyzer)
- Layer 3: Dependency Resolution (Task dependency graph)
- Layer 4: Agent Spawning (EnhancedMultiAgentOrchestrator)
- Layer 5: Execution Monitoring (Agent monitoring interface)
- Layer 6: Result Consolidation (ConsolidateHealingResults)

**Components**:
- `src/orchestrator/orchestrator.ts` (StringRayOrchestrator)
- `src/orchestrator/multi-agent-orchestration-coordinator.ts` (MultiAgentOrchestrationCoordinator)
- `src/orchestrator/enhanced-multi-agent-orchestrator.ts` (EnhancedMultiAgentOrchestrator)
- `src/delegation/complexity-analyzer.ts`
- `src/orchestrator/agent-spawn-governor.ts`
- `src/orchestrator/self-direction-activation.ts`

**Data Flow**:
```
Complex Task Request
    │
    ▼
executeComplexTask(description, tasks[], sessionId)
    │
    ▼
Build Task Dependency Graph
    │
    ▼
Execute Tasks (dependency order, max 5 concurrent)
    │
    ├──► executeSingleTask(task)
    │       │
    │       ▼
    │    Complexity Analysis
    │       │
    │       ▼
    │    delegateToSubagent()
    │       │
    │       ▼
    │    enhancedMultiAgentOrchestrator.spawnAgent()
    │       │
    │       ▼
    │    Wait for completion (polling)
    │       │
    │       ▼
    │    routingOutcomeTracker.recordOutcome()
    │       │
    │       ▼
    │    processorManager.executePostProcessors()
    │
    ▼
Collect Results
    │
    ▼
OrchestrationResult { success, completedTasks, failedTasks, ... }
```

**Test Auto-Healing Sub-Flow**:
```
orchestrateTestAutoHealing(failureContext)
    │
    ▼
analyzeTestFailurePatterns() → healingStrategy
    │
    ▼
createHealingTaskDefinitions() → TaskDefinition[]
    │
    ▼
executeComplexTask() with healing tasks
    │
    ▼
consolidateHealingResults() → healingResult
```

**Artifacts**:
- Job ID: `complex-task-${timestamp}-${random}`
- Task results in orchestrator state
- Agent-to-task mapping: `taskToAgentMap`
- Monitoring interface with agent status

**Testing Status**: ✅ Well-tested
- `src/__tests__/integration/orchestrator/basic-orchestrator.test.ts`
- `src/__tests__/integration/orchestrator/dependency-handling.test.ts`
- `src/__tests__/integration/orchestrator/concurrent-execution.test.ts`
- `src/orchestrator/orchestrator.test.ts`
- `src/orchestrator/self-direction-activation.test.ts`

**Notes**:
- Supports task dependencies with circular dependency detection
- Max concurrent tasks configurable (default: 5)
- Task timeout: 5 minutes default
- Post-processor execution for agent task completion logging
- Conflict resolution strategies: majority_vote, expert_priority, consensus

---

## Pipeline 4: Enforcement Pipeline (Rule Validation & Governance)

**Purpose**: Validate operations against codex rules and attempt automatic fixes

**Layers**:
- Layer 1: Rule Registry (RuleRegistry)
- Layer 2: Rule Hierarchy (RuleHierarchy - dependencies)
- Layer 3: Validator Registry (ValidatorRegistry)
- Layer 4: Rule Executor (RuleExecutor - orchestration)
- Layer 5: Loader Orchestration (LoaderOrchestrator - async rules)
- Layer 6: Violation Fixer (ViolationFixer - agent delegation)

**Components**:
- `src/enforcement/rule-enforcer.ts` (RuleEnforcer facade)
- `src/enforcement/core/rule-registry.ts`
- `src/enforcement/core/rule-hierarchy.ts`
- `src/enforcement/core/rule-executor.ts`
- `src/enforcement/core/violation-fixer.ts`
- `src/enforcement/validators/validator-registry.ts`
- `src/enforcement/validators/base-validator.ts`
- `src/enforcement/validators/code-quality-validators.ts`
- `src/enforcement/validators/security-validators.ts`
- `src/enforcement/validators/testing-validators.ts`
- `src/enforcement/validators/architecture-validators.ts`
- `src/enforcement/loaders/loader-orchestrator.ts`
- `src/enforcement/loaders/codex-loader.ts`
- `src/enforcement/loaders/agent-triage-loader.ts`
- `src/enforcement/loaders/processor-loader.ts`
- `src/enforcement/loaders/agents-md-validation-loader.ts`

**Data Flow**:
```
validateOperation(operation, context)
    │
    ▼
loadAsyncRules() if not initialized
    │
    ▼
RuleExecutor.execute()
    │
    ▼
Get enabled rules from RuleRegistry
    │
    ▼
Topological sort via RuleHierarchy
    │
    ▼
For each rule (in order):
    │
    ▼
ValidatorRegistry.getValidator(ruleId)
    │
    ▼
validator.validate(context) → RuleValidationResult
    │
    ▼
ValidationReport { passed, errors, warnings, results }
    │
    ▼
attemptRuleViolationFixes(violations, context)
    │
    ▼
ViolationFixer.fixViolations()
    │
    ▼
Delegate to appropriate agent/skill
    │
    ▼
ViolationFix[] with status
```

**Rule Categories**:
- Code Quality: no-duplicate-code, console-log-usage, documentation-required
- Architecture: src-dist-integrity, no-over-engineering, single-responsibility, module-system-consistency
- Security: input-validation, security-by-design
- Testing: tests-required, test-coverage, continuous-integration
- Reporting: test-failure-reporting, performance-regression-reporting
- Framework: multi-agent-ensemble, substrate-externalization, framework-self-validation

**Artifacts**:
- 30+ rules registered in RuleRegistry
- Validation reports with violations and fixes
- Async rules loaded from: CodexLoader, AgentTriageLoader, ProcessorLoader, AgentsMdValidationLoader

**Testing Status**: ✅ Well-tested
- `src/enforcement/rule-enforcer.test.ts`
- `src/enforcement/core/__tests__/rule-*.test.ts`
- `src/enforcement/validators/__tests__/*.test.ts`
- `src/enforcement/loaders/__tests__/loaders.test.ts`
- `src/__tests__/framework-enforcement-integration.test.ts`

**Notes**:
- RuleEnforcer is now a pure facade (Phase 6 refactoring)
- All validators delegated via ValidatorRegistry
- Rule dependencies managed via RuleHierarchy
- Async rules loaded in background after sync initialization
- Supports continue-on-error loader strategy

---

## Pipeline 5: Processor Pipeline (Pre/Post Processing)

**Purpose**: Execute validation, compliance, and enhancement processors before/after operations

**Layers**:
- Layer 1: Processor Registry (ProcessorRegistry)
- Layer 2: Pre-Processors (priority-ordered)
- Layer 3: Post-Processors (priority-ordered)
- Layer 4: Processor Hook System
- Layer 5: Health Monitoring (ProcessorHealth)

**Components**:
- `src/processors/processor-manager.ts` (ProcessorManager)
- `src/processors/processor-interfaces.ts` (ProcessorRegistry, IProcessor)
- `src/processors/processor-pipeline.server.ts` (MCP server)
- `src/processors/implementations/*.ts` (12 implementations)

**Pre-Processors** (priority order):
1. preValidate (10) - Syntax checking, validation
2. codexCompliance (20) - Codex rule validation
3. testAutoCreation (22) - Auto-generate tests
4. versionCompliance (25) - NPM/UVM version check
5. errorBoundary (30) - Error handling setup
6. agentsMdValidation (35) - AGENTS.md validation

**Post-Processors** (priority order):
- stateValidation (130) - State consistency check
- refactoringLogging (140) - Agent completion logging
- (others via ProcessorRegistry)

**Data Flow**:
```
Tool Execution Request
    │
    ▼
executePreProcessors(tool, args, context)
    │
    ▼
Get pre-processors (type="pre", enabled)
    │
    ▼
Sort by priority (ascending)
    │
    ▼
For each processor:
    │
    ▼
executeProcessor(name, context)
    │
    ▼
processorRegistry.get(name).execute()
    │
    ▼
Record metrics (success, duration)
    │
    ▼
If all succeed → proceed with tool
    │
    ▼
Tool Execution
    │
    ▼
executePostProcessors(operation, data, preResults)
    │
    ▼
Get post-processors (type="post", enabled)
    │
    ▼
Sort by priority (ascending)
    │
    ▼
For each processor:
    │
    ▼
executeProcessor(name, {operation, data, preResults})
    │
    ▼
Record metrics
    │
    ▼
PostProcessorResult[]
```

**MCP Server Flow** (processor-pipeline.server.ts):
```
execute-pre-processors:
    Input → Sanitize → Codex Validate → Context Enrich → Security Check → Output

execute-post-processors:
    Input → Result Validate → Compliance Enforce → Audit Trail → QA → Output

codex-validation:
    Content → Term Check → Compliance % → Violations/Warnings → Status

framework-compliance-check:
    Content → Operation Check → Score → Issues → Actions → Approval
```

**Artifacts**:
- Processor metrics: `ProcessorMetrics { totalExecutions, successRate, avgDuration }`
- Health status: `ProcessorHealth { healthy | degraded | failed }`
- MCP tools: `execute-pre-processors`, `execute-post-processors`, `codex-validation`, `framework-compliance-check`

**Testing Status**: ✅ Well-tested
- `src/__tests__/integration/processor-manager-reuse.test.ts`
- `src/postprocessor/PostProcessor.test.ts`
- `src/__tests__/postprocessor-integration.test.ts`

**Notes**:
- All processors now use ProcessorRegistry pattern (legacy switch removed)
- Processors have lifecycle: constructor/init → execute → cleanup
- Health monitoring with rolling success rate calculation
- Context validation before processor execution
- Supports processor hooks for custom processing

---

## Pipeline 6: Routing Pipeline (Task-to-Agent)

**Purpose**: Intelligent routing of tasks to appropriate agents and skills

**Layers**:
- Layer 1: Keyword Matching (KeywordMatcher)
- Layer 2: History Matching (HistoryMatcher)
- Layer 3: Complexity Routing (ComplexityRouter)
- Layer 4: Router Core (RouterCore - orchestration)
- Layer 5: Analytics (RoutingAnalytics, OutcomeTracker)

**Components**:
- `src/delegation/task-skill-router.ts` (TaskSkillRouter facade)
- `src/delegation/routing/router-core.ts`
- `src/delegation/routing/keyword-matcher.ts`
- `src/delegation/routing/history-matcher.ts`
- `src/delegation/routing/complexity-router.ts`
- `src/delegation/analytics/routing-analytics.ts`
- `src/delegation/analytics/outcome-tracker.ts`
- `src/delegation/analytics/learning-engine.ts`

**Data Flow**:
```
routeTask(taskDescription, options)
    │
    ▼
RouterCore.route()
    │
    ▼
KeywordMatcher.match(taskDescription)
    │
    ▼
HistoryMatcher.match(taskDescription)
    │
    ▼
ComplexityRouter.route(taskDescription, complexity)
    │
    ▼
Combine scores, select best agent/skill
    │
    ▼
Escalate to LLM if low confidence
    │
    ▼
RoutingResult { skill, agent, confidence, matchedKeyword, ... }
    │
    ▼
routingOutcomeTracker.recordOutcome()
    │
    ▼
Return to caller with context enrichment
```

**Mapping Configuration**:
```typescript
{
  keywords: ["security", "audit", "vulnerability"],
  agent: "security-auditor",
  skill: "vulnerability-scan",
  confidence: 0.9,
  autoGenerated: false
}
```

**Artifacts**:
- `routing_history` in state manager
- Pattern metrics persistence
- Analytics summaries (daily, full)
- P9 learning stats
- Adaptive thresholds

**Testing Status**: ✅ Well-tested
- `src/delegation/task-skill-router.test.ts`
- `src/delegation/routing/__tests__/*.test.ts`
- `src/delegation/analytics/__tests__/*.test.ts`

**Notes**:
- TaskSkillRouter is a facade delegating to specialized components
- History matcher uses success rate thresholds
- Complexity router handles fallback routing
- CLI integration for analytics: `routing:analytics`

---

## Pipeline 7: Reporting Pipeline (Analytics & Insights)

**Purpose**: Generate comprehensive framework reports from activity logs

**Layers**:
- Layer 1: Log Collection (frameworkLogger, rotated logs)
- Layer 2: Log Parsing (parseLogLine, parseCompressedLogFile)
- Layer 3: Metrics Calculation (calculateMetrics)
- Layer 4: Insights Generation (generateInsights)
- Layer 5: Report Formatting (Markdown, JSON, HTML)
- Layer 6: Scheduled Reports (scheduleAutomatedReports)

**Components**:
- `src/reporting/framework-reporting-system.ts` (FrameworkReportingSystem)
- `src/reporting/autonomous-report-generator.ts`
- `src/reporting/orchestration-flow-reporter.ts`
- `src/core/framework-logger.ts`

**Report Types**:
- `orchestration` - Agent delegation metrics
- `agent-usage` - Per-agent invocation counts
- `context-awareness` - Context operation analysis
- `performance` - Response time and throughput
- `full-analysis` - Comprehensive all-of-the-above

**Data Flow**:
```
generateReport(config)
    │
    ▼
Check cache (5 min TTL)
    │
    ▼
collectReportData(config)
    │
    ▼
getComprehensiveLogs(config)
    │   │
    │   ├──► frameworkLogger.getRecentLogs(1000)
    │   ├──► readCurrentLogFile()
    │   └──► readRotatedLogFiles() (if lastHours > 24)
    │
    ▼
filterLogsByConfig(logs, config)
    │
    ▼
calculateMetrics(logs)
    │   ├──► Agent usage counts
    │   ├──► Delegation counts
    │   ├──► Context operations
    │   ├──► Tool execution stats
    │   └──► System operation categories
    │
    ▼
calculateTimeRange(logs)
    │
    ▼
generateInsights(logs, metrics)
    │
    ▼
generateRecommendations(metrics)
    │
    ▼
formatReport(data, format) → Markdown | JSON | HTML
    │
    ▼
saveReportToFile(outputPath) (optional)
    │
    ▼
ReportData { generatedAt, timeRange, metrics, insights, recommendations, summary }
```

**Artifacts**:
- `logs/framework/activity.log` (current log)
- `logs/framework/framework-activity-*.log.gz` (rotated, compressed)
- `reports/${type}-report-${date}.md|json|html` (generated reports)

**Testing Status**: ✅ Well-tested
- `src/reporting/framework-reporting-system.test.ts`

**Notes**:
- Automatic log rotation support (gzip compressed)
- Log retention: 24 hours default
- Report caching: 5 minutes TTL
- Scheduled report generation: hourly/daily/weekly
- Log parsing handles multiple formats (with/without jobId)

---

## Undocumented Pipeline Patterns

### Emerging Patterns Detected

1. **Pattern Learning Pipeline** (partial documentation)
   - Location: `src/analytics/pattern-learning-engine.ts`
   - Status: Implemented but not fully documented
   - Uses P9 learning statistics

2. **Session Lifecycle Pipeline** (partial documentation)
   - Location: `src/session/*.ts`
   - Status: Implemented, needs comprehensive doc
   - Handles session state, cleanup, monitoring

3. **MCP Server Pipeline** (partial documentation)
   - Location: `src/mcps/**/*.ts`
   - Status: Framework exists, servers need documentation
   - Tool discovery, caching, execution

4. **Performance Monitoring Pipeline** (partial documentation)
   - Location: `src/performance/*.ts`
   - Status: Implemented, needs architecture doc
   - Benchmarking, regression testing, CI gates

---

## Pipeline Testing Status

> **Important Discovery (v1.15.1)**: Unit tests passing ≠ Pipeline working.
> See [Pipeline Testing Methodology](../PIPELINE_TESTING_METHODOLOGY.md) for details.

| Pipeline | Testing Status | Tests | Notes |
|----------|---------------|-------|-------|
| **Inference** | ✅ Tested | ? | 9 iterations, 3 consecutive passes |
| **Governance** | ✅ Tested | 12 | 3 consecutive passes |
| **Boot** | ✅ Tested | 14 | 3 consecutive passes |
| **Orchestration** | ✅ Tested | 12 | 3 consecutive passes |
| **Routing** | ✅ Tested | 15 | 3 consecutive passes |
| **Processor** | ✅ Tested | 11 | 3 consecutive passes |
| **Reporting** | ✅ Tested | 15 | 3 consecutive passes |

---

## Testing Coverage Summary

| Pipeline | Unit Tests | Integration Tests | Notes |
|----------|------------|-------------------|-------|
| Boot Pipeline | ~5 | ~10 | Core initialization |
| Inference Pipeline | ~3 | ~2 | 30s timeout for tuning |
| Orchestration Pipeline | ~10 | ~15 | Multi-agent coordination |
| Enforcement Pipeline | ~15 | ~8 | Rule validation |
| Processor Pipeline | ~5 | ~3 | Pre/post processing |
| Routing Pipeline | ~10 | ~5 | Task routing |
| Reporting Pipeline | ~2 | ~1 | Log analysis |
| **Total** | **~50** | **~44** | **2521+ tests passing** |

---

## Recommendations

1. **Create dedicated pipeline documentation** for each major pipeline with:
   - Sequence diagrams
   - Error handling strategies
   - Performance characteristics

2. **Add pipeline health dashboards** for:
   - Processor execution times
   - Rule validation success rates
   - Routing confidence distributions

3. **Implement pipeline monitoring** for:
   - End-to-end latency tracking
   - Error rate alerting
   - Resource utilization

4. **Document the MCP server pipeline** which currently lacks comprehensive docs

---

*Generated by @researcher agent on 2026-03-21*
