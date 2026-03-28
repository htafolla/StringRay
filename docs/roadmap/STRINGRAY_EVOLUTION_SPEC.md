# StringRay Framework Evolution Specification
*Date: March 23, 2026*

---

## Core Vision for StringRay

**Make StringRay the one-command level-up button for OpenCode.**

Instead of "install OpenCode first, then add StringRay", flip it:

```bash
npx strray-ai install
```

This single command should:

1. Detect if OpenCode is installed
2. Auto-install the latest OpenCode (MIT, clean) if missing
3. Layer on the full StringRay kernel (Codex, orchestrator, enforcer, processors, MCP, reflections)
4. Install skills (Antigravity + Claude/SEO)
5. Add new high-value skills (Impeccable + OpenViking)
6. Install new CLI commands

**Goal:** Any developer (or Jelly) can run one command and instantly get a production-grade, governed agent runtime.

---

## Final Packaging Architecture

```
npx strray-ai install
        ↓
1. Check for OpenCode
        ↓
2. If missing → auto-install OpenCode (MIT)
        ↓
3. Layer StringRay kernel (Codex + Orchestrator + Enforcer + MCP)
        ↓
4. Drop skills (Antigravity + Impeccable + OpenViking + custom)
        ↓
5. Add CLI commands + bridge
        ↓
Ready for use
```

---

## Phased Implementation Roadmap

### Phase 0 – Installer Core (1–2 days)

Modify `npx strray-ai install` to:
- Detect OpenCode presence
- Auto-run `npx opencode install` if missing (with user confirmation flag)
- Run all existing skill installers (Antigravity full/curated, Claude/SEO)
- Add `--minimal`, `--full`, and `--with-skills` flags

**Deliverables:**
- [x] Detect OpenCode presence in install script
- [x] Auto-install OpenCode if missing
- [x] Add flag support (--minimal, --full, --with-skills)

### Phase 1 – Skill Integration (2–4 days)

Add new skills as native integrations:
- [x] Impeccable (Apache 2.0) → `.opencode/skills/impeccable/`
- [x] OpenViking (Apache 2.0) → `.opencode/skills/openviking/`
- [x] Keep Antigravity loose (existing `install-antigravity-skills.js`)
- [x] Create `@antigravity-bridge` skill for better UX

**Integration Rules:**
- Skills are dropped into `.opencode/skills/` as MCP modules
- Never fork the repos (only copy adapter + skill files)
- Keep update path simple: `npx strray-ai update-skills`

### Phase 2 – New CLI Commands (2–3 days)

Implement new commands:
- [x] `npx strray-ai publish-agent` (for AgentStore integration)
- [x] `npx strray-ai status` (shows loaded skills + health)
- [x] `npx strray-ai antigravity status`
- [x] `npx strray-ai credible init` (future Pod setup)

### Phase 3 – Polish & Release (3–5 days)

- [x] Update README with new "one-command level-up" story
- [x] Add version pinning for OpenCode + skills
- [x] Test on fresh machines (no OpenCode installed)
- [x] Release as **v1.15.0**

---

## Technical Spec for Auto-Install

```javascript
async function install(options = {}) {
  const { minimal = false, full = false, withSkills = true } = options;
  
  // Check OpenCode presence
  const hasOpenCode = await checkOpenCodeInstallation();
  
  if (!hasOpenCode) {
    console.log("OpenCode not found. Installing...");
    await execAsync("npx opencode install --yes");
  }

  // Install kernel
  console.log("Installing StringRay kernel...");
  await installKernel();

  // Install skills based on flags
  if (withSkills || full) {
    console.log("Installing skills...");
    await installAntigravity(full ? "--full" : "--curated");
    await installImpeccable();
    await installOpenViking();
  }

  // Setup CLI commands
  await installCLIBridge();

  console.log("✅ StringRay is ready. Run: npx strray-ai status");
}
```

---

## Integration Rules for Third-Party Repos

| Rule | Description |
|------|-------------|
| **Loose Coupling** | All third-party repos stay loosely coupled |
| **MCP Modules** | Skills are dropped into `.opencode/skills/` |
| **No Forking** | Never fork the repos (only copy adapter + skill files) |
| **Simple Updates** | `npx strray-ai update-skills` |

**This keeps StringRay lightweight and maintainable.**

---

## Version Timeline

| Version | Focus | Target |
|---------|-------|--------|
| v1.15.1 | **Complete stack** (maintenance mode entered) | March 23, 2026 ✅ |
| v1.15.0 | One-command installer + Phases 0-3 | March 24, 2026 ✅ |
| v1.16.0 | Fresh machine testing + refinements | TBD |
| v1.17.0 | Pod infrastructure + credible init full | TBD |

---

## Key Decisions Made

1. **Invert the dependency**: StringRay installs OpenCode, not the other way around
2. **Skills stay loose**: Antigravity, Impeccable, OpenViking are adapters, not forks
3. **Single command**: `npx strray-ai install` does everything
4. **Flag-based control**: `--minimal`, `--full`, `--with-skills`
5. **MIT OpenCode**: Always install clean MIT version

---

*Specification agreed: March 23, 2026*
