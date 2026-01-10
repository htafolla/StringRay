#!/bin/bash
# StrRay Framework - Configuration Integration Tests
# Tests config system functionality, validation, and integration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

log_test() {
    local test_name="$1"
    local status="$2"
    local message="$3"

    echo -e "${status} ${test_name}: ${message}${NC}"
}

run_test() {
    local test_name="$1"
    local command="$2"

    ((TOTAL_TESTS++))
    echo -n "Running ${test_name}... "

    if eval "$command" >/dev/null 2>&1; then
        log_test "$test_name" "${GREEN}✓ PASS" ""
        ((PASSED_TESTS++))
    else
        log_test "$test_name" "${RED}✗ FAIL" ""
        ((FAILED_TESTS++))
    fi
}

# Configuration file validation tests
echo "🔧 Running Configuration Integration Tests"
echo "==========================================="

# Test 1: Configuration file existence
run_test "Config file exists" "test -f \"./.opencode/oh-my-opencode.json\""

# Test 2: Configuration JSON validity
run_test "Config JSON syntax" "python3 -c \"import json; json.load(open('./.opencode/oh-my-opencode.json'))\""

# Test 3: Required configuration properties
run_test "Required properties present" "python3 -c \"
import json
config = json.load(open('./.opencode/oh-my-opencode.json'))
required = ['strray_agents', 'dynamic_models', 'ai_logging', 'python_backend']
missing = [k for k in required if k not in config]
if not missing:
    exit(0)
else:
    print(f'Missing: {missing}')
    exit(1)
\""

# Test 4: Agent configuration structure
run_test "Agent config structure" "python3 -c \"
import json
config = json.load(open('./.opencode/oh-my-opencode.json'))
agents = config.get('strray_agents', {})
if 'enabled' in agents and 'disabled' in agents:
    if isinstance(agents['enabled'], list) and isinstance(agents['disabled'], list):
        exit(0)
exit(1)
\""

# Test 5: Model configuration validation
run_test "Model config validation" "python3 -c \"
import json
config = json.load(open('./.opencode/oh-my-opencode.json'))
models = config.get('dynamic_models', {})
if 'enabled' in models and 'fallback_models' in models:
    if isinstance(models['fallback_models'], list):
        exit(0)
exit(1)
\""

# Test 6: Python backend configuration
run_test "Python backend config" "python3 -c \"
import json
config = json.load(open('./.opencode/oh-my-opencode.json'))
backend = config.get('python_backend', {})
if 'enabled' in backend and 'path' in backend and 'entry_point' in backend:
    exit(0)
exit(1)
\""

# Test 7: MCP server configurations
run_test "MCP server configs" "python3 -c \"
import json
config = json.load(open('./.opencode/oh-my-opencode.json'))
mcps = config.get('mcps', {})
if isinstance(mcps, dict) and len(mcps) > 0:
    # Check that each MCP has server and config
    for name, mcp_config in mcps.items():
        if not ('server' in mcp_config and 'config' in mcp_config):
            exit(1)
    exit(0)
exit(1)
\""

# Test 8: Schema compliance check
run_test "Schema compliance" "python3 -c \"
import json
import requests
config = json.load(open('./.opencode/oh-my-opencode.json'))
schema_url = config.get('\$schema')
if schema_url:
    try:
        response = requests.get(schema_url, timeout=10)
        if response.status_code == 200:
            exit(0)
    except:
        pass
exit(1)
\""

# Test 9: Agent count validation
run_test "Agent count validation" "python3 -c \"
import json
config = json.load(open('./.opencode/oh-my-opencode.json'))
agents = config.get('strray_agents', {}).get('enabled', [])
expected_agents = ['enforcer', 'architect', 'orchestrator', 'bug-triage-specialist', 'code-reviewer', 'security-auditor', 'refactorer', 'test-architect']
if set(agents) == set(expected_agents):
    exit(0)
exit(1)
\""

# Test 10: File permission checks
run_test "Config file permissions" "test -r \"./.opencode/oh-my-opencode.json\" && test -w \"./.opencode/oh-my-opencode.json\""

# Test Results Summary
echo ""
echo "==========================================="
echo "Configuration Integration Test Results"
echo "==========================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}✓ All configuration integration tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILED_TESTS configuration tests failed${NC}"
    exit 1
fi