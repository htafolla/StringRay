/**
 * Tool Discovery
 *
 * Handles dynamic tool discovery from MCP servers via JSON-RPC protocol.
 * Part of Phase 4 refactoring - Tool Layer extraction.
 */

import { MCPTool, IMcpConnection } from '../types/index.js';
import { JsonRpcRequest, JsonRpcResponse } from '../types/index.js';
import { MCP_PROTOCOL_VERSION, JSONRPC_VERSION } from '../protocol/protocol-constants.js';

export class ToolDiscovery {
  /**
   * Discover available tools from an MCP server connection
   */
  async discoverTools(connection: IMcpConnection): Promise<MCPTool[]> {
    const request: JsonRpcRequest = {
      jsonrpc: JSONRPC_VERSION,
      id: 1,
      method: 'tools/list',
    };

    const response = await connection.sendRequest(request);

    if (response.error) {
      throw new Error(`Tool discovery failed: ${response.error.message}`);
    }

    return (response.result as { tools?: MCPTool[] } | undefined)?.tools || [];
  }

  /**
   * Build a tool list request for JSON-RPC
   */
  buildToolListRequest(requestId: number = 1): JsonRpcRequest {
    return {
      jsonrpc: JSONRPC_VERSION,
      id: requestId,
      method: 'tools/list',
    };
  }

  /**
   * Parse tools from a JSON-RPC response
   */
  parseTools(response: JsonRpcResponse): MCPTool[] {
    if (response.error) {
      throw new Error(`Tool discovery failed: ${response.error.message}`);
    }

    return (response.result as { tools?: MCPTool[] } | undefined)?.tools || [];
  }

  /**
   * Validate that discovered tools have required fields
   */
  validateTools(tools: unknown[]): MCPTool[] {
    const validTools: MCPTool[] = [];

    for (const tool of tools) {
      if (this.isValidTool(tool)) {
        validTools.push(tool);
      }
    }

    return validTools;
  }

  private isValidTool(tool: unknown): tool is MCPTool {
    if (typeof tool !== 'object' || tool === null) {
      return false;
    }

    const t = tool as Record<string, unknown>;

    return (
      typeof t.name === 'string' &&
      typeof t.description === 'string' &&
      typeof t.inputSchema === 'object' &&
      t.inputSchema !== null
    );
  }
}
