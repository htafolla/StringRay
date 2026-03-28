# Agent Review Action Items

**Generated**: 2026-03-22
**Agents**: @refactorer, @code-analyzer, @researcher

## Summary
- **Total Tasks**: 21
- **High Priority**: 7
- **Medium Priority**: 8
- **Low Priority**: 6

---

## HIGH PRIORITY (7 tasks)

### exports (2)

| ID | Task | Status |
|----|------|--------|
| export-1 | Export routing-analytics.ts from delegation/analytics/index.ts | ⬜ |
| export-2 | Export learning-engine.ts from delegation/analytics/index.ts | ⬜ |

### refactor (4)

| ID | Task | Status |
|----|------|--------|
| refactor-1 | Create src/utils/shutdown-handler.ts with createGracefulShutdown() | ⬜ |
| refactor-2 | Update 18 MCP server files to use shutdown-handler.ts | ⬜ |
| refactor-3 | Remove deprecated initialize*Processor() methods (~820 lines) from processor-manager.ts | ⬜ |
| refactor-4 | Move agent definitions from agent-delegator.ts to src/config/default-agents.ts | ⬜ |

### fix (1)

| ID | Task | Status |
|----|------|--------|
| fix-1 | Fix ../dist/ imports in PostProcessor.ts | ⬜ |

---

## MEDIUM PRIORITY (8 tasks)

### refactor (3)

| ID | Task | Status |
|----|------|--------|
| refactor-5 | Batch processor registration in boot-orchestrator.ts | ⬜ |
| refactor-6 | Extract dynamicImport() helper in boot-orchestrator.ts | ⬜ |
| refactor-7 | Split boot-orchestrator.ts into BootPhases.ts and MemoryMonitorSetup.ts | ⬜ |

### types (4)

| ID | Task | Status |
|----|------|--------|
| types-1 | Replace any types with proper interfaces in processor-manager.ts | ⬜ |
| types-2 | Replace any types with proper interfaces in orchestrator.ts | ⬜ |
| types-3 | Replace any types with proper interfaces in enhanced-multi-agent-orchestrator.ts | ⬜ |
| types-4 | Remove @ts-ignore directives from test files | ⬜ |

### todo (1)

| ID | Task | Status |
|----|------|--------|
| todo-1 | Address TODO: complexity-analyzer.ts calibration (line 121) | ⬜ |

---

## LOW PRIORITY (6 tasks)

### todo (2)

| ID | Task | Status |
|----|------|--------|
| todo-2 | Address TODO: session-monitor.ts health monitoring (lines 191, 262) | ⬜ |
| todo-3 | Address TODO: ast-code-parser.ts AST parsing (lines 353, 590) | ⬜ |
| todo-4 | Address TODO: EscalationEngine.ts incident reporting (line 159) | ⬜ |

### logging (1)

| ID | Task | Status |
|----|------|--------|
| logging-1 | Replace console.* with frameworkLogger in MCP servers | ⬜ |

### tests (2)

| ID | Task | Status |
|----|------|--------|
| tests-1 | Add integration tests for processors/implementations/ | ⬜ |
| tests-2 | Add integration tests for MCP knowledge servers | ⬜ |

---

## Detailed Issue Descriptions

### HIGH PRIORITY

#### export-1, export-2: Missing exports in delegation/analytics/index.ts
**Issue**: `routing-analytics.ts` and `learning-engine.ts` exist but are not exported from the index.

#### refactor-1, refactor-2: Duplicate shutdown handler pattern
**Issue**: 18 MCP server files have identical shutdown signal handlers.
**Solution**: Extract to `src/utils/shutdown-handler.ts`:
```typescript
export function createGracefulShutdown(options: ShutdownOptions): void {
  process.on('SIGINT', () => { ... });
  process.on('SIGTERM', () => { ... });
  process.on('uncaughtException', () => { ... });
}
```

#### refactor-3: Dead code in processor-manager.ts
**Issue**: ~820 lines of deprecated `initialize*Processor()` methods from lines 744-1562.
**Solution**: Remove after migration period.

#### refactor-4: Massive agent definition array
**Issue**: ~280 lines of hardcoded agent objects in `agent-delegator.ts:109-387`.
**Solution**: Move to `src/config/default-agents.ts` and load from JSON/YAML.

#### fix-1: Fragile ../dist/ imports
**Issue**: `PostProcessor.ts:703` uses `../dist/enforcement/rule-enforcer.js` which breaks build order.
**Solution**: Use proper relative imports from source.

### MEDIUM PRIORITY

#### refactor-5: Repeated processor registration pattern
**Issue**: 8 identical `registerProcessor` + `frameworkLogger.log` blocks in boot-orchestrator.ts.
**Solution**: Batch registration with array.

#### refactor-6: Duplicate dynamic import pattern
**Issue**: Same try/catch fallback pattern repeated in boot-orchestrator.ts.
**Solution**: Extract `dynamicImport()` helper.

#### refactor-7: BootOrchestrator is 1227 lines
**Issue**: Single class doing too much.
**Solution**: Extract `BootPhases.ts` and `MemoryMonitorSetup.ts`.

#### types-1 to types-3: Heavy any type usage
**Issue**: 100+ instances of `any` type.
**Solution**: Create proper interfaces.

### LOW PRIORITY

#### TODO items
- session-monitor.ts: health monitoring incomplete
- ast-code-parser.ts: AST parsing not implemented
- EscalationEngine.ts: incident reporting missing

#### logging-1: Direct console.* usage
**Issue**: 100+ instances of `console.log/warn/error`.
**Solution**: Replace with frameworkLogger.

---

## Estimated Impact

| Action | Lines Saved/Improved |
|--------|---------------------|
| refactor-1, refactor-2 | ~400 lines |
| refactor-3 | ~820 lines |
| refactor-4 | ~280 lines |
| refactor-5 | ~80 lines |
| **Total** | **~1,580 lines** |
