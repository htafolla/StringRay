# Commit Cadence Reflection

**Generated:** 2026-06-02T14:05:34.185Z
**Cadence:** commit (since last reflection)
**Commits examined:** 196
**Span:** d7f4cda87b468617442bf9c48a7d4a5d91e3e4e6..HEAD

## Scope

- **196 commits** with **27576 file changes**
- **+1155638 insertions / -1444662 deletions**
- **0 files added, 0 modified, 0 deleted**

## Commit Chronicle

- **fix: align governance client field names with Dynamo response (solarResonance -> solarIsotopicResonance, relax evaluate validation)** (e5ecea0)
  0 files: src/integrations/governance/governance-client.ts, src/integrations/governance/index.ts, src/integrations/governance/types.ts

- **docs: add reflection on the Aside subcontext pattern and its architectural implications** (96b772d)
  3 files: docs/reflections/aside-subcontext-pattern-2026-05-19.md

- **docs: add aside on the growth arc and realization of 0xRay's deeper architecture** (7750887)
  1 files: docs/reflections/0xray-growth-arc-aside-2026-05-19.md

- **docs: add 0xRay three-subsystem architecture vision reflection** (0694f92)
  1 files: docs/reflections/0xray-three-subsystem-architecture-vision-2026-05-19.md

- **docs: add deep journey reflection on Grok CLI MCP stability and publish pipeline fixes** (cba8b87)
  1 files: docs/reflections/deep/grok-mcp-publish-stability-journey-2026-05-19.md

- **docs: add deep journey reflection on double-dist fix and Dynamo governance pipeline** (c297183)
  1 files: docs/reflections/deep/the-path-to-dynamo-journey-2026-05-19.md

- **fix: update tests for new resolveFrameworkPaths behavior + deflake inference-e2e** (4702109)
  1 files: .opencode/state/state.json, .strray/codex.json, .strray/config.json, .strray/features.json, .strray/integrations.json +3 more

- **release: v1.22.66** (32f4fb2)
  8 files: AGENTS-full.md, AGENTS.md, docs/README.md, node_modules/.package-lock.json, node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json +329 more

- **release: v1.22.65** (5a98fb5)
  334 files: .strray/state/state.json, AGENTS-full.md, AGENTS.md, docs/README.md, node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json +8 more

- **fix: bump self-dependency to ^1.22.64, add node_modules/ to .gitignore** (091e4ba)
  13 files: .gitignore, .grok/plugins/strray-ai/.mcp.json, .grok/plugins/strray-ai/hooks/hooks.json, .strray/codex.json, .strray/config.json +6 more

- **release: v1.22.64** (80b6873)
  11 files: .strray/codex.json, .strray/config.json, .strray/features.json, .strray/integrations.json, AGENTS-full.md +12 more

- **release: v1.22.63** (b72b189)
  17 files: .strray/codex.json, .strray/config.json, .strray/features.json, .strray/integrations.json, AGENTS-full.md +16 more

- **release: v1.22.62** (438c4ba)
  21 files: .strray/config.json, .strray/features.json, .strray/integrations.json, AGENTS-full.md, AGENTS.md +8 more

- **fix: eliminate dist/dist/ build corruption at source — remove hardcoded ../../dist/ fallback paths, use import.meta.url resolution, disable stale source maps, add prebuild clean** (4e6ab01)
  13 files: .opencode/plugin/strray-codex-injection.js, package.json, src/plugin/strray-codex-injection.ts, src/postprocessor/triggers/GitHookTrigger.ts, src/utils/import-resolver.ts +1 more

- **fix: add Streamable HTTP transport to governance + skill-invocation MCP servers for Grok CLI compatibility** (5e4e47a)
  6 files: src/mcps/governance.server.ts, src/mcps/knowledge-skills/skill-invocation.server.ts

- **v1.22.61** (0c5ddbb)
  2 files: .strray/codex.json, .strray/features.json, .strray/inference/prompts/01-researcher.md, AGENTS-consumer.md, AGENTS-full.md +183 more

- **feat(grok): improve MCP server startup robustness + entrypoint detection for direct Grok CLI use** (92e8bcb)
  188 files: docs/reflections/reflection-reflection-2026-05-19-2026-05-19.md, src/integrations/grok/hooks/pre-tool-use.js, src/plugin/strray-codex-injection.ts, src/postprocessor/PostProcessor.ts

- **fix: robust entry-point detection for Grok stdio MCP startup — use fileURLToPath + path.resolve** (9b3b42f)
  4 files: src/mcps/governance.server.ts, src/mcps/knowledge-skills/skill-invocation.server.ts

- **docs: add deep reflection on Grok CLI first-class integration journey (2026-05-19)** (1651246)
  2 files: docs/reflections/deep/grok-cli-first-class-integration-journey-2026-05-19.md

- **v1.22.60** (2763b0b)
  1 files: .strray/codex.json, .strray/features.json, .strray/inference/prompts/01-researcher.md, .strray/state/state.json, AGENTS-consumer.md +207 more

- **feat: Make Grok CLI a first-class citizen with full plugin + working governance hooks (#91)** (635ff55)
  212 files: .github/workflows/ci.yml, .github/workflows/hermes-plugin.yml, scripts/test/test-grok-cli-e2e.mjs, src/__tests__/e2e/integrations-e2e.test.ts, src/__tests__/unit/inference/inference-cycle.test.ts +5 more

- **test(grok): fix E2E plugin path — validate project-root .grok/plugins/strray-ai/ (matches postinstall + OpenCode parity)** (6712a80)
  10 files: scripts/test/test-grok-cli-e2e.mjs

- **feat(grok): first-class Grok CLI plugin integration (hooks + MCP)** (0c96c59)
  1 files: package.json, scripts/node/postinstall.cjs, scripts/test/test-consumer-e2e.mjs, scripts/test/test-grok-cli-e2e.mjs, src/cli/commands/grok-install.ts +4 more

- **fix: resolve tsc errors, duplicate KEEP, vortexVolume default, and consumer runner pack capture** (f480905)
  9 files: scripts/test/test-consumer-e2e.mjs, scripts/test/test-openclaw-e2e.mjs, src/governance/governance-core.ts, src/mcps/knowledge-skills/code-review.server.ts

- **test(grok): add Grok CLI E2E test modeled after Hermes/OpenCode/OpenClaw consumer tests** (309c7b5)
  4 files: scripts/test/test-grok-cli-e2e.mjs

- **test(consumer): unified E2E gate + fixes for Hermes and OpenClaw** (7ff1aab)
  1 files: scripts/test/test-consumer-e2e.mjs, scripts/test/test-hermes-e2e.mjs, scripts/test/test-openclaw-e2e.mjs

- **feat(governance): real MCP transport + Dynamo Solar SSOT as primary governance path** (4da3ee5)
  3 files: .gitignore, .strray/state/state.json, .vercelignore, api/health.ts, api/mcp.ts +30 more

- **feat(governance): wire individual MCP skill servers for pure-MCP proposal voting** (7169a16)
  35 files: src/mcps/researcher.server.ts, src/mcps/simulation/server-simulations.ts

- **fix(governance): re-apply full analyze_proposal support + real MCP transport on clean branch** (45a454b)
  2 files: docs/reflections/mcp-native-governance-completion.md, src/core/agent-spawn-gate.ts, src/mcps/knowledge-skills/code-review.server.ts, src/mcps/knowledge-skills/security-audit.server.ts, src/mcps/mcp-client.ts

- **feat(governance): complete pure individual knowledge-skill MCP path for inference proposals** (cc88259)
  5 files: src/core/agent-spawn-gate.ts, src/inference/inference-cycle.ts, src/orchestrator/enhanced-multi-agent-orchestrator.ts, src/scripts/integration.ts

- **feat(governance): full pure individual knowledge-skill MCP path for inference proposals** (7720897)
  4 files: docs/reflections/mcp-native-governance-completion.md, src/inference/inference-cycle.ts, src/mcps/knowledge-skills/code-review.server.ts, src/mcps/knowledge-skills/security-audit.server.ts, src/mcps/orchestrator/handlers/task-handler.ts

- **feat(governance): complete pure individual knowledge-skill MCP path for inference proposals** (906f794)
  5 files: .strray/state/state.json, node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json, package.json, src/core/opencode-spawn-gate.ts, src/inference/inference-cycle.ts +1 more

- **feat(orchestrator): make executePlan dispatch real MCP skill servers instead of simulation** (3522cde)
  6 files: .strray/inference/prompts/01-researcher.md, .strray/state/state.json, docs/reflections/deep/release-v1.22.46-to-head-2026-05-15.md, node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json, src/inference/inference-cycle.ts +2 more

- **feat(governance): pure individual knowledge-skill MCP path for inference proposals** (d0f52bd)
  7 files: .strray/state/state.json, src/inference/inference-cycle.ts, src/mcps/knowledge-skills/project-analysis.server.ts

- **fix: replace console.log with frameworkLogger in governance-client; propagate SolarGovernanceVoteResult through inference cycle** (d1537bf)
  3 files: src/inference/inference-cycle.ts, src/integrations/governance/governance-client.ts, src/integrations/governance/index.ts

- **refactor: complete governance client refactor — callTool proxy, evaluateGovernance route, remove dead code** (770a131)
  3 files: docs/reflections/deep/release-v1.22.46-to-head-2026-05-13.md, src/integrations/governance/governance-client.ts, src/integrations/governance/index.ts

- **refactor: use confidenceAdjustment numeric threshold instead of solarActivityLevel string for recommendation logic** (470556a)
  3 files: src/integrations/governance/index.ts

- **feat: wire govern_with_solar as the primary governance endpoint** (72263a1)
  1 files: src/integrations/governance/index.ts, src/integrations/governance/types.ts, src/opencode/strray/features.json

- **Revert "remove solar enhancement overlay — endpoint already consumes NOAA GOES natively via dynamo___evaluate_governance"** (0f807e1)
  3 files: src/integrations/governance/governance-client.ts, src/integrations/governance/index.ts, src/integrations/governance/types.ts, src/opencode/strray/features.json

- **remove solar enhancement overlay — endpoint already consumes NOAA GOES natively via dynamo___evaluate_governance** (9c34ca7)
  4 files: src/integrations/governance/governance-client.ts, src/integrations/governance/index.ts, src/integrations/governance/types.ts, src/opencode/strray/features.json

- **fix: increase opencode spawn timeout from 60s to 300s to prevent premature timeouts during agent voting** (31f0fe6)
  4 files: src/inference/inference-cycle.ts

- **fix: initialize external governance in inference:run CLI command for two-oscillator governance** (c187e04)
  1 files: src/cli/index.ts

- **fix: two-oscillator governance — trust endpoint decision, remove local confidence override** (caa444f)
  1 files: init.sh, opencode.json, package.json, src/__tests__/pipeline/test-agent-registry-pipeline.mjs, src/inference/inference-cycle.ts +2 more

- **docs(agents): correct agent counts — 42 YAML agents, 22 TS routing modules** (eeee498)
  7 files: AGENTS.md, README.md

- **refactor(config): source-of-truth pipeline — src/opencode/ → .opencode/** (6c5909e)
  2 files: .gitignore, .opencode/activity-report.json, .opencode/agents/.gitkeep, .opencode/agents/enforcer.yml, .opencode/agents/orchestrator.yml +281 more

- **feat: enable spawn gate monitoring mode + release reflection doc** (5746fa8)
  286 files: .opencode/activity-report.json, .opencode/logs/.strray-init.lock, .opencode/state, .strray/inference/prompts/01-researcher.md, .strray/state/state.json +2 more

- **fix: singleton + state management to prevent recursive agent spawning** (2b2a018)
  7 files: src/cli/index.ts, src/inference/inference-cycle.ts, src/integrations/hermes-agent/bridge.mjs, src/integrations/openclaw/api-server.ts, src/mcps/orchestrator/server.ts

- **feat: enable inference_governance + solar enhancement for monitoring** (b4d782f)
  5 files: .opencode/strray/features.json, .strray/features.json

- **feat: wire govern_with_solar tool — real-time NOAA solar context into governance decisions** (4ba49d5)
  2 files: .opencode/strray/features.json, .strray/features.json, src/integrations/governance/governance-client.ts, src/integrations/governance/index.ts, src/integrations/governance/types.ts

- **fix: add centralized OpenCode spawn gate to prevent all recursive agent spawning** (b8ff0e7)
  5 files: .opencode/activity-report.json, .opencode/logs/.strray-init.lock, .opencode/state, .opencode/strray/features.json, .strray/config.json +597 more

- **v1.22.59** (28183e3)
  602 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/commands/pre-commit-introspection.sh +184 more

- **fix: disable auto-spawning of opencode agents to prevent runaway processes** (2948703)
  189 files: .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/commands/pre-commit-introspection.sh, .opencode/logs/.strray-init.lock +541 more

- **v1.22.58** (30a1674)
  546 files: .strray/config.json, .strray/integrations.json

- **v1.22.58** (2361dad)
  2 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/commands/pre-commit-introspection.sh +183 more

- **v1.22.56** (1a428c0)
  188 files: node_modules/.package-lock.json, node_modules/strray-ai/.opencode/AGENTS-consumer.md, node_modules/strray-ai/.opencode/codex.codex, node_modules/strray-ai/.opencode/commands/model-health-check.md, node_modules/strray-ai/.opencode/commands/pre-commit-introspection.sh +13120 more

- **chore: sync config files to v1.22.56, add inference_governance feature block** (1584fd1)
  13125 files: .opencode/logs/.strray-init.lock, .strray/config.json, .strray/features.json, .strray/integrations.json, package-lock.json +1 more

- **v1.22.57** (170472e)
  6 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +194 more

- **feat: integrate chrono-warp-drive governance MCP for inference checking** (a61cd6f)
  199 files: .opencode/strray/integrations.json, .opencode/strray/routing-mappings.json, src/inference/inference-cycle.ts, src/integrations/governance/governance-client.ts, src/integrations/governance/index.ts +1 more

- **Address: Bug: fix: increase timeout for processor auto-discovery tests to prevent flak... (112x)** (02d8fa9)
  6 files: .opencode/logs/.strray-init.lock, .opencode/state, .opencode/strray/features.json, .strray/inference/prompts/01-researcher.md, .strray/state/state.json +1 more

- **chore: update strray-ai to v1.22.55, add vote scripts and reflection** (13280fd)
  6 files: .strray/config.json, .strray/inference/prompts/01-researcher.md, .strray/integrations.json, docs/reflections/deep/release-v1.22.46-to-head-2026-05-09.md, package-lock.json +7 more

- **feat: add auto-rotation to activity logger at 5MB threshold** (ee6a4da)
  12 files: src/core/activity-logger.ts

- **v1.22.55** (c343767)
  1 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +196 more

- **feat: wire 3 orphaned features + add tests + remove empty api-gateway** (077b8dc)
  201 files: docs/dead-code-audit.md, docs/integration-surfaces.md, docs/target-architecture.md, src/__tests__/unit/commit-batcher-processor.test.ts, src/__tests__/unit/mcp-servers-integration.test.ts +5 more

- **feat: wire apply phase via MCP routing + fix e2e tests (41/41 PASS)** (db8abef)
  10 files: .strray/inference/prompts/01-researcher.md, docs/reflections/apply-phase-real-code-changes-via-mcp-routing.md, scripts/test/test-opencode-e2e.mjs, src/inference/inference-cycle.ts, src/integrations/hermes-agent/bridge.mjs +3 more

- **docs: add apply phase design — real code changes via MCP routing** (8eab050)
  8 files: docs/reflections/apply-phase-real-code-changes-via-mcp-routing.md

- **revert: roll back apply phase marker system — needs real agent invocation via plugin/MCP routing** (10309b2)
  1 files: src/inference/inference-cycle.ts

- **feat: wire apply phase for real code changes instead of markdown markers** (f190318)
  1 files: src/inference/inference-cycle.ts

- **fix: remove unused imports and any type from processor-manager.interfaces.test.ts (processor-test-rules ESLint)** (529d3d2)
  1 files: src/processors/processor-manager.interfaces.test.ts

- **fix: address all open bugs (#29-32, #34) and prevent noise PRs from inference cycle** (c32d711)
  1 files: src/__tests__/unit/security-encryption-fix.test.ts, src/enforcement/core/__tests__/violation-fixer.test.ts, src/enforcement/core/violation-fixer.ts, src/inference/inference-cycle.ts, src/processors/processor-manager.ts +2 more

- **fix: remove enforcer references from integration test, add fetch-depth:0 for e2e git tests** (deb49f4)
  7 files: .github/workflows/ci.yml, src/__tests__/unit/integration.test.ts

- **fix: triage and fix all GitHub workflow pipelines** (097b48c)
  2 files: .github/workflows/auto-report.yml, .github/workflows/processor-tests.yml, .github/workflows/publish.yml, .github/workflows/release.yml, .github/workflows/security-audit.yml +2 more

- **fix: restore package.json, mcp-install.ts, workflows, and govern-reflection.mjs gutted by 84dae31b1** (7417fd6)
  7 files: .github/workflows/ci-cd-monitor.yml, .github/workflows/ci.yml, .github/workflows/enforce-agents-md.yml, .github/workflows/release.yml, .github/workflows/security.yml +6 more

- **fix: add npm audit fix to main CI workflow** (84dae31)
  11 files: .github/workflows/ci.yml

- **fix: run npm audit fix to resolve moderate vulnerabilities** (314cc06)
  1 files: .github/workflows/security.yml, package.json

- **fix: remove duplicate case undefined in mcp-install.ts (lint error)** (9b713b9)
  2 files: src/cli/commands/mcp-install.ts

- **chore: trigger ci-cd-monitor with force_fix=true** (b36970f)
  1 files: .github/force-monitor-trigger.txt

- **ci: improve ci-cd-monitor.yml - better error handling + governance integration** (a095f17)
  1 files: .github/workflows/ci-cd-monitor.yml

- **chore: trigger monitoring script** (0dddd30)
  1 files: .github/monitor-trigger.txt

- **fix: make trace-context more robust + fix ESM issues in govern-reflection** (e665442)
  1 files: scripts/node/govern-reflection.mjs, src/core/trace-context.ts

- **ci: improve all workflows - add caching, coverage, security hardening, and new governance test step** (05a8c08)
  2 files: .github/workflows/ci.yml, .github/workflows/enforce-agents-md.yml, .github/workflows/release.yml, .github/workflows/security.yml

- **feat: add centralized TraceContext + integrate Reflection Governance with ValidatorRegistry** (1a79c88)
  4 files: scripts/node/govern-reflection.mjs, src/core/trace-context.ts

- **feat: implement governance-approved stagger + trace propagation, add reflection governance pipeline** (27d6e29)
  2 files: docs/reflections/deep/lexicon-cross-correlation-journey-2026-05-06.md, scripts/node/govern-reflection.mjs, src/core/framework-logger.ts, src/inference/inference-cycle.ts, src/processors/processor-manager.ts

- **v1.22.53** (6ddf31d)
  5 files: .opencode/activity-report.json, .strray/config.json, .strray/integrations.json, CHANGELOG.md, backups/version-manager-backup-2026-05-06T16-22-00-109Z/CHANGELOG.md +7 more

- **chore: UVM sync v1.22.52 — all version references updated** (ce3b70e)
  12 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/commands/pre-commit-introspection.sh +186 more

- **chore: UVM sync to v1.22.51** (b53a5ac)
  191 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +184 more

- **v1.22.51** (3d96823)
  189 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +186 more

- **fix: agent registry cleanup — remove skill-only entries, delete deprecated agents** (1cafc3a)
  191 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +226 more

- **fix: agent export naming + single-architect governance** (b5c6100)
  231 files: agents/testing-lead.yml, src/__tests__/agents/testing-lead.test.ts, src/__tests__/unit/inference/inference-cycle.test.ts, src/agents/content-creator.ts, src/agents/growth-strategist.ts +8 more

- **fix: complete inference-cycle.ts — all fixes applied.** (cef1ecd)
  13 files: src/inference/inference-cycle.ts

- **docs: deep reflection — inference apply phase journey (honest assessment)** (1a05086)
  1 files: docs/reflections/deep/inference-apply-phase-journey-2026-05-01.md

- **fix: guard inference:run for StringRay internal use only** (beefefb)
  1 files: src/cli/index.ts

- **feat: wire apply phase + researcher double-check for PRs** (7bfa4ca)
  1 files: src/cli/index.ts, src/inference/inference-cycle.ts

- **fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling** (40ae8ae)
  2 files: src/cli/index.ts, src/inference/inference-cycle.ts

- **feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator** (fca44e6)
  2 files: .gitignore, .opencode/activity-report.json, .strray/inference/latest-workflow.json, .strray/inference/workflow-status.json, .strray/state/state.json +1321 more

- **feat: unify governance — wire WeightedVotingAggregator, expand agents, connect orchestrator** (191536d)
  1326 files: dist/delegation/index.d.ts, dist/delegation/index.d.ts.map, dist/delegation/index.js, dist/delegation/index.js.map, dist/delegation/voting-coordinator.d.ts +15 more

- **docs: governance unification saga — deep reflection on wiring four systems into one loop** (9cd5b8b)
  20 files: docs/reflections/deep/governance-unification-saga-2026-04-30.md

- **feat: lower inference thresholds to trigger on real data, keep raw problem text** (c7c09a4)
  1 files: dist/inference/inference-accumulator.js, dist/inference/inference-accumulator.js.map, dist/inference/inference-cycle.d.ts.map, dist/inference/inference-cycle.js, dist/inference/inference-cycle.js.map +6 more

- **feat: production-ready inference governance — CLI, real agents, DI, learning loop** (501eb8d)
  11 files: .opencode/activity-report.json, .strray/inference/latest-workflow.json, .strray/inference/workflow-status.json, .strray/state/state.json, AGENTS.md +82 more

- **feat: inference layer — semantic patterns, session capture, accumulator, governance cycle, deploy verifier** (5963ce1)
  87 files: .strray/inference/latest-workflow.json, .strray/inference/workflow-status.json, dist/CHANGELOG.md, dist/inference/deploy-verifier.d.ts, dist/inference/deploy-verifier.d.ts.map +50 more

- **fix: increase timeout for processor auto-discovery tests to prevent flaky failures** (baae755)
  55 files: src/__tests__/unit/processor-auto-discovery.test.ts

- **fix: inference processor double-joining absolute path created bogus Users/ dir** (a795635)
  1 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +577 more

- **chore: v1.22.48, add prepublishOnly to strip source maps and declarations** (112ef89)
  582 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +303 more

- **chore: v1.22.47, add .npmignore to strip .d.ts and source maps from package** (e2f7225)
  308 files: .npmignore, .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex +248 more

- **chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore** (22f9ddf)
  253 files: .gitignore, .opencode/activity-report.json, .opencode/core/activity-logger.d.ts.map, .opencode/core/adaptive-kernel.d.ts.map, .opencode/core/boot-orchestrator.d.ts.map +59 more

- **docs: the engine that built the engine — deep reflection on the meta-system, consumer tweet, release reflection** (522c28b)
  64 files: AGENTS.md, docs/reflections/deep/release-v1.22.46-to-head-2026-04-29.md, docs/reflections/deep/the-engine-that-built-the-engine-saga-2026-04-29.md, tweets/v1.22.46.md

- **chore: rebuild dist after path fix** (4453c41)
  4 files: .strray/codex.json, .strray/config.json, .strray/features.json, .strray/integrations.json, dist/AGENTS.md

- **release: v1.22.46** (15b4f73)
  5 files: .opencode/strray/codex.json, .opencode/strray/config.json, .opencode/strray/features.json, .opencode/strray/integrations.json, AGENTS-full.md +3 more

- **fix: point opencode plugin/mcps to paths that actually exist in published package** (d31949f)
  8 files: .strray/codex.json, .strray/config.json, .strray/features.json, .strray/integrations.json, dist/AGENTS.md

- **release: v1.22.45** (476670f)
  5 files: .opencode/plugin/strray-codex-injection.js, .opencode/strray/codex.json, .opencode/strray/config.json, .opencode/strray/features.json, .opencode/strray/integrations.json +25 more

- **v1.22.44** (521b159)
  30 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +436 more

- **feat: fortress build — 96 processor tests, DI auto-discovery, DocWriteGuard, structural inference, processor consolidation** (6fc30f8)
  441 files: .opencode/activity-report.json, .strray/config.json, .strray/integrations.json, dist/enforcement/enforcer-tools.js, dist/enforcement/enforcer-tools.js.map +90 more

- **fix: remove circular self-dep, delete 375 lines dead code, append-only docs, version sync script, upgrade stubs** (69ce596)
  95 files: .githooks/pre-commit, .husky/pre-commit, .opencode/strray/codex.json, .opencode/strray/config.json, .opencode/strray/features.json +29 more

- **docs: deep reflection — the day 0xray learned to talk (5400 words)** (75e1a93)
  34 files: docs/reflections/deep/the-day-0xray-learned-to-talk-saga-2026-04-29.md

- **v1.22.43** (c3ec0b7)
  1 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/commands/pre-commit-introspection.sh +245 more

- **v1.22.42** (54cc57f)
  250 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +284 more

- **v1.22.41** (9aa06c6)
  289 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +263 more

- **v1.22.40: auto-discovery - drop a BaseProcessor file in implementations/ and it registers automatically (10 tests)** (81f18c6)
  268 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +346 more

- **v1.22.39: version bump for publish** (0e730bf)
  351 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/commands/pre-commit-introspection.sh +235 more

- **chore: sync .strray** (1b32155)
  240 files: .strray/config.json, .strray/integrations.json

- **v1.22.38: processor extraction complete** (50be108)
  2 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/commands/pre-commit-introspection.sh +237 more

- **chore: rebuild dist v1.22.37** (4d1035b)
  242 files: dist/AGENTS.md, dist/CHANGELOG.md, dist/analytics/routing-refiner.js, dist/core/boot-orchestrator.js, dist/core/features-config.js +47 more

- **v1.22.37: sync** (82ad29f)
  52 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/commands/pre-commit-introspection.sh +185 more

- **v1.22.36: processor extraction complete, dist rebuilt** (d27069c)
  190 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/commands/pre-commit-introspection.sh +237 more

- **v1.22.35: rebuild dist, version sync** (615b16d)
  242 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/commands/pre-commit-introspection.sh +246 more

- **v1.22.34: extract 24 inline execute methods from processor-manager into standalone BaseProcessor files (1836→823 lines)** (ce3893a)
  251 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +342 more

- **v1.22.32: sync version for next development cycle** (b90315d)
  347 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +193 more

- **v1.22.31: processor registry pattern, auto-reflection generation, report formatter fixes, 36 new tests (2569 total)** (2d71dbf)
  198 files: .opencode/activity-report.json, .opencode/strray/test-count.json, .strray/test-count.json, CHANGELOG.md, README.md +164 more

- **chore: update activity logs and test results** (dcb5bf0)
  169 files: .opencode/activity-report.json, logs/framework/activity-report.json, logs/framework/pattern-metrics.json, logs/framework/routing-outcomes.json, node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json

- **release: v1.22.29** (dd35041)
  5 files: package.json

- **feat: wire post-processors into CI/CD pipeline, SEO optimize READMEs, fix UVM patterns** (83561ad)
  1 files: .opencode/.strrayrc.json, .opencode/AGENTS-consumer.md, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md +378 more

- **release: v1.22.28** (0d7660f)
  383 files: package.json

- **chore: release tweet format guide + wire into release script** (dd92906)
  1 files: .opencode/activity-report.json, logs/framework/activity-report.json, logs/framework/pattern-metrics.json, logs/framework/routing-outcomes.json, node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json +5 more

- **release: v1.22.27** (576c7f7)
  10 files: package.json

- **chore: version sync 1.22.27** (ba0e28f)
  1 files: .opencode/activity-report.json, .strray/config.json, .strray/integrations.json, dist/CHANGELOG.md, docs/reflections/deep/hermes-openclaw-plugin-journey-2026-04-28.md +5 more

- **release: v1.22.26** (cf995a7)
  10 files: package.json

- **release: v1.22.25 - OpenClaw client handshake fix, E2E tests** (2ad3227)
  1 files: .opencode/.strrayrc.json, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/core/boot-orchestrator.js +181 more

- **release: v1.22.24 - OpenClaw compilation fix** (f3cd8cc)
  186 files: .opencode/.strrayrc.json, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/core/boot-orchestrator.js +170 more

- **release: v1.22.23** (7c51236)
  175 files: .opencode/.strrayrc.json, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/core/boot-orchestrator.js, .opencode/core/features-config.js +168 more

- **release: v1.22.22 - OpenClaw TypeScript compilation fix, integration test scripts** (3bcbb89)
  173 files: .ci-reports/ci-all-report-2026-04-27T18-40-52.json, .ci-reports/ci-all-report-2026-04-27T18-42-49.json, .ci-reports/ci-all-report-2026-04-27T18-43-55.json, .opencode/activity-report.json, .strray/state/state.json +55 more

- **release: v1.22.21** (5ba01dd)
  60 files: package.json

- **release: v1.22.20** (e9df0f8)
  1 files: package.json

- **release: v1.22.19** (47b6d55)
  1 files: package.json

- **fix: add validate script and hooks to dist/scripts, include mcps registry in build** (fc05945)
  1 files: .opencode/activity-report.json, CHANGELOG.md, backups/version-manager-backup-2026-04-27T18-01-55-152Z/CHANGELOG.md, dist/CHANGELOG.md, dist/scripts/pre-command +8 more

- **fix: add mcps directory to build, fix MCP registry path resolution** (c17ca67)
  13 files: .opencode/activity-report.json, CHANGELOG.md, backups/version-manager-backup-2026-04-27T17-52-08-348Z/CHANGELOG.md, dist/CHANGELOG.md, dist/cli/commands/mcp-install.d.ts.map +10 more

- **chore: sync dist/CHANGELOG.md for v1.22.16** (95470d6)
  15 files: dist/CHANGELOG.md

- **fix: postinstall Hermes detection fixes for v1.22.16** (02e958b)
  1 files: .opencode/activity-report.json, AGENTS.md, CHANGELOG.md, backups/version-manager-backup-2026-04-27T17-46-13-311Z/CHANGELOG.md, backups/version-manager-backup-2026-04-27T17-46-28-511Z/CHANGELOG.md +10 more

- **chore: prepare v1.22.15 release** (b8b7e17)
  15 files: .strray/features.json, .strray/state/state.json, CHANGELOG.md, backups/version-manager-backup-2026-04-27T16-51-01-119Z/CHANGELOG.md, backups/version-manager-backup-2026-04-27T16-51-41-356Z/CHANGELOG.md +8 more

- **feat: add Nudge Watchdog for stuck AI pattern detection** (f923265)
  13 files: .opencode/activity-report.json, .opencode/strray/features.json, .strray/state/state.json, AGENTS.md, dist/AGENTS.md +15 more

- **fix: opencode.json now replaces 0xRay agents, keeps other settings** (d9a9694)
  20 files: scripts/node/postinstall.cjs

- **fix: add smart merge for opencode.json on npm install** (0f73ead)
  1 files: scripts/node/postinstall.cjs

- **docs: update MCP commands with setup instructions** (2b362d3)
  1 files: .ci-reports/ci-all-report-2026-04-22T13-13-22.json, .opencode/activity-report.json, .opencode/package-lock.json, .opencode/package.json, .opencode/strray/features.json +38 more

- **docs: remove duplicate sections from system-design** (b548bdf)
  43 files: docs/system-design.md

- **docs: consolidate duplicate 'What is 0xRay' sections** (4afb17c)
  1 files: docs/system-design.md

- **docs: add honest 'what is 0xRay' assessment** (00c1fd4)
  1 files: docs/system-design.md

- **docs: add honest differentiation section to system-design** (174afe0)
  1 files: docs/system-design.md

- **docs: update system-design with full diagram v1.22.14** (7ea1d35)
  1 files: docs/system-design.md

- **chore: add mcp commands to CLI** (3db119f)
  1 files: dist/cli/index.js, dist/cli/index.js.map

- **feat: add community MCP registry and mcp:install command** (d0f45a8)
  2 files: docs/system-design.md, src/cli/commands/mcp-install.ts, src/cli/index.ts, src/mcps/registry.json

- **feat: comprehensive validation + context-aware reflection hook** (194a0e6)
  4 files: docs/reflections/context-warning-2026-04-22-145546.md, scripts/hooks/pre-command, scripts/hooks/pre-command.mjs, scripts/hooks/run-hook.js, scripts/mjs/test-consumer-readiness.mjs +19 more

- **release: v1.22.14** (353538c)
  24 files: package.json

- **feat: deprecate enforcer/orchestrator, add voting/metrics/security systems** (0a73bcd)
  1 files: .gitignore, AGENTS.md, README.md, dist/AGENTS.md, dist/README.md +192 more

- **docs: clarify plugin execution path in code comments** (b87c2a4)
  197 files: .opencode/activity-report.json, .strray/profiles/performance-report-1776288662801.json, .strray/profiles/performance-report-1776288723894.json, .strray/profiles/performance-report-1776288726394.json, .strray/profiles/performance-report-1776288726398.json +376 more

- **fix: memory leaks, ES6 imports, production readiness** (f0f8793)
  381 files: .opencode/activity-report.json, .strray/profiles/performance-report-1776281823930.json, .strray/profiles/performance-report-1776281826472.json, .strray/profiles/performance-report-1776281826474.json, .strray/profiles/performance-report-1776281826486.json +357 more

- **chore: update .gitignore with temp files** (9435b17)
  362 files: .strray/profiles/performance-report-1776280324027.json, .strray/profiles/performance-report-1776280326570.json, .strray/profiles/performance-report-1776280326571.json, .strray/profiles/performance-report-1776280326583.json, .strray/profiles/performance-report-1776280326664.json +54 more

- **chore: cleanup dead code and temp files** (a347168)
  59 files: .gitignore, .strray/profiles/performance-report-1776279424004.json, .strray/profiles/performance-report-1776279426547.json, .strray/profiles/performance-report-1776279426548.json, .strray/profiles/performance-report-1776279426562.json +158 more

- **feat: production-ready MCPs, complete documentation, fixed pipeline tests** (6f62a5c)
  163 files: .opencode/.strrayrc.json, .opencode/activity-report.json, .opencode/codex.codex, .opencode/command/dependency-audit.md, .opencode/core/boot-orchestrator.js +1860 more

- **refactor: cleanup dead modules, archive unused docs, update all docs to match code** (3bb55c6)
  1865 files: .opencode/activity-report.json, .strray/features.json, .strray/profiles/performance-report-1776130444666.json, .strray/profiles/performance-report-1776130450177.json, .strray/profiles/performance-report-1776130450314.json +3843 more

- **fix: kernel-routing pipeline test inputs, complete all 22 pipelines** (6d0a7ce)
  3848 files: docs/reflections/any-type-elimination-journey.md, src/__tests__/pipeline/test-kernel-routing-pipeline.mjs

- **fix: pipeline runner cwd, ESM require, missing processors, version config** (4475482)
  2 files: src/__tests__/pipeline/run-all-pipelines.mjs, src/__tests__/pipeline/test-enforcement-pipeline.mjs, src/__tests__/pipeline/test-test-auto-creation-pipeline.mjs, src/core/framework-logger.ts, src/processors/implementations/coverage-analysis-processor.ts +1 more

- **refactor: eliminate any types, add proper TypeScript interfaces** (d88c37e)
  6 files: package.json, src/agents/types.ts, src/analytics/consent-manager.ts, src/analytics/emerging-pattern-detector.ts, src/architect/architect-tools.ts +86 more

- **release: v1.22.12** (474b82c)
  91 files: package.json

- **fix: dead module cleanup, agent naming alignment, delegation path repair, type safety** (103b6f4)
  1 files: .opencode/activity-report.json, .opencode/agents/architect.yml, .opencode/agents/bug-triage-specialist.yml, .opencode/agents/code-reviewer.yml, .opencode/agents/heremes-agent.yml +57 more

- **release: v1.22.11** (0e73dca)
  62 files: package.json, src/circuit-breaker/circuit-breaker.ts, src/infrastructure/iac-validator.ts, src/infrastructure/schemas/cloud-schemas.ts, src/integrations/hermes-agent/__init__.py +22 more

- **fix: remove community skills from context scanning, fix skill-install destination** (f78a7b9)
  27 files: .opencode/core/activity-logger.d.ts, .opencode/core/activity-logger.d.ts.map, .opencode/core/activity-logger.js, .opencode/core/activity-logger.js.map, .opencode/core/adaptive-kernel.d.ts +4797 more

- **fix: defer heavy constructor work to explicit start() in 3 modules** (73b19fb)
  4802 files: ci-test-env/node_modules/strray-ai/dist/core/boot-orchestrator.d.ts, ci-test-env/node_modules/strray-ai/dist/core/boot-orchestrator.d.ts.map, ci-test-env/node_modules/strray-ai/dist/core/boot-orchestrator.js, ci-test-env/node_modules/strray-ai/dist/core/boot-orchestrator.js.map, ci-test-env/node_modules/strray-ai/dist/performance/performance-budget-enforcer.d.ts +35 more

- **fix: remove auto-start timer from SessionCleanupManager constructor** (412b00c)
  40 files: ci-test-env/node_modules/strray-ai/dist/core/boot-orchestrator.d.ts.map, ci-test-env/node_modules/strray-ai/dist/core/boot-orchestrator.js, ci-test-env/node_modules/strray-ai/dist/core/boot-orchestrator.js.map, ci-test-env/node_modules/strray-ai/dist/session/session-cleanup-manager.d.ts, ci-test-env/node_modules/strray-ai/dist/session/session-cleanup-manager.d.ts.map +20 more

- **fix: add missing mode:subagent to 7 strray agent entries in opencode.json** (978679d)
  25 files: opencode.json

- **deploy: sync built artifacts** (adeaa2c)
  1 files: ci-test-env/node_modules/strray-ai/dist/performance/performance-budget-enforcer.d.ts, ci-test-env/node_modules/strray-ai/dist/performance/performance-budget-enforcer.d.ts.map, ci-test-env/node_modules/strray-ai/dist/performance/performance-budget-enforcer.js, ci-test-env/node_modules/strray-ai/dist/performance/performance-budget-enforcer.js.map, ci-test-env/node_modules/strray-ai/dist/security/security-hardening-system.d.ts +11 more

- **build: rebuild after memory leak fixes** (d625aa6)
  16 files: dist/performance/performance-budget-enforcer.d.ts, dist/performance/performance-budget-enforcer.d.ts.map, dist/performance/performance-budget-enforcer.js, dist/performance/performance-budget-enforcer.js.map, dist/security/security-hardening-system.d.ts +3 more

- **fix: eliminate .bind(this) memory leaks in 2 EventEmitter subclasses** (bb9c412)
  8 files: src/performance/performance-budget-enforcer.ts, src/security/security-hardening-system.ts

- **deploy: sync built artifacts** (63d73ea)
  2 files: ci-test-env/node_modules/strray-ai/dist/mcps/enforcer-tools.server.d.ts, ci-test-env/node_modules/strray-ai/dist/mcps/enforcer-tools.server.d.ts.map, ci-test-env/node_modules/strray-ai/dist/mcps/enforcer-tools.server.js, ci-test-env/node_modules/strray-ai/dist/mcps/enforcer-tools.server.js.map, ci-test-env/node_modules/strray-ai/dist/processors/processor-manager.d.ts.map +9 more

- **build: rebuild after security wiring** (5fab671)
  14 files: dist/mcps/enforcer-tools.server.d.ts, dist/mcps/enforcer-tools.server.d.ts.map, dist/mcps/enforcer-tools.server.js, dist/mcps/enforcer-tools.server.js.map, dist/processors/processor-manager.d.ts.map +2 more

- **feat: wire prompt-security-validator into processor pipeline, add security-scan MCP tool** (d0b5148)
  7 files: src/mcps/enforcer-tools.server.ts, src/processors/processor-manager.ts

- **deploy: sync built artifacts** (bb18e21)
  2 files: ci-test-env/node_modules/strray-ai/dist/cli/index.js, ci-test-env/node_modules/strray-ai/dist/cli/index.js.map, ci-test-env/node_modules/strray-ai/dist/core/boot-orchestrator.d.ts.map, ci-test-env/node_modules/strray-ai/dist/core/boot-orchestrator.js, ci-test-env/node_modules/strray-ai/dist/core/boot-orchestrator.js.map +5 more

- **build: rebuild after junk deletion and profiler wiring** (b3086f9)
  10 files: dist/cli/index.js, dist/cli/index.js.map, dist/core/boot-orchestrator.d.ts.map, dist/core/boot-orchestrator.js, dist/core/boot-orchestrator.js.map

- **fix: delete 3 junk files, wire advanced-profiler and analytics CLI commands** (9d412c3)
  5 files: src/__tests__/unit/analytics/anonymization-engine.test.ts, src/analytics/anonymization-engine.ts, src/cli/index.ts, src/core/boot-orchestrator.ts, src/utils/another-test.ts +1 more

- **deploy: sync built artifacts to installed copies** (7e31719)
  6 files: ci-test-env/node_modules/strray-ai/dist/AGENTS.md, ci-test-env/node_modules/strray-ai/dist/CHANGELOG.md, ci-test-env/node_modules/strray-ai/dist/LICENSE, ci-test-env/node_modules/strray-ai/dist/README.md, ci-test-env/node_modules/strray-ai/dist/agents/architect.js +1556 more

- **build: rebuild after timer fix, stub removal, logger buffer** (c36bae6)
  1561 files: dist/agents/index.d.ts, dist/agents/index.d.ts.map, dist/agents/index.js, dist/agents/index.js.map, dist/agents/registry.d.ts +79 more

- **chore: buffered I/O for framework logger, update logs and baselines** (8a3b774)
  84 files: .gitignore, .opencode/activity-report.json, logs/framework/activity-report.json, logs/framework/dead-module-analysis-2026-04-11.md, logs/framework/pattern-metrics.json +2 more

- **chore: remove 17 hallucinated enterprise stubs and dead modules (-7500 lines)** (05c8965)
  7 files: src/__tests__/performance/enterprise-performance-tests.ts, src/__tests__/performance/performance-system.test.ts, src/integrations/core/strray-integration.ts, src/monitoring/activity-log-writer.ts, src/monitoring/advanced-monitor.ts +13 more

- **fix: defer timer auto-start to explicit start() calls in 6 modules** (98b75a3)
  18 files: src/core/boot-orchestrator.ts, src/core/framework-logger.ts, src/monitoring/advanced-profiler.ts, src/orchestrator/agent-spawn-governor.ts, src/orchestrator/enhanced-multi-agent-orchestrator.ts +1 more

- **chore: delete 10 dead processor implementations, 2 dead integration clusters** (e8ad208)
  6 files: src/integrations/hermes-agent/__init__.py, src/integrations/hermes-agent/after-install.md, src/integrations/hermes-agent/bridge.mjs, src/integrations/hermes-agent/conftest.py, src/integrations/hermes-agent/hermes-agent-integration.ts +26 more

- **chore: delete 11 dead barrel files, fix metrics-endpoint import** (8991709)
  31 files: src/analytics/index.ts, src/hooks/index.ts, src/integrations/hermes-agent/index.ts, src/integrations/openclaw/index.ts, src/mcps/connection/index.ts +7 more

- **feat: wire up 7 MCP servers, delete 3 dead modules (-2896 lines)** (0f3e9df)
  12 files: opencode.json, src/circuit-breaker/circuit-breaker.ts, src/infrastructure/iac-validator.ts, src/infrastructure/schemas/cloud-schemas.ts, src/jobs/job-correlation-fix.ts +5 more

- **feat: agent registry single source of truth - fix 12 broken agents** (0f71c41)
  10 files: .opencode/strray/routing-mappings.json, .strray/routing-mappings.json, docs/reflections/agent-registry-architecture-analysis-2026-04-11.md, src/__tests__/integration/agent-registry-integration.test.ts, src/__tests__/pipeline/run-all-pipelines.mjs +11 more

- **fix: harden API key auth, type globalThis, remove console.log from production** (da3e041)
  16 files: src/__tests__/integration/e2e-orchestration-flow.test.ts, src/architect/architectural-integrity.ts, src/cli/server.ts, src/core/strray-activation.ts, src/integrations/openclaw/config.ts +8 more

## Files Added

*(none)*

## Files Modified

*(none)*

## Patterns Observed

- Bug fixes present — stability improvement
- Refactoring detected — architectural debt being addressed
- Version bumps/releases present — release cadence active

## Key Decisions

- Fix: fix: align governance client field names with Dynamo response (solarResonance -> solarIsotopicResonance, relax evaluate validation)
- Fix: docs: add deep journey reflection on Grok CLI MCP stability and publish pipeline fixes
- Fix: docs: add deep journey reflection on double-dist fix and Dynamo governance pipeline
- Fix: fix: update tests for new resolveFrameworkPaths behavior + deflake inference-e2e
- Fix: fix: bump self-dependency to ^1.22.64, add node_modules/ to .gitignore
- Fix: fix: eliminate dist/dist/ build corruption at source — remove hardcoded ../../dist/ fallback paths, use import.meta.url resolution, disable stale source maps, add prebuild clean
- Fix: fix: add Streamable HTTP transport to governance + skill-invocation MCP servers for Grok CLI compatibility
- Fix: fix: robust entry-point detection for Grok stdio MCP startup — use fileURLToPath + path.resolve
- Fix: test(grok): fix E2E plugin path — validate project-root .grok/plugins/strray-ai/ (matches postinstall + OpenCode parity)
- Fix: fix: resolve tsc errors, duplicate KEEP, vortexVolume default, and consumer runner pack capture
- Fix: test(consumer): unified E2E gate + fixes for Hermes and OpenClaw
- Fix: fix(governance): re-apply full analyze_proposal support + real MCP transport on clean branch
- Structural change: fix: replace console.log with frameworkLogger in governance-client; propagate SolarGovernanceVoteResult through inference cycle
- Structural change: refactor: complete governance client refactor — callTool proxy, evaluateGovernance route, remove dead code
- Structural change: refactor: use confidenceAdjustment numeric threshold instead of solarActivityLevel string for recommendation logic
- Removal: Revert "remove solar enhancement overlay — endpoint already consumes NOAA GOES natively via dynamo___evaluate_governance"
- Removal: remove solar enhancement overlay — endpoint already consumes NOAA GOES natively via dynamo___evaluate_governance
- Fix: fix: increase opencode spawn timeout from 60s to 300s to prevent premature timeouts during agent voting
- Fix: fix: initialize external governance in inference:run CLI command for two-oscillator governance
- Fix: fix: two-oscillator governance — trust endpoint decision, remove local confidence override
- Structural change: refactor(config): source-of-truth pipeline — src/opencode/ → .opencode/
- Fix: fix: singleton + state management to prevent recursive agent spawning
- Fix: fix: add centralized OpenCode spawn gate to prevent all recursive agent spawning
- Fix: fix: disable auto-spawning of opencode agents to prevent runaway processes
- Fix: Address: Bug: fix: increase timeout for processor auto-discovery tests to prevent flak... (112x)
- Removal: feat: wire 3 orphaned features + add tests + remove empty api-gateway
- Fix: feat: wire apply phase via MCP routing + fix e2e tests (41/41 PASS)
- Fix: fix: remove unused imports and any type from processor-manager.interfaces.test.ts (processor-test-rules ESLint)
- Fix: fix: address all open bugs (#29-32, #34) and prevent noise PRs from inference cycle
- Fix: fix: remove enforcer references from integration test, add fetch-depth:0 for e2e git tests
- Fix: fix: triage and fix all GitHub workflow pipelines
- Fix: fix: restore package.json, mcp-install.ts, workflows, and govern-reflection.mjs gutted by 84dae31b1
- Fix: fix: add npm audit fix to main CI workflow
- Fix: fix: run npm audit fix to resolve moderate vulnerabilities
- Fix: fix: remove duplicate case undefined in mcp-install.ts (lint error)
- Fix: chore: trigger ci-cd-monitor with force_fix=true
- Fix: fix: make trace-context more robust + fix ESM issues in govern-reflection
- Fix: fix: agent registry cleanup — remove skill-only entries, delete deprecated agents
- Fix: fix: agent export naming + single-architect governance
- Fix: fix: complete inference-cycle.ts — all fixes applied.
- Fix: fix: guard inference:run for StringRay internal use only
- Fix: fix: governance pipeline — force flag, skipDeployVerify default, deploy failure handling
- Fix: fix: increase timeout for processor auto-discovery tests to prevent flaky failures
- Fix: fix: inference processor double-joining absolute path created bogus Users/ dir
- Removal: chore: remove 92 build artifacts (.d.ts, .d.ts.map) from .opencode git tracking, add to .gitignore
- Fix: chore: rebuild dist after path fix
- Fix: fix: point opencode plugin/mcps to paths that actually exist in published package
- Fix: fix: remove circular self-dep, delete 375 lines dead code, append-only docs, version sync script, upgrade stubs
- Extraction: v1.22.38: processor extraction complete
- Extraction: v1.22.36: processor extraction complete, dist rebuilt
- Extraction: v1.22.34: extract 24 inline execute methods from processor-manager into standalone BaseProcessor files (1836→823 lines)
- Fix: v1.22.31: processor registry pattern, auto-reflection generation, report formatter fixes, 36 new tests (2569 total)
- Fix: feat: wire post-processors into CI/CD pipeline, SEO optimize READMEs, fix UVM patterns
- Fix: release: v1.22.25 - OpenClaw client handshake fix, E2E tests
- Fix: release: v1.22.24 - OpenClaw compilation fix
- Fix: release: v1.22.22 - OpenClaw TypeScript compilation fix, integration test scripts
- Fix: fix: add validate script and hooks to dist/scripts, include mcps registry in build
- Fix: fix: add mcps directory to build, fix MCP registry path resolution
- Fix: fix: postinstall Hermes detection fixes for v1.22.16
- Structural change: fix: opencode.json now replaces 0xRay agents, keeps other settings
- Fix: fix: add smart merge for opencode.json on npm install
- Removal: docs: remove duplicate sections from system-design
- Fix: fix: memory leaks, ES6 imports, production readiness
- Fix: feat: production-ready MCPs, complete documentation, fixed pipeline tests
- Structural change: refactor: cleanup dead modules, archive unused docs, update all docs to match code
- Fix: fix: kernel-routing pipeline test inputs, complete all 22 pipelines
- Fix: fix: pipeline runner cwd, ESM require, missing processors, version config
- Structural change: refactor: eliminate any types, add proper TypeScript interfaces
- Fix: fix: dead module cleanup, agent naming alignment, delegation path repair, type safety
- Fix: fix: remove community skills from context scanning, fix skill-install destination
- Fix: fix: defer heavy constructor work to explicit start() in 3 modules
- Fix: fix: remove auto-start timer from SessionCleanupManager constructor
- Fix: fix: add missing mode:subagent to 7 strray agent entries in opencode.json
- Fix: build: rebuild after memory leak fixes
- Fix: fix: eliminate .bind(this) memory leaks in 2 EventEmitter subclasses
- Fix: fix: delete 3 junk files, wire advanced-profiler and analytics CLI commands
- Fix: build: rebuild after timer fix, stub removal, logger buffer
- Removal: chore: remove 17 hallucinated enterprise stubs and dead modules (-7500 lines)
- Fix: fix: defer timer auto-start to explicit start() calls in 6 modules
- Removal: chore: delete 10 dead processor implementations, 2 dead integration clusters
- Fix: chore: delete 11 dead barrel files, fix metrics-endpoint import
- Removal: feat: wire up 7 MCP servers, delete 3 dead modules (-2896 lines)
- Fix: feat: agent registry single source of truth - fix 12 broken agents
- Fix: fix: harden API key auth, type globalThis, remove console.log from production

## Inference Notes

- Active development session: 196 commits across 0 areas

---
*Generated by StorytellingTriggerProcessor — commit cadence — 2026-06-02T14:05:34.185Z*