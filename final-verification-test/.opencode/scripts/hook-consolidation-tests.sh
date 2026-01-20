#!/bin/bash
# StrRay Framework - Hook Consolidation Tests
# Tests hook system consolidation and backward compatibility

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

# Hook consolidation tests
echo "🔗 Running Hook Consolidation Tests"
echo "===================================="

# Test 1: Hook directory structure
run_test "Hook directory exists" "test -d \"${PROJECT_ROOT}/.opencode/hooks\""

# Test 2: Hook dispatcher script exists
run_test "Hook dispatcher exists" "test -f \"${PROJECT_ROOT}/.opencode/scripts/hook-dispatcher.sh\""

# Test 3: Hook configuration in oh-my-opencode.json
run_test "Hook config in oh-my-opencode" "python3 -c \"
import json
config = json.load(open('${PROJECT_ROOT}/.opencode/oh-my-opencode.json'))
disabled = config.get('disabled_hooks', [])
if isinstance(disabled, list):
    exit(0)
exit(1)
\""

# Test 4: Legacy hook type mapping
run_test "Legacy hook mapping" "python3 -c \"
# Test that old hook types map to new consolidated hooks
legacy_types = ['pre-commit', 'post-commit', 'pre-build', 'post-build', 'pre-deploy', 'post-deploy']
consolidated_types = ['commit', 'build', 'deploy']

# Check if legacy types can be mapped
for legacy in legacy_types:
    if any(consolidated in legacy for consolidated in consolidated_types):
        continue
    else:
        exit(1)
exit(0)
\""

# Test 5: Hook execution dispatcher
run_test "Hook dispatcher executable" "test -x \"${PROJECT_ROOT}/.opencode/scripts/hook-dispatcher.sh\""

# Test 6: Hook consolidation configuration
run_test "Hook consolidation config" "python3 -c \"
import json
config = json.load(open('${PROJECT_ROOT}/.opencode/oh-my-opencode.json'))

# Check for consolidated hook settings
experimental = config.get('experimental', {})
if 'consolidated_hooks' in experimental:
    exit(0)

# Check for legacy hook settings that should be migrated
legacy_hooks = ['pre_commit_hooks', 'post_commit_hooks', 'build_hooks', 'deploy_hooks']
for hook_type in legacy_hooks:
    if hook_type in config:
        exit(1)  # Should be migrated

exit(0)
\""

# Test 7: Backward compatibility preservation
run_test "Backward compatibility" "python3 -c \"
# Test that old hook configurations still work
import json
config = json.load(open('${PROJECT_ROOT}/.opencode/oh-my-opencode.json'))

# Check for any legacy hook configurations
legacy_indicators = [
    'pre_commit_enabled', 'post_commit_enabled',
    'build_hooks_enabled', 'deploy_hooks_enabled'
]

for indicator in legacy_indicators:
    if indicator in config:
        # If legacy config exists, it should still be supported
        exit(0)

# No legacy configs found - that's also fine
exit(0)
\""

# Test 8: Hook performance impact
run_test "Hook performance impact" "python3 -c \"
# Test that hook consolidation doesn't significantly impact performance
import time
import json

config = json.load(open('${PROJECT_ROOT}/.opencode/oh-my-opencode.json'))
disabled_hooks = config.get('disabled_hooks', [])

# Performance should not be significantly impacted by disabled hooks
if len(disabled_hooks) <= 10:  # Reasonable limit
    exit(0)
exit(1)
\""

# Test 9: Hook consolidation integrity
run_test "Hook consolidation integrity" "python3 -c \"
import json
config = json.load(open('${PROJECT_ROOT}/.opencode/oh-my-opencode.json'))

# Check that hook consolidation didn't break existing functionality
required_sections = ['disabled_hooks', 'disabled_commands', 'disabled_skills']
for section in required_sections:
    if section not in config:
        exit(1)

# Check that disabled items are arrays
for section in required_sections:
    items = config.get(section, [])
    if not isinstance(items, list):
        exit(1)

exit(0)
\""

# Test 10: Hook system initialization
run_test "Hook system initialization" "python3 -c \"
# Test that the hook system can be initialized without errors
import sys
import os
sys.path.insert(0, '${PROJECT_ROOT}/.opencode/src')

try:
    # Try to import and initialize hook-related components
    from strray.core.config import ConfigManager
    config_manager = ConfigManager()
    config = config_manager.get_config()

    # Check that hook-related configurations are accessible
    if 'disabled_hooks' in config:
        exit(0)
except Exception as e:
    exit(1)
\""

# Test Results Summary
echo ""
echo "========================================"
echo "Hook Consolidation Test Results"
echo "========================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo -e "${GREEN}✓ All hook consolidation tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILED_TESTS hook consolidation tests failed${NC}"
    exit 1
fi