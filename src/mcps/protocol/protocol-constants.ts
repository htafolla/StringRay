/**
 * Protocol Constants
 * 
 * MCP protocol constants and configuration values.
 * Extracted to enable reuse and single source of truth.
 */

/**
 * MCP Protocol Version
 * Current MCP protocol specification version
 */
export const MCP_PROTOCOL_VERSION = '2024-11-05';

/**
 * JSON-RPC Protocol Version
 * Standard JSON-RPC version used by MCP
 */
export const JSONRPC_VERSION = '2.0';

/**
 * MCP Method Names
 * Standard MCP protocol method identifiers
 */
export const MCP_METHODS = {
  INITIALIZE: 'initialize',
  TOOLS_LIST: 'tools/list',
  TOOLS_CALL: 'tools/call',
} as const;

/**
 * Default Timeout Values
 * Millisecond timeouts for various MCP operations
 */
export const DEFAULT_TIMEOUTS = {
  CONNECTION: 30000,
  REQUEST: 60000,
  INITIALIZATION: 10000,
} as const;

/**
 * Error Codes
 * Standard JSON-RPC error codes used by MCP
 */
export const ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000,
} as const;
