#!/usr/bin/env node

// Validate codex integration in both development and deployed environments
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Check if we're in development or deployed environment
const isDevelopment = fs.existsSync("src/core/codex-injector.ts") || fs.existsSync("src/plugin/strray-codex-injection.ts");
const isDeployed = fs.existsSync("node_modules/strray-ai");

if (!isDevelopment && !isDeployed) {
  process.exit(1); // Not in a valid environment
}

// In deployed environment, check if the plugin was installed correctly
if (isDeployed) {
  console.log("DEBUG: Running in deployed environment");
  console.log("DEBUG: Current directory:", process.cwd());

  // Check if .mcp.json exists (created by postinstall)
  // If it doesn't exist, try to run postinstall script
  const mcpExists = fs.existsSync(".mcp.json");
  console.log("DEBUG: .mcp.json exists:", mcpExists);
  if (!mcpExists) {
    console.log(
      "DEBUG: .mcp.json not found, attempting to run postinstall script",
    );
    try {
      // Run the postinstall script
      execSync("node node_modules/strray-ai/scripts/postinstall.cjs", {
        stdio: "inherit",
      });
      console.log("DEBUG: Postinstall script executed successfully");
    } catch (error) {
      console.log("DEBUG: Failed to run postinstall script:", error.message);
      process.exit(1);
    }
  }

  // Check if package.json exists
  const pkgExists = fs.existsSync("package.json");
  console.log("DEBUG: package.json exists:", pkgExists);
  if (!pkgExists) {
    console.log("DEBUG: package.json not found, exiting with code 1");
    process.exit(1);
  }

  // Check if the plugin files exist
  const pluginExists = fs.existsSync(
    "node_modules/strray-ai/dist/plugin/strray-codex-injection.js",
  );
  console.log("DEBUG: plugin file exists:", pluginExists);
  if (!pluginExists) {
    console.log("DEBUG: plugin file not found, exiting with code 1");
    process.exit(1);
  }

  console.log("DEBUG: All checks passed, exiting with code 0");
  process.exit(0); // All checks passed for deployed environment
}

// Development environment checks
if (isDevelopment) {
  // Check if codex files exist
  const codexFiles = [
    "docs/framework/agents_template.md",
    ".opencode/strray/agents_template.md",
  ];

  let codexFound = false;
  for (const file of codexFiles) {
    if (fs.existsSync(file)) {
      codexFound = true;

      // Basic validation of codex content
      try {
        const content = fs.readFileSync(file, "utf-8");
        const versionMatch = content.match(
          /\*\*Version\*\*:\s*(\d+\.\d+\.\d+)/,
        );
        if (versionMatch) {
          console.log(`Found codex version: ${versionMatch[1]}`);
        }

        const termMatches = content.match(/####\s*\d+\.\s/g);
        if (termMatches) {
          console.log(`Found ${termMatches.length} codex terms`);
        }
      } catch (error) {
        console.warn(`Warning: Could not read ${file}:`, error.message);
      }
    }
  }

  if (!codexFound) {
    console.error("No codex files found");
    process.exit(1);
  }

  // Check if built files exist
  if (fs.existsSync("dist")) {
    console.log("dist directory exists");
  } else {
    console.warn("dist directory not found");
  }

  // Check package.json
  if (fs.existsSync("package.json")) {
    try {
      const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
      console.log(`Package: ${pkg.name}@${pkg.version}`);
    } catch (error) {
      console.warn("Could not parse package.json:", error.message);
    }
  } else {
    console.error("package.json not found");
    process.exit(1);
  }

  // Check .strray directory
  if (fs.existsSync(".strray")) {
    console.log(".strray directory exists");
    if (fs.existsSync(".strray/codex.json")) {
      console.log("codex.json exists");
    } else {
      console.warn("codex.json not found in .strray");
    }
  } else {
    console.warn(".strray directory not found");
  }
}

console.log("All validation checks passed");
process.exit(0); // All checks passed
