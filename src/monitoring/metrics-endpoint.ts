/**
 * StrRay Framework - Application Metrics Endpoint
 *
 * Production-ready metrics endpoint for Prometheus monitoring
 * Exposes key performance and health metrics
 */

import { performanceSystem } from "../performance/index.js";
import { strRayOrchestrator } from "../orchestrator.js";

export class MetricsEndpoint {
  private metrics: Map<string, number> = new Map();

  constructor() {
    this.initializeMetrics();
    this.startCollection();
  }

  /**
   * Initialize core metrics
   */
  private initializeMetrics(): void {
    // Framework health metrics
    this.metrics.set("strray_up", 1);
    this.metrics.set("strray_start_time", Date.now());

    // Performance metrics
    this.metrics.set("strray_memory_heap_used_bytes", 0);
    this.metrics.set("strray_memory_heap_total_bytes", 0);
    this.metrics.set("strray_memory_external_bytes", 0);

    // Orchestrator metrics
    this.metrics.set("strray_orchestrator_active_tasks", 0);
    this.metrics.set("strray_orchestrator_completed_tasks_total", 0);

    // Codex compliance metrics
    this.metrics.set("strray_codex_terms_loaded", 0);
    this.metrics.set("strray_codex_violations_total", 0);

    // Performance budget metrics
    this.metrics.set("strray_performance_budget_violations_total", 0);
    this.metrics.set("strray_bundle_size_bytes", 0);
  }

  /**
   * Start periodic metrics collection
   */
  private startCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 15000); // Collect every 15 seconds
  }

  /**
   * Collect current metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.metrics.set("strray_memory_heap_used_bytes", memUsage.heapUsed);
      this.metrics.set("strray_memory_heap_total_bytes", memUsage.heapTotal);
      this.metrics.set("strray_memory_external_bytes", memUsage.external);

      // Orchestrator metrics
      const orchestratorStatus = strRayOrchestrator.getStatus();
      this.metrics.set(
        "strray_orchestrator_active_tasks",
        orchestratorStatus.activeTasks,
      );

      // Performance metrics (if system is initialized)
      if (performanceSystem) {
        try {
          const perfStatus = await performanceSystem.getStatus();
          if (perfStatus) {
            this.metrics.set(
              "strray_performance_budget_violations_total",
              perfStatus.recentViolations,
            );
          }
        } catch (error) {
          // Performance system not available
        }
      }

      // Framework uptime
      const uptime = process.uptime();
      this.metrics.set("strray_uptime_seconds", uptime);
    } catch (error) {
      console.error("Metrics collection error:", error);
      this.metrics.set("strray_up", 0);
    }
  }

  /**
   * Generate Prometheus metrics format
   */
  generateMetrics(): string {
    const lines: string[] = [];

    // Help and type definitions
    lines.push("# HELP strray_up Framework health status (1=up, 0=down)");
    lines.push("# TYPE strray_up gauge");
    lines.push(`strray_up ${this.metrics.get("strray_up") || 0}`);

    lines.push("# HELP strray_uptime_seconds Time since framework started");
    lines.push("# TYPE strray_uptime_seconds counter");
    lines.push(
      `strray_uptime_seconds ${this.metrics.get("strray_uptime_seconds") || 0}`,
    );

    lines.push(
      "# HELP strray_memory_heap_used_bytes Memory heap used in bytes",
    );
    lines.push("# TYPE strray_memory_heap_used_bytes gauge");
    lines.push(
      `strray_memory_heap_used_bytes ${this.metrics.get("strray_memory_heap_used_bytes") || 0}`,
    );

    lines.push(
      "# HELP strray_orchestrator_active_tasks Number of active orchestrator tasks",
    );
    lines.push("# TYPE strray_orchestrator_active_tasks gauge");
    lines.push(
      `strray_orchestrator_active_tasks ${this.metrics.get("strray_orchestrator_active_tasks") || 0}`,
    );

    lines.push(
      "# HELP strray_performance_budget_violations_total Total performance budget violations",
    );
    lines.push("# TYPE strray_performance_budget_violations_total counter");
    lines.push(
      `strray_performance_budget_violations_total ${this.metrics.get("strray_performance_budget_violations_total") || 0}`,
    );

    return lines.join("\n") + "\n";
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    memory: { heapUsed: number; heapTotal: number; external: number };
  }> {
    const memUsage = process.memoryUsage();

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
    };
  }
}

// Export singleton instance
export const metricsEndpoint = new MetricsEndpoint();
