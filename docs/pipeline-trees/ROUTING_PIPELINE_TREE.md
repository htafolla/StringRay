# Routing Pipeline

**Purpose**: Intelligent routing of tasks to appropriate agents and skills

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROUTING PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                           INPUT LAYER                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ @agent      │  │ routeTask() │  │ preprocess()│  │ routeTaskToAgent│   │
│  │ invocation  │  │             │  │             │  │                 │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │
└─────────┼────────────────┼────────────────┼────────────────────┼───────────┘
          │                │                │                    │
          └────────────────┴────────────────┴────────────────────┘
                                     │
                                     v
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROCESSING LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    ROUTING ENGINES (5)                              │  │
│  │                                                                     │  │
│  │  ┌─────────────────────┐                                           │  │
│  │  │   TaskSkillRouter   │ (facade - entry point)                    │  │
│  │  │   task-skill-router.ts:267                                     │  │
│  │  └──────────┬──────────┘                                           │  │
│  │             │                                                        │  │
│  │             v                                                        │  │
│  │  ┌─────────────────────┐                                           │  │
│  │  │     RouterCore     │ (orchestration layer)                       │  │
│  │  │   router-core.ts   │                                           │  │
│  │  │                     │                                           │  │
│  │  │  ┌─────────────────┴─────────────────┐                        │  │
│  │  │  │                                   │                        │  │
│  │  │  v                                   v                        │  │
│  │  │ ┌─────────────┐          ┌─────────────────┐                │  │
│  │  │ │KeywordMatcher│          │ ComplexityRouter │                │  │
│  │  │ │(keywords→) │          │(complexity→)    │                │  │
│  │  │ └──────┬──────┘          └────────┬────────┘                │  │
│  │  │        │                         │                         │  │
│  │  │        └───────────┬───────────┘                         │  │
│  │  │                    v                                     │  │
│  │  │           ┌─────────────────┐                             │  │
│  │  │           │  HistoryMatcher │                             │  │
│  │  │           │(taskId history) │                             │  │
│  │  │           └────────┬────────┘                             │  │
│  │  │                    │                                      │  │
│  │  └────────────────────┼──────────────────────────────────────┘  │
│  │                       v                                           │
│  │              ┌─────────────────┐                                 │
│  │              │ DEFAULT_ROUTING │ (fallback)                      │
│  │              │ → enforcer      │                                 │
│  │              │ confidence: 0.5 │                                 │
│  │              └────────┬────────┘                                 │
│  └───────────────────────┼─────────────────────────────────────────┘
│                          │
│                          v
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANALYTICS LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                   ANALYTICS ENGINES (2)                             │  │
│  │                                                                     │  │
│  │  ┌─────────────────┐     ┌─────────────────┐                        │  │
│  │  │  OutcomeTracker │────→│ PatternTracker  │                        │  │
│  │  │outcome-tracker.ts│     │pattern-perf-   │                        │  │
│  │  │                 │     │tracker.ts      │                        │  │
│  │  └─────────────────┘     └─────────────────┘                        │  │
│  │         │                        │                                  │  │
│  │         v                        v                                  │  │
│  │  ┌─────────────────────────────────────────┐                       │  │
│  │  │      routing-outcomes.json (artifact)   │                       │  │
│  │  └─────────────────────────────────────────┘                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     v
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTPUT LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      RoutingResult                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │  │
│  │  │    agent    │  │    skill    │  │  confidence │                │  │
│  │  │  (string)   │  │  (string)   │  │  (0.0-1.0) │                │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │  │
│  │                                                                     │  │
│  │  Optional: matchedKeyword, reason, context                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Compact Data Flow

```
routeTask(taskDescription, options)
    │
    ▼
RouterCore.route()
    │
    ├─► KeywordMatcher.match() [if keywords found]
    │
    ├─► HistoryMatcher.match() [if taskId provided]
    │
    ├─► ComplexityRouter.route() [if complexity provided]
    │
    └─► DEFAULT_ROUTING [fallback]
    │
    ▼
RoutingResult { agent, skill, confidence }
    │
    ▼
outcomeTracker.recordOutcome() [AUTO]
    │
    ▼
Return to caller
```

## Layers

- **Layer 1**: Keyword Matching (KeywordMatcher)
- **Layer 2**: History Matching (HistoryMatcher)
- **Layer 3**: Complexity Routing (ComplexityRouter)
- **Layer 4**: Router Core (RouterCore - orchestration)
- **Layer 5**: Analytics (OutcomeTracker, PatternTracker)

## Components

| Component | File |
|-----------|------|
| TaskSkillRouter | `src/delegation/task-skill-router.ts` |
| RouterCore | `src/delegation/routing/router-core.ts` |
| KeywordMatcher | `src/delegation/routing/keyword-matcher.ts` |
| HistoryMatcher | `src/delegation/routing/history-matcher.ts` |
| ComplexityRouter | `src/delegation/routing/complexity-router.ts` |
| OutcomeTracker | `src/delegation/analytics/outcome-tracker.ts` |
| PatternTracker | `src/analytics/pattern-performance-tracker.ts` |

## Entry Points

| Entry | File:Line | Description |
|-------|-----------|-------------|
| routeTask() | task-skill-router.ts:267 | Main routing entry |
| preprocess() | task-skill-router.ts:240 | Pre-process with context |
| routeTaskToAgent() | task-skill-router.ts:473 | Convenience export |

## Exit Points

| Exit | Data |
|------|------|
| Success | RoutingResult { agent, skill, confidence, matchedKeyword? } |
| Fallback | DEFAULT_ROUTING → enforcer, 0.5 confidence |

## Artifacts

- `logs/framework/routing-outcomes.json` - Outcome persistence
- `routing_history` in StateManager - Historical routing data

## Testing Requirements

1. Route task → verify correct agent selected
2. Route task → verify outcome recorded
3. Route task → verify pattern tracked
4. Full flow: route → analytics → output
