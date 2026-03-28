import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpConnection } from '../../../mcps/connection/mcp-connection.js';
import { ProcessSpawner } from '../../../mcps/connection/process-spawner.js';
import { frameworkLogger } from '../../../core/framework-logger.js';
import type { IServerConfig, JsonRpcRequest, JsonRpcResponse } from '../../../mcps/types/index.js';
import type { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Mock dependencies
vi.mock('../../../core/framework-logger.js', () => ({
  frameworkLogger: {
    log: vi.fn(),
  },
}));

vi.mock('../../../mcps/connection/process-spawner.js', () => ({
  ProcessSpawner: vi.fn().mockImplementation(function ProcessSpawner() {
    return {
      spawn: vi.fn(),
    };
  }),
}));

describe('McpConnection', () => {
  let connection: McpConnection;
  let mockSpawn: ReturnType<typeof vi.fn>;
  let mockProcess: ChildProcess & EventEmitter;
  let mockStdout: EventEmitter;
  let mockStderr: EventEmitter;
  let mockStdin: { write: ReturnType<typeof vi.fn> };

  const mockConfig: IServerConfig = {
    serverName: 'test-server',
    command: 'node',
    args: ['server.js'],
    timeout: 30000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    // Create mock streams
    mockStdout = new EventEmitter();
    mockStderr = new EventEmitter();
    mockStdin = { write: vi.fn() };

    // Create mock process
    mockProcess = new EventEmitter() as ChildProcess & EventEmitter;
    Object.assign(mockProcess, {
      stdout: mockStdout,
      stderr: mockStderr,
      stdin: mockStdin,
      killed: false,
      kill: vi.fn(),
    });

    // Setup mock spawner
    mockSpawn = vi.fn().mockReturnValue({
      process: mockProcess,
      stdout: mockStdout,
      stdin: mockStdin,
      stderr: mockStderr,
    });

    (ProcessSpawner as unknown as ReturnType<typeof vi.fn>).mockImplementation(function MockProcessSpawner() {
      return { spawn: mockSpawn };
    });

    connection = new McpConnection(mockConfig);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with correct server name', () => {
      expect(connection.serverName).toBe('test-server');
    });

    it('should not be connected initially', () => {
      expect(connection.isConnected).toBe(false);
    });
  });

  describe('connect', () => {
    it('should spawn process and connect successfully', async () => {
      const connectPromise = connection.connect();

      // Simulate successful initialization response
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { initialized: true },
        }) + '\n');
      });

      await connectPromise;

      expect(mockSpawn).toHaveBeenCalledWith(mockConfig);
      expect(connection.isConnected).toBe(true);
    });

    it('should not reconnect if already connected', async () => {
      // First connect
      const connectPromise1 = connection.connect();
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { initialized: true },
        }) + '\n');
      });
      await connectPromise1;

      mockSpawn.mockClear();

      // Second connect should be no-op
      await connection.connect();
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      const connectPromise = connection.connect();

      // Simulate error response
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          error: { message: 'Initialization failed' },
        }) + '\n');
      });

      await expect(connectPromise).rejects.toThrow('Initialization failed');
      expect(connection.isConnected).toBe(false);
    });

    it('should handle spawn errors', async () => {
      mockSpawn.mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      await expect(connection.connect()).rejects.toThrow('Spawn failed');
      expect(connection.isConnected).toBe(false);
    });

    it('should handle process errors during connection', async () => {
      // Add error listener to prevent unhandled error
      connection.on('error', () => {
        // Expected error during connection - ignore
      });

      const connectPromise = connection.connect();

      setImmediate(() => {
        mockProcess.emit('error', new Error('Process crashed'));
      });

      await expect(connectPromise).rejects.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should disconnect and clean up resources', async () => {
      // Connect first
      const connectPromise = connection.connect();
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { initialized: true },
        }) + '\n');
      });
      await connectPromise;

      await connection.disconnect();

      expect(mockProcess.kill).toHaveBeenCalled();
      expect(connection.isConnected).toBe(false);
    });

    it('should handle disconnect when not connected', async () => {
      await expect(connection.disconnect()).resolves.not.toThrow();
    });

    it('should reject pending requests on disconnect', async () => {
      // Connect first
      const connectPromise = connection.connect();
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { initialized: true },
        }) + '\n');
      });
      await connectPromise;

      // Send a request that will be pending
      const requestPromise = connection.sendRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'test',
        params: {},
      });

      // Disconnect before response
      await connection.disconnect();

      await expect(requestPromise).rejects.toThrow('Connection closed');
    });
  });

  describe('sendRequest', () => {
    beforeEach(async () => {
      const connectPromise = connection.connect();
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { initialized: true },
        }) + '\n');
      });
      await connectPromise;
    });

    it('should send request and receive response', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      };

      const responsePromise = connection.sendRequest(request);

      // Verify request was sent
      expect(mockStdin.write).toHaveBeenCalledWith(
        JSON.stringify(request) + '\n'
      );

      // Simulate response
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          result: { tools: [] },
        }) + '\n');
      });

      const response = await responsePromise;
      expect(response.result).toEqual({ tools: [] });
    });

    it('should handle response errors', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'test',
        params: {},
      };

      const responsePromise = connection.sendRequest(request);

      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          error: { code: -32600, message: 'Invalid request' },
        }) + '\n');
      });

      await expect(responsePromise).rejects.toThrow('Invalid request');
    });

    it('should timeout if no response received', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'test',
        params: {},
      };

      const responsePromise = connection.sendRequest(request);

      // Advance time beyond timeout
      vi.advanceTimersByTime(31000);

      await expect(responsePromise).rejects.toThrow('Request timeout');
    });

    it('should throw if not connected', async () => {
      // Create new connection without connecting
      const newConnection = new McpConnection(mockConfig);

      await expect(
        newConnection.sendRequest({
          jsonrpc: '2.0',
          id: 1,
          method: 'test',
          params: {},
        })
      ).rejects.toThrow('Not connected to MCP server');
    });

    it('should handle killed process', async () => {
      Object.defineProperty(mockProcess, 'killed', { value: true, writable: true });

      await expect(
        connection.sendRequest({
          jsonrpc: '2.0',
          id: 2,
          method: 'test',
          params: {},
        })
      ).rejects.toThrow('Not connected to MCP server');
    });

    it('should handle partial JSON responses', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'test',
        params: {},
      };

      const responsePromise = connection.sendRequest(request);

      // Send partial response, then complete
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          result: {},
        }).substring(0, 10));
      });

      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          result: {},
        }).substring(10) + '\n');
      });

      await expect(responsePromise).resolves.toBeDefined();
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      const connectPromise = connection.connect();
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { initialized: true },
        }) + '\n');
      });
      await connectPromise;
    });

    it('should emit stderr events', () => {
      const stderrHandler = vi.fn();
      connection.on('stderr', stderrHandler);

      mockStderr.emit('data', Buffer.from('Error message'));

      expect(stderrHandler).toHaveBeenCalledWith('Error message');
    });

    it('should emit error events on process error', () => {
      const errorHandler = vi.fn();
      connection.on('error', errorHandler);

      const error = new Error('Process error');
      mockProcess.emit('error', error);

      expect(errorHandler).toHaveBeenCalledWith(error);
    });

    it('should emit close events on process close', () => {
      const closeHandler = vi.fn();
      connection.on('close', closeHandler);

      mockProcess.emit('close', 0);

      expect(closeHandler).toHaveBeenCalledWith(0);
      expect(connection.isConnected).toBe(false);
    });

    it('should reject pending requests on process close', async () => {
      const requestPromise = connection.sendRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'test',
        params: {},
      });

      mockProcess.emit('close', 1);

      await expect(requestPromise).rejects.toThrow('Process closed with code 1');
    });

    it('should reject pending requests on process error', async () => {
      let rejectionError: Error | undefined;

      // Add error listener to prevent unhandled error
      connection.on('error', () => {
        // Expected error - ignore
      });

      const requestPromise = connection.sendRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'test',
        params: {},
      }).catch((error: Error) => {
        rejectionError = error;
      });

      mockProcess.emit('error', new Error('Fatal error'));

      await requestPromise;

      // Verify that the promise was rejected with the expected error
      expect(rejectionError?.message).toBe('Process error: Fatal error');
    });

    it('should handle non-JSON data gracefully', () => {
      mockStdout.emit('data', 'not valid json\n');

      // Should not throw
      expect(() => {
        mockStdout.emit('data', '{"valid": true}\n');
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple requests in sequence', async () => {
      // Connect
      const connectPromise = connection.connect();
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { initialized: true },
        }) + '\n');
      });
      await connectPromise;

      // Send multiple requests
      const request1 = connection.sendRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'test1',
        params: {},
      });

      const request2 = connection.sendRequest({
        jsonrpc: '2.0',
        id: 3,
        method: 'test2',
        params: {},
      });

      // Respond to both
      setImmediate(() => {
        mockStdout.emit('data',
          JSON.stringify({ jsonrpc: '2.0', id: 2, result: { data: 1 } }) + '\n' +
          JSON.stringify({ jsonrpc: '2.0', id: 3, result: { data: 2 } }) + '\n'
        );
      });

      const [response1, response2] = await Promise.all([request1, request2]);
      expect(response1.result).toEqual({ data: 1 });
      expect(response2.result).toEqual({ data: 2 });
    });

    it('should handle responses with unknown request IDs', () => {
      // Connect
      const connectPromise = connection.connect();
      setImmediate(() => {
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { initialized: true },
        }) + '\n');
      });

      return connectPromise.then(() => {
        // Emit response for unknown ID
        mockStdout.emit('data', JSON.stringify({
          jsonrpc: '2.0',
          id: 999,
          result: {},
        }) + '\n');

        // Should log warning but not throw
        expect(frameworkLogger.log).toHaveBeenCalledWith(
          'mcp-connection',
          expect.stringContaining('unknown request ID'),
          'warning'
        );
      });
    });
  });
});
