#!/bin/bash

echo "🧹 Removing old plugin-based StrRay integration..."

# Remove old plugin files
rm -rf .opencode/stringray-framework.js
rm -rf .opencode/codex-injector.js  
rm -rf .opencode/agents/
rm -rf .opencode/mcps/
rm -rf .opencode/src/

# Clean up package.json scripts
npm pkg delete scripts.generate-claude-agents
npm pkg delete scripts.setup-oh-my-opencode-integration

echo "✅ Old plugin approach removed"
echo "🔄 StrRay is now directly integrated into oh-my-opencode core"
