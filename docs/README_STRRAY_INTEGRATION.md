# StrRay Framework - Direct oh-my-opencode Integration

## Overview

StrRay Framework is now **directly integrated** into oh-my-opencode's core rather than using a separate plugin approach. This provides:

- ✅ **Full Framework Functionality**: All advanced orchestration, processors, MCP servers, and enterprise features
- ✅ **Automatic Activation**: StrRay components activate automatically when oh-my-opencode starts
- ✅ **Seamless Experience**: No separate plugin installation or configuration needed
- ✅ **Core Integration**: StrRay is now part of oh-my-opencode's fundamental architecture

## Architecture

### Core Integration Points

1. **src/strray-activation.ts**: Handles framework component activation in correct order
2. **.opencode/init.sh**: Auto-initializes StrRay during oh-my-opencode startup
3. **src/index.ts**: Exports StrRay components and auto-activates framework
4. **Boot Orchestrator**: Initializes all components in dependency order

### Activation Sequence

```
oh-my-opencode starts
    ↓
.opencode/init.sh (plugin executed)
    ↓
activateStrRayFramework()
    ↓
Phase 1: Codex Injection + Hooks
Phase 2: Boot Orchestrator
Phase 3: State Management + Main Orchestrator
Phase 4: Processor Pipeline
    ↓
StrRay Framework Fully Active
```

## Components

### Automatically Activated

- **Codex Injection**: Pre/post execution validation hooks
- **Boot Orchestrator**: Component initialization in correct order
- **Main Orchestrator**: Multi-agent coordination and delegation
- **State Management**: Persistent session and configuration state
- **Processor Pipeline**: Systematic pre/post processing for all operations
- **Framework Hooks**: Integration points for extensions

### Optional Components

- **MCP Servers**: Advanced agent communication (can be enabled separately)
- **Enterprise Monitoring**: Performance tracking and alerting
- **Distributed Systems**: Load balancing and failover

## Migration from Plugin Approach

If upgrading from the old plugin approach:

```bash
# Remove old plugin files
./scripts/remove-plugin-approach.sh

# Rebuild to include new integration
npm run build

# StrRay now activates automatically with oh-my-opencode
```

## Benefits Over Plugin Approach

| Aspect                  | Old Plugin               | New Direct Integration               |
| ----------------------- | ------------------------ | ------------------------------------ |
| **Activation**          | Manual plugin loading    | Automatic on startup                 |
| **Pre/Post Processors** | Not available            | ✅ Full automatic pipeline           |
| **Orchestration**       | Limited MCP coordination | ✅ Complete multi-agent system       |
| **State Management**    | Plugin-scoped            | ✅ Framework-global state            |
| **Boot Sequence**       | Basic initialization     | ✅ Sophisticated dependency ordering |
| **Enterprise Features** | Partial                  | ✅ Full enterprise capabilities      |

## Configuration

StrRay activation can be configured via environment variables:

```bash
# Enable/disable specific components
STRRAY_ENABLE_ORCHESTRATOR=true
STRRAY_ENABLE_BOOT_ORCHESTRATOR=true
STRRAY_ENABLE_STATE_MANAGEMENT=true
STRRAY_ENABLE_HOOKS=true
STRRAY_ENABLE_CODEX_INJECTION=true
STRRAY_ENABLE_PROCESSORS=true
```

## Development

When developing StrRay features:

1. **Core components** go in `src/` (automatically integrated)
2. **Tests** go in `src/__tests__/`
3. **Documentation** updates in relevant files
4. **Build** with `npm run build` to include in oh-my-opencode

## Result

StrRay Framework is now a **native part of oh-my-opencode** rather than a separate plugin, providing the complete sophisticated orchestration system with automatic pre/post processors, enterprise monitoring, and full framework capabilities integrated at the core level.
