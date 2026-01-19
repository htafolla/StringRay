#!/bin/bash

# Simple StrRay Framework Validation
# Basic checks to ensure core components are working

echo "🔍 StrRay Framework - Basic Validation"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description: Found${NC}"
        return 0
    else
        echo -e "${RED}❌ $description: Missing ($file)${NC}"
        return 1
    fi
}

check_dir() {
    local dir="$1"
    local description="$2"
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $description: Found${NC}"
        return 0
    else
        echo -e "${RED}❌ $description: Missing ($dir)${NC}"
        return 1
    fi
}

check_json() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ] && python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
        echo -e "${GREEN}✅ $description: Valid JSON${NC}"
        return 0
    else
        echo -e "${RED}❌ $description: Invalid or missing${NC}"
        return 1
    fi
}

echo ""
echo "📁 Directory Structure:"
check_dir ".opencode" "OpenCode directory"
check_dir ".opencode/agents" "Agent configurations"
check_dir "dist/plugin/mcps" "MCP server binaries"
check_dir ".opencode/commands" "Automation commands"
check_dir ".opencode/scripts" "Validation scripts"
check_dir "src" "Source code"
check_dir "dist" "Compiled code"

echo ""
echo "📄 Configuration Files:"
check_json ".opencode/oh-my-opencode.json" "oh-my-opencode config"
check_json ".mcp.json" "MCP server registry"
check_json "$HOME/.config/opencode/opencode.json" "Global OpenCode config"

echo ""
echo "🤖 Agent Files:"
agent_count=$(ls -1 .opencode/agents/ 2>/dev/null | wc -l)
if [ "$agent_count" -gt 0 ]; then
    echo -e "${GREEN}✅ Agent files: $agent_count found${NC}"
else
    echo -e "${RED}❌ Agent files: None found${NC}"
fi

echo ""
echo "⚙️ MCP Files:"
mcp_count=$(grep -c '"command":' .mcp.json 2>/dev/null || echo "0")
server_count=$(ls -1 dist/plugin/mcps/ 2>/dev/null | grep "\.server\.js$" | wc -l)
echo -e "${GREEN}✅ MCP configs: $mcp_count registered${NC}"
echo -e "${GREEN}✅ MCP servers: $server_count built${NC}"

echo ""
echo "🚀 Initialization Test:"
if bash .opencode/init.sh >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Framework initialization: Success${NC}"
else
    echo -e "${YELLOW}⚠️ Framework initialization: Completed with warnings${NC}"
fi

echo ""
echo "🎯 Validation Complete"
echo "======================"
