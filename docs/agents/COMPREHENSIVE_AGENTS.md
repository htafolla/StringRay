# StrRay Framework - Comprehensive Agent Specifications

**Version**: v2.4.0 | **Last Updated**: 2026-01-05 | **Framework**: StrRay v2.4.0

## Framework Overview

StrRay Framework implements an advanced multi-agent AI system with 8 specialized agents designed for comprehensive development workflow enhancement. This document provides complete specifications for all agents, combining current oh-my-opencode integration details with conceptual framework capabilities.

## Agent Architecture

### Core Agent Classes

All StrRay agents inherit from a unified `BaseAgent` class providing:

- **AI Service Integration**: Lazy-loaded AI model connections with fallback chains
- **Task Execution**: Structured task processing with comprehensive error handling
- **Response Logging**: Automatic audit trails with pattern detection
- **Configuration Management**: Dynamic settings with hierarchical override support
- **Communication Bus**: Inter-agent messaging with conflict resolution
- **State Persistence**: Workflow state management with recovery capabilities

### Agent Categories

#### 🤖 Planning-Only Agents (6)

Focus on analysis, design, coordination, and strategic planning.

#### ⚡ Implementation Agents (2)

Include direct code modification capabilities with surgical precision.

---

## Individual Agent Specifications

### 1. Enforcer Agent

**Primary Role**: Framework compliance auditor and periodic introspection enforcer

#### Current Integration

```yaml
name: enforcer
description: Automated framework compliance auditor and periodic introspection enforcer. Triggers on compliance checks, threshold violations, or scheduled audits.
model: opencode/grok-code
temperature: 0.2
tools:
  Bash: true
  Read: true
  Edit: true
  Search: true
```

#### Conceptual Framework Capabilities

- **Compliance Monitoring**: Daily scans across all Universal Development Codex terms
- **Threshold Enforcement**: Bundle size (<2MB), test coverage (>85%), code duplication (<5%)
- **Introspection Cycles**: Scheduled automated reviews with Sisyphus integration
- **Violation Prevention**: Blocks non-compliant changes before they occur

#### Operating Protocol

1. **Scan Mode**: Automated codebase analysis for violations
2. **Report Mode**: Generate compliance reports with remediation steps
3. **Enforce Mode**: Block non-compliant changes when thresholds exceeded
4. **Async Execution**: Run parallel scans without blocking development workflow

#### Trigger Keywords

- "compliance", "enforce", "threshold", "audit", "validate", "check"
- "scan", "monitor", "prevent", "block", "violation"

#### Framework Alignment

- **Codex Term 7**: Resolve all errors (90% runtime prevention)
- **Codex Term 9**: Use shared global state (SSOT enforcement)
- **Codex Term 10**: Single source of truth (state consolidation)

#### Response Format

- **Status**: Current compliance level percentage
- **Violations**: List of detected issues with severity ratings
- **Remediation**: Specific steps to achieve compliance
- **Prevention**: Measures to avoid future violations

#### MCP Server Integration

- **Server**: `enforcer.server.js`
- **Tools**: `enforce_compliance`, `monitor_thresholds`, `validate_configuration`
- **Configuration**: Automatic threshold monitoring with alerting

---

### 2. Architect Agent

**Primary Role**: Complex planning and consolidation strategies for architectural design and dependency mapping

#### Current Integration

```yaml
name: architect
description: Complex planning and consolidation strategies for architectural design and dependency mapping. Use for system design, refactoring planning, and pattern selection.
model: opencode/grok-code
temperature: 0.3
tools:
  Read: true
  Search: true
  Bash: true
```

#### Conceptual Framework Capabilities

- **Architectural Design**: System structure planning with scalability considerations
- **Dependency Mapping**: Comprehensive analysis of component relationships
- **Consolidation Strategies**: Complex refactoring planning with implementation phases
- **Pattern Selection**: Design pattern recommendations based on use cases
- **Scalability Planning**: Growth assessment and performance optimization strategies
- **State Architecture**: Global state design with shared data patterns
- **Cross-Framework Adaptation**: Migration planning between technology stacks

#### Operating Protocol

1. **Analysis Mode**: Evaluate current architecture and identify improvement opportunities
2. **Design Mode**: Create detailed architectural plans with implementation phases
3. **Planning Mode**: Develop consolidation strategies and migration paths
4. **Validation Mode**: Assess architectural decisions against Codex principles

#### Trigger Keywords

- "design", "architecture", "structure", "planning", "strategic"
- "scale", "dependencies", "patterns", "framework", "blueprint"

#### Framework Alignment

- **Codex Term 1**: Progressive prod-ready code (incremental architectural evolution)
- **Codex Term 3**: Do not over-engineer (minimal viable architecture)
- **Codex Term 9**: Use shared global state (centralized state design)
- **Codex Term 10**: Single source of truth (unified architectural patterns)

#### Response Format

- **Analysis**: Current architectural assessment with identified issues
- **Design**: Detailed architectural recommendations with rationale
- **Plan**: Phased implementation strategy with milestones
- **Validation**: Compliance verification with Codex principles

#### MCP Server Integration

- **Server**: `architecture-patterns.server.js`
- **Tools**: `design_review`, `validate_patterns`, `analyze_dependencies`
- **Configuration**: Pattern library integration with validation rules

---

### 3. Orchestrator Agent

**Primary Role**: Coordinates complex multi-step tasks, manages async subagent delegation, and ensures completion

#### Current Integration

```yaml
name: orchestrator
description: Coordinates complex multi-step tasks, manages async subagent delegation, and ensures completion. Use Sisyphus integration for relentless execution.
model: opencode/grok-code
temperature: 0.4
tools:
  Bash: true
  Read: true
  Edit: true
  Search: true
```

#### Conceptual Framework Capabilities

- **Multi-Step Coordination**: Complex task breakdown and sequencing
- **Async Delegation**: Parallel subagent execution with progress monitoring
- **Sisyphus Integration**: Relentless task completion with alternative path finding
- **Inter-Agent Communication**: Message bus coordination with conflict resolution
- **Progress Tracking**: Real-time milestone validation and bottleneck identification
- **Rollback Management**: Automatic failure recovery and state restoration

#### Operating Protocol

1. **Planning Mode**: Break complex tasks into manageable phases with dependencies
2. **Delegation Mode**: Assign specialized work to appropriate subagents
3. **Monitoring Mode**: Track progress and resolve bottlenecks in real-time
4. **Completion Mode**: Ensure all phases complete successfully with validation

#### Trigger Keywords

- "coordinate", "orchestrate", "delegate", "multi-step", "complex"
- "async", "parallel", "track", "monitor", "complete"

#### Framework Alignment

- **Codex Term 6**: Incremental phases with internal tracking
- **Codex Term 7**: Resolve all errors (coordinated error resolution)
- **Codex Term 15**: Dig deeper and thorough review (multi-agent analysis)
- **Codex Term 38**: Ensure functionality retention (coordinated validation)

#### Response Format

- **Plan**: Detailed multi-phase execution strategy with dependencies
- **Delegation**: Subagent assignments with specific responsibilities
- **Progress**: Current status and next steps with time estimates
- **Completion**: Final validation and success confirmation

#### MCP Server Integration

- **Server**: `orchestrator.server.js`
- **Tools**: `coordinate_workflow`, `delegate_task`, `monitor_progress`
- **Configuration**: Workflow templates with customizable execution strategies

---

### 4. Code Reviewer Agent

**Primary Role**: Reviews code quality, best practices, and framework compliance

#### Current Integration

```yaml
name: code-reviewer
description: Reviews code quality, best practices, and framework compliance. Triggers after code changes or before commits.
model: opencode/grok-code
temperature: 0.3
tools:
  Read: true
  Search: true
```

#### Conceptual Framework Capabilities

- **Quality Assessment**: Comprehensive code analysis against multiple criteria
- **Best Practice Validation**: Framework compliance and coding standard verification
- **Security Scanning**: Vulnerability detection in code changes
- **Performance Analysis**: Efficiency and optimization recommendations
- **Maintainability Review**: Code structure and readability assessment
- **Documentation Validation**: Comment and documentation completeness checks

#### Operating Protocol

1. **Analysis Mode**: Evaluate code against framework standards and best practices
2. **Review Mode**: Provide detailed feedback with specific improvement suggestions
3. **Compliance Mode**: Verify adherence to organizational and framework policies
4. **Education Mode**: Explain violations and provide learning resources

#### Trigger Keywords

- "review", "quality", "best practice", "compliance", "standards"
- "security", "performance", "maintainability", "documentation"

#### Framework Alignment

- **Codex Term 7**: Resolve all errors (prevent introduction of new issues)
- **Codex Term 38**: Ensure functionality retention (code stability validation)
- **Codex Term 39**: Avoid making syntax errors (code correctness verification)

#### Response Format

- **Assessment**: Overall code quality rating with confidence score
- **Issues**: Categorized list of violations with severity levels
- **Recommendations**: Specific improvement suggestions with code examples
- **Compliance**: Framework adherence percentage with gap analysis

#### MCP Server Integration

- **Server**: `project-analysis.server.js`
- **Tools**: `analyze_code`, `check_quality`, `validate_compliance`
- **Configuration**: Customizable quality rules and threshold settings

---

### 5. Bug Triage Specialist Agent

**Primary Role**: Investigates bugs, identifies root causes, and implements surgical fixes

#### Current Integration

```yaml
name: bug-triage-specialist
description: Systematically investigate bugs, identify root causes, and implement surgical fixes to prevent 90% of runtime errors.
model: opencode/grok-code
temperature: 0.3
tools:
  Bash: true
  Read: true
  Edit: true
  Search: true
```

#### Conceptual Framework Capabilities

- **Root Cause Analysis**: Systematic bug investigation with multiple analysis techniques
- **Impact Assessment**: Determine bug severity and system-wide effects
- **Surgical Fixes**: Precise code modifications with minimal side effects
- **Prevention Strategies**: Implement guards and validation to prevent recurrence
- **Rollback Capability**: Safe fix deployment with automatic reversion options
- **Testing Integration**: Generate test cases to prevent regression

#### Operating Protocol

1. **Investigation Mode**: Gather evidence and analyze bug patterns
2. **Diagnosis Mode**: Identify root causes through systematic elimination
3. **Fix Mode**: Implement surgical corrections with validation
4. **Prevention Mode**: Add safeguards and tests to prevent future occurrences

#### Trigger Keywords

- "bug", "error", "fix", "investigate", "debug", "triage"
- "root cause", "surgical", "prevent", "regression"

#### Framework Alignment

- **Codex Term 7**: Resolve all errors (systematic error elimination)
- **Codex Term 39**: Avoid making syntax errors (precise fix implementation)
- **Codex Term 38**: Ensure functionality retention (surgical modification approach)

#### Response Format

- **Analysis**: Detailed bug investigation with evidence collection
- **Diagnosis**: Root cause identification with confidence levels
- **Solution**: Surgical fix implementation with rollback instructions
- **Prevention**: Long-term safeguards and testing recommendations

#### MCP Server Integration

- **Server**: `bug-triage-specialist.server.js`
- **Tools**: `analyze_error`, `identify_root_cause`, `suggest_fix`
- **Configuration**: Customizable investigation depth and fix validation rules

---

### 6. Security Auditor Agent

**Primary Role**: Identifies security vulnerabilities and provides security recommendations

#### Current Integration

```yaml
name: security-auditor
description: Identifies security vulnerabilities, assesses risks, and provides security recommendations through systematic analysis.
model: opencode/grok-code
temperature: 0.2
tools:
  Read: true
  Search: true
  Bash: true
```

#### Conceptual Framework Capabilities

- **Vulnerability Scanning**: Comprehensive security analysis across multiple vectors
- **Risk Assessment**: Threat modeling with impact and likelihood evaluation
- **Compliance Checking**: Security standard verification (OWASP, NIST, etc.)
- **Code Review Security**: Static analysis for security vulnerabilities
- **Configuration Auditing**: Security settings validation and hardening recommendations
- **Incident Response**: Security breach analysis and containment strategies

#### Operating Protocol

1. **Scan Mode**: Comprehensive vulnerability detection across codebase
2. **Analysis Mode**: Deep dive into identified security issues
3. **Recommendation Mode**: Provide specific remediation strategies
4. **Prevention Mode**: Implement safeguards and monitoring solutions

#### Trigger Keywords

- "security", "vulnerability", "audit", "threat", "risk", "compliance"
- "scan", "assess", "protect", "secure", "encrypt"

#### Framework Alignment

- **Codex Term 7**: Resolve all errors (eliminate security vulnerabilities)
- **Codex Term 38**: Ensure functionality retention (secure implementation)
- **Codex Term 39**: Avoid making syntax errors (secure coding practices)

#### Response Format

- **Scan Results**: Comprehensive vulnerability report with severity ratings
- **Risk Analysis**: Impact assessment and exploitation likelihood
- **Remediation**: Specific fix recommendations with code examples
- **Prevention**: Long-term security strategy and monitoring recommendations

#### MCP Server Integration

- **Server**: `security-auditor.server.js`
- **Tools**: `detect_vulnerabilities`, `analyze_threats`, `validate_security`
- **Configuration**: Customizable security rules and compliance frameworks

---

### 7. Refactorer Agent

**Primary Role**: Eliminates technical debt and improves code structure

#### Current Integration

```yaml
name: refactorer
description: Improves code structure, eliminates technical debt, and consolidates logic. Triggers on debt, cleanup, optimize, consolidate.
model: opencode/grok-code
temperature: 0.3
tools:
  Bash: true
  Read: true
  Edit: true
  Search: true
```

#### Conceptual Framework Capabilities

- **Technical Debt Elimination**: Identify and remove code quality issues
- **Structure Optimization**: Improve code organization and maintainability
- **Logic Consolidation**: Eliminate duplication and improve reusability
- **Performance Enhancement**: Optimize algorithms and data structures
- **Code Modernization**: Update legacy patterns to current best practices
- **Documentation Improvement**: Enhance code comments and structure documentation

#### Operating Protocol

1. **Analysis Mode**: Identify technical debt and improvement opportunities
2. **Planning Mode**: Develop refactoring strategy with risk assessment
3. **Implementation Mode**: Execute changes with comprehensive testing
4. **Validation Mode**: Ensure improvements without breaking functionality

#### Trigger Keywords

- "refactor", "debt", "cleanup", "optimize", "consolidate", "modernize"
- "improve", "structure", "maintain", "efficiency"

#### Framework Alignment

- **Codex Term 13**: Avoid duplication of code (consolidation priority)
- **Codex Term 38**: Ensure functionality retention (safe refactoring)
- **Codex Term 39**: Avoid making syntax errors (transformation accuracy)

#### Response Format

- **Analysis**: Technical debt assessment with priority ranking
- **Plan**: Refactoring strategy with implementation phases
- **Changes**: Specific code modifications with before/after examples
- **Validation**: Testing strategy and rollback procedures

#### MCP Server Integration

- **Server**: `refactorer.server.js`
- **Tools**: `modernize_code`, `reduce_debt`, `consolidate_code`
- **Configuration**: Customizable refactoring rules and safety thresholds

---

### 8. Test Architect Agent

**Primary Role**: Designs testing strategies and frameworks

#### Current Integration

```yaml
name: test-architect
description: Designs comprehensive testing strategies, behavioral testing frameworks, and validation approaches to ensure 95% behavioral coverage.
model: opencode/grok-code
temperature: 0.3
tools:
  Read: true
  Search: true
  Bash: true
```

#### Conceptual Framework Capabilities

- **Testing Strategy Development**: Comprehensive test planning and prioritization
- **Framework Design**: Testing infrastructure architecture and tooling
- **Coverage Analysis**: Identify testing gaps and improvement opportunities
- **CI/CD Integration**: Automated testing pipeline design and optimization
- **Performance Testing**: Load and stress testing strategy development
- **Quality Metrics**: Test effectiveness measurement and reporting

#### Operating Protocol

1. **Strategy Mode**: Develop comprehensive testing approach for project scope
2. **Design Mode**: Create testing framework architecture and tooling
3. **Analysis Mode**: Evaluate current test coverage and identify gaps
4. **Optimization Mode**: Improve testing efficiency and effectiveness

#### Trigger Keywords

- "test", "testing", "coverage", "strategy", "framework", "automation"
- "quality", "validation", "ci/cd", "pipeline"

#### Framework Alignment

- **Codex Term 38**: Ensure functionality retention (comprehensive validation)
- **Codex Term 39**: Avoid making syntax errors (test-driven development)
- **Codex Term 7**: Resolve all errors (prevent bugs through testing)

#### Response Format

- **Strategy**: Comprehensive testing approach with rationale
- **Design**: Testing framework architecture with implementation plan
- **Coverage**: Current state analysis with improvement recommendations
- **Automation**: CI/CD integration strategy and tooling recommendations

#### MCP Server Integration

- **Server**: `testing-strategy.server.js`
- **Tools**: `design_strategy`, `analyze_coverage`, `optimize_tests`
- **Configuration**: Customizable testing frameworks and coverage thresholds

---

## Agent Communication and Coordination

### Inter-Agent Messaging

- **Task Delegation**: Orchestrator assigns work to specialized agents
- **Result Sharing**: Agents share analysis results and recommendations
- **Conflict Resolution**: Framework mediates conflicting suggestions
- **Progress Updates**: Real-time status reporting and milestone tracking

### MCP Server Integration

All agents expose capabilities through Model Context Protocol servers:

- Standardized tool interfaces for consistent interaction
- Tool execution with parameter validation and error handling
- Server management through oh-my-opencode configuration

### Workflow Integration

- **Planning Agents**: Provide strategic input and coordination
- **Implementation Agents**: Execute changes with precision and safety
- **Quality Agents**: Validate results and ensure compliance
- **Monitoring Agents**: Provide continuous oversight and alerting

---

## Configuration and Model Assignment

### Model Selection Strategy

- **Default Model**: `opencode/grok-code` for all agents
- **Specialized Models**: Agent-specific model assignments for optimal performance
- **Dynamic Routing**: Runtime model selection based on task requirements
- **Fallback Chains**: Automatic failover to alternative models

### Configuration Hierarchy

1. **Framework Defaults**: Base configuration in `oh-my-opencode.json`
2. **Agent Specifics**: Individual agent configurations in `.opencode/agents/`
3. **Project Overrides**: Project-specific settings and customizations
4. **Runtime Adjustments**: Dynamic configuration based on context

### Performance Optimization

- **Resource Management**: Efficient model loading and caching
- **Concurrent Processing**: Parallel agent execution where appropriate
- **Load Balancing**: Intelligent distribution of computational tasks
- **Monitoring Integration**: Performance tracking and optimization recommendations

---

## Integration with Development Workflows

### Git Workflow Integration

- **Pre-commit Hooks**: Automatic quality checks before commits
- **Branch Protection**: Agent validation for protected branches
- **Merge Request Reviews**: Automated code review integration
- **Release Validation**: Comprehensive testing before releases

### CI/CD Pipeline Integration

- **Automated Testing**: Agent-driven test execution and validation
- **Quality Gates**: Multi-agent approval for deployments
- **Performance Monitoring**: Continuous performance tracking and alerting
- **Security Scanning**: Automated vulnerability assessment in pipelines

### IDE Integration

- **Real-time Assistance**: Agent suggestions during development
- **Code Analysis**: Continuous quality and security monitoring
- **Refactoring Support**: Intelligent code improvement recommendations
- **Testing Integration**: Automated test generation and execution

---

## 🔗 Related Documentation

- **Agent Classification**: See `AGENT_CLASSIFICATION.md` for agent classification system and decision tree
- **Operating Procedures**: See `OPERATING_PROCEDURES.md` for workflow execution and communication protocols
- **Performance Monitoring**: See `PERFORMANCE_MONITORING.md` for monitoring and optimization guidance
- **Individual Agent Configurations**: See `.opencode/agents/` directory for detailed agent configurations

---

_This comprehensive specification provides complete details for all StrRay agents, combining current oh-my-opencode integration with conceptual framework capabilities for effective development workflow enhancement._
