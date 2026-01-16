#!/bin/bash

# StrRay Framework NPM Installation Test Script
# Comprehensive automated testing of npm package installation and functionality

set -e

# Configuration
TEST_DIR="/tmp/strray-install-test-$(date +%s)"
PACKAGE_NAME="strray-ai"
TIMEOUT=300

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cleanup() {
    log_info "Cleaning up: $TEST_DIR"
    rm -rf "$TEST_DIR"
}

trap cleanup EXIT

# Timeout wrapper
run_with_timeout() {
    local timeout=$1
    shift
    (
        "$@" &
        pid=$!
        (sleep $timeout && kill $pid 2>/dev/null) &
        wait $pid
    )
}

log_info "Starting StrRay Framework NPM Installation Test"
log_info "Test Directory: $TEST_DIR"

# Create test directory
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Initialize npm project
log_info "Initializing npm project..."
npm init -y --silent

# Install package
log_info "Installing $PACKAGE_NAME..."
if ! run_with_timeout $TIMEOUT npm install $PACKAGE_NAME --silent; then
    log_error "Package installation failed"
    exit 1
fi

# Verify installation
if [ ! -d "node_modules/$PACKAGE_NAME" ]; then
    log_error "Package not found in node_modules"
    exit 1
fi
log_success "Package installed successfully"

# Run framework installation
log_info "Running framework installation..."
if ! run_with_timeout 120 npx $PACKAGE_NAME install; then
    log_error "Framework installation failed"
    exit 1
fi

# Verify files were created
expected_files=(".mcp.json" "opencode.json" ".opencode/oh-my-opencode.json")
for file in "${expected_files[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "Missing expected file: $file"
        exit 1
    fi
done
log_success "Framework installation completed"

# Run health check
log_info "Running health check..."
if ! run_with_timeout 60 npx $PACKAGE_NAME doctor; then
    log_error "Health check failed"
    exit 1
fi
log_success "Health check passed"

# Verify package integrity
log_info "Verifying package integrity..."
if [ ! -f "package.json" ]; then
    log_error "package.json missing"
    exit 1
fi

dep_count=$(jq '.dependencies | length' package.json 2>/dev/null || echo "0")
if [ "$dep_count" -le 0 ]; then
    log_error "No dependencies in package.json"
    exit 1
fi
log_success "Package integrity verified"

log_success "🎉 ALL TESTS PASSED - NPM Package installation is working correctly!"
log_info "Package: $PACKAGE_NAME"
log_info "Test Directory: $TEST_DIR"
log_info "Status: ✅ Fully operational"

exit 0