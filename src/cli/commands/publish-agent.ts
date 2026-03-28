/**
 * Publish Agent CLI Command
 *
 * Packages and publishes agents to AgentStore for sharing.
 *
 * Usage: npx strray-ai publish-agent [options]
 * Options:
 *   --agent <name>    Agent name to publish (required)
 *   --version <ver>   Version (optional, auto-detected)
 *   --dry-run         Preview package without publishing
 *
 * Example: npx strray-ai publish-agent --agent orchestrator --dry-run
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";

interface PublishOptions {
  agent: string;
  version?: string;
  dryRun: boolean;
}

function parseArgs(): PublishOptions {
  const args = process.argv.slice(2);
  const options: PublishOptions = {
    agent: "",
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    if (arg === "--agent" && nextArg && !nextArg.startsWith("--")) {
      options.agent = nextArg;
      i++;
    } else if (arg === "--version" && nextArg && !nextArg.startsWith("--")) {
      options.version = nextArg;
      i++;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg && !arg.startsWith("--")) {
      options.agent = arg;
    }
  }

  return options;
}

function getAgentConfig(agentName: string, cwd: string) {
  const configPaths = [
    join(cwd, "agents", `${agentName}.yml`),
    join(cwd, ".opencode", "agents", `${agentName}.yml`),
    join(cwd, "agents", `${agentName}.yaml`),
    join(cwd, ".opencode", "agents", `${agentName}.yaml`),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
}

function extractYamlField(content: string, field: string): string | null {
  const regex = new RegExp(`^${field}:\\s*(.+)$`, "m");
  const match = content.match(regex);
  return match && match[1] ? match[1].trim() : null;
}

function getPackageVersion(cwd: string): string {
  try {
    const pkgPath = join(cwd, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.version) return pkg.version;
    }
  } catch { /* ignore */ }

  const strrayPkgPath = join(cwd, ".opencode", "package.json");
  try {
    if (existsSync(strrayPkgPath)) {
      const pkg = JSON.parse(readFileSync(strrayPkgPath, "utf-8"));
      if (pkg.version) return pkg.version;
    }
  } catch { /* ignore */ }

  return "1.0.0";
}

function createAgentManifest(
  agentName: string,
  configPath: string,
  version: string,
  cwd: string
): object {
  const content = readFileSync(configPath, "utf-8");

  return {
    name: agentName,
    version: version,
    description: extractYamlField(content, "description") || `Agent: ${agentName}`,
    author: extractYamlField(content, "author") || extractYamlField(content, "maintainer") || "StringRay User",
    license: extractYamlField(content, "license") || "MIT",
    source: extractYamlField(content, "source") || "custom",
    framework: "stringray",
    frameworkVersion: getPackageVersion(cwd),
    publishedAt: new Date().toISOString(),
    skills: [],
    permissions: extractYamlField(content, "permissions")?.split(",").map((p: string) => p.trim()) || [],
    tags: extractYamlField(content, "tags")?.split(",").map((t: string) => t.trim()) || [],
  };
}

function packageAgent(
  agentName: string,
  configPath: string,
  version: string,
  cwd: string
): string {
  const outputDir = join(cwd, ".strray", "publish", agentName);
  mkdirSync(outputDir, { recursive: true });

  const manifest = createAgentManifest(agentName, configPath, version, cwd);
  writeFileSync(
    join(outputDir, "agent.json"),
    JSON.stringify(manifest, null, 2)
  );

  writeFileSync(
    join(outputDir, "AGENT.md"),
    readFileSync(configPath, "utf-8")
  );

  return outputDir;
}

export async function publishAgentCommand(): Promise<void> {
  const cwd = process.cwd();
  const options = parseArgs();

  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║           StringRay Agent Publisher            ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");

  if (!options.agent) {
    console.error("❌ Error: Agent name is required");
    console.log("");
    console.log("Usage: npx strray-ai publish-agent --agent <name> [options]");
    console.log("");
    console.log("Options:");
    console.log("  --agent <name>    Agent name to publish (required)");
    console.log("  --version <ver>   Version (optional, auto-detected)");
    console.log("  --dry-run         Preview package without publishing");
    console.log("");
    console.log("Example: npx strray-ai publish-agent --agent orchestrator");
    process.exit(1);
  }

  const configPath = getAgentConfig(options.agent, cwd);

  if (!configPath) {
    console.error(`❌ Error: Agent '${options.agent}' not found`);
    console.log("");
    console.log("Searched locations:");
    console.log(`  • agents/${options.agent}.yml`);
    console.log(`  • .opencode/agents/${options.agent}.yml`);
    console.log("");
    console.log("Available agents in this project:");
    const agentsDir = join(cwd, "agents");
    if (existsSync(agentsDir)) {
      const agents = require("fs")
        .readdirSync(agentsDir)
        .filter((f: string) => f.endsWith(".yml") || f.endsWith(".yaml"));
      if (agents.length > 0) {
        agents.forEach((a: string) => console.log(`  • ${a.replace(/\.(yml|yaml)$/, "")}`));
      } else {
        console.log("  (none found)");
      }
    } else {
      console.log("  (agents directory not found)");
    }
    process.exit(1);
  }

  const version = options.version || getPackageVersion(cwd);

  console.log(`📦 Agent: ${options.agent}`);
  console.log(`📄 Config: ${configPath}`);
  console.log(`🏷️  Version: ${version}`);
  console.log("");

  if (options.dryRun) {
    console.log("🔍 Dry run mode - showing package contents:");
    console.log("");

    const manifest = createAgentManifest(options.agent, configPath, version, cwd);
    console.log("Manifest (agent.json):");
    console.log(JSON.stringify(manifest, null, 2));
    console.log("");
    console.log("✅ Dry run complete - no files written");
  } else {
    console.log("📦 Packaging agent...");

    const outputDir = packageAgent(options.agent, configPath, version, cwd);

    console.log("");
    console.log(`✅ Agent packaged successfully!`);
    console.log("");
    console.log(`Package location: ${outputDir}`);
    console.log("");
    console.log("Next steps:");
    console.log("  1. Review the generated files");
    console.log("  2. Test the agent locally");
    console.log("  3. Publish to AgentStore (coming soon)");
  }

  console.log("");
}

export default publishAgentCommand;
