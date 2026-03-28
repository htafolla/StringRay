#!/usr/bin/env node

/**
 * Proper Release Script for StringRay
 * 
 * Safe release process that:
 * 1. Bumps version
 * 2. Commits version changes
 * 3. Creates git tag
 * 4. Pushes to origin
 * 5. Builds (stops on error)
 * 6. Publishes to npm (only if build succeeds)
 * 7. Generates release tweet
 * 
 * Usage:
 *   npm run release:patch
 *   npm run release:minor  
 *   npm run release:major
 */

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
      return type;
  }
  
  return `${v.major}.${v.minor}.${v.patch}`;
}

function runCommand(cmd, errorMsg) {
  try {
    console.log(`\n> ${cmd}`);
    const result = execSync(cmd, { 
      cwd: rootDir, 
      stdio: 'inherit',
      encoding: 'utf-8'
    });
    return result;
  } catch (error) {
    console.error(`\n❌ ${errorMsg}`);
    console.error(error.message);
    process.exit(1);
  }
}

function runSilent(cmd) {
  try {
    return execSync(cmd, { 
      cwd: rootDir, 
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim();
  } catch (error) {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const releaseType = args[0] || 'patch';
  
  if (!['major', 'minor', 'patch'].includes(releaseType)) {
    console.error('Usage: npm run release:[major|minor|patch]');
    process.exit(1);
  }
  
  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, releaseType);
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        🚀 StringRay Release Process                    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📌 Current version: ${currentVersion}`);
  console.log(`📌 New version: ${newVersion}`);
  console.log(`📌 Release type: ${releaseType}`);
  
  // Step 1: Build FIRST - stop if error
  console.log('\n📦 Step 1: Building (pre-release validation)...');
  runCommand('npm run build', 'Build failed - fix errors before releasing');
  console.log('✅ Build successful');
  
  // Step 2: Prepare consumer and rebuild
  console.log('\n📦 Step 2: Preparing consumer package...');
  runCommand('npm run prepare-consumer', 'Consumer preparation failed');
  
  console.log('\n📦 Step 3: Rebuilding after prepare...');
  runCommand('npm run build', 'Build failed after prepare');
  console.log('✅ All builds passed');
  
  // Step 4: Bump version using version manager (WITHOUT --tag)
  console.log('\n📦 Step 4: Bumping version...');
  runCommand(
    `npm run version:bump -- ${releaseType}`,
    'Version bump failed'
  );
  
  // Step 5: Commit version changes
  console.log('\n📦 Step 5: Committing version changes...');
  runSilent('git add package.json CHANGELOG.md README.md AGENTS.md docs/README.md');
  
  try {
    execSync(
      `git commit --no-verify -m "release: v${newVersion}"`,
      { cwd: rootDir, stdio: 'inherit' }
    );
    console.log('✅ Committed version changes');
  } catch (error) {
    console.log('⚠️  Nothing to commit or commit failed');
  }
  
  // Step 6: Create tag and push
  console.log('\n📦 Step 6: Creating tag and pushing...');
  try {
    execSync(
      `git tag -a v${newVersion} -m "Release v${newVersion}"`,
      { cwd: rootDir, stdio: 'inherit' }
    );
    console.log(`✅ Created tag v${newVersion}`);
  } catch (error) {
    console.log('⚠️  Tag may already exist');
  }
  
  runCommand('git push origin master', 'Failed to push to origin');
  runCommand(`git push origin v${newVersion}`, 'Failed to push tag');
  
  // Step 7: Publish to npm
  console.log('\n📦 Step 7: Publishing to npm...');
  runCommand('npm publish --access public', 'npm publish failed');
  console.log(`✅ Published strray-ai@${newVersion} to npm`);
  
  // Step 8: Generate tweet
  console.log('\n📦 Step 8: Generating release tweet...');
  try {
    execSync(
      'node scripts/node/release-tweet-single.mjs',
      { cwd: rootDir, stdio: 'inherit' }
    );
  } catch (error) {
    console.log('⚠️  Tweet generation skipped or failed');
  }
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        ✅ Release Complete!                            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📦 Package: strray-ai@${newVersion}`);
  console.log(`🏷  Tag: v${newVersion}`);
  console.log(`🐦 Tweet: Check tweets/ directory`);
  console.log('\n🎉 All done!\n');
}

main().catch(error => {
  console.error('\n❌ Release failed:', error.message);
  process.exit(1);
});
