# StrRay Framework - Agents Guide

## Agent System Overview

StrRay Framework implements a sophisticated multi-agent AI system with 8 specialized agents, each designed for specific development and quality assurance tasks.

## Agent Architecture

### Base Agent Class

All agents inherit from the `BaseAgent` class, providing:

- **AI Service Integration**: Lazy-loaded AI service connections
- **Task Execution**: Structured task processing with error handling
- **Response Logging**: Automatic audit trail generation
- **Configuration Management**: Dynamic configuration loading
- **Communication Bus**: Inter-agent messaging capabilities

### Agent Categories

#### 🔧 **System Agents**

Responsible for framework integrity and compliance monitoring.

#### 🎯 **Development Agents**

Handle code quality, architecture, and implementation tasks.

#### 🛡️ **Quality Assurance Agents**

Focus on testing, security, and code improvement.

## Individual Agent Specifications

### 1. Enforcer Agent

**Role**: Framework compliance and quality threshold enforcement

**Capabilities:**

- Configuration validation against schemas
- Quality threshold monitoring (coverage, duplication, error rates)
- Framework rule enforcement
- Automated compliance reporting

**Configuration:**

```json
{
  "agent_capabilities_enforcer": [
    "compliance-monitoring",
    "threshold-enforcement",
    "automation-orchestration"
  ]
}
```

**Use Cases:**

- Pre-commit quality checks
- Configuration drift detection
- Compliance reporting
- Threshold violation alerts

---

### 2. Architect Agent

**Role**: System design review and architectural validation

**Capabilities:**

- Design pattern analysis and recommendations
- Dependency relationship validation
- Architecture documentation review
- Scalability and maintainability assessment

**Configuration:**

```json
{
  "agent_capabilities_architect": [
    "design-review",
    "architecture-validation",
    "dependency-analysis"
  ]
}
```

**Use Cases:**

- New feature architecture design
- Existing system refactoring planning
- Design pattern implementation
- Architecture documentation

---

### 3. Orchestrator Agent

**Role**: Multi-agent workflow coordination and task delegation

**Capabilities:**

- Workflow planning and execution
- Task delegation to specialized agents
- Progress monitoring and reporting
- Conflict resolution between agents

**Configuration:**

```json
{
  "agent_capabilities_orchestrator": [
    "task-coordination",
    "multi-agent-orchestration",
    "workflow-management"
  ]
}
```

**Use Cases:**

- Complex multi-step development tasks
- Cross-team coordination
- Project milestone management
- Automated workflow execution

---

### 4. Bug Triage Specialist Agent

**Role**: Error analysis, root cause identification, and fix recommendations

**Capabilities:**

- Error pattern recognition
- Root cause analysis
- Impact assessment
- Fix priority recommendations

**Configuration:**

```json
{
  "agent_capabilities_bug_triage_specialist": [
    "error-analysis",
    "root-cause-identification",
    "fix-suggestions"
  ]
}
```

**Use Cases:**

- Bug report analysis
- Error prioritization
- Root cause investigation
- Fix implementation planning

---

### 5. Code Reviewer Agent

**Role**: Automated code quality assessment and improvement suggestions

**Capabilities:**

- Code style and convention checking
- Security vulnerability detection
- Performance optimization recommendations
- Best practice validation

**Configuration:**

```json
{
  "agent_capabilities_code_reviewer": [
    "code-quality-assessment",
    "security-vulnerability-detection",
    "performance-optimization",
    "best-practice-validation"
  ]
}
```

**Use Cases:**

- Pull request reviews
- Code quality gates
- Security scanning
- Performance profiling

---

### 6. Security Auditor Agent

**Role**: Comprehensive security analysis and vulnerability assessment

**Capabilities:**

- Static security analysis
- Vulnerability pattern detection
- Compliance checking
- Security recommendation generation

**Configuration:**

```json
{
  "agent_capabilities_security_auditor": [
    "vulnerability-detection",
    "threat-analysis",
    "security-validation"
  ]
}
```

**Use Cases:**

- Security code reviews
- Vulnerability assessments
- Compliance audits
- Security hardening

---

### 7. Refactorer Agent

**Role**: Code modernization and technical debt reduction

**Capabilities:**

- Legacy code modernization
- Code duplication elimination
- Performance optimization
- Maintainability improvements

**Configuration:**

```json
{
  "agent_capabilities_refactorer": [
    "code-modernization",
    "technical-debt-reduction",
    "performance-optimization"
  ]
}
```

**Use Cases:**

- Legacy system modernization
- Code consolidation
- Performance bottlenecks
- Technical debt reduction

---

### 8. Test Architect Agent

**Role**: Comprehensive test suite design and test quality optimization

**Capabilities:**

- Test coverage analysis
- Test case generation
- Test strategy planning
- Test automation optimization

**Configuration:**

```json
{
  "agent_capabilities_test_architect": [
    "test-suite-design",
    "coverage-analysis",
    "test-optimization"
  ]
}
```

**Use Cases:**

- Test strategy development
- Coverage gap identification
- Test automation
- Quality assurance planning

## Agent Configuration

### Global Agent Settings

```json
{
  "strray_agents": {
    "enabled": [
      "enforcer",
      "architect",
      "orchestrator",
      "bug-triage-specialist",
      "code-reviewer",
      "security-auditor",
      "refactorer",
      "test-architect"
    ],
    "disabled": []
  }
}
```

### Model Assignment

```json
{
  "agent_models": {
    "enforcer_model": "opencode/grok-code",
    "architect_model": "opencode/grok-code",
    "orchestrator_model": "opencode/grok-code",
    "bug_triage_specialist_model": "opencode/grok-code",
    "code_reviewer_model": "opencode/grok-code",
    "security_auditor_model": "opencode/grok-code",
    "refactorer_model": "opencode/grok-code",
    "test_architect_model": "opencode/grok-code"
  }
}
```

## Agent Communication

### Inter-Agent Messaging

Agents communicate through the framework's communication bus:

- **Task Delegation**: Orchestrator assigns tasks to specialized agents
- **Result Sharing**: Agents share analysis results and recommendations
- **Conflict Resolution**: Framework resolves conflicting recommendations
- **Progress Updates**: Real-time status reporting

### Communication Patterns

- **Request-Response**: Synchronous task execution
- **Publish-Subscribe**: Event-driven notifications
- **Broadcast**: Framework-wide announcements
- **Direct Messaging**: Agent-to-agent communication

## Agent Monitoring and Health

### Health Checks

- **Agent Availability**: Response time and success rate monitoring
- **Model Connectivity**: AI service availability verification
- **Resource Usage**: Memory and CPU utilization tracking
- **Error Rates**: Failure pattern analysis

### Performance Metrics

- **Response Time**: Average and percentile response times
- **Throughput**: Tasks completed per time period
- **Accuracy**: Recommendation quality assessment
- **Resource Efficiency**: Computational resource utilization

## Agent Development Guidelines

### Creating New Agents

1. **Extend BaseAgent**: Inherit from the base agent class
2. **Define Capabilities**: Specify agent capabilities in configuration
3. **Implement Tools**: Create MCP server tools for agent functionality
4. **Add Configuration**: Update oh-my-opencode.json with agent settings
5. **Test Integration**: Validate agent integration with framework

### Agent Best Practices

- **Single Responsibility**: Each agent focuses on specific domain
- **Error Handling**: Comprehensive error handling and recovery
- **Logging**: Detailed logging for debugging and auditing
- **Performance**: Optimize for response time and resource usage
- **Compatibility**: Ensure oh-my-opencode schema compliance

---

_This agents guide provides comprehensive documentation for all StrRay Framework agents, their capabilities, configuration, and usage patterns._
