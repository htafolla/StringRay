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
  ".claude/.mcp.json",
  ".mcp.json",
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

// Update paths in copied configuration files
console.log("🔧 StrRay Postinstall: Updating paths in configuration files...");

function updatePathsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    let updated = false;

    // Update MCP server paths
    if (content.includes('./dist/plugin/mcps/') || content.includes('dist/plugin/mcps/')) {
      content = content.replace(
        /"\.\/dist\/plugin\/mcps\//g,
        '"node_modules/strray-ai/dist/plugin/mcps/'
      );
      content = content.replace(
        /'\.\/dist\/plugin\/mcps\//g,
        "'node_modules/strray-ai/dist/plugin/mcps/"
      );
      content = content.replace(
        /"dist\/plugin\/mcps\//g,
        '"node_modules/strray-ai/dist/plugin/mcps/'
      );
      updated = true;
    }

    // Update plugin paths
    if (content.includes('./dist/')) {
      content = content.replace(
        /"\.\/dist\//g,
        '"node_modules/strray-ai/dist/'
      );
      content = content.replace(
        /'\.\/dist\//g,
        "'node_modules/strray-ai/dist/"
      );
      updated = true;
    }

    // Update .opencode paths
    if (content.includes('./.opencode/mcps/') || content.includes('.opencode/mcps/')) {
      // .opencode files stay as relative paths since they're in the same directory structure
      // No change needed for .opencode internal references
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated paths in ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.warn(`⚠️ Could not update paths in ${filePath}:`, error.message);
  }
}

// Update paths in all copied configuration files
const filesToUpdate = [
  ".mcp.json",
  "opencode.json",
  ".opencode/oh-my-opencode.json"
];

console.log("🔧 StrRay Postinstall: Starting path updates for files:", filesToUpdate);
filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  console.log(`🔧 Processing file: ${filePath} -> ${fullPath}`);
  updatePathsInFile(fullPath);
});

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