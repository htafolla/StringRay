/**
 * StringRay AI v1.1.0 - Live Metrics Collector
 *
 * Real-time metrics collection engine for performance dashboards.
 * Collects, aggregates, and streams metrics from multiple sources.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { EventEmitter } from "events";
import { performance } from "perf_hooks";
import * as os from "os";
import { performanceDashboard } from "../performance/performance-monitoring-dashboard.js";
import { enterpriseMonitoringSystem } from "../monitoring/enterprise-monitoring-system.js";
import { realTimeStreamingService } from "../streaming/real-time-streaming-service.js";

export interface MetricSource {
  id: string;
  name: string;
  type: "system" | "application" | "performance" | "custom";
  enabled: boolean;
  collectionInterval: number;
  lastCollected?: number;
  errorCount: number;
}

export interface CollectedMetric {
  sourceId: string;
  timestamp: number;
  name: string;
  value: number | string | boolean | object;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface MetricsCollectionConfig {
  enabled: boolean;
  collectionInterval: number;
  maxBufferSize: number;
  retentionPeriod: number; // milliseconds
  batchSize: number;
  compressionEnabled: boolean;
  sources: MetricSource[];
}

export interface CollectionStats {
  totalMetrics: number;
  metricsPerSecond: number;
  bufferSize: number;
  errors: number;
  uptime: number;
  sourcesActive: number;
  lastCollection: number;
}

/**
 * Live metrics collector for real-time dashboard data
 */
export class LiveMetricsCollector extends EventEmitter {
  private config: MetricsCollectionConfig;
  private sources = new Map<string, MetricSource>();
  private metricsBuffer: CollectedMetric[] = [];
  private collectionTimers = new Map<string, NodeJS.Timeout>();
  private stats: CollectionStats;
  private startTime: number;
  private isCollecting = false;

  constructor(config?: Partial<MetricsCollectionConfig>) {
    super();

    this.startTime = Date.now();
    this.config = {
      enabled: true,
      collectionInterval: 1000, // 1 second default
      maxBufferSize: 10000,
      retentionPeriod: 300000, // 5 minutes
      batchSize: 100,
      compressionEnabled: false,
      sources: this.getDefaultSources(),
      ...config,
    };

    this.stats = {
      totalMetrics: 0,
      metricsPerSecond: 0,
      bufferSize: 0,
      errors: 0,
      uptime: 0,
      sourcesActive: 0,
      lastCollection: 0,
    };

    this.initializeSources();
    this.setupEventHandlers();
  }

  /**
   * Get default metric sources
   */
  private getDefaultSources(): MetricSource[] {
    return [
      {
        id: "system-cpu",
        name: "System CPU Usage",
        type: "system",
        enabled: true,
        collectionInterval: 2000,
        errorCount: 0,
      },
      {
        id: "system-memory",
        name: "System Memory Usage",
        type: "system",
        enabled: true,
        collectionInterval: 2000,
        errorCount: 0,
      },
      {
        id: "system-disk",
        name: "System Disk Usage",
        type: "system",
        enabled: true,
        collectionInterval: 10000,
        errorCount: 0,
      },
      {
        id: "performance-bundle",
        name: "Bundle Size Metrics",
        type: "performance",
        enabled: true,
        collectionInterval: 30000,
        errorCount: 0,
      },
      {
        id: "performance-runtime",
        name: "Runtime Performance",
        type: "performance",
        enabled: true,
        collectionInterval: 5000,
        errorCount: 0,
      },
      {
        id: "application-requests",
        name: "Application Requests",
        type: "application",
        enabled: true,
        collectionInterval: 1000,
        errorCount: 0,
      },
      {
        id: "application-agents",
        name: "Agent Activity",
        type: "application",
        enabled: true,
        collectionInterval: 2000,
        errorCount: 0,
      },
    ];
  }

  /**
   * Initialize metric sources
   */
  private initializeSources(): void {
    for (const source of this.config.sources) {
      this.sources.set(source.id, { ...source });
    }
  }

  /**
   * Setup event handlers for external metric sources
   */
  private setupEventHandlers(): void {
    // Performance dashboard events
    performanceDashboard.on("metrics-updated", (metrics: any) => {
      this.handlePerformanceMetrics(metrics);
    });

    // Enterprise monitoring events
    enterpriseMonitoringSystem.on("metrics-collected", (metrics: any) => {
      this.handleSystemMetrics(metrics);
    });

    // Real-time streaming events
    realTimeStreamingService.on("message", (data: any) => {
      this.handleStreamingMessage(data);
    });
  }

  /**
   * Start metrics collection
   */
  async start(): Promise<void> {
    if (this.isCollecting) {
      return;
    }

    // Live metrics startup - kept as console.log for user visibility
    // Collection interval - kept as console.log for user visibility
    // Max buffer size - kept as console.log for user visibility
    // Sources count - kept as console.log for user visibility

    this.isCollecting = true;

    // Start collection for each enabled source
    for (const [sourceId, source] of this.sources) {
      if (source.enabled) {
        this.startSourceCollection(sourceId);
      }
    }

    // Start buffer management
    this.startBufferManagement();

    // Start stats calculation
    this.startStatsCalculation();

    this.emit("started");
  }

  /**
   * Stop metrics collection
   */
  stop(): void {
    if (!this.isCollecting) {
      return;
    }

    this.isCollecting = false;

    // Stop all collection timers
    for (const timer of this.collectionTimers.values()) {
      clearInterval(timer);
    }
    this.collectionTimers.clear();

    // Live metrics stop - kept as console.log for user visibility
    this.emit("stopped");
  }

  /**
   * Start collection for a specific source
   */
  private startSourceCollection(sourceId: string): void {
    const source = this.sources.get(sourceId);
    if (!source || !source.enabled) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        await this.collectFromSource(sourceId);
        source.lastCollected = Date.now();
        source.errorCount = 0;
      } catch (error) {
        source.errorCount++;
        console.warn(`Failed to collect from source ${sourceId}:`, error);

        // Disable source after 5 consecutive errors
        if (source.errorCount >= 5) {
          console.error(`Disabling source ${sourceId} due to repeated errors`);
          source.enabled = false;
          this.stopSourceCollection(sourceId);
          this.emit("source-disabled", { sourceId, reason: "repeated-errors" });
        }
      }
    }, source.collectionInterval);

    this.collectionTimers.set(sourceId, timer);
    this.stats.sourcesActive++;
  }

  /**
   * Stop collection for a specific source
   */
  private stopSourceCollection(sourceId: string): void {
    const timer = this.collectionTimers.get(sourceId);
    if (timer) {
      clearInterval(timer);
      this.collectionTimers.delete(sourceId);
      this.stats.sourcesActive = Math.max(0, this.stats.sourcesActive - 1);
    }
  }

  /**
   * Collect metrics from a specific source
   */
  private async collectFromSource(sourceId: string): Promise<void> {
    const source = this.sources.get(sourceId);
    if (!source) {
      return;
    }

    const timestamp = Date.now();
    let metrics: CollectedMetric[] = [];

    switch (source.type) {
      case "system":
        metrics = await this.collectSystemMetrics(sourceId, timestamp);
        break;
      case "performance":
        metrics = await this.collectPerformanceMetrics(sourceId, timestamp);
        break;
      case "application":
        metrics = await this.collectApplicationMetrics(sourceId, timestamp);
        break;
      case "custom":
        metrics = await this.collectCustomMetrics(sourceId, timestamp);
        break;
    }

    // Add metrics to buffer
    for (const metric of metrics) {
      this.addMetricToBuffer(metric);
    }

    this.stats.lastCollection = timestamp;
  }

  /**
   * Collect system-level metrics
   */
  private async collectSystemMetrics(
    sourceId: string,
    timestamp: number,
  ): Promise<CollectedMetric[]> {
    const metrics: CollectedMetric[] = [];

    try {
      if (sourceId === "system-cpu") {
        const cpus = os.cpus();
        const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        const totalTick = cpus.reduce(
          (acc, cpu) => acc + Object.values(cpu.times).reduce((a, b) => a + b),
          0,
        );
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const usage = 100 - ~~((100 * idle) / total);

        metrics.push({
          sourceId,
          timestamp,
          name: "cpu.usage",
          value: usage || 0,
          tags: { unit: "percent" },
        });

        const loadAverage = os.loadavg();
        metrics.push({
          sourceId,
          timestamp,
          name: "cpu.load_average_1m",
          value: loadAverage[0] || 0,
          tags: { unit: "load" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "cpu.load_average_5m",
          value: loadAverage[1] || 0,
          tags: { unit: "load" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "cpu.load_average_15m",
          value: loadAverage[2] || 0,
          tags: { unit: "load" },
        });
      }

      if (sourceId === "system-memory") {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const usagePercent = (usedMem / totalMem) * 100;

        metrics.push({
          sourceId,
          timestamp,
          name: "memory.total",
          value: totalMem,
          tags: { unit: "bytes" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "memory.used",
          value: usedMem,
          tags: { unit: "bytes" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "memory.free",
          value: freeMem,
          tags: { unit: "bytes" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "memory.usage_percent",
          value: usagePercent,
          tags: { unit: "percent" },
        });
      }

      if (sourceId === "system-disk") {
        // Note: In a real implementation, you'd use a library like 'diskusage'
        // For now, we'll use a placeholder
        metrics.push({
          sourceId,
          timestamp,
          name: "disk.usage_percent",
          value: 45.2, // Placeholder
          tags: { unit: "percent", mount: "/" },
        });
      }
    } catch (error) {
      console.warn(`Error collecting system metrics for ${sourceId}:`, error);
    }

    return metrics;
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(
    sourceId: string,
    timestamp: number,
  ): Promise<CollectedMetric[]> {
    const metrics: CollectedMetric[] = [];

    try {
      const perfMetrics = performanceDashboard.getMetrics();

      if (sourceId === "performance-bundle") {
        metrics.push({
          sourceId,
          timestamp,
          name: "bundle.size.current",
          value: perfMetrics.bundleSize.current,
          tags: { unit: "bytes" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "bundle.size.budget",
          value: perfMetrics.bundleSize.budget,
          tags: { unit: "bytes" },
        });

        const usagePercent =
          (perfMetrics.bundleSize.current / perfMetrics.bundleSize.budget) *
          100;
        metrics.push({
          sourceId,
          timestamp,
          name: "bundle.size.usage_percent",
          value: usagePercent,
          tags: { unit: "percent" },
        });
      }

      if (sourceId === "performance-runtime") {
        metrics.push({
          sourceId,
          timestamp,
          name: "runtime.memory_usage",
          value: perfMetrics.runtime.memoryUsage,
          tags: { unit: "bytes" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "runtime.cpu_usage",
          value: perfMetrics.runtime.cpuUsage,
          tags: { unit: "percent" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "runtime.startup_time",
          value: perfMetrics.runtime.startupTime,
          tags: { unit: "milliseconds" },
        });
      }
    } catch (error) {
      console.warn(
        `Error collecting performance metrics for ${sourceId}:`,
        error,
      );
    }

    return metrics;
  }

  /**
   * Collect application metrics
   */
  private async collectApplicationMetrics(
    sourceId: string,
    timestamp: number,
  ): Promise<CollectedMetric[]> {
    const metrics: CollectedMetric[] = [];

    try {
      // These would typically come from your application monitoring
      // For now, using placeholders based on enterprise monitoring
      const appMetrics = enterpriseMonitoringSystem.getMetrics();

      if (sourceId === "application-requests") {
        // Use placeholder values since enterprise monitoring may not have these properties
        metrics.push({
          sourceId,
          timestamp,
          name: "requests.total",
          value: 0,
          tags: { type: "counter" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "requests.active",
          value: 0,
          tags: { type: "gauge" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "requests.failed",
          value: 0,
          tags: { type: "counter" },
        });
      }

      if (sourceId === "application-agents") {
        metrics.push({
          sourceId,
          timestamp,
          name: "agents.total",
          value: 0,
          tags: { type: "gauge" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "agents.active",
          value: 0,
          tags: { type: "gauge" },
        });

        metrics.push({
          sourceId,
          timestamp,
          name: "agents.failed",
          value: 0,
          tags: { type: "counter" },
        });
      }
    } catch (error) {
      console.warn(
        `Error collecting application metrics for ${sourceId}:`,
        error,
      );
    }

    return metrics;
  }

  /**
   * Collect custom metrics (extension point)
   */
  private async collectCustomMetrics(
    sourceId: string,
    timestamp: number,
  ): Promise<CollectedMetric[]> {
    // This is an extension point for custom metric collection
    // Emit event to allow external collectors to provide metrics
    const metrics: CollectedMetric[] = [];

    this.emit("collect-custom-metrics", {
      sourceId,
      timestamp,
      addMetric: (metric: CollectedMetric) => metrics.push(metric),
    });

    return metrics;
  }

  /**
   * Handle performance metrics from dashboard
   */
  private handlePerformanceMetrics(metrics: any): void {
    const timestamp = Date.now();

    // Convert dashboard metrics to collected metrics
    const collectedMetrics: CollectedMetric[] = [
      {
        sourceId: "performance-dashboard",
        timestamp,
        name: "web_vitals.fcp",
        value: metrics.webVitals?.fcp || 0,
        tags: { unit: "milliseconds" },
      },
      {
        sourceId: "performance-dashboard",
        timestamp,
        name: "web_vitals.tti",
        value: metrics.webVitals?.tti || 0,
        tags: { unit: "milliseconds" },
      },
      {
        sourceId: "performance-dashboard",
        timestamp,
        name: "web_vitals.lcp",
        value: metrics.webVitals?.lcp || 0,
        tags: { unit: "milliseconds" },
      },
    ];

    for (const metric of collectedMetrics) {
      this.addMetricToBuffer(metric);
    }
  }

  /**
   * Handle system metrics from enterprise monitoring
   */
  private handleSystemMetrics(metrics: any): void {
    const timestamp = Date.now();

    const collectedMetrics: CollectedMetric[] = [
      {
        sourceId: "enterprise-monitor",
        timestamp,
        name: "system.cpu.usage",
        value: metrics.cpu?.usage || 0,
        tags: { unit: "percent" },
      },
      {
        sourceId: "enterprise-monitor",
        timestamp,
        name: "system.memory.usage_percent",
        value: metrics.memory?.usagePercent || 0,
        tags: { unit: "percent" },
      },
    ];

    for (const metric of collectedMetrics) {
      this.addMetricToBuffer(metric);
    }
  }

  /**
   * Handle streaming messages
   */
  private handleStreamingMessage(data: any): void {
    // Process incoming streaming messages for metrics
    if (data.message?.type === "metrics") {
      const timestamp = Date.now();
      const collectedMetric: CollectedMetric = {
        sourceId: "streaming-client",
        timestamp,
        name: data.message.name || "custom.metric",
        value: data.message.value,
        tags: data.message.tags || {},
        metadata: data.message.metadata,
      };

      this.addMetricToBuffer(collectedMetric);
    }
  }

  /**
   * Add metric to buffer
   */
  private addMetricToBuffer(metric: CollectedMetric): void {
    this.metricsBuffer.push(metric);
    this.stats.totalMetrics++;

    // Maintain buffer size
    if (this.metricsBuffer.length > this.config.maxBufferSize) {
      this.metricsBuffer.shift();
    }

    this.stats.bufferSize = this.metricsBuffer.length;

    // Emit metric collected event
    this.emit("metric-collected", metric);

    // Batch emit if buffer reaches batch size
    if (this.metricsBuffer.length >= this.config.batchSize) {
      this.emitBatchMetrics();
    }
  }

  /**
   * Emit batch of metrics
   */
  private emitBatchMetrics(): void {
    const batch = this.metricsBuffer.splice(0, this.config.batchSize);
    this.emit("metrics-batch", batch);
    this.stats.bufferSize = this.metricsBuffer.length;
  }

  /**
   * Start buffer management (cleanup old metrics)
   */
  private startBufferManagement(): void {
    setInterval(() => {
      const cutoffTime = Date.now() - this.config.retentionPeriod;
      const initialLength = this.metricsBuffer.length;

      this.metricsBuffer = this.metricsBuffer.filter(
        (metric) => metric.timestamp > cutoffTime,
      );

      const removed = initialLength - this.metricsBuffer.length;
      if (removed > 0) {
        await frameworkLogger.log(
          "live-metrics-collector",
          "buffer-cleaned",
          "info",
          { metricsRemoved: removed },
        );
        this.stats.bufferSize = this.metricsBuffer.length;
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Start stats calculation
   */
  private startStatsCalculation(): void {
    setInterval(() => {
      const now = Date.now();
      const timeDiff = (now - this.startTime) / 1000; // seconds

      this.stats.uptime = now - this.startTime;
      this.stats.metricsPerSecond =
        timeDiff > 0 ? this.stats.totalMetrics / timeDiff : 0;
    }, 5000); // Update every 5 seconds
  }

  /**
   * Get current metrics buffer
   */
  getMetrics(limit?: number): CollectedMetric[] {
    const metrics = [...this.metricsBuffer];
    if (limit) {
      return metrics.slice(-limit);
    }
    return metrics;
  }

  /**
   * Get metrics by source
   */
  getMetricsBySource(sourceId: string, limit?: number): CollectedMetric[] {
    const metrics = this.metricsBuffer.filter((m) => m.sourceId === sourceId);
    if (limit) {
      return metrics.slice(-limit);
    }
    return metrics;
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string, limit?: number): CollectedMetric[] {
    const metrics = this.metricsBuffer.filter((m) => m.name === name);
    if (limit) {
      return metrics.slice(-limit);
    }
    return metrics;
  }

  /**
   * Get collection statistics
   */
  getStats(): CollectionStats {
    return { ...this.stats };
  }

  /**
   * Get all configured sources
   */
  getSources(): MetricSource[] {
    return Array.from(this.sources.values()).map((source) => ({ ...source }));
  }

  /**
   * Enable or disable a source
   */
  setSourceEnabled(sourceId: string, enabled: boolean): boolean {
    const source = this.sources.get(sourceId);
    if (!source) {
      return false;
    }

    const wasEnabled = source.enabled;
    source.enabled = enabled;

    if (enabled && !wasEnabled) {
      this.startSourceCollection(sourceId);
    } else if (!enabled && wasEnabled) {
      this.stopSourceCollection(sourceId);
    }

    this.emit("source-updated", { sourceId, enabled });
    return true;
  }

  /**
   * Update source configuration
   */
  updateSource(sourceId: string, updates: Partial<MetricSource>): boolean {
    const source = this.sources.get(sourceId);
    if (!source) {
      return false;
    }

    const wasEnabled = source.enabled;
    Object.assign(source, updates);

    // Restart collection if enabled state changed
    if (source.enabled !== wasEnabled) {
      if (source.enabled) {
        this.startSourceCollection(sourceId);
      } else {
        this.stopSourceCollection(sourceId);
      }
    }

    this.emit("source-updated", { sourceId, source: { ...source } });
    return true;
  }

  /**
   * Add custom metric source
   */
  addSource(source: MetricSource): boolean {
    if (this.sources.has(source.id)) {
      return false;
    }

    this.sources.set(source.id, { ...source });
    if (source.enabled) {
      this.startSourceCollection(source.id);
    }

    this.emit("source-added", { ...source });
    return true;
  }

  /**
   * Remove metric source
   */
  removeSource(sourceId: string): boolean {
    const source = this.sources.get(sourceId);
    if (!source) {
      return false;
    }

    this.stopSourceCollection(sourceId);
    this.sources.delete(sourceId);

    this.emit("source-removed", sourceId);
    return true;
  }

  /**
   * Clear metrics buffer
   */
  clearBuffer(): void {
    this.metricsBuffer.length = 0;
    this.stats.bufferSize = 0;
    this.emit("buffer-cleared");
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MetricsCollectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    await frameworkLogger.log(
      "live-metrics-collector",
      "config-updated",
      "info",
    );
    this.emit("config-updated", { ...this.config });
  }
}

// Export singleton instance
export const liveMetricsCollector = new LiveMetricsCollector();
