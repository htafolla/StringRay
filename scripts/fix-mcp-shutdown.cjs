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

  // Check if already has cleanup function
  if (content.includes('const cleanup = async () => {')) {
    continue;
  }

  // Find the run method
  const runMethodMatch = content.match(/async run\(\): Promise<void> \{\s*const transport = new StdioServerTransport\(\);\s*await this\.server\.connect\(transport\);\s*(.*?)\s*\}/s);

  if (runMethodMatch) {
    const [fullMatch, logStatement] = runMethodMatch;

    const newRunMethod = `async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    ${logStatement.trim()}

    const cleanup = async () => {
      try {
        await this.server.close();
        console.log("StrRay MCP Server shut down gracefully");
      } catch (error) {
        console.error("Error during server shutdown:", error);
      }
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }`;

    const newContent = content.replace(fullMatch, newRunMethod);
    fs.writeFileSync(file, newContent);
    fixed++;
    console.log(`Fixed ${file}`);
  }
}

console.log(`Fixed ${fixed} MCP server files with graceful shutdown handling.`);