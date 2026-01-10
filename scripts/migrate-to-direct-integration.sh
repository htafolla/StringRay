#!/bin/bash

echo "🔄 Migrating StrRay from plugin approach to direct oh-my-opencode integration..."

# Step 1: Remove old plugin files
echo "🧹 Removing old plugin approach..."
rm -rf .opencode/stringray-framework.js
rm -rf .opencode/codex-injector.js
rm -rf .opencode/agents/
rm -rf .opencode/mcps/
rm -rf .opencode/src/

# Step 2: Clean up package.json scripts
echo "📝 Cleaning up package.json..."
npm pkg delete scripts.generate-claude-agents 2>/dev/null || true
npm pkg delete scripts.setup-oh-my-opencode-integration 2>/dev/null || true

# Step 3: Build with new integration
echo "🔨 Building with direct StrRay integration..."
npm run build

echo ""
echo "✅ Migration Complete!"
echo ""
echo "🎉 StrRay Framework is now directly integrated into oh-my-opencode core"
echo ""
echo "What changed:"
echo "- ❌ Removed .opencode/stringray-framework.js plugin"
echo "- ❌ Removed separate .opencode/agents/ directory"
echo "- ✅ Added src/strray-activation.ts for component activation"
echo "- ✅ Added src/strray-init.ts for automatic initialization"
echo "- ✅ Modified src/index.ts to auto-activate StrRay"
echo ""
echo "Benefits:"
echo "- ✅ Full pre/post processor pipeline (automatic for all operations)"
echo "- ✅ Complete orchestration system with Sisyphus integration"
echo "- ✅ Enterprise monitoring and state management"
echo "- ✅ Automatic activation when oh-my-opencode starts"
echo "- ✅ No separate plugin installation required"
echo ""
echo "StrRay agents are now available as part of oh-my-opencode's core functionality!"
