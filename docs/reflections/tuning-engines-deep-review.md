# Tuning Engines Deep Review

> Analysis of the 17 tuning engines - what's working, what's stubbed, what's disconnected.

## Executive Summary

**Status: PARTIALLY FUNCTIONAL**

| Category | Engines | Working | Stubbed | Disconnected |
|----------|---------|---------|---------|--------------|
| Routing | 5 | ✅ 4 | ❌ 0 | ⚠️ 1 |
| Inference | 3 | ✅ 1 | ❌ 1 | ⚠️ 1 |
| Analytics | 6 | ✅ 2 | ❌ 0 | ⚠️ 4 |
| Pattern | 4 | ⚠️ 3 | ❌ 0 | ⚠️ 1 |
| Reporting | 1 | ⚠️ 1 | ❌ 0 | ❌ 0 |

## Issues Found

### 1. Analytics/Calibrate Commands (FIXED)

**Problem**: Commands required 10+ samples but logs never contained the expected format.

**Root Cause**: 
- Calibrator looked for `job-completed` but logs use `complex-task-completed`
- No complexity accuracy metrics were being logged
- Minimum sample default was too high

**Fix Applied**:
- Updated `complexity-calibrator.ts` to accept both log formats
- Added fallback estimation when explicit accuracy not present
- Lowered default min-samples from 10 to 3
- Updated `simple-pattern-analyzer.ts` to extract JSON details from logs

### 2. LearningEngine is a STUB

**File**: `src/delegation/analytics/learning-engine.ts`

**Status**: DISABLED BY DEFAULT

```typescript
// Line 46 - disabled by default
constructor(enabled = false) {
  this.enabled = enabled;
}
```

**Problem**: This is the core learning engine but it's disabled. All methods return placeholder data.

**Evidence**:
```typescript
// Line 66 - Placeholder
return { successRate: 1.0, ... }; // Just returns 1.0

// Line 77-84 - Placeholder drift analysis
return { driftDetected: false, ... };

// Line 94-101 - Placeholder thresholds
return { overall: { confidenceMin: 0.7, ... } };
```

### 3. Analytics Engines Not Fed Data

**Pattern Performance Tracker**: Exists but never receives outcome data.

**Evidence**: No code calls `patternPerformanceTracker.trackPatternPerformance()` during routing.

### 4. AdaptiveKernel Not Integrated

**File**: `src/core/adaptive-kernel.ts`

**Status**: EXISTS BUT NOT CONNECTED TO ROUTING

The kernel is created but never used in the routing flow.

## Data Flow Problem

```
Current Flow:
  TaskSkillRouter.routeTask()
      ↓
  RouterCore.route()
      ↓
  AgentExecution
      ↓
  ❌ NO OUTCOME TRACKING

What Should Happen:
  TaskSkillRouter.routeTask()
      ↓
  RouterCore.route()
      ↓
  AgentExecution
      ↓
  ✅ OutcomeTracker.recordOutcome()
      ↓
  ✅ PatternPerformanceTracker.trackPatternPerformance()
      ↓
  ✅ AdaptiveKernel.analyzeWithP9()
```

## Engines Status

### Working ✅

1. **SimplePatternAnalyzer** - Now parses logs correctly
2. **ComplexityCalibrator** - Now works with actual log format
3. **PatternPerformanceTracker** - Code exists, needs data feed
4. **PatternLearningEngine** - Code exists, needs data feed
5. **EmergingPatternDetector** - Code exists, needs data feed

### Needs Integration ⚠️

1. **AdaptiveKernelAnalyzer** - Exists, not connected to routing
2. **OutcomeTracker** - Exists, not being called after routing
3. **RouterCore** - Not recording outcomes after routing decisions

### Stubbed ❌

1. **LearningEngine** - Entire class is placeholder, disabled by default

## Recommendations

### Immediate (Can Do Now)

1. **Enable outcome tracking in RouterCore**
   - Call `OutcomeTracker.recordOutcome()` after each routing decision
   - Track: taskId, agent, skill, confidence, success

2. **Connect PatternPerformanceTracker**
   - After outcome tracking, call `trackPatternPerformance()`
   - This will feed data to learning engines

3. **Enable LearningEngine**
   - Change default from `enabled = false` to `enabled = true`
   - Or remove the enable flag entirely

### Short Term (Next Sprint)

1. **Integrate AdaptiveKernel into routing flow**
   - Call `analyzeWithP9()` periodically during routing
   - Enable automatic pattern updates

2. **Add periodic learning trigger**
   - Run `PatternLearningEngine.learnFromData()` every N tasks
   - Or on a time interval

3. **Create inference improvement CLI command**
   - `npx strray-ai inference:improve`
   - Triggers full agent-based analysis workflow

### Long Term (Architecture)

1. **Create unified data pipeline**
   - All engines read from/write to same data sources
   - Outcome data flows automatically to all consumers

2. **Add autonomous review workflow**
   - Orchestrator coordinates agents to analyze patterns
   - Code-reviewer validates changes
   - Enforcer applies if safe

## Files to Modify

| File | Change |
|------|--------|
| `src/delegation/routing/router-core.ts` | Add outcome tracking calls |
| `src/delegation/analytics/outcome-tracker.ts` | Ensure persistence works |
| `src/delegation/analytics/learning-engine.ts` | Enable by default, implement stubs |
| `src/core/adaptive-kernel.ts` | Integrate into routing flow |
| `src/cli/index.ts` | Add `inference:improve` command |

## Test Commands

```bash
# Test analytics (now working)
node dist/cli/index.js analytics -l 50

# Test calibrate (now working)
node dist/cli/index.js calibrate -m 1
```

## Next Steps

1. ✅ Fix analytics/calibrate commands (DONE)
2. ⬜ Add outcome tracking to routing (TODO)
3. ⬜ Enable LearningEngine (TODO)
4. ⬜ Integrate AdaptiveKernel (TODO)
5. ⬜ Create inference:improve CLI (TODO)
