# Reporting Pipeline

**Purpose**: Generate comprehensive framework reports from activity logs

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REPORTING PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                           INPUT LAYER                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐                          │
│  │  generateReport()    │  │scheduleAutomated-   │                          │
│  │  :87                │  │Reports():110        │                          │
│  └──────────┬──────────┘  └──────────┬──────────┘                          │
└─────────────┼─────────────────────────┼─────────────────────────────────────┘
              │                         │
              └─────────────┬───────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │               REPORTING ENGINES (6 layers)                              │  │
│  │                                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                LAYER 1: Log Collection                     │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │               FrameworkLogger                           │ │   │  │
│  │  │  │              framework-logger.ts                        │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  ┌─────────────────────────────────────────────────────┐│ │   │  │
│  │  │  │  │  getRecentLogs(1000)                               ││ │   │  │
│  │  │  │  │  readCurrentLogFile()                              ││ │   │  │
│  │  │  │  │  readRotatedLogFiles() (if lastHours > 24)         ││ │   │  │
│  │  │  │  └─────────────────────────────────────────────────────┘│ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  Artifacts:                                            │ │   │  │
│  │  │  │  • logs/framework/activity.log (current)                │ │   │  │
│  │  │  │  • logs/framework/framework-activity-*.log.gz (rotated)  │ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                LAYER 2: Log Parsing                        │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │                   Log Parsers                           │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  parseLogLine()                                        │ │   │  │
│  │  │  │    → { timestamp, level, message, metadata }           │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  parseCompressedLogFile()                              │ │   │  │
│  │  │  │    → decompress → parse lines                         │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  ┌─────────────────────────────────────────────────────┐│ │   │  │
│  │  │  │  │  Example Parsed Entry:                               ││ │   │  │
│  │  │  │  │  {                                                  ││ │   │  │
│  │  │  │  │    timestamp: "2024-01-01T12:00:00Z",             ││ │   │  │
│  │  │  │  │    level: "INFO",                                  ││ │   │  │
│  │  │  │  │    message: "Agent delegating to architect",       ││ │   │  │
│  │  │  │  │    agent?: "architect",                             ││ │   │  │
│  │  │  │  │    taskId?: "task-123"                            ││ │   │  │
│  │  │  │  │  }                                                  ││ │   │  │
│  │  │  │  └─────────────────────────────────────────────────────┘│ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │              LAYER 3: Metrics Calculation                  │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │                calculateMetrics(logs)                   │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │ │   │  │
│  │  │  │  │  Agent Usage Counts                             │   │ │   │  │
│  │  │  │  │  { enforcer: 50, architect: 30, refactorer: 20 }│   │ │   │  │
│  │  │  │  └─────────────────────────────────────────────────┘   │ │   │  │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │ │   │  │
│  │  │  │  │  Delegation Counts                              │   │ │   │  │
│  │  │  │  │  { total: 100, success: 95, failed: 5 }       │   │ │   │  │
│  │  │  │  └─────────────────────────────────────────────────┘   │ │   │  │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │ │   │  │
│  │  │  │  │  Context Operations                             │   │ │   │  │
│  │  │  │  │  { create: 200, update: 150, delete: 50 }      │   │ │   │  │
│  │  │  │  └─────────────────────────────────────────────────┘   │ │   │  │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │ │   │  │
│  │  │  │  │  Tool Execution Stats                           │   │ │   │  │
│  │  │  │  │  { bash: 400, read: 50, write: 30, glob: 20 }│   │ │   │  │
│  │  │  │  └─────────────────────────────────────────────────┘   │ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │              LAYER 4: Insights Generation                    │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │             generateInsights(logs, metrics)              │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │ │   │  │
│  │  │  │  │  Patterns Detected:                              │   │ │   │  │
│  │  │  │  │  • "Agent usage concentrated in enforcer"       │   │ │   │  │
│  │  │  │  │  • "Success rate above 95% threshold"           │   │ │   │  │
│  │  │  │  │  • "Response time within acceptable range"     │   │ │   │  │
│  │  │  │  └─────────────────────────────────────────────────┘   │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  ┌─────────────────────────────────────────────────┐   │ │   │  │
│  │  │  │  │  generateRecommendations(metrics)               │   │ │   │  │
│  │  │  │  │  • "Consider load balancing enforcer workload" │   │ │   │  │
│  │  │  │  │  • "Review slow response times in architect"    │   │ │   │  │
│  │  │  │  └─────────────────────────────────────────────────┘   │ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │              LAYER 5: Report Formatting                      │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │              formatReport(data, format)                  │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │       ┌─────────┐     ┌─────────┐     ┌─────────┐      │ │   │  │
│  │  │  │       │Markdown │     │  JSON   │     │  HTML   │      │ │   │  │
│  │  │  │       │  (.md) │     │ (.json) │     │ (.html) │      │ │   │  │
│  │  │  │       └────┬────┘     └────┬────┘     └────┬────┘      │ │   │  │
│  │  │  │            │               │               │             │ │   │  │
│  │  │  │            v               v               v             │ │   │  │
│  │  │  │  ┌─────────────────────────────────────────────────────┐│ │   │  │
│  │  │  │  │  # Report Title                                   ││ │   │  │
│  │  │  │  │  ## Summary                                       ││ │   │  │
│  │  │  │  │  - Total Events: 100                              ││ │   │  │
│  │  │  │  │  ## Insights                                      ││ │   │  │
│  │  │  │  │  - Insight 1                                      ││ │   │  │
│  │  │  │  └─────────────────────────────────────────────────────┘│ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  saveReportToFile(outputPath) (optional)               │ │   │  │
│  │  │  │  → reports/${type}-report-${date}.md|json|html        │ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │              LAYER 6: Scheduled Reports                      │   │  │
│  │  │                                                             │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │           scheduleAutomatedReports()                     │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                │ │   │  │
│  │  │  │  │ hourly  │  │  daily  │  │ weekly  │                │ │   │  │
│  │  │  │  └─────────┘  └─────────┘  └─────────┘                │ │   │  │
│  │  │  │                                                         │ │   │  │
│  │  │  │  Configuration:                                       │ │   │  │
│  │  │  │  • Log retention: 24 hours                            │ │   │  │
│  │  │  │  • Report cache TTL: 5 minutes                         │ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     v
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTPUT LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        ReportData                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │  │
│  │  │ generatedAt │  │   metrics   │  │  insights   │                │  │
│  │  │  (ISO date) │  │   (object)  │  │    []       │                │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │  │
│  │                                                                     │  │
│  │  Report Types:                                                       │  │
│  │  • orchestration - Agent delegation metrics                          │  │
│  │  • agent-usage - Per-agent invocation counts                         │  │
│  │  • context-awareness - Context operation analysis                    │  │
│  │  • performance - Response time and throughput                        │  │
│  │  • full-analysis - Comprehensive all-of-the-above                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Compact Data Flow

```
generateReport(config)
    │
    ▼
Check cache (5 min TTL)
    │
    ▼
collectReportData(config)
    │
    ├─► frameworkLogger.getRecentLogs(1000)
    ├─► readCurrentLogFile()
    └─► readRotatedLogFiles() (if lastHours > 24)
    │
    ▼
calculateMetrics(logs)
    │
    ├─► Agent usage counts
    ├─► Delegation counts
    ├─► Context operations
    └─► Tool execution stats
    │
    ▼
generateInsights(logs, metrics)
    │
    ▼
generateRecommendations(metrics)
    │
    ▼
formatReport(data, format) → Markdown | JSON | HTML
    │
    ▼
saveReportToFile(outputPath) (optional)
    │
    ▼
Return ReportData
```

## Layers

- **Layer 1**: Log Collection (frameworkLogger, rotated logs)
- **Layer 2**: Log Parsing (parseLogLine, parseCompressedLogFile)
- **Layer 3**: Metrics Calculation (calculateMetrics)
- **Layer 4**: Insights Generation (generateInsights)
- **Layer 5**: Report Formatting (Markdown, JSON, HTML)
- **Layer 6**: Scheduled Reports (scheduleAutomatedReports)

## Components

| Component | File |
|-----------|------|
| FrameworkReportingSystem | `src/reporting/framework-reporting-system.ts` |
| FrameworkLogger | `src/core/framework-logger.ts` |

## Report Types

| Type | Description |
|------|-------------|
| orchestration | Agent delegation metrics |
| agent-usage | Per-agent invocation counts |
| context-awareness | Context operation analysis |
| performance | Response time and throughput |
| full-analysis | Comprehensive all-of-the-above |

## Entry Points

| Entry | File:Line | Description |
|-------|-----------|-------------|
| generateReport() | framework-reporting-system.ts:87 | Main entry |
| scheduleAutomatedReports() | framework-reporting-system.ts:110 | Scheduled |

## Exit Points

| Exit | Data |
|------|------|
| Success | ReportData { generatedAt, metrics, insights } |
| Failure | Error thrown |

## Artifacts

- `logs/framework/activity.log` (current log)
- `logs/framework/framework-activity-*.log.gz` (rotated)
- `reports/${type}-report-${date}.md|json|html` (generated)

## Configuration

- **Log retention**: 24 hours
- **Report cache TTL**: 5 minutes
- **Scheduled**: hourly/daily/weekly

## Testing Requirements

1. Logs collected correctly
2. Metrics calculated accurately
3. Insights generated
4. Report formatted correctly
