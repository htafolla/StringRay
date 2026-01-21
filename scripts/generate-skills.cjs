#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const mcpConfigPath = path.join(process.cwd(), '.mcp.json');
const skillsDir = path.join(process.cwd(), '.opencode', 'skills');

// Read MCP configuration
const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
const servers = mcpConfig.mcpServers || {};

// Server descriptions and categories
const serverInfo = {
  'librarian': {
    description: 'Multi-repo analysis, documentation lookup, and implementation examples',
    category: 'research',
    tools: ['Search repositories', 'Find implementations', 'Analyze documentation']
  },
  'session-management': {
    description: 'Manage user sessions and persistent state',
    category: 'infrastructure',
    tools: ['Session state management', 'Persistence handling']
  },
  'orchestrator': {
    description: 'Multi-agent workflow coordination and task delegation',
    category: 'orchestration',
    tools: ['Task coordination', 'Agent delegation', 'Workflow management']
  },
  'enhanced-orchestrator': {
    description: 'Advanced multi-agent orchestration with conflict resolution',
    category: 'orchestration',
    tools: ['Conflict resolution', 'Advanced delegation', 'Complex workflows']
  },
  'enforcer': {
    description: 'Codex compliance validation and error prevention',
    category: 'quality',
    tools: ['Code compliance', 'Error prevention', 'Quality validation']
  },
  'architect-tools': {
    description: 'System design and technical architecture tools',
    category: 'design',
    tools: ['Architecture design', 'System planning', 'Technical decisions']
  },
  'auto-format': {
    description: 'Automated code formatting and style consistency',
    category: 'formatting',
    tools: ['Code formatting', 'Style consistency', 'Auto-formatting']
  },
  'boot-orchestrator': {
    description: 'Framework initialization and boot orchestration',
    category: 'infrastructure',
    tools: ['Boot management', 'Initialization', 'Framework startup']
  },
  'framework-compliance-audit': {
    description: 'Framework compliance auditing and validation',
    category: 'compliance',
    tools: ['Compliance auditing', 'Framework validation', 'Audit reporting']
  },
  'lint': {
    description: 'Code linting and static analysis',
    category: 'quality',
    tools: ['Code linting', 'Static analysis', 'Quality checks']
  },
  'model-health-check': {
    description: 'AI model health monitoring and diagnostics',
    category: 'monitoring',
    tools: ['Model monitoring', 'Health diagnostics', 'Performance tracking']
  },
  'performance-analysis': {
    description: 'System performance analysis and optimization',
    category: 'performance',
    tools: ['Performance analysis', 'Optimization recommendations', 'Metrics tracking']
  },
  'processor-pipeline': {
    description: 'Data processing pipeline management',
    category: 'processing',
    tools: ['Pipeline management', 'Data processing', 'Workflow execution']
  },
  'security-scan': {
    description: 'Security vulnerability scanning and assessment',
    category: 'security',
    tools: ['Security scanning', 'Vulnerability assessment', 'Security reports']
  },
  'state-manager': {
    description: 'Application state management and persistence',
    category: 'infrastructure',
    tools: ['State management', 'Data persistence', 'State synchronization']
  },
  'api-design': {
    description: 'RESTful API design and validation',
    category: 'design',
    tools: ['API design', 'Endpoint validation', 'API documentation']
  },
  'architecture-patterns': {
    description: 'Software architecture patterns and best practices',
    category: 'design',
    tools: ['Architecture patterns', 'Design patterns', 'Best practices']
  },
  'git-workflow': {
    description: 'Git workflow management and collaboration tools',
    category: 'collaboration',
    tools: ['Git workflows', 'Collaboration tools', 'Version control']
  },
  'performance-optimization': {
    description: 'Application performance optimization and tuning',
    category: 'performance',
    tools: ['Performance tuning', 'Optimization strategies', 'Performance monitoring']
  },
  'project-analysis': {
    description: 'Complete project structure and health analysis',
    category: 'analysis',
    tools: ['Project analysis', 'Structure assessment', 'Health metrics']
  },
  'testing-strategy': {
    description: 'Comprehensive testing strategy design and implementation',
    category: 'testing',
    tools: ['Testing strategy', 'Coverage analysis', 'Test planning']
  },
  'code-review': {
    description: 'Automated code review and quality assessment',
    category: 'review',
    tools: ['Code review', 'Quality assessment', 'Improvement suggestions']
  },
  'security-audit': {
    description: 'Security auditing and compliance validation',
    category: 'security',
    tools: ['Security auditing', 'Compliance validation', 'Risk assessment']
  },
  'ui-ux-design': {
    description: 'User interface and user experience design tools',
    category: 'design',
    tools: ['UI design', 'UX design', 'Interface optimization']
  },
  'refactoring-strategies': {
    description: 'Code refactoring techniques and strategies',
    category: 'refactoring',
    tools: ['Refactoring strategies', 'Code improvement', 'Technical debt reduction']
  },
  'testing-best-practices': {
    description: 'Testing best practices and quality assurance',
    category: 'testing',
    tools: ['Testing practices', 'Quality assurance', 'Best practices']
  }
};

// Ensure skills directory exists
if (!fs.existsSync(skillsDir)) {
  fs.mkdirSync(skillsDir, { recursive: true });
}

// Generate SKILL.md files for servers that don't already have them
for (const [serverName, serverConfig] of Object.entries(servers)) {
  const skillDir = path.join(skillsDir, serverName);
  const skillFile = path.join(skillDir, 'SKILL.md');

  // Skip if skill already exists
  if (fs.existsSync(skillFile)) {
    console.log(`Skipping ${serverName} - skill already exists`);
    continue;
  }

  const info = serverInfo[serverName] || {
    description: `${serverName.replace(/-/g, ' ')} functionality`,
    category: 'utility',
    tools: ['General tools and utilities']
  };

  const skillContent = `---
name: ${serverName}
description: ${info.description}
author: StrRay Framework
version: 1.0.0
tags: [${info.category}, ${serverName.replace(/-/g, ', ')}]

mcp:
  ${serverName}:
    command: node
    args: [node_modules/strray-ai/dist/plugin/mcps/${serverConfig.args[0]}]
---

# ${serverName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Skill

${info.description.charAt(0).toUpperCase() + info.description.slice(1)}.

## Tools Available

${info.tools.map(tool => `- **${tool.replace(/\s+/g, '_').toLowerCase()}**: ${tool}`).join('\n')}

## Usage

This skill provides ${info.category} capabilities for ${serverName.replace(/-/g, ' ')} functionality.

## Integration

Activated when ${info.category} capabilities are requested through the skills system.
`;

  // Create skill directory
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }

  // Write SKILL.md file
  fs.writeFileSync(skillFile, skillContent);
  console.log(`Created skill: ${serverName}`);
}

console.log('Skill generation complete!');