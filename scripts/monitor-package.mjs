#!/usr/bin/env node

/**
 * StringRay Package Monitor
 * Monitors npm package health and user feedback
 */

import { execSync } from "child_process";

console.log("📊 StringRay Package Monitor");
console.log("============================\n");

// Check package info
try {
  console.log("📦 Package Information:");
  const packageInfo = execSync("npm view strray-ai --json", {
    encoding: "utf8",
  });
  const info = JSON.parse(packageInfo);

  console.log(`  Version: ${info.version}`);
  console.log(`  Downloads (last week): ${info.downloads || "N/A"}`);
  console.log(`  Downloads (last month): ${info.downloadsPeriod || "N/A"}`);
  console.log(`  License: ${info.license}`);
  console.log(`  Dependencies: ${Object.keys(info.dependencies || {}).length}`);
  console.log("");
} catch (error) {
  console.error("❌ Failed to fetch package info:", error.message);
}

// Check for issues
try {
  console.log("🐛 GitHub Issues:");
  // Note: This would require GitHub API token in a real implementation
  console.log("  Note: Manual monitoring recommended for GitHub issues");
  console.log("  Check: https://github.com/htafolla/stringray/issues");
  console.log("");
} catch (error) {
  console.error("❌ Failed to check issues:", error.message);
}

// Recommendations
console.log("💡 Monitoring Recommendations:");
console.log("  • Check npm download stats weekly");
console.log("  • Monitor GitHub issues and discussions");
console.log("  • Watch for user feedback in Discord/GitHub");
console.log("  • Run validation tests after major Node.js updates");
console.log("  • Monitor oh-my-opencode compatibility");

console.log("\n✅ Package monitoring setup complete");
