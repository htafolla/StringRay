# StringRay v1.15.x Release Notes

## v1.15.4 (2026-03-27)

**Fixes:**
- Removed optional community skill checks from pipeline tests (typescript-expert, impeccable, openviking, antigravity-bridge are optional installs)
- Fixed function name reference in tests (getSkillsFromIntegrations → getSkillsFromSkills)

---

## v1.15.1 (2026-03-27)

**Major Improvements:**

### Hermes Agent Integration
- New `hermes-agent` skill with full MCP server integration
- Standalone mode (no OpenCode dependency required)
- Auto-installs to `~/.hermes/skills/` on npm install
- `--standalone` flag for installer

### Agent Count Synchronization
- Fixed `.opencode/agents/` to match `src/agents/` (25 agents)
- Created 12 missing agent YAML files
- Removed orphaned `document-writer.yml`
- UVM now counts from `src/agents/` as single source of truth

### Skills Count Correction
- Fixed skills count: 30 → 44
- Fixed test count: 2,368 → 2,311
- MCP terminology consistency (MCP Skills → MCP Servers)

### UVM Refactoring
- Removed hardcoded count patterns from UVM
- UVM now maintains versions only, not dynamic counts
- Dynamic counts derived from source directories

### Documentation Reorganization
- 30+ files moved to archive/superseded
- Hardcoded counts removed from non-key files
- Counts/versions kept only in: README.md, AGENTS.md, BRAND.md, key user guides
- Fixed ANTIGRAVITY_INTEGRATION.md path reference to archive location

### MCP Server Security
- Fixed execSync → execFileSync in MCP servers
- Improved error handling

### Refactoring
- Renamed StringRayOrchestrator → KernelOrchestrator
- Removed deprecated processor-manager methods

---

## What's New in v1.15.x

| Metric | v1.14.x | v1.15.x |
|--------|----------|----------|
| Agents | 25 | 25 (synchronized) |
| Skills | 30 | 44 |
| MCP Servers | N/A | 15 |
| Tests | 2,368 | 2,311 |

**Total commits since v1.15.0:** 20+

---

*Full changelog: [CHANGELOG.md](./CHANGELOG.md)*
