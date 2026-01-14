# StringRay Framework - Comprehensive Test Suite Documentation

## Overview
The StringRay framework includes a multi-layered testing strategy that validates both internal components and external integrations. This comprehensive approach ensures production reliability.

## Test Categories

### 1. Unit Tests (`npm test`)
- **Framework Core**: Rule enforcement, state management, codex validation
- **Internal Logic**: Agent delegation, task planning, error handling
- **Data Structures**: Configuration parsing, serialization, validation

### 2. Integration Tests (`npm run test:e2e`)
- **Component Interaction**: How framework components work together
- **Data Flow**: Request processing from input to output
- **State Management**: Persistence and recovery mechanisms

### 3. Architecture Tests (`npm run test:architect`)
- **Agent Capabilities**: Individual agent functionality and constraints
- **Delegation Logic**: Task routing and agent selection algorithms

### 4. Path Resolution Tests (`npm run test:path-resolution`)
- **Import Resolution**: Module loading and dependency management
- **Environment Awareness**: Platform-specific path handling

## NEW: External Integration Tests

### 5. MCP Server Connectivity (`npm run test:mcp-connectivity`)
**Purpose**: Validates all StringRay MCP servers can start and declare capabilities
**Coverage**:
- Process spawning for 15+ MCP servers
- Protocol compliance (JSON-RPC handshake)
- Tool capability declarations
- Startup timeout handling

**Why Critical**: MCP servers were failing silently - this test catches external interface issues

### 6. oh-my-opencode Integration (`npm run test:oh-my-opencode-integration`)
**Purpose**: Validates complete integration with oh-my-opencode ecosystem
**Coverage**:
- MCP server registration in .mcp.json
- Plugin loading and codex injection
- Tool availability through oh-my-opencode doctor
- Configuration file validation

**Why Critical**: Ensures the framework works in the target environment

### 7. External Process Communication (`npm run test:external-processes`)
**Purpose**: Validates the orchestration system's ability to spawn and manage external processes
**Coverage**:
- Process spawning and lifecycle management
- Inter-process communication protocols
- Resource cleanup and memory management
- Error handling for failed processes

**Why Critical**: The orchestration system relies on external MCP servers - this validates the core functionality

## Running Tests

### Individual Tests
```bash
npm run test:mcp-connectivity              # MCP server validation
npm run test:oh-my-opencode-integration    # Integration validation
npm run test:external-processes            # Process communication
npm run test:comprehensive                 # All external integration tests
```

### Full Test Suite
```bash
npm run test:all                           # All tests (unit + integration + external)
```

### Deployment Tests
The deployment script automatically runs all validation tests:
```bash
./scripts/deploy-stringray-plugin.sh
```

## Test Results Interpretation

### ✅ PASSED
- All internal framework logic working correctly
- External integrations functional
- Production deployment ready

### ❌ FAILED
- **MCP Connectivity**: External tool ecosystem broken
- **Integration**: oh-my-opencode compatibility issues
- **Process Communication**: Orchestration system cannot spawn agents

## Test Architecture Evolution

### Before (Internal-Only)
```
Framework Logic → Unit Tests ✅
├── Rule Engine ✅
├── State Manager ✅
└── Agent Logic ✅

External Interfaces → ❌ UNTESTED
├── MCP Servers ❌
├── oh-my-opencode ❌
└── Process Communication ❌
```

### After (Comprehensive)
```
Framework Logic → Unit Tests ✅
├── Rule Engine ✅
├── State Manager ✅
└── Agent Logic ✅

External Interfaces → Integration Tests ✅
├── MCP Server Connectivity ✅
├── oh-my-opencode Integration ✅
└── Process Communication ✅
```

## Deployment Impact

The new tests prevent production deployments with broken external interfaces:

- **Before**: Framework appeared healthy but MCP servers were offline
- **After**: Comprehensive validation ensures end-to-end functionality

## Maintenance Notes

- External integration tests run during deployment
- MCP server tests validate the tool ecosystem health
- oh-my-opencode tests ensure plugin compatibility
- Process communication tests verify orchestration capability

This comprehensive test suite provides confidence that StringRay deployments are fully functional from internal logic through external integrations.</content>
<parameter name="filePath">TESTING_DOCUMENTATION.md