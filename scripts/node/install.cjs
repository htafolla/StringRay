#!/usr/bin/env node

/**
 * StringRay One-Command Installer
 * 
 * Usage:
 *   npx strray-ai install           # Default: kernel + skills + OpenCode check
 *   npx strray-ai install --minimal # Only kernel, no skills
 *   npx strray-ai install --full    # Everything including all skills
 *   npx strray-ai install --with-skills # Kernel + skills (same as default)
 *   npx strray-ai install --standalone # Standalone MCP servers (no OpenCode required)
 */

const fs = require("fs");
const path = require("path");
const { execSync, exec: execAsync } = require("child_process");
const os = require("os");

const promisify = (fn) => (...args) =>
  new Promise((resolve, reject) =>
    fn(...args, (err, result) => (err ? reject(err) : resolve(result)))
  );

const execFileAsync = promisify(require("child_process").execFile);

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SOURCE_OPENCODE = path.join(PROJECT_ROOT, ".opencode");
const CONSUMER_OPENCODE = path.join(process.cwd(), ".opencode");

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    minimal: args.includes("--minimal"),
    full: args.includes("--full"),
    withSkills: args.includes("--with-skills") || (!args.includes("--minimal") && !args.includes("--full") && !args.includes("--standalone")),
    standalone: args.includes("--standalone"),
    yes: args.includes("--yes") || args.includes("-y"),
    help: args.includes("--help") || args.includes("-h"),
  };
}

function printBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    StringRay Installer v1.14.0                   ║
║              Bulletproof AI Orchestration Framework              ║
╚══════════════════════════════════════════════════════════════════╝
`);
}

function printHelp() {
  printBanner();
  console.log(`
Usage:
  npx strray-ai install [options]

Options:
  --minimal      Install only the kernel (no skills)
  --with-skills  Install kernel + curated skills (default)
  --full         Install everything including all skills
  --standalone   Install standalone MCP servers (no OpenCode required)
  --yes, -y      Skip confirmation prompts
  --help, -h     Show this help message

Modes:
  Default:       Full installation with OpenCode integration
  --standalone:  MCP servers only (for Hermes Agent, no OpenCode dependency)

Examples:
  npx strray-ai install              # Install with skills (default)
  npx strray-ai install --minimal     # Kernel only
  npx strray-ai install --full        # Full installation
  npx strray-ai install --standalone  # Standalone MCP servers
  npx strray-ai install --yes         # Install without prompts
`);
}

async function checkOpenCodeInstallation() {
  console.log("🔍 Checking for OpenCode installation...");

  const checks = [
    { name: "~/.opencode directory", test: () => fs.existsSync(path.join(os.homedir(), ".opencode")) },
    { name: "node_modules/.bin/opencode", test: () => fs.existsSync(path.join(process.cwd(), "node_modules/.bin/opencode")) },
    { name: "npx opencode (global)", test: () => {
      try {
        execSync("npx opencode --version", { stdio: "ignore" });
        return true;
      } catch {
        return false;
      }
    }},
  ];

  for (const check of checks) {
    try {
      if (check.test()) {
        console.log(`✅ Found: ${check.name}`);
        return true;
      }
    } catch {
      // Ignore errors during check
    }
  }

  console.log("❌ OpenCode not found");
  return false;
}

async function installOpenCode() {
  console.log("\n📦 Installing OpenCode...");
  
  try {
    execSync("npx opencode install --yes", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log("✅ OpenCode installed successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to install OpenCode:", error.message);
    return false;
  }
}

function copyDirectory(src, dest, options = {}) {
  const { 
    skipDirs = [], 
    skipFiles = [], 
    mergeFiles = [],
    onCopy,
    onSkip,
    onMerge,
  } = options;

  if (!fs.existsSync(src)) {
    return { copied: 0, skipped: 0, merged: 0, errors: [] };
  }

  const result = { copied: 0, skipped: 0, merged: 0, errors: [] };

  function copyRecursive(srcPath, destPath, relativePath = "") {
    if (!fs.existsSync(srcPath)) {
      result.errors.push(`Source not found: ${srcPath}`);
      return;
    }

    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      if (skipDirs.includes(path.basename(srcPath))) {
        onSkip?.(relativePath, "directory");
        result.skipped++;
        return;
      }

      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }

      const entries = fs.readdirSync(srcPath, { withFileTypes: true });
      for (const entry of entries) {
        copyRecursive(
          path.join(srcPath, entry.name),
          path.join(destPath, entry.name),
          path.join(relativePath, entry.name)
        );
      }
    } else {
      const fileName = path.basename(srcPath);
      if (skipFiles.includes(fileName)) {
        onSkip?.(relativePath, "file");
        result.skipped++;
        return;
      }

      const relPath = relativePath || fileName;
      if (mergeFiles.includes(relPath)) {
        mergeJsonFiles(srcPath, destPath);
        onMerge?.(relPath);
        result.merged++;
      } else {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(srcPath, destPath);
        onCopy?.(relPath);
        result.copied++;
      }
    }
  }

  copyRecursive(src, dest);
  return result;
}

function mergeJsonFiles(srcPath, destPath) {
  try {
    const srcContent = fs.readFileSync(srcPath, "utf8");
    const srcData = JSON.parse(srcContent);

    if (fs.existsSync(destPath)) {
      const destContent = fs.readFileSync(destPath, "utf8");
      const destData = JSON.parse(destContent);
      const merged = deepMerge(srcData, destData);
      fs.writeFileSync(destPath, JSON.stringify(merged, null, 2), "utf8");
    } else {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
    }
  } catch (error) {
    try {
      fs.copyFileSync(srcPath, destPath);
    } catch (copyError) {
      console.warn(`⚠️ Could not process ${path.basename(srcPath)}: ${copyError.message}`);
    }
  }
}

function deepMerge(src, dest) {
  if (typeof src !== "object" || src === null) {
    return dest !== undefined ? dest : src;
  }
  if (Array.isArray(src)) {
    return Array.isArray(dest) ? dest : src;
  }

  const result = {};
  for (const key of Object.keys(src)) {
    if (dest && typeof dest[key] !== "undefined") {
      result[key] = deepMerge(src[key], dest[key]);
    } else {
      result[key] = src[key];
    }
  }
  if (dest && typeof dest === "object") {
    for (const key of Object.keys(dest)) {
      if (!(key in src)) {
        result[key] = dest[key];
      }
    }
  }
  return result;
}

async function layerKernel(targetDir) {
  console.log("\n📂 Layering StringRay kernel...");

  const strrayDir = path.join(targetDir, ".opencode", "strray");
  const agentsDir = path.join(targetDir, ".opencode", "agents");
  const hooksDir = path.join(targetDir, ".opencode", "hooks");

  const SKIP_DIRS = ["node_modules", "logs", "openclaw", "validation", ".git"];
  const SKIP_FILES = [".strrayrc.json", "package.json", "package-lock.json"];
  const MERGE_FILES = [
    "strray/features.json",
    "strray/routing-mappings.json",
    "strray/integrations.json",
    "strray/config.json",
  ];

  let totalCopied = 0;
  let totalMerged = 0;

  const copyCallbacks = {
    onCopy: (file) => {
      console.log(`  ✅ ${file}`);
      totalCopied++;
    },
    onSkip: (file, type) => {
      console.log(`  ⏭️  Skipped ${type}: ${file}`);
    },
    onMerge: (file) => {
      console.log(`  🔄 Merged: ${file}`);
      totalMerged++;
    },
  };

  const copyResult = copyDirectory(SOURCE_OPENCODE, targetDir, {
    skipDirs: SKIP_DIRS,
    skipFiles: SKIP_FILES,
    mergeFiles: MERGE_FILES,
    ...copyCallbacks,
  });

  console.log(`\n✅ Kernel layered: ${copyResult.copied} copied, ${copyResult.merged} merged, ${copyResult.skipped} skipped`);

  if (copyResult.errors.length > 0) {
    console.log(`\n⚠️  ${copyResult.errors.length} errors occurred`);
    copyResult.errors.forEach((e) => console.log(`  - ${e}`));
  }

  return { copied: copyResult.copied, merged: copyResult.merged, skipped: copyResult.skipped };
}

async function installAntigravity() {
  console.log("\n📦 Installing Antigravity Skills (curated)...");

  const antigravityScript = path.join(PROJECT_ROOT, "scripts/integrations/install-antigravity-skills.js.mjs");

  if (!fs.existsSync(antigravityScript)) {
    console.log("⚠️  Antigravity script not found, skipping...");
    return false;
  }

  try {
    execSync(`node "${antigravityScript}" --curated`, {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
    });
    console.log("✅ Antigravity skills installed");
    return true;
  } catch (error) {
    console.warn("⚠️  Failed to install Antigravity skills:", error.message);
    return false;
  }
}

async function installImpeccable() {
  console.log("\n📦 Impeccable skill (stub - Phase 1)...");

  const impeccDir = path.join(process.cwd(), ".opencode", "integrations", "impeccable");

  try {
    if (!fs.existsSync(impeccDir)) {
      fs.mkdirSync(impeccDir, { recursive: true });
    }
    
    const skillMd = `# Impeccable Skill

## Status: Phase 1 Feature

Impeccable skill integration coming in Phase 1.

## Planned Features:
- Code quality enforcement
- Style consistency checking
- Automated refactoring suggestions

## To Implement:
See docs/roadmap/phase1.md for details.
`;

    fs.writeFileSync(path.join(impeccDir, "SKILL.md"), skillMd);
    console.log("✅ Created Impeccable stub");
    return true;
  } catch (error) {
    console.warn("⚠️  Failed to create Impeccable stub:", error.message);
    return false;
  }
}

async function installOpenViking() {
  console.log("\n📦 OpenViking skill (stub - Phase 1)...");

  const vikingDir = path.join(process.cwd(), ".opencode", "integrations", "openviking");

  try {
    if (!fs.existsSync(vikingDir)) {
      fs.mkdirSync(vikingDir, { recursive: true });
    }

    const skillMd = `# OpenViking Skill

## Status: Phase 1 Feature

OpenViking integration coming in Phase 1.

## Planned Features:
- Performance monitoring
- Resource optimization
- System health metrics

## To Implement:
See docs/roadmap/phase1.md for details.
`;

    fs.writeFileSync(path.join(vikingDir, "SKILL.md"), skillMd);
    console.log("✅ Created OpenViking stub");
    return true;
  } catch (error) {
    console.warn("⚠️  Failed to create OpenViking stub:", error.message);
    return false;
  }
}

async function copyPlugin(targetDir) {
  console.log("\n📦 Copying StringRay plugin...");

  const pluginSource = path.join(PROJECT_ROOT, "dist", "plugin", "strray-codex-injection.js");

  const pluginLocations = [
    path.join(targetDir, ".opencode", "plugin", "strray-codex-injection.js"),
    path.join(targetDir, ".opencode", "plugins", "strray-codex-injection.js"),
  ];

  if (!fs.existsSync(pluginSource)) {
    console.log("⚠️  Plugin not built yet. Run 'npm run build' first.");
    return false;
  }

  try {
    for (const pluginDest of pluginLocations) {
      const destDir = path.dirname(pluginDest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(pluginSource, pluginDest);
      console.log(`✅ Plugin copied to ${path.dirname(pluginDest).replace(targetDir, ".")}/`);
    }
    return true;
  } catch (error) {
    console.error("❌ Failed to copy plugin:", error.message);
    return false;
  }
}

function registerCliBridge(targetDir) {
  console.log("\n🔗 Setting up CLI bridge...");

  const npmPrefix = execSync("npm prefix", { encoding: "utf8" }).trim();
  const packageJsonPath = path.join(targetDir, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.log("⚠️  No package.json found, skipping CLI registration");
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    if (!pkg.bin) pkg.bin = {};
    if (!pkg.bin["strray-ai"]) {
      pkg.bin["strray-ai"] = "node_modules/strray-ai/dist/cli/index.js";
      fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), "utf8");
      console.log("✅ CLI bridge registered");
    } else {
      console.log("ℹ️  CLI bridge already registered");
    }

    return true;
  } catch (error) {
    console.warn("⚠️  Failed to register CLI bridge:", error.message);
    return false;
  }
}

function createSymlink(targetDir) {
  console.log("\n🔗 Creating symlinks...");

  const scriptsDest = path.join(targetDir, "scripts");
  const distSource = path.join(PROJECT_ROOT, "dist");
  const distDest = path.join(targetDir, "dist");
  const strraySource = path.join(PROJECT_ROOT, ".strray");
  const strrayDest = path.join(targetDir, ".strray");

  const symlinks = [
    { src: distSource, dest: distDest, name: "dist" },
    { src: strraySource, dest: strrayDest, name: ".strray" },
  ];

  for (const { src, dest, name } of symlinks) {
    try {
      if (fs.existsSync(dest)) {
        const stat = fs.lstatSync(dest);
        if (stat.isSymbolicLink()) {
          console.log(`ℹ️  ${name} symlink already exists`);
        } else {
          console.log(`⚠️  ${name} exists but is not a symlink`);
        }
      } else {
        fs.symlinkSync(src, dest, "dir");
        console.log(`✅ Created ${name} symlink`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to create ${name} symlink:`, error.message);
    }
  }
}

async function runPostinstall(targetDir) {
  console.log("\n🔧 Running postinstall configuration...");

  const postinstallScript = path.join(PROJECT_ROOT, "scripts/node/postinstall.cjs");

  if (!fs.existsSync(postinstallScript)) {
    console.log("⚠️  Postinstall script not found, skipping...");
    return false;
  }

  try {
    execSync(`node "${postinstallScript}"`, {
      stdio: "inherit",
      cwd: PROJECT_ROOT,
      env: { ...process.env, PWD: targetDir },
    });
    console.log("✅ Postinstall complete");
    return true;
  } catch (error) {
    console.warn("⚠️  Postinstall had issues:", error.message);
    return false;
  }
}

async function confirmInstallation(options) {
  if (options.yes) return true;

  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q) =>
    new Promise((resolve) => rl.question(q, resolve));

  console.log("\n📋 Installation Summary:");

  if (options.standalone) {
    console.log("  - Standalone mode (no OpenCode)");
    console.log("  - MCP servers only (for Hermes Agent)");
  } else {
    console.log("  - OpenCode detection + auto-install");
    console.log("  - StringRay kernel layering");
  }

  if (options.withSkills || options.full) {
    console.log("  - Antigravity skills");
  }
  if (options.full) {
    console.log("  - Impeccable skill (stub)");
    console.log("  - OpenViking skill (stub)");
  }

  const answer = await question("\n❓ Proceed with installation? [Y/n] ");
  rl.close();

  return answer.toLowerCase() !== "n";
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  printBanner();

  const confirmed = await confirmInstallation(options);
  if (!confirmed) {
    console.log("\n❌ Installation cancelled");
    process.exit(0);
  }

  const targetDir = process.cwd();
  console.log(`\n📍 Target directory: ${targetDir}`);

  // Skip OpenCode check in standalone mode
  if (!options.standalone) {
    const hasOpenCode = await checkOpenCodeInstallation();
    if (!hasOpenCode) {
      const installed = await installOpenCode();
      if (!installed) {
        console.error("\n❌ Failed to install OpenCode. Please install manually:");
        console.error("   npx opencode install --yes");
        console.error("\nOr use --standalone mode to install MCP servers without OpenCode:");
        console.error("   npx strray-ai install --standalone");
        process.exit(1);
      }
    }
  } else {
    console.log("\n🔓 Standalone mode: Skipping OpenCode check");
  }

  await layerKernel(targetDir);

  if (options.withSkills || options.full) {
    await installAntigravity();
  }

  if (options.full) {
    await installImpeccable();
    await installOpenViking();
  }

  await copyPlugin(targetDir);

  createSymlink(targetDir);

  registerCliBridge(targetDir);

  await runPostinstall(targetDir);

  if (options.standalone) {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║              ✅ Standalone Installation Complete!               ║
╚══════════════════════════════════════════════════════════════════╝

📋 Next Steps:
  1. Configure MCP servers in Hermes: ~/.hermes/config.yaml
  2. Run 'npx strray-ai status' to verify installation
  3. Try 'hermes' to start using MCP servers

📚 Hermes Setup: https://github.com/nilslice/hermes
📚 Documentation: https://github.com/htafolla/stringray#hermes-agent-integration
`);
  } else {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    ✅ Installation Complete!                     ║
╚══════════════════════════════════════════════════════════════════╝

📋 Next Steps:
  1. Restart OpenCode to load the plugin
  2. Run 'npx strray-ai status' to verify installation
  3. Try '@enforcer analyze this code' to test the plugin

📚 Documentation: https://github.com/htafolla/stringray
`);
  }
}

main().catch((error) => {
  console.error("\n❌ Installation failed:", error.message);
  process.exit(1);
});
