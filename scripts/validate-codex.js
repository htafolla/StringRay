#!/usr/bin/env node

// Validate codex integration in both development and deployed environments
import fs from "fs";
import path from "path";

// Check if we're in development or deployed environment
const isDevelopment = fs.existsSync("src/codex-injector.ts");
const isDeployed = fs.existsSync("node_modules/stringray-ai");

if (!isDevelopment && !isDeployed) {
  process.exit(1); // Not in a valid environment
}

// In deployed environment, check if the plugin was installed correctly
if (isDeployed) {
  console.log('DEBUG: Running in deployed environment');
  console.log('DEBUG: Current directory:', process.cwd());

  // Check if .mcp.json exists (created by postinstall)
  const mcpExists = fs.existsSync(".mcp.json");
  console.log('DEBUG: .mcp.json exists:', mcpExists);
  if (!mcpExists) {
    console.log('DEBUG: .mcp.json not found, exiting with code 1');
    process.exit(1);
  }

  // Check if package.json exists
  const pkgExists = fs.existsSync("package.json");
  console.log('DEBUG: package.json exists:', pkgExists);
  if (!pkgExists) {
    console.log('DEBUG: package.json not found, exiting with code 1');
    process.exit(1);
  }

  // Check if the plugin files exist
  const pluginExists = fs.existsSync("node_modules/stringray-ai/dist/plugin/plugins/stringray-codex-injection.js");
  console.log('DEBUG: plugin file exists:', pluginExists);
  if (!pluginExists) {
    console.log('DEBUG: plugin file not found, exiting with code 1');
    process.exit(1);
  }

  console.log('DEBUG: All checks passed, exiting with code 0');
  process.exit(0); // All checks passed for deployed environment
}

// Development environment checks
if (isDevelopment) {
  // Check if codex files exist
  const codexFiles = [
    "docs/framework/agents_template.md",
    ".strray/agents_template.md",
  ];

  let codexFound = false;
  for (const file of codexFiles) {
    if (fs.existsSync(file)) {
      codexFound = true;

      // Basic validation of codex content
      try {
        const content = fs.readFileSync(file, "utf-8");
        const versionMatch = content.match(/\*\*Version\*\*:\s*(\d+\.\d+\.\d+)/);
        if (versionMatch) {
        }

        const termMatches = content.match(/####\s*\d+\.\s/g);
        if (termMatches) {
        }
      } catch (error) {}
    }
  }

  if (!codexFound) {
    process.exit(1);
  }

  // Check if built files exist
  if (fs.existsSync("dist")) {
  } else {
  }

  // Check package.json
  if (fs.existsSync("package.json")) {
    try {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    } catch (error) {}
  } else {
    process.exit(1);
  }

  // Check .strray directory
  if (fs.existsSync(".strray")) {
    if (fs.existsSync(".strray/codex.json")) {
    } else {
    }
  } else {
  }
}

process.exit(0); // All checks passed
