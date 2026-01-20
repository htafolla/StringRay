#!/usr/bin/env node

/**
 * StrRay Consumer Preparation Script
 * Transforms development paths back to consumer paths before publishing
 */

const fs = require("fs");
const path = require("path");

console.log('🔧 StrRay Consumer Preparation: Transforming development paths back to consumer paths...');

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

    // Transform development paths back to consumer paths
    // Only transform if it's not already a consumer path
    if (content.includes('dist/plugin/mcps/') && !content.includes('node_modules/strray-ai/dist/plugin/mcps/')) {
      content = content.replace(
        /dist\/plugin\/mcps\//g,
        'node_modules/strray-ai/dist/plugin/mcps/'
      );
      updated = true;
    }

    // Transform plugin paths back to consumer format (only the relative dev paths)
    if (content.includes('../../../dist/plugin/plugins/')) {
      content = content.replace(
        /\.\.\/\.\.\/\.\.\/dist\/plugin\/plugins\//g,
        'node_modules/strray-ai/dist/plugin/plugins/'
      );
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated paths in ${path.relative(packageRoot, filePath)}`);
    } else {
      console.log(`ℹ️ No development paths found in ${path.relative(packageRoot, filePath)}`);
    }
  } catch (error) {
    console.warn(`⚠️ Could not update paths in ${filePath}:`, error.message);
  }
}

// Files to update for consumer preparation
const filesToUpdate = [
  ".mcp.json",
  "opencode.json",
  ".opencode/oh-my-opencode.json"
];

console.log("🔧 StrRay Consumer Preparation: Processing configuration files...");
filesToUpdate.forEach(filePath => {
  const fullPath = path.join(packageRoot, filePath);
  updatePathsInFile(fullPath);
});

console.log("🎉 StrRay Consumer Preparation: Complete!");
console.log("📦 Package is now ready for consumer installation.");