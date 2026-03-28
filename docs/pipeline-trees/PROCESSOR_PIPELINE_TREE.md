# Processor Pipeline

**Purpose**: Execute validation, compliance, and enhancement processors before/after operations

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PROCESSOR PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                           INPUT LAYER                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐                          │
│  │executePreProcessors │  │executePostProcessors│                          │
│  │ processor-manager.ts│  │ processor-manager.ts│                          │
│  └──────────┬──────────┘  └──────────┬──────────┘                          │
└─────────────┼────────────────────────┼─────────────────────────────────────┘
              │                         │
              └─────────────┬───────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │               PROCESSOR ENGINES (5 layers)                          │  │
│  │                                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                LAYER 1: Processor Registry                   │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │                ProcessorRegistry                         │ │   │  │
│  │  │  │             processor-registry.ts                       │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  13 processors registered (5 pre + 8 post)              │ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │              LAYER 2: Pre-Processors (5)                   │   │  │
│  │  │                                                             │   │  │
│  │  │  Sorted by priority (ascending):                            │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │  │
│  │  │  │preValidate │→ │logProtect  │→ │codexCom   │→        │   │  │
│  │  │  │   (10)    │  │   (10)    │  │   (20)    │        │   │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘        │   │  │
│  │  │  ┌─────────────┐  ┌─────────────┐                        │   │  │
│  │  │  │versionComp │→ │errorBound  │→                        │   │  │
│  │  │  │   (25)    │  │   (30)    │                        │   │  │
│  │  │  └─────────────┘  └─────────────┘                        │   │  │
│  │  │                                                             │   │  │
│  │  │  1. preValidate (10) - Syntax checking                      │   │  │
│  │  │  2. logProtection (10) - Log sanitization                  │   │  │
│  │  │  3. codexCompliance (20) - Codex rules validation           │   │  │
│  │  │  4. versionCompliance (25) - NPM/UVM version check        │   │  │
│  │  │  5. errorBoundary (30) - Error handling setup              │   │  │
│  │  │                                                             │   │  │
│  │  │  1. preValidate (10) - Syntax checking                      │   │  │
│  │  │  2. codexCompliance (20) - Codex rules validation           │   │  │
│  │  │  3. versionCompliance (25) - NPM/UVM version check          │   │  │
│  │  │  4. errorBoundary (30) - Error handling setup             │   │  │
│  │  │  NOTE: LogProtectionProcessor exists but NOT registered      │   │  │
│  │  │                                                             │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                  LAYER 3: Main Operation                     │   │  │
│  │  │                                                             │   │  │
│  │  │           ┌─────────────────────────────────┐              │   │  │
│  │  │           │         TOOL EXECUTION           │              │   │  │
│  │  │           │                                   │              │   │  │
│  │  │           │   Read/Write/Modify/Execute...    │              │   │  │
│  │  │           │                                   │              │   │  │
│  │  │           └─────────────────────────────────┘              │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │             LAYER 4: Post-Processors (8)                     │   │  │
│  │  │                                                             │   │  │
│  │  │  Sorted by priority (ascending):                            │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │  │
│  │  │  │inferenceImp │→ │testExecute │→ │regression   │→       │   │  │
│  │  │  │   (5)     │  │   (40)    │  │   (45)     │        │   │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘        │   │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │  │
│  │  │  │stateValid  │→ │refactorLog │→ │testAutoCrt │→        │   │  │
│  │  │  │   (50)    │  │   (55)    │  │   (60)     │        │   │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘        │   │  │
│  │  │  ┌─────────────┐  ┌─────────────┐                        │   │  │
│  │  │  │coverageAnl │→ │agentsMdVal │                        │   │  │
│  │  │  │   (65)    │  │   (70)    │                        │   │  │
│  │  │  └─────────────┘  └─────────────┘                        │   │  │
│  │  │                                                             │   │  │
│  │  │  1. inferenceImprovement (5) - Model refinement            │   │  │
│  │  │  2. testExecution (40) - Run test suite                   │   │  │
│  │  │  3. regressionTesting (45) - Detect regressions            │   │  │
│  │  │  4. stateValidation (50) - State consistency check         │   │  │
│  │  │  5. refactoringLogging (55) - Agent completion logging    │   │  │
│  │  │  6. testAutoCreation (60) - Auto-generate tests           │   │  │
│  │  │  7. coverageAnalysis (65) - Test coverage analysis         │   │  │
│  │  │  8. agentsMdValidation (70) - AGENTS.md validation          │   │  │
│  │  │                                                             │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │              LAYER 5: Health Monitoring                    │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │                  ProcessorHealth                          │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  Status: healthy | degraded | failed                    │ │   │  │
│  │  │  │  lastExecution: timestamp                              │ │   │  │
│  │  │  │  successRate: percentage                                │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  ProcessorMetrics:                                      │ │   │  │
│  │  │  │  • totalExecutions                                     │ │   │  │
│  │  │  │  • successRate                                         │ │   │  │
│  │  │  │  • avgDuration                                         │ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     v
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTPUT LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                   PostProcessorResult[]                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │  │
│  │  │    name     │  │   success  │  │   error    │                │  │
│  │  │  (string)   │  │  (boolean) │  │  (string)  │                │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │  │
│  │                                                                     │  │
│  │  Additional: data, duration, timestamp                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Compact Data Flow

```
Tool Execution Request
    │
    ▼
executePreProcessors(tool, args, context)
    │
    ├─► Get pre-processors (type="pre", enabled)
    ├─► Sort by priority (ascending)
    │
    ▼
For each processor:
    │
    ├─► processorRegistry.get(name)
    │
    └─► processor.execute(context)
    │
    ▼
Tool Execution
    │
    ▼
executePostProcessors(operation, data, preResults)
    │
    ├─► Get post-processors (type="post", enabled)
    ├─► Sort by priority (ascending)
    │
    ▼
For each processor:
    │
    ├─► processorRegistry.get(name)
    │
    └─► processor.execute({operation, data, preResults})
    │
    ▼
Return PostProcessorResult[]
```

## Layers

- **Layer 1**: Processor Registry (ProcessorRegistry)
- **Layer 2**: Pre-Processors (5, priority-ordered)
- **Layer 3**: Main Operation
- **Layer 4**: Post-Processors (8, priority-ordered)
- **Layer 5**: Health Monitoring (ProcessorHealth)

## Pre-Processors (Priority Order)

| Priority | Processor | Purpose |
|----------|-----------|---------|
| 10 | preValidate | Syntax checking |
| 10 | logProtection | Log sanitization |
| 20 | codexCompliance | Codex rules validation |
| 25 | versionCompliance | NPM/UVM version check |
| 30 | errorBoundary | Error handling setup |

## Post-Processors (Priority Order)

| Priority | Processor | Purpose |
|----------|-----------|---------|
| 5 | inferenceImprovement | Model refinement |
| 40 | testExecution | Run test suite |
| 45 | regressionTesting | Detect regressions |
| 50 | stateValidation | State consistency |
| 55 | refactoringLogging | Agent completion logging |
| 60 | testAutoCreation | Auto-generate tests |
| 65 | coverageAnalysis | Test coverage analysis |
| 70 | agentsMdValidation | AGENTS.md validation |

## Components

| Component | File |
|-----------|------|
| ProcessorManager | `src/processors/processor-manager.ts` |
| ProcessorRegistry | `src/processors/processor-registry.ts` |
| PreValidateProcessor | `src/processors/implementations/pre-validate-processor.ts` |
| LogProtectionProcessor | `src/processors/implementations/log-protection-processor.ts` |
| CodexComplianceProcessor | `src/processors/implementations/codex-compliance-processor.ts` |
| VersionComplianceProcessor | `src/processors/implementations/version-compliance-processor.ts` |
| ErrorBoundaryProcessor | `src/processors/implementations/error-boundary-processor.ts` |
| InferenceImprovementProcessor | `src/processors/implementations/inference-improvement-processor.ts` |
| TestExecutionProcessor | `src/processors/implementations/test-execution-processor.ts` |
| RegressionTestingProcessor | `src/processors/implementations/regression-testing-processor.ts` |
| StateValidationProcessor | `src/processors/implementations/state-validation-processor.ts` |
| RefactoringLoggingProcessor | `src/processors/implementations/refactoring-logging-processor.ts` |
| TestAutoCreationProcessor | `src/processors/implementations/test-auto-creation-processor.ts` |
| CoverageAnalysisProcessor | `src/processors/implementations/coverage-analysis-processor.ts` |
| AgentsMdValidationProcessor | `src/processors/implementations/agents-md-validation-processor.ts` |

## Entry Points

| Entry | File:Line | Description |
|-------|-----------|-------------|
| executePreProcessors() | processor-manager.ts | Pre-processing |
| executePostProcessors() | processor-manager.ts | Post-processing |

## Exit Points

| Exit | Data |
|------|------|
| Success | PostProcessorResult[] |
| Failure | Error thrown |

## Artifacts

- ProcessorMetrics: { totalExecutions, successRate, avgDuration }
- ProcessorHealth: { healthy | degraded | failed }

## Testing Requirements

1. Pre-processors execute in priority order
2. Post-processors execute in priority order
3. Metrics recorded
4. Health status updated
