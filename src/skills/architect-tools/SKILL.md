---
source: framework
name: architect-tools
description: System design and technical architecture tools
author: StrRay Framework
version: 1.0.0
schema_version: "1.0"
tags: [design, architect, tools]
capabilities:
  - design_system
  - evaluate_architecture
  - recommend_tools
dependencies: []

mcp:
  architect-tools:
    command: node
    args: [node_modules/strray-ai/dist/mcps/architect-tools.server.js]
---

# Architect Tools Skill

System design and technical architecture tools.

## Tools Available

- **architecture_design**: Architecture design
- **system_planning**: System planning
- **technical_decisions**: Technical decisions

## Usage

This skill provides design capabilities for architect tools functionality.

## Integration

Activated when design capabilities are requested through the skills system.
