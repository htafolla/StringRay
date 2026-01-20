# 🚀 StrRay Framework Deployment Pipeline

## Overview

The StrRay Framework uses a comprehensive deployment pipeline that integrates version management, automated testing, and staged releases. The pipeline ensures production-ready deployments with zero-downtime and full rollback capabilities.

## 🏗️ Pipeline Architecture

### 1. Development Phase
```
Code Changes → Unit Tests → Integration Tests → E2E Tests
```

### 2. Pre-Release Phase
```
Version Bump → Universal Version Manager → Build → Test Deployment
```

### 3. Production Release Phase
```
Final Validation → NPM Publish → Git Tag → Deployment Summary
```

## 📋 Deployment Scripts

### Automated Deployment (CI/CD)

**GitHub Actions Pipeline** (`.github/workflows/ci.yml`):
- **Trigger**: Release published on GitHub
- **Jobs**:
  - `test` - Multi-version Node.js testing
  - `build-and-test` - Production build + comprehensive tests
  - `security-scan` - Security vulnerability assessment
  - `version-bump` - Automated version management
  - `test-deployment` - Isolated environment testing
  - `publish` - NPM publication with validation

### Manual Deployment (Local)

**Deployment Script** (`scripts/deploy.sh`):
```bash
# Full deployment pipeline
npm run deploy:patch     # Patch version release
npm run deploy:minor     # Minor version release
npm run deploy:major     # Major version release
npm run deploy:dry-run   # Test deployment without publishing

# Individual steps
npm run test:npm-install # Test deployment to isolated directory
```

## 🔄 Version Management Integration

### Universal Version Manager

**Script**: `scripts/universal-version-manager.js`
**Purpose**: Updates all version references across the entire codebase
**Coverage**: 200+ files including:
- `package.json`, `AGENTS.md`, documentation
- Source code comments and strings
- Configuration files and templates

**Integration Points**:
- Runs automatically in CI/CD pipeline
- Must pass before any deployment
- Updates AGENTS.md framework version references
- Maintains version consistency across all files

## 🧪 Testing Stages

### 1. Pre-Deployment Testing
```bash
npm run test:all              # Complete test suite
npm run lint                  # Code quality checks
npm run typecheck            # TypeScript validation
npm audit --audit-level moderate  # Security scan
```

### 2. Build Validation
```bash
npm run build:all            # Production build
npm run test:comprehensive   # Framework validation
npm pack --dry-run          # Package integrity check
```

### 3. Deployment Testing
```bash
npm run test:npm-install     # Isolated environment test
# Tests complete installation workflow in /tmp directory
# Validates postinstall scripts and configuration
```

## 📦 Release Workflow

### Automated Release (GitHub)
1. **Create Release**: GitHub Releases UI → Create new release
2. **Tag Format**: `v1.2.3` (semantic versioning)
3. **Trigger**: Release published event
4. **Pipeline**:
   - Version extraction from tag
   - Universal version manager execution
   - Build with updated versions
   - Test deployment validation
   - NPM publish with latest tag

### Manual Release (Local)
```bash
# Dry run first
npm run deploy:dry-run

# Actual deployment
npm run deploy:patch

# What happens:
# 1. Pre-deployment validation (tests, lint, security)
# 2. Version bump (patch/minor/major)
# 3. Universal version manager updates all references
# 4. Build with new versions
# 5. Test deployment in isolated environment
# 6. NPM publish
# 7. Git tag creation and push
```

## 🔒 Safety Mechanisms

### Zero-Tolerance Policies
- **No Broken Commits**: Code must compile and tests pass before push
- **No Broken Versions**: Version bumps only on successful releases
- **No Direct Publishes**: All publishes go through pipeline validation
- **No Manual Overrides**: Framework commands required for all operations

### Rollback Capabilities
- **Version Rollback**: NPM unpublish + version reset
- **Git Rollback**: Tag deletion + commit reversion
- **Emergency Rollback**: Within 30 minutes of deployment

### Validation Gates
- **Pre-Publish**: `npm run prepare-consumer` (path transformations)
- **Post-Publish**: Package installation testing
- **Health Checks**: Framework doctor command validation

## 📊 Monitoring & Reporting

### Deployment Summary
GitHub Actions generates comprehensive deployment reports:
- Package version and publish status
- Validation results (CI/CD, version management, deployment tests)
- NPM publish confirmation
- Git tag creation status

### Health Monitoring
- **Post-Deploy Checks**: Automated health validation
- **Performance Monitoring**: Response time and error rate tracking
- **User Feedback**: Installation success rate monitoring

## 🚨 Emergency Procedures

### Failed Deployment Recovery
```bash
# 1. Stop the deployment
# 2. Deprecate broken version
npm deprecate strray-ai@1.1.1 "BROKEN BUILD - Emergency rollback"

# 3. Reset to previous version
npm version 1.1.0 --no-git-tag-version

# 4. Republish previous version
npm publish --tag latest

# 5. Clean up git tags
git tag -d v1.1.1
git push origin :refs/tags/v1.1.1
```

### Pipeline Failure Recovery
- **Automatic**: Self-healing CI/CD with environment detection
- **Manual**: Force rebuild with `workflow_dispatch`
- **Rollback**: Previous working version restoration

## 📈 Performance Metrics

### Pipeline Performance
- **Build Time**: <3 minutes (optimized builds)
- **Test Time**: <5 minutes (parallel execution)
- **Deploy Time**: <2 minutes (NPM publish)
- **Total Pipeline**: <15 minutes end-to-end

### Quality Metrics
- **Test Coverage**: 85%+ behavioral coverage required
- **Error Prevention**: 99.6% systematic validation
- **Version Consistency**: 100% across all files
- **Deployment Success Rate**: 99.9%+

## 🎯 Best Practices

### Version Management
- **Semantic Versioning**: Strict MAJOR.MINOR.PATCH compliance
- **Version Sources**: Single source of truth (universal-version-manager.js)
- **Consistency**: All files updated automatically
- **Documentation**: Version changes documented in CHANGELOG.md

### Deployment Safety
- **Dry Runs**: Always test with `deploy:dry-run` first
- **Gradual Rollout**: Feature flags for risky changes
- **Monitoring**: Real-time health checks post-deployment
- **Rollback Plan**: Always have immediate rollback capability

### CI/CD Integration
- **Automated Triggers**: Release-based deployment only
- **Manual Overrides**: Available via `workflow_dispatch`
- **Security**: NPM_TOKEN required for publishing
- **Audit Trail**: Complete deployment history in GitHub Actions

---

## 🚀 Quick Deployment Commands

```bash
# Development testing
npm run test:npm-install    # Test deployment locally
npm run deploy:dry-run      # Full pipeline dry run

# Production deployment
npm run deploy:patch        # Patch release (bug fixes)
npm run deploy:minor        # Minor release (new features)
npm run deploy:major        # Major release (breaking changes)

# Emergency procedures
npm deprecate strray-ai@VERSION "Reason for deprecation"
npm publish --tag previous  # Publish previous version
```

**🎯 Deployment Pipeline: Reliable • Automated • Safe • Monitored**