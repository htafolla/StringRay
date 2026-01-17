import { EventEmitter } from "events";

/**
 * Memory Monitor - Comprehensive memory tracking and leak detection
 * Integrates with framework logging system
 */

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
  sessionId?: string;
}

export interface MemoryLeakAlert {
  type: "leak_detected" | "high_usage" | "spike_detected";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details: {
    currentUsage: number;
    threshold: number;
    trend: "increasing" | "stable" | "decreasing";
    recommendations: string[];
  };
}

export interface MemoryMonitorConfig {
  checkInterval: number;
  alertThresholds: {
    warning: number;
    critical: number;
    leakDetection: {
      growthRate: number;
      sustainedPeriod: number;
    };
  };
  enableFrameworkLogging: boolean;
  sessionTracking: boolean;
}

export interface MemorySummary {
  current: MemoryStats;
  peak: MemoryStats;
  average: number;
  trend: "increasing" | "stable" | "decreasing";
}

export class MemoryMonitor extends EventEmitter {
  private config: MemoryMonitorConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private statsHistory: MemoryStats[] = [];
  private maxHistorySize = 1000;
  private leakDetectionEnabled = true;
  private lastLeakCheck = Date.now();
  private leakCheckInterval = 5 * 60 * 1000;

  constructor(config: Partial<MemoryMonitorConfig> = {}) {
    super();

    this.config = {
      checkInterval: 30000,
      alertThresholds: {
        warning: 200,
        critical: 400,
        leakDetection: {
          growthRate: 10,
          sustainedPeriod: 10,
        },
      },
      enableFrameworkLogging: true,
      sessionTracking: true,
      ...config,
    };
  }

  /**
   * Start memory monitoring
   */
  start(): void {
    this.log("🔍 Starting Memory Monitor...");
    this.monitoringInterval = setInterval(() => {
      this.checkMemory();
    }, this.config.checkInterval);

    this.checkMemory();
  }

  /**
   * Stop memory monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.monitoringInterval = null;
    this.log("🛑 Memory Monitor stopped");
  }

  /**
   * Get current memory statistics
   */
  getCurrentStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((memUsage.external / 1024 / 1024) * 100) / 100,
      rss: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
      timestamp: Date.now(),
    };
  }

  /**
   * Check memory usage and detect issues
   */
  private checkMemory(): void {
    const stats = this.getCurrentStats();
    this.statsHistory.push(stats);

    if (this.statsHistory.length > this.maxHistorySize) {
      this.statsHistory.shift();
    }

    this.checkThresholds(stats);

    if (
      this.leakDetectionEnabled &&
      Date.now() - this.lastLeakCheck > this.leakCheckInterval
    ) {
      this.detectMemoryLeaks();
      this.lastLeakCheck = Date.now();
    }

    if (this.config.enableFrameworkLogging) {
      this.logFrameworkMemory(stats);
    }
  }

  /**
   * Check memory usage against thresholds
   */
  private checkThresholds(stats: MemoryStats): void {
    const heapMB = stats.heapUsed;

    if (heapMB >= this.config.alertThresholds.critical) {
      this.emitAlert({
        type: "high_usage",
        severity: "critical",
        message: `Critical memory usage: ${heapMB.toFixed(2)}MB (threshold: ${this.config.alertThresholds.critical}MB)`,
        details: {
          currentUsage: heapMB,
          threshold: this.config.alertThresholds.critical,
          trend: this.calculateTrend(),
          recommendations: [
            "Force garbage collection if available",
            "Check for memory leaks in caches and event listeners",
            "Consider reducing concurrent operations",
            "Monitor large data structures (Maps, Sets, Arrays)",
          ],
        },
      });
    } else if (heapMB >= this.config.alertThresholds.warning) {
      this.emitAlert({
        type: "high_usage",
        severity: "high",
        message: `High memory usage: ${heapMB.toFixed(2)}MB (threshold: ${this.config.alertThresholds.warning}MB)`,
        details: {
          currentUsage: heapMB,
          threshold: this.config.alertThresholds.warning,
          trend: this.calculateTrend(),
          recommendations: [
            "Monitor memory growth rate",
            "Check for inefficient algorithms",
            "Consider memory optimization techniques",
          ],
        },
      });
    }
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    if (this.statsHistory.length < 10) return;

    const recentStats = this.statsHistory.slice(-20);
    if (recentStats.length < 2) return;

    const timeSpan =
      recentStats[recentStats.length - 1]!.timestamp -
      recentStats[0]!.timestamp;
    const timeSpanMinutes = timeSpan / (1000 * 60);

    if (timeSpanMinutes < 1) return;

    const startUsage = recentStats[0]!.heapUsed;
    const endUsage = recentStats[recentStats.length - 1]!.heapUsed;
    const growthRate = (endUsage - startUsage) / timeSpanMinutes;

    if (growthRate > this.config.alertThresholds.leakDetection.growthRate) {
      const sustainedPeriod =
        this.config.alertThresholds.leakDetection.sustainedPeriod;
      if (timeSpanMinutes >= sustainedPeriod) {
        this.emitAlert({
          type: "leak_detected",
          severity: "medium",
          message: `Potential memory leak detected: ${growthRate.toFixed(2)}MB/min growth rate over ${timeSpanMinutes.toFixed(1)} minutes`,
          details: {
            currentUsage: endUsage,
            threshold: this.config.alertThresholds.leakDetection.growthRate,
            trend: "increasing",
            recommendations: [
              "Check for uncleansed event listeners",
              "Review timer/interval cleanup",
              "Inspect cache growth in Map/Set structures",
              "Monitor object retention in closures",
              "Consider memory profiling tools",
            ],
          },
        });
      }
    }
  }

  /**
   * Calculate memory usage trend
   */
  private calculateTrend(): "increasing" | "stable" | "decreasing" {
    if (this.statsHistory.length < 5) return "stable";

    const recent = this.statsHistory.slice(-5);
    const older = this.statsHistory.slice(-10, -5);

    const recentAvg =
      recent.reduce((sum, s) => sum + s.heapUsed, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, s) => sum + s.heapUsed, 0) / older.length;

    const diff = recentAvg - olderAvg;
    const threshold = 5;

    if (diff > threshold) return "increasing";
    if (diff < -threshold) return "decreasing";
    return "stable";
  }

  /**
   * Emit memory alert
   */
  private emitAlert(alert: MemoryLeakAlert): void {
    this.emit("alert", alert);

    const severityEmoji: { [key: string]: string } = {
      low: "ℹ️",
      medium: "⚠️",
      high: "🔴",
      critical: "🚨",
    };

    this.log(`${severityEmoji[alert.severity]} MEMORY ALERT: ${alert.message}`);

    alert.details.recommendations.forEach((rec) => {
      this.log(`  💡 ${rec}`);
    });
  }

  /**
   * Log memory stats to framework log
   */
  private logFrameworkMemory(stats: MemoryStats): void {
    const logEntry = `🧠 Memory: ${stats.heapUsed.toFixed(1)}MB heap, ${stats.heapTotal.toFixed(1)}MB total, ${stats.external.toFixed(1)}MB external, ${stats.rss.toFixed(1)}MB RSS`;
    this.log(logEntry);
  }

  /**
   * Get memory usage history
   */
  getHistory(hours: number = 1): MemoryStats[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.statsHistory.filter((stat) => stat.timestamp >= cutoff);
  }

  /**
   * Get memory usage summary
   */
  getSummary(): MemorySummary {
    const current = this.getCurrentStats();
    const peak = this.statsHistory.reduce(
      (max, stat) => (stat.heapUsed > max.heapUsed ? stat : max),
      this.statsHistory[0] || current,
    );
    const average =
      this.statsHistory.length > 0
        ? this.statsHistory.reduce((sum, stat) => sum + stat.heapUsed, 0) /
          this.statsHistory.length
        : current.heapUsed;

    return {
      current,
      peak,
      average: Math.round(average * 100) / 100,
      trend: this.calculateTrend(),
    };
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC(): boolean {
    if (global.gc) {
      const before = this.getCurrentStats().heapUsed;
      global.gc();
      const after = this.getCurrentStats().heapUsed;
      const freed = before - after;

      this.log(
        `🗑️ GC: Freed ${freed.toFixed(2)}MB (${before.toFixed(2)}MB → ${after.toFixed(2)}MB)`,
      );
      return true;
    }
    return false;
  }

  /**
   * Internal logging method - writes to framework log only
   */
  private log(message: string): void {
    // Write to framework activity log instead of console
    try {
      const fs = require("fs");
      const logDir = "./logs/monitoring";
      const logFile = `${logDir}/memory-monitor-${new Date().toISOString().split("T")[0]}.log`;

      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logEntry = `[${new Date().toISOString()}] ${message}\n`;
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      // Silent fail - don't spam console with logging errors
    }
  }
}

// Export singleton instance
export const memoryMonitor = new MemoryMonitor();

// Helper functions
export function getMemoryUsage(): MemoryStats {
  return memoryMonitor.getCurrentStats();
}

export function logMemoryUsage(): void {
  const stats = getMemoryUsage();
  // Memory monitor logging - already handled by frameworkLogger
  console.log(
    `🧠 Memory Usage: ${stats.heapUsed}MB heap, ${stats.heapTotal}MB total, ${stats.external}MB external`,
  );
}

export function checkMemoryHealth(): { healthy: boolean; issues: string[] } {
  const summary = memoryMonitor.getSummary();
  const issues: string[] = [];

  if (summary.current.heapUsed > 300) {
    issues.push(`High heap usage: ${summary.current.heapUsed}MB`);
  }

  if (summary.trend === "increasing") {
    issues.push("Memory usage trending upward");
  }

  return {
    healthy: issues.length === 0,
    issues,
  };
}
