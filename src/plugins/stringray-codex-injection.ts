/**
 * StringRay Plugin for oh-my-opencode
 *
 * Enterprise AI orchestration with systematic error prevention.
 * This plugin provides intelligent agent coordination and codex-based code quality enforcement.
 *
 * @version 1.0.0
 * @author StringRay Framework Team
 */

import * as fs from "fs";
import * as path from "path";

// Import StringRay components
import { StringRayOrchestrator } from "../orchestrator.js";
import { ProcessorManager } from "../processors/processor-manager.js";
import { StringRayStateManager } from "../state/state-manager.js";

/**
 * Plugin configuration interface
 */
interface StringRayPluginConfig {
  enabled: boolean;
  maxConcurrentAgents: number;
  codexEnforcement: boolean;
  mcpAutoRegistration: boolean;
}

/**
 * Default plugin configuration
 */
const DEFAULT_CONFIG: StringRayPluginConfig = {
  enabled: true,
  maxConcurrentAgents: 3,
  codexEnforcement: true,
  mcpAutoRegistration: false, // Disabled due to oh-my-opencode limitation
};

/**
 * StringRay Plugin for oh-my-opencode
 *
 * Integrates enterprise AI orchestration capabilities into oh-my-opencode.
 */
export default async function stringrayPlugin(input: {
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
     * Codex injection hook - adds StringRay codex context to all AI interactions
     */
    "experimental.chat.system.transform": async (
      _input: Record<string, unknown>,
      output: { system?: string[] },
    ) => {
      if (!config.codexEnforcement) return;

      // Display ASCII art on first chat interaction
      if (!(globalThis as any).strrayAsciiShown) {
        (globalThis as any).strrayAsciiShown = true;
        console.log("🎨 Displaying StringRay ASCII art...");
        try {
          const { execSync } = await import("child_process");
          const path = await import("path");

          const initScript = path.join(projectDir, ".opencode", "init.sh");
          const { existsSync } = await import("fs");

          if (existsSync(initScript)) {
            execSync(`bash "${initScript}"`, {
              cwd: projectDir,
              stdio: "inherit",
            });
          }
        } catch (error) {
          console.log(
            "🤖 StringRay Framework Active - Enterprise AI orchestration enabled",
          );
        }
      }

      // Inject StringRay codex context
      const codexContext = `# StringRay Framework Codex v1.2.25

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
*StringRay Framework: Enterprise AI orchestration for systematic error prevention*
`;
      if (output.system && Array.isArray(output.system)) {
        output.system.unshift(codexContext, "", "---", "");
      }
    },

    /**
     * Tool execution hook - applies StringRay processing pipeline
     */
    "tool.execute.before": async (
      input: {
        tool: string;
        args?: { content?: string; filePath?: string };
      },
      _output: unknown,
    ) => {
      if (!config.codexEnforcement) return;

      // Display ASCII art on first tool execution
      if (!(globalThis as any).strrayAsciiShown) {
        (globalThis as any).strrayAsciiShown = true;
        console.log("🎨 Displaying StringRay ASCII art...");
        try {
          const { execSync } = await import("child_process");
          const path = await import("path");

          const initScript = path.join(projectDir, ".opencode", "init.sh");
          const { existsSync } = await import("fs");

          if (existsSync(initScript)) {
            execSync(`bash "${initScript}"`, {
              cwd: projectDir,
              stdio: "inherit",
            });
          }
        } catch (error) {
          console.log(
            "🤖 StringRay Framework Active - Enterprise AI orchestration enabled",
          );
        }
      }

      const { tool, args } = input;

      // Apply StringRay processing for code modifications
      if (["write", "edit", "multiedit"].includes(tool)) {
        try {
          const stateManager = new StringRayStateManager();
          const processorManager = new ProcessorManager(stateManager);
          await processorManager.executePreProcessors(tool, args || {});
        } catch (error) {
          // Log error but don't block the operation
          console.warn("[StringRay] Pre-processing failed:", error);
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
          const stateManager = new StringRayStateManager();
          const processorManager = new ProcessorManager(stateManager);
          await processorManager.executePostProcessors(tool, args || {}, []);
        } catch (error) {
          console.warn("[StringRay] Post-processing failed:", error);
        }
      }
    },

    /**
     * Configuration hook - initialize StringRay components
     */
    config: async (_config: Record<string, unknown>) => {
      console.log(
        "🤖 StringRay Framework Active - Enterprise AI orchestration enabled",
      );

      // Display ASCII art banner immediately
      console.log("🎨 Running ASCII art script...");
      try {
        const { execSync } = await import("child_process");
        const path = await import("path");

        const initScript = path.join(projectDir, ".opencode", "init.sh");
        const { existsSync } = await import("fs");

        console.log(`📁 Checking script at: ${initScript}`);
        if (existsSync(initScript)) {
          console.log("✅ Script exists, executing...");
          const result = execSync(`bash "${initScript}"`, {
            cwd: projectDir,
            encoding: "utf8",
          });
          console.log("📄 Script output:", result.substring(0, 100));
        } else {
          console.log("❌ Script not found");
        }
      } catch (error) {
        console.log("❌ ASCII art execution failed:", error);
      }

      console.log(
        "🚀 StringRay Plugin: Initializing enterprise AI orchestration...",
      );

      try {
        // Initialize core components
        const orchestrator = new StringRayOrchestrator({
          maxConcurrentTasks: config.maxConcurrentAgents,
        });

        console.log(
          `✅ StringRay Plugin: Initialized with ${config.maxConcurrentAgents} max concurrent agents`,
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
        console.error("❌ StringRay Plugin initialization failed:", error);
      }
    },
  };
}

/**
 * Load plugin configuration from project
 */
function loadPluginConfig(projectDir: string): StringRayPluginConfig {
  try {
    // Try to load from .strray/config.json
    const configPath = path.join(projectDir, ".strray", "config.json");
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return { ...DEFAULT_CONFIG, ...configData };
    }
  } catch (error) {
    console.warn("[StringRay] Failed to load config, using defaults:", error);
  }

  return DEFAULT_CONFIG;
}
