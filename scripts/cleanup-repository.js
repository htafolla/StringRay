#!/usr/bin/env node

/**
 * Repository Cleanup Script
 *
 * Removes accidentally committed test artifacts, npm packages,
 * and temporary directories from the repository.
 *
 * @version 1.0.0
 * @since 2026-01-15
 */

import fs from "fs";
import path from "path";

// Files and directories to remove
const CLEANUP_TARGETS = [
  // NPM package files
  "stringray-ai-1.0.9.tgz",
  "stringray-ai-1.0.5.tgz",

  // Test directories (accidentally committed)
  "strray-final-test",
  "deployed-test",
  "final-orchestration-test",
  "final-production-test",
  "deployment-test",
  "test-deployment",
  "deployment-final-test",
  "test-install",
  "final-validation",
  "final-stringray",
  "final-stringray-fixed",
  "final-complete",
  "final-verification",

  // Other potential artifacts
  "npm-debug.log*",
  ".DS_Store",
  "Thumbs.db",

  // Build artifacts in dist
  "dist/test-utils",
  "dist/testing",

  // Log files (keep activity.log as it may be needed)
  "logs/monitoring/memory-monitor-*.log",
  ".opencode/logs/strray-plugin-*.log",
];

function cleanupRepository() {
  console.log("🧹 Starting Repository Cleanup");
  console.log("===============================");

  let totalRemoved = 0;
  let totalSize = 0;

  for (const target of CLEANUP_TARGETS) {
    try {
      // Handle glob patterns
      if (target.includes("*")) {
        // For glob patterns, we'll handle them manually
        const files = fs.readdirSync(".").filter((file) => {
          if (target === "*.log") return file.endsWith(".log");
          if (target === "npm-debug.log*")
            return file.startsWith("npm-debug.log");
          return false;
        });

        for (const file of files) {
          if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            totalSize += stats.size;
            fs.unlinkSync(file);
            console.log(`✅ Removed file: ${file}`);
            totalRemoved++;
          }
        }
      } else {
        // Handle direct paths
        const fullPath = path.resolve(target);
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            // Remove directory recursively
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`✅ Removed directory: ${target}/`);
          } else {
            // Remove file
            fs.unlinkSync(fullPath);
            totalSize += stats.size;
            console.log(`✅ Removed file: ${target}`);
          }
          totalRemoved++;
        }
      }
    } catch (error) {
      console.error(`❌ Error removing ${target}:`, error.message);
    }
  }

  console.log("\n===============================");
  console.log("🎉 Repository Cleanup Complete!");
  console.log(`📊 Summary:`);
  console.log(`   Items removed: ${totalRemoved}`);
  console.log(`   Space freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Repository cleaned for production use`);
}

// Run the cleanup
cleanupRepository().catch(console.error);
