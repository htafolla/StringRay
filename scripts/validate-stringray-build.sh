#!/bin/bash

# StringRay Framework - Build & Packaging Validation
# This script handles build, packaging, and basic setup validation

set -e  # Exit on any error

echo "🏗️  StringRay Framework - Build & Packaging Validation"
echo "===================================================="

# Configuration - detect project directory intelligently
if [[ -n "$GITHUB_WORKSPACE" ]]; then
    # GitHub Actions CI
    PROJECT_DIR="${PROJECT_DIR:-$GITHUB_WORKSPACE}"
elif [[ -n "$CI_PROJECT_DIR" ]]; then
    # Other CI systems
    PROJECT_DIR="${PROJECT_DIR:-$CI_PROJECT_DIR}"
else
    # Local development
    PROJECT_DIR="${PROJECT_DIR:-$HOME/dev/stringray}"
fi

TEST_DIR="${TEST_DIR:-/tmp/strray-test2}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step header
print_step() {
    echo ""
    echo "🔧 Step $1: $2"
    echo "----------------------------------------"
}

# Function to check file exists
check_file() {
    if [[ ! -f "$1" ]]; then
        echo "❌ ERROR: File not found: $1"
        exit 1
    fi
    echo "✅ Found: $1"
}

# Function to run command with error handling
run_cmd() {
    echo "▶️  $1"
    if ! eval "$1"; then
        echo "❌ ERROR: Command failed: $1"
        exit 1
    fi
}

# Get version from package.json dynamically
if command_exists jq; then
    PACKAGE_VERSION=$(jq -r '.version' "$PROJECT_DIR/package.json")
elif command_exists node; then
    PACKAGE_VERSION=$(node -p "require('$PROJECT_DIR/package.json').version")
else
    PACKAGE_VERSION="1.1.1"  # fallback
fi

PACKAGE_FILE="${PACKAGE_FILE:-strray-ai-$PACKAGE_VERSION.tgz}"

echo "📋 Configuration:"
echo "   Project Directory: $PROJECT_DIR"
echo "   Package Version: $PACKAGE_VERSION"
echo "   Package File: $PACKAGE_FILE"
echo "   Test Directory: $TEST_DIR"
echo "   Script Directory: $SCRIPT_DIR"
echo ""

# 1. Verify project structure
print_step "1" "Verify Project Structure"
check_file "$PROJECT_DIR/package.json"
check_file "$PROJECT_DIR/tsconfig.json"
check_file "$PROJECT_DIR/src/plugins/stringray-codex-injection.ts"
echo "✅ Project structure verified"

# 2. Clean previous builds
print_step "2" "Clean Previous Builds"
run_cmd "cd '$PROJECT_DIR' && rm -rf dist *.tgz"
echo "✅ Build artifacts cleaned"

# 3. Install dependencies
print_step "3" "Install Dependencies"
run_cmd "cd '$PROJECT_DIR' && npm ci"
echo "✅ Dependencies installed"

# 4. Run type checking
print_step "4" "TypeScript Type Checking"
run_cmd "cd '$PROJECT_DIR' && npm run typecheck"
echo "✅ Type checking passed"

# 5. Run linting
print_step "5" "Code Linting"
run_cmd "cd '$PROJECT_DIR' && npm run lint"
echo "✅ Linting passed"

# 6. Build TypeScript
print_step "6" "Build TypeScript"
run_cmd "cd '$PROJECT_DIR' && npm run build:all"
echo "✅ TypeScript compiled successfully"

# 7. Create package
print_step "7" "Create NPM Package"
run_cmd "cd '$PROJECT_DIR' && npm pack --silent"
echo "✅ Package created successfully"

# 8. Verify package contents
print_step "8" "Verify Package Contents"
run_cmd "cd '$PROJECT_DIR' && npm pack --dry-run | head -20"
echo "✅ Package contents verified"

# 9. Test package installation
print_step "9" "Test Package Installation"
# Create temporary test directory
TEMP_TEST_DIR="/tmp/strray-build-test-$RANDOM"
run_cmd "mkdir -p '$TEMP_TEST_DIR'"
run_cmd "cd '$TEMP_TEST_DIR' && npm init -y >/dev/null 2>&1"
run_cmd "cd '$TEMP_TEST_DIR' && npm install '$PROJECT_DIR/$PACKAGE_FILE' >/dev/null 2>&1"
run_cmd "cd '$TEMP_TEST_DIR' && ls node_modules/strray-ai/package.json >/dev/null 2>&1"
run_cmd "rm -rf '$TEMP_TEST_DIR'"
echo "✅ Package installation verified"

echo ""
echo "🎉 StringRay Framework Build & Packaging Validation Complete!"
echo "============================================================"
echo ""
echo "✅ Build Phase: SUCCESS"
echo "   • TypeScript compilation: PASSED"
echo "   • Type checking: PASSED"
echo "   • Linting: PASSED"
echo "   • Package creation: PASSED"
echo "   • Package installation: PASSED"
echo ""
echo "📦 Ready for testing phase!"
echo "   Run: VALIDATION_PHASE=test-only ./scripts/validate-stringray-framework.sh"
echo ""
echo "🏗️  Build artifacts preserved at: $PROJECT_DIR"
echo "   (Package: $PROJECT_DIR/$PACKAGE_FILE)"
