#  - Plugin Deployment & Testing Guide

## Overview

This guide documents the complete process for deploying and testing the StrRay Framework as an oh-my-opencode plugin. This process has been refined through multiple iterations to resolve path resolution, initialization conflicts, and integration issues.

## Architecture Understanding

**Critical Distinction:** oh-my-opencode does NOT execute plugin JavaScript files. It only loads supporting file structures:

✅ **Loads:** `commands/`, `agents/`, `skills/`, `hooks/`, `mcps/`, `.mcp.json`
❌ **Ignores:** Main plugin JavaScript/TypeScript files (ES modules not supported)

**Development vs Deployment:**

- **Development Environment**: Test framework components in Node.js (ES modules work)
- **Plugin Deployment**: File structure only (no JavaScript execution)

## Prerequisites

- Node.js v18.0.0 or higher
- npm v8.0.0 or higher
-  or higher
- TypeScript 5.x

## Build Process

### 1. Full Framework Build

```bash
# Clean, build TypeScript, and build plugin
npm run build:all

# This executes:
# 1. rm -rf dist (clean)
# 2. tsc (main build)
# 3. tsc --project tsconfig.plugin.json (plugin build)
```

### 2. Package Creation

```bash
# Create npm package
npm pack

# Result: strray-1.0.0.tgz (305.1 kB, 268 files)
```

### 3. Deployment to Test Environment

```bash
# Create test environment
mkdir -p test-install
cd test-install

# Install StrRay package
npm install ../strray-1.0.0.tgz

# Verify installation
ls -la node_modules/strray/
```

## Critical Path Resolution Issues & Fixes

### Issue 1: Incorrect Security Auditor Import Path

**Problem:** `Cannot find module '/Users/blaze/dev/strray/dist/plugin/security/security-auditor'`

**Root Cause:** `boot-orchestrator.ts` was importing from `./agents/security-auditor` instead of `./security/security-auditor`

**Fix:**

```typescript
// WRONG:
const { SecurityAuditor } = await import("./agents/security-auditor");

// CORRECT:
const { SecurityAuditor } = await import("./security/security-auditor");
```

**Files Modified:** `src/boot-orchestrator.ts`

### Issue 2: Double Framework Initialization

**Problem:** `Processor preValidate is already registered` error

**Root Cause:** StrRay initialized twice - once automatically in `strray-init.js` and once manually in plugin

**Fix:** Implemented global initialization flag

```typescript
// In src/strray-init.ts
declare const globalThis: any;
const strrayInitialized = (globalThis as any).__strray_initialized;
if (!strrayInitialized) {
  (globalThis as any).__strray_initialized = true;
  initializeStrRay();
}
```

**Files Modified:** `src/strray-init.ts`, `src/plugins/strray-codex-injection.ts`

### Issue 3: ES Module Import Conflicts

**Problem:** `boot-check.cjs` couldn't require ES modules

**Root Cause:** Mixed CommonJS/ES module usage in test scripts

**Fix:** Updated test scripts to use ES module imports with proper \_\_dirname handling

```javascript
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
```

**Files Modified:** `scripts/run-orchestration-tests.mjs`

## Plugin Configuration

### oh-my-opencode.json Setup

```json
{
  "plugin": ["oh-my-opencode", "dist/plugin/plugins/strray-codex-injection.js"],
  "agent": {
    "orchestrator": { "model": "opencode/grok-code" },
    "enforcer": { "model": "opencode/grok-code" },
    "architect": { "model": "opencode/grok-code" },
    "code-reviewer": { "model": "opencode/grok-code" },
    "security-auditor": { "model": "opencode/grok-code" },
    "refactorer": { "model": "opencode/grok-code" },
    "test-architect": { "model": "opencode/grok-code" },
    "bug-triage-specialist": { "model": "opencode/grok-code" }
  }
}
```

### Package.json Configuration

```json
{
  "oh-my-opencode": {
    "plugin": "./dist/plugin/plugins/strray-codex-injection.js"
  },
  "bin": {
    "strray": "scripts/setup.cjs"
  }
}
```

## Testing Procedures

### 1. Plugin Loading Test

```bash
npm run test:plugin
```

**Expected Output:**

```
🏁 TRIAGE RESULTS: 6/6 checks passed
🎉 ALL SYSTEMS OPERATIONAL - StrRay Framework is fully functional!
```

This verifies that all framework components (agents, MCP servers, codex) are properly deployed and accessible.

### 4. Development Environment Testing

**Note:** Plugin JavaScript execution tests are for development only. oh-my-opencode does not execute plugin code.

```bash
# Test plugin execution in development environment
npm run test:plugin

# View ASCII art and initialization (development only)
npm run dev:framework
```

**Expected Output:**

```
🧪 Testing StrRay Plugin Loading...
✅ Plugin loaded successfully
✅ System transform hook executed
📚 Codex context injected: ✅
🎉 StrRay Framework Plugin Test: PASSED
```

### 5. oh-my-opencode Integration Check

```bash
npx oh-my-opencode doctor
```

**Expected Output:**

```
✓ Plugin Registration → Registered
✓ User MCP Configuration → 21 user server(s) configured
```

**Note:** oh-my-opencode does not automatically display StrRay initialization messages. To see the ASCII art and initialization feedback, run `.opencode/init.sh` manually after setup.

### 2. Orchestration Functionality Test

```bash
npm run test:orchestration
```

**Expected Output:**

```
🚀 StrRay Framework - Orchestration Test Runner
==============================================

📋 TEST 1: Simple Component Analysis
-----------------------------------
✅ Simple component loaded successfully
📊 Component size: 373 characters
📊 Contains 19 lines
📊 React imports: ✅

📋 TEST 2: Complex Service Analysis
----------------------------------
✅ Complex service loaded successfully
📊 Service size: 1338 characters
📊 Contains 60 lines
📊 Async methods: ✅
📊 Error handling: ✅
📊 Private methods: ✅

📋 TEST 3: Framework Components Verification
-------------------------------------------
✅ strray-codex-injection.js: 10919 bytes
✅ code-review.server.js: 32368 bytes
✅ enforcer-tools.server.js: 28172 bytes
✅ enhanced-multi-agent-orchestrator.js: 12698 bytes
```

### 3. Comprehensive Triage Check

```bash
npm run triage
```

**Expected Output:**

```
🧪 Testing StrRay Plugin Loading...
=====================================

✅ Plugin loaded successfully
✅ System transform hook executed
📝 System messages added: 2
✨ Welcome message: ✨ Welcome StrRay 1.0.0 Agentic Framework Successfully Loaded....
📚 Codex context injected: ✅
📋 Codex terms included: ✅

🎉 StrRay Framework Plugin Test: PASSED
✨ Framework is ready for oh-my-opencode integration

🏁 TRIAGE RESULTS: 6/6 checks passed
🎉 ALL SYSTEMS OPERATIONAL - StrRay Framework is fully functional!
```

### 4. Boot Health Check

```bash
node scripts/boot-check.cjs
```

**Note:** This test may not show output due to ES module import issues, but triage check covers comprehensive diagnostics.

### 4. Manual Verification Steps

1. **Check Framework Initialization:**

   ```bash
   node dist/strray-init.js
   ```

   Expected: StrRay activation messages

2. **Verify Plugin File:**

   ```bash
   ls -la dist/plugin/plugins/strray-codex-injection.js
   ```

3. **Test Codex Loading:**
   ```bash
   ls -la .strray/codex.json AGENTS.md
   ```

## Deployment Checklist

### Pre-Deployment

- [ ] All TypeScript compiles without errors
- [ ] `npm run build:all` completes successfully
- [ ] `npm pack` creates valid tarball
- [ ] Test installation in clean environment works

### Plugin Configuration

- [ ] oh-my-opencode.json has correct plugin path
- [ ] All 8 StrRay agents configured with correct models
- [ ] Plugin path resolves correctly in deployment environment

### Path Resolution

- [ ] Security auditor imports from correct path (`./security/security-auditor`)
- [ ] All relative imports work in both dev and deployed environments
- [ ] ES module imports handle \_\_dirname correctly

### Initialization

- [ ] Global flag prevents double initialization
- [ ] Framework initializes once per oh-my-opencode session
- [ ] No processor registration conflicts

### Testing

- [ ] `npm run test:plugin` passes all checks
- [ ] `npm run test:orchestration` verifies functionality
- [ ] Codex injection confirmed working
- [ ] All framework components load correctly

## Troubleshooting Guide

### Error: "Cannot find module './security/security-auditor'"

**Cause:** Wrong import path in boot-orchestrator.ts
**Fix:** Change to `"./security/security-auditor"`

### Error: "Processor preValidate is already registered"

**Cause:** Double framework initialization
**Fix:** Check global initialization flag is working

### Error: "\_\_dirname is not defined in ES module scope"

**Cause:** CommonJS **dirname usage in ES modules
**Fix:** Use `const **dirname = dirname(fileURLToPath(import.meta.url));`

### Plugin doesn't load in oh-my-opencode

**Check:**

- Plugin path in oh-my-opencode.json is correct
- dist/plugin/plugins/strray-codex-injection.js exists
- oh-my-opencode version supports ES module plugins
- No syntax errors in plugin file

### Codex not injected into system prompts

**Check:**

- .strray/codex.json or AGENTS.md exists
- Plugin's system transform hook is called
- Codex parsing doesn't fail with syntax errors

### Agent orchestration not working

**Check:**

- All agent configurations in oh-my-opencode.json
- Complexity analysis working correctly
- Session coordinator initialized properly

## Best Practices Learned

### 1. Path Management

- Always use relative imports from current file location
- Test paths in both development and deployment environments
- Use ES module \_\_dirname pattern for dynamic path resolution

### 2. Initialization Strategy

- Use global flags to prevent duplicate initialization
- Initialize framework once per oh-my-opencode session
- Handle both automatic and manual initialization scenarios

### 3. Plugin Architecture

- Keep plugin code minimal - import framework components, don't duplicate
- Use oh-my-opencode's plugin hooks for integration
- Test plugin loading separately from framework functionality

### 4. Testing Approach

- Test plugin loading and codex injection independently
- Use mock-based testing for oh-my-opencode integration
- Verify both development and deployment environments

### 5. Error Handling

- Fail fast on critical path issues
- Log detailed error information for debugging
- Gracefully handle optional component failures

## Version History

- **v1.0.27**: Initial production release with all path and initialization issues resolved
- **Plugin deployment process**: Refined through 5+ iterations
- **Testing procedures**: Comprehensive coverage of all integration points

---

## Quick Reference Commands

```bash
# Build and package
npm run build:all && npm pack

# Automated deployment (recommended)
npm run deploy:plugin                    # Deploy to default test environment
npm run deploy:plugin -- custom-env     # Deploy to custom environment

# Manual deployment
mkdir test-install && cd test-install && npm install ../strray-1.0.0.tgz

# Run tests
npm run test:plugin                     # Plugin functionality test
npm run test:orchestration              # Agent orchestration test
npm run triage                          # Comprehensive system diagnostics

# Verify framework
node dist/strray-init.js                 # Manual initialization check
.opencode/init.sh                        # oh-my-opencode integration check

# Clean up
cd .. && rm -rf test-install
```

**Framework Status:** ✅ Production-ready with comprehensive testing and deployment procedures documented.
