# StrRay Framework - Agent Classification System

## Overview

StrRay Framework implements a sophisticated multi-agent architecture with 25 specialized AI agents, each designed for specific roles in the development lifecycle. This document provides a comprehensive classification system that helps users understand when and how to use each agent effectively. This document provides a comprehensive classification system that helps users understand when and how to use each agent effectively.

## Agent Classification Framework

Agents are classified based on their primary function, capabilities, and integration patterns within the development workflow.

### Primary Classification: Planning vs Implementation

## 🔍 Planning-Only Agents (14 Total)

These agents focus on analysis, design, coordination, and strategic planning. They produce plans, strategies, assessments, and recommendations but do not implement code changes.

### Core Planning Agents

#### 1. Architect

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

#### 2. Orchestrator

**Primary Role**: Coordinates complex multi-step tasks, delegates work to specialized subagents, and ensures completion through progress tracking and conflict resolution. This is the PRIMARY agent that routes tasks to all 26 other specialized agents.

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

#### 3. Test Architect

**Primary Role**: Designs comprehensive testing strategies, behavioral testing frameworks, and validation approaches to ensure 87% test coverage.

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

#### 5. Security Auditor

**Primary Role**: Identifies security vulnerabilities, assesses risks, and provides security recommendations through systematic analysis.

**Integration Requirements**:
- Must validate against Codex Term 29 (Security by Design)
- Coordinates with Enforcer for security compliance
- Cross-references with Architect for secure design patterns

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

#### 6. Enforcer

**Primary Role**: Monitors framework compliance, enforces thresholds, and prevents architectural violations through automated auditing.

**Integration Requirements**:
- Validates all 60 Codex terms
- Cross-references with all other agents for compliance
- Generates compliance reports for every operation
- Blocks operations violating Codex terms

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

### Additional Planning Agents

#### 7. Code Reviewer

**Primary Role**: Reviews code quality, validates best practices, and ensures framework compliance through systematic assessment.

**Documentation Requirements**:
- Must document all code review findings
- Cross-reference with Codex terms in reports
- Provide actionable improvement suggestions

#### 8. Researcher

**Primary Role**: Explores codebases, finds implementation patterns, and retrieves relevant documentation across multiple repositories.

**Integration Requirements**:
- Uses contextual awareness architecture
- Cross-references with Architect for pattern recommendations
- Documents findings for team knowledge sharing

#### 9. Testing Lead

**Primary Role**: Coordinates testing efforts, validates test coverage, and ensures quality gates are met before deployment.

**Documentation Requirements**:
- Validates 87% test coverage (v1.15.1)
- Documents testing strategies and results
- Cross-references with Test Architect for strategy alignment

#### 10. Performance Engineer

**Primary Role**: Analyzes system performance, identifies bottlenecks, and recommends optimization strategies.

**Integration Requirements**:
- Validates against Codex Term 28 (Performance Budget Enforcement)
- Cross-references with Architect for performance designs
- Documents performance metrics and improvements

#### 11. Storyteller

**Primary Role**: Creates narrative-style documentation including technical deep reflections, sagas, journeys, and narratives.

**Specialized Types**:
- `reflection` - Technical deep reflections
- `saga` - Long-form technical sagas
- `journey` - Investigation/learning journeys
- `narrative` - Technical storytelling

**Documentation Requirements**:
- Creates comprehensive journey documents
- Documents architectural decisions and their evolution

#### 12. Backend Engineer

**Primary Role**: Designs and implements backend systems, APIs, and database architectures.

**Integration Requirements**:
- Coordinates with Architect for system design
- Validates against API design patterns
- Documents API contracts and schemas

#### 13. Frontend Engineer

**Primary Role**: Designs and implements user interfaces with mobile-first and accessibility-first principles.

**Integration Requirements**:
- Validates against Codex Term 30 (Accessibility First)
- Cross-references with UI/UX Design agent
- Documents component libraries and design systems

#### 14. Database Engineer

**Primary Role**: Designs database schemas, optimizes queries, and ensures data integrity.

**Integration Requirements**:
- Coordinates with Architect for data models
- Validates against data consistency rules
- Documents schema designs and migrations

## ⚡ Implementation Agents (13 Total)

These agents include implementation capabilities in their workflow, performing surgical fixes and code transformations directly.

### Core Implementation Agents

#### 15. Bug Triage Specialist

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

**Integration Requirements**:
- Must validate against Codex Term 5 (Surgical Fixes Where Needed)
- Cross-references with Code Reviewer before finalizing fixes
- Documents root cause and prevention strategies

#### 16. Refactorer

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

**Integration Requirements**:
- Validates against Codex Term 25 (Code Rot Prevention)
- Cross-references with Architect for refactoring strategies
- Ensures 87% code reduction patterns (Facade Pattern)
- Documents refactoring rationale and impact

### Additional Implementation Agents

#### 17. Refactorer Agent

**Note**: The Refactorer agent provides advanced code transformation capabilities.

#### 18. Tech Writer

**Primary Role**: Creates technical documentation, API references, and user guides.

**Documentation Requirements**:
- Creates comprehensive documentation for all features
- Validates documentation against code changes
- Cross-references with all agents for accuracy

#### 19. Code Analyzer

**Primary Role**: Performs deep code analysis, extracts metrics, and detects patterns.

**Integration Requirements**:
- Uses contextual awareness architecture
- Validates against quality metrics
- Documents analysis findings and recommendations

#### 20. Multimodal Looker

**Primary Role**: Analyzes visual content including diagrams, screenshots, and UI mockups.

**Specialized Capabilities**:
- Image analysis and interpretation
- Diagram understanding
- UI/UX mockup evaluation

#### 21. UI/UX Design Agent

**Primary Role**: Designs user interfaces following mobile-first and accessibility-first principles.

**Integration Requirements**:
- Validates against Codex Term 30 (Accessibility First)
- Cross-references with Frontend Engineer
- Documents design decisions and rationale

#### 22. DevOps Engineer

**Primary Role**: Manages CI/CD pipelines, infrastructure, and deployment automation.

**Integration Requirements**:
- Validates against Codex Term 36 (Continuous Integration)
- Coordinates with all agents for deployment
- Documents deployment procedures and workflows

#### 23. Mobile Developer

**Primary Role**: Develops mobile applications with focus on performance and user experience.

**Integration Requirements**:
- Validates against mobile-first principles
- Cross-references with UI/UX Design agent
- Documents mobile-specific considerations

#### 24. Growth Strategist

**Primary Role**: Develops growth strategies, user acquisition plans, and optimization approaches.

**Documentation Requirements**:
- Documents growth metrics and strategies
- Cross-references with Analytics systems

#### 25. Content Creator

**Primary Role**: Creates content for documentation, tutorials, and user guides.

**Integration Requirements**:
- Coordinates with Tech Writer for consistency
- Validates content against style guides

#### 26. SEO Consultant

**Primary Role**: Optimizes content and applications for search engines.

**Documentation Requirements**:
- Documents SEO strategies and implementations
- Validates against best practices

#### 27. Security-Auditor

**Primary Role**: (Alternative specialized security role)

**Note**: Works alongside the Security Auditor agent for comprehensive security coverage.

---

**Total Agents: 27**

### Complete Agent List

| # | Agent Name | Type | Primary Role |
|---|------------|------|--------------|
| 1 | Orchestrator | Primary | Multi-agent coordination |
| 2 | Architect | Planning | System design |
| 3 | Enforcer | Planning | Codex compliance |
| 4 | Test Architect | Planning | Testing strategy |
| 5 | Security Auditor | Planning | Security validation |
| 6 | Code Reviewer | Planning | Code quality |
| 7 | Researcher | Planning | Codebase exploration |
| 8 | Testing Lead | Planning | Test coordination |
| 9 | Performance Engineer | Planning | Performance optimization |
| 10 | Storyteller | Planning | Technical documentation |
| 11 | Backend Engineer | Planning | Backend design |
| 12 | Frontend Engineer | Planning | Frontend design |
| 13 | Database Engineer | Planning | Database design |
| 14 | Bug Triage Specialist | Implementation | Bug fixing |
| 15 | Refactorer | Implementation | Code refactoring |
| 16 | Tech Writer | Implementation | Documentation |
| 17 | Code Analyzer | Implementation | Code analysis |
| 18 | Multimodal Looker | Implementation | Visual analysis |
| 19 | UI/UX Design | Implementation | Interface design |
| 20 | DevOps Engineer | Implementation | CI/CD automation |
| 21 | Mobile Developer | Implementation | Mobile apps |
| 22 | Growth Strategist | Implementation | Growth planning |
| 23 | Content Creator | Implementation | Content production |
| 24 | SEO Consultant | Implementation | SEO optimization |
| 25 | [Additional specialized agents] | Mixed | Domain-specific tasks |

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
- **Comprehensive Specifications**: See main `AGENTS.md` for complete agent details

---

_This classification system ensures users can effectively leverage StrRay's multi-agent capabilities for comprehensive development workflow enhancement._
