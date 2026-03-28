#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  return pkg.version;
}

function getLatestTag() {
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

function getPreviousTag(latestTag) {
  try {
    const allTags = execSync('git tag -l', {
      cwd: rootDir,
      encoding: 'utf-8'
    }).trim().split('\n').map(t => t.trim()).filter(Boolean);

    const versionTags = allTags
      .filter(tag => tag.startsWith('v1.7.'))
      .sort((a, b) => {
        const [_, minorA, patchA] = a.split('.').map(Number);
        const [__, minorB, patchB] = b.split('.').map(Number);
        return patchB - patchA;
      });

    const latestIndex = versionTags.indexOf(latestTag);
    if (latestIndex >= 0 && latestIndex + 1 < versionTags.length) {
      return versionTags[latestIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

function findReleaseCommit(version) {
  try {
    const versionPattern = version;
    const releaseCommits = execSync(
      'git log --all --oneline --grep="^release:.*' + versionPattern + '" --format="%H||%s"',
      { cwd: rootDir, encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);

    if (releaseCommits.length > 0) {
      const parts = releaseCommits[0].split('||');
      return { hash: parts[0], message: parts[1] };
    }
    return null;
  } catch {
    return null;
  }
}

function getCommitsBetweenTags(fromTag, toTag) {
  try {
    const commits = execSync(
      'git log ' + fromTag + '..' + toTag + ' --oneline --format="%s||%h"',
      { cwd: rootDir, encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);

    return commits.map(commit => {
      const parts = commit.split('||');
      return { message: parts[0], hash: parts[1] };
    });
  } catch {
    return [];
  }
}

function getChangedFiles(commitHash) {
  try {
    const files = execSync(
      'git show ' + commitHash + ' --name-only --format=""',
      { cwd: rootDir, encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);
    return files;
  } catch {
    return [];
  }
}

function analyzeFileValue(filePath) {
  const fullPath = path.join(rootDir, filePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const stats = fs.statSync(fullPath);

    if (stats.size > 100000) {
      return null;
    }

    const lines = content.split('\n').length;
    const valuePoints = [];

    if (filePath.endsWith('.md')) {
      valuePoints.push('documentation');

      if (filePath === 'AGENTS.md') {
        valuePoints.push('complete agent guide');
      } else if (filePath.toLowerCase().includes('readme')) {
        valuePoints.push('getting started');
      }
    }

    if (filePath.endsWith('.json')) {
      valuePoints.push('configuration');

      if (filePath === 'package.json') {
        valuePoints.push('package scripts');
      }
    }

    if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.ts')) {
      valuePoints.push('automation');

      if (filePath.toLowerCase().includes('release')) {
        valuePoints.push('release automation');
      }
      if (filePath.toLowerCase().includes('version')) {
        valuePoints.push('version management');
      }
    }

    return {
      file: filePath,
      lines,
      value: valuePoints.join(', ')
    };
  } catch {
    return null;
  }
}

function generateValueTweet(version, files) {
  const parts = ['🚀 StringRay v' + version + ' released!'];
  const highlights = [];

  const analyzedFiles = [];

  for (const file of files) {
    const analysis = analyzeFileValue(file);
    if (analysis) {
      analyzedFiles.push(analysis);
    }
  }

  const docFiles = analyzedFiles.filter(f => f.file.endsWith('.md'));
  const configFiles = analyzedFiles.filter(f => f.file.endsWith('.json'));
  const scriptFiles = analyzedFiles.filter(f => f.file.endsWith('.js') || f.file.endsWith('.mjs') || f.file.endsWith('.ts'));

  if (docFiles.length > 0) {
    const agentsDoc = docFiles.find(f => f.file === 'AGENTS.md');
    if (agentsDoc) {
      highlights.push('📚 Complete agent documentation (584+ lines)');
    } else {
      const totalDocLines = docFiles.reduce((sum, f) => sum + f.lines, 0);
      if (totalDocLines > 300) {
        highlights.push('📚 Comprehensive documentation (' + totalDocLines + '+ lines)');
      } else {
        highlights.push('📝 Better documentation');
      }
    }
  }

  if (configFiles.length > 0) {
    if (configFiles.some(c => c.file === 'package.json')) {
      highlights.push('📦 Package improvements');
    } else {
      highlights.push('⚙️ Better configuration');
    }
  }

  if (scriptFiles.length > 0) {
    const hasReleaseScripts = scriptFiles.some(s => 
      s.value.includes('release') && s.value.includes('automation')
    );

    if (hasReleaseScripts) {
      highlights.push('🔄 Automated releases + tweets');
    } else if (scriptFiles.some(s => s.value.includes('version'))) {
      highlights.push('📦 Version automation');
    } else {
      highlights.push('⚡ Better automation');
    }
  }

  if (highlights.length === 0) {
    if (files.length > 0) {
      highlights.push('✅ Production-ready improvements');
    } else {
      highlights.push('✅ Ready for production');
    }
  }

  if (highlights.length > 0) {
    parts.push(highlights.slice(0, 3).join(' • '));
  }

  const stats = [];
  if (docFiles.length > 0) stats.push(docFiles.length + ' docs');
  if (configFiles.length > 0) stats.push(configFiles.length + ' configs');
  if (scriptFiles.length > 0) stats.push(scriptFiles.length + ' automation');

  if (stats.length > 0) {
    parts.push('\\n📊 ' + stats.join(' • '));
  }

  parts.push('\\n#StringRay #AI #DevTools');
  parts.push('🔗 https://github.com/htafolla/stringray');

  return parts.join('\\n');
}

function main() {
  const args = process.argv.slice(2);
  const previewOnly = args.includes('--preview') || args.includes('-p');

  console.log('\\n' + '='.repeat(50));
  console.log('🐦 Value-Focused Tweet Generator for StringRay');
  console.log('='.repeat(50));

  const currentVersion = getCurrentVersion();
  const latestTag = getLatestTag();
  const previousTag = getPreviousTag(latestTag);
  const releaseCommit = findReleaseCommit(currentVersion);

  if (!releaseCommit) {
    console.log('\\n⚠️  No release commit found for version ' + currentVersion);
    console.log('   Make sure version is correctly tagged and released.');
    process.exit(1);
  }

  const files = getChangedFiles(releaseCommit.hash);

  console.log('\\n📦 Version: ' + currentVersion);
  console.log('🏷 Latest tag: ' + latestTag);
  console.log('🏷 Previous tag: ' + (previousTag || 'None'));
  console.log('📝 Files changed: ' + files.length);

  if (files.length > 0) {
    console.log('\\n📋 Changed files:');
    files.slice(0, 15).forEach(function(file) {
      console.log('  - ' + file);
    });
    if (files.length > 15) {
      console.log('  ... and ' + (files.length - 15) + ' more');
    }
  }

  const tweet = generateValueTweet(currentVersion, files);

  console.log('\\n' + '─'.repeat(45));
  console.log('--- Generated Tweet ---');
  console.log('─'.repeat(45));
  console.log(tweet);
  console.log('─'.repeat(45));

  const charCount = tweet.length;
  console.log('\\n📊 Tweet length: ' + charCount + ' characters (max 280)');

  if (charCount > 280) {
    console.log('⚠️  Warning: Tweet exceeds 280 characters!');
  }

  if (previewOnly) {
    console.log('\\n✅ Preview mode - not saving to file.');
    console.log('   Remove --preview to save.\\n');
    process.exit(0);
  }

  const tweetsDir = path.join(rootDir, 'tweets');
  if (!fs.existsSync(tweetsDir)) {
    fs.mkdirSync(tweetsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(tweetsDir, 'tweet-v' + currentVersion + '-' + timestamp + '.txt');

  fs.writeFileSync(filename, tweet + '\\n', 'utf-8');
  console.log('\\n✅ Saved tweet to: ' + filename);
}

main();
