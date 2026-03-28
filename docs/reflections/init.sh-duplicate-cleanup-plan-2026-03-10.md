# Fix Init.sh Duplicate and .gitignore Corruption - 2026-03-10

**Problem**: `init.sh` exists in TWO locations:
- `/Users/blaze/dev/stringray/src/init.sh` (legitimate)
- `/Users/blaze/dev/stringray/.opencode/init.sh` (duplicate from install)

**`.gitignore` is CORRUPTED**: 380+ lines of concatenated `.gitignore` files with duplicates, irrelevant patterns, and commented-out code.

**Root Cause**: The `.gitignore` file appears to be a copy-paste from multiple `.gitignore` templates or backups that got concatenated together during some operation (possibly install script run on both dev and consumer paths).

---

## Recommended Fix

### Step 1: Identify the correct `init.sh` location

Based on project structure and pre-commit hook expectations, the CORRECT location is:
```
/Users/blaze/dev/stringray/.opencode/init.sh
```

Because:
1. Pre-commit hook expects `init.sh` at root `.opencode/`
2. Development paths likely use `.opencode/`
3. Project root is `/Users/blaze/dev/stringray`

### Step 2: Remove duplicate `.init.sh` from wrong location

```bash
# If the duplicate exists in src/
rm -f /Users/blaze/dev/stringray/src/init.sh
```

### Step 3: Clean up `.gitignore` file

The current `.gitignore` is corrupted with 380+ lines including:
- Irrelevant stuff from other projects (Celery, Jupyter, Python, etc.)
- Duplicated patterns
- Concatenated backup files
- Commented-out code and deprecated paths

**Recommended approach**: Replace with clean, minimal `.gitignore`:

```gitignore
# Dependencies and build outputs
node_modules/

# Build outputs
dist/
out/
.next/
.nuxt/
.parcel-cache/
.cache/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
logs/
pids/
*.pid
*.seed
*.pid.lock

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### Step 4: Test the fix

1. Remove duplicate `init.sh` from `src/`
2. Run pre-commit hook to verify it finds `init.sh` at the right location
3. Test release workflow
4. Verify build passes

---

## Questions

**Which location should `init.sh` be at?**
- **Option A**: Keep it at `src/init.sh` (if pre-commit hook expects it there, then update hook to expect it at `src/init.sh` instead)
- **Option B**: Move it to `.opencode/init.sh` and keep `/Users/blaze/dev/stringray/src/init.sh` as legacy (deprecated)
- **Option C**: Delete duplicate `.opencode/init.sh` and ensure only `/Users/blaze/dev/stringray/src/init.sh` exists

**Do you want me to execute one of these fixes now?** (Yes - I'll remove the duplicate and clean up `.gitignore`)

---

## My Recommendation

**Immediate Action**: Option B (Move & Keep)

**Rationale**:
- Keeps the single source of truth at `src/init.sh`
- Maintains development paths preference
- Aligns with pre-commit hook expectations
- Preserves the backup at `.opencode/` for rollback

**After Fix**: The pre-commit hook should:
1. Find `init.sh` at `src/init.sh` (correct location)
2. Validate that `.gitignore` ignores the duplicate `.opencode/` path
3. Pass all checks successfully
