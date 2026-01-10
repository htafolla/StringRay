/**
 * StrRay Cross-Language Bridge v1.0.0
 *
 * JSON-RPC/WebSocket bridge for TypeScript-Python communication.
 * Enables TypeScript agents to access Python BaseAgent capabilities.
 *
 * @version 1.0.0
 * @since 2026-01-09
 */

import WebSocket from "ws";
import { EventEmitter } from "events";
import { frameworkLogger } from "./framework-logger.js";

export interface RPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

export interface RPCResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface RPCNotification {
  jsonrpc: "2.0";
  method: string;
  params?: any;
}

export interface BaseAgentCapabilities {
  // Codex compliance validation
  validateCodexCompliance(content: string, context: any): Promise<{
    compliant: boolean;
    violations: Array<{ term_id: string; message: string; severity: string }>;
    recommendations: string[];
  }>;

  // Advanced AI reasoning
  performDeepReasoning(query: string, context: any): Promise<{
    reasoning: string;
    confidence: number;
    recommendations: any[];
  }>;

  // State persistence
  persistAgentState(agentId: string, state: any): Promise<boolean>;
  loadAgentState(agentId: string): Promise<any>;

  // Performance monitoring
  getPerformanceMetrics(agentId: string): Promise<{
    responseTime: number;
    memoryUsage: number;
    errorRate: number;
  }>;

  // Security validation
  validateSecurity(content: string, operation: string): Promise<{
    safe: boolean;
    threats: string[];
    recommendations: string[];
  }>;
}

export class CrossLanguageBridge extends EventEmitter {
  private ws: WebSocket | null = null;
  private connected = false;
  private pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private requestId = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private pythonServerUrl = "ws://localhost:8765",
    private connectionTimeout = 5000
  ) {
    super();
    this.connect();
  }

  private async connect(): Promise<void> {
    if (this.connected) return;

    try {
      await frameworkLogger.log("cross-lang-bridge", `connecting to Python server: ${this.pythonServerUrl}`, "info");

      this.ws = new WebSocket(this.pythonServerUrl, {
        handshakeTimeout: this.connectionTimeout,
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.ws?.close();
          reject(new Error(`Connection timeout after ${this.connectionTimeout}ms`));
        }, this.connectionTimeout);

        this.ws!.on("open", () => {
          clearTimeout(timeout);
          this.connected = true;
          this.reconnectAttempts = 0;
          this.emit("connected");
          frameworkLogger.log("cross-lang-bridge", "connected to Python server", "success");
          resolve();
        });

        this.ws!.on("message", (data: Buffer) => {
          this.handleMessage(data);
        });

        this.ws!.on("error", (error) => {
          clearTimeout(timeout);
          frameworkLogger.log("cross-lang-bridge", `connection error: ${error.message}`, "error");
          reject(error);
        });

        this.ws!.on("close", () => {
          this.connected = false;
          this.emit("disconnected");
          frameworkLogger.log("cross-lang-bridge", "disconnected from Python server", "info");

          // Auto-reconnect if not manually closed
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect();
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
          }
        });
      });
    } catch (error) {
      frameworkLogger.log("cross-lang-bridge", `connection failed: ${(error as Error).message}`, "error");
      throw error;
    }
  }

  private handleMessage(data: Buffer): void {
    try {
      const message = JSON.parse(data.toString()) as RPCResponse | RPCNotification;

      if ("id" in message && message.id !== undefined && this.pendingRequests.has(message.id)) {
        // Handle RPC response
        const { resolve, reject, timeout } = this.pendingRequests.get(message.id)!;
        clearTimeout(timeout);
        this.pendingRequests.delete(message.id);

        if ("error" in message && message.error) {
          reject(new Error(`RPC Error ${message.error.code}: ${message.error.message}`));
        } else if ("result" in message) {
          resolve(message.result);
        }
      } else if ("method" in message) {
        // Handle incoming notifications/calls from Python
        this.emit("notification", message.method, message.params);
      }
    } catch (error) {
      frameworkLogger.log("cross-lang-bridge", `message handling error: ${(error as Error).message}`, "error");
    }
  }

  async sendRequest(method: string, params?: any, timeoutMs = 30000): Promise<any> {
    if (!this.connected) {
      await this.connect();
    }

    const id = ++this.requestId;
    const request: RPCRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`RPC request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      try {
        this.ws!.send(JSON.stringify(request));
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  // BaseAgent capability implementations
  async validateCodexCompliance(content: string, context: any): Promise<any> {
    return this.sendRequest("validateCodexCompliance", { content, context });
  }

  async performDeepReasoning(query: string, context: any): Promise<any> {
    return this.sendRequest("performDeepReasoning", { query, context });
  }

  async persistAgentState(agentId: string, state: any): Promise<boolean> {
    return this.sendRequest("persistAgentState", { agentId, state });
  }

  async loadAgentState(agentId: string): Promise<any> {
    return this.sendRequest("loadAgentState", { agentId });
  }

  async getPerformanceMetrics(agentId: string): Promise<any> {
    return this.sendRequest("getPerformanceMetrics", { agentId });
  }

  async validateSecurity(content: string, operation: string): Promise<any> {
    return this.sendRequest("validateSecurity", { content, operation });
  }

  // Utility methods
  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
    }
  }

  getConnectionStats() {
    return {
      connected: this.connected,
      pendingRequests: this.pendingRequests.size,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Singleton instance for framework-wide use
let bridgeInstance: CrossLanguageBridge | null = null;

export function getCrossLanguageBridge(): CrossLanguageBridge {
  if (!bridgeInstance) {
    bridgeInstance = new CrossLanguageBridge();
  }
  return bridgeInstance;
}

// Convenience function for TypeScript agents to access BaseAgent capabilities
export async function callBaseAgent(method: string, params: any = {}): Promise<any> {
  const bridge = getCrossLanguageBridge();
  return bridge.sendRequest(method, params);
}