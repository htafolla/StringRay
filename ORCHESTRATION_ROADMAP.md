# StringRay Framework Orchestration Alignment Implementation Roadmap

## Executive Summary

After comprehensive analysis by all key agents (enforcer, orchestrator, test-architect, bug-triage-specialist), the StringRay Framework has **all necessary components** for excellent orchestration but suffers from **alignment issues**. The framework is "almost there" - it just needs better integration of existing pieces.

## Phase 1: Quick Wins (1-2 weeks) - IMPLEMENT NOW

### 🎯 Priority 1: Complete Violation-to-Skill Mapping (High Impact, Low Effort)

**Current State:** Only 5/59 codex rules trigger automatic skill remediation
**Target:** 80% of violations trigger appropriate skills automatically

**Action Items:**

1. **Extend Rule-to-Agent Mappings** in `src/processors/processor-manager.ts`:
   ```typescript
   // Add missing mappings
   'input-validation': 'test-architect',
   'documentation-required': 'librarian', 
   'no-over-engineering': 'architect',
   'prevent-infinite-loops': 'bug-triage-specialist',
   'state-management-patterns': 'architect',
   'import-consistency': 'refactorer',
   'clean-debug-logs': 'refactorer'
   ```

2. **Complete Skill-to-Violation Routing** in `src/enforcement/rule-enforcer.ts`:
   ```typescript
   // Extend attemptRuleViolationFixes() method
   const skillMappings = {
     'tests-required': 'testing-strategy',
     'input-validation': 'testing-strategy', 
     'documentation-required': 'project-analysis',
     'prevent-infinite-loops': 'code-review',
     'no-over-engineering': 'architecture-patterns'
   };
   ```

**Expected Outcome:** Most codex violations now trigger automatic remediation instead of blocking commits.

### 🎯 Priority 2: Standardize Trigger Mechanisms (High Impact, Low Effort)

**Current State:** @enforcer, task(), call_omo_agent() provide different contexts and capabilities
**Target:** All triggers normalized into consistent validation flows

**Action Items:**

1. **Create Unified Entry Point** in `src/orchestrator.ts`:
   ```typescript
   async analyzeComplexity(request: any): Promise<ComplexityResult> {
     // Always run complexity analysis regardless of entry point
     const score = this.calculateComplexityScore(request);
     const strategy = this.selectStrategy(score);
     return { score, strategy, context: request };
   }
   ```

2. **Standardize on task()** for all inter-agent coordination:
   ```typescript
   // Replace call_omo_agent() with task() for visibility
   const result = await task({
     description: "Analyze codebase",
     prompt: analysisRequest,
     subagent_type: "librarian"
   });
   ```

**Expected Outcome:** Consistent agent activation with full context and monitoring.

## Phase 2: Core Improvements (2-4 weeks)

### 🎯 Embed Consensus Resolution in Delegation Flows

**Current State:** Consensus strategies exist but not integrated
**Target:** 90% of multi-agent conflicts resolved automatically

**Action Items:**

1. **Extend AgentDelegator** in `src/delegation/agent-delegator.ts`:
   ```typescript
   async delegateWithConsensus(agents: string[], task: any) {
     const responses = await this.getAllAgentResponses(agents, task);
     if (responses.length > 1) {
       return this.applyConsensusResolution(responses, task.domain);
     }
     return responses[0];
   }
   ```

2. **Add Domain-Specific Logic**:
   ```typescript
   // Prioritize surgical fixes for errors, architectural changes for design
   const domainLogic = {
     'error-resolution': 'prioritize-surgical',
     'testing-strategy': 'majority-vote',
     'architecture-design': 'expert-priority'
   };
   ```

### 🎯 Enhance Context Aggregation

**Current State:** Contexts lost across handoffs
**Target:** Full context persistence across all operations

**Action Items:**

1. **Extend State Manager** for workflow contexts:
   ```typescript
   // In src/state/state-manager.ts
   async persistWorkflowContext(jobId: string, context: WorkflowContext) {
     await this.set(`workflow.${jobId}`, context);
   }
   ```

2. **Aggregate Contexts** in orchestrator:
   ```typescript
   // Combine error context, testing needs, architectural requirements
   const fullContext = await this.aggregateContexts([
     errorContext, testContext, archContext
   ]);
   ```

## Phase 3: Advanced Orchestration (1-2 months)

### 🎯 Implement Workflow Manifests

**Current State:** Implicit dependencies, side-effect coordination
**Target:** Explicit workflow graphs with full traceability

**Action Items:**

1. **Create Orchestration Manifests**:
   ```typescript
   interface WorkflowManifest {
     jobId: string;
     steps: WorkflowStep[];
     dependencies: DependencyGraph;
     consensusPoints: ConsensusPoint[];
   }
   ```

2. **Add Orchestration Logging**:
   ```typescript
   // Extend framework-logger.ts
   logOrchestrationEvent(jobId: string, event: OrchestrationEvent) {
     this.log('orchestration', event.type, 'INFO', event.details, jobId);
   }
   ```

## Success Metrics

- **Phase 1 (2 weeks):** 80% of violations trigger automatic skills
- **Phase 2 (4 weeks):** 90% of multi-agent conflicts auto-resolved
- **Phase 3 (8 weeks):** 100% complex operations have visible orchestration paths
- **Overall:** 80% reduction in manual intervention for framework operations

## Implementation Priority

**START HERE:** Focus on Phase 1 Priority 1 (violation-to-skill mapping) - it's the highest impact change with the most immediate benefits for framework users.

The framework already has all the components needed - we just need to connect them properly.</content>
<parameter name="filePath">docs/reflection/orchestration-alignment-roadmap.md