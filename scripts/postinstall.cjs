#!/usr/bin/env node

/**
 * StrRay Plugin Post-Installation Setup
 * Copies configuration files to project root and updates paths
 */

const fs = require("fs");
const path = require("path");

console.log('🔧 StrRay Postinstall: Script starting...');

// Find the package root relative to this script
const packageRoot = path.join(__dirname, "..");

// Configuration files to copy during installation
const configFiles = [
  // ".mcp.json", // Commented out - no longer auto-copying MCP config
  "opencode.json"
];

// Directories to copy recursively
const configDirs = [
  ".opencode"
];

console.log("🔧 StrRay Postinstall: Copying configuration files...");
console.log("📍 Package root:", packageRoot);
console.log("📍 Target directory:", process.cwd());

// Copy individual files
configFiles.forEach(filePath => {
  const source = path.join(packageRoot, filePath);
  const dest = path.join(process.cwd(), filePath);

  try {
    if (fs.existsSync(source)) {
      // Ensure destination directory exists
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        console.log(`📁 Created directory: ${destDir}`);
      }

      fs.copyFileSync(source, dest);
      console.log(`✅ Copied ${filePath}`);
    } else {
      console.warn(`⚠️ Source not found: ${source}`);
    }
  } catch (error) {
    console.warn(`⚠️ Could not copy ${filePath}:`, error.message);
  }
});

// Copy directories recursively
configDirs.forEach(dirPath => {
  const sourceDir = path.join(packageRoot, dirPath);
  const destDir = path.join(process.cwd(), dirPath);

  if (fs.existsSync(sourceDir)) {
    try {
      // Recursive copy function
      function copyDir(src, dest) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);

          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }

      copyDir(sourceDir, destDir);
      console.log(`✅ Copied directory ${dirPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not copy directory ${dirPath}:`, error.message);
    }
  } else {
    console.warn(`⚠️ Source directory not found: ${sourceDir}`);
  }
});

// Detect if we're in a consumer environment (installed via npm)
const cwd = process.cwd();
const isConsumerEnvironment = !cwd.includes("dev/stringray") && cwd.includes("dev/jelly");

// Convert paths for consumer environment
if (isConsumerEnvironment) {
  console.log("🔧 StrRay Postinstall: Converting paths for consumer environment...");

  // Convert MCP server paths
  const mcpPath = path.join(process.cwd(), ".mcp.json");
  if (fs.existsSync(mcpPath)) {
    let mcpContent = fs.readFileSync(mcpPath, "utf8");
    // Convert development paths to consumer paths
    mcpContent = mcpContent.replace(
      /"dist\/plugin\/mcps\//g,
      '"node_modules/strray-ai/dist/plugin/mcps/'
    );
    fs.writeFileSync(mcpPath, mcpContent, "utf8");
    console.log("✅ Updated MCP server paths");
  }

  // Convert plugin path in oh-my-opencode.json
  const opencodePath = path.join(process.cwd(), ".opencode", "oh-my-opencode.json");
  if (fs.existsSync(opencodePath)) {
    let opencodeContent = fs.readFileSync(opencodePath, "utf8");
    // Convert development plugin path to consumer path
    opencodeContent = opencodeContent.replace(
      /"dist\/plugin\/plugins\/stringray-codex-injection\.js"/g,
      '"../../../node_modules/strray-ai/dist/plugin/plugins/strray-codex-injection.js"'
    );
    fs.writeFileSync(opencodePath, opencodeContent, "utf8");
    console.log("✅ Updated plugin path");
  }
}

console.log("🔧 StrRay Postinstall: Consumer installation complete - all paths are correctly configured.");

// Create symlink to .strray directory for persistent state
const strraySource = path.join(packageRoot, '.strray');
const strrayDest = path.join(process.cwd(), '.strray');

if (fs.existsSync(strraySource) && !fs.existsSync(strrayDest)) {
  try {
    fs.symlinkSync(strraySource, strrayDest, 'dir');
    console.log(`✅ .strray directory symlinked`);
  } catch (error) {
    console.error(`❌ Failed to symlink .strray:`, error.message);
    // Fallback: copy the directory
    try {
      function copyDir(src, dest) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
      copyDir(strraySource, strrayDest);
      console.log(`✅ .strray directory copied (fallback)`);
    } catch (copyError) {
      console.error(`❌ Failed to copy .strray:`, copyError.message);
    }
  }
}

console.log("🎉 StrRay Postinstall: Configuration complete!");
console.log("📋 Next steps:");
console.log("1. Restart oh-my-opencode to load the plugin");
console.log("2. Run 'opencode agent list' to see StrRay agents");
console.log("3. Try '@enforcer analyze this code' to test the plugin");