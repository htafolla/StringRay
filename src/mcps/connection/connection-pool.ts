import { IMcpConnection, IServerConfig } from '../types/index.js';
import { McpConnection } from './mcp-connection.js';
import { frameworkLogger } from '../../core/framework-logger.js';

/**
 * Pooled Connection
 * Internal representation of a pooled connection
 */
interface PooledConnection {
  connection: IMcpConnection;
  inUse: boolean;
  lastUsed: Date;
  createdAt: Date;
}

/**
 * Connection Pool Interface
 * Defines the contract for connection pool implementations
 */
export interface IConnectionPoolExtended {
  acquire(serverName: string, config: IServerConfig): Promise<IMcpConnection>;
  release(connection: IMcpConnection): void;
  clear(): Promise<void>;
}

/**
 * Connection Pool
 * Manages a pool of reusable MCP connections per server
 */
export class ConnectionPool implements IConnectionPoolExtended {
  private pools: Map<string, PooledConnection[]> = new Map();
  private maxPoolSize: number;
  private maxIdleTimeMs: number;

  constructor(options: { maxPoolSize?: number; maxIdleTimeMs?: number } = {}) {
    this.maxPoolSize = options.maxPoolSize || 5;
    this.maxIdleTimeMs = options.maxIdleTimeMs || 300000; // 5 minutes default
  }

  /**
   * Acquire a connection from the pool or create a new one
   * @param serverName - Name of the server
   * @param config - Server configuration (used when creating new connections)
   * @returns Promise resolving to an MCP connection
   */
  async acquire(serverName: string, config: IServerConfig): Promise<IMcpConnection> {
    let pool = this.pools.get(serverName);
    if (!pool) {
      pool = [];
      this.pools.set(serverName, pool);
    }

    // Clean up stale connections first
    this.cleanupStaleConnections(pool);

    // Find available connection
    const availableIndex = pool.findIndex((p) => !p.inUse && p.connection.isConnected);
    if (availableIndex !== -1) {
      const pooled = pool[availableIndex];
      if (pooled) {
        pooled.inUse = true;
        pooled.lastUsed = new Date();
        return pooled.connection;
      }
    }

    // Create new connection if under limit
    if (pool.length < this.maxPoolSize) {
      const connection = new McpConnection(config);
      await connection.connect();
      const pooled: PooledConnection = {
        connection,
        inUse: true,
        lastUsed: new Date(),
        createdAt: new Date(),
      };
      pool.push(pooled);
      return connection;
    }

    throw new Error(
      `Connection pool exhausted for ${serverName}. Max size: ${this.maxPoolSize}`
    );
  }

  /**
   * Release a connection back to the pool
   * @param connection - The connection to release
   */
  release(connection: IMcpConnection): void {
    for (const pool of this.pools.values()) {
      const pooled = pool.find((p) => p.connection === connection);
      if (pooled) {
        pooled.inUse = false;
        pooled.lastUsed = new Date();
        return;
      }
    }
  }

  /**
   * Clear all connections in the pool
   */
  async clear(): Promise<void> {
    const disconnectPromises: Promise<void>[] = [];
    for (const pool of this.pools.values()) {
      for (const pooled of pool) {
        disconnectPromises.push(
          pooled.connection.disconnect().catch((error) => {
            frameworkLogger.log("connection-pool", "disconnect-error", "error", { error });
          })
        );
      }
    }
    await Promise.all(disconnectPromises);
    this.pools.clear();
  }

  /**
   * Get pool statistics
   * @returns Object with pool statistics
   */
  getStats(): {
    totalServers: number;
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
  } {
    let totalConnections = 0;
    let activeConnections = 0;
    let idleConnections = 0;

    for (const pool of this.pools.values()) {
      totalConnections += pool.length;
      for (const pooled of pool) {
        if (pooled.inUse) {
          activeConnections++;
        } else {
          idleConnections++;
        }
      }
    }

    return {
      totalServers: this.pools.size,
      totalConnections,
      activeConnections,
      idleConnections,
    };
  }

  /**
   * Get pool statistics for a specific server
   * @param serverName - Name of the server
   * @returns Pool statistics or null if server not in pool
   */
  getServerStats(serverName: string): {
    total: number;
    active: number;
    idle: number;
  } | null {
    const pool = this.pools.get(serverName);
    if (!pool) {
      return null;
    }

    let active = 0;
    let idle = 0;
    for (const pooled of pool) {
      if (pooled.inUse) {
        active++;
      } else {
        idle++;
      }
    }

    return {
      total: pool.length,
      active,
      idle,
    };
  }

  /**
   * Clean up stale (idle for too long) connections from a pool
   */
  private cleanupStaleConnections(pool: PooledConnection[]): void {
    const now = new Date();
    for (let i = pool.length - 1; i >= 0; i--) {
      const pooled = pool[i];
      if (pooled &&
        !pooled.inUse &&
        now.getTime() - pooled.lastUsed.getTime() > this.maxIdleTimeMs
      ) {
        // Disconnect and remove stale connection
        pooled.connection.disconnect().catch((error) => {
          frameworkLogger.log("connection-pool", "stale-disconnect-error", "error", { error });
        });
        pool.splice(i, 1);
      }
    }
  }
}
