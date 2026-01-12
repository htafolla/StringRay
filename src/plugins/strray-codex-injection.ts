/**
 * StrRay Plugin for oh-my-opencode
 *
 * Enterprise AI orchestration with systematic error prevention.
 * This plugin provides intelligent agent coordination and codex-based code quality enforcement.
 *
 * @version 1.0.0
 * @author StrRay Framework Team
 */

import * as fs from "fs";
import * as path from "path";

// Import StrRay components
import { StrRayOrchestrator } from "../orchestrator.js";
import { ProcessorManager } from "../processors/processor-manager.js";
import { StrRayStateManager } from "../state/state-manager.js";

/**
 * Plugin configuration interface
 */
interface StrRayPluginConfig {
  enabled: boolean;
  maxConcurrentAgents: number;
  codexEnforcement: boolean;
  mcpAutoRegistration: boolean;
}

/**
 * Default plugin configuration
 */
const DEFAULT_CONFIG: StrRayPluginConfig = {
  enabled: true,
  maxConcurrentAgents: 3,
  codexEnforcement: true,
  mcpAutoRegistration: false, // Disabled due to oh-my-opencode limitation
};

/**
 * StrRay Plugin for oh-my-opencode
 *
 * Integrates enterprise AI orchestration capabilities into oh-my-opencode.
 */
export default async function strrayPlugin(input: {
  client?: string;
  directory?: string;
  worktree?: string;
}) {
  const { directory: projectDir = process.cwd() } = input;

  // Load plugin configuration
  const config = loadPluginConfig(projectDir);

  if (!config.enabled) {
    return {}; // Plugin disabled
  }

  return {
    /**
     * Codex injection hook - adds StrRay codex context to all AI interactions
     */
    "experimental.chat.system.transform": async (
      _input: Record<string, unknown>,
      output: { system?: string[] },
    ) => {
      if (!config.codexEnforcement) return;

      // Inject StrRay codex context
      const codexContext = getStrRayCodexContext();
      if (output.system && Array.isArray(output.system)) {
        output.system.unshift(
          "🤖 StrRay Framework Active - Enterprise AI orchestration enabled",
          "",
          codexContext,
          "",
          "---",
          "",
        );
      }
    },

    /**
     * Tool execution hook - applies StrRay processing pipeline
     */
    "tool.execute.before": async (
      input: {
        tool: string;
        args?: { content?: string; filePath?: string };
      },
      _output: unknown,
    ) => {
      if (!config.codexEnforcement) return;

      const { tool, args } = input;

      // Apply StrRay processing for code modifications
      if (["write", "edit", "multiedit"].includes(tool)) {
        try {
          const stateManager = new StrRayStateManager();
          const processorManager = new ProcessorManager(stateManager);
          await processorManager.executePreProcessors(tool, args || {});
        } catch (error) {
          // Log error but don't block the operation
          console.warn("[StrRay] Pre-processing failed:", error);
        }
      }
    },

    /**
     * Tool execution hook - applies post-processing
     */
    "tool.execute.after": async (
      input: {
        tool: string;
        args?: { content?: string; filePath?: string };
      },
      _output: unknown,
    ) => {
      if (!config.codexEnforcement) return;

      const { tool, args } = input;

      // Apply post-processing for code modifications
      if (["write", "edit", "multiedit"].includes(tool)) {
        try {
          const stateManager = new StrRayStateManager();
          const processorManager = new ProcessorManager(stateManager);
          await processorManager.executePostProcessors(tool, args || {}, []);
        } catch (error) {
          console.warn("[StrRay] Post-processing failed:", error);
        }
      }
    },

    /**
     * Configuration hook - initialize StrRay components
     */
    config: async (_config: Record<string, unknown>) => {
      console.log(
        "🚀 StrRay Plugin: Initializing enterprise AI orchestration...",
      );

      try {
        // Initialize core components
        const orchestrator = new StrRayOrchestrator({
          maxConcurrentTasks: config.maxConcurrentAgents,
        });

        console.log(
          `✅ StrRay Plugin: Initialized with ${config.maxConcurrentAgents} max concurrent agents`,
        );
        console.log(
          "🎯 Codex enforcement:",
          config.codexEnforcement ? "ENABLED" : "DISABLED",
        );
        console.log(
          "🔧 MCP auto-registration:",
          config.mcpAutoRegistration ? "ENABLED" : "DISABLED",
        );

        if (config.mcpAutoRegistration) {
          console.log(
            "⚠️ MCP auto-registration is experimental due to oh-my-opencode limitations",
          );
        }
      } catch (error) {
        console.error("❌ StrRay Plugin initialization failed:", error);
      }
    },
  };
}

/**
 * Load plugin configuration from project
 */
function loadPluginConfig(projectDir: string): StrRayPluginConfig {
  try {
    // Try to load from .strray/config.json
    const configPath = path.join(projectDir, ".strray", "config.json");
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return { ...DEFAULT_CONFIG, ...configData };
    }
  } catch (error) {
    console.warn("[StrRay] Failed to load config, using defaults:", error);
  }

  return DEFAULT_CONFIG;
}

/**
 * Get StrRay codex context for injection
 */
function getStrRayCodexContext(): string {
  return `# StrRay Framework Codex v1.2.20

## Core Principles
- **Progressive Prod-Ready Code**: All code must be production-ready from first commit
- **No Patches/Stubs/Bridge Code**: Complete implementations only
- **Surgical Fixes**: Address root causes, not symptoms
- **99.6% Error Prevention**: Systematic validation and type safety

## Agent Capabilities
- **orchestrator**: Multi-agent task coordination and delegation
- **enforcer**: Codex compliance validation and error prevention
- **architect**: System design and technical decision making
- **test-architect**: Testing strategy and coverage optimization
- **code-reviewer**: Quality assessment and standards validation
- **security-auditor**: Vulnerability detection and compliance
- **refactorer**: Technical debt elimination and code consolidation

## Integration Features
- Complexity-based task routing to appropriate agents
- Real-time codex validation on code changes
- Intelligent agent coordination and conflict resolution
- Performance monitoring and optimization
- Memory management and resource optimization

---
*StrRay Framework: Enterprise AI orchestration for systematic error prevention*
`;
}
