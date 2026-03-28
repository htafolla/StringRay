# StringRay Skills Routing Architecture Strategy

**Date:** 2026-03-24  
**Type:** Strategic Architecture Proposal  
**Session:** ses_2def9d3b0ffeAi7y8m9bn75Fks  
**Author:** @strategist

---

## Executive Overview

This document outlines a comprehensive architecture for StringRay's skill routing system. It addresses the fundamental question: **How does a developer add a new skill to StringRay?**

The analysis covers five key areas:
1. Skill lifecycle management (discovery, registration, loading)
2. Skill anatomy and file structure
3. Dependency resolution mechanisms
4. MCP server lifecycle and pipeline integration
5. Versioning strategy and migration paths

**Key Finding:** StringRay has 70% of the infrastructure already in place (routing, MCP, processor pipeline). The gap is binding skills as runtime-discoverable entities that agents can invoke automatically.

---

## Part 1: Current State Analysis

### Existing Components

| Component | Status | Location |
|-----------|--------|----------|
| Skills (`.opencode/skills/`) | 30 registered | Documentation-only |
| Skills (`.opencode/integrations/`) | 30+ registered | External/community |
| Agent configs | Configured with `processor_pipeline` | `.opencode/agents/*.yml` |
| Routing mappings | Keyword-based, 750+ entries | `.opencode/strray/routing-mappings.json` |
| TaskSkillRouter | Facade pattern | `src/delegation/task-skill-router.ts` |
| SkillInvocationServer | MCP server | `src/mcps/knowledge-skills/skill-invocation.server.ts` |
| Processor pipeline | Exists but skills not wired | `src/mcps/processor-pipeline.server.ts` |

### Architecture Gaps Identified

1. **No Runtime Skill Registry** - Skills are `.md` files, not loaded at runtime
2. **No Skill-to-MCP Binding** - No mechanism maps skill → actual MCP server
3. **Hardcoded Skill Enum** - `skill-invocation.server.ts:44-88` has 40+ hardcoded names
4. **Routing is Agent-Centric** - Keywords route to agent+skill, but skills don't auto-invoke
5. **Pipeline Unbound** - `processor_pipeline` in agent configs doesn't resolve to skills
6. **No Skill Discovery** - Skills aren't auto-discovered from filesystem at boot

---

## Part 2: Skill Lifecycle Architecture

### Phase 1: Skill Discovery & Registration

#### Directory Locations

| Directory | Purpose | Type | Discovery |
|-----------|---------|------|-----------|
| `.opencode/skills/` | Core framework skills | Built-in | Always loaded |
| `.opencode/integrations/` | Third-party/community skills | External | Configurable via `features.json` |

#### Three-Tier Skill Model

```
┌─────────────────────────────────────────────────────────────┐
│                    TIER 3: Full Skill                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ skills/my-skill/                                     │   │
│  │ ├── SKILL.md         (required)                    │   │
│  │ ├── skill.json       (required - manifest)          │   │
│  │ ├── server.ts        (optional - MCP server)        │   │
│  │ ├── config.json      (optional)                     │   │
│  │ ├── __tests__/       (optional)                     │   │
│  │ └── README.md        (optional)                     │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    TIER 2: MCP-Bound Skill                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ skills/my-skill/                                     │   │
│  │ ├── SKILL.md         (required)                    │   │
│  │ ├── skill.json       (required)                    │   │
│  │ + external MCP server (registered elsewhere)        │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    TIER 1: Documentation-Only              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ skills/my-skill/                                     │   │
│  │ └── SKILL.md         (required - contains manifest) │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Discovery Service Implementation

```typescript
// src/skills/registry.ts

const SKILL_SEARCH_PATHS = [
  '.opencode/skills/',           // Core skills
  '.opencode/integrations/*/',  // External skills (glob)
];

class SkillDiscoveryService {
  async discover(): Promise<SkillManifest[]> {
    const skills: SkillManifest[] = [];
    
    for (const pattern of SKILL_SEARCH_PATHS) {
      const dirs = await glob(`${pattern}*/SKILL.md`);
      for (const skillMd of dirs) {
        const manifest = await this.parseSkillManifest(skillMd);
        skills.push(manifest);
      }
    }
    
    return skills;
  }
  
  async parseSkillManifest(skillMdPath: string): Promise<SkillManifest> {
    const content = await readFile(skillMdPath, 'utf-8');
    const frontmatter = parseYamlFrontmatter(content);
    
    return {
      name: frontmatter.name,
      version: frontmatter.version || '1.0.0',
      description: frontmatter.description,
      capabilities: frontmatter.capabilities || [],
      dependencies: frontmatter.dependencies || [],
      mcp: frontmatter.mcp || null,
      source: frontmatter.source || 'local',
      schemaVersion: frontmatter.schema_version || '1.0',
    };
  }
}
```

---

## Part 3: Skill Anatomy & File Structure

### Required Files

| File | Required | Purpose |
|------|----------|---------|
| `SKILL.md` | **YES** | Primary manifest (YAML frontmatter) + documentation |
| `skill.json` | **YES** (Tier 2/3) | Full machine-readable manifest |

### Optional Files

| File | Purpose |
|------|---------|
| `server.ts` | MCP server implementation (self-hosted) |
| `config.json` | Runtime configuration |
| `__tests__/` | Test suite |
| `README.md` | Extended documentation |
| `CHANGELOG.md` | Version history |
| `LICENSE` | License file |
| `assets/` | Static assets, examples, templates |
| `schemas/` | Custom input schemas |

### SKILL.md Dual-Purpose Schema

```yaml
---
# SECTION 1: Machine-Readable Manifest (YAML frontmatter)
name: code-review
version: 1.2.0
schema_version: "2.0"
description: Comprehensive code review and quality analysis

category: quality
risk_level: low          # low | medium | high | critical
source: framework       # framework | community | external

capabilities:
  - code_analysis
  - quality_assessment
  - security_scan

dependencies:
  - lint
  - "security-scan>=1.0.0"

mcp:
  server: code-review.server.js
  command: node
  args: [dist/mcps/code-review.server.js]
  tools:
    - analyze_code_quality
    - assess_security
  timeout_ms: 30000

# SECTION 2: Human-Readable Documentation (Markdown body)
---

# Code Review Skill

## Overview
[Extended description...]

## Tools
- `analyze_code_quality`: Analyze code for issues
- `assess_security`: Security vulnerability scanning

## Usage
```
// Example usage
```
```

---

## Part 4: Full Skill Manifest Schema (skill.json)

```json
{
  "$schema": "./schemas/skill-manifest.schema.json",
  "name": "code-review",
  "version": "1.15.1",
  "schema_version": "2.0",
  "description": "Comprehensive code review and quality analysis",
  
  "category": "quality",
  "risk_level": "low",
  "source": "framework",
  "author": "StringRay Team",
  "license": "Apache-2.0",
  
  "capabilities": [
    "code_analysis",
    "quality_assessment",
    "security_scan"
  ],
  
  "dependencies": [
    {
      "skill": "lint",
      "version": ">=1.0.0 <3.0.0",
      "optional": false
    },
    {
      "skill": "security-basics",
      "version": "^1.0.0",
      "optional": true
    }
  ],
  
  "mcp": {
    "type": "stdio",
    "server": "code-review.server.js",
    "command": "node",
    "args": ["dist/mcps/code-review.server.js"],
    "env": {
      "LOG_LEVEL": "warn",
      "TIMEOUT_MS": "30000"
    },
    "tools": [
      "analyze_code_quality",
      "assess_security",
      "generate_report"
    ],
    "timeout_ms": 30000,
    "retry_attempts": 3,
    "health_check": {
      "enabled": true,
      "interval_ms": 60000,
      "endpoint": "_health"
    }
  },
  
  "agent_binding": {
    "primary": "code-reviewer",
    "fallback": ["enforcer", "architect"],
    "auto_invoke": true,
    "invoke_on": ["pre_commit", "pr_review", "manual"]
  },
  
  "pipeline": {
    "stage": "pre",
    "order": 10,
    "required": false,
    "timeout_ms": 60000
  },
  
  "config": {
    "enabled": true,
    "default_options": {
      "focus_areas": ["security", "performance"],
      "severity_threshold": "medium"
    }
  },
  
  "migrations": [
    {
      "from_version": "1.0.0",
      "to_version": "2.0.0",
      "breaking_changes": [
        "Removed 'analyze_code' tool, use 'analyze_code_quality'"
      ]
    }
  ]
}
```

---

## Part 5: Dependency Resolution

### Declaration Format

```yaml
# In SKILL.md frontmatter
dependencies:
  - lint              # Implicit latest version
  - "security-scan>=1.0.0"  # Semver range
  - 
    skill: performance-optimization
    version: "^2.0.0"
    optional: true
```

### Resolution Algorithm

```typescript
// src/skills/dependency-resolver.ts

interface DependencyNode {
  name: string;
  version: string;
  optional: boolean;
  resolved?: SkillManifest;
}

class SkillDependencyResolver {
  async resolve(manifest: SkillManifest): Promise<ResolutionResult> {
    const graph = this.buildGraph(manifest);
    const cycles = this.detectCycles(graph);
    
    if (cycles.length > 0) {
      return { 
        success: false, 
        error: `Circular dependency detected: ${cycles.join(' -> ')}` 
      };
    }
    
    const resolved = this.topologicalSort(graph);
    return { success: true, resolved };
  }
  
  private buildGraph(manifest: SkillManifest): Map<string, DependencyNode[]> {
    const graph = new Map<string, DependencyNode[]>();
    graph.set(manifest.name, []);
    
    for (const dep of manifest.dependencies || []) {
      const depManifest = this.registry.get(dep.skill);
      
      if (!depManifest) {
        if (!dep.optional) {
          throw new MissingDependencyError(dep.skill, manifest.name);
        }
        continue;
      }
      
      if (!this.satisfiesVersion(depManifest.version, dep.version)) {
        throw new VersionMismatchError(dep.skill, dep.version, depManifest.version);
      }
      
      graph.get(manifest.name)!.push({
        name: dep.skill,
        version: dep.version,
        optional: dep.optional,
        resolved: depManifest
      });
    }
    
    return graph;
  }
  
  private topologicalSort(graph: Map<string, DependencyNode[]>): SkillManifest[] {
    const visited = new Set<string>();
    const result: SkillManifest[] = [];
    
    const visit = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);
      
      const deps = graph.get(name) || [];
      for (const dep of deps) {
        if (dep.resolved) {
          visit(dep.resolved.name);
          result.push(dep.resolved);
        }
      }
    };
    
    for (const [name] of graph) {
      visit(name);
    }
    
    return result;
  }
}
```

### Missing Dependency Handling

| Scenario | Behavior | User Feedback |
|----------|----------|---------------|
| Required dependency missing | **FAIL FAST** - Block load | `Error: Skill 'X' requires 'Y' which is not installed` |
| Optional dependency missing | **WARN** - Continue without | `Warning: Optional dependency 'X' not found, some features disabled` |
| Version mismatch | **FAIL** - Block load | `Error: Skill 'X' requires 'Y>=2.0.0', found 'Y@1.5.0'` |
| Circular dependency | **FAIL** - Block load | `Error: Circular dependency: A→B→C→A` |

---

## Part 6: MCP Server Lifecycle

### Code Location Strategy

```
src/mcps/
├── knowledge-skills/           # Framework skills (compiled → dist/)
│   ├── code-review.server.ts
│   ├── security-audit.server.ts
│   └── ...
├── integrations/               # External skill servers
│   ├── openviking/
│   └── impeccable/
└── dist/                      # Compiled output
    ├── knowledge-skills/
    └── integrations/
```

### MCP Server Template

```typescript
// src/mcps/knowledge-skills/skill-template.server.ts

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { frameworkLogger } from "../../core/framework-logger.js";

class SkillNameServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: "skill-name", version: "1.15.1" },
      { capabilities: { tools: {} } }
    );
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "tool_name",
          description: "What this tool does",
          inputSchema: {
            type: "object",
            properties: {
              param: { type: "string", description: "Parameter description" }
            },
            required: ["param"]
          }
        }
      ]
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

  private async handleToolName(args: any) {
    // Implementation
    return { content: [{ type: "text", text: "Result" }] };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  new SkillNameServer().run().catch(e => 
    frameworkLogger.log("mcps/skill", "run", "error", { error: String(e) })
  );
}

export { SkillNameServer };
```

### Pipeline Integration

```typescript
// src/processors/skill-stage.ts

class SkillPipelineStage implements PipelineStage {
  constructor(
    private skillName: string,
    private manifest: SkillManifest,
    private mcpClient: MCPClient
  ) {}

  async execute(context: PipelineContext): Promise<PipelineResult> {
    const toolName = this.manifest.mcp?.tools?.[0];
    
    if (!toolName) {
      throw new Error(`Skill ${this.skillName} has no MCP tools defined`);
    }

    const result = await this.mcpClient.callTool(toolName, {
      ...context.input,
      ...this.manifest.config?.default_options
    });

    return {
      output: result,
      metadata: {
        skill: this.skillName,
        version: this.manifest.version,
        tool: toolName,
        duration: Date.now() - context.startTime
      }
    };
  }
}
```

---

## Part 7: Versioning Strategy

### Semantic Versioning for Skills

| Component | Format | Example |
|-----------|--------|---------|
| Skill version | `MAJOR.MINOR.PATCH` | `2.1.0` |
| Schema version | `MAJOR` (semver-ish) | `"2.0"` |
| Framework compatibility | Range | `"1.14.x"` |

### Version Rules

```typescript
const VERSION_RULES = {
  // MAJOR: Breaking changes - new schema, removed capabilities
  // MINOR: New capabilities - backward compatible
  // PATCH: Bug fixes - backward compatible
  
  schema_v2: {
    has_mcp_config: true,
    has_dependencies: true,
    has_pipeline_config: true
  },
  
  framework_compatibility: {
    "^1.14.0": ["1.x", "2.x"],
    "^1.15.0": ["2.x", "3.x"]
  }
};
```

### Migration Path

```yaml
# In SKILL.md for skills with migrations
migrations:
  - from_version: "1.15.1"
    to_version: "1.15.1"
    breaking_changes:
      - "Removed 'analyze_code' tool, use 'analyze_code_quality'"
      - "Changed input schema for 'scan_security'"
    automated_migration: true
    
  - from_version: "1.15.1"
    to_version: "1.15.1"
    breaking_changes: []
    notes: "Added new 'generate_report' tool"
```

---

## Part 8: Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPER WORKFLOW                                │
│                                                                             │
│  1. Create skill directory    2. Add SKILL.md    3. Implement server.ts     │
│  .opencode/skills/new-skill/ ──────────────► ─────────────────────────────  │
│                                                                             │
│  4. Run: npx strray-ai skill:register    5. Use: @agent invoke new-skill  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SKILL DISCOVERY SERVICE                             │
│                                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                      │
│  │ skills/      │   │ integrations/│   │ node_modules│                      │
│  │ (framework)  │   │ (external)   │   │ (@stringray)│                      │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                      │
│         │                  │                  │                              │
│         └──────────────────┼──────────────────┘                              │
│                            ▼                                                │
│                 ┌─────────────────────┐                                      │
│                 │   SkillScanner      │                                      │
│                 │  - glob SKILL.md    │                                      │
│                 │  - parse manifest   │                                      │
│                 └─────────┬───────────┘                                      │
│                           ▼                                                  │
│                 ┌─────────────────────┐                                      │
│                 │  SkillRegistry      │                                      │
│                 │  - Map<name, Manifest>                                    │
│                 │  - version index    │                                      │
│                 └─────────┬───────────┘                                      │
└───────────────────────────┼─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DEPENDENCY RESOLUTION                                 │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    SkillDependencyResolver                          │   │
│  │                                                                      │   │
│  │  1. Build DAG from dependencies                                     │   │
│  │  2. Detect cycles → ERROR                                          │   │
│  │  3. Topological sort                                               │   │
│  │  4. Resolve versions (semver)                                      │   │
│  │  5. Load in order (deepest first)                                  │   │
│  │                                                                      │   │
│  │  Missing dependency?                                               │   │
│  │  ├── Required → FAIL                                               │   │
│  │  └── Optional → WARN + continue                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MCP SERVER LIFECYCLE                               │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        MCPClientManager                             │   │
│  │                                                                      │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │   │
│  │   │ STDIO       │    │ HTTP        │    │ STREAM      │             │   │
│  │   │ (process)   │    │ (REST)      │    │ (WebSocket) │             │   │
│  │   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘             │   │
│  │          │                   │                   │                    │   │
│  │          └───────────────────┼───────────────────┘                    │   │
│  │                              ▼                                        │   │
│  │                   ┌─────────────────┐                                 │   │
│  │                   │  Health Monitor │                                 │   │
│  │                   │  - ping         │                                 │   │
│  │                   │  - restart      │                                 │   │
│  │                   │  - metrics      │                                 │   │
│  │                   └─────────────────┘                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PIPELINE INTEGRATION                                │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     ProcessorPipeline                               │   │
│  │                                                                      │   │
│  │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐             │   │
│  │   │  INPUT  │──►│ STAGE 1 │──►│ SKILL   │──►│ STAGE N │──► OUTPUT │   │
│  │   │         │   │ (lint)  │   │ STAGE   │   │ (format)│           │   │
│  │   └─────────┘   └─────────┘   │(code-rev)│   └─────────┘           │   │
│  │                             └─────────┘                              │   │
│  │                                                                      │   │
│  │   SkillPipelineStage                                                │   │
│  │   ├── skill: "code-review"                                         │   │
│  │   ├── version: "1.15.1"                                             │   │
│  │   ├── tool: "analyze_code_quality"                                 │   │
│  │   └── timeout: 30000ms                                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROUTING INTEGRATION                                 │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      TaskSkillRouter                                │   │
│  │                                                                      │   │
│  │   Task Input ──► Keyword Match ──► Skill + Agent ──► Confidence     │   │
│  │                            │                   │          │           │   │
│  │                            │                   ▼          ▼           │   │
│  │                            │            ┌─────────┐ ┌─────────┐        │   │
│  │                            │            │  HIGH   │ │  LOW    │        │   │
│  │                            │            │  → Use  │ │  → LLM  │        │   │
│  │                            │            │  Skill  │ │  Intent │        │   │
│  │                            │            └─────────┘ └─────────┘        │   │
│  │                            │                                        │   │
│  │                            ▼                                        │   │
│  │                   ┌─────────────────┐                               │   │
│  │                   │ SkillRegistry   │ ◄── Lookup MCP server        │   │
│  │                   │  - getMcpServer │                               │   │
│  │                   │  - invokeSkill  │                               │   │
│  │                   └─────────────────┘                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 9: Developer Workflow

### Adding a New Skill

```bash
# Step 1: Create directory
mkdir -p .opencode/skills/my-new-skill

# Step 2: Create SKILL.md with frontmatter
cat > .opencode/skills/my-new-skill/SKILL.md << 'EOF'
---
name: my-new-skill
version: 1.0.0
schema_version: "2.0"
description: What this skill does
capabilities: [capability1, capability2]
mcp:
  server: my-new-skill.server.js
  command: node
  args: [dist/mcps/my-new-skill.server.js]
  tools: [my_tool]
---

# My New Skill

Documentation...
EOF

# Step 3: Implement MCP server (if self-hosted)
cat > src/mcps/knowledge-skills/my-new-skill.server.ts << 'EOF'
// MCP server implementation
EOF

# Step 4: Build (if TypeScript)
npm run build

# Step 5: Register skill
npx strray-ai skill:register my-new-skill

# Step 6: Add to routing (optional)
# Edit .opencode/strray/routing-mappings.json

# Step 7: Use it
@code-reviewer use my-new-skill for analysis
```

### CLI Commands

| Command | Purpose |
|---------|---------|
| `npx strray-ai skill:list` | List all registered skills |
| `npx strray-ai skill:register <name>` | Register a new skill |
| `npx strray-ai skill:validate <name>` | Validate skill manifest |
| `npx strray-ai skill:deps <name>` | Show dependency tree |
| `npx strray-ai skill:invoke <name> --tool <tool>` | Test invoke a skill |

---

## Part 10: Implementation Phases

### Phase 1: Skill Registry Foundation (Week 1)
- Create `SkillRegistry` class
- Implement skill manifest loader
- Add registry persistence (cache)

### Phase 2: Routing Enhancement (Week 2)
- Add `SkillMatcher` component to RouterCore
- Enhance `routing-mappings.json` with capability-based routing
- Add confidence threshold for skill vs agent routing

### Phase 3: Agent Config Integration (Week 2-3)
- Update agent config schema with `skills:` array
- Add `SkillResolver` to load skill configs
- Implement fallback chain logic

### Phase 4: Processor Pipeline Integration (Week 3)
- Create `SkillProcessor` class
- Integrate with `ProcessorManager`
- Add skill execution metrics

### Phase 5: Runtime Discovery & Hot Reload (Week 4)
- File watcher on `.opencode/skills/`
- Registry refresh on file changes
- Skill version negotiation

---

## Summary

StringRay's skill routing architecture requires transforming skills from documentation-only entities to runtime-discoverable, executable infrastructure. The proposed architecture:

1. **Discovers** skills dynamically from filesystem at boot
2. **Binds** skills to MCP servers via manifest declarations
3. **Routes** tasks to skills with keyword matching + optional LLM intent
4. **Executes** skills as first-class pipeline stages
5. **Versions** skills with semantic versioning and migration paths

This maintains backward compatibility while enabling the automation that the current architecture lacks.

---

*Document generated: 2026-03-24*  
*Strategic Analysis by @strategist*
