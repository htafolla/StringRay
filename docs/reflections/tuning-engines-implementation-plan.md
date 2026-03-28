# Tuning Engines Implementation Plan

> Phased plan to enable autonomous learning and outcome tracking in StringRay.

## Current State

| Component | Status | Issue |
|-----------|--------|-------|
| OutcomeTracker | EXISTS | Not called after routing |
| PatternPerformanceTracker | EXISTS | Never receives data |
| AdaptiveKernel | EXISTS | Not integrated into routing |
| LearningEngine | STUBBED | Disabled, returns placeholders |
| RouterCore | EXISTS | No outcome tracking calls |

---

## Phase 1: Outcome Tracking (Critical)

**Goal:** Capture routing outcomes so analytics engines can process them.

### 1.1 Modify RouterCore to Track Outcomes

**File:** `src/delegation/routing/router-core.ts`

**Changes:**
1. Import OutcomeTracker and PatternPerformanceTracker
2. Add outcome recording after each routing decision
3. Add outcome recording after agent execution completes

**Code Snippet - Add imports:**
```typescript
import { RoutingResult, RoutingOptions, RoutingMapping } from '../config/types.js';
import { KeywordMatcher } from './keyword-matcher.js';
import { HistoryMatcher } from './history-matcher.js';
import { ComplexityRouter } from './complexity-router.js';
import { RoutingComponentConfig } from './interfaces.js';
import { frameworkLogger } from '../../core/framework-logger.js';
import { getKernel } from '../../core/kernel-patterns.js';
import { routingOutcomeTracker } from '../analytics/outcome-tracker.js';
import { patternPerformanceTracker } from '../../analytics/pattern-performance-tracker.js';
```

**Code Snippet - Add private members:**
```typescript
export class RouterCore {
  private keywordMatcher: KeywordMatcher;
  private historyMatcher: HistoryMatcher;
  private complexityRouter: ComplexityRouter;
  private config: RoutingComponentConfig;
  private kernel: ReturnType<typeof getKernel>;
  
  // NEW: Track pending outcomes for post-execution recording
  private pendingOutcomes: Map<string, { 
    agent: string; 
    skill: string; 
    confidence: number;
    timestamp: Date;
  }> = new Map();
}
```

**Code Snippet - Add outcome recording method:**
```typescript
/**
 * Record routing outcome for analytics
 */
private recordRoutingOutcome(
  taskId: string,
  agent: string,
  skill: string,
  confidence: number,
  success?: boolean
): void {
  routingOutcomeTracker.recordOutcome({
    taskId,
    routedAgent: agent,
    routedSkill: skill,
    confidence,
    success,
    feedback: success === undefined ? 'pending' : success ? 'success' : 'failed',
    taskDescription: taskId, // Will be enriched by caller
  });

  patternPerformanceTracker.trackPatternPerformance(
    agent,
    confidence,
    success ?? null,
    Date.now() - this.pendingOutcomes.get(taskId)?.timestamp.getTime() ?? 0
  );
}
```

**Code Snippet - Modify route() method to record outcomes:**
```typescript
route(taskDescription: string, options: RoutingOptions = {}): RoutingResult {
  const { complexity, taskId, useHistoricalData = true, sessionId } = options;
  
  // ... existing validation and routing logic ...
  
  // Record pending outcome for this routing
  if (taskId) {
    this.pendingOutcomes.set(taskId, {
      agent: result.agent,
      skill: result.skill,
      confidence: result.confidence,
      timestamp: new Date(),
    });
  }
  
  return result;
}
```

**Code Snippet - Add completion tracking method:**
```typescript
/**
 * Record outcome after agent execution completes
 * Call this from AgentDelegator or wherever execution completes
 */
recordExecutionOutcome(
  taskId: string, 
  agent: string, 
  skill: string, 
  success: boolean
): void {
  const pending = this.pendingOutcomes.get(taskId);
  if (pending) {
    this.recordRoutingOutcome(
      taskId,
      agent,
      skill,
      pending.confidence,
      success
    );
    this.pendingOutcomes.delete(taskId);
  }
}
```

### 1.2 Expose Outcome Recording from TaskSkillRouter

**File:** `src/delegation/task-skill-router.ts`

**Code Snippet:**
```typescript
/**
 * Record the outcome of a routing decision
 * Call this after agent execution completes
 */
trackResult(taskId: string, agent: string, skill: string, success: boolean): void {
  this.routerCore.recordExecutionOutcome(taskId, agent, skill, success);
  
  // Also update history matcher
  this.routerCore.trackResult(taskId, agent, skill, success);
}
```

### 1.3 Success Criteria

- [ ] `routingOutcomeTracker.recordOutcome()` is called after each routing
- [ ] `patternPerformanceTracker.trackPatternPerformance()` is called for each pattern
- [ ] Running `npm run analytics:daily` shows outcome data
- [ ] `logs/framework/routing-outcomes.json` contains recorded outcomes

### 1.4 Test Commands

```bash
# Build and test
npm run build

# Run a test task
npx strray-ai capabilities

# Check outcome tracking
npm run analytics:daily

# Verify outcomes file
cat logs/framework/routing-outcomes.json | head -50
```

---

## Phase 2: Enable Learning Engine

**Goal:** Make LearningEngine functional instead of stubbed.

### 2.1 Enable LearningEngine by Default

**File:** `src/delegation/analytics/learning-engine.ts`

**Changes:**
1. Change constructor default from `enabled = false` to `enabled = true`
2. Implement actual pattern analysis
3. Connect to PatternPerformanceTracker

**Code Snippet - Enable by default:**
```typescript
constructor(enabled = true) {  // Changed from false
  this.enabled = enabled;
}
```

**Code Snippet - Implement triggerLearning():**
```typescript
async triggerLearning(): Promise<LearningResult> {
  if (!this.enabled) {
    return {
      learningStarted: false,
      patternsAnalyzed: 0,
      adaptations: 0,
    };
  }

  // Import dependencies
  const { routingOutcomeTracker } = await import('../analytics/outcome-tracker.js');
  const { patternPerformanceTracker } = await import('../../analytics/pattern-performance-tracker.js');
  const { emergingPatternDetector } = await import('../../analytics/emerging-pattern-detector.js');
  const { patternLearningEngine } = await import('../../analytics/pattern-learning-engine.js');

  // Reload outcomes from disk
  routingOutcomeTracker.reloadFromDisk();
  
  const outcomes = routingOutcomeTracker.getOutcomes();
  const patternMetrics = patternPerformanceTracker.getAllPatternMetrics();
  
  // Detect emerging patterns
  const emergingResult = emergingPatternDetector.detectEmergingPatterns(outcomes);
  
  // Learn from data
  const learningResult = patternLearningEngine.learnFromData(outcomes, []);
  
  // Record in history
  this.learningHistory.push({
    timestamp: new Date(),
    patternsAnalyzed: patternMetrics.length + emergingResult.emergentPatterns.length,
    adaptations: learningResult.newPatterns.length + learningResult.modifiedPatterns.length,
    successRate: outcomes.length > 0 
      ? outcomes.filter(o => o.success).length / outcomes.length 
      : 1.0,
  });

  return {
    learningStarted: true,
    patternsAnalyzed: patternMetrics.length,
    adaptations: learningResult.newPatterns.length + learningResult.modifiedPatterns.length,
  };
}
```

**Code Snippet - Implement getPatternDriftAnalysis():**
```typescript
getPatternDriftAnalysis(): PatternDriftAnalysis {
  if (!this.enabled) {
    return { driftDetected: false, affectedPatterns: [], severity: 'low' };
  }

  const { patternPerformanceTracker } = require('../../analytics/pattern-performance-tracker.js');
  const driftAnalyses = patternPerformanceTracker.getAllDriftAnalyses();
  const significantDrift = driftAnalyses.filter((a: any) => a.drifted);

  return {
    driftDetected: significantDrift.length > 0,
    affectedPatterns: significantDrift.map((a: any) => a.patternId),
    severity: significantDrift.length > 5 ? 'high' : significantDrift.length > 0 ? 'medium' : 'low',
  };
}
```

### 2.2 Update Global Instance

**File:** `src/delegation/analytics/learning-engine.ts`

**Change line 208:**
```typescript
// Before:
export const learningEngine = new LearningEngine(false);

// After:
export const learningEngine = new LearningEngine(true);
```

### 2.3 Success Criteria

- [ ] `learningEngine.triggerLearning()` executes actual analysis
- [ ] `learningEngine.getPatternDriftAnalysis()` returns real drift data
- [ ] Learning history is populated after triggering
- [ ] No placeholder values (1.0, empty arrays) in output

### 2.4 Test Commands

```bash
# Build
npm run build

# Test learning engine
node -e "
const { learningEngine } = require('./dist/delegation/analytics/learning-engine.js');
console.log('Enabled:', learningEngine.isEnabled());
learningEngine.triggerLearning().then(r => {
  console.log('Learning result:', JSON.stringify(r, null, 2));
  console.log('Drift analysis:', JSON.stringify(learningEngine.getPatternDriftAnalysis(), null, 2));
});
"
```

---

## Phase 3: Integrate AdaptiveKernel

**Goal:** Connect AdaptiveKernel to routing flow for real-time pattern learning.

### 3.1 Add AdaptiveKernel to RouterCore

**File:** `src/delegation/routing/router-core.ts`

**Code Snippet - Add import:**
```typescript
import { routingOutcomeTracker } from '../analytics/outcome-tracker.js';
import { patternPerformanceTracker } from '../../analytics/pattern-performance-tracker.js';
import { getAdaptiveKernel } from '../../core/adaptive-kernel.js';
```

**Code Snippet - Add member and initialization:**
```typescript
export class RouterCore {
  // ... existing members ...
  private adaptiveKernel: ReturnType<typeof getAdaptiveKernel>;
  private routingCount: number = 0;
  private readonly LEARN_EVERY_N_ROUTINGS: number = 10;

  constructor(
    keywordMatcher: KeywordMatcher,
    historyMatcher: HistoryMatcher,
    complexityRouter: ComplexityRouter,
    config: Partial<RoutingComponentConfig> = {}
  ) {
    // ... existing initialization ...
    this.adaptiveKernel = getAdaptiveKernel();
  }
```

**Code Snippet - Modify route() to trigger learning periodically:**
```typescript
route(taskDescription: string, options: RoutingOptions = {}): RoutingResult {
  // ... existing routing logic ...
  
  // Increment counter and trigger learning periodically
  this.routingCount++;
  if (this.routingCount % this.LEARN_EVERY_N_ROUTINGS === 0) {
    this.triggerPeriodicLearning();
  }
  
  return result;
}

/**
 * Trigger periodic learning cycle
 */
private async triggerPeriodicLearning(): Promise<void> {
  if (this.adaptiveKernel) {
    const { routingOutcomeTracker } = await import('../analytics/outcome-tracker.js');
    const outcomes = routingOutcomeTracker.getOutcomes();
    
    if (outcomes.length >= 10) {
      const stats = this.adaptiveKernel.getLearningStats();
      frameworkLogger.log(
        'router-core',
        'periodic-learning',
        'info',
        { 
          patternsTracked: stats.patternsTracked,
          driftDetected: stats.driftDetected,
          lastLearning: stats.lastLearning 
        }
      );
    }
  }
}
```

### 3.2 Integrate with PatternLearningEngine

**File:** `src/core/adaptive-kernel.ts`

**Code Snippet - Enhance triggerLearning():**
```typescript
triggerLearning(
  outcomes: Array<{
    taskId: string;
    taskDescription: string;
    routedAgent: string;
    routedSkill: string;
    confidence: number;
    success: boolean;
  }>,
  existingMappings: Array<{
    keywords: string[];
    skill: string;
    agent: string;
    confidence: number;
  }>
): {
  newPatterns: number;
  modifiedPatterns: number;
  removedPatterns: number;
  thresholdUpdates: number;
  recommendations: string[];
} {
  const result = patternLearningEngine.learnFromData(outcomes, existingMappings);

  this.lastLearningRun = new Date();
  this.cachedP9Analysis = null;

  // Auto-apply high-confidence updates
  const autoApply = result.newPatterns.filter(
    (u: PatternUpdate) => (u.confidence || 0) >= this.adaptiveConfig.autoApplyThreshold && u.validated
  );

  if (autoApply.length > 0) {
    this.applyAutoUpdates(autoApply);
  }

  return {
    newPatterns: result.newPatterns.length,
    modifiedPatterns: result.modifiedPatterns.length,
    removedPatterns: result.removedPatterns.length,
    thresholdUpdates: result.thresholdUpdates.length,
    recommendations: result.recommendations,
  };
}

/**
 * Apply automatic pattern updates
 */
private applyAutoUpdates(updates: PatternUpdate[]): void {
  frameworkLogger.log(
    'adaptive-kernel',
    'auto-applied-updates',
    'info',
    { count: updates.length },
    undefined
  );
  
  // Future: Write to routing-mappings.ts or config
  // For now, log that updates would be applied
  for (const update of updates) {
    frameworkLogger.log(
      'adaptive-kernel',
      'pattern-update',
      'info',
      {
        patternId: update.patternId,
        updateType: update.type,
        confidence: update.confidence,
      }
    );
  }
}
```

### 3.3 Success Criteria

- [ ] AdaptiveKernel is instantiated during RouterCore construction
- [ ] Periodic learning triggers every 10 routings
- [ ] Pattern drift is detected and logged
- [ ] Learning stats are available via `adaptiveKernel.getLearningStats()`

### 3.4 Test Commands

```bash
# Build
npm run build

# Test adaptive kernel integration
node -e "
const { RouterCore } = require('./dist/delegation/routing/router-core.js');
const core = new RouterCore(/* deps */);
console.log('Adaptive kernel:', core.adaptiveKernel ? 'integrated' : 'not integrated');
"
```

---

## Phase 4: CLI Commands

**Goal:** Add `npx strray-ai inference:improve` command for manual triggering.

### 4.1 Add Inference Improvement Command

**File:** `src/cli/index.ts`

**Code Snippet - Add command:**
```typescript
// Inference improvement command
program
  .command('inference:improve')
  .description('Run autonomous inference improvement cycle')
  .option('--dry-run', 'Show what would change without applying')
  .option('--full', 'Run full analysis including agent-based workflow')
  .action(async (options) => {
    console.log('🚀 StringRay Inference Improvement');
    console.log('=================================');
    console.log('');

    try {
      const { LearningEngine } = await import('../delegation/analytics/learning-engine.js');
      const { routingOutcomeTracker } = await import('../delegation/analytics/outcome-tracker.js');
      const { patternPerformanceTracker } = await import('../analytics/pattern-performance-tracker.js');
      const { getAdaptiveKernel } = await import('../core/adaptive-kernel.js');
      const { RoutingPerformanceAnalyzer } = await import('../analytics/routing-performance-analyzer.js');
      const { RoutingRefiner } = await import('../analytics/routing-refiner.js');

      // Reload fresh data
      routingOutcomeTracker.reloadFromDisk();
      
      const outcomes = routingOutcomeTracker.getOutcomes();
      console.log(`📊 Loaded ${outcomes.length} routing outcomes`);
      
      // Generate performance report
      const perfAnalyzer = new RoutingPerformanceAnalyzer();
      const perfReport = perfAnalyzer.generatePerformanceReport();
      console.log(`   Overall success rate: ${(perfReport.overallSuccessRate * 100).toFixed(1)}%`);
      
      // Trigger learning
      const engine = new LearningEngine(true);
      const learningResult = await engine.triggerLearning();
      console.log(`\n🧠 Learning Results:`);
      console.log(`   Patterns analyzed: ${learningResult.patternsAnalyzed}`);
      console.log(`   Adaptations made: ${learningResult.adaptations}`);
      
      // Get drift analysis
      const driftAnalysis = engine.getPatternDriftAnalysis();
      console.log(`\n📈 Pattern Drift:`);
      console.log(`   Drift detected: ${driftAnalysis.driftDetected}`);
      console.log(`   Severity: ${driftAnalysis.severity}`);
      
      // Get adaptive kernel stats
      const kernel = getAdaptiveKernel();
      const kernelStats = kernel.getLearningStats();
      console.log(`\n⚙️ Kernel Stats:`);
      console.log(`   Patterns tracked: ${kernelStats.patternsTracked}`);
      console.log(`   Thresholds calibrated: ${kernelStats.thresholdsCalibrated}`);
      
      // Generate refinement suggestions
      if (!options.dryRun) {
        const refiner = new RoutingRefiner();
        const refinement = refiner.generateRefinementReport(perfReport, { gaps: [], emergingPatterns: [] });
        
        if (refinement.suggestions.length > 0) {
          console.log(`\n💡 Refinement Suggestions:`);
          refinement.suggestions.forEach((s: any, i: number) => {
            console.log(`   ${i + 1}. ${s.type}: ${s.description}`);
          });
          
          if (options.apply || refinement.autoApplicable.length > 0) {
            console.log(`\n✅ Applying auto-applicable refinements...`);
            // Apply refinements
          }
        }
      } else {
        console.log(`\n💡 Dry run - no changes applied`);
      }

      console.log('');
      console.log('✅ Inference improvement cycle complete');
    } catch (error) {
      console.error('❌ Inference improvement failed:', error);
      process.exit(1);
    }
  });
```

### 4.2 Add Help Text

**File:** `src/cli/index.ts`

Add to the examples section:
```
$ npx strray-ai inference:improve        # Run improvement cycle
$ npx strray-ai inference:improve --dry-run  # Preview changes
$ npx strray-ai inference:improve --full    # Full agent-based workflow
```

### 4.3 Success Criteria

- [ ] `npx strray-ai inference:improve` command exists
- [ ] Command shows outcome count and success rate
- [ ] Command triggers learning and shows results
- [ ] `--dry-run` shows what would change without applying
- [ ] Command completes without errors

### 4.4 Test Commands

```bash
# Build
npm run build

# Test dry run
npx strray-ai inference:improve --dry-run

# Test full run
npx strray-ai inference:improve
```

---

## Implementation Order

```
Phase 1 (Outcome Tracking)
    │
    ├─ 1.1 Import OutcomeTracker in RouterCore
    ├─ 1.2 Add recordOutcome() calls in route()
    ├─ 1.3 Add PatternPerformanceTracker calls
    └─ 1.4 Expose trackResult() in TaskSkillRouter
            │
            ▼
Phase 2 (Enable Learning)
    │
    ├─ 2.1 Change LearningEngine default to enabled=true
    ├─ 2.2 Implement triggerLearning() with real logic
    ├─ 2.3 Implement getPatternDriftAnalysis()
    └─ 2.4 Update global instance
            │
            ▼
Phase 3 (Integrate AdaptiveKernel)
    │
    ├─ 3.1 Add AdaptiveKernel to RouterCore
    ├─ 3.2 Add periodic learning trigger
    ├─ 3.3 Implement auto-apply logic
    └─ 3.4 Add logging for learning events
            │
            ▼
Phase 4 (CLI Commands)
    │
    ├─ 4.1 Add inference:improve command
    ├─ 4.2 Add --dry-run option
    └─ 4.3 Add help text and examples
```

---

## Files Summary

| Phase | File | Changes |
|-------|------|---------|
| 1 | `src/delegation/routing/router-core.ts` | Add OutcomeTracker import, outcome recording, PatternPerformanceTracker calls |
| 1 | `src/delegation/task-skill-router.ts` | Expose trackResult() to callers |
| 2 | `src/delegation/analytics/learning-engine.ts` | Enable by default, implement actual methods |
| 3 | `src/core/adaptive-kernel.ts` | Implement auto-apply logic, enhance logging |
| 3 | `src/delegation/routing/router-core.ts` | Add AdaptiveKernel integration |
| 4 | `src/cli/index.ts` | Add inference:improve command |

---

## Verification Checklist

After all phases:

```bash
# 1. Verify outcome tracking
cat logs/framework/routing-outcomes.json | jq '. | length'

# 2. Verify learning engine
npx strray-ai calibrate -m 1

# 3. Verify pattern performance
node -e "
const { patternPerformanceTracker } = require('./dist/analytics/pattern-performance-tracker.js');
console.log('Patterns:', patternPerformanceTracker.getAllPatternMetrics().length);
"

# 4. Verify inference command
npx strray-ai inference:improve --dry-run

# 5. Run full analytics
npm run analytics:daily -- --preview
```
