# Inference Improvement System

> Autonomous inference improvement through collaborative agent workflows.

## Architecture

The inference improvement system is NOT a processor - it's a **collaborative agent workflow** coordinated by the orchestrator.

```
┌─────────────────────────────────────────────────────────────────┐
│                     INFERENCE WORKFLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │ Orchestrator │ ←── Coordinates the workflow                  │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ├─────────────────────────────────────┐                 │
│         │                                     │                 │
│         v                                     v                 │
│  ┌──────────────┐                   ┌──────────────┐             │
│  │  Researcher  │                   │ Code-Analyzer│             │
│  │ Gather logs │                   │ Analyze patterns│           │
│  │ reflections │                   │ metrics data  │             │
│  └──────┬───────┘                   └──────┬───────┘             │
│         │                                   │                     │
│         └───────────────┬───────────────────┘                     │
│                         │                                         │
│                         v                                         │
│                ┌──────────────────┐                               │
│                │    Architect    │                               │
│                │ Design improvements│                             │
│                │ Propose changes │                               │
│                └────────┬─────────┘                               │
│                         │                                         │
│                         v                                         │
│                ┌──────────────────┐                               │
│                │  Code-Reviewer  │                               │
│                │  Review & Refine│                               │
│                └────────┬─────────┘                               │
│                         │                                         │
│                         v                                         │
│                ┌──────────────────┐                               │
│                │    Enforcer     │                               │
│                │ Validate changes│                               │
│                └────────┬─────────┘                               │
│                         │                                         │
│                         v                                         │
│                ┌──────────────────┐                               │
│                │   Apply & Log   │                               │
│                │   To configs    │                               │
│                └──────────────────┘                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Roles

### Researcher Agent
- **Task**: Gather and coalesce data from:
  - `logs/framework/activity.log`
  - `logs/framework/routing-outcomes.json`
  - `docs/reflections/*.md`
  - `logs/reports/*.md`
  - Session reports from `scripts/generate-session-reports.mjs`
  - Job reports from `scripts/generate-job-reports.mjs`

### Code-Analyzer Agent
- **Task**: Analyze gathered data:
  - Pattern performance tracking
  - Routing effectiveness metrics
  - Success/failure analysis
  - Identify gaps and opportunities

### Architect Agent
- **Task**: Design improvements:
  - Propose new keyword mappings
  - Suggest confidence adjustments
  - Recommend routing optimizations
  - Design new patterns

### Code-Reviewer Agent
- **Task**: Review proposed changes:
  - Validate quality of proposals
  - Refine suggestions
  - Ensure no regressions

### Enforcer Agent
- **Task**: Final validation:
  - Codex compliance check
  - Verify changes are safe
  - Block if violations found

## Workflow Triggers

### Trigger 1: Periodic (Autonomous)
```
Cron: Every 24 hours
└── @orchestrator run inference-improvement
```

### Trigger 2: Manual
```
User: @orchestrator improve inference
└── Orchestrator coordinates workflow
```

### Trigger 3: Threshold-Based
```
If: Routing confidence drops below 70% for 10+ tasks
Then: @orchestrator run inference-improvement
```

## Invocation

### Via Agent Syntax
```bash
@orchestrator improve inference
@orchestrator analyze routing patterns
@orchestrator review and refine routing
```

### Via CLI
```bash
npx strray-ai analytics --deep
npx strray-ai report --inference
```

### Via NPM Script
```bash
npm run inference:improve
npm run inference:analyze
```

## Output

The workflow produces:
1. **Routing Adjustments** → `routing-mappings.json`
2. **Complexity Calibrations** → `features.json`
3. **Insights Report** → `docs/reflections/inference-insights-*.md`
4. **Summary** → `logs/framework/inference-summary.md`

## Configuration

In `features.json`:
```json
{
  "inference_improvement": {
    "enabled": true,
    "autonomous": true,
    "interval_hours": 24,
    "min_confidence_threshold": 0.7,
    "agents": ["researcher", "code-analyzer", "architect", "code-reviewer", "enforcer"]
  }
}
```

## Processors vs Agents

| Aspect | Processor (OLD) | Agent Workflow (NEW) |
|--------|-----------------|---------------------|
| Intelligence | Rule-based | LLM-powered |
| Analysis | Pattern matching | Deep understanding |
| Adaptation | Static rules | Contextual reasoning |
| Collaboration | None | Multi-agent consensus |
| Quality | Good | Excellent |

## Key Insight

**We don't build LLMs - we orchestrate them.**

OpenCode is the gateway. The agents ARE the inference engine.
