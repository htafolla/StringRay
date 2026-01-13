# StrRay Path Resolution Issues & Solutions

## Executive Summary

The StrRay Framework suffers from systemic path resolution issues affecting **258+ files** across the codebase. These issues break the framework's portability between development, testing, and production environments.

## Problem Classification

### 1. Hardcoded `dist/` Paths (17 files)
**Affected Files:** Scripts and utilities that import from `dist/` directories

**Examples:**
```typescript
// ❌ Broken in development
import { RuleEnforcer } from '../dist/enforcement/rule-enforcer.js';

// ❌ Broken in production
import { ProcessorManager } from './dist/processors/processor-manager.js';
```

**Root Cause:** Assumes built files exist in specific locations
**Impact:** Fails when running in different environments or before builds

### 2. Relative `../` Imports (107 files)
**Affected Files:** Components that navigate directory structures

**Examples:**
```typescript
// ✅ Works in plugin deployment
import { Orchestrator } from '../orchestrator.js'; // plugin/plugins/ → plugin/

// ❌ Breaks in development
import { Agent } from '../agents/enforcer.js'; // src/agents/ → src/
```

**Root Cause:** Directory structure assumptions
**Impact:** Fails when files are moved or environments change

### 3. Relative `./` Imports (151 files)
**Affected Files:** Local imports within modules

**Examples:**
```typescript
// ✅ Works in same directory
import { Utils } from './utils.js';

// ❌ Breaks across environments
import { Config } from './config.js'; // May not exist in built version
```

**Root Cause:** Local file assumptions
**Impact:** Fails when build process changes file locations

### 4. Dynamic Import Paths (Agent Loading)
**Affected Files:** Boot orchestrator and similar loaders

**Examples:**
```typescript
// ❌ Hardcoded paths break
const agentModule = await import(`../agents/${agentName}.js`);

// ✅ Environment-aware (current solution)
const AGENTS_BASE_PATH = process.env.STRRAY_AGENTS_PATH || '../agents';
const agentModule = await import(`${AGENTS_BASE_PATH}/${agentName}.js`);
```

**Root Cause:** Dynamic path construction without environment awareness
**Impact:** Agent loading fails in different contexts

## Environment Matrix

| Environment | File Location | Working Directory | Path Resolution |
|-------------|---------------|-------------------|-----------------|
| **Development** | `src/` | Project root | Relative to source files |
| **Built Plugin** | `dist/plugin/` | Plugin root | Relative within dist/ |
| **Node Tests** | `dist/` | Test runner | Mix of source/built |
| **E2E Tests** | `node_modules/` | App root | Installed package paths |
| **Simulations** | `dist/` | Simulation runner | Built artifact paths |
| **Production** | `node_modules/strray/dist/` | App root | Installed package paths |

## Solution Categories

### Solution A: Environment Variables (Simple)
**Best For:** Script files, configuration, simple imports

```typescript
// Path configuration - can be overridden by environment
const AGENTS_BASE_PATH = process.env.STRRAY_AGENTS_PATH || '../agents';
const UTILS_BASE_PATH = process.env.STRRAY_UTILS_PATH || '../utils';

// Usage
import { Agent } from `${AGENTS_BASE_PATH}/enforcer.js`;
```

**Pros:** Simple, no complex logic, environment-specific
**Cons:** Manual configuration, environment-specific values needed
**Use Cases:** Boot orchestrator, script files, CLI tools

### Solution B: Directory Structure Alignment (Architectural)
**Best For:** Plugin loaders, well-structured components

```typescript
// Plugin structure ensures relative paths work
dist/plugin/
├── plugins/strray-codex-injection.js  // ../orchestrator.js → dist/plugin/orchestrator.js ✅
├── orchestrator.js                     // ../processors/ → dist/plugin/processors/ ✅
└── processors/processor-manager.js     // Works due to aligned structure
```

**Pros:** No code changes needed, works automatically
**Cons:** Requires specific build output structure
**Use Cases:** Plugin loaders, framework core components

### Solution C: Import Resolver (Complex)
**Best For:** Complex scenarios, multiple environments, dynamic imports

```typescript
import { importResolver } from './utils/import-resolver.js';

// Environment-aware imports
const { RuleEnforcer } = await importResolver.importModule('enforcement/rule-enforcer');
const agentPath = importResolver.resolveAgentPath('enforcer');
```

**Pros:** Handles all environments automatically, comprehensive
**Cons:** Complex implementation, performance overhead
**Use Cases:** Test files, dynamic loading, cross-environment compatibility

### Solution D: Build-Time Path Injection (Advanced)
**Best For:** Production deployments, CI/CD pipelines

```typescript
// Build script injects paths
const PATHS = {
  agents: process.env.BUILD_AGENTS_PATH || '../agents',
  utils: process.env.BUILD_UTILS_PATH || '../utils'
};
```

**Pros:** Compile-time resolution, no runtime overhead
**Cons:** Build system complexity, less flexible
**Use Cases:** Production builds, optimized deployments

## Implementation Plan

### Phase 1: Critical Path Fixes (Immediate)
1. **Boot Orchestrator** ✅ COMPLETED
   - Solution: Environment Variables
   - Status: `AGENTS_BASE_PATH` implemented

2. **Plugin Loader** ✅ VERIFIED
   - Solution: Directory Structure Alignment
   - Status: Works correctly, no changes needed

3. **Script Files (17 files)**
   - Solution: Environment Variables
   - Status: Pending - needs systematic replacement

### Phase 2: Import Resolution (High Priority)
1. **Test Files (Node, E2E, Simulations)**
   - Solution: Import Resolver
   - Status: Pending - affects test reliability

2. **Dynamic Imports (Agent Loading, MCP)**
   - Solution: Environment Variables + Fallbacks
   - Status: Partially implemented

### Phase 3: Architectural Fixes (Medium Priority)
1. **Build Output Structure**
   - Solution: Directory Structure Alignment
   - Status: Needs build configuration updates

2. **Cross-Environment Compatibility**
   - Solution: Import Resolver
   - Status: Complex resolver implemented but not deployed

## File Categorization

### Category A: Environment Variables (Simple Fix)
**Files:** Scripts, CLI tools, configuration files
- `scripts/*.mjs`
- `scripts/*.js`
- `src/cli/*.ts`

**Pattern:**
```typescript
const MODULE_PATH = process.env.STRRAY_MODULE_PATH || '../module';
import { Component } from `${MODULE_PATH}/component.js`;
```

### Category B: Directory Structure (No Code Changes)
**Files:** Plugin components with aligned structure
- `src/plugins/*.ts`
- Core framework files in correct relative positions

**Status:** Already working correctly

### Category C: Import Resolver (Complex)
**Files:** Test files, dynamic loaders, cross-environment code
- `src/__tests__/**/*.ts`
- `src/**/*.test.ts`
- Dynamic import locations

**Pattern:**
```typescript
const { module } = await importResolver.importModule('path/to/module');
```

### Category D: Build-Time Injection (Future)
**Files:** Production-optimized components
- Performance-critical paths
- Production deployment code

## Risk Assessment

### High Risk Files (Break Core Functionality)
1. `src/boot-orchestrator.ts` ✅ FIXED
2. `src/plugins/strray-codex-injection.ts` ✅ VERIFIED (working)
3. `src/enforcement/rule-enforcer.ts` ⚠️ NEEDS FIX (dist/ imports)
4. `src/processors/processor-manager.ts` ⚠️ NEEDS FIX (dynamic imports)

### Medium Risk Files (Break Testing)
1. All test files with relative imports
2. E2E test scripts
3. Simulation runners

### Low Risk Files (Break Development Experience)
1. Development utility scripts
2. Documentation generation
3. Build helpers

## Success Criteria

- ✅ **Zero path resolution errors** in development
- ✅ **Zero path resolution errors** in production
- ✅ **Zero path resolution errors** in testing
- ✅ **All 258+ files** work across all environments
- ✅ **No hardcoded paths** in source code
- ✅ **Environment-agnostic** imports

## Next Steps

1. **Implement Solution A** for all script files (17 files)
2. **Deploy Solution C** (Import Resolver) for test files
3. **Verify Solution B** works for all plugin components
4. **Test all environments** with comprehensive validation
5. **Update build process** to ensure directory alignment

## Emergency Mitigation

If path issues break critical functionality:

```bash
# Override paths via environment
export STRRAY_AGENTS_PATH='../agents'
export STRRAY_UTILS_PATH='../utils'
export STRRAY_PROCESSORS_PATH='../processors'
```

This provides immediate workaround while proper fixes are implemented.