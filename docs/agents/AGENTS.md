# StrRay Framework - Agent Overview

## Overview

**StrRay operates as a comprehensive plugin within the oh-my-opencode ecosystem**, providing systematic error prevention through integrated agent orchestration and codex compliance enforcement.

StrRay Framework implements a sophisticated multi-agent AI system with 8 specialized agents, each designed for specific development and quality assurance tasks within the oh-my-opencode ecosystem.

### Core Architecture: Hybrid TypeScript/Python System

```
StrRay Framework - Hybrid TypeScript/Python Architecture
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────┐
│                    TypeScript Layer                  │
│                    (Primary Framework)               │
├─────────────────────────────────────────────────────┤
│ • Configuration-based agents (AgentConfig)          │
│ • Plugin system & MCP protocol integration          │
│ • Build system & bundling (Node.js/TypeScript)      │
│ • Framework orchestration & routing                 │
└─────────────────────────────────────────────────────┘
                              │
                              │ Integration
                              │
┌─────────────────────────────────────────────────────┐
│                     Python Layer                     │
│                  (Backend Components)                │
├─────────────────────────────────────────────────────┤
│ • Class-based agents (BaseAgent inheritance)        │
│ • Advanced state management & persistence           │
│ • Performance monitoring & alerting                 │
│ • Codex compliance enforcement                       │
└─────────────────────────────────────────────────────┘
```

### Framework Directory Structure

StrRay uses a **hybrid TypeScript/Python architecture** with two key directories:

#### `.opencode/` Directory (Primary Framework Hub)

- **Purpose**: Contains the complete oh-my-opencode integration with plugins, agents, and MCP servers
- **Python Backend**: Full backend implementation in `src/strray/` with async coordination and AI services
- **Boot Orchestration**: `init.sh` provides orchestrator-first initialization with compliance validation
- **Plugin Ecosystem**: TypeScript plugin system for codex injection and MCP server registration

**Key Files:**

- `init.sh` - Main initialization script with component verification
- `oh-my-opencode.json` - Main framework configuration with plugin declarations
- `plugin/strray-codex-injection.ts` - Plugin initialization and hook system
- `agents/` - Individual agent configurations (.md descriptions + .yml specs)
- `src/strray/` - Python backend with BaseAgent classes and orchestration

#### `.strray/` Directory (Configuration Repository)

- **Purpose**: Centralized configuration for codex terms, agent templates, and context loading
- **Codex Management**: `codex.json` contains detailed enforcement rules and metadata
- **Context Injection**: TypeScript modules for loading and injecting framework context

### Boot Orchestration Sequence

Framework initializes in strict dependency order via orchestrator-first boot:

1. **Plugin Loading** (`plugin/strray-codex-injection.ts`)
   - Loads on oh-my-opencode startup via plugin system
   - Injects codex terms into all agent system prompts
   - Registers MCP servers for StrRay agents

2. **Context Loader** (`src/context-loader.ts` + `src/strray/core/context_loader.py`)
   - Loads codex terms from `.strray/codex.json` and `codex.json`
   - Provides validation and enforcement mechanisms
   - Integrates with TypeScript plugin system

3. **State Manager** (`src/state/state-manager.ts`)
   - Initializes persistent state management with session recovery
   - Sets up cross-session communication and state synchronization
   - Manages state persistence across plugin boundaries

4. **Orchestrator** (`src/orchestrator.ts`)
   - Loads first as critical dependency for all agent coordination
   - Implements async task delegation with conflict resolution
   - Manages multi-agent workflows and task dependencies

5. **Delegation System** (`src/delegation/`)
   - Initializes agent complexity analysis and routing
   - Sets up session coordination and agent capabilities
   - Enables intelligent task distribution strategies

6. **Processors** (`src/processors/`)
   - Activates pre/post execution hooks for codex validation
   - Enables test execution, state validation, and regression testing
   - Provides automated quality assurance and monitoring

7. **Security Components** (`src/security/`)
   - Initializes security hardening and input validation
   - Sets up secure authentication and access control
   - Enables security auditing and compliance monitoring

8. **Monitoring** (`src/performance/`, `src/monitoring/`)
   - Activates performance tracking and enterprise monitoring
   - Sets up real-time dashboards and alert systems
   - Enables distributed health checks and metrics collection

### oh-my-opencode Integration Points

- **Hook Integration**: `agent.start`, `tool.execute.before`, `tool.execute.after` hooks
- **MCP Servers**: 9 MCP servers (7 agent-specific + 2 knowledge skills)
- **Model Routing**: All 8 agents configured to use `opencode/grok-code` model
- **Session Management**: Cross-plugin session persistence and state sharing

### Cross-Language Integration

- **Python/TypeScript Communication**: JSON-RPC/WebSocket protocols for inter-process communication
- **Data Serialization**: Type-safe data exchange with validation
- **State Synchronization**: Shared state management between TypeScript and Python layers
- **Error Propagation**: Consistent error handling across language boundaries

## Agent Categories

### 🤖 Planning-Only Agents (6)

Focus on analysis, design, coordination, and strategic planning.

- **Enforcer**: Framework compliance and quality threshold enforcement
- **Architect**: Complex planning and consolidation strategies for architectural design
- **Orchestrator**: Coordinates complex multi-step tasks and manages async subagent delegation
- **Code Reviewer**: Reviews code quality, best practices, and framework compliance
- **Bug Triage Specialist**: Investigates bugs, identifies root causes, and implements surgical fixes
- **Security Auditor**: Identifies security vulnerabilities and provides security recommendations

### ⚡ Implementation Agents (2)

Include direct code modification capabilities with surgical precision.

- **Refactorer**: Eliminates technical debt and improves code structure
- **Test Architect**: Designs testing strategies and frameworks

## Agent Capabilities & MCP Integration

### Core Agent Capabilities Matrix

| Agent                     | Primary Role                                    | Key Tools                                                                                        | Permissions                         | Conflict Strategy   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------- | ------------------- |
| **enforcer**              | Codex compliance & error prevention             | `read`, `grep`, `lsp_*`, `run_terminal_cmd`, `lsp_diagnostics`, `lsp_code_actions`               | edit: allow, bash: git/npm/bun      | Block on violations |
| **architect**             | System design & technical decisions             | `read`, `grep`, `lsp_*`, `run_terminal_cmd`, `background_task`, `lsp_goto_definition`            | edit: allow, bash: git/npm/bun      | Expert priority     |
| **orchestrator**          | Multi-agent workflow coordination               | `read`, `grep`, `lsp_*`, `run_terminal_cmd`, `background_task`, `call_omo_agent`, `session_*`    | edit: allow, bash: git/npm/bun      | Consensus           |
| **bug-triage-specialist** | Error investigation & surgical fixes            | `read`, `grep`, `lsp_*`, `run_terminal_cmd`, `ast_grep_search`, `ast_grep_replace`               | edit: allow, bash: git/npm/bun      | Majority vote       |
| **code-reviewer**         | Quality assessment & standards validation       | `read`, `grep`, `lsp_*`, `run_terminal_cmd`, `lsp_diagnostics`, `lsp_code_actions`               | edit: allow, bash: git/npm/bun      | Expert priority     |
| **security-auditor**      | Vulnerability detection & compliance            | `read`, `grep`, `lsp_*`, `run_terminal_cmd`, `grep_app_searchGitHub`                             | edit: allow, bash: git/npm/bun      | Block on critical   |
| **refactorer**            | Technical debt elimination & code consolidation | `read`, `grep`, `lsp_*`, `run_terminal_cmd`, `ast_grep_search`, `ast_grep_replace`, `lsp_rename` | edit: allow, bash: git/npm/bun      | Majority vote       |
| **test-architect**        | Testing strategy & coverage optimization        | `read`, `grep`, `lsp_*`, `run_terminal_cmd`, `run_terminal_cmd`                                  | edit: allow, bash: git/npm/bun/test | Expert priority     |

#### MCP Server Integration

- **9 MCP Servers**: 7 agent-specific servers + 2 knowledge skill servers
- **Knowledge Skills**: project-analysis, testing-strategy, architecture-patterns, performance-optimization, git-workflow, api-design
- **Protocol**: Model Context Protocol for standardized AI integration

### Plugin Ecosystem Architecture

- **Plugin States**: registered → validated → activated → running → deactivated
- **Hook System**: `agent.start`, `tool.execute.before`, `tool.execute.after` hooks
- **Security Sandboxing**: VM isolation, resource limits, module restrictions
- **Hot-Reload**: Dynamic plugin updates without framework restart

## Agent Implementation

**Important**: StrRay agents are implemented as TypeScript `AgentConfig` objects in the `src/agents/` directory, not YAML files. oh-my-opencode loads agents from compiled TypeScript modules, not YAML configurations.

Example agent implementation:

```typescript
export const agentName: AgentConfig = {
  name: "agent-name",
  model: "opencode/grok-code",
  description: "Agent description",
  mode: "subagent",
  system: "System prompt...",
  temperature: 0.1,
  tools: { include: ["tool1", "tool2"] },
  permission: { edit: "allow" },
};
```

## Framework Principles

StrRay implements Universal Development Codex v1.2.20 principles:

1. Progressive prod-ready code
2. No over-engineering
3. Shared global state
4. Single source of truth
5. DRY principles
6. SOLID architecture
7. Test-driven development
8. Documentation as code
9. Performance first
10. Security by design

## Tool Integration

Available tools include bash, read, glob, grep, edit, write, webfetch, websearch, codesearch, and skill loading within the oh-my-opencode framework.

## Response Format

Agents use structured responses: Analysis, Design, Plan, Validation.

## Complete Agent Specifications

For detailed specifications of all agents, including current oh-my-opencode integration details and conceptual framework capabilities, see [COMPREHENSIVE_AGENTS.md](./COMPREHENSIVE_AGENTS.md).

## Agent Classification

For information on planning vs coding agent categories and decision trees, see [AGENT_CLASSIFICATION.md](./AGENT_CLASSIFICATION.md).

## Operating Procedures

For workflow execution guides and communication protocols, see [OPERATING_PROCEDURES.md](./OPERATING_PROCEDURES.md).

## Performance Monitoring

For agent monitoring and optimization guidance, see [PERFORMANCE_MONITORING.md](./PERFORMANCE_MONITORING.md).

---

_This overview provides a high-level introduction to StrRay agents. For complete technical specifications, refer to the comprehensive documentation._
