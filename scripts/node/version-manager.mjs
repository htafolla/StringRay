#!/usr/bin/env node

/**
 * Version Manager for StringRay
 * 
 * Updates version in:
 * - package.json
 * - init.sh
 * - CHANGELOG.md (auto-generates from git commits since last tag)
 * - README.md (updates agent/MCP/skill counts)
 * - AGENTS.md (updates agent/MCP/skill counts)
 * 
 * Auto-generates changelog from git commits using conventional commit format.
 * Usage:
 *   node scripts/node/version-manager.mjs [major|minor|patch]
 *   node scripts/node/version-manager.mjs [major|minor|patch] "Custom description"
 *   node scripts/node/version-manager.mjs [major|minor|patch] --tag
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Files to update with version
const VERSION_FILES = [
  { file: 'package.json', field: 'version', pattern: /"version":\s*"[^"]+"/ },
  { file: 'init.sh', field: 'STRRAY_VERSION', pattern: /STRRAY_VERSION="[^"]+"/ }
];

// Commit types for changelog grouping
const COMMIT_TYPES = {
  feat: { emoji: '✨', title: 'Features', prefix: 'feat:' },
  fix: { emoji: '🐛', title: 'Bug Fixes', prefix: 'fix:' },
  docs: { emoji: '📚', title: 'Documentation', prefix: 'docs:' },
  chore: { emoji: '🔧', title: 'Maintenance', prefix: 'chore:' },
  refactor: { emoji: '♻️', title: 'Refactoring', prefix: 'refactor:' },
  perf: { emoji: '⚡', title: 'Performance', prefix: 'perf:' },
  test: { emoji: '🧪', title: 'Tests', prefix: 'test:' },
  style: { emoji: '💎', title: 'Styles', prefix: 'style:' },
  ci: { emoji: '👷', title: 'CI/CD', prefix: 'ci:' },
  build: { emoji: '📦', title: 'Builds', prefix: 'build:' },
  revert: { emoji: '⏪', title: 'Reverts', prefix: 'revert:' }
};

/**
 * Get the last git tag (most recent version)
 */
function getLastGitTag() {
  try {
    const tag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"', {
      cwd: rootDir,
      encoding: 'utf-8'
    }).trim();
    return tag || 'v0.0.0';
  } catch {
    return 'v0.0.0';
  }
}

/**
 * Extract commits since the last tag
 */
function getCommitsSinceLastTag() {
  const lastTag = getLastGitTag();
  console.log(`📊 Found last tag: ${lastTag}`);
  
  try {
    // Get commits since last tag with conventional format
    const commits = execSync(
      `git log ${lastTag}..HEAD --oneline --format="%s||%h"`,
      { cwd: rootDir, encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);
    
    return commits.map(commit => {
      const [message, hash] = commit.split('||');
      return { message: message.trim(), hash: hash.trim() };
    });
  } catch (error) {
    // If no tags or error, get all commits from initial commit
    console.log('⚠️  Could not get commits from tag, using all commits');
    const commits = execSync(
      `git log --oneline --format="%s||%h" -n 50`,
      { cwd: rootDir, encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);
    
    return commits.map(commit => {
      const [message, hash] = commit.split('||');
      return { message: message.trim(), hash: hash.trim() };
    });
  }
}

/**
 * Parse commits and group by type
 */
function parseCommitsByType(commits) {
  const grouped = {
    feat: [],
    fix: [],
    docs: [],
    chore: [],
    refactor: [],
    perf: [],
    test: [],
    style: [],
    ci: [],
    build: [],
    revert: [],
    other: []
  };
  
  for (const commit of commits) {
    const message = commit.message.toLowerCase();
    let matched = false;
    
    for (const [type, config] of Object.entries(COMMIT_TYPES)) {
      if (message.startsWith(config.prefix)) {
        grouped[type].push(commit);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      grouped.other.push(commit);
    }
  }
  
  return grouped;
}

/**
 * Generate changelog content from commits
 */
function generateChangelogFromCommits(commits) {
  const grouped = parseCommitsByType(commits);
  const sections = [];
  
  // Build sections in preferred order
  const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'style', 'ci', 'build', 'chore', 'revert'];
  
  for (const type of typeOrder) {
    if (grouped[type].length > 0) {
      const config = COMMIT_TYPES[type];
      const items = grouped[type].map(c => `- ${c.message} (${c.hash})`).join('\n');
      sections.push(`### ${config.emoji} ${config.title}\n${items}`);
    }
  }
  
  // Add other/unclassified if any
  if (grouped.other.length > 0 && grouped.other.length <= 5) {
    const items = grouped.other.map(c => `- ${c.message} (${c.hash})`).join('\n');
    sections.push(`### 🔎 Other Changes\n${items}`);
  }
  
  return sections.join('\n\n') || '- Version bump';
}

/**
 * Count actual framework components
 */
function getFrameworkCounts() {
  const counts = {
    agents: 0,
    mcps: 0,
    skills: 0
  };
  
  // Count agents (.yml files in .opencode/agents/)
  const agentsDir = path.join(rootDir, '.opencode/agents');
  if (fs.existsSync(agentsDir)) {
    counts.agents = fs.readdirSync(agentsDir)
      .filter(f => f.endsWith('.yml'))
      .length;
  }
  
  // Count MCP servers (.server.js files in dist/mcps/)
  const mcpsDir = path.join(rootDir, 'dist/mcps');
  if (fs.existsSync(mcpsDir)) {
    counts.mcps = fs.readdirSync(mcpsDir)
      .filter(f => f.endsWith('.server.js'))
      .length;
  } else {
    // Try node_modules path for published package
    const nodeModulesMcps = path.join(rootDir, 'node_modules/strray-ai/dist/mcps');
    if (fs.existsSync(nodeModulesMcps)) {
      counts.mcps = fs.readdirSync(nodeModulesMcps)
        .filter(f => f.endsWith('.server.js'))
        .length;
    }
  }
  
  // Count skills (directories in src/skills/ with SKILL.md)
  const skillsDir = path.join(rootDir, 'src/skills');
  if (fs.existsSync(skillsDir)) {
    counts.skills = fs.readdirSync(skillsDir)
      .filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory())
      .filter(f => fs.existsSync(path.join(skillsDir, f, 'SKILL.md')))
      .length;
  }
  
  return counts;
}

function getChangelogEntry(newVersion, changeDescription) {
  const date = new Date().toISOString().split('T')[0];
  
  // If manual description provided, use it; otherwise auto-generate from commits
  let content;
  if (changeDescription) {
    content = changeDescription;
  } else {
    // Auto-generate from git commits
    console.log('📝 No description provided, auto-generating from git commits...');
    const commits = getCommitsSinceLastTag();
    console.log(`📊 Found ${commits.length} commits since last release`);
    content = generateChangelogFromCommits(commits);
  }
  
  return `## [${newVersion}] - ${date}

### 🔄 Changes

${content}

---

`;
}

function updateChangelog(newVersion, changeDescription) {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  let changelog = fs.readFileSync(changelogPath, 'utf-8');
  
  // Find the position after the header and insert new entry
  const headerEnd = changelog.indexOf('## [');
  if (headerEnd === -1) {
    console.log('⚠️  Could not find version header in CHANGELOG.md');
    return;
  }
  
  const newEntry = getChangelogEntry(newVersion, changeDescription);
  const newChangelog = changelog.slice(0, headerEnd) + newEntry + changelog.slice(headerEnd);
  
  fs.writeFileSync(changelogPath, newChangelog);
  console.log(`✅ Updated CHANGELOG.md`);
}

/**
 * Update README.md with actual framework counts and version
 */
function updateReadme(counts, newVersion) {
  const readmePath = path.join(rootDir, 'README.md');
  if (!fs.existsSync(readmePath)) {
    console.log(`⚠️  README.md not found, skipping`);
    return;
  }
  
  let readme = fs.readFileSync(readmePath, 'utf-8');
  
  // Update version badge: [![Version](https://img.shields.io/badge/version-1.6.x-blue...)]
  readme = readme.replace(
    /img.shields.io\/badge\/version-[\d.]+/,
    `img.shields.io/badge/version-${newVersion}`
  );
  
  // Update agent count: [View all 23 agents →](AGENTS.md)
  readme = readme.replace(
    /\[View all \d+ agents →]\(AGENTS\.md\)/,
    `[View all ${counts.agents} agents →](AGENTS.md)`
  );
  
  // Update MCP count: "15 MCP servers" or similar patterns
  readme = readme.replace(
    /(\d+)\s+MCPs?/g,
    (match, num) => `${counts.mcps} MCPs`
  );
  
  // Update skills count
  readme = readme.replace(
    /(\d+)\s+Skills?/g,
    (match, num) => `${counts.skills} Skills`
  );
  
  // Update components line like "9 agents, 28 MCP servers, 8 interconnected pipelines"
  readme = readme.replace(
    /(\d+)\s+agents,\s*(\d+)\s+MCP servers/,
    `${counts.agents} agents, ${counts.mcps} MCP servers`
  );
  
  fs.writeFileSync(readmePath, readme);
  console.log(`✅ Updated README.md (version: ${newVersion}, agents: ${counts.agents}, mcps: ${counts.mcps}, skills: ${counts.skills})`);
}

/**
 * Update AGENTS.md with actual framework counts
 */
function updateAgentsMd(counts) {
  const agentsPath = path.join(rootDir, 'AGENTS.md');
  if (!fs.existsSync(agentsPath)) {
    console.log(`⚠️  AGENTS.md not found, skipping`);
    return;
  }
  
  let agentsMd = fs.readFileSync(agentsPath, 'utf-8');
  
  // Update header counts like "StringRay - 23 Agents, 39 MCPs, 52 Skills"
  agentsMd = agentsMd.replace(
    /StringRay\s*-\s*\d+\s+Agents/,
    `StringRay - ${counts.agents} Agents`
  );
  
  agentsMd = agentsMd.replace(
    /\d+\s+MCPs?/g,
    `${counts.mcps} MCPs`
  );
  
  agentsMd = agentsMd.replace(
    /\d+\s+Skills?/g,
    `${counts.skills} Skills`
  );
  
  fs.writeFileSync(agentsPath, agentsMd);
  console.log(`✅ Updated AGENTS.md`);
}

function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  return pkg.version;
}

function parseVersion(version) {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0], 10),
    minor: parseInt(parts[1], 10),
    patch: parseInt(parts[2], 10)
  };
}

function bumpVersion(current, type) {
  const v = parseVersion(current);
  
  switch (type) {
    case 'major':
      v.major++;
      v.minor = 0;
      v.patch = 0;
      break;
    case 'minor':
      v.minor++;
      v.patch = 0;
      break;
    case 'patch':
      v.patch++;
      break;
    default:
      // Assume it's a specific version
      return type;
  }
  
  return `${v.major}.${v.minor}.${v.patch}`;
}

function updateVersion(newVersion, changeDescription = '') {
  console.log(`\n📦 Updating version to ${newVersion}\n`);
  
  // Update package.json
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ Updated package.json`);
  
  // Update init.sh if it exists
  const initPath = path.join(rootDir, 'init.sh');
  if (fs.existsSync(initPath)) {
    let initContent = fs.readFileSync(initPath, 'utf-8');
    initContent = initContent.replace(
      /STRRAY_VERSION="[^"]+"/,
      `STRRAY_VERSION="${newVersion}"`
    );
    fs.writeFileSync(initPath, initContent);
    console.log(`✅ Updated init.sh`);
  } else {
    console.log(`⚠️  init.sh not found, skipping`);
  }
  
  // Update docs/README.md version badge
  const docsReadmePath = path.join(rootDir, 'docs/README.md');
  if (fs.existsSync(docsReadmePath)) {
    let readme = fs.readFileSync(docsReadmePath, 'utf-8');
    readme = readme.replace(
      /img.shields.io\/badge\/version-[\d.]+/,
      `img.shields.io/badge/version-${newVersion}`
    );
    fs.writeFileSync(docsReadmePath, readme);
    console.log(`✅ Updated docs/README.md (version: ${newVersion})`);
  }
  
  // Update CHANGELOG.md
  updateChangelog(newVersion, changeDescription);
  
  // Get actual framework counts and update documentation
  const counts = getFrameworkCounts();
  console.log(`\n📊 Framework counts: ${counts.agents} agents, ${counts.mcps} MCPs, ${counts.skills} skills`);
  
  updateReadme(counts, newVersion);
  updateAgentsMd(counts);
  
  console.log(`\n🎉 Version updated to ${newVersion}\n`);
}

function createGitTag(version, message) {
  try {
    // Create annotated tag
    const tagName = `v${version}`;
    const tagMessage = message || `Release ${version}`;
    
    execSync(`git tag -a ${tagName} -m "${tagMessage}"`, { cwd: rootDir, stdio: 'inherit' });
    console.log(`✅ Created git tag: ${tagName}`);
    
    // Push tag to remote
    execSync(`git push origin ${tagName}`, { cwd: rootDir, stdio: 'inherit' });
    console.log(`✅ Pushed tag to origin: ${tagName}`);
    
    return true;
  } catch (error) {
    console.log(`⚠️  Failed to create git tag: ${error.message}`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  
  // Handle --help flag first
  if (args.includes('--help') || args.includes('-h')) {
    const current = getCurrentVersion();
    console.log(`\n📌 Current version: ${current}`);
    console.log(`\nUsage:`);
    console.log(`  node scripts/node/version-manager.mjs [major|minor|patch] [description]`);
    console.log(`  node scripts/node/version-manager.mjs 1.6.9 "Description of changes"`);
    console.log(`  node scripts/node/version-manager.mjs patch --tag  # auto-changelog + git tag`);
    console.log(`\nExamples:`);
    console.log(`  node scripts/node/version-manager.mjs patch  # 1.6.8 -> 1.6.9 (auto-generates changelog from git)`);
    console.log(`  node scripts/node/version-manager.mjs minor  # 1.6.8 -> 1.7.0`);
    console.log(`  node scripts/node/version-manager.mjs major  # 1.6.8 -> 2.0.0`);
    console.log(`  node scripts/node/version-manager.mjs patch "Manual description"  # use custom changelog`);
    console.log(`  node scripts/node/version-manager.mjs patch --tag  # changelog + git tag`);
    process.exit(0);
  }
  
  // Parse arguments
  let type = args[0];
  let changeDescription = '';
  let createTag = false;
  
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--tag' || args[i] === '-t') {
      createTag = true;
    } else {
      changeDescription = args[i];
    }
  }
  
  const current = getCurrentVersion();
  const newVersion = bumpVersion(current, type);
  
  console.log(`\n📌 Current version: ${current}`);
  console.log(`📌 Bumping: ${type}`);
  if (changeDescription) {
    console.log(`📌 Changes: ${changeDescription}`);
  }
  if (createTag) {
    console.log(`📌 Will create git tag`);
  }
  
  updateVersion(newVersion, changeDescription);
  
  // Create git tag if requested
  if (createTag) {
    createGitTag(newVersion, changeDescription);
  }
}

main();
