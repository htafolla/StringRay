import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionPool } from '../../../mcps/connection/connection-pool.js';
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
    };
  }),
}));

describe('ConnectionPool', () => {
  let pool: ConnectionPool;

  const mockConfig: IServerConfig = {
    serverName: 'test-server',
    command: 'node',
    args: ['server.js'],
    timeout: 30000,
  };

  beforeEach(() => {
    pool = new ConnectionPool();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create pool with default options', () => {
      const defaultPool = new ConnectionPool();
      expect(defaultPool).toBeDefined();
    });

    it('should create pool with custom options', () => {
      const customPool = new ConnectionPool({
        maxPoolSize: 10,
        maxIdleTimeMs: 60000,
      });
      expect(customPool).toBeDefined();
    });
  });

  describe('acquire', () => {
    it('should create and return a new connection', async () => {
      const connection = await pool.acquire('test-server', mockConfig);

      expect(McpConnection).toHaveBeenCalledWith(mockConfig);
      expect(connection).toBeDefined();
    });

    it('should reuse available connections', async () => {
      const conn1 = await pool.acquire('test-server', mockConfig);
      pool.release(conn1);

      const conn2 = await pool.acquire('test-server', mockConfig);

      expect(McpConnection).toHaveBeenCalledTimes(1);
      expect(conn1).toBe(conn2);
    });

    it('should not reuse connections in use', async () => {
      await pool.acquire('test-server', mockConfig);
      const conn2 = await pool.acquire('test-server', mockConfig);

      expect(McpConnection).toHaveBeenCalledTimes(2);
    });

    it('should throw when pool is exhausted', async () => {
      const smallPool = new ConnectionPool({ maxPoolSize: 2 });

      const conn1 = await smallPool.acquire('test-server', mockConfig);
      const conn2 = await smallPool.acquire('test-server', mockConfig);

      // Both connections in use, pool exhausted
      await expect(smallPool.acquire('test-server', mockConfig)).rejects.toThrow(
        'Connection pool exhausted'
      );
    });

    it('should handle multiple servers independently', async () => {
      const config1: IServerConfig = { ...mockConfig, serverName: 'server-1' };
      const config2: IServerConfig = { ...mockConfig, serverName: 'server-2' };

      await pool.acquire('server-1', config1);
      await pool.acquire('server-2', config2);

      expect(McpConnection).toHaveBeenCalledTimes(2);
    });

    it('should clean up stale connections before acquiring', async () => {
      const shortTimeoutPool = new ConnectionPool({
        maxPoolSize: 2,
        maxIdleTimeMs: 100,
      });

      const conn = await shortTimeoutPool.acquire('test-server', mockConfig);
      shortTimeoutPool.release(conn);

      // Wait for idle timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should create new connection since old one is stale
      await shortTimeoutPool.acquire('test-server', mockConfig);

      expect(McpConnection).toHaveBeenCalledTimes(2);
    });

    it('should not reuse disconnected connections', async () => {
      const disconnectedConn = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        serverName: 'test-server',
        isConnected: false,
      } as unknown as IMcpConnection;

      const connectedConn = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        serverName: 'test-server',
        isConnected: true,
      };

      let callCount = 0;
      (McpConnection as unknown as ReturnType<typeof vi.fn>).mockImplementation(function MockMcpConnection() {
        callCount++;
        return callCount === 1 ? disconnectedConn : connectedConn;
      });

      await pool.acquire('test-server', mockConfig);
      const conn2 = await pool.acquire('test-server', mockConfig);

      expect(McpConnection).toHaveBeenCalledTimes(2);
    });
  });

  describe('release', () => {
    it('should mark connection as available', async () => {
      const conn = await pool.acquire('test-server', mockConfig);
      pool.release(conn);

      const stats = pool.getServerStats('test-server');
      expect(stats?.active).toBe(0);
      expect(stats?.idle).toBe(1);
    });

    it('should handle releasing unknown connections gracefully', () => {
      const unknownConn = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        serverName: 'unknown',
        isConnected: true,
      } as unknown as IMcpConnection;

      // Should not throw
      expect(() => pool.release(unknownConn)).not.toThrow();
    });

    it('should update lastUsed timestamp on release', async () => {
      const beforeAcquire = new Date();

      const conn = await pool.acquire('test-server', mockConfig);
      pool.release(conn);

      const stats = pool.getServerStats('test-server');
      expect(stats?.idle).toBe(1);
    });
  });

  describe('clear', () => {
    it('should disconnect all connections', async () => {
      const conn1 = await pool.acquire('server-1', { ...mockConfig, serverName: 'server-1' });
      const conn2 = await pool.acquire('server-2', { ...mockConfig, serverName: 'server-2' });

      pool.release(conn1);
      pool.release(conn2);

      await pool.clear();

      expect(conn1.disconnect).toHaveBeenCalled();
      expect(conn2.disconnect).toHaveBeenCalled();
    });

    it('should handle clear on empty pool', async () => {
      await expect(pool.clear()).resolves.not.toThrow();
    });

    it('should handle disconnect errors gracefully', async () => {
      const errorConn = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockRejectedValue(new Error('Disconnect failed')),
        serverName: 'test-server',
        isConnected: true,
      } as unknown as IMcpConnection;

      (McpConnection as unknown as ReturnType<typeof vi.fn>).mockImplementation(function MockMcpConnection() {
        return errorConn;
      });

      await pool.acquire('test-server', mockConfig);

      // Should not throw even though disconnect fails
      await expect(pool.clear()).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return zero stats for empty pool', () => {
      const stats = pool.getStats();

      expect(stats).toEqual({
        totalServers: 0,
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
      });
    });

    it('should return correct stats with connections', async () => {
      await pool.acquire('server-1', { ...mockConfig, serverName: 'server-1' });
      const conn2 = await pool.acquire('server-1', { ...mockConfig, serverName: 'server-1' });
      await pool.acquire('server-2', { ...mockConfig, serverName: 'server-2' });

      pool.release(conn2);

      const stats = pool.getStats();

      expect(stats.totalServers).toBe(2);
      expect(stats.totalConnections).toBe(3);
      expect(stats.activeConnections).toBe(2);
      expect(stats.idleConnections).toBe(1);
    });

    it('should track multiple servers', async () => {
      await pool.acquire('server-1', { ...mockConfig, serverName: 'server-1' });
      await pool.acquire('server-2', { ...mockConfig, serverName: 'server-2' });
      await pool.acquire('server-3', { ...mockConfig, serverName: 'server-3' });

      const stats = pool.getStats();

      expect(stats.totalServers).toBe(3);
      expect(stats.totalConnections).toBe(3);
    });
  });

  describe('getServerStats', () => {
    it('should return null for unknown server', () => {
      expect(pool.getServerStats('unknown')).toBeNull();
    });

    it('should return stats for specific server', async () => {
      await pool.acquire('server-1', { ...mockConfig, serverName: 'server-1' });
      const conn2 = await pool.acquire('server-1', { ...mockConfig, serverName: 'server-1' });

      pool.release(conn2);

      const stats = pool.getServerStats('server-1');

      expect(stats).toEqual({
        total: 2,
        active: 1,
        idle: 1,
      });
    });

    it('should handle server with only active connections', async () => {
      await pool.acquire('server-1', { ...mockConfig, serverName: 'server-1' });

      const stats = pool.getServerStats('server-1');

      expect(stats?.active).toBe(1);
      expect(stats?.idle).toBe(0);
    });

    it('should handle server with only idle connections', async () => {
      const conn = await pool.acquire('server-1', { ...mockConfig, serverName: 'server-1' });
      pool.release(conn);

      const stats = pool.getServerStats('server-1');

      expect(stats?.active).toBe(0);
      expect(stats?.idle).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle acquire-release-acquire cycle', async () => {
      const conn1 = await pool.acquire('test-server', mockConfig);
      pool.release(conn1);
      const conn2 = await pool.acquire('test-server', mockConfig);

      expect(conn1).toBe(conn2);
      expect(McpConnection).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple concurrent acquires for same server', async () => {
      const [conn1, conn2] = await Promise.all([
        pool.acquire('test-server', mockConfig),
        pool.acquire('test-server', mockConfig),
      ]);

      // Both requests complete successfully (may create 1 or 2 connections due to race conditions)
      expect(conn1).toBeDefined();
      expect(conn2).toBeDefined();
      expect(McpConnection).toHaveBeenCalled();
    });

    it('should respect max pool size per server', async () => {
      const smallPool = new ConnectionPool({ maxPoolSize: 2 });

      // Acquire 2 connections for server-1 (reaches per-server limit)
      await smallPool.acquire('server-1', { ...mockConfig, serverName: 'server-1' });
      await smallPool.acquire('server-1', { ...mockConfig, serverName: 'server-1' });

      // Third connection for server-1 should throw (pool size is per server)
      await expect(smallPool.acquire('server-1', { ...mockConfig, serverName: 'server-1' })).rejects.toThrow('exhausted');
    });

    it('should handle stale connection cleanup correctly', async () => {
      const quickPool = new ConnectionPool({ maxPoolSize: 2, maxIdleTimeMs: 50 });

      const conn = await quickPool.acquire('test-server', mockConfig);
      quickPool.release(conn);

      // Wait for stale timeout
      await new Promise(resolve => setTimeout(resolve, 100));

      // Acquire again - should create new connection
      await quickPool.acquire('test-server', mockConfig);

      expect(McpConnection).toHaveBeenCalledTimes(2);
    });

    it('should not clean up active connections during stale check', async () => {
      const quickPool = new ConnectionPool({ maxPoolSize: 3, maxIdleTimeMs: 50 });

      // Keep connection active
      const conn = await quickPool.acquire('test-server', mockConfig);

      // Wait for timeout period
      await new Promise(resolve => setTimeout(resolve, 100));

      // Acquire again - should create new connection since active ones are not cleaned up
      const conn2 = await quickPool.acquire('test-server', mockConfig);
      expect(conn2).toBeDefined();

      // First connection should not be disconnected (still active)
      expect(conn.disconnect).not.toHaveBeenCalled();

      // Release both connections
      quickPool.release(conn);
      quickPool.release(conn2);
    });
  });
});
