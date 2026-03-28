# Pipeline Testing Methodology

**Version**: 2.0.0  
**Date**: 2026-03-22  
**Purpose**: Formalize pipeline testing as a core StringRay practice

---

## The Problem

Unit tests pass but pipelines fail. Why?

```
Unit Test: ✅ Passes (isolated, mocked)
Pipeline Test: ❌ Fails (real integration)
```

**Root Cause**: Integration issues only visible when components work together.

---

## The Solution: Pipeline Testing

A **pipeline test** exercises the complete flow from input to output, verifying all components work together.

---

## The Methodology

### Step 1: Create the Pipeline Tree (REQUIRED)

**BEFORE creating any pipeline test, you MUST create a pipeline tree document.**

Every pipeline test must reference its pipeline tree. The tree is your map - without it, you lose track of the gravity.

```
docs/pipeline-trees/
├── ROUTING_PIPELINE_TREE.md       ← Reference this
├── GOVERNANCE_PIPELINE_TREE.md    ← Reference this
├── BOOT_PIPELINE_TREE.md          ← Reference this
├── ORCHESTRATION_PIPELINE_TREE.md ← Reference this
├── PROCESSOR_PIPELINE_TREE.md     ← Reference this
└── REPORTING_PIPELINE_TREE.md     ← Reference this
```

**Pipeline Tree Template**:

```markdown
# [Pipeline Name] Pipeline

**Purpose**: [One sentence]

**Data Flow**:
```
Entry
    │
    ▼
Layer1
    │
    ├─► Component A
    │
    └─► Component B
    │
    ▼
Layer2
    │
    ▼
Exit
```

**Layers**:
- Layer 1: [Name] ([Component])
- Layer 2: [Name] ([Component])
- ...

**Components**:
- `src/path/component.ts` ([ClassName])

**Entry Points**:
| Entry | File:Line | Description |
|-------|-----------|-------------|
| method() | file.ts:123 | Main entry |

**Exit Points**:
| Exit | Data |
|------|------|
| Success | [Output type] |
| Failure | [Error type] |

**Artifacts**:
- [file.json] - [description]
- [state entries] - [description]

**Testing Requirements**:
1. [Verify X through layer Y]
2. [Verify Z in output]
3. [Full end-to-end flow]
```

### Step 2: Identify All Pipelines

Every major feature has a pipeline. Map yours:

```
┌─────────────────────────────────────────────────┐
│ PIPELINE NAME                                    │
│ Input → Layer1 → Layer2 → ... → Output          │
│                                                  │
│ Components: [list all components]                 │
│ Artifacts: [list data files, configs]           │
└─────────────────────────────────────────────────┘
```

**Reference the tree at every turn.** When you write a test, copy the data flow from the tree. When you verify, check the artifacts from the tree.

#### Your Pipeline Structure

| Pipeline | Layers | Components | Tree | Status |
|----------|--------|------------|------|--------|
| Routing | 5 | 7 | ROUTING_PIPELINE_TREE.md | ✅ Tested (20 tests) |
| Governance | 5 | 6 | GOVERNANCE_PIPELINE_TREE.md | ✅ Tested (13 tests) |
| Boot Sequence | 7 | 10 | BOOT_PIPELINE_TREE.md | ✅ Tested (25 tests) |
| Orchestration | 5 | 4 | ORCHESTRATION_PIPELINE_TREE.md | ✅ Tested (14 tests) |
| Processor | 5 | 12 | PROCESSOR_PIPELINE_TREE.md | ✅ Tested (19 tests) |
| Reporting | 6 | 4 | REPORTING_PIPELINE_TREE.md | ✅ Tested (16 tests) |

**Total: 107 tests across 6 pipelines**

### Step 2: Create the Pipeline Test

**Reference the tree at every step.** Copy the data flow, verify the artifacts.

Use this template:

```typescript
// src/__tests__/pipeline/[pipeline-name]-pipeline.mjs

/**
 * [Pipeline Name] Pipeline Test
 * 
 * Pipeline Tree: docs/pipeline-trees/[PIPELINE]_PIPELINE_TREE.md
 * 
 * Data Flow (from tree):
 * Entry → Layer1 → Layer2 → ... → Exit
 */

import { component1 } from './dist/path/component1.js';
import { component2 } from './dist/path/component2.js';

// Track results
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => {
        console.log(`✅ ${name}`);
        passed++;
      }).catch((e) => {
        console.log(`❌ ${name}: ${e.message}`);
        failed++;
      });
    } else {
      console.log(`✅ ${name}`);
      passed++;
    }
  } catch (e) {
    console.log(`❌ ${name}: ${e instanceof Error ? e.message : String(e)}`);
    failed++;
  }
}

// ============================================
// LAYER 1: [Name from tree]
// Reference: PIPELINE_PIPELINE_TREE.md#layer-1
// ============================================
console.log('📍 Layer 1: [Name]');

test('should [behavior from tree entry]', () => {
  // Use components from tree
});

// ============================================
// LAYER 2: [Name from tree]
// Reference: PIPELINE_PIPELINE_TREE.md#layer-2
// ============================================
console.log('\n📍 Layer 2: [Name]');

test('should [behavior from tree]', () => {
  // Test data flow between components
});

// ============================================
// VERIFY ARTIFACTS (from tree)
// Reference: PIPELINE_PIPELINE_TREE.md#artifacts
// ============================================

// ============================================
// END-TO-END (from tree)
// Reference: PIPELINE_PIPELINE_TREE.md#testing-requirements
// ============================================
console.log('\n📍 End-to-End');

test('should complete full pipeline', () => {
  // Full flow: Entry → Exit
});

// ============================================
// RESULTS
// ============================================
setTimeout(() => {
  console.log('\n========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('========================================');
  
  if (failed === 0) {
    console.log('✅ Pipeline test PASSED');
    process.exit(0);
  } else {
    console.log('❌ Pipeline test FAILED');
    process.exit(1);
  }
}, 500);
```

### Step 3: The Test Pattern

Use this shell script pattern for manual testing:

```bash
# test-pipeline.sh

echo "=== [PIPELINE NAME] PIPELINE TEST ==="
echo ""

echo "📍 Layer 1: Input"
# Test input handling

echo "📍 Layer 2: Processing"
# Test each component

echo "📍 Layer N: Output"
# Test output generation

echo "📍 End-to-End"
# Test complete flow

echo ""
echo "✅ Pipeline test complete"
```

**Node.js version**:

```javascript
// test-pipeline.mjs (run with: node test-pipeline.mjs)

console.log('=== [PIPELINE NAME] PIPELINE TEST ===\n');

// Import components
import { component1 } from './component1.js';
import { component2 } from './component2.js';

// Track results
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

// Layer 1: Input
console.log('📍 Layer 1: Input');
test('should accept valid input', () => {
  const result = component1.input({ data: 'test' });
  if (!result) throw new Error('No result');
});

// Layer 2: Processing
console.log('\n📍 Layer 2: Processing');
test('should process through component', () => {
  const result = component2.process({ input: 'data' });
  if (!result.output) throw new Error('No output');
});

// End-to-End
console.log('\n📍 End-to-End');
test('should complete full pipeline', async () => {
  await component1.initialize();
  const result = await component2.run();
  if (!result.success) throw new Error('Pipeline failed');
});

console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`========================================`);
```

### Step 4: The Iteration Loop

This is critical. **One pass is never enough.**

```
┌─────────────────────────────────────────────────────────────┐
│                    ITERATION LOOP                           │
│                                                              │
│  1. Run pipeline test                                        │
│  2. Find issue                                              │
│  3. Fix issue                                               │
│  4. Run test again                                          │
│  5. Find next issue                                          │
│  6. ...                                                     │
│  7. Repeat until NO issues found                             │
│  8. Run test ONE MORE TIME to confirm                       │
│  9. Pipeline is complete ONLY when test passes 3x in a row │
└─────────────────────────────────────────────────────────────┘
```

**The Rule**: Say "pipeline complete" only after test passes **3 consecutive times** with no changes between runs.

### Step 5: Verify Completeness

Use this checklist:

```
□ All layers tested
□ All components in pipeline loaded
□ All data flows verified
□ All artifacts created/read correctly
□ Async operations properly awaited
□ Error handling tested
□ Test passes 3x consecutively
□ No console.log/error in test output
```

---

## The Inference Pipeline Test (Reference)

This is what we created during v1.15.1:

```javascript
// test-inference-pipeline.mjs
import { TaskSkillRouter } from './dist/delegation/task-skill-router.js';
import { routingOutcomeTracker } from './dist/delegation/analytics/outcome-tracker.js';
import { patternPerformanceTracker } from './dist/analytics/pattern-performance-tracker.js';
import { routingPerformanceAnalyzer } from './dist/analytics/routing-performance-analyzer.js';
import { inferenceTuner } from './dist/services/inference-tuner.js';

console.log('=== INFERENCE PIPELINE TEST ===\n');

// Layer 3: Routing
const router = new TaskSkillRouter();
const tests = [
  ['fix bug', 'bug-triage-specialist'],
  ['review code', 'code-reviewer'],
  ['perf', 'performance-engineer'],
  ['scan security', 'security-auditor'],
  ['refactor module', 'refactorer'],
];

let pass = 0;
for (const [task, expected] of tests) {
  const result = router.routeTask(task, { taskId: 'test' });
  if (result.agent === expected) {
    console.log(`✅ ${task}`);
    pass++;
  } else {
    console.log(`❌ ${task} -> ${result.agent} (expected ${expected})`);
  }
}

// Layer 4: Analytics
routingOutcomeTracker.reloadFromDisk();
patternPerformanceTracker.loadFromDisk();
console.log(`\nOutcomes: ${routingOutcomeTracker.getOutcomes().length}`);
console.log(`Patterns: ${patternPerformanceTracker.getAllPatternMetrics().length}`);

// Layer 5: Performance
const report = routingPerformanceAnalyzer.generatePerformanceReport();
console.log(`\nAvg confidence: ${(report.avgConfidence * 100).toFixed(1)}%`);

// Layer 6: Tuning
await inferenceTuner.runTuningCycle();
console.log('\n✅ Pipeline complete');
```

---

## Governance Pipeline (TESTED)

```
┌─────────────────────────────────────────────────┐
│ GOVERNANCE PIPELINE (TESTED v1.15.1)            │
│                                                  │
│ Input: Operation + Context                      │
│   ↓                                             │
│ Layer 1: Rule Registry (28+ rules)             │
│   ↓                                             │
│ Layer 2: Rule Hierarchy (dependencies)          │
│   ↓                                             │
│ Layer 3: Validator Registry                     │
│   ↓                                             │
│ Layer 4: Rule Executor (validation)             │
│   ↓                                             │
│ Layer 5: Violation Fixer (auto-fix)            │
│   ↓                                             │
│ Output: ValidationReport, ViolationFix[]        │
└─────────────────────────────────────────────────┘

Components: RuleEnforcer, RuleRegistry, RuleHierarchy, ValidatorRegistry, RuleExecutor, ViolationFixer
Artifacts: 93 rules (28 sync + async loaded), logs via frameworkLogger

Status: ✅ TESTED - 3 consecutive passes
Test: src/__tests__/pipeline/test-governance-pipeline.mjs
```

---

## Running Pipeline Tests

```bash
# Run all pipeline tests
npm run test:pipelines

# Run specific pipeline
node src/__tests__/pipeline/test-inference-pipeline.mjs
node src/__tests__/pipeline/test-governance-pipeline.mjs

# Run in watch mode during development
npm run test:pipelines -- --watch
```

---

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/pipeline-tests.yml
name: Pipeline Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  pipeline-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run test:pipelines
      - run: npm test
```

---

## Summary

| Step | Action |
|------|--------|
| 1 | **Create Pipeline Tree** (REQUIRED) |
| 2 | Map components, layers, and artifacts in tree |
| 3 | Reference tree at every test step |
| 4 | Create pipeline test (template provided) |
| 5 | Run test, find issue, fix, repeat |
| 6 | Say "complete" only after 3 consecutive passes |

**The Rule**: Without the pipeline tree, you lose track of the gravity. The tree must be passed with every pipeline creation and test.

**Remember**: Unit tests ✅ ≠ Pipeline works ❌

Only pipeline tests prove the pipeline works.

---

## Pipeline Test Verification Checklist (NO STUBS)

Every pipeline test MUST pass ALL of these checks:

### Component Verification
```
□ Import real components from dist/ (not mocked)
□ Call real methods: new Component() or component.method()
□ Verify real return values, not hardcoded expectations
□ No stateManager.set() unless testing state management
```

### Integration Verification
```
□ Entry point is called with real input
□ Component A → Component B interaction verified
□ Output matches expected data structure
□ Side effects verified (files, state, etc.)
```

### Anti-Patterns (NEVER DO)
```
❌ stateManager.set('key', value)          # Stubbing state
❌ const mock = { data: 'test' }           # Mocking data
❌ if (methodExists)                        # Existence checks
❌ return { success: true }                # Fake returns
❌ router.routeTask('test')                # No verification
```

### Per-Pipeline Checklist

#### Routing Pipeline
- [ ] TaskSkillRouter.routeTask() called with real task
- [ ] KeywordMatcher matched via result.matchedKeyword
- [ ] HistoryMatcher used via taskId
- [ ] ComplexityRouter used via complexity option
- [ ] OutcomeTracker.getOutcomes() length increased
- [ ] PatternTracker.getAllPatternMetrics() called
- [ ] routing-outcomes.json file exists

#### Governance Pipeline
- [ ] RuleEnforcer.validateOperation() called with real code
- [ ] RuleRegistry.getRules() returns ≥28 rules
- [ ] ValidationReport.errors/warnings is real array
- [ ] ViolationFixer.fixViolations() called with violations
- [ ] Actual violations detected (console.log, duplicate code, etc.)

#### Boot Sequence
- [ ] BootOrchestrator instantiated (not stateManager.set)
- [ ] ContextLoader.getInstance() returns config
- [ ] StateManager entries verified via get()
- [ ] ProcessorManager initializes 12 processors
- [ ] SecurityHardener.validateInput() verified
- [ ] InferenceTuner.getStatus() verified
- [ ] AgentDelegator, SessionCoordinator created
- [ ] SessionMonitor, SessionCleanupManager, SessionStateManager created
- [ ] No stateManager.set() stubs

#### Orchestration Pipeline
- [ ] executeComplexTask() called with real tasks
- [ ] Task graph built with dependencies
- [ ] AgentDelegator.delegateToSubagent() called
- [ ] OutcomeTracker.recordOutcome() invoked
- [ ] TaskResult[] has real success/error data

#### Processor Pipeline
- [ ] ProcessorRegistry.getAll() returns 13 processors (5 pre + 8 post)
- [ ] executePreProcessors() called
- [ ] All 5 pre-processors execute in order
- [ ] executePostProcessors() called
- [ ] All 8 post-processors execute in order
- [ ] PostProcessorResult[] returned with real data

#### Reporting Pipeline
- [ ] FrameworkLogger.getRecentLogs() returns real logs
- [ ] logs/framework/activity.log file exists
- [ ] calculateMetrics() with real log data
- [ ] generateInsights() returns real insights
- [ ] formatReport() generates valid Markdown/JSON/HTML
- [ ] ReportData has generatedAt timestamp

---

## Detailed Implementation Tasks

### Routing Pipeline ✅ COMPLETE (20 tests)
| Task ID | Description | Status |
|---------|-------------|--------|
| routing-1 | Add RoutingAnalytics import and verify routeAnalytics.getMetrics() | ✅ Done |
| routing-2 | Add RoutingPerformanceAnalyzer and verify getPerformanceReport() | ✅ Done |
| routing-3 | Add PromptPatternAnalyzer and verify analyzePatterns() | ✅ Done |
| routing-4 | Add RoutingRefiner and verify refineRouting() | ✅ Done |
| routing-5 | Verify logs/framework/routing-outcomes.json exists | ✅ Done |

### Governance Pipeline ✅ COMPLETE (13 tests)
| Task ID | Description | Status |
|---------|-------------|--------|
| governance-1 | Remove all stateManager.set() calls | ✅ Done |
| governance-2 | Add RuleRegistry.getRules() verification | ✅ Done |
| governance-3 | Add RuleExecutor.execute() with real code that triggers violations | ✅ Done |
| governance-4 | Verify ViolationFixer.fixViolations() with real violations | ✅ Done |
| governance-5 | Verify ValidationReport has real errors (not mock arrays) | ✅ Done |
| governance-6 | Add test that triggers console.log violation | ✅ Done |

### Boot Sequence ✅ COMPLETE (25 tests)
| Task ID | Description | Status |
|---------|-------------|--------|
| boot-1 | Remove all stateManager.set() calls | ✅ Done |
| boot-2 | Add BootOrchestrator instantiation test | ✅ Done |
| boot-3 | Add ContextLoader.getInstance() verification | ✅ Done |
| boot-4 | Verify ProcessorManager initializes 12 processors | ✅ Done |
| boot-5 | Verify SecurityHardener.initialize() runs | ✅ Done |
| boot-6 | Verify InferenceTuner.initialize() runs | ✅ Done |
| boot-7 | Verify StateManager entries via get() not set() | ✅ Done |

### Orchestration Pipeline ✅ COMPLETE (14 tests)
| Task ID | Description | Status |
|---------|-------------|--------|
| orchestration-1 | Remove mock task arrays | ✅ Done |
| orchestration-2 | Add executeComplexTask() with real task definitions | ✅ Done |
| orchestration-3 | Verify Task graph built with dependencies | ✅ Done |
| orchestration-4 | Verify AgentDelegator.delegateToSubagent() called | ✅ Done |
| orchestration-5 | Verify TaskResult[] has real success/error data | ✅ Done |
| orchestration-6 | Add OutcomeTracker verification for orchestration | ✅ Done |

### Processor Pipeline ✅ COMPLETE (19 tests)
| Task ID | Description | Status |
|---------|-------------|--------|
| processor-1 | Remove all stateManager.set() calls | ✅ Done |
| processor-2 | Add ProcessorRegistry.getAll() returns 13 processors | ✅ Done |
| processor-3 | Add executePreProcessors() and verify 5 run | ✅ Done |
| processor-4 | Add executePostProcessors() and verify 8 run | ✅ Done |
| processor-5 | Verify PreValidateProcessor result has validated: true | ✅ Done |
| processor-6 | Verify CodexComplianceProcessor result has violations or clean | ✅ Done |
| processor-7 | Verify InferenceImprovementProcessor result | ✅ Done |
| processor-8 | Verify PostProcessorResult[] has real name/success/error | ✅ Done |
| processor-9 | Verify ProcessorMetrics state entries | ✅ Done |
| processor-10 | Register LogProtectionProcessor in processor-manager.ts | ✅ Done |

### Reporting Pipeline ✅ COMPLETE (16 tests)
| Task ID | Description | Status |
|---------|-------------|--------|
| reporting-1 | Remove mock log/insight/recommendation arrays | ✅ Done |
| reporting-2 | Add FrameworkLogger.getRecentLogs() verification | ✅ Done |
| reporting-3 | Verify logs/framework/activity.log exists | ✅ Done |
| reporting-4 | Add calculateMetrics() with real log data | ✅ Done |
| reporting-5 | Add generateInsights() returns real insights | ✅ Done |
| reporting-6 | Verify formatReport() generates valid Markdown | ✅ Done |
| reporting-7 | Verify ReportData has generatedAt timestamp | ✅ Done |

### Automation Tasks
| Task ID | Description | Status |
|---------|-------------|--------|
| automation-1 | Run all 6 pipeline tests sequentially | ✅ Done (manual) |
| automation-2 | Verify tests pass 3x consecutively | ✅ Done |
| automation-3 | Commit and push changes | ✅ Done |

---

## Agent Review Findings (CRITICAL)

After peer review by researcher, architect, and code-analyzer agents, the following issues were identified:

### Researcher Findings
| Pipeline | Status | Issues |
|----------|--------|--------|
| Routing | ✅ Accurate | - |
| Governance | ✅ Accurate | - |
| Boot | ⚠️ Minor | Line number off by 7 |
| Orchestration | ✅ Accurate | - |
| Processor | ❌ Incomplete | Missing 10 processors (only 2 documented) |
| Reporting | ✅ Accurate | - |

### Architect Findings
| Issue | Impact | Fix Required |
|-------|--------|-------------|
| "Engines" vs "Layers" terminology mismatch | Documentation confusion | Standardize terminology |
| Cross-pipeline component duplication | Understanding complexity | Document shared components |
| Boot misclassified as pipeline | Architectural clarity | Rename to "Boot Sequence" |
| Unified view table mismatches trees | Documentation accuracy | Reconcile tables |

### Code Analyzer Findings
| Issue | Severity | Impact |
|-------|----------|--------|
| Tests create mock data, don't call real methods | HIGH | Integration gaps |
| Tests only check method existence | HIGH | No real validation |
| No actual pipeline execution verified | HIGH | False positives |

### Key Takeaway
**Pipeline trees created from assumptions will be incomplete. Always verify against actual codebase.**

---

## Pipeline Creation Rules (MANDATORY)

These rules MUST be followed when creating or updating pipeline documentation:

### Rule 1: Research Before Documentation
```
BEFORE creating a pipeline tree:
1. Run: glob src/**/processors/*.ts to find ALL processors
2. Run: grep "priority:" src/**/implementations/*.ts to verify priorities
3. Run: grep "extends.*Processor" to verify types
4. NEVER assume component counts - always VERIFY with code search
```

### Rule 2: Execute Real Code, Not Stubs
```
PIPELINE TESTS MUST:
1. Import actual components from dist/
2. Call real methods (new Component(), .method())
3. Verify real outputs, not mock data
4. Execute actual pipeline entry points

NEVER:
- Use stateManager.set() to simulate results
- Create mock arrays instead of real data
- Check only method existence
```

### Rule 3: Verify Layer Counts
```
BEFORE finalizing a pipeline tree:
1. Count ACTUAL components in each layer
2. Run tests against tree to verify completeness
3. Have another agent review the tree
4. Fix discrepancies before publishing
```

### Rule 4: Test Real Integration
```
PIPELINE TESTS MUST EXERCISE:
1. Entry point → real method call
2. Component → component interaction  
3. Full end-to-end flow
4. Actual artifacts created

SHALLOW TESTS ARE NOT ACCEPTABLE:
- ❌ "should have methodX" (existence check)
- ❌ "should return { ... }" (mock data)
- ✅ "should route to security-auditor for security task" (real behavior)
```

### Rule 5: Name Things Correctly
```
BOOT is NOT a pipeline - it's an INITIALIZATION SEQUENCE
- Pipelines: Routing, Governance, Orchestration, Processor, Reporting
- Sequences: Boot (framework startup)
- Different semantics require different documentation
```

---

## Pre-Publication Checklist

Before committing pipeline documentation:

```bash
# 1. Verify all components exist
glob src/**/processors/implementations/*.ts | wc -l
grep "priority:" src/**/implementations/*.ts

# 2. Run pipeline test
node src/__tests__/pipeline/test-*-pipeline.mjs

# 3. Verify test output matches tree
#    - Layer count matches
#    - Component count matches
#    - All processors documented

# 4. Have agent review
@researcher verify pipeline tree accuracy
@code-analyzer verify test coverage
```

---

## Summary

| Step | Action | Verification |
|------|--------|---------------|
| 1 | **Research** | Code search to find ALL components |
| 2 | **Document** | Create tree with verified components |
| 3 | **Test** | Real code execution, not stubs |
| 4 | **Review** | Agent review for completeness |
| 5 | **Iterate** | Fix issues until 3 consecutive passes |

**The Rule**: Without the pipeline tree, you lose track of the gravity. The tree must be passed with every pipeline creation and test.

**Remember**: Unit tests ✅ ≠ Pipeline works ❌

Only pipeline tests prove the pipeline works.

---

**Tags**: #pipeline-testing #methodology #best-practices #rules
