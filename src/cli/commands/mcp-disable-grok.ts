import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CORE_SKILLS = [
  "orchestrator",
  "code-review",
  "security-audit",
  "bug-triage-specialist",
  "researcher",
];

function getGrokConfigPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return join(home, ".grok", "config.toml");
}

export function disableGrokMCP(): void {
  const configPath = getGrokConfigPath();

  if (!existsSync(configPath)) {
    console.log("No Grok config found. Nothing to disable.");
    return;
  }

  let content = readFileSync(configPath, "utf-8");
  const original = content;

  // Remove all 0xray-* server blocks
  const lines = content.split("\n");
  const newLines: string[] = [];
  let skip = false;

  for (const line of lines) {
    if (line.match(/^\s*\[mcp_servers\.0xray-/)) {
      skip = true;
      continue;
    }
    if (skip && line.trim().startsWith("[")) {
      skip = false;
    }
    if (!skip) {
      newLines.push(line);
    }
  }

  content = newLines.join("\n").trimEnd() + "\n";

  if (content === original) {
    console.log("No 0xRay MCP servers found in Grok config.");
    return;
  }

  writeFileSync(configPath, content, "utf-8");
  console.log("✅ Removed 0xRay MCP servers from Grok CLI config.");
  console.log("   Restart your Grok CLI session to unload them.");
}

export function disableGrokMCPCommand(): void {
  disableGrokMCP();
}
