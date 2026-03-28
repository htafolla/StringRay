---
name: log-monitor
description: Log analysis, pattern detection, and alerting
author: StrRay Framework
version: 1.0.0
tags: [monitoring, logging, alerting, observability]

mcp:
  log-monitor:
    command: node
    args: [node_modules/strray-ai/dist/mcps/knowledge-skills/log-monitor.server.js]
---

# Log Monitor Skill

Log analysis, pattern detection, and alerting system.

## Tools Available

- **analyze_logs**: Analyze log entries to identify patterns and errors
- **detect_patterns**: Detect specific patterns in logs using regex
- **alert_on_issues**: Generate alerts based on log analysis thresholds
- **correlate_events**: Correlate log entries across sources
- **generate_report**: Generate comprehensive log analysis reports

## Usage

This skill provides logging capabilities for:
- Real-time log monitoring
- Error pattern detection
- Anomaly detection
- Security threat identification
- Performance issue identification

## Integration

Activated when log analysis or monitoring capabilities are requested.
