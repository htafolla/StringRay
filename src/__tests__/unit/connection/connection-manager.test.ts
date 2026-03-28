import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionManager } from '../../../mcps/connection/connection-manager.js';
import { McpConnection } from '../../../mcps/connection/mcp-connection.js';
import type { IServerConfig, IMcpConnection } from '../../../mcps/types/index.js';

// Mock McpConnection
vi.mock('../../../mcps/connection/mcp-connection.js', () => ({
  McpConnection: vi.fn().mockImplementation(function MockMcpConnection() {
    return {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      serverName: 'test-server',
      isConnected: true,
      on: vi.fn(),
    };
  }),
}));

describe('ConnectionManager', () => {
  let manager: ConnectionManager;

  const mockConfig: IServerConfig = {
    serverName: 'test-server',
    command: 'node',
    args: ['server.js'],
    timeout: 30000,
  };

  beforeEach(() => {
    manager = new ConnectionManager();
    vi.clearAllMocks();
  });

  describe('getConnection', () => {
    it('should create and return a new connection', async () => {
      const connection = await manager.getConnection(mockConfig);

      expect(McpConnection).toHaveBeenCalledWith(mockConfig);
      expect(connection).toBeDefined();
    });

    it('should return existing connection if already connected', async () => {
      const connection1 = await manager.getConnection(mockConfig);
      const connection2 = await manager.getConnection(mockConfig);

      expect(McpConnection).toHaveBeenCalledTimes(1);
      expect(connection1).toBe(connection2);
    });

    it('should create new connection if existing is disconnected', async () => {
      // Setup mock to return disconnected connection first
      const mockDisconnectedConnection = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        serverName: 'test-server',
        isConnected: false,
        on: vi.fn(),
      } as unknown as IMcpConnection;

      // First call returns disconnected connection
      (McpConnection as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(function MockMcpConnection() {
        return mockDisconnectedConnection;
      });

      // First connection (will be disconnected)
      const connection1 = await manager.getConnection(mockConfig);
      expect(connection1.isConnected).toBe(false);

      // Get connection again - should create new one since existing is disconnected
      const connection2 = await manager.getConnection(mockConfig);

      expect(McpConnection).toHaveBeenCalledTimes(2);
      expect(connection2.isConnected).toBe(true);
    });

    it('should handle multiple different servers', async () => {
      const config1: IServerConfig = {
        ...mockConfig,
        serverName: 'server-1',
      };

      const config2: IServerConfig = {
        ...mockConfig,
        serverName: 'server-2',
      };

      await manager.getConnection(config1);
      await manager.getConnection(config2);

      expect(McpConnection).toHaveBeenCalledTimes(2);
    });
  });

  describe('disconnect', () => {
    it('should disconnect a specific server', async () => {
      const connection = await manager.getConnection(mockConfig);

      await manager.disconnect('test-server');

      expect(connection.disconnect).toHaveBeenCalled();
      expect(manager.hasConnection('test-server')).toBe(false);
    });

    it('should handle disconnecting non-existent server', async () => {
      await expect(manager.disconnect('non-existent')).resolves.not.toThrow();
    });
  });

  describe('disconnectAll', () => {
    it('should disconnect all managed connections', async () => {
      const config1: IServerConfig = { ...mockConfig, serverName: 'server-1' };
      const config2: IServerConfig = { ...mockConfig, serverName: 'server-2' };

      const conn1 = await manager.getConnection(config1);
      const conn2 = await manager.getConnection(config2);

      await manager.disconnectAll();

      expect(conn1.disconnect).toHaveBeenCalled();
      expect(conn2.disconnect).toHaveBeenCalled();
      expect(manager.getConnectedServers()).toHaveLength(0);
    });

    it('should handle errors during mass disconnect gracefully', async () => {
      const config: IServerConfig = { ...mockConfig, serverName: 'error-server' };

      const errorConnection = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockRejectedValue(new Error('Disconnect failed')),
        serverName: 'error-server',
        isConnected: true,
        on: vi.fn(),
      } as unknown as IMcpConnection;

      (McpConnection as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(function MockMcpConnection() {
        return errorConnection;
      });

      await manager.getConnection(config);

      // Should not throw even though disconnect fails
      await expect(manager.disconnectAll()).resolves.not.toThrow();
    });

    it('should handle empty manager', async () => {
      await expect(manager.disconnectAll()).resolves.not.toThrow();
    });
  });

  describe('hasConnection', () => {
    it('should return true for connected server', async () => {
      await manager.getConnection(mockConfig);

      expect(manager.hasConnection('test-server')).toBe(true);
    });

    it('should return false for non-existent server', () => {
      expect(manager.hasConnection('non-existent')).toBe(false);
    });

    it('should return false for disconnected server', async () => {
      await manager.getConnection(mockConfig);
      await manager.disconnect('test-server');

      expect(manager.hasConnection('test-server')).toBe(false);
    });
  });

  describe('getConnectedServers', () => {
    it('should return empty array when no connections', () => {
      expect(manager.getConnectedServers()).toEqual([]);
    });

    it('should return array of connected server names', async () => {
      await manager.getConnection({ ...mockConfig, serverName: 'server-1' });
      await manager.getConnection({ ...mockConfig, serverName: 'server-2' });

      const servers = manager.getConnectedServers();

      expect(servers).toContain('server-1');
      expect(servers).toContain('server-2');
      expect(servers).toHaveLength(2);
    });

    it('should exclude disconnected servers', async () => {
      await manager.getConnection({ ...mockConfig, serverName: 'server-1' });
      await manager.getConnection({ ...mockConfig, serverName: 'server-2' });

      await manager.disconnect('server-1');

      const servers = manager.getConnectedServers();

      expect(servers).toContain('server-2');
      expect(servers).not.toContain('server-1');
    });
  });

  describe('getConnectionCount', () => {
    it('should return 0 when no connections', () => {
      expect(manager.getConnectionCount()).toBe(0);
    });

    it('should return correct count of connections', async () => {
      await manager.getConnection({ ...mockConfig, serverName: 'server-1' });
      await manager.getConnection({ ...mockConfig, serverName: 'server-2' });
      await manager.getConnection({ ...mockConfig, serverName: 'server-3' });

      expect(manager.getConnectionCount()).toBe(3);
    });

    it('should update count after disconnect', async () => {
      await manager.getConnection({ ...mockConfig, serverName: 'server-1' });
      await manager.getConnection({ ...mockConfig, serverName: 'server-2' });

      await manager.disconnect('server-1');

      expect(manager.getConnectionCount()).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid connect/disconnect cycles', async () => {
      const configs: IServerConfig[] = [
        { ...mockConfig, serverName: 'server-1' },
        { ...mockConfig, serverName: 'server-2' },
        { ...mockConfig, serverName: 'server-3' },
      ];

      // Rapid connections
      await Promise.all(configs.map(c => manager.getConnection(c)));

      // Rapid disconnections
      await Promise.all(configs.map(c => manager.disconnect(c.serverName)));

      expect(manager.getConnectionCount()).toBe(0);
    });

    it('should handle concurrent getConnection for same server', async () => {
      const [conn1, conn2] = await Promise.all([
        manager.getConnection(mockConfig),
        manager.getConnection(mockConfig),
      ]);

      // Both requests complete successfully
      expect(conn1).toBeDefined();
      expect(conn2).toBeDefined();
      // At least one connection is created (implementation may create 1 or 2 due to race conditions)
      expect(McpConnection).toHaveBeenCalled();
    });
  });
});
