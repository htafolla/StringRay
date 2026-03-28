import { EventEmitter } from 'events';
import { ChildProcess } from 'child_process';
import { frameworkLogger } from '../../core/framework-logger.js';
import {
  IMcpConnection,
  JsonRpcRequest,
  JsonRpcResponse,
  IServerConfig,
} from '../types/index.js';
import {
  MCP_PROTOCOL_VERSION,
  JSONRPC_VERSION,
} from '../protocol/protocol-constants.js';
import { ProcessSpawner } from './process-spawner.js';

/**
 * MCP Connection
 * Manages a single connection to an MCP server via spawned process
 */
export class McpConnection extends EventEmitter implements IMcpConnection {
  readonly serverName: string;
  private processSpawner: ProcessSpawner;
  private process: ChildProcess | undefined;
  private _isConnected = false;
  private requestId = 0;
  private pendingRequests: Map<
    number | string,
    { resolve: (value: JsonRpcResponse) => void; reject: (error: Error) => void }
  > = new Map();
  private stdoutBuffer = '';
  private readonly timeout: number;

  constructor(private config: IServerConfig) {
    super();
    this.serverName = config.serverName;
    this.processSpawner = new ProcessSpawner();
    this.timeout = config.timeout || 30000;
  }

  /**
   * Check if the connection is active
   */
  get isConnected(): boolean {
    return this._isConnected && this.process !== undefined && !this.process.killed;
  }

  /**
   * Connect to the MCP server
   * Spawns the process and sets up event handlers
   */
  async connect(): Promise<void> {
    if (this._isConnected) {
      return;
    }

    const jobId = `mcp-connect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      frameworkLogger.log(
        'mcp-connection',
        `Connecting to ${this.serverName}`,
        'info',
        { jobId }
      );

      const spawnResult = this.processSpawner.spawn(this.config);
      this.process = spawnResult.process;

      this.setupEventHandlers();

      // Send initialize request
      const initRequest: JsonRpcRequest = {
        jsonrpc: JSONRPC_VERSION,
        id: ++this.requestId,
        method: 'initialize',
        params: {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: {
            name: 'strray-mcp-client',
            version: '1.7.5',
          },
        },
      };

      await this.sendRequest(initRequest);
      this._isConnected = true;

      frameworkLogger.log(
        'mcp-connection',
        `Connected to ${this.serverName}`,
        'success',
        { jobId }
      );
    } catch (error) {
      frameworkLogger.log(
        'mcp-connection',
        `Failed to connect to ${this.serverName}: ${error instanceof Error ? error.message : String(error)}`,
        'error',
        { jobId, error }
      );
      this.cleanup();
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   * Kills the process and cleans up resources
   */
  async disconnect(): Promise<void> {
    if (!this._isConnected && !this.process) {
      return;
    }

    const jobId = `mcp-disconnect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    frameworkLogger.log(
      'mcp-connection',
      `Disconnecting from ${this.serverName}`,
      'info',
      { jobId }
    );

    // Reject all pending requests
    Array.from(this.pendingRequests.entries()).forEach(([id, { reject }]) => {
      reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();

    this.cleanup();
    this._isConnected = false;

    frameworkLogger.log(
      'mcp-connection',
      `Disconnected from ${this.serverName}`,
      'info',
      { jobId }
    );
  }

  /**
   * Send a JSON-RPC request to the MCP server
   * @param request - The JSON-RPC request to send
   * @returns Promise that resolves with the response
   */
  async sendRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (!this.process || this.process.killed) {
      throw new Error('Not connected to MCP server');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(request.id);
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);

      this.pendingRequests.set(request.id, {
        resolve: (response: JsonRpcResponse) => {
          clearTimeout(timeoutId);
          resolve(response);
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
      });

      try {
        if (!this.process || !this.process.stdin) {
          throw new Error('Process not available');
        }
        this.process.stdin.write(JSON.stringify(request) + '\n');
      } catch (error) {
        this.pendingRequests.delete(request.id);
        clearTimeout(timeoutId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Set up event handlers for the spawned process
   */
  private setupEventHandlers(): void {
    if (!this.process) {
      return;
    }

    const proc = this.process;
    if (proc.stdout) {
      proc.stdout.on('data', (data: Buffer) => {
        this.handleStdout(data.toString());
      });
    }

    if (proc.stderr) {
      proc.stderr.on('data', (data: Buffer) => {
        this.handleStderr(data.toString());
      });
    }

    this.process.on('error', (error: Error) => {
      this.handleError(error);
    });

    this.process.on('close', (code: number | null) => {
      this.handleClose(code);
    });
  }

  /**
   * Handle stdout data from the process
   */
  private handleStdout(data: string): void {
    this.stdoutBuffer += data;

    // Parse complete JSON-RPC messages (one per line)
    const lines = this.stdoutBuffer.split('\n');
    this.stdoutBuffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        continue;
      }

      try {
        const response: JsonRpcResponse = JSON.parse(trimmedLine);
        this.handleResponse(response);
      } catch {
        // Not valid JSON, log and continue
        frameworkLogger.log(
          'mcp-connection',
          `Received non-JSON data: ${trimmedLine.substring(0, 100)}`,
          'debug'
        );
      }
    }
  }

  /**
   * Handle a JSON-RPC response
   */
  private handleResponse(response: JsonRpcResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
        frameworkLogger.log(
          'mcp-connection',
          `Received response for unknown request ID: ${response.id}`,
          'warning'
        );
      return;
    }

    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(response.error.message || 'MCP server error'));
    } else {
      pending.resolve(response);
    }
  }

  /**
   * Handle stderr data from the process
   */
  private handleStderr(data: string): void {
    frameworkLogger.log(
      'mcp-connection',
      `stderr from ${this.serverName}: ${data.substring(0, 500)}`,
      'debug'
    );
    this.emit('stderr', data);
  }

  /**
   * Handle process errors
   */
  private handleError(error: Error): void {
    frameworkLogger.log(
      'mcp-connection',
      `Process error for ${this.serverName}: ${error.message}`,
      'error',
      { error: error.message }
    );

    // Reject all pending requests
    Array.from(this.pendingRequests.entries()).forEach(([id, { reject }]) => {
      reject(new Error(`Process error: ${error.message}`));
    });
    this.pendingRequests.clear();

    this.emit('error', error);
  }

  /**
   * Handle process close
   */
  private handleClose(code: number | null): void {
    frameworkLogger.log(
      'mcp-connection',
      `Process for ${this.serverName} closed with code ${code}`,
      'info'
    );

    // Reject all pending requests
    Array.from(this.pendingRequests.entries()).forEach(([id, { reject }]) => {
      reject(new Error(`Process closed with code ${code}`));
    });
    this.pendingRequests.clear();

    this._isConnected = false;
    this.emit('close', code);
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.process && !this.process.killed) {
      this.process.kill();
    }
    this.process = undefined;
    this.stdoutBuffer = '';
  }
}
