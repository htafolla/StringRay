/**
 * Tool Executor Tests
 *
 * Comprehensive test suite for the ToolExecutor class.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolExecutor } from '../tool-executor.js';
import { IMcpConnection, MCPToolResult, JsonRpcResponse } from '../../types/index.js';

describe('ToolExecutor', () => {
  let executor: ToolExecutor;
  let mockConnection: any;

  beforeEach(() => {
    executor = new ToolExecutor();
    mockConnection = {
      serverName: 'test-server',
      isConnected: true,
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      sendRequest: vi.fn(),
    };
  });

  describe('executeTool', () => {
    it('should execute tool and return result', async () => {
      const mockResult: MCPToolResult = {
        content: [{ type: 'text', text: 'Success' }],
      };

      mockConnection.sendRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: mockResult,
      });

      const result = await executor.executeTool(mockConnection, 'test-tool', { arg1: 'value1' });

      expect(result).toEqual(mockResult);
    });

    it('should send correct JSON-RPC request', async () => {
      mockConnection.sendRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { content: [] },
      });

      await executor.executeTool(mockConnection, 'my-tool', { foo: 'bar' });

      expect(mockConnection.sendRequest).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        id: expect.any(Number),
        method: 'tools/call',
        params: {
          name: 'my-tool',
          arguments: { foo: 'bar' },
        },
      });
    });

    it('should handle error response', async () => {
      mockConnection.sendRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32600, message: 'Tool not found' },
      });

      const result = await executor.executeTool(mockConnection, 'missing-tool', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Tool not found');
    });
  });

  describe('buildToolCallRequest', () => {
    it('should build request with auto-incrementing ID', () => {
      const request1 = executor.buildToolCallRequest('tool1', {});
      const request2 = executor.buildToolCallRequest('tool2', {});

      expect(request1.id).toBe(1);
      expect(request2.id).toBe(2);
    });

    it('should build request with custom ID', () => {
      const request = executor.buildToolCallRequest('tool1', {}, 42);

      expect(request.id).toBe(42);
    });

    it('should include correct method and params', () => {
      const request = executor.buildToolCallRequest('my-tool', { arg: 'value' });

      expect(request).toEqual({
        jsonrpc: '2.0',
        id: expect.any(Number),
        method: 'tools/call',
        params: {
          name: 'my-tool',
          arguments: { arg: 'value' },
        },
      });
    });
  });

  describe('parseToolResult', () => {
    it('should parse successful response', () => {
      const mockResult: MCPToolResult = {
        content: [{ type: 'text', text: 'Result' }],
      };

      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: mockResult,
      };

      const result = executor.parseToolResult(response);

      expect(result).toEqual(mockResult);
    });

    it('should parse error response', () => {
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32600, message: 'Execution failed' },
      };

      const result = executor.parseToolResult(response);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Execution failed');
    });

    it('should handle undefined result', () => {
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: undefined,
      };

      const result = executor.parseToolResult(response);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('No result returned from tool execution');
    });
  });

  describe('executeTools', () => {
    it('should execute multiple tools in sequence', async () => {
      mockConnection.sendRequest
        .mockResolvedValueOnce({
          jsonrpc: '2.0',
          id: 1,
          result: { content: [{ type: 'text', text: 'Result 1' }] },
        })
        .mockResolvedValueOnce({
          jsonrpc: '2.0',
          id: 2,
          result: { content: [{ type: 'text', text: 'Result 2' }] },
        });

      const results = await executor.executeTools(mockConnection, [
        { toolName: 'tool1', args: {} },
        { toolName: 'tool2', args: {} },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].content[0].text).toBe('Result 1');
      expect(results[1].content[0].text).toBe('Result 2');
    });

    it('should return empty array for empty executions', async () => {
      const results = await executor.executeTools(mockConnection, []);

      expect(results).toEqual([]);
    });
  });

  describe('executeToolsParallel', () => {
    it('should execute multiple tools in parallel', async () => {
      mockConnection.sendRequest
        .mockResolvedValueOnce({
          jsonrpc: '2.0',
          id: 1,
          result: { content: [{ type: 'text', text: 'Result 1' }] },
        })
        .mockResolvedValueOnce({
          jsonrpc: '2.0',
          id: 2,
          result: { content: [{ type: 'text', text: 'Result 2' }] },
        });

      const results = await executor.executeToolsParallel(mockConnection, [
        { toolName: 'tool1', args: {} },
        { toolName: 'tool2', args: {} },
      ]);

      expect(results).toHaveLength(2);
    });
  });

  describe('resetRequestId', () => {
    it('should reset request ID counter', () => {
      executor.buildToolCallRequest('tool1', {});
      executor.buildToolCallRequest('tool2', {});
      executor.resetRequestId();
      const request = executor.buildToolCallRequest('tool3', {});

      expect(request.id).toBe(1);
    });
  });
});
