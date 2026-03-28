/**
 * Agent Resolver
 *
 * Resolves agent configurations from the StringRay registry.
 * Used by the integration layer to programmatically access agent configs.
 *
 * @version 1.1.0
 * @since 2026-02-14
 */

import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "../core/framework-logger.js";

interface AgentConfig {
  name: string;
  description?: string;
  capabilities?: string[];
  system?: string;
  tools?: {
    include?: string[];
    exclude?: string[];
  };
  model?: string;
  mode?: string;
  temperature?: number;
  maxComplexity?: number;
  enabled?: boolean;
  permission?: {
    edit?: string;
    bash?: string;
  };
  [key: string]: unknown;
}

interface AgentRegistry {
  [agentName: string]: AgentConfig;
}

/**
 * Default fallback configuration for agents
 */
const DEFAULT_AGENT_CONFIG: AgentConfig = {
  name: "unknown",
  description: "Default agent configuration",
  capabilities: ["general-purpose"],
  system: "You are a helpful AI assistant.",
  tools: {
    include: ["read", "grep", "edit", "bash"],
  },
  mode: "subagent",
  temperature: 0.7,
  enabled: true,
};

/**
 * Resolves an agent configuration by name from the StringRay registry
 *
 * @param agentName - The name of the agent to resolve
 * @returns The agent configuration object
 * @throws Error if agent cannot be resolved
 */
export async function resolveAgent(agentName: string): Promise<AgentConfig> {
  // Try to load from the agents registry
  const registry = await loadAgentRegistry();

  if (registry[agentName]) {
    return registry[agentName];
  }

  // Try to load individual agent config file
  const agentConfig = await loadAgentConfigFile(agentName);

  if (agentConfig) {
    return agentConfig;
  }

  // Return default fallback if nothing found
  await frameworkLogger.log(
    "agent-resolver",
    "agent-not-found-using-default",
    "warning",
    { agentName },
  );
  return {
    ...DEFAULT_AGENT_CONFIG,
    name: agentName,
  };
}

/**
 * Loads the complete agent registry from the index file
 */
async function loadAgentRegistry(): Promise<AgentRegistry> {
  try {
    // Try to load from the agents index using dynamic import (ESM)
    const indexPath = path.join(process.cwd(), "dist", "agents", "index.js");
    const fileUrl = `file://${indexPath}`;

    if (fs.existsSync(indexPath)) {
      // Dynamic import of the index (ESM)
      const agentsModule = await import(fileUrl);
      return agentsModule.builtinAgents || {};
    }
  } catch (error) {
    await frameworkLogger.log(
      "agent-resolver",
      "failed-to-load-registry",
      "warning",
      { error: String(error) },
    );
  }

  return {};
}

/**
 * Loads an individual agent configuration file
 */
async function loadAgentConfigFile(
  agentName: string,
): Promise<AgentConfig | null> {
  // Map agent names to file paths (kebab-case to camelCase for some agents)
  const agentFileMap: Record<string, string> = {
    "bug-triage-specialist": "bugTriageSpecialist",
    "code-reviewer": "codeReviewer",
    "testing-lead": "testArchitect",
    "security-auditor": "securityAuditor",
  };

  const fileName = agentFileMap[agentName] || agentName;
  const agentPath = path.join(
    process.cwd(),
    "dist",
    "agents",
    `${fileName}.js`,
  );
  const fileUrl = `file://${agentPath}`;

  try {
    if (fs.existsSync(agentPath)) {
      // Dynamic import of the agent file (ESM)
      const agentModule = await import(fileUrl);

      // Get the export (could be default or named)
      const camelName = toCamelCase(agentName);
      return agentModule[camelName] || agentModule.default || null;
    }
  } catch (error) {
    await frameworkLogger.log(
      "agent-resolver",
      "failed-to-load-agent-config",
      "warning",
      { agentName, error: String(error) },
    );
  }

  return null;
}

/**
 * Converts a string to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_g, letter) => letter.toUpperCase());
}

/**
 * Gets all available agents from the registry
 */
export async function getAllAgents(): Promise<string[]> {
  const registry = await loadAgentRegistry();
  return Object.keys(registry);
}

/**
 * Checks if an agent exists in the registry
 */
export async function agentExists(agentName: string): Promise<boolean> {
  const registry = await loadAgentRegistry();
  return agentName in registry;
}
