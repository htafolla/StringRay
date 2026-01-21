# StrRay Framework - Agent Operating Procedures

## Overview

This document provides comprehensive operating procedures for all StrRay Framework agents, including workflow execution, inter-agent communication, error handling, and integration patterns. These procedures ensure effective utilization of the multi-agent system for development workflow enhancement.

## Agent Workflow Execution

### Planning Agent Workflows

#### Architect Agent Workflow

**Use Case**: System architecture design and planning

**Execution Steps**:

1. **Initialization**: Agent receives architecture request with scope and constraints
2. **Analysis Phase**:
   - Review existing system architecture and codebase structure
   - Identify architectural patterns and anti-patterns
   - Assess scalability requirements and performance bottlenecks
3. **Design Phase**:
   - Create architectural diagrams and component relationships
   - Define data flow patterns and state management strategies
   - Develop migration plans for complex refactorings
4. **Planning Phase**:
   - Break down implementation into manageable phases
   - Identify dependencies and risk factors
   - Create validation criteria for architectural decisions
5. **Validation Phase**:
   - Cross-reference design against Universal Development Codex principles
   - Assess compliance with framework standards
   - Generate implementation roadmap with milestones

**Expected Outputs**:

- Architectural design document with rationale
- Implementation phases with dependencies
- Risk assessment and mitigation strategies
- Validation checklist for architectural compliance

#### Orchestrator Agent Workflow

**Use Case**: Multi-agent task coordination

**Execution Steps**:

1. **Task Analysis**: Break complex request into specialized subtasks
2. **Agent Selection**: Identify appropriate agents for each subtask
3. **Dependency Mapping**: Establish task relationships and execution order
4. **Delegation Phase**:
   - Assign tasks to selected agents with clear parameters
   - Set up communication channels for progress updates
   - Establish conflict resolution protocols
5. **Monitoring Phase**:
   - Track agent progress and identify bottlenecks
   - Coordinate resource allocation and timing
   - Handle agent failures and reassign tasks as needed
6. **Completion Phase**:
   - Validate all subtasks completed successfully
   - Consolidate results from multiple agents
   - Generate comprehensive workflow summary

**Expected Outputs**:

- Detailed workflow execution plan
- Agent assignments with responsibilities
- Progress tracking dashboard
- Consolidated results with conflict resolutions

### Implementation Agent Workflows

#### Bug Triage Specialist Workflow

**Use Case**: Bug investigation and surgical fixes

**Execution Steps**:

1. **Evidence Collection**: Gather error logs, stack traces, and reproduction steps
2. **Pattern Analysis**: Identify error patterns and potential root causes
3. **Impact Assessment**: Evaluate bug severity and system-wide effects
4. **Investigation Phase**:
   - Trace execution paths through affected code
   - Analyze variable states and data flow
   - Test hypotheses through controlled reproduction
5. **Diagnosis Phase**:
   - Identify root cause with confidence levels
   - Determine minimal fix scope to avoid side effects
   - Plan rollback strategy for safe deployment
6. **Fix Implementation**:
   - Apply surgical code changes with precision
   - Add validation tests to prevent regression
   - Document fix rationale and testing procedures

**Expected Outputs**:

- Root cause analysis report with evidence
- Surgical fix implementation with rollback plan
- Regression prevention tests and monitoring

#### Refactorer Agent Workflow

**Use Case**: Technical debt elimination and code improvement

**Execution Steps**:

1. **Debt Assessment**: Analyze codebase for technical debt indicators
2. **Impact Analysis**: Evaluate refactoring scope and risk factors
3. **Strategy Development**: Create phased refactoring approach
4. **Planning Phase**:
   - Identify code sections requiring improvement
   - Map dependencies and potential breaking changes
   - Develop testing strategy for refactoring validation
5. **Implementation Phase**:
   - Execute changes in small, testable increments
   - Maintain functionality while improving structure
   - Add comprehensive tests for refactored code
6. **Validation Phase**:
   - Verify all functionality preserved after changes
   - Performance testing to ensure improvements
   - Documentation updates for modified code

**Expected Outputs**:

- Technical debt assessment with priority rankings
- Phased refactoring plan with risk mitigation
- Code improvements with before/after comparisons
- Validation results and performance metrics

## Inter-Agent Communication

### Communication Patterns

#### Direct Agent-to-Agent Messaging

```typescript
// Agent communication interface
interface AgentMessage {
  id: string;
  sender: string;
  recipient: string;
  type: "task" | "result" | "notification" | "request";
  payload: any;
  priority: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  correlationId?: string; // For request/response correlation
}
```

#### Message Types and Protocols

- **Task Messages**: Work delegation with parameters and deadlines
- **Result Messages**: Completed work with status and outputs
- **Notification Messages**: Status updates and progress reports
- **Request Messages**: Information requests between agents

#### Conflict Resolution Protocols

1. **Detection**: Identify conflicting recommendations from multiple agents
2. **Analysis**: Evaluate conflict causes and impact assessment
3. **Resolution Strategies**:
   - **Consensus**: Find mutually agreeable solution
   - **Authority**: Use designated agent for final decision
   - **Compromise**: Combine elements from conflicting recommendations
   - **Escalation**: Involve orchestrator for complex conflicts

### MCP Server Integration

#### Server Communication Flow

```
User Request → oh-my-opencode → MCP Server → Agent Processing → Response
    ↓              ↓                ↓            ↓              ↓
Validation    Routing        Tool Call    Execution    Formatting
```

#### Tool Execution Protocols

```javascript
// MCP tool call structure
{
  "method": "tools/call",
  "params": {
    "name": "analyze_code",
    "arguments": {
      "code": "function example() { return true; }",
      "language": "javascript",
      "analysis_type": "quality"
    }
  }
}
```

#### Error Handling in MCP Communication

- **Timeout Management**: Configurable timeouts for tool execution
- **Retry Logic**: Automatic retries for transient failures
- **Fallback Mechanisms**: Alternative execution paths for failed operations
- **Logging Integration**: Comprehensive audit trails for all MCP interactions

## Error Handling and Recovery

### Agent-Level Error Handling

#### Planning Agent Error Recovery

- **Analysis Errors**: Revert to broader scope analysis
- **Design Conflicts**: Use alternative design patterns
- **Planning Failures**: Break down into smaller, manageable tasks
- **Validation Errors**: Adjust criteria or accept with documented exceptions

#### Implementation Agent Error Recovery

- **Code Modification Errors**: Automatic rollback with git integration
- **Test Failures**: Generate additional test cases for validation
- **Performance Regressions**: Profile changes and optimize bottlenecks
- **Integration Issues**: Isolate changes and test incrementally

### System-Level Error Handling

#### Workflow Failure Recovery

1. **Failure Detection**: Monitor agent health and task completion
2. **Impact Assessment**: Evaluate failure scope and system effects
3. **Recovery Strategies**:
   - **Retry**: Reattempt failed operations with different parameters
   - **Reassign**: Delegate failed tasks to alternative agents
   - **Rollback**: Revert changes and restore previous state
   - **Escalate**: Notify administrators for critical failures

#### Communication Failure Recovery

- **Connection Loss**: Automatic reconnection with exponential backoff
- **Message Loss**: Request retransmission with correlation tracking
- **Timeout Handling**: Configurable timeouts with graceful degradation
- **State Synchronization**: Ensure consistent state across agents

## Integration Patterns

### Development Workflow Integration

#### Git Workflow Integration

**Pre-commit Integration**:

```bash
#!/bin/bash
# Pre-commit hook using StrRay agents
strray enforce --check compliance
strray code-reviewer --validate-changes
```

**Branch Protection**:

```yaml
# GitHub branch protection rules
required_status_checks:
  contexts:
    - strray/enforcer-compliance
    - strray/code-reviewer-validation
    - strray/security-auditor-scan
```

**Merge Request Automation**:

```yaml
# GitLab CI/CD integration
stages:
  - validate
  - review
  - merge

strray_validation:
  stage: validate
  script:
    - strray orchestrator --workflow pr-validation
```

#### IDE Integration Patterns

**Real-time Code Assistance**:

```typescript
// IDE extension integration
const strrayExtension = {
  onCodeChange: async (code, context) => {
    const analysis = await strray.codeReviewer.analyze(code);
    return {
      suggestions: analysis.improvements,
      warnings: analysis.violations,
    };
  },
};
```

**Context-Aware Suggestions**:

```typescript
// Intelligent code completion
const completionProvider = {
  provideCompletionItems: async (document, position) => {
    const context = await strray.architect.analyzeContext(document, position);
    return context.suggestions.map((s) => ({
      label: s.label,
      detail: s.description,
      kind: s.type,
    }));
  },
};
```

### CI/CD Pipeline Integration

#### Automated Quality Gates

```yaml
# Comprehensive CI/CD pipeline
stages:
  - analyze
  - test
  - review
  - deploy

strray_analysis:
  stage: analyze
  script:
    - strray orchestrator --workflow full-analysis
  artifacts:
    reports:
      junit: reports/analysis.xml

strray_review:
  stage: review
  script:
    - strray code-reviewer --comprehensive-review
    - strray security-auditor --full-scan
  allow_failure: false
```

#### Performance Monitoring Integration

```yaml
# Performance tracking in CI/CD
performance_monitoring:
  stage: test
  script:
    - strray test-architect --performance-analysis
  artifacts:
    reports:
      performance: reports/performance.json
```

## Monitoring and Observability

### Agent Health Monitoring

#### Health Check Endpoints

```bash
# Individual agent health checks
curl http://localhost:3000/api/agents/enforcer/health
curl http://localhost:3000/api/agents/architect/status
```

#### System-wide Monitoring

```bash
# Comprehensive system monitoring
strray monitor --system-health
strray monitor --agent-performance
strray monitor --workflow-status
```

### Performance Metrics

#### Response Time Tracking

- **Planning Agents**: Target < 5 seconds for analysis tasks
- **Implementation Agents**: Target < 30 seconds for code modifications
- **Orchestrator**: Target < 10 seconds for workflow planning
- **MCP Servers**: Target < 2 seconds for tool execution

#### Quality Metrics

- **Accuracy Rate**: > 90% correct recommendations
- **False Positive Rate**: < 5% incorrect validations
- **User Satisfaction**: > 95% positive feedback
- **Error Recovery Rate**: > 95% successful error handling

### Logging and Auditing

#### Comprehensive Logging

```typescript
// Structured logging for all agent operations
const logger = {
  info: (message, context) => {
    strray.log("info", message, {
      agent: context.agent,
      operation: context.operation,
      correlationId: context.correlationId,
      timestamp: new Date().toISOString(),
    });
  },
};
```

#### Audit Trail Integration

- **Operation Tracking**: All agent actions logged with context
- **Decision Documentation**: Rationale for recommendations and changes
- **Compliance Verification**: Audit trails for regulatory requirements
- **Performance Analysis**: Historical data for optimization

## Troubleshooting Common Issues

### Agent Communication Problems

**Symptoms**: Agents not responding to orchestration requests
**Solutions**:

1. Verify MCP server configurations in `oh-my-opencode.json`
2. Check agent health using monitoring endpoints
3. Restart individual agents or entire framework
4. Review communication logs for error patterns

### Workflow Coordination Failures

**Symptoms**: Multi-agent workflows stalling or producing inconsistent results
**Solutions**:

1. Validate workflow dependencies and agent assignments
2. Check for resource conflicts between concurrent agents
3. Review conflict resolution configurations
4. Simplify complex workflows into smaller, manageable tasks

### Performance Degradation

**Symptoms**: Agents responding slowly or timing out
**Solutions**:

1. Monitor system resources and agent load
2. Adjust timeout configurations for long-running tasks
3. Optimize model selection and caching strategies
4. Scale resources or reduce concurrent agent operations

### Integration Compatibility Issues

**Symptoms**: Agents not working with existing development tools
**Solutions**:

1. Verify integration configurations match tool requirements
2. Update compatibility layers for new tool versions
3. Check API compatibility and authentication
4. Review integration logs for specific error messages

---

## 🔗 Related Documentation

- **Agent Classification**: See `AGENT_CLASSIFICATION.md` for agent classification system and decision tree
- **Comprehensive Specifications**: See main `AGENTS.md` for complete agent details
- **Performance Monitoring**: See `PERFORMANCE_MONITORING.md` for monitoring and optimization guidance
- **Individual Agent Configurations**: See `.opencode/agents/` directory for detailed agent configurations

---

_These operating procedures ensure effective utilization of StrRay's multi-agent capabilities for comprehensive development workflow enhancement and quality assurance._
