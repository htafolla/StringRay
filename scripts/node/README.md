# StringRay Release Scripts

## Overview

This directory contains scripts for managing releases of the StringRay framework.

## Scripts

### Primary Release Script

**`release.mjs`** - Main release orchestrator
- **Purpose**: Safe, validated release process
- **Usage**: `npm run release:[patch|minor|major]`
- **Flow**:
  1. Build (validate everything works first)
  2. Prepare consumer package
  3. Rebuild after prepare
  4. Bump version (updates package.json, CHANGELOG, README, etc.)
  5. Commit version changes
  6. Create git tag
  7. Push to origin
  8. Publish to npm
  9. Generate release tweet
- **Safety**: Stops immediately if any step fails

### Version Management

**`version-manager.mjs`** - Version bumping and file updates
- **Purpose**: Updates version across all files
- **Updates**:
  - package.json
  - CHANGELOG.md (auto-generates from commits)
  - README.md (version badge, counts)
  - AGENTS.md (counts)
  - docs/README.md
- **Usage**: `npm run version:bump -- [patch|minor|major] [--tag]`
- **Note**: The `--tag` flag creates git tag immediately (use with caution)

### Tweet Generation

**`release-tweet-single.mjs`** - Single release tweet generator
- **Purpose**: Creates consumer-facing tweet for latest release
- **Output**: Saves to `tweets/tweet-v{version}-{timestamp}.txt`
- **Usage**: `node scripts/node/release-tweet-single.mjs`

**`release-tweet.mjs`** - Multi-release tweet context generator
- **Purpose**: Prepares context for release tweets
- **Features**: Groups commits by type, extracts highlights
- **Usage**: `node scripts/node/release-tweet.mjs [--preview]`

### Pre-Publish Guards

**`pre-publish-guard.js`** - Validates before publish
- **Purpose**: Prevents bad publishes
- **Checks**: Syntax, tests, security, etc.

## Recommended Workflow

### For Releases

Use the main release script:

```bash
# Patch release (1.0.0 -> 1.0.1)
npm run release:patch

# Minor release (1.0.0 -> 1.1.0)
npm run release:minor

# Major release (1.0.0 -> 2.0.0)
npm run release:major
```

This script:
- ✅ Builds first (stops on error)
- ✅ Bumps version only after successful build
- ✅ Commits, tags, pushes, publishes
- ✅ Generates tweet
- ✅ Safe rollback if anything fails

### For Version Bumping Only

If you need to bump version without full release:

```bash
# Bump without tagging
npm run version:bump -- patch

# Bump with immediate tag (use with caution)
npm run version:bump -- patch --tag
```

## Safety Features

The `release.mjs` script includes multiple safety checks:

1. **Build-First Validation**: Code must compile before any version changes
2. **Atomic Operations**: All or nothing - no partial releases
3. **Error Stopping**: Stops immediately on any failure
4. **Tag Timing**: Tags created only after successful commit
5. **No Orphaned Tags**: Tags reference actual commits

## Common Issues

### Issue: Release failed mid-way
**Solution**: Check git status, manually clean up if needed, fix errors, retry

### Issue: Tag already exists
**Solution**: Delete local tag `git tag -d v1.x.x`, delete remote `git push origin :refs/tags/v1.x.x`, retry

### Issue: npm publish failed
**Solution**: Check npm auth, version uniqueness, retry

## Files Updated During Release

- `package.json` - version field
- `CHANGELOG.md` - new entry with changes
- `README.md` - version badge, agent/mcp/skill counts
- `AGENTS.md` - agent/mcp/skill counts
- `docs/README.md` - version badge

## Output

- **Git**: Commit + tag pushed to origin
- **NPM**: Package published to registry
- **Tweet**: Generated in `tweets/` directory
- **Logs**: Console output of all steps
