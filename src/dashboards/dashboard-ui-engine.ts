/**
 * StringRay AI v1.0.27 - Dashboard UI Engine
 *
 * Real-time dashboard UI engine for performance monitoring.
 * Handles UI rendering, updates, and user interactions with live data.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { EventEmitter } from "events";
import {
  liveMetricsCollector,
  CollectedMetric,
} from "./live-metrics-collector.js";
import { alertEngine, Alert } from "./alert-engine.js";
import { webSocketGateway } from "./websocket-gateway.js";

export interface DashboardWidget {
  id: string;
  type: "chart" | "gauge" | "table" | "alerts" | "metrics" | "custom";
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, any>;
  data: any;
  lastUpdated: number;
  refreshInterval: number;
  visible: boolean;
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  theme: "light" | "dark" | "auto";
  autoRefresh: boolean;
  refreshInterval: number;
  createdAt: number;
  updatedAt: number;
}

export interface DashboardState {
  activeLayout: string;
  layouts: Map<string, DashboardLayout>;
  connectionStatus: "connected" | "disconnected" | "connecting" | "error";
  lastUpdate: number;
  alerts: Alert[];
  metrics: CollectedMetric[];
  stats: {
    widgetsRendered: number;
    updatesProcessed: number;
    renderTime: number;
  };
}

export interface DashboardConfig {
  enabled: boolean;
  defaultLayout: string;
  maxWidgets: number;
  updateThrottle: number; // milliseconds
  renderOptimization: boolean;
  theme: "light" | "dark" | "auto";
  animations: boolean;
  realTimeUpdates: boolean;
}

export interface RenderContext {
  canvas: any; // HTML5 Canvas or similar
  theme: "light" | "dark";
  timeRange: { start: number; end: number };
  filters: Record<string, any>;
  viewport: { width: number; height: number };
}

/**
 * Dashboard UI engine for real-time performance monitoring
 */
export class DashboardUIEngine extends EventEmitter {
  private config: DashboardConfig;
  private state: DashboardState;
  private renderContexts = new Map<string, RenderContext>();
  private updateQueue: Array<{
    widgetId: string;
    data: any;
    priority: number;
  }> = [];
  private isRendering = false;
  private lastRenderTime = 0;
  private animationFrame?: number;

  constructor(config?: Partial<DashboardConfig>) {
    super();

    this.config = {
      enabled: true,
      defaultLayout: "default",
      maxWidgets: 50,
      updateThrottle: 100,
      renderOptimization: true,
      theme: "auto",
      animations: true,
      realTimeUpdates: true,
      ...config,
    };

    this.state = {
      activeLayout: this.config.defaultLayout,
      layouts: new Map(),
      connectionStatus: "disconnected",
      lastUpdate: 0,
      alerts: [],
      metrics: [],
      stats: {
        widgetsRendered: 0,
        updatesProcessed: 0,
        renderTime: 0,
      },
    };

    this.initializeDefaultLayout();
    this.setupEventHandlers();
  }

  /**
   * Initialize default dashboard layout
   */
  private initializeDefaultLayout(): void {
    const defaultLayout: DashboardLayout = {
      id: "default",
      name: "Performance Overview",
      theme: "auto",
      autoRefresh: true,
      refreshInterval: 30000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      widgets: [
        {
          id: "cpu-gauge",
          type: "gauge",
          title: "CPU Usage",
          position: { x: 0, y: 0, width: 300, height: 200 },
          config: {
            metric: "cpu.usage",
            min: 0,
            max: 100,
            thresholds: { warning: 70, critical: 90 },
            unit: "%",
          },
          data: null,
          lastUpdated: 0,
          refreshInterval: 2000,
          visible: true,
        },
        {
          id: "memory-gauge",
          type: "gauge",
          title: "Memory Usage",
          position: { x: 320, y: 0, width: 300, height: 200 },
          config: {
            metric: "memory.usage_percent",
            min: 0,
            max: 100,
            thresholds: { warning: 75, critical: 90 },
            unit: "%",
          },
          data: null,
          lastUpdated: 0,
          refreshInterval: 2000,
          visible: true,
        },
        {
          id: "performance-chart",
          type: "chart",
          title: "Performance Metrics",
          position: { x: 0, y: 220, width: 800, height: 300 },
          config: {
            metrics: ["cpu.usage", "memory.usage_percent"],
            chartType: "line",
            timeRange: "5m",
            showLegend: true,
          },
          data: null,
          lastUpdated: 0,
          refreshInterval: 5000,
          visible: true,
        },
        {
          id: "alerts-table",
          type: "alerts",
          title: "Active Alerts",
          position: { x: 0, y: 540, width: 800, height: 200 },
          config: {
            maxRows: 10,
            showAcknowledged: false,
            sortBy: "severity",
          },
          data: null,
          lastUpdated: 0,
          refreshInterval: 10000,
          visible: true,
        },
        {
          id: "metrics-table",
          type: "metrics",
          title: "Key Metrics",
          position: { x: 820, y: 0, width: 400, height: 400 },
          config: {
            metrics: [
              "cpu.usage",
              "memory.usage_percent",
              "bundle.size.usage_percent",
              "web_vitals.fcp",
            ],
            showTrends: true,
          },
          data: null,
          lastUpdated: 0,
          refreshInterval: 10000,
          visible: true,
        },
      ],
    };

    this.state.layouts.set(defaultLayout.id, defaultLayout);
  }

  /**
   * Setup event handlers for data sources
   */
  private setupEventHandlers(): void {
    // Metrics collector events
    liveMetricsCollector.on("metric-collected", (metric: CollectedMetric) => {
      this.handleMetricUpdate(metric);
    });

    liveMetricsCollector.on("metrics-batch", (metrics: CollectedMetric[]) => {
      for (const metric of metrics) {
        this.handleMetricUpdate(metric);
      }
    });

    // Alert engine events
    alertEngine.on("alert-triggered", (alert: Alert) => {
      this.handleAlertUpdate(alert);
    });

    alertEngine.on("alert-acknowledged", (alert: Alert) => {
      this.handleAlertUpdate(alert);
    });

    alertEngine.on("alert-resolved", (alert: Alert) => {
      this.handleAlertUpdate(alert);
    });

    // WebSocket gateway events
    webSocketGateway.on("connection", (connection) => {
      this.state.connectionStatus = "connected";
      this.emit("connection-status-changed", this.state.connectionStatus);
    });

    webSocketGateway.on("disconnection", () => {
      this.state.connectionStatus = "disconnected";
      this.emit("connection-status-changed", this.state.connectionStatus);
    });
  }

  /**
   * Start the dashboard UI engine
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Dashboard UI startup - kept as console.log for user visibility
    // Active layout - kept as console.log for user visibility
    // Widgets count - kept as console.log for user visibility
    // Real-time updates - kept as console.log for user visibility

    // Connect to WebSocket gateway
    await this.connectToGateway();

    // Start rendering loop
    this.startRenderLoop();

    // Initial data load
    await this.loadInitialData();

    this.emit("started");
  }

  /**
   * Stop the dashboard UI engine
   */
  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }

    this.disconnectFromGateway();
    // Dashboard UI stop - kept as console.log for user visibility
    this.emit("stopped");
  }

  /**
   * Connect to WebSocket gateway
   */
  private async connectToGateway(): Promise<void> {
    try {
      this.state.connectionStatus = "connecting";
      await webSocketGateway.start();
      this.state.connectionStatus = "connected";

      // Subscribe to relevant data
      this.subscribeToMetrics();
      this.subscribeToAlerts();
    } catch (error) {
      console.error("Failed to connect to WebSocket gateway:", error);
      this.state.connectionStatus = "error";
    }
  }

  /**
   * Disconnect from WebSocket gateway
   */
  private disconnectFromGateway(): void {
    webSocketGateway.stop();
    this.state.connectionStatus = "disconnected";
  }

  /**
   * Subscribe to metrics data
   */
  private subscribeToMetrics(): void {
    const layout = this.getActiveLayout();
    if (!layout) return;

    // Collect all metric names from widgets
    const metricNames = new Set<string>();
    for (const widget of layout.widgets) {
      if (widget.config.metrics) {
        if (Array.isArray(widget.config.metrics)) {
          widget.config.metrics.forEach((metric: string) =>
            metricNames.add(metric),
          );
        } else if (widget.config.metric) {
          metricNames.add(widget.config.metric);
        }
      }
    }

    // Subscribe to each metric type
    for (const metricName of metricNames) {
      webSocketGateway.broadcast({
        type: "subscribe",
        id: `sub_metrics_${metricName}`,
        data: {
          type: "metrics",
          filters: {
            metricPattern: metricName.replace(".", "\\."),
          },
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Subscribe to alerts data
   */
  private subscribeToAlerts(): void {
    webSocketGateway.broadcast({
      type: "subscribe",
      id: "sub_alerts",
      data: {
        type: "alerts",
        filters: {},
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Start render loop
   */
  private startRenderLoop(): void {
    const render = (timestamp: number) => {
      if (this.config.realTimeUpdates) {
        this.processUpdateQueue();
        this.renderDashboard();
      }

      this.animationFrame = requestAnimationFrame(render);
    };

    this.animationFrame = requestAnimationFrame(render);
  }

  /**
   * Load initial data for all widgets
   */
  private async loadInitialData(): Promise<void> {
    const layout = this.getActiveLayout();
    if (!layout) return;

    // Load metrics data
    this.state.metrics = liveMetricsCollector.getMetrics(1000); // Last 1000 metrics

    // Load alerts data
    this.state.alerts = alertEngine.getAlerts("active", 100);

    // Update all widgets with initial data
    for (const widget of layout.widgets) {
      await this.updateWidgetData(widget.id);
    }

    this.state.lastUpdate = Date.now();
  }

  /**
   * Handle metric update
   */
  private handleMetricUpdate(metric: CollectedMetric): void {
    // Add to state
    this.state.metrics.push(metric);
    if (this.state.metrics.length > 10000) {
      this.state.metrics = this.state.metrics.slice(-5000); // Keep last 5000
    }

    // Queue widget updates
    this.queueWidgetUpdate(metric.name, metric, 1);

    this.state.lastUpdate = Date.now();
  }

  /**
   * Handle alert update
   */
  private handleAlertUpdate(alert: Alert): void {
    // Update alerts in state
    const existingIndex = this.state.alerts.findIndex((a) => a.id === alert.id);
    if (existingIndex >= 0) {
      this.state.alerts[existingIndex] = alert;
    } else {
      this.state.alerts.push(alert);
    }

    // Keep only active alerts
    this.state.alerts = this.state.alerts.filter((a) => a.status === "active");

    // Queue alert widget updates
    this.queueWidgetUpdate("alerts", alert, 2);

    this.state.lastUpdate = Date.now();
  }

  /**
   * Queue widget update
   */
  private queueWidgetUpdate(
    metricName: string,
    data: any,
    priority: number,
  ): void {
    const layout = this.getActiveLayout();
    if (!layout) return;

    // Find widgets that need this data
    for (const widget of layout.widgets) {
      let needsUpdate = false;

      if (widget.config.metric === metricName) {
        needsUpdate = true;
      } else if (
        widget.config.metrics &&
        Array.isArray(widget.config.metrics)
      ) {
        needsUpdate = widget.config.metrics.includes(metricName);
      } else if (widget.type === "alerts" && metricName === "alerts") {
        needsUpdate = true;
      }

      if (needsUpdate) {
        // Remove existing update for this widget
        this.updateQueue = this.updateQueue.filter(
          (u) => u.widgetId !== widget.id,
        );

        // Add new update
        this.updateQueue.push({
          widgetId: widget.id,
          data,
          priority,
        });
      }
    }

    // Sort by priority (higher priority first)
    this.updateQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Process update queue
   */
  private processUpdateQueue(): void {
    if (this.updateQueue.length === 0 || this.isRendering) {
      return;
    }

    const now = Date.now();
    const updatesToProcess: typeof this.updateQueue = [];

    // Process high-priority updates immediately
    const highPriority = this.updateQueue.filter((u) => u.priority >= 2);
    updatesToProcess.push(...highPriority);

    // Process normal priority updates with throttling
    if (now - this.lastRenderTime > this.config.updateThrottle) {
      const normalPriority = this.updateQueue.filter((u) => u.priority < 2);
      updatesToProcess.push(...normalPriority);
    }

    if (updatesToProcess.length > 0) {
      this.isRendering = true;

      for (const update of updatesToProcess) {
        this.updateWidget(update.widgetId, update.data);
        this.updateQueue = this.updateQueue.filter((u) => u !== update);
      }

      this.isRendering = false;
      this.lastRenderTime = now;
    }
  }

  /**
   * Update widget with new data
   */
  private updateWidget(widgetId: string, data: any): void {
    const layout = this.getActiveLayout();
    if (!layout) return;

    const widget = layout.widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    // Update widget data based on type
    switch (widget.type) {
      case "gauge":
        this.updateGaugeWidget(widget, data);
        break;
      case "chart":
        this.updateChartWidget(widget, data);
        break;
      case "table":
      case "metrics":
        this.updateTableWidget(widget, data);
        break;
      case "alerts":
        this.updateAlertsWidget(widget, data);
        break;
      case "custom":
        this.updateCustomWidget(widget, data);
        break;
    }

    widget.lastUpdated = Date.now();
    this.state.stats.updatesProcessed++;
  }

  /**
   * Update gauge widget
   */
  private updateGaugeWidget(
    widget: DashboardWidget,
    data: CollectedMetric,
  ): void {
    if (typeof data.value === "number") {
      widget.data = {
        value: data.value,
        timestamp: data.timestamp,
        unit: widget.config.unit,
        thresholds: widget.config.thresholds,
      };
    }
  }

  /**
   * Update chart widget
   */
  private updateChartWidget(
    widget: DashboardWidget,
    data: CollectedMetric,
  ): void {
    if (!widget.data) {
      widget.data = {
        series: new Map(),
        timestamps: [],
      };
    }

    const series = widget.data.series as Map<string, any[]>;
    const metricName = data.name;

    if (!series.has(metricName)) {
      series.set(metricName, []);
    }

    const seriesData = series.get(metricName)!;
    seriesData.push({
      timestamp: data.timestamp,
      value: typeof data.value === "number" ? data.value : 0,
    });

    // Keep only recent data (last 100 points)
    if (seriesData.length > 100) {
      seriesData.shift();
    }

    // Update timestamps
    widget.data.timestamps = seriesData.map((d) => d.timestamp);
  }

  /**
   * Update table widget
   */
  private updateTableWidget(
    widget: DashboardWidget,
    data: CollectedMetric,
  ): void {
    if (!widget.data) {
      widget.data = new Map();
    }

    const metrics = widget.data as Map<string, any>;
    metrics.set(data.name, {
      value: data.value,
      timestamp: data.timestamp,
      trend: this.calculateTrend(data.name),
    });
  }

  /**
   * Update alerts widget
   */
  private updateAlertsWidget(widget: DashboardWidget, data: Alert): void {
    widget.data = this.state.alerts
      .filter((alert) =>
        !widget.config.showAcknowledged ? alert.status === "active" : true,
      )
      .sort((a, b) => {
        // Sort by severity first, then by timestamp
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff =
          severityOrder[b.severity] - severityOrder[a.severity];
        return severityDiff !== 0 ? severityDiff : b.createdAt - a.createdAt;
      })
      .slice(0, widget.config.maxRows || 10);
  }

  /**
   * Update custom widget
   */
  private updateCustomWidget(widget: DashboardWidget, data: any): void {
    // Custom widget update logic
    this.emit("custom-widget-update", { widget, data });
  }

  /**
   * Update widget data (for initial load)
   */
  private async updateWidgetData(widgetId: string): Promise<void> {
    const layout = this.getActiveLayout();
    if (!layout) return;

    const widget = layout.widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    // Get relevant metrics for this widget
    let relevantMetrics: CollectedMetric[] = [];

    if (widget.config.metric) {
      relevantMetrics = liveMetricsCollector.getMetricsByName(
        widget.config.metric,
        100,
      );
    } else if (widget.config.metrics && Array.isArray(widget.config.metrics)) {
      for (const metricName of widget.config.metrics) {
        relevantMetrics.push(
          ...liveMetricsCollector.getMetricsByName(metricName, 100),
        );
      }
    }

    // Update widget with metrics
    for (const metric of relevantMetrics) {
      this.updateWidget(widgetId, metric);
    }
  }

  /**
   * Calculate trend for a metric
   */
  private calculateTrend(metricName: string): "up" | "down" | "stable" {
    const metrics = liveMetricsCollector.getMetricsByName(metricName, 10);
    if (metrics.length < 5) return "stable";

    const values = metrics.map((m) =>
      typeof m.value === "number" ? m.value : 0,
    );
    const first = values[0];
    const last = values[values.length - 1];

    if (first !== undefined && last !== undefined) {
      if (last > first * 1.05) return "up";
      if (last < first * 0.95) return "down";
    }
    return "stable";
  }

  /**
   * Render dashboard
   */
  private renderDashboard(): void {
    const layout = this.getActiveLayout();
    if (!layout) return;

    const startTime = performance.now();

    for (const widget of layout.widgets) {
      if (widget.visible) {
        this.renderWidget(widget);
        this.state.stats.widgetsRendered++;
      }
    }

    const renderTime = performance.now() - startTime;
    this.state.stats.renderTime = renderTime;

    this.emit("dashboard-rendered", {
      renderTime,
      widgetsRendered: layout.widgets.filter((w) => w.visible).length,
    });
  }

  /**
   * Render individual widget
   */
  private renderWidget(widget: DashboardWidget): void {
    const context = this.renderContexts.get(widget.id);
    if (!context) return;

    // Render based on widget type
    switch (widget.type) {
      case "gauge":
        this.renderGauge(widget, context);
        break;
      case "chart":
        this.renderChart(widget, context);
        break;
      case "table":
      case "metrics":
        this.renderTable(widget, context);
        break;
      case "alerts":
        this.renderAlerts(widget, context);
        break;
      case "custom":
        this.renderCustom(widget, context);
        break;
    }
  }

  /**
   * Render gauge widget
   */
  private renderGauge(widget: DashboardWidget, context: RenderContext): void {
    if (!widget.data) return;

    const { value, unit, thresholds } = widget.data;
    const percentage = Math.min(100, Math.max(0, value));

    // Basic gauge rendering (would use Canvas API in real implementation)
    this.emit("widget-rendered", {
      widgetId: widget.id,
      type: "gauge",
      data: { value, percentage, unit, thresholds },
    });
  }

  /**
   * Render chart widget
   */
  private renderChart(widget: DashboardWidget, context: RenderContext): void {
    if (!widget.data?.series) return;

    const series = widget.data.series as Map<string, any[]>;
    const chartData = Array.from(series.entries()).map(([name, data]) => ({
      name,
      data: data.map((d) => [d.timestamp, d.value]),
    }));

    // Chart rendering (would use Chart.js or similar in real implementation)
    this.emit("widget-rendered", {
      widgetId: widget.id,
      type: "chart",
      data: chartData,
    });
  }

  /**
   * Render table widget
   */
  private renderTable(widget: DashboardWidget, context: RenderContext): void {
    if (!widget.data) return;

    const metrics = widget.data as Map<string, any>;
    const tableData = Array.from(metrics.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      timestamp: data.timestamp,
      trend: data.trend,
    }));

    // Table rendering
    this.emit("widget-rendered", {
      widgetId: widget.id,
      type: "table",
      data: tableData,
    });
  }

  /**
   * Render alerts widget
   */
  private renderAlerts(widget: DashboardWidget, context: RenderContext): void {
    // Alerts rendering
    this.emit("widget-rendered", {
      widgetId: widget.id,
      type: "alerts",
      data: widget.data || [],
    });
  }

  /**
   * Render custom widget
   */
  private renderCustom(widget: DashboardWidget, context: RenderContext): void {
    // Custom widget rendering
    this.emit("custom-widget-render", { widget, context });
  }

  /**
   * Get active layout
   */
  getActiveLayout(): DashboardLayout | undefined {
    return this.state.layouts.get(this.state.activeLayout);
  }

  /**
   * Set active layout
   */
  setActiveLayout(layoutId: string): boolean {
    if (!this.state.layouts.has(layoutId)) {
      return false;
    }

    this.state.activeLayout = layoutId;
    this.emit("layout-changed", layoutId);
    return true;
  }

  /**
   * Add new layout
   */
  addLayout(layout: DashboardLayout): void {
    this.state.layouts.set(layout.id, layout);
    this.emit("layout-added", layout);
  }

  /**
   * Remove layout
   */
  removeLayout(layoutId: string): boolean {
    if (layoutId === this.config.defaultLayout) {
      return false; // Cannot remove default layout
    }

    const deleted = this.state.layouts.delete(layoutId);
    if (deleted && this.state.activeLayout === layoutId) {
      this.state.activeLayout = this.config.defaultLayout;
    }

    if (deleted) {
      this.emit("layout-removed", layoutId);
    }

    return deleted;
  }

  /**
   * Add widget to layout
   */
  addWidget(layoutId: string, widget: DashboardWidget): boolean {
    const layout = this.state.layouts.get(layoutId);
    if (!layout || layout.widgets.length >= this.config.maxWidgets) {
      return false;
    }

    // Check for duplicate ID
    if (layout.widgets.some((w) => w.id === widget.id)) {
      return false;
    }

    layout.widgets.push(widget);
    layout.updatedAt = Date.now();

    this.emit("widget-added", { layoutId, widget });
    return true;
  }

  /**
   * Remove widget from layout
   */
  removeWidget(layoutId: string, widgetId: string): boolean {
    const layout = this.state.layouts.get(layoutId);
    if (!layout) return false;

    const index = layout.widgets.findIndex((w) => w.id === widgetId);
    if (index < 0) return false;

    layout.widgets.splice(index, 1);
    layout.updatedAt = Date.now();

    this.emit("widget-removed", { layoutId, widgetId });
    return true;
  }

  /**
   * Update widget configuration
   */
  updateWidgetConfig(
    layoutId: string,
    widgetId: string,
    config: Record<string, any>,
  ): boolean {
    const layout = this.state.layouts.get(layoutId);
    if (!layout) return false;

    const widget = layout.widgets.find((w) => w.id === widgetId);
    if (!widget) return false;

    widget.config = { ...widget.config, ...config };
    widget.lastUpdated = Date.now();
    layout.updatedAt = Date.now();

    this.emit("widget-updated", { layoutId, widgetId, config });
    return true;
  }

  /**
   * Get dashboard state
   */
  getState(): DashboardState {
    return {
      ...this.state,
      layouts: new Map(this.state.layouts), // Shallow copy
    };
  }

  /**
   * Export dashboard configuration
   */
  exportConfig(): any {
    return {
      config: this.config,
      layouts: Array.from(this.state.layouts.values()),
      activeLayout: this.state.activeLayout,
    };
  }

  /**
   * Import dashboard configuration
   */
  importConfig(configData: any): void {
    if (configData.config) {
      this.config = { ...this.config, ...configData.config };
    }

    if (configData.layouts) {
      this.state.layouts.clear();
      for (const layout of configData.layouts) {
        this.state.layouts.set(layout.id, layout);
      }
    }

    if (configData.activeLayout) {
      this.state.activeLayout = configData.activeLayout;
    }

    this.emit("config-imported");
  }

  /**
   * Register render context for widget
   */
  registerRenderContext(widgetId: string, context: RenderContext): void {
    this.renderContexts.set(widgetId, context);
  }

  /**
   * Unregister render context
   */
  unregisterRenderContext(widgetId: string): void {
    this.renderContexts.delete(widgetId);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    await frameworkLogger.log("dashboard-ui-engine", "config-updated", "info");
    this.emit("config-updated", { ...this.config });
  }
}

// Export singleton instance
export const dashboardUIEngine = new DashboardUIEngine();
