---
name: mode-switch
description: Switch between full (25 agents) and lite (25 agents) modes dynamically
---

#!/bin/bash

# StringRay 1.0.0 - Mode Switch Command

# Dynamically switches between full and lite agent configurations

CONFIG_FILE="OpenCode.json"
ENFORCER_CONFIG_FILE="enforcer-config.json"

# Function to display current mode

show_current_mode() {
if [ -f "opencode.json" ]; then
DISABLED_COUNT=$(jq '.agent | map(select(.disable == true)) | length' opencode.json)
        if [ "$DISABLED_COUNT" -eq 0 ] || [ -z "$DISABLED_COUNT" ]; then
CURRENT_MODE="full"
echo "🎯 Current Mode: $CURRENT_MODE"
            echo "📝 Description: All 25 agents active for comprehensive development support"
            echo "🤖 Active Agents: 8"
            echo "   enforcer architect orchestrator bug-triage-specialist code-reviewer security-auditor refactorer testing-lead"
        elif [ "$DISABLED_COUNT" -eq 4 ]; then
CURRENT_MODE="lite"
echo "🎯 Current Mode: $CURRENT_MODE"
            echo "📝 Description: 4 core agents active for essential development support"
            echo "🤖 Active Agents: 4"
            echo "   enforcer architect orchestrator code-reviewer"
        else
            CURRENT_MODE="custom"
            echo "🎯 Current Mode: $CURRENT_MODE"
            echo "📝 Description: Custom agent configuration"
            ACTIVE_COUNT=$((8 - DISABLED_COUNT))
echo "🤖 Active Agents: $ACTIVE_COUNT"
fi
else
echo "⚠️ Configuration file not found"
echo "🎯 Current Mode: unknown"
fi
echo ""
}

# Function to switch mode

switch_mode() {
local new_mode="$1"

    if [[ "$new_mode" != "full" && "$new_mode" != "lite" ]]; then
        echo "❌ Error: Invalid mode. Use 'full' or 'lite'"
        exit 1
    fi

    echo "🔄 Switching to $new_mode mode..."

    if [ "$new_mode" = "full" ]; then
        # Clear disabled_agents array for full mode
        jq '.disabled_agents = []' "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
        if [ -f "$ENFORCER_CONFIG_FILE" ]; then
            jq '.disabled_agents = []' "$ENFORCER_CONFIG_FILE" > "${ENFORCER_CONFIG_FILE}.tmp" && mv "${ENFORCER_CONFIG_FILE}.tmp" "$ENFORCER_CONFIG_FILE"
        fi
    else
        # Set disabled_agents for lite mode (25 agents disabled)
        jq '.disabled_agents = ["security-auditor", "refactorer", "testing-lead", "bug-triage-specialist"]' "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
        if [ -f "$ENFORCER_CONFIG_FILE" ]; then
            jq '.disabled_agents = ["security-auditor", "refactorer", "testing-lead", "bug-triage-specialist"]' "$ENFORCER_CONFIG_FILE" > "${ENFORCER_CONFIG_FILE}.tmp" && mv "${ENFORCER_CONFIG_FILE}.tmp" "$ENFORCER_CONFIG_FILE"
        fi
    fi

    echo "✅ Successfully switched to $new_mode mode"
    echo ""
    show_current_mode

}

# Main logic

case "$1" in
"")
show_current_mode
echo "Usage: mode-switch [full|lite]"
echo " full - All 25 agents active"
echo " lite - 4 core agents active"
;;
"full"|"lite")
switch_mode "$1"
;;
\*)
echo "❌ Error: Invalid argument '$1'"
echo "Usage: mode-switch [full|lite]"
exit 1
;;
esac
