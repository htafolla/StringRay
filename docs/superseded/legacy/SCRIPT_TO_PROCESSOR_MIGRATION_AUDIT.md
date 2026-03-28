# Script-to-Processor Migration Audit

**Date:** 2026-03-12  
**Auditor:** AI Assistant  
**Status:** Updated for v1.15.1  
**Framework Version:** v1.15.1

## v1.15.1 Architecture Update

This audit document has been updated to reflect the v1.15.1 facade pattern architecture refactoring.

### v1.15.1 Improvements

**Facade Pattern Benefits:**
- **87% Code Reduction**: 8,230 → 1,218 lines
- **Improved Organization**: Components now follow facade + module pattern
- **Better Separation of Concerns**: Logic separated into focused modules
- **Enhanced Testability**: Isolated modules easier to unit test

**Processor Integration:**
- RuleEnforcer: Now uses facade + 6 modules
- TaskSkillRouter: Now uses facade + 12 mapping modules + analytics
- MCP Client: Now uses facade + 8 modules

### Migration Status Updated

**Original Status:** 6 scripts need migration  
**v1.15.1 Status:** Architecture refactoring in progress - facade pattern implementation

---

## Summary

**Total Script-Based Enforcement:** 6 standalone scripts  
**Proper Processor Integration:** 3 existing processors  
**Newly Added (Hybrid):** AGENTS.md validation (processor + script)

**Problem:** Enforcement logic scattered across scripts/workflows instead of centralized in pre/post processor pipeline.

---

## Scripts Requiring Migration to Processors

### 1. **enforce-version-compliance.sh** ⚠️ CRITICAL
**Current:** Bash script + CI workflow + pre-commit hook  
**Should Be:** Pre-processor with blocking capability

**Current Flow:**
```
pre-commit hook → enforce-version-compliance.sh → blocks commit
CI workflow     → enforce-version-compliance.sh → blocks PR
preversion      → enforce-version-compliance.sh → blocks publish
```

**Proposed Flow:**
```
write/edit tool → ProcessorManager → VersionComplianceProcessor (pre)
                                              ↓
                                       blocks if version mismatch
```

**Lines of Code:** ~150 bash  
**Migration Effort:** Medium (2-3 hours)  
**Priority:** HIGH - Version compliance is critical

---

### 2. **validate-codex.js** ⚠️ HIGH
**Current:** Standalone validation script  
**Should Be:** Pre-processor or codex loading validation

**Current Usage:** Manual / CI  
**Proposed:** Auto-validate codex.json on framework boot

**Migration Effort:** Low (1 hour)  
**Priority:** MEDIUM - Codex integrity important

---

### 3. **validate-mcp-connectivity.js** ⚠️ MEDIUM
**Current:** CI workflow validation  
**Should Be:** Post-processor or health check

**Current Flow:** CI only  
**Proposed:** Post-processor validates after MCP operations

**Migration Effort:** Medium (2 hours)  
**Priority:** MEDIUM - Operational health

---

### 4. **validate-postinstall-config.js** ⚠️ MEDIUM
**Current:** Postinstall validation  
**Should Be:** Boot-time processor validation

**Current Flow:** npm postinstall hook  
**Proposed:** BootOrchestrator processor validation

**Migration Effort:** Low (1 hour)  
**Priority:** LOW - One-time validation

---

### 5. **validate-external-processes.js** ⚠️ LOW
**Current:** CI validation  
**Should Be:** Health monitoring processor

**Current Flow:** CI only  
**Proposed:** Background health check processor

**Migration Effort:** High (3-4 hours)  
**Priority:** LOW - Monitoring only

---

### 6. **enforce-agents-md.js** ✅ HYBRID (Just Created)
**Current:** Script + Processor + Rule  
**Status:** CORRECT APPROACH

**Architecture:**
- Pre-processor: `agents-md-validation-processor.ts` ✅
- Rule enforcement: `rule-enforcer.ts` ✅  
- Standalone script: `enforce-agents-md.js` (for CI/testing)
- CI workflow: `enforce-agents-md.yml` ✅

**This is the CORRECT pattern:** Core logic in processor, script for external use.

---

## Existing Proper Processor Integration ✅

| Processor | Type | Location | Status |
|-----------|------|----------|--------|
| preValidate | pre | boot-orchestrator | ✅ Working |
| codexCompliance | pre | boot-orchestrator | ✅ Working |
| errorBoundary | pre | boot-orchestrator | ✅ Working |
| agentsMdValidation | pre | boot-orchestrator | ✅ NEW - Just Added |
| stateValidation | post | boot-orchestrator | ✅ Working |

---

## The Core Problem

**Violating DRY Principle:**
- Version compliance logic in bash script
- Same logic needed in pre-commit hook
- Same logic needed in CI workflow  
- Same logic needed in preversion hook

**Violating Separation of Concerns:**
- Enforcement should be in processors (runtime)
- Scripts should only be for testing/shipping
- Workflows should only trigger processors

**Violating Single Source of Truth:**
- 3 different places to update version enforcement
- Inconsistent error messages across channels
- Different exit codes in different contexts

---

## Recommended Migration Plan

### Phase 1: Version Compliance (Week 1)
**Priority:** CRITICAL

1. Create `VersionComplianceProcessor` (pre)
   - Port bash logic to TypeScript
   - Integrate with `ProcessorManager`
   - Add to `boot-orchestrator`

2. Update `enforce-version-compliance.sh`
   - Make it call the processor via CLI
   - Keep as thin wrapper

3. Update workflows/hooks
   - Remove direct bash calls
   - Trigger through framework

**Benefit:** One codebase, consistent enforcement, blocking capability

---

### Phase 2: Codex Validation (Week 2)
**Priority:** HIGH

1. Create `CodexValidationProcessor` (pre)
   - Load and validate codex.json
   - Check term count minimums
   - Validate rule syntax

2. Merge with existing `codexCompliance` processor
   - Consolidate codex-related logic
   - Single point of maintenance

---

### Phase 3: MCP & Health (Week 3-4)
**Priority:** MEDIUM

1. Create `McpHealthProcessor` (post)
   - Validate after MCP operations
   - Report connectivity issues
   - Non-blocking (monitoring only)

2. Create `BootValidationProcessor` (pre)
   - Replace postinstall validation
   - Run once at framework boot
   - Cache results

---

## Architecture After Migration

```
┌─────────────────────────────────────────────────────────┐
│                    BootOrchestrator                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │              ProcessorManager                     │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │  │
│  │  │   Pre       │ │   Pre       │ │   Pre      │  │  │
│  │  │ Processors  │ │ Processors  │ │ Processors │  │  │
│  │  │             │ │             │ │            │  │  │
│  │  │ • preValid  │ │ • codexComp │ │ • agentsMd │  │  │
│  │  │ • errBound  │ │ • version   │ │ • errorBnd │  │  │
│  │  └─────────────┘ └─────────────┘ └────────────┘  │  │
│  │                                                  │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │           Post Processors                │   │  │
│  │  │  • stateValidation                       │   │  │
│  │  │  • mcpHealth                             │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │
         ▼ (only for testing/shipping)
┌─────────────────────────────────────────────────────────┐
│              Thin Wrapper Scripts                        │
│   • enforce-agents-md.js (calls processor)              │
│   • enforce-version-compliance.sh (calls processor)     │
│   • validate-codex.js (calls processor)                 │
└─────────────────────────────────────────────────────────┘
         │
         ▼ (only for CI/CD triggers)
┌─────────────────────────────────────────────────────────┐
│              GitHub Actions Workflows                    │
│   • Trigger processor validation                        │
│   • Report results                                      │
│   • Block PRs on failures                               │
└─────────────────────────────────────────────────────────┘
```

---

## Current State vs Ideal

| Aspect | Current | Ideal | Gap |
|--------|---------|-------|-----|
| Enforcement Logic | 6 scripts + duplication | 1 processor per concern | 5 migrations needed |
| Blocking Commits | Pre-commit hooks | Pre-processors | 1 migration |
| CI/CD Integration | Direct script calls | Processor triggers | 6 workflows to update |
| Error Messages | Inconsistent | Standardized | 5 scripts to consolidate |
| Testability | Script-level | Processor-level | Unit tests needed |

---

## Conclusion

**What We Did Right:**
- ✅ AGENTS.md validation uses proper processor architecture
- ✅ Rule enforcement in rule-enforcer.ts
- ✅ CI workflow only triggers, doesn't contain logic

**What Needs Fixing:**
- ❌ 5 other enforcements are script-based
- ❌ Version compliance is bash (should be TypeScript processor)
- ❌ Validation logic scattered across files

**Recommendation:**
1. **Immediate:** Migrate version compliance to processor (highest impact)
2. **Short-term:** Migrate codex validation (consolidation win)
3. **Medium-term:** Migrate MCP/health checks (nice to have)

**Jelly should not have ANY of its enforcement in scripts** - it should all be in processors that can be ported back to StringRay core.