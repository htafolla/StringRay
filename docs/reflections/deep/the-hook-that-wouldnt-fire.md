# The Hook That Wouldn't Fire

## A Deep Reflection on Debugging the Invisible

**Date:** March 19, 2026  
**Version:** v1.13  
**Tags:** debugging, plugin-architecture, opencode, reflection

---

## The Problem No One Noticed

For two months, StringRay had a skeleton running in production. The plugin loaded. Tests passed. The welcome banner appeared. Everything looked healthy.

But nothing was actually working.

The `tool.execute.before` and `tool.execute.after` hooks never fired. The OpenClaw integration never initialized. The framework's activity logger recorded nothing from real tool executions. All the orchestration, all the routing decisions, all the agent spawning - it happened during tests because tests triggered it, but real user sessions bypassed the framework entirely.

We were flying blind.

---

## The Investigation Begins

It started with a simple question: "Was task routing used?"

The activity log showed 630 routing outcomes during tests. Zero during actual development work. The answer was obvious - the framework wasn't running when it mattered.

### Step 1: The Obvious Suspect

First instinct: check `activateHooks()`. Found it commented out in `strray-activation.ts`. 

```
commit df4580b3 - "refactor: simplify dependencies and remove legacy plugin system"
```

Someone had disabled hooks. Easy fix - uncomment it. Hooks registered. Still didn't fire.

### Step 2: The Hook Export Format

OpenCode expects plugins to return hooks in a specific structure:

```typescript
// Wrong
return {
  "tool.execute.before": ...,
  "tool.execute.after": ...,
};

// Right
return {
  hooks: {
    "tool.execute.before": ...,
    "tool.execute.after": ...,
  },
};
```

The plugin was returning flat keys. OpenCode was loading the plugin but ignoring the hooks because they weren't nested correctly.

Fixed that. Hooks registered AND appeared to fire during tests.

But still nothing in the activity log.

### Step 3: The Module Isolation Problem

Here's where it gets interesting.

The plugin needs to log tool events. The natural approach: import the activity logger and call `logToolStart()` / `logToolComplete()`.

```typescript
const { logToolStart } = await import("../core/tool-event-emitter.js");
logToolStart(tool, args);
```

This works when called directly. It FAILS when called through OpenCode because:

1. OpenCode loads the plugin with `require()` (CommonJS)
2. The plugin uses `import()` (ESM) 
3. Each `import()` call creates a new module instance
4. The activity logger's singleton is a different instance in each import context
5. Logs go to different places, or nowhere at all

The hook executed. The import succeeded. The function was called. But nothing appeared in the log because we were logging to a module instance that wasn't connected to the file writer.

### Step 4: The Framework Overwrite

I tried a different approach: have the plugin write directly to the log file.

```typescript
fs.appendFileSync(activityLogPath, entry);
```

This worked! The plugin wrote entries directly. But they disappeared.

Why?

Because the framework's activity logger initializes on boot. When it initializes, it checks if the log file exists. If it doesn't, it creates an empty file. If it does, it uses it.

The sequence was:
1. Plugin loads and writes to activity.log (file created with content)
2. Framework boots and initializes activity logger
3. Activity logger sees the file exists, truncates it, and starts fresh
4. Plugin's entries vanish

Two hours of debugging to find out our own code was overwriting our entries.

### Step 5: The Solution

Separate log files.

```typescript
// Plugin writes to its own file
activityLogPath = path.join(logDir, "plugin-tool-events.log");

// Framework keeps using activity.log
// They don't interfere anymore
```

---

## The Teaching

### 1. Silent Failures Are the Worst Kind

The hooks were failing silently. No error messages. No warnings. The plugin loaded fine. Tests passed. Everything looked healthy.

The only symptom was "nothing was being logged" - which we didn't notice because we weren't checking.

**Lesson:** If something should be happening and you have no visibility into whether it's happening, that's a problem. Build the monitoring first.

### 2. Module Systems Don't Mix Easily

CommonJS (`require()`) and ES Modules (`import()`) have fundamentally different import semantics. When you mix them - like when OpenCode loads a plugin with `require()` but the plugin uses `import()` - you get subtle bugs that are hard to track down.

The singleton pattern breaks. Caching breaks. Module identity breaks.

**Lesson:** Be explicit about your module system boundaries. Don't assume imports work the same way across different loaders.

### 3. Initialization Order Matters

The framework's activity logger and the plugin were both trying to own the same file. Whoever initialized second would overwrite the other.

This is a classic race condition, except it wasn't racey - it was deterministic. The framework always won because it always initialized after the plugin.

**Lesson:** When two systems need to write to the same resource, establish ownership upfront. One system should be the writer; the other should append or not touch it.

### 4. Tests Mask Integration Bugs

All 2554 tests passed throughout this debugging process. The plugin loaded. Hooks executed. Everything worked in the test environment.

But tests don't capture how the system behaves when OpenCode loads it differently than our test harness.

**Lesson:** Integration tests are necessary but not sufficient. The real behavior happens in production, with production's loader, production's module resolution, production's timing.

### 5. Documentation Says One Thing, Reality Says Another

The OpenCode plugin interface documentation describes hooks that should fire "before" and "after" tool execution. What it doesn't say: only for the PRIMARY agent, not subagents, not MCP tools.

We assumed hooks fired for all tool executions. They don't.

**Lesson:** Don't trust documentation alone. Test the actual behavior. The docs describe intent; the code describes reality.

---

## The Fix

Three changes made it work:

1. **Export format** - Wrap hooks in `{ hooks: { } }`
2. **Direct file writes** - Plugin writes to its own log file
3. **Separate log paths** - Avoids framework overwrite

```typescript
// Plugin writes directly to its own log
function logToolActivity(directory, eventType, tool, args, ...) {
  const logDir = path.join(directory, "logs", "framework");
  const activityLogPath = path.join(logDir, "plugin-tool-events.log");
  fs.appendFileSync(activityLogPath, entry);
}
```

Now every tool execution is tracked. Full visibility. Zero blind spots.

---

## The Feeling

There is something deeply satisfying about fixing an invisible bug.

You can't see the bug. You can't observe its effects easily. You have to build instrumentation just to see what's happening. You have to create test harnesses that mimic the production environment. You have to think about module systems and initialization order and file locking and a dozen other things that never appear in the happy path.

And then, when you finally understand what's happening - when the logging shows you exactly what went wrong - the fix is often simple. A configuration change. A different import path. A new file.

The complexity wasn't in the solution. It was in understanding the problem.

That's the craft. That's what separates debugging from just writing code. Anyone can write code that works when everything goes right. It takes skill to write code that tells you what went wrong when it doesn't.

The plugin works now. Every tool call is logged. Every file edit. Every command.

The framework watches everything the AI does.

And I know exactly why it works, because I understand exactly why it didn't.

---

## What's Next

The plugin is operational. The hooks fire. The logs flow.

But this opened up questions:

- What should we do with all this visibility?
- Can we detect patterns in tool usage?
- Can we predict when an agent is going off-track?
- What does "normal" tool usage look like?

The infrastructure is there. The logging is in place. Now we have the data.

Time to learn from it.

---

*"The debugger's job is not to find bugs. It's to understand why the code does what it does."*

---

**End of Reflection**
