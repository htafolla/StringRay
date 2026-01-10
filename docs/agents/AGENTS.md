# StrRay Framework - oh-my-opencode Integration

**StrRay integrates as a complementary enhancement to oh-my-opencode's orchestration system**, providing advanced multi-agent capabilities for complex development tasks.

## Integration Architecture

**Dual Orchestration Model:**

- **oh-my-opencode**: Primary orchestration (Prometheus planner + Sisyphus executor)
- **StrRay**: Advanced multi-agent delegation for complex tasks
- **Complementary**: Both systems work together, each handling appropriate task types

### Workflow Integration

```
User Request → oh-my-opencode Planning → Task Complexity Analysis → Route to Appropriate System
                                                            │
                                                            ├── Simple Tasks → oh-my-opencode Agents
                                                            └── Complex Tasks → StrRay Multi-Agent Orchestration
```

### Agent Ecosystem

**oh-my-opencode Built-in Agents:**

- Librarian, Explore, Oracle, Frontend, Document-Writer, Multimodal-Looker
- General-purpose development assistance
- Integrated planning and execution workflow

**StrRay Specialized Agents:**

- Enforcer, Architect, Orchestrator, Bug-Triage-Specialist, Code-Reviewer, Security-Auditor, Refactorer, Test-Architect
- Advanced multi-agent orchestration
- Codex compliance and systematic error prevention

### Plugin Registration

**OpenCode Configuration:**

```json
~/.config/opencode/opencode.json
{
  "plugin": ["oh-my-opencode", "stringray-framework"]
}
```

**Separate Configuration Files:**

- `oh-my-opencode.json` - oh-my-opencode settings
- `strray-config.json` - StrRay-specific settings

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

StrRay uses a **hybrid TypeScript/Python architecture** with three key directory layers:

#### `.opencode/` Directory (oh-my-opencode Integration Layer)

**Purpose**: Complete oh-my-opencode ecosystem integration

**Contains:**

- **oh-my-opencode Configuration**: `oh-my-opencode.json`, `enforcer-config.json`
- **StrRay Python Backend**: `src/strray/` - BaseAgent classes and orchestration
- **Agent Specifications**: `agents/*.yml` - YAML specs for both oh-my-opencode and StrRay agents
- **Plugin System**: `plugin/` - Codex injection and framework integration
- **MCP Servers**: `mcps/` - 11 Model Context Protocol server implementations

- **Agent Specs**: `agents/*.yml` - Detailed YAML specifications
- **MCP Servers**: `mcps/` - 11 Model Context Protocol server implementations
- **Boot System**: `init.sh` - Orchestrator-first initialization

#### `src/` Directory (TypeScript Implementation Layer)

**Purpose**: Core TypeScript implementations and agent definitions

**Contents:**

- **Agent Implementations**: `agents/*.ts` - 8 full AgentConfig objects with system prompts
- **Framework Core**: `orchestrator.ts`, `delegation/`, `processors/` - Core orchestration logic
- **Plugin Integration**: `codex-injector.ts` - Codex injection hooks
- **State Management**: `state/`, `context-loader.ts` - Persistence and configuration

#### `docs/` Directory (Documentation Layer)

**Purpose**: Comprehensive framework documentation and specifications

**Contents:**

- **AGENTS.md**: Complete agent specifications and orchestration details (THIS FILE)
- **Architecture docs**: Framework design and integration guides
- **API docs**: Component interfaces and usage patterns

### Architecture Flow

```
User Request → .opencode/plugin (hooks) → src/delegation (analysis) → src/agents (execution) → .opencode/src/strray (backend coordination)
```

### Key Integration Points

- **Plugin Hooks** (`.opencode/plugin/`) trigger **delegation analysis** (`src/delegation/`)
- **Agent Execution** (`src/agents/`) uses **Python backend** (`.opencode/src/strray/`) for advanced features
- **Configuration** flows from **JSON settings** to **TypeScript agents** to **Python orchestration**

### Configuration Architecture

**Three-tier configuration system for clean separation:**

#### 📁 Configuration Architecture Now:

```
├── .opencode/oh-my-opencode.json    # oh-my-opencode settings only
├── ~/.config/opencode/opencode.json  # Plugin registration
└── .strray/config.json              # StrRay-specific settings
```

#### 🎯 Settings Separation:

**.opencode/oh-my-opencode.json** (oh-my-opencode):

```json
{
  "disabled_agents": [],
  "model_routing": {...}
}
```

**.strray/config.json** (StrRay):

```json
{
  "multi_agent_orchestration": {
    "enabled": true,
    "max_concurrent_agents": 3,
    "conflict_resolution": "expert-priority"
  },
  "sisyphus_orchestrator": {
    "enabled": true,
    "relentless_execution": true
  },
  "agents": {...}
}
```

**Benefits:** Clean separation prevents configuration conflicts and allows independent evolution of each system.

### Development Workflow

1. **Plan with oh-my-opencode**: Use `@plan` and `/start-work` for task planning and execution
2. **Complex tasks route to StrRay**: Automatic complexity analysis triggers StrRay orchestration
3. **Configure StrRay**: Edit `strray-config.json` for framework-specific settings
4. **Monitor integration**: Both systems work together seamlessly

### Architecture Benefits

- **Best of both worlds**: oh-my-opencode planning + StrRay advanced orchestration

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
- **MCP Servers**: **11 MCP servers** (7 agent-specific + 4 knowledge skills)
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

- **11 MCP Servers**: 7 agent-specific servers + 4 knowledge skill servers
- **Knowledge Skills**: project-analysis, testing-strategy, architecture-patterns, performance-optimization, git-workflow, api-design
- **Protocol**: Model Context Protocol for standardized AI integration

### Plugin Ecosystem Architecture

- **Plugin States**: registered → validated → activated → running → deactivated
- **Hook System**: `agent.start`, `tool.execute.before`, `tool.execute.after` hooks
- **Security Sandboxing**: VM isolation, resource limits, module restrictions
- **Hot-Reload**: Dynamic plugin updates without framework restart

## Multi-Agent Orchestration System

**StrRay implements comprehensive automatic multi-agent orchestration** through intelligent complexity analysis and agent delegation.

### Orchestration Architecture

**Complexity-Driven Delegation:**

- **ComplexityAnalyzer**: Automatically evaluates task complexity using 6 metrics
- **AgentDelegator**: Routes tasks to appropriate agents based on analysis
- **Configuration Control**: `multi_agent_orchestration` settings control behavior

**Agent-Level Coordination:**

- **Orchestrator Agent**: Uses `call_omo_agent` tool to coordinate other agents
- **Parallel Execution**: `background_task` support for concurrent operations
- **Conflict Resolution**: Multiple strategies (expert priority, majority vote, consensus)

### Orchestration Flow

**✅ IMPLEMENTED: Automatic Triggering**

- Plugin hooks automatically analyze complexity on every tool execution
- Tasks with score > 70 automatically trigger multi-agent delegation
- Tasks with score > 95 automatically trigger orchestrator-led workflows
- No manual intervention required - fully automatic orchestration

### Complete Flow

```
User Request → Complexity Analysis → Delegation Decision → Agent Execution → Result Consolidation
```

**Automatic Multi-Agent Triggers:**

- Tasks with score > 70 → Multi-agent execution
- Tasks with score > 95 → Orchestrator-led enterprise workflow
- Configurable concurrent agent limits
- Background task execution for parallel processing

### Python Backend Integration

**Advanced Orchestration Components:**

- **BaseAgent Class**: Full Python implementation with async coordination
- **AsyncCoordinator**: Workflow management with dependency graphs
- **State Management**: Persistent agent state across sessions
- **Communication Bus**: Inter-agent messaging infrastructure

**Key Python Components:**

- `strray.core.agent.BaseAgent` - Agent base class with AI integration
- `strray.core.orchestration.AsyncCoordinator` - Multi-agent workflow coordination
- `strray.config.manager.ConfigManager` - Multi-source configuration loading
- `strray.performance.monitor.PerformanceMonitor` - Resource tracking
- `strray.security.InputValidator` - Security validation

### Configuration Integration

**Multi-Agent Settings** (`.opencode/oh-my-opencode.json`):

```json
{
  "multi_agent_orchestration": {
    "enabled": true,
    "coordination_model": "async-multi-agent",
    "max_concurrent_agents": 3,
## Agent Implementation Architecture

**StrRay uses a hybrid implementation approach:**

### TypeScript Layer (`src/agents/*.ts`)
**8 Core StrRay Agents** implemented as `AgentConfig` objects with:
- Detailed system prompts and operating protocols
- Tool configurations and permissions
- Integration points and capabilities
- oh-my-opencode compatibility

### Python Backend (`.opencode/src/strray/`)
**Advanced orchestration infrastructure:**
- `BaseAgent` class with async coordination
- State management and persistence
- AI service integration
- Performance monitoring
- Security validation

### Configuration Layer
**YAML specs** (`.opencode/agents/*.yml`) provide detailed specifications
**JSON configs** (`.opencode/oh-my-opencode.json`) control runtime behavior

**Important**: Agents are **fully implemented TypeScript objects**, not just configurations. The Python backend provides supporting infrastructure for advanced orchestration features.

Example agent implementation:

    "conflict_resolution": "expert-priority"
  },
  "sisyphus_orchestrator": {
    "enabled": true,
    "relentless_execution": true,
    "max_retries": 3
  }
}
```

**Delegation respects these settings automatically.**

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

## Common Misunderstandings & Clarifications

**This section addresses frequent confusion points in the integrated oh-my-opencode + StrRay architecture.**

### Dual System Architecture

- **oh-my-opencode**: Primary orchestration (Prometheus + Sisyphus) for planning and general tasks
- **StrRay**: Advanced multi-agent delegation for complex, specialized tasks
- **Integration**: Both systems coexist without conflicts, automatic task routing
- **Configuration**: Separate config files prevent interference

### Agent Ecosystems

- **oh-my-opencode Agents**: Librarian, Explore, Oracle, Frontend, Document-Writer, Multimodal-Looker
- **StrRay Agents**: Enforcer, Architect, Orchestrator, Bug-Triage-Specialist, Code-Reviewer, Security-Auditor, Refactorer, Test-Architect
- **No Conflicts**: Different agent names and separate registration systems
- **Complementary**: Each system handles appropriate task types

### Plugin Integration

- **StrRay Framework is integrated within oh-my-opencode - no separate plugin registration required.**
- **Configuration Files**: `.opencode/oh-my-opencode.json` (includes StrRay agents), `.strray/config.json` (optional)
- **Clean Separation**: No mixing of configuration concerns

### Multi-Agent Orchestration

- **Architecture**: Orchestration happens at **agent level** via `call_omo_agent` tool, not processor pipeline
- **Automatic**: Complexity analysis automatically triggers multi-agent execution (score > 70)
- **Configuration**: `multi_agent_orchestration` settings control behavior, delegation respects them
- **Coordination**: Orchestrator agent manages multi-agent workflows with 6-phase protocol

### Directory Structure Confusion

- **`.opencode/`**: oh-my-opencode integration, Python backend, YAML specs, MCP servers
- **`src/`**: TypeScript implementations, agent configs, core orchestration logic
- **`docs/`**: Documentation and specifications (including this file)

### Component Interactions

- **Plugin Hooks** → **Delegation System** → **Agent Execution** → **Python Backend**
- **Configuration** flows: JSON settings → TypeScript agents → Python orchestration
- **Multi-agent** coordination: Agent-level via `call_omo_agent` tool

### Testing Approach

- **Mock-based testing** required due to oh-my-opencode plugin architecture
- **Direct Node.js execution fails** with ES6 import conflicts
- **Integration testing** through oh-my-opencode runtime, not direct imports

### Framework Completeness

- **100% Complete**: Comprehensive implementations across all layers with automatic multi-agent triggering
- **Multi-agent orchestration**: Fully functional at agent level
- **Codex compliance**: 45-term enforcement with zero-tolerance blocking
- **Enterprise features**: Distributed state, performance monitoring, security

**Reference this document for accurate framework understanding. Updates made here ensure consistent knowledge across all sessions.**
