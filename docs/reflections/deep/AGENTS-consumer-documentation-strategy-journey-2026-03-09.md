# Deep Reflection: AGENTS-consumer.md Documentation & Script Strategy

**Date**: 2026-03-09
**Session Focus**: Consumer Documentation Enhancement, Script Strategy, and Reflection Documentation
**Reflection Type**: Documentation Strategy & User Experience

---

## 🌅 The Journey in Retrospective

The session began with a simple request to improve AGENTS-consumer.md but evolved into a comprehensive exploration of StringRay's documentation ecosystem, reflection strategy, and script architecture. This revealed important gaps in how consumers understand what they have and how to learn from development sessions.

### The Initial Request

The user asked to "add a few bugs" to AGENTS-consumer.md - specifically:
1. Basic operation information for agents
2. Note where reflection templates are located
3. Review consumer agents.md content

On the surface, this seemed straightforward - add missing documentation about basic StringRay operations.

### What Became a Deep Investigation

As we explored the codebase and architecture, we discovered:

1. **Documentation ecosystem complexity** - Multiple files with similar purposes in different locations
2. **Plugin architecture misunderstanding** - How OpenCode plugins integrate with StringRay
3. **Consumer experience gaps** - What happens when someone installs strray-ai in their project
4. **Reflection strategy missing** - No clear guidance on how to create and use reflection documents
5. **Script documentation gaps** - No explanation of utility scripts and their purposes

---

## 🔬 Technical Deep Dive

### The Documentation Ecosystem

#### File Structure Analysis

**Current Distribution:**

```
/Users/blaze/dev/stringray/AGENTS.md              # Main repo documentation (74 lines)
  ↓ .opencode/AGENTS-consumer.md          # Copied by postinstall to .opencode/
    ├── /Users/blaze/dev/stringray/node_modules/strray-ai/.opencode/AGENTS-consumer.md
    └── <consumer-project>/node_modules/strray-ai/.opencode/AGENTS-consumer.md
```

**Distribution Mechanism** (from `scripts/node/postinstall.cjs`):

```javascript
const configFiles = [
  "AGENTS-consumer.md:AGENTS.md"  // Minimal version for consumers
];

// Then copies from packageRoot/.opencode/ to target/.opencode/
```

**Key Discovery**: AGENTS-consumer.md is a **minimal consumer version** optimized for production installations, not development.

#### Postinstall Script Behavior

The `postinstall.cjs` script handles:

1. **Environment Detection**: Distinguishes dev vs consumer environments
2. **Path Conversion**: Converts paths for consumer package structure
3. **File Copying**: Copies `.opencode/` directory to consumer's `.opencode/`
4. **Symlink Creation**: Creates `scripts/` and `.strray/` symlinks for state management

**Critical Gap**: AGENTS-consumer.md doesn't mention postinstall behavior or consumer-specific experience!

### The OpenCode Plugin: strray-codex-injection.js

**Purpose**: Automatically injects Universal Development Codex into all agent prompts

**Key Behavior** (from code analysis):

```javascript
// Tries to load from node_modules/strray-ai/dist/ first (development)
logger.log(`🔄 Attempting to load from ../../dist/`);

// Falls back to loading from ../../dist/ (consumer installations)
logger.log(`✅ Loaded from ../../node_modules/${pluginPath}/dist/`);
```

**Load Priority Hierarchy**:
1. **Priority 1**: `node_modules/strray-ai/dist/` (development mode)
2. **Priority 2**: `../../dist/` (consumer mode fallback)

**Plugin Activity States**:
- **Active (Development)**: Loads from development dist, full codex injection
- **Inactive (Consumer)**: Falls back to dist/, uses lean hardcoded codex
- **"Kicks Off"**: Plugin not called, no codex injection, no dynamic discovery

**Capabilities Lost When Inactive**:
- Dynamic agent discovery from MCP servers
- Enhanced system prompts with latest codex terms
- Automatic hot-reload on code changes
- Plugin-specific logging and metrics

---

## 🧠 Cognitive Insights

### The Documentation Problem

AGENTS-consumer.md serves as the **primary reference** for consumers, but has critical gaps:

1. **No "How StringRay Works" section** - Basic operation guide missing
2. **No reflection template location** - Users don't know where to find detailed journey docs
3. **No consumer vs dev differences** - Consumers may think their experience is the "normal" one
4. **No plugin behavior documentation** - What happens when plugin is inactive
5. **No script documentation** - No guidance on activity.log or other utilities

### Why This Matters

When someone installs `strray-ai` as a dependency in their project:
- They get a minimal AGENTS.md without the "How StringRay Works" section
- They don't know about reflection documents
- They don't understand why agents might behave differently than documented
- They can't troubleshoot issues effectively
- They can't learn from StringRay development journeys

---

## 🎯 Strategic Implications

### Documentation Strategy Questions

1. **Single source of truth?**
   - Should AGENTS-consumer.md be the ONLY consumer documentation?
   - Or should AGENTS.md in repo be comprehensive for both dev and consumer?

2. **Reflection documentation ownership?**
   - Should reflection docs be in consumer package (copied by postinstall)?
   - Or should they stay in repo for development access?

3. **Script documentation?**
   - Where are utility scripts documented?
   - Should there be a SCRIPTS.md reference file?
   - Should scripts have inline comments explaining their purpose?

4. **Development vs consumer clarity?**
   - Are the differences between the two environments clearly documented?
   - Do consumers understand what features are reduced in production mode?

### The "Plugin Kicks Off" Mystery

The user reported:
> "its all about agent will know directly about stringray-plugin kicks off and does a lot but what are the direct agent touchpoints"

This reveals:
- The plugin is **designed for development mode** (active agent discovery, hot-reload)
- **Production optimizations** prioritize stability over dynamic features
- **No documentation** explaining this trade-off
- **No user-facing guidance** on what to expect

**Critical Insight**: Users might experience reduced features without understanding WHY this design choice was made.

---

## 🔮 Looking Forward

### Immediate Improvements Needed

1. **Add to AGENTS-consumer.md**:
   - "How StringRay Works" section covering plugin behavior
   - Reflection template location guidance
   - Development vs consumer experience explanation
   - Plugin configuration options (if any exist)
   - Common issues and troubleshooting

2. **Create AGENTS.md enhancement reflection**:
   - Document the decision to have separate consumer docs
   - Explain the distribution mechanism
   - Provide examples of when to use AGENTS.md vs AGENTS-consumer.md

3. **Add SCRIPTS.md or similar documentation**:
   - Document all utility scripts in `scripts/` directory
   - Explain purpose of each script category
   - Provide usage examples for common scripts

4. **Update developer guides**:
   - Explain how to add custom agents to `.opencode/agents/`
   - Document the skill script system (agent-registry, clause-seo)
   - Provide examples of script development

5. **Improve inline documentation**:
   - Add script documentation to relevant source files
   - Explain system scripts in README or developer guides
   - Document utility script purposes and usage

### Long-term Vision

1. **Comprehensive documentation ecosystem**:
   - Clear separation between core and consumer documentation
   - Well-organized reflection documents in `docs/reflections/deep/`
   - Complete script reference with examples
   - Troubleshooting guides for common issues

2. **Developer experience focus**:
   - Clear onboarding for consumer installations
   - Explicit documentation of production vs development differences
   - Troubleshooting guides specific to consumer scenarios
   - Tooling to help developers debug and understand the system

3. **Reflection-driven development**:
   - Every major feature has a companion reflection document
   - Developers can learn from past sessions
   - Clear documentation of architectural decisions and trade-offs

---

## 📚 Lessons Learned

### Documentation Lessons

1. **Context matters more than completeness** - A minimal AGENTS-consumer.md causes more confusion than no documentation
2. **Consumer experience is different** - Production installations have different constraints than development
3. **Plugin behavior must be documented** - Users need to understand what to expect in different modes
4. **Scripts need documentation** - Utility scripts without clear purposes confuse users

### Architectural Lessons

1. **Separation of concerns** - Plugin architecture is for development features, consumer stability
2. **Graceful degradation** - Fallback mechanisms work but should be documented
3. **Documentation distribution strategy** - Current approach (postinstall copies) works but lacks clarity
4. **Reflection integration** - Need clear strategy for when and how to create reflection docs

### Process Lessons

1. **User feedback is gold** - Simple questions reveal deep systemic gaps
2. **Start with understanding, not implementation** - Explore before building
3. **Consider all user types** - Dev environment vs consumer production deployments
4. **Document trade-offs** - Design choices have consequences that must be explained

---

## 🙏 Acknowledgments

This reflection was informed by:
- **User's keen observation** about "plugin kicks off" behavior
- **Codebase exploration** through AGENTS.md, AGENTS-consumer.md, plugin architecture
- **Script analysis** of postinstall.cjs and utility functions
- **Pattern recognition** of documentation gaps and ecosystem complexity

Special recognition to the **user's insight about agent touchpoints** - this single comment revealed a fundamental misunderstanding of the plugin architecture that wasn't documented anywhere.

---

## 🌟 Final Thoughts

The AGENTS-consumer.md update journey revealed that **documentation strategy is as important as the code it documents**. When users install StringRay in their projects, they need:

1. **Clear understanding** of what to expect and how the system works
2. **Access to guidance** on troubleshooting and configuration
3. **Knowledge of the ecosystem** - reflection docs, scripts, plugins
4. **Visibility into trade-offs** - why some features work differently in production vs development

The **current approach** (minimal consumer docs) works but creates confusion. The **better approach** would be:

- Comprehensive main documentation that covers all scenarios
- Separate consumer documentation that explains production-specific behavior
- Complete script documentation for all utilities
- Clear guidance on reflection documentation and learning journeys
- Transparent explanation of plugin behavior and mode differences

As we look toward future StringRay releases, the goal should be: **not just to provide good code, but to provide good documentation that enables users to understand, troubleshoot, and extend the system effectively**.

---

**Session Summary**:
- Documentation files analyzed: 3 (AGENTS.md, AGENTS-consumer.md, reflection docs)
- Script locations identified: scripts/, .opencode/hooks/
- Plugin architecture reviewed: strray-codex-injection.js
- Missing sections identified: "How StringRay Works", script documentation
- User concerns addressed: Plugin behavior, consumer vs dev differences

**Next Steps**: Add missing sections to AGENTS-consumer.md, create comprehensive script documentation

---

*"Good code without good documentation is like a car without an owner's manual - it works, but you'll never know how to drive it effectively."*