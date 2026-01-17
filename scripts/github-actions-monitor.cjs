#!/usr/bin/env node

/**
 * GitHub Actions Monitor (Legacy Wrapper)
 *
 * This script is maintained for GitHub Actions workflow compatibility.
 * It now delegates to the unified CI/CD orchestrator.
 *
 * For new usage, prefer: node scripts/ci-cd-orchestrator.cjs --monitor
 */

const { spawn } = require("child_process");

// Delegate to the unified orchestrator
const args = process.argv.slice(2);
const orchestratorArgs = [
  "scripts/ci-cd-orchestrator.cjs",
  "--monitor",
  ...args,
];

const child = spawn("node", orchestratorArgs, {
  stdio: "inherit",
  cwd: process.cwd(),
});

child.on("exit", (code) => {
  process.exit(code);
});

child.on("error", (error) => {
  console.error("Failed to run CI/CD orchestrator:", error);
  process.exit(1);
});
