#!/usr/bin/env node

/**
 * StrRay Development Environment Setup
 * Transforms consumer-oriented paths to development paths for local development
 */

const fs = require("fs");
const path = require("path");

console.log('🔧 StrRay Development Setup: Transforming consumer paths to development paths...');

// Get the package root (where this script is located)
const packageRoot = path.join(__dirname, "..");

function updatePathsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    let updated = false;

    // Transform MCP server paths (specific first)
    if (content.includes('node_modules/strray-ai/dist/plugin/mcps/')) {
      content = content.replace(
        /node_modules\/strray-ai\/dist\/plugin\/mcps\//g,
        'dist/plugin/mcps/'
      );
      updated = true;
    }

    // Transform plugin paths (go up 3 directories from .opencode to project root)
    if (content.includes('node_modules/strray-ai/dist/plugin/plugins/')) {
      content = content.replace(
        /node_modules\/strray-ai\/dist\/plugin\/plugins\//g,
        '../../../dist/plugin/plugins/'
      );
      updated = true;
    }

    // Transform any remaining node_modules paths (but not plugin-specific ones we already handled)
    if (content.includes('node_modules/strray-ai/dist/') &&
        !content.includes('dist/plugin/')) {  // Avoid double transformation
      content = content.replace(
        /node_modules\/strray-ai\/dist\//g,
        'dist/'
      );
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated paths in ${path.relative(packageRoot, filePath)}`);
    } else {
      console.log(`ℹ️ No paths to update in ${path.relative(packageRoot, filePath)}`);
    }
  } catch (error) {
    console.warn(`⚠️ Could not update paths in ${filePath}:`, error.message);
  }
}

// Files to update for development
const filesToUpdate = [
  ".mcp.json",
  "opencode.json",
  ".opencode/oh-my-opencode.json"
];

console.log("🔧 StrRay Development Setup: Processing configuration files...");
filesToUpdate.forEach(filePath => {
  const fullPath = path.join(packageRoot, filePath);
  updatePathsInFile(fullPath);
});

console.log("🎉 StrRay Development Setup: Complete!");
console.log("📋 Next steps:");
console.log("1. Run 'npm run build:all' to build the framework");
console.log("2. Restart oh-my-opencode to load the plugin");
console.log("3. Run 'opencode agent list' to see StrRay agents");
console.log("4. Try '@enforcer analyze this code' to test the plugin");