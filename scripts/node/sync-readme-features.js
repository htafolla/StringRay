#!/usr/bin/env node
/**
 * README Feature Sync Script
 * 
 * Auto-updates README.md with current counts and feature status.
 * Run: node scripts/node/sync-readme-features.js
 * 
 * Updates:
 * - Agent count from .opencode/agents/
 * - Skill count from .opencode/skills/
 * - MCP server count from src/mcps/
 * - CLI commands from src/cli/
 * - Version from package.json
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const PROJECT_ROOT = process.cwd();
const README_PATH = path.join(PROJECT_ROOT, "README.md");

// Marker comments for auto-updated sections
const MARKERS = {
  version: "<!-- VERSION:",
  agents: "<!-- AGENTS:",
  skills: "<!-- SKILLS:",
  mcps: "<!-- MCPS:",
  cli: "<!-- CLI:",
  end: "-->",
};

/**
 * Count files matching a pattern
 */
function countFiles(pattern, cwd = PROJECT_ROOT) {
  try {
    const result = execSync(`find "${cwd}" -name "${pattern}" -type f 2>/dev/null | wc -l`, {
      encoding: "utf-8",
    });
    return parseInt(result.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Count directories matching a pattern
 */
function countDirs(pattern, cwd = PROJECT_ROOT) {
  try {
    const result = execSync(
      `find "${cwd}" -name "${pattern}" -type d 2>/dev/null | wc -l`,
      { encoding: "utf-8" }
    );
    return parseInt(result.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Get version from package.json
 */
function getVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf-8"));
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Extract current counts from README
 */
function getCurrentCounts(readme) {
  const counts = {};
  
  for (const [key, marker] of Object.entries(MARKERS)) {
    if (marker === MARKERS.end) continue;
    const regex = new RegExp(`${marker}([\\d.]+)\\s*-->`, "i");
    const match = readme.match(regex);
    counts[key] = match ? match[1] : null;
  }
  
  return counts;
}

/**
 * Update README with new counts
 */
function updateReadme() {
  if (!fs.existsSync(README_PATH)) {
    console.error("❌ README.md not found");
    return false;
  }

  const readme = fs.readFileSync(README_PATH, "utf-8");
  const currentCounts = getCurrentCounts(readme);

  // Gather new counts
  const counts = {
    version: getVersion(),
    agents: countFiles("*.yml", path.join(PROJECT_ROOT, ".opencode/agents")),
    skills: countDirs("*", path.join(PROJECT_ROOT, ".opencode/skills")),
    mcps: countFiles("*.ts", path.join(PROJECT_ROOT, "src/mcps")),
    cli: countFiles("*.ts", path.join(PROJECT_ROOT, "src/cli")),
  };

  let updated = readme;

  // Update each section
  for (const [key, marker] of Object.entries(MARKERS)) {
    if (key === "end") continue;
    const newValue = counts[key];
    if (newValue !== null) {
      const regex = new RegExp(`${marker}[\\d.]+\\s*-->`, "i");
      if (regex.test(updated)) {
        updated = updated.replace(regex, `${marker}${newValue} -->`);
      }
    }
  }

  // Check if anything changed
  if (updated === readme) {
    console.log("✅ README.md already up to date");
    return false;
  }

  fs.writeFileSync(README_PATH, updated);
  console.log("✅ README.md updated:");
  console.log(`   Version: ${counts.version}`);
  console.log(`   Agents: ${counts.agents}`);
  console.log(`   Skills: ${counts.skills}`);
  console.log(`   MCPs: ${counts.mcps}`);
  console.log(`   CLI: ${counts.cli}`);
  return true;
}

// Main
const dryRun = process.argv.includes("--dry-run");
const verbose = process.argv.includes("--verbose");

console.log("🔄 Syncing README.md features...\n");

if (dryRun) {
  console.log("📋 Dry run - showing what would be updated:\n");
}

const version = getVersion();
const agents = countFiles("*.yml", path.join(PROJECT_ROOT, ".opencode/agents"));
const skills = countDirs("*", path.join(PROJECT_ROOT, ".opencode/skills"));
const mcps = countFiles("*.ts", path.join(PROJECT_ROOT, "src/mcps"));
const cli = countFiles("*.ts", path.join(PROJECT_ROOT, "src/cli"));

console.log("Current counts:");
console.log(`   Version: ${version}`);
console.log(`   Agents: ${agents}`);
console.log(`   Skills: ${skills}`);
console.log(`   MCPs: ${mcps}`);
console.log(`   CLI: ${cli}`);

if (!dryRun) {
  updateReadme();
}
