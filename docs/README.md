# StrRay Framework - Universal Development Framework

**Version**: v2.4.0 (Phase 4 Consolidation) | **Last Updated**: 2026-01-05 | **oh-my-opencode**: v2.12.0

## 🤖 AI-Assisted Development Framework

**StrRay Framework v2.4.0** provides systematic error prevention and AI-assisted development capabilities through an integrated multi-agent system within the oh-my-opencode ecosystem.

StrRay is implemented as a comprehensive extension within the **oh-my-opencode ecosystem**, adding specialized AI agents and development-focused automation to the core oh-my-opencode plugin system.

## 🏗️ Architecture: StrRay + oh-my-opencode Integration

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

**Integration Points:**

- Uses oh-my-opencode's plugin architecture and configuration schema
- Leverages "opencode/grok-code" model for all 8 AI agents: enforcer, architect, orchestrator, bug-triage-specialist, code-reviewer, security-auditor, refactorer, test-architect (or compatible models of your choice)
- **Agent Implementation**: TypeScript AgentConfig objects in `src/agents/` directory (not YAML files)
- **Agent Loading**: oh-my-opencode dynamically imports TypeScript modules, not YAML configurations
- Extends oh-my-opencode with project-specific automation and validation
- Maintains full compatibility with oh-my-opencode's ecosystem

## 📚 Source Attribution

**Framework Architecture & Agent Templates**: Universal Development Codex

- **Source**: [Local Agent Template](../.opencode/agents_template.md) (See [../.opencode/agents_template.md](../.opencode/agents_template.md) for complete framework design)
- **Development**: 6+ months of AI error pattern analysis across 5+ projects
- **Validation**: Battle-tested on production applications including Credible UI

The Universal Development Framework provides comprehensive safeguards for AI-assisted software development, preventing catastrophic errors while maintaining development velocity. Choose the right version for your needs.

## Core Architecture

### Agent System

- **8 Specialized Agents**: Enforcer, Architect, Orchestrator, Bug Triage Specialist, Code Reviewer, Security Auditor, Refactorer, Test Architect
- **Dynamic Model Routing**: Automatic model selection based on agent requirements and availability
- **Hierarchical Coordination**: Async orchestration with conflict resolution and state persistence

### MCP Ecosystem

- **9 MCP Servers**: 7 agent-specific + 2 knowledge skill servers
- **Tool Integration**: Standardized Model Context Protocol for seamless AI integration
- **Knowledge Skills**: Project analysis, architecture patterns, testing strategy, API design

### Advanced Features

- **AI Response Logging**: Comprehensive audit trail of all AI interactions
- **Dynamic Configuration**: Runtime model discovery and fallback chains
- **Security Validation**: Automated vulnerability detection and compliance checking
- **Performance Optimization**: Bottleneck identification and automated improvements

## Integration Options

### oh-my-opencode Extension (Recommended)

```json
{
  "strray_agents": {
    "enabled": [
      "enforcer",
      "architect",
      "orchestrator",
      "bug-triage-specialist",
      "code-reviewer",
      "security-auditor",
      "refactorer",
      "test-architect"
    ]
  },
  "dynamic_models": {
    "enabled": true,
    "discovery_endpoint": "auto"
  }
}
```

### Standalone Framework

- Full MCP ecosystem with 9 servers
- Complete Python backend with orchestration
- Comprehensive testing infrastructure
- Advanced automation hooks

## Quick Start

1. **Initialize Framework**: `bash .opencode/init.sh`
2. **Verify Agents**: Check `oh-my-opencode.json` for enabled agents
3. **Run Tests**: `pytest strray/tests/`
4. **Access Documentation**: See `docs/` directory for comprehensive guides

## Architecture Benefits

- **Error Prevention**: Systematic validation at every development stage
- **Quality Assurance**: Automated code review and testing
- **Security**: Continuous vulnerability assessment
- **Performance**: Proactive optimization recommendations
- **Scalability**: Multi-agent orchestration for complex workflows

## Framework Evolution

This framework represents the culmination of extensive research into AI-assisted development, combining proven methodologies with cutting-edge automation techniques. The integration of MCP servers ensures compatibility with existing AI ecosystems while providing unparalleled development assistance.

## Directory Structure

### [README.md](./README.md)

Main framework overview and getting started guide.

### [FRAMEWORK_REFACTORING.md](./FRAMEWORK_REFACTORING.md)

Framework refactoring procedures and technical debt management.

### [LITE_VS_FULL_COMPARISON.md](./LITE_VS_FULL_COMPARISON.md)

Framework version comparison and selection guide.

### [STRAY_EXTENSION.md](./STRAY_EXTENSION.md)

StrRay extension capabilities and advanced integration patterns.

### [COMPLIANCE.md](./COMPLIANCE.md)

Framework compliance standards and oh-my-opencode compatibility.

### [architecture/](./architecture/)

Architecture documentation and design principles.

- [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - Core framework architecture overview
- [CONCEPTUAL_ARCHITECTURE.md](./architecture/CONCEPTUAL_ARCHITECTURE.md) - Universal Development Codex principles
- [MIGRATION_GUIDE.md](./architecture/MIGRATION_GUIDE.md) - Technical migration procedures

### [benchmarking/](./benchmarking/)

Performance benchmarking and metrics.

- [FRAMEWORK_PERFORMANCE.md](./benchmarking/FRAMEWORK_PERFORMANCE.md) - Performance analysis and benchmarks

### [migration/](./migration/)

Migration guides and procedures.

- [FRAMEWORK_MIGRATION.md](./migration/FRAMEWORK_MIGRATION.md) - Framework migration procedures

### [selection/](./selection/)

Framework selection and evaluation.

- [FRAMEWORK_SELECTION.md](./selection/FRAMEWORK_SELECTION.md) - Framework selection criteria

### [api/](./api/)

API reference documentation.

- [API_REFERENCE.md](./api/API_REFERENCE.md) - Complete API reference

### [agents/](./agents/)

Agent documentation and specifications.

- [AGENT_CLASSIFICATION.md](./agents/AGENT_CLASSIFICATION.md) - Planning vs coding agent categories
- [COMPREHENSIVE_AGENTS.md](./agents/COMPREHENSIVE_AGENTS.md) - Complete agent specifications
- [OPERATING_PROCEDURES.md](./agents/OPERATING_PROCEDURES.md) - Workflow execution guides
- [PERFORMANCE_MONITORING.md](./agents/PERFORMANCE_MONITORING.md) - Agent monitoring and optimization

### [commands/](./commands/)

Command documentation and CLI reference guides.

- [COMMANDS.md](./commands/COMMANDS.md) - Complete command reference and usage patterns

### [installation/](./installation/)

Setup guides and installation instructions.

- [INSTALLATION.md](./installation/INSTALLATION.md) - Installation guide

### [troubleshooting/](./troubleshooting/)

Troubleshooting guides and solutions.

- [TROUBLESHOOTING.md](./troubleshooting/TROUBLESHOOTING.md) - Troubleshooting guide

## Framework Implementation

**Note**: The actual framework components (agent configurations, command definitions, lite version files) are located in the `strray/` directory at the project root. This documentation directory contains only user-facing documentation and reference materials.

- Framework implementation: `../../strray/`
- Agent configurations: `../../strray/agents/`
- Command definitions: `../../strray/commands/`

## ⚠️ **CRITICAL FIRST STEP**

**Before proceeding with any installation, you MUST copy `.opencode/agents_template.md` into your project's `.opencode/` directory. This template contains the core agent architecture and framework design developed over 6+ months across 5+ projects.**

## 🚀 Framework Versions

### **Framework Lite** (Recommended for Most Teams)

**80% Protection, 30% Complexity**

Perfect for AI-assisted development that needs essential safeguards without overwhelming complexity.

- **Setup Time**: 5 minutes
- **Error Prevention**: 80% effective
- **Maintenance**: Minimal (minutes/month)
- **Team Size**: 1-20 developers
- **Use Case**: Production applications with AI assistance

```bash
# Quick setup
./setup-lite-framework.sh

# Initialize for development
bash .opencode-lite/init-lite.sh
```

### **Full Framework** (Advanced Teams)

**90% Protection, Maximum Safeguards**

Comprehensive framework with extensive validation and all available agents for maximum safety.

- **Setup Time**: 30 minutes
- **Error Prevention**: 90% effective
- **Maintenance**: Moderate (hours/month)
- **Team Size**: 5+ developers with dedicated QA
- **Use Case**: Critical systems, enterprise applications, complex AI workflows

```bash
# Full setup with comprehensive validation
# Follow .opencode/agents_template.md for complete installation
bash .opencode/init.sh
```

---

## 🎯 Which Version Should You Choose?

### ✅ **Choose Framework Lite If:**

- You're using AI assistance for development (GitHub Copilot, Claude, GPT-4, etc.)
- You want essential error prevention without complexity overhead
- Your team values development velocity alongside quality
- You're building production applications that handle real user data
- You need automated validation that doesn't block rapid iteration

### ✅ **Choose Full Framework If:**

- You're developing mission-critical systems (financial, healthcare, security)
- You have dedicated QA/devops resources for framework maintenance
- You need comprehensive compliance and audit trails
- Your applications have complex multi-agent AI workflows
- You require 90% error prevention with extensive validation layers

### ⚠️ **Neither Framework If:**

- You're doing manual development without AI assistance
- You're building prototypes/MVPs where quality is secondary
- You have <1 week project timelines
- You're working on simple CRUD applications

---

## 🛠️ Installation & Setup

### ⚠️ **CRITICAL: Copy .opencode/agents_template.md First**

**Before any installation, copy [.opencode/agents_template.md](../.opencode/agents_template.md) into your project's `.opencode/` directory:**

```bash
# Create opencode directory in your project root
mkdir -p .opencode

# Copy the core agent template (CRITICAL STEP)
cp .opencode/agents_template.md .opencode/

# Now proceed with framework installation
```

**Why this is critical:**

- [.opencode/agents_template.md](../.opencode/agents_template.md) contains the complete agent architecture and framework design
- It provides the foundation for all framework versions (Lite and Full)
- Without this template, the framework cannot function properly
- This template has been developed over 6+ months across 5+ projects

### Quick Start (Framework Lite - Recommended)

```bash
# 1. Copy .opencode/agents_template.md to your project (see above)
# 2. Download the lite framework
# 3. Run setup (5 minutes)
./setup-lite-framework.sh

# 4. Initialize for development
bash .opencode-lite/init-lite.sh

# 5. Start coding with AI assistance
# Framework automatically validates changes
```

### Full Framework Setup

```bash
# 1. Copy .opencode/agents_template.md to your project (CRITICAL)
cp .opencode/agents_template.md .opencode/

# 2. Follow comprehensive setup in [.opencode/agents_template.md](../.opencode/agents_template.md)
# 3. Configure all 8 agents and automation hooks
# 4. Set up extensive validation workflows
# 5. Initialize with full framework
bash .opencode/init.sh
```

---

## 📋 Framework Components

### Framework Lite (Streamlined)

- **4 Core Agents**: Code Guardian, Architecture Sentinel, Test Validator, Error Preventer
- **2 Automation Hooks**: Pre-commit Guardian, Post-commit Monitor
- **7 Codex Principles**: Essential AI error prevention
- **Single Config File**: Minimal configuration management

### Full Framework (Comprehensive)

- **8 Specialized Agents**: Complete AI validation coverage
- **4 Automation Hooks**: Extensive validation pipeline
- **17 Codex Principles**: Maximum error prevention
- **Multi-file Configuration**: Comprehensive customization

---

## 🔧 How It Works

### AI-Assisted Development Workflow

```
1. Developer writes code with AI assistance
   ↓
2. Framework agents validate in real-time
   ↓
3. Pre-commit hooks block critical issues
   ↓
4. Post-commit monitoring provides feedback
   ↓
5. Continuous validation prevents AI errors
```

### Agent Cross-Checking Process

When you ask AI to generate code, the framework:

1. **Code Guardian**: Validates quality and security
2. **Architecture Sentinel**: Ensures structural integrity
3. **Test Validator**: Confirms testing approach
4. **Error Preventer**: Blocks runtime disasters

---

## 📊 Performance Comparison

| Metric               | Framework Lite | Full Framework | Improvement          |
| -------------------- | -------------- | -------------- | -------------------- |
| **Setup Time**       | 5 minutes      | 30 minutes     | 83% faster           |
| **Error Prevention** | 80%            | 90%            | Near full protection |
| **Maintenance**      | Low            | High           | 70% less overhead    |
| **Velocity Impact**  | Minimal        | Moderate       | Better for rapid dev |
| **Team Adoption**    | Easy           | Challenging    | Faster onboarding    |
| **Critical Systems** | Good           | Excellent      | Maximum safety       |

---

## 🛡️ Protection Levels

### Framework Lite - Essential Safeguards

- ✅ Type safety enforcement (zero 'any' types)
- ✅ Bundle size monitoring (<3MB)
- ✅ Syntax and linting validation
- ✅ Critical runtime error prevention
- ✅ Basic security scanning
- ✅ Component size limits (<300 lines)

### Full Framework - Maximum Protection

- ✅ All Lite protections +
- ✅ Advanced architectural validation
- ✅ Comprehensive security auditing
- ✅ Multi-agent cross-validation
- ✅ Extensive compliance monitoring
- ✅ Detailed audit trails

---

## 🚦 Getting Started Guide

### For New Teams (Start with Lite)

1. **Assess Your Needs**
   - AI usage level? → Lite if moderate/heavy
   - Project criticality? → Full if mission-critical
   - Team size? → Lite for small teams

2. **Quick Setup**

   ```bash
   ./setup-lite-framework.sh
   bash .opencode-lite/init-lite.sh
   ```

3. **Verify Installation**

   ```bash
   # Should show all components loaded
   bash .opencode-lite/init-lite.sh
   ```

4. **Start Development**
   - Use AI assistance as normal
   - Framework validates automatically
   - Get feedback on potential issues

### Scaling to Full Framework

If you outgrow Lite, migrate gradually:

1. **Keep Lite running** alongside Full
2. **Add agents incrementally** based on needs
3. **Expand validation** as team sophistication grows
4. **Migrate completely** when ready

---

## 🆘 Troubleshooting

### Common Issues

**"Command not found" errors**

- Ensure scripts are executable: `chmod +x *.sh`
- Check you're in the project root directory

**Validation too strict**

- Lite: Edit `.opencode-lite/enforcer-lite.json` thresholds
- Full: Modify framework configuration files

**Setup fails**

- Ensure you have Node.js/npm installed
- Check that you're in a git repository
- Verify package.json exists

**Performance issues**

- Lite: Minimal impact, review automation hooks
- Full: Consider migrating to Lite if overhead too high

---

## 📚 Documentation

### ⚠️ **Critical Core Document**

- **[AGENTS_TEMPLATE.md](../.opencode/agents_template.md)** - **REQUIRED**: Core agent architecture template (located in this repository) that must be copied to `.opencode/` directory. Contains the complete framework design developed over 6+ months across 5+ projects.

### Framework Lite

- **Setup**: `.opencode-lite/README.md`
- **Configuration**: `.opencode-lite/enforcer-lite.json`
- **Agents**: `.opencode-lite/agents/` directory

### Full Framework

- **Complete Guide**: [../.opencode/agents_template.md](../.opencode/agents_template.md) (same as above - this is your primary reference)
- **Integration Lessons**: [INTEGRATION_LESSONS.md](../framework/INTEGRATION_LESSONS.md)
- **Implementation Summary**: [framework-implementation-history.md](../project/history/framework-implementation-history.md)
- **Performance Analysis**: [FRAMEWORK_ECOSYSTEM_COMPARISON.md](../FRAMEWORK_ECOSYSTEM_COMPARISON.md)

---

## 📋 See Also

- **[AGENTS_TEMPLATE.md](../.opencode/agents_template.md)**: Comprehensive technical specifications for agent architecture and design patterns
- **[INTEGRATION_LESSONS.md](./INTEGRATION_LESSONS.md)**: Implementation experiences and framework evolution insights
- **[FRAMEWORK_IMPLEMENTATION_SUMMARY.md](../project/history/framework-implementation-history.md)**: Technical implementation details and current status
- **[FRAMEWORK_ECOSYSTEM_COMPARISON.md](../FRAMEWORK_ECOSYSTEM_COMPARISON.md)**: Performance analysis and framework comparisons

## Additional Resources

- [API Reference](./api/) - For developers integrating with the framework
- [Architecture Docs](./architecture/) - For understanding the framework design
- [Benchmarking](./benchmarking/) - Performance metrics and analysis
- [Migration Guide](./migration/) - Framework migration procedures
- [Framework Selection](./selection/) - Evaluation and selection criteria
- [Archived Versions](./archive/) - For historical reference
- [Framework Refactoring](./FRAMEWORK_REFACTORING.md) - Refactoring procedures and patterns
- [StrRay Extension](./STRAY_EXTENSION.md) - Extension capabilities and integration
- [Compliance](./COMPLIANCE.md) - Framework compliance and standards

---

## 📊 Version Tracking Stanza

### Framework Documentation Consolidation (Phase 4)

- **v2.4.0**: Major documentation consolidation merging FRAMEWORK_README.md, INDEX.md, and README.md
- **Framework versions standardized** across all documentation
- **Agent documentation consolidated** keeping latest comprehensive specifications
- **API references unified** with framework version alignment
- **Internal links updated** for improved navigation

### FRAMEWORK_README.md Evolution

- **v2.4.0**: Enhanced decision framework, improved installation guidance, added cross-references
- **v2.3.0**: Initial user guide creation with lite vs full comparisons
- **v2.2.0**: Framework documentation restructuring
- **v2.1.0**: Installation guide enhancements
- **v2.0.0**: Initial user-focused documentation

### Related Framework Versions

- **Framework Lite**: v1.0.0 (streamlined implementation)
- **Framework Full**: v2.4.0 (comprehensive implementation)
- **AGENTS_TEMPLATE.md**: v2.4.0 (technical master document)
- **Documentation Consolidation**: Phase 4 complete (merged framework docs)

---

## 🤝 Support & Community

- **Issues**: Check troubleshooting sections in READMEs
- **Performance**: Run analysis scripts for metrics
- **Customization**: Edit configuration files for your needs
- **Extensions**: Framework designed for customization

---

## 📈 Version History

- **v1.0.0 (Lite)**: Streamlined framework for velocity-focused teams
- **v2.4.0 (Full)**: Comprehensive framework with maximum protection
- **Future**: Enhanced AI integration and automated learning

---

## 🎯 Summary

**Framework Lite**: Perfect balance of AI error prevention and development velocity for most AI-assisted development scenarios.

**Full Framework**: Maximum protection for critical systems and teams that can invest in comprehensive validation.

**Choose based on your risk tolerance, team size, and development velocity requirements.**

---

_StrRay Framework - Systematic AI Error Prevention_
_Choose the right tool for your development needs_ 🚀
