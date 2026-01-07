# StrRay Extension for oh-my-opencode

## Overview

StrRay is a comprehensive extension framework for oh-my-opencode v2.12.0 that adds specialized AI agents and development automation capabilities. This document explains what StrRay adds to oh-my-opencode and how to leverage its enhanced features.

## What StrRay Adds to oh-my-opencode

### Core Enhancements

**8 Specialized AI Agents** (vs oh-my-opencode's standard agents):

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
   # Full mode (all 8 agents)
   bash .opencode/commands/mode-switch.md full

   # Lite mode (4 core agents)
   bash .opencode/commands/mode-switch.md lite
   ```

3. **Agent Interaction**:
   All StrRay agents are accessible through oh-my-opencode's standard interface:
   ```bash
   opencode architect "Design a user authentication system"
   opencode code-reviewer "Review this React component"
   ```

### Advanced Configuration

**Custom Agent Models**:

```json
// .opencode/oh-my-opencode.json
{
  "agents": {
    "architect": { "model": "opencode/grok-code" },
    "code-reviewer": { "model": "opencode/grok-code" }
  }
}
```

**Disabled Agents for Lite Mode**:

```json
{
  "disabled_agents": [
    "security-auditor",
    "refactorer",
    "test-architect",
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

## Architecture: StrRay + oh-my-opencode

```
oh-my-opencode v2.12.0
├── Core Plugin System
├── Agent Orchestration (Sisyphus)
├── Model Integration
└── StrRay Framework Extension
    ├── 8 Specialized AI Agents
    ├── Development Automation Hooks
    ├── Quality Validation
    └── Custom MCP Skills
```

## Migration from Standard oh-my-opencode

### For Existing oh-my-opencode Users

1. **Backup Current Configuration**:

   ```bash
   cp .opencode/oh-my-opencode.json .opencode/oh-my-opencode.backup.json
   ```

2. **Update to StrRay Configuration**:
   The `.opencode` directory already contains the integrated StrRay-oh-my-opencode framework. Your existing oh-my-opencode configuration will continue to work.

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

| Feature             | Standard oh-my-opencode | StrRay Extension                       |
| ------------------- | ----------------------- | -------------------------------------- |
| AI Agents           | Basic set               | 8 specialized agents                   |
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
jq '.disabled_agents' .opencode/oh-my-opencode.json
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
- **Compliance**: Refer to `framework/COMPLIANCE.md` for oh-my-opencode compatibility
- **Configuration**: Check `.opencode/README.md` for setup instructions
- **Agent Guidelines**: See `AGENTS_GUIDELINES.md` for proper agent usage

## Future Development

StrRay continues to evolve with oh-my-opencode, adding new specialized agents and enhanced automation capabilities. Stay updated with the latest features and improvements.

## Frequently Asked Questions

### What is StrRay's relationship to oh-my-opencode?

StrRay is implemented as a comprehensive extension within the oh-my-opencode ecosystem. oh-my-opencode provides the core plugin architecture and agent orchestration, while StrRay adds 8 specialized AI agents for development-focused tasks.

### Do I need to install oh-my-opencode separately?

No. The `.opencode` directory contains the complete integrated StrRay-oh-my-opencode framework. All oh-my-opencode components are included and configured automatically.

### Can I use StrRay without oh-my-opencode?

No. StrRay requires oh-my-opencode's plugin system and orchestration capabilities to function.

### What's the difference between StrRay Lite and Full?

Both use the same oh-my-opencode foundation but with different agent configurations:

- **Lite**: 4 core agents for essential development support
- **Full**: 8 specialized agents for comprehensive development capabilities

### How do I switch between lite and full modes?

Use the mode switching command:

```bash
bash .opencode/commands/mode-switch.md full  # All 8 agents
bash .opencode/commands/mode-switch.md lite  # 4 core agents
```

### What models does StrRay use?

All StrRay agents use `opencode/grok-code` by default, which provides excellent performance for development tasks while maintaining compatibility with oh-my-opencode's model system.

### How do I customize agent behavior?

Modify the agents configuration in `.opencode/oh-my-opencode.json`:

```json
{
  "agents": {
    "architect": { "model": "opencode/grok-code" },
    "code-reviewer": { "model": "opencode/grok-code" }
  }
}
```

### What if I encounter issues with StrRay?

1. Check framework initialization: `bash .opencode/init.sh`
2. Verify mode settings: `jq '.disabled_agents' .opencode/oh-my-opencode.json`
3. Review logs: `docs/REFACTORING_LOG.md`
4. Check compliance: `bash .opencode/commands/framework-compliance-audit.md`

---

_StrRay Extension v1.0.0 - Enhancing oh-my-opencode with systematic AI-assisted development capabilities._
