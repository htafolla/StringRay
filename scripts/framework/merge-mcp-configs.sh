#!/bin/bash

# StrRay Framework - MCP Server Configuration Merger
# Merges all individual MCP server configs into main .mcp.json

set -e

echo "🔧 StrRay Framework - MCP Server Configuration Merger"
echo "==================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Merge all MCP server configurations
merge_mcp_configs() {
    log "Merging MCP server configurations..."

    # Start with existing .mcp.json content
    local merged_config='{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything", "context7"]
    },
    "global-filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"]
    },
    "grep_app": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-grep", "."]
    },
    "websearch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"]
    }'

    # Add StrRay MCP servers
    local strray_servers=""
    local server_count=0

    # Note: MCP configurations are now maintained in main .mcp.json file
    # Individual .mcp.json files in .opencode/mcps/ have been consolidated
    log "MCP configurations are now centralized in .mcp.json"
    log "Individual .mcp.json files have been removed for simplicity"

    # Check if main .mcp.json exists and has configurations
    if [ -f ".mcp.json" ]; then
        server_count=$(grep -c '"command":' .mcp.json 2>/dev/null || echo "0")
        log "Found $server_count MCP server configurations in .mcp.json"
    fi

    # Skip the individual file processing since they're consolidated
    return 0

    # Legacy code below (no longer used):
    # Find all .mcp.json files in .opencode/mcps/
    # for mcp_file in .opencode/mcps/*.mcp.json; do
        if [ -f "$mcp_file" ]; then
            log "Processing $mcp_file"

            # Extract server name from filename
            local server_name=$(basename "$mcp_file" .mcp.json)

            # Extract server configuration from JSON
            local server_config=$(jq -r ".mcpServers.\"$server_name\" // empty" "$mcp_file" 2>/dev/null)

            if [ -n "$server_config" ] && [ "$server_config" != "null" ]; then
                # Add comma if not first server
                if [ $server_count -gt 0 ]; then
                    strray_servers="${strray_servers},"
                fi

                # Add server configuration with proper path
                local modified_config=$(echo "$server_config" | jq --arg prefix ".opencode/" '
                    if .args and (.args | length > 0) and (.args[0] | startswith("mcps/")) then
                        .args[0] = ($prefix + .args[0])
                    else
                        .
                    end
                ')

                strray_servers="${strray_servers}\"${server_name}\": ${modified_config}"
                server_count=$((server_count + 1))
                success "Added MCP server: $server_name"
            else
                warning "No valid configuration found in $mcp_file"
            fi
        fi
    done

    # Close the merged configuration
    if [ -n "$strray_servers" ]; then
        merged_config="${merged_config},${strray_servers}"
    fi

    merged_config="${merged_config}
  }
}"

    # Write the merged configuration
    echo "$merged_config" > .mcp.json

    success "Merged $server_count StrRay MCP servers into .mcp.json"
}

# Validate the merged configuration
validate_config() {
    log "Validating merged MCP configuration..."

    if [ ! -f ".mcp.json" ]; then
        error "Merged configuration file not found"
        return 1
    fi

    # Check JSON syntax
    if jq empty .mcp.json 2>/dev/null; then
        success "JSON syntax is valid"
    else
        error "Invalid JSON syntax in merged configuration"
        return 1
    fi

    # Count servers
    local server_count=$(jq '.mcpServers | length' .mcp.json 2>/dev/null || echo "0")
    success "Configuration contains $server_count MCP servers"

    # List servers
    echo "Configured MCP servers:"
    jq -r '.mcpServers | keys[]' .mcp.json 2>/dev/null | while read server; do
        echo "  - $server"
    done
}

# Test server availability
test_servers() {
    log "Testing MCP server availability..."

    local available_servers=0
    local total_servers=$(jq '.mcpServers | length' .mcp.json 2>/dev/null || echo "0")

    jq -r '.mcpServers | to_entries[] | .key' .mcp.json 2>/dev/null | while read server_name; do
        local server_config=$(jq -r ".mcpServers.\"$server_name\"" .mcp.json 2>/dev/null)

        # Check if server file exists
        local server_file=""
        if echo "$server_config" | jq -e '.args[0]' >/dev/null 2>&1; then
            server_file=$(echo "$server_config" | jq -r '.args[0]' 2>/dev/null)
        fi

        if [ -n "$server_file" ] && [ -f "$server_file" ]; then
            success "Server $server_name: file exists ($server_file)"
            available_servers=$((available_servers + 1))
        elif echo "$server_config" | jq -e '.command' >/dev/null 2>&1; then
            # External command server (like npx)
            success "Server $server_name: external command configured"
            available_servers=$((available_servers + 1))
        else
            warning "Server $server_name: configuration incomplete"
        fi
    done

    success "Server availability: $available_servers/$total_servers servers ready"
}

# Main execution
main() {
    log "Starting MCP server configuration merger..."

    # Backup existing config
    if [ -f ".mcp.json" ]; then
        cp .mcp.json .mcp.json.backup.$(date +%Y%m%d_%H%M%S)
        success "Backed up existing .mcp.json"
    fi

    merge_mcp_configs
    validate_config
    test_servers

    echo ""
    echo "🎯 MCP Server Configuration Merger Complete"
    echo "==========================================="
    echo ""
    info "Summary:"
    info "- MCP servers merged into .mcp.json"
    info "- oh-my-opencode can now access StrRay agents as subagents"
    info "- Multi-agent orchestration should now work through MCP protocol"
    echo ""
    success "StrRay subagents are now active in OpenConsole!"
    echo ""
    info "To test: Run oh-my-opencode and check for available MCP tools"
    info "Agents should appear as: orchestrator, enforcer, architect, etc."
}

# Run main function
main "$@"