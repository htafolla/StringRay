#!/usr/bin/env node
/**
 * Batch update MCP servers to use centralized shutdown handler
 * 
 * Usage: node scripts/batch-update-shutdown-handler.mjs
 */

import * as fs from 'fs';
import * as path from 'path';

const serverFiles = [
  'src/mcps/knowledge-skills/api-design.server.ts',
  'src/mcps/knowledge-skills/architecture-patterns.server.ts',
  'src/mcps/knowledge-skills/code-analyzer.server.ts',
  'src/mcps/knowledge-skills/code-review.server.ts',
  'src/mcps/knowledge-skills/database-design.server.ts',
  'src/mcps/knowledge-skills/devops-deployment.server.ts',
  'src/mcps/knowledge-skills/git-workflow.server.ts',
  'src/mcps/knowledge-skills/performance-optimization.server.ts',
  'src/mcps/knowledge-skills/project-analysis.server.ts',
  'src/mcps/knowledge-skills/refactoring-strategies.server.ts',
  'src/mcps/knowledge-skills/security-audit.server.ts',
  'src/mcps/knowledge-skills/session-management.server.ts',
  'src/mcps/knowledge-skills/tech-writer.server.ts',
  'src/mcps/knowledge-skills/testing-best-practices.server.ts',
  'src/mcps/knowledge-skills/ui-ux-design.server.ts',
];

const importPattern = /import \{ frameworkLogger \} from "\.\.\/\.\.\/core\/framework-logger\.js";/;
const newImport = `import { frameworkLogger } from "../../core/framework-logger.js";
import { createGracefulShutdown } from "../../utils/shutdown-handler.js";`;

function getServerName(filePath) {
  const fileName = path.basename(filePath, '.ts');
  return fileName;
}

function getSimpleRunMethod(serverName) {
  return `  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Use centralized shutdown handler
    createGracefulShutdown({
      serverName: "${serverName}",
      server: this.server,
    });
  }`;
}

const complexServers = new Set([
  'ui-ux-design.server.ts',
  'session-management.server.ts',
  'project-analysis.server.ts',
]);

let updated = 0;
let skipped = 0;

for (const file of serverFiles) {
  const filePath = path.resolve(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Warning: File not found: ${file}`);
    skipped++;
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip if already updated
  if (content.includes('createGracefulShutdown')) {
    console.log(`Already updated: ${file}`);
    skipped++;
    continue;
  }
  
  // Skip complex servers that need manual review
  const fileName = path.basename(file);
  if (complexServers.has(fileName)) {
    console.log(`Skipping (needs manual review): ${file}`);
    skipped++;
    continue;
  }
  
  // Add import if missing
  if (importPattern.test(content)) {
    content = content.replace(importPattern, newImport);
  }
  
  // Find and replace the run() method - simplified pattern
  const runMethodStart = '  async run(): Promise<void> {';
  const runMethodIdx = content.indexOf(runMethodStart);
  
  if (runMethodIdx !== -1) {
    // Find the end of the run method by counting braces
    let braceCount = 0;
    let inMethod = false;
    let endIdx = runMethodIdx;
    
    for (let i = runMethodIdx; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        inMethod = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (inMethod && braceCount === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
    
    const simpleRun = getSimpleRunMethod(getServerName(file));
    content = content.substring(0, runMethodIdx) + simpleRun + content.substring(endIdx);
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated: ${file}`);
  updated++;
}

console.log(`\nDone: Updated ${updated} files, skipped ${skipped}`);
