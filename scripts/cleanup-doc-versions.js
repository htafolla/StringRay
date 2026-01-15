#!/usr/bin/env node

/**
 * Documentation Version Cleanup Script
 *
 * Removes unnecessary version references from documentation and converts
 * necessary ones to variables for maintainability.
 *
 * @version 1.0.0
 * @since 2026-01-15
 */

import fs from 'fs';
import path from 'path';

// Version variables for documentation
const VERSION_VARS = {
  FRAMEWORK_VERSION: '1.0.0',
  CODEX_VERSION: '1.2.24',
  OH_MY_OPENCODE_VERSION: '2.14.0'
};

// Patterns to remove (unnecessary versions)
const REMOVE_PATTERNS = [
  // Generic version references that don't add value
  /\bVersion: v[0-9]+\.[0-9]+\.[0-9]+\b/g,
  /\bv[0-9]+\.[0-9]+\.[0-9]+ \| /g,
  /\bLast Updated: [0-9]{4}-[0-9]{2}-[0-9]{2} \| /g,
  /\bFramework: [^|]*v[0-9]+\.[0-9]+\.[0-9]+/g,

  // Specific hardcoded versions that should be removed
  /\bStrRay Framework v1\.0\.0\b/g,
  /\bUniversal Development Codex v1\.2\.22\b/g,
  /\boh-my-opencode v2\.12\.0\b/g,
  /\boh-my-opencode v2\.14\.0\b/g,

  // Archive version references (keep in archive files)
  // These will be handled separately for archive files
];

// Patterns to replace with variables (necessary versions)
const REPLACE_PATTERNS = [
  // Framework version in headers/titles
  {
    pattern: /StrRay Framework v1\.0\.0/g,
    replacement: `StrRay Framework v${VERSION_VARS.FRAMEWORK_VERSION}`
  },
  // Codex version in technical docs
  {
    pattern: /Universal Development Codex v1\.2\.22/g,
    replacement: `Universal Development Codex v${VERSION_VARS.CODEX_VERSION}`
  },
  // oh-my-opencode version
  {
    pattern: /oh-my-opencode v2\.14\.0/g,
    replacement: `oh-my-opencode v${VERSION_VARS.OH_MY_OPENCODE_VERSION}`
  }
];

// Files to skip (archives should keep historical versions)
const SKIP_FILES = [
  'docs/archive/',
  'CHANGELOG.md'
];

// Simple recursive file finder
function findFiles(dir, extensions, skipDirs = []) {
  const files = [];

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!skipDirs.some(skip => fullPath.includes(skip))) {
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

async function cleanupDocumentationVersions() {
  console.log('🧹 Starting Documentation Version Cleanup');
  console.log(`📋 Version Variables:`);
  console.log(`   Framework: v${VERSION_VARS.FRAMEWORK_VERSION}`);
  console.log(`   Codex: v${VERSION_VARS.CODEX_VERSION}`);
  console.log(`   oh-my-opencode: v${VERSION_VARS.OH_MY_OPENCODE_VERSION}`);
  console.log('='.repeat(50));

  // Find all documentation files
  const extensions = ['.md', '.txt'];
  const files = findFiles('docs', extensions, SKIP_FILES);

  let totalFilesUpdated = 0;
  let totalChanges = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let updatedContent = content;
      let fileChanged = false;

      // First, apply replacements with variables
      for (const { pattern, replacement } of REPLACE_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          updatedContent = updatedContent.replace(pattern, replacement);
          totalChanges += matches.length;
          fileChanged = true;
        }
      }

      // Then, remove unnecessary version references
      for (const pattern of REMOVE_PATTERNS) {
        const matches = updatedContent.match(pattern);
        if (matches) {
          // For removal patterns, replace with empty string
          updatedContent = updatedContent.replace(pattern, '');
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
  console.log('🎉 Documentation Version Cleanup Complete!');
  console.log(`📊 Summary:`);
  console.log(`   Files Updated: ${totalFilesUpdated}`);
  console.log(`   Total Changes: ${totalChanges}`);
  console.log(`   Version Variables Established: ✅`);
}

// Run the cleanup
cleanupDocumentationVersions().catch(console.error);