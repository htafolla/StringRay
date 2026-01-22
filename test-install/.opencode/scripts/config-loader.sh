#!/bin/bash
# StrRay Framework - Configuration Loader
# Loads and validates framework configuration with environment-specific overrides

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CONFIG_FILE="${PROJECT_ROOT}/.opencode/oh-my-opencode.json"

echo "🔧 StrRay Configuration Loader"
echo "=============================="

# Validate configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}✗ Configuration file not found: $CONFIG_FILE${NC}"
    exit 1
fi

echo "Loading configuration from: $CONFIG_FILE"

# Validate JSON syntax
if ! python3 -c "import json; json.load(open('$CONFIG_FILE'))" >/dev/null 2>&1; then
    echo -e "${RED}✗ Invalid JSON syntax in configuration file${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuration file loaded successfully${NC}"

# Validate required sections
REQUIRED_SECTIONS=("strray_agents" "dynamic_models" "ai_logging" "python_backend")

for section in "${REQUIRED_SECTIONS[@]}"; do
    if ! python3 -c "
import json
config = json.load(open('$CONFIG_FILE'))
if '$section' not in config:
    exit(1)
exit(0)
" >/dev/null 2>&1; then
        echo -e "${RED}✗ Missing required section: $section${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ All required configuration sections present${NC}"

# Validate StrRay agents configuration
if ! python3 -c "
import json
config = json.load(open('$CONFIG_FILE'))
agents = config.get('strray_agents', {})
enabled = agents.get('enabled', [])
disabled = agents.get('disabled', [])

if not isinstance(enabled, list) or not isinstance(disabled, list):
    exit(1)

expected_agents = ['enforcer', 'architect', 'orchestrator', 'bug-triage-specialist', 'code-reviewer', 'security-auditor', 'refactorer', 'test-architect']
if set(enabled) != set(expected_agents):
    exit(1)

exit(0)
" >/dev/null 2>&1; then
    echo -e "${RED}✗ Invalid StrRay agents configuration${NC}"
    exit 1
fi

echo -e "${GREEN}✓ StrRay agents configuration valid${NC}"

# Validate model configuration
if ! python3 -c "
import json
config = json.load(open('$CONFIG_FILE'))
models = config.get('dynamic_models', {})
if 'enabled' not in models or 'fallback_models' not in models:
    exit(1)
if not isinstance(models.get('fallback_models', []), list):
    exit(1)
exit(0)
" >/dev/null 2>&1; then
    echo -e "${RED}✗ Invalid dynamic models configuration${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dynamic models configuration valid${NC}"

# Validate MCP server configurations
if ! python3 -c "
import json
config = json.load(open('$CONFIG_FILE'))
mcps = config.get('mcps', {})
if not isinstance(mcps, dict):
    exit(1)

for name, mcp_config in mcps.items():
    if not isinstance(mcp_config, dict):
        exit(1)
    if 'server' not in mcp_config or 'config' not in mcp_config:
        exit(1)
exit(0)
" >/dev/null 2>&1; then
    echo -e "${RED}✗ Invalid MCP server configurations${NC}"
    exit 1
fi

echo -e "${GREEN}✓ MCP server configurations valid${NC}"

# Validate Python backend configuration
if ! python3 -c "
import json
config = json.load(open('$CONFIG_FILE'))
backend = config.get('python_backend', {})
required_keys = ['enabled', 'path', 'entry_point']
for key in required_keys:
    if key not in backend:
        exit(1)
exit(0)
" >/dev/null 2>&1; then
    echo -e "${RED}✗ Invalid Python backend configuration${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python backend configuration valid${NC}"

# Check for deprecated configurations
DEPRECATED_KEYS=("framework_thresholds" "universal_development_framework" "model_routing")

for key in "${DEPRECATED_KEYS[@]}"; do
    if python3 -c "
import json
config = json.load(open('$CONFIG_FILE'))
if '$key' in config:
    exit(1)
exit(0)
" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Deprecated configuration key found: $key${NC}"
        echo "   Consider removing this key as it may cause compatibility issues"
    fi
done

echo ""
echo -e "${GREEN}🎉 Configuration validation completed successfully!${NC}"
echo ""
echo "StrRay Framework is ready to use."
echo "Run 'bash .opencode/init.sh' to initialize the framework."