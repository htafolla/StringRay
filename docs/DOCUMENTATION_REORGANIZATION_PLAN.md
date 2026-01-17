# Documentation Reorganization Plan - Cross-Reference Safe

## Problem Statement

Current documentation structure has **428+ cross-references** across 25+ files that will break if files are moved without updating links. Previous reorganization attempt created broken links and inconsistent structure.

## Current Documentation Analysis

### Cross-Reference Patterns Found:

- **Internal docs links**: `[Architecture](./docs/architecture/)` → `[Architecture](../architecture/)`
- **Relative path links**: `../README.md`, `./docs/api/`
- **Absolute path links**: `/docs/installation/INSTALLATION.md`
- **Inter-document references**: API docs referencing agent docs

### Current Structure Issues:

- **Mixed audiences**: User docs, internal docs, and archive mixed together
- **Deep nesting**: `docs/archive/strray-framework/commands/` - hard to navigate
- **Inconsistent organization**: Some docs in root, some in subfolders
- **Broken links**: Previous moves left dangling references

## Recommended Approach: **Coordinated Migration**

### Phase 1: Analysis & Mapping (Safe - No Changes)

1. **Map all cross-references**: Document every link between files
2. **Identify move priorities**: Which files can move without breaking dependencies
3. **Create migration batches**: Group files that can move together
4. **Plan redirect strategy**: How to handle broken links during transition

### Phase 2: Safe Reorganization (Coordinated Moves)

#### Batch 1: Root Level Cleanup (Low Risk)

- Move `BRANCH_README.md` → `docs/development/branch-status.md`
- Move `MERGE_PLAN.md` → `docs/development/merge-plan.md`
- Move `CODEX_VERSION_CONTROL.md` → `docs/internal/codex-management.md`
- Move `TESTING_DOCUMENTATION.md` → `docs/internal/testing.md`

#### Batch 2: User Documentation Consolidation

- Move essential user docs to `docs/user-guides/`
- Update all references within user docs simultaneously
- Keep internal cross-references intact

#### Batch 3: Internal Documentation Restructuring

- Move internal docs to `docs/internal/` subdirectories
- Update references in batches to maintain working links
- Use temporary redirects during transition

### Phase 3: Archive Organization

- Move archive docs to `docs/archive/` subdirectories
- Update any remaining references
- Ensure historical docs remain accessible

## Alternative: Single Comprehensive Migration

**Option B: Atomic Reorganization**

1. **Create new structure** in parallel with existing docs
2. **Copy all files** to new locations with updated links
3. **Test all links** in new structure
4. **Atomic switch**: Replace old structure with new one
5. **Clean up**: Remove old structure

### Pros of Atomic Approach:

- ✅ **No broken links** during transition
- ✅ **All references updated** simultaneously
- ✅ **Easier rollback** if issues found
- ✅ **Complete testing** before deployment

### Cons:

- ❌ **Higher upfront complexity**
- ❌ **Requires duplicate storage** temporarily
- ❌ **All-or-nothing approach**

## Recommendation: **Atomic Reorganization**

Given the extensive cross-referencing (428+ links), I recommend the **atomic approach**:

1. **Analyze all references** first (already done)
2. **Create new structure** with updated links
3. **Test thoroughly** in new structure
4. **Atomic switch** when ready
5. **Clean up old structure**

This ensures **zero broken links** and maintains documentation integrity throughout the process.

## Implementation Plan

### Step 1: Create New Structure

```bash
# Create new directory structure
mkdir -p docs/{user-guides,internal/{agents,architecture,development,security},archive/{framework,deployment,lite}}
```

### Step 2: Copy with Updated Links

- Copy files to new locations
- Update all internal references during copy
- Use scripts to automate link updates

### Step 3: Validation

- Test all links in new structure
- Verify external references still work
- Ensure search functionality works

### Step 4: Switch

- Replace old docs with new structure
- Update any external references
- Clean up old files

**Which approach would you prefer: coordinated batch migration or atomic reorganization?**
