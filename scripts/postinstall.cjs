const fs = require('fs');
const path = require('path');

console.log("🎉 StringRay plugin installed!");
console.log("Setting up configuration files...");

// Copy config files and .opencode directory from package to project
const requiredFiles = ['.mcp.json', 'opencode.json'];
const requiredDirs = ['.opencode'];
const packageDir = path.dirname(__dirname);
const projectDir = path.dirname(path.dirname(path.dirname(__dirname))); // Go up three levels to project root

let filesCopied = 0;

// Copy individual files
for (const file of requiredFiles) {
  const sourcePath = path.join(packageDir, file);
  let destPath = path.join(projectDir, file);

  // Special handling for opencode.json - place it in .opencode/oh-my-opencode.json
  if (file === 'opencode.json') {
    const opencodeDir = path.join(projectDir, '.opencode');
    if (!fs.existsSync(opencodeDir)) {
      fs.mkdirSync(opencodeDir, { recursive: true });
    }
    destPath = path.join(opencodeDir, 'oh-my-opencode.json');
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

if (filesCopied > 0) {
  console.log(`🎉 Configuration setup complete! ${filesCopied} file(s) copied.`);
} else {
  console.log("✅ Configuration files already present.");
}

console.log("Use oh-my-opencode to activate the plugin.");