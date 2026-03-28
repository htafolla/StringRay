#!/bin/bash

# Get script directory for robust path handling
SCRIPT_DIR=$(dirname "$(realpath "$0")")
PROJECT_ROOT=$(realpath "$SCRIPT_DIR/..")

# Try to find framework package.json - check source first (dev), then node_modules (consumer)
# For development, prefer the source version over node_modules
SOURCE_PACKAGE_JSON="$SCRIPT_DIR/../package.json"
NODE_MODULES_PACKAGE_JSON="$PROJECT_ROOT/node_modules/strray-ai/package.json"

if [ -f "$SOURCE_PACKAGE_JSON" ]; then
    # Development mode: use source version
    FRAMEWORK_ROOT="$SCRIPT_DIR/.."
elif [ -f "$NODE_MODULES_PACKAGE_JSON" ]; then
    # Consumer mode: use installed version
    FRAMEWORK_ROOT="$PROJECT_ROOT/node_modules/strray-ai"
else
    FRAMEWORK_ROOT="$PROJECT_ROOT"
fi

# StringRay Framework Version - read dynamically from framework's package.json
# Fallback to default version if loading fails
STRRAY_VERSION=$(node -e "try { console.log(require('$FRAMEWORK_ROOT/package.json').version) } catch(e) { console.log('1.7.8') }" 2>/dev/null || echo "1.7.8")

START_TIME=$(date +%s)

LOG_FILE="$PROJECT_ROOT/.opencode/logs/strray-init-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$PROJECT_ROOT/.opencode/logs"

log() {
    echo "$@" | tee -a "$LOG_FILE"
}

# ASCII Art Header with Purple Coloring
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}//═══════════════════════════════════════════════════════//${NC}" && sleep 0.1
echo -e "${PURPLE}//                                                       //${NC}" && sleep 0.1
echo -e "${PURPLE}//   ███████╗████████╗██████╗ ██████╗  ██████╗ ██╗   ██╗  //${NC}" && sleep 0.1
echo -e "${PURPLE}//   ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝  //${NC}" && sleep 0.1
echo -e "${PURPLE}//   ███████╗   ██║   ██████╔╝██████╔╝███████║ ╚████╔╝   //${NC}" && sleep 0.1
echo -e "${PURPLE}//   ╚════██║   ██║   ██╔══██╗██╔══██╗██╔══██║  ╚██╔╝    //${NC}" && sleep 0.1
echo -e "${PURPLE}//   ███████║   ██║   ██║  ██║██║  ██║██║  ██║   ██║     //${NC}" && sleep 0.1
echo -e "${PURPLE}//   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝     //${NC}" && sleep 0.1
echo -e "${PURPLE}//                                                       //${NC}" && sleep 0.1
echo -e "${PURPLE}//        ⚡ Precision-Guided AI Development ⚡          //${NC}" && sleep 0.1
echo -e "${PURPLE}//          Platform • 99.6% Error Prevention            //${NC}" && sleep 0.1
echo -e "${PURPLE}//                                                       //${NC}" && sleep 0.1
echo -e "${PURPLE}//═══════════════════════════════════════════════════════//${NC}" && sleep 0.2
echo -e "${PURPLE}//   🚀 Initializing...                                    //${NC}" && sleep 0.3
echo -e "${PURPLE}//═══════════════════════════════════════════════════════//${NC}" && sleep 0.2

# Quick status - count MCP servers, agents, skills (check both dev and consumer paths)
HOOKS_COUNT=$(ls -1 "$PROJECT_ROOT/.opencode/commands/"*.md 2>/dev/null | wc -l | tr -d ' ')

# MCP servers - check dist, then node_modules
MCPS_COUNT=$(ls -1 "$PROJECT_ROOT/dist/mcps/"*.server.js 2>/dev/null | wc -l | tr -d ' ')
if [ "$MCPS_COUNT" -eq 0 ]; then
    MCPS_COUNT=$(ls -1 "$PROJECT_ROOT/node_modules/strray-ai/dist/mcps/"*.server.js 2>/dev/null | wc -l | tr -d ' ')
fi

# Agents - check .opencode/agents (.yml files), then node_modules
AGENTS_COUNT=$(ls -1 "$PROJECT_ROOT/.opencode/agents/"*.yml 2>/dev/null | wc -l | tr -d ' ')
if [ "$AGENTS_COUNT" -eq 0 ]; then
    AGENTS_COUNT=$(ls -1 "$PROJECT_ROOT/node_modules/strray-ai/.opencode/agents/"*.yml 2>/dev/null | wc -l | tr -d ' ')
fi

# Skills - check .opencode/skills, then node_modules
SKILLS_COUNT=$(ls -1d "$PROJECT_ROOT/.opencode/skills/"* 2>/dev/null | wc -l | tr -d ' ')
if [ "$SKILLS_COUNT" -eq 0 ]; then
    SKILLS_COUNT=$(ls -1d "$PROJECT_ROOT/node_modules/strray-ai/.opencode/skills/"* 2>/dev/null | wc -l | tr -d ' ')
fi

# Plugin status (check both dev and consumer paths)
PLUGIN_DEV="$PROJECT_ROOT/.opencode/plugin/strray-codex-injection.js"
PLUGIN_DEV_PLURAL="$PROJECT_ROOT/.opencode/plugins/strray-codex-injection.js"
PLUGIN_CONSUMER="$PROJECT_ROOT/node_modules/strray-ai/.opencode/plugin/strray-codex-injection.js"
PLUGIN_CONSUMER_PLURAL="$PROJECT_ROOT/node_modules/strray-ai/.opencode/plugins/strray-codex-injection.js"

if [ -f "$PLUGIN_DEV" ]; then
    PLUGIN_STATUS="✅"
elif [ -f "$PLUGIN_DEV_PLURAL" ]; then
    PLUGIN_STATUS="✅"
elif [ -f "$PLUGIN_CONSUMER" ]; then
    PLUGIN_STATUS="✅"
elif [ -f "$PLUGIN_CONSUMER_PLURAL" ]; then
    PLUGIN_STATUS="✅"
else
    PLUGIN_STATUS="❌"
fi

# Framework config check
if [ ! -f "$PROJECT_ROOT/.opencode/enforcer-config.json" ]; then
    echo -e "${PURPLE}//   ❌ Framework configuration not found                     //${NC}"
    exit 1
fi

echo ""
echo "⚡ StringRay v$STRRAY_VERSION"
echo "🤖 Agents: $AGENTS_COUNT | ⚙️ MCPs: $MCPS_COUNT | 💡 Skills: $SKILLS_COUNT"

# BootOrchestrator check (check dev and consumer paths)
BOOT_ORCHESTRATOR_FOUND=false
if [ -f "$PROJECT_ROOT/src/core/boot-orchestrator.ts" ]; then
    BOOT_ORCHESTRATOR_FOUND=true
elif [ -f "$PROJECT_ROOT/node_modules/strray-ai/src/core/boot-orchestrator.ts" ]; then
    BOOT_ORCHESTRATOR_FOUND=true
elif [ -f "$PROJECT_ROOT/node_modules/strray-ai/dist/mcps/boot-orchestrator.server.js" ]; then
    BOOT_ORCHESTRATOR_FOUND=true
fi

if command -v node &> /dev/null && [ "$BOOT_ORCHESTRATOR_FOUND" = true ]; then
    echo "⚙️ BootOrchestrator: ✅"
fi

echo "✅ Framework ready"
echo "🔌 Plugin: $PLUGIN_STATUS"

INIT_TIME=$(($(date +%s) - START_TIME))
log "StrRay initialized in ${INIT_TIME}s"

sleep 1
exit 0
