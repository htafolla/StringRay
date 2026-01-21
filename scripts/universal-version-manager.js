#!/usr/bin/env node

/**
 * Universal Version Management Script
 *
 * Automatically updates all version references across the StringRay Framework
 * including framework versions, codex versions, and documentation consistency.
 * Ensures single source of truth for all version information.
 *
 * @version 1.0.0
 * @since 2026-01-15
 */

import fs from "fs";
import path from "path";

// Official version information - SINGLE SOURCE OF TRUTH
const OFFICIAL_VERSIONS = {
  // Framework versions
  framework: {
    version: "1.1.1",
    displayName: "StringRay AI v1.1.1",
    lastUpdated: "2026-01-20",
  },

  // Codex versions
  codex: {
    version: "v1.1.1",
    termsCount: 55,
    lastUpdated: "2026-01-16",
  },

  // External dependencies
  dependencies: {
    ohMyOpencode: "2.14.0",
  },
};

// Simple recursive file finder - necessary for explaining complex directory traversal logic
function findFiles(
  dir,
  extensions,
  ignoreDirs = ["node_modules", ".git", "dist", "build"],
) {
  const files = [];

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!ignoreDirs.includes(item)) {
          walk(fullPath);
        }
      } else {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

// Comprehensive update patterns for all version types
const UPDATE_PATTERNS = [
   // === FRAMEWORK VERSION UPDATES ===
    {
      pattern: /"version": "[0-9]+\.[0-9]+\.[0-9]+"/g,
      replacement: `"version": "${OFFICIAL_VERSIONS.framework.version}"`,
    },
    {
      pattern: /StringRay Framework v[0-9]+\.[0-9]+\.[0-9]+/g,
      replacement: OFFICIAL_VERSIONS.framework.displayName,
    },
   {
     pattern: /\*\*📦 Current Version: 1\.[0-9]+\.[0-9]+\*\* - Enterprise production release with automated postinstall configuration, MCP server integration, and comprehensive testing\. Use `npm install strray-ai@latest` for installation\./g,
     replacement: `**📦 Current Version: ${OFFICIAL_VERSIONS.framework.version}** - Enterprise production release with automated postinstall configuration, MCP server integration, and comprehensive testing. Use \`npm install strray-ai@latest\` for installation.`,
   },
   {
     pattern: /# ⚡ StringRay AI v1\.[0-9]+\.[0-9]+ – Bulletproof AI Orchestration for Production-Grade Development/g,
     replacement: `# ⚡ ${OFFICIAL_VERSIONS.framework.displayName} – Bulletproof AI Orchestration for Production-Grade Development`,
   },
   {
     pattern: /version-1\.[0-9]+\.[0-9]+-blue\.svg/g,
     replacement: `version-${OFFICIAL_VERSIONS.framework.version}-blue.svg`,
   },
   {
     pattern: /StrRay Framework v[0-9]+\.[0-9]+\.[0-9]+/g,
     replacement: OFFICIAL_VERSIONS.framework.displayName,
   },
   {
     pattern: /StringRay AI v[0-9]+\.[0-9]+\.[0-9]+/g,
     replacement: OFFICIAL_VERSIONS.framework.displayName,
   },
   {
     pattern: /version-[0-9]+\.[0-9]+\.[0-9]+-blue\.svg/g,
     replacement: `version-${OFFICIAL_VERSIONS.framework.version}-blue.svg`,
   },
   // Framework Version patterns
   {
     pattern: /\*\*Framework Version\*\*: [0-9]+\.[0-9]+\.[0-9]+/g,
     replacement: `**Framework Version**: ${OFFICIAL_VERSIONS.framework.version}`,
   },
   {
     pattern: /\*\*Framework Version:\*\* v[0-9]+\.[0-9]+\.[0-9]+/g,
     replacement: `**Framework Version:** v${OFFICIAL_VERSIONS.framework.version}`,
   },
   {
     pattern: /- Framework Version: StrRay v[0-9]+\.[0-9]+\.[0-9]+/g,
     replacement: `- Framework Version: ${OFFICIAL_VERSIONS.framework.displayName}`,
   },
   {
     pattern: /- Framework Version: [0-9]+\.[0-9]+\.[0-9]+/g,
     replacement: `- Framework Version: ${OFFICIAL_VERSIONS.framework.version}`,
   },
    {
      pattern: /Framework Version: StrRay v[0-9]+\.[0-9]+\.[0-9]+/g,
      replacement: `Framework Version: ${OFFICIAL_VERSIONS.framework.displayName}`,
    },

    // Simple version patterns
    {
      pattern: /StrRay v[0-9]+\.[0-9]+\.[0-9]+/g,
      replacement: OFFICIAL_VERSIONS.framework.displayName,
    },

    // Pre-commit introspection patterns
    {
      pattern: /StringRay [0-9]+\.[0-9]+\.[0-9]+ - Pre-commit Introspection/g,
      replacement: `${OFFICIAL_VERSIONS.framework.displayName} - Pre-commit Introspection`,
    },
    {
      pattern: /🔬 StringRay [0-9]+\.[0-9]+\.[0-9]+ - Pre-commit Introspection/g,
      replacement: `🔬 ${OFFICIAL_VERSIONS.framework.displayName} - Pre-commit Introspection`,
    },

  ];

async function standardizeVersions() {
  console.log("🔧 Starting Universal Version Standardization");
  console.log(`📋 Framework: ${OFFICIAL_VERSIONS.framework.displayName}`);
  console.log(
    `📋 Codex: ${OFFICIAL_VERSIONS.codex.version} (${OFFICIAL_VERSIONS.codex.termsCount} terms)`,
  );
  console.log(
    `📋 oh-my-opencode: v${OFFICIAL_VERSIONS.dependencies.ohMyOpencode}`,
  );
  console.log("=".repeat(60));

  // Find all files that might contain version references
  const extensions = [".ts", ".js", ".md", ".json", ".txt", ".sh"];
  const files = findFiles(".", extensions);

  let totalFilesUpdated = 0;
  let totalChanges = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      let updatedContent = content;
      let fileChanged = false;

      // Apply all version update patterns
      for (const { pattern, replacement } of UPDATE_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          updatedContent = updatedContent.replace(pattern, replacement);
          totalChanges += matches.length;
          fileChanged = true;
        }
      }

      // Write back if changed
      if (fileChanged) {
        fs.writeFileSync(file, updatedContent, "utf8");
        console.log(`✅ Updated: ${file}`);
        totalFilesUpdated++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Universal Version Standardization Complete!");
  console.log(`📊 Summary:`);
  console.log(`   Files Updated: ${totalFilesUpdated}`);
  console.log(`   Total Changes: ${totalChanges}`);
  console.log(`   Framework Version: ${OFFICIAL_VERSIONS.framework.version}`);
  console.log(
    `   Codex Version: ${OFFICIAL_VERSIONS.codex.version} (${OFFICIAL_VERSIONS.codex.termsCount} terms)`,
  );
  console.log(`   Dependencies Updated: ✅`);
  console.log(`   Last Updated: ${OFFICIAL_VERSIONS.framework.lastUpdated}`);

  // Version management reminder
  console.log("\n💡 To update versions in the future:");
  console.log("   1. Edit OFFICIAL_VERSIONS object in this script");
  console.log("   2. Run: node scripts/standardize-codex-versions.js");
  console.log("   3. Commit the changes");
}

// Run the standardization
standardizeVersions().catch(console.error);
