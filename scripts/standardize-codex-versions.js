#!/usr/bin/env node

/**
 * Codex Version Standardization Script
 *
 * Fixes all version discrepancies in the Universal Development Codex references
 * across the entire codebase to ensure consistency.
 *
 * @version 1.0.0
 * @since 2026-01-15
 */

import fs from 'fs';
import path from 'path';

// Official codex version information
const OFFICIAL_CODEX = {
  version: 'v1.2.24',
  termsCount: 50,
  lastUpdated: '2026-01-15'
};

// Files and patterns to update
const UPDATE_PATTERNS = [
  // Version references
  {
    pattern: /Universal Development Codex v1\.2\.20/g,
    replacement: `Universal Development Codex ${OFFICIAL_CODEX.version}`
  },
  {
    pattern: /Universal Development Codex v1\.2\.24/g,
    replacement: `Universal Development Codex ${OFFICIAL_CODEX.version}`
  },

  // Term count references
  {
    pattern: /50-term/g,
    replacement: `${OFFICIAL_CODEX.termsCount}-term`
  },
  {
    pattern: /50 Universal Development Codex/g,
    replacement: `${OFFICIAL_CODEX.termsCount} Universal Development Codex`
  },
  {
    pattern: /50-term Universal Development Codex/g,
    replacement: `${OFFICIAL_CODEX.termsCount}-term Universal Development Codex`
  },

  // Specific incorrect counts
  {
    pattern: /50 terms/g,
    replacement: `${OFFICIAL_CODEX.termsCount} terms`
  },
  {
    pattern: /50-term/g,
    replacement: `${OFFICIAL_CODEX.termsCount}-term`
  },
  {
    pattern: /50 terms/g,
    replacement: `${OFFICIAL_CODEX.termsCount} terms`
  },
  {
    pattern: /50-term/g,
    replacement: `${OFFICIAL_CODEX.termsCount}-term`
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

async function standardizeCodexVersions() {
  console.log('🔧 Starting Codex Version Standardization');
  console.log(`📋 Target Version: ${OFFICIAL_CODEX.version} (${OFFICIAL_CODEX.termsCount} terms)`);
  console.log('='.repeat(50));

  // Find all files that might reference the codex
  const extensions = ['.ts', '.js', '.md', '.json', '.txt'];
  const files = findFiles('.', extensions);

  let totalFilesUpdated = 0;
  let totalChanges = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let updatedContent = content;
      let fileChanged = false;

      // Apply all update patterns
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

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Codex Version Standardization Complete!');
  console.log(`📊 Summary:`);
  console.log(`   Files Updated: ${totalFilesUpdated}`);
  console.log(`   Total Changes: ${totalChanges}`);
  console.log(`   Official Version: ${OFFICIAL_CODEX.version}`);
  console.log(`   Terms Count: ${OFFICIAL_CODEX.termsCount}`);
  console.log(`   Last Updated: ${OFFICIAL_CODEX.lastUpdated}`);
}

// Run the standardization
standardizeCodexVersions().catch(console.error);