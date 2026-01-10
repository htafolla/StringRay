# Plugin Loading Mechanism Documentation

## Overview

The StrRay Framework integrates with oh-my-opencode through a sophisticated plugin architecture that enables automatic multi-agent orchestration and codex enforcement.

## Plugin Loading Flow

### 1. oh-my-opencode Plugin Discovery

oh-my-opencode loads plugins through its internal plugin system. The framework scans for plugin files and loads them dynamically:

```typescript
// oh-my-opencode plugin loading (internal mechanism)
const pluginPath = ".opencode/plugin/strray-codex-injection.ts";
const pluginModule = await import(pluginPath);
const pluginInstance = pluginModule.default(input);
```

### 2. StrRay Plugin Structure

The `strray-codex-injection.ts` plugin exports a default function that returns a hooks object:

```typescript
export default async function strrayCodexPlugin(input: {
  client?: string;
  directory?: string;
  worktree?: string;
}) {
  // Plugin initialization logic
  return {
    "experimental.chat.system.transform": async (input, output) => {
      /* codex injection */
    },
    "tool.execute.before": async (input, output) => {
      /* enforcement + orchestration */
    },
    "tool.execute.after": async (input, output) => {
      /* test generation */
    },
    config: async (config) => {
      /* MCP server registration */
    },
  };
}
```

### 3. Hook Execution Lifecycle

#### System Prompt Injection (`experimental.chat.system.transform`)

- **When**: Before LLM receives system prompt
- **Purpose**: Inject Universal Development Codex v1.2.20 terms
- **Mechanism**: Loads codex from `.strray/agents_template.md` and `AGENTS.md`
- **Output**: Prepends formatted codex context to system messages

#### Pre-Execution Validation (`tool.execute.before`)

- **When**: Before tool execution (write, edit, multiedit)
- **Purpose**: Real-time codex compliance validation + automatic orchestration
- **Mechanism**:
  1. Runs Python validation script (`.opencode/scripts/validate-codex.py`)
  2. Analyzes task complexity using 6-metric algorithm
  3. Triggers multi-agent orchestration for complex tasks (>70 score)
- **Failure Mode**: Blocks execution with detailed violation reports

#### Post-Execution Automation (`tool.execute.after`)

- **When**: After successful tool execution
- **Purpose**: Automatic test generation for new source files
- **Mechanism**: Detects new `.ts/.tsx/.js/.jsx` files and calls test-architect MCP server

#### Configuration Setup (`config`)

- **When**: Plugin initialization
- **Purpose**: Register MCP servers and run framework bootstrap
- **Mechanism**:
  1. Registers 11 MCP servers (7 agent-specific + 4 knowledge skills)
  2. Executes `.opencode/init.sh` for framework initialization
  3. Returns MCP server configuration to oh-my-opencode

## Automatic Multi-Agent Orchestration

### Complexity Analysis Engine

Tasks are automatically analyzed using 6 metrics:

```typescript
interface ComplexityMetrics {
  fileCount: number; // Files affected (0-20 points)
  changeVolume: number; // Lines changed (0-25 points)
  operationType: string; // create|modify|refactor|analyze|debug|test (multiplier)
  dependencies: number; // Component dependencies (0-15 points)
  riskLevel: string; // low|medium|high|critical (multiplier)
  estimatedDuration: number; // Minutes (0-15 points)
}
```

### Delegation Thresholds

| Score Range | Strategy         | Agent Count | Trigger              |
| ----------- | ---------------- | ----------- | -------------------- |
| 0-25        | Single-agent     | 1           | Direct execution     |
| 26-50       | Single-agent     | 1           | Direct execution     |
| 51-95       | Multi-agent      | 2+          | Automatic delegation |
| 96-100      | Orchestrator-led | 3+          | Enterprise workflow  |

### Runtime Orchestration Flow

1. **Complexity Analysis**: Plugin hook calculates task complexity score
2. **Strategy Selection**: Determines single-agent vs multi-agent execution
3. **Agent Delegation**: Routes to appropriate specialized agents
4. **Parallel Execution**: Multiple agents work simultaneously
5. **Result Aggregation**: Combines outputs with conflict resolution
6. **Quality Validation**: Ensures all outputs meet codex standards

## Configuration Integration

### Dual Configuration System

**oh-my-opencode Configuration** (`.opencode/oh-my-opencode.json`):

- Agent definitions and model routing
- Framework settings and permissions
- oh-my-opencode-specific parameters

**StrRay Configuration** (`.strray/config.json`):

- Multi-agent orchestration settings
- Codex enforcement levels
- Performance tuning parameters

### Plugin Registration

Plugins are registered through oh-my-opencode's configuration system. The framework automatically discovers and loads plugins from the `.opencode/plugin/` directory.

## Error Handling & Recovery

### Plugin Failure Modes

1. **Codex Violations**: Block execution with detailed error reports
2. **Plugin Errors**: Log warnings but allow execution (graceful degradation)
3. **MCP Server Failures**: Fallback to direct agent execution
4. **Configuration Errors**: Use default settings with warnings

### Recovery Mechanisms

- **Automatic Retry**: Failed operations retry with exponential backoff
- **Fallback Strategies**: Alternative execution paths when primary fails
- **State Persistence**: Workflow state survives interruptions
- **Health Monitoring**: Continuous validation of plugin and agent health

## Performance Characteristics

### Execution Times

- **Plugin Load**: <100ms
- **Codex Injection**: <50ms
- **Complexity Analysis**: <10ms
- **Validation**: <200ms (includes Python script execution)

### Resource Usage

- **Memory**: <50MB baseline, <200MB under load
- **CPU**: Minimal overhead (<5% additional)
- **Network**: Only for MCP server communication

## Security Considerations

### Sandboxed Execution

- Plugins run in restricted Node.js environment
- File system access limited to project directory
- Network access controlled through configuration
- Dangerous modules blocked by default

### Input Validation

- All tool inputs validated before execution
- Codex compliance checked for code modifications
- MCP server calls validated for security

## Troubleshooting

### Common Issues

1. **Plugin Not Loading**: Check file exists at `.opencode/plugin/strray-codex-injection.ts`
2. **Codex Not Injecting**: Verify `.strray/agents_template.md` and `AGENTS.md` exist
3. **Validation Failing**: Check Python script at `.opencode/scripts/validate-codex.py`
4. **MCP Servers Down**: Verify server files in `.opencode/mcps/`

### Debug Logging

Enable detailed logging by setting environment variables:

```bash
STRRAY_DEBUG=true
STRRAY_LOG_LEVEL=debug
```

Logs are written to `.opencode/logs/strray-plugin-YYYY-MM-DD.log`

## Integration Testing

The plugin includes comprehensive integration tests that simulate the oh-my-opencode environment:

- **Mock Plugin Loading**: Tests plugin discovery and initialization
- **Hook Execution**: Validates all hook functions work correctly
- **Codex Injection**: Ensures codex terms are properly injected
- **Validation Logic**: Tests enforcement mechanisms
- **Error Handling**: Verifies graceful failure modes

## Future Enhancements

### Planned Features

- **Hot Reload**: Dynamic plugin updates without restart
- **Plugin Marketplace**: Curated third-party plugin ecosystem
- **Advanced Orchestration**: Machine learning-based task routing
- **Distributed Execution**: Cross-instance agent coordination

### Performance Optimizations

- **Caching**: Codex context and validation result caching
- **Parallel Processing**: Concurrent agent execution optimization
- **Memory Pooling**: Object reuse for reduced GC pressure
