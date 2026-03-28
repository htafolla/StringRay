# Tuning Engines Inventory

> Comprehensive documentation of all routing, inference improvement, analytics, and autonomous engines in the StringRay codebase.

## Overview

This document catalogs all "tuning engines" - systems that influence how tasks are routed, how inference quality is improved, how patterns are detected, and how the system learns and adapts over time.

---

## Category 1: Routing & Task-Skill Routing Engines

### 1.1 TaskSkillRouter (Facade)

| Attribute | Details |
|-----------|---------|
| **File** | `src/delegation/task-skill-router.ts` |
| **Purpose** | Main facade providing unified API for routing tasks to appropriate agents/skills |
| **How it runs** | Instantiated by consumers; orchestrates all routing components |
| **Inputs** | Task description, optional complexity score, session ID |
| **Outputs** | `RoutingResult` containing skill, agent, confidence, matched keyword |
| **Connections** | Uses KeywordMatcher, HistoryMatcher, ComplexityRouter, RouterCore |

**Key Methods:**
- `routeTask(taskDescription, options)` - Main routing entry point
- `preprocess(taskDescription, options)` - Pre-processes to extract operation/context
- `trackResult(taskId, agent, success)` - Records outcomes for learning
- `addMapping(keywords, skill, agent, confidence)` - Adds custom keyword mappings

---

### 1.2 RouterCore

| Attribute | Details |
|-----------|---------|
| **File** | `src/delegation/routing/router-core.ts` |
| **Purpose** | Orchestrates keyword, history, and complexity matching strategies |
| **How it runs** | Called by TaskSkillRouter for each routing decision |
| **Inputs** | Task description, complexity score, task ID |
| **Outputs** | `RoutingResult` with selected agent/skill |
| **Connections** | Uses KeywordMatcher, HistoryMatcher, ComplexityRouter, KernelPatterns |

**Priority Order:**
1. Release workflow detection (highest priority)
2. Keyword matching (multi-word phrases first, then standard)
3. Historical data (if task ID available)
4. Complexity-based routing (if complexity provided)
5. Default fallback to `enforcer`

---

### 1.3 KeywordMatcher

| Attribute | Details |
|-----------|---------|
| **File** | `src/delegation/routing/keyword-matcher.ts` |
| **Purpose** | Matches task descriptions against keyword mappings |
| **How it runs** | Called by RouterCore during routing |
| **Inputs** | Lowercase task description |
| **Outputs** | `RoutingResult` if keyword match found |
| **Connections** | Uses mappings from `config/default-mappings/` |

**Features:**
- Multi-word phrase priority (higher specificity)
- Release workflow detection
- Confidence threshold checking

---

### 1.4 HistoryMatcher

| Attribute | Details |
|-----------|---------|
| **File** | `src/delegation/routing/history-matcher.ts` |
| **Purpose** | Routes based on historical success rates for task-agent combinations |
| **How it runs** | Called by RouterCore if task ID provided |
| **Inputs** | Task ID |
| **Outputs** | `RoutingResult` based on historical success |
| **Connections** | Persists to StateManager via TaskSkillRouter |

**Logic:**
- Tracks success/failure counts per task-agent pair
- Only uses history if success rate ≥ `MIN_HISTORY_SUCCESS_RATE` (0.7)
- Replays historical data from state on initialization

---

### 1.5 ComplexityRouter

| Attribute | Details |
|-----------|---------|
| **File** | `src/delegation/routing/complexity-router.ts` |
| **Purpose** | Routes based on task complexity score |
| **How it runs** | Called by RouterCore when complexity is provided |
| **Inputs** | Complexity score (0-100) |
| **Outputs** | `RoutingResult` based on complexity tier |
| **Connections** | Uses complexity-core.ts for tier determination |

**Tier Mapping:**
| Tier | Score Range | Agent | Skill |
|------|-------------|-------|-------|
| Low | 0-15 | enforcer | code-review |
| Medium | 16-35 | architect | architecture |
| High | 36-75 | orchestrator | orchestrator |
| Enterprise | 76-100 | orchestrator | orchestrator (full team) |

---

## Category 2: Inference Improvement Engines

### 2.1 ComplexityAnalyzer

| Attribute | Details |
|-----------|---------|
| **File** | `src/delegation/complexity-analyzer.ts` |
| **Purpose** | Assesses operation complexity to determine optimal delegation strategy |
| **How it runs** | Called when analyzing operation complexity |
| **Inputs** | Operation string, context (files, changes, dependencies) |
| **Outputs** | `ComplexityScore` with level, strategy, reasoning |
| **Connections** | Uses complexity-core.ts for shared logic |

**Score Calculation:**
- File count: 4 pts/file (max 40)
- Change volume: 0.2/line (max 50)
- Dependencies: 5 each (max 25)
- Duration: 1pt/10sec (max 15)
- Operation type weight (multiplier)
- Risk level multiplier

---

### 2.2 ComplexityCalibrator

| Attribute | Details |
|-----------|---------|
| **File** | `src/delegation/complexity-calibrator.ts` |
| **Purpose** | Learning system - calibrates complexity predictions based on actual vs predicted durations |
| **How it runs** | Manual invocation via `calibrate()` |
| **Inputs** | Logs from `logs/framework/activity.log` |
| **Outputs** | `CalibrationResult` with adjusted weights/thresholds |
| **Connections** | Writes to ComplexityAnalyzer |

**Adaptation Logic:**
- If underestimated: increase weights by up to 20%
- If overestimated: decrease weights by up to 20%
- Threshold shift: up to 10 points based on accuracy patterns
- Minimum 10 samples required

---

### 2.3 LearningEngine

| Attribute | Details |
|-----------|---------|
| **File** | `src/delegation/analytics/learning-engine.ts` |
| **Purpose** | P9 learning system - placeholder for future pattern drift detection and automatic routing optimization |
| **How it runs** | Via `triggerLearning()` or automatic if enabled |
| **Inputs** | None (currently placeholder) |
| **Outputs** | `LearningResult`, `P9LearningStats`, `AdaptiveThresholds` |
| **Connections** | Part of TaskSkillRouter analytics |

**Status:** Currently a placeholder - returns static data for test compatibility. Future implementation will include:
- Pattern drift detection
- Automatic routing refinement
- Success rate learning
- Adaptive confidence thresholds

---

## Category 3: Analytics & Reporting Systems

### 3.1 RoutingOutcomeTracker

| Attribute | Details |
|-----------|---------|
| **File** | `src/delegation/analytics/outcome-tracker.ts` |
| **Purpose** | Tracks routing outcomes with circular buffer pattern for analytics |
| **How it runs** | Records outcomes on each routing decision |
| **Inputs** | `RoutingOutcome` (taskId, routedAgent, routedSkill, confidence, success) |
| **Outputs** | Statistics, prompt data points, routing decisions |
| **Connections** | Persists to `logs/framework/routing-outcomes.json` |

**Features:**
- In-memory circular buffer (max 1000 outcomes)
- Debounced persistence to disk (5 second debounce)
- `reloadFromDisk()` for cross-process analytics
- Exports `PromptDataPoint[]` and `RoutingDecision[]` for analytics

---

### 3.2 RoutingAnalytics

| Attribute | Details |
|-----------|---------|
| **File** | `src/delegation/analytics/routing-analytics.ts` |
| **Purpose** | Provides aggregated analytics from routing outcomes |
| **How it runs** | Via TaskSkillRouter or direct access |
| **Inputs** | Outcomes from RoutingOutcomeTracker |
| **Outputs** | Daily summaries, full analytics, raw stats |
| **Connections** | Uses RoutingOutcomeTracker |

---

### 3.3 RoutingPerformanceAnalyzer

| Attribute | Details |
|-----------|---------|
| **File** | `src/analytics/routing-performance-analyzer.ts` |
| **Purpose** | Analyzes routing success rates, keyword effectiveness, confidence thresholds |
| **How it runs** | Via `generatePerformanceReport()` |
| **Inputs** | Outcomes from RoutingOutcomeTracker |
| **Outputs** | `RoutingPerformanceReport` with agent metrics, keyword effectiveness |
| **Connections** | Uses RoutingOutcomeTracker |

**Metrics Produced:**
- Per-agent success rates, confidence distributions
- Keyword effectiveness (success rate per keyword)
- Confidence threshold analysis
- Recommendations for improvement

---

### 3.4 PromptPatternAnalyzer

| Attribute | Details |
|-----------|---------|
| **File** | `src/analytics/prompt-pattern-analyzer.ts` |
| **Purpose** | Analyzes actual vs template prompts to detect gaps and emerging patterns |
| **How it runs** | Via `analyzePromptPatterns()` |
| **Inputs** | Prompt data from RoutingOutcomeTracker |
| **Outputs** | `PromptComparisonResult` with gaps, emerging patterns, missed keywords |
| **Connections** | Uses RoutingOutcomeTracker |

**Analysis Types:**
- Template match rate
- Template gaps (missing templates, pattern mismatches)
- Emerging patterns (high confidence, high success rate)
- Top missed keywords
- Agent template coverage

---

### 3.5 RoutingRefiner

| Attribute | Details |
|-----------|---------|
| **File** | `src/analytics/routing-refiner.ts` |
| **Purpose** | Suggests new keyword mappings and optimizes existing ones |
| **How it runs** | Via `generateRefinementReport()` |
| **Inputs** | Prompt analysis, performance report |
| **Outputs** | `ConfigurationUpdate` with new mappings, optimizations, warnings |
| **Connections** | Uses PromptPatternAnalyzer, RoutingPerformanceAnalyzer |

**Suggestions Generated:**
- New keyword mappings (from emerging patterns, gaps, missed keywords)
- Mapping optimizations (remove low-performing keywords, adjust confidence)
- Implementation steps and warnings

---

### 3.6 AutonomousReportGenerator

| Attribute | Details |
|-----------|---------|
| **File** | `src/reporting/autonomous-report-generator.ts` |
| **Purpose** | Automatically generates comprehensive diagnostic reports |
| **How it runs** | Manual via `generateDiagnosticReport()` or scheduled via `scheduleAutomaticReports()` |
| **Inputs** | Log analysis, agent activities, pipeline operations |
| **Outputs** | `DiagnosticReport` with system health, critical issues, recommendations |
| **Connections** | Uses ConfigLoader, FrameworkLogger |

**Report Sections:**
- Session duration, log entries, activity rate
- Agent activities and pipeline usage
- System health assessment (memory, performance, initialization)
- Critical issues with root causes and recommendations
- Session summary with next steps

**Scheduling:** Can be scheduled via `scheduleAutomaticReports(intervalMinutes)` using `setInterval`

---

## Category 4: Pattern Recognition & Learning Systems

### 4.1 PatternPerformanceTracker

| Attribute | Details |
|-----------|---------|
| **File** | `src/analytics/pattern-performance-tracker.ts` |
| **Purpose** | Monitors pattern effectiveness over time, detects pattern drift |
| **How it runs** | Tracks individual pattern outcomes |
| **Inputs** | Pattern ID, success/failure, confidence, response time |
| **Outputs** | `PatternMetrics`, drift analyses, adaptive thresholds |
| **Connections** | Used by PatternLearningEngine, AdaptiveKernel |

**Features:**
- Exponential moving average for confidence (0.7 weight)
- Time series tracking (max 1000 points)
- Drift detection (15% threshold)
- Adaptive threshold calculation

---

### 4.2 EmergingPatternDetector

| Attribute | Details |
|-----------|---------|
| **File** | `src/analytics/emerging-pattern-detector.ts` |
| **Purpose** | Discovers new routing patterns from recent task requests |
| **How it runs** | Via `detectEmergingPatterns()` |
| **Inputs** | `RoutingOutcome[]` |
| **Outputs** | `PatternDiscoveryResult` with emergent patterns, clusters |
| **Connections** | Uses RoutingOutcome, generates EmergentPattern |

**Detection Logic:**
- Keyword extraction (removes stop words)
- Jaccard similarity clustering (0.4 threshold)
- Confidence calculation based on frequency
- Action suggestion: add mapping, improve routing, or monitor

---

### 4.3 PatternLearningEngine

| Attribute | Details |
|-----------|---------|
| **File** | `src/analytics/pattern-learning-engine.ts` |
| **Purpose** | Learns from performance data, generates adaptive modifications |
| **How it runs** | Via `learnFromData()` |
| **Inputs** | Outcomes array, existing mappings |
| **Outputs** | `LearningResult` with new/modified/removed patterns |
| **Connections** | Uses PatternPerformanceTracker, EmergingPatternDetector |

**Learning Types:**
- **Auto Addition**: Add emerging patterns as new mappings (requires 80% confidence, 85% success rate)
- **Auto Removal**: Remove underperforming patterns (requires 40% success rate over 20 usages)
- **Threshold Calibration**: Adaptive thresholds per agent

---

### 4.4 AdaptiveKernel

| Attribute | Details |
|-----------|---------|
| **File** | `src/core/adaptive-kernel.ts` |
| **Purpose** | Composes with Kernel to add self-modifying pattern learning |
| **How it runs** | Via `analyzeWithP9()` or `triggerLearning()` |
| **Inputs** | Observation string, or outcomes + mappings |
| **Outputs** | `P9AnalysisResult` with drift detection, suggested updates |
| **Connections** | Uses Kernel, PatternPerformanceTracker, PatternLearningEngine |

**Features:**
- Cache-based P9 analysis (1 minute cache)
- Auto-apply high-confidence updates (90% threshold)
- Periodic learning (default 5 minute interval)
- Drift analysis with recommended actions

---

## Category 5: Configuration & Feature Systems

### 5.1 FeaturesConfig

| Attribute | Details |
|-----------|---------|
| **File** | `src/core/features-config.ts` |
| **Purpose** | Manages feature flags and configuration |
| **How it runs** | Loads on framework initialization |
| **Inputs** | JSON configuration from `.opencode/strray/features.json` |
| **Outputs** | Feature flag values for various subsystems |
| **Connections** | Used throughout framework |

**Key Features:**
- Activity logging
- Token optimization
- Agent spawning limits
- Telemetry settings

---

## Engine Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONSUMER INTERFACE                                │
│                         (TaskSkillRouter Facade)                            │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          v                           v                           v
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  KeywordMatcher    │    │   HistoryMatcher   │    │  ComplexityRouter  │
│  (routing)         │    │   (historical)     │    │  (score-based)     │
└─────────┬───────────┘    └─────────┬───────────┘    └─────────┬───────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    v
                         ┌─────────────────────┐
                         │     RouterCore      │
                         │  (orchestrator)    │
                         └─────────┬───────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          v                       v                       v
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ OutcomeTracker   │   │ LearningEngine   │   │ ComplexityAnalyzer│
│ (analytics)      │   │ (P9 placeholder) │   │ (calibration)   │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         v                      v                      v
┌─────────────────────────────────────────────────────────────────────────┐
│                     ANALYTICS & LEARNING LAYER                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────┐    ┌───────────────────┐    ┌────────────────┐ │
│  │ PatternPerformance│    │ EmergingPattern   │    │ Complexity     │ │
│  │ Tracker           │    │ Detector          │    │ Calibrator     │ │
│  └────────┬──────────┘    └────────┬──────────┘    └───────┬────────┘ │
│           │                         │                      │          │
│           └────────────┬────────────┘                      │          │
│                        v                                   │          │
│              ┌─────────────────────┐                      │          │
│              │ PatternLearningEngine│                      │          │
│              └──────────┬───────────┘                      │          │
│                         │                                  │          │
│                         v                                  │          │
│              ┌─────────────────────┐                       │          │
│              │   AdaptiveKernel    │ ◄─────────────────────┘          │
│              └─────────────────────┘                                 │
│                                                                          │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐   │
│  │ RoutingPerformance       │    │ PromptPattern                   │   │
│  │ Analyzer                │    │ Analyzer                        │   │
│  └────────────┬───────────┘    └────────────┬────────────────────┘   │
│               │                             │                         │
│               v                             v                         │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │              RoutingRefiner                                │       │
│  │  (generates configuration updates)                         │       │
│  └─────────────────────────────┬───────────────────────────────┘       │
│                                │                                        │
└────────────────────────────────┼───────────────────────────────────────┘
                                 v
                    ┌────────────────────────┐
                    │ AutonomousReportGenerator│
                    │ (periodic diagnostics)  │
                    └─────────────────────────┘
```

---

## Summary Table

| Engine | Category | Primary Function | Trigger |
|--------|----------|-----------------|---------|
| TaskSkillRouter | Routing | Main routing facade | Consumer calls |
| RouterCore | Routing | Strategy orchestration | Per routing |
| KeywordMatcher | Routing | Pattern matching | Per routing |
| HistoryMatcher | Routing | Historical routing | Per routing (with taskId) |
| ComplexityRouter | Routing | Score-based routing | Per routing (with complexity) |
| ComplexityAnalyzer | Inference | Complexity assessment | On demand |
| ComplexityCalibrator | Inference | Weight calibration | Manual |
| LearningEngine | Inference | P9 learning (placeholder) | Manual/trigger |
| OutcomeTracker | Analytics | Outcome persistence | Per routing |
| RoutingPerformanceAnalyzer | Analytics | Performance metrics | On demand |
| PromptPatternAnalyzer | Analytics | Pattern gap detection | On demand |
| RoutingRefiner | Analytics | Config suggestions | On demand |
| PatternPerformanceTracker | Pattern | Metric tracking | Per pattern outcome |
| EmergingPatternDetector | Pattern | New pattern discovery | On demand |
| PatternLearningEngine | Pattern | Adaptive learning | On demand |
| AdaptiveKernel | Pattern | Kernel enhancement | On demand |
| AutonomousReportGenerator | Reporting | Diagnostic reports | Manual/scheduled |

---

## Key Data Flows

### Routing Flow
1. **TaskSkillRouter.routeTask()** → RouterCore
2. RouterCore checks release workflow → KeywordMatcher → HistoryMatcher → ComplexityRouter
3. Result returned with confidence and suggested agent/skill
4. **OutcomeTracker.recordOutcome()** called after execution

### Learning Flow
1. **OutcomeTracker** persists outcomes to disk
2. **PatternPerformanceTracker** tracks per-pattern metrics
3. **EmergingPatternDetector** finds new patterns
4. **PatternLearningEngine** generates modifications
5. **AdaptiveKernel** can auto-apply high-confidence updates

### Analytics Flow
1. **RoutingPerformanceAnalyzer** generates metrics
2. **PromptPatternAnalyzer** finds template gaps
3. **RoutingRefiner** suggests configuration updates
4. **AutonomousReportGenerator** produces diagnostic reports
