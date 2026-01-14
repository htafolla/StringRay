/**
 * StringRay Framework v1.0.0 - Alert Engine
 *
 * Advanced alert management system for performance dashboards.
 * Handles alert generation, escalation, notification, and lifecycle management.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { EventEmitter } from "events";
import {
  liveMetricsCollector,
  CollectedMetric,
} from "./live-metrics-collector.js";
import { realTimeStreamingService } from "../streaming/real-time-streaming-service.js";

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metricPattern: string; // Regex pattern to match metric names
  sourcePattern?: string; // Optional regex pattern for source IDs
  condition: "gt" | "lt" | "eq" | "ne" | "gte" | "lte" | "anomaly";
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  cooldownMinutes: number;
  autoResolve: boolean;
  resolveThreshold?: number; // Threshold for auto-resolution
  tags: Record<string, string>;
  notificationChannels: string[];
  escalationPolicy?: EscalationPolicy;
  lastTriggered?: number;
  triggerCount: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "acknowledged" | "resolved";
  metric: {
    name: string;
    value: number | string | boolean | object;
    sourceId: string;
    timestamp: number;
  };
  condition: {
    operator: string;
    threshold: number;
    actual: number | string | boolean | object;
  };
  tags: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
  resolvedBy?: string;
  escalationLevel: number;
  notificationsSent: string[];
  metadata: Record<string, any>;
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  repeatIntervalMinutes: number;
  maxEscalationLevel: number;
}

export interface EscalationLevel {
  level: number;
  delayMinutes: number;
  channels: string[];
  recipients: string[];
}

export interface AlertEngineConfig {
  enabled: boolean;
  maxActiveAlerts: number;
  alertRetentionHours: number;
  defaultCooldownMinutes: number;
  anomalyDetection: {
    enabled: boolean;
    sensitivity: "low" | "medium" | "high";
    minDataPoints: number;
  };
  notifications: {
    enabled: boolean;
    channels: NotificationChannel[];
  };
}

export interface NotificationChannel {
  id: string;
  type: "email" | "slack" | "webhook" | "sms" | "pagerduty";
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  alertsBySeverity: Record<string, number>;
  alertsByRule: Record<string, number>;
  averageResolutionTime: number;
  notificationsSent: number;
}

/**
 * Alert engine for managing performance and system alerts
 */
export class AlertEngine extends EventEmitter {
  private config: AlertEngineConfig;
  private rules = new Map<string, AlertRule>();
  private alerts = new Map<string, Alert>();
  private activeAlerts = new Set<string>();
  private alertCooldowns = new Map<string, number>();
  private escalationTimers = new Map<string, NodeJS.Timeout>();
  private isRunning = false;
  private stats: AlertStats;

  constructor(config?: Partial<AlertEngineConfig>) {
    super();

    this.config = {
      enabled: true,
      maxActiveAlerts: 1000,
      alertRetentionHours: 168, // 7 days
      defaultCooldownMinutes: 5,
      anomalyDetection: {
        enabled: true,
        sensitivity: "medium",
        minDataPoints: 10,
      },
      notifications: {
        enabled: true,
        channels: [],
      },
      ...config,
    };

    this.stats = {
      totalAlerts: 0,
      activeAlerts: 0,
      acknowledgedAlerts: 0,
      resolvedAlerts: 0,
      alertsBySeverity: {},
      alertsByRule: {},
      averageResolutionTime: 0,
      notificationsSent: 0,
    };

    this.initializeDefaultRules();
    this.setupEventHandlers();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: "cpu-high-usage",
        name: "High CPU Usage",
        description: "CPU usage exceeds threshold",
        enabled: true,
        metricPattern: "cpu\\.usage",
        condition: "gt",
        threshold: 80,
        severity: "medium",
        cooldownMinutes: 5,
        autoResolve: true,
        resolveThreshold: 60,
        tags: { category: "system", resource: "cpu" },
        notificationChannels: ["email", "slack"],
        triggerCount: 0,
      },
      {
        id: "memory-high-usage",
        name: "High Memory Usage",
        description: "Memory usage exceeds threshold",
        enabled: true,
        metricPattern: "memory\\.usage_percent",
        condition: "gt",
        threshold: 85,
        severity: "high",
        cooldownMinutes: 3,
        autoResolve: true,
        resolveThreshold: 70,
        tags: { category: "system", resource: "memory" },
        notificationChannels: ["email", "slack", "pagerduty"],
        triggerCount: 0,
      },
      {
        id: "bundle-size-exceeded",
        name: "Bundle Size Budget Exceeded",
        description: "Bundle size exceeds performance budget",
        enabled: true,
        metricPattern: "bundle\\.size\\.usage_percent",
        condition: "gt",
        threshold: 100,
        severity: "high",
        cooldownMinutes: 10,
        autoResolve: false,
        tags: { category: "performance", resource: "bundle" },
        notificationChannels: ["email", "slack"],
        triggerCount: 0,
      },
      {
        id: "fcp-budget-violation",
        name: "FCP Budget Violation",
        description: "First Contentful Paint exceeds budget",
        enabled: true,
        metricPattern: "web_vitals\\.fcp",
        condition: "gt",
        threshold: 2000,
        severity: "medium",
        cooldownMinutes: 5,
        autoResolve: true,
        resolveThreshold: 1800,
        tags: { category: "performance", metric: "fcp" },
        notificationChannels: ["email"],
        triggerCount: 0,
      },
      {
        id: "agent-failure-spike",
        name: "Agent Failure Spike",
        description: "Agent failure rate increased significantly",
        enabled: true,
        metricPattern: "agents\\.failed",
        condition: "anomaly",
        threshold: 2.0, // 2 standard deviations
        severity: "critical",
        cooldownMinutes: 2,
        autoResolve: false,
        tags: { category: "application", component: "agents" },
        notificationChannels: ["email", "slack", "pagerduty"],
        triggerCount: 0,
      },
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }
  }

  /**
   * Setup event handlers for metric collection
   */
  private setupEventHandlers(): void {
    liveMetricsCollector.on("metric-collected", (metric: CollectedMetric) => {
      this.evaluateMetricAgainstRules(metric);
    });

    liveMetricsCollector.on("metrics-batch", (metrics: CollectedMetric[]) => {
      for (const metric of metrics) {
        this.evaluateMetricAgainstRules(metric);
      }
    });
  }

  /**
   * Start the alert engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    console.log("🚨 Starting Alert Engine");
    console.log(`   Rules: ${this.rules.size}`);
    console.log(`   Max Active Alerts: ${this.config.maxActiveAlerts}`);
    console.log(
      `   Anomaly Detection: ${this.config.anomalyDetection.enabled ? "enabled" : "disabled"}`,
    );

    this.isRunning = true;
    this.startAlertCleanup();
    this.emit("started");
  }

  /**
   * Stop the alert engine
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear all escalation timers
    for (const timer of this.escalationTimers.values()) {
      clearTimeout(timer);
    }
    this.escalationTimers.clear();

    console.log("🛑 Stopped Alert Engine");
    this.emit("stopped");
  }

  /**
   * Evaluate a metric against all alert rules
   */
  private evaluateMetricAgainstRules(metric: CollectedMetric): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (!this.matchesMetricPattern(metric, rule)) continue;
      if (this.isRuleInCooldown(rule.id)) continue;

      const shouldTrigger = this.evaluateCondition(metric, rule);
      if (shouldTrigger) {
        this.triggerAlert(rule, metric);
      } else {
        // Check for auto-resolution
        this.checkAutoResolve(rule, metric);
      }
    }
  }

  /**
   * Check if metric matches rule pattern
   */
  private matchesMetricPattern(
    metric: CollectedMetric,
    rule: AlertRule,
  ): boolean {
    const nameMatches = new RegExp(rule.metricPattern).test(metric.name);
    if (!nameMatches) return false;

    if (rule.sourcePattern) {
      return new RegExp(rule.sourcePattern).test(metric.sourceId);
    }

    return true;
  }

  /**
   * Check if rule is in cooldown period
   */
  private isRuleInCooldown(ruleId: string): boolean {
    const lastTriggered = this.alertCooldowns.get(ruleId);
    if (!lastTriggered) return false;

    const cooldownMs =
      this.rules.get(ruleId)?.cooldownMinutes ||
      this.config.defaultCooldownMinutes;
    return Date.now() - lastTriggered < cooldownMs * 60 * 1000;
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(metric: CollectedMetric, rule: AlertRule): boolean {
    if (rule.condition === "anomaly") {
      return this.detectAnomaly(metric, rule);
    }

    const value = typeof metric.value === "number" ? metric.value : 0;

    switch (rule.condition) {
      case "gt":
        return value > rule.threshold;
      case "lt":
        return value < rule.threshold;
      case "eq":
        return value === rule.threshold;
      case "ne":
        return value !== rule.threshold;
      case "gte":
        return value >= rule.threshold;
      case "lte":
        return value <= rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Detect anomalies in metric data
   */
  private detectAnomaly(metric: CollectedMetric, rule: AlertRule): boolean {
    if (!this.config.anomalyDetection.enabled) return false;

    const metrics = liveMetricsCollector.getMetricsByName(
      metric.name,
      this.config.anomalyDetection.minDataPoints,
    );
    if (metrics.length < this.config.anomalyDetection.minDataPoints)
      return false;

    const values = metrics.map((m) =>
      typeof m.value === "number" ? m.value : 0,
    );
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return false;

    const currentValue = typeof metric.value === "number" ? metric.value : 0;
    const zScore = Math.abs(currentValue - mean) / stdDev;

    const sensitivityThreshold = {
      low: 3.0,
      medium: 2.5,
      high: 2.0,
    }[this.config.anomalyDetection.sensitivity];

    return zScore > (sensitivityThreshold || 2.5);
  }

  /**
   * Trigger a new alert
   */
  private triggerAlert(rule: AlertRule, metric: CollectedMetric): void {
    const alertId = `alert_${rule.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      title: rule.name,
      description: rule.description,
      severity: rule.severity,
      status: "active",
      metric: {
        name: metric.name,
        value: metric.value,
        sourceId: metric.sourceId,
        timestamp: metric.timestamp,
      },
      condition: {
        operator: rule.condition,
        threshold: rule.threshold,
        actual: metric.value,
      },
      tags: { ...rule.tags, ...metric.tags },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      escalationLevel: 0,
      notificationsSent: [],
      metadata: {
        rule: rule,
        metric: metric,
      },
    };

    this.alerts.set(alertId, alert);
    this.activeAlerts.add(alertId);
    this.alertCooldowns.set(rule.id, Date.now());
    rule.triggerCount++;
    rule.lastTriggered = Date.now();

    this.stats.totalAlerts++;
    this.stats.activeAlerts++;
    this.stats.alertsBySeverity[alert.severity] =
      (this.stats.alertsBySeverity[alert.severity] || 0) + 1;
    this.stats.alertsByRule[rule.id] =
      (this.stats.alertsByRule[rule.id] || 0) + 1;

    // Check if we've exceeded max active alerts
    if (this.activeAlerts.size > this.config.maxActiveAlerts) {
      this.pruneOldestAlerts();
    }

    // Send notifications
    this.sendAlertNotifications(alert);

    // Start escalation if policy exists
    if (rule.escalationPolicy) {
      this.startEscalation(alert);
    }

    this.emit("alert-triggered", alert);

    // Emit alert event for WebSocket broadcasting
    this.emit("alert-triggered", alert);
  }

  /**
   * Check for auto-resolution of alerts
   */
  private checkAutoResolve(rule: AlertRule, metric: CollectedMetric): void {
    if (!rule.autoResolve || !rule.resolveThreshold) return;

    // Find active alerts for this rule
    const activeAlerts = Array.from(this.activeAlerts)
      .map((id) => this.alerts.get(id))
      .filter(
        (alert) =>
          alert && alert.ruleId === rule.id && alert.status === "active",
      );

    for (const alert of activeAlerts) {
      if (!alert) continue;

      const value = typeof metric.value === "number" ? metric.value : 0;
      const shouldResolve =
        rule.condition === "gt"
          ? value <= rule.resolveThreshold
          : value >= rule.resolveThreshold;

      if (shouldResolve) {
        this.resolveAlert(alert.id, "auto-resolve");
      }
    }
  }

  /**
   * Send notifications for an alert
   */
  private sendAlertNotifications(alert: Alert): void {
    const rule = this.rules.get(alert.ruleId);
    if (!rule || !this.config.notifications.enabled) return;

    for (const channelId of rule.notificationChannels) {
      const channel = this.config.notifications.channels.find(
        (c) => c.id === channelId,
      );
      if (channel && channel.enabled) {
        this.sendNotification(channel, alert);
        alert.notificationsSent.push(channelId);
        this.stats.notificationsSent++;
      }
    }
  }

  /**
   * Send notification via a specific channel
   */
  private sendNotification(channel: NotificationChannel, alert: Alert): void {
    try {
      switch (channel.type) {
        case "email":
          this.sendEmailNotification(channel, alert);
          break;
        case "slack":
          this.sendSlackNotification(channel, alert);
          break;
        case "webhook":
          this.sendWebhookNotification(channel, alert);
          break;
        case "sms":
          this.sendSmsNotification(channel, alert);
          break;
        case "pagerduty":
          this.sendPagerDutyNotification(channel, alert);
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${channel.type} notification:`, error);
    }
  }

  /**
   * Send email notification
   */
  private sendEmailNotification(
    channel: NotificationChannel,
    alert: Alert,
  ): void {
    console.log(`📧 Email notification: ${alert.title} - ${alert.description}`);
    // Implementation would integrate with email service
  }

  /**
   * Send Slack notification
   */
  private sendSlackNotification(
    channel: NotificationChannel,
    alert: Alert,
  ): void {
    console.log(`💬 Slack notification: ${alert.title} - ${alert.description}`);
    // Implementation would integrate with Slack API
  }

  /**
   * Send webhook notification
   */
  private sendWebhookNotification(
    channel: NotificationChannel,
    alert: Alert,
  ): void {
    console.log(
      `🔗 Webhook notification: ${alert.title} - ${alert.description}`,
    );
    // Implementation would make HTTP request to webhook URL
  }

  /**
   * Send SMS notification
   */
  private sendSmsNotification(
    channel: NotificationChannel,
    alert: Alert,
  ): void {
    console.log(`📱 SMS notification: ${alert.title} - ${alert.description}`);
    // Implementation would integrate with SMS service
  }

  /**
   * Send PagerDuty notification
   */
  private sendPagerDutyNotification(
    channel: NotificationChannel,
    alert: Alert,
  ): void {
    console.log(
      `🚨 PagerDuty notification: ${alert.title} - ${alert.description}`,
    );
    // Implementation would integrate with PagerDuty API
  }

  /**
   * Start escalation for an alert
   */
  private startEscalation(alert: Alert): void {
    const rule = this.rules.get(alert.ruleId);
    if (!rule?.escalationPolicy) return;

    const policy = rule.escalationPolicy;
    let currentLevel = 0;

    const escalate = () => {
      if (
        currentLevel >= policy.maxEscalationLevel ||
        alert.status !== "active"
      ) {
        return;
      }

      currentLevel++;
      alert.escalationLevel = currentLevel;
      alert.updatedAt = Date.now();

      const level = policy.levels.find((l) => l.level === currentLevel);
      if (level) {
        // Send escalated notifications
        for (const channelId of level.channels) {
          const channel = this.config.notifications.channels.find(
            (c) => c.id === channelId,
          );
          if (channel && channel.enabled) {
            this.sendNotification(channel, alert);
          }
        }

        this.emit("alert-escalated", { alert, level: currentLevel });
      }

      // Schedule next escalation
      if (currentLevel < policy.maxEscalationLevel) {
        const nextLevel = policy.levels.find(
          (l) => l.level === currentLevel + 1,
        );
        if (nextLevel) {
          const timer = setTimeout(
            escalate,
            nextLevel.delayMinutes * 60 * 1000,
          );
          this.escalationTimers.set(alert.id, timer);
        }
      }
    };

    // Start initial escalation after delay
    const firstLevel = policy.levels.find((l) => l.level === 1);
    if (firstLevel) {
      const timer = setTimeout(escalate, firstLevel.delayMinutes * 60 * 1000);
      this.escalationTimers.set(alert.id, timer);
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== "active") {
      return false;
    }

    alert.status = "acknowledged";
    alert.acknowledgedAt = Date.now();
    if (acknowledgedBy) {
      alert.acknowledgedBy = acknowledgedBy;
    }
    alert.updatedAt = Date.now();

    this.stats.activeAlerts--;
    this.stats.acknowledgedAlerts++;

    // Clear escalation timer
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    this.emit("alert-acknowledged", alert);
    return true;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status === "resolved") {
      return false;
    }

    alert.status = "resolved";
    alert.resolvedAt = Date.now();
    if (resolvedBy) {
      alert.resolvedBy = resolvedBy;
    }
    alert.updatedAt = Date.now();

    this.activeAlerts.delete(alertId);
    this.stats.activeAlerts--;
    this.stats.resolvedAlerts++;

    // Clear escalation timer
    const timer = this.escalationTimers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(alertId);
    }

    // Update average resolution time
    if (alert.resolvedAt && alert.createdAt) {
      const resolutionTime = alert.resolvedAt - alert.createdAt;
      const totalResolved = this.stats.resolvedAlerts;
      this.stats.averageResolutionTime =
        (this.stats.averageResolutionTime * (totalResolved - 1) +
          resolutionTime) /
        totalResolved;
    }

    this.emit("alert-resolved", alert);
    return true;
  }

  /**
   * Prune oldest alerts when exceeding max active alerts
   */
  private pruneOldestAlerts(): void {
    const activeAlertList = Array.from(this.activeAlerts)
      .map((id) => ({ id, alert: this.alerts.get(id) }))
      .filter((item) => item.alert)
      .sort((a, b) => (a.alert?.createdAt || 0) - (b.alert?.createdAt || 0));

    const toPrune = activeAlertList.slice(
      0,
      this.activeAlerts.size - this.config.maxActiveAlerts + 1,
    );

    for (const item of toPrune) {
      this.resolveAlert(item.id, "auto-prune");
    }
  }

  /**
   * Start alert cleanup (remove old resolved alerts)
   */
  private startAlertCleanup(): void {
    setInterval(
      () => {
        const cutoffTime =
          Date.now() - this.config.alertRetentionHours * 60 * 60 * 1000;

        for (const [alertId, alert] of this.alerts) {
          if (
            alert.status === "resolved" &&
            alert.resolvedAt &&
            alert.resolvedAt < cutoffTime
          ) {
            this.alerts.delete(alertId);
          }
        }
      },
      60 * 60 * 1000,
    ); // Clean up every hour
  }

  /**
   * Get all alerts
   */
  getAlerts(
    status?: "active" | "acknowledged" | "resolved",
    limit?: number,
  ): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (status) {
      alerts = alerts.filter((alert) => alert.status === status);
    }

    alerts.sort((a, b) => b.createdAt - a.createdAt);

    if (limit) {
      alerts = alerts.slice(0, limit);
    }

    return alerts;
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get alerts by rule
   */
  getAlertsByRule(ruleId: string): Alert[] {
    return Array.from(this.alerts.values())
      .filter((alert) => alert.ruleId === ruleId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get all alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get alert rule by ID
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Add or update alert rule
   */
  setRule(rule: AlertRule): void {
    this.rules.set(rule.id, { ...rule });
    this.emit("rule-updated", rule);
  }

  /**
   * Remove alert rule
   */
  removeRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    // Resolve all active alerts for this rule
    const activeAlerts = this.getAlertsByRule(ruleId).filter(
      (a) => a.status === "active",
    );
    for (const alert of activeAlerts) {
      this.resolveAlert(alert.id, "rule-removed");
    }

    this.rules.delete(ruleId);
    this.emit("rule-removed", ruleId);
    return true;
  }

  /**
   * Enable or disable alert rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return false;
    }

    rule.enabled = enabled;
    this.emit("rule-updated", rule);
    return true;
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    return { ...this.stats };
  }

  /**
   * Add notification channel
   */
  addNotificationChannel(channel: NotificationChannel): void {
    const existingIndex = this.config.notifications.channels.findIndex(
      (c) => c.id === channel.id,
    );
    if (existingIndex >= 0) {
      this.config.notifications.channels[existingIndex] = channel;
    } else {
      this.config.notifications.channels.push(channel);
    }
    this.emit("channel-added", channel);
  }

  /**
   * Remove notification channel
   */
  removeNotificationChannel(channelId: string): boolean {
    const index = this.config.notifications.channels.findIndex(
      (c) => c.id === channelId,
    );
    if (index < 0) {
      return false;
    }

    this.config.notifications.channels.splice(index, 1);
    this.emit("channel-removed", channelId);
    return true;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AlertEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("⚙️ Alert Engine configuration updated");
    this.emit("config-updated", { ...this.config });
  }
}

// Export singleton instance
export const alertEngine = new AlertEngine();
