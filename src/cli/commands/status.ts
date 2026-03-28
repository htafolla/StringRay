/**
 * Status CLI Command
 *
 * Shows comprehensive framework status including:
 * - OpenCode installation status
 * - Installed skills
 * - Configured agents
 * - Health metrics
 * - Inference engine status
 *
 * Usage: npx strray-ai status
 */

import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

interface StatusReport {
  opencode: {
    installed: boolean;
    configFound: boolean;
  };
  skills: {
    count: number;
    names: string[];
  };
  agents: {
    count: number;
    names: string[];
  };
  health: {
    logPath: string;
    logExists: boolean;
    recentEntries: number;
  };
  inference: {
    active: boolean;
    lastTuning: string | null;
    outcomesCount: number;
    patternsCount: number;
  };
}

function getSkillsList(cwd: string): { count: number; names: string[] } {
  const skills: string[] = [];

  const integrationsPath = join(cwd, ".opencode", "integrations");
  if (existsSync(integrationsPath)) {
    const integrationDirs = readdirSync(integrationsPath).filter((f) =>
      existsSync(join(integrationsPath, f, "SKILL.md"))
    );
    skills.push(...integrationDirs);
  }

  const skillsPath = join(cwd, ".opencode", "skills");
  if (existsSync(skillsPath)) {
    const skillDirs = readdirSync(skillsPath).filter((f) =>
      existsSync(join(skillsPath, f, "SKILL.md"))
    );
    skills.push(...skillDirs);
  }

  const uniqueSkills = [...new Set(skills)];
  return { count: uniqueSkills.length, names: uniqueSkills.sort() };
}

function getAgentsList(cwd: string): { count: number; names: string[] } {
  const agentsFromSkills = [
    "enforcer",
    "orchestrator",
    "architect",
    "security-auditor",
    "code-reviewer",
    "refactorer",
    "testing-lead",
    "bug-triage-specialist",
    "researcher",
  ];
  const configuredAgents: string[] = [];

  const agentsConfigPath = join(cwd, ".opencode", "strray", "agents.json");
  if (existsSync(agentsConfigPath)) {
    try {
      const config = JSON.parse(readFileSync(agentsConfigPath, "utf-8"));
      if (config.agents) {
        configuredAgents.push(...Object.keys(config.agents));
      }
    } catch { /* ignore */ }
  }

  const featuresPath = join(cwd, ".opencode", "strray", "features.json");
  if (existsSync(featuresPath)) {
    try {
      const features = JSON.parse(readFileSync(featuresPath, "utf-8"));
      if (features.agent_management?.disabled_agents) {
        const disabled = features.agent_management.disabled_agents;
        agentsFromSkills.forEach((agent) => {
          if (!disabled.includes(agent) && !configuredAgents.includes(agent)) {
            configuredAgents.push(agent);
          }
        });
      }
    } catch { /* ignore */ }
  }

  if (configuredAgents.length === 0) {
    configuredAgents.push(...agentsFromSkills);
  }

  return {
    count: configuredAgents.length,
    names: [...new Set(configuredAgents)].sort(),
  };
}

function getHealthMetrics(cwd: string): {
  logPath: string;
  logExists: boolean;
  recentEntries: number;
} {
  const logPath = join(cwd, "logs", "framework", "activity.log");
  const logExists = existsSync(logPath);
  let recentEntries = 0;

  if (logExists) {
    try {
      const content = readFileSync(logPath, "utf-8");
      recentEntries = content.split("\n").filter((l) => l.trim()).length;
    } catch { /* ignore */ }
  }

  return { logPath, logExists, recentEntries };
}

function getInferenceStatus(cwd: string): {
  active: boolean;
  lastTuning: string | null;
  outcomesCount: number;
  patternsCount: number;
} {
  let active = false;
  let lastTuning: string | null = null;
  let outcomesCount = 0;
  let patternsCount = 0;

  try {
    const tunerStatusPath = join(cwd, ".opencode", "strray", "inference", "tuner-status.json");
    if (existsSync(tunerStatusPath)) {
      const status = JSON.parse(readFileSync(tunerStatusPath, "utf-8"));
      active = status.running ?? false;
      lastTuning = status.lastTuningTime
        ? new Date(status.lastTuningTime).toISOString()
        : null;
    }

    const outcomesPath = join(cwd, ".opencode", "strray", "inference", "outcomes.json");
    if (existsSync(outcomesPath)) {
      const outcomes = JSON.parse(readFileSync(outcomesPath, "utf-8"));
      outcomesCount = Array.isArray(outcomes) ? outcomes.length : 0;
    }

    const patternsPath = join(cwd, ".opencode", "strray", "inference", "patterns.json");
    if (existsSync(patternsPath)) {
      const patterns = JSON.parse(readFileSync(patternsPath, "utf-8"));
      patternsCount = Array.isArray(patterns) ? patterns.length : 0;
    }
  } catch { /* ignore */ }

  return { active, lastTuning, outcomesCount, patternsCount };
}

export function getStatusReport(cwd: string = process.cwd()): StatusReport {
  const opencodeConfigPath = join(cwd, "opencode.json");
  const cwdSkills = getSkillsList(cwd);
  const agents = getAgentsList(cwd);
  const health = getHealthMetrics(cwd);
  const inference = getInferenceStatus(cwd);

  return {
    opencode: {
      installed: existsSync(join(cwd, "node_modules", "strray-ai")),
      configFound: existsSync(opencodeConfigPath),
    },
    skills: cwdSkills,
    agents,
    health,
    inference,
  };
}

export function printStatus(report: StatusReport): void {
  const opencodeStatus = report.opencode.installed
    ? "✅ Installed"
    : "⚠️  Not installed locally";
  const configStatus = report.opencode.configFound ? "✅ Found" : "❌ Missing";
  const logStatus = report.health.logExists
    ? `✅ ${report.health.recentEntries} entries`
    : "⚠️  No activity log";
  const inferenceStatus = report.inference.active ? "✅ Active" : "⚠️  Idle";
  const healthStatus = report.health.recentEntries > 100
    ? "Good"
    : report.health.recentEntries > 0
    ? "Fair"
    : "No data";

  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║           StringRay Status                      ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");
  console.log(`✅ OpenCode: ${opencodeStatus}`);
  console.log(`📄 Config:  ${configStatus}`);
  console.log(`📦 Skills:  ${report.skills.count} loaded`);
  console.log(`🤖 Agents:  ${report.agents.count} configured`);
  console.log(
    `⚙️  Inference: ${inferenceStatus} (${report.inference.outcomesCount} outcomes, ${report.inference.patternsCount} patterns)`
  );
  console.log(`📊 Health:  ${healthStatus}`);
  console.log("");

  if (report.skills.names.length > 0) {
    console.log("Installed Skills:");
    const cols = 4;
    const rows = Math.ceil(report.skills.names.length / cols);
    for (let i = 0; i < rows; i++) {
      const row = report.skills.names.slice(i * cols, (i + 1) * cols);
      console.log("  " + row.map((s) => `• ${s}`).join("  "));
    }
    console.log("");
  }

  if (report.agents.names.length > 0) {
    console.log("Agents:");
    const cols = 4;
    const rows = Math.ceil(report.agents.names.length / cols);
    for (let i = 0; i < rows; i++) {
      const row = report.agents.names.slice(i * cols, (i + 1) * cols);
      console.log("  " + row.map((a) => `• ${a}`).join("  "));
    }
    console.log("");
  }

  if (report.inference.lastTuning) {
    console.log(`Last tuning: ${report.inference.lastTuning}`);
    console.log("");
  }
}

export async function statusCommand(): Promise<void> {
  const cwd = process.cwd();
  const report = getStatusReport(cwd);
  printStatus(report);
}

export default statusCommand;
