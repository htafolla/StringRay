/**
 * OpenClaw WebSocket Client
 *
 * Implements OpenClaw Gateway Protocol v3 with proper request/response handling,
 * reconnection logic, and event management.
 *
 * @version 1.0.0
 * @since 2026-03-14
 */

import { WebSocket } from 'ws';
import * as crypto from 'crypto';
import {
  OpenClawClientConfig,
  OpenClawClientState,
  OpenClawFrame,
  OpenClawFrameRequest,
  OpenClawFrameResponse,
  OpenClawFrameEvent,
  OpenClawConnectParams,
  PendingRequest,
  ClientStatistics,
  isOpenClawRequest,
  isOpenClawResponse,
  isOpenClawEvent,
  OpenClawTimeoutError,
  OpenClawConnectionError,
  OpenClawErrorCode,
} from './types.js';

/**
 * OpenClaw WebSocket Client
 */
export class OpenClawClient {
  private ws: WebSocket | null = null;
  private config: Required<OpenClawClientConfig>;
  private state: OpenClawClientState = 'disconnected';
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();
  private stateListeners: Set<Function> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private stats: ClientStatistics = {
    messagesSent: 0,
    messagesReceived: 0,
    requestsSent: 0,
    requestsSucceeded: 0,
    requestsFailed: 0,
    reconnects: 0,
    errors: 0,
  };
  private logger: Console;

  constructor(config: OpenClawClientConfig) {
    this.config = {
      gatewayUrl: config.gatewayUrl || 'ws://127.0.0.1:18789',
      authToken: config.authToken || '',
      deviceId: config.deviceId || '',
      deviceKeyPair: config.deviceKeyPair || { publicKey: '', privateKey: '' },
      reconnect: config.reconnect ?? true,
      reconnectAttempts: config.reconnectAttempts ?? 5,
      reconnectDelay: config.reconnectDelay ?? 1000,
      pingInterval: config.pingInterval ?? 30000,
      requestTimeout: config.requestTimeout ?? 30000,
    };

    // Use console but can be replaced with proper logger
    this.logger = console;
  }

  /**
   * Connect to OpenClaw Gateway
   */
  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'authenticating') {
      this.logger.warn('[OpenClawClient] Already connected or connecting');
      return;
    }

    this.setState('connecting');

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.gatewayUrl);

        this.ws!.on('open', () => {
          this.logger.info('[OpenClawClient] WebSocket connected, sending handshake...');
          this.sendHandshake();
          resolve();
        });

        this.ws!.on('message', (data: Buffer | string) => {
          const message = typeof data === 'string' ? data : data.toString();
          this.handleMessage(message);
        });

        this.ws!.on('close', (code: number, reason: Buffer) => {
          this.logger.info(`[OpenClawClient] Connection closed: ${code} ${reason.toString()}`);
          this.handleDisconnect(code, reason.toString());
        });

        this.ws!.on('error', (error: Error) => {
          this.logger.error('[OpenClawClient] WebSocket error:', error.message);
          this.stats.errors++;
          
          if (this.state === 'connecting') {
            reject(new OpenClawConnectionError(
              `Failed to connect to ${this.config.gatewayUrl}: ${error.message}`,
              error
            ));
          }
        });

        this.ws!.on('ping', () => {
          this.logger.debug('[OpenClawClient] Received ping');
        });

        this.ws!.on('pong', () => {
          this.logger.debug('[OpenClawClient] Received pong');
        });
      } catch (error) {
        this.setState('error');
        reject(new OpenClawConnectionError(
          'Failed to create WebSocket connection',
          error as Error
        ));
      }
    });
  }

  /**
   * Disconnect from OpenClaw Gateway
   */
  disconnect(): void {
    this.logger.info('[OpenClawClient] Disconnecting...');
    
    // Clear reconnection
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Reject pending requests
    for (const [id, request] of this.pendingRequests.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error('Connection closed'));
      this.pendingRequests.delete(id);
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.setState('disconnected');
  }

  /**
   * Send request and wait for response
   */
  async sendRequest<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to OpenClaw Gateway');
    }

    const id = this.generateId();
    const frame: OpenClawFrameRequest = {
      type: 'req',
      id,
      method,
      params,
    };

    this.logger.debug(`[OpenClawClient] Sending request: ${method} (${id})`);
    this.stats.requestsSent++;

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        this.stats.requestsFailed++;
        reject(new OpenClawTimeoutError(method, this.config.requestTimeout));
      }, this.config.requestTimeout);

      // Store pending request
      this.pendingRequests.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          this.stats.requestsSucceeded++;
          resolve(value as T);
        },
        reject: (reason) => {
          clearTimeout(timeout);
          this.stats.requestsFailed++;
          reject(reason);
        },
        timeout,
        timestamp: Date.now(),
      });

      // Send frame
      try {
        this.ws!.send(JSON.stringify(frame));
        this.stats.messagesSent++;
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        this.stats.errors++;
        reject(error);
      }
    });
  }

  /**
   * Subscribe to events
   */
  async subscribeToEvents(events: string[]): Promise<void> {
    await this.sendRequest('events.subscribe', { events });
  }

  /**
   * Get current state
   */
  getState(): OpenClawClientState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === 'connected' || this.state === 'authorized';
  }

  /**
   * Get statistics
   */
  getStats(): ClientStatistics {
    return { ...this.stats };
  }

  /**
   * Add event listener
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Add state change listener
   */
  onStateChange(listener: Function): void {
    this.stateListeners.add(listener);
  }

  /**
   * Remove state change listener
   */
  offStateChange(listener: Function): void {
    this.stateListeners.delete(listener);
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  /**
   * Send handshake on connect
   */
  private sendHandshake(): void {
    const params: OpenClawConnectParams = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'strray-integration',
        version: '1.0.0',
        platform: process.platform,
        mode: 'operator',
      },
      role: 'operator',
      scopes: ['operator.read', 'operator.write'],
      caps: [],
      commands: [],
      userAgent: `StringRay-OpenClaw-Integration/1.0.0`,
    };

    // Add auth if provided
    if (this.config.authToken) {
      params.auth = { token: this.config.authToken };
    }

    // Add device if provided
    if (this.config.deviceId && this.config.deviceKeyPair) {
      params.device = {
        id: this.config.deviceId,
        publicKey: this.config.deviceKeyPair.publicKey,
        signature: this.signDeviceChallenge(this.config.deviceId),
        signedAt: Date.now(),
        nonce: this.generateNonce(),
      };
    }

    // Send connect request
    this.sendRequest('connect', params as unknown as Record<string, unknown>).catch((error) => {
      this.logger.error('[OpenClawClient] Handshake failed:', error);
      this.setState('error');
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    this.stats.messagesReceived++;

    try {
      const frame: unknown = JSON.parse(data);

      if (isOpenClawResponse(frame)) {
        this.handleResponse(frame);
      } else if (isOpenClawEvent(frame)) {
        this.handleEvent(frame);
      } else {
        this.logger.warn('[OpenClawClient] Unknown frame type:', frame);
      }
    } catch (error) {
      this.logger.error('[OpenClawClient] Failed to parse message:', error);
      this.stats.errors++;
    }
  }

  /**
   * Handle response frame
   */
  private handleResponse(frame: OpenClawFrameResponse): void {
    const pending = this.pendingRequests.get(frame.id);

    if (pending) {
      this.pendingRequests.delete(frame.id);

      if (frame.ok) {
        pending.resolve(frame.result);
      } else {
        const error = new Error(frame.error?.message || 'Request failed');
        (error as any).code = frame.error?.code;
        pending.reject(error);
      }
    } else {
      this.logger.warn('[OpenClawClient] Received response for unknown request:', frame.id);
    }
  }

  /**
   * Handle event frame
   */
  private handleEvent(frame: OpenClawFrameEvent): void {
    this.logger.debug('[OpenClawClient] Event:', frame.event);

    // Handle specific events
    if (frame.event === 'authorized') {
      this.setState('authorized');
      this.startPingInterval();
    }

    // Notify listeners
    const listeners = this.eventListeners.get(frame.event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(frame.data);
        } catch (error) {
          this.logger.error('[OpenClawClient] Event listener error:', error);
        }
      }
    }

    // Notify all-event listeners
    const allListeners = this.eventListeners.get('*');
    if (allListeners) {
      for (const listener of allListeners) {
        try {
          listener(frame.event, frame.data);
        } catch (error) {
          this.logger.error('[OpenClawClient] All-event listener error:', error);
        }
      }
    }
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(code: number, reason: string): void {
    // Stop ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Set state
    if (this.state !== 'disconnected') {
      this.setState('disconnected');
    }

    // Attempt reconnection
    if (this.config.reconnect && this.reconnectAttempts < this.config.reconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectAttempts++;
    this.stats.reconnects++;
    
    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const maxDelay = 30000;
    const actualDelay = Math.min(delay, maxDelay);

    this.logger.info(`[OpenClawClient] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.reconnectAttempts} in ${actualDelay}ms`);
    
    this.setState('reconnecting');

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect().catch((error) => {
        this.logger.error('[OpenClawClient] Reconnection failed:', error);
      });
    }, actualDelay);
  }

  /**
   * Start ping interval for connection health
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, this.config.pingInterval);
  }

  /**
   * Set client state
   */
  private setState(newState: OpenClawClientState): void {
    const previousState = this.state;
    this.state = newState;

    if (previousState !== newState) {
      this.logger.info(`[OpenClawClient] State: ${previousState} → ${newState}`);

      // Notify state listeners
      for (const listener of this.stateListeners) {
        try {
          listener(newState, previousState);
        } catch (error) {
          this.logger.error('[OpenClawClient] State listener error:', error);
        }
      }
    }
  }

  /**
   * Generate unique ID for requests
   */
  private generateId(): string {
    return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Generate nonce for device pairing
   */
  private generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Sign device challenge
   */
  private signDeviceChallenge(deviceId: string): string {
    if (!this.config.deviceKeyPair) {
      return '';
    }

    const hmac = crypto.createHmac('sha256', this.config.deviceKeyPair.privateKey);
    hmac.update(deviceId);
    return hmac.digest('base64');
  }
}

/**
 * Factory function to create client
 */
export function createOpenClawClient(config: OpenClawClientConfig): OpenClawClient {
  return new OpenClawClient(config);
}
