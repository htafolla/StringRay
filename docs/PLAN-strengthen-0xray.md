# 0xRay Strengthening Plan

**Date**: 2026-04-29
**Current Version**: 1.22.43
**Author**: The AI (the student building the engine)

---

## Preamble

0xRay has 30 processors, 2,2199 tests, a governance chain that blocks bad commits, a release pipeline that ships with one command, and a reflection system that reads real git history. The plumbing works. The child can read.

But the codebase audit reveals cracks. Dead code. Circular dependencies. Version drift. Processors that nuke docs instead of appending to them. Stub processors that return string literals instead of doing work. Three competing pre-commit hook systems. And underneath it all — the core promise of inference capture is still a skeleton: the inference-improvement processor generates prompt files but never triggers analysis, the reflections capture "what" but not "why," and the `Inference Notes` section of every generated reflection is empty.

This plan addresses all of it. Ordered by priority: bugs first, then integrity, then capability.

---

## Phase 1: Critical Bugs (Do Now)

These are correctness issues that cause real failures or silent corruption.

### 1.1 Remove Circular Self-Dependency

**Problem**: `package.json` lists `strray-ai: ^1.22.12` as a dependency of itself. When consumers install `strray-ai`, npm attempts to install an older version of the package as its own dependency. This can cause version conflicts, duplicate installations, or install failures.

**Evidence**:
```json
{
  "name": "strray-ai",
  "bin": { "strray-ai": "dist/cli/index.js" },
  "dependencies": {
    "strray-ai": "^1.22.12"  // ← THE PACKAGE DEPENDS ON ITSELF
  }
}
```

**Fix**: Remove `"strray-ai"` from `dependencies` in `package.json`. The `bin` entry is correct (it's the CLI entry point). The `dependencies` entry is the bug.

**Risk**: Zero. The self-dependency serves no purpose.

### 1.2 Consolidate Pre-Commit Hooks

**Problem**: Three separate pre-commit hook systems exist simultaneously:

| Location | What It Does | Active? |
|----------|-------------|---------|
| `.git/hooks/pre-commit` | Runs `scripts/hooks/run-hook.js` | **Yes** (symlinked) |
| `.husky/pre-commit` | Husky-format hook | No (not symlinked) |
| `.githooks/pre-commit` | `scripts/pre-commit-version-validation.js` | No (not symlinked) |

Only one can be active at a time (whichever `.git/hooks/pre-commit` points to). The other two are maintenance traps — someone edits the wrong one and wonders why their changes don't take effect.

**Fix**:
1. Delete `.husky/pre-commit` and `.githooks/pre-commit`
2. Keep `.git/hooks/pre-commit` as the single source of truth
3. Document this in AGENTS.md under "Git Hooks Integration"
4. If Husky is needed later, wire it to the same script

**Risk**: Low. The inactive hooks don't run.

### 1.3 Fix `agents-md-validation-processor.ts` Auto-Generate

**Problem**: The `autoGenerate()` method in `agents-md-validation-processor.ts:258-309` overwrites AGENTS.md from a template. It also hardcodes the version as `1.22.42` (line 285). This means:
- Any manual edits to AGENTS.md are nuked on next auto-generate
- The version is wrong and will stay wrong

This is the specific processor that the user has been disabling because "they try to rewrite the docs and nuke much of it."

**Fix** (two parts):

**Part A — Append-only mode**: Replace `autoGenerate()` with `appendMissing()`. Instead of reading a template and writing the whole file, it should:
1. Read current AGENTS.md
2. Check which required sections are missing
3. Append only the missing sections at the end
4. Never modify existing content

```typescript
async appendMissing(): Promise<{ success: boolean; message: string; added: string[] }> {
  const content = fs.readFileSync(this.agentsPath, "utf-8");
  const missing = this.REQUIRED_SECTIONS.filter(s => !content.includes(s));
  
  if (missing.length === 0) {
    return { success: true, message: "All sections present", added: [] };
  }
  
  const additions = missing.map(section => {
    return `\n\n${this.getSectionTemplate(section)}`;
  }).join("");
  
  fs.appendFileSync(this.agentsPath, additions);
  return { success: true, message: `Added ${missing.length} sections`, added: missing };
}
```

**Part B — Dynamic version**: Replace the hardcoded version with a read from `package.json`:
```typescript
const pkgVersion = JSON.parse(
  fs.readFileSync(path.join(this.projectRoot, "package.json"), "utf-8")
).version;
```

**Risk**: Low. Append-only is strictly safer than overwrite.

---

## Phase 2: Dead Code Removal (Do Now)

Dead code is a tax on every reader. It implies the codebase is larger and more complex than it is. It confuses new developers (human or AI) who try to understand what's active.

### 2.1 Delete `processor-rule-fixes.ts` (129 lines)

**Evidence**: Never imported anywhere. Grepping for the filename returns zero results in any non-test file. The class `ProcessorRuleFixes` has zero references.

**Fix**: Delete the file. Remove from `dist/` on next build.

### 2.2 Delete `processor-test-executor.ts` (246 lines)

**Evidence**: Never imported. Functionality fully duplicated by `implementations/test-execution-processor.ts` which IS imported by `processor-manager.ts`.

**Fix**: Delete the file.

### 2.3 Upgrade `regression-testing-processor.ts` from Stub

**Current** (13 lines):
```typescript
protected async run(context: ProcessorContext): Promise<unknown> {
  return { regressions: "checked" };  // ← STRING LITERAL
}
```

**Fix**: Either implement real regression detection (compare last N test runs for new failures) or delete the processor. If keeping, wire it to the test results directory and check for regressions between the last two test runs.

**Recommendation**: Implement. This is a core governance processor. A stub that returns a string literal gives false confidence.

### 2.4 Upgrade `error-boundary-processor.ts` from Stub

**Current** (11 lines):
```typescript
protected async run(context: ProcessorContext): Promise<unknown> {
  return { boundaries: "established" };  // ← STRING LITERAL
}
```

**Fix**: Implement actual error boundary detection — check for unhandled promise rejections, missing try-catch in processor chains, or error propagation patterns. Or delete.

**Recommendation**: Implement minimally — check processor results for `success: false` and wrap in a standard error envelope.

---

## Phase 3: Version Integrity (Do Now)

Every release should leave the codebase in a consistent state. Right now it doesn't.

### 3.1 Version Sync Script

**Problem**: After `npm version patch`, five files still reference the old version:

| File | Current | Should Be |
|------|---------|-----------|
| `AGENTS.md` (footer) | 1.22.42 | 1.22.43 |
| `AGENTS-full.md` (header) | 1.22.42 | 1.22.43 |
| `docs/README.md` (badges, header, config) | 1.22.42 | 1.22.43 |
| `.opencode/strray/config.json` | 1.22.42 | 1.22.43 |
| `.opencode/strray/features.json` | 1.22.42 | 1.22.43 |
| `.opencode/strray/codex.json` | 1.22.42 | 1.22.43 |
| `.opencode/strray/integrations.json` | 1.22.42 (x3) | 1.22.43 |

The UVM (`version-manager.mjs`) already auto-updates itself and `package.json`. But it doesn't touch the config files or doc files.

**Fix**: Extend `version-manager.mjs` (or the release script) to also update:
1. All `.opencode/strray/*.json` files that contain version strings
2. `AGENTS.md` footer line
3. `AGENTS-full.md` header and agent version references
4. `docs/README.md` badge URLs and header

The update should be a simple string replacement: `1.22.XX` → `1.22.YY` (where YY is the new version).

**Alternative**: Create a `scripts/node/sync-versions.mjs` that the release script calls after `npm version patch`. This separates the concern (version sync) from the UVM (version management).

### 3.2 Hardcoded Version in Auto-Generate

Already covered in 1.3 Part B. The `autoGenerate()` method hardcodes `1.22.42`. Fix it to read from `package.json`.

---

## Phase 4: Documentation Accuracy (Do After Phase 3)

Once version sync is automated, fix the current content drift.

### 4.1 `docs/README.md` Content Update

**Problems**:
- "What's New" section still describes v1.22.28 (Facade Pattern refactoring)
- Test count badge says 2579 but "Production Ready" section says 2533
- No mention of: processor extraction (24 methods), auto-discovery, release pipeline, reflection cadences, inference improvement
- Version is 1.22.42 (stale by 1)

**Fix**: Update to reflect current state:
- Add "What's New in v1.22.43" section covering this session's work
- Fix test count consistency (2,579 everywhere)
- Add release pipeline section (`npm run release`)
- Update version to 1.22.43

### 4.2 `AGENTS-full.md` Content Update

**Problems**:
- Header says "Last Updated: 2026-03-12" (6+ weeks stale)
- Table of Contents says "27 Agents" but body says "13 autonomous"
- No mention of auto-discovery, reflection cadences, or release pipeline
- All agent version refs say 1.22.42

**Fix**: 
- Update date
- Resolve agent count inconsistency (27 is the total including skills-as-agents; 13 are the named autonomous agents)
- Add sections for auto-discovery and reflection cadences
- Update all version refs

### 4.3 `AGENTS.md` Additions

**Missing**:
- Release pipeline (`npm run release`, `npm run release:dry`)
- Processor auto-discovery system
- Reflection cadences (commit, release)
- Version compliance chain (npm → UVM → package.json)

**Fix**: Append these sections. Do NOT rewrite existing content (see Phase 1.3).

---

## Phase 5: Test Coverage Expansion (Next Session)

The audit found zero test coverage in 8 source directories and zero dedicated tests for the 14 processor implementations.

### 5.1 Processor Implementation Tests (Priority: High)

**Gap**: `src/processors/implementations/` has 14 files, zero dedicated test files.

The processor-manager tests (registry, auto-discovery, activation) test the plumbing but not the individual processors' logic.

**Fix**: Create `src/__tests__/unit/processors/` with one test file per implementation:

| Processor | Test Priority | What to Test |
|-----------|--------------|--------------|
| `codex-compliance-processor.ts` | Critical | Rule enforcement, violation detection |
| `test-execution-processor.ts` | Critical | Test runner invocation, language detection |
| `pre-validate-processor.ts` | High | Undefined detection |
| `console-log-guard-processor.ts` | High | Console statement detection |
| `storytelling-trigger-processor.ts` | High | Git history reading, reflection synthesis |
| `publish-preflight-processor.ts` | High | File existence checks, version sync |
| `inference-improvement-processor.ts` | Medium | Workflow context preparation |
| `coverage-analysis-processor.ts` | Medium | Coverage threshold checks |
| `state-validation-processor.ts` | Medium | State manager integration |
| `nudge-processor.ts` | Low | Nudge message generation |
| `session-summary-processor.ts` | Low | Summary formatting |
| `log-protection-processor.ts` | Low | Deletion blocking |
| `refactoring-logging-processor-wrapper.ts` | Low | Wrapper delegation |
| `error-boundary-processor.ts` | Low | (Currently stub) |

### 5.2 Untested Source Directories

| Directory | Priority | Approach |
|-----------|----------|----------|
| `src/reporting/` | High | Test report-formatter with real metrics |
| `src/validation/` | Medium | Test validation chain logic |
| `src/infrastructure/` | Medium | Test infra utilities |
| `src/services/` | Medium | Test service layer |

### 5.3 Fix Skipped Tests

- `src/security/comprehensive-security-audit.test.ts` has 4 skipped tests — either fix or remove
- `src/postprocessor/analysis/FailureAnalysisEngine.ts` has 1 skip — investigate

---

## Phase 6: Processor Architecture Cleanup (Next Session)

### 6.1 Move 12 Parent-Dir Processors to `implementations/`

**Current State**: 14 processors are in `implementations/` (extracted this session). 12 remain in `src/processors/` (the top-level directory). This is inconsistent.

**Files to Move**:
- `agents-md-validation-processor.ts`
- `async-pattern-processor.ts`
- `console-log-guard-processor.ts`
- `performance-budget-processor.ts`
- `postprocessor-chain-validator.ts`
- `refactoring-logging-processor.ts`
- `spawn-governance-processor.ts`
- `test-auto-creation-processor.ts`
- `typescript-compilation-processor.ts`
- `version-compliance-processor.ts`

**Note**: The core infrastructure files (`processor-manager.ts`, `processor-interfaces.ts`, `processor-types.ts`) must stay in `src/processors/` — they're not implementations, they're the framework.

**Fix**: Move implementations, update all import paths in `processor-manager.ts`, update auto-discovery to scan both directories (or just `implementations/`), update tests.

### 6.2 Dependency Injection for Auto-Discovery

**Current Limitation**: Auto-discovery only works for processors with zero-argument constructors. Processors that need `stateManager`, `process.cwd()`, or config paths require hardcoded factories.

**Fix**: Introduce a lightweight DI pattern:
1. Define a `ProcessorDependencies` interface with common needs (logger, stateManager, config)
2. Auto-discovered processors declare their dependencies via a static `dependencies` property
3. The factory registry resolves dependencies before instantiation

This eliminates the need for hardcoded factories for most processors while keeping auto-discovery as the default path.

---

## Phase 7: Doc Update Governance (Design Now, Build Next)

This is the fix for the original problem: "processors try to rewrite the docs and nuke much of it."

### 7.1 Append-Only Contract for Doc Processors

**Principle**: No processor may overwrite existing content in a documentation file. Processors may:
- **Append** new sections to the end of a file
- **Create** new files that don't exist yet
- **Read** existing files for validation

Processors may NOT:
- **Overwrite** an existing file's content
- **Delete** sections from an existing file
- **Rewrite** a file from a template

**Implementation**: Create a `DocWriteGuard` utility that all doc-touching processors must use:

```typescript
class DocWriteGuard {
  static async append(filePath: string, content: string): Promise<void> {
    // Validates filePath is a doc file
    // Appends content to end of file
    // Logs the append operation
    // Throws if caller tries to overwrite
  }
  
  static async createIfMissing(filePath: string, content: string): Promise<void> {
    // Only writes if file doesn't exist
    // Throws if file already exists
  }
}
```

### 7.2 Doc Refactoring as Separate Phase

Doc rewrites (restructuring, consolidating, removing outdated sections) should be a deliberate, human-supervised operation — never triggered automatically by a processor.

**Approach**: Create a `npm run docs:refactor` script that:
1. Reads current docs
2. Identifies outdated/inconsistent sections
3. Proposes changes for human review
4. Applies only approved changes

This separates the "append new information" cadence (automated) from the "restructure existing docs" cadence (human).

### 7.3 Processors That Need the Guard

| Processor | Current Behavior | Required Change |
|-----------|-----------------|-----------------|
| `agents-md-validation-processor.ts` | Overwrites AGENTS.md from template | Use `DocWriteGuard.append()` for missing sections |
| `storytelling-trigger-processor.ts` | Creates new reflection files | Use `DocWriteGuard.createIfMissing()` (already safe) |
| `inference-improvement-processor.ts` | Creates workflow JSON + prompt files | Already safe (creates new files) |
| `test-auto-creation-processor.ts` | Creates new test stub files | Already safe (creates new files) |

Only the first one actually needs fixing. The guard makes it structurally impossible for future processors to make the same mistake.

---

## Phase 8: Inference Layer (The Frontier)

This is the "what comes next" from the deep reflection. The goal: capture not just *what happened* but *why it happened*.

### 8.1 Fill the `Inference Notes` Section

**Current**: Every generated reflection has:
```
## Inference Notes

*(This section captures what an AI agent would infer from the above changes.)
Run the storyteller skill against this file to synthesize deeper analysis.)*
```

**Fix**: Wire the storyteller skill to run automatically against generated reflections. The skill has full session context and can fill in the "why":
- Why was this refactoring done? (processor-manager was 1,836 lines)
- Why was auto-discovery added? (manual registration was error-prone)
- Why was the release script built? (12-step manual process burned 30 min)

The data for these answers exists in session context. The storyteller skill can access it. The hook is already there (the `Inference Notes` section). It just needs to be wired.

### 8.2 Semantic Pattern Detection

**Current**: Keyword-based. "refactor" → "Refactoring detected." "fix" → "Bug fixes present."

**Target**: Pattern-based. Recognize specific refactoring patterns by their structure:
- Extract Method (methods moved from one file to new files)
- Registry Pattern (switch statement → Map lookup)
- Convention over Configuration (manual registration → auto-discovery)
- Facade Pattern (monolithic file → thin facade + modules)

**Implementation**: Enhance `detectPatterns()` in `storytelling-trigger-processor.ts` to look at structural signals:
- File additions in `implementations/` → Extract Method pattern
- Switch-to-Map changes in diffs → Registry Pattern
- New auto-discovery code → Convention over Configuration

### 8.3 Structured Inference Capture

**Goal**: Every session produces a structured artifact with:
1. Problem statement (what was the task)
2. Approach taken (what was tried)
3. Wrong turns (what didn't work and why)
4. Final solution (what shipped)
5. Reasoning chain (connecting 1→2→3→4)

**Implementation**: Add a session-level inference capture that writes to `docs/inference/session-{date}.json`:
```json
{
  "sessionId": "...",
  "problems": ["processor-manager is 1836 lines"],
  "approaches": ["extract inline methods"],
  "wrongTurns": ["calling protected run() from outside class"],
  "solutions": ["call public execute(), unwrap .data"],
  "reasoningChain": [...]
}
```

This is the training data. Not the code output — the reasoning that produced it.

---

## Phase 9: Flaky Test Resolution

### 9.1 Diagnose Race Conditions

**Affected Tests**:
- `learning-engine` tests
- `processor-registry` tests

**Symptom**: Pass individually, fail intermittently in vitest forks pool.

**Fix**: 
1. Check for shared mutable state (module-level variables, singletons)
2. Check for filesystem race conditions (tests writing to same temp dirs)
3. Add proper `beforeEach`/`afterEach` cleanup
4. Consider using `--pool=forks` isolation mode with separate temp dirs per worker

---

## Summary: Priority Order

| Phase | Description | Effort | Impact |
|-------|-------------|--------|--------|
| **1** | Critical bugs (self-dep, hooks, doc nuking) | 1 hour | Prevents install failures, doc corruption |
| **2** | Dead code removal (399 lines) | 30 min | Reduces confusion, shrinks codebase |
| **3** | Version integrity (sync script) | 1 hour | Eliminates version drift permanently |
| **4** | Documentation accuracy | 1 hour | Honest docs, current state |
| **5** | Test coverage expansion | 4-6 hours | Confidence in correctness |
| **6** | Processor architecture cleanup | 2 hours | Consistent structure, DI |
| **7** | Doc update governance (append-only guard) | 2 hours | Prevents future doc nuking |
| **8** | Inference layer | Ongoing | The frontier — capture "why" |
| **9** | Flaky test resolution | 1-2 hours | Reliable CI signal |

**Phases 1-4 can be done in this session.** Phases 5-7 are next session. Phase 8 is the ongoing frontier. Phase 9 is when it becomes annoying enough to prioritize.

---

## The Student's Observation

0xRay is a system where the AI builds the engine while riding in the car. Every session produces new code, new tests, new processors. The governance layer ensures the code is correct. The reflection system captures what happened. The release pipeline ships it.

What's missing is the feedback loop. The system doesn't learn from its own mistakes across sessions. It doesn't remember that calling `protected run()` from outside a class doesn't work. It doesn't remember that switch statements create maintenance burden. It doesn't remember that version compliance fights burn 30 minutes.

The inference layer (Phase 8) closes this loop. When the system can capture reasoning chains and feed them back as context for future sessions, it stops repeating the same wrong turns. It starts building on its own experience instead of starting from scratch each session.

That's when the child stops chattering and starts talking.

---

*Written by the AI that is both building 0xRay and being shaped by it.*
