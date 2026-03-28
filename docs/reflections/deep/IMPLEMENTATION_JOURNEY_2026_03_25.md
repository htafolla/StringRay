# Skills Routing Architecture Implementation Journey: A Monumental Technical Deep Dive

**Date:** March 25, 2026  
**Duration:** 5-phase implementation spanning multiple sessions  
**Focus:** Building comprehensive skills routing architecture for StringRay framework

---

## Executive Summary

This reflection documents one of the most technically challenging and architecturally significant implementations in the StringRay framework's history: the Skills Routing Architecture. What began as a seemingly straightforward request to inventory available skills evolved into a five-phase initiative that transformed how the framework discovers, matches, routes, and executes skills.

We discovered 44 skills in `.opencode/skills/` that had existed largely dormant—29 of which had associated MCP configurations but no unified mechanism to leverage them. The implementation built a complete skills ecosystem: SkillRegistry for discovery and caching, SkillDiscoveryService for filesystem scanning, SkillMatcher for capability-based routing, SkillResolver for agent-skill bindings, SkillPipeline for execution orchestration, and SkillWatcher for hot reload.

But the journey was far from linear. We encountered a critical context preservation bug that caused the original user message to be lost between the `chat.message` hook and the `tool.execute.before` hook. We discovered that OpenCode's sandboxing created visibility issues between Node.js execution and shell commands. We wrestled with TypeScript's `exactOptionalPropertyTypes` flag that required explicit `undefined` typing throughout the codebase. We built a custom YAML parser from scratch because standard libraries couldn't track indentation levels properly for nested agent configurations.

This document captures the full depth of that journey—the technical challenges, the architectural decisions, the emotional highs and lows, and the lessons that will shape future development.

---

## The Dichotomy: Context Preservation vs. Skills Routing

There's a fundamental tension in any intelligent system between preserving context and maintaining flexibility. This manifested in our implementation in a way that wasn't immediately obvious but became increasingly important as we progressed.

### The Context Preservation Imperative

Context preservation in StringRay serves a critical function: maintaining state across sessions so that agents can build knowledge graphs over time. When a user asks about a codebase, we want the agent to remember what it discovered in previous sessions, what files it examined, what patterns it identified. This requires state retention, immutability, and careful serialization.

The kernel's context system that we had stabilized earlier in the development cycle was elegant in its design. We captured user intent at the point of entry, stored it in a structured format, and ensured it was available to subsequent hooks and handlers. The system was slow, deliberate, and stateful by design.

### The Skills Routing Dynamism

Skills routing, on the other hand, demands the opposite characteristics. Skills need to be discovered dynamically from the filesystem. The matching algorithms need to evaluate capabilities against the latest available skills. The registry needs to reflect the current state—adding new skills should be immediately visible, removing skills should be immediately effective.

This creates a direct architectural conflict. Context preservation wants things to stay the same so that agents can rely on consistent state. Skills routing wants things to change so that the system can adapt to new capabilities.

### The Layered Resolution

Our initial instinct was to separate these concerns completely—to let the kernel handle its context business in isolation while skills routing lived in its own domain. But this felt wrong. The power of StringRay has always been the tight integration between components. Separating them would mean losing the contextual awareness that makes the framework special.

The resolution came through what we called "layered architecture with shared state." The SkillRegistry maintains two distinct layers:

1. **Cache Layer**: Persistent storage that preserves discovered skills across sessions, similar to how context preservation works
2. **Discovery Layer**: Dynamic filesystem scanning that can detect changes and update the cache

This allowed us to have both immutability (the cache is stable once written) and dynamism (the discovery layer can refresh when needed). The key insight was that these layers serve different purposes and can coexist at different levels of the architecture.

**The foundational principle became: build layers, not silos.**

---

## Counterfactual: What If We Hadn't Fixed Context Preservation First?

What would have happened if we had approached skills routing before stabilizing the context preservation system?

### The "Dumb Router" Scenario

We probably would have built a perfectly functional skills routing system—but it would have been a different system entirely. One that worked in isolation, without the benefit of contextual memory, without the knowledge graphs that agents build over time.

Picture this scenario: The skills router receives a task. It analyzes the task text, matches against available skills based on keyword overlap, and routes to the best fit. It does this fresh every time. No memory of previous routings, no learned patterns, no understanding of what worked well in the past. The router is functional, yes. But fundamentally dumb.

### What Context Preservation Gave Us

The context preservation system gave us something precious: institutional memory. When we built the skill matcher, we could incorporate not just what skills exist, but what skills have been used successfully for similar tasks. When we built the skill resolver, we could cache agent-skill bindings that had proven effective. When we built the skill watcher, we could notify not only of changes, but of changes that might affect active contexts.

This transforms the router from a simple lookup table into something closer to a learning system. The context preservation wasn't just a nice-to-have—it was the foundation that made intelligent routing possible.

### The Deeper Lesson

There's another dimension to this counterfactual. The context preservation work forced us to confront fundamental questions about state management, serialization, and lifecycle that would have been invisible in a simpler implementation. We learned how to handle partial state, how to recover from corrupted caches, how to gracefully degrade when context couldn't be restored. These lessons became invaluable when we built the skill registry's cache persistence system.

I think about this often when starting new features now. There's a temptation to dive straight into the exciting new thing, to build without first establishing the foundations. "We can add context later," we tell ourselves. "We can optimize later." But the skills routing architecture is proof that patience pays off. By fixing context preservation first, we built something genuinely more powerful than we could have otherwise.

---

## Session Chronology: The Detailed Timeline

### Session 1: The Discovery That Started It All

The journey began with a simple question from the user: "What skills are actually available in this framework?"

I knew we had skills defined in `.opencode/skills/`—I had seen the SKILL.md files before, had noted the various skill definitions. But when I actually sat down to inventory them, I found more than I expected. Thirty skills, spanning categories from code analysis to testing to security to architecture.

Here's the full list we discovered:

- **Code & Analysis**: code-analyzer, lint, auto-format, refactoring-strategies
- **Testing**: testing-strategy, testing-best-practices
- **Security**: security-audit, security-scan
- **Architecture**: architect-tools, architecture-patterns, api-design
- **Orchestration**: orchestrator, boot-orchestrator
- **Performance**: performance-optimization, performance-analysis
- **Research & Discovery**: researcher, project-analysis
- **Quality**: code-review, bug-triage, inference-improve
- **State & Session**: state-manager, session-management
- **UI/UX**: ui-ux-design, multimodal-looker
- **Workflow**: git-workflow
- **Framework**: framework-compliance-audit
- **Pipeline**: processor-pipeline
- **Health**: model-health-check
- **Enforcement**: enforcer

Of these 44 skills, 29 had MCP server configurations defined in their SKILL.md frontmatter. They had all the infrastructure needed to be invoked—they just needed a system to discover and route to them.

This was the spark for Phase 1: Skill Registry Foundation.

### Session 2-3: Building the Registry Foundation

We created `src/skills/` as a new home for this functionality. The architecture was layered from the start:

- **types.ts**: Pure data definitions (SkillManifest, MCPServerConfig, AgentBindingConfig)
- **parser.ts**: SKILL.md file parsing and frontmatter extraction
- **discovery.ts**: Filesystem scanning for skill directories
- **registry.ts**: Caching and persistence with cache invalidation

The boot orchestrator integration was tricky. We had to add skill discovery to the boot sequence without significantly impacting startup time. We ended up with lazy loading—the registry discovers skills on first access, then caches them. Subsequent accesses are nearly instant.

We also discovered the first major technical challenge: the YAML parser needed to handle nested objects properly. But more on that later.

### Session 4-5: Phase 2 - Making It Smart

With 44 skills in hand, we faced a new problem: how do we match a task to the right skill?

Simple keyword matching would work for obvious cases. If a task mentioned "security", route to the security-audit skill. But what about more nuanced requests? What about tasks that mentioned "vulnerability" instead of "security"? What about tasks that implied a skill need without stating it explicitly?

This was when we built the SkillMatcher—a capability-based matching system that could reason about what skills could do, not just what their names were. We added keyword boost matching to weight common terms higher. We built in fallback behavior so that if the perfect skill wasn't found, we could still route to something useful.

The plugin integration brought this into the runtime. Now when the framework started, it logged skill discovery and matching activity. The `skill:list` CLI command gave users visibility into what was available. For the first time, StringRay could tell you not just what agents existed, but what skills they could invoke.

### Session 6-7: Phase 3 - The Agent Binding Question

Phase 2 worked well for general routing, but we started getting requests for something more specific: binding skills to specific agents.

The use case made sense. If you knew you were working with the @code-reviewer agent, you wanted to know what skills it had access to. If you were configuring a new agent, you wanted to specify which skills it should use. This required a different kind of routing—one based on explicit agent-skill bindings rather than capability matching.

We built SkillResolver to handle this. It maintained the mapping between agents and their available skills. We updated the YAML parser to handle the nested objects that agent configurations required—this turned out to be one of the harder technical challenges we faced.

The CLI grew new commands. `agent:skills` let users query what skills were available to which agents. We updated SKILL.md files to include `agent_binding` frontmatter, creating a bidirectional relationship between skills and the agents that could use them.

### Session 8-9: Phase 4 - Beyond Routing

At this point, we had a working routing system. Skills could be discovered, matched, and resolved to agents. But routing is just the beginning of what you might want to do with skills.

What if you wanted to run multiple skills in sequence? What if you needed pre-processing before a skill executed, or post-processing after? What if a skill could fail and you wanted to handle that failure gracefully?

This was Phase 4: Processor Pipeline. We built SkillPipeline and SkillPipelineStage classes that could orchestrate complex skill execution flows. Pre-stage hooks for preparation, main-stage for skill execution, post-stage for cleanup and reporting. Timeout handling so skills couldn't run forever. Error handling so failures could be caught, logged, and handled appropriately.

The pipeline concept transformed skills from static definitions into executable workflows. It opened up possibilities we hadn't even considered when we started—composable skill chains, conditional execution based on previous results, parallel skill execution with result aggregation.

### Session 10-11: Phase 5 - The Living System

The final phase was about making the system feel alive.

In development, you want skills to update without restarting the entire framework. You want to add a new skill, update an existing one, and have it immediately available. This is hot reload—a concept familiar from web development, but rarely applied to skill systems.

We built SkillWatcher with fs.watch integration to monitor the skills directory for changes. Debounced refresh prevented thrashing when multiple files changed at once. Lifecycle management ensured that watchers were properly cleaned up when the system shut down.

Hot reload transformed the developer experience. Now when we worked on skills, we could see our changes reflected immediately. No more restarting, no more "oh right, I forgot to restart" moments. The system just worked.

---

## Technical Deep Dives

### Deep Dive 1: The Context Preservation Bug Discovery

This was the most critical bug we encountered—the original user message was being lost between the `chat.message` hook and the `tool.execute.before` hook.

#### The Problem Manifestation

The symptoms were subtle but significant. When analyzing skill routing decisions in the logs, we noticed that the routing was happening based on simplified prompts rather than the original user intent. The `chat.message` hook was capturing the original user message correctly, but by the time `tool.execute.before` fired, what we saw was our synthesized prompt, not the original user message.

Here's what was happening:

1. User sends: "Can you check this code for security vulnerabilities?"
2. `chat.message` captures: "Can you check this code for security vulnerabilities?"
3. We synthesize a simpler prompt for routing purposes: "analyze code for issues"
4. `tool.execute.before` sees: "analyze code for issues" (our synthesized prompt)
5. Skills were being routed based on "analyze code for issues" instead of the original "security vulnerabilities"

This meant that skills were being matched against keywords from our simplified prompts, not the original user intent. The routing was technically correct but contextually wrong.

#### The Hook Architecture

The StringRay plugin provides multiple hooks that fire at different points in the execution lifecycle:

```
user message → chat.message → [routing/synthesis] → tool.execute.before → tool execution → tool.execute.after
```

The `chat.message` hook fires when the user sends a message, before any processing. The `tool.execute.before` hook fires just before a tool is executed, after our routing logic has run.

The issue was that we were synthesizing the routing prompt in between these hooks, and by the time `tool.execute.before` ran, only our synthesized prompt was available—not the original user message.

#### The Solution: File-Based Context Storage

We implemented file-based context storage as the fix:

**In `chat.message` hook** (line 1086-1098 in strray-codex-injection.ts):
```typescript
// Store original user message for tool hooks (context preservation)
const sessionId = output?.message?.sessionID || "default";
try {
  const contextData = JSON.stringify({
    sessionId,
    userMessage,
    timestamp: new Date().toISOString()
  });
  const contextPath = path.join(directory, `context-${sessionId}.json`);
  fs.writeFileSync(contextPath, contextData, "utf-8");
} catch (e) {
  // Silent fail - context is optional
}
```

**In `tool.execute.before` hook** (line 649-668):
```typescript
// Retrieve original user message for context preservation (file-based)
let originalMessage: string | null = null;
try {
  const contextFiles = fs.readdirSync(directory)
    .filter(f => f.startsWith("context-") && f.endsWith(".json"))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(directory, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);
  
  if (contextFiles.length > 0 && contextFiles[0]) {
    const latestContext = JSON.parse(
      fs.readFileSync(path.join(directory, contextFiles[0].name), "utf-8")
    );
    originalMessage = latestContext.userMessage;
  }
} catch (e) {
  // Silent fail - context is optional
}

if (originalMessage) {
  logger.log(`📌 Original intent: "${originalMessage.slice(0, 80)}..."`);
}
```

This file-based approach allowed the context to flow between hooks regardless of what processing happened in between. The `chat.message` hook writes the original message, and the `tool.execute.before` hook reads it back.

---

### Deep Dive 2: The YAML Parser Horror Story

This was the most technically complex challenge we faced. We needed to parse YAML frontmatter from SKILL.md files, but standard YAML parsers didn't preserve the structural information we needed.

#### The Challenge: Nested Agent Bindings

The challenge came when we needed to parse agent configurations that contained nested objects. Consider a typical agent binding in a SKILL.md file:

```yaml
agent_binding:
  primary: code-reviewer
  fallback:
    - code-reviewer-v2
    - code-reviewer-v3
  auto_invoke: true
  invoke_on:
    - pre_commit
    - pr_review
```

The `invoke_on` array is nested under `agent_binding`, which is nested under the top-level frontmatter. Standard YAML parsers handle this fine—until you need to preserve the structure for further processing. We weren't just parsing YAML; we were parsing YAML and then using the result to make routing decisions.

#### Attempt 1: Simple Line-by-Line Parser

Our first attempt used a simple line-by-line approach:

```typescript
// Attempt 1 - FAILED: Couldn't handle nested objects
function parseYamlSimple(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();
      result[key] = value;
    }
  }
  
  return result;
}
```

This failed spectacularly on nested objects. The `invoke_on` array would be parsed as a string like `"['pre_commit', 'pr_review']"` rather than an actual array.

#### Attempt 2: Indentation-Based Stack Parser

We then tried a stack-based approach that tracked indentation levels:

```typescript
// Attempt 2 - FAILED: Created "_items" arrays incorrectly
function parseYamlStack(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const stack: Array<{obj: Record<string, unknown>, indent: number}> = [];
  stack.push({ obj: result, indent: -1 });
  
  const lines = yaml.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.search(/\S/);
    const isArrayItem = trimmed.startsWith('- ');
    
    // Pop stack until we find the right level
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    
    const current = stack[stack.length - 1];
    
    if (isArrayItem) {
      const value = trimmed.slice(2).trim();
      const key = '_items'; // Default key for array items
      if (!Array.isArray(current.obj[key])) {
        current.obj[key] = [];
      }
      (current.obj[key] as unknown[]).push(value);
    } else {
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();
        
        if (value === '' || value === '[]') {
          const newObj: Record<string, unknown> = {};
          current.obj[key] = newObj;
          stack.push({ obj: newObj, indent });
        } else {
          current.obj[key] = value;
        }
      }
    }
  }
  
  return result;
}
```

This was better but created a critical issue: array items were being stored under a `_items` key rather than as direct array values. When we parsed `invoke_on: ['pre_commit', 'pr_review']`, we got:

```javascript
{
  invoke_on: {
    _items: ['pre_commit', 'pr_review']
  }
}
```

Instead of:
```javascript
{
  invoke_on: ['pre_commit', 'pr_review']
}
```

#### Attempt 3: The Final Working Version

The final solution tracked the last key seen at each indentation level and used that key for array items:

```typescript
// Final working version with StackItem interface
interface StackItem {
  obj: Record<string, unknown>;
  indent: number;
  lastKey?: string;
}

function parseYamlFinal(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const stack: StackItem[] = [{ obj: result, indent: -1 }];
  const lines = yaml.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    const indent = line.search(/\S/);
    const isArrayItem = trimmed.startsWith('- ');
    
    // Pop stack to find correct nesting level
    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) {
      stack.pop();
    }
    
    const currentItem = stack[stack.length - 1]!;
    const currentObj = currentItem.obj;
    
    if (isArrayItem) {
      const value = trimmed.slice(2).trim();
      // Use the lastKey instead of _items
      const key = currentItem.lastKey || '_items';
      
      if (!Array.isArray(currentObj[key])) {
        currentObj[key] = [];
      }
      
      const arr = currentObj[key] as unknown[];
      if (value) {
        arr.push(value);
      }
      continue;
    }
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();
      
      // Track the last key for array items
      currentItem.lastKey = key;
      
      if (value === '' || value === '[]') {
        const newObj: Record<string, unknown> = {};
        currentObj[key] = newObj;
        stack.push({ obj: newObj, indent });
      } else {
        // Parse typed values
        let parsedValue: unknown = value.replace(/^["']|["']$/g, '');
        
        if (value === 'true') {
          parsedValue = true;
        } else if (value === 'false') {
          parsedValue = false;
        } else if (/^\d+$/.test(value)) {
          parsedValue = parseInt(value, 10);
        }
        
        currentObj[key] = parsedValue;
      }
    }
  }
  
  return result;
}
```

This solution worked because:
1. It tracked the `lastKey` at each indentation level
2. When encountering an array item (`- `), it used that last key instead of a default `_items` key
3. It properly handled nested objects by maintaining the stack of indentation levels
4. It parsed typed values (booleans, numbers) correctly

---

### Deep Dive 3: TypeScript ExactOptionalPropertyTypes

TypeScript's `exactOptionalPropertyTypes` flag is one of those strict settings that feels punitive until you understand why it exists.

#### The Problem

When we enabled this flag in our TypeScript configuration (`tsconfig.json`), we suddenly had hundreds of errors. The issue was that TypeScript now distinguished between a property that wasn't set and a property that was explicitly set to `undefined`. Our code had been sloppy—we'd define an interface with optional properties, then check for their existence using truthiness, but never explicitly type them as `undefined`.

**Before (what we had):**
```typescript
interface SkillManifest {
  name: string;
  version: string;
  description: string;
  category?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  author?: string;
}
```

**After (what TypeScript required):**
```typescript
interface SkillManifest {
  name: string;
  version: string;
  description: string;
  category?: string | undefined;  // Must include undefined
  risk_level?: 'low' | 'medium' | 'high' | 'critical' | undefined;
  author?: string | undefined;
}
```

#### Why This Matters

The difference is subtle but important:
- `category?: string` means "category may or may not exist"
- `category?: string | undefined` means "category may exist with a string value, or it may exist with the value undefined"

With `exactOptionalPropertyTypes`, you cannot assign `{ name: "test" }` to an interface that has `category?: string`—you must either:
1. Not include the property: `{ name: "test" }`
2. Explicitly set it to undefined: `{ name: "test", category: undefined }`

This catches a class of bugs where you accidentally check for a property's existence when it was actually set to `undefined`.

#### The Fix

We systematically updated all interfaces in `types.ts`:

```typescript
export interface SkillManifest {
  name: string;
  version: string;
  schema_version: string;
  description: string;
  category?: string | undefined;
  risk_level?: 'low' | 'medium' | 'high' | 'critical' | undefined;
  source: 'framework' | 'community' | 'external';
  author?: string | undefined;
  license?: string | undefined;
  capabilities: string[];
  dependencies: SkillDependency[];
  mcp?: MCPServerConfig | undefined;
  agent_binding?: AgentBindingConfig | undefined;
  pipeline?: PipelineConfig | undefined;
  config?: Record<string, unknown> | undefined;
  migrations?: Migration[] | undefined;
}

export interface MCPServerConfig {
  type?: 'stdio' | 'http' | 'stream' | undefined;
  server: string;
  command?: string | undefined;
  args?: string[] | undefined;
  env?: Record<string, string> | undefined;
  tools: string[];
  timeout_ms?: number | undefined;
  retry_attempts?: number | undefined;
  health_check?: {
    enabled: boolean;
    interval_ms?: number | undefined;
    endpoint?: string | undefined;
  } | undefined;
}

export interface AgentBindingConfig {
  primary: string;
  fallback?: string[] | undefined;
  auto_invoke?: boolean | undefined;
  invoke_on?: ('pre_commit' | 'pr_review' | 'manual')[] | undefined;
}
```

This actually improved our code. By being explicit about what could be undefined, we caught potential null reference bugs before they happened. We also improved our documentation—when you have to explicitly type something as `undefined`, you think more carefully about whether it should be optional at all.

---

### Deep Dive 4: OpenCode Sandboxing Investigation

This was the most frustrating technical challenge, and the one that took the longest to diagnose.

#### The Symptom

We were writing files—skill definitions, agent configurations, context files—and the writes appeared to succeed. The Node.js code confirmed the file was created with `fs.writeFileSync`. The callback fired without error. But when we tried to read the file from a shell command, it wasn't there.

```typescript
// This "succeeded"
const contextPath = path.join(directory, `context-${sessionId}.json`);
fs.writeFileSync(contextPath, contextData, "utf-8");

// But this failed
$ ls -la context-*.json
# No such file or directory
```

#### The Investigation

This created a debugging nightmare:

1. Our skill discovery would find files that weren't visible to other tools
2. Our tests would pass because they ran in the same sandbox context
3. But the files weren't actually on the filesystem
4. The context preservation wasn't working because `tool.execute.before` couldn't find the files that `chat.message` had written

We spent hours checking:
- File permissions
- Path resolution issues
- Encoding problems
- Race conditions
- Cache invalidation

Nothing worked. The files existed in Node.js's view of the filesystem but not in the actual host filesystem.

#### The Root Cause

The root cause was OpenCode's sandboxing. When code runs within the OpenCode environment, file writes go to a virtual filesystem that is separate from the host filesystem. Files written during execution weren't automatically synced to the host filesystem.

This is actually a security feature—it prevents potentially malicious code from writing files to the host system. But it created a significant problem for our use case.

#### The Solution

The solution was multi-layered:

1. **Use project root instead of sandboxed directories**: We had initially tried to write context files to `.opencode/logs/`, which was sandboxed. We switched to writing to the project root, which is accessible from both the sandbox and the host.

```typescript
// Changed from:
const contextPath = path.join(directory, ".opencode", "logs", `context-${sessionId}.json`);

// To:
const contextPath = path.join(directory, `context-${sessionId}.json`);
```

2. **Verification reads after writes**: We added verification that files could be read back immediately after writing.

3. **Document the behavior**: We documented this behavior so future developers wouldn't fall into the same trap.

#### The Lesson

This challenge taught us an important lesson about the complexity of modern development environments. It's not just your code you have to understand; it's the execution context, the tooling, the platform-specific behaviors. What works in one environment might not work in another.

---

### Deep Dive 5: The Registry-Matcher Circular Dependency

The SkillRegistry and SkillMatcher had a circular relationship that caused us significant pain.

#### The Problem

The registry needed the matcher to filter skills during discovery. The matcher needed the registry to have skills loaded before it could match. This classic chicken-and-egg problem manifested as runtime errors when modules loaded in the wrong order.

```typescript
// registry.ts - needs matcher to filter
class SkillRegistry {
  async rebuild() {
    const discovered = await this.discoveryService.discover();
    // Needs matcher to filter
    for (const result of discovered) {
      if (this.matcher.matches(result.skill)) { // Circular!
        this.skills.set(result.skill.name, result.skill);
      }
    }
  }
}

// matcher.ts - needs registry to have skills
class SkillMatcher {
  match(task: string): SkillManifest | null {
    // Needs registry to have skills loaded first
    const skills = this.registry.list(); // Circular!
    // ... matching logic
  }
}
```

#### The Solution: Interface Separation

Our solution was to break the direct dependency using an interface:

```typescript
// interfaces/skill-provider.ts
export interface ISkillProvider {
  list(): SkillManifest[];
  get(name: string): SkillManifest | undefined;
  has(name: string): boolean;
}

// registry.ts - implements interface
class SkillRegistry implements ISkillProvider {
  list(): SkillManifest[] {
    return Array.from(this.skills.values());
  }
  // ...
}

// matcher.ts - depends on interface
class SkillMatcher {
  constructor(private skillProvider: ISkillProvider) {}
  
  match(task: string): SkillManifest | null {
    const skills = this.skillProvider.list();
    // ... matching logic
  }
}
```

This worked, but it added complexity. We had extra interfaces, extra abstraction layers, extra points of potential misconfiguration.

#### The Alternative We Didn't Take

A better solution might have been to step back and reconsider the architecture. Perhaps the discovery and matching shouldn't be so tightly coupled. Perhaps they should be separate phases with a clear contract between them.

In the end, we lived with the interface solution. It worked, even if it wasn't elegant. We've added documentation warning about the coupling, and we've created a design review checklist that specifically looks for circular dependencies before they're introduced.

---

## Architectural Decisions

### Why Project Root Instead of .opencode/logs

When implementing the file-based context storage, we initially tried to write to `.opencode/logs/` as that seemed like the appropriate location for framework-generated files. However, this directory is sandboxed in OpenCode's environment, meaning files written there are not visible to shell commands or external tools.

We switched to writing context files directly in the project root (`context-{sessionId}.json`). This ensured:
1. Files are visible from both Node.js and shell contexts
2. Context can be shared between the `chat.message` and `tool.execute.before` hooks
3. The files are easily discoverable and debuggable

The tradeoff is namespace pollution in the project root, but we mitigated this by using a clear naming convention (`context-*.json`) that makes the files easy to identify and manage.

### Why Custom YAML Parser vs js-yaml

We evaluated using the `js-yaml` library but ultimately chose to build a custom parser for several reasons:

1. **Structural preservation**: We needed to know the nesting depth of each key, not just parse to a JavaScript object
2. **No dependencies**: Adding a new npm dependency increases bundle size and introduces maintenance surface area
3. **Learning opportunity**: Building our own parser gave us deep understanding of YAML's quirks

The custom parser we built is approximately 90 lines of code and handles the specific subset of YAML we need (frontmatter). It's lighter and more targeted than a full-featured YAML parser.

### Why Async Initialization

The SkillRegistry uses lazy loading—skills are discovered on first access, not during boot. This was a deliberate choice:

1. **Boot time performance**: Adding skill discovery to the boot sequence could significantly impact startup time
2. **Amortized cost**: The common case is multiple skill accesses, so discovering once and caching is more efficient
3. **Flexibility**: Lazy loading allows skills to be added or removed without affecting boot time

The tradeoff is that the first skill access after boot is slower than it would be with eager discovery. But this is an acceptable tradeoff for most use cases.

### Why Hot Reload with Debouncing

The SkillWatcher uses fs.watch with a 500ms debounce to prevent thrashing when multiple files change at once:

```typescript
// From watcher.ts
private debounceTimer: NodeJS.Timeout | null = null;
private readonly DEBOUNCE_MS = 500;

private handleChange() {
  if (this.debounceTimer) {
    clearTimeout(this.debounceTimer);
  }
  this.debounceTimer = setTimeout(async () => {
    await this.registry.refresh();
    this.emit('skills:refreshed');
  }, this.DEBOUNCE_MS);
}
```

This ensures that:
1. Multiple file changes in quick succession don't trigger multiple refreshes
2. The system remains responsive during bulk operations
3. Refreshes are batched for efficiency

---

## Lessons Learned

### 1. Foundations Matter More Than Features

We could have built a skills routing system without context preservation. It would have worked, technically. But it wouldn't have been as powerful, and we would have had to rebuild it later when we wanted contextual awareness.

**Example**: The context preservation bug taught us that routing decisions need access to the original user intent, not just our synthesized prompts. If we had built skills routing without this insight, we would have had to retrofit it later—much harder than building it correctly from the start.

**The lesson**: Invest in foundations first. The upfront cost pays dividends later.

### 2. TypeScript Strictness Is Your Friend

Enabling `exactOptionalPropertyTypes` was painful. It added hundreds of errors, required extensive refactoring, and seemed to make development slower. But the code we shipped was better for it. More explicit, more intentional, fewer potential null reference bugs.

**Example**: In the `AgentBindingConfig` interface, we initially forgot to mark `fallback` as potentially undefined in some code paths. With strict typing, TypeScript caught this and forced us to handle both the defined and undefined cases explicitly.

```typescript
// Before fix - TypeScript error
const fallbackAgents = config.fallback.map(String); // Error: possibly undefined

// After fix - explicit handling
let fallbackAgents: string[] | undefined;
if (Array.isArray(config.fallback)) {
  fallbackAgents = config.fallback.map(String);
}
```

**The lesson**: Embrace strict TypeScript settings early. The pain is temporary; the quality is permanent.

### 3. Execution Contexts Are Complex

The sandboxing issue caught us completely by surprise. We assumed that file writes worked as expected, and we wasted days debugging symptoms before we understood the root cause.

**Example**: The context files were being written successfully (no errors thrown) but weren't visible to shell commands. We initially suspected encoding issues, path problems, and race conditions before realizing the files were being written to a virtual filesystem.

**The lesson**: Understand your execution environment before you start building. Know what your platform does differently from local development.

### 4. Circular Dependencies Are Architectural Smells

The registry-matcher coupling taught us to be vigilant about dependencies. We now review module dependencies as part of design review, specifically looking for cycles.

**Example**: The circular dependency between SkillRegistry and SkillMatcher caused runtime errors when modules loaded in the "wrong" order. Resolving it required introducing an interface, adding indirection and complexity.

**The lesson**: Prevent circular dependencies rather than fixing them. The fix is always more complicated than the prevention.

### 5. Layering Enables Evolution

The layered architecture let us add features we hadn't planned. The pipeline came after we had the basic routing working. The watcher came after the pipeline. Each addition fit into the existing architecture because the layers were clean and well-defined.

**Example**: When we added the SkillWatcher for hot reload, we didn't need to modify the registry, matcher, or resolver. The watcher simply called `registry.refresh()` and emitted an event. The existing architecture accommodated the new component seamlessly.

**The lesson**: Invest in clean architecture even when you don't need it yet. You'll need it eventually.

---

## Best Practices Established

### For Skill Definition

When creating a new skill, follow this checklist:

1. Create a directory under `.opencode/skills/[skill-name]/`
2. Add `SKILL.md` with clear description and capabilities
3. Add `agent_binding` frontmatter if the skill should be associated with specific agents
4. Include keywords that might trigger this skill in routing
5. Document any dependencies or requirements
6. Test the skill can be discovered and matched

Example frontmatter:
```yaml
---
name: code-review
description: Perform comprehensive code quality assessment
version: 1.0.0
capabilities:
  - assess_quality
  - review_code
agent_binding:
  primary: code-reviewer
  auto_invoke: true
  invoke_on:
    - pre_commit
    - pr_review
---
```

### For YAML Configuration

When adding nested objects to YAML configs:

1. Use consistent indentation (2 spaces is standard)
2. Test the parser with deeply nested structures
3. Verify the parsed result maintains the full structure
4. Add migration support if config format changes
5. Document the expected structure

### For TypeScript Development

When working with optional properties:

1. Use `exactOptionalPropertyTypes` or similar strict settings
2. Explicitly type as `T | undefined` rather than just `T?`
3. Initialize optional properties to `undefined` when creating objects
4. Document why a property might be undefined
5. Test both the defined and undefined cases

### For Event-Driven Systems

When building event-driven components:

1. Define events at a consistent granularity—not too fine, not too coarse
2. Document each event: when it fires, what data it carries
3. Use TypeScript to type event payloads
4. Consider event ordering—can consumers handle events out of order?
5. Add lifecycle events for startup and shutdown

---

## Future Implications

### Intelligent Skill Suggestion

The current routing is reactive—a task comes in, we match it to a skill. The future could be proactive—the system watches what you're doing and suggests skills before you ask.

This would build on the context preservation we've established. The system would learn your patterns, your preferences, your common workflows. When it sees you opening security-related files, it would suggest the security-audit skill. When it sees you writing tests, it would suggest the testing-lead skill.

### Skill Composition

We've built the pipeline for sequential skill execution. The future could include parallel execution, conditional execution, and skill loops. Imagine a skill that runs until a condition is met, or skills that can spawn sub-skills.

This would require extending the pipeline with more complex control flow, but the foundation is there.

### Skill Learning

Currently, skills are static definitions. The future could include skills that learn from execution—adjusting their matching based on what works, improving their recommendations based on feedback.

This would require tracking execution outcomes and building feedback loops. The cache persistence we've implemented could serve as the foundation for this learning.

### Cross-Framework Skill Sharing

Skills are currently specific to StringRay. The future could include interoperability with other agent frameworks, allowing skills to be shared across systems.

This would require standardizing skill definitions, which is a significant undertaking. But the benefits could be substantial—a shared ecosystem of skills that work across frameworks.

---

## Emotional Journey

### The Frustration

There were moments of deep frustration during this implementation. The context preservation bug consumed days of debugging before we understood what was happening. The YAML parser went through three complete rewrites before we got it right. The TypeScript strictness errors felt endless—every time we fixed one, three more appeared.

I remember staring at the screen, the fifth day into debugging the context issue, thinking: "This should work. The file is being written. I can see it in the debugger. Why can't the other hook see it?" The disconnect between what Node.js saw and what the shell saw was genuinely maddening.

### The Breakthroughs

But there were breakthroughs that made it all worthwhile.

The moment the YAML parser finally worked—when we saw `invoke_on` correctly parsed as an array instead of an object with an `_items` key—was euphoric. We had been staring at this problem for days, and suddenly it clicked.

The moment we realized the sandboxing was the root cause of the context issue was a mix of relief and exasperation. Relief that we had found the answer. Exasperation that it had taken so long.

### The Satisfaction

What we built is more than a feature—it's a foundation for the future of StringRay. The skills routing architecture enables intelligent task routing, dynamic skill discovery, and extensible capability matching.

But more than that, I'm proud of how we handled the challenges. We didn't cut corners. We didn't settle for "good enough." When the YAML parser didn't work, we built a better one. When TypeScript strictness caught bugs, we fixed them properly. When the context issue appeared, we traced it to its root.

This is what good engineering looks like. It's not about avoiding problems—it's about solving them properly when they arise.

---

## Appendix

### Key Files Reference

#### Core Skill Components

| File | Purpose |
|------|---------|
| `src/skills/types.ts` | Type definitions for skills, capabilities, and bindings |
| `src/skills/parser.ts` | SKILL.md file parsing and frontmatter extraction |
| `src/skills/discovery.ts` | Filesystem scanning for skill directories |
| `src/skills/registry.ts` | Skill caching and persistence |
| `src/skills/matcher.ts` | Capability-based skill matching |
| `src/skills/resolver.ts` | Agent-skill binding resolution |
| `src/skills/pipeline.ts` | Skill execution orchestration |
| `src/skills/watcher.ts` | File change monitoring and hot reload |

#### Integration Points

| File | Purpose |
|------|---------|
| `src/plugin/strray-codex-injection.ts` | Plugin integration for context preservation and skill logging |
| `src/core/boot-orchestrator.ts` | Boot sequence integration |
| `.opencode/skills/code-review/SKILL.md` | Agent binding example |
| `.opencode/skills/security-audit/SKILL.md` | Agent binding example |

#### Configuration Files

| File | Purpose |
|------|---------|
| `.opencode/strray/features.json` | Feature flags including skill routing |
| `.opencode/agents/` | Agent configurations with skill bindings |
| `.opencode/skills/` | Skill definitions and metadata |

### Available Skills (30 Total)

| Category | Skills |
|----------|--------|
| Code & Analysis | code-analyzer, lint, auto-format, refactoring-strategies |
| Testing | testing-strategy, testing-best-practices |
| Security | security-audit, security-scan |
| Architecture | architect-tools, architecture-patterns, api-design |
| Orchestration | orchestrator, boot-orchestrator |
| Performance | performance-optimization, performance-analysis |
| Research & Discovery | researcher, project-analysis |
| Quality | code-review, bug-triage, inference-improve |
| State & Session | state-manager, session-management |
| UI/UX | ui-ux-design, multimodal-looker |
| Workflow | git-workflow |
| Framework | framework-compliance-audit |
| Pipeline | processor-pipeline |
| Health | model-health-check |
| Enforcement | enforcer |

### Key Commands

```bash
# List available skills
npm run skill:list

# Query agent skills
npm run agent:skills

# Run skill tests
npm run test:skills

# Validate skill configurations
npm run validate:skills
```

### Error Messages Encountered

1. **"Cannot read properties of undefined (reading 'map')"** - YAML parser creating `_items` arrays incorrectly
2. **"Property 'category' implicitly has an 'undefined' type"** - TypeScript exactOptionalPropertyTypes violations
3. **"ENOENT: no such file or directory"** - Context files written to sandboxed directory
4. **"Circular dependency detected"** - Registry-matcher coupling issue

---

## Final Thoughts

Five phases. Thirty skills. Countless hours of debugging, designing, and documenting. What we built is more than a feature—it's a foundation for the future of StringRay.

The journey wasn't straight. We made mistakes, took wrong turns, encountered problems we didn't know could exist. But each challenge made us stronger, each mistake taught us something new, each dead end led us to better solutions.

I'm proud of what we built. More importantly, I'm excited about what it enables. The skills routing architecture isn't the end of the story—it's the beginning of a new chapter. A chapter where StringRay can intelligently route tasks, where skills can be discovered dynamically, where the framework learns and adapts.

That's the vision. We're just getting started.

---

*March 25, 2026 - StringRay Framework*
