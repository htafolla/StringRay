import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { getConfigDir } from "../../core/config-paths.js";

interface EnableGrokOptions {
  skills?: string[];
  global?: boolean;   // default: true
  project?: boolean;  // write to .grok/config.toml in current dir
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(join(__dirname, "..", "..", ".."));

interface GrokMCPConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

const CORE_SKILLS = [
  "orchestrator",
  "code-review",
  "security-audit",
  "bug-triage-specialist",
  "researcher",
];

function getMCPBasePath(): string {
  // 1. Check if we're inside the source tree (development)
  const srcMcps = join(packageRoot, "src", "mcps");
  if (existsSync(join(srcMcps, "orchestrator", "server.ts"))) {
    return srcMcps;
  }

  // 2. Check dist (built package)
  const distMcps = join(packageRoot, "dist", "mcps");
  if (existsSync(distMcps)) {
    return distMcps;
  }

  // 3. Fallback for global npm install
  const possiblePaths = [
    join(packageRoot, "dist", "mcps"),
    join(packageRoot, "src", "mcps"),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) return p;
  }

  throw new Error(
    "Could not locate 0xRay MCP servers.\n" +
    "Please build the package first: npm run build"
  );
}

function getGrokConfigPath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return join(home, ".grok", "config.toml");
}

function getGrokConfigDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return join(home, ".grok");
}

function ensureGrokConfig(): string {
  const configPath = getGrokConfigPath();
  const configDir = getGrokConfigDir();

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  if (!existsSync(configPath)) {
    writeFileSync(configPath, "", "utf-8");
  }

  return configPath;
}

function buildMCPConfig(skill: string, basePath: string): GrokMCPConfig {
  const isOrchestrator = skill === "orchestrator";
  const isSrc = basePath.includes("/src/mcps");

  const ext = isSrc ? ".ts" : ".js";
  const runner = isSrc ? ["--loader", "tsx"] : []; // fallback for dev

  let serverPath: string;
  if (isOrchestrator) {
    serverPath = join(basePath, "orchestrator", `server${ext}`);
  } else {
    serverPath = join(basePath, "knowledge-skills", `${skill}.server${ext}`);
  }

  const args = isSrc
    ? ["--loader", "tsx", serverPath] // requires tsx installed globally or locally
    : ["--enable-source-maps", serverPath];

  return {
    command: "node",
    args,
    env: {
      STRRAY_PROJECT_ROOT: process.cwd(),
      NODE_ENV: process.env.NODE_ENV || "production",
    },
  };
}

function generateTOMLEntries(basePath: string, skills: string[]): string {
  let toml = "\n# 0xRay MCP Servers (added by strray mcp:enable-grok)\n";

  for (const skill of skills) {
    const config = buildMCPConfig(skill, basePath);
    const serverName = `0xray-${skill}`;

    toml += `\n[mcp_servers.${serverName}]\n`;
    toml += `command = "${config.command}"\n`;
    toml += `args = [${config.args.map((a) => `"${a}"`).join(", ")}]\n`;

    if (config.env) {
      toml += "env = { ";
      const envPairs = Object.entries(config.env).map(([k, v]) => `${k} = "${v}"`);
      toml += envPairs.join(", ") + " }\n";
    }
  }

  return toml;
}

function addToGrokConfig(tomlEntries: string): void {
  const configPath = ensureGrokConfig();
  let content = readFileSync(configPath, "utf-8");

  // Avoid duplicate additions
  if (content.includes("0xray-orchestrator")) {
    console.log("⚠️  0xRay MCP servers already appear to be configured in Grok CLI.");
    console.log(`   Config: ${configPath}`);
    return;
  }

  // Append
  if (!content.endsWith("\n")) {
    content += "\n";
  }
  content += tomlEntries;

  writeFileSync(configPath, content, "utf-8");

  console.log(`✅ Added 0xRay MCP servers to Grok CLI config:`);
  console.log(`   ${configPath}`);
  console.log(`\nRestart your Grok CLI session or run 'grok mcp reload' (if available) to load the servers.`);
}

export async function enableGrokMCP(options: EnableGrokOptions = {}): Promise<void> {
  console.log("🚀 Enabling 0xRay MCP servers for Grok CLI...\n");

  const mcpBasePath = getMCPBasePath();
  const skillsToEnable = options.skills && options.skills.length > 0
    ? options.skills
    : CORE_SKILLS;

  const useProject = options.project === true;
  const useGlobal = options.global !== false && !useProject;

  const toml = generateTOMLEntries(mcpBasePath, skillsToEnable);

  if (useGlobal) {
    addToGrokConfig(toml);
  }

  if (useProject) {
    const projectConfigPath = join(process.cwd(), ".grok", "config.toml");
    const projectDir = dirname(projectConfigPath);
    if (!existsSync(projectDir)) mkdirSync(projectDir, { recursive: true });

    let content = existsSync(projectConfigPath) ? readFileSync(projectConfigPath, "utf-8") : "";
    if (!content.includes("0xray-orchestrator")) {
      if (!content.endsWith("\n") && content.length > 0) content += "\n";
      content += toml;
      writeFileSync(projectConfigPath, content, "utf-8");
      console.log(`✅ Also added to project .grok/config.toml`);
    }
  }

  console.log("\n📋 Enabled servers:");
  for (const skill of skillsToEnable) {
    console.log(`   - 0xray-${skill}`);
  }

  console.log("\n💡 Next steps:");
  console.log("   1. Restart your Grok CLI session (or run `grok mcp reload` if available).");
  console.log("   2. You can now use 0xRay agents and governance from Grok CLI.");
  console.log("   3. Example: Ask Grok to run governance on a proposal using the orchestrator.");
}

export function enableGrokMCPCommand(options: { skills?: string[] } = {}): void {
  enableGrokMCP(options).catch((err) => {
    console.error("❌ Failed to enable 0xRay for Grok CLI:", err);
    process.exit(1);
  });
}
