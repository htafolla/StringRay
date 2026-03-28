/**
 * Tool Discovery Tests
 *
 * Comprehensive test suite for the ToolDiscovery class.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolDiscovery } from '../tool-discovery.js';
import { MCPTool, IMcpConnection, JsonRpcResponse } from '../../types/index.js';

describe('ToolDiscovery', () => {
  let discovery: ToolDiscovery;
  let mockConnection: any;

  beforeEach(() => {
    discovery = new ToolDiscovery();
    mockConnection = {
      serverName: 'test-server',
      isConnected: true,
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      sendRequest: vi.fn() as any,
    } as any;
  });

  describe('discoverTools', () => {
    it('should discover tools from server', async () => {
      const mockTools: MCPTool[] = [
        { name: 'tool1', description: 'Test tool 1', inputSchema: { type: 'object' } },
      ];

      mockConnection.sendRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { tools: mockTools },
      });

      const tools = await discovery.discoverTools(mockConnection);

      expect(tools).toEqual(mockTools);
      expect(mockConnection.sendRequest).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      });
    });

    it('should return empty array when no tools found', async () => {
      mockConnection.sendRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { tools: [] },
      });

      const tools = await discovery.discoverTools(mockConnection);

      expect(tools).toEqual([]);
    });

    it('should throw error when response contains error', async () => {
      mockConnection.sendRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32600, message: 'Invalid request' },
      });

      await expect(discovery.discoverTools(mockConnection)).rejects.toThrow(
        'Tool discovery failed: Invalid request'
      );
    });

    it('should return empty array when result is undefined', async () => {
      mockConnection.sendRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: undefined,
      });

      const tools = await discovery.discoverTools(mockConnection);

      expect(tools).toEqual([]);
    });
  });

  describe('buildToolListRequest', () => {
    it('should build request with default ID', () => {
      const request = discovery.buildToolListRequest();

      expect(request).toEqual({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      });
    });

    it('should build request with custom ID', () => {
      const request = discovery.buildToolListRequest(42);

      expect(request).toEqual({
        jsonrpc: '2.0',
        id: 42,
        method: 'tools/list',
      });
    });
  });

  describe('parseTools', () => {
    it('should parse tools from response', () => {
      const mockTools: MCPTool[] = [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
      ];

      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: { tools: mockTools },
      };

      const tools = discovery.parseTools(response);

      expect(tools).toEqual(mockTools);
    });

    it('should throw error when response has error', () => {
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32600, message: 'Parse error' },
      };

      expect(() => discovery.parseTools(response)).toThrow('Tool discovery failed: Parse error');
    });

    it('should return empty array when result has no tools', () => {
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {},
      };

      const tools = discovery.parseTools(response);

      expect(tools).toEqual([]);
    });
  });

  describe('validateTools', () => {
    it('should validate and return valid tools', () => {
      const input = [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
        { name: 'tool2', description: 'Test 2', inputSchema: { type: 'string' } },
      ];

      const tools = discovery.validateTools(input);

      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('tool1');
    });

    it('should filter out invalid tools', () => {
      const input = [
        { name: 'valid', description: 'Test', inputSchema: { type: 'object' } },
        { name: 'invalid', description: 'Missing schema' },
        null,
        'not an object',
        { description: 'Missing name', inputSchema: {} },
      ];

      const tools = discovery.validateTools(input);

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('valid');
    });

    it('should return empty array for empty input', () => {
      const tools = discovery.validateTools([]);

      expect(tools).toEqual([]);
    });

    it('should handle tool with null inputSchema', () => {
      const input = [{ name: 'tool', description: 'Test', inputSchema: null }];

      const tools = discovery.validateTools(input);

      expect(tools).toHaveLength(0);
    });
  });
});
