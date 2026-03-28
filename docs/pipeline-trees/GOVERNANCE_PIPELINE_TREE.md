# Governance Pipeline

**Purpose**: Validate operations against codex rules and attempt automatic fixes

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GOVERNANCE PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                           INPUT LAYER                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐                          │
│  │ validateOperation() │  │attemptRuleViolation │                          │
│  │                     │  │     Fixes()         │                          │
│  └──────────┬──────────┘  └──────────┬──────────┘                          │
└─────────────┼─────────────────────────┼─────────────────────────────────────┘
              │                         │
              └─────────────┬───────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                   GOVERNANCE ENGINES (5)                             │  │
│  │                                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                     RuleEnforcer                            │   │  │
│  │  │                  rule-enforcer.ts:368                      │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                    RuleRegistry                            │   │  │
│  │  │                  rule-registry.ts                         │   │  │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │  │
│  │  │  │  Rule Categories:                                      │ │   │  │
│  │  │  │  • Code Quality: no-duplicate-code, console-log-usage  │ │   │  │
│  │  │  │  • Architecture: src-dist-integrity, no-over-engineering│ │   │  │
│  │  │  │  • Security: input-validation, security-by-design       │ │   │  │
│  │  │  │  • Testing: tests-required, test-coverage               │ │   │  │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                   RuleHierarchy                             │   │  │
│  │  │                 rule-hierarchy.ts                          │   │  │
│  │  │                  sortByDependencies()                      │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                  ValidatorRegistry                          │   │  │
│  │  │                validator-registry.ts                        │   │  │
│  │  │                                                             │   │  │
│  │  │  For each rule → getValidator() → validate()               │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                    RuleExecutor                             │   │  │
│  │  │                   rule-executor.ts                          │   │  │
│  │  │                                                             │   │  │
│  │  │           ┌─────────────────────────────────┐              │   │  │
│  │  │           │   executeRules()                 │              │   │  │
│  │  │           │   → RuleValidationResult[]       │              │   │  │
│  │  │           └─────────────────────────────────┘              │   │  │
│  │  └──────────────────────────┬──────────────────────────────────┘   │  │
│  │                             │                                        │  │
│  │                             v                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                  ViolationFixer                             │   │  │
│  │  │                 violation-fixer.ts                           │   │  │
│  │  │                                                             │   │  │
│  │  │           ┌─────────────────────────────────┐              │   │  │
│  │  │           │   fixViolations()                │              │   │  │
│  │  │           │   → ViolationFix[]               │              │   │  │
│  │  │           └─────────────────────────────────┘              │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     v
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OUTPUT LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    ValidationReport                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │  │
│  │  │   passed    │  │   errors    │  │  warnings   │                │  │
│  │  │  (boolean)  │  │    []       │  │    []       │                │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                │  │
│  │                                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │                    ViolationFix[]                           │   │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │  │
│  │  │  │    rule     │  │  attempted  │  │   error     │         │   │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘         │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Compact Data Flow

```
validateOperation(operation, context)
    │
    ▼
RuleRegistry.getRules()
    │
    ▼
RuleHierarchy.sortByDependencies()
    │
    ▼
For each rule (in dependency order):
    │
    ├─► ValidatorRegistry.getValidator()
    │
    └─► validator.validate() → RuleValidationResult
    │
    ▼
ValidationReport { passed, errors, warnings, results }
    │
    ▼
If violations:
    │
    ▼
attemptRuleViolationFixes(violations, context)
    │
    ▼
ViolationFixer.fixViolations()
    │
    ▼
Return ViolationFix[]
```

## Layers

- **Layer 1**: Rule Registry (RuleRegistry - rule storage)
- **Layer 2**: Rule Hierarchy (RuleHierarchy - dependencies)
- **Layer 3**: Validator Registry (ValidatorRegistry - validator lookup)
- **Layer 4**: Rule Executor (RuleExecutor - orchestration)
- **Layer 5**: Violation Fixer (ViolationFixer - fix delegation)

## Components

| Component | File |
|-----------|------|
| RuleEnforcer | `src/enforcement/rule-enforcer.ts` |
| RuleRegistry | `src/enforcement/core/rule-registry.ts` |
| RuleHierarchy | `src/enforcement/core/rule-hierarchy.ts` |
| ValidatorRegistry | `src/enforcement/validators/validator-registry.ts` |
| RuleExecutor | `src/enforcement/core/rule-executor.ts` |
| ViolationFixer | `src/enforcement/core/violation-fixer.ts` |

## Entry Points

| Entry | File:Line | Description |
|-------|-----------|-------------|
| validateOperation() | rule-enforcer.ts:368 | Main validation entry |
| attemptRuleViolationFixes() | rule-enforcer.ts:385 | Fix violations |

## Exit Points

| Exit | Data |
|------|------|
| Success | ValidationReport { passed: true } |
| Violations | ValidationReport { passed: false, errors, warnings } |
| Fixes | ViolationFix[] |

## Rule Categories

- **Code Quality**: no-duplicate-code, console-log-usage
- **Architecture**: src-dist-integrity, no-over-engineering
- **Security**: input-validation, security-by-design
- **Testing**: tests-required, test-coverage

## Artifacts

- 28+ rules registered (sync + async)
- Validation reports with violations

## Testing Requirements

1. Validate operation → verify report generated
2. Validate with violations → verify errors detected
3. Attempt fixes → verify fix attempts made
4. Full flow: validate → report → fix → output
