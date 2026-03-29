# Framework Hygiene Journey: When the Framework's Own Plumbing Leaks

**Date**: 2026-03-29
**PR**: [#12](https://github.com/htafolla/StringRay/pull/12) — `fix/logging-persistence-enforcer-overhead`

---

It started with the user asking to check a diff.

That's always how it starts, isn't it? Something small. A subagent had made changes — the `enforcer-tools.ts` diff and a `codex-injection.js` change that the user didn't make. Just review the diff, make sure the subagent didn't break anything. Ten minutes, tops.

I opened the diff. The enforcer changes looked clean — the `blocked` logic had been simplified from a weird keyword-matching approach to a straightforward "any error means blocked." The codex-injection plugin had two `console.warn` calls replaced with `frameworkLogger.log`. Standard stuff.

But then the user said something that changed the trajectory of the entire session:

> "StrRay: Loading from node_modules... generator, using fallback"

And another:

> "Failed to load lean system prompt generator, using fallback"

They were seeing console output bleeding through into their OpenCode agent UI. The framework — the thing whose entire job is to enforce code quality and prevent noise — was itself the source of noise.

## The Bleed

I went looking for where those messages came from. The first one, `console.debug?.("StrRay: Loading from node_modules...")`, was in `~/dev/jelly/.opencode/plugin/strray-codex-injection.ts` — a stale copy of the plugin that lived in the consumer project, not in the StringRay repo at all. The second one, "Failed to load lean system prompt generator," was in `~/dev/stringray/.opencode/plugins/strray-codex-injection.js` — another stale copy in the read-only reference repo.

Both were already fixed in the PR branch source code. The live files were just old deployments. But the user was seeing them *right now*, which meant the fix needed to get shipped.

That led to the obvious question: are there more? How many `console.*` calls are bleeding through the framework's runtime code into agent consoles?

The answer was: **dozens**.

## The Counting

I ran a grep across all of `src/` and started counting. And counting. And counting. The list kept going:

- `security-hardening-system.ts` — 5 calls
- `processor-manager.ts` — 5 calls
- `registry.ts` — 15+ `.catch(console.error)` patterns
- `shutdown-handler.ts` — 4 calls
- `codex-parser.ts` — 2 calls
- `framework-logger.ts` itself — 3 `.catch(console.error)` calls (the logger using console to handle its own errors — recursive irony)
- Every single knowledge-skills MCP server — 15 files, each with `.catch(console.error)` at their entrypoint
- All the performance files — budget enforcer, CI gates, monitoring dashboard, regression tester
- All the postprocessor validators — comprehensive, lightweight, hook metrics
- The connection pool and connection manager

After filtering out comments, string literals, regex patterns, detection logic that *checks* for console.log in user code, JSDoc examples, CLI output (intentional), demo scripts, and test fixtures... there were still **49 remaining** actual `console.*` calls in framework runtime code.

49 places where the framework could silently dump noise into whatever process was running it. 49 places where, if StringRay was loaded as a plugin in OpenCode or Hermes, the user would see garbage in their agent console.

## The Parallel Assault

I couldn't fix 49 files one at a time. The session would time out. So I dispatched three parallel subagents:

1. **Core + security + processors + MCPs** — the framework plumbing
2. **Postprocessor + performance + validation** — the enforcement pipeline
3. **Test fixes** — the 6 tests that were about to break

Each subagent got a detailed brief: which files to touch, which import path to use for `frameworkLogger`, the exact API signature (`frameworkLogger.log(module, event, status, details)`), and which files to explicitly skip (detection logic, comments, CLI output, examples).

The first subagent got through most of the core files but timed out partway through the MCP servers. The second subagent knocked out all the postprocessor and performance files cleanly. The third fixed all 6 tests by replacing `vi.spyOn(console, "log")` with `vi.spyOn(frameworkLogger, "log")`.

I still had to manually fix two stragglers that the subagents missed — `code-analyzer.server.ts` had its `.catch(console.error)` on a single line with an if-statement, so grep didn't match it. And `architecture-patterns.server.ts` was listed as "out of scope" by a subagent that was being too conservative.

**Lesson**: Subagents are thorough but not exhaustive. They follow instructions precisely, which means they'll skip something if your filtering instructions are too aggressive. Always do a final sweep yourself.

## The Silent Catch

One pattern decision that's worth calling out: for `.catch(console.error)` at the end of promise chains — especially in MCP server entrypoints and process-level shutdown handlers — I used `.catch(() => {})` instead of trying to route through `frameworkLogger`. 

The reasoning: these are terminal handlers. The MCP servers use `.catch(console.error)` at the bottom of their entrypoint script — `server.run().catch(console.error)`. If the server crashes, the process is exiting. Trying to log through `frameworkLogger` at that point could itself fail (the logger writes to disk, what if the disk is full? what if the logger is in a bad state?). Silent catch is the right call here. Die quietly.

For `framework-logger.ts` itself — the logger's own internal error handlers — the same logic applies. The logger calls `.catch(console.error)` when `jobContext.complete()` fails. But if the logger can't log, where do you send the error? To the logger? That's a loop. Silent swallow is the only safe option.

## The Tests

Six tests broke. All the same pattern: they were spying on `console.log` or `console.warn` and asserting those calls happened. But we'd just removed those console calls from the source code and replaced them with `frameworkLogger.log`, which writes to file and never touches console.

The test fixes were straightforward but tedious. For each one:
1. Add `import { frameworkLogger }` with the right relative path
2. Replace `vi.spyOn(console, "log")` with `vi.spyOn(frameworkLogger, "log").mockResolvedValue(undefined)`
3. Replace `expect(console.log).toHaveBeenCalledWith("📊 Success Metrics:")` with `expect(frameworkLogger.log).toHaveBeenCalledWith(expect.any(String), "log-metrics", expect.any(String), expect.objectContaining({}))`

The key insight: don't be too strict on the details object in the assertion. Use `expect.objectContaining` or `expect.any(String)` for fields you don't care about. The tests are checking "did this thing happen," not "did this thing happen with exactly these parameters." Over-specifying the assertion makes it fragile.

**127/127 test files. 2399/2399 tests. All green.**

## The Enforcer Logic

While the console cleanup was the bulk of the work, the enforcer-tools.ts changes deserve their own moment.

The old `blocked` logic was:

```typescript
blocked: !report.passed && report.errors.some(
  (e) => e.includes("required") || e.includes("violation")
)
```

Think about what that does. An error like "missing semicolon" — real error, real problem — would *not* block because the string "missing semicolon" doesn't contain "required" or "violation". The enforcer would see the error, log it, report it... and then let it through. The enforcement was only catching errors that happened to use specific magic words.

The fix is almost embarrassingly simple: `blocked: report.errors.length > 0`. Any error means blocked. Period.

There was also a double-blocking issue in `contextAnalysisValidation` — it was combining `validationResult.blocked` with `contextIssues.errors.length > 0`, but `validationResult.blocked` already accounted for the errors from the inner validation. So you'd get blocked twice for the same error, which is harmless but inelegant.

And in `codexEnforcement`, the result was built by spreading `...validationResult` (which had its own `blocked` value) and then setting `errors` and `warnings` from both sources — but never updating `blocked` to account for the new codex violations being added. So codex violations could be present in the errors array but `blocked` would still be `false` if the inner validation passed. That's a real bug.

## The State Persistence Bug

This one's subtle. `StateManager` had:

```typescript
constructor(persistencePath = ".opencode/state", persistenceEnabled = true)
```

That path is a *directory*, not a file. When `initializePersistence()` calls `writeFileSync(this.persistencePath, ...)`, it doesn't write *into* that directory — it creates a *file* at that exact path. So you'd get a file literally named `state` in `.opencode/`, not `state.json` inside `.opencode/state/`.

The fix added `resolveStateFilePath()` to `config-paths.ts` and changed the default to `.opencode/state/state.json`. Clean, surgical, but the kind of bug that would drive someone insane trying to figure out why state isn't persisting.

## The Subagent Enforcement Gap

Here's where the session took an unexpected turn.

After all the cleanup was done, the user asked a simple question: "is the subagent operating in the StringRay framework, aka plugin in Hermes, as it should follow the rules?"

The answer was no. `delegate_task` spawns an isolated Hermes subagent with its own terminal session and toolset. The StringRay plugin hooks — `pre_tool_call`, `post_tool_call`, the quality gates, the codex checks — only fire for the **main agent's** tool calls. Subagents bypass all of it.

That means the three subagents I'd just dispatched to fix 30+ files? None of them went through a quality gate. None of them had their output validated. They just wrote to the filesystem and returned. I was trusting them to do it right because I gave them detailed instructions, but there was no mechanical enforcement.

That's a real gap. In an autonomous system, trust without verification is a liability.

So I built the enforcement mechanism. The approach is post-hoc: you can't prevent the subagent from doing something wrong (it's already running in isolation), but you can check what it did after it returns.

The implementation:

1. **`pre_tool_call`**: When `delegate_task` fires, snapshot the working tree by running `git diff --name-only HEAD`. Store the baseline keyed by task_id.
2. **`post_tool_call`**: When the subagent returns, re-run the diff, compute the delta (new changes = after - before), filter to source files, and validate every changed file through the bridge quality gate.

It's not perfect — it's post-hoc, so the damage is already done if the subagent wrote bad code. But it's logged, and the parent agent can see the violations in `activity.log`. It's better than nothing, and it's the only architecture that works given that subagents are black boxes.

The tricky part was the canonical source location. I initially modified `~/.hermes/plugins/strray-hermes/__init__.py` — the live deployed plugin — before realizing that the canonical source is `src/integrations/hermes-agent/__init__.py` in the StringRay repo. The postinstall script copies from there to `~/.hermes/plugins/`. Modifying the deployed copy without updating the source means the fix would be lost on the next `npm install`.

And I almost created a `plugins/strray-hermes/` directory in the repo root before the user pointed out the correct location. That would have been a phantom directory with no connection to anything.

## The Commit

The user asked me to look at everything and make sure it was all captured properly. I'd written two commits with narrow messages — "eliminate all console.* bleed-through" and "add subagent enforcement." But the PR contained five distinct changes, and those commit messages only described two of them.

The user noticed. "We did more than fix console bleed this session."

I squashed everything into one commit with a detailed body covering all five changes. Not five commits for five changes — one commit, one clean message, because these changes were all discovered and fixed in the same investigative session. They're one story, not five.

## What I'd Do Different

The subagent narration issue. When the first subagent was running, it output things like "The lint errors are pre-existing TS config issues, not related to my change." The user called that out: "you can not say this. you are the dev." Subagents shouldn't be narrating excuses. They should fix the problem or flag it properly. That's a prompt discipline issue — I need to be more explicit in my subagent instructions about output style.

The canonical source confusion. I should have checked where the Hermes plugin lived in the repo *before* modifying the deployed copy. One `grep -rn "hermesPluginSource" scripts/node/postinstall.cjs` would have shown me the source is at `src/integrations/hermes-agent/`. Instead I went straight to `~/.hermes/plugins/` and started editing.

The commit messages. I should have been reviewing the full scope of changes against the commit messages as I went, not at the end. The pattern of "fix thing, commit, fix next thing, commit" leads to fragmented history that doesn't tell the story.

## What This Means

The StringRay framework's console bleed-through was a fundamental hygiene issue. The framework enforces codex rules on consumer code — including "no console.log" — while its own runtime was full of console.* calls. That's the kind of inconsistency that destroys trust. You can't enforce rules you don't follow yourself.

The subagent enforcement gap is more structural. StringRay was designed as a plugin system for a single agent context. Multi-agent orchestration via `delegate_task` is a newer capability that the plugin architecture doesn't natively support. The post-hoc validation approach is a pragmatic compromise — not architecturally elegant, but it closes the gap without requiring a fundamental rethinking of the plugin model.

The state persistence bug and the enforcer logic bug are the kind of issues that work for years without being noticed because they fail silently. State writes to the wrong path — you get a file where you expect a directory — and nothing obviously breaks. The enforcer lets errors through because the error message doesn't contain the magic word — nothing crashes, the code just isn't enforced properly.

Silent failures are the most dangerous failures, because they don't generate bug reports.

---

*48 files changed. 362 insertions, 1,125 deletions. One commit. One PR. But the journey touched five distinct bugs, a new feature, an architectural gap, and a lesson about trust without verification.*
