# The Hook That Wouldn't Fire: A Deep Reflection on StringRay v1.13.2

## Prologue: The Silence That Should Have Been a Symphony

March 19, 2026. The logs were silent. Not the silence of victory—the kind of silence that haunts you at 2 AM when you know something should be working but isn't.

For two months, the StringRay plugin hooks had been broken. Two months of wondering why the activity logs stayed empty. Two months of assuming everything was fine because the framework itself was working—agents were spawning, tasks were completing, the orchestrator was orchestrating.

But the hooks—the hooks were mute.

This is the story of what we found, how we fixed it, and the profound lessons about invisible infrastructure that every software developer should know.

---

## Part I: The Mystery of the Silent Hooks

### When Everything Works, Nothing Works

The first sign of trouble was subtle. Activity reports showed activity, but the detailed tool logs were empty. Users would see:

```
✅ 25 agents configured
✅ 44 skills available  
✅ Codex enforcement active
```

But beneath the surface, the hooks that were supposed to log every tool execution—every bash command, every file read, every edit—were silent.

We had built a sophisticated routing system, an intelligent orchestrator, a complete multi-agent framework. But we had forgotten to check if the plugin was actually *receiving* events.

### The False Security of "It Works in Dev"

In development mode, with the plugin manually loaded, everything worked. The hooks fired. The logs populated. The routing happened. We were testing against our development environment, not the consumer experience.

This is a classic trap: **developing for your IDE, not your user.**

When we packaged the library for npm, the plugin lived in `dist/plugin/`. But the postinstall script was copying configuration from `.opencode/`—where the plugin didn't exist yet. The plugin was in a different directory entirely.

```
Package root:     node_modules/strray-ai/.opencode/plugins/  ❌ (doesn't exist)
Actual plugin:    node_modules/strray-ai/dist/plugin/        ✅ (exists)
Consumer target:  .opencode/plugins/                          ❌ (empty)
```

The plugin was trapped in the distribution directory, never making it to the consumer's `.opencode/plugins/` folder.

### The Module Isolation Problem

Even if the plugin had been copied, we would have hit the next wall: module isolation.

The plugin was being `require()`'d by OpenCode, but it was trying to `import()` ES modules from the framework. In Node.js, this is a minefield. `import.meta.url` breaks when a file is `require()`'d. Dynamic imports fail in unexpected ways. The module system that worked beautifully in development became a labyrinth of `ERR_REQUIRE_ESM` errors.

Our first attempts to fix this:
- ❌ Using `import.meta.url` to resolve paths
- ❌ Trying to dynamically `import()` framework modules
- ❌ Assuming the plugin could access the same filesystem as the main code

All failures.

---

## Part II: The Breakthrough - Debug Logging

### The Power of Brute Force Visibility

The turning point came when we stopped trying to be clever and started being visible.

We added synchronous, direct-to-file logging at the very start of the hook handler:

```javascript
"tool.execute.before": async (input, output) => {
  // DEBUG: Immediate sync log to verify hook is firing
  logToolActivity(directory, "start", "DEBUG-BEFORE-HOOK", { tool: input.tool });
  // ... rest of logic
}
```

Not pretty. Not elegant. But **visible**.

And suddenly, we saw it: the hook WAS firing. The plugin WAS receiving events. But `args` was `undefined`.

### The Realization: Wrong Level of Abstraction

```javascript
// What we were receiving:
BEFORE HOOK INPUT: tool=bash, args=undefined
```

OpenCode was calling the hooks, but it wasn't passing the tool arguments. We had built routing logic that depended on `args.content`, `args.filePath`, and `args.command`—none of which existed at the tool hook level.

This was our second major insight: **we were routing at the wrong level of abstraction.**

Tool hooks (`tool.execute.before`, `tool.execute.after`) are low-level. They see `bash`, `read`, `write`—not the user's intent. The user's intent—"@architect design an API"—is available at the prompt level, in the `experimental.chat.system.transform` hook.

We had built a Formula 1 car and were trying to race it in a parking garage.

---

## Part III: The Postinstall Odyssey

### The Meta-Problem: Installation Itself

While we were debugging hooks, a parallel crisis was unfolding: the installation process.

The postinstall script was supposed to:
1. Copy `.opencode/` directory to the consumer's project
2. Set up symlinks for `dist/` and `scripts/`
3. Configure everything automatically

But it wasn't copying the plugin. And it was overwriting user configurations. And it was failing silently.

### Smart Merging: The Solution We Should Have Started With

The breakthrough came with the realization that **not all files should be treated equally**:

**System files** (init.sh, agents/, commands/) → Copy fresh (always need latest)
**User configs** (features.json, routing-mappings.json) → Merge (preserve customizations)
**Development artifacts** (.strrayrc.json) → Skip (not needed in production)

We implemented deep merging:

```javascript
function deepMerge(src, dest) {
  // src = new defaults
  // dest = user settings (dest wins)
  if (typeof src !== 'object' || src === null) return dest !== undefined ? dest : src;
  // ... merge logic
}
```

This preserved user customizations while adding new framework capabilities. A user who had tuned their complexity thresholds wouldn't lose those settings, but they'd still get new agent mappings.

### The Version Synchronization War

Then came the version hell.

`package.json` said 1.13.2.
The version manager said 1.10.0.
The plugin header said 1.0.0.
The codex reference said v1.2.0.

Every automated check failed. Every manual sync was forgotten. We were maintaining version numbers in a dozen places, and they were all lying.

**The final solution was radical: remove the versions entirely.**

If you can't maintain it, don't include it. The plugin doesn't need a version in its header. The codex version in a comment doesn't help anyone. The package.json version is the single source of truth—everything else is decoration that becomes technical debt.

---

## Part IV: Philosophical Lessons

### Lesson 1: Invisible Infrastructure Is a Liability

We spent two months not knowing our hooks were broken because:
- The framework kept working (agents still spawned)
- Tests passed (they tested the logic, not the integration)
- No one was looking at the activity logs

**If you don't monitor it, it doesn't exist.**

The most dangerous bugs are the ones that don't cause failures—they just silently don't work.

### Lesson 2: The Consumer Context Is Everything

We tested in development mode. We tested with manual plugin loading. We tested with full source access.

We never tested the actual consumer experience: `npm install strray-ai` in a fresh project.

This is the **context gap** that kills software projects. You build for your environment, not theirs. You test with your data, not theirs. You assume your filesystem, your permissions, your network.

The solution is to **always test the consumer path**. Create a fresh directory. Install the package. See what happens. No shortcuts.

### Lesson 3: Version Numbers Are a Trap

We had versions everywhere:
- Package.json
- Version manager constants
- Plugin headers
- Codex references
- Documentation

And they were all out of sync. The more versions you have, the more lies you tell.

**One version to rule them all.** The package.json version is the truth. Everything else is derived or removed.

### Lesson 4: Smart Defaults, Dumb Visibility

Our final solution was elegantly simple:
- Smart merging for configs (preserve user intent)
- Direct file writes for logs (no module isolation issues)
- Synchronous debug logging (when in doubt, be visible)
- No dynamic imports in the plugin (avoid the require/import minefield)

Sometimes the "dumb" solution—writing to a file directly, logging everything, copying files explicitly—is better than the "smart" solution with dynamic imports and clever abstractions.

---

## Part V: The Technical Implementation

### Prompt-Level Routing (Not Tool-Level)

We moved routing from `tool.execute.before` to `experimental.chat.system.transform`:

```javascript
"experimental.chat.system.transform": async (input, output) => {
  const userPrompt = String(input.prompt || input.message || input.content || "");
  
  if (userPrompt && featuresConfigLoader) {
    const routingResult = taskSkillRouterInstance.routeTask(userPrompt, {
      source: "prompt",
    });
    
    // Add routing context to system prompt
    leanPrompt += `\n\n🎯 Recommended Agent: @${routingResult.agent}\n`;
    leanPrompt += `📊 Confidence: ${Math.round(routingResult.confidence * 100)}%\n`;
  }
  // ...
}
```

Now routing happens based on the user's actual prompt—"design a REST API" routes to architect, "security audit" routes to security-auditor—instead of based on tool names like "bash" and "read".

### The Postinstall Renaissance

The enhanced postinstall script:

```javascript
// Files that should be MERGED (not overwritten)
const MERGE_FILES = [
  'strray/features.json',
  'strray/routing-mappings.json', 
  'enforcer-config.json'
];

// Copy with smart merging
if (MERGE_FILES.includes(relPath)) {
  mergeJsonFile(srcPath, destPath, relPath);
} else {
  fs.copyFileSync(srcPath, destPath);
}

// Copy plugin separately (it's in dist/, not .opencode/)
const pluginSource = path.join(packageRoot, 'dist', 'plugin', 'strray-codex-injection.js');
const pluginDest = path.join(targetDir, '.opencode', 'plugins', 'strray-codex-injection.js');
```

### Activity Logging That Actually Works

Instead of trying to import framework modules (which fails due to module isolation), we write directly:

```javascript
function logToolActivity(directory, event, tool, args) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [plugin-${process.pid}] [agent] tool-${event} - INFO | {"tool":"${tool}","args":${JSON.stringify(args)}}\n`;
  
  const logPath = path.join(process.cwd(), "logs", "framework", "plugin-tool-events.log");
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, logEntry);
}
```

No imports. No dependencies. No module isolation issues. Just write to the file.

---

## Part VI: The Release

### March 19, 2026: v1.13.2

After weeks of debugging, testing, rebuilding, and synchronizing versions, we published v1.13.2.

What changed:
- ✅ Plugin hooks now fire correctly
- ✅ Plugin is copied to the right location on install
- ✅ User configs are merged, not overwritten
- ✅ Prompt-level routing works
- ✅ Activity logging is visible
- ✅ One-command install: `npm install strray-ai`
- ✅ No hardcoded version numbers

### The Test

We created a fresh test directory:
```bash
mkdir /tmp/fresh-test
npm init -y
npm install /path/to/strray-ai-1.13.2.tgz
```

And checked:
```bash
ls .opencode/plugins/  # ✅ strray-codex-injection.js
ls .opencode/agents/   # ✅ 30 agent configs
ls .opencode/strray/   # ✅ Config files merged
```

Everything worked.

---

## Epilogue: What We Learned About Software Development

### The Obvious Is Often Invisible

The plugin wasn't being copied. This seems obvious in hindsight. But when you're deep in the code, worrying about module systems and hook implementations, you miss the forest for the trees.

**Step back. Check the obvious.**

### Silence Is Not Golden

Silent failures are worse than crashes. A crash tells you something is wrong. Silence just... doesn't work. And you might never know.

**Add visibility. Log everything. Make the invisible visible.**

### The Consumer Context Is a Different Universe

Your development environment has:
- Full source access
- All dependencies installed
- Your specific filesystem layout
- Your permissions and environment variables

The consumer has:
- A tarball from npm
- A postinstall script
- A blank project
- Unknown environment

**Never assume the consumer context matches yours.**

### Technical Debt Is a Choice

Every version number we added was technical debt. Every clever abstraction was technical debt. Every "we'll sync this later" was technical debt.

We chose to remove them. To simplify. To make the code dumber but more maintainable.

**Simplicity is a feature.**

---

## Final Thoughts

StringRay v1.13.2 isn't just a bug fix release. It's a lesson in humility. A reminder that the most sophisticated system is useless if it doesn't work for the user. A testament to the value of visibility, simplicity, and testing the actual consumer experience.

The hooks are firing now. The logs are populating. The routing is working at the right level of abstraction.

But more importantly, we learned how to see the invisible. How to question our assumptions. How to build not just for our development environment, but for the thousands of developers who will install this package and expect it to just work.

That's the real victory. Not the code. The understanding.

---

**The hook that wouldn't fire taught us more than any working system ever could.**

*March 19, 2026*  
*StringRay Team*  
*v1.13.2 - The Release That Almost Wasn't*
