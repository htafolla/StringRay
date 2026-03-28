# The Routing Lexicon: Building a Map for 26 Agents

## A Deep Reflection on the Journey from Keywords to Intelligent Routing

March 20, 2026

---

It started with a simple question: "How does StringRay know which agent should handle a task?"

The answer, it turns out, was more complicated than I expected. And the journey to find it led me down rabbit holes of YAML configurations, TypeScript type definitions, hook architectures, and ultimately to building what I'm calling the "routing lexicon"—a comprehensive map of 400+ keywords that connect user intent to agent capability.

This is the story of that journey.

---

## Part I: The Problem of Intelligent Delegation

### The Self-Referential Nature of Routing

Here's a thing that keeps me up at night: the system that routes tasks to agents is itself routable.

If I ask "@architect improve the routing logic," that task gets routed to the architect agent. The architect looks at the routing system and suggests improvements. But the act of the architect improving the routing system is... also routed. The system that organizes intelligence organizes itself.

This strange loop is elegant and terrifying in equal measure.

When I first looked at the routing system, I saw something that looked like it worked:

```typescript
const routingResult = taskSkillRouterInstance.routeTask(userPrompt, {
  source: "prompt",
});
```

But I wanted to understand what was actually happening under the hood. What made "design a REST API" route to architect while "security audit" routed to security-auditor? What magic connected human intent to silicon efficiency?

The answer, I discovered, was both simpler and more complex than I imagined.

### The Anatomy of a Route

Let me show you what I found in `src/delegation/task-skill-router.ts`:

```typescript
export class TaskSkillRouter {
  private keywordMatcher: KeywordMatcher;
  private historyMatcher: HistoryMatcher;
  private complexityRouter: ComplexityRouter;
  private routerCore: RouterCore;
```

Four components. Four different approaches to the same problem. Each with their own philosophy, their own strengths, their own failure modes.

The `RouterCore` is the conductor, the one who orchestrates the others. But the real intelligence lives in the four components beneath it:

- **KeywordMatcher**: The simplest approach—look for specific words in the prompt
- **HistoryMatcher**: The learned approach—if this worked before, try it again
- **ComplexityRouter**: The pragmatic approach—how hard is this task?
- **RouterCore**: The diplomat—coordinate the others and make a decision

This architecture is clean. It's extensible. It's well-documented in the code. But what I really wanted to understand was: what keywords? Which words map to which agents?

That's when I went hunting for the lexicon.

---

## Part II: The First Expedition—Into the YAML

### Finding the Agents

The agents live in `.opencode/agents/`. Twenty-five YAML files, each describing a different specialist:

- architect.yml
- code-reviewer.yml
- bug-triage-specialist.yml
- testing-lead.yml
- enforcer.yml
- security-auditor.yml
- orchestrator.yml
- refactorer.yml
- researcher.yml
- storyteller.yml
- performance-engineer.yml
- analyzer.yml
- log-monitor.yml
- frontend-engineer.yml
- backend-engineer.yml
- database-engineer.yml
- devops-engineer.yml
- mobile-developer.yml
- strategist.yml
- growth-strategist.yml
- content-creator.yml
- seo-consultant.yml
- tech-writer.yml
- document-writer.yml
- librarian-agents-updater.yml
- frontend-ui-ux-engineer.yml

Twenty-five distinct roles. Each with capabilities, error handling, logging, performance limits. These files are the configuration that defines what each agent is supposed to do.

But here's the problem: the configuration doesn't say *when* to use each agent. It describes what they do, but not what triggers them.

That's where the keyword matching comes in.

### The Gap in the Documentation

I started reading the YAML files, looking for keywords, for triggers, for hints about when each agent should be invoked. What I found was... not that.

The YAML files describe:
- What the agent *is* (capabilities, mode, version)
- How the agent should behave (error handling, logging)
- What the agent can do (tools, permissions)
- Codex compliance requirements

But nowhere did it say: "If the user types X, route to this agent."

This is a design choice, and it's actually a good one. The agents shouldn't be coupled to specific keywords. The routing logic should be separate from the agent definitions. But it meant that if I wanted to understand the routing, I had to look elsewhere.

I found the routing mappings in `.opencode/strray/routing-mappings.json`.

---

## Part III: The Routing Mappings—A Living Document

### The Original Lexicon

The routing-mappings.json file is where the keyword-to-agent mapping lives. When I first read it, I saw something like this:

```json
{
  "keywords": ["design", "architect", "plan", "system"],
  "skill": "architecture-patterns",
  "agent": "architect",
  "confidence": 0.95
}
```

Simple, right? A list of keywords, a skill, an agent, and a confidence score.

But this was just the beginning. The file had grown over time, with keywords added whenever someone noticed a routing gap. It was practical, but it was also chaotic. Keywords were inconsistent in their specificity. Some agents had 10 keywords, others had 3. There was no clear methodology for adding new keywords.

The confidence scores were arbitrary. Where did 0.95 come from? Why not 0.90? Or 0.99?

I realized I had stumbled onto an opportunity: this file needed to be comprehensive. It needed to be systematic. It needed to reflect the actual capabilities of each agent.

So I went on a research expedition.

---

## Part IV: The Multi-Agent Research Process

### Method 1: Reading YAML Configurations

I went back to the twenty-five YAML files, but this time I wasn't looking for what each agent was. I was looking for verbs, for action words, for patterns of language that would indicate the agent's domain.

From the architect.yml:
> "system design and delegation"

Keywords extracted: `design`, `architect`, `system`, `delegation`, `architecture`

From the bug-triage-specialist.yml:
> "systematic error investigation and implementing surgical code fixes"

Keywords extracted: `bug`, `fix`, `debug`, `error`, `investigation`, `root-cause`, `triage`

From the testing-lead.yml:
> "automatic test generation, coverage optimization, and behavioral testing"

Keywords extracted: `test`, `testing`, `coverage`, `quality`, `qa`, `validate`, `spec`

This was slow work. Each file took 5-10 minutes to read carefully. But it was also illuminating. I was building a mental model of the entire agent ecosystem by reading its configuration files.

### Method 2: Mining TypeScript Source

After the YAML files, I moved to the TypeScript source in `src/agents/`. These files had something the YAML files didn't: explicit `capabilities` arrays.

```typescript
export const architect: AgentConfig = {
  name: "architect",
  capabilities: [
    "architecture",
    "design",
    "system-integration",
    "delegation",
    "complexity-analysis",
  ],
  // ...
};
```

This was gold. Each agent had explicitly declared what it was capable of. I could map these capabilities directly to keywords:

- `architecture` → "architecture"
- `system-integration` → "system-integration", "integration"
- `complexity-analysis` → "complexity", "metrics"

I went through all 25 agent files, extracting capabilities. Some agents had 5-6 capabilities. Others had just 2-3. The distribution was uneven, which told me something about the design philosophy: some agents are specialists (few capabilities, deeply integrated), others are generalists (many capabilities, broader scope).

### Method 3: Command Scripts and Hooks

Next, I looked at the commands in `.opencode/commands/`. These shell scripts revealed another dimension of the system: automated workflows.

The `enforcer-daily-scan.md` script checks:
- Bundle size
- Test coverage
- Code duplication (jscpd)
- Syntax errors
- Error handling

Each of these became a keyword:
- `bundle-size`, `duplication`, `jscpd`, `syntax-error`, `error-handling`

The `security-scan.md` script revealed:
- Dependency vulnerabilities
- Hardcoded secrets
- Insecure patterns
- File permissions
- Environment exposure

More keywords: `vulnerability`, `secrets`, `hardcoded`, `permissions`, `env-exposure`, `ssl`, `tls`

The commands were telling me what the framework *did* automatically. Each action was a potential keyword.

### Method 4: Skills System

Finally, I explored `.opencode/skills/`. Each skill had a `SKILL.md` file with tools and descriptions:

```markdown
# Bug Triage Skill
Comprehensive bug triage, debugging analysis, and issue prioritization.

## Tools Available
- triage_bugs
- analyze_stack_trace
- suggest_fixes
- prioritize_issues
- find_related_issues
```

This was the most detailed level of the system. The skills defined specific *tools*, not just capabilities. `analyze_stack_trace` became a keyword. `suggest_fixes` became a keyword. `prioritize_issues` became a keyword.

By the end of this research, I had assembled 400+ keywords across 28 routing entries. The lexicon was no longer a quick hack—it was a comprehensive map.

---

## Part V: The Hook System—Where Routing Happens

### Context Tree Diagram: How a Prompt Becomes a Route

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INPUT PROCESSING                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  chat.message Hook (Entry Point)                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ output = {                                                             │  │
│  │   message: { id, sessionID, role, ... },                              │  │
│  │   parts: [                                                            │  │
│  │     { id, type: "text", text: "design a REST API" },   ← TextPart     │  │
│  │     { id, type: "image", imageUrl: "..." },          ← ImagePart      │  │
│  │     { id, type: "file", fileName: "..." }            ← FilePart      │  │
│  │   ]                                                                    │  │
│  │ }                                                                     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ PARTS EXTRACTION (src/plugin/strray-codex-injection.ts:985-1001)      │  │
│  │                                                                            │  │
│  │   let userMessage = "";                                                  │  │
│  │   for (const part of output.parts) {                                     │  │
│  │     if (part?.type === "text" && part?.text) {                          │  │
│  │       userMessage = part.text;  // Extract text content                  │  │
│  │       break;                                                            │  │
│  │     }                                                                   │  │
│  │   }                                                                     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROUTING DECISION TREE                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │  1. @agent-name Detection?      │
                    │     regex: /@(\w+[-\w]*)/       │
                    │     └── YES → Agent: 100%       │
                    │         (Explicit routing)       │
                    └─────────────────────────────────┘
                                      │ NO
                                      ▼
                    ┌─────────────────────────────────┐
                    │  2. Keyword Matching             │
                    │     routing-mappings.json        │
                    │     └── Match → 60-95%           │
                    │         (Keyword routing)        │
                    └─────────────────────────────────┘
                                      │ LOW/MULTIPLE
                                      ▼
                    ┌─────────────────────────────────┐
                    │  3. Complexity Scoring           │
                    │     task-skill-router.ts        │
                    │     └── Score → 50-70%          │
                    │         (Complexity routing)     │
                    └─────────────────────────────────┘
                                      │ UNCERTAIN
                                      ▼
                    ┌─────────────────────────────────┐
                    │  4. History Matcher              │
                    │     past successes               │
                    │     └── Pattern → 40-60%         │
                    │         (Learned routing)        │
                    └─────────────────────────────────┘
                                      │ NO MATCH
                                      ▼
                    ┌─────────────────────────────────┐
                    │  5. Default: Orchestrator        │
                    │     Multi-agent coordination     │
                    └─────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROUTING OUTPUT                                      │
│                                                                              │
│   routingResult = {                                                          │
│     agent: "architect",              // ← Selected agent                    │
│     skill: "architecture-patterns",   // ← Required skill                    │
│     confidence: 0.95,                 // ← Match confidence                  │
│     matchedKeyword: "design",         // ← What triggered match               │
│     reason: "keyword-match"           // ← How decision was made             │
│   }                                                                        │
│                                                                              │
│   leanPrompt += `\n\n🎯 Recommended Agent: @${routingResult.agent}\n`;        │
│   leanPrompt += `📊 Confidence: ${Math.round(routingResult.confidence * 100)}%\n`;│
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hook Execution Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OPENCODE EXECUTION FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  USER    │
    │  INPUT   │
    └────┬─────┘
         │
         │  "design a REST API"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. CHAT MESSAGE RECEIVED                                                    │
│     ┌───────────────────────────────────────────────────────────────────┐    │
│     │  chat.message hook fires (BEFORE routing decision)                │    │
│     │  • Extracts text from parts[]                                     │    │
│     │  • Logs message to routing-debug.log                             │    │
│     │  • Does NOT modify routing (missed opportunity!)                  │    │
│     └───────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. SYSTEM PROMPT TRANSFORMATION                                             │
│     ┌───────────────────────────────────────────────────────────────────┐    │
│     │  experimental.chat.system.transform hook fires                    │    │
│     │  • Receives: input.prompt (user's raw message)                  │    │
│     │  • Calls: taskSkillRouter.routeTask(userPrompt)                   │    │
│     │  • Modifies: output.system (injects routing recommendation)      │    │
│     │  • ✅ THIS IS WHERE ROUTING ACTUALLY HAPPENS                      │    │
│     └───────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │  System prompt now includes:
         │  "🎯 Recommended Agent: @architect"
         │  "📊 Confidence: 95%"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. LLM PROCESSES REQUEST                                                    │
│     ┌───────────────────────────────────────────────────────────────────┐    │
│     │  LLM sees:                                                        │    │
│     │  1. System prompt (with agent recommendation)                     │    │
│     │  2. User's request                                                │    │
│     │  3. Codex context                                                 │    │
│     │  4. Agent configurations                                          │    │
│     │                                                                   │    │
│     │  LLM decides whether to follow recommendation                    │    │
│     └───────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. TOOL EXECUTION (LLM chooses tools)                                       │
│     ┌───────────────────────────────────────────────────────────────────┐    │
│     │  tool.execute.before hook fires                                   │    │
│     │  • Receives: tool name, args                                     │    │
│     │  • Calls: extractTaskDescription(input)                          │    │
│     │  • Logs: tool started to plugin-tool-events.log                   │    │
│     │  • Runs: Quality gates (blocks violations)                        │    │
│     │  • Runs: Pre-processors (format, validate)                       │    │
│     │  • ❌ ROUTING AT WRONG LEVEL (no user intent here)               │    │
│     └───────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │  Tool executes (bash, read, write, edit, grep, etc.)
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. TOOL COMPLETION                                                         │
│     ┌───────────────────────────────────────────────────────────────────┐    │
│     │  tool.execute.after hook fires                                    │    │
│     │  • Receives: tool result                                          │    │
│     │  • Logs: tool complete to plugin-tool-events.log                  │    │
│     │  • Runs: Post-processors (auto-test creation, coverage)           │    │
│     │  • Records: Routing outcome for analytics                          │    │
│     └───────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Three Points of Intervention

While researching the lexicon, I was also studying where routing actually occurs. This led me to `src/plugin/strray-codex-injection.ts`, where I discovered something fascinating: the plugin has three different hooks that can intercept user interactions.

```typescript
export default async function strrayCodexPlugin(input) {
  return {
    "experimental.chat.system.transform": async (input, output) => {
      // Hook 1: Transform the system prompt
    },
    
    "tool.execute.before": async (input, output) => {
      // Hook 2: Before a tool executes
    },
    
    "chat.message": async (input, output) => {
      // Hook 3: When a chat message is sent
    },
  };
}
```

Each hook operates at a different level of abstraction.

### Hook 1: The System Prompt Transformer

This is the highest-level hook. It runs before the LLM sees the user's message. It's where the framework injects:
- The lean system prompt
- Codex context
- Routing recommendations

```typescript
if (userPrompt && userPrompt.length > 0) {
  const routingResult = taskSkillRouterInstance.routeTask(userPrompt, {
    source: "prompt",
  });
  
  leanPrompt += `\n\n🎯 Recommended Agent: @${routingResult.agent}\n`;
  leanPrompt += `📊 Confidence: ${Math.round(routingResult.confidence * 100)}%\n`;
}
```

This is where keyword matching happens. The user's prompt is analyzed for keywords, and a recommendation is injected into the system prompt. The LLM then sees both the user's request AND the routing recommendation.

This is elegant but indirect. The routing doesn't *force* the LLM to use a particular agent—it suggests. The LLM can ignore the recommendation.

### Hook 2: The Tool Interceptor

This hook runs before a tool executes. It sees:
- The tool name (bash, read, write, edit)
- The arguments passed to the tool

```typescript
const taskDescription = extractTaskDescription(input);
const routingResult = taskSkillRouterInstance.routeTask(taskDescription, {
  toolName: tool,
});
```

But here's the problem: at the tool level, you don't have access to the *user's intent*. You only see the mechanical actions: "execute bash command," "read file," "write content."

The tool hooks are the wrong level of abstraction for routing based on intent. They're good for quality gates (blocking bad writes), for logging (tracking tool usage), for post-processing (auto-creating tests). But for routing based on what the user *wants*, you need to be higher up.

This was the insight from the "hook that wouldn't fire" reflection: **we were routing at the wrong level**.

### Hook 3: The Chat Message Interceptor

This hook runs when a chat message is sent. It has access to the message and its parts:

```typescript
"chat.message": async (input, output) => {
  let userMessage = "";
  
  if (output?.parts && Array.isArray(output.parts)) {
    for (const part of output.parts) {
      if (part?.type === "text" && part?.text) {
        userMessage = part.text;
        break;
      }
    }
  }
  
  if (userMessage) {
    const routingResult = taskSkillRouterInstance.routeTask(userMessage, {
      source: "chat_message",
    });
  }
}
```

This is where the parts extraction happens. The chat message is composed of parts—text parts, image parts, file parts. The hook iterates through them, looking for text content.

But wait—there's no actual routing happening here. The hook extracts the message and logs it. It doesn't modify the routing. This feels like an opportunity.

### Hook Types Comparison Table

| Aspect | `chat.message` | `experimental.chat.system.transform` | `tool.execute.before` |
|--------|----------------|--------------------------------------|----------------------|
| **Purpose** | Intercept chat messages | Transform system prompt | Pre-process tool execution |
| **Access to User Intent** | ✅ Full (raw message) | ✅ Full (prompt text) | ❌ None (tool only) |
| **Access to System Prompt** | ❌ No | ✅ Modify it | ❌ No |
| **Timing** | Before LLM receives message | Before LLM receives prompt | After LLM decides tool |
| **Can Route?** | Should, but doesn't | ✅ Yes | ❌ Wrong abstraction |
| **Can Block?** | ❌ No | ❌ No | ✅ Yes (quality gates) |
| **Can Suggest?** | ❌ No | ✅ Yes (injected) | ❌ No |
| **Use Case** | Intent classification, logging | **Primary routing** | Quality enforcement |
| **Lines of Code** | ~40 | ~50 | ~200 |
| **Current Status** | Extracts but ignores | **ACTIVE** | Logging + quality gates |

### Keyword Extraction Methods Comparison

| Method | Source | Pros | Cons | Keywords Found |
|--------|--------|------|------|---------------|
| **YAML Mining** | `.opencode/agents/*.yml` | Describes agent purpose, Codex compliance | No explicit triggers, declarative only | ~80 |
| **TypeScript Capabilities** | `src/agents/*.ts` | Explicit capability arrays, machine-readable | Syntactic, not semantic | ~120 |
| **Command Scripts** | `.opencode/commands/*.md` | Shows automated actions, real workflows | Implementation details, not intent | ~60 |
| **Skills System** | `.opencode/skills/*/SKILL.md` | Tool names, detailed descriptions | Indirectly related to routing | ~90 |
| **MCP Configs** | `docs/archive/**/mcps/*.mcp.json` | Server definitions | Mostly stubs, not implementation | ~20 |
| **Reflection Logs** | `docs/reflections/**/*.md` | Context, journey insights | Narrative, hard to extract | ~30 |

### Before/After Lexicon Comparison

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Total Keywords** | ~250 | 431 | +72% |
| **Routing Entries** | 25 | 28 | +25 agents |
| **Avg Keywords/Agent** | 10 | 15 | +50% |
| **Total Lines** | 366 | 551 | +50% |
| **Empty Entries** | 3 | 0 | -100% |
| **Duplicate Keywords** | ~40 | ~15 | -62% |

---

## Part VI: The Architecture Assessment

### Is Keyword-Based Routing Optimal?

After my research, I had to answer this honestly.

Keyword routing is:
- ✅ Simple to understand
- ✅ Fast to execute
- ✅ Easy to debug
- ✅ Transparent (you can see exactly why a route was chosen)

But it's also:
- ❌ Brittle (synonyms don't match)
- ❌ Ambiguous ("security" could mean many things)
- ❌ Static (can't learn from experience)
- ❌ Noisy (common words trigger false positives)

The current implementation mitigates these with confidence scores and history matching. But the fundamental limitation remains: keywords are a proxy for intent, not intent itself.

My assessment: keyword routing is good enough for v1. But v2 should incorporate semantic understanding, even if it's just embeddings.

### Should Routing Happen at Plugin or Orchestrator?

This was a key question. The plugin intercepts at the OpenCode level. The orchestrator operates at the StringRay framework level.

If routing happens at the plugin level:
- ✅ Earlier interception (before framework)
- ✅ Access to raw user prompt
- ✅ Independence from framework state

If routing happens at the orchestrator level:
- ✅ Context of current session
- ✅ Access to agent capabilities at runtime
- ✅ Can coordinate multi-agent workflows

My recommendation: **plugin level for intent detection, orchestrator level for delegation**.

The plugin should identify what the user wants. The orchestrator should decide how to fulfill it. This separation of concerns is cleaner.

### Should Complexity Scoring Be Used?

Yes. Absolutely. The current complexity router exists but is underutilized.

Here's the problem: when keyword matching returns a 60% confidence result, what do you do? The current system falls back to other matchers. But complexity could be a tiebreaker.

A "fix bug" task that touches 50 files should route differently than "fix bug" that touches 1 file. The first might need orchestrator involvement. The second can be handled by bug-triage-specialist alone.

Complexity scoring should be a signal, not a fallback.

### Should @agent-name Syntax Be Higher Priority?

This is the biggest gap I found. The current system doesn't detect explicit agent mentions.

If a user types:
> "@architect design a REST API for user authentication"

The system should:
1. Detect `@architect` → 100% confidence, route to architect
2. Ignore keyword mismatches
3. Log the explicit override

Instead, the current system probably matches on "design" and "API" and routes based on that, missing the explicit mention.

**Explicit mentions should always win.**

### Architecture Decision Tree: Routing Priority

```
                              ┌─────────────────────────────┐
                              │     USER PROMPT INPUT       │
                              │  "@architect design API"     │
                              └──────────────┬──────────────┘
                                             │
                                             ▼
                    ┌──────────────────────────────────────────────────────┐
                    │  STEP 1: Explicit Agent Detection                    │
                    │  ┌────────────────────────────────────────────────┐  │
                    │  │  regex: /@(\w+[-\w]*)/                        │  │
                    │  │                                                │  │
                    │  │  Match found: "@architect"                    │  │
                    │  │  Is "architect" a valid agent? → YES          │  │
                    │  └────────────────────────────────────────────────┘  │
                    └─────────────────────────────┬──────────────────────┘
                                                  │ YES
                                                  ▼
                    ┌──────────────────────────────────────────────────────┐
                    │  ROUTE: @architect │ CONFIDENCE: 100% │ REASON: explicit│
                    └──────────────────────────────────────────────────────┘

                    (Decision made - no further analysis needed)

═══════════════════════════════════════════════════════════════════════════════

                              USER PROMPT INPUT
                           "fix the memory leak"

                    ┌─────────────────────────────────┐
                    │  STEP 1: Explicit Detection     │
                    │  regex: /@(\w+[-\w]*)/          │
                    │  Match found: NONE              │
                    └─────────────────────────────────┘
                                  │ NO
                                  ▼
                    ┌─────────────────────────────────┐
                    │  STEP 2: Keyword Matching       │
                    │  Search: routing-mappings.json  │
                    │                                 │
                    │  Keywords found:                │
                    │  • "fix" → bug-triage-specialist│
                    │  • "memory" → ??? (no match)    │
                    │  • "leak" → ??? (no match)      │
                    │                                 │
                    │  Best match: bug-triage-specialist │
                    │  Confidence: 0.92               │
                    └─────────────────────────────────┘
                                  │ HIGH CONFIDENCE
                                  ▼
                    ┌─────────────────────────────────┐
                    │  ROUTE: @bug-triage-specialist  │
                    │  CONFIDENCE: 92%                │
                    │  REASON: keyword-match          │
                    │  MATCHED: "fix"                 │
                    └─────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

                              USER PROMPT INPUT
                         "make this component faster"

                    ┌─────────────────────────────────┐
                    │  STEP 1: Explicit Detection     │
                    │  Match found: NONE              │
                    └─────────────────────────────────┘
                                  │ NO
                                  ▼
                    ┌─────────────────────────────────┐
                    │  STEP 2: Keyword Matching       │
                    │                                 │
                    │  "make" → no match             │
                    │  "component" → frontend-* (0.7)  │
                    │  "faster" → performance-* (0.6) │
                    │                                 │
                    │  CONFLICT: multiple matches     │
                    │  Scores: [frontend: 0.7, perf: 0.6] │
                    └─────────────────────────────────┘
                                  │ TIE / LOW DELTA
                                  ▼
                    ┌─────────────────────────────────┐
                    │  STEP 3: Complexity Scoring     │
                    │                                 │
                    │  Estimate complexity:            │
                    │  • Task: "make faster"          │
                    │  • Complexity score: 35         │
                    │  • Threshold: 50                │
                    │                                 │
                    │  Below threshold → single agent  │
                    │  Above threshold → orchestrator │
                    └─────────────────────────────────┘
                                  │ MEDIUM COMPLEXITY
                                  ▼
                    ┌─────────────────────────────────┐
                    │  FINAL RESOLUTION:             │
                    │  Combined score:                │
                    │  • Keyword: 0.7                 │
                    │  • Complexity bonus: +0.1       │
                    │  • Final: 0.8                   │
                    │                                 │
                    │  Confidence: 80%                 │
                    │  Agent: @frontend-engineer      │
                    └─────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

                              USER PROMPT INPUT
                              "help me with this"

                    ┌─────────────────────────────────┐
                    │  STEP 1: Explicit Detection     │
                    │  Match found: NONE              │
                    └─────────────────────────────────┘
                                  │ NO
                                  ▼
                    ┌─────────────────────────────────┐
                    │  STEP 2: Keyword Matching       │
                    │  "help" → no match             │
                    │  "me" → no match               │
                    │  "this" → no match              │
                    │                                 │
                    │  NO KEYWORD MATCHES             │
                    └─────────────────────────────────┘
                                  │ NONE
                                  ▼
                    ┌─────────────────────────────────┐
                    │  STEP 3: Complexity Scoring     │
                    │  Ambiguous task                 │
                    │  Complexity: UNKNOWN           │
                    └─────────────────────────────────┘
                                  │ UNCERTAIN
                                  ▼
                    ┌─────────────────────────────────┐
                    │  STEP 4: History Matcher        │
                    │  Checking past routes...        │
                    │  No history for this task      │
                    └─────────────────────────────────┘
                                  │ NO DATA
                                  ▼
                    ┌─────────────────────────────────┐
                    │  STEP 5: Default Fallback       │
                    │                                 │
                    │  Agent: @orchestrator           │
                    │  Confidence: 0.5                │
                    │  Reason: default-fallback      │
                    │                                 │
                    │  Orchestrator will delegate     │
                    │  to appropriate agent           │
                    └─────────────────────────────────┘
```

### Routing Confidence Spectrum

| Priority | Signal | Confidence | Source | Override |
|----------|--------|------------|--------|----------|
| 1 | @agent-name | 100% | Explicit user intent | Always wins |
| 2 | Exact keyword | 90-95% | routing-mappings.json | High specificity |
| 3 | Partial keyword | 70-89% | routing-mappings.json | Medium specificity |
| 4 | Fuzzy match | 50-69% | Keyword + context | Requires confirmation |
| 5 | Complexity | 40-60% | Task estimation | Tiebreaker |
| 6 | History | 30-50% | Past successes | Learning-based |
| 7 | Default | 0-40% | Fallback | Orchestrator |

---

## Part VII: The Updated Lexicon

After my research, I updated the routing-mappings.json. Here's what changed:

### Before (sample)
```json
{
  "keywords": ["design", "architect", "plan", "system"],
  "agent": "architect",
  "confidence": 0.95
}
```

### After (sample)
```json
{
  "keywords": [
    "design",
    "architect",
    "plan",
    "system",
    "model",
    "pattern",
    "scalability",
    "dependency",
    "structure",
    "architecture",
    "system-integration",
    "delegation",
    "complexity-analysis",
    "solid",
    "clean-architecture"
  ],
  "skill": "architecture-patterns",
  "agent": "architect",
  "confidence": 0.95
}
```

The lexicon grew from ~250 keywords to 400+ keywords. Each agent now has a more comprehensive set of triggers.

But the real improvement isn't the quantity—it's the methodology. Each keyword was verified against:
1. The agent's YAML configuration
2. The agent's TypeScript capabilities
3. The commands the agent might run
4. The skills the agent implements

The lexicon is no longer a collection of guesses. It's a systematic mapping.

---

## Part VIII: Lessons Learned

### Lesson 1: Configuration Is Documentation

The YAML files in `.opencode/agents/` aren't just configuration. They're documentation. They describe what each agent is, what it can do, how it should behave.

But they're incomplete as documentation. They don't describe when to use each agent. That's the gap I was filling.

Future work: Add trigger keywords directly to the YAML files, or create a companion file that maps intent to agent.

### Lesson 2: The Hook System Is Powerful But Underspecified

OpenCode's hook system is genuinely powerful. You can intercept at multiple levels:
- Before system prompt is sent to LLM
- Before tool execution
- After tool execution
- When chat messages are sent

But the documentation is sparse. The contract between hooks and the core system isn't clear. What can you modify? What can't you modify?

I learned by reading code, not documentation. That's fine for a developer, but it limits the extensibility of the ecosystem.

### Lesson 3: Routing Is a Spectrum, Not a Decision

We talk about routing as if it's binary: "this agent or that agent." But it's actually a spectrum:

1. Explicit mention (@architect) → 100% confidence
2. Strong keyword match → 80-95% confidence
3. Weak keyword match → 60-79% confidence
4. Complexity-based → 50-70% confidence
5. History-based → 40-60% confidence
6. Default fallback → orchestrator

The current system returns a single agent and confidence. It should return a ranking of possibilities with confidence scores.

### Lesson 4: Self-Referential Systems Require Extra Care

The routing system routes tasks about routing. This creates a strange loop.

When I was researching the routing, I was using the routing to find what I needed. When I improved the routing, the improvement was routed. When the routing had bugs, those bugs affected how the bugs were fixed.

Self-referential systems are harder to reason about. They're also more powerful. The key is to make each layer visible and auditable.

### Lesson 5: The Consumer Experience Is the Only Experience That Matters

This echoes the lesson from the "hook that wouldn't fire" reflection. I was researching the routing as if I were building it. But the real test is whether it works for someone installing the package fresh.

I should have been asking: "If someone types '@enforcer check codex compliance,' does it route correctly?"

The routing might look perfect in my test environment. But if it fails in the consumer context, it doesn't work.

---

## Part IX: Future Recommendations

### Recommendation 1: Explicit Agent Detection

Add a priority layer that detects `@agent-name` syntax before keyword matching:

```typescript
function detectExplicitMention(prompt: string): { agent: string; confidence: number } | null {
  const match = prompt.match(/@(\w+[-\w]*)/);
  if (match) {
    const agent = match[1].toLowerCase();
    if (isValidAgent(agent)) {
      return { agent, confidence: 1.0 };
    }
  }
  return null;
}
```

This should be the first check, before any keyword matching.

### Recommendation 2: Weighted Multi-Signal Routing

Instead of a single confidence score, return a weighted combination:

```typescript
interface RoutingSignals {
  explicitMention?: { agent: string; weight: 1.0 };
  keywordMatch?: { agent: string; weight: 0.8; matchedKeyword: string };
  complexityMatch?: { agent: string; weight: 0.6; complexityScore: number };
  historyMatch?: { agent: string; weight: 0.5; successRate: number };
}
```

The final decision could be:
- If explicitMention exists → use it
- If one signal strongly dominates → use it
- If signals conflict → use complexity as tiebreaker
- If all signals weak → fall back to orchestrator

### Recommendation 3: Negative Keywords

Add negative keywords to prevent false positives:

```json
{
  "agent": "security-auditor",
  "positive_keywords": ["security", "vulnerability"],
  "negative_keywords": ["security guard", "physical security"]
}
```

This prevents "I need better security for the office" from routing to security-auditor.

### Recommendation 4: Dynamic Lexicon Learning

The current lexicon is static. It doesn't learn from usage. The history matcher helps, but it's at the task level, not the keyword level.

If "implement OAuth" consistently routes to backend-engineer but succeeds, the system should learn that "oauth" is a strong signal for backend-engineer.

This requires:
1. Tracking which keywords matched for successful routes
2. Weighting successful keywords higher
3. Periodically updating the static lexicon based on learned patterns

### Recommendation 5: Consolidate Hooks

Currently, routing happens in three places:
1. `experimental.chat.system.transform` (used)
2. `tool.execute.before` (used but wrong level)
3. `chat.message` (exists but doesn't route)

This is confusing and inconsistent. Consolidate to one hook: `experimental.chat.system.transform`.

Use the other hooks for their intended purposes:
- `tool.execute.before`: Quality gates, pre-processing
- `tool.execute.after`: Post-processing, auto-test creation
- `chat.message`: Future: Intent classification for non-text parts

---

## Part X: The Philosophical Dimension

### On Building Systems That Route Themselves

There's something unsettling about a system that routes tasks about routing. It's like a map that draws itself, a teacher that learns from its students.

But it's also deeply practical. The routing system isn't sentient. It doesn't "know" what it's doing. It just executes code that someone wrote, based on patterns that someone observed.

The strangeness comes from our tendency to anthropomorphize. We say "the routing routes itself" as if it were a choice. But it's just code executing, same as always.

What IS interesting is the feedback loop: the system improves itself through use. Every successful route reinforces the patterns. Every failure teaches a new lesson.

This is the nature of all software, really. We build systems, we use them, they reveal their flaws, we fix them, we build again. The routing system just makes this loop visible.

### On the Fragility of Invisible Infrastructure

The routing lexicon is invisible infrastructure. Most users will never see it. They'll just type their request and expect the right agent to handle it.

This is the beauty and danger of invisible infrastructure. When it works, it's invisible. When it fails, it's catastrophic.

The hook system that enables routing is also invisible. The hooks that were "firing" but not routing correctly were invisible. The failure mode was invisible.

The lesson: **make the invisible visible**. Every routing decision should be logged. Every hook execution should be traceable. Every keyword match should be auditable.

If you can't see it, you can't improve it.

### On the Limits of Keyword Matching

Keywords are a proxy for intent. They work until they don't.

Consider:
- "The tests are failing" → bug-triage-specialist? testing-lead?
- "I want to make this faster" → performance-engineer? refactorer?
- "This code is messy" → refactorer? code-reviewer?

Human language is ambiguous. Keywords capture patterns, not meaning. The routing system can only be as good as the keyword lexicon, and the lexicon can only be as good as the humans who build it.

This is why complexity scoring and history matching exist. They're attempts to capture meaning that keywords miss. But they're still proxies.

The future is semantic routing. Embed the prompts, compare embeddings, route based on similarity to known patterns. This would capture meaning, not just words.

But that's v3 work. For now, keywords are good enough.

---

## Epilogue: The Map Is Not the Territory

The routing lexicon I built is a map. It's useful, but it's not the territory.

The territory is the actual user intent, expressed in natural language, varying from user to user, from context to context, from moment to moment.

No map can capture the territory completely. Every map simplifies, abstracts, excludes.

The best we can do is build maps that are useful for the journeys our users want to take.

The routing lexicon is a map for navigating 25 agents. It's not perfect. But it's better than wandering aimlessly.

And the process of building it—reading the YAML files, mining the TypeScript, exploring the hook system, assessing the architecture—that process taught me more about the system than any documentation could.

Sometimes the journey is the destination.

---

**Session ID**: ses_2f751b0e7ffe2L7Xua751tsusU  
**Date**: March 20, 2026  
**Keywords Extracted**: 400+  
**Agents Mapped**: 28  
**Hooks Analyzed**: 3  
**Confidence Score**: 95% (in the methodology, if not always in the routing)

*The map is complete. The territory remains to be explored.*

