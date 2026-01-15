# StringRay v1.0.4 → Main Branch Merge Plan

## Overview
Selective merge of stable fixes and improvements from `feature/self-evolution-v2.0.0` branch back to `main` branch, excluding v2.0 self-evolution commercial features.

## Current Branch Status

### feature/self-evolution-v2.0.0 (Current)
**Total Commits**: 25+ commits
**V2 Commercial Features** (Keep Separate):
- ✅ Self-evolution system (8 components)
- ✅ Autonomous learning loops
- ✅ Advanced inference engine
- ✅ Self-reflection capabilities
- ✅ Continuous optimization

**Stable Fixes to Merge** (Ready for v1.0.4):
- ✅ Business rules engine fixes
- ✅ Documentation improvements
- ✅ Version management system
- ✅ CI/CD fixes and optimizations
- ✅ Import resolution improvements
- ✅ Package configuration fixes

## Merge Strategy

### Phase 1: Create Clean Merge Branch
```bash
# Create merge branch from main
git checkout main
git pull origin main
git checkout -b merge/v1.0.4-fixes
```

### Phase 2: Selective Cherry-Pick
Cherry-pick stable commits (exclude self-evolution):

```bash
# Core fixes (keep these)
git cherry-pick 8e3fb76  # Resolve path resolution issues
git cherry-pick bf2bf66  # Correct processor validation
git cherry-pick 9cde8ee  # Optimize CI test execution
git cherry-pick 59fe4b6  # Improve import resolver
git cherry-pick 5209f9d  # Update documentation references
git cherry-pick 145839e  # Skip tool availability in CI
git cherry-pick 23ef5e7  # Remove syntax errors
git cherry-pick f826856  # CI-compatible validation
git cherry-pick 5700dfe  # CI configuration files
git cherry-pick 9e42678  # Robust multi-path imports
git cherry-pick 8ae0096  # CI build plugin compilation

# Version management (keep)
git cherry-pick b742c24  # Version variables
git cherry-pick 8fbcd3f  # README version corrections
git cherry-pick f29aa07  # Documentation consistency
git cherry-pick d95f25f  # Universal version manager

# Documentation (keep)
git cherry-pick b766817  # Codex versioning fixes
```

### Phase 3: Test & Validate
```bash
# Run full test suite
npm test
npm run test:integration

# Validate version consistency
node scripts/universal-version-manager.js

# Check codex compliance
npm run lint
```

### Phase 4: Merge to Main
```bash
# Merge to main
git checkout main
git merge merge/v1.0.4-fixes

# Tag release
git tag v1.0.4
git push origin main --tags
```

## Files to Include in Merge

### ✅ INCLUDE (Stable v1.0.4 fixes):
- `scripts/universal-version-manager.js`
- `CODEX_VERSION_CONTROL.md`
- Documentation updates
- CI/CD improvements
- Import resolution fixes
- Package configuration fixes
- Test optimizations

### ❌ EXCLUDE (V2 Commercial Features):
- `src/self-evolution/` (entire directory)
- `src/simulation/self-evolution-simulations.ts`
- `src/simulation/unified-simulation-runner.ts` (v2 parts)
- Any self-evolution references in docs
- Advanced autonomous features

## Post-Merge Actions

### Main Branch (v1.0.4):
1. **Release v1.0.4** with all fixes
2. **Update npm** package to latest
3. **Close v1.0.4 issues** in project management

### Feature Branch (v2.0.0):
1. **Continue development** of self-evolution features
2. **Prepare commercial release** strategy
3. **Maintain separation** from main branch

## Benefits of This Approach

### ✅ Clean Release History
- Main branch stays focused on v1.x stable releases
- V2 commercial features remain separate
- Clear distinction between free and paid features

### ✅ Risk Mitigation
- V2 experimental features don't affect stable releases
- Easy rollback if issues arise
- Independent testing and deployment

### ✅ Business Strategy
- Free core platform (main) builds community
- Commercial features (v2 branch) generate revenue
- Clear upgrade path for enterprise users

## Alternative: Complete Cleanup First

Since you mentioned "there is also a lot more cleanup to do," we could:

1. **Complete all cleanup** on the feature branch first
2. **Test thoroughly** with all fixes applied
3. **Then do selective merge** of stable changes

This ensures the main branch gets the most polished version of all fixes.

## Recommendation

**I recommend completing cleanup on the feature branch first**, then doing selective cherry-picking. This gives us:
- Most stable version of fixes going to main
- Complete testing of all changes together
- Better integration testing before merge

**Which approach would you prefer?** Should we finish cleanup here first, or proceed with the selective merge plan?