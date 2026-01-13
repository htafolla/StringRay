#!/bin/bash

# StrRay Framework v1.0.0 - Plugin Deployment Script
#
# This script executes the complete StrRay plugin deployment process
# as documented in docs/PLUGIN_DEPLOYMENT_GUIDE.md
#
# Usage: ./scripts/deploy-strray-plugin.sh [test-env-name]
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
PACKAGE_NAME="strray-1.0.0.tgz"

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
        log_error "Not in StrRay project root directory"
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
    log_info "Building StrRay framework..."

    cd "$PROJECT_ROOT"

    # Clean and build
    npm run build:all

    # Verify build artifacts
    if [[ ! -f "dist/plugin/plugins/strray-codex-injection.js" ]]; then
        log_error "Plugin build failed - missing dist/plugin/plugins/strray-codex-injection.js"
        exit 1
    fi

    if [[ ! -f "dist/strray-init.js" ]]; then
        log_error "Framework build failed - missing dist/strray-init.js"
        exit 1
    fi

    log_success "Framework built successfully"
}

# Step 3: Create package
create_package() {
    log_info "Creating npm package..."

    cd "$PROJECT_ROOT"

    npm pack

    if [[ ! -f "$PACKAGE_NAME" ]]; then
        log_error "Package creation failed"
        exit 1
    fi

    PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
    log_success "Package created: $PACKAGE_NAME (${PACKAGE_SIZE})"
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
  "name": "strray-test-env",
  "version": "1.0.0",
  "description": "StrRay Plugin Test Environment",
  "dependencies": {}
}
EOF

    # Install StrRay package
    npm install "../$PACKAGE_NAME"

    # Verify installation
    if [[ ! -d "node_modules/strray" ]]; then
        log_error "StrRay installation failed"
        exit 1
    fi

    log_success "StrRay deployed to test environment"
}

# Step 5: Run tests
run_tests() {
    log_info "Running deployment tests..."

    cd "$PROJECT_ROOT/$TEST_ENV_NAME"

    # Test 1: Plugin loading
    log_info "Running plugin loading test..."
    if npm run --prefix .. test:plugin > /dev/null 2>&1; then
        log_success "Plugin loading test: PASSED"
    else
        log_error "Plugin loading test: FAILED"
        exit 1
    fi

    # Test 2: Orchestration functionality
    log_info "Running orchestration test..."
    if npm run --prefix .. test:orchestration > /dev/null 2>&1; then
        log_success "Orchestration test: PASSED"
    else
        log_error "Orchestration test: FAILED"
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
        if [[ ! -f "node_modules/strray/$component" ]]; then
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

    local report_file="deployment-report-$(date +%Y%m%d-%H%M%S).txt"

    cat > "$report_file" << EOF
StrRay Framework v1.0.0 - Deployment Report
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
    log_info "Starting StrRay Framework Plugin Deployment"
    echo "=============================================="

    pre_deployment_checks
    build_framework
    create_package
    deploy_to_test_env
    run_tests
    post_deployment_verification
    generate_report

    echo ""
    log_success "🎉 StrRay Framework Plugin Deployment COMPLETED!"
    log_info "Test environment: $PROJECT_ROOT/$TEST_ENV_NAME"
    log_info "Package: $PROJECT_ROOT/$PACKAGE_NAME"
    log_info "Documentation: $PROJECT_ROOT/docs/PLUGIN_DEPLOYMENT_GUIDE.md"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "StrRay Framework Plugin Deployment Script"
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