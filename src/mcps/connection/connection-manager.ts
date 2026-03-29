import { IMcpConnection, IServerConfig } from '../types/index.js';
import { McpConnection } from './mcp-connection.js';
import { frameworkLogger } from '../../core/framework-logger.js';

/**
 * Connection Manager
 * Manages MCP connection lifecycle and provides centralized access to connections
 */
export class ConnectionManager {
  private connections: Map<string, IMcpConnection> = new Map();

  /**
   * Get or create a connection for a server
   * @param config - Server configuration
   * @returns Promise resolving to an MCP connection
   */
  async getConnection(config: IServerConfig): Promise<IMcpConnection> {
    const existingConnection = this.connections.get(config.serverName);
    if (existingConnection && existingConnection.isConnected) {
      return existingConnection;
    }

    // If existing connection is disconnected, remove it
    if (existingConnection) {
      await existingConnection.disconnect();
      this.connections.delete(config.serverName);
    }

    // Create new connection
    const connection = new McpConnection(config);
    await connection.connect();
    this.connections.set(config.serverName, connection);
    return connection;
  }

  /**
   * Disconnect a specific server
   * @param serverName - Name of the server to disconnect
   */
  async disconnect(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName);
    if (connection) {
      await connection.disconnect();
      this.connections.delete(serverName);
    }
  }

  /**
   * Disconnect all managed connections
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises: Promise<void>[] = [];
    for (const [serverName, connection] of this.connections) {
      disconnectPromises.push(
        connection.disconnect().catch((error) => {
          frameworkLogger.log("connection-manager", "disconnect-error", "error", { serverName, error });
        })
      );
    }
    await Promise.all(disconnectPromises);
    this.connections.clear();
  }

  /**
   * Check if a connection exists for a server
   * @param serverName - Name of the server
   * @returns True if connection exists and is connected
   */
  hasConnection(serverName: string): boolean {
    const connection = this.connections.get(serverName);
    return connection !== undefined && connection.isConnected;
  }

  /**
   * Get all connected server names
   * @returns Array of server names
   */
  getConnectedServers(): string[] {
    return Array.from(this.connections.entries())
      .filter(([, connection]) => connection.isConnected)
      .map(([name]) => name);
  }

  /**
   * Get the number of active connections
   * @returns Number of connections
   */
  getConnectionCount(): number {
    return this.getConnectedServers().length;
  }
}
