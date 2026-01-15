# StrRay Framework - Agent Roles & Rule Enforcement Authority

## 🎯 Executive Summary

The StrRay Framework employs **5 specialized AI agents** with **clear separation of responsibilities** and a **hierarchical rule enforcement system**. The **Enforcer agent** holds supreme authority over code quality, codex compliance, and contextual analysis validation.

---

## 🤖 Agent Roles & Responsibilities

### 1. **🎭 Orchestrator** - Workflow Coordinator

**Role**: Multi-agent workflow orchestration and enterprise task management
**Responsibilities**:

- Coordinate complex multi-agent workflows
- Manage session lifecycles and state
- Route tasks to appropriate specialized agents
- Handle conflict resolution between agents
- Ensure completion guarantees and rollback capabilities

**Authority Level**: High (coordinates other agents)
**Code Writing**: No (orchestrates, doesn't create code)
**Tools**: `call_omo_agent`, `session_*`, `background_task`

### 2. **🏗️ Architect** - Codebase Intelligence Authority

**Role**: Codebase intelligence, architectural assessment, and contextual analysis
**Responsibilities**:

- **Codebase Intelligence**: Use contextual analysis to understand existing code structure
- **Architecture Assessment**: Evaluate current architectural patterns and anti-patterns
- **Dependency Mapping**: Track component relationships and coupling
- **Design Planning**: Make informed architectural decisions based on contextual data
- **Scalability Planning**: Design systems that scale with codebase complexity

**Authority Level**: High (makes technical decisions based on intelligence)
**Code Writing**: No (designs systems using contextual analysis)
**Tools**: `context-analysis`, `codebase-structure`, `dependency-analysis`, `architecture-assessment`

### 3. **🛡️ Enforcer** - Rule Enforcement Authority

**Role**: Supreme authority on codex compliance, quality gates, and validation
**Responsibilities**:

- **FINAL AUTHORITY** on all development rules
- Enforce Universal Development Codex v1.2.22 (all 50-terms)
- Validate contextual analysis integration
- Block operations violating rules
- Implement automated fixes and remediation
- Quality gate control before commits

**Authority Level**: **SUPREME** (binding decisions, cannot be overridden)
**Code Writing**: Limited (fixes violations, generates test stubs)
**Tools**: `rule-validation`, `codex-enforcement`, `quality-gate-check`, `context-analysis-validation`

### 4. **🧪 Test-Architect** - Quality Assurance Specialist

**Role**: Testing strategy, coverage optimization, and behavioral validation
**Responsibilities**:

- Design comprehensive testing strategies
- Auto-generate test files for new code
- Ensure 85%+ test coverage
- Validate performance requirements
- Implement parallel test execution

**Authority Level**: Medium (must comply with Enforcer requirements)
**Code Writing**: Yes (generates test code, validation logic)
**Tools**: `write`, `run_terminal_cmd`, `read`, `grep`

### 5. **🔧 Refactorer** - Code Optimization Specialist

**Role**: Technical debt elimination and code consolidation
**Responsibilities**:

- Identify and eliminate technical debt
- Perform code refactoring and optimization
- Consolidate duplicate code
- Improve maintainability and performance
- Follow clean code principles

**Authority Level**: Medium (must get Enforcer approval)
**Code Writing**: Yes (refactors and optimizes existing code)
**Tools**: `lsp_*`, `ast_grep_*`, `run_terminal_cmd`, `edit`

---

## ⚖️ Rule Enforcement Hierarchy

### **Memory-Based Rule System**

```typescript
// Rule prerequisites stored in memory for fast validation
ruleHierarchy.set("tests-required", ["no-duplicate-code"]);
ruleHierarchy.set("context-analysis-integration", [
  "tests-required",
  "no-duplicate-code",
]);
ruleHierarchy.set("memory-optimization", ["context-analysis-integration"]);
ruleHierarchy.set("dependency-management", ["no-duplicate-code"]);
ruleHierarchy.set("input-validation", ["tests-required"]);
```

### **Enforcement Authority Levels**

#### **Level 1: Enforcer (Supreme Authority)**

- **Codex Compliance**: Zero tolerance for violations
- **Quality Gates**: Final approval authority
- **Rule Conflicts**: Final arbiter on rule interpretations
- **Blocking Authority**: Can block any operation
- **Automated Fixes**: Can implement corrections automatically

#### **Level 2: Architect (Technical Authority)**

- **Design Decisions**: Binding technical architecture choices
- **State Management**: Authority over global state patterns
- **Dependency Approval**: Approves major dependency changes
- **Performance Budgets**: Sets performance requirements

#### **Level 3: Orchestrator (Coordination Authority)**

- **Task Assignment**: Routes tasks to appropriate agents
- **Workflow Control**: Manages execution order and dependencies
- **Conflict Mediation**: Resolves agent disagreements
- **Progress Tracking**: Monitors completion status

#### **Level 4: Domain Specialists (Test-Architect, Refactorer)**

- **Implementation Authority**: Within their domain
- **Quality Standards**: Must meet Enforcer requirements
- **Technical Decisions**: Within architectural guidelines
- **Execution Authority**: Can implement approved changes

---

## 🔄 Agent Interaction Workflow

### **Code Creation Workflow**

```
1. Developer Request → Orchestrator (task analysis & routing)
2. Orchestrator → Architect (design validation)
3. Architect → Enforcer (rule compliance check)
4. Enforcer → Test-Architect (test requirements)
5. Test-Architect → Refactorer (implementation if needed)
6. Implementation → Enforcer (final quality gate)
7. Enforcer → Commit (if all validations pass)
```

### **Quality Gate Process**

```
Pre-Commit Validation:
├── Rule Validation (Enforcer)
├── Context Analysis (Enforcer)
├── Codex Compliance (Enforcer)
└── Quality Gate Check (Enforcer)

Result: PASS → Commit Allowed
        FAIL → Block with Remediation Steps
```

---

## 🛡️ Enforcer Agent - Detailed Authority

### **Supreme Authority Areas**

1. **Codex Enforcement**: All 50 Universal Development Codex terms
2. **Quality Gates**: Final approval for all code changes
3. **Rule Validation**: Hierarchical rule system enforcement
4. **Context Analysis**: Validates proper integration patterns
5. **Blocking Authority**: Can veto any operation

### **Enforcer Tools Integration**

```typescript
// Rule Enforcement Tools (enforcer-tools.ts)
-ruleValidation() - // Validates against rule hierarchy
  contextAnalysisValidation() - // Checks context integration
  codexEnforcement() - // Comprehensive codex compliance
  qualityGateCheck(); // Final validation gate
```

### **Automated Remediation**

- **Test Generation**: Auto-creates test files for missing coverage
- **Import Fixes**: Corrects import/export inconsistencies
- **Memory Optimization**: Implements streaming for large files
- **Codex Corrections**: Fixes codex violations automatically

---

## 📊 Agent Authority Matrix

| Agent              | Code Writing       | Rule Enforcement | Technical Decisions | Quality Gates | Blocking Authority |
| ------------------ | ------------------ | ---------------- | ------------------- | ------------- | ------------------ |
| **Enforcer**       | Limited (fixes)    | ✅ Supreme       | ❌ No               | ✅ Final      | ✅ Yes             |
| **Architect**      | ❌ No              | ❌ No            | ✅ High             | ❌ No         | ❌ No              |
| **Orchestrator**   | ❌ No              | ❌ No            | ❌ No               | ❌ No         | ❌ No              |
| **Test-Architect** | ✅ Yes (tests)     | ❌ No            | ❌ No               | ❌ No         | ❌ No              |
| **Refactorer**     | ✅ Yes (refactors) | ❌ No            | ❌ No               | ❌ No         | ❌ No              |

---

## 🔧 Enforcement Commands

### **Pre-commit Validation**

```bash
npm run enforce:pre-commit src/**/*.ts
# Validates all files against rule hierarchy
```

### **Codex Compliance Check**

```bash
npm run enforce:codex validate src/**/*.ts
# Comprehensive codex compliance validation
```

### **Context Analysis Validation**

```bash
npm run enforce:context src/delegation/*.ts
# Validates contextual analysis integration
```

### **Complete Enforcement Suite**

```bash
npm run validate:enforcer
# Runs all enforcer validations
```

---

## 🎯 Key Principles

### **Enforcer Supremacy**

- **Enforcer decisions are binding** and cannot be overridden
- **Quality gates controlled by Enforcer** only
- **Codex violations blocked** at Enforcer level

### **Clear Separation**

- **Architect**: Designs, doesn't implement
- **Test-Architect**: Tests, doesn't design
- **Refactorer**: Optimizes, doesn't create new features
- **Enforcer**: Validates, doesn't create features

### **Hierarchical Authority**

- **Enforcer**: Supreme rule authority
- **Architect**: Technical authority within rules
- **Orchestrator**: Coordination authority
- **Specialists**: Implementation authority within guidelines

### **Automated Enforcement**

- **Rule validation** happens automatically
- **Quality gates** enforced pre-commit
- **Remediation** provided automatically where possible
- **Blocking** occurs only when auto-fixes insufficient

---

## 🚀 Summary

**The Enforcer agent is the RULE ENFORCEMENT AUTHORITY** with supreme authority over code quality, codex compliance, and contextual analysis validation. All other agents must comply with Enforcer requirements and cannot override Enforcer decisions.

**Clear agent roles prevent confusion**:

- **Orchestrator**: Coordinates (doesn't write code)
- **Architect**: Designs (doesn't write code)
- **Enforcer**: Enforces rules (limited code writing for fixes)
- **Test-Architect**: Writes tests
- **Refactorer**: Writes refactored code

**Hierarchical rule enforcement** ensures consistent quality and prevents violations before they reach production.
