# Orchestration Pipeline

**Purpose**: Coordinate complex multi-step tasks across multiple specialized agents

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATION PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                           INPUT LAYER                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐                          │
│  │executeComplexTask() │  │ executeSingleTask()│                          │
│  │  orchestrator.ts:69 │  │  orchestrator.ts:134│                          │
│  └──────────┬──────────┘  └──────────┬──────────┘                          │
└─────────────┼─────────────────────────┼─────────────────────────────────────┘
              │                         │
              └─────────────┬───────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │               ORCHESTRATION ENGINES (5 layers)                      │  │
│  │                                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                  LAYER 1: Task Definition                   │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │                   TaskDefinition                         │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  { id, description, subagentType, priority, dependencies}│ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │              LAYER 2: Dependency Resolution                 │   │  │
│  │  │                                                             │   │  │
│  │  │           ┌─────────────────────────────────┐              │   │  │
│  │  │           │     Build Task Graph           │              │   │  │
│  │  │           │                                 │              │   │  │
│  │  │           │    ┌───┐      ┌───┐            │              │   │  │
│  │  │           │    │ A │──────│ B │            │              │   │  │
│  │  │           │    └───┘      └─┬─┘            │              │   │  │
│  │  │           │                 │              │              │   │  │
│  │  │           │    ┌───┐        │              │              │   │  │
│  │  │           │    │ C │────────┤              │              │   │  │
│  │  │           │    └───┘        │              │              │   │  │
│  │  │           │                 v              │              │   │  │
│  │  │           │              ┌───┐             │              │   │  │
│  │  │           │              │ D │             │              │   │  │
│  │  │           │              └───┘             │              │   │  │
│  │  │           └─────────────────────────────────┘              │   │  │
│  │  │                                                             │   │  │
│  │  │  while (completed < tasks) {                                │   │  │
│  │  │    findExecutableTasks() → executeBatch() → markComplete() │   │  │
│  │  │  }                                                          │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │               LAYER 3: Task Execution                      │   │  │
│  │  │                                                             │   │  │
│  │  │           ┌─────────────────────────────────┐              │   │  │
│  │  │           │       executeSingleTask()        │              │   │  │
│  │  │           │         orchestrator.ts:134     │              │   │  │
│  │  │           └──────────────┬──────────────────┘              │   │  │
│  │  │                          │                                 │   │  │
│  │  │       ┌─────────────────┴─────────────────┐               │   │  │
│  │  │       v                                   v               │   │  │
│  │  │  ┌─────────┐                        ┌─────────┐           │   │  │
│  │  │  │ Task 1 │                        │ Task 2 │  ...       │   │  │
│  │  │  │ (ready)│                        │(pending)│           │   │  │
│  │  │  └─────────┘                        └─────────┘           │   │  │
│  │  │                                                             │   │  │
│  │  │  maxConcurrentTasks: 5 (default)                           │   │  │
│  │  │  taskTimeout: 300000ms (5 minutes)                         │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │               LAYER 4: Agent Delegation                     │   │  │
│  │  │                                                             │   │  │
│  │  │           ┌─────────────────────────────────┐              │   │  │
│  │  │           │      delegateToSubagent()        │              │   │  │
│  │  │           │        agent-delegator.ts        │              │   │  │
│  │  │           └──────────────┬──────────────────┘              │   │  │
│  │  │                          │                                 │   │  │
│  │  │       ┌─────────────────┴─────────────────┐               │   │  │
│  │  │       v                                   v               │   │  │
│  │  │  ┌─────────────────┐              ┌─────────────────┐     │   │  │
│  │  │  │ EnhancedMulti- │              │AgentSpawnGovernor│     │   │  │
│  │  │  │ AgentOrchestrator│              │                 │     │   │  │
│  │  │  └─────────────────┘              └─────────────────┘     │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │              LAYER 5: Outcome Tracking                     │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐│   │  │
│  │  │  │            routingOutcomeTracker                         ││   │  │
│  │  │  │              recordOutcome()                             ││   │  │
│  │  │  │                                                         ││   │  │
│  │  │  │  → routing-outcomes.json (artifact)                    ││   │  │
│  │  │  └─────────────────────────────────────────────────────────┘│   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     v
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTPUT LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                       TaskResult[]                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │  │
│  │  │   success   │  │   result    │  │   error     │                │  │
│  │  │  (boolean)  │  │   (data)    │  │   (string)  │                │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │  │
│  │                                                                     │  │
│  │  Additional: duration, taskId, agent                                │  │
│  │                                                                     │  │
│  │  conflictResolutionStrategy: majority_vote                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Compact Data Flow

```
executeComplexTask(description, tasks[], sessionId?)
    │
    ▼
Build Task Dependency Graph
    │
    ▼
while (completed < tasks):
    │
    ├─► Find executable tasks (dependencies met)
    │
    ├─► Execute batch (maxConcurrentTasks)
    │     │
    │     ├─► executeSingleTask(task)
    │     │     │
    │     │     └─► delegateToSubagent(task)
    │     │           │
    │     │           └─► routingOutcomeTracker.recordOutcome()
    │     │
    │     └─► await Promise.all(batch)
    │
    └─► Mark completed
    │
    ▼
Return TaskResult[]
```

## Layers

- **Layer 1**: Task Definition (TaskDefinition)
- **Layer 2**: Dependency Resolution (Task graph)
- **Layer 3**: Task Execution (executeSingleTask)
- **Layer 4**: Agent Delegation (delegateToSubagent)
- **Layer 5**: Outcome Tracking (routingOutcomeTracker)

## Components

| Component | File |
|-----------|------|
| StringRayOrchestrator | `src/orchestrator/orchestrator.ts` |
| EnhancedMultiAgentOrchestrator | `src/orchestrator/enhanced-multi-agent-orchestrator.ts` |
| AgentDelegator | `src/delegation/agent-delegator.ts` |
| AgentSpawnGovernor | `src/orchestrator/agent-spawn-governor.ts` |
| OutcomeTracker | `src/delegation/analytics/outcome-tracker.ts` |

## Entry Points

| Entry | File:Line | Description |
|-------|-----------|-------------|
| executeComplexTask() | orchestrator.ts:69 | Main entry point |
| executeSingleTask() | orchestrator.ts:134 | Single task execution |

## Exit Points

| Exit | Data |
|------|------|
| Success | TaskResult[] with results |
| Failure | TaskResult[] with errors |

## Configuration

- **maxConcurrentTasks**: 5 (default)
- **taskTimeout**: 300000ms (5 minutes)
- **conflictResolutionStrategy**: majority_vote

## Artifacts

- Job ID: `complex-task-${timestamp}-${random}`
- Task results in orchestrator state
- routing-outcomes.json updated

## Testing Requirements

1. Tasks execute in dependency order
2. Concurrent execution within limits
3. Outcomes tracked
4. Results collected correctly
