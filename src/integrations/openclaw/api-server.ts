/**
 * StringRay API Server
 *
 * HTTP API server that OpenClaw skills call to invoke StringRay capabilities.
 * This is the bridge between OpenClaw skills and StringRay.
 *
 * @version 1.0.0
 * @since 2026-03-14
 */

import * as crypto from 'crypto';
import * as http from 'http';
import {
  StringRayAPIServerConfig,
  AgentInvokeRequest,
  AgentInvokeResponse,
  HealthCheckResponse,
  APIServerStatistics,
} from './types.js';

/**
 * Agent invoker interface - implemented by StringRay
 */
export interface AgentInvoker {
  invoke(request: AgentInvokeRequest): Promise<AgentInvokeResponse>;
  getStatus?(): Promise<{ healthy: boolean; version: string }>;
}

/**
 * StringRay API Server
 */
export class StringRayAPIServer {
  private server: http.Server | null = null;
  private config: Required<StringRayAPIServerConfig>;
  private agentInvoker: AgentInvoker | null = null;
  private apiKey: string = '';
  private stats: APIServerStatistics = {
    startedAt: 0,
    requestsTotal: 0,
    requestsByEndpoint: {},
    requestsByStatus: {},
    averageResponseTime: 0,
    errors: 0,
  };
  private responseTimes: number[] = [];
  private logger: Console;

  constructor(config: StringRayAPIServerConfig) {
    this.config = {
      port: config.port || 18431,
      host: config.host || '127.0.0.1',
      apiKey: config.apiKey || '',
      cors: config.cors ?? false,
      rateLimit: config.rateLimit || {
        windowMs: 60000,
        maxRequests: 100,
      },
    };

    this.logger = console;
  }

  /**
   * Set the agent invoker
   */
  setAgentInvoker(invoker: AgentInvoker): void {
    this.agentInvoker = invoker;
  }

  /**
   * Start the API server
   */
  async start(): Promise<void> {
    if (this.server) {
      this.logger.warn('[StringRayAPIServer] Server already running');
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', (error: Error) => {
        this.logger.error('[StringRayAPIServer] Server error:', error);
        this.stats.errors++;
        reject(error);
      });

      this.server.listen(this.config.port, this.config.host, () => {
        this.stats.startedAt = Date.now();
        this.logger.info(`[StringRayAPIServer] Listening on http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('[StringRayAPIServer] Server stopped');
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server !== null;
  }

  /**
   * Get server statistics
   */
  getStats(): APIServerStatistics {
    // Calculate average response time
    if (this.responseTimes.length > 0) {
      const total = this.responseTimes.reduce((a, b) => a + b, 0);
      this.stats.averageResponseTime = total / this.responseTimes.length;
    }
    return { ...this.stats };
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  /**
   * Handle incoming HTTP request
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const startTime = Date.now();
    const url = new URL(req.url || '/', `http://${this.config.host}:${this.config.port}`);
    const method = req.method || 'GET';
    const endpoint = `${method} ${url.pathname}`;

    this.stats.requestsTotal++;
    this.stats.requestsByEndpoint[endpoint] = (this.stats.requestsByEndpoint[endpoint] || 0) + 1;

    // Set CORS headers if enabled
    if (this.config.cors) {
      // Security: When an API key is configured, restrict CORS to localhost only
      // to prevent cross-origin attacks where a malicious site could make
      // authenticated requests using the API key from a victim's browser.
      if (this.config.apiKey) {
        this.logger.warn(
          '[StringRayAPIServer] Security: API key is set with CORS enabled. ' +
          'Restricting Access-Control-Allow-Origin to localhost only. ' +
          'Configure explicit allowed origins if cross-origin access is needed.'
        );
        const origin = req.headers.origin;
        if (origin && ['http://localhost', 'http://127.0.0.1', 'http://localhost:3000',
            'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        } else {
          res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1');
        }
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Handle OPTIONS preflight
    if (method === 'OPTIONS') {
      this.sendResponse(res, 204, null);
      return;
    }

    // Check API key for non-health endpoints
    if (url.pathname !== '/health' && this.config.apiKey) {
      const authHeader = req.headers.authorization;
      if (!this.validateApiKey(authHeader)) {
        this.sendResponse(res, 401, { error: 'Unauthorized - Invalid or missing API key' });
        return;
      }
    }

    try {
      let body: string = '';
      
      if (method === 'POST' || method === 'PUT') {
        body = await this.readBody(req);
      }

      // Route request
      let result: unknown;

      switch (url.pathname) {
        case '/health':
          result = await this.handleHealth();
          this.sendResponse(res, 200, result);
          break;

        case '/api/agent/invoke':
          if (method !== 'POST') {
            this.sendResponse(res, 405, { error: 'Method not allowed - Use POST' });
            return;
          }
          result = await this.handleAgentInvoke(JSON.parse(body));
          this.sendResponse(res, 200, result);
          break;

        case '/api/agent/status':
          result = await this.handleAgentStatus();
          this.sendResponse(res, 200, result);
          break;

        case '/stats':
          result = this.getStats();
          this.sendResponse(res, 200, result);
          break;

        default:
          this.sendResponse(res, 404, { error: 'Not found' });
      }
    } catch (error) {
      this.logger.error(`[StringRayAPIServer] Error handling request:`, error);
      this.stats.errors++;
      
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      this.sendResponse(res, 500, { error: errorMessage });
    } finally {
      // Track response time
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      
      // Keep only last 1000 response times
      if (this.responseTimes.length > 1000) {
        this.responseTimes.shift();
      }

      // Track status code
      const statusCode = res.statusCode || 500;
      this.stats.requestsByStatus[statusCode] = (this.stats.requestsByStatus[statusCode] || 0) + 1;
    }
  }

  /**
   * Handle health check request
   */
  private async handleHealth(): Promise<HealthCheckResponse> {
    let agentStatus = 'unhealthy';
    
    if (this.agentInvoker?.getStatus) {
      try {
        const status = await this.agentInvoker.getStatus();
        agentStatus = status.healthy ? 'healthy' : 'degraded';
      } catch {
        agentStatus = 'unhealthy';
      }
    }

    return {
      status: agentStatus as 'healthy' | 'degraded' | 'unhealthy',
      version: '1.0.0',
      uptime: this.stats.startedAt ? Date.now() - this.stats.startedAt : 0,
      openclaw: {
        connected: false,
        state: 'disconnected',
      },
    };
  }

  /**
   * Handle agent invoke request
   */
  private async handleAgentInvoke(request: AgentInvokeRequest): Promise<AgentInvokeResponse> {
    if (!this.agentInvoker) {
      return {
        success: false,
        error: 'Agent invoker not configured',
      };
    }

    try {
      const result = await this.agentInvoker.invoke(request);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle agent status request
   */
  private async handleAgentStatus(): Promise<{ healthy: boolean; message: string }> {
    if (!this.agentInvoker) {
      return {
        healthy: false,
        message: 'Agent invoker not configured',
      };
    }

    if (this.agentInvoker.getStatus) {
      try {
        const status = await this.agentInvoker.getStatus();
        return {
          healthy: status.healthy,
          message: `Agent running version ${status.version}`,
        };
      } catch {
        return {
          healthy: false,
          message: 'Agent check failed',
        };
      }
    }

    return {
      healthy: true,
      message: 'Agent invoker configured',
    };
  }

  /**
   * Validate API key using constant-time comparison to prevent timing attacks
   */
  private validateApiKey(authHeader: string | undefined): boolean {
    if (!authHeader) {
      return false;
    }

    const expectedKey = this.config.apiKey;
    const providedKey = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    // Length mismatch check: return false immediately (length is not secret),
    // but this does not leak information about the key content.
    if (providedKey.length !== expectedKey.length) {
      return false;
    }

    // Use timing-safe comparison for the actual key content
    const expectedBuf = Buffer.from(expectedKey, 'utf-8');
    const providedBuf = Buffer.from(providedKey, 'utf-8');
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  }

  /**
   * Read request body
   */
  private readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      
      req.on('data', (chunk: string) => {
        body += chunk;
      });
      
      req.on('end', () => {
        resolve(body);
      });
      
      req.on('error', reject);
    });
  }

  /**
   * Send JSON response
   */
  private sendResponse(res: http.ServerResponse, statusCode: number, data: unknown): void {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    
    if (data !== null) {
      res.end(JSON.stringify(data));
    } else {
      res.end();
    }
  }
}

/**
 * Factory function to create API server
 */
export function createStringRayAPIServer(config: StringRayAPIServerConfig): StringRayAPIServer {
  return new StringRayAPIServer(config);
}
