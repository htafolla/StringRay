# StringRay Architecture - Unified View

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INPUT LAYER                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ Reflections │  │   Logs      │  │  Reports    │  │ Consumer Input  │   │
│  │  (docs/)   │  │ (logs/)    │  │ (reports/) │  │  (tasks/@)    │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │
└─────────┼────────────────┼────────────────┼────────────────────┼───────────┘
          │                │                │                    │
          └────────────────┴────────────────┴────────────────────┘
                                     │
                                     v
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROCESSING LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    ROUTING ENGINES (5)                              │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐              │  │
│  │  │TaskSkillRouter│→│  RouterCore   │→│KeywordMatcher │              │  │
│  │  │ (facade)     │ │               │ │               │              │  │
│  │  └───────────────┘ └───────────────┘ └───────────────┘              │  │
│  │  ┌───────────────┐ ┌───────────────┐                                 │  │
│  │  │HistoryMatcher │→│ComplexityRouter│→                               │  │
│  │  └───────────────┘ └───────────────┘                                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                     │
│                                     v                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                   ANALYTICS ENGINES (6)                             │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │  │
│  │  │OutcomeTracker   │→│RoutingAnalytics │→│RoutingPerf      │       │  │
│  │  │                 │ │                 │ │Analyzer         │       │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘       │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │  │
│  │  │PromptPattern    │→│  RoutingRefiner │→│SimplePattern    │       │  │
│  │  │Analyzer         │ │                 │ │Analyzer         │       │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                     │
│                                     v                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                   LEARNING ENGINES (4)                              │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │  │
│  │  │PatternPerf     │→│EmergingPattern  │→│PatternLearning  │       │  │
│  │  │Tracker         │ │Detector         │ │Engine           │       │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘       │  │
│  │  ┌─────────────────┐                                               │  │
│  │  │  LearningEngine  │ (P9 adaptive learning)                       │  │
│  │  └─────────────────┘                                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                     │
│                                     v                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                 AUTONOMOUS ENGINES (2)                              │  │
│  │  ┌─────────────────────────────┐ ┌─────────────────────────────┐    │  │
│  │  │AutonomousReportGenerator   │→│InferenceImprovementProcessor │    │  │
│  │  │(periodic diagnostics)      │ │(periodic refinement)        │    │  │
│  │  └─────────────────────────────┘ └─────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     v
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTPUT LAYER                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ Improved    │  │ Configuration│  │ Diagnostic  │  │ Refined         │   │
│  │ Routing     │  │ Updates     │  │ Reports     │  │ Mappings        │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Engine Components

### ROUTING ENGINES (5)

| Engine | File | Purpose |
|--------|------|---------|
| TaskSkillRouter | `src/delegation/task-skill-router.ts` | Facade - main entry point for task routing |
| RouterCore | `src/delegation/routing/router-core.ts` | Core routing orchestration |
| KeywordMatcher | `src/delegation/routing/keyword-matcher.ts` | Keyword-based task matching |
| HistoryMatcher | `src/delegation/routing/history-matcher.ts` | Historical pattern matching |
| ComplexityRouter | `src/delegation/routing/complexity-router.ts` | Complexity-based routing |

### ANALYTICS ENGINES (6)

| Engine | File | Purpose |
|--------|------|---------|
| OutcomeTracker | `src/delegation/analytics/outcome-tracker.ts` | Track routing outcomes |
| RoutingAnalytics | `src/delegation/analytics/routing-analytics.ts` | Analyze routing patterns |
| RoutingPerformanceAnalyzer | `src/analytics/routing-performance-analyzer.ts` | Performance metrics |
| PromptPatternAnalyzer | `src/analytics/prompt-pattern-analyzer.ts` | Pattern detection in prompts |
| RoutingRefiner | `src/analytics/routing-refiner.ts` | Refine routing based on data |
| SimplePatternAnalyzer | `src/analytics/simple-pattern-analyzer.ts` | Basic pattern analysis |

### LEARNING ENGINES (4)

| Engine | File | Purpose |
|--------|------|---------|
| PatternPerformanceTracker | `src/analytics/pattern-performance-tracker.ts` | Track pattern performance |
| EmergingPatternDetector | `src/analytics/emerging-pattern-detector.ts` | Detect new patterns |
| PatternLearningEngine | `src/analytics/pattern-learning-engine.ts` | Learn from patterns |
| LearningEngine | `src/delegation/analytics/learning-engine.ts` | Adaptive learning (P9) |

### AUTONOMOUS ENGINES (2)

| Engine | File | Purpose |
|--------|------|---------|
| AutonomousReportGenerator | `src/reporting/autonomous-report-generator.ts` | Periodic diagnostic reports |
| InferenceImprovementProcessor | `src/processors/implementations/inference-improvement-processor.ts` | Periodic model refinement |

---

## Data Flow Summary

```
INPUT → ROUTING → ANALYTICS → LEARNING → AUTONOMOUS → OUTPUT

1. INPUT: Consumer task (@agent, CLI, API)
          ↓
2. ROUTING: TaskSkillRouter → RouterCore → Matchers → Router
          ↓
3. ANALYTICS: Track outcome → Analyze patterns → Generate metrics
          ↓
4. LEARNING: Detect patterns → Learn → Adapt
          ↓
5. AUTONOMOUS: Periodic reports → Inference improvements
          ↓
6. OUTPUT: Refined routing → Config updates → Reports
```

---

## Counts Verification

| Category | Expected | Actual |
|----------|----------|--------|
| Routing Engines | 5 | ✅ 5 |
| Analytics Engines | 6 | ✅ 6 |
| Learning Engines | 4 | ✅ 4 |
| Autonomous Engines | 2 | ✅ 2 |
| **TOTAL** | **17** | **17** |

---

## Pipeline Integration

These engines are used by the 6 pipelines:

| Pipeline | Primary Engines Used |
|----------|---------------------|
| Routing Pipeline | TaskSkillRouter, RouterCore, KeywordMatcher, HistoryMatcher, ComplexityRouter, OutcomeTracker, PatternTracker |
| Governance Pipeline | RuleEnforcer, RuleRegistry, RuleHierarchy, ValidatorRegistry, RuleExecutor, ViolationFixer |
| Boot Sequence | BootOrchestrator, ContextLoader, StateManager, AgentDelegator, SessionCoordinator, SessionMonitor, SessionStateManager, ProcessorManager, SecurityHardener, InferenceTuner |
| Orchestration Pipeline | StringRayOrchestrator, EnhancedMultiAgentOrchestrator, AgentDelegator, AgentSpawnGovernor, OutcomeTracker |
| Processor Pipeline | ProcessorManager, ProcessorRegistry, 5 pre-processors, 8 post-processors |
| Reporting Pipeline | FrameworkReportingSystem, FrameworkLogger |
