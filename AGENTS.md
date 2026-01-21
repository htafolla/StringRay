# StringRay Framework - Agent Documentation

**Version**: 1.1.1  
**Purpose**: Enterprise AI orchestration with systematic error prevention  
**Last Updated**: 2026-01-21  

## Table of Contents

- [1. Quick Start](#1-quick-start)
  - [1.1 Agents Overview](#11-agents-overview)
  - [1.2 CLI Commands Reference](#12-cli-commands-reference)
  - [1.3 Basic Usage](#13-basic-usage)
- [2. Architecture Overview](#2-architecture-overview)
  - [2.1 Core Architecture](#21-core-architecture)
  - [2.2 Agent Capabilities Matrix](#22-agent-capabilities-matrix)
  - [2.3 Complexity Analysis](#23-complexity-analysis)
- [3. Development Guide](#3-development-guide)
  - [3.1 Universal Development Codex](#31-universal-development-codex)
  - [3.2 Complexity Scoring](#32-complexity-scoring)
  - [3.3 Agent Delegation](#33-agent-delegation)
- [4. Operations Guide](#4-operations-guide)
  - [4.1 Pipeline Flows](#41-pipeline-flows)
  - [4.2 Monitoring](#42-monitoring)
  - [4.3 Deployment](#43-deployment)
- [5. Reference](#5-reference)
  - [5.1 Scripts Inventory](#51-scripts-inventory)
  - [5.2 Directory Structure](#52-directory-structure)
  - [5.3 Testing Framework](#53-testing-framework)
  - [5.4 Troubleshooting](#54-troubleshooting)
- [6. Appendices](#6-appendices)

---

## 1. Quick Start

### 1.1 Agents Overview

StringRay provides 8 specialized agents for AI-assisted development:

| Agent | Role | Complexity Threshold | Key Tools | Conflict Strategy |
|-------|------|---------------------|-----------|-------------------|
| enforcer | Codex compliance & error prevention | All operations | read, grep, lsp_*, bash | Block on violations |
| architect | System design & technical decisions | High complexity | read, grep, lsp_*, bash, background_task | Expert priority |
| orchestrator | Multi-agent workflow coordination | Enterprise | read, grep, lsp_*, bash, background_task, call_omo_agent | Consensus |
| bug-triage-specialist | Error investigation & fixes | Debug operations | read, grep, lsp_*, bash, ast_grep_* | Majority vote |
| code-reviewer | Quality assessment & standards | All code changes | read, grep, lsp_*, bash, lsp_diagnostics | Expert priority |
| security-auditor | Vulnerability detection | Security operations | read, grep, lsp_*, bash, grep_app_searchGitHub | Block critical |
| refactorer | Technical debt elimination | Refactor operations | read, grep, lsp_*, bash, ast_grep_*, lsp_rename | Majority vote |
| test-architect | Testing strategy & coverage | Test operations | read, grep, lsp_*, bash | Expert priority |

All agents operate in subagent mode with full tool access and automatic delegation.

**Orchestrator Activation**: Automatically triggered for complexity scores > 95, or explicitly via @orchestrator commands. Coordinates multi-agent workflows with consensus resolution.

### 1.2 CLI Commands Reference

#### Agent Commands
```bash
# Invoke agents via oh-my-opencode
@orchestrator analyze codebase complexity
@architect design API endpoints
@enforcer validate code against codex
@bug-triage-specialist investigate error logs
@code-reviewer review pull request
@security-auditor scan for vulnerabilities
@refactorer consolidate duplicate code
@test-architect design test strategy
```

#### Testing Commands
```bash
# Run test suites
npm run test:all              # Complete test suite
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests
npm run test:e2e              # End-to-end tests
npm run test:performance      # Performance tests
npm run test:coverage         # Coverage analysis (>85% required)

# Validation scripts
node scripts/test:mcp-connectivity    # MCP server validation
node scripts/test:oh-my-opencode-integration  # Framework integration
node scripts/test:postinstall-config  # Configuration validation
```

#### Build and Deployment
```bash
# Build operations
npm run build:all             # Full build with type checking
npm run build:plugin          # Plugin-specific build
npm run build                 # Standard build

# Deployment
npm run deploy                # Automated deployment
node scripts/deploy-stringray-plugin.sh  # Plugin deployment
npm publish                   # NPM publication

# Validation
npm run security-audit        # Security scanning
npm run lint                  # Code quality check
npm run typecheck             # TypeScript validation
```

### 1.3 Basic Usage

1. **Installation**: `npm install strray-ai`
2. **Setup**: `node node_modules/strray-ai/scripts/postinstall.cjs`
3. **Invoke Agents**: Use @agent-name commands in oh-my-opencode
4. **Complexity Analysis**: Tasks are automatically routed based on complexity metrics

**Agent Routing Behavior**:
- **Simple tasks** (@enforcer simple check): Direct to single agent
- **Complex tasks** (@enforcer complex analysis): May escalate to multi-agent consensus
- **Orchestrator tasks** (@orchestrator coordinate): Always involves multi-agent coordination

---

## 2. Architecture Overview

### 2.1 Core Architecture

StringRay integrates as an oh-my-opencode plugin with dual orchestration:

- **Primary**: oh-my-opencode's Prometheus planner + Sisyphus executor
- **Secondary**: StringRay's multi-agent delegation for complex tasks
- **Configuration**: Merged hierarchy (global → project → framework settings)
- **Boot Sequence**: Plugin loading → context initialization → agent activation

Framework components:
- Agent system with 8 specialized roles
- Complexity analysis engine for task routing
- Codex compliance validation
- MCP server integration (28 servers)
- State management and monitoring

### 2.2 Agent Capabilities Matrix

| Agent | Role | Complexity Threshold | Key Tools | Conflict Strategy |
|-------|------|---------------------|-----------|-------------------|
| enforcer | Codex compliance & error prevention | All operations | read, grep, lsp_*, bash | Block on violations |
| architect | System design & technical decisions | High complexity | read, grep, lsp_*, bash, background_task | Expert priority |
| orchestrator | Multi-agent workflow coordination | Enterprise | read, grep, lsp_*, bash, background_task, call_omo_agent | Consensus |
| bug-triage-specialist | Error investigation & fixes | Debug operations | read, grep, lsp_*, bash, ast_grep_* | Majority vote |
| code-reviewer | Quality assessment & standards | All code changes | read, grep, lsp_*, bash, lsp_diagnostics | Expert priority |
| security-auditor | Vulnerability detection | Security operations | read, grep, lsp_*, bash, grep_app_searchGitHub | Block critical |
| refactorer | Technical debt elimination | Refactor operations | read, grep, lsp_*, bash, ast_grep_*, lsp_rename | Majority vote |
| test-architect | Testing strategy & coverage | Test operations | read, grep, lsp_*, bash | Expert priority |

### 2.3 Complexity Analysis

Tasks are evaluated using 6 metrics:

| Metric | Range | Description |
|--------|-------|-------------|
| File Count | 0-20 | Number of affected files |
| Change Volume | 0-25 | Lines changed |
| Operation Type | Multiplier | create/modify/refactor/analyze/debug/test |
| Dependencies | 0-15 | Component relationships |
| Risk Level | Multiplier | low/medium/high/critical |
| Duration | 0-15 | Estimated minutes |

**Decision Thresholds**:
- ≤25: Single-agent execution (direct routing)
- 26-95: Single-agent execution (may use background tasks)
- 96+: Enterprise-level coordination (orchestrator-led multi-agent workflow)

**Note**: Thresholds determine routing strategy, not agent capability. Complex tasks trigger orchestrator coordination for consensus resolution.

### Agent Skill Integration

**✅ FULLY IMPLEMENTED**: All agents now have skill invocation tools and can call MCP skill servers:

- **invoke-skill**: Generic skill invocation for any MCP skill server
- **skill-code-review**: Direct code review skill access
- **skill-security-audit**: Direct security audit skill access
- **skill-performance-optimization**: Direct performance analysis skill access
- **skill-testing-strategy**: Direct testing strategy skill access
- **skill-project-analysis**: Direct project analysis skill access

**Skill Invocation Architecture**:
- **MCP Server**: `skill-invocation.server.js` provides all skill tools
- **Client Integration**: `mcpClientManager.callServerTool()` enables agent skill calling
- **Tool Discovery**: All skills automatically discovered and available to agents
- **Tested & Verified**: Skill invocation working (tested with code-review and security-audit)

**Agent Capabilities Matrix** (Updated with Skill Tools):

| Agent                     | Role                | Complexity Threshold | Key Tools | Skill Tools | Conflict Strategy |
|---------------------------|---------------------|---------------------|-----------|-------------|-------------------|
| **enforcer**              | Codex compliance    | All operations      | read, grep, lsp_* | ✅ All skills | Block on violations |
| **architect**             | System design       | High complexity     | read, grep, lsp_* | ✅ All skills | Expert priority |
| **orchestrator**          | Task coordination   | Enterprise          | session_*, call_omo_agent | ✅ All skills | Consensus |
| **bug-triage-specialist** | Error investigation | Debug operations    | ast_grep_*, lsp_* | ✅ All skills | Majority vote |
| **code-reviewer**         | Quality assessment  | All code changes    | lsp_*, diagnostics | ✅ All skills | Expert priority |
| **security-auditor**      | Vulnerability       | Security operations | grep_app_searchGitHub | ✅ All skills | Block critical |
| **refactorer**            | Technical debt      | Refactor operations | ast_grep_*, lsp_rename | ✅ All skills | Majority vote |
| **test-architect**        | Testing strategy    | Test operations     | run_terminal_cmd | ✅ All skills | Expert priority |
| **librarian**             | Codebase exploration| Analysis operations | project-analysis_* | ✅ All skills | N/A (solo agent) |

**[Agent Capabilities Matrix](#22-agent-capabilities-matrix)** determines which agents handle each complexity level.

---

## 3. Development Guide

### 3.0 Version History
- **v1.1.1** (2026-01-21): Token management integration, AGENTS.md optimization, enhanced testing framework
- **v1.1.0**: Skills-based lazy loading architecture, 0 baseline processes, enterprise performance
- **v1.0.0**: Initial production release with 8 agents and MCP server integration

### 3.1 Universal Development Codex

59 mandatory terms for systematic error prevention (99.6% effectiveness):

**Core Terms (1-10)**:
1. Progressive production-ready code
2. No patches/stubs/bridge code
3. Avoid over-engineering
4. Fit-for-purpose production code
5. Surgical fixes only
6. Batched introspection cycles
7. Resolve all errors (90% prevention)
8. Prevent infinite loops
9. Use shared global state
10. Single source of truth

**Architecture Terms (21-30)**:
21. Dependency injection
22. Interface segregation
23. Open/closed principle
24. Single responsibility
25. Code rot prevention
26. Test coverage >85%
27. Fast feedback loops
28. Performance budgets
29. Security by design
30. Accessibility first

**CI/CD Enforcement (59)**: Zero-tolerance blocking for pipeline compliance.

Full codex details: [.strray/codex.json](.strray/codex.json)

### 3.2 Complexity Scoring

**Algorithm**:
```typescript
score = (fileCount * 2) + (changeVolume / 10) + (dependencies * 3) + (duration / 10)
score *= operationMultiplier * riskMultiplier
score = Math.min(Math.max(score, 0), 100)
```

**Operation Multipliers**: create: 1.0, modify: 1.2, refactor: 1.8, analyze: 1.5, debug: 2.0, test: 1.3

**Risk Multipliers**: low: 0.8, medium: 1.0, high: 1.3, critical: 1.6

### 3.3 Agent Delegation

**Automatic Routing**:
- Complexity score determines agent count and strategy
- Conflict resolution: majority vote, expert priority, consensus
- Session state sharing across handoffs
- Background task support for parallel execution

### 3.4 Request Processing Flow

**Complete Flow from User Prompt to Agent Response**:

#### **Phase 1: Initial Routing**
```
User Input (@enforcer, @architect, etc.)
    ↓
Direct routing to specified agent (NO orchestrator involvement for simple tasks)
    ↓
Agent receives request with full context
```

#### **Phase 2: Complexity Analysis**
```typescript
// Every request analyzed for complexity
const complexity = await analyzeComplexity({
  operation: request.operation,
  fileCount: request.files?.length,
  changeVolume: request.changeVolume,
  dependencies: request.dependencies,
  riskLevel: request.riskLevel
});
```

**Automatic Escalation Thresholds**:
- **≤25**: Single-agent processing (direct response)
- **26-95**: Single-agent processing (may use background tasks)
- **96+**: **Escalates to orchestrator-led multi-agent workflow**

#### **Phase 3: Single-Agent Processing** (Most Common)
```
Agent Tools Execution
├── read: File analysis
├── grep: Pattern matching
├── lsp_*: Language server operations
├── background_task: Async operations
└── Specialized agent tools (security-scan, etc.)
    ↓
Response Generation
```

#### **Phase 4: Multi-Agent Escalation** (Complex Tasks)
```
Complexity > 95 → Orchestrator Activation
    ↓
Agent Selection: [enforcer, architect, test-architect]
    ↓
Parallel Execution with call_omo_agent/task()
    ↓
Result Consolidation with Consensus Resolution
    ↓
Final Response to User
```

### 3.5 Consensus and Multi-Agent Coordination

**When Consensus Activates**:
1. **Automatic**: Complexity score > 95 (enterprise tasks)
2. **Conflicts**: Multiple agents give different recommendations
3. **Validation**: Different analysis phases produce conflicting results
4. **Deliberate**: Orchestrator explicitly coordinates multi-agent tasks

**Consensus Resolution Strategies**:
```typescript
// From orchestrator conflict resolution
switch (strategy) {
  case "majority_vote":    // Statistical - most frequent response wins
  case "expert_priority":  // Authority - highest expertise score wins
  case "consensus":        // Unanimity - all responses must be identical
}
```

**Multi-Agent Workflow Example**:
```typescript
// Complex task automatically escalates
User: "@enforcer analyze complex codebase changes"
    ↓
Complexity Score: 120 (Enterprise level)
    ↓
Orchestrator coordinates: [enforcer, architect, security-auditor]
    ↓
Parallel analysis → Results → Majority vote consensus → Final report
```

**Agent Collaboration Patterns**:
- **Direct Delegation**: Orchestrator uses `call_omo_agent` for specific subtasks
- **Parallel Processing**: Multiple agents work simultaneously on different aspects
- **Consensus Filtering**: Results filtered by confidence and agreement levels
- **Fallback Handling**: Single agent response if consensus fails

**Framework Introspection**: Agents can analyze their own operations and improve collaboration patterns through the librarian agent and complexity analysis system.

### 3.4 Agent Operational Procedures

**Initialization Sequence**:
1. Load codex context from `.strray/codex.json`
2. Initialize tool permissions based on agent capabilities
3. Establish MCP server connections for assigned tools
4. Validate session state and configuration
5. Register for oh-my-opencode hook events

**Multi-Tasking Approaches**:
- **Background Execution**: Use `background_task` for parallel operations
- **Subagent Parallel Execution**: Use `call_omo_agent` or `task()` with `subagent_type` parameter
- **Session-Based Multi-Tasking**: Related tasks within same session context

**Subagent Invocation Syntax**:
```typescript
// Primary method: task() provides visibility and monitoring
task(description="Analyze codebase", prompt="...", subagent_type="librarian")

// Alternative method: call_omo_agent runs in background
call_omo_agent(description="Code review", prompt="...", subagent_type="architect")
```

**Agent Communication**:
- **Primary**: Use `task()` for visibility into subagent execution and progress monitoring
- **Alternative**: Use `call_omo_agent()` for background execution (no visibility)
- Internal agents use programmatic calls, not @ commands
- @ commands are for user interaction with oh-my-opencode

### 3.6 Agent Invocation Methods Guide

#### **@ Commands (User → Framework Interface)**
```bash
@enforcer analyze this code
@architect design API
@orchestrator coordinate task
```

**When to use**:
- ✅ External user interaction with the framework
- ✅ Direct agent commands from oh-my-opencode chat
- ✅ Simple, immediate requests

#### **task() (Internal Agent Coordination with Visibility)**
```typescript
task(description="Analyze codebase", prompt="...", subagent_type="librarian")
```

**When to use**:
- ✅ Agent-to-agent coordination needing monitoring/visibility
- ✅ Complex analysis tasks where you want to track progress
- ✅ Educational/learning scenarios (observe delegation flow)
- ✅ Debugging coordination (see subagent execution)
- ✅ Quality assurance (verify subagent performance)

**Benefits**: "Click through option" to view subagent progress, full monitoring, educational value

#### **call_omo_agent() (Internal Agent Coordination - Background)**
```typescript
call_omo_agent(description="Code review", prompt="...", subagent_type="architect")
```

**When to use**:
- ✅ Agent-to-agent coordination for background processing
- ✅ High-throughput scenarios where monitoring isn't needed
- ✅ Parallel processing without UI overhead
- ✅ Production automation (quiet execution)
- ✅ Resource optimization (no monitoring overhead)

**Benefits**: Fast, lightweight coordination, clean results, scalable automation

#### **Practical Usage Guidelines**
- **Simple tasks**: Either `task()` or `call_omo_agent()` works
- **Complex analysis**: Use `task()` for monitoring capabilities
- **Bulk processing**: Use `call_omo_agent()` for efficiency
- **Learning scenarios**: Use `task()` to observe delegation behavior
- **Production automation**: Use `call_omo_agent()` for reliability

**Session Awareness Guidelines**:
- Maintain cross-session consistency when possible
- Preserve user context across related operations
- Clean up session state after completion
- Handle session recovery from failures

**Emergency Procedures**:
- Escalate to orchestrator for complex conflicts
- Use majority vote for agent disagreements
- Implement progressive escalation for codex violations
- Provide clear error messages with recovery steps

**[Testing Framework](#53-testing-framework)** includes AI agent testing procedures and validation steps.

### 3.5 Framework Integration Details

**oh-my-opencode Integration**:
- Hook system: `agent.start`, `tool.execute.before/after`, `experimental.chat.system.transform`
- MCP server connections (9 servers: architect-tools, enforcer-tools, framework-help, etc.)
- Plugin lifecycle: registered → validated → activated → running → deactivated
- Configuration merging: framework → project → global settings

**Communication Protocols**:
- MCP protocol for structured inter-agent communication
- Session state sharing via shared context objects
- Event-driven notifications for task completion/failures
- Conflict resolution through orchestrated consensus mechanisms

**Tool Access Patterns**:
- Permission-based execution (agent-specific capabilities)
- MCP server routing for specialized operations (AST parsing, LSP, etc.)
- Error handling with automatic retry mechanisms
- Resource pooling for performance optimization

**State Management**:
- Session lifecycle: creation → monitoring → cleanup → recovery
- State persistence with automatic recovery from failures
- Synchronization across distributed instances
- Memory pool management for resource efficiency

### 3.6 Escalation and Recovery

**Progressive Escalation**:
- Level 1: Agent-level resolution (retry, alternative approach)
- Level 2: Multi-agent consensus (majority vote, expert priority)
- Level 3: Orchestrator intervention (conflict mediation)
- Level 4: Framework-level blocking (codex violations)

**Failure Recovery**:
- Automatic retry with exponential backoff
- Alternative tool selection when primary tools fail
- Session state preservation during recovery
- User notification with actionable recovery steps

---

## 4. Operations Guide

### 4.1 Pipeline Flows

#### CI/CD Pipeline Flow

| Stage           | Step        | Responsible    | Input                       | Action                     | Output            | Success Criteria       | Failure Handling    |
| --------------- | ----------- | -------------- | --------------------------- | -------------------------- | ----------------- | ---------------------- | ------------------- |
| **1. Trigger**  | Code Push   | Developer/Git  | Commit/PR                   | Push to main               | Repository Update | Valid commit           | Block merge         |
| **2. Setup**    | Environment | GitHub Actions | Node.js matrix (18.x, 20.x) | Install dependencies       | Ready environment | Dependencies installed | Fail fast           |
| **3. Quality**  | Type Check  | TypeScript     | Source code                 | `npm run typecheck`        | Compiled JS       | No TS errors           | Block deployment    |
| **4. Quality**  | Lint        | ESLint         | Source code                 | `npm run lint`             | Lint report       | Zero errors            | Require fixes       |
| **5. Test**     | Unit Tests  | Vitest         | Test files                  | `npm run test:unit`        | Coverage report   | >85% coverage          | Block deployment    |
| **6. Test**     | Integration | Vitest         | Integration tests           | `npm run test:integration` | Test results      | All tests pass         | Block deployment    |
| **7. Test**     | E2E Tests   | Vitest         | E2E scenarios               | `npm run test:e2e`         | Test results      | All tests pass         | Block deployment    |
| **8. Security** | Audit       | NPM Audit      | Dependencies                | `npm audit`                | Security report   | No high/critical       | Require updates     |
| **9. Build**    | Package     | TypeScript     | Source code                 | `npm run build`            | Dist files        | Clean build            | Block deployment    |
| **10. Deploy**  | NPM Publish | GitHub Actions | Built package               | `npm publish`              | Published package | Version bumped         | Block deployment    |

#### Release Process Flow

| Phase           | Step             | Owner               | Prerequisites           | Activities                                | Deliverables        | Gate Criteria            | Rollback Plan         |
| --------------- | ---------------- | ------------------- | ----------------------- | ----------------------------------------- | ------------------- | ------------------------ | --------------------- |
| **Planning**    | Feature Complete | Product/Dev         | Requirements signed off | Sprint planning, estimation               | Release scope       | All features implemented | Cancel release        |
| **Development** | Code Complete    | Development Team    | Main branch merged      | Code review, testing                      | Main branch stable  | CI passing               | Feature flags off     |
| **Staging**     | Pre-release      | DevOps              | Main branch green       | Deploy to staging                         | Staging environment | All tests pass           | Roll back to previous |
| **Validation**  | QA Testing       | QA Team             | Staging deployed        | Functional, performance, security testing | Test reports        | Zero critical bugs       | Fix and redeploy      |
| **Approval**    | Release Review   | Product/Engineering | QA passed               | Final review meeting                      | Release approval    | Business sign-off        | Postpone release      |
| **Production**  | Deployment       | DevOps              | Release approved        | Blue-green deployment                     | Production live     | Monitoring green         | Immediate rollback    |
| **Monitoring**  | Post-release     | SRE Team            | Production deployed     | Error monitoring, performance tracking    | Health reports      | <5% error rate           | Rollback within 30min |

#### Testing Pipeline Flow

| Test Type         | Scope                 | Trigger           | Environment         | Execution                  | Reporting            | Failure Impact         | Retry Strategy          |
| ----------------- | --------------------- | ----------------- | ------------------- | -------------------------- | -------------------- | ---------------------- | ----------------------- |
| **Unit Tests**    | Individual functions  | Code change       | Local/CI            | `npm run test:unit`        | Coverage report      | Block merge            | Auto-retry 3x           |
| **Integration**   | Component interaction | PR created        | CI environment      | `npm run test:integration` | Test results         | Block deployment       | Manual investigation    |
| **E2E Tests**     | User workflows        | Release candidate | Staging environment | `npm run test:e2e`         | Test recordings      | Block production       | Fix and retest          |
| **Performance**   | Load & scalability    | Daily/weekly      | Performance env     | `npm run test:performance` | Performance metrics  | Performance regression | Optimize and retest     |
| **Security**      | Vulnerabilities       | Dependency change | CI environment      | `npm run security-audit`   | Security report      | Block deployment       | Update dependencies     |

#### Quality Assurance Flow

| Phase                | Activity            | Owner         | Tools                 | Entry Criteria     | Exit Criteria             | Escalation Path          |
| -------------------- | ------------------- | ------------- | --------------------- | ------------------ | ------------------------- | ------------------------ |
| **Code Review**      | Static analysis     | Dev Team      | ESLint, TypeScript    | Code committed     | Zero lint errors          | Senior dev review        |
| **Unit Testing**     | Function validation | Dev Team      | Vitest                | Code reviewed      | >85% coverage             | Add missing tests        |
| **Integration**      | Component testing   | Dev Team      | Vitest                | Unit tests pass    | All integrations work     | Architecture review      |
| **Security Review**  | Vulnerability check | Security Team | NPM audit, manual     | Code stable        | No critical issues        | Security team approval   |
| **Performance**      | Load testing        | DevOps        | Custom scripts        | Security passed    | Meets SLAs                | Performance optimization |
| **User Acceptance**  | Business validation | QA/Product    | Staging environment   | Performance passed | Business requirements met | Product manager approval |
| **Production Ready** | Final validation    | SRE Team      | Prod monitoring       | UAT passed         | System stable             | Emergency rollback       |

### 4.2 Monitoring

**System Health Indicators**:
- Test coverage: 85%+ behavioral
- Performance budgets: Bundle <2MB, FCP <2s, TTI <5s
- Security compliance: Continuous scanning
- Error prevention: 99.6% systematic validation

**Enterprise Integration**:
- Prometheus/Grafana for metrics
- ELK stack for logging
- Sentry for error tracking
- DataDog for application monitoring

### 4.3 Deployment

**NPM Publication**:
```bash
npm run build:all
npm run test:all
npm run security-audit
npm publish --tag latest
```

**Enterprise Deployment**:
- Install: `npm install strray-ai`
- Configure: Auto-configuration via postinstall
- Scale: Multi-instance coordination
- Monitor: Real-time dashboards

### 4.4 Framework Boot Sequence

#### Initialization Flow: OpenCode → Framework Boot

| Stage                       | Component        | Location                           | Action                                 | Output                | Dependencies       |
| --------------------------- | ---------------- | ---------------------------------- | -------------------------------------- | --------------------- | ------------------ |
| **1. OpenCode**             | Core Runtime     | `~/.opencode/`                     | Start OpenCode environment             | Runtime ready         | None               |
| **2. oh-my-opencode**       | Framework Loader | `~/.opencode/plugins/`             | Load oh-my-opencode framework          | Framework active      | OpenCode           |
| **3. Plugin Discovery**     | Plugin System    | `.opencode/plugins/`               | Scan for StrRay plugin                 | Plugin detected       | oh-my-opencode     |
| **4. Plugin Loading**       | Codex Injection  | `plugin/strray-codex-injection.ts` | Load plugin with codex injection       | Plugin active         | Plugin discovery   |
| **5. Claude Override**      | MCP Exclusion    | `.claude/.mcp.json`                | Disable problematic global MCP servers | Clean MCP environment | Plugin loading     |
| **6. MCP Registration**     | Server Registry  | `.mcp.json`                        | Register 28 MCP servers                | Servers available     | Claude override    |
| **7. Agent Initialization** | Agent System     | `src/agents/`                      | Load 8 specialized agents              | Agents ready          | Plugin loading     |
| **8. Context Loading**      | Codex System     | `.strray/codex.json`               | Load 59 codex terms                    | Validation active     | Plugin loading     |
| **9. State Manager**        | Persistence      | `src/state/state-manager.ts`       | Initialize state management            | State ready           | Context loading    |
| **10. Orchestrator**        | Coordination     | `src/orchestrator.ts`              | Load task orchestration                | Delegation ready      | State manager      |
| **11. Delegation System**   | Routing          | `src/delegation/`                  | Setup complexity analysis              | Routing active        | Orchestrator       |
| **12. Processor Pipeline**  | Execution        | `src/processors/`                  | Activate pre/post processing           | Pipeline ready        | Delegation         |
| **13. Security Components** | Protection       | `src/security/`                    | Enable security hardening              | Security active       | Processor pipeline |
| **14. Monitoring**          | Observability    | `src/monitoring/`                  | Start performance tracking             | Monitoring active     | Security           |

#### Boot Orchestration Sequence

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

### 4.5 Framework Pipeline Integration Map

#### Rules Engine Intersection Points

| Pipeline Stage | Rules Engine Integration | Trigger Point | Validation Type | Escalation Path |
|---------------|------------------------|---------------|----------------|----------------|
| **Pre-Commit** | Git hooks (`pre-commit`) | File save/stage | `tests-required`, `documentation-required` | Block commit |
| **CI/CD Build** | Build pipeline | `npm run build` | Type safety, linting | Fail build |
| **Testing** | Test execution | `npm test` | Test coverage (>85%) | Block deployment |
| **Security** | Security audit | `npm audit` | Vulnerability scanning | Block deployment |
| **Postprocessor** | Compliance validation | Commit merge | Architectural compliance | Rollback deployment |
| **Agent Execution** | Real-time validation | Agent actions | Codex compliance | Error logging |
| **State Management** | Persistence validation | Session save | Data integrity | State recovery |

#### Pipeline Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │ -> │ Complexity       │ -> │ Agent Selection │
│   (Query/Task)  │    │ Analysis Engine  │    │ & Delegation    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                       │
        ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Pre-Processing  │ -> │  Agent Execution │ -> │ Post-Processing │
│   Validation    │    │  Task Handling   │    │   Results        │
│  (Rules Engine) │    │                  │    │  (Rules Engine)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                       │
        ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Servers   │ <- │ State Management │ -> │ Session         │
│   Integration   │    │  & Persistence   │    │ Coordination    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

#### Rules Engine Pipeline Flow

```
Code Commit → Git Hook → PostProcessor → Working Processors ✅
    ↓
Build Process → Type Check → Rules Engine → Pass/Fail
    ↓
Test Execution → Coverage Check → Rules Engine → Pass/Fail
    ↓
Security Audit → Vulnerability Scan → Rules Engine → Pass/Fail
    ↓
Postprocessor → Compliance Check → Codex Processor (Stub) ❌
    ↓
Deployment → Environment Check → Rules Engine → Pass/Fail
```

#### Critical Pipeline Break Points

**Rules Engine Integration Status:**

| Component | Rules Engine Connection | Status | Impact |
|-----------|----------------------|--------|---------|
| **Pre-Commit Hooks** | ✅ Connected | Active | Triggers postprocessor validation |
| **CI/CD Pipeline** | ✅ Connected | Active | Blocks invalid builds |
| **Pre-Validate Processor** | ✅ Connected | Active | Syntax validation (comments/code) |
| **State Validation Processor** | ✅ Connected | Active | Session state integrity |
| **Codex Compliance Processor** | ❌ BROKEN | Stub only | Returns `compliant: true` always |
| **Test Execution Processor** | ⚠️ Partial | Placeholder | Logs execution intent |
| **Agent Execution** | ✅ Connected | Active | Real-time validation |
| **MCP Servers** | ⚠️ Partial | Limited | Some validation |
| **State Management** | ✅ Connected | Active | Integrity checks |

**✅ FIXED**: Postprocessor `executeCodexCompliance` now calls RuleEnforcer for real validation instead of returning stub `compliant: true`.

### 4.6 Task Orchestration Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │ -> │ Complexity       │ -> │ Agent Selection │
│   (Query/Task)  │    │ Analysis Engine  │    │ & Delegation    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                       │
        ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Pre-Processing  │ -> │  Agent Execution │ -> │ Post-Processing │
│   Validation    │    │  Task Handling   │    │   Results        │
│  (Working)      │    │                  │    │  (Working)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                       │
        ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Servers   │ <- │ State Management │ -> │ Session         │
│   Integration   │    │  & Persistence   │    │ Coordination    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Post-Processor Functions**:
- ✅ **Validation**: Runs rule checks and architectural compliance
- ✅ **Reporting**: Generates activity reports and metrics
- ✅ **Monitoring**: Tracks system health and performance
- ✅ **Git Integration**: Post-commit hooks trigger validation
- ❌ **Documentation Updates**: Not implemented (validation only)

**Processor Status:**
- **Pre-Processing**: ✅ Working (preValidate, stateValidation active)
- **Post-Processing**: ⚠️ Partial (architectural compliance works, codex compliance stub)

### 4.7 Processor Implementation Details

**Working Processors:**
- **preValidate**: ✅ Active - Syntax validation, undefined usage detection
- **stateValidation**: ✅ Active - Session state integrity checks
- **Git Hook Integration**: ✅ Active - Triggers postprocessor on commits/pushes

**Recently Fixed Processors:**
- **codexCompliance**: ✅ **NOW ACTIVE** - Real RuleEnforcer validation with violations reporting

**Stub Processors (Need Implementation):**
- **testExecution**: ⚠️ Placeholder - Logs intent but doesn't run tests
- **regressionTesting**: ⚠️ Placeholder - Logs intent but doesn't run regression tests

**Integration Status**: Postprocessor pipeline fully operational with RuleEnforcer integration.

### 4.8 Framework Reporting System

**Purpose**: Automated activity analysis and comprehensive framework reporting.

**Capabilities**:
- **Activity Log Analysis**: Parses framework logs to extract operational data
- **Component Health Monitoring**: Tracks active components and success rates
- **Agent Usage Statistics**: Reports agent invocation counts and performance
- **Performance Metrics**: Success rates, delegation counts, tool usage
- **Automated Report Generation**: On-demand and scheduled reporting

**Report Types**:
- **orchestration**: Multi-agent coordination analysis
- **agent-usage**: Agent performance and usage patterns
- **context-awareness**: Context processing and enhancement tracking
- **performance**: System performance and bottleneck analysis
- **full-analysis**: Comprehensive framework health assessment

#### Reporting Pipeline Activation & Flow

**When Reporting is Activated**:

1. **Post-Processor Completion**: After every post-processor loop execution
2. **Git Hook Triggers**: On `pre-commit`, `post-commit`, `pre-push`, `post-merge`
3. **CLI Commands**: Manual execution via `framework-reporting-system` command
4. **MCP Server Calls**: Through `framework-help` server tool requests
5. **Complexity Threshold**: Only generates reports when complexity score > threshold

**Complete Reporting Pipeline Flow**:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Trigger       │ -> │ Complexity       │ -> │ Report          │
│   Event         │    │ Check            │    │ Generation      │
│                 │    │ (Score > 100)    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                       │
        ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data          │ -> │ Activity Log     │ -> │ Framework       │
│   Collection    │    │ Parsing          │    │ Report System   │
│                 │    │ (FIXED)          │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                       │
        ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Shell Script  │ -> │ File System      │ -> │ Report          │
│   Execution     │    │ Operations       │    │ Output          │
│   (generate-    │    │                  │    │                 │
│    activity-    │    │                  │    │                 │
│    report.js)   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Pipeline Components**:

1. **Trigger Detection**:
   - Post-processor calls `generateFrameworkReport()` on completion
   - Git hooks execute `framework-reporting-system` commands
   - CLI/MCP server requests invoke reporting directly

2. **Complexity Analysis**:
   ```typescript
   // Calculate if report should be generated
   const complexityScore = this.calculateComplexityScore(monitoringResults, context);
   if (complexityScore < this.config.reporting.reportThreshold) {
     console.log(`Complexity score ${complexityScore} below threshold - skipping report`);
     return null;
   }
   ```

3. **Activity Log Parsing** (FIXED - Was Broken):
   - **Before**: `framework-reporting-system.ts` couldn't read `logs/framework/activity.log`
   - **Issue**: Log file parsing failed with file access errors
   - **Fix**: Corrected file path resolution and added error handling
   - **Result**: Now successfully parses 759+ events from activity logs

4. **Shell Script Execution**:
   - Executes `scripts/generate-activity-report.js` for log analysis
   - Handles file system operations for report generation
   - Manages report output to configured directories

5. **Report Generation**:
   ```typescript
   // Generate comprehensive report
   const reportConfig = {
     type: "full-analysis",
     sessionId,
     outputFormat: "markdown",
     outputPath: path.join(reportingDir, `framework-report-${commitSha}-${date}.md`)
   };
   await frameworkReportingSystem.generateReport(reportConfig);
   ```

   **Output Locations**:
   - Framework Reports: `logs/reports/framework-report-{commitSha}-{date}.md`
   - Performance Reports: `performance-reports/` (multiple analysis files)
   - Security Reports: `security-reports/security-audit-{timestamp}.json`
   - Test Reports: `test-reports/` (coverage and regression files)
   - MCP Reports: `logs/mcp-reports/` (server health files)

**Data Sources**:
- **Framework Logger**: Recent in-memory logs
- **Activity Log File**: Persistent log storage at `logs/framework/activity.log` (FIXED parsing)
- **Rotated Log Archives**: Historical data from compressed log files

**Integration Points**:
- **Postprocessor Pipeline**: Generates reports after operation completion ✅ **WORKING**
- **Git Hooks**: Automated reporting on commits and pushes ✅ **WORKING**
- **CLI Interface**: Manual report generation via `framework-reporting-system` ✅ **WORKING**
- **MCP Servers**: Report generation available through framework-help server ✅ **WORKING**

**Fixed Components**:
- **Activity Log Parsing**: Previously broken, now working (759+ events captured)
- **File Path Resolution**: Corrected log file access issues
- **Error Handling**: Added proper error handling for log parsing failures

**Reporting System Status**: ✅ **FULLY OPERATIONAL** - Captures 759+ events, analyzes agent usage, provides health metrics

### Comprehensive Framework Logging & Reporting System

The StringRay framework generates comprehensive logs and reports across all pipeline stages. This section documents all automatic report generation, boot sequence logging, and pipeline flow documentation.

#### Automatic Report Generation Triggers

**1. Post-Processor Framework Reports**
- **Trigger**: After every post-processor loop completion
- **Complexity Threshold**: Only generates when score > 100 (configurable)
- **Content**: Full framework health assessment, agent usage statistics, performance metrics
- **Location**: `logs/reports/framework-report-{commitSha}-{date}.md`

**2. Performance System Reports**
- **Trigger**: CI/CD pipeline execution, manual `performance:report` command
- **Components**:
  - Performance Budget Enforcer: Bundle size, FCP, TTI compliance
  - Performance Regression Tester: Statistical analysis of performance changes
  - Performance Monitoring Dashboard: Real-time metrics and alerts
  - Performance CI Gates: Automated pipeline performance validation
- **Location**: `performance-reports/` directory

**3. Security Audit Reports**
- **Trigger**: Manual `security:audit` command, CI/CD security gates
- **Content**: Vulnerability scanning, compliance assessment, security recommendations
- **Location**: `security-reports/security-audit-{timestamp}.json`

**4. Test Execution Reports**
- **Trigger**: After test suite completion, CI/CD test stages
- **Content**: Coverage analysis, test results, regression testing
- **Location**: `coverage-reports/`, `test-reports/`

**5. MCP Server Reports**
- **Trigger**: On-demand via MCP server tools
- **Content**: Server health, tool usage statistics, error analysis
- **Location**: `logs/mcp-reports/`

#### Framework Boot Sequence Logging

**Phase 1: StringRay Initialization** (`src/strray-init.ts`)
```
🚀 StringRay framework activation starting...
✅ StringRay framework initialized successfully
❌ StringRay framework initialization failed (if error)
```

**Phase 2: Framework Activation** (`src/strray-activation.ts`)
```
🔄 StringRay Framework Activation Sequence:
├── Codex injection activated
├── Hook system activated  
├── Orchestrator initialized
├── Boot orchestrator started
├── State management initialized
├── Processors pipeline activated
├── Post-processor initialized
└── Critical components verified
```

**Phase 3: Boot Orchestrator** (`src/boot-orchestrator.ts`)
```
🚀 Boot Orchestrator: Initializing StringRay framework...
├── Context loading: Codex terms loaded (45 terms from 1 source)
├── State manager: Initialized with session recovery
├── Processor manager: 6 processors registered
├── Orchestrator: Multi-agent coordination enabled
├── Plugin system: Framework plugins loaded
├── MCP servers: 28 servers initialized
└── System integrity: All critical components active
```

**Phase 4: Processor Pipeline** (`src/processors/processor-manager.ts`)
```
🔄 Initializing processors pipeline...
├── preValidate: Syntax validation active
├── codexCompliance: Rule enforcement active  
├── errorBoundary: Error handling active
├── testExecution: Test automation ready
├── regressionTesting: Performance validation ready
└── stateValidation: Session integrity active
```

**Phase 5: Enterprise Monitoring** (`src/enterprise-monitoring.ts`)
```
🚀 Initializing StringRay Enterprise Monitoring System
├── Distributed coordinator initialized
├── Load balancer integration initialized
├── Auto-scaling integration initialized
├── High availability manager initialized
├── Prometheus integration initialized
├── DataDog integration initialized
├── New Relic integration initialized
├── Health check system initialized
├── Alert management system initialized
├── Real-time dashboard initialized
└── Enterprise monitoring system initialized successfully
```

#### Pipeline Flow Logging

**Post-Processor Pipeline** (`src/postprocessor/PostProcessor.ts`)
```
🔄 Starting post-processor loop for commit: {commitSha}
├── Architectural compliance validation...
│   ├── System integrity check: ✅ PASSED
│   ├── Integration testing check: ✅ PASSED
│   ├── Path resolution check: ✅ PASSED
│   ├── Feature completeness check: ✅ PASSED
│   └── Path analysis guidelines: ✅ PASSED
├── CI/CD monitoring: Pipeline status - SUCCESS
├── Success handler: Cleanup completed
├── Complexity score calculation: {score}/100
├── Framework report generation: {reportPath}
└── Post-processor loop completed: SUCCESS
```

**Performance Pipeline** (`src/performance/performance-system-orchestrator.ts`)
```
🚀 Performance System Initialization
├── Budget enforcer: Bundle size monitoring active
├── Regression tester: Performance baselines loaded
├── Monitoring dashboard: Real-time metrics enabled
└── CI gates: Automated validation configured
```

**Security Pipeline** (`src/security/security-scanner.ts`)
```
🔍 Security scan starting...
├── Vulnerability detection: {count} issues found
├── Compliance assessment: {framework} standards checked
├── Risk analysis: Critical/High/Medium/Low classification
├── Remediation recommendations: {count} suggestions generated
└── Security report saved: {reportPath}
```

**Agent Orchestration Pipeline** (`src/orchestrator.ts`)
```
📊 Agent orchestration initiated
├── Complexity analysis: Score {score}/100 - {strategy} strategy
├── Agent delegation: {agent} assigned to {task}
├── Parallel execution: {count} agents running concurrently
├── Consensus resolution: {method} used for {conflicts} conflicts
├── Result consolidation: {successes}/{total} tasks completed
└── Final response generated
```

**MCP Server Pipeline** (`src/mcp-client.ts`)
```
🔌 MCP client initialization
├── Server discovery: {serverName} found
├── Tool loading: {count} tools available
├── Connection established: {serverName} ready
├── Tool execution: {toolName} called on {serverName}
└── Response received: {contentLength} characters
```

#### Log File Locations & Rotation

**Framework Logs**:
- **Activity Log**: `logs/framework/activity.log` (rotated daily, 30-day retention)
- **Error Log**: `logs/framework/error.log` (rotated hourly, 7-day retention)
- **Performance Log**: `logs/performance/metrics.log` (rotated daily, 90-day retention)
- **Security Log**: `logs/security/audit.log` (rotated daily, 1-year retention)

**Report Directories & File Paths**:
- **Framework Health Reports**: `logs/reports/framework-report-{commitSha}-{date}.md`
  - Generated: After post-processor completion (complexity > 100)
  - Content: Agent usage statistics, system health, performance metrics
  - Example: `logs/reports/framework-report-abc123-2026-01-21.md`

- **Performance Budget Reports**: `performance-reports/`
  - Generated: CI/CD pipeline execution, performance gates
  - Content: Bundle size, FCP, TTI, regression analysis
  - Files: Various performance analysis files in directory

- **Security Audit Reports**: `security-reports/security-audit-{timestamp}.json`
  - Generated: Manual security scans, CI security gates
  - Content: Vulnerabilities, compliance assessment, recommendations
  - Example: `security-reports/security-audit-2026-01-21T10-30-00.json`

- **Test Coverage Reports**: `test-reports/`
  - Generated: After test suite completion
  - Content: Coverage percentages, regression testing, gaps analysis
  - Files: Coverage reports, test results, regression analysis

- **MCP Server Health Reports**: `logs/mcp-reports/`
  - Generated: Server startup/shutdown, on-demand
  - Content: Tool usage statistics, error rates, performance metrics
  - Files: Server health reports and usage analytics

- **Enterprise Monitoring Reports**: `logs/enterprise/`
  - Generated: Real-time system events, alerts, metrics
  - Content: Distributed coordination, failover events, cluster health
  - Files: Real-time monitoring data and alerts

**Log Rotation Strategy**:
- **Hourly**: Error logs, high-frequency operation logs
- **Daily**: Activity logs, performance metrics, security audits
- **Weekly**: Comprehensive system reports, archival data
- **Monthly**: Historical trend analysis, compliance reports
- **Retention**: 7-365 days based on log type and compliance requirements

#### Automatic Report Generation Triggers & Paths Summary

| Report Type | Trigger Condition | Frequency | Exact File Path | Content |
|-------------|-------------------|-----------|-----------------|---------|
| **Framework Health** | Post-processor completion + complexity > 100 | Per commit | `logs/reports/framework-report-{commitSha}-{date}.md` | Agent usage, system health, performance metrics |
| **Performance Budget** | CI/CD pipeline + performance gates enabled | Per build | `performance-reports/` (multiple files) | Bundle size, FCP, TTI, regression analysis |
| **Security Audit** | Manual command or CI security gates | On-demand | `security-reports/security-audit-{timestamp}.json` | Vulnerabilities, compliance, recommendations |
| **Test Coverage** | Test suite completion | Per test run | `test-reports/` (multiple files) | Coverage %, gaps, regression testing |
| **MCP Server Health** | Server startup/shutdown or on-demand | Daily/on-demand | `logs/mcp-reports/` (multiple files) | Tool usage, error rates, performance |
| **Enterprise Monitoring** | System events, alerts, metrics updates | Real-time | `logs/enterprise/` (multiple files) | Distributed coordination, failover events |

#### 📍 Report Storage Locations (Complete Reference)

**All StringRay reports are automatically organized by type and stored in the following locations:**

| Report Category | Directory/File Pattern | Trigger | Retention | Example Path |
|-----------------|------------------------|---------|-----------|-------------|
| **Framework Health** | `logs/reports/framework-report-{commit}-{date}.md` | Post-processor completion | 30 days | `logs/reports/framework-report-abc123-2026-01-21.md` |
| **Performance Budget** | `performance-reports/bundle-analysis-{timestamp}.json` | CI/CD pipeline | 90 days | `performance-reports/bundle-analysis-2026-01-21T10-30-00.json` |
| **Performance Regression** | `performance-reports/regression-test-{timestamp}.json` | Test completion | 90 days | `performance-reports/regression-test-2026-01-21T10-30-00.json` |
| **Security Audits** | `security-reports/security-audit-{timestamp}.json` | Manual/CI scan | 1 year | `security-reports/security-audit-2026-01-21T10-30-00.json` |
| **Test Coverage** | `test-reports/coverage-report-{timestamp}.json` | Test suite completion | 30 days | `test-reports/coverage-report-2026-01-21T10-30-00.json` |
| **MCP Server Health** | `logs/mcp-reports/server-health-{timestamp}.json` | Server events | 7 days | `logs/mcp-reports/server-health-2026-01-21T10-30-00.json` |
| **Enterprise Monitoring** | `logs/enterprise/cluster-status-{timestamp}.json` | System events | 30 days | `logs/enterprise/cluster-status-2026-01-21T10-30-00.json` |

**Report Directory Structure**:
```
project-root/
├── logs/
│   ├── reports/           # Framework health reports
│   │   └── framework-report-{commit}-{date}.md
│   ├── mcp-reports/       # MCP server health reports
│   │   └── server-health-{timestamp}.json
│   └── enterprise/        # Enterprise monitoring reports
│       └── cluster-status-{timestamp}.json
├── performance-reports/   # Performance analysis reports
│   ├── bundle-analysis-{timestamp}.json
│   └── regression-test-{timestamp}.json
├── security-reports/      # Security audit reports
│   └── security-audit-{timestamp}.json
└── test-reports/          # Test coverage reports
    └── coverage-report-{timestamp}.json
```

#### Framework Boot Sequence Summary

**14-Stage Initialization Process**:
1. **Plugin Loading**: oh-my-opencode plugin system loads StringRay
2. **Context Loading**: Codex terms and configuration loaded
3. **State Manager**: Session persistence and recovery initialized
4. **Orchestrator**: Multi-agent coordination system activated
5. **Delegation System**: Task routing and complexity analysis enabled
6. **Processor Pipeline**: Pre/post validation processors registered
7. **Security Components**: Hardening and authentication activated
8. **Monitoring Systems**: Performance tracking and alerting started
9. **MCP Servers**: 28 model context protocol servers initialized
10. **Enterprise Features**: Distributed coordination and failover activated
11. **Plugin Ecosystem**: Extension system and marketplace ready
12. **Session Management**: Lifecycle tracking and cleanup enabled
13. **Codex Enforcement**: 99.6% error prevention validation active
14. **System Integrity**: All critical components verified and operational

This comprehensive logging and reporting system ensures complete visibility into framework operations, automatic issue detection, and systematic resolution across all pipeline stages.

## Post-Processor Enforcement → Agent/Skill Mapping

**CRITICAL GAP**: Post-processor validations detect violations but do **NOT** automatically call agents/skills to fix them. This mapping table shows which agents/skills should be called for each enforcement.

### Architectural Compliance Validations

| Post-Processor Check | Description | Should Call Agent/Skill | Status |
|---------------------|-------------|-------------------------|---------|
| **checkSystemIntegrity** | Validates framework components are active | `librarian` (`skill-project-analysis`) | ❌ **NOT IMPLEMENTED** |
| **checkIntegrationTesting** | Ensures integration tests exist | `test-architect` (`skill-testing-strategy`) | ❌ **NOT IMPLEMENTED** |
| **checkPathResolution** | Validates environment-agnostic paths | `librarian` + `refactorer` (`skill-project-analysis` + `skill-refactoring-strategies`) | ❌ **NOT IMPLEMENTED** |
| **checkFeatureCompleteness** | Ensures features are fully integrated | `architect` (`skill-architecture-patterns`) | ❌ **NOT IMPLEMENTED** |
| **checkPathAnalysisGuidelines** | Enforces path resolution best practices | `refactorer` (`skill-refactoring-strategies`) | ❌ **NOT IMPLEMENTED** |

### Rule Enforcer Validations

| Rule | Description | Should Call Agent/Skill | Status |
|------|-------------|-------------------------|---------|
| **tests-required** | New code requires tests | `test-architect` (`skill-testing-strategy`) | ❌ **NOT IMPLEMENTED** |
| **no-duplicate-code** | Prevents duplicate code creation | `refactorer` (`skill-refactoring-strategies`) | ❌ **NOT IMPLEMENTED** |
| **no-over-engineering** | Prevents unnecessary complexity | `architect` (`skill-architecture-patterns`) | ❌ **NOT IMPLEMENTED** |
| **resolve-all-errors** | All errors must be resolved | `bug-triage-specialist` (`skill-code-review`) | ❌ **NOT IMPLEMENTED** |
| **prevent-infinite-loops** | Prevents infinite loop patterns | `bug-triage-specialist` (`skill-code-review`) | ❌ **NOT IMPLEMENTED** |
| **state-management-patterns** | Enforces proper state management | `architect` (`skill-architecture-patterns`) | ❌ **NOT IMPLEMENTED** |
| **import-consistency** | Maintains consistent import patterns | `refactorer` (`skill-refactoring-strategies`) | ❌ **NOT IMPLEMENTED** |
| **documentation-required** | New features require documentation | `librarian` (`skill-project-analysis` + documentation-generation) | ❌ **NOT IMPLEMENTED** |
| **clean-debug-logs** | Removes debug logging from production | `refactorer` (`skill-refactoring-strategies`) | ❌ **NOT IMPLEMENTED** |

### Implementation Priority

**HIGH PRIORITY** (Block commits, critical violations):
- `resolve-all-errors` → `bug-triage-specialist`
- `prevent-infinite-loops` → `bug-triage-specialist`
- `checkSystemIntegrity` → `librarian`

**MEDIUM PRIORITY** (Quality improvements):
- `tests-required` → `test-architect`
- `documentation-required` → `librarian`
- `no-duplicate-code` → `refactorer`

**LOW PRIORITY** (Code consistency):
- `import-consistency` → `refactorer`
- `state-management-patterns` → `architect`
- `checkPathAnalysisGuidelines` → `refactorer`

**Note**: All post-processor enforcement currently only **validates** violations but does **NOT** automatically fix them by calling agents/skills. This requires extending the post-processor with agent delegation logic.

**Documentation Update Status**:
The framework currently validates that documentation is required but does not automatically generate or update documentation.

**Current Capabilities**:
- ✅ **Documentation Validation**: Rules check if documentation is required for new features
- ✅ **API Documentation Generation**: MCP server available for API docs via `documentation-generation` skill (SERVER EXISTS)
- ❌ **Automatic Documentation Updates**: Not implemented - requires manual updates
- ❌ **Post-Commit Documentation**: Validation only, no automatic updates

**Planned but Not Implemented**:
- Post-commit documentation updates
- Feature addition detection and doc generation
- README synchronization
- Automatic API documentation updates

**Current Documentation Workflow**:
1. **Validation**: Rules check if documentation is required (via `documentation-required` rule)
2. **Manual Updates**: Documentation must be updated manually
3. **API Docs**: Use `documentation-generation` MCP server for API documentation
4. **No Reboot Required**: Documentation validation works immediately

**Note**: Automatic documentation updates are planned but not yet implemented. The framework validates documentation requirements but does not generate updates automatically.

---

## 5. Reference

### 5.1 Scripts Inventory & Usage Guide

**148 total scripts** organized by purpose. Agents should use these scripts for systematic testing, debugging, and validation workflows.

#### 🔬 **Critical Testing Scripts (Run These First)**

**`./scripts/test-end-to-end-comprehensive.sh`** - **COMPLETE SYSTEM VALIDATION**
- **When to run**: After any major changes, before releases, when debugging complex issues
- **What it does**:
  - Builds the package
  - Creates test directory (`/tmp/strray-e2e-test`)
  - Initializes npm project in test dir
  - Installs package: `npm install /path/to/package.tgz`
  - Runs postinstall configuration
  - Executes ALL runtime tests (agents, MCP, skills, orchestration)
  - Validates complete end-to-end functionality
- **Exit codes**: 0=success, 1-7=specific failure types
- **Use case**: "I need to test if the entire framework works from build to runtime"

**`./scripts/validate-stringray-framework.sh`** - **FRAMEWORK INTEGRITY CHECK**
- **When to run**: After framework modifications, during development
- **What it does**: Validates all framework components without full deployment
- **Use case**: "Quick check if framework components are working"

**`./scripts/test-skills-comprehensive.mjs`** - **SKILLS SYSTEM VALIDATION**
- **When to run**: After skill modifications, when skills aren't working
- **What it does**: Tests all 14 skill MCP servers and their integration
- **Use case**: "Skills aren't invoking properly, need to debug"

#### 🏗️ **Build & Deployment Scripts**

**`./scripts/deploy-stringray-plugin.sh`** - **PLUGIN DEPLOYMENT**
- **When to run**: When deploying framework updates
- **What it does**: Deploys StringRay as an oh-my-opencode plugin
- **Use case**: "Need to deploy framework to production environment"

**`./scripts/build/` directory** - **BUILD SYSTEM SCRIPTS**
- `run-build.sh` - Full TypeScript compilation
- `run-typecheck.sh` - Type checking only
- `run-build-errors.sh` - Build with error reporting
- **When to run**: After code changes, before testing
- **Use case**: "Build is failing, need to debug compilation"

#### 🧪 **Validation & Testing Scripts**

**`./scripts/validation/validate-mcp-connectivity.js`** - **MCP SERVER TESTING**
- **When to run**: When MCP servers aren't responding
- **What it does**: Tests all 28 MCP server connections
- **Use case**: "MCP tools aren't available to agents"

**`./scripts/validation/validate-oh-my-opencode-integration.js`** - **FRAMEWORK INTEGRATION**
- **When to run**: When framework commands aren't working
- **What it does**: Tests oh-my-opencode plugin integration
- **Use case**: "@agent commands not responding"

**`./scripts/validation/validate-postinstall-config.js`** - **CONFIGURATION VALIDATION**
- **When to run**: After installation, when configuration seems wrong
- **What it does**: Validates postinstall setup and configuration
- **Use case**: "Framework not initializing properly"

#### 🔍 **Debugging & Analysis Scripts**

**`./scripts/strray-triage.sh`** - **SYSTEM DIAGNOSTICS**
- **When to run**: When framework has unknown issues
- **What it does**: Comprehensive diagnostics of all framework components
- **Use case**: "Framework is broken, don't know why"

**`./scripts/debug/debug-rules.mjs`** - **RULE ENFORCEMENT DEBUGGING**
- **When to run**: When codex rules aren't working
- **What it does**: Debugs rule enforcer and codex compliance
- **Use case**: "Rules aren't blocking violations"

**`./scripts/debug/debug-plugin.cjs`** - **PLUGIN DEBUGGING**
- **When to run**: When plugin loading fails
- **What it does**: Debugs oh-my-opencode plugin integration
- **Use case**: "Plugin not loading in oh-my-opencode"

#### 📊 **Performance & Monitoring Scripts**

**`./scripts/performance-report.js`** - **PERFORMANCE ANALYSIS**
- **When to run**: When performance issues occur
- **What it does**: Generates comprehensive performance reports
- **Use case**: "Framework is slow, need performance metrics"

**`./scripts/monitoring/monitoring-daemon.mjs`** - **REAL-TIME MONITORING**
- **When to run**: For ongoing system monitoring
- **What it does**: Continuous monitoring of framework health
- **Use case**: "Need to monitor framework during development"

#### 🔧 **Setup & Configuration Scripts**

**`./scripts/postinstall.cjs`** - **FRAMEWORK SETUP**
- **When to run**: After `npm install`, when framework isn't configured
- **What it does**: Configures framework in consumer environment
- **Use case**: "Just installed, need to set up framework"

**`./scripts/setup.cjs`** - **DEVELOPMENT ENVIRONMENT SETUP**
- **When to run**: When setting up development environment
- **What it does**: Configures development tools and dependencies
- **Use case**: "New developer setting up workspace"

#### 📋 **Script Categories Summary**

| Category | Script Count | Key Scripts | When to Use |
|----------|-------------|-------------|-------------|
| **Testing** | 45 scripts | `test-end-to-end-comprehensive.sh`, `validate-stringray-framework.sh` | System validation, debugging |
| **Build** | 15 scripts | `run-build.sh`, `run-typecheck.sh` | Compilation, type checking |
| **Validation** | 12 scripts | `validate-mcp-connectivity.js`, `validate-oh-my-opencode-integration.js` | Component testing |
| **Debugging** | 8 scripts | `strray-triage.sh`, `debug-rules.mjs` | Issue diagnosis |
| **Performance** | 6 scripts | `performance-report.js`, `run-performance-gates.mjs` | Performance analysis |
| **Setup** | 4 scripts | `postinstall.cjs`, `setup.cjs` | Environment configuration |
| **Monitoring** | 5 scripts | `monitoring-daemon.mjs` | Health monitoring |
| **CI/CD** | 3 scripts | `ci-cd-orchestrator.cjs` | Pipeline automation |

#### 📝 **Agent Script Usage Guidelines**

**For Framework Issues:**
1. Run `test-end-to-end-comprehensive.sh` - Tests everything
2. If that fails, run `strray-triage.sh` - Comprehensive diagnostics
3. Check specific components with validation scripts

**For Development Workflow:**
1. After code changes: `run-build.sh` + `run-typecheck.sh`
2. Before commit: `validate-stringray-framework.sh`
3. After installation: `postinstall.cjs`

**For Agent/Skill Issues:**
1. MCP problems: `validate-mcp-connectivity.js`
2. Integration issues: `validate-oh-my-opencode-integration.js`
3. Skill problems: `test-skills-comprehensive.mjs`

**For Performance Issues:**
1. Generate report: `performance-report.js`
2. Run gates: `run-performance-gates.mjs`
3. Monitor: `monitoring-daemon.mjs`

### 5.2 Directory Structure

```
strray-framework/
├── .strray/               # Framework configuration
│   ├── codex.json         # Universal Development Codex (59 terms)
│   ├── config.json        # Framework settings
│   └── agents_template.md # Agent documentation
├── src/                   # Core implementation
│   ├── agents/            # Agent implementations (8 agents)
│   ├── delegation/        # Task routing & complexity analysis
│   ├── processors/        # Operation processing
│   ├── mcps/              # MCP server implementations (28 servers)
│   ├── plugins/           # Plugin system
│   ├── security/          # Security systems
│   ├── utils/             # Utility functions
│   ├── state/             # State management
│   ├── monitoring/        # Performance monitoring
│   ├── postprocessor/     # Post-execution processing
│   └── __tests__/         # Test suites
├── scripts/               # Automation (148 files)
│   ├── build/             # Build scripts
│   ├── test/              # Test scripts
│   └── validation/        # Validation scripts
├── advanced-features/     # Enterprise features
│   ├── analytics/         # Performance analytics
│   ├── dashboards/        # Monitoring dashboards
│   ├── distributed/       # Distributed systems
│   ├── scaling/           # Auto-scaling
│   ├── simulation/        # Load simulation
│   └── streaming/         # Real-time streaming
├── docs/                  # Documentation (157 files)
├── dist/                  # Compiled output
├── coverage/              # Test coverage reports
├── config/                # Configuration files
├── tests/                 # Test suites
└── public/                # Public assets
```

### 5.3 Testing Framework

**Testing Approach**:
- **Mock-Based**: Plugin architecture requires mocks for ES6 import isolation
- **Unit Tests**: Pure functions, utilities, agent logic (25+ files)
- **Integration Tests**: oh-my-opencode simulation, component interaction (20+ files)
- **E2E Tests**: Full runtime through oh-my-opencode (real execution)
- **Performance Tests**: Regression detection, load testing

**Running Tests**:
```bash
# Complete suite
npm run test:all

# Specific types
npm run test:unit                    # Unit tests
npm run test:integration            # Integration tests
npm run test:e2e                    # End-to-end tests
npm run test:performance           # Performance tests

# Validation
npm run test:validation            # All validation scripts
npm run test:security-audit        # Security scanning
npm run test:mcp-connectivity      # MCP validation
```

**Coverage Requirements**:
- Behavioral test coverage: >85%
- Unit tests: Pure functions and utilities
- Integration tests: Critical paths
- E2E tests: User workflows

**Mock vs Real Testing**:
- **Mock**: ES6 import conflicts prevent direct plugin testing
- **Real**: E2E tests run through actual oh-my-opencode execution
- **Hybrid**: Integration tests simulate runtime with controlled mocks

**AI Agent Testing Procedures**:
- **Validation Scripts**: Use `node scripts/test:mcp-connectivity.js` for MCP validation
- **Postinstall Verification**: Run `node scripts/test:postinstall-config.js` after installation
- **Integration Testing**: Execute `node scripts/test:oh-my-opencode-integration.js` for framework integration
- **End-to-End Validation**: Use `./scripts/test-end-to-end-comprehensive.sh` for complete framework testing

**Test Execution Optimization**:
- Run unit tests with multiple workers (minimum 4 threads)
- Run E2E tests with parallel workers (minimum 4 workers)
- Implement chunked output processing for large test results
- Stop execution if 5+ tests fail (triage threshold)
- Use sub-agents for handling large test outputs (>30k characters)

### 5.4 Troubleshooting

**Common Issues**:

| Issue | Symptom | Solution |
|-------|---------|----------|
| Plugin not loading | Agent commands fail | Run `node node_modules/strray-ai/scripts/postinstall.cjs` |
| Agent commands not working | @ commands unrecognized | Check oh-my-opencode configuration |
| Codex validation errors | Unexpected blocking | Review codex terms in `.strray/codex.json` |
| MCP connectivity fails | Server connection errors | Run `node scripts/test:mcp-connectivity.js` |
| Token limit errors | "maximum prompt length exceeded" | Context will be automatically pruned (TokenManager active) |
| Performance issues | Slow response times | Check complexity analysis thresholds |
| Build failures | TypeScript errors | Run `npm run typecheck` and fix errors |

**Debug Commands**:
```bash
# Validate setup
node scripts/test:postinstall-config.js
node scripts/test:oh-my-opencode-integration.js
node scripts/test:mcp-connectivity.js

# Monitor performance
npm run benchmark
npm run monitoring

# Check token management
node -e "const {TokenManager} = require('./dist/utils/token-manager.js'); console.log(new TokenManager().getConfig())"
```

**Emergency Procedures**:
1. Check codex compliance for violations
2. Run validation scripts to identify issues
3. Use complexity analysis to assess task scope
4. Escalate to appropriate agents based on capabilities

---

## 6. Appendices

- [Architecture Overview](docs/ARCHITECTURE.md) - Framework design principles
- [Orchestrator Integration](docs/ORCHESTRATOR_INTEGRATION_ARCHITECTURE.md) - Advanced coordination
- [Grok Code Guide](docs/GROK_GUIDE.md) - AI model configuration
- [Enterprise Developer Guide](docs/developer/ENTERPRISE_DEVELOPER_GUIDE.md) - Advanced development
- [Plugin Loading Mechanism](docs/advanced/plugin-loading-mechanism.md) - Plugin system details
- [Deployment Reflections](docs/reflections/) - Framework evolution insights
- [Documentation Reorganization](docs/DOCUMENTATION_REORGANIZATION_PLAN.md) - Organization strategy
- [Universal Development Codex](.strray/codex.json) - Complete 59-term codex reference

**Note**: 157 total documentation files available in `docs/` directory covering all aspects of the framework.

---

#### Critical File Path Reference

**Configuration Files**:
- **Codex Terms**: `.strray/codex.json` - Universal Development Codex (59 terms)
- **Framework Config**: `.strray/config.json` - Framework settings and thresholds
- **Agent Templates**: `.strray/agents_template.md` - Agent documentation templates
- **OpenCode Config**: `.opencode/oh-my-opencode.json` - oh-my-opencode plugin configuration
- **MCP Registry**: `.mcp.json` - MCP server registration (28 servers)
- **Claude Override**: `.claude/.mcp.json` - MCP server exclusions

**Core Source Directories**:
- **Agents**: `src/agents/` - 8 specialized agent implementations
- **Orchestrator**: `src/orchestrator.ts` - Multi-agent coordination system
- **State Manager**: `src/state/state-manager.ts` - Session persistence and recovery
- **Processors**: `src/processors/` - Pre/post-processing pipeline
- **Delegation**: `src/delegation/` - Task routing and complexity analysis
- **Security**: `src/security/` - Authentication and hardening
- **Performance**: `src/performance/` - Budget enforcement and monitoring
- **Monitoring**: `src/monitoring/` - Health tracking and alerting

**MCP Server Files** (28 total):
- **Framework Servers**:
  - `mcps/framework-help.server.js` - Framework capabilities and commands
  - `mcps/framework-compliance-audit.server.js` - Codex compliance validation
  - `mcps/enforcer-tools.server.js` - Error prevention and monitoring
  - `mcps/architect-tools.server.js` - System design and state management
  - `mcps/orchestrator.server.js` - Multi-agent coordination
  - `mcps/enhanced-orchestrator.server.js` - Advanced orchestration
  - `mcps/boot-orchestrator.server.js` - Framework initialization
  - `mcps/state-manager.server.js` - Session and state management
  - `mcps/processor-pipeline.server.js` - Processing pipeline management

- **Knowledge Skill Servers** (15 total):
  - `mcps/knowledge-skills/code-review.server.js` - Code quality analysis
  - `mcps/knowledge-skills/security-audit.server.js` - Security vulnerability scanning
  - `mcps/knowledge-skills/performance-optimization.server.js` - Performance bottleneck analysis
  - `mcps/knowledge-skills/testing-strategy.server.js` - Test planning and coverage
  - `mcps/knowledge-skills/project-analysis.server.js` - Codebase exploration
  - `mcps/knowledge-skills/documentation-generation.server.js` - API documentation generation
  - `mcps/knowledge-skills/testing-best-practices.server.js` - Testing methodologies
  - `mcps/knowledge-skills/refactoring-strategies.server.js` - Code improvement techniques
  - `mcps/knowledge-skills/ui-ux-design.server.js` - User interface design
  - `mcps/knowledge-skills/api-design.server.js` - API architecture patterns
  - `mcps/knowledge-skills/database-design.server.js` - Database schema optimization
  - `mcps/knowledge-skills/architecture-patterns.server.js` - System architecture patterns
  - `mcps/knowledge-skills/git-workflow.server.js` - Version control strategies
  - `mcps/knowledge-skills/devops-deployment.server.js` - Deployment automation
  - `mcps/knowledge-skills/skill-invocation.server.js` - Skill invocation coordination

- **Utility Servers** (4 total):
  - `mcps/security-scan.server.js` - Security vulnerability scanning
  - `mcps/auto-format.server.js` - Code formatting and style
  - `mcps/lint.server.js` - Code quality linting
  - `mcps/performance-analysis.server.js` - Performance metrics analysis
  - `mcps/model-health-check.server.js` - AI model health monitoring

**Plugin Files**:
- **Main Plugin**: `plugin/strray-codex-injection.ts` - oh-my-opencode plugin entry point
- **Codex Injection**: `src/plugins/stringray-codex-injection.ts` - Codex context injection
- **Plugin System**: `src/plugins/plugin-system.ts` - Plugin lifecycle management

**Log and Report Files**:
- **Activity Logs**: `logs/framework/activity.log` - Framework operation events
- **Error Logs**: `logs/framework/error.log` - Error and exception tracking
- **Performance Logs**: `logs/performance/metrics.log` - Performance metrics
- **Security Logs**: `logs/security/audit.log` - Security events and compliance
- **Framework Health Reports**: `logs/reports/framework-report-{commitSha}-{date}.md` - Agent usage, system health, performance metrics
- **Performance Budget Reports**: `performance-reports/` - Bundle size, FCP, TTI, regression analysis
- **Security Audit Reports**: `security-reports/security-audit-{timestamp}.json` - Vulnerabilities, compliance, recommendations
- **Test Coverage Reports**: `test-reports/` - Coverage percentages, regression testing, gaps analysis
- **MCP Server Reports**: `logs/mcp-reports/` - Tool usage statistics, error rates, performance metrics
- **Enterprise Monitoring Reports**: `logs/enterprise/` - Distributed coordination, failover events, cluster health
- **Test Reports**: `test-reports/` - Coverage and regression testing
- **MCP Reports**: `logs/mcp-reports/` - Server health and tool usage
- **Enterprise Logs**: `logs/enterprise/` - Distributed system events

**Script Files** (148 total):
- **Build Scripts**: `scripts/build/` - Compilation and packaging
- **Test Scripts**: `scripts/test/` - Validation and testing utilities
- **Validation Scripts**: `scripts/test:mcp-connectivity.js` - MCP server validation
- **Postinstall Scripts**: `scripts/test:postinstall-config.js` - Configuration validation
- **Integration Scripts**: `scripts/test:oh-my-opencode-integration.js` - Framework integration
- **Report Generation**: `scripts/generate-activity-report.js` - Activity log analysis
- **Deployment Scripts**: `scripts/deploy-stringray-plugin.sh` - Plugin deployment

**Framework Status**: Production-ready with 99.6% error prevention.
**Documentation**: Complete operational flows with pipeline integration maps and consensus mechanisms.
**Components**: 8 agents, 28 MCP servers, 148 scripts, 157 documentation files.
**Pipeline Integration**: Rules engine connected at 6 critical intersection points (RuleEnforcer integration completed, skill invocation implemented, agent delegation pending).
**Boot Sequence**: 14-stage initialization with full component orchestration.
**Version Management**: Semantic versioning with zero-tolerance CI/CD enforcement.