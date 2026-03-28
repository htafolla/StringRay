# StringRay Agents - Consumer Guide

Quick reference for **using** the StringRay AI orchestration framework in your projects.

## What is StringRay?

StringRay provides intelligent multi-agent orchestration with automatic delegation and Codex compliance validation. Agents operate via OpenCode plugin injection - no manual setup needed.

## Quick Start

```bash
# Install StringRay in your project
npx strray-ai install

# Start using agents with @agent-name syntax
@architect design a REST API for user management
```

That's it! StringRay handles the rest automatically.

## How StringRay Works

### Basic Operation

1. **Install**: Run `npx strray-ai install` to configure agents in your project
2. **Invoke**: Use `@agent-name` syntax in prompts or code comments (e.g., `@architect design this API`)
3. **Automatic Routing**: StringRay automatically routes tasks to the appropriate agent based on complexity
4. **Agent Modes**: Agents can be `primary` (main coordinator) or `subagent` (specialized helper)

### What Happens Behind the Scenes

When you invoke an agent:
- StringRay analyzes your request complexity
- Routes to the most appropriate agent
- The agent completes the task
- Results are delivered back to you

You don't need to manage agents manually - just use the `@agent-name` syntax and StringRay handles everything.

## Available Agents

| Agent | Purpose | Example Invocation |
|-------|---------|-------------------|
| `@enforcer` | Codex compliance & error prevention | `@enforcer analyze this code` |
| `@orchestrator` | Complex multi-step task coordination | `@orchestrator implement feature` |
| `@architect` | System design & technical decisions | `@architect design API` |
| `@security-auditor` | Vulnerability detection | `@security-auditor scan` |
| `@code-reviewer` | Quality assessment | `@code-reviewer review PR` |
| `@refactorer` | Technical debt elimination | `@refactorer optimize code` |
| `@testing-lead` | Testing strategy | `@testing-lead plan tests` |
| `@bug-triage-specialist` | Error investigation | `@bug-triage-specialist debug error` |
| `@storyteller` | Narrative deep reflections | `@storyteller write a journey` |
| `@researcher` | Codebase exploration | `@researcher find implementation` |

### Storyteller Agent

The `@storyteller` agent supports multiple story types:

| Type | Description | Invoke |
|------|-------------|--------|
| `reflection` | Technical deep reflections on development process | `@storyteller write a reflection about X` |
| `saga` | Long-form technical saga spanning multiple sessions | `@storyteller write a saga about X` |
| `journey` | Investigation/learning journey | `@storyteller write a journey about X` |
| `narrative` | Technical narrative - telling the story of code | `@storyteller write a narrative about X` |

**Example:**
```
@storyteller write a reflection about fixing the memory leak
```

## Complexity Routing

StringRay automatically routes tasks based on complexity:

- **Simple (≤20)**: Single agent handles it directly
- **Moderate (21-35)**: Single agent with additional tools
- **Complex (36-75)**: Multi-agent coordination
- **Enterprise (>75)**: Orchestrator-led team

You don't need to think about this - StringRay decides automatically based on your request.

## CLI Commands

```bash
# Installation & Setup
npx strray-ai install         # Install and configure
npx strray-ai status         # Check configuration
npx strray-ai health          # Run health check
npx strray-ai validate        # Validate installation

# Feature Discovery
npx strray-ai capabilities   # Show all available features
npx strray-ai calibrate      # Calibrate complexity scoring

# Reporting & Analytics
npx strray-ai report          # Generate reports
npx strray-ai analytics      # View pattern analytics
```

## Configuration

### Basic Configuration

StringRay works out of the box, but you can customize it via `.opencode/strray/features.json`:

```json
{
  "token_optimization": {
    "enabled": true,
    "max_context_tokens": 8000
  },
  "agent_spawn": {
    "max_concurrent": 8,
    "max_per_type": 3
  }
}
```

### Key Configuration Files

| File | Purpose | What You Can Change |
|------|---------|---------------------|
| `.opencode/opencode.json` | Main framework config | mode, plugins, paths |
| `.opencode/strray/features.json` | Feature flags | Enable/disable features |
| `.opencode/agents/` | Custom agent configs | Add your own agents |

### Environment Variables

```bash
# Optional overrides
STRRAY_MODE=development        # or 'consumer'
STRRAY_LOG_LEVEL=info          # debug, info, warn, error
STRRAY_NO_TELEMETRY=1          # Disable analytics
```

### Modifying Features

```bash
# View current features
cat .opencode/strray/features.json

# Set feature via CLI
npx strray-ai config set --feature token_optimization.enabled --value false

# Get a specific config value
npx strray-ai config get --feature activity_logging.enabled

# Export current config
npx strray-ai config export > strray-config.json
```

## Adding Custom Agents

You can create your own agents for specialized tasks:

### Step 1: Create Agent File

Create a file in `.opencode/agents/`:

```javascript
// .opencode/agents/my-custom-agent.js
module.exports = {
  name: 'my-custom-agent',
  description: 'My custom agent description',
  handler: async (context, args) => {
    // Your agent logic here
    return { result: "Task completed", data: {} };
  }
};
```

### Step 2: Use Your Agent

Once created, use it immediately:

```
@my-custom-agent do something useful
```

The agent is auto-discovered - no registration needed!

## Integration Points

### Git Hooks Integration

```bash
# Install Git hooks
npx strray-ai install --hooks

# Available hooks:
# - pre-commit: TypeScript check, linting, Codex validation
# - post-commit: Activity logging, analytics
# - pre-push: Full validation suite
```

### CI/CD Pipeline Integration

**GitHub Actions:**
```yaml
- name: StringRay Validation
  run: |
    npx strray-ai validate
    npx strray-ai report --ci
```

**GitLab CI:**
```yaml
strray-validate:
  script:
    - npx strray-ai validate
    - npx strray-ai report --ci
```

## Common Workflows

### Invoking Agents

**Basic Usage:**
```bash
# In code comment or prompt
@architect design a REST API for user management

@enforcer analyze this code for security issues

@testing-lead create tests for authentication module
```

**Complex Tasks:**
```
@orchestrator implement feature:user-authentication
  → Automatically spawns @architect → @testing-lead → @code-reviewer
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

## Activity Logging & Reporting

### Activity Logging

Logs are stored in `.opencode/logs/strray-plugin-YYYY-MM-DD.log`

Enable/disable via `features.json`:
```json
{
  "activity_logging": {
    "enabled": true
  }
}
```

### Report Generation

```bash
# Daily summary report
npx strray-ai report --daily

# Performance analysis
npx strray-ai report --performance

# Compliance report (Codex violations)
npx strray-ai report --compliance

# CI-friendly report
npx strray-ai report --ci --output json
```

## Troubleshooting

### Quick Diagnostics

```bash
# Full health check
npx strray-ai health

# Validate installation
npx strray-ai validate

# Check configuration
npx strray-ai status

# View recent activity
cat .opencode/logs/strray-plugin-$(date +%Y-%m-%d).log | tail -50
```

### Common Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| Agents not spawning | Timeout on @invoke | Run `npx strray-ai health` |
| Validation failures | Pre-commit blocks | Run `npx strray-ai validate --fix` |
| Memory issues | Slow performance | `npx strray-ai session clear-cache` |
| Config not loading | Settings ignored | Check `.opencode/opencode.json` syntax |

### Getting Help

```bash
# Framework help
npx strray-ai help

# View capabilities
npx strray-ai capabilities

# Check version
npx strray-ai --version
```

---

## Migration Guide (v1.7.8)

**Good news: No migration needed!** ✨

StringRay v1.7.8 maintains **100% backward compatibility**. All existing code continues to work exactly as before.

### What Stayed the Same

- ✅ `@agent-name` syntax - unchanged
- ✅ All CLI commands - work exactly as before
- ✅ Configuration files - same format and location
- ✅ All agents - same names and capabilities
- ✅ Custom agents - same creation process
- ✅ Public APIs - unchanged

### What Improved (Behind the Scenes)

The refactoring improved internal architecture without affecting the public interface:

- **Performance**: Faster agent spawning and task routing
- **Maintainability**: Better code organization for future improvements
- **Reliability**: More robust error handling
- **Scalability**: Better handling of complex, multi-agent workflows

### Do I Need to Change Anything?

| If You're Using... | Action Needed |
|-------------------|---------------|
| `@agent-name` syntax | ✅ No changes needed |
| CLI commands (`npx strray-ai ...`) | ✅ No changes needed |
| Configuration files | ✅ No changes needed |
| Custom agents | ✅ No changes needed |
| Framework as-is | ✅ No changes needed |

### Internal vs Public APIs

**Public APIs** (you use these - unchanged):
- `@agent-name` invocation syntax
- CLI commands
- Configuration file formats
- Agent registration

**Internal APIs** (changed, but you don't use them directly):
- Internal agent coordination
- Framework boot process
- MCP server management

### Upgrading

```bash
# Simply update to latest version
npm update strray-ai

# Or reinstall
npm install strray-ai@latest

# Verify installation
npx strray-ai health
```

---

## Consumer FAQ

### General Questions

**Q: Do I need to change my code after the refactoring?**
A: **No!** All public APIs remain unchanged. Your existing `@agent-name` invocations, CLI commands, and configuration files work exactly as before.

**Q: What actually changed in the refactoring?**
A: Only internal implementation details. The public interface you use (@agent syntax, CLI commands, config files) is 100% backward compatible.

**Q: What improvements will I see?**
A: Faster agent spawning, better error handling, and more reliable multi-agent coordination - all behind the scenes.

**Q: Are there any breaking changes?**
A: **No.** This is a zero-breaking-change release.

### Using Agents

**Q: How do I invoke an agent?**
A: Use `@agent-name` syntax in your prompts or code comments:
```
@architect design an API for user authentication
```

**Q: Can I create my own agents?**
A: Yes! Create a file in `.opencode/agents/` and it will be auto-discovered. See [Adding Custom Agents](#adding-custom-agents) section.

**Q: What if an agent doesn't exist?**
A: StringRay will tell you and suggest available agents. Run `npx strray-ai capabilities` to see all available agents.

**Q: Can agents call other agents?**
A: The orchestrator agent can spawn other agents for complex tasks. You don't need to manage this - just use `@orchestrator` for complex workflows.

### Configuration

**Q: Where do I configure StringRay?**
A: Main configuration is in `.opencode/strray/features.json` and `.opencode/opencode.json`.

**Q: How do I enable/disable features?**
A: Use the CLI: `npx strray-ai config set --feature FEATURE_NAME.enabled --value true/false`

**Q: Can I use environment variables?**
A: Yes! See [Environment Variables](#environment-variables) section for available options.

### Troubleshooting

**Q: Agents aren't responding. What should I do?**
A: Run `npx strray-ai health` to check the framework status. Common fixes:
- Check if StringRay is installed: `npx strray-ai --version`
- Validate configuration: `npx strray-ai validate`
- Check logs: `cat .opencode/logs/strray-plugin-$(date +%Y-%m-%d).log`

**Q: How do I update StringRay?**
A: `npm update strray-ai` or `npm install strray-ai@latest`

**Q: Where can I get help?**
A: Run `npx strray-ai help` or check the [troubleshooting section](#troubleshooting).

### Advanced Usage

**Q: Can I use StringRay in CI/CD pipelines?**
A: Yes! See [CI/CD Pipeline Integration](#cicd-pipeline-integration) section.

**Q: How do I add custom validation rules?**
A: You can extend the Codex or create custom agents. See [Adding Custom Agents](#adding-custom-agents).

**Q: Can I disable telemetry?**
A: Yes, set `STRRAY_NO_TELEMETRY=1` environment variable.

---

## Additional Resources

- [Full Documentation](https://github.com/htafolla/stringray)
- [Configuration Guide](https://github.com/htafolla/stringray/blob/master/docs/CONFIGURATION.md)
- [Troubleshooting](https://github.com/htafolla/stringray/blob/master/docs/TROUBLESHOOTING.md)

---

**Version**: 1.7.8 | [GitHub](https://github.com/htafolla/stringray)
