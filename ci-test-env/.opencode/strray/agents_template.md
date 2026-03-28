# StringRay AI v1.3.4 – Agent Context & Universal Development Codex

**Framework Version**: 1.3.4  
**Codex Version**: 1.1.1 (condensed)  
**Last Updated**: 2026-01-24  
**Purpose**: Systematic error prevention and production-ready AI-assisted development

## 🎯 CRITICAL RULES – ZERO TOLERANCE (MANDATORY)

1. **Full File Reading Before Edit**  
   ALWAYS read the ENTIRE file using the `read` tool before ANY edit, refactor, or write.  
   Understand complete structure, imports, dependencies, and context.  
   Partial/contextual edits are strictly forbidden.

2. **Verify Changes Actually Applied**  
   After every edit/write: use `read` to confirm the exact changes are present.  
   Check for regressions and unintended modifications.  
   NEVER declare success without observable verification.

3. **Command & Tool Output Review**  
   Immediately review ALL command/tool outputs.  
   Identify errors, warnings, or anomalies.  
   Add TODO for course correction if issues found.  
   Do not proceed until critical problems are resolved.

4. **No False Success Claims**  
   Only report "completed", "edited", or "fixed" after verification steps confirm success.  
   Prohibited: assuming success, subjective "looks correct", skipping checks for "trivial" changes.

5. **Surgical & Progressive Fixes**  
   Fix root causes minimally – no patches, stubs, or over-engineering.  
   All code must be production-ready from first commit.

6. **Error & Loop Prevention**  
   Resolve all errors before continuing (90%+ runtime prevention target).  
   Every loop/async must have clear termination/timeout.

7. **Type Safety & Immutability First**  
   No `any`, `@ts-ignore`. Prefer immutable patterns and early returns/guards.

8. **DRY, YAGNI, Separation of Concerns**  
   No duplication. No unnecessary features. One responsibility per module/function.

9. **Test & Performance Awareness**  
   >85% behavioral coverage target. Respect bundle <2MB, FCP <2s budgets.

10. **Security & Input Validation**  
    Validate/sanitize all inputs. Security by design.

## Core Codex Terms (Top 20 – Enforced)

1. Progressive production-ready code  
2. No patches/stubs/bridge code  
3. Avoid over-engineering  
4. Fit-for-purpose prod-level code  
5. Surgical root-cause fixes  
6. Batched introspection cycles  
7. Resolve all errors (90% prevention)  
8. Prevent infinite loops/timeouts  
9. Shared global state / single source of truth  
10. Type safety first (no `any`)  
11. Early returns & guard clauses  
12. Error boundaries & graceful degradation  
13. Immutability preferred  
14. Separation of concerns  
15. DRY – eliminate duplication  
16. YAGNI – no speculative features  
17. Meaningful, self-documenting names  
18. Small, focused functions (<30 lines ideal)  
19. Consistent style (linter enforced)  
20. Test coverage >85% (behavioral focus)

## Agent Capabilities Matrix

| Agent                     | Role                              | Complexity | Key Tools                              | Strategy          |
|---------------------------|-----------------------------------|------------|----------------------------------------|-------------------|
| enforcer                  | Codex & error prevention          | All        | read, grep, lsp_*, bash                | Block violations  |
| architect                 | Design & decisions                | High       | read, grep, lsp_*, background_task     | Expert priority   |
| orchestrator              | Workflow coordination             | Enterprise | read, grep, call_omo_agent, session_*  | Consensus         |
| bug-triage-specialist     | Error investigation & fixes       | Debug      | read, grep, ast_grep_*                 | Majority vote     |
| code-reviewer             | Quality & standards               | Changes    | read, grep, lsp_diagnostics            | Expert priority   |
| security-auditor          | Vulnerabilities & compliance      | Security   | read, grep, grep_app_searchGitHub      | Block critical    |
| refactorer                | Debt & consolidation              | Refactor   | read, grep, lsp_rename, ast_grep_*     | Majority vote     |
| test-architect            | Testing strategy & coverage       | Tests      | read, grep, lsp_*                      | Expert priority   |

## Complexity Routing Summary

Score = (files×2 + change/10 + deps×3 + duration/10) × operation_weight × risk_mult  
- Operation weights: debug 2.0, refactor 1.8, analyze 1.5, modify 1.2, others 1.0  
- Risk multipliers: critical 1.6, high 1.3, medium 1.0, low 0.8  
Thresholds:  
- ≤25 → single agent  
- 26–95 → multi-agent possible  
- 96+ → orchestrator-led

## Operational Guidelines

- Evaluate complexity before execution  
- Always verify: read full file → apply change → read again → confirm no regressions  
- Use `call_omo_agent` or `task()` for delegation  
- Log JobId for traceability  
- Enforce codex compliance on every operation

**Codex Enforcement**: All actions validated against these rules. Violations block progress until resolved.  
**Target**: 99.6% systematic error prevention through verification-first behavior.