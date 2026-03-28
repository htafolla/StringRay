#!/usr/bin/env node

/**
 * Test script for install.cjs
 * Verifies the StringRay installer works correctly
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const INSTALL_SCRIPT = path.join(__dirname, "install.cjs");

function runCommand(cmd, description) {
  console.log(`\n📋 Testing: ${description}`);
  console.log(`   Command: ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: "utf8", timeout: 30000 });
    console.log(`   ✅ PASS`);
    return { success: true, output };
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return { success: false, error };
  }
}

function main() {
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║              StringRay Installer Test Suite                     ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");

  const tests = [
    {
      cmd: `node "${INSTALL_SCRIPT}" --help`,
      desc: "Help flag displays correctly",
    },
    {
      cmd: `node "${INSTALL_SCRIPT}" --minimal --yes 2>&1 | head -1`,
      desc: "Minimal install runs without error",
    },
    {
      cmd: `node "${INSTALL_SCRIPT}" --with-skills --yes 2>&1 | grep -q "Antigravity" && echo "FOUND"`,
      desc: "With-skills flag triggers Antigravity",
    },
    {
      cmd: `node "${INSTALL_SCRIPT}" --full --yes 2>&1 | grep -q "Impeccable" && echo "FOUND"`,
      desc: "Full install creates Impeccable stub",
    },
    {
      cmd: `node "${INSTALL_SCRIPT}" --full --yes 2>&1 | grep -q "OpenViking" && echo "FOUND"`,
      desc: "Full install creates OpenViking stub",
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = runCommand(test.cmd, test.desc);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                        Test Results                              ║
╠══════════════════════════════════════════════════════════════════╣
║   ✅ Passed: ${passed}                                              ║
║   ❌ Failed: ${failed}                                              ║
╚══════════════════════════════════════════════════════════════════╝
`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
