# StringRay Agents

Quick reference for StringRay AI orchestration framework.

## What is StringRay?

StringRay provides intelligent multi-agent orchestration with automatic delegation and Codex compliance validation. Agents operate via OpenCode plugin injection - no manual setup needed.

## How StringRay Works

StringRay provides intelligent multi-agent orchestration with automatic delegation and Codex compliance validation. Agents operate via OpenCode plugin injection - no manual setup needed.

### Basic Operation

1. **Install**: Run `npx strray-ai install` to configure agents in your project
2. **Invoke**: Use `@agent-name` syntax in prompts or code comments (e.g., `@architect design this API`)
3. **Automatic Routing**: StringRay automatically routes tasks to the appropriate agent based on complexity
4. **Agent Modes**: Agents can be `primary` (main coordinator) or `subagent` (specialized helper)

### Where to Find Reflections

Deep reflection documents capture development journeys and lessons learned:
- **Location**: `docs/reflections/` (main) and `docs/reflections/deep/` (detailed)
- **Examples**: `kernel-v2.0-skill-system-fix-journey.md`, `typescript-build-fix-journey-2026-03-09.md`, `stringray-framework-deep-reflection-v1.4.21.md`

These documents capture:
- Technical challenges encountered and solved
- Architectural decisions made
- Lessons learned for future development
- Best practices established

### File Organization Guidelines

**IMPORTANT**: Save all generated files to their proper directories. Do NOT save to root.

| File Type | Save To | Example |
|-----------|---------|---------|
| **Reflections** | `docs/reflections/` or `docs/reflections/deep/` | `docs/reflections/my-fix-reflection.md` |
| **Logs** | `logs/` | `logs/framework/activity.log` |
| **Scripts** | `scripts/` or `scripts/bash/` | `scripts/bash/my-script.sh` |
| **Test Files** | `src/__tests__/` | `src/__tests__/unit/my-test.test.ts` |
| **Source Code** | `src/` | `src/my-module.ts` |
| **Config** | `config/` or `.opencode/strray/` | `.opencode/strray/config.json` |

**Never save to root** - Root directory is for essential files only:
- `README.md`, `CHANGELOG.md`, `package.json`, `tsconfig.json`

### Logging Guidelines

**IMPORTANT**: Never use `console.log`, `console.warn`, or `console.error`. Use the framework logger instead.

| Use This | Not This |
|----------|-----------|
| `frameworkLogger.log(module, event, 'info', { data })` | `console.log()` |
| `frameworkLogger.log(module, event, 'error', { error })` | `console.error()` |
| `frameworkLogger.log(module, event, 'warning', { warning })` | `console.warn()` |

**Why**: Console statements bleed through to OpenCode console and create noise. Framework logger is structured and filtered.

**Example**:
```typescript
// WRONG ❌
console.log("Starting process");

// CORRECT ✅
import { frameworkLogger } from "../core/framework-logger.js";
frameworkLogger.log("my-module", "process-start", "info", { message: "Starting process" });
```

Reflection Template Paths

StringRay uses **two reflection folders** for different purposes:

#### Option 1: Standard Reflections (`docs/reflections/`)
**When to use:** Single-session work, specific bug fixes, targeted implementations
- **Template:** `docs/reflections/TEMPLATE.md` (442 lines)
- **Naming:** `{topic}-reflection.md` or `{topic}-YYYY-MM-DD.md`
- **Length:** 1,000-5,000 lines
- **Format:** 11 structured sections (Executive Summary, Dichotomy, Counterfactual, etc.)

**Examples:**
- `docs/reflections/deployment-crisis-v12x-reflection.md`
- `docs/reflections/kernel-confidence-fix.md`

#### Option 2: Deep Reflections (`docs/reflections/deep/`)
**When to use:** Multi-session journeys, complex investigations, architectural transformations
- **Template:** `docs/reflections/deep/TEMPLATE.md` (NEW - 300 lines)
- **Naming:** `{topic}-journey-YYYY-MM-DD.md` or `DEEP_REFLECTION_{topic}.md`
- **Length:** 10,000+ lines
- **Format:** Narrative journey with session chronology, investigation narrative, technical deep dives

**Examples:**
- `docs/reflections/deep/kernel-journey-2026-03-09.md`
- `docs/reflections/deep/AGENTS-consumer-documentation-strategy-journey-2026-03-09.md`

#### Quick Decision Guide

| Scenario | Use |
|----------|------|
| Fixed a bug in one session | `docs/reflections/` |
| Investigated something complex over multiple days | `docs/reflections/deep/` |
| Single architectural change | `docs/reflections/` |
| System-wide transformation | `docs/reflections/deep/` |
| Quick learning/insight | `docs/reflections/` |
| Deep investigation with many discoveries | `docs/reflections/deep/` |

### Storyteller Skill (formerly @storyteller agent)

The storyteller is now a **skill** (not an agent) so it runs with full session context. Invoke it by asking for a reflection/narrative in your current session:

| Type | Description | Template Path | How to Invoke |
|------|-------------|---------------|---------------|
| `reflection` | Technical deep reflections on development process | `docs/reflections/TEMPLATE.md` | "write a reflection about X" |
| `saga` | Long-form technical saga spanning multiple sessions | `docs/reflections/deep/SAGA_TEMPLATE.md` | "write a saga about X" |
| `journey` | Investigation/learning journey | `docs/reflections/JOURNEY_TEMPLATE.md` | "write a journey about X" |
| `narrative` | Technical narrative - telling the story of code | `docs/reflections/NARRATIVE_TEMPLATE.md` | "write a narrative about X" |
| `deep reflection` | Extended narrative with emotional journey | `docs/reflections/deep/TEMPLATE.md` | "write a deep reflection about X" |

**Why a skill?** As an agent, @storyteller spawned fresh with zero context and wasted tokens reconstructing what just happened. As a skill, it uses the conversation you are already in -- the LLM knows exactly what occurred.

## Available Agents

| Agent | Purpose | Invoke |
|-------|---------|--------|
| `@enforcer` | Codex compliance & error prevention | `@enforcer analyze this code` |
| `@orchestrator` | Complex multi-step task coordination | `@orchestrator implement feature` |
| `@architect` | System design & technical decisions | `@architect design API` |
| `@security-auditor` | Vulnerability detection | `@security-auditor scan` |
| `@code-reviewer` | Quality assessment | `@code-reviewer review PR` |
| `@refactorer` | Technical debt elimination | `@refactorer optimize code` |
| `@testing-lead` | Testing strategy | `@testing-lead plan tests` |
| `@bug-triage-specialist` | Error investigation | `@bug-triage-specialist debug error` |
| `@researcher` | Codebase exploration | `@researcher find implementation` |


## Available Skills

StringRay ships with 30 framework skills and provides a registry of 10 curated community sources.

**Manage skills:**
```bash
npx strray-ai skill:install              # Show starter packs + available sources
npx strray-ai skill:install <name>       # Install from registry
npx strray-ai skill:registry list        # Show all registry sources
npx strray-ai antigravity status         # Show installed skills
```

**License files:** `licenses/skills/LICENSE.<source-name>`

## Complexity Routing

StringRay automatically routes tasks based on complexity:

- **Simple (≤15)**: Single agent
- **Moderate (≤25)**: Single agent with tools
- **Complex (≤50)**: Multi-agent coordination  
- **Enterprise (>50)**: Orchestrator-led team

## CLI Commands

```bash
npx strray-ai install       # Install and configure
npx strray-ai status       # Check configuration
npx strray-ai health        # Health check
npx strray-ai validate      # Validate installation
npx strray-ai capabilities # Show all features
npx strray-ai report        # Generate reports
npx strray-ai analytics    # Pattern analytics
npx strray-ai calibrate    # Calibrate complexity
npm run test:pipelines     # Pipeline integration tests
```

## Features.json Configuration

StringRay uses `.opencode/strray/features.json` for feature flags and settings:

### Location
- **Path**: `.opencode/strray/features.json`
- **Consumer Path**: When installed as npm package, loaded from `node_modules/strray-ai/.opencode/strray/features.json`

### Key Features
- `token_optimization` - Context token management
- `model_routing` - AI model routing
- `batch_operations` - File batch processing
- `multi_agent_orchestration` - Agent coordination
- `autonomous_reporting` - Automatic reporting
- `activity_logging` - Activity logging configuration
- `security` - Security settings
- `performance_monitoring` - Performance tracking

### Modifying Features
To modify features in consumer installations:
```bash
# View current features
cat .opencode/strray/features.json

# Set feature via CLI
npx strray-ai config set --feature token_optimization.enabled --value false
```

### .opencode/strray Directory

The `.opencode/strray/` directory contains core framework configuration:

| File | Purpose |
|------|---------|
| `codex.json` | Universal Development Codex (60 error prevention terms) |
| `features.json` | Feature flags and settings |
| `config.json` | Framework configuration |
| `agents_template.md` | Agent architecture templates |
| `routing-mappings.json` | Agent routing configurations |
| `workflow_state.json` | Runtime workflow state |

## Agent Discovery & Capabilities

### First-Time Agent Context

When agents are first spawned:
- **Zero Context**: Agents start with minimal initial context
- **Discovery Happens**: Agents discover available tools through MCP servers
- **State Builds**: Over time, agents build comprehensive knowledge graph

### Static vs Dynamic Discovery

**Static Discovery** (Immediate):
- Source: `.opencode/agents/` directory
- Speed: Fast - scans local directory
- Scope: Only locally configured agents

**Dynamic Discovery** (After Startup):
- Source: MCP Protocol via `mcp-client.ts`
- Process: Loads config → Connects to servers → Lists tools → Makes available
- Scope: Full agent capabilities with MCP server tools

### Access & Permissions Pipeline

**Load Priority**:
1. Development: `node_modules/strray-ai/dist/` (most current)
2. Consumer: Falls back to `dist/` directory
3. Configuration: `.opencode/strray/features.json`

**Spawn Authorization**:
- Only main orchestrator can spawn agents
- Subagents cannot spawn other agents
- Workers cannot spawn agents directly

## Activity Log & Reporting

### Activity Logging

**Location**: `.opencode/logs/` directory
- **File Format**: `strray-plugin-YYYY-MM-DD.log`
- **Enabled by**: `activity_logging` feature in features.json

### Report Generation

**CLI Command**:
```bash
# Generate daily report
npx strray-ai report --daily

# Generate performance report
npx strray-ai report --performance

# Generate compliance report
npx strray-ai report --compliance
```

**Report Types**:
- Daily reports: Agent invocations, task completions
- Performance reports: Response times, resource usage
- Compliance reports: Codex violations, agent performance

## Skill Scripts & Agent Registry

### Agent Registry

**Location**: `scripts/node/agent-registry.js`
- **Purpose**: Register new custom agents
- **Usage**: Add to `.opencode/agents/` and auto-discovered

### Custom Skills

**Adding Custom Agents**:
1. Create skill file in `.opencode/agents/`
2. Export handler function
3. Auto-available to agents

**Example**:
```javascript
// .opencode/agents/my-custom-skill.js
module.exports = async (context, tool) => {
  return { result: "Skill executed", data: {} };
};
```

## Codex

StringRay enforces Universal Development Codex (60 terms) for systematic error prevention. See [.opencode/strray/codex.json](https://github.com/htafolla/stringray/blob/master/.opencode/strray/codex.json) for full reference.

## Configuration Files Reference

StringRay uses multiple configuration files to control behavior:

### Main Configuration Files

| File | Purpose | Key Settings |
|------|---------|--------------|
| `.opencode/opencode.json` | Main framework config | mode, plugins, paths |
| `.opencode/strray/features.json` | Feature flags | enabled/disabled features |
| `.opencode/agents/` | Custom agent configs | agent-specific settings |
| `.opencode/strray/codex.json` | Codex terms | 60 error prevention rules |

### Configuration Hierarchy

```
1. .opencode/opencode.json           # Highest priority - project overrides
2. .opencode/strray/features.json    # Feature flags
3. node_modules/strray-ai/.opencode/ # Package defaults (lowest)
```

### Environment Variables

```bash
# Optional overrides
STRRAY_MODE=development              # or 'consumer'
STRRAY_LOG_LEVEL=info              # debug, info, warn, error
STRRAY_CONFIG_PATH=.opencode/      # Custom config directory
STRRAY_NO_TELEMETRY=1              # Disable analytics
```

## Integration Points

### Git Hooks Integration

StringRay integrates with Git hooks for automated validation:

```bash
# Install Git hooks
npx strray-ai install --hooks

# Hooks available:
# - pre-commit: TypeScript check, linting, Codex validation
# - post-commit: Activity logging, analytics
# - pre-push: Full validation suite
```

**Manual Hook Setup** (if not using --hooks):
```bash
# .git/hooks/pre-commit
#!/bin/bash
npx strray-ai validate --pre-commit

# .git/hooks/post-commit  
#!/bin/bash
npx strray-ai report --auto
```

### CI/CD Pipeline Integration

**GitHub Actions Example**:
```yaml
- name: StringRay Validation
  run: |
    npx strray-ai validate
    npx strray-ai report --ci
```

**GitLab CI Example**:
```yaml
strray-validate:
  script:
    - npx strray-ai validate
    - npx strray-ai report --ci
```

### MCP Server Configuration

MCP (Model Context Protocol) servers extend agent capabilities:

```bash
# List available MCP servers
npx strray-ai capabilities --mcp

# MCP server types:
# - knowledge-skills/     # Domain-specific skills
# - framework-help.server.ts # Framework utilities
# - orchestrator.server.ts  # Task orchestration
```

### Marketplace Plugin Installation

```bash
# Search for plugins
npx strray-ai marketplace search <keyword>

# Install plugin
npx strray-ai marketplace install <plugin-name>

# List installed plugins
npx strray-ai marketplace list
```

## Tuning & Optimization

### Complexity Calibration

StringRay uses complexity scoring to route tasks to appropriate agents:

```bash
# Calibrate complexity scoring
npx strray-ai calibrate

# View current complexity settings
cat .opencode/strray/features.json | jq '.complexity'
```

**Complexity Factors**:
- File count and size
- Import dependencies
- Test coverage percentage
- Code duplication
- Architectural patterns

### Performance Tuning

**Memory Management**:
```bash
# View memory settings
cat .opencode/strray/features.json | jq '.memory'

# Key settings:
# - memory_threshold_mb: Emergency cleanup trigger (default: 80MB)
# - gc_interval_ms: Garbage collection frequency
# - cache_size: Agent state cache limit
```

**Token Optimization**:
```bash
# Configure token limits
npx strray-ai config set --feature token_optimization.max_context_tokens --value 8000
npx strray-ai config set --feature token_optimization.compression_enabled --value true
```

### Agent Spawn Limits

Control how agents are spawned and coordinated:

```json
// In features.json
{
  "agent_spawn": {
    "max_concurrent": 8,
    "max_per_type": 3,
    "spawn_cooldown_ms": 500,
    "rate_limit_per_minute": 20
  }
}
```

## CLI Command Details

### Core Commands

| Command | Description | Common Use |
|---------|-------------|------------|
| `npx strray-ai install` | Install and configure framework | Initial setup |
| `npx strray-ai status` | Show current configuration status | Debug setup issues |
| `npx strray-ai health` | Run health check | Verify installation |
| `npx strray-ai validate` | Run full validation suite | Pre-commit validation |
| `npx strray-ai capabilities` | List all available features | Discover capabilities |
| `npx strray-ai calibrate` | Recalibrate complexity scoring | After major refactors |
| `npx strray-ai report` | Generate analytics reports | Review performance |
| `npx strray-ai analytics` | View pattern analytics | Understand agent behavior |
| `npx strray-ai config` | Manage configuration | Tune settings |

### Configuration Commands

```bash
# Get a specific config value
npx strray-ai config get --feature activity_logging.enabled

# Set a config value
npx strray-ai config set --feature token_optimization.enabled --value false

# Reset to defaults
npx strray-ai config reset

# Export current config
npx strray-ai config export > strray-config.json
```

### Report Commands

```bash
# Daily summary report
npx strray-ai report --daily

# Performance analysis
npx strray-ai report --performance

# Compliance report (Codex violations)
npx strray-ai report --compliance

# Session report
npx strray-ai report --session

# Generate CI-friendly report
npx strray-ai report --ci --output json
```

## Common Agent Workflows

### Invoking Agents

**Basic Invocation**:
```bash
# In code comment or prompt
@architect design a REST API for user management

@enforcer analyze this code for security issues

@testing-lead create tests for authentication module
```

**Chaining Agents**:
```
@orchestrator implement feature:user-authentication
  → Spawns @architect → @testing-lead → @code-reviewer
```

### Agent Selection Guide

| Task Type | Primary Agent | Supporting Agents |
|-----------|---------------|-------------------|
| New feature | @orchestrator | @architect, @testing-lead |
| Bug fix | @bug-triage-specialist | @enforcer, @code-reviewer |
| Refactor | @refactorer | @architect, @testing-lead |
| Security audit | @security-auditor | @enforcer |
| Code review | @code-reviewer | @enforcer |
| Research | @researcher | @architect |

### Session Management

**Start a Session**:
```bash
# Sessions are automatic - invoke agent to start
@orchestrator implement login feature
```

**View Active Sessions**:
```bash
# Active sessions shown in status
npx strray-ai status
```

**End a Session**:
```bash
# Sessions auto-end after inactivity timeout
# Or manually via:
npx strray-ai session end <session-id>
```

### Error Recovery

**Common Error Patterns**:

1. **Agent Spawn Failure**
   ```bash
   # Check spawn limits
   npx strray-ai status | grep -A5 "spawn"
   
   # Solution: Wait for cooldown or increase limit
   npx strray-ai config set --feature agent_spawn.max_concurrent --value 10
   ```

2. **Memory Exhaustion**
   ```bash
   # Check memory settings
   npx strray-ai health
   
   # Solution: Clear cache
   npx strray-ai session clear-cache
   ```

3. **Validation Failures**
   ```bash
   # Run detailed validation
   npx strray-ai validate --detailed
   
   # View specific failures
   npx strray-ai report --compliance --detailed
   ```

## Troubleshooting Guide

### Quick Diagnostics

```bash
# Full health check
npx strray-ai health

# Validate installation
npx strray-ai validate

# View recent activity
ls -la .opencode/logs/
cat .opencode/logs/strray-plugin-$(date +%Y-%m-%d).log | tail -50

# Check configuration
npx strray-ai status
```

### Common Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| Agents not spawning | Timeout on @invoke | Run `npx strray-ai health` |
| Validation failures | Pre-commit blocks | Run `npx strray-ai validate --fix` |
| Memory issues | Slow performance | `npx strray-ai session clear-cache` |
| Config not loading | Settings ignored | Check `.opencode/opencode.json` syntax |
| MCP servers unavailable | Tools missing | `npx strray-ai capabilities --mcp` |

### Getting Help

```bash
# Framework help
npx strray-ai help

# View capabilities
npx strray-ai capabilities

# Check version
npx strray-ai --version
```

## Framework Configuration Limits

### Consumer Environment Limitations

- **Features.json**: Automatically loaded from package, not project root
- **Codex Version**: Frozen at v1.7.5 in consumer mode (stable)
- **Plugin Behavior**: Reduced functionality in consumer mode:
  - No dynamic codex term enrichment
  - Fixed codex version
  - No MCP server discovery
  - No real-time tool discovery

### Development vs Consumer

| Aspect | Development | Consumer |
|--------|-----------|----------|
| Features | Full (latest) | Optimized (stable) |
| Codex | Latest terms | v1.7.5 fallback |
| Discovery | Dynamic (MCP) | Static only |
| Hot Reload | Yes | No |

## Documentation

- [Full Documentation](https://github.com/htafolla/stringray)
- [Configuration Guide](https://github.com/htafolla/stringray/blob/master/docs/CONFIGURATION.md)
- [Troubleshooting](https://github.com/htafolla/stringray/blob/master/docs/TROUBLESHOOTING.md)

---
**Version**: 1.22.60 | [GitHub](https://github.com/htafolla/stringray)
