# StringRay Critical Code Issues - Implementation Plan

## Executive Summary

Based on deep code review by @architect, @code-analyzer, and @researcher agents, this document outlines the implementation plan for critical code issues.

---

## Immediate Priority

### 1. Add timeout to polling in `delegateToSubagent`

**File:** `src/core/orchestrator.ts`

**Issue:** Infinite polling risk - recursive setTimeout with no exit condition or max retries

**Current Problem:**
The `delegateToSubagent` method lacks timeout handling. If delegation fails, it could hang indefinitely.

**Recommended Fix:**
```typescript
async delegateWithTimeout(
  agentName: string,
  task: any,
  options: { maxRetries: number; timeoutMs: number; pollIntervalMs: number }
): Promise<any> {
  const { maxRetries, timeoutMs, pollIntervalMs } = options;
  const startTime = Date.now();
  let attempts = 0;

  while (attempts < maxRetries) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Delegate to ${agentName} timed out after ${timeoutMs}ms`);
    }

    try {
      const result = await this.attemptDelegation(agentName, task);
      if (result.success) {
        return result;
      }
    } catch (error) {
      // Continue to next attempt
    }

    attempts++;
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Delegate to ${agentName} failed after ${maxRetries} attempts`);
}
```

**Implementation Steps:**
1. Add `delegateWithTimeout` method with polling logic
2. Update `delegateToSubagent` to use configurable options
3. Add `maxRetries`, `timeoutMs`, `pollIntervalMs` to config

---

### 2. Fix `calibrationHistory` memory leak

**File:** `src/delegation/complexity-analyzer.ts`

**Issue:** Array grows forever with no cleanup - every call to `updateThresholds` pushes without limit

**Current Problem:**
```typescript
private calibrationHistory: Array<{...}> = [];

updateThresholds(performanceData: unknown): void {
  this.calibrationHistory.push({...});  // No bounds checking!
}
```

**Recommended Fix:**
```typescript
private static readonly MAX_CALIBRATION_HISTORY = 1000;

updateThresholds(performanceData: unknown): void {
  this.calibrationHistory.push({...});

  // Add cleanup to prevent unbounded growth
  if (this.calibrationHistory.length > ComplexityAnalyzer.MAX_CALIBRATION_HISTORY) {
    const removeCount = this.calibrationHistory.length - ComplexityAnalyzer.MAX_CALIBRATION_HISTORY + 100;
    this.calibrationHistory = this.calibrationHistory.slice(removeCount);
    
    frameworkLogger.log(
      "complexity-analyzer",
      "calibration-history-trimmed",
      "info",
      { removedEntries: removeCount, remainingEntries: this.calibrationHistory.length }
    );
  }
}
```

**Implementation Steps:**
1. Add `MAX_CALIBRATION_HISTORY` constant (1000 entries)
2. Add trim logic in `updateThresholds` after push
3. Add logging for trim events

---

### 3. Fix `isShuttingDown` race condition

**File:** `src/core/boot-orchestrator.ts`

**Issue:** `isShuttingDown` declared `const` but never updated - shutdown logic broken

**Current Problem:**
```typescript
function setupGracefulShutdown(): void {
  const isShuttingDown = false;  // Never updated!
  
  process.on("SIGINT", async () => {
    if (isShuttingDown) {  // Always false!
      process.exit(0);
    }
  });
}
```

**Recommended Fix:**
```typescript
function setupGracefulShutdown(): void {
  let isShuttingDown = false;  // Mutable reference

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;  // Already shutting down
    }
    
    isShuttingDown = true;  // Update flag
    
    try {
      memoryMonitor.stop();
      await new Promise((resolve) => setTimeout(resolve, 500));
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
```

**Implementation Steps:**
1. Change `const` to `let` for `isShuttingDown`
2. Update flag at start of shutdown handler
3. Refactor to use shared shutdown function

---

### 4. Add auth to CLI server

**File:** `src/cli/server.ts`

**Issue:** `/api/status` and `/api/agents` endpoints are unauthenticated

**Current Problem:**
```typescript
app.get("/api/status", (req, res) => {
  res.json({ framework: "StringRay", version, status: "active" });
});
```

**Recommended Fix:**
```typescript
const API_KEY = process.env.STRRAY_API_KEY;

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const providedKey = req.headers["x-api-key"];
  
  if (!providedKey || providedKey !== API_KEY) {
    return res.status(401).json({ error: "API key required" });
  }
  
  next();
}

app.get("/api/status", requireAuth, (req, res) => {
  res.json({ framework: "StringRay", version, status: "active" });
});
```

**Implementation Steps:**
1. Add `API_KEY` from `STRRAY_API_KEY` environment variable
2. Create `requireAuth` middleware
3. Apply to `/api/status` and `/api/agents` routes
4. Document environment variable

---

## Short-term Priority

### 5. Break up `processor-manager.ts` (1474 lines)

**File:** `src/processors/processor-manager.ts`

**Issue:** God class with 20+ responsibilities

**Current Responsibilities (to be split):**
| Responsibility | Lines | New File |
|----------------|-------|----------|
| Processor registration | 125-300 | `processor-registry.ts` |
| Test execution | 350-550 | `test-executor.ts` |
| Coverage analysis | 600-700 | `coverage-analyzer.ts` |
| State validation | 750-900 | `state-validator.ts` |
| Rule mapping | 1300-1410 | `rule-mapper.ts` |

**Recommended Structure:**
```
src/processors/
  ├── processor-manager.ts      # Orchestration only (~200 lines)
  ├── processor-registry.ts     # Registration & lifecycle
  ├── test-executor.ts          # Test execution logic
  ├── coverage-analyzer.ts      # Coverage analysis
  ├── state-validator.ts        # State validation
  └── rule-mapper.ts            # Rule to agent/skill mapping
```

**Implementation Steps:**
1. Create `processor-registry.ts` - extract registration logic
2. Create `test-executor.ts` - extract test execution
3. Create `coverage-analyzer.ts` - extract coverage methods
4. Create `state-validator.ts` - extract state validation
5. Create `rule-mapper.ts` - extract rule mapping
6. Refactor `processor-manager.ts` to delegate
7. Update imports in `boot-orchestrator.ts`

---

### 6. Remove unsafe type assertions

**Files:** Multiple

**Issue:** `as unknown as Type` bypasses TypeScript safety entirely

**Examples Found:**

| File | Line | Problem |
|------|------|---------|
| `mcp-connection.ts` | 324 | `as unknown as ChildProcess` |
| Test files | Multiple | `} as unknown as ChildProcess;` |

**Recommended Fix:**

**For mcp-connection.ts:**
```typescript
// BEFORE (unsafe)
private process: ChildProcess | undefined = undefined as unknown as ChildProcess | undefined;

// AFTER (safe)
private process: ChildProcess | undefined = undefined;
```

**For test files:**
```typescript
// BEFORE (unsafe)
const mockProcess = { kill: vi.fn() } as unknown as ChildProcess;

// AFTER (proper mock)
const mockProcess = {
  kill: vi.fn(),
  stdout: { on: vi.fn(), pipe: vi.fn() },
  stderr: { on: vi.fn(), pipe: vi.fn() },
  on: vi.fn(),
} as Mocked<ChildProcess>;
```

**Implementation Steps:**
1. Fix `mcp-connection.ts:324` - use proper nullable type
2. Fix test files - use `Mocked<ChildProcess>` from vitest
3. Add ESLint rule to prevent future issues
4. Run lint after changes

---

## Priority Summary

| Priority | Issue | File | Complexity | Status |
|----------|-------|------|------------|--------|
| Immediate #1 | Add timeout to polling | `orchestrator.ts` | Low | ✅ DONE |
| Immediate #2 | Memory leak | `complexity-analyzer.ts` | Low | ✅ DONE |
| Immediate #3 | Race condition | `boot-orchestrator.ts` | Low | ✅ DONE |
| Immediate #4 | Missing auth | `server.ts` | Medium | ✅ DONE |
| Short-term #5 | God class | `processor-manager.ts` | High | TODO |
| Short-term #6 | Unsafe casts | Multiple | Medium | ✅ DONE |

---

## Test Verification

After implementing each fix, run:

```bash
npm run build && npm test
```

All 2311 tests should pass after each fix is applied.
