#!/usr/bin/env node

/**
 * StringRay Consumer E2E Unified Runner
 *
 * Single pre-merge gate that validates the packaged artifact across all platforms.
 *
 * Workflow:
 *   1. npm pack
 *   2. Create fresh temp consumer directory
 *   3. npm install the local tarball
 *   4. Run platform E2E tests inside the consumer dir:
 *        - test-hermes-e2e.mjs --dir <consumer-dir> --tarball <tarball>
 *        - test-opencode-e2e.mjs --dir <consumer-dir>
 *        - test-openclaw-e2e.mjs --dir <consumer-dir>
 *   5. Print summary
 *
 * Usage:
 *   node scripts/test/test-consumer-e2e.mjs
 *   node scripts/test/test-consumer-e2e.mjs --keep
 */

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const KEEP = process.argv.includes('--keep');

let passedPlatforms = 0;
let failedPlatforms = 0;

function section(title) {
  console.log(`\n\x1b[1m${'='.repeat(70)}\n  ${title}\n${'='.repeat(70)}\x1b[0m`);
}

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf-8', stdio: 'inherit', ...opts });
    return out;
  } catch (err) {
    if (!opts.ignoreError) throw err;
    return '';
  }
}

async function main() {
  const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

  section('Phase 0: Pack the package');

  const packOutput = run(`cd "${projectRoot}" && npm pack`, { timeout: 60000 });
  const tarballMatch = packOutput.match(/strray-ai-(\d+\.\d+\.\d+)\.tgz/);
  let tarball;
  if (!tarballMatch) {
    const files = fs.readdirSync(projectRoot).filter(f => f.endsWith('.tgz'));
    if (files.length === 0) {
      console.error('Failed to find packed tarball');
      process.exit(1);
    }
    const latest = files.sort().pop();
    tarball = path.join(projectRoot, latest);
  } else {
    tarball = path.join(projectRoot, tarballMatch[0]);
  }

  console.log(`Tarball: ${tarball}`);

  section('Phase 1: Create fresh consumer directory');

  const consumerDir = path.join(os.tmpdir(), `strray-consumer-e2e-${Date.now()}`);
  fs.mkdirSync(consumerDir, { recursive: true });
  console.log(`Consumer dir: ${consumerDir}`);

  run('git init', { cwd: consumerDir });
  run('npm init -y', { cwd: consumerDir });

  section('Phase 2: Install packaged tarball');

  run(`npm install "${tarball}"`, { cwd: consumerDir, timeout: 180000 });
  console.log('Package installed from local tarball');

  const pkgPath = path.join(consumerDir, 'node_modules', 'strray-ai', 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('Installation verification failed');
    process.exit(1);
  }
  console.log('Installation verified');

  section('Phase 3: Run platform E2E tests inside consumer');

  const scriptsDir = path.join(projectRoot, 'scripts', 'test');

  // Hermes
  try {
    run(`node "${path.join(scriptsDir, 'test-hermes-e2e.mjs')}" --dir "${consumerDir}" --tarball "${tarball}"`, { cwd: consumerDir });
    passedPlatforms++;
    console.log('\x1b[32m✓ Hermes E2E passed\x1b[0m');
  } catch (e) {
    failedPlatforms++;
    console.log('\x1b[31m✗ Hermes E2E failed\x1b[0m');
  }

  // OpenCode
  try {
    run(`node "${path.join(scriptsDir, 'test-opencode-e2e.mjs')}" --dir "${consumerDir}"`, { cwd: consumerDir });
    passedPlatforms++;
    console.log('\x1b[32m✓ OpenCode E2E passed\x1b[0m');
  } catch (e) {
    failedPlatforms++;
    console.log('\x1b[31m✗ OpenCode E2E failed\x1b[0m');
  }

  // OpenClaw
  try {
    run(`node "${path.join(scriptsDir, 'test-openclaw-e2e.mjs')}" --dir "${consumerDir}"`, { cwd: consumerDir });
    passedPlatforms++;
    console.log('\x1b[32m✓ OpenClaw E2E passed\x1b[0m');
  } catch (e) {
    failedPlatforms++;
    console.log('\x1b[31m✗ OpenClaw E2E failed\x1b[0m');
  }

  section('Summary');

  console.log(`Platforms passed: ${passedPlatforms}/3`);
  console.log(`Platforms failed: ${failedPlatforms}/3`);

  if (!KEEP) {
    try {
      fs.rmSync(consumerDir, { recursive: true, force: true });
      console.log(`Cleaned up: ${consumerDir}`);
    } catch {}
  } else {
    console.log(`Consumer directory kept: ${consumerDir}`);
  }

  if (failedPlatforms > 0) {
    console.log('\n\x1b[31mConsumer E2E gate FAILED\x1b[0m');
    process.exit(1);
  } else {
    console.log('\n\x1b[32mConsumer E2E gate PASSED\x1b[0m');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
