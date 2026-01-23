#!/usr/bin/env node

/**
 * Simple Console.log Remover - Removes all console.log statements from source files
 * This ensures compliance with the Universal Development Codex "clean-debug-logs" rule
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to remove console.log statements from a file
function removeConsoleLogs(filePath) {
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalLength = content.length;

  // Remove console.log statements (basic pattern)
  content = content.replace(/console\.log\([^;]*\);\s*/g, '');

  // Remove multi-line console.log statements
  content = content.replace(/console\.log\([^}]*}\);\s*/g, '');

  // Clean up extra whitespace
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (content.length !== originalLength) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Cleaned ${filePath}`);
  }
}

// Find all TypeScript files in src/ excluding test files and CLI
const srcDir = path.join(__dirname, '..', 'src');
const excludePatterns = ['__tests__', 'test-utils', 'cli'];

function shouldProcessFile(filePath) {
  const relativePath = path.relative(srcDir, filePath);
  return !excludePatterns.some(pattern => relativePath.includes(pattern));
}

function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.js')) {
      if (shouldProcessFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

console.log('🧹 Starting console.log cleanup...');

const tsFiles = findTsFiles(srcDir);
console.log(`Found ${tsFiles.length} source files to process`);

tsFiles.forEach(filePath => {
  const relativePath = path.relative(process.cwd(), filePath);
  removeConsoleLogs(filePath);
});

console.log('✨ Console.log cleanup complete! All console.log statements removed from core framework files.');