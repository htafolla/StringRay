#!/usr/bin/env node

/**
 * StrRay Standalone Framework Initialization
 *
 * Converted from shell script to TypeScript for better integration
 * and cross-platform compatibility.
 */

import { execSync, spawn } from "child_process";
import { existsSync, copyFileSync, mkdirSync } from "fs";
import { join } from "path";
import { compare as compareVersions } from "semver";

function log(message: string) {
  console.log(message);
}

function error(message: string) {
  console.error(`❌ Error: ${message}`);
}

function success(message: string) {
  console.log(`✅ ${message}`);
}

async function main() {
  log("🚀 StrRay Standalone Framework Initialization");
  log("============================================");

  // Check if we're in the right directory
  if (!existsSync("src/codex-injector.ts")) {
    error("Please run this script from the strray-standalone directory");
    process.exit(1);
  }

  // Check if Node.js is installed
  try {
    execSync("node --version", { stdio: "pipe" });
  } catch {
    error("Node.js is not installed. Please install Node.js 18+ first.");
    process.exit(1);
  }

  // Check Node.js version
  const nodeVersionOutput = execSync("node --version", {
    encoding: "utf8",
  }).trim();
  const nodeVersion = nodeVersionOutput.replace("v", "");
  const requiredVersion = "18.0.0";

  if (compareVersions(nodeVersion, requiredVersion) < 0) {
    error(
      `Node.js version ${nodeVersion} is too old. Please upgrade to Node.js 18+.`,
    );
    process.exit(1);
  }

  success(`Node.js ${nodeVersion} detected`);

  // Install dependencies
  log("📦 Installing dependencies...");
  try {
    // Check if bun is available
    execSync("bun --version", { stdio: "pipe" });
    log("🐰 Using Bun for faster installation...");
    execSync("bun install", { stdio: "inherit" });
  } catch {
    // Fall back to npm
    execSync("npm install", { stdio: "inherit" });
  }

  // Build the framework
  log("🔨 Building framework...");
  try {
    execSync("npm run build", { stdio: "inherit" });
  } catch {
    error("Build failed. Please check TypeScript errors.");
    process.exit(1);
  }

  // Validate codex
  log("🔍 Validating codex...");
  try {
    execSync("node scripts/validate-codex.js", { stdio: "inherit" });
  } catch {
    error("Codex validation failed.");
    process.exit(1);
  }

  // Create .opencode directory if it doesn't exist
  const opencodeDir = ".opencode";
  if (!existsSync(opencodeDir)) {
    mkdirSync(opencodeDir, { recursive: true });
    log("📁 Created .opencode directory");
  }

  // Copy necessary files to .opencode if they don't exist
  const agentsTemplateSrc = "src/agents_template.md";
  const agentsTemplateDest = join(opencodeDir, "agents_template.md");

  if (existsSync(agentsTemplateSrc) && !existsSync(agentsTemplateDest)) {
    copyFileSync(agentsTemplateSrc, agentsTemplateDest);
    log("📋 Copied agents template to .opencode/");
  }

  log("");
  success("Standalone framework ready for repository");
  log("💡 Copy this folder to a new repository to create StrRay Framework");
  log("");
  log("📚 Next steps:");
  log("   1. Copy this folder to your target repository");
  log("   2. Run 'npm run init' in the target repository");
  log("   3. Follow the framework documentation for setup");
  log("");
}

main().catch((err) => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
