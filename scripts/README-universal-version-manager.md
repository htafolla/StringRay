# Universal Version Manager

**Automated version standardization across the entire StringRay Framework ecosystem.**

## Overview

The Universal Version Manager (`scripts/universal-version-manager.js`) maintains version consistency across:

- **Framework versions** (StringRay AI releases)
- **Codex versions** (Universal Development Codex)
- **Dependency versions** (oh-my-opencode, etc.)
- **Documentation** (README, API docs, etc.)
- **Code comments** and references

## Current Official Versions

```javascript
const OFFICIAL_VERSIONS = {
  framework: {
    version: "1.0.4",
    displayName: "StringRay AI v1.1.1",
    lastUpdated: "2026-01-15",
  },
  codex: {
    version: "v1.1.1",
    termsCount: 50,
    lastUpdated: "2026-01-15",
  },
  dependencies: {
    ohMyOpencode: "2.14.0",
  },
};
```

## Usage

### Update Versions

1. **Edit the script**: Modify `OFFICIAL_VERSIONS` in `scripts/universal-version-manager.js`
2. **Run the script**:
   ```bash
   node scripts/universal-version-manager.js
   ```
3. **Review changes**: The script will show all files updated
4. **Commit**: Add and commit the changes

### Example: Framework Release

```bash
# Edit OFFICIAL_VERSIONS.framework.version to "1.0.5"
node scripts/universal-version-manager.js
# All documentation and code will be updated automatically
git add . && git commit -m "chore: bump version to 1.0.5"
```

## What Gets Updated

### Framework References

- `StringRay AI v1.1.1` → `StringRay AI v1.1.1`
- `StringRay AI v1.1.1` → `StringRay AI v1.1.1`
- Version badges and headers

### Codex References

- `Universal Development Codex v1.1.1` → `Universal Development Codex v1.1.1`
- `55-term` → `55-term`
- `55 Universal Development Codex` → `55 Universal Development Codex`

### Dependency References

- `oh-my-opencode v1.1.1` → `oh-my-opencode v1.1.1`

## Files Excluded

- **Archive files**: Historical versions preserved for accuracy
- **Changelogs**: Maintain version history
- **Package.json**: Updated manually for npm publishing

## Benefits

✅ **Single Source of Truth**: All versions defined in one place
✅ **Automated Updates**: No manual version hunting
✅ **Consistency Guaranteed**: No version drift across files
✅ **Future-Proof**: Easy to maintain and extend
✅ **Documentation Sync**: Always matches published packages

## Maintenance

When updating versions:

1. Update `OFFICIAL_VERSIONS` object
2. Run the script
3. Test the changes
4. Commit with clear version bump message

**This ensures the entire framework ecosystem stays synchronized!** 🎯
