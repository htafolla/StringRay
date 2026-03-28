/**
 * Simulation Engine Tests
 *
 * Comprehensive test suite for the SimulationEngine class.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimulationEngine, SimulatorFunction } from '../simulation-engine.js';
import { MCPToolResult } from '../../types/index.js';

describe('SimulationEngine', () => {
  let engine: SimulationEngine;

  beforeEach(() => {
    engine = new SimulationEngine();
  });

  describe('registerSimulator', () => {
    it('should register a simulator', () => {
      const simulator: SimulatorFunction = () => ({
        content: [{ type: 'text', text: 'Test' }],
      });

      engine.registerSimulator('server1', 'tool1', simulator);

      expect(engine.canSimulate('server1', 'tool1')).toBe(true);
    });

    it('should allow multiple simulators per server', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Tool 1' }],
      }));
      engine.registerSimulator('server1', 'tool2', () => ({
        content: [{ type: 'text', text: 'Tool 2' }],
      }));

      expect(engine.canSimulate('server1', 'tool1')).toBe(true);
      expect(engine.canSimulate('server1', 'tool2')).toBe(true);
    });

    it('should allow same tool name on different servers', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Server 1' }],
      }));
      engine.registerSimulator('server2', 'tool1', () => ({
        content: [{ type: 'text', text: 'Server 2' }],
      }));

      expect(engine.canSimulate('server1', 'tool1')).toBe(true);
      expect(engine.canSimulate('server2', 'tool1')).toBe(true);
    });
  });

  describe('registerServerSimulators', () => {
    it('should register multiple simulators at once', () => {
      const simulators: Record<string, SimulatorFunction> = {
        tool1: () => ({ content: [{ type: 'text', text: 'Tool 1' }] }),
        tool2: () => ({ content: [{ type: 'text', text: 'Tool 2' }] }),
        tool3: () => ({ content: [{ type: 'text', text: 'Tool 3' }] }),
      };

      engine.registerServerSimulators('server1', simulators);

      expect(engine.canSimulate('server1', 'tool1')).toBe(true);
      expect(engine.canSimulate('server1', 'tool2')).toBe(true);
      expect(engine.canSimulate('server1', 'tool3')).toBe(true);
    });
  });

  describe('canSimulate', () => {
    it('should return true for registered simulator', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));

      expect(engine.canSimulate('server1', 'tool1')).toBe(true);
    });

    it('should return false for unregistered tool', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));

      expect(engine.canSimulate('server1', 'tool2')).toBe(false);
    });

    it('should return false for unregistered server', () => {
      expect(engine.canSimulate('nonexistent', 'tool1')).toBe(false);
    });
  });

  describe('simulate', () => {
    it('should execute simulator and return result', async () => {
      const mockResult: MCPToolResult = {
        content: [{ type: 'text', text: 'Simulated Result' }],
      };

      engine.registerSimulator('server1', 'tool1', () => mockResult);

      const result = await engine.simulate('server1', 'tool1', {});

      expect(result).toEqual(mockResult);
    });

    it('should pass args to simulator', async () => {
      const simulator = vi.fn().mockReturnValue({
        content: [{ type: 'text', text: 'Test' }],
      });

      engine.registerSimulator('server1', 'tool1', simulator);
      await engine.simulate('server1', 'tool1', { key: 'value' });

      expect(simulator).toHaveBeenCalledWith({ key: 'value' });
    });

    it('should handle async simulators', async () => {
      const mockResult: MCPToolResult = {
        content: [{ type: 'text', text: 'Async Result' }],
      };

      engine.registerSimulator('server1', 'tool1', async () => mockResult);

      const result = await engine.simulate('server1', 'tool1', {});

      expect(result).toEqual(mockResult);
    });

    it('should throw error for unregistered simulator', async () => {
      await expect(engine.simulate('server1', 'tool1', {})).rejects.toThrow(
        'No simulator registered for server1/tool1'
      );
    });
  });

  describe('getServerTools', () => {
    it('should return all tool names for a server', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));
      engine.registerSimulator('server1', 'tool2', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));

      const tools = engine.getServerTools('server1');

      expect(tools).toContain('tool1');
      expect(tools).toContain('tool2');
      expect(tools).toHaveLength(2);
    });

    it('should return empty array for unregistered server', () => {
      expect(engine.getServerTools('nonexistent')).toEqual([]);
    });
  });

  describe('getRegisteredServers', () => {
    it('should return all registered server names', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));
      engine.registerSimulator('server2', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));

      const servers = engine.getRegisteredServers();

      expect(servers).toContain('server1');
      expect(servers).toContain('server2');
      expect(servers).toHaveLength(2);
    });

    it('should return empty array when no servers registered', () => {
      expect(engine.getRegisteredServers()).toEqual([]);
    });
  });

  describe('unregisterSimulator', () => {
    it('should remove specific simulator', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));

      const result = engine.unregisterSimulator('server1', 'tool1');

      expect(result).toBe(true);
      expect(engine.canSimulate('server1', 'tool1')).toBe(false);
    });

    it('should return false for non-existent tool', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));

      const result = engine.unregisterSimulator('server1', 'tool2');

      expect(result).toBe(false);
    });

    it('should return false for non-existent server', () => {
      const result = engine.unregisterSimulator('nonexistent', 'tool1');

      expect(result).toBe(false);
    });

    it('should clean up empty server entries', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));

      engine.unregisterSimulator('server1', 'tool1');

      expect(engine.getRegisteredServers()).toEqual([]);
    });
  });

  describe('unregisterServer', () => {
    it('should remove all simulators for a server', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));
      engine.registerSimulator('server1', 'tool2', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));

      const result = engine.unregisterServer('server1');

      expect(result).toBe(true);
      expect(engine.canSimulate('server1', 'tool1')).toBe(false);
      expect(engine.canSimulate('server1', 'tool2')).toBe(false);
    });

    it('should return false for non-existent server', () => {
      const result = engine.unregisterServer('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all simulators', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));
      engine.registerSimulator('server2', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));

      engine.clear();

      expect(engine.getRegisteredServers()).toEqual([]);
      expect(engine.canSimulate('server1', 'tool1')).toBe(false);
      expect(engine.canSimulate('server2', 'tool1')).toBe(false);
    });
  });

  describe('getSimulatorCount', () => {
    it('should return total count of simulators', () => {
      engine.registerSimulator('server1', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));
      engine.registerSimulator('server1', 'tool2', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));
      engine.registerSimulator('server2', 'tool1', () => ({
        content: [{ type: 'text', text: 'Test' }],
      }));

      expect(engine.getSimulatorCount()).toBe(3);
    });

    it('should return 0 when no simulators registered', () => {
      expect(engine.getSimulatorCount()).toBe(0);
    });
  });
});
