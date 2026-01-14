#!/usr/bin/env node

/**
 * MCP Server Capabilities Fixer
 *
 * Adds missing capabilities declarations to all MCP server constructors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function addCapabilitiesToServer(serverPath) {
  const content = fs.readFileSync(serverPath, 'utf8');

  // Check if capabilities already exist
  if (content.includes('capabilities:')) {
    console.log(`  ✅ ${path.basename(serverPath)} - already has capabilities`);
    return;
  }

  // Find the Server constructor pattern
  const constructorPattern = /this\.server = new Server\(\{[\s\S]*?name: "([^"]*)",[\s\S]*?version: "([^"]*)",\s*\}\);/;

  const match = content.match(constructorPattern);
  if (!match) {
    console.log(`  ❌ ${path.basename(serverPath)} - constructor pattern not found`);
    return;
  }

  // Replace with capabilities version
  const newConstructor = `    this.server = new Server(
      {
        name: "${match[1]}",
        version: "${match[2]}",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );`;

  const newContent = content.replace(constructorPattern, newConstructor);

  if (newContent !== content) {
    fs.writeFileSync(serverPath, newContent, 'utf8');
    console.log(`  🔧 ${path.basename(serverPath)} - capabilities added`);
  } else {
    console.log(`  ❌ ${path.basename(serverPath)} - replacement failed`);
  }
}

function fixAllMcpServers() {
  console.log('🔧 Adding capabilities declarations to all MCP servers...\n');

  const mcpDirs = [
    path.join(__dirname, '../src/mcps'),
    path.join(__dirname, '../src/mcps/knowledge-skills')
  ];

  let fixedCount = 0;

  for (const mcpDir of mcpDirs) {
    if (!fs.existsSync(mcpDir)) continue;

    const files = fs.readdirSync(mcpDir)
      .filter(file => file.endsWith('.server.ts'))
      .map(file => path.join(mcpDir, file));

    for (const file of files) {
      addCapabilitiesToServer(file);
      fixedCount++;
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} MCP server files`);
}

// Run the fixer
fixAllMcpServers();