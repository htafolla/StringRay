# Inference Pipeline Design

> How the 17 tuning engines connect, process data, and achieve autonomous inference improvement.

---

## 1. Pipeline Architecture

The StringRay inference pipeline is a layered system of 17 engines across 5 categories:

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
│  │  └───────────────┘ └───────────────┘ └───────────────┘              │  │
│  │  ┌───────────────┐ ┌───────────────┐                                 │  │
│  │  │HistoryMatcher │ │ComplexityRouter│                                 │  │
│  │  └───────────────┘ └───────────────┘                                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                     │
│                                     v                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                   ANALYTICS ENGINES (6)                             │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │  │
│  │  │OutcomeTracker   │→│RoutingAnalytics │→│RoutingPerformance│       │  │
│  │  │                 │ │                 │ │Analyzer         │       │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘       │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │  │
│  │  │PromptPattern    │→│  RoutingRefiner │ │SimplePattern    │       │  │
│  │  │Analyzer         │ │                 │ │Analyzer         │       │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                     │
│                                     v                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                   LEARNING ENGINES (4)                              │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │  │
│  │  │PatternPerformance│→│EmergingPattern │→│PatternLearning  │       │  │
│  │  │Tracker         │ │Detector         │ │Engine           │       │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘       │  │
│  │  ┌─────────────────┐ ┌─────────────────┐                           │  │
│  │  │  LearningEngine │ │   AdaptiveKernel│                           │  │
│  │  │  (P9 placeholder)│               │                           │  │
│  │  └─────────────────┘ └─────────────────┘                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                     │                                     │
│                                     v                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                 AUTONOMOUS ENGINES (2)                              │  │
│  │  ┌─────────────────────────────┐ ┌─────────────────────────────┐    │  │
│  │  │AutonomousReportGenerator   │→│InferenceImprovementProcessor│    │  │
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

## 2. Data Flow

### 2.1 Input Sources

| Source | Type | Location | Engines Consuming |
|--------|------|----------|-------------------|
| Reflection documents | Static | `docs/reflections/` | LearningEngine, AdaptiveKernel |
| Activity logs | Stream | `logs/framework/activity.log` | OutcomeTracker, RoutingAnalytics |
| Routing outcomes | Stream | `logs/framework/routing-outcomes.json` | All analytics engines |
| Task descriptions | Real-time | Consumer input | TaskSkillRouter, RouterCore |
| Historical decisions | Batch | StateManager | HistoryMatcher, ComplexityCalibrator |
| Configuration | Static | `.opencode/strray/features.json` | All engines |
| Agent feedback | Stream | After execution | OutcomeTracker, PatternPerformanceTracker |

### 2.2 Engine Data Flows

#### Flow 1: Real-time Routing
```
Consumer Input
    ↓
TaskSkillRouter.preprocess() / routeTask()
    ↓
RouterCore.route()
    ├→ KeywordMatcher.match() [if keywords found]
    ├→ HistoryMatcher.match() [if taskId provided]
    ├→ ComplexityRouter.route() [if complexity score provided]
    └→ KernelPatterns.analyze() [kernel insights]
    ↓
RoutingResult { agent, skill, confidence, context }
    ↓
AgentDelegator.execute()
    ↓
OutcomeTracker.recordOutcome() ←── Records for analytics
    ↓
StateManager.save() [if session persists]
```

#### Flow 2: Analytics Processing
```
OutcomeTracker.getOutcomes()
    ↓
RoutingPerformanceAnalyzer.generatePerformanceReport()
    ├→ calculateAgentMetrics()
    ├→ analyzeKeywordEffectiveness()
    └→ analyzeConfidenceThresholds()
    ↓
RoutingPerformanceReport { agentMetrics, keywordEffectiveness, recommendations }
    ↓
┌───────────────────────────────────────────────────────────────┐
│ RoutingRefiner                                                  │
│  ├→ PromptPatternAnalyzer.analyzePromptPatterns()              │
│  │   └→ detectTemplateGaps()                                   │
│  │   └→ identifyEmergingPatterns()                            │
│  │   └→ analyzeMissedKeywords()                               │
│  └→ suggestMappingOptimizations()                              │
│      └→ generateConfigurationUpdate()                          │
└───────────────────────────────────────────────────────────────┘
    ↓
ConfigurationUpdate { newMappings, optimizations, warnings }
```

#### Flow 3: Learning & Adaptation
```
PatternPerformanceTracker.trackPatternPerformance()
    ├→ Updates success rates, confidence averages
    └→ Builds time series data
    ↓
EmergingPatternDetector.detectEmergingPatterns()
    ├→ extractKeywords()
    ├→ clusterTasks() [Jaccard similarity]
    └→ isPatternEmerging()
    ↓
PatternLearningEngine.learnFromData()
    ├→ generatePatternModifications()
    ├→ generatePatternRemovals()
    ├→ generateThresholdUpdates()
    └→ generateNewPatterns()
    ↓
LearningResult { newPatterns, modifiedPatterns, removedPatterns }
    ↓
AdaptiveKernel.analyzeWithP9()
    ├→ Checks cache validity
    ├→ performP9Analysis()
    └→ Auto-applies high-confidence updates
    ↓
PatternUpdate[] applied to kernel
```

### 2.3 Output Types

| Output | Produced By | Consumed By |
|--------|-------------|-------------|
| Routing decisions | TaskSkillRouter | OutcomeTracker |
| Configuration updates | RoutingRefiner | Configuration files |
| Diagnostic reports | AutonomousReportGenerator | Humans, CI/CD |
| Performance metrics | RoutingPerformanceAnalyzer | Humans, dashboards |
| Pattern drift alerts | PatternPerformanceTracker | AdaptiveKernel |
| Complexity adjustments | ComplexityCalibrator | ComplexityAnalyzer |

---

## 3. Integration Points

### 3.1 inference-improvement-processor.ts

**Location:** `src/processors/implementations/inference-improvement-processor.ts`

**Purpose:** Periodic processor that ties the autonomous learning loop together.

```typescript
// Key integration points
interface InferenceImprovementProcessor {
  // Inputs from other engines
  getOutcomes(): RoutingOutcome[]           // From OutcomeTracker
  getPerformanceReport(): RoutingPerformanceReport  // From RoutingPerformanceAnalyzer
  getConfigurationUpdate(): ConfigurationUpdate     // From RoutingRefiner
  
  // Outputs to other systems
  applyRefinements(update: ConfigurationUpdate): void  // To configuration files
  logImprovements(summary: string): void                 // To activity logs
  emitMetrics(metrics: InferenceMetrics): void           // To monitoring
}
```

**Integration Flow:**
```
InferenceImprovementProcessor.execute()
    │
    ├→ 1. Collect data from analytics engines
    │     ├→ OutcomeTracker.getOutcomes()
    │     ├→ RoutingPerformanceAnalyzer.generatePerformanceReport()
    │     └→ RoutingRefiner.generateRefinementReport()
    │
    ├→ 2. Analyze for improvements
    │     ├→ PatternLearningEngine.learnFromData()
    │     ├→ EmergingPatternDetector.detectEmergingPatterns()
    │     └→ ComplexityCalibrator.calibrate()
    │
    ├→ 3. Generate recommendations
    │     ├→ Suggest new keyword mappings
    │     ├→ Recommend confidence adjustments
    │     └→ Identify underperforming patterns
    │
    ├→ 4. Apply (if autonomous mode enabled)
    │     ├→ Update routing-mappings.ts
    │     ├→ Update complexity thresholds
    │     └→ Commit changes
    │
    └→ 5. Report results
          ├→ Log improvements
          └→ Emit metrics
```

### 3.2 Processor Manager Integration

**Location:** `src/processors/processor-manager.ts`

The ProcessorManager orchestrates all processors including inference-improvement:

```typescript
// Processor execution order
const PROCESSOR_ORDER = [
  'pre-validate-processor',      // Input sanitization
  'codex-compliance-processor',  // Rule enforcement
  'state-validation-processor',  // Data integrity
  'error-boundary-processor',   // Exception isolation
  'inference-improvement-processor',  // Learning (runs last)
];
```

### 3.3 External Entry Points

| Entry Point | Flow |
|-------------|------|
| `@agent-name` invocations | → TaskSkillRouter → RouterCore → Engines |
| `npx strray-ai analytics` | → SimplePatternAnalyzer → insights |
| `npx strray-ai calibrate` | → ComplexityCalibrator → adjustments |
| `npx strray-ai report` | → FrameworkReportingSystem → reports |
| `npm run analytics:daily` | → DailyRoutingAnalysis → refinements |
| Scheduled (cron/interval) | → ProcessorManager → InferenceImprovementProcessor |

---

## 4. CLI Integration

### 4.1 Command-to-Engine Mapping

| CLI Command | Primary Engine | Secondary Engines |
|-------------|---------------|-------------------|
| `strray-ai install` | postinstall.cjs | ConfigLoader |
| `strray-ai health` | System checks | FeaturesConfig |
| `strray-ai analytics` | SimplePatternAnalyzer | OutcomeTracker |
| `strray-ai calibrate` | ComplexityCalibrator | ComplexityAnalyzer |
| `strray-ai report` | FrameworkReportingSystem | AutonomousReportGenerator |
| `strray-ai doctor` | System diagnostics | ConfigLoader |
| `strray-ai capabilities` | FeaturesConfig | AgentRegistry |

### 4.2 NPM Scripts-to-Engine Mapping

| NPM Script | Primary Engine | Frequency |
|-----------|---------------|-----------|
| `analytics:daily` | DailyRoutingAnalysis | Daily (cron) |
| `analytics:daily:apply` | RoutingRefiner | Manual |
| `monitoring:start` | Daemon | Continuous |
| `validate` | ComprehensiveValidator | Pre-commit |

### 4.3 CLI Processing Flow

```
npx strray-ai analytics
    │
    └→ src/cli/index.ts (analytics command)
        │
        └→ src/analytics/simple-pattern-analyzer.ts
            │
            └→ Analyzes logs/framework/activity.log
                │
                └→ Generates insights report
                    │
                    └→ Console output + optional file
```

```
npm run analytics:daily
    │
    └→ dist/scripts/analytics/daily-routing-analysis.js
        │
        └→ RoutingOutcomeTracker.reloadFromDisk()
        └→ RoutingPerformanceAnalyzer.generatePerformanceReport()
        └→ RoutingRefiner.generateRefinementReport()
            │
            └→ If --apply: Updates configuration files
            └→ If --preview: Shows what would change
```

---

## 5. Autonomous Mode

### 5.1 How Periodic Execution Works

The autonomous inference improvement loop operates through three mechanisms:

#### Mechanism 1: Processor Manager (Event-Driven)
```typescript
// src/processors/processor-manager.ts
class ProcessorManager {
  async executeProcessors(context: ProcessorContext) {
    for (const processor of this.processors) {
      const result = await processor.execute(context);
      
      // inference-improvement-processor runs last
      if (processor.name === 'inference-improvement-processor') {
        await this.handleAutonomousLearning(result);
      }
    }
  }
}
```

#### Mechanism 2: Scheduled Scripts (Time-Driven)
```bash
# Via npm run analytics:daily (typically scheduled via cron)
0 2 * * * npm run analytics:daily --apply

# Or via monitoring daemon
npm run monitoring:start
# daemon.js periodically triggers analytics
```

#### Mechanism 3: AutonomousReportGenerator Scheduling
```typescript
// src/reporting/autonomous-report-generator.ts
autonomousReportGenerator.scheduleAutomaticReports(intervalMinutes);

// Uses setInterval internally
setInterval(async () => {
  await this.generateDiagnosticReport();
}, intervalMinutes * 60 * 1000);
```

### 5.2 Autonomous Learning Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS LEARNING CYCLE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    1. Collect                               │
│  │  Outcomes    │──────────┐                                   │
│  │  (1000 max)  │          │                                   │
│  └──────────────┘          v                                   │
│                   ┌────────────────┐                            │
│                   │  Analyze       │                            │
│                   │  Performance   │                            │
│                   └───────┬────────┘                            │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                  │
│         v                 v                 v                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Detect      │  │  Pattern     │  │  Calculate   │         │
│  │  Emerging    │→ │  Drift       │→ │  Adaptive    │         │
│  │  Patterns    │  │              │  │  Thresholds  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                 │                 │                 │
│         └─────────────────┼─────────────────┘                 │
│                           v                                   │
│                   ┌────────────────┐                          │
│                   │  Generate      │                          │
│                   │  Refinements   │                          │
│                   └───────┬────────┘                          │
│                           │                                   │
│         ┌─────────────────┴─────────────────┐                  │
│         v                                   v                  │
│  ┌──────────────┐                  ┌──────────────┐           │
│  │  Preview     │                  │  Apply       │           │
│  │  (--preview) │                  │  (--apply)   │           │
│  └──────────────┘                  └──────┬───────┘           │
│                                             │                   │
│                           ┌─────────────────┴─────────────────┐ │
│                           v                                   v │
│                    ┌─────────────┐                    ┌─────────────┐│
│                    │ Update     │                    │ Log &      ││
│                    │ Configs    │                    │ Report     ││
│                    └─────────────┘                    └─────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Configuration for Autonomous Mode

```typescript
// src/core/features-config.ts
interface FeaturesConfig {
  activity_logging: {
    enabled: boolean;           // Enable/disable logging
  };
  
  token_optimization: {
    enabled: boolean;           // Enable token optimization
    max_context_tokens: number;
  };
  
  agent_spawn: {
    max_concurrent: number;     // Max concurrent agents
    max_per_type: number;        // Max per agent type
  };
  
  autonomous_reporting: {
    enabled: boolean;           // Enable autonomous reports
    interval_minutes: number;    // Report interval
  };
  
  pattern_learning: {
    enabled: boolean;           // Enable P9 learning
    auto_apply_threshold: number; // Confidence threshold for auto-apply
    learning_interval_ms: number; // Time between learning cycles
  };
}
```

### 5.4 Execution Intervals

| Component | Default Interval | Configurable | Trigger |
|-----------|-----------------|--------------|---------|
| Processor execution | Per task | Yes | Event-driven |
| Pattern learning | 5 minutes | Yes | Time-based |
| Daily analytics | 24 hours | Yes | Cron/scheduled |
| Report generation | On-demand | N/A | Manual |
| Cache invalidation | 1 minute | Yes | Time-based |
| Log persistence | 5 seconds | Yes | Debounced |

---

## 6. Engine Dependencies

```
TaskSkillRouter
├── KeywordMatcher
│   └── config/default-mappings/*.ts
├── HistoryMatcher
│   └── StateManager (for persistence)
├── ComplexityRouter
│   └── complexity-core.ts
└── RouterCore
    └── kernel-patterns.ts

OutcomeTracker
└── logs/framework/routing-outcomes.json

RoutingAnalytics
└── OutcomeTracker

RoutingPerformanceAnalyzer
├── OutcomeTracker
└── PromptPatternAnalyzer

PromptPatternAnalyzer
└── OutcomeTracker

RoutingRefiner
├── RoutingPerformanceAnalyzer
└── PromptPatternAnalyzer

PatternPerformanceTracker
└── PatternLearningEngine

EmergingPatternDetector
├── PatternPerformanceTracker
└── OutcomeTracker

PatternLearningEngine
├── PatternPerformanceTracker
├── EmergingPatternDetector
└── OutcomeTracker

AdaptiveKernel
├── Kernel (kernel-patterns.ts)
├── PatternPerformanceTracker
├── EmergingPatternDetector
└── PatternLearningEngine

InferenceImprovementProcessor
├── OutcomeTracker
├── RoutingPerformanceAnalyzer
├── RoutingRefiner
├── PatternLearningEngine
├── ComplexityCalibrator
└── FeaturesConfig

AutonomousReportGenerator
├── ConfigLoader
└── FrameworkLogger
```

---

## 7. Key Files Reference

| File | Role |
|------|------|
| `src/delegation/task-skill-router.ts` | Main routing facade |
| `src/delegation/routing/router-core.ts` | Routing orchestration |
| `src/delegation/analytics/outcome-tracker.ts` | Outcome persistence |
| `src/delegation/analytics/learning-engine.ts` | P9 learning interface |
| `src/delegation/complexity-calibrator.ts` | Calibration from logs |
| `src/analytics/routing-performance-analyzer.ts` | Performance metrics |
| `src/analytics/prompt-pattern-analyzer.ts` | Pattern gap detection |
| `src/analytics/routing-refiner.ts` | Configuration suggestions |
| `src/analytics/pattern-performance-tracker.ts` | Pattern metrics |
| `src/analytics/emerging-pattern-detector.ts` | New pattern discovery |
| `src/analytics/pattern-learning-engine.ts` | Adaptive modifications |
| `src/core/adaptive-kernel.ts` | Kernel learning composition |
| `src/processors/implementations/inference-improvement-processor.ts` | Autonomous loop |
| `src/reporting/autonomous-report-generator.ts` | Periodic reports |
| `src/cli/index.ts` | CLI commands |
