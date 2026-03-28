# StringRay Framework - Complete System Architecture & Technical Reference

**Version**: 1.14.1
**Purpose**: Enterprise AI orchestration with systematic error prevention and modular architecture
**Last Updated**: 2026-03-12
**System Complexity**: 75+ modular files, 25 specialized agents, 11 active MCP servers, 60 codex terms

---

## Table of Contents

- [1. Quick Start Guide](#1-quick-start-guide)
- [2. Architecture Overview](#2-architecture-overview)
  - [2.1 Modular Architecture Transformation](#21-modular-architecture-transformation)
  - [2.2 Facade Pattern Design](#22-facade-pattern-design)
  - [2.3 Component Interaction](#23-component-interaction)
- [3. Agent Reference - Complete (27 Agents)](#3-agent-reference---complete-27-agents)
  - [3.1 Core Agents (9)](#31-core-agents-9)
  - [3.2 Specialized Engineering Agents (9)](#32-specialized-engineering-agents-9)
  - [3.3 Strategy & Content Agents (9)](#33-strategy--content-agents-9)
- [4. Architecture Deep Dive](#4-architecture-deep-dive)
  - [4.1 RuleEnforcer Module System](#41-ruleenforcer-module-system)
  - [4.2 TaskSkillRouter Module System](#42-taskskillrouter-module-system)
  - [4.3 MCP Client Module System](#43-mcp-client-module-system)
- [5. Technical Reference](#5-technical-reference)
  - [5.1 Internal APIs](#51-internal-apis)
  - [5.2 Configuration Reference](#52-configuration-reference)
  - [5.3 Advanced Usage Patterns](#53-advanced-usage-patterns)
- [6. Examples & Usage Patterns](#6-examples--usage-patterns)
- [7. Migration Guide: Monolithic to Modular](#7-migration-guide-monolithic-to-modular)
- [8. Appendices](#8-appendices)

---

## 1. Quick Start Guide

### Installation

```bash
# Install StringRay in your project
npm install strray-ai

# Run post-install configuration
node node_modules/strray-ai/scripts/node/postinstall.cjs

# Verify installation
npx strray-ai health
```

### Basic Usage

```bash
# Invoke agents using @ syntax
@enforcer analyze this code for codex compliance
@architect design a REST API for user management
@code-reviewer review this pull request
@security-auditor scan for vulnerabilities

# Check framework status
npx strray-ai status
npx strray-ai capabilities
```

### File Organization Guidelines

**IMPORTANT**: Save all generated files to their proper directories. Do NOT save to root.

| File Type | Save To | Example |
|-----------|---------|---------|
| **Reflections** | `docs/reflections/` or `docs/reflections/deep/` | `docs/reflections/my-fix-reflection.md` |
| **Logs** | `logs/` | `logs/framework/activity.log` |
| **Scripts** | `scripts/` or `scripts/bash/` | `scripts/bash/my-script.sh` |
| **Test Files** | `src/__tests__/` | `src/__tests__/unit/my-test.test.ts` |
| **Source Code** | `src/` | `src/my-module.ts` |
| **Config** | `config/` or `.opencode/strray/` | `config/my-config.json` |
| **Docs** | `docs/` | `docs/my-feature.md` |

---

## 2. Architecture Overview

### 2.1 Modular Architecture Transformation

StringRay v1.15.1 represents a **major architectural transformation** from monolithic to modular design. This refactoring improves maintainability, testability, and extensibility while maintaining 100% backward compatibility.

#### Before vs After Comparison

| Aspect | Before (v1.7.x) | After (v1.15.1) | Improvement |
|--------|-----------------|----------------|-------------|
| **RuleEnforcer** | 2,714 lines, 58 methods | 416-line facade + 6 modules | **87% size reduction** |
| **TaskSkillRouter** | 1,933 lines, monolithic | 490-line facade + 12 modules | **75% size reduction** |
| **MCP Client** | 1,413 lines, single file | 312-line facade + 8 modules | **78% size reduction** |
| **Total Files** | 3 monolithic files (9,230 lines) | 75+ modular files (1,218 lines) | **87% size reduction** |
| **Testability** | Difficult to unit test | Isolated module testing | **85%+ coverage** |
| **Maintainability** | Complex, error-prone | Clear separation of concerns | **Dramatic improvement** |

#### Architectural Benefits

**Performance Improvements:**
- **Faster Startup**: Modular loading reduces initialization time by ~40%
- **Reduced Memory**: Smaller active codebase reduces memory footprint
- **Better Caching**: Individual modules can be cached independently
- **Parallel Loading**: Modules load in parallel where possible

**Maintainability Improvements:**
- **Focused Modules**: Each module has a single, clear responsibility
- **Easier Debugging**: Isolated components simplify troubleshooting
- **Simpler Testing**: Unit tests focus on single modules
- **Clear Dependencies**: Explicit module dependencies prevent circular issues

**Extensibility Improvements:**
- **Plugin Architecture**: New modules plug in via configuration
- **Custom Rules**: Add rules without modifying core code
- **Custom Processors**: Extend processing pipeline with custom modules
- **Custom Agents**: Easy agent creation using modular patterns

### 2.2 Facade Pattern Design

The **Facade Pattern** is the cornerstone of StringRay's modular architecture. It provides a simplified interface to a complex subsystem of modules.

#### What is a Facade?

A facade is a design pattern that provides a unified interface to a set of interfaces in a subsystem. It defines a higher-level interface that makes the subsystem easier to use.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT CODE                               │
│         (Agents, Processors, User Code)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    FACADE LAYER                              │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ RuleEnforcer│  │ TaskSkillRouter │  │   MCPClient     │  │
│  │   Facade    │  │     Facade      │  │     Facade      │  │
│  │  (416 lines)│  │   (490 lines)   │  │   (312 lines)   │  │
│  └──────┬──────┘  └────────┬────────┘  └────────┬────────┘  │
└─────────┼──────────────────┼────────────────────┼───────────┘
          │                  │                    │
          ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  MODULE LAYER                                │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Registry   │  │     Config      │  │     Types       │  │
│  │  Executor   │  │    Analytics    │  │     Config      │  │
│  │ Hierarchy   │  │    Routing      │  │   Connection    │  │
│  │   Fixer     │  │    Mapping      │  │     Tools       │  │
│  │  Loaders    │  │    ... (12)     │  │   Simulation    │  │
│  │ Validators  │  │                 │  │     ... (8)     │  │
│  └─────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Facade Responsibilities

**RuleEnforcer Facade:**
- Public API for rule validation
- Delegates to specialized modules
- Maintains backward compatibility
- Coordinates cross-module operations

**TaskSkillRouter Facade:**
- Unified task routing interface
- Skill discovery and invocation
- Analytics and monitoring
- Configuration management

**MCPClient Facade:**
- Server connection management
- Tool discovery and execution
- Error handling and retries
- Connection pooling

### 2.3 Component Interaction

#### Module Communication Patterns

```
Data Flow Through Modular System:

User Request → Facade → Module A → Module B → Module C → Response
                    ↓         ↓         ↓
               Validation  Execution  Cleanup
```

**Communication Methods:**

1. **Direct Calls**: Facade calls module methods directly
2. **Event Emitters**: Modules emit events for loose coupling
3. **Shared State**: Centralized state store for cross-module data
4. **Dependency Injection**: Modules receive dependencies via constructor

#### Dependency Injection Pattern

```typescript
// Module receives dependencies via constructor
class RuleExecutor {
  constructor(
    private validator: RuleValidator,
    private registry: RuleRegistry,
    private logger: Logger
  ) {}
  
  async execute(rule: Rule, context: Context): Promise<Result> {
    // Use injected dependencies
    const isValid = await this.validator.validate(rule);
    const registeredRule = this.registry.get(rule.id);
    this.logger.log('Executing rule', rule.id);
    // ...
  }
}
```

#### Module Interface Contracts

All modules implement standardized interfaces:

```typescript
// Base module interface
interface IModule {
  initialize(config: ModuleConfig): Promise<void>;
  shutdown(): Promise<void>;
  getStatus(): ModuleStatus;
}

// Rule module interface
interface IRuleModule extends IModule {
  validate(input: unknown): Promise<ValidationResult>;
  getRules(): Rule[];
}

// Routing module interface
interface IRoutingModule extends IModule {
  route(task: Task): Promise<RouteResult>;
  getCapabilities(): Capability[];
}
```

---

## 3. Agent Reference - Complete (27 Agents)

StringRay provides **13 autonomous AI agents** (plus 43 framework skills) organized into core and specialized categories.

### 3.1 Core Agents (9)

These are the primary agents that form the foundation of the StringRay framework.

---

#### @enforcer
**Version**: 1.14.1  
**Role**: Codex compliance & error prevention  
**Complexity Threshold**: All operations  
**Primary Pipeline**: Rule Enforcement

**Description**:  
The enforcer serves as the **central coordinator** for all codex compliance and error prevention. It validates every operation against the Universal Development Codex and delegates violations to appropriate agents for remediation.

**Capabilities:**
- Real-time codex rule validation (60 terms)
- Automatic violation detection and reporting
- Automated fix delegation to specialized agents
- Complexity analysis for routing decisions
- Integration with all 6 RuleEnforcer modules

**Codex Terms Enforced (All 60 terms):**
- **Core Terms**: 1-20 (Progressive production-ready code, no patches/stubs, type safety, etc.)
- **Architecture Terms**: 21-30 (Dependency injection, interface segregation, SOLID principles)
- **Testing Terms**: 26-27 (Test coverage >85%, fast feedback loops)
- **Security Terms**: 29 (Security by design)
- **Governance Terms**: 52-60 (Agent spawn governance, validation chain, multi-agent coordination)

**Example Invocations:**
```bash
# Validate code against codex
@enforcer analyze this function for codex compliance

# Check for specific violations
@enforcer check for console.log statements in src/

# Validate test coverage
@enforcer verify test coverage meets 85% threshold

# Run comprehensive audit
@enforcer perform full codex audit of the codebase

# Check type safety
@enforcer validate no 'any' types are used in TypeScript files
```

**Integration Points:**
- **RuleEnforcer Modules**: Uses Registry, Executor, Validators
- **TaskSkillRouter**: Routes violations to fixer agents
- **MCP Client**: Invokes validation tools via enforcer-tools.server
- **Post-Processor**: Validates all code changes pre-commit

**Dependencies:**
- All other agents (for violation delegation)
- RuleEnforcer facade
- Processor pipeline

**Tools Access:**
- `read`, `grep`, `lsp_*`, `bash`
- `skill-code-review`, `skill-security-audit`
- All validation MCP servers

**Status**: ✅ Production Ready  
**Notes**: Central governance agent - all compliance decisions flow through enforcer

---

#### @architect
**Version**: 1.14.1  
**Role**: System design & technical decisions  
**Complexity Threshold**: High complexity (>25)  
**Primary Pipeline**: Agent Delegation

**Description**:  
The architect agent specializes in system design, API architecture, and technical decision-making. It provides high-level guidance on code structure, design patterns, and architectural best practices.

**Capabilities:**
- System architecture design and review
- API endpoint design (RESTful, GraphQL)
- Database schema design
- Design pattern selection and implementation
- Technical debt assessment
- Architecture pattern recommendations

**Codex Terms Integrated:**
- **3**: Do not over-engineer the solution
- **4**: Fit for purpose and prod-level code
- **15**: Separation of concerns
- **21**: Dependency injection
- **22**: Interface segregation
- **23**: Open/closed principle
- **24**: Single responsibility principle
- **40**: Modular design
- **41**: State management patterns

**Example Invocations:**
```bash
# Design a new API
@architect design REST API for user authentication

# Review architecture
@architect review the microservices architecture

# Design database schema
@architect design database schema for e-commerce system

# Choose design pattern
@architect recommend design pattern for state management

# Assess technical debt
@architect analyze technical debt in the monolith
```

**Integration Points:**
- **TaskSkillRouter**: Routes architecture tasks
- **MCP Client**: Uses architect-tools.server
- **Enforcer**: Validates designs against codex
- **Skills**: architecture-patterns, api-design, database-design

**Dependencies:**
- Enforcer (for codex validation)
- Refactorer (for implementation)

**Tools Access:**
- `read`, `grep`, `lsp_*`, `bash`, `background_task`
- `skill-architecture-patterns`, `skill-api-design`, `skill-database-design`

**Status**: ✅ Production Ready

---

#### @orchestrator
**Version**: 1.14.1  
**Role**: Multi-agent workflow coordination  
**Complexity Threshold**: Enterprise (>95)  
**Primary Pipeline**: Agent Delegation

**Description**:  
The orchestrator manages complex, multi-agent workflows for enterprise-level tasks. It coordinates multiple agents, resolves conflicts, and consolidates results into unified responses.

**Capabilities:**
- Multi-agent task coordination
- Conflict resolution (majority vote, expert priority, consensus)
- Parallel agent execution
- Result consolidation and synthesis
- Complex workflow management
- Agent consensus building

**Codex Terms Integrated:**
- **6**: Batched introspection cycles
- **7**: Resolve all errors (90% prevention)
- **52**: Agent spawn governance
- **53**: Subagent spawning prevention
- **54**: Concurrent agent limits
- **59**: Multi-agent coordination
- **60**: Regression analysis integration

**Example Invocations:**
```bash
# Coordinate complex feature implementation
@orchestrator implement user authentication system

# Multi-agent code review
@orchestrator coordinate comprehensive code review

# Resolve architectural conflicts
@orchestrator resolve design disagreements between services

# Enterprise refactoring
@orchestrator refactor monolith to microservices

# Complex debugging
@orchestrator debug production outage with multiple teams
```

**Integration Points:**
- **13 autonomous agents**: Coordinates multi-agent teams
- **TaskSkillRouter**: Manages agent routing
- **MCP Client**: Parallel tool execution
- **Enforcer**: Validates coordination against governance rules

**Dependencies:**
- All other agents (as subagents)
- Enforcer (for governance compliance)

**Tools Access:**
- `read`, `grep`, `lsp_*`, `bash`, `background_task`, `call_omo_agent`
- All skill invocation tools
- Session management tools

**Status**: ✅ Production Ready  
**Notes**: Only agent that can spawn multiple subagents for consensus

---

#### @bug-triage-specialist
**Version**: 1.14.1  
**Role**: Error investigation & fixes  
**Complexity Threshold**: Debug operations  
**Primary Pipeline**: Agent Delegation

**Description**:  
Specializes in debugging, error analysis, and root cause investigation. Triages bugs, identifies root causes, and implements fixes with minimal disruption.

**Capabilities:**
- Error log analysis and pattern detection
- Root cause investigation
- Stack trace analysis
- Memory leak detection
- Race condition identification
- Automated debugging strategies

**Codex Terms Integrated:**
- **5**: Surgical fixes where needed
- **7**: Resolve all errors (90% prevention)
- **12**: Early returns and guard clauses
- **13**: Error boundaries and graceful degradation
- **32**: Proper error handling

**Example Invocations:**
```bash
# Debug an error
@bug-triage-specialist investigate error in auth module

# Analyze stack trace
@bug-triage-specialist analyze this stack trace and find root cause

# Find memory leak
@bug-triage-specialist detect memory leak in data processing

# Fix race condition
@bug-triage-specialist identify and fix race condition in async code

# Debug production issue
@bug-triage-specialist debug why users can't login
```

**Integration Points:**
- **TaskSkillRouter**: Routes debugging tasks
- **Log Monitor**: Analyzes application logs
- **MCP Client**: Uses debugging tools
- **Enforcer**: Validates fixes against codex

**Dependencies:**
- Log Monitor MCP server
- Enforcer (for fix validation)

**Tools Access:**
- `read`, `grep`, `lsp_*`, `bash`, `ast_grep_*`
- `skill-code-review`, `skill-log-monitor`

**Status**: ✅ Production Ready

---

#### @code-reviewer
**Version**: 1.14.1  
**Role**: Quality assessment & standards  
**Complexity Threshold**: All code changes  
**Primary Pipeline**: Rule Enforcement

**Description**:  
Provides comprehensive code review services, assessing code quality, maintainability, and adherence to best practices. Integrates with enforcer for codex compliance.

**Capabilities:**
- Code quality assessment
- Best practice validation
- Maintainability scoring
- Security smell detection
- Performance issue identification
- Style guide compliance checking

**Codex Terms Integrated:**
- **1**: Progressive prod-ready code
- **2**: No patches/boiler/stubs
- **11**: Type safety first
- **14**: Immutability where possible
- **16**: DRY - Don't repeat yourself
- **18**: Meaningful naming
- **19**: Small, focused functions
- **20**: Consistent code style

**Example Invocations:**
```bash
# Review pull request
@code-reviewer review PR #123

# Review specific file
@code-reviewer review src/auth.ts

# Comprehensive review
@code-reviewer perform full code review

# Check style compliance
@code-reviewer check code style in src/components/

# Review API design
@code-reviewer review REST API design
```

**Integration Points:**
- **Enforcer**: Validates against codex rules
- **TaskSkillRouter**: Routes review requests
- **MCP Client**: Uses code-review skill server
- **Security Auditor**: Flags security issues

**Dependencies:**
- Enforcer (for codex validation)
- Security Auditor (for security review)

**Tools Access:**
- `read`, `grep`, `lsp_*`, `bash`, `lsp_diagnostics`
- `skill-code-review`, `skill-refactoring-strategies`

**Status**: ✅ Production Ready

---

#### @security-auditor
**Version**: 1.14.1  
**Role**: Vulnerability detection  
**Complexity Threshold**: Security operations  
**Primary Pipeline**: Security & Monitoring

**Description**:  
Performs comprehensive security audits, vulnerability scanning, and compliance validation. Identifies security risks and provides remediation guidance.

**Capabilities:**
- Vulnerability scanning (OWASP Top 10)
- Dependency security audit
- Secrets detection
- Compliance validation (PCI-DSS, GDPR, SOC2)
- Security best practice review
- Penetration testing guidance

**Codex Terms Integrated:**
- **29**: Security by design
- **32**: Proper error handling
- **38**: Functionality retention
- **43**: Deployment safety

**Example Invocations:**
```bash
# Full security audit
@security-auditor perform full security audit

# Scan for vulnerabilities
@security-auditor scan for vulnerabilities in dependencies

# Check for secrets
@security-auditor scan for exposed secrets in codebase

# Compliance check
@security-auditor validate GDPR compliance

# Review authentication
@security-auditor review authentication implementation
```

**Integration Points:**
- **Security Scan MCP Server**: Uses security scanning tools
- **Enforcer**: Validates security rules
- **TaskSkillRouter**: Routes security tasks
- **MCP Client**: Uses security-audit skill server

**Dependencies:**
- Security Scanner MCP server
- Enforcer (for security policy validation)

**Tools Access:**
- `read`, `grep`, `lsp_*`, `bash`, `grep_app_searchGitHub`
- `skill-security-audit`, `skill-security-scan`

**Status**: ✅ Production Ready  
**Notes**: Critical security findings block commits

---

#### @refactorer
**Version**: 1.14.1  
**Role**: Technical debt elimination  
**Complexity Threshold**: Refactor operations  
**Primary Pipeline**: Agent Delegation

**Description**:  
Specializes in code refactoring, technical debt elimination, and code modernization. Transforms legacy code into clean, maintainable implementations.

**Capabilities:**
- Code refactoring and modernization
- Technical debt elimination
- Design pattern implementation
- Code consolidation (DRY enforcement)
- Performance optimization refactoring
- Legacy code migration

**Codex Terms Integrated:**
- **5**: Surgical fixes where needed
- **16**: DRY - Don't repeat yourself
- **17**: YAGNI - You aren't gonna need it
- **25**: Code rot prevention
- **40**: Modular design

**Example Invocations:**
```bash
# Refactor legacy code
@refactorer refactor this legacy authentication module

# Eliminate technical debt
@refactorer eliminate technical debt in payment service

# Consolidate duplicate code
@refactorer find and consolidate duplicate code in src/

# Modernize codebase
@refactorer modernize JavaScript to TypeScript

# Extract common patterns
@refactorer extract common patterns into reusable utilities
```

**Integration Points:**
- **TaskSkillRouter**: Routes refactoring tasks
- **MCP Client**: Uses refactoring-strategies skill server
- **Enforcer**: Validates refactored code
- **Code Reviewer**: Reviews refactoring changes

**Dependencies:**
- Enforcer (for codex compliance)
- Code Reviewer (for quality validation)

**Tools Access:**
- `read`, `grep`, `lsp_*`, `bash`, `ast_grep_*`, `lsp_rename`
- `skill-refactoring-strategies`, `skill-code-review`

**Status**: ✅ Production Ready

---

#### @testing-lead
**Version**: 1.14.1  
**Role**: Testing strategy & coverage  
**Complexity Threshold**: Test operations  
**Primary Pipeline**: Rule Enforcement

**Description**:  
Designs comprehensive testing strategies, ensures test coverage targets are met, and implements automated testing solutions.

**Capabilities:**
- Test strategy design
- Test coverage analysis (>85% target)
- Unit test implementation
- Integration test planning
- E2E test strategy
- Test automation framework setup

**Codex Terms Integrated:**
- **26**: Test coverage >85%
- **27**: Fast feedback loops
- **38**: Functionality retention
- **45**: Test execution optimization
- **48**: Regression prevention

**Example Invocations:**
```bash
# Design test strategy
@testing-lead design test strategy for new feature

# Analyze coverage
@testing-lead analyze test coverage gaps

# Implement missing tests
@testing-lead implement tests for authentication module

# Set up test framework
@testing-lead set up Jest testing framework

# Plan integration tests
@testing-lead plan integration tests for microservices
```

**Integration Points:**
- **TaskSkillRouter**: Routes testing tasks
- **MCP Client**: Uses testing-strategy skill server
- **Enforcer**: Validates test compliance
- **Test Execution Processor**: Runs test suites

**Dependencies:**
- Test execution framework
- Enforcer (for coverage validation)

**Tools Access:**
- `read`, `grep`, `lsp_*`, `bash`, `run_terminal_cmd`
- `skill-testing-strategy`, `skill-testing-best-practices`

**Status**: ✅ Production Ready

---

#### @researcher
**Version**: 1.14.1  
**Role**: Codebase exploration & documentation  
**Complexity Threshold**: Analysis operations  
**Primary Pipeline**: Agent Delegation

**Description**:  
Explores and analyzes codebases, finds implementations, and creates comprehensive documentation. Works independently without conflict resolution needs.

**Capabilities:**
- Codebase exploration and analysis
- Implementation pattern discovery
- Documentation generation
- Architecture analysis
- Dependency mapping
- Code metric analysis

**Codex Terms Integrated:**
- **6**: Batched introspection cycles
- **10**: Single source of truth
- **34**: Documentation updates

**Example Invocations:**
```bash
# Explore codebase
@researcher explore codebase and find authentication implementation

# Analyze architecture
@researcher analyze the microservices architecture

# Generate documentation
@researcher generate API documentation

# Find implementation patterns
@researcher find all database connection patterns

# Map dependencies
@researcher create dependency graph of services
```

**Integration Points:**
- **TaskSkillRouter**: Routes research tasks
- **MCP Client**: Uses project-analysis skill server
- **Knowledge Skills**: Architecture patterns, refactoring strategies

**Dependencies:**
- Project analysis MCP servers
- Knowledge skill servers

**Tools Access:**
- `project-analysis_*`, `read`, `grep`, `lsp_*`
- `skill-project-analysis`, `skill-architecture-patterns`

**Status**: ✅ Production Ready  
**Notes**: Solo agent - no conflict resolution needed

---

### 3.2 Specialized Engineering Agents (9)

These agents specialize in specific engineering domains and technical areas.

---
