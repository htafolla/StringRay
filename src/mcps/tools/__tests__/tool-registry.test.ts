/**
 * Tool Registry Tests
 *
 * Comprehensive test suite for the ToolRegistry class.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../tool-registry.js';
import { MCPTool } from '../../types/index.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  describe('register', () => {
    it('should register tools for a server', () => {
      const tools: MCPTool[] = [
        {
          name: 'tool1',
          description: 'Test tool 1',
          inputSchema: { type: 'object' },
        },
      ];

      registry.register('server1', tools);

      expect(registry.getTools('server1')).toHaveLength(1);
      expect(registry.getTool('server1', 'tool1')).toBeDefined();
    });

    it('should register multiple tools for a server', () => {
      const tools: MCPTool[] = [
        {
          name: 'tool1',
          description: 'Test tool 1',
          inputSchema: { type: 'object' },
        },
        {
          name: 'tool2',
          description: 'Test tool 2',
          inputSchema: { type: 'object' },
        },
      ];

      registry.register('server1', tools);

      expect(registry.getTools('server1')).toHaveLength(2);
    });

    it('should append tools when registering multiple times', () => {
      registry.register('server1', [
        { name: 'tool1', description: 'Test 1', inputSchema: { type: 'object' } },
      ]);
      registry.register('server1', [
        { name: 'tool2', description: 'Test 2', inputSchema: { type: 'object' } },
      ]);

      expect(registry.getTools('server1')).toHaveLength(2);
    });

    it('should overwrite existing tool with same name', () => {
      registry.register('server1', [
        { name: 'tool1', description: 'Original', inputSchema: { type: 'object' } },
      ]);
      registry.register('server1', [
        { name: 'tool1', description: 'Updated', inputSchema: { type: 'object' } },
      ]);

      expect(registry.getTool('server1', 'tool1')?.description).toBe('Updated');
    });
  });

  describe('getTool', () => {
    it('should return tool by name', () => {
      const tool: MCPTool = {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: {} },
      };

      registry.register('server1', [tool]);

      expect(registry.getTool('server1', 'test-tool')).toEqual(tool);
    });

    it('should return undefined for non-existent tool', () => {
      expect(registry.getTool('server1', 'non-existent')).toBeUndefined();
    });

    it('should return undefined for non-existent server', () => {
      expect(registry.getTool('non-existent', 'tool1')).toBeUndefined();
    });
  });

  describe('getTools', () => {
    it('should return all tools for a server', () => {
      const tools: MCPTool[] = [
        { name: 'tool1', description: 'Test 1', inputSchema: { type: 'object' } },
        { name: 'tool2', description: 'Test 2', inputSchema: { type: 'object' } },
      ];

      registry.register('server1', tools);

      expect(registry.getTools('server1')).toEqual(tools);
    });

    it('should return empty array for non-existent server', () => {
      expect(registry.getTools('non-existent')).toEqual([]);
    });

    it('should return empty array when server has no tools', () => {
      registry.register('server1', []);
      expect(registry.getTools('server1')).toEqual([]);
    });
  });

  describe('hasTool', () => {
    it('should return true for existing tool', () => {
      registry.register('server1', [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
      ]);

      expect(registry.hasTool('server1', 'tool1')).toBe(true);
    });

    it('should return false for non-existent tool', () => {
      registry.register('server1', [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
      ]);

      expect(registry.hasTool('server1', 'tool2')).toBe(false);
    });

    it('should return false for non-existent server', () => {
      expect(registry.hasTool('non-existent', 'tool1')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all registered tools', () => {
      registry.register('server1', [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
      ]);
      registry.register('server2', [
        { name: 'tool2', description: 'Test', inputSchema: { type: 'object' } },
      ]);

      registry.clear();

      expect(registry.getTools('server1')).toHaveLength(0);
      expect(registry.getTools('server2')).toHaveLength(0);
      expect(registry.getServerNames()).toHaveLength(0);
    });
  });

  describe('getServerNames', () => {
    it('should return all registered server names', () => {
      registry.register('server1', [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
      ]);
      registry.register('server2', [
        { name: 'tool2', description: 'Test', inputSchema: { type: 'object' } },
      ]);

      const names = registry.getServerNames();

      expect(names).toContain('server1');
      expect(names).toContain('server2');
      expect(names).toHaveLength(2);
    });

    it('should return empty array when no servers registered', () => {
      expect(registry.getServerNames()).toEqual([]);
    });
  });

  describe('unregisterServer', () => {
    it('should remove all tools for a server', () => {
      registry.register('server1', [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
      ]);

      const result = registry.unregisterServer('server1');

      expect(result).toBe(true);
      expect(registry.getTools('server1')).toHaveLength(0);
    });

    it('should return false for non-existent server', () => {
      const result = registry.unregisterServer('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getToolCount', () => {
    it('should return total count of all tools', () => {
      registry.register('server1', [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
        { name: 'tool2', description: 'Test', inputSchema: { type: 'object' } },
      ]);
      registry.register('server2', [
        { name: 'tool3', description: 'Test', inputSchema: { type: 'object' } },
      ]);

      expect(registry.getToolCount()).toBe(3);
    });

    it('should return 0 when no tools registered', () => {
      expect(registry.getToolCount()).toBe(0);
    });
  });

  describe('multiple servers', () => {
    it('should keep tools separate per server', () => {
      registry.register('server1', [
        { name: 'shared-tool', description: 'Server 1 version', inputSchema: { type: 'object' } },
      ]);
      registry.register('server2', [
        { name: 'shared-tool', description: 'Server 2 version', inputSchema: { type: 'object' } },
      ]);

      expect(registry.getTool('server1', 'shared-tool')?.description).toBe('Server 1 version');
      expect(registry.getTool('server2', 'shared-tool')?.description).toBe('Server 2 version');
    });
  });
});
