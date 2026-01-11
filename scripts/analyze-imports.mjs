#!/usr/bin/env node

/**
 * Import Consistency Fixer
 * Scans codebase and fixes import inconsistencies that cause module resolution issues
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = './src';

function scanDirectory(dir, results = []) {
  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath, results);
      } else if (stat.isFile() && extname(file) === '.ts') {
        results.push(filePath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dir}:`, error.message);
  }

  return results;
}

function analyzeImports(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('import') && line.includes('from')) {
      // Check for problematic patterns
      if (line.includes("from '../src/") || line.includes("from './src/")) {
        issues.push({
          line: i + 1,
          type: 'src-directory-import',
          message: 'Import from src/ directory detected',
          lineContent: line
        });
      }

      if (line.includes("from './dist/") || line.includes("from '../dist/")) {
        issues.push({
          line: i + 1,
          type: 'dist-import-in-source',
          message: 'Import from dist/ directory in source file',
          lineContent: line
        });
      }
    }
  }

  return issues;
}

function generateReport(allIssues) {
  console.log('🔍 IMPORT CONSISTENCY ANALYSIS REPORT');
  console.log('='.repeat(50));

  let totalFiles = 0;
  let filesWithIssues = 0;
  let totalIssues = 0;

  for (const [filePath, issues] of Object.entries(allIssues)) {
    totalFiles++;
    if (issues.length > 0) {
      filesWithIssues++;
      totalIssues += issues.length;
    }
  }

  console.log(`📊 Summary:`);
  console.log(`   Total TypeScript files: ${totalFiles}`);
  console.log(`   Files with import issues: ${filesWithIssues}`);
  console.log(`   Total import issues: ${totalIssues}`);
  console.log('');

  if (filesWithIssues > 0) {
    console.log('🚨 FILES WITH IMPORT ISSUES:');
    console.log('');

    for (const [filePath, issues] of Object.entries(allIssues)) {
      if (issues.length > 0) {
        console.log(`📁 ${filePath}:`);
        issues.forEach(issue => {
          console.log(`   Line ${issue.line}: ${issue.message}`);
          console.log(`   → ${issue.lineContent}`);
        });
        console.log('');
      }
    }

    console.log('💡 RECOMMENDED FIXES:');
    console.log('1. Replace src/ imports with relative paths (../)');
    console.log('2. Remove dist/ imports from source files');
    console.log('3. Use .js extensions for ESM imports');
    console.log('4. Consider index.ts files for cleaner imports');
  } else {
    console.log('✅ NO IMPORT ISSUES FOUND!');
  }

  console.log('='.repeat(50));
  return { totalFiles, filesWithIssues, totalIssues };
}

async function main() {
  console.log('🔧 Scanning codebase for import consistency issues...\n');

  const tsFiles = scanDirectory(SRC_DIR);
  console.log(`Found ${tsFiles.length} TypeScript files`);
  const allIssues = {};

  for (const filePath of tsFiles) {
    const issues = analyzeImports(filePath);
    if (issues.length > 0) {
      allIssues[filePath] = issues;
    }
  }

  const report = generateReport(allIssues);

  console.log('\n🎯 IMPORT CONSISTENCY RULE ENFORCEMENT:');
  if (report.filesWithIssues > 0) {
    console.log('❌ FAIL: Import consistency violations detected');
    console.log('💡 Enable the "import-consistency" rule in rule-enforcer.ts to block these at write-time');
  } else {
    console.log('✅ PASS: All imports are consistent');
  }

  process.exit(report.filesWithIssues > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ Analysis failed:', error.message);
  process.exit(1);
});