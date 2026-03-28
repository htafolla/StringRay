#!/usr/bin/env node

/**
 * Tweet Generator for StringRay Releases
 * 
 * Extracts commits since last release and prepares context for @growth-strategist
 * to generate an engaging tweet.
 * 
 * Usage:
 *   node scripts/node/release-tweet.mjs
 *   node scripts/node/release-tweet.mjs --preview  # Just show what would be tweeted
 * 
 * This script is NOT referenced in AGENTS.md or package.json - internal use only.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Commit types for formatting
const COMMIT_TYPES = {
  feat: { emoji: '✨', label: 'New Features' },
  fix: { emoji: '🐛', label: 'Bug Fixes' },
  perf: { emoji: '⚡', label: 'Performance' },
  refactor: { emoji: '♻️', label: 'Refactoring' },
  docs: { emoji: '📚', label: 'Documentation' },
  test: { emoji: '🧪', label: 'Tests' },
  chore: { emoji: '🔧', label: 'Maintenance' },
  security: { emoji: '🔒', label: 'Security' },
  build: { emoji: '📦', label: 'Builds' }
};

/**
 * Get the last git tag
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
 * Get current version from package.json
 */
function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  return pkg.version;
}

/**
 * Extract commits since last tag
 */
function getCommitsSinceLastTag(sinceTag) {
  try {
    const commits = execSync(
      `git log ${sinceTag}..HEAD --oneline --format="%s||%h"`,
      { cwd: rootDir, encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);
    
    return commits.map(commit => {
      const [message, hash] = commit.split('||');
      return { message: message.trim(), hash: hash.trim() };
    });
  } catch {
    return [];
  }
}

/**
 * Categorize commits by type
 */
function categorizeCommits(commits) {
  const categorized = {
    feat: [],
    fix: [],
    perf: [],
    refactor: [],
    docs: [],
    test: [],
    security: [],
    build: [],
    chore: [],
    other: []
  };
  
  for (const commit of commits) {
    const msg = commit.message.toLowerCase();
    
    if (msg.startsWith('feat:')) categorized.feat.push(commit);
    else if (msg.startsWith('fix:')) categorized.fix.push(commit);
    else if (msg.startsWith('perf:')) categorized.perf.push(commit);
    else if (msg.startsWith('refactor:')) categorized.refactor.push(commit);
    else if (msg.startsWith('docs:')) categorized.docs.push(commit);
    else if (msg.startsWith('test:')) categorized.test.push(commit);
    else if (msg.includes('security') || msg.includes('fix:')) categorized.security.push(commit);
    else if (msg.startsWith('build:') || msg.startsWith('chore:')) categorized.chore.push(commit);
    else if (!msg.startsWith('merge') && !msg.startsWith('release')) {
      categorized.other.push(commit);
    }
  }
  
  return categorized;
}

/**
 * Format commits for tweet context
 */
function formatForTweet(commits) {
  const categorized = categorizeCommits(commits);
  const lines = [];
  
  // Featured items (most interesting for tweet)
  const featured = [
    ...categorized.feat.slice(0, 2),
    ...categorized.fix.slice(0, 1),
    ...categorized.security.slice(0, 1)
  ].slice(0, 4);
  
  if (featured.length > 0) {
    lines.push('### Highlights');
    for (const commit of featured) {
      // Remove conventional commit prefix for cleaner display
      const cleanMsg = commit.message
        .replace(/^(feat|fix|perf|refactor|docs|test|chore|build|security):\s*/i, '')
        .replace(/\(.*\)/, '') // Remove parenthetical notes
        .trim();
      lines.push(`- ${cleanMsg} (${commit.hash.slice(0, 7)})`);
    }
  }
  
  // Summary counts
  const total = commits.length;
  const types = Object.entries(categorized)
    .filter(([_, items]) => items.length > 0)
    .map(([type, items]) => {
      const config = COMMIT_TYPES[type] || { emoji: '📌', label: type };
      return `${config.emoji} ${items.length} ${config.label}`;
    });
  
  if (types.length > 0) {
    lines.push(`\n### Summary`);
    lines.push(types.join(' | '));
  }
  
  return lines.join('\n');
}

/**
 * Generate tweet text
 */
function generateTweetText(version, commits) {
  const categorized = categorizeCommits(commits);
  
  // Build tweet parts
  const parts = [`🚀 StringRay v${version} released!`];
  
  // Key highlights (max 3 for tweet)
  const highlights = [];
  
  if (categorized.feat.length > 0) {
    const feat = categorized.feat[0].message
      .replace(/^feat:\s*/i, '')
      .slice(0, 50);
    highlights.push(`✨ ${feat}`);
  }
  
  if (categorized.fix.length > 0) {
    const fix = categorized.fix[0].message
      .replace(/^fix:\s*/i, '')
      .slice(0, 50);
    highlights.push(`🐛 ${fix}`);
  }
  
  if (categorized.perf.length > 0) {
    highlights.push(`⚡ Performance boost`);
  }
  
  if (categorized.security.length > 0) {
    highlights.push(`🔒 Security fix`);
  }
  
  if (highlights.length > 0) {
    parts.push(highlights.slice(0, 3).join(' | '));
  }
  
  // Stats
  const stats = [];
  if (categorized.feat.length) stats.push(`${categorized.feat.length} features`);
  if (categorized.fix.length) stats.push(`${categorized.fix.length} fixes`);
  if (categorized.docs.length) stats.push(`${categorized.docs.length} docs`);
  
  if (stats.length > 0) {
    parts.push(`📊 ${stats.join(' | ')}`);
  }
  
  // Hashtags and link
  parts.push('\n#StringRay #AI #DevTools');
  parts.push('🔗 https://github.com/htafolla/stringray');
  
  return parts.join('\n\n');
}

function main() {
  const args = process.argv.slice(2);
  const previewOnly = args.includes('--preview') || args.includes('-p');
  
  const lastTag = getLastGitTag();
  const currentVersion = getCurrentVersion();
  
  console.log('\n' + '='.repeat(50));
  console.log('🐦 Tweet Generator for StringRay');
  console.log('='.repeat(50));
  console.log(`📌 Last release: ${lastTag}`);
  console.log(`📦 Current version: ${currentVersion}`);
  console.log('');
  
  const commits = getCommitsSinceLastTag(lastTag);
  console.log(`📝 Found ${commits.length} commits since last release\n`);
  
  if (commits.length === 0) {
    console.log('⚠️  No commits since last release. Nothing to tweet about.');
    console.log('   Run: npm run release:patch --tag\n');
    process.exit(0);
  }
  
  // Show formatted commit summary
  console.log('--- Commit Summary ---');
  const formatted = formatForTweet(commits);
  console.log(formatted);
  console.log('');
  
  // Generate tweet
  const tweet = generateTweetText(currentVersion, commits);
  console.log('--- Tweet Preview ---');
  console.log(tweet);
  console.log('');
  
  if (previewOnly) {
    console.log('✅ Preview mode - tweet not posted.');
    console.log('   Remove --preview to generate actual tweet.\n');
    return;
  }
  
  // Return the tweet and commit summary for @growth-strategist to use
  console.log('--- Output for @growth-strategist ---');
  console.log(JSON.stringify({
    version: currentVersion,
    lastTag: lastTag,
    commitCount: commits.length,
    commits: commits.slice(0, 10), // Top 10 for context
    tweet: tweet,
    formattedSummary: formatted
  }, null, 2));
  
  console.log('\n✅ Tweet context generated - ready for @growth-strategist\n');
}

main();
