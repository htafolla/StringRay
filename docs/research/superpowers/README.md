# superpowers Deep Analysis

**Repository:** obra/superpowers
**Stars:** 96-100K
**License:** MIT
**Languages:** Shell (57.7%), JavaScript (30.1%), HTML (4.5%)
**Status:** Active (v5.0.5, latest release: 2026-03-17)

---

## Overview

**superpowers** is a complete software development workflow for coding agents, built on composable "skills" that enforce structured development processes. It was verified in Anthropic's official marketplace in January 2026 and has 77K+ developers using it.

---

## The Problem It Solves

Most coding agents are great at writing code but terrible at finishing projects:
- Jump into implementation before understanding requirements
- Skip tests
- Lose track of original goals
- Produce inconsistent results

Superpowers enforces discipline through structured workflows.

---

## Core Methodology

### The Complete Workflow

```
1. Brainstorming → Refine rough ideas through Socratic questions
2. Spec Creation → Create detailed specification
3. Plan Writing → Build implementation plan
4. Implementation → Write code with automated skills
5. Testing → TDD cycle (RED-GREEN-REFACTOR)
6. Debugging → Systematic root cause analysis
7. Review → Code review with checklists
```

### Key Principle
> "Evidence over claims. Verify before declaring success."

---

## Skills Library

### Testing
- **test-driven-development**: RED-GREEN-REFACTOR cycle with anti-patterns reference

### Debugging
- **systematic-debugging**: 4-phase root cause process
- **root-cause-tracing**: Defense-in-depth debugging
- **defense-in-depth**: Layered security thinking

### Collaboration
- **brainstorming**: Socratic design refinement
- **writing-plans**: Detailed implementation plans
- **requesting-code-review**: Pre-review checklist

### Execution
- **dispatching-parallel-agents**: Concurrent subagent workflows
- **subagent-driven-development**: Fast iteration with two-stage review
- **executing-plans**: Plan execution with critical review

### Meta
- **writing-skills**: Create new skills following best practices

---

## Platform Support

| Platform | Support Level | Installation |
|----------|--------------|---------------|
| Claude Code | Official (Marketplace) | `/plugin marketplace add obra/superpowers-marketplace` |
| Cursor | Built-in plugin | Plugin marketplace |
| OpenCode | ✅ Explicitly supported | `npx mdskills install obra/superpowers` |
| Codex | ⚠️ Via instructions | Manual setup |

### OpenCode Installation
```bash
npx mdskills install obra/superpowers
```

The README says:
> "OpenCode — Tell OpenCode: gemini extensions install https://github.com/obra/superpowers"

---

## Integration Potential for StringRay

### Integration Type: Methodology + Skills Framework

### Why This is Perfect for StringRay

1. **Already supports OpenCode** - Native StringRay compatibility
2. **Methodology aligns** - StringRay's orchestration needs exactly what Superpowers provides
3. **Composable skills** - Can be mixed and matched
4. **Proven in production** - 77K+ developers, battle-tested

### How StringRay Could Use Superpowers

```
StringRay Orchestrator
        │
        ▼
┌─────────────────────────┐
│  @orchestrator           │
│    │                     │
│    ├── @architect (superpowers:brainstorming) │
│    ├── @testing-lead (superpowers:test-driven-development) │
│    ├── @code-reviewer (superpowers:requesting-code-review) │
│    └── @refactorer (superpowers:systematic-debugging) │
└─────────────────────────┘
```

### Skill Mapping

| Superpowers Skill | StringRay Agent | Purpose |
|-------------------|-----------------|---------|
| brainstorming | @architect | Design refinement |
| writing-plans | @orchestrator | Implementation planning |
| test-driven-development | @testing-lead | Test-first development |
| systematic-debugging | @bug-triage-specialist | Root cause analysis |
| requesting-code-review | @code-reviewer | Quality assurance |
| executing-plans | @orchestrator | Plan execution |

---

## Complexity Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| **Technical Complexity** | Low | Shell scripts + markdown skills |
| **Integration Effort** | Very Low | Already supports OpenCode |
| **Maintenance** | Low | Active upstream, community-driven |
| **Token Overhead** | Low | Composable, load as needed |

**Overall Complexity:** Easy (Best fit for StringRay)

---

## Value Assessment

| Value Dimension | Rating | Notes |
|-----------------|--------|-------|
| **Immediate Utility** | Very High | Solves real workflow problems |
| **Unique Capabilities** | High | Proven methodology |
| **Code Quality** | Very High | 100K stars, Anthropic verified |
| **Community Size** | Very High | 77K+ developers |

**Overall Value:** Highest

---

## Synergy with StringRay

### Strengths
- ✅ Already supports OpenCode natively
- ✅ Methodology perfectly complements orchestration
- ✅ Composable skills match StringRay's agent system
- ✅ Enforces exactly what complex tasks need

### Weaknesses
- None significant

### Synergy Score: 5/5 (Perfect fit)

---

## Key Files to Reference

- `skills/brainstorming/SKILL.md` - Socratic questioning pattern
- `skills/test-driven-development/SKILL.md` - TDD methodology
- `skills/writing-skills/SKILL.md` - How to create new skills
- `docs/README.codex.md` - Detailed OpenCode instructions

---

## Implementation Recommendation

### Phase 1: Quick Integration (1 week)
```bash
npx mdskills install obra/superpowers
```

### Phase 2: Agent Mapping (1 week)
Map StringRay agents to superpower skills:
- Update @architect to use brainstorming skill
- Update @testing-lead to use TDD skill
- Update @bug-triage-specialist to use debugging skill

### Phase 3: Custom Skills (2 weeks)
Create StringRay-specific superpowers:
- `stringray-orchestration` - Agent coordination
- `stringray-complexity` - Task complexity routing
- `stringray-mcp` - MCP tool integration

---

## Example: StringRay + Superpowers Workflow

```
User: @orchestrator implement user authentication

Orchestrator:
  → Loads superpowers:brainstorming
  → Asks: "What auth provider? OAuth, JWT, session?"
  
User: "JWT with refresh tokens"

  → Loads superpowers:writing-plans
  → Creates detailed implementation plan:
     1. Database schema for users
     2. JWT generation/validation utilities
     3. Auth endpoints (login/logout/refresh)
     4. Middleware for protected routes
     5. Tests for auth flow

  → Loads superpowers:test-driven-development
  → Writes tests first:
     - test_login_success
     - test_login_invalid_credentials
     - test_token_refresh
     
  → Executes plan with @architect, @security-auditor, @testing-lead
  → Loads superpowers:requesting-code-review
  → Final review with @code-reviewer
```

---

## Comparison to StringRay Native Skills

| Aspect | superpowers | StringRay Native |
|--------|-------------|------------------|
| **Workflow** | Structured methodology | Flexible |
| **Skills** | 10+ proven skills | Dynamic discovery |
| **Testing** | TDD-first | Test after |
| **Debugging** | Systematic | Ad-hoc |
| **Planning** | Detailed plans | Abstraction-based |

**Recommendation:** Integrate superpowers as StringRay's methodology layer.

---

## Conclusion

**superpowers** is the highest-priority integration for StringRay because:
1. Already supports OpenCode
2. Perfect methodology match
3. Proven with 77K+ developers
4. Easy integration (1-2 weeks)
5. Dramatically improves agent discipline

**Priority:** HIGHEST
**Effort:** Low (1-2 weeks)
**Recommendation:** Integrate immediately as StringRay's workflow methodology.

---

*Analysis completed: 2026-03-23*
