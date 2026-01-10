#!/usr/bin/env node

/**
 * Generate .claude/agents/*.md files from StrRay TypeScript agent definitions
 * This bridges the gap between StrRay's complex agents and oh-my-opencode's simple format
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function convertAgentToMarkdown(agentName, agentConfig) {
  const frontmatter = {
    name: agentConfig.name,
    description: agentConfig.description,
    model: agentConfig.model || 'opencode/grok-code',
    temperature: agentConfig.temperature || 0.1,
    maxSteps: agentConfig.maxSteps || 30,
    mode: agentConfig.mode || 'subagent',
    tools: agentConfig.tools?.include || [],
  };

  // Filter out undefined values
  const cleanFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([_, v]) => v != null)
  );

  const yaml = Object.entries(cleanFrontmatter)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');

  const content = `---
${yaml}
---

${agentConfig.system || 'Advanced StrRay agent with MCP coordination capabilities.'}

## Advanced Features
- Connected to StrRay MCP servers for orchestration
- Access to enterprise-grade state management
- Integrated with processor pipelines
- Codex compliance validation
- Performance monitoring and optimization
`;

  return content;
}

async function generateAgents() {
  try {
    // Import the built agents
    const { builtinAgents } = await import('../dist/agents/index.js');

    // Create .claude/agents directory
    mkdirSync('.claude/agents', { recursive: true });

    // Generate agent files
    for (const [agentName, agentConfig] of Object.entries(builtinAgents)) {
      const content = convertAgentToMarkdown(agentName, agentConfig);
      const filePath = `.claude/agents/${agentName}.md`;
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Generated ${filePath}`);
    }

    console.log(`\n🎉 Generated ${Object.keys(builtinAgents).length} agent files in .claude/agents/`);
    console.log('📋 These agents will be automatically loaded by oh-my-opencode');
    console.log('🔗 Advanced StrRay features available via MCP servers');

  } catch (error) {
    console.error('❌ Failed to generate agents:', error.message);
    process.exit(1);
  }
}

generateAgents();
