/**
 * Simulation Engine
 *
 * Provides fallback simulation for MCP tools when real servers are unavailable.
 * Part of Phase 5 refactoring - Simulation Layer extraction.
 */

import { MCPToolResult, ISimulationEngine } from '../types/index.js';

export type SimulatorFunction = (args: unknown) => MCPToolResult | Promise<MCPToolResult>;

export class SimulationEngine implements ISimulationEngine {
  private simulators: Map<string, Map<string, SimulatorFunction>> = new Map();

  /**
   * Register a simulator for a specific server and tool
   */
  registerSimulator(
    serverName: string,
    toolName: string,
    simulator: SimulatorFunction
  ): void {
    if (!this.simulators.has(serverName)) {
      this.simulators.set(serverName, new Map());
    }
    this.simulators.get(serverName)!.set(toolName, simulator);
  }

  /**
   * Register multiple simulators for a server
   */
  registerServerSimulators(
    serverName: string,
    simulators: Record<string, SimulatorFunction>
  ): void {
    for (const [toolName, simulator] of Object.entries(simulators)) {
      this.registerSimulator(serverName, toolName, simulator);
    }
  }

  /**
   * Check if a simulator exists for a server/tool combination
   */
  canSimulate(serverName: string, toolName: string): boolean {
    return this.simulators.get(serverName)?.has(toolName) || false;
  }

  /**
   * Execute a simulation
   */
  async simulate(
    serverName: string,
    toolName: string,
    args: unknown
  ): Promise<MCPToolResult> {
    const simulator = this.simulators.get(serverName)?.get(toolName);
    if (!simulator) {
      throw new Error(`No simulator registered for ${serverName}/${toolName}`);
    }

    const result = simulator(args);
    return Promise.resolve(result);
  }

  /**
   * Get all registered simulator names for a server
   */
  getServerTools(serverName: string): string[] {
    const serverSimulators = this.simulators.get(serverName);
    if (!serverSimulators) {
      return [];
    }
    return Array.from(serverSimulators.keys());
  }

  /**
   * Get all registered server names
   */
  getRegisteredServers(): string[] {
    return Array.from(this.simulators.keys());
  }

  /**
   * Unregister a specific simulator
   */
  unregisterSimulator(serverName: string, toolName: string): boolean {
    const serverSimulators = this.simulators.get(serverName);
    if (!serverSimulators) {
      return false;
    }

    const result = serverSimulators.delete(toolName);

    // Clean up empty server entries
    if (serverSimulators.size === 0) {
      this.simulators.delete(serverName);
    }

    return result;
  }

  /**
   * Unregister all simulators for a server
   */
  unregisterServer(serverName: string): boolean {
    return this.simulators.delete(serverName);
  }

  /**
   * Clear all registered simulators
   */
  clear(): void {
    this.simulators.clear();
  }

  /**
   * Get total count of registered simulators
   */
  getSimulatorCount(): number {
    let count = 0;
    for (const serverSimulators of this.simulators.values()) {
      count += serverSimulators.size;
    }
    return count;
  }
}
