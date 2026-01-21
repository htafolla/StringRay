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

  // Skip if already has parent monitoring
  if (content.includes('process.on(\'exit\'')) {
    continue;
  }

  // Find the cleanup function setup
  const signalSetupPattern = /\/\/ Handle multiple shutdown signals\s*process\.on\('SIGINT', \(\) => cleanup\('SIGINT'\)\);\s*process\.on\('SIGTERM', \(\) => cleanup\('SIGTERM'\)\);\s*process\.on\('SIGHUP', \(\) => cleanup\('SIGHUP'\)\);/s;

  if (signalSetupPattern.test(content)) {
    const parentMonitoringCode = `
// Handle multiple shutdown signals
process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGHUP', () => cleanup('SIGHUP'));

// Monitor parent process (opencode) and shutdown if it dies
const checkParent = () => {
  try {
    process.kill(process.ppid, 0); // Check if parent is alive
    setTimeout(checkParent, 1000); // Check again in 1 second
  } catch (error) {
    // Parent process died, shut down gracefully
    console.log('Parent process (opencode) died, shutting down MCP server...');
    cleanup('parent-process-death');
  }
};

// Start monitoring parent process
setTimeout(checkParent, 2000); // Start checking after 2 seconds`;

    const newContent = content.replace(signalSetupPattern, parentMonitoringCode);
    fs.writeFileSync(file, newContent);
    fixed++;
    console.log(`Added parent monitoring to ${file}`);
  }
}

console.log(`Added parent process monitoring to ${fixed} MCP server files.`);