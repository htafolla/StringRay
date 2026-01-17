/**
 * StringRay AI v1.0.27 - WebSocket Gateway
 *
 * Enhanced WebSocket gateway for real-time performance dashboards.
 * Provides dashboard-specific WebSocket functionality with authentication,
 * subscription management, and real-time data streaming.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { EventEmitter } from "events";
import WebSocket from "ws";
import { IncomingMessage } from "http";
import * as zlib from "zlib";
import { realTimeStreamingService } from "../streaming/real-time-streaming-service.js";
import {
  liveMetricsCollector,
  CollectedMetric,
} from "./live-metrics-collector.js";
import { alertEngine, Alert } from "./alert-engine.js";

export interface DashboardConnection {
  id: string;
  ws: WebSocket;
  authenticated: boolean;
  userId?: string;
  permissions: string[];
  subscriptions: DashboardSubscription[];
  heartbeat: number;
  connectedAt: number;
  metadata: Record<string, any>;
}

export interface DashboardSubscription {
  id: string;
  type: "metrics" | "alerts" | "system" | "performance" | "custom";
  filters: {
    metricPattern?: string;
    sourcePattern?: string;
    severity?: string[];
    tags?: Record<string, string>;
  };
  throttleMs?: number;
  lastSent?: number;
}

export interface DashboardMessage {
  type:
    | "subscribe"
    | "unsubscribe"
    | "auth"
    | "ping"
    | "metrics"
    | "alert"
    | "system";
  id?: string;
  data: any;
  timestamp: number;
  compressed?: boolean;
}

export interface WebSocketGatewayConfig {
  enabled: boolean;
  port: number;
  path: string;
  maxConnections: number;
  heartbeatInterval: number;
  compressionEnabled: boolean;
  authRequired: boolean;
  corsEnabled: boolean;
  corsOrigins: string[];
  rateLimit: {
    enabled: boolean;
    maxMessagesPerMinute: number;
  };
  bufferSize: number;
  retentionPeriod: number;
}

export interface GatewayStats {
  activeConnections: number;
  totalConnections: number;
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
  compressionRatio: number;
  uptime: number;
  subscriptionsActive: number;
}

/**
 * WebSocket gateway for real-time dashboard communication
 */
export class WebSocketGateway extends EventEmitter {
  private config: WebSocketGatewayConfig;
  private connections = new Map<string, DashboardConnection>();
  private messageRates = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private stats: GatewayStats;
  private startTime: number;
  private isRunning = false;

  constructor(config?: Partial<WebSocketGatewayConfig>) {
    super();

    this.startTime = Date.now();
    this.config = {
      enabled: true,
      port: 8081,
      path: "/dashboard-ws",
      maxConnections: 500,
      heartbeatInterval: 30000,
      compressionEnabled: true,
      authRequired: false,
      corsEnabled: true,
      corsOrigins: ["*"],
      rateLimit: {
        enabled: true,
        maxMessagesPerMinute: 60,
      },
      bufferSize: 1000,
      retentionPeriod: 300000,
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
      subscriptionsActive: 0,
    };

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for data sources
   */
  private setupEventHandlers(): void {
    // Metrics collector events
    liveMetricsCollector.on("metric-collected", (metric: CollectedMetric) => {
      this.broadcastMetric(metric);
    });

    liveMetricsCollector.on("metrics-batch", (metrics: CollectedMetric[]) => {
      for (const metric of metrics) {
        this.broadcastMetric(metric);
      }
    });

    // Alert engine events
    alertEngine.on("alert-triggered", (alert: Alert) => {
      this.broadcastAlert(alert);
    });

    alertEngine.on("alert-acknowledged", (alert: Alert) => {
      this.broadcastAlertUpdate(alert);
    });

    alertEngine.on("alert-resolved", (alert: Alert) => {
      this.broadcastAlertUpdate(alert);
    });

    // Real-time streaming events (fallback)
    realTimeStreamingService.on("message", (data: any) => {
      this.handleStreamingMessage(data);
    });
  }

  /**
   * Start the WebSocket gateway
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    // WebSocket gateway startup - kept as console.log for user visibility
    // Port configuration - kept as console.log for user visibility
    // Path configuration - kept as console.log for user visibility
    // Max connections - kept as console.log for user visibility
    // Auth configuration - kept as console.log for user visibility
    // Compression config - kept as console.log for user visibility

    // Start the underlying streaming service if not already running
    await realTimeStreamingService.start();

    this.isRunning = true;
    this.startHeartbeatMonitoring();
    this.startRateLimitCleanup();

    this.emit("started");
  }

  /**
   * Stop the WebSocket gateway
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.connections.clear();
    this.messageRates.clear();

    // WebSocket gateway stop - kept as console.log for user visibility
    this.emit("stopped");
  }

  /**
   * Handle new dashboard connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const connectionId = `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const connection: DashboardConnection = {
      id: connectionId,
      ws,
      authenticated: !this.config.authRequired,
      permissions: ["read"],
      subscriptions: [],
      heartbeat: Date.now(),
      connectedAt: Date.now(),
      metadata: {},
    };

    this.connections.set(connectionId, connection);
    this.stats.activeConnections++;
    this.stats.totalConnections++;

    await frameworkLogger.log(
      "websocket-gateway",
      "dashboard-connected",
      "info",
      { connectionId },
    );

    // Send welcome message
    this.sendToConnection(connectionId, {
      type: "system",
      data: {
        type: "welcome",
        connectionId,
        serverTime: Date.now(),
        config: {
          compression: this.config.compressionEnabled,
          heartbeatInterval: this.config.heartbeatInterval,
          authRequired: this.config.authRequired,
        },
      },
      timestamp: Date.now(),
    });

    // Setup connection event handlers
    ws.on("message", (data) => this.handleMessage(connectionId, data));
    ws.on("close", () => this.handleDisconnection(connectionId));
    ws.on("error", (error) => this.handleConnectionError(connectionId, error));
    ws.on("pong", () => {
      connection.heartbeat = Date.now();
    });

    this.emit("connection", connection);
  }

  /**
   * Handle incoming message from dashboard client
   */
  private handleMessage(connectionId: string, data: WebSocket.Data): void {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      // Check rate limit
      if (this.config.rateLimit.enabled && !this.checkRateLimit(connectionId)) {
        this.sendToConnection(connectionId, {
          type: "system",
          data: { type: "error", message: "Rate limit exceeded" },
          timestamp: Date.now(),
        });
        return;
      }

      let message: DashboardMessage;
      if (Buffer.isBuffer(data)) {
        if (this.config.compressionEnabled) {
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
          this.handleSubscription(connectionId, message);
          break;
        case "unsubscribe":
          this.handleUnsubscription(connectionId, message);
          break;
        case "auth":
          this.handleAuthentication(connectionId, message);
          break;
        case "ping":
          this.sendToConnection(connectionId, {
            type: "system",
            data: { type: "pong", timestamp: message.timestamp },
            timestamp: Date.now(),
          });
          break;
        default:
          this.emit("message", { connectionId, message });
      }
    } catch (error) {
      console.error(
        `Error handling dashboard message from ${connectionId}:`,
        error,
      );
      this.sendToConnection(connectionId, {
        type: "system",
        data: { type: "error", message: "Invalid message format" },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      await frameworkLogger.log(
        "websocket-gateway",
        "dashboard-disconnected",
        "info",
        { connectionId },
      );
      this.connections.delete(connectionId);
      this.stats.activeConnections--;
      this.stats.subscriptionsActive -= connection.subscriptions.length;
      this.emit("disconnection", connection);
    }
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(connectionId: string, error: Error): void {
    console.error(`Dashboard connection error for ${connectionId}:`, error);
    this.handleDisconnection(connectionId);
  }

  /**
   * Handle subscription request
   */
  private handleSubscription(
    connectionId: string,
    message: DashboardMessage,
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const subscription: DashboardSubscription = {
      id: message.id || `sub_${Date.now()}`,
      type: message.data.type || "metrics",
      filters: message.data.filters || {},
      throttleMs: message.data.throttleMs,
    };

    // Remove existing subscription with same ID
    connection.subscriptions = connection.subscriptions.filter(
      (s) => s.id !== subscription.id,
    );
    connection.subscriptions.push(subscription);
    this.stats.subscriptionsActive++;

    await frameworkLogger.log(
      "websocket-gateway",
      "dashboard-subscribed",
      "info",
      { connectionId, channelsCount: channels.length },
    );

    this.sendToConnection(connectionId, {
      type: "system",
      data: {
        type: "subscription-confirmed",
        subscriptionId: subscription.id,
        subscription: subscription,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle unsubscription request
   */
  private handleUnsubscription(
    connectionId: string,
    message: DashboardMessage,
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const subscriptionId = message.data.subscriptionId;
    const initialLength = connection.subscriptions.length;
    connection.subscriptions = connection.subscriptions.filter(
      (s) => s.id !== subscriptionId,
    );
    const removed = initialLength - connection.subscriptions.length;

    if (removed > 0) {
      this.stats.subscriptionsActive -= removed;
      console.log(
        `📡 Dashboard ${connectionId} unsubscribed from ${subscriptionId}`,
      );
    }
  }

  /**
   * Handle authentication
   */
  private handleAuthentication(
    connectionId: string,
    message: DashboardMessage,
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Basic authentication (extend as needed)
    const { token, userId } = message.data;
    const isValid = this.validateAuthToken(token);

    if (isValid) {
      connection.authenticated = true;
      connection.userId = userId;
      connection.permissions = ["read", "write"]; // Based on user roles

      this.sendToConnection(connectionId, {
        type: "system",
        data: {
          type: "auth-success",
          userId,
          permissions: connection.permissions,
        },
        timestamp: Date.now(),
      });
    } else {
      this.sendToConnection(connectionId, {
        type: "system",
        data: { type: "auth-failed", message: "Invalid authentication token" },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Validate authentication token (placeholder implementation)
   */
  private validateAuthToken(token: string): boolean {
    // Implement proper token validation logic
    return !!(token && token.length > 10); // Basic check
  }

  /**
   * Check rate limit for connection
   */
  private checkRateLimit(connectionId: string): boolean {
    const now = Date.now();
    const rateData = this.messageRates.get(connectionId);

    if (!rateData) {
      this.messageRates.set(connectionId, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (now > rateData.resetTime) {
      rateData.count = 1;
      rateData.resetTime = now + 60000;
      return true;
    }

    if (rateData.count >= this.config.rateLimit.maxMessagesPerMinute) {
      return false;
    }

    rateData.count++;
    return true;
  }

  /**
   * Broadcast metric to subscribed dashboard connections
   */
  private broadcastMetric(metric: CollectedMetric): void {
    for (const [connectionId, connection] of this.connections) {
      if (this.shouldSendMetricToConnection(connection, metric)) {
        this.sendToConnection(connectionId, {
          type: "metrics",
          data: metric,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Broadcast alert to subscribed dashboard connections
   */
  private broadcastAlert(alert: Alert): void {
    for (const [connectionId, connection] of this.connections) {
      if (this.shouldSendAlertToConnection(connection, alert)) {
        this.sendToConnection(connectionId, {
          type: "alert",
          data: alert,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Broadcast alert update to subscribed dashboard connections
   */
  private broadcastAlertUpdate(alert: Alert): void {
    for (const [connectionId, connection] of this.connections) {
      if (this.shouldSendAlertToConnection(connection, alert)) {
        this.sendToConnection(connectionId, {
          type: "alert",
          data: { ...alert, update: true },
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Check if metric should be sent to connection
   */
  private shouldSendMetricToConnection(
    connection: DashboardConnection,
    metric: CollectedMetric,
  ): boolean {
    if (!connection.authenticated && this.config.authRequired) return false;

    const relevantSubscriptions = connection.subscriptions.filter(
      (sub) =>
        sub.type === "metrics" ||
        sub.type === "performance" ||
        sub.type === "system",
    );

    if (relevantSubscriptions.length === 0) return false;

    for (const subscription of relevantSubscriptions) {
      if (this.matchesSubscriptionFilters(subscription, metric)) {
        // Check throttling
        if (subscription.throttleMs && subscription.lastSent) {
          const timeSinceLast = Date.now() - subscription.lastSent;
          if (timeSinceLast < subscription.throttleMs) {
            return false;
          }
        }
        subscription.lastSent = Date.now();
        return true;
      }
    }

    return false;
  }

  /**
   * Check if alert should be sent to connection
   */
  private shouldSendAlertToConnection(
    connection: DashboardConnection,
    alert: Alert,
  ): boolean {
    if (!connection.authenticated && this.config.authRequired) return false;

    const relevantSubscriptions = connection.subscriptions.filter(
      (sub) => sub.type === "alerts" || sub.type === "system",
    );

    if (relevantSubscriptions.length === 0) return false;

    for (const subscription of relevantSubscriptions) {
      if (this.matchesAlertSubscriptionFilters(subscription, alert)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if metric matches subscription filters
   */
  private matchesSubscriptionFilters(
    subscription: DashboardSubscription,
    metric: CollectedMetric,
  ): boolean {
    // Check metric pattern
    if (subscription.filters.metricPattern) {
      const pattern = new RegExp(subscription.filters.metricPattern);
      if (!pattern.test(metric.name)) return false;
    }

    // Check source pattern
    if (subscription.filters.sourcePattern) {
      const pattern = new RegExp(subscription.filters.sourcePattern);
      if (!pattern.test(metric.sourceId)) return false;
    }

    // Check tags
    if (subscription.filters.tags) {
      for (const [key, value] of Object.entries(subscription.filters.tags)) {
        if (metric.tags[key] !== value) return false;
      }
    }

    return true;
  }

  /**
   * Check if alert matches subscription filters
   */
  private matchesAlertSubscriptionFilters(
    subscription: DashboardSubscription,
    alert: Alert,
  ): boolean {
    // Check severity filter
    if (
      subscription.filters.severity &&
      subscription.filters.severity.length > 0
    ) {
      if (!subscription.filters.severity.includes(alert.severity)) return false;
    }

    // Check tags
    if (subscription.filters.tags) {
      for (const [key, value] of Object.entries(subscription.filters.tags)) {
        if (alert.tags[key] !== value) return false;
      }
    }

    return true;
  }

  /**
   * Send message to specific connection
   */
  private sendToConnection(
    connectionId: string,
    message: DashboardMessage,
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      let dataToSend: string | Buffer = JSON.stringify(message);

      // Compress if enabled
      if (this.config.compressionEnabled && message.type !== "system") {
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
      console.error(
        `Error sending message to dashboard ${connectionId}:`,
        error,
      );
    }
  }

  /**
   * Handle streaming message (fallback)
   */
  private handleStreamingMessage(data: any): void {
    // Process messages from the general streaming service
    if (data.message?.type === "metrics" || data.message?.type === "alert") {
      // Forward to dashboard connections if needed
      this.emit("streaming-message", data);
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    setInterval(() => {
      const now = Date.now();
      const timeoutThreshold = now - this.config.heartbeatInterval * 2;

      for (const [connectionId, connection] of this.connections) {
        if (connection.heartbeat < timeoutThreshold) {
          console.log(`💔 Dashboard heartbeat timeout for ${connectionId}`);
          connection.ws.close(1008, "Heartbeat timeout");
        } else {
          connection.ws.ping();
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Start rate limit cleanup
   */
  private startRateLimitCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [connectionId, rateData] of this.messageRates) {
        if (now > rateData.resetTime) {
          this.messageRates.delete(connectionId);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Get gateway statistics
   */
  getStats(): GatewayStats {
    this.stats.uptime = Date.now() - this.startTime;

    // Calculate compression ratio
    if (this.stats.messagesSent > 0) {
      this.stats.compressionRatio =
        this.stats.bytesSent / (this.stats.messagesSent * 100);
    }

    return { ...this.stats };
  }

  /**
   * Get active dashboard connections
   */
  getConnections(): DashboardConnection[] {
    return Array.from(this.connections.values()).map((conn) => ({ ...conn }));
  }

  /**
   * Force disconnect a dashboard connection
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
   * Send message to all dashboard connections
   */
  broadcast(message: DashboardMessage): void {
    for (const connectionId of this.connections.keys()) {
      this.sendToConnection(connectionId, message);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<WebSocketGatewayConfig>): void {
    this.config = { ...this.config, ...newConfig };
    await frameworkLogger.log("websocket-gateway", "config-updated", "info");
    this.emit("config-updated", { ...this.config });
  }
}

// Export singleton instance
export const webSocketGateway = new WebSocketGateway();
