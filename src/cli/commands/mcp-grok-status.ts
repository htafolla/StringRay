import { existsSync, readFileSync } from "fs";
import { join } from "path";

const CORE_SKILL_NAMES = [
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

export function showGrokMCPStatus(): void {
  const configPath = getGrokConfigPath();

  if (!existsSync(configPath)) {
    console.log("No Grok CLI config found.");
    console.log("Run `strray-ai mcp:enable-grok` to set up 0xRay integration.");
    return;
  }

  const content = readFileSync(configPath, "utf-8");
  const lines = content.split("\n");

  const enabled: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*\[mcp_servers\.0xray-([^\]]+)\]/);
    if (match) {
      enabled.push(match[1] || 'unknown');
    }
  }

  console.log("\n0xRay MCP Status for Grok CLI\n");

  if (enabled.length === 0) {
    console.log("❌ No 0xRay MCP servers are currently enabled for Grok CLI.");
    console.log("\nRun: strray-ai mcp:enable-grok");
    return;
  }

  console.log("✅ Enabled 0xRay MCP servers:\n");
  for (const name of enabled) {
    const isCore = CORE_SKILL_NAMES.includes(name);
    console.log(`   - 0xray-${name}${isCore ? " (core)" : ""}`);
  }

  console.log("\nYou can now ask Grok to use these servers (e.g. orchestrator, code-review, etc.).");
  console.log("Restart Grok CLI if you recently enabled/disabled servers.");
}

export function showGrokMCPStatusCommand(): void {
  showGrokMCPStatus();
}
