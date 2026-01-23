#!/usr/bin/env node

/**
 * Console.log Cleanup Script for StringRay Framework
 * Converts console.log statements to frameworkLogger.log() calls
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to process - Final selective cleanup (MCP servers + core framework only)
// SKIP: CLI files (keep console.log for user output) and test files (keep for debugging)
const filesToProcess = [
  // MCP Server files (convert to frameworkLogger)
  'src/mcps/framework-compliance-audit.server.ts',
  'src/mcps/knowledge-skills/testing-strategy.server.ts',
  'src/mcps/knowledge-skills/testing-best-practices.server.ts',
  'src/mcps/knowledge-skills/refactoring-strategies.server.ts',
  'src/mcps/knowledge-skills/devops-deployment.server.ts',
  'src/mcps/knowledge-skills/database-design.server.ts',
  'src/mcps/knowledge-skills/ui-ux-design.server.ts',
  'src/mcps/lint.server.ts',

  // Core framework files (convert to frameworkLogger)
  'src/reporting/framework-reporting-system.ts',
  'src/security/security-hardening-system.ts',
  'src/security/examples.ts',
  'src/plugins/plugin-system.ts',
  'src/context-loader.ts',
  'src/postprocessor/analysis/FailureAnalysisEngine.ts',
  'src/postprocessor/redeploy/RetryHandler.ts',
  'src/delegation/complexity-analyzer.ts',
  'src/monitoring/memory-monitor.ts',
  'src/utils/path-resolver.ts',
];

function convertConsoleLogToFrameworkLogger(content, filePath) {
  // Get component name from file path
  const component = path.basename(filePath, '.ts').replace(/([A-Z])/g, '-$1').toLowerCase();

  // Pattern to match console.log statements
  const consoleLogPattern = /console\.log\(([^;]+)\);?/g;

  return content.replace(consoleLogPattern, (match, args) => {
    // Extract the message content
    const message = args.trim();

    // Determine status based on message content
    let status = 'info';
    if (message.includes('❌') || message.includes('error') || message.includes('failed')) {
      status = 'error';
    } else if (message.includes('✅') || message.includes('success')) {
      status = 'success';
    }

    // Create action name from message (simplified)
    const action = message.replace(/[^\w]/g, '-').replace(/-+/g, '-').toLowerCase().substring(0, 50);

    // Return framework logger call
    return `await frameworkLogger.log('${component}', '${action}', '${status}', { message: ${args} });`;
  });
}

function processFile(filePath) {
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }

  console.log(`Processing ${filePath}...`);

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if frameworkLogger is already imported
  if (!content.includes('frameworkLogger')) {
    // Add import if not present
    const importStatement = "import { frameworkLogger } from \"../framework-logger.js\";";
    if (!content.includes(importStatement)) {
      // Find the last import statement
      const importMatch = content.match(/import.*from.*;\n/g);
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1];
        content = content.replace(lastImport, lastImport + importStatement + '\n');
      }
    }
  }

  const newContent = convertConsoleLogToFrameworkLogger(content, filePath);

  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ Updated ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`);
  }
}

// Process all files
filesToProcess.forEach(processFile);

console.log('🎉 Console.log cleanup complete!');