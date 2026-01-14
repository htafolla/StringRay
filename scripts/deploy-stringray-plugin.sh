#!/bin/bash

# StringRay Framework v1.0.0 - Plugin Deployment Script
#
# This script executes the complete StringRay plugin deployment process
# as documented in docs/PLUGIN_DEPLOYMENT_GUIDE.md
#
# Usage: ./scripts/deploy-stringray-plugin.sh [test-env-name]
#
# @version 1.0.0
# @since 2026-01-12

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEST_ENV_NAME="${1:-test-install}"
PACKAGE_NAME="stringray-ai-1.0.9.tgz"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check Node.js version
    if ! node --version | grep -qE "v(18|20)\."; then
        log_error "Node.js v18+ required. Found: $(node --version)"
        exit 1
    fi

    # Check if we're in the right directory
    if [[ ! -f "package.json" ]] || [[ ! -d "src" ]] || [[ ! -d "scripts" ]]; then
        log_error "Not in StringRay project root directory"
        exit 1
    fi

    # Check for existing package
    if [[ -f "$PACKAGE_NAME" ]]; then
        log_warning "Removing existing package: $PACKAGE_NAME"
        rm -f "$PACKAGE_NAME"
    fi

    log_success "Pre-deployment checks passed"
}

# Step 2: Build framework
build_framework() {
    log_info "Building StringRay framework..."

    cd "$PROJECT_ROOT"

    # Clean and build
    npm run build:all

    # Verify build artifacts
    if [[ ! -f "dist/plugin/plugins/strray-codex-injection.js" ]]; then
        log_error "Plugin build failed - missing dist/plugin/plugins/strray-codex-injection.js"
        exit 1
    fi

if [[ ! -f "dist/index.js" ]]; then
    log_error "Framework build failed - missing dist/index.js"
        exit 1
    fi

    log_success "Framework built successfully"
}

# Step 3: Create package
create_package() {
    log_info "Creating npm package..."

    cd "$PROJECT_ROOT"

    # Redirect npm pack output to avoid timeout from verbose output
    npm pack > /tmp/npm-pack.log 2>&1

    if [[ ! -f "$PACKAGE_NAME" ]]; then
        log_error "Package creation failed"
        cat /tmp/npm-pack.log
        exit 1
    fi

    PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
    FILE_COUNT=$(tar -tzf "$PACKAGE_NAME" | wc -l)
    log_success "Package created: $PACKAGE_NAME (${PACKAGE_SIZE}, ${FILE_COUNT} files)"
}

# Step 4: Deploy to test environment
deploy_to_test_env() {
    log_info "Deploying to test environment: $TEST_ENV_NAME"

    cd "$PROJECT_ROOT"

    # Clean up existing test environment
    if [[ -d "$TEST_ENV_NAME" ]]; then
        log_warning "Removing existing test environment: $TEST_ENV_NAME"
        rm -rf "$TEST_ENV_NAME"
    fi

    # Create test environment
    mkdir -p "$TEST_ENV_NAME"
    cd "$TEST_ENV_NAME"

    # Initialize package.json for test
    cat > package.json << EOF
{
      "name": "stringray-test-env",
  "version": "1.0.0",
  "description": "StringRay Plugin Test Environment",
  "dependencies": {}
}
EOF

    # Install StringRay package
    npm install "../$PACKAGE_NAME"

    # Verify installation
    if [[ ! -d "node_modules/stringray" ]]; then
        log_error "StringRay installation failed"
        exit 1
    fi

    log_success "StringRay deployed to test environment"
}

# Step 5: Run tests
run_tests() {
    log_info "Running deployment tests..."

    cd "$PROJECT_ROOT/$TEST_ENV_NAME"

    # Test 1: Plugin loading (Phase 4 - Full Framework Initialization)
    log_info "Running plugin loading test (Phase 4 - allowing full framework initialization)..."
    # Use standalone test script that handles timeouts properly
    if bash "../scripts/test-full-plugin-no-timeout.sh" > /tmp/plugin-test.log 2>&1; then
        log_success "Plugin loading test: PASSED (full framework initialization complete)"
    else
        log_error "Plugin loading test: FAILED"
        echo "=== PLUGIN TEST LOG ==="
        cat /tmp/plugin-test.log
        exit 1
    fi

    # Test 2: Core functionality validation (fast focused tests)
    log_info "Running core functionality tests..."
    if npm run --prefix .. test:architect > /tmp/core-test.log 2>&1; then
        log_success "Core functionality test: PASSED"
    else
        log_error "Core functionality test: FAILED"
        cat /tmp/core-test.log | tail -20
        exit 1
    fi

    # Test 3: MCP Server Connectivity
    log_info "Running MCP server connectivity tests..."
    if npm run --prefix .. test:mcp-connectivity > /tmp/mcp-test.log 2>&1; then
        log_success "MCP connectivity test: PASSED"
    else
        log_error "MCP connectivity test: FAILED"
        cat /tmp/mcp-test.log | tail -10
        exit 1
    fi

    # Test 4: oh-my-opencode Integration
    log_info "Running oh-my-opencode integration tests..."
    if npm run --prefix .. test:oh-my-opencode-integration > /tmp/integration-test.log 2>&1; then
        log_success "oh-my-opencode integration test: PASSED"
    else
        log_error "oh-my-opencode integration test: FAILED"
        cat /tmp/integration-test.log | tail -10
        exit 1
    fi

    # Test 5: External Process Communication
    log_info "Running external process communication tests..."
    if npm run --prefix .. test:external-processes > /tmp/process-test.log 2>&1; then
        log_success "External process communication test: PASSED"
    else
        log_error "External process communication test: FAILED"
        cat /tmp/process-test.log | tail -10
        exit 1
    fi

    log_success "All tests passed"
}

# Step 6: Post-deployment verification
post_deployment_verification() {
    log_info "Running post-deployment verification..."

    cd "$PROJECT_ROOT/$TEST_ENV_NAME"

    # Check framework components
    local components=(
        "dist/plugin/plugins/strray-codex-injection.js"
        "dist/mcps/knowledge-skills/code-review.server.js"
        "dist/mcps/enforcer-tools.server.js"
        "dist/orchestrator/enhanced-multi-agent-orchestrator.js"
    )

    local missing_components=()
    for component in "${components[@]}"; do
        if [[ ! -f "node_modules/stringray/$component" ]]; then
            missing_components+=("$component")
        fi
    done

    if [[ ${#missing_components[@]} -gt 0 ]]; then
        log_error "Missing components: ${missing_components[*]}"
        exit 1
    fi

    log_success "All framework components verified"
}

# Step 7: Generate deployment report
generate_report() {
    log_info "Generating deployment report..."

    cd "$PROJECT_ROOT"

    local report_file="reports/deployment/deployment-report-$(date +%Y%m%d-%H%M%S).txt"

    cat > "$report_file" << EOF
StringRay Framework v1.0.0 - Deployment Report
==========================================

Deployment Date: $(date)
Test Environment: $TEST_ENV_NAME
Package: $PACKAGE_NAME
Status: SUCCESS

Build Information:
- Node.js: $(node --version)
- npm: $(npm --version)
- TypeScript: $(npx tsc --version 2>/dev/null || echo "N/A")

Package Details:
- Size: $(du -h "$PACKAGE_NAME" | cut -f1)
- Files: $(tar -tzf "$PACKAGE_NAME" | wc -l) files

Test Results:
- Plugin Loading: PASSED
- Orchestration: PASSED
- Component Verification: PASSED

Next Steps:
1. Review oh-my-opencode.json configuration
2. Test integration with oh-my-opencode
3. Deploy to production environment
4. Update documentation if needed

For troubleshooting, see: docs/PLUGIN_DEPLOYMENT_GUIDE.md
EOF

    log_success "Deployment report generated: $report_file"
}

# Main deployment process
main() {
    log_info "Starting StringRay Framework Plugin Deployment"
    echo "=============================================="

    pre_deployment_checks
    build_framework
    create_package
    deploy_to_test_env
    run_tests
    post_deployment_verification
    generate_report

    echo ""
    log_success "🎉 StringRay Framework Plugin Deployment COMPLETED!"
    log_info "Test environment: $PROJECT_ROOT/$TEST_ENV_NAME"
    log_info "Package: $PROJECT_ROOT/$PACKAGE_NAME"
    log_info "Documentation: $PROJECT_ROOT/docs/PLUGIN_DEPLOYMENT_GUIDE.md"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "StringRay Framework Plugin Deployment Script"
        echo ""
        echo "Usage: $0 [test-env-name]"
        echo ""
        echo "Arguments:"
        echo "  test-env-name    Name of test environment directory (default: test-install)"
        echo ""
        echo "Examples:"
        echo "  $0                    # Deploy to 'test-install'"
        echo "  $0 staging-env       # Deploy to 'staging-env'"
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac