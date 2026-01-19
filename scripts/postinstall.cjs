const fs = require('fs');
const path = require('path');

console.log("🎉 StringRay plugin installed!");
console.log("Setting up configuration files...");

// Copy config files and .opencode directory from package to project
const requiredFiles = ['.mcp.json', 'opencode.json', 'codex.codex'];
const requiredDirs = ['.opencode'];
const packageDir = path.dirname(__dirname);
const projectDir = path.dirname(path.dirname(path.dirname(__dirname))); // Go up three levels to project root

let filesCopied = 0;

// Ensure .opencode directory exists
const opencodeDir = path.join(projectDir, '.opencode');
if (!fs.existsSync(opencodeDir)) {
  fs.mkdirSync(opencodeDir, { recursive: true });
}

// Copy individual files
for (const file of requiredFiles) {
  let sourcePath = path.join(packageDir, file);
  let destPath = path.join(projectDir, file);

  // Special handling for files in .opencode directory
  if (file === 'opencode.json') {
    sourcePath = path.join(packageDir, '.opencode', 'oh-my-opencode.json');
    destPath = path.join(opencodeDir, 'oh-my-opencode.json');
  } else if (file === 'codex.codex') {
    sourcePath = path.join(packageDir, '.opencode', 'codex.codex');
    destPath = path.join(opencodeDir, 'codex.codex');
  }

  // Copy file, overwriting if it exists
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, destPath);

      // Update paths in .mcp.json to point to compiled MCP servers
      if (file === '.mcp.json') {
        const mcpConfig = JSON.parse(fs.readFileSync(destPath, 'utf8'));
        for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers)) {
          if (serverConfig.args && serverConfig.args[0]) {
            serverConfig.args[0] = serverConfig.args[0].replace(
              'node_modules/strray-ai/.opencode/mcps/',
              'node_modules/strray-ai/dist/plugin/mcps/'
            );
          }
        }
        fs.writeFileSync(destPath, JSON.stringify(mcpConfig, null, 2));
      }

      const destDisplay = file === 'opencode.json' ? '.opencode/oh-my-opencode.json' : file;
      console.log(`✅ ${destDisplay} ready`);
      filesCopied++;
    } catch (error) {
      console.error(`❌ Failed to copy ${file}:`, error.message);
      process.exit(1);
    }
  } else {
    console.error(`❌ Source file missing: ${file}`);
    process.exit(1);
  }
}

// Copy .opencode directory recursively
for (const dir of requiredDirs) {
  const sourceDir = path.join(packageDir, dir);
  const destDir = path.join(projectDir, dir);

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
      console.log(`✅ ${dir} directory copied`);
      filesCopied++;
    } catch (error) {
      console.error(`❌ Failed to copy ${dir}:`, error.message);
      process.exit(1);
    }
  } else {
    console.error(`❌ Source directory missing: ${dir}`);
    process.exit(1);
  }
}

// Create symlink to .strray directory for persistent state
const strraySource = path.join(packageDir, '.strray');
const strrayDest = path.join(projectDir, '.strray');

if (fs.existsSync(strraySource) && !fs.existsSync(strrayDest)) {
  try {
    fs.symlinkSync(strraySource, strrayDest, 'dir');
    console.log(`✅ .strray directory symlinked`);
    filesCopied++;
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
      filesCopied++;
    } catch (copyError) {
      console.error(`❌ Failed to copy .strray:`, copyError.message);
    }
  }
}

if (filesCopied > 0) {
  console.log(`🎉 Configuration setup complete! ${filesCopied} file(s) copied.`);
} else {
  console.log("✅ Configuration files already present.");
}

console.log("Use oh-my-opencode to activate the plugin.");