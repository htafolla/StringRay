/**
 * Connection Layer Barrel Export
 *
 * Centralized export for all MCP connection-related classes.
 * Import from this file to access all connection functionality.
 *
 * @example
 * ```typescript
 * import { ConnectionManager, ConnectionPool, McpConnection } from './connection/index.js';
 * ```
 */

export { ProcessSpawner, type SpawnResult } from './process-spawner.js';
export { McpConnection } from './mcp-connection.js';
export { ConnectionManager } from './connection-manager.js';
export { ConnectionPool } from './connection-pool.js';
