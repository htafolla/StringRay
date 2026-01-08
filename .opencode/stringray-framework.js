#!/usr/bin/env node

/**
 * StrRay Framework Plugin for oh-my-opencode
 *
 * This plugin integrates the StrRay agent orchestration system
 * with oh-my-opencode, providing access to all 8 specialized agents.
 */

import { builtinAgents } from "../dist/agents/index.js";

export function activate(context) {
  console.log("🛡️ StrRay Framework Plugin: Activating...");

  // Register all StrRay agents with oh-my-opencode
  for (const [agentName, agentConfig] of Object.entries(builtinAgents)) {
    console.log(`🤖 Registering StrRay agent: ${agentName}`);

    // Register agent with oh-my-opencode
    context.registerAgent(agentName, {
      name: agentConfig.name,
      description: agentConfig.description,
      model: agentConfig.model,
      temperature: agentConfig.temperature || 0.1,
      system: agentConfig.system,
      tools: agentConfig.tools || [],
      can_use_tools: agentConfig.can_use_tools !== false,
      can_edit_files: agentConfig.can_edit_files !== false,
      max_tokens: agentConfig.max_tokens || 4096,
    });
  }

  console.log("✅ StrRay Framework Plugin: All agents registered");
  console.log(
    `📊 Total agents registered: ${Object.keys(builtinAgents).length}`,
  );

  return {
    deactivate: () => {
      console.log("🛡️ StrRay Framework Plugin: Deactivating...");
      // Cleanup if needed
    },
  };
}

export const manifest = {
  name: "stringray-framework",
  version: "1.0.0",
  description: "StrRay Framework integration for oh-my-opencode",
  author: "StrRay Framework",
  engines: {
    "oh-my-opencode": ">=1.0.0",
  },
  activationEvents: ["onStartup"],
  contributes: {
    agents: Object.keys(builtinAgents),
  },
};
