/**
 * Memory Monitor Setup
 *
 * Memory monitoring configuration and setup utilities.
 * This module handles memory monitor initialization and alert handling.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { memoryMonitor } from "../monitoring/memory-monitor.js";
import { frameworkLogger } from "./framework-logger.js";
import { StringRayStateManager } from "../state/state-manager.js";

export interface MemoryMonitorSetupOptions {
  stateManager: StringRayStateManager;
  memoryMonitorListener: ((alert: any) => void) | undefined;
}

export function setupMemoryMonitoring(options: MemoryMonitorSetupOptions): void {
  const { stateManager, memoryMonitorListener } = options;

  memoryMonitor.start();

  let currentListenerCount = 0;
  try {
    if (typeof memoryMonitor.listenerCount === "function") {
      currentListenerCount = memoryMonitor.listenerCount("alert");
    } else if (
      memoryMonitor.listeners &&
      typeof memoryMonitor.listeners === "function"
    ) {
      currentListenerCount = memoryMonitor.listeners("alert").length;
    }
  } catch (e) {
    currentListenerCount = 0;
  }

  if (currentListenerCount === 0) {
    memoryMonitor.on("alert", (alert: any) => {
      const level =
        alert.severity === "critical"
          ? "error"
          : alert.severity === "high"
            ? "warn"
            : "info";

      frameworkLogger.log(
        "boot-orchestrator",
        `MEMORY ALERT: ${alert.message}`,
        "error",
      );

      const alerts = (stateManager.get("memory:alerts") as any[]) || [];
      alerts.push({
        ...alert,
        timestamp: Date.now(),
      });

      if (alerts.length > 100) {
        alerts.shift();
      }

      stateManager.set("memory:alerts", alerts);

      alert.details.recommendations.forEach((rec: string) => {
        frameworkLogger.log("boot-orchestrator", `${rec}`, "info");
      });
    });
  }

  if (
    memoryMonitorListener &&
    memoryMonitor.listenerCount("alert") === 0
  ) {
    memoryMonitor.on("alert", memoryMonitorListener);
  }

  const initialStats = memoryMonitor.getCurrentStats();
  frameworkLogger.log(
    "boot-orchestrator",
    `Initial memory: ${initialStats.heapUsed.toFixed(1)}MB heap, ${initialStats.heapTotal.toFixed(1)}MB total`,
    "info",
  );

  stateManager.set("memory:baseline", initialStats);
}

export function getMemoryHealthSummary(): {
  healthy: boolean;
  issues: string[];
  metrics: {
    current: any;
    peak: any;
    average: number;
    trend: string;
  };
} {
  const summary = memoryMonitor.getSummary();
  const issues: string[] = [];

  if (summary.current.heapUsed > 400) {
    issues.push(
      `Critical heap usage: ${summary.current.heapUsed.toFixed(1)}MB`,
    );
  } else if (summary.current.heapUsed > 200) {
    issues.push(`High heap usage: ${summary.current.heapUsed.toFixed(1)}MB`);
  }

  if (summary.trend === "increasing") {
    issues.push("Memory usage trending upward - potential leak detected");
  }

  if (summary.peak.heapUsed > 500) {
    issues.push(
      `Peak usage exceeded safe limits: ${summary.peak.heapUsed.toFixed(1)}MB`,
    );
  }

  return {
    healthy: issues.length === 0,
    issues,
    metrics: summary,
  };
}
