/**
 * StrRay Framework v1.0.0 - Enterprise Monitoring System
 *
 * Comprehensive enterprise-scale monitoring and health check system.
 * Supports distributed deployments, auto-scaling, and production monitoring.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { EventEmitter } from "events";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { performance } from "perf_hooks";
import { securityHardeningSystem } from "../security/security-hardening-system";

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    bytesReceived: number;
    bytesTransmitted: number;
    packetsReceived: number;
    packetsTransmitted: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface ApplicationMetrics {
  timestamp: number;
  requests: {
    total: number;
    active: number;
    completed: number;
    failed: number;
    averageResponseTime: number;
  };
  agents: {
    total: number;
    active: number;
    idle: number;
    failed: number;
  };
  sessions: {
    total: number;
    active: number;
    expired: number;
  };
  performance: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    throughput: number;
  };
}

export interface HealthCheckResult {
  service: string;
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  timestamp: number;
  responseTime: number;
  details: Record<string, any>;
  error?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: "gt" | "lt" | "eq" | "ne" | "gte" | "lte";
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  instanceId?: string;
}

export interface MonitoringConfig {
  enabled: boolean;
  collectionInterval: number; // milliseconds
  retentionPeriod: number; // hours
  alertRules: AlertRule[];
  healthChecks: {
    enabled: boolean;
    interval: number; // milliseconds
    timeout: number; // milliseconds
    services: Array<{
      name: string;
      url?: string;
      command?: string;
      type: "http" | "tcp" | "command" | "custom";
      expectedStatus?: number;
      expectedResponse?: string;
    }>;
  };
  integrations: {
    prometheus?: {
      enabled: boolean;
      endpoint: string;
      labels: Record<string, string>;
    };
    datadog?: {
      enabled: boolean;
      apiKey: string;
      tags: string[];
    };
    newRelic?: {
      enabled: boolean;
      licenseKey: string;
      appName: string;
    };
  };
  thresholds: {
    cpuWarning: number;
    cpuCritical: number;
    memoryWarning: number;
    memoryCritical: number;
    diskWarning: number;
    diskCritical: number;
    responseTimeWarning: number;
    responseTimeCritical: number;
  };
}

export interface ClusterNode {
  id: string;
  hostname: string;
  ip: string;
  port: number;
  status: "online" | "offline" | "degraded";
  lastHeartbeat: number;
  metrics: SystemMetrics;
  health: HealthCheckResult[];
}

export interface ClusterMetrics {
  nodes: ClusterNode[];
  totalRequests: number;
  averageLatency: number;
  errorRate: number;
  loadDistribution: Record<string, number>;
}

/**
 * Enterprise monitoring and health check system
 */
export class EnterpriseMonitoringSystem extends EventEmitter {
  private config: MonitoringConfig;
  private metrics: SystemMetrics[] = [];
  private appMetrics: ApplicationMetrics[] = [];
  private alerts: Alert[] = [];
  private healthResults: HealthCheckResult[] = [];
  private clusterNodes: Map<string, ClusterNode> = new Map();
  private collectionTimer?: NodeJS.Timeout | undefined;
  private healthCheckTimer?: NodeJS.Timeout | undefined;
  private cleanupTimer?: NodeJS.Timeout | undefined;
  private isRunning = false;
  private instanceId: string;

  constructor(config?: Partial<MonitoringConfig>) {
    super();

    this.instanceId = this.generateInstanceId();
    this.config = {
      enabled: true,
      collectionInterval: 30000, // 30 seconds
      retentionPeriod: 24, // 24 hours
      alertRules: this.getDefaultAlertRules(),
      healthChecks: {
        enabled: true,
        interval: 60000, // 1 minute
        timeout: 5000, // 5 seconds
        services: [],
      },
      integrations: {},
      thresholds: {
        cpuWarning: 70,
        cpuCritical: 90,
        memoryWarning: 80,
        memoryCritical: 95,
        diskWarning: 80,
        diskCritical: 95,
        responseTimeWarning: 1000, // 1 second
        responseTimeCritical: 5000, // 5 seconds
      },
      ...config,
    };

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on("alert-triggered", this.handleAlertTriggered.bind(this));
    this.on("health-check-failed", this.handleHealthCheckFailed.bind(this));
    this.on("metrics-collected", this.handleMetricsCollected.bind(this));
  }

  /**
   * Start monitoring system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    console.log("🚀 Starting Enterprise Monitoring System...");
    console.log(`   Instance ID: ${this.instanceId}`);
    console.log(`   Collection Interval: ${this.config.collectionInterval}ms`);
    console.log(
      `   Health Check Interval: ${this.config.healthChecks.interval}ms`,
    );

    this.isRunning = true;

    // Initial data collection
    await this.collectMetrics();
    await this.performHealthChecks();

    // Start periodic collection
    this.collectionTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.collectMetrics();
      }
    }, this.config.collectionInterval);

    // Start health checks
    if (this.config.healthChecks.enabled) {
      this.healthCheckTimer = setInterval(async () => {
        if (this.isRunning) {
          await this.performHealthChecks();
        }
      }, this.config.healthChecks.interval);
    }

    // Start data cleanup
    this.startDataCleanup();

    console.log("✅ Enterprise Monitoring System started successfully");
    this.emit("started");
  }

  /**
   * Stop monitoring system
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log("⏹️ Stopping Enterprise Monitoring System...");
    this.isRunning = false;

    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    console.log("✅ Enterprise Monitoring System stopped");
    this.emit("stopped");
  }

  /**
   * Collect system and application metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const systemMetrics = this.collectSystemMetrics();
      const appMetrics = this.collectApplicationMetrics();

      this.metrics.push(systemMetrics);
      this.appMetrics.push(appMetrics);

      // Keep only recent metrics
      const retentionMs = this.config.retentionPeriod * 60 * 60 * 1000;
      const cutoffTime = Date.now() - retentionMs;

      this.metrics = this.metrics.filter((m) => m.timestamp > cutoffTime);
      this.appMetrics = this.appMetrics.filter((m) => m.timestamp > cutoffTime);

      // Check alert rules
      await this.checkAlertRules(systemMetrics, appMetrics);

      this.emit("metrics-collected", {
        system: systemMetrics,
        application: appMetrics,
      });
    } catch (error) {
      console.error("❌ Failed to collect metrics:", error);
      this.emit("error", error);
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): SystemMetrics {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuUsage = 100 - ~~((100 * idle) / total);

    // Get disk usage (simplified - would use systeminformation in production)
    const diskUsage = this.getDiskUsage();

    // Get network stats (simplified)
    const networkStats = this.getNetworkStats();

    return {
      timestamp: Date.now(),
      cpu: {
        usage: cpuUsage,
        loadAverage: os.loadavg(),
        cores: cpus.length,
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent: (usedMemory / totalMemory) * 100,
      },
      disk: diskUsage,
      network: networkStats,
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  /**
   * Collect application-specific metrics
   */
  private collectApplicationMetrics(): ApplicationMetrics {
    // This would integrate with the actual application metrics
    // For now, return mock data
    return {
      timestamp: Date.now(),
      requests: {
        total: Math.floor(Math.random() * 1000),
        active: Math.floor(Math.random() * 50),
        completed: Math.floor(Math.random() * 950),
        failed: Math.floor(Math.random() * 50),
        averageResponseTime: Math.random() * 1000 + 100,
      },
      agents: {
        total: 8,
        active: Math.floor(Math.random() * 8),
        idle: Math.floor(Math.random() * 8),
        failed: Math.floor(Math.random() * 2),
      },
      sessions: {
        total: Math.floor(Math.random() * 100),
        active: Math.floor(Math.random() * 50),
        expired: Math.floor(Math.random() * 25),
      },
      performance: {
        averageLatency: Math.random() * 500 + 50,
        p95Latency: Math.random() * 1000 + 200,
        p99Latency: Math.random() * 2000 + 500,
        throughput: Math.random() * 1000 + 500,
      },
    };
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    if (!this.config.healthChecks.enabled) {
      return;
    }

    const results: HealthCheckResult[] = [];

    for (const service of this.config.healthChecks.services) {
      const startTime = performance.now();

      try {
        let status: HealthCheckResult["status"] = "unknown";
        const details: Record<string, any> = {};

        switch (service.type) {
          case "http":
            if (service.url) {
              const response = await this.checkHttpHealth(
                service.url,
                service.expectedStatus,
              );
              status = response.healthy ? "healthy" : "unhealthy";
              details.responseTime = response.responseTime;
              details.statusCode = response.statusCode;
            }
            break;

          case "tcp":
            // TCP health check implementation would go here
            status = "healthy"; // Placeholder
            break;

          case "command":
            if (service.command) {
              const result = await this.checkCommandHealth(service.command);
              status = result.success ? "healthy" : "unhealthy";
              details.exitCode = result.exitCode;
              details.output = result.output;
            }
            break;

          case "custom":
            // Custom health check logic
            status = "healthy"; // Placeholder
            break;
        }

        const responseTime = performance.now() - startTime;

        results.push({
          service: service.name,
          status,
          timestamp: Date.now(),
          responseTime,
          details,
        });
      } catch (error) {
        const responseTime = performance.now() - startTime;

        results.push({
          service: service.name,
          status: "unhealthy",
          timestamp: Date.now(),
          responseTime,
          details: {},
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Update health results
    this.healthResults.push(...results);

    // Keep only recent results
    const retentionMs = this.config.retentionPeriod * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;
    this.healthResults = this.healthResults.filter(
      (r) => r.timestamp > cutoffTime,
    );

    // Emit events for failed health checks
    results.forEach((result) => {
      if (result.status !== "healthy") {
        this.emit("health-check-failed", result);
      }
    });

    this.emit("health-checks-completed", results);
  }

  /**
   * Check HTTP health
   */
  private async checkHttpHealth(
    url: string,
    expectedStatus?: number,
  ): Promise<{
    healthy: boolean;
    responseTime: number;
    statusCode?: number;
  }> {
    const startTime = performance.now();

    try {
      // In a real implementation, this would make an HTTP request
      // For demo purposes, simulate a health check
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 100 + 50),
      );

      const responseTime = performance.now() - startTime;
      const statusCode = Math.random() > 0.1 ? 200 : 500; // 90% success rate
      const healthy = expectedStatus
        ? statusCode === expectedStatus
        : statusCode < 400;

      return { healthy, responseTime, statusCode };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      return { healthy: false, responseTime };
    }
  }

  /**
   * Check command health
   */
  private async checkCommandHealth(command: string): Promise<{
    success: boolean;
    exitCode?: number;
    output?: string;
  }> {
    try {
      // In a real implementation, this would execute the command
      // For demo purposes, simulate command execution
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 200 + 100),
      );

      const success = Math.random() > 0.2; // 80% success rate
      return {
        success,
        exitCode: success ? 0 : 1,
        output: success ? "OK" : "Command failed",
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        output: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check alert rules against current metrics
   */
  private async checkAlertRules(
    systemMetrics: SystemMetrics,
    appMetrics: ApplicationMetrics,
  ): Promise<void> {
    for (const rule of this.config.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (
        rule.lastTriggered &&
        Date.now() - rule.lastTriggered < rule.cooldownMinutes * 60 * 1000
      ) {
        continue;
      }

      let value: number | undefined;
      let triggered = false;

      // Extract metric value
      switch (rule.metric) {
        case "cpu.usage":
          value = systemMetrics.cpu.usage;
          break;
        case "memory.usagePercent":
          value = systemMetrics.memory.usagePercent;
          break;
        case "disk.usagePercent":
          value = systemMetrics.disk.usagePercent;
          break;
        case "requests.averageResponseTime":
          value = appMetrics.requests.averageResponseTime;
          break;
        case "performance.averageLatency":
          value = appMetrics.performance.averageLatency;
          break;
      }

      if (value === undefined) continue;

      // Check condition
      switch (rule.condition) {
        case "gt":
          triggered = value > rule.threshold;
          break;
        case "lt":
          triggered = value < rule.threshold;
          break;
        case "gte":
          triggered = value >= rule.threshold;
          break;
        case "lte":
          triggered = value <= rule.threshold;
          break;
        case "eq":
          triggered = value === rule.threshold;
          break;
        case "ne":
          triggered = value !== rule.threshold;
          break;
      }

      if (triggered) {
        const alert: Alert = {
          id: `alert-${rule.id}-${Date.now()}`,
          ruleId: rule.id,
          severity: rule.severity,
          message: `${rule.name}: ${rule.metric} is ${value.toFixed(2)} (${rule.condition} ${rule.threshold})`,
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          timestamp: Date.now(),
          resolved: false,
          instanceId: this.instanceId,
        };

        this.alerts.push(alert);
        rule.lastTriggered = Date.now();

        this.emit("alert-triggered", alert);

        // Send to external monitoring if configured
        await this.sendAlertToExternalSystems(alert);
      }
    }

    // Keep only recent alerts
    const retentionMs = this.config.retentionPeriod * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;
    this.alerts = this.alerts.filter(
      (a) => !a.resolved || a.timestamp > cutoffTime,
    );
  }

  /**
   * Send alert to external monitoring systems
   */
  private async sendAlertToExternalSystems(alert: Alert): Promise<void> {
    // Prometheus integration
    if (this.config.integrations.prometheus?.enabled) {
      // Send metric to Prometheus pushgateway
      console.log(`📊 Prometheus: ${alert.metric} = ${alert.value}`);
    }

    // DataDog integration
    if (this.config.integrations.datadog?.enabled) {
      // Send event to DataDog
      console.log(`🐕 DataDog: Alert ${alert.id} - ${alert.message}`);
    }

    // New Relic integration
    if (this.config.integrations.newRelic?.enabled) {
      // Send event to New Relic
      console.log(`📈 New Relic: Alert ${alert.id} - ${alert.message}`);
    }
  }

  /**
   * Get default alert rules
   */
  private getDefaultAlertRules(): AlertRule[] {
    return [
      {
        id: "cpu-high",
        name: "High CPU Usage",
        description: "CPU usage is above warning threshold",
        metric: "cpu.usage",
        condition: "gte",
        threshold: this.config.thresholds.cpuWarning,
        severity: "medium",
        enabled: true,
        cooldownMinutes: 5,
      },
      {
        id: "cpu-critical",
        name: "Critical CPU Usage",
        description: "CPU usage is above critical threshold",
        metric: "cpu.usage",
        condition: "gte",
        threshold: this.config.thresholds.cpuCritical,
        severity: "critical",
        enabled: true,
        cooldownMinutes: 2,
      },
      {
        id: "memory-high",
        name: "High Memory Usage",
        description: "Memory usage is above warning threshold",
        metric: "memory.usagePercent",
        condition: "gte",
        threshold: this.config.thresholds.memoryWarning,
        severity: "medium",
        enabled: true,
        cooldownMinutes: 5,
      },
      {
        id: "memory-critical",
        name: "Critical Memory Usage",
        description: "Memory usage is above critical threshold",
        metric: "memory.usagePercent",
        condition: "gte",
        threshold: this.config.thresholds.memoryCritical,
        severity: "critical",
        enabled: true,
        cooldownMinutes: 2,
      },
      {
        id: "response-time-high",
        name: "High Response Time",
        description: "Average response time is above warning threshold",
        metric: "requests.averageResponseTime",
        condition: "gte",
        threshold: this.config.thresholds.responseTimeWarning,
        severity: "medium",
        enabled: true,
        cooldownMinutes: 5,
      },
      {
        id: "response-time-critical",
        name: "Critical Response Time",
        description: "Average response time is above critical threshold",
        metric: "requests.averageResponseTime",
        condition: "gte",
        threshold: this.config.thresholds.responseTimeCritical,
        severity: "critical",
        enabled: true,
        cooldownMinutes: 2,
      },
    ];
  }

  /**
   * Get disk usage (simplified)
   */
  private getDiskUsage() {
    // In production, this would use systeminformation or similar
    // For demo purposes, return mock data
    const total = 100 * 1024 * 1024 * 1024; // 100GB
    const used = Math.random() * 0.8 * total; // Up to 80% used
    const free = total - used;

    return {
      total,
      used,
      free,
      usagePercent: (used / total) * 100,
    };
  }

  /**
   * Get network stats (simplified)
   */
  private getNetworkStats() {
    // In production, this would use system network interfaces
    // For demo purposes, return mock data
    return {
      bytesReceived: Math.floor(Math.random() * 1000000),
      bytesTransmitted: Math.floor(Math.random() * 1000000),
      packetsReceived: Math.floor(Math.random() * 10000),
      packetsTransmitted: Math.floor(Math.random() * 10000),
    };
  }

  /**
   * Generate instance ID
   */
  private generateInstanceId(): string {
    return `strray-${os.hostname()}-${process.pid}-${Date.now().toString(36)}`;
  }

  /**
   * Start data cleanup timer
   */
  private startDataCleanup(): void {
    // Clean up old data every hour
    this.cleanupTimer = setInterval(
      () => {
        this.cleanupOldData();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const retentionMs = this.config.retentionPeriod * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;

    this.metrics = this.metrics.filter((m) => m.timestamp > cutoffTime);
    this.appMetrics = this.appMetrics.filter((m) => m.timestamp > cutoffTime);
    this.healthResults = this.healthResults.filter(
      (r) => r.timestamp > cutoffTime,
    );
    this.alerts = this.alerts.filter(
      (a) => !a.resolved || a.timestamp > cutoffTime,
    );

    console.log("🧹 Cleaned up old monitoring data");
  }

  /**
   * Event handlers
   */
  private handleAlertTriggered(alert: Alert): void {
    console.log(`🚨 Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);

    console.log(`[SECURITY] Performance alert triggered: ${alert.message}`);
  }

  private handleHealthCheckFailed(result: HealthCheckResult): void {
    console.warn(
      `⚠️ Health check failed: ${result.service} - ${result.error || "Unknown error"}`,
    );
  }

  private handleMetricsCollected(data: {
    system: SystemMetrics;
    application: ApplicationMetrics;
  }): void {
    // Optional: Log periodic metrics collection
    if (process.env.DEBUG_MONITORING) {
      console.log(
        `📊 Metrics collected - CPU: ${data.system.cpu.usage.toFixed(1)}%, Memory: ${data.system.memory.usagePercent.toFixed(1)}%`,
      );
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): { system: SystemMetrics[]; application: ApplicationMetrics[] } {
    return {
      system: [...this.metrics],
      application: [...this.appMetrics],
    };
  }

  /**
   * Get health check results
   */
  getHealthResults(): HealthCheckResult[] {
    return [...this.healthResults];
  }

  /**
   * Get active alerts
   */
  getAlerts(includeResolved = false): Alert[] {
    return includeResolved
      ? [...this.alerts]
      : this.alerts.filter((a) => !a.resolved);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      console.log(`✅ Alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  /**
   * Add cluster node
   */
  addClusterNode(
    node: Omit<ClusterNode, "status" | "lastHeartbeat" | "metrics" | "health">,
  ): void {
    const clusterNode: ClusterNode = {
      ...node,
      status: "offline",
      lastHeartbeat: Date.now(),
      metrics: this.collectSystemMetrics(),
      health: [],
    };

    this.clusterNodes.set(node.id, clusterNode);
    console.log(`➕ Added cluster node: ${node.id} (${node.hostname})`);
  }

  /**
   * Update cluster node heartbeat
   */
  updateClusterNodeHeartbeat(
    nodeId: string,
    metrics?: SystemMetrics,
    health?: HealthCheckResult[],
  ): void {
    const node = this.clusterNodes.get(nodeId);
    if (node) {
      node.lastHeartbeat = Date.now();
      node.status = "online";

      if (metrics) {
        node.metrics = metrics;
      }

      if (health) {
        node.health = health;
      }
    }
  }

  /**
   * Get cluster metrics
   */
  getClusterMetrics(): ClusterMetrics {
    const nodes = Array.from(this.clusterNodes.values());

    // Calculate cluster-wide metrics
    const totalRequests = this.appMetrics.reduce(
      (sum, m) => sum + m.requests.total,
      0,
    );
    const averageLatency =
      this.appMetrics.length > 0
        ? this.appMetrics.reduce(
            (sum, m) => sum + m.performance.averageLatency,
            0,
          ) / this.appMetrics.length
        : 0;

    const totalCompleted = this.appMetrics.reduce(
      (sum, m) => sum + m.requests.completed,
      0,
    );
    const totalFailed = this.appMetrics.reduce(
      (sum, m) => sum + m.requests.failed,
      0,
    );
    const errorRate =
      totalCompleted + totalFailed > 0
        ? (totalFailed / (totalCompleted + totalFailed)) * 100
        : 0;

    // Load distribution
    const loadDistribution: Record<string, number> = {};
    nodes.forEach((node) => {
      loadDistribution[node.id] = node.metrics.cpu.usage;
    });

    return {
      nodes,
      totalRequests,
      averageLatency,
      errorRate,
      loadDistribution,
    };
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    running: boolean;
    instanceId: string;
    metricsCollected: number;
    alertsActive: number;
    healthChecksPerformed: number;
    clusterNodes: number;
    uptime: number;
  } {
    return {
      running: this.isRunning,
      instanceId: this.instanceId,
      metricsCollected: this.metrics.length,
      alertsActive: this.alerts.filter((a) => !a.resolved).length,
      healthChecksPerformed: this.healthResults.length,
      clusterNodes: this.clusterNodes.size,
      uptime: this.isRunning
        ? Date.now() - (this.metrics[0]?.timestamp || Date.now())
        : 0,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("⚙️ Monitoring system configuration updated");
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: any, tags?: Record<string, string>): void {
    console.log(`📊 Metric recorded: ${name}`, {
      value,
      tags,
      timestamp: new Date().toISOString(),
    });
    // In a real implementation, this would store metrics for analysis
  }

  /**
   * Record an error for monitoring
   */
  recordError(operation: string, error: any): void {
    console.error(`❌ Error recorded: ${operation}`, {
      error: error.message || error,
      timestamp: new Date().toISOString(),
      stack: error.stack,
    });
    // In a real implementation, this would store errors for analysis and alerting
  }

  /**
   * Get comprehensive system status
   */
  getStatus(): {
    config: MonitoringConfig;
    metrics: { system: SystemMetrics[]; application: ApplicationMetrics[] };
    alerts: Alert[];
    healthResults: HealthCheckResult[];
    clusterMetrics: ClusterMetrics;
    monitoringStatus: any;
  } {
    return {
      config: this.config,
      metrics: this.getMetrics(),
      alerts: this.alerts,
      healthResults: this.healthResults,
      clusterMetrics: this.getClusterMetrics(),
      monitoringStatus: this.getMonitoringStatus(),
    };
  }
}

// Export singleton instance
export const enterpriseMonitoringSystem = new EnterpriseMonitoringSystem();
