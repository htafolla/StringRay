# Scripts & Commands Inventory

> Comprehensive documentation of all CLI scripts, npm scripts, and shell commands in the StringRay codebase.

---

## Category 1: CLI Commands (npx strray-ai)

All commands are available via `npx strray-ai <command>` after installation.

### Main CLI Entry Point

| Command | Description | What It Does |
|---------|-------------|--------------|
| `install` | Install StringRay | Runs `postinstall.cjs` to configure framework in current project |
| `init` | Initialize configuration | Same as install - runs postinstall setup |
| `status` | Check installation status | Verifies `opencode.json` and `.opencode/enforcer-config.json` exist |
| `validate` | Validate framework setup | Runs `.opencode/init.sh` script |
| `debug` | Debug info | Shows packageRoot and cwd |
| `capabilities` (alias: `caps`) | Show capabilities | Lists all available agents, skills, and features |
| `health` (alias: `check`) | Health check | Verifies package, config, agents, and MCP servers |
| `report` | Generate reports | Creates activity/health reports (full-analysis, agent-usage, performance) |
| `fix` | Auto-fix issues | Runs postinstall to restore configuration |
| `analytics` | Pattern analytics | Uses SimplePatternAnalyzer to analyze log patterns |
| `calibrate` | Calibrate complexity | Analyzes historical accuracy and adjusts complexity thresholds |
| `doctor` | Diagnose issues | Checks Node version, package, config, .mcp.json conflicts |
| `archive-logs` | Archive log files | Without framework boot (for git hooks) - max 10MB, 24h rotation |

### CLI Source

**File:** `src/cli/index.ts` (757 lines)
- Uses Commander.js for CLI parsing
- Binary entry: `dist/cli/index.js`
- Version dynamically read from `package.json`

---

## Category 2: NPM Scripts

### Build & Development

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `tsc && npm run build:copy-plugins` | Compile TypeScript and copy plugins |
| `build:all` | `npm run build` | Alias for build |
| `build:copy-plugins` | Node script | Copy plugin to `.opencode/plugin` |
| `build:run` | `node scripts/build/utils.js build` | Build utility wrapper |
| `build:clean` | `node scripts/build/utils.js clean` | Clean build artifacts |
| `build:verify` | `node scripts/build/utils.js verify` | Verify build output |
| `clean` | `rm -rf dist` | Remove dist directory |
| `typecheck` | `tsc --noEmit` | Type check without emitting |
| `lint` | `eslint -c tests/config/eslint.config.js src` | Lint source files |
| `lint:fix` | `eslint ... src --fix` | Fix linting issues |

### Testing

| Script | Command | Purpose |
|--------|---------|---------|
| `test` | `vitest run` | Run all tests |
| `test:unit` | Vitest specific files | Unit tests for core components |
| `test:core-framework` | Vitest specific files | Agent delegator, orchestrator tests |
| `test:security` | Vitest specific files | Security hardener, headers, auditor |
| `test:performance` | Vitest specific files | Monitoring, benchmark, analytics |
| `test:session-management` | Vitest specific files | Session state, security, coordination |
| `test:code-analysis` | Vitest specific files | Context analyzer, dependency graph, codex |
| `test:processors` | Vitest specific files | Processor activation tests |
| `test:miscellaneous` | Vitest specific files | Blocked tests |
| `test:quick` | Vitest specific files | Quick integration test |
| `test:comprehensive` | All test suites | Full test suite |
| `test:integration-all` | Vitest integration | All integration tests |
| `test:performance-all` | Vitest performance | All performance tests |
| `test:agents-all` | Vitest agents | Agent tests |
| `test:infrastructure` | Vitest infrastructure | Infrastructure tests |
| `test:root` | Vitest root | Root integration tests |
| `test:full-suite` | All test categories | Complete test suite |

### Analytics & Reporting

| Script | Command | Purpose |
|--------|---------|---------|
| `analytics:daily` | `node dist/scripts/analytics/daily-routing-analysis.js` | Daily routing analysis |
| `analytics:daily:preview` | Same + `--preview` | Preview analysis without applying |
| `analytics:daily:apply` | Same + `--apply` | Apply routing refinements |

### Configuration & Setup

| Script | Command | Purpose |
|--------|---------|---------|
| `postinstall` | `node scripts/node/postinstall.cjs` | Post-install setup |
| `setup-dev` | `node scripts/node/setup-dev.cjs` | Development setup |
| `prepare-consumer` | `node scripts/node/prepare-consumer.cjs` | Prepare for npm publish |
| `config:setup` | `node scripts/config/utils.js setup-dev` | Configure development |

### Monitoring & Daemon

| Script | Command | Purpose |
|--------|---------|---------|
| `monitoring:start` | `node scripts/monitoring/daemon.js start` | Start monitoring daemon |
| `monitoring:stop` | `node scripts/monitoring/daemon.js stop` | Stop monitoring daemon |
| `monitoring:report` | `node scripts/monitoring/daemon.js report` | Generate monitoring report |

### Validation & Testing

| Script | Command | Purpose |
|--------|---------|---------|
| `validate` | `node scripts/validate-stringray-comprehensive.js` | Comprehensive validation |
| `validate:quick` | Same + `--quick` | Quick validation |
| `validate:full` | Same + `--full` | Full validation |
| `test:integration` | Node scripts | Test consumer readiness & MCP |
| `test:e2e` | Node scripts | Validate MCP & external processes |
| `test:modules` | `node scripts/test-es-modules.mjs` | ES module testing |
| `test:unified` | `node scripts/test/test-unified-framework.mjs` | Unified framework test |
| `test:plugin` | `node scripts/test/test-stray-plugin.mjs` | Plugin test |
| `test:consumer` | `node scripts/test/test-consumer-readiness.cjs` | Consumer readiness |
| `security-audit` | `npm audit` | Run security audit |
| `test:security-audit` | `npm run test:security` | Run security tests |
| `test:dependency-scan` | `npm run security-audit` | Dependency vulnerability scan |

### Documentation

| Script | Command | Purpose |
|--------|---------|---------|
| `docs:sync-readme` | `node scripts/node/sync-readme-features.js` | Sync features to README |
| `docs:sync-readme:dry-run` | Same + `--dry-run` | Preview sync without changes |
| `docs:reflection-index` | `node scripts/node/generate-reflection-index.js` | Generate reflection index |
| `docs:changelog` | `node scripts/node/generate-changelog.js` | Generate changelog |
| `docs:changelog:from-tag` | Same | Generate changelog from git tag |

### Version Management

| Script | Command | Purpose |
|--------|---------|---------|
| `version:bump` | `node scripts/node/version-manager.mjs` | Version bump (patch/minor/major) |
| `version` | `node scripts/node/version-manager.mjs` | Alias for version:bump |
| `version:sync` | `node scripts/node/universal-version-manager.js` | Universal version sync |
| `enforce:versions` | `bash scripts/node/enforce-version-compliance.sh` | Enforce version compliance |
| `pre-publish-guard` | `node scripts/node/pre-publish-guard.js` | Pre-publish checks |
| `preversion` | `npm run version:sync` | Run before version bump |

### Publishing

| Script | Command | Purpose |
|--------|---------|---------|
| `prepublishOnly` | `npm run prepare-consumer && npm run build:all` | Before npm publish |
| `safe-publish` | Pre-publish guard + prepare + build + publish | Safe publish flow |
| `publish` | Pre-publish guard + safe-publish | Full publish command |
| `release:patch` | `npm run release -- patch` | Release patch version |
| `release:minor` | `npm run release -- minor` | Release minor version |
| `release:major` | `npm run release -- major` | Release major version |
| `release` | `node scripts/node/release.mjs` | Release script |

---

## Category 3: Binary Scripts (bin/)

**Note:** No `bin/` directory exists in this project. Instead, binaries are defined in `package.json`:

```json
"bin": {
  "strray-ai": "dist/cli/index.js",
  "strray-integration": "dist/scripts/integration.js",
  "strray-analytics": "dist/scripts/analytics/daily-routing-analysis.js"
}
```

---

## Category 4: Node Scripts (scripts/node/)

### Installation & Setup

| Script | Purpose |
|--------|---------|
| `postinstall.cjs` | Post-install setup - configures .opencode, copies plugins |
| `setup-dev.cjs` | Development environment setup |
| `prepare-consumer.cjs` | Prepares package for npm publish (consumer version) |

### Version & Release

| Script | Purpose |
|--------|---------|
| `version-manager.mjs` | Version bumping (patch/minor/major) |
| `universal-version-manager.js` | Universal version sync across files |
| `enforce-version-compliance.ts` | Enforces version consistency |
| `pre-publish-guard.js` | Pre-publish validation checks |
| `release.mjs` | Release automation script |

### Documentation

| Script | Purpose |
|--------|---------|
| `generate-changelog.js` | Generates CHANGELOG.md from git history |
| `generate-reflection-index.js` | Generates index of reflection documents |
| `sync-readme-features.js` | Syncs features to README.md |

### Testing & Validation

| Script | Purpose |
|--------|---------|
| `validate-mcp-connectivity.js` | Validates MCP server connectivity |
| `validate-external-processes.js` | Validates external process dependencies |
| `test-plugin-comprehensive.js` | Comprehensive plugin testing |
| `test-session-management.js` | Session management testing |
| `test-postinstall.js` | Tests postinstall script |

### Monitoring & Reporting

| Script | Purpose |
|--------|---------|
| `performance-report.js` | Generates performance reports |
| `generate-activity-report.js` | Generates activity reports |
| `generate-phase1-report.js` | Generates phase 1 report |
| `trigger-report.js` | Triggers report generation |

### Analysis & Debugging

| Script | Purpose |
|--------|---------|
| `analyzer-agent-runner.js` | Runs analyzer agent |
| `profiling-demo.js` | Profiling demonstration |
| `fix-mcp-capabilities.js` | Fixes MCP capabilities |
| `cleanup-repository.js` | Repository cleanup |
| `cleanup-doc-versions.js` | Documentation version cleanup |
| `cleanup-console-logs.js` | Console log cleanup |
| `activate-self-direction.js` | Activates self-direction mode |

### Pre/Post Hooks

| Script | Purpose |
|--------|---------|
| `pre-commit-version-validation.js` | Pre-commit version validation |
| `run-postprocessor.js` | Post-processing after builds |

### Integration

| Script | Purpose |
|--------|---------|
| `cleanup-console-logs.js` | Cleanup console logs |
| `activate-self-direction.js` | Activate self-direction |

---

## Category 5: TypeScript Scripts (scripts/ts/)

| Script | Purpose |
|--------|---------|
| `init.ts` | Initialization script |

---

## Category 6: Demo & Simulation Scripts (scripts/demo/, scripts/simulation/)

### Demo Scripts

| Script | Purpose |
|--------|---------|
| `profiling-demo.ts` | Demonstrates profiling capabilities |
| `reporting-demonstration.ts` | Shows reporting features |
| `reporting-examples.ts` | Examples of reporting usage |

### Simulation Scripts

| Script | Purpose |
|--------|---------|
| `simulate-full-orchestrator.ts` | Simulates full orchestrator workflow |

---

## Category 7: Analysis & Debug Scripts (scripts/analysis/)

| Script | Purpose |
|--------|---------|
| `analyze-context-awareness.ts` | Analyzes context awareness |
| `analyze-framework-usage.ts` | Analyzes framework usage patterns |
| `context-awareness-report.ts` | Generates context awareness report |

---

## Category 8: Scenario Scripts (scripts/scenarios/)

| Script | Purpose |
|--------|---------|
| `scenario-user-management.ts` | User management scenario |
| `scenario-security-check.ts` | Security check scenario |

---

## Category 9: Validation Scripts (scripts/validation/)

| Script | Purpose |
|--------|---------|
| `validate-reports.ts` | Validates generated reports |

---

## Category 10: Debug Scripts (scripts/debug/)

| Script | Purpose |
|--------|---------|
| `debug-context-enhancement.ts` | Context enhancement debugging |

---

## Category 11: Monitoring Daemon

| Script | Purpose |
|--------|---------|
| `scripts/monitoring/daemon.js` | Background monitoring daemon with start/stop/report commands |

---

## Category 12: Config Utilities

| Script | Purpose |
|--------|---------|
| `scripts/config/utils.js` | Configuration utilities |
| `scripts/build/utils.js` | Build utilities |

---

## Category 13: Archived Scripts (scripts/archived/)

Various obsolete and needs-excluded-folders scripts that are no longer actively used.

---

## Summary Table

| Category | Count | Examples |
|----------|-------|----------|
| CLI Commands | 15 | install, health, analytics, calibrate |
| NPM Scripts (build/test) | 25+ | build, test, lint, typecheck |
| NPM Scripts (analytics) | 3 | analytics:daily, preview, apply |
| NPM Scripts (monitoring) | 3 | monitoring:start/stop/report |
| NPM Scripts (docs) | 4 | docs:sync-readme, changelog |
| NPM Scripts (release) | 8 | release, publish, safe-publish |
| Node Scripts | 25+ | postinstall, version-manager, validate-* |
| Demo/Simulation | 4 | profiling-demo, simulate-* |
| Analysis | 3 | analyze-context-awareness |
| Scenarios | 2 | scenario-user-management |

---

## Command Execution Flow

### Installation Flow
```
npx strray-ai install
  → src/cli/index.ts (install command)
  → scripts/node/postinstall.cjs
  → Creates .opencode/ directory
  → Copies plugins to .opencode/plugin/
  → Configures opencode.json
```

### Analytics Flow
```
npx strray-ai analytics
  → src/cli/index.ts (analytics command)
  → src/analytics/simple-pattern-analyzer.ts
  → Analyzes logs/framework/activity.log
  → Generates insights report
```

### Daily Routing Analysis
```
npm run analytics:daily
  → dist/scripts/analytics/daily-routing-analysis.js
  → Uses RoutingOutcomeTracker
  → Generates performance metrics
  → Can apply refinements with --apply flag
```

### Calibration Flow
```
npx strray-ai calibrate
  → src/cli/index.ts (calibrate command)
  → src/delegation/complexity-calibrator.ts
  → Reads logs/framework/activity.log
  → Calculates weight/threshold adjustments
```

---

## Usage Examples

```bash
# Install and verify
npx strray-ai install
npx strray-ai health

# Check capabilities
npx strray-ai capabilities

# Generate reports
npx strray-ai report -t full-analysis
npx strray-ai report -o report.json

# Analytics and calibration
npx strray-ai analytics -l 500
npx strray-ai calibrate -m 20 --apply

# Diagnostics
npx strray-ai doctor
npx strray-ai fix

# NPM scripts
npm run build
npm run test:quick
npm run lint:fix
npm run analytics:daily
npm run monitoring:start
```
