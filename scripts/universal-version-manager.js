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

import fs from 'fs';
import path from 'path';

// Official version information - SINGLE SOURCE OF TRUTH
const OFFICIAL_VERSIONS = {
  // Framework versions
  framework: {
    version: '1.0.4',
    displayName: 'StringRay AI v1.0.4',
    lastUpdated: '2026-01-15'
  },

  // Codex versions
  codex: {
    version: 'v1.2.24',
    termsCount: 50,
    lastUpdated: '2026-01-15'
  },

  // External dependencies
  dependencies: {
    ohMyOpencode: '2.14.0'
  }
};

// Comprehensive update patterns for all version types
const UPDATE_PATTERNS = [
  // === FRAMEWORK VERSION UPDATES ===
  {
    pattern: /StringRay Framework v1\.0\.0/g,
    replacement: OFFICIAL_VERSIONS.framework.displayName
  },
  {
    pattern: /StrRay Framework v1\.0\.0/g,
    replacement: OFFICIAL_VERSIONS.framework.displayName
  },
  {
    pattern: /StringRay AI v1\.0\.[0-9]+/g,
    replacement: OFFICIAL_VERSIONS.framework.displayName
  },

  // === CODEX VERSION UPDATES ===
  {
    pattern: /Universal Development Codex v1\.2\.20/g,
    replacement: `Universal Development Codex ${OFFICIAL_VERSIONS.codex.version}`
  },
  {
    pattern: /Universal Development Codex v1\.2\.22/g,
    replacement: `Universal Development Codex ${OFFICIAL_VERSIONS.codex.version}`
  },
  {
    pattern: /Universal Development Codex v1\.2\.24/g,
    replacement: `Universal Development Codex ${OFFICIAL_VERSIONS.codex.version}`
  },

  // === TERM COUNT UPDATES ===
  {
    pattern: /50-term/g,
    replacement: `${OFFICIAL_VERSIONS.codex.termsCount}-term`
  },
  {
    pattern: /50 Universal Development Codex/g,
    replacement: `${OFFICIAL_VERSIONS.codex.termsCount} Universal Development Codex`
  },
  {
    pattern: /50-term/g,
    replacement: `${OFFICIAL_VERSIONS.codex.termsCount}-term`
  },
  {
    pattern: /50 Universal Development Codex/g,
    replacement: `${OFFICIAL_VERSIONS.codex.termsCount} Universal Development Codex`
  },
  {
    pattern: /50-term Universal Development Codex/g,
    replacement: `${OFFICIAL_VERSIONS.codex.termsCount}-term Universal Development Codex`
  },

  // === DEPENDENCY VERSION UPDATES ===
  {
    pattern: /oh-my-opencode v2\.12\.0/g,
    replacement: `oh-my-opencode v${OFFICIAL_VERSIONS.dependencies.ohMyOpencode}`
  },
  {
    pattern: /oh-my-opencode v2\.14\.0/g,
    replacement: `oh-my-opencode v${OFFICIAL_VERSIONS.dependencies.ohMyOpencode}`
  }
];

// Simple recursive file finder
function findFiles(dir, extensions, ignoreDirs = ['node_modules', '.git', 'dist', 'build']) {
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

async function standardizeVersions() {
  console.log('🔧 Starting Universal Version Standardization');
  console.log(`📋 Framework: ${OFFICIAL_VERSIONS.framework.displayName}`);
  console.log(`📋 Codex: ${OFFICIAL_VERSIONS.codex.version} (${OFFICIAL_VERSIONS.codex.termsCount} terms)`);
  console.log(`📋 oh-my-opencode: v${OFFICIAL_VERSIONS.dependencies.ohMyOpencode}`);
  console.log('='.repeat(60));

  // Find all files that might contain version references
  const extensions = ['.ts', '.js', '.md', '.json', '.txt'];
  const files = findFiles('.', extensions);

  let totalFilesUpdated = 0;
  let totalChanges = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
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
        fs.writeFileSync(file, updatedContent, 'utf8');
        console.log(`✅ Updated: ${file}`);
        totalFilesUpdated++;
      }

    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Universal Version Standardization Complete!');
  console.log(`📊 Summary:`);
  console.log(`   Files Updated: ${totalFilesUpdated}`);
  console.log(`   Total Changes: ${totalChanges}`);
  console.log(`   Framework Version: ${OFFICIAL_VERSIONS.framework.version}`);
  console.log(`   Codex Version: ${OFFICIAL_VERSIONS.codex.version} (${OFFICIAL_VERSIONS.codex.termsCount} terms)`);
  console.log(`   Dependencies Updated: ✅`);
  console.log(`   Last Updated: ${OFFICIAL_VERSIONS.framework.lastUpdated}`);

  // Version management reminder
  console.log('\n💡 To update versions in the future:');
  console.log('   1. Edit OFFICIAL_VERSIONS object in this script');
  console.log('   2. Run: node scripts/standardize-codex-versions.js');
  console.log('   3. Commit the changes');
}

// Run the standardization
standardizeVersions().catch(console.error);