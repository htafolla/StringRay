#!/usr/bin/env node

/**
 * Single-Release Tweet Generator for StringRay
 *
 * Generates a consumer-facing tweet for the latest release.
 * Focuses on user value (features, fixes, security), filters out internal changes.
 *
 * Usage:
 *   node scripts/node/release-tweet-single.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

/**
 * Get the latest git tag (most recent v1.7.x tag)
 */
function getLatestTag() {
  try {
    const allTags = execSync('git tag -l', {
      cwd: rootDir,
      encoding: 'utf-8'
    }).trim().split('\n').map(t => t.trim()).filter(Boolean);

    // Filter to only v1.7.x format tags and sort by version
    const versionTags = allTags
      .filter(tag => tag.startsWith('v1.7.'))
      .sort((a, b) => {
        const [_, minorA, patchA] = a.split('.').map(Number);
        const [__, minorB, patchB] = b.split('.').map(Number);
        return patchB - patchA; // Sort by patch version, descending
      });

    return versionTags[0] || null;
  } catch {
    console.error('[ERROR] Failed to get latest tag');
    return null;
  }
}

/**
 * Get the previous git tag (before the latest)
 */
function getPreviousTag(latestTag) {
  try {
    const allTags = execSync('git tag -l', {
      cwd: rootDir,
      encoding: 'utf-8'
    }).trim().split('\n').map(t => t.trim()).filter(Boolean);

    // Filter to only v1.7.x format tags and sort by version
    const versionTags = allTags
      .filter(tag => tag.startsWith('v1.7.'))
      .sort((a, b) => {
        const [_, minorA, patchA] = a.split('.').map(Number);
        const [__, minorB, patchB] = b.split('.').map(Number);
        return patchB - patchA; // Sort by patch version, descending
      });

    // Find index of latest tag and return the next one
    const latestIndex = versionTags.indexOf(latestTag);
    if (latestIndex >= 0 && latestIndex + 1 < versionTags.length) {
      return versionTags[latestIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get commits between two tags
 */
function getCommitsBetweenTags(fromTag, toTag) {
  try {
    const commits = execSync(
      `git log ${fromTag}..${toTag} --oneline --format="%s||%h"`,
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
 * Filter commits to show only consumer-facing changes
 * Excludes: refactor, chore, docs, test, build (internal work)
 * Includes: feat, fix, perf, security (user-facing value)
 */
function filterConsumerCommits(commits) {
  return commits.filter(commit => {
    const msg = commit.message.toLowerCase();

    // Include consumer-facing commit types
    if (msg.startsWith('feat:')) return true;
    if (msg.startsWith('fix:')) return true;
    if (msg.startsWith('perf:') || msg.startsWith('performance:')) return true;
    if (msg.startsWith('security:')) return true;

    // Include commits that mention user-facing keywords
    const userFacingKeywords = [
      'release', 'bump', 'version', 'add', 'fix', 'improve',
      'enable', 'implement', 'introduce'
    ];
    if (userFacingKeywords.some(keyword => msg.includes(keyword))) {
      return true;
    }

    // Exclude internal-only work
    if (msg.startsWith('refactor:')) return false;
    if (msg.startsWith('chore:')) return false;
    if (msg.startsWith('docs:')) return false;
    if (msg.startsWith('test:')) return false;
    if (msg.startsWith('build:')) return false;

    // Default: exclude
    return false;
  });
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
    chore: []
  };

  for (const commit of commits) {
    const msg = commit.message.toLowerCase();

    if (msg.startsWith('feat:')) {
      categorized.feat.push(commit);
    } else if (msg.startsWith('fix:')) {
      categorized.fix.push(commit);
    } else if (msg.startsWith('perf:') || msg.startsWith('performance:')) {
      categorized.perf.push(commit);
    } else if (msg.startsWith('security:')) {
      categorized.security.push(commit);
    } else if (msg.startsWith('refactor:')) {
      categorized.refactor.push(commit);
    } else if (msg.startsWith('docs:')) {
      categorized.docs.push(commit);
    } else if (msg.startsWith('test:')) {
      categorized.test.push(commit);
    } else if (msg.startsWith('chore:') || msg.startsWith('release:') || msg.startsWith('bump')) {
      categorized.chore.push(commit);
    } else if (msg.startsWith('security:')) {
      categorized.security.push(commit);
    } else if (msg.startsWith('build:')) {
      categorized.build.push(commit);
    }
  }

  return categorized;
}

/**
 * Generate tweet for the latest release
 */
function generateTweet(version, commits) {
  // Strip 'v' prefix from version tag if present
  const cleanVersion = version.startsWith('v') ? version.slice(1) : version;

  const consumerCommits = filterConsumerCommits(commits);
  const categorized = categorizeCommits(consumerCommits);

  // Build tweet parts
  const parts = [`🚀 StringRay v${cleanVersion} released!`];

  // If no consumer-facing commits, show basic release notice
  if (consumerCommits.length === 0) {
    parts.push(`✅ Production-ready with improved reliability and performance.`);
  } else {
    // Extract highlights from commits (max 3 for tweet)
    const highlights = [];

    if (categorized.feat.length > 0) {
      const feat = categorized.feat[0].message
        .replace(/^feat:\s*/i, '')
        .replace(/\(.*\)/, '') // Remove parenthetical notes
        .replace(/\[.*\]/, '') // Remove bracketed notes
        .trim()
        .slice(0, 50);
      highlights.push(`✨ ${feat}`);
    }

    if (categorized.fix.length > 0) {
      const fix = categorized.fix[0].message
        .replace(/^fix:\s*/i, '')
        .replace(/\(.*\)/, '')
        .replace(/\[.*\]/, '')
        .trim()
        .slice(0, 50);
      highlights.push(`🐛 ${fix}`);
    }

    if (categorized.perf.length > 0) {
      highlights.push(`⚡ Performance boost`);
    }

    if (categorized.security.length > 0) {
      highlights.push(`🔒 Security improvement`);
    }

    if (highlights.length > 0) {
      parts.push(highlights.join(' • '));
    }

    // Add stats
    const stats = [];
    if (categorized.feat.length > 0) {
      stats.push(`${categorized.feat.length} feature${categorized.feat.length === 1 ? '' : 's'}`);
    }
    if (categorized.fix.length > 0) {
      stats.push(`${categorized.fix.length} fix${categorized.fix.length === 1 ? '' : 'es'}`);
    }
    if (categorized.perf.length > 0) {
      stats.push('perf boost');
    }
    if (categorized.security.length > 0) {
      stats.push('security fix');
    }

    if (stats.length > 0) {
      parts.push(`\n📊 ${stats.join(' • ')}`);
    }
  }

  // Hashtags and link
  parts.push('\n#StringRay #AI #DevTools');
  parts.push('🔗 https://github.com/htafolla/stringray');

  return parts.join('\n');
}

function main() {
  console.log('\n' + '='.repeat(50));
  console.log('🐦 Single-Release Tweet Generator for StringRay');
  console.log('='.repeat(50));

  const latestTag = getLatestTag();

  if (!latestTag) {
    console.log('\n❌ No v1.7.x tags found.');
    console.log('Need at least one tagged v1.7.x release.');
    console.log('Run: npm run release:patch --tag first.');
    process.exit(1);
  }

  const previousTag = getPreviousTag(latestTag);
  const commits = previousTag
    ? getCommitsBetweenTags(previousTag, latestTag)
    : [];

  const consumerCommits = filterConsumerCommits(commits);

  console.log(`\n📦 Latest version: ${latestTag}`);
  console.log(`🏷 Previous version: ${previousTag || 'None'}`);
  console.log(`📝 Total commits: ${commits.length}`);
  console.log(`✅ Consumer-facing: ${consumerCommits.length}`);

  if (consumerCommits.length > 0) {
    console.log('\n📋 Consumer-facing commits:');
    consumerCommits.slice(0, 5).forEach(commit => {
      const cleanMsg = commit.message
        .replace(/^(feat|fix|perf|security|release|chore|bump):\s*/i, '')
        .trim();
      console.log(`  - ${cleanMsg}`);
    });
    if (consumerCommits.length > 5) {
      console.log(`  ... and ${consumerCommits.length - 5} more`);
    }
  }

  const tweet = generateTweet(latestTag, commits);

  console.log('\n' + '─'.repeat(45));
  console.log('--- Generated Tweet ---');
  console.log('─'.repeat(45));
  console.log(tweet);
  console.log('─'.repeat(45));

  const charCount = tweet.length;
  console.log(`\n📊 Tweet length: ${charCount} characters (max 280)`);

  if (charCount > 280) {
    console.log('⚠️  Warning: Tweet exceeds 280 characters!');
  }

  // Save to file
  const tweetsDir = path.join(rootDir, 'tweets');
  if (!fs.existsSync(tweetsDir)) {
    fs.mkdirSync(tweetsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(tweetsDir, `tweet-${latestTag}-${timestamp}.txt`);

  fs.writeFileSync(filename, tweet + '\n', 'utf-8');
  console.log(`\n✅ Saved tweet to: ${filename}`);
}

main();
