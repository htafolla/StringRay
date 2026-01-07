#!/bin/bash
echo "🚀 StrRay Standalone Framework Initialization"
echo "============================================"

# Check if we're in the right directory
if [ ! -f "src/codex-injector.ts" ]; then
    echo "❌ Error: Please run this script from the strray-standalone directory"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"
if ! [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "❌ Error: Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+."
    exit 1
fi

echo "✅ Node.js $NODE_VERSION detected"

# Install dependencies
echo "📦 Installing dependencies..."
if command -v bun &> /dev/null; then
    echo "🐰 Using Bun for faster installation..."
    bun install
else
    npm install
fi

# Build the framework
echo "🔨 Building framework..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: Build failed. Please check TypeScript errors."
    exit 1
fi

# Validate codex
echo "🔍 Validating codex..."
node scripts/validate-codex.js

if [ $? -ne 0 ]; then
    echo "❌ Error: Codex validation failed."
    exit 1
fi

# Create .opencode directory if it doesn't exist
if [ ! -d ".opencode" ]; then
    mkdir -p .opencode
    echo "📁 Created .opencode directory"
fi

# Copy necessary files to .opencode if they don't exist
if [ ! -f ".opencode/agents_template.md" ]; then
    cp src/agents_template.md .opencode/
    echo "📋 Copied agents template to .opencode/"
fi

echo ""
echo "✅ Standalone framework ready for repository"
echo "💡 Copy this folder to a new repository to create StrRay Framework"
echo ""
echo "📚 Next steps:"
echo "   1. Copy this folder to your target repository"
echo "   2. Run 'npm run init' in the target repository"
echo "   3. Follow the framework documentation for setup"
echo ""
