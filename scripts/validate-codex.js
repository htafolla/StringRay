#!/usr/bin/env node

// Check if we're in the right directory
import fs from "fs";
import path from "path";

if (!fs.existsSync("src/codex-injector.ts")) {
  process.exit(1);
}

// Check if codex files exist
const codexFiles = [
  "docs/framework/agents_template.md",
  ".strray/agents_template.md",
];

let codexFound = false;
for (const file of codexFiles) {
  if (fs.existsSync(file)) {
    codexFound = true;

    // Basic validation of codex content
    try {
      const content = fs.readFileSync(file, "utf-8");
      const versionMatch = content.match(/\*\*Version\*\*:\s*(\d+\.\d+\.\d+)/);
      if (versionMatch) {
      }

      const termMatches = content.match(/####\s*\d+\.\s/g);
      if (termMatches) {
      }
    } catch (error) {}
  }
}

if (!codexFound) {
  process.exit(1);
}

// Check if built files exist
if (fs.existsSync("dist")) {
} else {
}

// Check package.json
if (fs.existsSync("package.json")) {
  try {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  } catch (error) {}
} else {
  process.exit(1);
}

// Check .strray directory
if (fs.existsSync(".strray")) {
  if (fs.existsSync(".strray/codex.json")) {
  } else {
  }
} else {
}
