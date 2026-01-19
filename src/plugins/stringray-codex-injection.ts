/**
 * StringRay Plugin for oh-my-opencode
 *
 * Enterprise AI orchestration with systematic error prevention.
 * This plugin provides intelligent agent coordination and codex-based code quality enforcement.
 *
 * @version 1.0.0
 * @author StringRay Framework Team
 */

import * as path from "path";
import * as fs from "fs";

const pluginHooks = {
  config: (input: { client?: string; directory?: string; worktree?: string }) => {
    console.log("🔧 StringRay plugin initialized");
  },

  "experimental.chat.system.transform": (messages: any[], context: any) => {
    console.log("🔄 StringRay: chat.system.transform hook called", { messageCount: messages?.length });
    return messages;
  },

  "tool.execute.before": (tool: string, args: any) => {
    console.log("⚡ StringRay: tool.execute.before hook called", { tool, args });
  },

  "tool.execute.after": (tool: string, args: any, result: any) => {
    console.log("✅ StringRay: tool.execute.after hook called", { tool, result: typeof result });
  },

  "mcp.servers": () => {
    console.log("🔧 StringRay: mcp.servers hook called");
    const servers = getMCPServers();
    console.log("🔧 StringRay: returning", Object.keys(servers).length, "MCP servers");
    return servers;
  }
};

function getMCPServers() {
  try {
    // Find MCP servers by locating the strray-ai package
    let currentDir = path.dirname(new URL(import.meta.url).pathname);

    // Walk up directory tree to find strray-ai package
    let mcpsDir = null;
    for (let i = 0; i < 15 && currentDir !== path.dirname(currentDir); i++) {
      // Check for node_modules/strray-ai in current directory
      const nodeModulesCandidate = path.join(currentDir, "node_modules/strray-ai/dist/plugin/mcps");
      if (fs.existsSync(nodeModulesCandidate)) {
        mcpsDir = nodeModulesCandidate;
        break;
      }

      // Check if we're in strray-ai source (for development)
      const sourceCandidate = path.join(currentDir, "src/mcps");
      if (fs.existsSync(sourceCandidate)) {
        // In development, look for compiled version first, then source
        const devCompiled = path.join(currentDir, "dist/plugin/mcps");
        if (fs.existsSync(devCompiled)) {
          mcpsDir = devCompiled;
        } else {
          mcpsDir = sourceCandidate;
        }
        break;
      }
      currentDir = path.dirname(currentDir);
    }

    if (!mcpsDir) {
      console.warn("Could not locate MCP servers directory");
      return {};
    }

    if (!fs.existsSync(mcpsDir)) {
      console.warn("MCP servers directory not found:", mcpsDir);
      return {};
    }

    const serverFiles = fs.readdirSync(mcpsDir).filter(file =>
      file.endsWith('.server.js') || file.endsWith('.server.ts')
    );

    const servers: Record<string, any> = {};

    for (const serverFile of serverFiles) {
      const serverName = serverFile.replace('.server.js', '').replace('.server.ts', '');
      const serverPath = path.join(mcpsDir, serverFile);

      servers[serverName] = {
        command: "node",
        args: [serverPath],
        enabled: true
      };
    }

    return servers;
  } catch (error) {
    console.error("Error loading MCP servers:", error);
    return {};
  }
}

// Export a function that returns the plugin hooks object
export function stringrayPlugin(input: any) {
    return pluginHooks;
}

// Default export for compatibility
export default stringrayPlugin;
