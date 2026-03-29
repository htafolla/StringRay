# Skills Routing Architecture Research

**Date:** 2026-03-24  
**Session:** ses_2def9e6eeffeJaXXTinpaiPHnc  
**Topic:** OpenCode Skill Routing and Agent-Skill Relationships  
**Version:** StringRay v1.15.1

---

## Executive Summary

This research investigates how OpenCode handles skill-agent relationships and provides concrete recommendations for StringRay's skill routing architecture. Key findings reveal that StringRay has a task-skill router that performs keyword-based routing, but skills are never actually loaded into agent conversation contexts—the routing results are logged but not used to invoke the `skill()` tool.

---

## 1. How OpenCode Natively Handles Skill-Agent Relationships

### 1.1 LLM-Based Routing (Default Behavior)

OpenCode implements a distinctive architectural pattern for skills:

1. **Discovery**: Skills are discovered from multiple locations:
   - `.opencode/skills/*/SKILL.md` (project)
   - `.claude/skills/*/SKILL.md` (Claude Code compatibility)
   - `~/.config/opencode/skills/*/SKILL.md` (global)

2. **Progressive Disclosure**: Only skill names and descriptions from YAML frontmatter are shown to agents initially. Full content loads on-demand via the `skill()` tool.

3. **LLM Decision**: The LLM decides when to call `skill({ name: "..." })` to load skill content based on task requirements. This is purely implicit—there's no explicit wiring.

### 1.2 Permission Controls

OpenCode allows agent configurations to control skill access:

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

However, there is **no native declarative wiring**—agents cannot be configured to "always use skill X."

### 1.3 Agent Invocation Patterns

- **Primary agents**: Handle main conversation, switchable via Tab key
- **Subagents**: Specialized assistants invoked:
  - Automatically by primary agents based on descriptions
  - Manually via `@agent-name` syntax

---

## 2. Current StringRay Architecture

### 2.1 What Exists (✅)

| Component | Location | Status |
|-----------|----------|--------|
| Skills (30) | `.opencode/skills/*/SKILL.md` | ✅ Discovered |
| Agents (26) | `.opencode/agents/*.yml` | ✅ Configured |
| Routing Mappings | `.opencode/strray/routing-mappings.json` | ✅ Populated |
| TaskSkillRouter | `src/delegation/task-skill-router.ts` | ✅ Functional |
| AgentDelegator | `src/delegation/agent-delegator.ts` | ✅ Integrates with router |

### 2.2 Routing Flow

```
User Input → TaskSkillRouter.routeTask() 
          → Matches keywords in routing-mappings.json 
          → Returns { agent, skill, confidence }
          → AgentDelegator.preprocessTaskDescription() 
          → Extracts suggestedAgent, suggestedSkill, confidence
          → Logs routing result ⚠️
          → [STOPS HERE - skill never loaded]
```

### 2.3 What's Missing (❌)

1. **No code calls OpenCode's `skill()` tool** to load skill content
2. **No skill injection** into conversation context during agent execution
3. **Routing results logged but unused** for actual skill loading
4. **Dependencies declared but not processed** in SKILL.md

---

## 3. Architecture Gaps Identified

### Gap 1: Skill Content Never Loaded

The `TaskSkillRouter.routeTask()` method returns a skill name, but that skill is never actually loaded into the agent's context. The skill tool is never invoked.

**Evidence:** Code analysis of `src/plugin/strray-codex-injection.ts` lines 690-720 shows routing result is computed and logged, but no `skill()` call follows.

### Gap 2: No Skill Injection in Agent Prompts

Agent YAML configs don't include instructions to load relevant skills. The LLM doesn't know which skills are available for its domain.

### Gap 3: Dependencies Not Resolved

The `dependencies: []` field in SKILL.md frontmatter exists in the schema but:
- No code loads or processes dependencies
- Skills are loaded independently
- No dependency graph resolution

---

## 4. Recommended Implementation Approach

### Option 1: Plugin-Based Skill Injection (Recommended)

**Location:** `src/plugin/strray-codex-injection.ts` around line 700

**Implementation:**

```typescript
// After routing result is computed (around line 697):
if (routingResult && routingResult.skill) {
  // Load the skill into context via OpenCode's skill tool
  await session.run({
    tool: "skill",
    args: { name: routingResult.skill }
  });
  
  logger.log(`📚 Skill loaded: ${routingResult.skill}`);
}
```

**Pros:** Minimal changes, leverages existing routing logic  
**Cons:** Requires modifying plugin code

### Option 2: Agent Config Skill Declaration

Add optional `skills` array to agent YAML:

```yaml
# .opencode/agents/code-reviewer.yml
skills:
  - code-review
  - lint
  - security-audit
```

**Implementation:** Modify agent-loader to extract skills and inject during agent execution.

**Pros:** Explicit, declarative  
**Cons:** More changes required

### Option 3: opencode-agent-skills Plugin

Install the community plugin that provides:
- Semantic matching for auto-recommendation
- Context injection surviving compaction
- `use_skill`, `get_available_skills` tools

**Configuration:**
```json
{
  "plugin": ["opencode-agent-skills"]
}
```

**Pros:** Full-featured solution  
**Cons:** External dependency

### Recommended: Hybrid Approach

1. Keep existing `routing-mappings.json` for explicit task→skill mapping
2. Add skill injection in plugin after routing computes result
3. Optionally declare skills in agent YAML for explicit bindings
4. Document skill expectations in agent system prompts

---

## 5. Developer Workflow for Adding New Skills

### 5.1 Creating a New Skill

**Step 1: Create skill directory and SKILL.md**

```
.opencode/skills/<skill-name>/SKILL.md
```

**Schema:**

```yaml
---
name: <skill-name>           # Required: lowercase, hyphens only
description: <description>   # Required: What the skill does
author: StrRay Framework     # Optional
version: 1.0.0               # Optional: Semantic versioning
schema_version: "1.0"        # Optional: Schema version
tags: [tag1, tag2]          # Optional: Categorization
capabilities:               # Optional: List of capabilities
  - capability_1
  - capability_2
dependencies: []             # Optional: Array of skill names (NOT IMPLEMENTED)

mcp:                        # Optional: MCP server configuration
  <mcp-server-name>:
    command: node
    args: [node_modules/strray-ai/dist/mcps/knowledge-skills/<name>.server.js]
---

# Skill Content (Markdown)
## Tools Available
- **tool_name**: Description

## Usage
When to activate this skill

## Integration
How it integrates with the framework
```

### 5.2 MCP Server Implementation

**Location:** `src/mcps/knowledge-skills/<skill-name>.server.ts`

**Required Interface:**

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createGracefulShutdown } from "../../utils/shutdown-handler.js";

class StrRay<SkillName>Server {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: "<skill-name>", version: "1.15.18" },
      { capabilities: { tools: {} } }
    );
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [{
        name: "tool_name",
        description: "What the tool does",
        inputSchema: {
          type: "object",
          properties: {
            param1: { type: "string", description: "Parameter description" }
          },
          required: ["param1"]
        }
      }]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      switch (name) {
        case "tool_name":
          return await this.handleToolName(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleToolName(args: any): Promise<any> {
    return { content: [{ type: "text", text: "Result..." }] };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    createGracefulShutdown(() => this.server.close());
  }
}

const server = new StrRay<SkillName>Server();
server.run();
```

### 5.3 Wiring into Routing System

**Step 3: Add keyword mappings**

Edit `.opencode/strray/routing-mappings.json`:

```json
{
  "keywords": ["keyword1", "keyword2", "trigger-phrase"],
  "skill": "<skill-name>",
  "agent": "<agent-name>",
  "confidence": 0.85
}
```

**Step 4: Update Agent Capabilities (optional)**

Edit `.opencode/agents/<agent-name>.yml`:

```yaml
capabilities:
  - existing_capability
  - new_capability_from_skill
```

### 5.4 Complete File Checklist

| File | Location | Required |
|------|----------|----------|
| SKILL.md | `.opencode/skills/<name>/SKILL.md` | ✅ Yes |
| MCP Server | `src/mcps/knowledge-skills/<name>.server.ts` | If skill has tools |
| Test File | `src/mcps/knowledge-skills/<name>.server.test.ts` | Recommended |
| Routing Entry | `.opencode/strray/routing-mappings.json` | For auto-routing |
| Agent Config | `.opencode/agents/<agent>.yml` | If skill maps to agent |

### 5.5 Quick Reference

```bash
# 1. Create directory
mkdir -p .opencode/skills/my-new-skill

# 2. Create SKILL.md with the schema above

# 3. Create MCP server (if needed)
# src/mcps/knowledge-skills/my-new-skill.server.ts

# 4. Add to routing (if auto-routing needed)
# Edit .opencode/strray/routing-mappings.json

# 5. Rebuild
npm run build

# 6. Verify
npx strray-ai status
```

---

## 6. How Other Frameworks Handle Skill Routing

| Framework | Pattern |
|-----------|---------|
| **Oh My OpenCode** | Uses `delegate_task()` with `load_skills` parameter |
| **Claude Code** | LLM decides to call `skill()` based on task |
| **Cursor** | Rules in `.cursorrules` with explicit skill instructions |
| **Windsurf** | Cascade workflow with explicit skill chaining |
| **opencode-agent-skills** | Plugin with semantic matching and auto-recommendation |

---

## 7. Action Items

### Immediate
1. Add skill loading call in `strray-codex-injection.ts` after routing computes result

### Short-term
2. Add optional `skills` array to agent YAML configs
3. Implement skill dependency resolution if needed

### Medium-term
4. Document skill usage expectations in agent system prompts

### Long-term
5. Consider `opencode-agent-skills` plugin for semantic matching

---

## 8. Key Architecture Notes

1. **Discovery**: Skills discovered from `.opencode/skills/*/SKILL.md` by walking directories
2. **Routing**: Keyword-based via `routing-mappings.json` → `TaskSkillRouter`
3. **MCP Loading**: Lazy—servers start on-demand when skill is invoked
4. **Skill Injection Gap**: Routing suggests skill but doesn't call `skill()` tool to load it

---

## Appendix A: File Paths Reference

### Skills
- Location: `.opencode/skills/*/SKILL.md`
- Count: 44 skills

### Agents
- Location: `.opencode/agents/*.yml`
- Count: 25 agents

### Routing
- Location: `.opencode/strray/routing-mappings.json`
- Entries: ~40 keyword mappings

### MCP Servers
- Location: `src/mcps/knowledge-skills/*.server.ts`
- Pattern: Lazy-loaded on skill invocation

---

## Appendix B: Related Source Files

| File | Purpose |
|------|---------|
| `src/delegation/task-skill-router.ts` | Keyword-based task routing |
| `src/delegation/agent-delegator.ts` | Agent delegation with routing integration |
| `src/plugin/strray-codex-injection.ts` | Plugin that handles routing and tool execution |
| `src/cli/commands/status.ts` | Skills discovery and counting |

---

*Research completed: 2026-03-24*