---
source: framework
name: performance-analysis
description: System performance analysis and optimization
author: StrRay Framework
version: 1.0.0
schema_version: "1.0"
tags: [performance, performance, analysis]
capabilities:
  - analyze_performance
  - identify_bottlenecks
  - optimize_code
dependencies: []

mcp:
  performance-analysis:
    command: node
    args: [node_modules/strray-ai/dist/mcps/performance-analysis.server.js]
---

# Performance Analysis Skill

System performance analysis and optimization.

## Tools Available

- **performance_analysis**: Performance analysis
- **optimization_recommendations**: Optimization recommendations
- **metrics_tracking**: Metrics tracking

## Usage

This skill provides performance capabilities for performance analysis functionality.

## Integration

Activated when performance capabilities are requested through the skills system.
