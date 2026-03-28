---
source: framework
name: session-management
description: Manage user sessions and persistent state
author: StrRay Framework
version: 1.0.0
schema_version: "1.0"
tags: [infrastructure, session, management]
capabilities:
  - create_session
  - manage_session
  - handle_persistence
dependencies: []

mcp:
  session-management:
    command: node
    args: [node_modules/strray-ai/dist/mcps/state-manager.server.js]
---

# Session Management Skill

Manage user sessions and persistent state.

## Tools Available

- **session_state_management**: Session state management
- **persistence_handling**: Persistence handling

## Usage

This skill provides infrastructure capabilities for session management functionality.

## Integration

Activated when infrastructure capabilities are requested through the skills system.
