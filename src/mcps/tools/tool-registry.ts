/**
 * Tool Registry
 *
 * Manages tool registration and lookup across MCP servers.
 * Part of Phase 4 refactoring - Tool Layer extraction.
 */

import { MCPTool, IToolRegistry } from '../types/index.js';

export class ToolRegistry implements IToolRegistry {
  private tools: Map<string, Map<string, MCPTool>> = new Map();

  /**
   * Register tools for a specific server
   */
  register(serverName: string, tools: MCPTool[]): void {
    if (!this.tools.has(serverName)) {
      this.tools.set(serverName, new Map());
    }
    const serverTools = this.tools.get(serverName)!;
    for (const tool of tools) {
      serverTools.set(tool.name, tool);
    }
  }

  /**
   * Get a specific tool by server and tool name
   */
  getTool(serverName: string, toolName: string): MCPTool | undefined {
    return this.tools.get(serverName)?.get(toolName);
  }

  /**
   * Get all tools for a specific server
   */
  getTools(serverName: string): MCPTool[] {
    return Array.from(this.tools.get(serverName)?.values() || []);
  }

  /**
   * Check if a tool exists
   */
  hasTool(serverName: string, toolName: string): boolean {
    return this.tools.get(serverName)?.has(toolName) || false;
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Get all registered server names
   */
  getServerNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Remove all tools for a specific server
   */
  unregisterServer(serverName: string): boolean {
    return this.tools.delete(serverName);
  }

  /**
   * Get total tool count across all servers
   */
  getToolCount(): number {
    let count = 0;
    for (const serverTools of this.tools.values()) {
      count += serverTools.size;
    }
    return count;
  }
}
