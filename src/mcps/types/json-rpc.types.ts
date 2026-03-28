/**
 * JSON-RPC Types
 * 
 * TypeScript interfaces for JSON-RPC 2.0 protocol messages.
 * Used for MCP server communication.
 */

/**
 * JSON-RPC Request
 * Standard JSON-RPC 2.0 request format
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown;
}

/**
 * JSON-RPC Response
 * Standard JSON-RPC 2.0 response format
 */
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: JsonRpcError;
}

/**
 * JSON-RPC Error
 * Standard JSON-RPC 2.0 error format
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}
