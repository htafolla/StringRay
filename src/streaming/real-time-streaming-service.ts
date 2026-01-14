/**
 * StringRay Framework v1.0.0 - Real-Time Data Streaming Service
 *
 * Enterprise-grade real-time data streaming with WebSocket support,
 * buffering, compression, and connection management for performance dashboards.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";
import { IncomingMessage } from "http";
import * as zlib from "zlib";
import { performanceDashboard } from "../performance/performance-monitoring-dashboard.js";
import { enterpriseMonitoringSystem } from "../monitoring/enterprise-monitoring-system.js";

export interface StreamingConfig {
  port: number;
  path: string;
  maxConnections: number;
  heartbeatInterval: number;
  compression: boolean;
  bufferSize: number;
  retentionPeriod: number; // milliseconds
  authRequired: boolean;
  cors: {
    enabled: boolean;
    origins: string[];
  };
}

export interface StreamMessage {
  type: "metrics" | "alert" | "health" | "system" | "performance";
  timestamp: number;
  data: any;
  source: string;
  compressed?: boolean;
}

export interface ConnectionInfo {
  id: string;
  ip: string;
  userAgent: string | undefined;
  connectedAt: number;
  lastHeartbeat: number;
  subscriptions: string[];
  authenticated: boolean;
}

export interface StreamingStats {
  activeConnections: number;
  totalConnections: number;
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
  compressionRatio: number;
  uptime: number;
}

/**
 * Real-time data streaming service
 */
export class RealTimeStreamingService extends EventEmitter {
  private wss?: WebSocketServer;
  private config: StreamingConfig;
  private connections = new Map<
    string,
    { ws: WebSocket; info: ConnectionInfo }
  >();
  private messageBuffer: StreamMessage[] = [];
  private heartbeatTimer?: NodeJS.Timeout;
  private stats: StreamingStats;
  private startTime: number;

  constructor(config?: Partial<StreamingConfig>) {
    super();

    this.startTime = Date.now();
    this.config = {
      port: 8080,
      path: "/ws",
      maxConnections: 1000,
      heartbeatInterval: 30000, // 30 seconds
      compression: true,
      bufferSize: 1000,
      retentionPeriod: 300000, // 5 minutes
      authRequired: false,
      cors: {
        enabled: true,
        origins: ["*"],
      },
      ...config,
    };

    this.stats = {
      activeConnections: 0,
      totalConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      compressionRatio: 1.0,
      uptime: 0,
    };

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for monitoring systems
   */
  private setupEventHandlers(): void {
    // Performance monitoring events
    performanceDashboard.on("metrics-updated", (metrics: any) => {
      this.broadcastMessage({
        type: "performance",
        timestamp: Date.now(),
        data: metrics,
        source: "performance-dashboard",
      });
    });

    performanceDashboard.on("alert", (alert: any) => {
      this.broadcastMessage({
        type: "alert",
        timestamp: Date.now(),
        data: alert,
        source: "performance-dashboard",
      });
    });

    // Enterprise monitoring events
    enterpriseMonitoringSystem.on("metrics-collected", (data: any) => {
      this.broadcastMessage({
        type: "system",
        timestamp: Date.now(),
        data,
        source: "enterprise-monitor",
      });
    });

    enterpriseMonitoringSystem.on("alert-triggered", (alert: any) => {
      this.broadcastMessage({
        type: "alert",
        timestamp: Date.now(),
        data: alert,
        source: "enterprise-monitor",
      });
    });

    enterpriseMonitoringSystem.on("health-check-failed", (result: any) => {
      this.broadcastMessage({
        type: "health",
        timestamp: Date.now(),
        data: result,
        source: "enterprise-monitor",
      });
    });
  }

  /**
   * Start the WebSocket server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          port: this.config.port,
          path: this.config.path,
          maxPayload: 1024 * 1024, // 1MB max payload
          perMessageDeflate: this.config.compression,
        });

        this.wss.on("connection", this.handleConnection.bind(this));
        this.wss.on("error", (error: Error) => {
          console.error("WebSocket server error:", error);
          this.emit("error", error);
        });

        // Start heartbeat monitoring
        this.startHeartbeatMonitoring();

        // Start buffer cleanup
        this.startBufferCleanup();

        console.log(
          `🚀 Real-Time Streaming Service started on port ${this.config.port}`,
        );
        console.log(`   Path: ${this.config.path}`);
        console.log(`   Max Connections: ${this.config.maxConnections}`);
        console.log(
          `   Compression: ${this.config.compression ? "enabled" : "disabled"}`,
        );

        this.emit("started");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server
   */
  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null as any;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null as any;
    }

    this.connections.clear();
    this.messageBuffer.length = 0;

    console.log("🛑 Real-Time Streaming Service stopped");
    this.emit("stopped");
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const connectionId = this.generateConnectionId();
    const ip = this.getClientIP(request);

    const connectionInfo: ConnectionInfo = {
      id: connectionId,
      ip,
      userAgent: request.headers["user-agent"],
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      subscriptions: ["all"], // Default subscription to all messages
      authenticated: !this.config.authRequired,
    };

    this.connections.set(connectionId, { ws, info: connectionInfo });
    this.stats.activeConnections++;
    this.stats.totalConnections++;

    console.log(`🔗 New connection: ${connectionId} from ${ip}`);

    // Send welcome message
    this.sendToConnection(connectionId, {
      type: "system",
      timestamp: Date.now(),
      data: {
        type: "welcome",
        connectionId,
        serverTime: Date.now(),
        config: {
          compression: this.config.compression,
          heartbeatInterval: this.config.heartbeatInterval,
        },
      },
      source: "streaming-service",
    });

    // Send recent buffered messages
    this.sendBufferedMessages(connectionId);

    // Setup connection event handlers
    ws.on("message", (data) => this.handleMessage(connectionId, data));
    ws.on("close", () => this.handleDisconnection(connectionId));
    ws.on("error", (error) => this.handleConnectionError(connectionId, error));
    ws.on("pong", () => {
      connectionInfo.lastHeartbeat = Date.now();
    });

    this.emit("connection", connectionInfo);
  }

  /**
   * Handle incoming message from client
   */
  private handleMessage(connectionId: string, data: WebSocket.Data): void {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      let message: any;
      if (Buffer.isBuffer(data)) {
        // Handle compressed data
        if (this.config.compression) {
          message = JSON.parse(zlib.gunzipSync(data).toString());
        } else {
          message = JSON.parse(data.toString());
        }
      } else {
        message = JSON.parse(data.toString());
      }

      this.stats.messagesReceived++;
      this.stats.bytesReceived += Buffer.isBuffer(data)
        ? data.length
        : data.toString().length;

      // Handle different message types
      switch (message.type) {
        case "subscribe":
          this.handleSubscription(connectionId, message.channels);
          break;
        case "unsubscribe":
          this.handleUnsubscription(connectionId, message.channels);
          break;
        case "heartbeat":
          connection.info.lastHeartbeat = Date.now();
          break;
        case "ping":
          this.sendToConnection(connectionId, {
            type: "system",
            timestamp: Date.now(),
            data: { type: "pong", timestamp: Date.now() },
            source: "streaming-service",
          });
          break;
        default:
          this.emit("message", { connectionId, message });
      }
    } catch (error) {
      console.error(`Error handling message from ${connectionId}:`, error);
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      console.log(
        `🔌 Disconnection: ${connectionId} from ${connection.info.ip}`,
      );
      this.connections.delete(connectionId);
      this.stats.activeConnections--;
      this.emit("disconnection", connection.info);
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(connectionId: string, error: Error): void {
    console.error(`Connection error for ${connectionId}:`, error);
    this.handleDisconnection(connectionId);
  }

  /**
   * Handle subscription request
   */
  private handleSubscription(connectionId: string, channels: string[]): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.info.subscriptions = [
        ...new Set([...connection.info.subscriptions, ...channels]),
      ];
      console.log(`📡 ${connectionId} subscribed to: ${channels.join(", ")}`);
    }
  }

  /**
   * Handle unsubscription request
   */
  private handleUnsubscription(connectionId: string, channels: string[]): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.info.subscriptions = connection.info.subscriptions.filter(
        (sub) => !channels.includes(sub),
      );
      console.log(
        `📡 ${connectionId} unsubscribed from: ${channels.join(", ")}`,
      );
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcastMessage(message: StreamMessage): void {
    // Add to buffer
    this.messageBuffer.push(message);
    if (this.messageBuffer.length > this.config.bufferSize) {
      this.messageBuffer.shift(); // Remove oldest message
    }

    // Send to all connections
    for (const [connectionId, connection] of this.connections) {
      if (this.shouldSendToConnection(connection.info, message)) {
        this.sendToConnection(connectionId, message);
      }
    }

    this.emit("broadcast", message);
  }

  /**
   * Send message to specific connection
   */
  private sendToConnection(connectionId: string, message: StreamMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      let dataToSend: string | Buffer = JSON.stringify(message);

      // Compress if enabled
      if (this.config.compression && message.type !== "system") {
        const compressed = zlib.gzipSync(dataToSend);
        if (compressed.length < dataToSend.length) {
          dataToSend = compressed;
          message.compressed = true;
        }
      }

      connection.ws.send(dataToSend);
      this.stats.messagesSent++;
      this.stats.bytesSent += Buffer.isBuffer(dataToSend)
        ? dataToSend.length
        : dataToSend.length;
    } catch (error) {
      console.error(`Error sending message to ${connectionId}:`, error);
    }
  }

  /**
   * Send buffered messages to new connection
   */
  private sendBufferedMessages(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const cutoffTime = Date.now() - this.config.retentionPeriod;
    const recentMessages = this.messageBuffer.filter(
      (msg) => msg.timestamp > cutoffTime,
    );

    // Send recent messages in batches
    const batchSize = 10;
    for (let i = 0; i < recentMessages.length; i += batchSize) {
      const batch = recentMessages.slice(i, i + batchSize);
      this.sendToConnection(connectionId, {
        type: "system",
        timestamp: Date.now(),
        data: { type: "buffer", messages: batch },
        source: "streaming-service",
      });
    }
  }

  /**
   * Check if message should be sent to connection based on subscriptions
   */
  private shouldSendToConnection(
    info: ConnectionInfo,
    message: StreamMessage,
  ): boolean {
    return (
      info.subscriptions.includes("all") ||
      info.subscriptions.includes(message.type) ||
      info.subscriptions.includes(message.source)
    );
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const timeoutThreshold = now - this.config.heartbeatInterval * 2;

      for (const [connectionId, connection] of this.connections) {
        if (connection.info.lastHeartbeat < timeoutThreshold) {
          console.log(`💔 Heartbeat timeout for ${connectionId}`);
          connection.ws.close(1008, "Heartbeat timeout");
        } else {
          // Send ping
          connection.ws.ping();
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Start buffer cleanup
   */
  private startBufferCleanup(): void {
    setInterval(() => {
      const cutoffTime = Date.now() - this.config.retentionPeriod;
      const initialLength = this.messageBuffer.length;

      this.messageBuffer = this.messageBuffer.filter(
        (msg) => msg.timestamp > cutoffTime,
      );

      const removed = initialLength - this.messageBuffer.length;
      if (removed > 0) {
        console.log(`🧹 Cleaned up ${removed} old messages from buffer`);
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: IncomingMessage): string {
    const forwarded = request.headers["x-forwarded-for"] as string;
    if (forwarded) {
      return forwarded?.split(",")[0]?.trim() || "unknown";
    }

    const realIP = request.headers["x-real-ip"] as string;
    if (realIP) {
      return realIP;
    }

    return request.socket?.remoteAddress || "unknown";
  }

  /**
   * Get streaming service statistics
   */
  getStats(): StreamingStats {
    this.stats.uptime = Date.now() - this.startTime;

    // Calculate compression ratio
    if (this.stats.messagesSent > 0) {
      this.stats.compressionRatio =
        this.stats.bytesSent / (this.stats.messagesSent * 100); // Rough estimate
    }

    return { ...this.stats };
  }

  /**
   * Get active connections
   */
  getConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values()).map(({ info }) => ({
      ...info,
    }));
  }

  /**
   * Force disconnect a connection
   */
  disconnect(connectionId: string, code?: number, reason?: string): boolean {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.ws.close(code || 1000, reason || "Server disconnect");
      return true;
    }
    return false;
  }

  /**
   * Update configuration (hot-reload capable)
   */
  updateConfig(newConfig: Partial<StreamingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("⚙️ Streaming service configuration updated");
  }
}

// Export singleton instance
export const realTimeStreamingService = new RealTimeStreamingService();
