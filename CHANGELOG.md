# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Conventional Commits](https://www.conventionalcommits.org/).

## [1.22.69] - 2026-06-03

### 🔄 Changes

### 🐛 Bug Fixes
- fix: align governance client field names with Dynamo response (solarResonance -> solarIsotopicResonance, relax evaluate validation) (e5ecea0e7)
- fix: update tests for new resolveFrameworkPaths behavior + deflake inference-e2e (470210930)

### 📚 Documentation
- docs: add reflection on the Aside subcontext pattern and its architectural implications (96b772d98)
- docs: add aside on the growth arc and realization of 0xRay's deeper architecture (775088744)
- docs: add 0xRay three-subsystem architecture vision reflection (0694f92f5)
- docs: add deep journey reflection on Grok CLI MCP stability and publish pipeline fixes (cba8b872a)
- docs: add deep journey reflection on double-dist fix and Dynamo governance pipeline (c297183d8)

### 🔎 Other Changes
- v1.22.69: Trinitarium Moral Overlay — governance moral tension scoring (e0b9cc1d5)
- v1.22.68: multi-platform install commands, postinstall refactor, README rebuild (3ca8ec97e)

---

## [1.22.61] - 2026-05-19

### 🔄 Changes

### ✨ Features
- feat: Make Grok CLI a first-class citizen with full plugin + working governance hooks (#91) (635ff55d3)
- feat: wire govern_with_solar as the primary governance endpoint (72263a12c)
- feat: enable spawn gate monitoring mode + release reflection doc (5746fa8fc)
- feat: enable inference_governance + solar enhancement for monitoring (b4d782fa2)
- feat: wire govern_with_solar tool — real-time NOAA solar context into governance decisions (4ba49d56f)
- feat: integrate chrono-warp-drive governance MCP for inference checking (a61cd6f02)
- feat: add auto-rotation to activity logger at 5MB threshold (ee6a4da4c)
- feat: wire 3 orphaned features + add tests + remove empty api-gateway (077b8dc33)
- feat: wire apply phase via MCP routing + fix e2e tests (41/41 PASS) (db8abef39)
- feat: wire apply phase for real code changes instead of markdown markers (f1903187f)
- feat: add centralized TraceContext + integrate Reflection Governance with ValidatorRegistry (1a79c8818)
- feat: implement governance-approved stagger + trace propagation, add reflection governance pipeline (27d6e29e3)
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: robust entry-point detection for Grok stdio MCP startup — use fileURLToPath + path.resolve (9b3b42f79)
- fix: resolve tsc errors, duplicate KEEP, vortexVolume default, and consumer runner pack capture (f480905e4)
- fix: replace console.log with frameworkLogger in governance-client; propagate SolarGovernanceVoteResult through inference cycle (d1537bfae)
- fix: increase opencode spawn timeout from 60s to 300s to prevent premature timeouts during agent voting (31f0fe679)
- fix: initialize external governance in inference:run CLI command for two-oscillator governance (c187e0488)
- fix: two-oscillator governance — trust endpoint decision, remove local confidence override (caa444f98)
- fix: singleton + state management to prevent recursive agent spawning (2b2a018e5)
- fix: add centralized OpenCode spawn gate to prevent all recursive agent spawning (b8ff0e7d8)
- fix: disable auto-spawning of opencode agents to prevent runaway processes (294870376)
- fix: remove unused imports and any type from processor-manager.interfaces.test.ts (processor-test-rules ESLint) (529d3d228)
- fix: address all open bugs (#29-32, #34) and prevent noise PRs from inference cycle (c32d711c3)
- fix: remove enforcer references from integration test, add fetch-depth:0 for e2e git tests (deb49f4dd)
- fix: triage and fix all GitHub workflow pipelines (097b48c7c)
- fix: restore package.json, mcp-install.ts, workflows, and govern-reflection.mjs gutted by 84dae31b1 (7417fd63c)
- fix: add npm audit fix to main CI workflow (84dae31b1)
- fix: run npm audit fix to resolve moderate vulnerabilities (314cc0619)
- fix: remove duplicate case undefined in mcp-install.ts (lint error) (9b713b93e)
- fix: make trace-context more robust + fix ESM issues in govern-reflection (e665442f4)
- fix: agent registry cleanup — remove skill-only entries, delete deprecated agents (1cafc3a68)
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### ♻️ Refactoring
- refactor: complete governance client refactor — callTool proxy, evaluateGovernance route, remove dead code (770a131cf)
- refactor: use confidenceAdjustment numeric threshold instead of solarActivityLevel string for recommendation logic (470556aa3)

### 📚 Documentation
- docs: add deep reflection on Grok CLI first-class integration journey (2026-05-19) (1651246c0)
- docs: add apply phase design — real code changes via MCP routing (8eab05057)
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 👷 CI/CD
- ci: improve ci-cd-monitor.yml - better error handling + governance integration (a095f1701)
- ci: improve all workflows - add caching, coverage, security hardening, and new governance test step (05a8c08d4)

### 🔧 Maintenance
- chore: sync config files to v1.22.56, add inference_governance feature block (1584fd1a9)
- chore: update strray-ai to v1.22.55, add vote scripts and reflection (13280fd4c)
- chore: trigger ci-cd-monitor with force_fix=true (b36970ff1)
- chore: trigger monitoring script (0dddd302d)
- chore: UVM sync v1.22.52 — all version references updated (ce3b70eba)
- chore: UVM sync to v1.22.51 (b53a5ac10)
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

### ⏪ Reverts
- revert: roll back apply phase marker system — needs real agent invocation via plugin/MCP routing (10309b23a)

---

## [1.22.60] - 2026-05-19

### 🔄 Changes

### ✨ Features
- feat: Make Grok CLI a first-class citizen with full plugin + working governance hooks (#91) (635ff55d3)
- feat: wire govern_with_solar as the primary governance endpoint (72263a12c)
- feat: enable spawn gate monitoring mode + release reflection doc (5746fa8fc)
- feat: enable inference_governance + solar enhancement for monitoring (b4d782fa2)
- feat: wire govern_with_solar tool — real-time NOAA solar context into governance decisions (4ba49d56f)
- feat: integrate chrono-warp-drive governance MCP for inference checking (a61cd6f02)
- feat: add auto-rotation to activity logger at 5MB threshold (ee6a4da4c)
- feat: wire 3 orphaned features + add tests + remove empty api-gateway (077b8dc33)
- feat: wire apply phase via MCP routing + fix e2e tests (41/41 PASS) (db8abef39)
- feat: wire apply phase for real code changes instead of markdown markers (f1903187f)
- feat: add centralized TraceContext + integrate Reflection Governance with ValidatorRegistry (1a79c8818)
- feat: implement governance-approved stagger + trace propagation, add reflection governance pipeline (27d6e29e3)
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: resolve tsc errors, duplicate KEEP, vortexVolume default, and consumer runner pack capture (f480905e4)
- fix: replace console.log with frameworkLogger in governance-client; propagate SolarGovernanceVoteResult through inference cycle (d1537bfae)
- fix: increase opencode spawn timeout from 60s to 300s to prevent premature timeouts during agent voting (31f0fe679)
- fix: initialize external governance in inference:run CLI command for two-oscillator governance (c187e0488)
- fix: two-oscillator governance — trust endpoint decision, remove local confidence override (caa444f98)
- fix: singleton + state management to prevent recursive agent spawning (2b2a018e5)
- fix: add centralized OpenCode spawn gate to prevent all recursive agent spawning (b8ff0e7d8)
- fix: disable auto-spawning of opencode agents to prevent runaway processes (294870376)
- fix: remove unused imports and any type from processor-manager.interfaces.test.ts (processor-test-rules ESLint) (529d3d228)
- fix: address all open bugs (#29-32, #34) and prevent noise PRs from inference cycle (c32d711c3)
- fix: remove enforcer references from integration test, add fetch-depth:0 for e2e git tests (deb49f4dd)
- fix: triage and fix all GitHub workflow pipelines (097b48c7c)
- fix: restore package.json, mcp-install.ts, workflows, and govern-reflection.mjs gutted by 84dae31b1 (7417fd63c)
- fix: add npm audit fix to main CI workflow (84dae31b1)
- fix: run npm audit fix to resolve moderate vulnerabilities (314cc0619)
- fix: remove duplicate case undefined in mcp-install.ts (lint error) (9b713b93e)
- fix: make trace-context more robust + fix ESM issues in govern-reflection (e665442f4)
- fix: agent registry cleanup — remove skill-only entries, delete deprecated agents (1cafc3a68)
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### ♻️ Refactoring
- refactor: complete governance client refactor — callTool proxy, evaluateGovernance route, remove dead code (770a131cf)
- refactor: use confidenceAdjustment numeric threshold instead of solarActivityLevel string for recommendation logic (470556aa3)

### 📚 Documentation
- docs: add apply phase design — real code changes via MCP routing (8eab05057)
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 👷 CI/CD
- ci: improve ci-cd-monitor.yml - better error handling + governance integration (a095f1701)
- ci: improve all workflows - add caching, coverage, security hardening, and new governance test step (05a8c08d4)

### 🔧 Maintenance
- chore: sync config files to v1.22.56, add inference_governance feature block (1584fd1a9)
- chore: update strray-ai to v1.22.55, add vote scripts and reflection (13280fd4c)
- chore: trigger ci-cd-monitor with force_fix=true (b36970ff1)
- chore: trigger monitoring script (0dddd302d)
- chore: UVM sync v1.22.52 — all version references updated (ce3b70eba)
- chore: UVM sync to v1.22.51 (b53a5ac10)
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

### ⏪ Reverts
- revert: roll back apply phase marker system — needs real agent invocation via plugin/MCP routing (10309b23a)

---

## [1.22.59] - 2026-05-11

### 🔄 Changes

### ✨ Features
- feat: integrate chrono-warp-drive governance MCP for inference checking (a61cd6f02)
- feat: add auto-rotation to activity logger at 5MB threshold (ee6a4da4c)
- feat: wire 3 orphaned features + add tests + remove empty api-gateway (077b8dc33)
- feat: wire apply phase via MCP routing + fix e2e tests (41/41 PASS) (db8abef39)
- feat: wire apply phase for real code changes instead of markdown markers (f1903187f)
- feat: add centralized TraceContext + integrate Reflection Governance with ValidatorRegistry (1a79c8818)
- feat: implement governance-approved stagger + trace propagation, add reflection governance pipeline (27d6e29e3)
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: disable auto-spawning of opencode agents to prevent runaway processes (294870376)
- fix: remove unused imports and any type from processor-manager.interfaces.test.ts (processor-test-rules ESLint) (529d3d228)
- fix: address all open bugs (#29-32, #34) and prevent noise PRs from inference cycle (c32d711c3)
- fix: remove enforcer references from integration test, add fetch-depth:0 for e2e git tests (deb49f4dd)
- fix: triage and fix all GitHub workflow pipelines (097b48c7c)
- fix: restore package.json, mcp-install.ts, workflows, and govern-reflection.mjs gutted by 84dae31b1 (7417fd63c)
- fix: add npm audit fix to main CI workflow (84dae31b1)
- fix: run npm audit fix to resolve moderate vulnerabilities (314cc0619)
- fix: remove duplicate case undefined in mcp-install.ts (lint error) (9b713b93e)
- fix: make trace-context more robust + fix ESM issues in govern-reflection (e665442f4)
- fix: agent registry cleanup — remove skill-only entries, delete deprecated agents (1cafc3a68)
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### 📚 Documentation
- docs: add apply phase design — real code changes via MCP routing (8eab05057)
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 👷 CI/CD
- ci: improve ci-cd-monitor.yml - better error handling + governance integration (a095f1701)
- ci: improve all workflows - add caching, coverage, security hardening, and new governance test step (05a8c08d4)

### 🔧 Maintenance
- chore: sync config files to v1.22.56, add inference_governance feature block (1584fd1a9)
- chore: update strray-ai to v1.22.55, add vote scripts and reflection (13280fd4c)
- chore: trigger ci-cd-monitor with force_fix=true (b36970ff1)
- chore: trigger monitoring script (0dddd302d)
- chore: UVM sync v1.22.52 — all version references updated (ce3b70eba)
- chore: UVM sync to v1.22.51 (b53a5ac10)
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

### ⏪ Reverts
- revert: roll back apply phase marker system — needs real agent invocation via plugin/MCP routing (10309b23a)

---

## [1.22.58] - 2026-05-11

### 🔄 Changes

### ✨ Features
- feat: integrate chrono-warp-drive governance MCP for inference checking (a61cd6f02)
- feat: add auto-rotation to activity logger at 5MB threshold (ee6a4da4c)
- feat: wire 3 orphaned features + add tests + remove empty api-gateway (077b8dc33)
- feat: wire apply phase via MCP routing + fix e2e tests (41/41 PASS) (db8abef39)
- feat: wire apply phase for real code changes instead of markdown markers (f1903187f)
- feat: add centralized TraceContext + integrate Reflection Governance with ValidatorRegistry (1a79c8818)
- feat: implement governance-approved stagger + trace propagation, add reflection governance pipeline (27d6e29e3)
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: remove unused imports and any type from processor-manager.interfaces.test.ts (processor-test-rules ESLint) (529d3d228)
- fix: address all open bugs (#29-32, #34) and prevent noise PRs from inference cycle (c32d711c3)
- fix: remove enforcer references from integration test, add fetch-depth:0 for e2e git tests (deb49f4dd)
- fix: triage and fix all GitHub workflow pipelines (097b48c7c)
- fix: restore package.json, mcp-install.ts, workflows, and govern-reflection.mjs gutted by 84dae31b1 (7417fd63c)
- fix: add npm audit fix to main CI workflow (84dae31b1)
- fix: run npm audit fix to resolve moderate vulnerabilities (314cc0619)
- fix: remove duplicate case undefined in mcp-install.ts (lint error) (9b713b93e)
- fix: make trace-context more robust + fix ESM issues in govern-reflection (e665442f4)
- fix: agent registry cleanup — remove skill-only entries, delete deprecated agents (1cafc3a68)
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### 📚 Documentation
- docs: add apply phase design — real code changes via MCP routing (8eab05057)
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 👷 CI/CD
- ci: improve ci-cd-monitor.yml - better error handling + governance integration (a095f1701)
- ci: improve all workflows - add caching, coverage, security hardening, and new governance test step (05a8c08d4)

### 🔧 Maintenance
- chore: sync config files to v1.22.56, add inference_governance feature block (1584fd1a9)
- chore: update strray-ai to v1.22.55, add vote scripts and reflection (13280fd4c)
- chore: trigger ci-cd-monitor with force_fix=true (b36970ff1)
- chore: trigger monitoring script (0dddd302d)
- chore: UVM sync v1.22.52 — all version references updated (ce3b70eba)
- chore: UVM sync to v1.22.51 (b53a5ac10)
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

### ⏪ Reverts
- revert: roll back apply phase marker system — needs real agent invocation via plugin/MCP routing (10309b23a)

---

## [1.22.57] - 2026-05-11

### 🔄 Changes

### ✨ Features
- feat: integrate chrono-warp-drive governance MCP for inference checking (a61cd6f02)
- feat: add auto-rotation to activity logger at 5MB threshold (ee6a4da4c)
- feat: wire 3 orphaned features + add tests + remove empty api-gateway (077b8dc33)
- feat: wire apply phase via MCP routing + fix e2e tests (41/41 PASS) (db8abef39)
- feat: wire apply phase for real code changes instead of markdown markers (f1903187f)
- feat: add centralized TraceContext + integrate Reflection Governance with ValidatorRegistry (1a79c8818)
- feat: implement governance-approved stagger + trace propagation, add reflection governance pipeline (27d6e29e3)
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: remove unused imports and any type from processor-manager.interfaces.test.ts (processor-test-rules ESLint) (529d3d228)
- fix: address all open bugs (#29-32, #34) and prevent noise PRs from inference cycle (c32d711c3)
- fix: remove enforcer references from integration test, add fetch-depth:0 for e2e git tests (deb49f4dd)
- fix: triage and fix all GitHub workflow pipelines (097b48c7c)
- fix: restore package.json, mcp-install.ts, workflows, and govern-reflection.mjs gutted by 84dae31b1 (7417fd63c)
- fix: add npm audit fix to main CI workflow (84dae31b1)
- fix: run npm audit fix to resolve moderate vulnerabilities (314cc0619)
- fix: remove duplicate case undefined in mcp-install.ts (lint error) (9b713b93e)
- fix: make trace-context more robust + fix ESM issues in govern-reflection (e665442f4)
- fix: agent registry cleanup — remove skill-only entries, delete deprecated agents (1cafc3a68)
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### 📚 Documentation
- docs: add apply phase design — real code changes via MCP routing (8eab05057)
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 👷 CI/CD
- ci: improve ci-cd-monitor.yml - better error handling + governance integration (a095f1701)
- ci: improve all workflows - add caching, coverage, security hardening, and new governance test step (05a8c08d4)

### 🔧 Maintenance
- chore: update strray-ai to v1.22.55, add vote scripts and reflection (13280fd4c)
- chore: trigger ci-cd-monitor with force_fix=true (b36970ff1)
- chore: trigger monitoring script (0dddd302d)
- chore: UVM sync v1.22.52 — all version references updated (ce3b70eba)
- chore: UVM sync to v1.22.51 (b53a5ac10)
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

### ⏪ Reverts
- revert: roll back apply phase marker system — needs real agent invocation via plugin/MCP routing (10309b23a)

### 🔎 Other Changes
- Address: Bug: fix: increase timeout for processor auto-discovery tests to prevent flak... (112x) (02d8fa97f)
- v1.22.55 (c34376720)
- v1.22.53 (6ddf31de5)
- v1.22.51 (3d96823ff)

---

## [1.22.56] - 2026-05-11

### 🔄 Changes

### ✨ Features
- feat: integrate chrono-warp-drive governance MCP for inference checking (a61cd6f02)
- feat: add auto-rotation to activity logger at 5MB threshold (ee6a4da4c)
- feat: wire 3 orphaned features + add tests + remove empty api-gateway (077b8dc33)
- feat: wire apply phase via MCP routing + fix e2e tests (41/41 PASS) (db8abef39)
- feat: wire apply phase for real code changes instead of markdown markers (f1903187f)
- feat: add centralized TraceContext + integrate Reflection Governance with ValidatorRegistry (1a79c8818)
- feat: implement governance-approved stagger + trace propagation, add reflection governance pipeline (27d6e29e3)
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: remove unused imports and any type from processor-manager.interfaces.test.ts (processor-test-rules ESLint) (529d3d228)
- fix: address all open bugs (#29-32, #34) and prevent noise PRs from inference cycle (c32d711c3)
- fix: remove enforcer references from integration test, add fetch-depth:0 for e2e git tests (deb49f4dd)
- fix: triage and fix all GitHub workflow pipelines (097b48c7c)
- fix: restore package.json, mcp-install.ts, workflows, and govern-reflection.mjs gutted by 84dae31b1 (7417fd63c)
- fix: add npm audit fix to main CI workflow (84dae31b1)
- fix: run npm audit fix to resolve moderate vulnerabilities (314cc0619)
- fix: remove duplicate case undefined in mcp-install.ts (lint error) (9b713b93e)
- fix: make trace-context more robust + fix ESM issues in govern-reflection (e665442f4)
- fix: agent registry cleanup — remove skill-only entries, delete deprecated agents (1cafc3a68)
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### 📚 Documentation
- docs: add apply phase design — real code changes via MCP routing (8eab05057)
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 👷 CI/CD
- ci: improve ci-cd-monitor.yml - better error handling + governance integration (a095f1701)
- ci: improve all workflows - add caching, coverage, security hardening, and new governance test step (05a8c08d4)

### 🔧 Maintenance
- chore: update strray-ai to v1.22.55, add vote scripts and reflection (13280fd4c)
- chore: trigger ci-cd-monitor with force_fix=true (b36970ff1)
- chore: trigger monitoring script (0dddd302d)
- chore: UVM sync v1.22.52 — all version references updated (ce3b70eba)
- chore: UVM sync to v1.22.51 (b53a5ac10)
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

### ⏪ Reverts
- revert: roll back apply phase marker system — needs real agent invocation via plugin/MCP routing (10309b23a)

### 🔎 Other Changes
- Address: Bug: fix: increase timeout for processor auto-discovery tests to prevent flak... (112x) (02d8fa97f)
- v1.22.55 (c34376720)
- v1.22.53 (6ddf31de5)
- v1.22.51 (3d96823ff)

---

## [1.22.55] - 2026-05-08

### 🔄 Changes

### ✨ Features
- feat: wire 3 orphaned features + add tests + remove empty api-gateway (077b8dc33)
- feat: wire apply phase via MCP routing + fix e2e tests (41/41 PASS) (db8abef39)
- feat: wire apply phase for real code changes instead of markdown markers (f1903187f)
- feat: add centralized TraceContext + integrate Reflection Governance with ValidatorRegistry (1a79c8818)
- feat: implement governance-approved stagger + trace propagation, add reflection governance pipeline (27d6e29e3)
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: remove unused imports and any type from processor-manager.interfaces.test.ts (processor-test-rules ESLint) (529d3d228)
- fix: address all open bugs (#29-32, #34) and prevent noise PRs from inference cycle (c32d711c3)
- fix: remove enforcer references from integration test, add fetch-depth:0 for e2e git tests (deb49f4dd)
- fix: triage and fix all GitHub workflow pipelines (097b48c7c)
- fix: restore package.json, mcp-install.ts, workflows, and govern-reflection.mjs gutted by 84dae31b1 (7417fd63c)
- fix: add npm audit fix to main CI workflow (84dae31b1)
- fix: run npm audit fix to resolve moderate vulnerabilities (314cc0619)
- fix: remove duplicate case undefined in mcp-install.ts (lint error) (9b713b93e)
- fix: make trace-context more robust + fix ESM issues in govern-reflection (e665442f4)
- fix: agent registry cleanup — remove skill-only entries, delete deprecated agents (1cafc3a68)
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### 📚 Documentation
- docs: add apply phase design — real code changes via MCP routing (8eab05057)
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 👷 CI/CD
- ci: improve ci-cd-monitor.yml - better error handling + governance integration (a095f1701)
- ci: improve all workflows - add caching, coverage, security hardening, and new governance test step (05a8c08d4)

### 🔧 Maintenance
- chore: trigger ci-cd-monitor with force_fix=true (b36970ff1)
- chore: trigger monitoring script (0dddd302d)
- chore: UVM sync v1.22.52 — all version references updated (ce3b70eba)
- chore: UVM sync to v1.22.51 (b53a5ac10)
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

### ⏪ Reverts
- revert: roll back apply phase marker system — needs real agent invocation via plugin/MCP routing (10309b23a)

### 🔎 Other Changes
- v1.22.53 (6ddf31de5)
- v1.22.51 (3d96823ff)

---

## [1.22.53] - 2026-05-06

### 🔄 Changes

### ✨ Features
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: agent registry cleanup — remove skill-only entries, delete deprecated agents (1cafc3a68)
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### 📚 Documentation
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 🔧 Maintenance
- chore: UVM sync v1.22.52 — all version references updated (ce3b70eba)
- chore: UVM sync to v1.22.51 (b53a5ac10)
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

### 🔎 Other Changes
- v1.22.51 (3d96823ff)

---

## [1.22.52] - 2026-05-06

### 🔄 Changes

### ✨ Features
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: agent registry cleanup — remove skill-only entries, delete deprecated agents (1cafc3a68)
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### 📚 Documentation
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 🔧 Maintenance
- chore: UVM sync to v1.22.51 (b53a5ac10)
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

### 🔎 Other Changes
- v1.22.51 (3d96823ff)

---

## [1.22.51] - 2026-05-06

### 🔄 Changes

### ✨ Features
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: agent registry cleanup — remove skill-only entries, delete deprecated agents (1cafc3a68)
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### 📚 Documentation
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 🔧 Maintenance
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

---

## [1.22.50] - 2026-05-06

### 🔄 Changes

### ✨ Features
- feat: wire apply phase + researcher double-check for PRs (7bfa4ca6e)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (fca44e6ef)
- feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator (191536d9f)
- feat: lower inference thresholds to trigger on real data, keep raw problem text (c7c09a4d7)
- feat: production-ready inference governance — CLI, real agents, DI, learning loop (501eb8d65)
- feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier (5963ce170)

### 🐛 Bug Fixes
- fix: agent export naming + single-architect governance (b5c6100ec)
- fix: complete inference-cycle.ts — all fixes applied. (cef1ecd12)
- fix: guard inference:run for StringRay internal use only (beefefb94)
- fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling (40ae8ae4f)
- fix: increase timeout for processor auto-discovery tests to prevent flaky failures (baae75541)
- fix: inference processor double-joining absolute path created bogus Users/ dir (a795635f9)

### 📚 Documentation
- docs: deep reflection — inference apply phase journey (honest assessment) (1a05086af)
- docs: governance unification saga — deep reflection on wiring four systems into one loop (9cd5b8bc1)
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 🔧 Maintenance
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

---

## [1.22.49] - 2026-04-29

### 🔄 Changes

### 📚 Documentation
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 🔧 Maintenance
- chore: v1.22.48, add prepublishOnly to strip source maps and declarations (112ef8977)
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

---

## [1.22.48] - 2026-04-29

### 🔄 Changes

### 📚 Documentation
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 🔧 Maintenance
- chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package (e2f722523)
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

---

## [1.22.47] - 2026-04-29

### 🔄 Changes

### 📚 Documentation
- docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection (522c28b9a)

### 🔧 Maintenance
- chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore (22f9ddfd9)
- chore: rebuild dist after path fix (4453c41c7)

---

## [1.22.44] - 2026-04-29

### 🔄 Changes

### ✨ Features
- feat: fortress build — 96 processor tests, DI auto-discovery, DocWriteGuard, structural inference, processor consolidation (6fc30f8ca)

### 🐛 Bug Fixes
- fix: remove circular self-dep, delete 375 lines dead code, append-only docs, version sync script, upgrade stubs (69ce59696)

### 📚 Documentation
- docs: deep reflection — the day 0xray learned to talk (5400 words) (75e1a9389)

### 🔧 Maintenance
- chore: sync .strray (1b32155c2)
- chore: rebuild dist v1.22.37 (4d1035b7a)
- chore: update activity logs and test results (dcb5bf018)

---

## [1.22.43] - 2026-04-29

### 🔄 Changes

### 🔧 Maintenance
- chore: sync .strray (1b32155c2)
- chore: rebuild dist v1.22.37 (4d1035b7a)
- chore: update activity logs and test results (dcb5bf018)

---

## [1.22.42] - 2026-04-29

### 🔄 Changes

### 🔧 Maintenance
- chore: sync .strray (1b32155c2)
- chore: rebuild dist v1.22.37 (4d1035b7a)
- chore: update activity logs and test results (dcb5bf018)

---

## [1.22.41] - 2026-04-29

### 🔄 Changes

### 🔧 Maintenance
- chore: sync .strray (1b32155c2)
- chore: rebuild dist v1.22.37 (4d1035b7a)
- chore: update activity logs and test results (dcb5bf018)

---

## [1.22.40] - 2026-04-29

### 🔄 Changes

### 🔧 Maintenance
- chore: sync .strray (1b32155c2)
- chore: rebuild dist v1.22.37 (4d1035b7a)
- chore: update activity logs and test results (dcb5bf018)

---

## [1.22.39] - 2026-04-29

### 🔄 Changes

### 🔧 Maintenance
- chore: sync .strray (1b32155c2)
- chore: rebuild dist v1.22.37 (4d1035b7a)
- chore: update activity logs and test results (dcb5bf018)

---

## [1.22.38] - 2026-04-29

### 🔄 Changes

### 🔧 Maintenance
- chore: rebuild dist v1.22.37 (4d1035b7a)
- chore: update activity logs and test results (dcb5bf018)

---

## [1.22.37] - 2026-04-29

### 🔄 Changes

### 🔧 Maintenance
- chore: update activity logs and test results (dcb5bf018)

### 🔎 Other Changes
- v1.22.36: processor extraction complete, dist rebuilt (d27069c05)
- v1.22.35: rebuild dist, version sync (615b16d0b)
- v1.22.34: extract 24 inline execute methods from processor-manager into standalone BaseProcessor files (1836→823 lines) (ce3893a40)
- v1.22.32: sync version for next development cycle (b90315d47)
- v1.22.31: processor registry pattern, auto-reflection generation, report formatter fixes, 36 new tests (2569 total) (2d71dbf67)

---

## [1.22.36] - 2026-04-29

### 🔄 Changes

### 🔧 Maintenance
- chore: update activity logs and test results (dcb5bf018)

### 🔎 Other Changes
- v1.22.35: rebuild dist, version sync (615b16d0b)
- v1.22.34: extract 24 inline execute methods from processor-manager into standalone BaseProcessor files (1836→823 lines) (ce3893a40)
- v1.22.32: sync version for next development cycle (b90315d47)
- v1.22.31: processor registry pattern, auto-reflection generation, report formatter fixes, 36 new tests (2569 total) (2d71dbf67)

---

## [1.22.35] - 2026-04-29

### 🔄 Changes

### 🔧 Maintenance
- chore: update activity logs and test results (dcb5bf018)

### 🔎 Other Changes
- v1.22.34: extract 24 inline execute methods from processor-manager into standalone BaseProcessor files (1836→823 lines) (ce3893a40)
- v1.22.32: sync version for next development cycle (b90315d47)
- v1.22.31: processor registry pattern, auto-reflection generation, report formatter fixes, 36 new tests (2569 total) (2d71dbf67)

---

## [1.22.34] - 2026-04-29

### 🔄 Changes

### 🔧 Maintenance
- chore: update activity logs and test results (dcb5bf018)

### 🔎 Other Changes
- v1.22.32: sync version for next development cycle (b90315d47)
- v1.22.31: processor registry pattern, auto-reflection generation, report formatter fixes, 36 new tests (2569 total) (2d71dbf67)

---

## [1.22.33] - 2026-04-28

### 🔄 Changes

### 🔧 Maintenance
- chore: update activity logs and test results (dcb5bf018)

### 🔎 Other Changes
- v1.22.32: sync version for next development cycle (b90315d47)
- v1.22.31: processor registry pattern, auto-reflection generation, report formatter fixes, 36 new tests (2569 total) (2d71dbf67)

---

## [1.22.32] - 2026-04-28

### 🔄 Changes

### 🔧 Maintenance
- chore: update activity logs and test results (dcb5bf018)

### 🔎 Other Changes
- v1.22.31: processor registry pattern, auto-reflection generation, report formatter fixes, 36 new tests (2569 total) (2d71dbf67)

---

## [1.22.31] - 2026-04-28

### 🔄 Changes

### 🔧 Maintenance
- chore: update activity logs and test results (dcb5bf018)

---

## [1.22.30] - 2026-04-28

### 🔄 Changes

### 🔧 Maintenance
- chore: update activity logs and test results (dcb5bf018)

---

## [1.22.25] - 2026-04-28

### 🔄 Changes

### 🔎 Other Changes
- release: v1.22.24 - OpenClaw compilation fix (f3cd8ccee)
- release: v1.22.23 (7c512366b)
- release: v1.22.22 - OpenClaw TypeScript compilation fix, integration test scripts (3bcbb8969)

---

## [1.22.24] - 2026-04-27

### 🔄 Changes

### 🔎 Other Changes
- release: v1.22.23 (7c512366b)
- release: v1.22.22 - OpenClaw TypeScript compilation fix, integration test scripts (3bcbb8969)

---

## [1.22.23] - 2026-04-27

### 🔄 Changes

### 🔎 Other Changes
- release: v1.22.22 - OpenClaw TypeScript compilation fix, integration test scripts (3bcbb8969)

---

## [1.22.22] - 2026-04-27

### 🔄 Changes

- Version bump

---

## [1.22.20] - 2026-04-27

### 🔄 Changes

- Version bump

---

## [1.22.19] - 2026-04-27

### 🔄 Changes

- Version bump

---

## [1.22.18] - 2026-04-27

### 🔄 Changes

### 🐛 Bug Fixes
- fix: add validate script and hooks to dist/scripts, include mcps registry in build (fc059458e)
- fix: add mcps directory to build, fix MCP registry path resolution (c17ca67e9)

---

## [1.22.18] - 2026-04-27

### 🔄 Changes

### 🐛 Bug Fixes
- fix: add mcps directory to build, fix MCP registry path resolution (c17ca67e9)

---

## [1.22.17] - 2026-04-27

### 🔄 Changes

- Version bump

---

## [1.22.16] - 2026-04-27

### 🔄 Changes

- Version bump

---

## [1.22.15] - 2026-04-27

### 🔄 Changes

### ✨ Features
- feat: add Nudge Watchdog for stuck AI pattern detection (f923265a1)
- feat: add community MCP registry and mcp:install command (d0f45a86b)
- feat: comprehensive validation + context-aware reflection hook (194a0e6e9)

### 🐛 Bug Fixes
- fix: opencode.json now replaces 0xRay agents, keeps other settings (d9a969423)
- fix: add smart merge for opencode.json on npm install (0f73ead02)

### 📚 Documentation
- docs: update MCP commands with setup instructions (2b362d390)
- docs: remove duplicate sections from system-design (b548bdf4d)
- docs: consolidate duplicate 'What is 0xRay' sections (4afb17c32)
- docs: add honest 'what is 0xRay' assessment (00c1fd4a8)
- docs: add honest differentiation section to system-design (174afe0b3)
- docs: update system-design with full diagram v1.22.14 (7ea1d3598)

### 🔧 Maintenance
- chore: add mcp commands to CLI (3db119fbf)

---

## [1.22.13] - 2026-04-22

### 🔄 Changes

### ✨ Features
- feat: deprecate enforcer/orchestrator, add voting/metrics/security systems (0a73bcda7)
- feat: production-ready MCPs, complete documentation, fixed pipeline tests (6f62a5cda)

### 🐛 Bug Fixes
- fix: memory leaks, ES6 imports, production readiness (f0f87937a)
- fix: kernel-routing pipeline test inputs, complete all 22 pipelines (6d0a7ced5)
- fix: pipeline runner cwd, ESM require, missing processors, version config (44754822c)

### ♻️ Refactoring
- refactor: cleanup dead modules, archive unused docs, update all docs to match code (3bb55c65e)
- refactor: eliminate any types, add proper TypeScript interfaces (d88c37e10)

### 📚 Documentation
- docs: clarify plugin execution path in code comments (b87c2a483)

### 🔧 Maintenance
- chore: update .gitignore with temp files (9435b17e1)
- chore: cleanup dead code and temp files (a3471683e)

---

## [1.22.2] - 2026-04-07

### 🔄 Changes

Fix npm publish

---

## [1.22.1] - 2026-04-07

### 🔄 Changes

Hotfix

---

## [1.22.0] - 2026-04-07

### 🔄 Changes

Plugin system - hot-reload, npm install, auto-discovery, CLI, example plugin

---

## [1.21.0] - 2026-04-07

### 🔄 Changes

Plugin system major release

---

## [1.20.0] - 2026-04-07

### 🔄 Changes

Plugin system - hot-reload, npm install, auto-discovery, CLI, example plugin

---

## [1.19.1] - 2026-04-07

### 🔄 Changes

Release patch - fix npm publish version conflict

---

## [1.19.0] - 2026-04-07

### 🔄 Changes

Plugin system enhancements - hot-reload, npm install, example plugin

---

## [1.18.6] - 2026-04-01

### 🔄 Changes

### ✨ Features
- feat: add storyteller CLI command and register processor (8d6f5123a)
- feat: add storyteller enforcement for reflections/sagas (6198b74ab)
- feat: add CI report generator script (732a94d83)
- feat: add publish and commit_cycle config to features.json, update processors (f7948df70)
- feat: add publish preflight processor - validates docs, reflections, pipelines before publish (f9402f624)

### 🐛 Bug Fixes
- fix: correct artifact prefix paths in pre-publish-guard.js (bb7fdd7f7)
- fix: add storytelling config to .opencode/strray/features.json (2c38937b9)
- fix: copy all src/skills and src/integrations non-TS files to dist for consumer mode (4259ea141)
- fix: copy skills/registry.json and integrations configs to dist for consumer mode (19f583fc8)
- fix: add readme field to package.json for npm (034891c18)
- fix: copy README/docs to dist for npm publish (faa9e3af3)
- fix: convert all pipeline tests to ESM imports - use readFileSync/existsSync instead of require('fs') (ffee9746b)
- fix: JSON syntax error in features.json - duplicate require_reflection key (f70ebde01)
- fix: commit_cycle config - remove max_files_per_commit, change reflection to count by commits (aacf0b924)
- fix: pipeline test requirement now reads exact count from PIPELINE_INVENTORY.md (f900f7aa0)
- fix: pipeline test count reads from PIPELINE_INVENTORY.md - counts all discoverable pipelines (45a282498)
- fix: implement 8 placeholder validators - deployment safety, multi-agent, substrate, framework self-validation, emergent improvement, debug logs, performance regression, security vulnerability reporting (446f12d2b)
- fix: activate dormant processors - spawnGovernance, performanceBudget, asyncPattern, consoleLogGuard; add CI enforcement gate (b08068b9a)
- fix: add Node.js type declarations to tsconfig (40cdf34bb)
- fix: implement keyword-based routing in getTaskRoutingRecommendation (0ca8a9ea1)

### 📚 Documentation
- docs: enhance AGENTS.md storyteller section with enforcement details (cce78f12b)
- docs: add plan for enforcing storyteller skill for reflections/sagas (47859dccd)
- docs: add saga documenting journey from v1.15.40 to v1.18.2 (45b39e037)
- docs: add versioned deep system reflection (4eb98cb41)
- docs: add deep system reflection - the journey from plugin to agent OS (9a88868d4)

### 🧪 Tests
- test: add 11 new pipeline tests - complete coverage of all discoverable pipelines (61dd11695)
- test: add 3 new sub-pipeline tests - enforcement, MCP-server, inference; docs: update pipeline inventory, add sub-pipeline discovery guide (1b004586c)
- test: add CLI and MCP-Server pipelines to test suite, fix removed install.cjs tests (71c2ba153)

### 🔧 Maintenance
- chore: version sync v1.15.41 (cc549e2d0)
- chore: version sync artifacts for v1.15.41 (1c6a3c5dc)
- chore: bump UVM to 1.15.41 (21cfabc8e)
- chore: version sync artifacts for v1.15.40 (505ac3140)
- chore: bump UVM to 1.15.40 (3b07094f7)
- chore: version sync artifacts for v1.15.39 (2a5b4d7cd)
- chore: bump UVM to 1.15.39 (3a51e70ac)

### 🔎 Other Changes
- release: v1.18.2 - fix consumer file copying, add readme field (c28617bad)
- release: v1.18.0 - publish pipeline, CI report generator, ESM fixes (cb4ac2e1b)
- release: bump to v1.17.0 (9ae9d7725)
- Revert "chore: version sync artifacts for v1.15.41" (dd01f27f0)

---

## [1.18.5] - 2026-04-01

### 🔄 Changes

### ✨ Features
- feat: add storyteller enforcement for reflections/sagas (6198b74ab)
- feat: add CI report generator script (732a94d83)
- feat: add publish and commit_cycle config to features.json, update processors (f7948df70)
- feat: add publish preflight processor - validates docs, reflections, pipelines before publish (f9402f624)

### 🐛 Bug Fixes
- fix: add storytelling config to .opencode/strray/features.json (2c38937b9)
- fix: copy all src/skills and src/integrations non-TS files to dist for consumer mode (4259ea141)
- fix: copy skills/registry.json and integrations configs to dist for consumer mode (19f583fc8)
- fix: add readme field to package.json for npm (034891c18)
- fix: copy README/docs to dist for npm publish (faa9e3af3)
- fix: convert all pipeline tests to ESM imports - use readFileSync/existsSync instead of require('fs') (ffee9746b)
- fix: JSON syntax error in features.json - duplicate require_reflection key (f70ebde01)
- fix: commit_cycle config - remove max_files_per_commit, change reflection to count by commits (aacf0b924)
- fix: pipeline test requirement now reads exact count from PIPELINE_INVENTORY.md (f900f7aa0)
- fix: pipeline test count reads from PIPELINE_INVENTORY.md - counts all discoverable pipelines (45a282498)
- fix: implement 8 placeholder validators - deployment safety, multi-agent, substrate, framework self-validation, emergent improvement, debug logs, performance regression, security vulnerability reporting (446f12d2b)
- fix: activate dormant processors - spawnGovernance, performanceBudget, asyncPattern, consoleLogGuard; add CI enforcement gate (b08068b9a)
- fix: add Node.js type declarations to tsconfig (40cdf34bb)
- fix: implement keyword-based routing in getTaskRoutingRecommendation (0ca8a9ea1)

### 📚 Documentation
- docs: add plan for enforcing storyteller skill for reflections/sagas (47859dccd)
- docs: add saga documenting journey from v1.15.40 to v1.18.2 (45b39e037)
- docs: add versioned deep system reflection (4eb98cb41)
- docs: add deep system reflection - the journey from plugin to agent OS (9a88868d4)

### 🧪 Tests
- test: add 11 new pipeline tests - complete coverage of all discoverable pipelines (61dd11695)
- test: add 3 new sub-pipeline tests - enforcement, MCP-server, inference; docs: update pipeline inventory, add sub-pipeline discovery guide (1b004586c)
- test: add CLI and MCP-Server pipelines to test suite, fix removed install.cjs tests (71c2ba153)

### 🔧 Maintenance
- chore: version sync v1.15.41 (cc549e2d0)
- chore: version sync artifacts for v1.15.41 (1c6a3c5dc)
- chore: bump UVM to 1.15.41 (21cfabc8e)
- chore: version sync artifacts for v1.15.40 (505ac3140)
- chore: bump UVM to 1.15.40 (3b07094f7)
- chore: version sync artifacts for v1.15.39 (2a5b4d7cd)
- chore: bump UVM to 1.15.39 (3a51e70ac)

### 🔎 Other Changes
- release: v1.18.2 - fix consumer file copying, add readme field (c28617bad)
- release: v1.18.0 - publish pipeline, CI report generator, ESM fixes (cb4ac2e1b)
- release: bump to v1.17.0 (9ae9d7725)
- Revert "chore: version sync artifacts for v1.15.41" (dd01f27f0)

---

## [1.18.4] - 2026-04-01

### 🔄 Changes

### ✨ Features
- feat: add storyteller enforcement for reflections/sagas (6198b74ab)
- feat: add CI report generator script (732a94d83)
- feat: add publish and commit_cycle config to features.json, update processors (f7948df70)
- feat: add publish preflight processor - validates docs, reflections, pipelines before publish (f9402f624)

### 🐛 Bug Fixes
- fix: copy all src/skills and src/integrations non-TS files to dist for consumer mode (4259ea141)
- fix: copy skills/registry.json and integrations configs to dist for consumer mode (19f583fc8)
- fix: add readme field to package.json for npm (034891c18)
- fix: copy README/docs to dist for npm publish (faa9e3af3)
- fix: convert all pipeline tests to ESM imports - use readFileSync/existsSync instead of require('fs') (ffee9746b)
- fix: JSON syntax error in features.json - duplicate require_reflection key (f70ebde01)
- fix: commit_cycle config - remove max_files_per_commit, change reflection to count by commits (aacf0b924)
- fix: pipeline test requirement now reads exact count from PIPELINE_INVENTORY.md (f900f7aa0)
- fix: pipeline test count reads from PIPELINE_INVENTORY.md - counts all discoverable pipelines (45a282498)
- fix: implement 8 placeholder validators - deployment safety, multi-agent, substrate, framework self-validation, emergent improvement, debug logs, performance regression, security vulnerability reporting (446f12d2b)
- fix: activate dormant processors - spawnGovernance, performanceBudget, asyncPattern, consoleLogGuard; add CI enforcement gate (b08068b9a)
- fix: add Node.js type declarations to tsconfig (40cdf34bb)
- fix: implement keyword-based routing in getTaskRoutingRecommendation (0ca8a9ea1)

### 📚 Documentation
- docs: add plan for enforcing storyteller skill for reflections/sagas (47859dccd)
- docs: add saga documenting journey from v1.15.40 to v1.18.2 (45b39e037)
- docs: add versioned deep system reflection (4eb98cb41)
- docs: add deep system reflection - the journey from plugin to agent OS (9a88868d4)

### 🧪 Tests
- test: add 11 new pipeline tests - complete coverage of all discoverable pipelines (61dd11695)
- test: add 3 new sub-pipeline tests - enforcement, MCP-server, inference; docs: update pipeline inventory, add sub-pipeline discovery guide (1b004586c)
- test: add CLI and MCP-Server pipelines to test suite, fix removed install.cjs tests (71c2ba153)

### 🔧 Maintenance
- chore: version sync v1.15.41 (cc549e2d0)
- chore: version sync artifacts for v1.15.41 (1c6a3c5dc)
- chore: bump UVM to 1.15.41 (21cfabc8e)
- chore: version sync artifacts for v1.15.40 (505ac3140)
- chore: bump UVM to 1.15.40 (3b07094f7)
- chore: version sync artifacts for v1.15.39 (2a5b4d7cd)
- chore: bump UVM to 1.15.39 (3a51e70ac)

### 🔎 Other Changes
- release: v1.18.2 - fix consumer file copying, add readme field (c28617bad)
- release: v1.18.0 - publish pipeline, CI report generator, ESM fixes (cb4ac2e1b)
- release: bump to v1.17.0 (9ae9d7725)
- Revert "chore: version sync artifacts for v1.15.41" (dd01f27f0)

---

## [1.18.3] - 2026-04-01

### 🔄 Changes

### ✨ Features
- feat: add CI report generator script (732a94d83)
- feat: add publish and commit_cycle config to features.json, update processors (f7948df70)
- feat: add publish preflight processor - validates docs, reflections, pipelines before publish (f9402f624)

### 🐛 Bug Fixes
- fix: copy all src/skills and src/integrations non-TS files to dist for consumer mode (4259ea141)
- fix: copy skills/registry.json and integrations configs to dist for consumer mode (19f583fc8)
- fix: add readme field to package.json for npm (034891c18)
- fix: copy README/docs to dist for npm publish (faa9e3af3)
- fix: convert all pipeline tests to ESM imports - use readFileSync/existsSync instead of require('fs') (ffee9746b)
- fix: JSON syntax error in features.json - duplicate require_reflection key (f70ebde01)
- fix: commit_cycle config - remove max_files_per_commit, change reflection to count by commits (aacf0b924)
- fix: pipeline test requirement now reads exact count from PIPELINE_INVENTORY.md (f900f7aa0)
- fix: pipeline test count reads from PIPELINE_INVENTORY.md - counts all discoverable pipelines (45a282498)
- fix: implement 8 placeholder validators - deployment safety, multi-agent, substrate, framework self-validation, emergent improvement, debug logs, performance regression, security vulnerability reporting (446f12d2b)
- fix: activate dormant processors - spawnGovernance, performanceBudget, asyncPattern, consoleLogGuard; add CI enforcement gate (b08068b9a)
- fix: add Node.js type declarations to tsconfig (40cdf34bb)
- fix: implement keyword-based routing in getTaskRoutingRecommendation (0ca8a9ea1)

### 📚 Documentation
- docs: add plan for enforcing storyteller skill for reflections/sagas (47859dccd)
- docs: add saga documenting journey from v1.15.40 to v1.18.2 (45b39e037)
- docs: add versioned deep system reflection (4eb98cb41)
- docs: add deep system reflection - the journey from plugin to agent OS (9a88868d4)

### 🧪 Tests
- test: add 11 new pipeline tests - complete coverage of all discoverable pipelines (61dd11695)
- test: add 3 new sub-pipeline tests - enforcement, MCP-server, inference; docs: update pipeline inventory, add sub-pipeline discovery guide (1b004586c)
- test: add CLI and MCP-Server pipelines to test suite, fix removed install.cjs tests (71c2ba153)

### 🔧 Maintenance
- chore: version sync v1.15.41 (cc549e2d0)
- chore: version sync artifacts for v1.15.41 (1c6a3c5dc)
- chore: bump UVM to 1.15.41 (21cfabc8e)
- chore: version sync artifacts for v1.15.40 (505ac3140)
- chore: bump UVM to 1.15.40 (3b07094f7)
- chore: version sync artifacts for v1.15.39 (2a5b4d7cd)
- chore: bump UVM to 1.15.39 (3a51e70ac)

### 🔎 Other Changes
- release: v1.18.2 - fix consumer file copying, add readme field (c28617bad)
- release: v1.18.0 - publish pipeline, CI report generator, ESM fixes (cb4ac2e1b)
- release: bump to v1.17.0 (9ae9d7725)
- Revert "chore: version sync artifacts for v1.15.41" (dd01f27f0)

---

## [1.15.41] - 2026-04-01

### 🔄 Changes

### 🐛 Bug Fixes
- fix: activate dormant processors - spawnGovernance, performanceBudget, asyncPattern, consoleLogGuard; add CI enforcement gate (b08068b9a)
- fix: add Node.js type declarations to tsconfig (40cdf34bb)
- fix: implement keyword-based routing in getTaskRoutingRecommendation (0ca8a9ea1)

### 🔧 Maintenance
- chore: version sync artifacts for v1.15.41 (1c6a3c5dc)
- chore: bump UVM to 1.15.41 (21cfabc8e)
- chore: version sync artifacts for v1.15.40 (505ac3140)
- chore: bump UVM to 1.15.40 (3b07094f7)
- chore: version sync artifacts for v1.15.39 (2a5b4d7cd)
- chore: bump UVM to 1.15.39 (3a51e70ac)

### 🔎 Other Changes
- Revert "chore: version sync artifacts for v1.15.41" (dd01f27f0)

---

## [1.15.40] - 2026-03-31

### 🔄 Changes

### 🐛 Bug Fixes
- fix: add Node.js type declarations to tsconfig (40cdf34bb)
- fix: implement keyword-based routing in getTaskRoutingRecommendation (0ca8a9ea1)

### 🔧 Maintenance
- chore: bump UVM to 1.15.40 (3b07094f7)
- chore: version sync artifacts for v1.15.39 (2a5b4d7cd)
- chore: bump UVM to 1.15.39 (3a51e70ac)

---

## [1.15.39] - 2026-03-31

### 🔄 Changes

### 🔧 Maintenance
- chore: bump UVM to 1.15.39 (3a51e70ac)

---

## [1.15.38] - 2026-03-31

### 🔄 Changes

### 🐛 Bug Fixes
- fix: skill-install always tries gh first, supports bare repo names, symlink .opencode/skills -> .strray/skills (40abe23cd)
- fix: properly detect console.log in comments - line-by-line check (1046b8bd4)
- fix: pre-publish-guard.js uses createRequire for ESM compat (94d57ceba)

### 🔧 Maintenance
- chore: remove main branch references, point all docs to master (683e58799)
- chore: bump UVM to 1.15.38 (658fac590)
- chore: version sync artifacts for v1.15.37 (a11e459d5)

---

## [1.15.37] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: plugin dynamic import path resolution breaks in Docker/container environments (#26) (518a67a0d)

### 🔧 Maintenance
- chore: bump UVM to 1.15.37 (7ca44e193)
- chore: version sync artifacts for v1.15.36 (7c61f5232)

---

## [1.15.36] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: init.sh fallback for Hermes consumers + prioritize gh in skill:install (#25) (6e2121bd1)

### 🔧 Maintenance
- chore: version sync artifacts for v1.15.35, bump UVM to 1.15.36 (d70f3db42)

---

## [1.15.35] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: ship .opencode/init.sh in npm package (da1cc665b)

### 🔧 Maintenance
- chore: bump UVM to 1.15.35 (f349dce07)
- chore: version sync artifacts for v1.15.34 (eddc46f64)

### 🔎 Other Changes
- Merge pull request #24 from htafolla/fix/init-sh-missing-from-npm (f93111d15)

---

## [1.15.34] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: bridge enforcement wiring, dedup helpers, version alignment (6481e09ef)

### 🔧 Maintenance
- chore: bump UVM to 1.15.34 + version sync artifacts (0dab64a2b)

### 🔎 Other Changes
- Merge pull request #23 from htafolla/fix/hermes-bridge-enforcement-and-cleanup (048e66fa3)

---

## [1.15.33] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: add node_modules candidate paths for consumer env imports (fd289e4f6)

### 🔧 Maintenance
- chore: bump UVM to 1.15.33 (5a773d42b)
- chore: version sync artifacts (6df9eb63b)

### 🔎 Other Changes
- Merge pull request #22 from htafolla/fix/consumer-node-modules-candidates (c32e97cbe)

---

## [1.15.32] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: remove 3 phantom lifecycle hooks that don't exist in the host (932270ac6)

### 🔧 Maintenance
- chore: version sync artifacts (0bf9c7c44)
- chore: bump UVM to 1.15.32 (54596d9ca)

### 🔎 Other Changes
- Merge pull request #21 from htafolla/fix/remove-phantom-hooks (cdf4d2059)

---

## [1.15.31] - 2026-03-30

### 🔄 Changes

### 🔎 Other Changes
- fix prepare-consumer regex, clean dist artifacts (63165ba65)
- fix double-escaped regex in prepare-consumer (7b658fbdb)

---

## [1.15.30] - 2026-03-30

### 🔄 Changes

### 🔧 Maintenance
- chore: bump UVM to 1.15.30, version sync artifacts for v1.15.29 (876f79ea6)

### 🔎 Other Changes
- remove marketplace stub, rename plugins→plugin, archive dead quality-gate (04ef266d0)

---

## [1.15.29] - 2026-03-30

### 🔄 Changes

### 🔧 Maintenance
- chore: archive 217 stale scripts, fix postinstall .strray symlink, remove dead pkg refs (2f35dab56)
- chore: v1.15.28 version sync artifacts, bump UVM to 1.15.29 (2404907f1)

---

## [1.15.28] - 2026-03-30

### 🔄 Changes

### ✨ Features
- feat: postinstaller installs all 4 git hooks (pre-commit, post-commit, pre-push, post-push) (7ec26177d)

### 🐛 Bug Fixes
- fix: Hermes consumer cleanup — skip .opencode/, fix bridge state dir (8c1751bcf)
- fix: add 14 missing agents to opencode.json (c88bce973)
- fix: eliminate all hardcoded config paths — centralize on config-paths resolver (715541d80)
- fix: eliminate hardcoded config paths — use config-paths resolver throughout (40121d2d7)
- fix: agents_template.md not found in consumer installs + add missing routing-mappings.json (dda25b90e)
- fix: resolve stale version display and add missing report CLI flags (6bf18b53a)

### 📚 Documentation
- docs: fix stale .opencode/state path in README — .strray/state/ (a2519e889)
- docs: deep reflection — the invisible .mjs build gap (v1.15.27) (b8c5f3680)

### 🔧 Maintenance
- chore: remove all references to deleted .opencode/OpenCode.json (16111ec54)
- chore: bump UVM to 1.15.28 + sync .strray artifacts (dcf60eb73)

### 🔎 Other Changes
- Merge pull request #20 from htafolla/fix/minor-issues-v1.15.27 (6ec4d8b7d)

---

## [1.15.27] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: copy .mjs files to dist in build script (28efc9fbb)

### 🔧 Maintenance
- chore: bump UVM to 1.15.27 (45a210e42)

### 🔎 Other Changes
- Merge pull request #19 from htafolla/fix/mjs-copy-build (400bf6daa)
- v1.15.26 (730e61701)

---

## [1.15.26] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: wire enforcement validators into codex-check bridge command (#18) (9ef222d9a)
- fix: prevent self-referencing .strray symlink in dev repo (e3d2a7c09)

### 📦 Builds
- build: consumer artifacts for v1.15.25 (c7dfe5eb3)

### 🔧 Maintenance
- chore: bump UVM to 1.15.26 (3804272a9)

---

## [1.15.25] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: server.ts regression, plugin imports, stale plugin copy, config hook guard (6f6194063)

---

## [1.15.24] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: stale plugin copy caused 3-4x init.sh + server.ts regression + import consistency (e955df3a6)

### 📦 Builds
- build: consumer artifacts for v1.15.23 (001bf5616)

---

## [1.15.23] - 2026-03-30

### 🔄 Changes

### 🐛 Bug Fixes
- fix: plugin config hook fires 4x during startup + publish lifecycle fixes (a863cdf77)

### 📦 Builds
- build: consumer artifacts for v1.15.22 (82884591c)

---

## [1.15.22] - 2026-03-30

### 🔄 Changes

### ✨ Features
- feat: decouple framework from OpenCode — fully headless mode (305d4df52)

### 🐛 Bug Fixes
- fix: init.sh dedup guard, plugin framework-logger dynamic import, delegation barrel exports (fdfe643f7)

### 📦 Builds
- build: consumer artifacts for v1.15.19 (c72b53279)

### 🔧 Maintenance
- chore: fix .strray from broken symlink to real dir (d382e7740)
- chore: UVM bump to 1.15.21, fix .strray symlink to real dir (e3f363a1a)

### 🔎 Other Changes
- Merge pull request #17 from htafolla/fix/init-dedup-plugin-logger-delegation-exports (fe6b902d2)
- Merge pull request #16 from htafolla/fix/opencode-decouple-headless (f7ba93b36)
- merge: resolve version conflict — keep 1.15.20 (5de7c68c9)

---

## [1.15.19] - 2026-03-29

### 🔄 Changes

### ✨ Features
- feat: record routing outcomes on every tool call in both plugins (9bace72fd)
- feat: auto inference tuning every 100 tool calls in both plugins (c5fdfc1f5)
- feat: activate inference feedback loop — analytics pipeline now writes back (f2a3f34ef)
- feat: decouple 0xRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

### 🐛 Bug Fixes
- fix: security hardening, path traversal, code injection, auth bypass, repo hygiene, test cleanup (#13) (#13) (0af058e66)
- fix: state persistence path, enforcer blocked logic, console bleed, test fixes, subagent enforcement (#12) (044a0e393)
- fix: resolve config-paths.js import failure from .opencode/plugins/ (a365843e9)
- fix: UVM version corruption, delete 42 stub test files (509b5ac39)
- fix: add express dep, version sync, bridge codex dedup, repo cleanup (f9c3dd96d)
- fix: post-merge cleanup — deps, index.ts, pipelines, root artifacts (bcbc31b01)
- fix: merge PR #11 fixes — bugs, security, dead code, version (ef32821f2)
- fix: README version regex to exclude IP addresses (127.0.0) (80967acaa)

### ♻️ Refactoring
- refactor: replace console.* with frameworkLogger across 36 production files (293b51827)

### 📚 Documentation
- docs: deep reflection — inference feedback loop activation (581bf11e8)

### 🔧 Maintenance
- chore: rebuild dist after console.* cleanup (07e4a6872)
- chore: update performance-baselines.json (8f791388f)
- chore: sync performance baselines (3c1e6f647)
- chore: UVM 1.15.13 (1 ahead of npm) (e3220847c)
- chore: fix package.json version to 1.15.12 (35b158283)
- chore: UVM 1.15.12 (1 ahead of npm) (33ed3793c)
- chore: update test performance baselines (a2ae8e93c)
- chore: version sync to 1.15.11 (92fb03d92)

---

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
- feat: decouple 0xRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

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
- feat: decouple 0xRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

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
- feat: decouple 0xRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

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
- feat: decouple 0xRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

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
- feat: decouple 0xRay from OpenCode — bridge, codex formatter, codex-gap processors (#10) (a24f3b406)

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
