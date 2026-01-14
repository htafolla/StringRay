/**
 * StringRay Framework v1.0.0 - Distributed Load Balancer
 *
 * Enterprise-grade load balancer with session affinity, health checks,
 * and auto-scaling capabilities for multi-instance deployments.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { IncomingMessage, ServerResponse } from "http";
import { DistributedStateManager, InstanceHealth } from "./state-manager";
import { EventEmitter } from "events";
import { CircuitBreakerRegistry } from "../circuit-breaker/circuit-breaker";
import { PredictiveScalingEngine } from "../scaling/predictive-scaling-engine";

export interface LoadBalancerConfig {
  port: number;
  algorithm:
    | "round-robin"
    | "least-connections"
    | "weighted-round-robin"
    | "session-affinity";
  healthCheckInterval: number;
  healthCheckTimeout: number;
  sessionAffinityCookie: string;
  maxRetries: number;
  failoverTimeout: number;
  enableAutoScaling: boolean;
  minInstances: number;
  maxInstances: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
}

export interface BackendInstance {
  id: string;
  host: string;
  port: number;
  weight: number;
  healthy: boolean;
  connections: number;
  lastHealthCheck: number;
  responseTime: number;
  failureCount: number;
}

export interface LoadBalancerStats {
  totalRequests: number;
  activeConnections: number;
  healthyInstances: number;
  unhealthyInstances: number;
  averageResponseTime: number;
  requestsPerSecond: number;
}

/**
 * Distributed Load Balancer - Routes traffic across StringRay instances
 */
export class DistributedLoadBalancer extends EventEmitter {
  private config: LoadBalancerConfig;
  private stateManager: DistributedStateManager;
  private instances = new Map<string, BackendInstance>();
  private currentIndex = 0;
  private healthCheckTimer?: NodeJS.Timeout;
  private stats: LoadBalancerStats;
  private requestHistory: number[] = [];
  private lastStatsUpdate = Date.now();
  private circuitBreakerRegistry: CircuitBreakerRegistry;
  private predictiveScalingEngine: PredictiveScalingEngine;

  constructor(
    config: Partial<LoadBalancerConfig> = {},
    stateManager: DistributedStateManager,
  ) {
    super();

    this.config = {
      port: 8080,
      algorithm: "session-affinity",
      healthCheckInterval: 5000,
      healthCheckTimeout: 3000,
      sessionAffinityCookie: "strray-session",
      maxRetries: 3,
      failoverTimeout: 10000,
      enableAutoScaling: true,
      minInstances: 2,
      maxInstances: 10,
      scaleUpThreshold: 80, // CPU usage %
      scaleDownThreshold: 20,
      ...config,
    };

    this.stateManager = stateManager;
    this.circuitBreakerRegistry = new CircuitBreakerRegistry({
      failureThreshold: 3,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000,
      timeout: this.config.healthCheckTimeout,
      name: "load-balancer",
    });
    this.predictiveScalingEngine = new PredictiveScalingEngine({
      predictionHorizon: 15,
      minConfidence: 0.7,
      scaleUpThreshold: this.config.scaleUpThreshold,
      scaleDownThreshold: this.config.scaleDownThreshold,
      cooldownPeriod: 5,
      maxScaleUp: Math.floor(
        (this.config.maxInstances - this.config.minInstances) / 2,
      ),
      maxScaleDown: 1,
      enableML: true,
      modelUpdateInterval: 24,
    });
    this.stats = {
      totalRequests: 0,
      activeConnections: 0,
      healthyInstances: 0,
      unhealthyInstances: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0,
    };

    this.initializeLoadBalancer();
  }

  private async initializeLoadBalancer(): Promise<void> {
    // Discover existing instances
    await this.discoverInstances();

    // Start health checks
    this.startHealthChecks();

    // Watch for instance changes
    this.watchInstanceChanges();

    console.log(
      `🔄 Load Balancer: Initialized with ${this.algorithm} algorithm on port ${this.config.port}`,
    );
  }

  /**
   * Handle incoming HTTP requests
   */
  async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const startTime = Date.now();
    this.stats.totalRequests++;
    this.stats.activeConnections++;

    try {
      const instance = await this.selectInstance(req);

      if (!instance) {
        this.sendError(res, 503, "No healthy instances available");
        return;
      }

      // Set session affinity cookie
      this.setSessionAffinityCookie(res, instance.id);

      // Proxy the request
      await this.proxyRequest(req, res, instance);

      const responseTime = Date.now() - startTime;
      this.updateInstanceStats(instance.id, responseTime);
    } catch (error) {
      console.error("❌ Load Balancer: Request handling failed:", error);
      this.sendError(res, 500, "Internal server error");
    } finally {
      this.stats.activeConnections--;
      this.updateStats();
    }
  }

  /**
   * Select backend instance based on algorithm
   */
  private async selectInstance(
    req: IncomingMessage,
  ): Promise<BackendInstance | null> {
    const healthyInstances = Array.from(this.instances.values()).filter(
      (instance) => instance.healthy,
    );

    if (healthyInstances.length === 0) {
      return null;
    }

    switch (this.config.algorithm) {
      case "round-robin":
        return this.selectRoundRobin(healthyInstances);

      case "least-connections":
        return this.selectLeastConnections(healthyInstances);

      case "weighted-round-robin":
        return this.selectWeightedRoundRobin(healthyInstances);

      case "session-affinity":
        return this.selectSessionAffinity(req, healthyInstances);

      default:
        return healthyInstances[0] || null;
    }
  }

  private selectRoundRobin(
    instances: BackendInstance[],
  ): BackendInstance | null {
    if (instances.length === 0) return null;
    const index = this.currentIndex % instances.length;
    const instance = instances[index];
    this.currentIndex = (this.currentIndex + 1) % instances.length;
    return instance || null;
  }

  private selectLeastConnections(
    instances: BackendInstance[],
  ): BackendInstance | null {
    if (instances.length === 0) return null;
    return instances.reduce((min, current) =>
      current.connections < min.connections ? current : min,
    );
  }

  private selectWeightedRoundRobin(
    instances: BackendInstance[],
  ): BackendInstance | null {
    if (instances.length === 0) return null;
    let totalWeight = instances.reduce(
      (sum, instance) => sum + instance.weight,
      0,
    );
    let random = Math.random() * totalWeight;

    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }

    return instances[0] || null;
  }

  private selectSessionAffinity(
    req: IncomingMessage,
    instances: BackendInstance[],
  ): BackendInstance | null {
    // Check for session affinity cookie
    const cookies = this.parseCookies(req);
    const sessionInstanceId = cookies[this.config.sessionAffinityCookie];

    if (sessionInstanceId) {
      const instance = instances.find((inst) => inst.id === sessionInstanceId);
      if (instance) {
        return instance;
      }
    }

    // Fallback to round-robin
    return this.selectRoundRobin(instances);
  }

  /**
   * Proxy request to backend instance with circuit breaker protection
   */
  private async proxyRequest(
    req: IncomingMessage,
    res: ServerResponse,
    instance: BackendInstance,
  ): Promise<void> {
    instance.connections++;

    try {
      const result = await this.circuitBreakerRegistry.execute(
        `proxy-${instance.id}`,
        async () => {
          // Create proxy request
          const http = await import("http");
          const url = require("url");

          const options = {
            hostname: instance.host,
            port: instance.port,
            path: req.url,
            method: req.method,
            headers: {
              ...req.headers,
              "X-Forwarded-For": req.socket.remoteAddress,
              "X-Forwarded-Proto": "http",
              "X-Real-IP": req.socket.remoteAddress,
            },
          };

          return new Promise<void>((resolve, reject) => {
            const proxyReq = http.request(options, (proxyRes) => {
              // Copy response headers
              Object.keys(proxyRes.headers).forEach((key) => {
                const value = proxyRes.headers[key];
                if (value) {
                  res.setHeader(key, value);
                }
              });

              res.statusCode = proxyRes.statusCode || 200;
              proxyRes.pipe(res);
              resolve();
            });

            proxyReq.on("error", reject);

            // Pipe request body
            req.pipe(proxyReq);
          });
        },
      );

      if (!result.success) {
        console.error(
          `❌ Load Balancer: Proxy error for ${instance.id}:`,
          result.error,
        );
        instance.failureCount++;
        this.sendError(res, 502, "Bad Gateway");
      }
    } finally {
      instance.connections--;
    }
  }

  /**
   * Health check all instances
   */
  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.instances.values()).map((instance) =>
      this.checkInstanceHealth(instance),
    );

    await Promise.allSettled(promises);
    this.updateHealthStats();
  }

  private async checkInstanceHealth(instance: BackendInstance): Promise<void> {
    const startTime = Date.now();

    const result = await this.circuitBreakerRegistry.execute(
      `health-check-${instance.id}`,
      async () => {
        const http = await import("http");

        const options = {
          hostname: instance.host,
          port: instance.port,
          path: "/api/status",
          method: "GET",
          timeout: this.config.healthCheckTimeout,
        };

        return new Promise<void>((resolve, reject) => {
          const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
              resolve();
            } else {
              reject(new Error(`Status code: ${res.statusCode}`));
            }
          });

          req.on("error", reject);
          req.on("timeout", () => reject(new Error("Timeout")));
          req.setTimeout(this.config.healthCheckTimeout, () => {
            req.destroy();
            reject(new Error("Timeout"));
          });

          req.end();
        });
      },
    );

    if (result.success) {
      // Health check successful
      instance.healthy = true;
      instance.failureCount = 0;
      instance.responseTime = Date.now() - startTime;
      instance.lastHealthCheck = Date.now();
    } else {
      console.warn(
        `⚠️ Load Balancer: Health check failed for ${instance.id}:`,
        result.error,
      );
      instance.failureCount++;
      instance.lastHealthCheck = Date.now();

      // Mark as unhealthy after consecutive failures
      if (instance.failureCount >= 3) {
        instance.healthy = false;
        this.emit("instanceUnhealthy", instance);
      }
    }
  }

  /**
   * Discover instances via distributed state
   */
  private async discoverInstances(): Promise<void> {
    try {
      const activeInstances = await this.stateManager.getActiveInstances();

      for (const health of activeInstances) {
        if (!this.instances.has(health.instanceId)) {
          const instance: BackendInstance = {
            id: health.instanceId,
            host: this.extractHostFromInstanceId(health.instanceId),
            port: 3000, // Default StringRay port
            weight: 1,
            healthy: health.status === "healthy",
            connections: 0,
            lastHealthCheck: health.lastHeartbeat,
            responseTime: 0,
            failureCount: 0,
          };

          this.instances.set(health.instanceId, instance);
          console.log(
            `🔍 Load Balancer: Discovered instance ${health.instanceId}`,
          );
        }
      }
    } catch (error) {
      console.error("❌ Load Balancer: Failed to discover instances:", error);
    }
  }

  /**
   * Watch for instance changes
   */
  private watchInstanceChanges(): void {
    // Watch for new instances joining
    this.stateManager.watch("instances:join", (instanceData: any) => {
      if (instanceData && !this.instances.has(instanceData.id)) {
        const instance: BackendInstance = {
          id: instanceData.id,
          host: instanceData.host,
          port: instanceData.port || 3000,
          weight: instanceData.weight || 1,
          healthy: true,
          connections: 0,
          lastHealthCheck: Date.now(),
          responseTime: 0,
          failureCount: 0,
        };

        this.instances.set(instanceData.id, instance);
        console.log(`➕ Load Balancer: Instance joined: ${instanceData.id}`);
      }
    });

    // Watch for instances leaving
    this.stateManager.watch("instances:leave", (instanceId: string) => {
      if (this.instances.has(instanceId)) {
        this.instances.delete(instanceId);
        console.log(`➖ Load Balancer: Instance left: ${instanceId}`);
      }
    });
  }

  /**
   * Auto-scaling logic with ML-based predictions
   */
  private async checkAutoScaling(): Promise<void> {
    if (!this.config.enableAutoScaling) return;

    const instances = await this.stateManager.getActiveInstances();
    const currentInstanceCount = instances.length;

    // Record current metrics for ML training
    const avgLoad =
      instances.reduce((sum, inst) => sum + inst.loadFactor, 0) /
      instances.length;
    const avgResponseTime = this.stats.averageResponseTime;
    const requestRate = this.stats.requestsPerSecond;

    this.predictiveScalingEngine.recordMetrics({
      timestamp: Date.now(),
      cpuUtilization: avgLoad * 100, // Convert to percentage
      memoryUtilization: 60, // Placeholder - would need actual memory metrics
      requestRate: requestRate,
      responseTime: avgResponseTime,
      activeConnections: this.stats.activeConnections,
      errorRate: 0, // Placeholder - would need actual error metrics
    });

    // Get ML-based scaling prediction
    const prediction =
      await this.predictiveScalingEngine.generatePrediction(
        currentInstanceCount,
      );

    // Execute scaling based on ML prediction
    if (prediction.scalingAction !== "maintain") {
      const success = await this.predictiveScalingEngine.executeScaling(
        prediction,
        currentInstanceCount,
      );

      if (success) {
        if (prediction.scalingAction === "scale_up") {
          console.log(
            `📈 Load Balancer: ML-based scale up to ${prediction.recommendedInstances} instances`,
          );
          console.log(
            `   Reason: ${prediction.reason} (confidence: ${(prediction.confidence * 100).toFixed(1)}%)`,
          );
          await this.scaleUp();
        } else if (prediction.scalingAction === "scale_down") {
          console.log(
            `📉 Load Balancer: ML-based scale down to ${prediction.recommendedInstances} instances`,
          );
          console.log(
            `   Reason: ${prediction.reason} (confidence: ${(prediction.confidence * 100).toFixed(1)}%)`,
          );
          await this.scaleDown();
        }
      }
    }
  }

  private async scaleUp(): Promise<void> {
    // This would integrate with container orchestration (Kubernetes, Docker Swarm, etc.)
    // For now, emit event for external scaling
    this.emit("scaleUp");
  }

  private async scaleDown(): Promise<void> {
    // This would integrate with container orchestration
    this.emit("scaleDown");
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
      await this.checkAutoScaling();
    }, this.config.healthCheckInterval);
  }

  private updateInstanceStats(instanceId: string, responseTime: number): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.responseTime = (instance.responseTime + responseTime) / 2; // Rolling average
    }
  }

  private updateHealthStats(): void {
    const healthy = Array.from(this.instances.values()).filter(
      (inst) => inst.healthy,
    ).length;
    const unhealthy = this.instances.size - healthy;

    this.stats.healthyInstances = healthy;
    this.stats.unhealthyInstances = unhealthy;
  }

  private updateStats(): void {
    const now = Date.now();
    const timeDiff = (now - this.lastStatsUpdate) / 1000; // seconds

    // Calculate requests per second
    this.requestHistory.push(now);
    this.requestHistory = this.requestHistory.filter(
      (time) => now - time < 60000,
    ); // Last minute
    this.stats.requestsPerSecond = this.requestHistory.length / 60;

    this.lastStatsUpdate = now;
  }

  private setSessionAffinityCookie(
    res: ServerResponse,
    instanceId: string,
  ): void {
    res.setHeader(
      "Set-Cookie",
      `${this.config.sessionAffinityCookie}=${instanceId}; Path=/; HttpOnly`,
    );
  }

  private parseCookies(req: IncomingMessage): Record<string, string> {
    const cookies: Record<string, string> = {};
    const cookieHeader = req.headers.cookie;

    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [name, value] = cookie.trim().split("=");
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      });
    }

    return cookies;
  }

  private sendError(
    res: ServerResponse,
    statusCode: number,
    message: string,
  ): void {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ error: message, timestamp: new Date().toISOString() }),
    );
  }

  private extractHostFromInstanceId(instanceId: string): string {
    // Extract host from instance ID (would be more sophisticated in real implementation)
    // For now, assume localhost for all instances
    return "localhost";
  }

  /**
   * Get load balancer statistics
   */
  getStats(): LoadBalancerStats {
    return { ...this.stats };
  }

  /**
   * Get all backend instances
   */
  getInstances(): BackendInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Manually add backend instance
   */
  addInstance(
    instance: Omit<
      BackendInstance,
      "connections" | "lastHealthCheck" | "responseTime" | "failureCount"
    >,
  ): void {
    const fullInstance: BackendInstance = {
      ...instance,
      connections: 0,
      lastHealthCheck: Date.now(),
      responseTime: 0,
      failureCount: 0,
    };

    this.instances.set(instance.id, fullInstance);
  }

  /**
   * Manually remove backend instance
   */
  removeInstance(instanceId: string): void {
    this.instances.delete(instanceId);
  }

  /**
   * Shutdown load balancer
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Shutdown predictive scaling engine
    await this.predictiveScalingEngine.shutdown();

    console.log("🛑 Load Balancer: Shutdown complete");
  }

  get algorithm(): string {
    return this.config.algorithm;
  }
}

// Factory function
export const createDistributedLoadBalancer = (
  config: Partial<LoadBalancerConfig> = {},
  stateManager: DistributedStateManager,
): DistributedLoadBalancer => {
  return new DistributedLoadBalancer(config, stateManager);
};
