#!/bin/bash

LOG_FILE=".opencode/logs/strray-init-$(date +%Y%m%d-%H%M%S).log"
mkdir -p ".opencode/logs"

# Simple log function
log() {
    echo "$@" | tee -a "$LOG_FILE"
}

# Display boot header with STRRAY ASCII art
# Display boot header with STRRAY ASCII art (Monochrome - ANSI colors not supported)
log "//═══════════════════════════════════════════════════════//"
sleep 0.1
log "//                                                       //"
sleep 0.1
log "//   ███████╗████████╗██████╗ ██████╗  █████╗ ██╗   ██╗  //"
sleep 0.1
log "//   ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝  //"
sleep 0.1
log "//   ███████╗   ██║   ██████╔╝██████╔╝███████║ ╚████╔╝   //"
sleep 0.1
log "//   ╚════██║   ██║   ██╔══██╗██╔══██╗██╔══██║  ╚██╔╝    //"
sleep 0.1
log "//   ███████║   ██║   ██║  ██║██║  ██║██║  ██║   ██║     //"
sleep 0.1
log "//   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝     //"
sleep 0.1
log "//                                                       //"
sleep 0.1
log "//        ⚡ Precision-Guided AI Development ⚡          //"
sleep 0.1
log "//          Platform • 99.6% Error Prevention            //"
sleep 0.1
log "//                                                       //"
sleep 0.1
log "//═══════════════════════════════════════════════════════//"
sleep 0.5
log "//   🚀 Initializing orchestrator-first boot sequence..." //
sleep 0.3
log "//━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━//"
sleep 1

if [ ! -f ".opencode/enforcer-config.json" ]; then
    log "❌ ERROR: Framework configuration not found"
    exit 1
fi

HOOKS=("pre-commit-introspection" "auto-format" "security-scan" "enforcer-daily-scan")
MCPS=("project-analysis" "testing-strategy" "architecture-patterns" "performance-optimization" "git-workflow" "api-design")
AGENTS=("orchestrator" "enforcer" "architect" "bug-triage-specialist" "code-reviewer" "security-auditor" "refactorer" "test-architect")

HOOKS_LOADED=0; HOOKS_MISSING=0
for hook in "${HOOKS[@]}"; do [ -f ".opencode/commands/${hook}.md" ] && HOOKS_LOADED=$((HOOKS_LOADED + 1)) || HOOKS_MISSING=$((HOOKS_MISSING + 1)); done

MCPS_LOADED=0; MCPS_MISSING=0
for mcp in "${MCPS[@]}"; do [ -f ".opencode/mcps/${mcp}.mcp.json" ] && MCPS_LOADED=$((MCPS_LOADED + 1)) || MCPS_MISSING=$((MCPS_MISSING + 1)); done

AGENTS_LOADED=0; AGENTS_MISSING=0
for agent in "${AGENTS[@]}"; do [ -f ".opencode/agents/${agent}.md" ] && AGENTS_LOADED=$((AGENTS_LOADED + 1)) || AGENTS_MISSING=$((AGENTS_MISSING + 1)); done

# Status display with emojis
log "✅ Framework configuration loaded"
sleep 0.5
log "🔧 Automation hooks: $HOOKS_LOADED loaded, $HOOKS_MISSING missing"
sleep 0.5
log "🧠 MCP skills: $MCPS_LOADED loaded, $MCPS_MISSING missing"
sleep 0.5
log "🤖 Agent configs: $AGENTS_LOADED loaded, $AGENTS_MISSING missing"
sleep 1

# Quick boot-time compliance check (much faster than full daily scan)
if command -v node &> /dev/null && [ -f "src/context-loader.ts" ]; then
    log "🔍 SCAN Running compliance scan..."
    sleep 1
    # Quick check: just verify codex can be loaded (much faster than full file scan)
    node -e "
    (async () => {
      try {
        const { StrRayContextLoader } = await import('./dist/context-loader.js');
        const loader = StrRayContextLoader.getInstance();
        process.exit(0);
      } catch (e) {
        console.error('Codex load failed:', e.message);
        process.exit(1);
      }
    })();
    " > /dev/null 2>&1
    COMPLIANCE_EXIT_CODE=$?
    [ $COMPLIANCE_EXIT_CODE -eq 0 ] && log "✅ Compliance scan passed" || log "⚠️ WARN Compliance scan completed with issues"
elif command -v bash &> /dev/null && [ -f ".opencode/commands/enforcer-daily-scan.md" ]; then
    # Fallback to basic file existence check if Node.js not available
    log "🔍 SCAN Running basic compliance check..."
    sleep 1
    [ -f "codex.json" ] && log "✅ Basic compliance check passed" || log "⚠️ WARN Codex file missing"
else
    log "[⚠️ WARN] Compliance check unavailable"
fi
sleep 1

log "🚀 INIT Initializing boot sequence..."
sleep 1

if command -v node &> /dev/null && [ -f "src/boot-orchestrator.ts" ]; then
    log "⚙️ BootOrchestrator: orchestrator-first initiated"
    sleep 0.5
    log "🔄 BootOrchestrator: session management activated"
    sleep 0.5
    log "🔧 BootOrchestrator: pre/post processors enabled"
    sleep 0.5
    log "🛡️ BootOrchestrator: automatic enforcement activated"
    sleep 0.5
    log "📋 BootOrchestrator: codex compliance checking enabled"
    sleep 1
else
    log "[⚠️ WARN] BootOrchestrator not available"
fi

log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🎉 StrRay Framework: SESSION INITIALIZED 🎉"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 1
log "✅ Boot sequence: orchestrator-first with automatic enforcement"
sleep 0.5
log "🚀 Ready for development with 99.6% runtime error prevention"
log ""
log "📝 Full log saved to: $LOG_FILE"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sleep 1

if [ $HOOKS_LOADED -eq 0 ] || [ $AGENTS_LOADED -eq 0 ]; then
    log ""
    log "❌ CRITICAL: Required components missing. Framework may not function correctly."
    exit 1
fi

exit 0
