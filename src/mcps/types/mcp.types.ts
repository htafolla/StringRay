/**
 * MCP Types
 * 
 * Core TypeScript interfaces and types for the MCP Client system.
 * Extracted from mcp-client.ts as part of Phase 1 refactoring.
 */

import type { JsonRpcRequest, JsonRpcResponse } from './json-rpc.types.js';

/**
 * MCP Client Configuration
 * Defines the configuration for connecting to an MCP server
 */
export interface MCPClientConfig {
  serverName: string;
  command: string;
  args: string[];
  timeout?: number;
  env?: Record<string, string>;
  basePath?: string;
}

/**
 * MCP Tool Definition
 * Represents a tool available on an MCP server
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP Tool Result
 * Represents the result of calling an MCP tool
 */
export interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: unknown;
  }>;
  isError?: boolean;
}

/**
 * MCP Connection Interface
 * Defines the contract for MCP server connections
 */
export interface IMcpConnection {
  readonly serverName: string;
  readonly isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendRequest(request: JsonRpcRequest): Promise<JsonRpcResponse>;
}

/**
 * Server Configuration Interface
 * Abstraction over raw MCPClientConfig for dependency injection
 */
export interface IServerConfig {
  serverName: string;
  command: string;
  args: string[];
  timeout: number;
  env?: Record<string, string>;
  basePath?: string;
}

/**
 * Tool Registry Interface
 * Manages tool registration and lookup across servers
 */
export interface IToolRegistry {
  register(serverName: string, tools: MCPTool[]): void;
  getTools(serverName: string): MCPTool[];
  getTool(serverName: string, toolName: string): MCPTool | undefined;
  hasTool(serverName: string, toolName: string): boolean;
  clear(): void;
}

/**
 * Protocol Handler Interface
 * Handles JSON-RPC protocol building and parsing
 */
export interface IProtocolHandler {
  buildInitializeRequest(): JsonRpcRequest;
  buildToolListRequest(): JsonRpcRequest;
  buildToolCallRequest(toolName: string, args: unknown): JsonRpcRequest;
  parseResponse(data: string): JsonRpcResponse;
}

/**
 * Simulation Engine Interface
 * Provides fallback simulation for MCP tools
 */
export interface ISimulationEngine {
  canSimulate(serverName: string, toolName: string): boolean;
  simulate(serverName: string, toolName: string, args: unknown): Promise<MCPToolResult>;
}

/**
 * Connection Pool Interface
 * Manages MCP connection lifecycle and reuse
 */
export interface IConnectionPool {
  acquire(serverName: string): Promise<IMcpConnection>;
  release(connection: IMcpConnection): void;
  clear(): Promise<void>;
}
