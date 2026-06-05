# xray — MCP-Centric AI Governance OS (v1)

xray is an AI orchestration framework with Codex governance.

## Commands

- Build: `npm run build`
- Test: `npm test` (vitest)
- TypeCheck: `npx tsc --noEmit`
- CLI: `npx strray-ai --help`

## Codex

This project enforces the Universal Development Codex (68 terms).

Rules live in `.strray/codex.json`. Key rules:

- **One thing at a time** — complete one task before starting the next
- **Triage. Fix. Loop.** — assess, fix, verify, repeat
- **Watch commands for errors** — never assume success from exit codes
- **Always add .gitignore** — never commit generated/transient files
- **Write tests for new code** — no production code without tests
- **Modular integration/E2E tests** — individually runnable, triageable
- **Use best subagents, reuse context** — preserve session state
- **Lead dev mindset** — ownership, iterate, deliver
- **Surgical fixes** — fix root cause, not symptoms
- **No patches/stubs/bridge code** — every line has permanent purpose
- **Type safety first** — no `any`, `@ts-ignore`, or `@ts-expect-error`
- **Resolve all errors** — zero tolerance for unresolved errors
