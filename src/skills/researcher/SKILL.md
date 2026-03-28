---
source: framework
name: researcher
description: Multi-repo analysis, documentation lookup, and implementation examples
author: StrRay Framework
version: 1.0.0
schema_version: "1.0"
tags: [research, researcher]
capabilities:
  - search_repositories
  - find_implementations
  - analyze_documentation
dependencies: []

mcp:
  researcher:
    command: node
    args: [node_modules/strray-ai/dist/mcps/knowledge-skills/project-analysis.server.js]
---

# Researcher Skill

Multi-repo analysis, documentation lookup, and implementation examples.

## Tools Available

- **search_repositories**: Search repositories
- **find_implementations**: Find implementations
- **analyze_documentation**: Analyze documentation

## Usage

This skill provides research capabilities for researcher functionality.

## Integration

Activated when research capabilities are requested through the skills system.
