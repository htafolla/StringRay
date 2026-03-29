# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Conventional Commits](https://www.conventionalcommits.org/).

## [1.15.18] - 2026-03-29

### 🔄 Changes

### 🐛 Bug Fixes
- fix: state persistence path, enforcer blocked logic, console bleed, test fixes, subagent enforcement (#12) (044a0e3)

### 🔧 Maintenance
- chore: rebuild dist after console.* cleanup (07e4a68)

---

## [1.15.17] - 2026-03-29

### 🔄 Changes

### ✨ Features
- feat: decouple StringRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

### 🐛 Bug Fixes
- fix: resolve config-paths.js import failure from .opencode/plugins/ (a365843e9)
- fix: UVM version corruption, delete 42 stub test files (509b5ac39)
- fix: add express dep, version sync, bridge codex dedup, repo cleanup (f9c3dd96d)
- fix: post-merge cleanup — deps, index.ts, pipelines, root artifacts (bcbc31b01)
- fix: merge PR #11 fixes — bugs, security, dead code, version (ef32821f2)
- fix: README version regex to exclude IP addresses (127.0.0) (80967acaa)

### ♻️ Refactoring
- refactor: replace console.* with frameworkLogger across 36 production files (293b51827)

### 🔧 Maintenance
- chore: update performance-baselines.json (8f791388f)
- chore: sync performance baselines (3c1e6f647)
- chore: UVM 1.15.13 (1 ahead of npm) (e3220847c)
- chore: fix package.json version to 1.15.12 (35b158283)
- chore: UVM 1.15.12 (1 ahead of npm) (33ed3793c)
- chore: update test performance baselines (a2ae8e93c)
- chore: version sync to 1.15.11 (92fb03d92)

### 🔎 Other Changes
- release: v1.15.15 (ed0e26699)
- release: v1.15.14 (98df6004c)
- release: v1.15.13 (c055785f3)

---

## [1.15.16] - 2026-03-28

### 🔄 Changes

### ✨ Features
- feat: decouple StringRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

### 🐛 Bug Fixes
- fix: UVM version corruption, delete 42 stub test files (509b5ac39)
- fix: add express dep, version sync, bridge codex dedup, repo cleanup (f9c3dd96d)
- fix: post-merge cleanup — deps, index.ts, pipelines, root artifacts (bcbc31b01)
- fix: merge PR #11 fixes — bugs, security, dead code, version (ef32821f2)
- fix: README version regex to exclude IP addresses (127.0.0) (80967acaa)

### 🔧 Maintenance
- chore: sync performance baselines (3c1e6f647)
- chore: UVM 1.15.13 (1 ahead of npm) (e3220847c)
- chore: fix package.json version to 1.15.12 (35b158283)
- chore: UVM 1.15.12 (1 ahead of npm) (33ed3793c)
- chore: update test performance baselines (a2ae8e93c)
- chore: version sync to 1.15.11 (92fb03d92)

### 🔎 Other Changes
- release: v1.15.15 (ed0e26699)
- release: v1.15.14 (98df6004c)
- release: v1.15.13 (c055785f3)

---

## [undefined] - 2026-03-28

### 🔄 Changes

### ✨ Features
- feat: decouple StringRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

### 🐛 Bug Fixes
- fix: post-merge cleanup — deps, index.ts, pipelines, root artifacts (bcbc31b01)
- fix: merge PR #11 fixes — bugs, security, dead code, version (ef32821f2)
- fix: README version regex to exclude IP addresses (127.0.0) (80967acaa)

### 🔧 Maintenance
- chore: sync performance baselines (3c1e6f647)
- chore: UVM 1.15.13 (1 ahead of npm) (e3220847c)
- chore: fix package.json version to 1.15.12 (35b158283)
- chore: UVM 1.15.12 (1 ahead of npm) (33ed3793c)
- chore: update test performance baselines (a2ae8e93c)
- chore: version sync to 1.15.11 (92fb03d92)

### 🔎 Other Changes
- release: v1.15.14 (98df6004c)
- release: v1.15.13 (c055785f3)

---

## [undefined] - 2026-03-28

### 🔄 Changes

### ✨ Features
- feat: decouple StringRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

### 🐛 Bug Fixes
- fix: post-merge cleanup — deps, index.ts, pipelines, root artifacts (bcbc31b01)
- fix: merge PR #11 fixes — bugs, security, dead code, version (ef32821f2)
- fix: README version regex to exclude IP addresses (127.0.0) (80967acaa)

### 🔧 Maintenance
- chore: UVM 1.15.13 (1 ahead of npm) (e3220847c)
- chore: fix package.json version to 1.15.12 (35b158283)
- chore: UVM 1.15.12 (1 ahead of npm) (33ed3793c)
- chore: update test performance baselines (a2ae8e93c)
- chore: version sync to 1.15.11 (92fb03d92)

---

## [1.15.13] - 2026-03-28

### 🔄 Changes

### ✨ Features
- feat: decouple StringRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

### 🐛 Bug Fixes
- fix: post-merge PR #10 review issues — bugs, security, dead code, version (#11) (ef32821f2)
- fix: README version regex to exclude IP addresses (127.0.0) (80967acaa)

### 🔧 Maintenance
- chore: move @types/* packages to devDependencies, remove unused @types/express
- chore: fix require() in ESM in index.ts — use static import
- chore: UVM 1.15.13 (1 ahead of npm) (e3220847c)
- chore: fix package.json version to 1.15.12 (35b158283)
- chore: UVM 1.15.12 (1 ahead of npm) (33ed3793c)
- chore: update test performance baselines (a2ae8e93c)
- chore: version sync to 1.15.11 (92fb03d92)

---

## [1.15.11] - 2026-03-28

### 🔄 Changes

- Version bump

---

## [1.15.9] - 2026-03-28

### 🔄 Changes

- Version bump

---

## [1.15.8] - 2026-03-28

### 🔄 Changes

- Version bump

---

## [1.15.7] - 2026-03-28

### 🔄 Changes

### ✨ Features
- feat: Hermes plugin v2.1 — git hooks, lifecycle hooks, and strray_hooks tool (#9) (f081d1e40)

---

## [1.15.6] - 2026-03-28

### 🔄 Changes

### ✨ Features
- feat: Hermes Agent plugin v2 with full test coverage and zero TS errors (#8) (562e7d404)
- feat: Hermes plugin v2 — bridge pipeline, file logging, 2359 tests (0 skipped) (#7) (52185dd1a)

### 🐛 Bug Fixes
- fix: add eslint-plugin-vitest dependency for processor test linting (5c16c1eb0)
- fix: eliminate flaky timing assertions in tests (3bf04c3ec)

---

## [undefined] - 2026-03-27

### 🔄 Changes

### ✨ Features
- feat: Hermes Agent integration with MCP servers and standalone mode (b8f39fe25)

### 🐛 Bug Fixes
- fix: update ANTIGRAVITY_INTEGRATION.md path reference to archive (84d417a46)
- fix: update counts (30→44 skills, 2,368→2311 tests) and MCP terminology (7ccafa80a)
- fix: update skill counts from 30 to 44 in README and AGENTS (231fe9c34)
- fix: skip removed routing pipeline test (f1b6240bc)
- fix: implement critical code fixes (aecd2f89c)

### ♻️ Refactoring
- refactor: organize docs, sync agent counts, add Hermes MCP integration (72ba69bcb)
- refactor: Remove deprecated methods from processor-manager.ts (eba1892ff)

### 🔧 Maintenance
- chore: bump UVM to 1.15.1 (891685014)
- chore: v1.15.0 published, bump UVM to 1.15.1 (5aabfef3e)
- chore: Rename StringRayOrchestrator to KernelOrchestrator (089c988ed)
- chore: v1.14.9 published, bump UVM to 1.14.10 (aa0304c98)

### 🔎 Other Changes
- fix(UVM): remove all count patterns - UVM only maintains versions now (17269a331)
- fix(UVM): add pattern for 'X framework skills' count maintenance (61d79768b)

---

## [1.14.7] - 2026-03-26

### 🔄 Changes

add gh repo clone fallback for authenticated users on skill:install

---

## [1.14.6] - 2026-03-26

### 🔄 Changes

fix: use tarball download instead of git clone for skill:install

---

## [1.14.5] - 2026-03-26

### 🔄 Changes

fix: add git:// protocol fallback for skill:install auth failures

---

## [1.14.4] - 2026-03-26

### 🔄 Changes

convert 13 agents to skills, add namespaced community installs, fix post-processor

---

## [1.14.3] - 2026-03-26

### 🔄 Changes

update docs for skills registry, remove stale references

---

## [1.14.2] - 2026-03-26

### 🔄 Changes

consolidate licenses, remove stale artifacts, remove claude-seo from registry

---

## [1.15.0] - 2026-03-24

### 🔄 Changes

### ✨ Features
- feat: Phase 0-1 - one-command installer with OpenCode detection, auto-install, kernel layering
- feat: Phase 1 - Impeccable + OpenViking skill integration with proper Apache 2.0 licensing
- feat: Phase 2 - New CLI commands: publish-agent, antigravity-status, credible-init
- feat: Phase 3 - README polish, version bump to v1.15.0

### 🧪 Tests
- test: CLI install command tests (8 tests)
- test: CLI status command tests (14 tests)
- test: CLI publish-agent command tests (20 tests)
- test: CLI antigravity-status command tests (24 tests)
- test: CLI credible-init command tests (18 tests)
- test: CLI pipeline integration tests (37 tests)

---

## [undefined] - 2026-03-23

### 🔄 Changes

### ✨ Features
- feat: comprehensive docs and refactoring session (e5684c4d)
- feat: register LogProtectionProcessor in ProcessorManager (80224d29)

### 🐛 Bug Fixes
- fix: update processor pipeline tree with all 13 processors (bbdb3b8e)

### ♻️ Refactoring
- refactor: remove unused deprecated stub methods from processor-manager (08518dc8)
- refactor: extract shutdown handler utility and update MCP servers (0ac823f4)
- refactor: remove console.* from core library files (4a3adcaf)

### 📚 Documentation
- docs: add integration research and strategy documents (b1862951)
- docs: add deep reflection on building with AI agents as dev team (098784b5)
- docs: fix processor count and update methodology with completed tasks (d91276a8)
- docs: add deep reflection on pipeline testing journey (7287da64)
- docs: add NO STUBS verification checklist and detailed task list (02ec6e70)
- docs: add agent review findings and pipeline creation rules (af901802)
- docs: add detailed architecture diagrams to pipeline trees (d3ea1d52)
- docs: create pipeline trees and update methodology (4384dd9d)
- docs: add pipeline inventory via researcher agent (9cd7ec2a)
- docs: finalize saga via storyteller agent (db3c9236)
- docs: rewrite saga following narrative template (c037dfe9)
- docs: add deep saga reflection - The Pipeline Paradox (8ff69bae)
- docs: add comprehensive journey chronicle of inference pipeline (7f876f20)
- docs: add deep session reflection on inference pipeline journey (1fd67474)
- docs: add pipeline testing methodology guide (694fbcc8)
- docs: add deep reflection on pipeline testing discovery (7df2a0de)

### 🧪 Tests
- test: add integration tests for processors and MCP knowledge servers (510aea6b)
- test: enhance all pipeline tests with REAL component integration (1b4a45b0)
- test: enhance routing pipeline test with full analytics verification (f7c105fa)
- test: rewrite all pipeline tests following actual pipeline methodology (f1ee35da)
- test: add pipeline tests for all 6 remaining pipelines - 3 passes each (345de878)
- test: add governance pipeline test - 3 consecutive passes (ff9b2d60)

### 🔎 Other Changes
- tests: rewrite pipeline tests to reference their trees (50e3ce7d)

---

## [1.13.5] - 2026-03-20

### 🔄 Changes

### 🐛 Bug Fixes
- fix: empty catch blocks in plugin routing (ea53c946)
- fix: update tests to match new lexicon-based routing (cda659ec)

### 🔧 Maintenance
- chore: remove auto-generated state file (764e93b4)
- chore: remove codex version from plugin comment (4fe126f1)
- chore: remove hardcoded version from plugin file (18ec16b0)
- chore: update version manager to 1.13.2 (f426a681)
- chore: remove auto-generated files from git tracking (105742a7)
- chore: add performance-baselines.json to gitignore (3ea19094)
- chore: update auto-generated state files (86871023)
- chore: update auto-generated files for v1.13.2 (1ac40d7f)
- chore: bump version to 1.13.2 (24bb1343)

### 🔎 Other Changes
- feat(plugin): add experimental.chat.user.before hook for user message routing (fc69242f)
- chore(release): v1.13.3 - Clean plugin versions and sync fixes (f881b44d)
- chore(release): v1.13.2 - Fix plugin distribution and enhance postinstall (8ba831a7)

---

## [1.13.4] - 2026-03-19

### 🔄 Changes

### 🔧 Maintenance
- chore: remove codex version from plugin comment (4fe126f1)
- chore: remove hardcoded version from plugin file (18ec16b0)
- chore: update version manager to 1.13.2 (f426a681)
- chore: remove auto-generated files from git tracking (105742a7)
- chore: add performance-baselines.json to gitignore (3ea19094)
- chore: update auto-generated state files (86871023)
- chore: update auto-generated files for v1.13.2 (1ac40d7f)
- chore: bump version to 1.13.2 (24bb1343)

### 🔎 Other Changes
- feat(plugin): add experimental.chat.user.before hook for user message routing (fc69242f)
- chore(release): v1.13.3 - Clean plugin versions and sync fixes (f881b44d)
- chore(release): v1.13.2 - Fix plugin distribution and enhance postinstall (8ba831a7)

---

## [1.13.3] - 2026-03-19

### 🔄 Changes

### 🔧 Maintenance
- chore: remove codex version from plugin comment (4fe126f1)
- chore: remove hardcoded version from plugin file (18ec16b0)
- chore: update version manager to 1.13.2 (f426a681)
- chore: remove auto-generated files from git tracking (105742a7)
- chore: add performance-baselines.json to gitignore (3ea19094)
- chore: update auto-generated state files (86871023)
- chore: update auto-generated files for v1.13.2 (1ac40d7f)
- chore: bump version to 1.13.2 (24bb1343)

### 🔎 Other Changes
- chore(release): v1.13.2 - Fix plugin distribution and enhance postinstall (8ba831a7)

---

## [1.13.2] - 2026-03-19

### 🔄 Changes

### 🔎 Other Changes
- chore(release): v1.13.2 - Fix plugin distribution and enhance postinstall (8ba831a7)

---

## [1.13.1] - 2026-03-19

### 🔄 Changes

- Version bump

---

## [undefined] - 2026-03-19

### 🔄 Changes

### ✨ Features
- feat: integrate activity logger into post-processor and git hooks (595bbcca)
- feat: add global activity logger with enable/disable switch (c6ee8392)

### 🐛 Bug Fixes
- fix: add direct activity logging to plugin hooks (58c0d679)
- fix: migrate console.* to frameworkLogger + fix plugin hook export format (3edac59a)

### 🧪 Tests
- test: add activity logger tests (35 tests) (43df4662)

### 🔎 Other Changes
- reflections: evening reflection - it works (f55c2a0e)

---

## [1.12.0] - 2026-03-18

### 🔄 Changes

### 🔧 Maintenance
- chore: update performance baselines (b0299654)

---

## [1.11.0] - 2026-03-18

### 🔄 Changes

### ✨ Features
- feat: add documentation sync system with smart triggers (c63fa186)

### 🐛 Bug Fixes
- fix: routing outcomes now saved immediately, orchestrator tracks outcomes (c9922b62)
- fix: activity.log now includes task details, routing-outcomes.json initialized immediately (9e5fc142)
- fix: init.sh priority - node_modules first, source as fallback (d7ca8f49)
- fix: init.sh version detection to show actual version instead of fallback (779c979a)

---

## [1.10.7] - 2026-03-18 (from v1.10.0)

### ✨ Features

- complete processor migration to polymorphic classes (Part 2)|feat: complete processor migration to polymorphic classes (Part 2) (`842b238`)
- extract processor switch to polymorphic classes (Part 1)|feat: extract processor switch to polymorphic classes (Part 1) (`83529b6`)
- add standalone archive-logs CLI command|feat: add standalone archive-logs CLI command (`605d714`)
- enable task routing and add comprehensive analytics logging|feat: enable task routing and add comprehensive analytics logging (`be39379`)
- wire up archiveLogFiles to run before cleanup|feat: wire up archiveLogFiles to run before cleanup (`ff44996`)
- Add Estimation Validator with calibration learning|feat: Add Estimation Validator with calibration learning (`6410607`)
**integration:**
- Add OpenClaw integration with tool event hooks|feat(integration): Add OpenClaw integration with tool event hooks (`0ea5986`)

### 🐛 Bug Fixes

- persist routing outcomes to disk for analytics|fix: persist routing outcomes to disk for analytics (`b63f35f`)
- archive activity.log only after verification, leave intact on failure|fix: archive activity.log only after verification, leave intact on failure (`9234bd6`)
- pre-commit test check in ci-test-env|fix: pre-commit test check in ci-test-env (`4d208ca`)
- pre-commit test check uses correct test command|fix: pre-commit test check uses correct test command (`8d03417`)
- restore eslint config|fix: restore eslint config (`2ee7085`)
- use temp directory for test-consent.json instead of root|fix: use temp directory for test-consent.json instead of root (`66f2943`)
- write test log files to logs/ directory instead of root|fix: write test log files to logs/ directory instead of root (`20a089a`)
- cleanup test files from both root and logs/ folders|fix: cleanup test files from both root and logs/ folders (`c2cc967`)
- update reflection path references to new consolidated location|fix: update reflection path references to new consolidated location (`0d0a8e2`)
- protect critical logs from deletion + move test-activity to logs/|fix: protect critical logs from deletion + move test-activity to logs/ (`a1cd89b`)
- protect all critical logs from cleanup deletion|fix: protect all critical logs from cleanup deletion (`467f377`)
- protect activity.log from deletion in cleanupLogFiles|fix: protect activity.log from deletion in cleanupLogFiles (`317ddac`)
**plugin:**
- Remove debug console.error statements|fix(plugin): Remove debug console.error statements (`b38f784`)
- Enable processors for all tools and improve debugging|fix(plugin): Enable processors for all tools and improve debugging (`ffb4b64`)

### 📚 Documentation

- add deep reflection on processor architecture refactoring|docs: add deep reflection on processor architecture refactoring (`9be3fac`)
- add OpenClaw integration section and project structure to README|docs: add OpenClaw integration section and project structure to README (`0b5e3d8`)
- Add comprehensive architecture analysis|docs: Add comprehensive architecture analysis (`1649873`)
- Add Estimation Validator demo documentation|docs: Add Estimation Validator demo documentation (`2bdc3e8`)
- Add deep saga reflection 'The Refactorer's Odyssey'|docs: Add deep saga reflection 'The Refactorer's Odyssey' (`7a834b7`)
### ♻️ Code Refactoring

- extract quality gates to dedicated module|refactor: extract quality gates to dedicated module (`aace35e`)
- flush dead plugin system, add routing for all 25 agents|refactor: flush dead plugin system, add routing for all 25 agents (`a9efc7c`)
- organize temp folders and configs|refactor: organize temp folders and configs (`265565c`)
- organize report and config files to proper locations|refactor: organize report and config files to proper locations (`d82d23f`)
- consolidate all reflection files into docs/reflections/|refactor: consolidate all reflection files into docs/reflections/ (`e8ea22a`)
- Consolidate complexity analyzers (Technical Debt #1)|refactor: Consolidate complexity analyzers (Technical Debt #1) (`dcfeadc`)
- Split orchestrator.server.ts into modular structure|refactor: Split orchestrator.server.ts into modular structure (`1fc54dc`)
**plugin:**
- Add TaskSkillRouter integration scaffolding|refactor(plugin): Add TaskSkillRouter integration scaffolding (`d60c28c`)

### 🧪 Tests

- add processor architecture validation script|test: add processor architecture validation script (`819450e`)
### 🔧 Chores

- add var/ to gitignore|chore: add var/ to gitignore (`a358315`)
- add test log files to .gitignore|chore: add test log files to .gitignore (`effa3b4`)
- Update scripts to use consolidated complexity analyzer API|chore: Update scripts to use consolidated complexity analyzer API (`de5bea4`)
- Remove dead code - secure-authentication-system|chore: Remove dead code - secure-authentication-system (`589cb8e`)
- Sync version to 1.10.0 across all files|chore: Sync version to 1.10.0 across all files (`26f5ec3`)
- Update auto-generated state and performance baselines|chore: Update auto-generated state and performance baselines (`75345d4`)
- Bump version to 1.10.0|chore: Bump version to 1.10.0 (`4497035`)
---

*Generated by `scripts/node/generate-changelog.js`*
