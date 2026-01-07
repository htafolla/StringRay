#!/bin/bash

# Dynamic Model Loader for StrRay Framework
# Queries OpenCode for available models and selects optimal ones per agent type

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/.model_cache.json"
CACHE_TTL=3600  # 1 hour cache
OPENCODE_CMD="${OPENCODE_CMD:-opencode}"

# Logging functions
log_info() {
    echo "[INFO] $1" >&2
}

log_error() {
    echo "[ERROR] $1" >&2
}

log_warn() {
    echo "[WARN] $1" >&2
}

# Check if cache is valid
is_cache_valid() {
    if [[ ! -f "$CACHE_FILE" ]]; then
        return 1
    fi

    local cache_age
    cache_age=$(($(date +%s) - $(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE" 2>/dev/null)))

    if [[ $cache_age -gt $CACHE_TTL ]]; then
        return 1
    fi

    return 0
}

# Query OpenCode for available models
query_available_models() {
    log_info "Querying OpenCode for available models..."

    if ! command -v "$OPENCODE_CMD" &> /dev/null; then
        log_error "OpenCode CLI not found. Please install OpenCode or set OPENCODE_CMD environment variable."
        return 1
    fi

    # Try to get model list from OpenCode
    local models_output
    if ! models_output=$("$OPENCODE_CMD" model list 2>/dev/null); then
        log_warn "Failed to query models via 'opencode model list', trying alternative methods..."

        # Try alternative command
        if ! models_output=$("$OPENCODE_CMD" models 2>/dev/null); then
            log_error "Unable to query available models from OpenCode"
            return 1
        fi
    fi

    echo "$models_output"
}

# Parse model list and create structured data
parse_models() {
    local models_output="$1"

    # Initialize JSON structure
    local models_json="{}"

    # Parse the output - this will depend on OpenCode's actual output format
    # For now, we'll create a mock structure based on what we know works
    models_json=$(
        cat <<EOF
{
  "models": [
    "opencode/grok-code",
    "gpt-4o",
    "gpt-5.2",
    "google/gemini-3-pro-high",
    "google/gemini-3-flash",
    "opencode/grok-code"
  ],
  "providers": {
    "grok": ["opencode/grok-code"],
    "openai": ["gpt-4o", "gpt-5.2"],
    "google": ["google/gemini-3-pro-high", "google/gemini-3-flash"],
    "anthropic": []
  },
  "capabilities": {
    "opencode/grok-code": ["coding", "fast", "reasoning", "analysis"],
    "gpt-4o": ["coding", "reasoning", "analysis"],
    "gpt-5.2": ["coding", "reasoning", "analysis", "refactoring"],
    "google/gemini-3-pro-high": ["reasoning", "analysis"],
    "google/gemini-3-flash": ["fast", "basic"]
  }
}
EOF
    )

    echo "$models_json"
}

# Cache models data
cache_models() {
    local models_json="$1"
    echo "$models_json" > "$CACHE_FILE"
    log_info "Cached model data to $CACHE_FILE"
}

# Load models from cache or query
load_models() {
    if is_cache_valid; then
        log_info "Using cached model data"
        cat "$CACHE_FILE"
        return 0
    fi

    log_info "Cache invalid or missing, querying OpenCode..."
    local models_output
    if ! models_output=$(query_available_models); then
        log_error "Failed to load models from OpenCode"
        return 1
    fi

    local models_json
    models_json=$(parse_models "$models_output")

    cache_models "$models_json"
    echo "$models_json"
}

# Select optimal model for agent type
select_model_for_agent() {
    local agent_type="$1"
    local models_json="$2"

    # Extract available models
    local available_models
    available_models=$(echo "$models_json" | jq -r '.models[]' 2>/dev/null || echo "")

    if [[ -z "$available_models" ]]; then
        log_warn "No models available, using fallback"
        echo "opencode/grok-code"
        return 0
    fi

    # Agent-specific selection logic
    case "$agent_type" in
        "enforcer")
            # Enforcer needs compliance checking - prefers reasoning models
            for model in "opencode/grok-code" "gpt-5.2" "opencode/grok-code" "gpt-4o"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "architect")
            # Architect needs design and architecture analysis
            for model in "gpt-5.2" "opencode/grok-code" "opencode/grok-code" "gpt-4o"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "orchestrator")
            # Orchestrator needs coordination and planning
            for model in "opencode/grok-code" "gpt-5.2" "opencode/grok-code" "gpt-4o"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "bug-triage-specialist")
            # Bug triage needs analysis and debugging
            for model in "gpt-5.2" "opencode/grok-code" "opencode/grok-code" "gpt-4o"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "code-reviewer")
            # Code reviewer needs detailed analysis
            for model in "gpt-5.2" "opencode/grok-code" "gpt-4o" "opencode/grok-code"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "refactorer")
            # Refactorer needs deep code understanding
            for model in "gpt-5.2" "opencode/grok-code" "gpt-4o" "opencode/grok-code"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "security-auditor")
            # Security auditor needs thorough analysis
            for model in "opencode/grok-code" "gpt-5.2" "opencode/grok-code" "gpt-4o"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "test-architect")
            # Test architect needs systematic thinking
            for model in "google/gemini-3-pro-high" "gpt-5.2" "opencode/grok-code" "opencode/grok-code"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "librarian")
            # Librarian needs broad knowledge access
            for model in "google/gemini-3-flash" "gpt-4o" "opencode/grok-code" "google/gemini-3-pro-high"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "explore")
            # Explore needs fast information gathering
            for model in "google/gemini-3-flash" "opencode/grok-code" "gpt-4o" "google/gemini-3-pro-high"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "frontend-ui-ux-engineer")
            # UI/UX engineer needs creative and design capabilities
            for model in "google/gemini-3-pro-high" "gpt-4o" "opencode/grok-code" "gpt-5.2"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "document-writer")
            # Document writer needs clear communication
            for model in "google/gemini-3-flash" "gpt-4o" "opencode/grok-code" "google/gemini-3-pro-high"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        "multimodal-looker")
            # Multimodal needs image/text understanding
            for model in "google/gemini-3-pro-high" "google/gemini-3-flash" "gpt-4o" "opencode/grok-code"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
        *)
            # Default fallback
            for model in "opencode/grok-code" "gpt-4o" "google/gemini-3-flash"; do
                if echo "$available_models" | grep -q "^${model}$"; then
                    echo "$model"
                    return 0
                fi
            done
            ;;
    esac

    # If no preferred model found, use first available
    echo "$available_models" | head -1
}

# Main function
main() {
    local agent_type="$1"

    if [[ -z "$agent_type" ]]; then
        log_error "Usage: $0 <agent_type>"
        log_error "Available agent types: enforcer, architect, orchestrator, bug-triage-specialist, code-reviewer, refactorer, security-auditor, test-architect, librarian, explore, frontend-ui-ux-engineer, document-writer, multimodal-looker"
        exit 1
    fi

    local models_json
    if ! models_json=$(load_models); then
        log_warn "Failed to load models from OpenCode, using fallback configuration"
        # Fallback to hardcoded defaults
        select_model_for_agent "$agent_type" '{
          "models": ["opencode/grok-code", "gpt-4o", "gpt-5.2", "google/gemini-3-pro-high", "google/gemini-3-flash"]
        }'
        exit 0
    fi

    select_model_for_agent "$agent_type" "$models_json"
}

# Run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi