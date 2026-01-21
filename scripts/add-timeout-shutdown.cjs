#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const mcpDir = 'src/mcps';
const files = fs.readdirSync(mcpDir, { recursive: true })
  .filter(f => f.endsWith('.server.ts'))
  .map(f => path.join(mcpDir, f));

let fixed = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');

  // Skip if already has timeout handling
  if (content.includes('setTimeout')) {
    continue;
  }

  // Replace the cleanup function with timeout handling
  const cleanupPattern = /const cleanup = async \(signal: string\) => \{\s*console\.log\(\`Received \$\{signal\}, shutting down gracefully\.\.\.\`\);\s*try \{\s*if \(this\.server && typeof this\.server\.close === 'function'\) \{\s*await this\.server\.close\(\);\s*\}\s*console\.log\([^}]+\);\s*process\.exit\(0\);\s*\} catch \(error\) \{\s*console\.error\([^}]+\);\s*process\.exit\(1\);\s*\}\s*\};/s;

  if (cleanupPattern.test(content)) {
    const enhancedCleanup = `const cleanup = async (signal: string) => {
  console.log(\`Received \${signal}, shutting down gracefully...\`);

  // Set a timeout to force exit if graceful shutdown fails
  const timeout = setTimeout(() => {
    console.error('Graceful shutdown timeout, forcing exit...');
    process.exit(1);
  }, 5000); // 5 second timeout

  try {
    if (this.server && typeof this.server.close === 'function') {
      await this.server.close();
    }
    clearTimeout(timeout);
    console.log("StrRay MCP Server shut down gracefully");
    process.exit(0);
  } catch (error) {
    clearTimeout(timeout);
    console.error("Error during server shutdown:", error);
    process.exit(1);
  }
};`;

    const newContent = content.replace(cleanupPattern, enhancedCleanup);
    fs.writeFileSync(file, newContent);
    fixed++;
    console.log(`Added timeout to ${file}`);
  }
}

console.log(`Added timeout handling to ${fixed} MCP server files.`);