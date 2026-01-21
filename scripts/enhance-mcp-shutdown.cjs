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

  // Skip if already has enhanced shutdown
  if (content.includes('process.on(\'SIGHUP\'')) {
    continue;
  }

  // Find the basic cleanup function
  const basicCleanupPattern = /const cleanup = async \(\) => \{\s*try \{\s*await this\.server\.close\(\);\s*console\.log\([^}]+\);\s*\} catch \(error\) \{\s*console\.error\([^}]+\);\s*\}\s*process\.exit\(0\);\s*\};/s;

  if (basicCleanupPattern.test(content)) {
    const enhancedCleanup = `const cleanup = async (signal: string) => {
  console.log(\`Received \${signal}, shutting down gracefully...\`);
  try {
    if (this.server && typeof this.server.close === 'function') {
      await this.server.close();
    }
    console.log("StrRay MCP Server shut down gracefully");
    process.exit(0);
  } catch (error) {
    console.error("Error during server shutdown:", error);
    process.exit(1);
  }
};

// Handle multiple shutdown signals
process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGHUP', () => cleanup('SIGHUP'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  cleanup('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  cleanup('unhandledRejection');
});`;

    const newContent = content.replace(basicCleanupPattern, enhancedCleanup);
    fs.writeFileSync(file, newContent);
    fixed++;
    console.log(`Enhanced ${file}`);
  }
}

console.log(`Enhanced ${fixed} MCP server files with robust shutdown handling.`);