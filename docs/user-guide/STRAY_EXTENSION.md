# StrRay Extension for OpenCode

## Overview

StrRay is a comprehensive extension framework for that adds specialized AI agents and development automation capabilities. This document explains what StrRay adds to OpenCode and how to leverage its enhanced features.

## What StrRay Adds to OpenCode

### Core Enhancements

**8 Specialized AI Agents** (vs OpenCode's standard agents):

- **Enforcer**: Compliance monitoring and automation orchestration
- **Architect**: Design review and architecture validation
- **Orchestrator**: Task coordination and multi-agent workflow management
- **Bug Triage Specialist**: Error analysis and root cause identification
- **Code Reviewer**: Code quality assessment and best practice validation
- **Security Auditor**: Vulnerability detection and threat analysis
- **Refactorer**: Code modernization and debt reduction
- **Test Architect**: Test strategy design and coverage optimization

### Advanced Features

**Development Automation**:

- Pre-commit and post-commit hooks for automated code quality checks
- Integration with Git workflows for continuous code validation
- Automated error prevention and compliance monitoring

**Quality Assurance**:

- Systematic error prevention using Universal Development Codex principles
- Multi-layer validation (syntax, logic, architecture, security)
- Comprehensive testing strategies with AI-assisted test generation

**Performance Optimization**:

- Bundle size monitoring and optimization recommendations
- Memory usage tracking and leak prevention
- Build time analysis and caching strategies

## How to Use StrRay Features

### Basic Usage

1. **Framework Initialization**:

   ```bash
   bash .opencode/init.sh
   ```

2. **Mode Selection**:

   ```bash
   # Full mode (all N agents)
   bash .opencode/commands/mode-switch.md full

   # Lite mode (4 core agents)
   bash .opencode/commands/mode-switch.md lite
   ```

3. **Agent Interaction**:
   All StrRay agents are accessible through OpenCode's standard interface:
   ```bash
   opencode architect "Design a user authentication system"
   opencode code-reviewer "Review this React component"
   ```

### Advanced Configuration

**Custom Agent Models**:

```json
// .opencode/OpenCode.json
{
  "agents": {
    "architect": { "model": "openrouter/xai-grok-2-1212-fast-1" },
    "code-reviewer": { "model": "openrouter/xai-grok-2-1212-fast-1" }
  }
}
```

**Disabled Agents for Lite Mode**:

```json
{
  "disabled_agents": [
    "security-auditor",
    "refactorer",
    "testing-lead",
    "bug-triage-specialist"
  ]
}
```

### Integration Examples

**Pre-commit Hooks**:

```bash
# Automatic code quality checks
git commit -m "feat: add user authentication"
# StrRay enforcer validates compliance automatically
```

**CI/CD Integration**:

```yaml
# .github/workflows/ci.yml
- name: StrRay Code Quality Check
  run: bash .opencode/commands/framework-compliance-audit.md
```

## Architecture: StrRay + OpenCode

```

├── Core Plugin System
├── Agent Orchestration (Sisyphus)
├── Model Integration
└── StrRay Framework Extension
    ├── 8 Specialized AI Agents
    ├── Development Automation Hooks
    ├── Quality Validation
    └── Custom MCP Skills
```

## Migration from Standard OpenCode

### For Existing OpenCode Users

1. **Backup Current Configuration**:

   ```bash
   cp .opencode/OpenCode.json .opencode/OpenCode.backup.json
   ```

2. **Update to StrRay Configuration**:
   The `.opencode` directory already contains the integrated StrRay-OpenCode framework. Your existing OpenCode configuration will continue to work.

3. **Enable StrRay Features**:

   ```bash
   bash .opencode/init.sh
   ```

4. **Access Enhanced Agents**:
   ```bash
   opencode architect "Design a new feature"
   opencode code-reviewer "Review pull request"
   ```

### Feature Comparison

| Feature             | Standard OpenCode | StrRay Extension                       |
| ------------------- | ----------------------- | -------------------------------------- |
| AI Agents           | Basic set               | 25 specialized agents                   |
| Code Quality        | Standard checks         | Universal Development Codex compliance |
| Automation          | Basic hooks             | Comprehensive development workflow     |
| Error Prevention    | ~70%                    | ~90%                                   |
| Architecture Review | Limited                 | Comprehensive design validation        |

## Benefits of StrRay Extension

### For Individual Developers

- **Higher Code Quality**: Systematic error prevention and compliance checking
- **Faster Development**: Automated code reviews and refactoring suggestions
- **Learning**: Exposure to industry best practices and design patterns

### For Teams

- **Consistency**: Standardized code quality and architecture decisions
- **Reduced Bugs**: Proactive error detection and prevention
- **Documentation**: Automatic code documentation and API generation

### For Organizations

- **Scalability**: Framework grows with team size and complexity
- **Compliance**: Meets enterprise development standards
- **ROI**: Reduced debugging time and improved code maintainability

## Troubleshooting

### Common Issues

**Agents Not Loading**:

```bash
# Check mode configuration
bash .opencode/init.sh
# Verify disabled_agents array
jq '.disabled_agents' .opencode/OpenCode.json
```

**Model Configuration**:

```bash
# Ensure grok-code model is available
opencode --help | grep grok
```

**Performance Issues**:

```bash
# Switch to lite mode for better performance
bash .opencode/commands/mode-switch.md lite
```

## Support and Resources

- **Documentation**: See `framework/README.md` for detailed framework information
- **Compliance**: Refer to `framework/COMPLIANCE.md` for OpenCode compatibility
- **Agent Guidelines**: See `../AGENTS.md` for proper agent usage

## Future Development

StrRay continues to evolve with OpenCode, adding new specialized agents and enhanced automation capabilities. Stay updated with the latest features and improvements.

## Frequently Asked Questions

### What is StrRay's relationship to OpenCode?

StrRay is implemented as a comprehensive extension within the OpenCode ecosystem. OpenCode provides the core plugin architecture and agent orchestration, while StrRay adds 8 specialized AI agents for development-focused tasks.

### Do I need to install OpenCode separately?

No. The `.opencode` directory contains the complete integrated StrRay-OpenCode framework. All OpenCode components are included and configured automatically.

### Can I use StrRay without OpenCode?

No. StrRay requires OpenCode's plugin system and orchestration capabilities to function.

### What's the difference between StrRay Lite and Full?

Both use the same OpenCode foundation but with different agent configurations:

- **Lite**: 4 core agents for essential development support
- **Full**: 25 specialized agents for comprehensive development capabilities

### How do I switch between lite and full modes?

Use the mode switching command:

```bash
bash .opencode/commands/mode-switch.md full  # All N agents
bash .opencode/commands/mode-switch.md lite  # 4 core agents
```

### What models does StrRay use?

All StrRay agents use `openrouter/xai-grok-2-1212-fast-1` by default, which provides excellent performance for development tasks while maintaining compatibility with OpenCode's model system.

### How do I customize agent behavior?

Modify the agents configuration in `.opencode/OpenCode.json`:

```json
{
  "agents": {
    "architect": { "model": "openrouter/xai-grok-2-1212-fast-1" },
    "code-reviewer": { "model": "openrouter/xai-grok-2-1212-fast-1" }
  }
}
```

### What if I encounter issues with StrRay?

1. Check framework initialization: `bash .opencode/init.sh`
2. Verify mode settings: `jq '.disabled_agents' .opencode/OpenCode.json`
3. Review logs: `logs/agents/refactoring-log.md`
4. Check compliance: `bash .opencode/commands/framework-compliance-audit.md`

---

_StrRay AI  - Enhancing OpenCode with systematic AI-assisted development capabilities._
