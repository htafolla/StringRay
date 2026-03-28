---
name: stringray-orchestrator
description: |
  Main orchestration skill for StringRay AI agents.
  Provides commands to coordinate agent work and invoke StringRay APIs
  through the local HTTP API server.

metadata:
  openclaw:
    primaryEnv: STRINGRAY_API_KEY
    emoji: 🤖
  author: StringRay
  tags:
    - ai
    - orchestration
    - agent

user-invocable: true
---

# StringRay Orchestrator Commands

## /strray

Display StringRay status and available commands.

**Usage:** `/strray`

**Example:**
```
/strray
```

## /strray-status

Get detailed status of StringRay integration including connection status.

**Usage:** `/strray-status`

**Example:**
```
/strray-status
```

## /strray-analyze

Analyze code using StringRay code analysis capabilities.

**Usage:** `/strray-analyze <file-path>`

**Arguments:**
- `file-path`: Path to file to analyze (required)

**Example:**
```
/strray-analyze src/index.ts
```

## /strray-code

Perform code review on a file.

**Usage:** `/strray-code <file-path> [options]`

**Arguments:**
- `file-path`: Path to file to review (required)
- `--fix`: Attempt to fix issues automatically (optional)

**Example:**
```
/strray-code src/utils/helper.ts
/strray-code src/utils/helper.ts --fix
```

## /strray-file

Read file using StringRay file tools.

**Usage:** `/strray-file <file-path> [line-start:line-end]`

**Arguments:**
- `file-path`: Path to file to read (required)
- `line-start:line-end`: Line range to read (optional)

**Example:**
```
/strray-file src/index.ts
/strray-file src/index.ts 1:50
```

## /strray-exec

Execute arbitrary StringRay command or script.

**Usage:** `/strray-exec <command>`

**Arguments:**
- `command`: Command to execute (required)

**Example:**
```
/strray-exec list files src/
```

## /strray-help

Show this help message.

**Usage:** `/strray-help [command]`

**Arguments:**
- `command`: Specific command to get help for (optional)

**Example:**
```
/strray-help
/strray-help strray-analyze
```

# Implementation Notes

This skill acts as the main interface between OpenClaw channels and StringRay agents.
It processes user commands and forwards them to the StringRay API server running on localhost:18431.

## API Endpoints

- `POST /api/agent/invoke` - Invoke StringRay agent
- `GET /api/agent/status` - Get agent status
- `GET /health` - Health check

## Authentication

The skill reads the `STRINGRAY_API_KEY` environment variable for authentication.
Set this in your OpenClaw configuration.

## Error Handling

All errors are caught and formatted as user-friendly messages.
Detailed error information is logged for debugging.

# Dependencies

- StringRay API server running on localhost:18431
- STRINGRAY_API_KEY environment variable (optional)
