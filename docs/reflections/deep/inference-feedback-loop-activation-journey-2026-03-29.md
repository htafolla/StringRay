# Deep Reflection: The Dead Kitchen
## inference-feedback-loop-activation — PR #14

---

It started with a simple question: "run the tools and eval their usefulness."

What I found was a fully equipped industrial kitchen — stoves, ovens, prep stations, ingredients, a 3,000-line recipe book — with no plates to serve on and no dining room. The food was being cooked, plated, and then thrown directly into the trash.

---

## The Kitchen

0xRay has this massive analytics stack. 15 files in `src/analytics/`. An outcome tracker that persists to disk. A pattern learning engine with 383 lines of real logic. An emerging pattern detector doing actual clustering. A routing refiner generating 575 lines of optimization suggestions. A routing performance analyzer. A prompt pattern analyzer. A pattern performance tracker. All of it wired internally, all of it doing real work, all of it producing output that went absolutely nowhere.

I started by mapping everything. Every file that touched inference, calibration, tuning, or the kernel. The subagents fanned out — one reading kernel code, one auditing CLI commands, me running the actual tools. `npx strray-ai inference:tuner --run-once` printed "Tuning cycle complete" and did nothing. `npx strray-ai inference:improve` loaded 0 routing outcomes. `npx strray-ai calibrate` — doesn't exist. `analytics:daily` — dead file reference. `strray-analytics` bin — dead file reference.

The kernel was alive but not learning. It ran pattern matching against 9 Fatal Assumptions and 8 Bug Cascade Patterns, could block tasks and flag issues, but its `learn()` method wrote to `this.patterns` — a Map that was never populated. The router was a `.d.ts` type definition. The actual implementation had been refactored away. 48 keyword mappings, 374 keywords, 24 agents in routing-mappings.json, and nothing at runtime to consume them.

The predictive analytics module was 11 lines. It returned null.

---

## The One-Line Fix That Changes Everything

Here's the thing that got me. The inference tuner had a method called `addKeywordMapping()`. It took four parameters — keyword, agent, skill, confidence — and returned false. Always. That was it. The entire tuning pipeline ran end-to-end: it loaded outcomes, analyzed patterns, generated suggestions from the routing refiner, called `suggestMappingsFromPatterns()`, iterated through the suggestions, called `addKeywordMapping()` for each one, and then... nothing. Every single suggestion hit the `return false` wall.

The fix was 150 lines of write-back logic. Read routing-mappings.json. Check for conflicts (keyword already mapped to a different agent). If it's the same agent, boost confidence. If it's a new keyword for an existing agent/skill combo, append it. If it's genuinely new, create a new mapping entry. Write back to disk.

That one change — making `addKeywordMapping()` actually do something — activates the entire 3,000-line analytics pipeline as a learning system. The outcome tracker collects routing results. The pattern learning engine analyzes them. The routing refiner generates optimization suggestions. The inference tuner applies them to routing-mappings.json. Next time routing happens, it uses the updated mappings. Rinse, repeat.

It went from a one-way observability pipe to a closed feedback loop.

---

## The Codex Error That Wasn't

One of the first things I noticed running tests was the codex-1 duplicate registration error, firing 5 times per test run. The error message was clean: "Rule with ID 'codex-1' already exists in registry." The fix seemed obvious — make `addRule()` idempotent. But I wanted to understand *why* it was happening before I fixed it.

The `RuleEnforcer` constructor calls `initializeRules()` synchronously, which registers hardcoded rules. Then it calls `loadAsyncRules()` fire-and-forget (no await). That async loader uses a `LoaderOrchestrator` which spins up a `CodexLoader`, an `AgentTriageLoader`, a `ProcessorLoader`, and an `AgentsMdValidationLoader`. The `CodexLoader` reads `.opencode/strray/codex.json` and converts 60 codex terms into `RuleDefinition` objects, each with ID `codex-${key}`. Then the orchestrator calls `this.addRule(rule)` for each one.

The singleton `ruleEnforcer` at the bottom of rule-enforcer.ts triggers this once. But the async loading is fire-and-forget, and the RuleRegistry throws on duplicates. If anything causes the enforcer to be instantiated twice — a test that creates a fresh instance after the singleton exists, a hot-reload, a module re-import — the async loader from the first instantiation might still be running when the second instantiation starts registering the same codex rules. The race condition.

Making `addRule()` idempotent was the right fix. Not because the error was complex, but because the semantics of "register this rule" should be "ensure this rule exists with this definition" — not "fail if someone already registered something with this ID." The test suite had two tests asserting that duplicates should throw. I rewrote them to assert idempotent behavior. Because the old behavior was a bug masquerading as a feature.

---

## The Router Is a Ghost

The `task-skill-router.d.ts` is a 180-line type definition file. It defines `routeTask()`, `RoutingResult`, `RoutingOptions`, the whole interface. But the `.ts` implementation was refactored away at some point. Only the type definition survives.

Meanwhile, `strray/routing-mappings.json` has 48 keyword mappings. The `agent-delegator.ts` has a `determineAgents()` method that does... none of that. It uses hardcoded if/else chains. If operation is "security", push security-auditor. If operation is "review", push code-reviewer. If operation is "design", push architect. If complexity is multi-agent and risk is critical, push security-auditor. It's a decision tree hard-baked into the code.

I didn't fix the router. That's a bigger piece of work — it needs a real implementation that consumes the routing-mappings.json at runtime. What I did instead was add a feedback layer: when the top agent from the hardcoded logic has confidence below 0.85, the delegator now consults `predictiveAnalytics.predictSync()` to see if historical outcomes suggest a better agent. It's a band-aid on top of a hardcoded system, but it's a band-aid that actually uses real data.

---

## The Predictive Analytics That Wasn't

The original `predictive-analytics.ts` was 11 lines. An interface, a function signature, `return null`. That's it.

I replaced it with 190 lines. The `predict()` method loads outcomes from disk, groups them by agent, calculates keyword overlap between the current task description and historical descriptions, and picks the agent with the best weighted score (70% keyword overlap + 30% historical success rate). The `predictOptimalAgent()` method returns the agent with the highest success rate among those with at least 3 samples. I also added `predictSync()` — the same logic but operating on in-memory data without a disk reload — because the agent-delegator needed it in a synchronous context.

The predictive analytics won't be very useful until there's actual routing data flowing through the system. Right now there are 4 test outcomes in `routing-outcomes.json`. You need real usage to generate the pattern data that makes predictions meaningful. But the infrastructure is ready. Once the feedback loop starts running — outcomes get recorded, patterns get analyzed, refinements get written back — the predictions will get better with every cycle.

---

## The Kernel That Couldn't Learn

The kernel is interesting. It's actually running in production — 4 consumers import it (orchestrator, agent-delegator, regression-analysis, CLI). It pattern-matches against 9 Fatal Assumptions and 8 Bug Cascade Patterns. It can block tasks (P7 Release Readiness) and trigger deeper analysis.

But `learn()` was writing to `this.patterns`, a Map that was never populated by anything. The fix: make `learn()` iterate `this.assumptions` and `this.cascades` — the Maps that actually hold data. If an assumption's triggers match the input, increment its confidence by 0.05 (capped at 1.0). If a cascade's patterns are referenced, same thing. And decay: assumptions not matched in the current input lose 0.02 confidence per cycle (floor 0.1).

It's a simple reinforcement signal. Match more → higher confidence. Match less → decay. The kernel is now actually learning from the tasks it analyzes. It won't transform routing overnight, but it's the beginning of a signal that can feed back into the broader analytics pipeline.

---

## What Got Cut

I planned to hook the inference tuner into the Hermes plugin lifecycle — trigger a tuning cycle every N tool calls. I deferred it. The Hermes plugin is a Python bridge that talks to 0xRay via subprocess calls. Adding a `npx strray-ai inference:tuner --run-once` shell-out on every 50th tool call would work, but it's heavy and the CLI already exists for manual runs. The framework-side feedback loop is the critical piece. The plugin-side automation can come later when we have real data to work with.

---

## The Dead Code

I deleted the `kernel/` standalone package. 10 files — a bytecode VM, pattern docs, its own package.json. Zero imports from `src/`. It was a proof-of-concept or an earlier iteration that got superseded by `src/core/kernel-patterns.ts` but never cleaned up.

I removed `strray-analytics` from the bin section and `analytics:daily` from scripts in package.json. Both pointed to `dist/scripts/analytics/daily-routing-analysis.js` — a file that doesn't exist. These were ghosts from a cleanup that happened on master (the big 28K-line deletion I saw in the git pull) but the package.json references weren't cleaned up until now.

---

## The Data Quality Problem

The outcome tracker's `getPromptData()` method — which converts outcomes into data points for pattern analysis — was returning `complexity: 0` and `keywords: []` for every single outcome. Hardcoded. With a comment: "Would need to be calculated from prompt."

So all this beautiful analytics infrastructure — the pattern learning engine, the emerging pattern detector, the routing performance analyzer — was operating on data where every outcome had the same complexity (zero) and no keywords. The pattern analysis was comparing identical feature vectors. It's like trying to train a vision model where every image is pure black.

The fix was trivial: complexity = `Math.min(100, Math.floor(description.length / 5))`, keywords = unique words > 3 chars, max 10. Not sophisticated, but it's actual signal. The difference between a 10-word bug report and a 200-word architectural design will now show up as different complexity scores. The keywords will actually vary between tasks.

---

## What This Means

Before this PR, 0xRay had a sophisticated analytics system that was purely observational. It watched. It recorded. It analyzed. But it couldn't change anything. The routing refiner generated suggestions that nobody read. The pattern learning engine detected drift that nobody acted on. The inference tuner ran cycles that produced no output.

After this PR, there's a closed loop:

1. Tasks get routed to agents (hardcoded, but routing happens)
2. Outcomes get recorded (success/failure, complexity, keywords)
3. Pattern performance tracker detects drift
4. Routing refiner generates optimization suggestions
5. Inference tuner applies suggestions to routing-mappings.json
6. Predictive analytics uses historical data to suggest better routing
7. Agent delegator consults predictions when confidence is low
8. Kernel learns from task patterns, adjusts assumption confidence

Steps 1-8 form a cycle. The system improves itself. Slowly at first — it needs data — but the mechanism exists now. The kitchen has plates. The dining room is open.

The first few tuning cycles won't do much. There aren't enough outcomes yet. But every task that flows through the system adds one more data point. Every tuning cycle has slightly more signal to work with. The confidence scores get more calibrated. The keyword mappings get more refined. The predictions get more accurate.

This is how autonomous systems should work. Not with big-bang rewrites, but by finding the one wire that's disconnected and plugging it in.

---

*PR #14 — 18 files changed, 489 insertions, 3399 deletions. 127 test files, 2,2199 tests, all green.*
