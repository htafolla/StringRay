#!/bin/bash

# StrRay Framework Deployment Pipeline Script - necessary for complex multi-step deployment process
# Handles version management, testing, and publishing with proper error handling

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VERSION_TYPE="${1:-patch}"
DRY_RUN="${2:-false}"

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

cd "$PROJECT_ROOT"

if [ "$DRY_RUN" = "true" ]; then
    log_warning "DRY RUN MODE - No changes will be made"
fi

log_info "Starting StrRay Framework Deployment Pipeline"
log_info "Version Type: $VERSION_TYPE"
log_info "Project Root: $PROJECT_ROOT"

# Step 1: Pre-deployment checks
log_info "Step 1: Pre-deployment validation..."
npm run test:all
npm run lint
npm run typecheck
npm audit --audit-level moderate
log_success "Pre-deployment checks passed"

# Step 2: Version management
log_info "Step 2: Version management..."
CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "Current version: $CURRENT_VERSION"

if [ "$DRY_RUN" = "true" ]; then
    log_warning "Would bump version from $CURRENT_VERSION to next $VERSION_TYPE"
    NEW_VERSION="$CURRENT_VERSION"
else
    # Bump version
    npm version $VERSION_TYPE --no-git-tag-version --no-commit-hooks
    NEW_VERSION=$(node -p "require('./package.json').version")
    log_success "Version bumped to: $NEW_VERSION"

    # Run universal version manager
    log_info "Running universal version manager..."
    node scripts/universal-version-manager.js
    log_success "Version references updated across codebase"
fi

# Step 3: Build
log_info "Step 3: Building package..."
npm run build:all
log_success "Build completed"

# Step 4: Test deployment
log_info "Step 4: Testing deployment..."
if [ "$DRY_RUN" = "true" ]; then
    log_warning "Would test deployment with test-npm-install.sh"
else
    bash scripts/test-npm-install.sh
    log_success "Deployment test passed"
fi

# Step 5: Package validation
log_info "Step 5: Package validation..."
npm pack --dry-run
log_success "Package validation passed"

# Step 6: Publish (only if not dry run)
if [ "$DRY_RUN" = "true" ]; then
    log_warning "DRY RUN - Would publish to npm"
    log_info "To publish for real, run: $0 $VERSION_TYPE"
else
    log_info "Step 6: Publishing to npm..."
    npm publish --tag latest
    log_success "Published to npm successfully!"

    # Create git tag
    log_info "Creating git tag..."
    git add .
    git commit -m "chore: release v$NEW_VERSION" || true
    git tag "v$NEW_VERSION"
    git push origin main
    git push origin "v$NEW_VERSION"
    log_success "Git tag created and pushed"
fi

log_success "🎉 Deployment pipeline completed successfully!"
echo ""
echo "📋 Summary:"
echo "  Previous Version: $CURRENT_VERSION"
echo "  New Version: $NEW_VERSION"
echo "  Published: $([ "$DRY_RUN" = "true" ] && echo "No (dry run)" || echo "Yes")"
echo "  Git Tag: $([ "$DRY_RUN" = "true" ] && echo "Not created (dry run)" || echo "v$NEW_VERSION")"
echo ""
echo "🔗 NPM Package: https://www.npmjs.com/package/strray-ai/v/$NEW_VERSION"