/**
 * StringRay AI v1.1.1 - Advanced Monitoring System
 *
 * Real-time monitoring with anomaly detection and alerting.
 * Provides comprehensive framework health tracking and automated responses.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
export class AnomalyDetector {
    historicalData = [];
    maxHistorySize = 1000;
    anomalyThreshold = 2.5; // Standard deviations
    /**
     * Detect anomalies in current metrics
     */
    detectAnomalies(currentMetrics) {
        const anomalies = [];
        if (this.historicalData.length < 10) {
            return anomalies; // Need minimum history for detection
        }
        // Detect performance anomalies
        const perfAnomaly = this.detectPerformanceAnomaly(currentMetrics);
        if (perfAnomaly.detected) {
            anomalies.push(perfAnomaly);
        }
        // Detect error rate anomalies
        const errorAnomaly = this.detectErrorAnomaly(currentMetrics);
        if (errorAnomaly.detected) {
            anomalies.push(errorAnomaly);
        }
        // Detect resource usage anomalies
        const resourceAnomaly = this.detectResourceAnomaly(currentMetrics);
        if (resourceAnomaly.detected) {
            anomalies.push(resourceAnomaly);
        }
        // Detect agent health anomalies
        const agentAnomalies = this.detectAgentAnomalies(currentMetrics);
        anomalies.push(...agentAnomalies);
        return anomalies;
    }
    updateHistory(metrics) {
        this.historicalData.push(metrics);
        if (this.historicalData.length > this.maxHistorySize) {
            this.historicalData = this.historicalData.slice(-this.maxHistorySize);
        }
    }
    detectPerformanceAnomaly(metrics) {
        const recentMetrics = this.historicalData.slice(-20);
        const avgLatency = recentMetrics.reduce((sum, m) => sum + m.performanceMetrics.latency.p95, 0) / recentMetrics.length;
        const currentLatency = metrics.performanceMetrics.latency.p95;
        const stdDev = Math.sqrt(recentMetrics.reduce((sum, m) => sum + Math.pow(m.performanceMetrics.latency.p95 - avgLatency, 2), 0) / recentMetrics.length);
        const zScore = Math.abs(currentLatency - avgLatency) / stdDev;
        if (zScore > this.anomalyThreshold) {
            return {
                detected: true,
                anomalyType: "performance_degradation",
                confidence: Math.min(zScore / 3, 1),
                description: `Latency spike detected: ${currentLatency.toFixed(0)}ms (normal: ${avgLatency.toFixed(0)}ms)`,
                affectedComponents: ["system"],
                recommendedActions: [
                    "Check system resources",
                    "Review recent task patterns",
                    "Consider scaling agents",
                ],
                severity: zScore > 4 ? "critical" : zScore > 3 ? "high" : "medium",
            };
        }
        return {
            detected: false,
            anomalyType: "",
            confidence: 0,
            description: "",
            affectedComponents: [],
            recommendedActions: [],
            severity: "low",
        };
    }
    detectErrorAnomaly(metrics) {
        const recentMetrics = this.historicalData.slice(-10);
        const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.performanceMetrics.errorRate, 0) / recentMetrics.length;
        const currentErrorRate = metrics.performanceMetrics.errorRate;
        if (currentErrorRate > avgErrorRate * 3 && currentErrorRate > 0.05) {
            // 5% error rate threshold
            return {
                detected: true,
                anomalyType: "error_rate_spike",
                confidence: Math.min(currentErrorRate / avgErrorRate / 2, 1),
                description: `Error rate spike: ${(currentErrorRate * 100).toFixed(1)}% (normal: ${(avgErrorRate * 100).toFixed(1)}%)`,
                affectedComponents: this.identifyErrorSources(metrics),
                recommendedActions: [
                    "Check recent error logs",
                    "Review agent health status",
                    "Investigate failing tasks",
                ],
                severity: currentErrorRate > 0.2
                    ? "critical"
                    : currentErrorRate > 0.1
                        ? "high"
                        : "medium",
            };
        }
        return {
            detected: false,
            anomalyType: "",
            confidence: 0,
            description: "",
            affectedComponents: [],
            recommendedActions: [],
            severity: "low",
        };
    }
    detectResourceAnomaly(metrics) {
        const recentMetrics = this.historicalData.slice(-5);
        const avgMemory = recentMetrics.reduce((sum, m) => sum + m.performanceMetrics.resourceUtilization.memory, 0) / recentMetrics.length;
        const avgCpu = recentMetrics.reduce((sum, m) => sum + m.performanceMetrics.resourceUtilization.cpu, 0) / recentMetrics.length;
        const currentMemory = metrics.performanceMetrics.resourceUtilization.memory;
        const currentCpu = metrics.performanceMetrics.resourceUtilization.cpu;
        const memorySpike = currentMemory > avgMemory * 1.5 && currentMemory > 80;
        const cpuSpike = currentCpu > avgCpu * 1.5 && currentCpu > 85;
        if (memorySpike || cpuSpike) {
            const issues = [];
            if (memorySpike)
                issues.push(`memory usage: ${currentMemory.toFixed(1)}%`);
            if (cpuSpike)
                issues.push(`CPU usage: ${currentCpu.toFixed(1)}%`);
            return {
                detected: true,
                anomalyType: "resource_overload",
                confidence: 0.8,
                description: `Resource overload detected: ${issues.join(", ")}`,
                affectedComponents: ["system"],
                recommendedActions: [
                    "Monitor resource-intensive tasks",
                    "Consider resource optimization",
                    "Check for memory leaks",
                    "Evaluate load balancing",
                ],
                severity: (memorySpike && currentMemory > 95) || (cpuSpike && currentCpu > 95)
                    ? "critical"
                    : "high",
            };
        }
        return {
            detected: false,
            anomalyType: "",
            confidence: 0,
            description: "",
            affectedComponents: [],
            recommendedActions: [],
            severity: "low",
        };
    }
    detectAgentAnomalies(metrics) {
        const anomalies = [];
        for (const [agentId, agentMetrics] of Object.entries(metrics.agentMetrics)) {
            // Check for unresponsive agents
            if (Date.now() - agentMetrics.lastActivity > 300000) {
                // 5 minutes
                anomalies.push({
                    detected: true,
                    anomalyType: "agent_unresponsive",
                    confidence: 0.9,
                    description: `Agent ${agentId} has been inactive for ${(Date.now() - agentMetrics.lastActivity) / 60000} minutes`,
                    affectedComponents: [agentId],
                    recommendedActions: [
                        "Check agent health status",
                        "Restart unresponsive agent",
                        "Review agent logs",
                    ],
                    severity: "high",
                });
            }
            // Check for high failure rates
            const failureRate = agentMetrics.failedTasks /
                (agentMetrics.completedTasks + agentMetrics.failedTasks);
            if (failureRate > 0.3 &&
                agentMetrics.completedTasks + agentMetrics.failedTasks > 5) {
                anomalies.push({
                    detected: true,
                    anomalyType: "agent_high_failure_rate",
                    confidence: 0.85,
                    description: `Agent ${agentId} has ${(failureRate * 100).toFixed(1)}% failure rate`,
                    affectedComponents: [agentId],
                    recommendedActions: [
                        "Review agent error logs",
                        "Check agent configuration",
                        "Consider agent replacement",
                    ],
                    severity: failureRate > 0.5 ? "critical" : "high",
                });
            }
        }
        return anomalies;
    }
    identifyErrorSources(metrics) {
        const sources = [];
        for (const [agentId, agentMetrics] of Object.entries(metrics.agentMetrics)) {
            if (agentMetrics.failedTasks > agentMetrics.completedTasks * 0.1) {
                sources.push(agentId);
            }
        }
        return sources.length > 0 ? sources : ["system"];
    }
}
export class AlertManager {
    rules = new Map();
    activeAlerts = new Map();
    alertHistory = [];
    maxHistorySize = 1000;
    /**
     * Add an alert rule
     */
    addRule(rule) {
        this.rules.set(rule.id, rule);
    }
    removeRule(ruleId) {
        this.rules.delete(ruleId);
    }
    /**
     * Evaluate metrics against all rules
     */
    evaluateRules(metrics) {
        const newAlerts = [];
        for (const rule of this.rules.values()) {
            if (!rule.enabled)
                continue;
            // Check cooldown
            if (rule.lastTriggered &&
                Date.now() - rule.lastTriggered < rule.cooldown) {
                continue;
            }
            // Evaluate condition
            if (rule.condition(metrics)) {
                const crypto = require("crypto");
                const alert = {
                    id: `alert_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
                    ruleId: rule.id,
                    timestamp: Date.now(),
                    severity: rule.severity,
                    message: rule.description,
                    metrics: this.extractRelevantMetrics(metrics, rule),
                    acknowledged: false,
                    resolved: false,
                };
                this.activeAlerts.set(alert.id, alert);
                this.alertHistory.push(alert);
                rule.lastTriggered = Date.now();
                newAlerts.push(alert);
                // Maintain history size
                if (this.alertHistory.length > this.maxHistorySize) {
                    this.alertHistory = this.alertHistory.slice(-this.maxHistorySize);
                }
            }
        }
        return newAlerts;
    }
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            return true;
        }
        return false;
    }
    /**
     * Resolve an alert
     */
    resolveAlert(alertId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            this.activeAlerts.delete(alertId);
            return true;
        }
        return false;
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    /**
     * Get alert history
     */
    getAlertHistory(limit) {
        const history = [...this.alertHistory].reverse();
        return limit ? history.slice(0, limit) : history;
    }
    extractRelevantMetrics(metrics, rule) {
        // Extract metrics relevant to the rule - simplified implementation
        return {
            timestamp: metrics.timestamp,
            systemMetrics: metrics.systemMetrics,
            performanceMetrics: metrics.performanceMetrics,
        };
    }
}
export class AdvancedMonitor {
    anomalyDetector;
    alertManager;
    metricsHistory = [];
    maxHistorySize = 1000;
    monitoringInterval;
    alertCallbacks = [];
    anomalyCallbacks = [];
    constructor() {
        this.anomalyDetector = new AnomalyDetector();
        this.alertManager = new AlertManager();
        this.initializeDefaultRules();
    }
    /**
     * Start monitoring
     */
    startMonitoring(intervalMs = 30000) {
        this.monitoringInterval = setInterval(() => {
            this.collectAndAnalyzeMetrics();
        }, intervalMs);
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
    }
    /**
     * Manually collect and analyze metrics
     */
    async collectAndAnalyzeMetrics() {
        const metrics = await this.collectMetrics();
        const alerts = this.alertManager.evaluateRules(metrics);
        const anomalies = this.anomalyDetector.detectAnomalies(metrics);
        this.metricsHistory.push(metrics);
        if (this.metricsHistory.length > this.maxHistorySize) {
            this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
        }
        this.anomalyDetector.updateHistory(metrics);
        if (alerts.length > 0) {
            this.alertCallbacks.forEach((callback) => callback(alerts));
        }
        if (anomalies.length > 0) {
            this.anomalyCallbacks.forEach((callback) => callback(anomalies));
        }
        return { metrics, alerts, anomalies };
    }
    /**
     * Add alert callback
     */
    onAlert(callback) {
        this.alertCallbacks.push(callback);
    }
    /**
     * Add anomaly callback
     */
    onAnomaly(callback) {
        this.anomalyCallbacks.push(callback);
    }
    /**
     * Get current system health status
     */
    getHealthStatus() {
        const activeAlerts = this.alertManager.getActiveAlerts();
        const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");
        const highAlerts = activeAlerts.filter((a) => a.severity === "error");
        let overall = "healthy";
        if (criticalAlerts.length > 0) {
            overall = "unhealthy";
        }
        else if (highAlerts.length > 0) {
            overall = "degraded";
        }
        // Check recent anomalies (last hour)
        const oneHourAgo = Date.now() - 3600000;
        const recentAnomalies = this.metricsHistory
            .filter((m) => m.timestamp > oneHourAgo)
            .reduce((count, m) => count + this.anomalyDetector.detectAnomalies(m).length, 0);
        return {
            overall,
            activeAlerts: activeAlerts.length,
            recentAnomalies,
            uptime: process.uptime() * 1000,
            lastCheck: Date.now(),
        };
    }
    /**
     * Get monitoring statistics
     */
    getMonitoringStats() {
        const allAnomalies = this.metricsHistory.reduce((count, m) => count + this.anomalyDetector.detectAnomalies(m).length, 0);
        return {
            totalMetrics: this.metricsHistory.length,
            totalAlerts: this.alertManager.getAlertHistory().length,
            totalAnomalies: allAnomalies,
            activeRules: Array.from(this.alertManager["rules"].values()).filter((r) => r.enabled).length,
            monitoringActive: this.monitoringInterval !== undefined,
        };
    }
    async collectMetrics() {
        // This is a simplified implementation - in practice, this would collect
        // real metrics from the framework components
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            timestamp: Date.now(),
            agentMetrics: {},
            systemMetrics: {
                totalAgents: 8,
                activeAgents: 7,
                totalTasks: 150,
                queuedTasks: 5,
                completedTasks: 140,
                failedTasks: 5,
                averageTaskDuration: 250,
                uptime: process.uptime() * 1000,
                memoryUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
                cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
            },
            performanceMetrics: {
                throughput: 2.5,
                latency: {
                    p50: 200,
                    p95: 500,
                    p99: 1000,
                },
                errorRate: 0.033,
                resourceUtilization: {
                    memory: (memUsage.heapUsed / memUsage.heapTotal) * 100,
                    cpu: (cpuUsage.user + cpuUsage.system) / 10000,
                    network: 0, // Placeholder
                },
            },
            errorMetrics: {
                totalErrors: 5,
                errorRate: 0.033,
                errorTypes: { timeout: 3, validation: 2 },
                recentErrors: [],
            },
        };
    }
    initializeDefaultRules() {
        // High error rate alert
        this.alertManager.addRule({
            id: "high_error_rate",
            name: "High Error Rate",
            description: "System error rate exceeds 5%",
            condition: (metrics) => metrics.performanceMetrics.errorRate > 0.05,
            severity: "error",
            cooldown: 300000, // 5 minutes
            enabled: true,
        });
        // High latency alert
        this.alertManager.addRule({
            id: "high_latency",
            name: "High Latency",
            description: "P95 latency exceeds 1 second",
            condition: (metrics) => metrics.performanceMetrics.latency.p95 > 1000,
            severity: "warning",
            cooldown: 600000, // 10 minutes
            enabled: true,
        });
        // Resource overload alert
        this.alertManager.addRule({
            id: "resource_overload",
            name: "Resource Overload",
            description: "Memory or CPU usage exceeds 90%",
            condition: (metrics) => metrics.performanceMetrics.resourceUtilization.memory > 90 ||
                metrics.performanceMetrics.resourceUtilization.cpu > 90,
            severity: "critical",
            cooldown: 120000, // 2 minutes
            enabled: true,
        });
        // Agent failure alert
        this.alertManager.addRule({
            id: "agent_failures",
            name: "Agent Failures",
            description: "Multiple agents are failing tasks",
            condition: (metrics) => Object.values(metrics.agentMetrics).filter((a) => a.healthStatus === "unhealthy").length > 2,
            severity: "error",
            cooldown: 300000, // 5 minutes
            enabled: true,
        });
    }
}
export const advancedMonitor = new AdvancedMonitor();
//# sourceMappingURL=advanced-monitor.js.map