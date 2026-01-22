# Universal Version Manager Pipeline

## Overview

The StringRay Framework implements a comprehensive version management pipeline across three key integration points: Git Hooks, CI/CD Pipeline, and Pre/Post Processor. This ensures version consistency and automated management throughout the development lifecycle.

## Pipeline Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Git Hooks     │ -> │  CI/CD Pipeline  │ -> │ Pre/Post Proc   │
│ (Prevention)    │    │  (Automation)    │    │ (Validation)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 1. Git Hooks - Prevention Layer
**Location**: `.githooks/pre-commit`
**Purpose**: Prevent inconsistent versions from entering the repository
**Trigger**: Before each commit
**Action**: Block commits with version inconsistencies

```bash
# Runs automatically before each commit
✅ Version consistency validation
❌ Blocks commit if versions don't match
💡 Provides clear fix instructions
```

### 2. CI/CD Pipeline - Automation Layer
**Location**: `.github/workflows/ci-cd.yml`
**Purpose**: Automated version management after validation
**Trigger**: After all tests pass on main branch
**Action**: Bump version, update references, publish

```yaml
# CI/CD Pipeline Flow:
1. Run all tests (unit, integration, e2e)
2. Validate deployment
3. Version bump (patch/minor/major)
4. Universal version manager updates all references
5. Rebuild with new version
6. Publish to NPM
7. Create git tag
```

### 3. Pre/Post Processor - Validation Layer
**Location**: `src/hooks/validation-hooks.ts`
**Purpose**: Development-time version awareness
**Trigger**: During agent operations
**Action**: Warn about version inconsistencies (non-blocking)

```typescript
// During development operations:
⚠️ Version inconsistencies detected
💡 Consider running version manager
✅ Continues operation (warning only)
```

## Version Management Flow

### Development Phase
```
Developer Codes -> Git Hook Validation -> Commit Allowed
                     ↓
              Version consistency check
                     ↓
             Block if inconsistent
```

### CI/CD Phase
```
Tests Pass -> Version Bump -> Update References -> Publish
     ↓            ↓              ↓               ↓
   Validate     Automated      Universal       NPM + Git
 Deployment     Increment     Version Mgr      Tag
```

### Runtime Phase
```
Agent Operation -> Version Validation -> Continue with Warning
                      ↓
               Log inconsistencies
                      ↓
              Development awareness
```

## Key Benefits

### Consistency
- **Single Source of Truth**: Package.json version is authoritative
- **Automated Updates**: No manual version management
- **Validation**: Prevents inconsistent versions

### Automation
- **Zero Manual Intervention**: Fully automated after tests pass
- **Git Integration**: Automatic commits, tags, and pushes
- **NPM Publishing**: Direct integration with package registry

### Safety
- **Test-First**: Versions only bump after all tests pass
- **Rebuild Verification**: Ensures new version builds correctly
- **Rollback Ready**: Git tags enable easy rollback

## Configuration

### Git Hook Setup
```bash
# Configure git to use our hooks
git config core.hooksPath .githooks

# Make pre-commit hook executable
chmod +x .githooks/pre-commit
```

### CI/CD Configuration
The CI/CD pipeline is fully configured in `.github/workflows/ci-cd.yml`:
- Runs on pushes to main/master
- Requires all tests to pass
- Uses production environment for publishing
- Automatic version management and tagging

### Processor Integration
Version validation is integrated into the processor hooks:
- Runs during agent operations
- Provides warnings for inconsistencies
- Non-blocking during development
- Logged for awareness

## Usage Examples

### Manual Version Management
```bash
# Development version bump
npm version patch

# Update all version references
node scripts/universal-version-manager.js

# Commit changes
git add .
git commit -m "chore: version bump"
```

### CI/CD Automated Flow
```bash
# Automatic after tests pass:
# 1. npm version patch
# 2. node scripts/universal-version-manager.js
# 3. npm run build:all
# 4. npm publish
# 5. git tag v1.x.x
```

### Development Validation
```bash
# Check version consistency
node scripts/pre-commit-version-validation.js

# Fix inconsistencies
node scripts/universal-version-manager.js
```

## Troubleshooting

### Git Hook Issues
```bash
# If pre-commit hook blocks commits:
node scripts/pre-commit-version-validation.js
node scripts/universal-version-manager.js
git add .
git commit
```

### CI/CD Issues
```bash
# If CI/CD version management fails:
npm version patch --no-git-tag-version
node scripts/universal-version-manager.js
npm run build:all
npm publish
```

### Development Warnings
```bash
# If processor shows version warnings:
node scripts/universal-version-manager.js
# Warnings will disappear after update
```

---

**Universal version management ensures consistency across development, CI/CD, and runtime environments.** 🔄📦</content>
<parameter name="filePath">docs/UNIVERSAL_VERSION_PIPELINE.md