# StringRay Framework - Direct OpenCode Integration

**Version**: 1.9.0 | **Architecture**: Facade Pattern | **Framework**: StringRay AI

## Overview

StrRay Framework is now **directly integrated** into OpenCode's core rather than using a separate plugin approach. The v1.15.1 release introduces a **Facade Pattern Architecture** that provides:

- ✅ **Full Framework Functionality**: All advanced orchestration, processors, MCP servers, and enterprise features
- ✅ **Automatic Activation**: StrRay components activate automatically when OpenCode starts
- ✅ **Seamless Experience**: No separate plugin installation or configuration needed
- ✅ **Core Integration**: StrRay is now part of OpenCode's fundamental architecture
- ✅ **Facade APIs**: Simplified interfaces for common operations (v1.15.1)
- ✅ **Module Access**: Direct access to 26 internal modules for advanced users (v1.15.1)

---

## Architecture

### Core Integration Points

1. **src/core/strray-activation.ts**: Handles framework component activation in correct order
2. **.opencode/init.sh**: Auto-initializes StrRay during OpenCode startup
3. **src/index.ts**: Exports StrRay components and auto-activates framework
4. **Boot Orchestrator**: Initializes all components in dependency order
5. **Facade Layer**: New simplified APIs for RuleEnforcer, TaskSkillRouter, and MCP Client (v1.15.1)

### Facade Pattern Architecture (v1.15.1)

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode Core                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               StrRay Framework v1.15.1                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Facade Layer                        │  │
│  │  ┌──────────────┬──────────────┬────────────────┐   │  │
│  │  │ RuleEnforcer │ TaskSkill    │ MCP Client     │   │  │
│  │  │ Facade       │ Router       │ Facade         │   │  │
│  │  │ (416 lines)  │ Facade       │ (312 lines)    │   │  │
│  │  │              │ (490 lines)  │                │   │  │
│  │  └──────┬───────┴──────┬───────┴────────┬───────┘   │  │
│  │         │              │                │            │  │
│  └─────────┼──────────────┼────────────────┼────────────┘  │
│            │              │                │               │
│  ┌─────────▼──────────────▼────────────────▼────────────┐  │
│  │                Module Layer (26 modules)             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │  │
│  │  │ Validation│ │ Task     │ │ Server   │             │  │
│  │  │ Engine   │ │ Parser   │ │ Discovery│             │  │
│  │  ├──────────┤ ├──────────┤ ├──────────┤             │  │
│  │  │ Rule     │ │ Skill    │ │ Connection│             │  │
│  │  │ Registry │ │ Matcher  │ │ Pool     │             │  │
│  │  ├──────────┤ ├──────────┤ ├──────────┤             │  │
│  │  │ Codex    │ │ Agent    │ │ Protocol │             │  │
│  │  │ Validator│ │ Selector │ │ Handler  │             │  │
│  │  └──────────┘ └──────────┘ └──────────┘             │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Activation Sequence

```
OpenCode starts
    ↓
.opencode/init.sh (plugin executed)
    ↓
activateStrRayFramework()
    ↓
Phase 1: Codex Injection + Hooks
Phase 2: Boot Orchestrator
Phase 3: State Management + Main Orchestrator
Phase 4: Processor Pipeline
Phase 5: Facade Layer Initialization (v1.15.1)
    ↓
StrRay Framework Fully Active
```

---

## Components

### Automatically Activated

- **Codex Injection**: Pre/post execution validation hooks
- **Boot Orchestrator**: Component initialization in correct order
- **Main Orchestrator**: Multi-agent coordination and delegation
- **State Management**: Persistent session and configuration state
- **Processor Pipeline**: Systematic pre/post processing for all operations
- **Framework Hooks**: Integration points for extensions
- **Facade Layer** (v1.15.1): Simplified APIs for common operations
  - RuleEnforcer Facade (6 modules)
  - TaskSkillRouter Facade (14 modules)
  - MCP Client Facade (8 modules)

### Optional Components

- **MCP Servers**: Advanced agent communication (can be enabled separately)
- **Enterprise Monitoring**: Performance tracking and alerting
- **Distributed Systems**: Load balancing and failover

---

## Migration from Plugin Approach

If upgrading from the old plugin approach:

```bash
# Remove old plugin files
./scripts/remove-plugin-approach.sh

# Rebuild to include new integration
npm run build

# StrRay now activates automatically with OpenCode
# Facade APIs available in v1.15.1
```

### Migration to Facade APIs (Optional)

**Existing code (still works):**
```typescript
const enforcer = orchestrator.getAgent("enforcer");
await enforcer.validate({ ... });
```

**New facade API (recommended):**
```typescript
import { RuleEnforcer } from "@strray/framework";
const enforcer = new RuleEnforcer(orchestrator);
await enforcer.validate({ ... });
```

---

## Benefits Over Plugin Approach

| Aspect | Old Plugin | New Direct Integration v1.15.1 |
|--------|-----------|------------------------------|
| **Activation** | Manual plugin loading | ✅ Automatic on startup |
| **Pre/Post Processors** | Not available | ✅ Full automatic pipeline |
| **Orchestration** | Limited MCP coordination | ✅ Complete multi-agent system |
| **State Management** | Plugin-scoped | ✅ Framework-global state |
| **Boot Sequence** | Basic initialization | ✅ Sophisticated dependency ordering |
| **Enterprise Features** | Partial | ✅ Full enterprise capabilities |
| **Facade APIs** | Not available | ✅ Simplified interfaces (v1.15.1) |
| **Module Access** | Not available | ✅ 26 internal modules (v1.15.1) |
| **Code Reduction** | N/A | ✅ 87% reduction (v1.15.1) |

---

## Configuration

### Facade Configuration (v1.15.1)

StrRay activation and facades can be configured via environment variables and config files:

```bash
# Enable/disable specific components
STRRAY_ENABLE_ORCHESTRATOR=true
STRRAY_ENABLE_BOOT_ORCHESTRATOR=true
STRRAY_ENABLE_STATE_MANAGEMENT=true
STRRAY_ENABLE_HOOKS=true
STRRAY_ENABLE_CODEX_INJECTION=true
STRRAY_ENABLE_PROCESSORS=true

# Facade configuration (v1.15.1)
STRRAY_ENABLE_FACADES=true
STRRAY_RULE_ENFACER_MODULES=all
STRRAY_TASK_ROUTER_MODULES=all
STRRAY_MCP_CLIENT_MODULES=all
```

### Config File

```json
{
  "strray": {
    "version": "1.15.1",
    "architecture": "facade-pattern",
    "components": {
      "orchestrator": true,
      "boot_orchestrator": true,
      "state_management": true,
      "hooks": true,
      "codex_injection": true,
      "processors": true,
      "facades": true
    },
    "facades": {
      "rule_enforcer": {
        "enabled": true,
        "modules": ["all"],
        "cache_enabled": true
      },
      "task_skill_router": {
        "enabled": true,
        "modules": ["all"],
        "routing_algorithm": "ml-based"
      },
      "mcp_client": {
        "enabled": true,
        "modules": ["all"],
        "connection_pooling": true
      }
    }
  }
}
```

---

## Development

### Using Facades in Development (v1.15.1)

When developing with StrRay features:

1. **Use facades for common operations:**
```typescript
import { RuleEnforcer, TaskSkillRouter, MCPClient } from "@strray/framework";

const enforcer = new RuleEnforcer(orchestrator);
const router = new TaskSkillRouter(orchestrator);
const mcpClient = new MCPClient(orchestrator);
```

2. **Access modules for advanced customization:**
```typescript
// Get module from facade
const engine = enforcer.getModule("validation-engine");
const registry = enforcer.getModule("rule-registry");

// Use module directly
const result = await engine.validate({ ... });
```

3. **Core components** go in `src/` (automatically integrated)
4. **Tests** go in `src/__tests__/`
5. **Documentation** updates in relevant files
6. **Build** with `npm run build` to include in OpenCode

### Project Structure

```
stringray/
├── src/
│   ├── core/
│   │   ├── strray-activation.ts
│   │   └── boot-orchestrator.ts
│   ├── facades/           # NEW in v1.15.1
│   │   ├── rule-enforcer/
│   │   │   ├── facade.ts (416 lines)
│   │   │   └── modules/ (6 modules)
│   │   ├── task-skill-router/
│   │   │   ├── facade.ts (490 lines)
│   │   │   └── modules/ (14 modules)
│   │   └── mcp-client/
│   │       ├── facade.ts (312 lines)
│   │       └── modules/ (8 modules)
│   ├── index.ts
│   └── __tests__/
├── .opencode/
│   ├── opencode.json
│   ├── strray/
│   │   └── features.json
│   └── init.sh
└── docs/
    └── api/
        ├── API_REFERENCE.md
        └── ENTERPRISE_API_REFERENCE.md
```

---

## Facade API Examples

### RuleEnforcer Facade

```typescript
import { RuleEnforcer } from "@strray/framework";

const enforcer = new RuleEnforcer(orchestrator);

// Validate code
const result = await enforcer.validate({
  files: ["src/**/*.ts"],
  rules: ["codex-compliance", "type-safety"],
  severity: "error"
});

// Check specific rule
const ruleCheck = await enforcer.checkRule("no-console", "src/app.ts");

// Get validation summary
const summary = await enforcer.getValidationSummary();

// Access internal modules
const engine = enforcer.getModule("validation-engine");
const customResult = await engine.validate({ ... });
```

### TaskSkillRouter Facade

```typescript
import { TaskSkillRouter } from "@strray/framework";

const router = new TaskSkillRouter(orchestrator);

// Route task to best agent/skill
const route = await router.routeTask({
  task: "optimize database queries",
  context: {
    projectType: "nodejs",
    complexity: "high"
  }
});

console.log(route.agent);      // "database-engineer"
console.log(route.confidence); // 0.95

// Get routing analytics
const analytics = await router.getRoutingAnalytics();

// Access modules
const matcher = router.getModule("skill-matcher");
```

### MCP Client Facade

```typescript
import { MCPClient } from "@strray/framework";

const mcpClient = new MCPClient(orchestrator);

// Discover available skills
const skills = await mcpClient.discoverSkills();

// Call skill
const result = await mcpClient.callSkill("project-analysis", {
  projectRoot: "/path/to/project"
});

// Batch operations
const results = await mcpClient.batchCall([
  { skill: "project-analysis", params: { ... } },
  { skill: "security-audit", params: { ... } }
]);

// Access modules
const discovery = mcpClient.getModule("server-discovery");
```

---

## Result

StrRay Framework v1.15.1 is now a **native part of OpenCode** with a modern **Facade Pattern Architecture** that provides:

1. **Complete sophisticated orchestration system** with automatic pre/post processors
2. **Simplified facade APIs** for common operations (87% code reduction)
3. **Module-level access** for advanced customization (26 focused modules)
4. **Enterprise monitoring** and full framework capabilities integrated at the core level
5. **100% backward compatible** - all existing code continues to work

The facade pattern delivers cleaner code, better performance, and easier maintenance while preserving all existing functionality.

---

_Framework Version: 1.9.0 | Architecture: Facade Pattern | Last Updated: 2026-03-12_
