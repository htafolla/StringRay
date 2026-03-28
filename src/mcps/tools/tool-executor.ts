/**
 * Tool Executor
 *
 * Handles tool execution via JSON-RPC protocol.
 * Part of Phase 4 refactoring - Tool Layer extraction.
 */

import { MCPToolResult, IMcpConnection } from '../types/index.js';
import { JsonRpcRequest, JsonRpcResponse } from '../types/index.js';
import { JSONRPC_VERSION } from '../protocol/protocol-constants.js';

export class ToolExecutor {
  private requestId = 0;

  /**
   * Execute a tool on an MCP server
   */
  async executeTool(
    connection: IMcpConnection,
    toolName: string,
    args: unknown
  ): Promise<MCPToolResult> {
    const request = this.buildToolCallRequest(toolName, args);
    const response = await connection.sendRequest(request);

    return this.parseToolResult(response);
  }

  /**
   * Build a tool call request for JSON-RPC
   */
  buildToolCallRequest(toolName: string, args: unknown, requestId?: number): JsonRpcRequest {
    this.requestId = requestId ?? this.requestId + 1;

    return {
      jsonrpc: JSONRPC_VERSION,
      id: this.requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };
  }

  /**
   * Parse a tool result from JSON-RPC response
   */
  parseToolResult(response: JsonRpcResponse): MCPToolResult {
    if (response.error) {
      return {
        content: [{ type: 'text', text: response.error.message }],
        isError: true,
      };
    }

    const result = response.result as MCPToolResult | undefined;

    if (!result) {
      return {
        content: [{ type: 'text', text: 'No result returned from tool execution' }],
        isError: true,
      };
    }

    return result;
  }

  /**
   * Execute multiple tools in sequence
   */
  async executeTools(
    connection: IMcpConnection,
    executions: Array<{ toolName: string; args: unknown }>
  ): Promise<MCPToolResult[]> {
    const results: MCPToolResult[] = [];

    for (const execution of executions) {
      const result = await this.executeTool(connection, execution.toolName, execution.args);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeToolsParallel(
    connection: IMcpConnection,
    executions: Array<{ toolName: string; args: unknown }>
  ): Promise<MCPToolResult[]> {
    return Promise.all(
      executions.map((execution) =>
        this.executeTool(connection, execution.toolName, execution.args)
      )
    );
  }

  /**
   * Reset the request ID counter
   */
  resetRequestId(): void {
    this.requestId = 0;
  }
}
