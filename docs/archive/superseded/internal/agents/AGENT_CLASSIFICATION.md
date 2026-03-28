# StrRay Framework - Agent Classification System

## Overview

StrRay Framework implements a sophisticated multi-agent architecture with 8 specialized AI agents, each designed for specific roles in the development lifecycle. This document provides a comprehensive classification system that helps users understand when and how to use each agent effectively.

## Agent Classification Framework

Agents are classified based on their primary function, capabilities, and integration patterns within the development workflow.

### Primary Classification: Planning vs Implementation

## 🔍 Planning-Only Agents

These agents focus on analysis, design, coordination, and strategic planning. They produce plans, strategies, assessments, and recommendations but do not implement code changes.

### 1. Architect

**Primary Role**: Creates architectural designs, plans complex refactorings, and develops consolidation strategies for system scalability and structure.

**Key Characteristics**:

- **Operating Modes**: Analysis, Design, Planning, Validation
- **Tools**: Read, Search, Bash (analysis-focused)
- **Output**: Architectural plans, design recommendations, scalability strategies
- **Integration**: Works with implementation agents to execute plans

**When to Use**:

- System design and architecture planning
- Complex refactoring strategy development
- Dependency analysis and optimization
- Cross-framework adaptation planning

### 2. Orchestrator

**Primary Role**: Coordinates complex multi-step tasks, delegates work to specialized subagents, and ensures completion through progress tracking and conflict resolution.

**Key Characteristics**:

- **Operating Modes**: Planning, Delegation, Monitoring, Completion
- **Tools**: Bash, Read, Edit, Search (coordination-focused)
- **Output**: Workflow plans, task assignments, progress reports
- **Integration**: Manages multi-agent workflows with Sisyphus integration

**When to Use**:

- Complex multi-step development tasks
- Team coordination across multiple agents
- Progress tracking and milestone validation
- Inter-agent conflict resolution

### 3. Test Architect

**Primary Role**: Designs comprehensive testing strategies, behavioral testing frameworks, and validation approaches to ensure 95% behavioral coverage.

**Key Characteristics**:

- **Operating Modes**: Strategy, Design, Analysis, Optimization
- **Tools**: Read, Search, Bash (design-focused)
- **Output**: Testing frameworks, coverage strategies, automation plans
- **Integration**: Provides testing blueprints for implementation teams

**When to Use**:

- Testing strategy development
- Test framework architecture design
- Coverage gap analysis
- CI/CD testing pipeline planning

### 4. Code Reviewer

**Primary Role**: Reviews code quality, validates best practices, and ensures framework compliance through systematic assessment.

**Key Characteristics**:

- **Operating Modes**: Analysis, Review, Compliance, Education
- **Tools**: Read, Search (assessment-focused)
- **Output**: Quality reports, compliance validations, improvement recommendations
- **Integration**: Quality gate for code changes before implementation

**When to Use**:

- Pull request reviews
- Code quality assessments
- Best practice validation
- Compliance checking

### 5. Security Auditor

**Primary Role**: Identifies security vulnerabilities, assesses risks, and provides security recommendations through systematic analysis.

**Key Characteristics**:

- **Operating Modes**: Scan, Analysis, Recommendation, Prevention
- **Tools**: Read, Search, Bash (analysis-focused)
- **Output**: Security reports, vulnerability assessments, mitigation strategies
- **Integration**: Security validation for development workflows

**When to Use**:

- Security code reviews
- Vulnerability assessments
- Threat modeling
- Compliance auditing

### 6. Enforcer

**Primary Role**: Monitors framework compliance, enforces thresholds, and prevents architectural violations through automated auditing.

**Key Characteristics**:

- **Operating Modes**: Scan, Report, Enforce, Async Execution
- **Tools**: Bash, Read, Edit, Search (monitoring-focused)
- **Output**: Compliance reports, threshold validations, violation alerts
- **Integration**: Automated quality assurance and compliance enforcement

**When to Use**:

- Framework compliance monitoring
- Threshold validation (bundle size, coverage, duplication)
- Automated quality checks
- Architectural violation prevention

## ⚡ Implementation Agents

These agents include implementation capabilities in their workflow, performing surgical fixes and code transformations directly.

### 7. Bug Triage Specialist

**Primary Role**: Investigates bugs, identifies root causes, and implements surgical fixes to prevent 90% of runtime errors.

**Key Characteristics**:

- **Operating Modes**: Analysis, Diagnosis, Fix, Prevention
- **Tools**: Bash, Read, Edit, Search (implementation-capable)
- **Output**: Bug fixes, root cause analysis, prevention strategies
- **Integration**: Direct code modification with rollback capability

**When to Use**:

- Bug investigation and fixing
- Error prevention implementation
- Runtime error analysis
- Surgical code modifications

### 8. Refactorer

**Primary Role**: Eliminates technical debt, improves code structure, and consolidates duplicated logic through direct code improvements.

**Key Characteristics**:

- **Operating Modes**: Analysis, Planning, Implementation, Validation
- **Tools**: Bash, Read, Edit, Search (transformation-capable)
- **Output**: Refactored code, improved structure, consolidated logic
- **Integration**: Direct code transformation with validation

**When to Use**:

- Technical debt reduction
- Code structure improvement
- Logic consolidation
- Performance optimization

## 🔧 Tool Access Patterns

### Planning-Only Agents

| Agent            | Read | Search | Bash | Edit | Primary Use        |
| ---------------- | ---- | ------ | ---- | ---- | ------------------ |
| Architect        | ✅   | ✅     | ✅   | ❌   | Design Analysis    |
| Orchestrator     | ✅   | ✅     | ✅   | ⚠️   | Coordination       |
| Test Architect   | ✅   | ✅     | ✅   | ❌   | Strategy Design    |
| Code Reviewer    | ✅   | ✅     | ❌   | ❌   | Quality Assessment |
| Security Auditor | ✅   | ✅     | ✅   | ❌   | Risk Analysis      |
| Enforcer         | ✅   | ✅     | ✅   | ✅   | Monitoring         |

### Implementation Agents

| Agent                 | Read | Search | Bash | Edit | Primary Use         |
| --------------------- | ---- | ------ | ---- | ---- | ------------------- |
| Bug Triage Specialist | ✅   | ✅     | ✅   | ✅   | Surgical Fixes      |
| Refactorer            | ✅   | ✅     | ✅   | ✅   | Code Transformation |

## 📊 Agent Selection Decision Tree

```
Need to analyze or plan?
├── Yes → Planning-Only Agents
│   ├── System architecture? → Architect
│   ├── Multi-step coordination? → Orchestrator
│   ├── Testing strategy? → Test Architect
│   ├── Code quality review? → Code Reviewer
│   ├── Security assessment? → Security Auditor
│   └── Compliance monitoring? → Enforcer
│
└── Need to implement changes?
    └── Implementation Agents
        ├── Bug fixes? → Bug Triage Specialist
        └── Code improvement? → Refactorer
```

## 🎯 Integration Patterns

### Framework Integration

- **Planning Agents**: Provide input to implementation agents through orchestrated workflows
- **Implementation Agents**: Execute plans developed by planning agents
- **MCP Servers**: All agents expose capabilities through Model Context Protocol
- **Communication Bus**: Inter-agent messaging for workflow coordination

### Development Workflow Integration

- **Planning Phase**: Use Architect, Orchestrator, Test Architect for design and planning
- **Implementation Phase**: Use Bug Triage Specialist and Refactorer for code changes
- **Quality Assurance**: Use Code Reviewer, Security Auditor, Enforcer for validation
- **Monitoring**: Continuous oversight by all agent types

## 📈 Performance Considerations

### Planning Agent Performance

- **Response Time**: Fast (2-5 seconds) for analysis and planning tasks
- **Resource Usage**: Low (Read/Search operations only)
- **Scalability**: High (can analyze large codebases efficiently)
- **Accuracy**: High (specialized analysis capabilities)

### Implementation Agent Performance

- **Response Time**: Variable (5-30 seconds) depending on complexity
- **Resource Usage**: Medium (includes Edit operations)
- **Scalability**: Medium (limited by safe code modification scope)
- **Accuracy**: High (includes validation and rollback capabilities)

## 🚨 Best Practices

### Agent Selection Guidelines

1. **Start with Planning**: Always begin with planning agents to understand requirements
2. **Use Appropriate Tools**: Match agent capabilities to task requirements
3. **Combine Agents**: Use orchestrator for complex multi-agent workflows
4. **Validate Changes**: Follow planning agents with quality assurance agents
5. **Monitor Performance**: Track agent effectiveness and adjust usage patterns

### Workflow Optimization

1. **Parallel Processing**: Use orchestrator for concurrent agent execution
2. **Quality Gates**: Implement enforcer checks at key workflow points
3. **Feedback Loops**: Use reviewer agents to validate implementation results
4. **Continuous Improvement**: Regularly assess agent performance and effectiveness

## 🔗 Related Documentation

- **Individual Agent Guides**: See `.opencode/agents/` directory for detailed agent configurations
- **Operating Procedures**: See `OPERATING_PROCEDURES.md` for workflow implementation
- **Performance Monitoring**: See `PERFORMANCE_MONITORING.md` for optimization guidance
- **Comprehensive Specifications**: See `COMPREHENSIVE_AGENTS.md` for complete agent details

---

_This classification system ensures users can effectively leverage StrRay's multi-agent capabilities for comprehensive development workflow enhancement._
