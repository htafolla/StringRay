/**
 * StringRay Framework - Application Metrics Endpoint
 *
 * Production-ready metrics endpoint for Prometheus monitoring
 * Exposes key performance and health metrics
 */
import { performanceSystem } from "../performance/index";
import { strRayOrchestrator } from "../orchestrator";
export class MetricsEndpoint {
    metrics = new Map();
    constructor() {
        this.initializeMetrics();
        this.startCollection();
    }
    /**
     * Initialize core metrics
     */
    initializeMetrics() {
        // Framework health metrics
        this.metrics.set("stringray_up", 1);
        this.metrics.set("stringray_start_time", Date.now());
        // Performance metrics
        this.metrics.set("stringray_memory_heap_used_bytes", 0);
        this.metrics.set("stringray_memory_heap_total_bytes", 0);
        this.metrics.set("stringray_memory_external_bytes", 0);
        // Orchestrator metrics
        this.metrics.set("stringray_orchestrator_active_tasks", 0);
        this.metrics.set("stringray_orchestrator_completed_tasks_total", 0);
        // Codex compliance metrics
        this.metrics.set("stringray_codex_terms_loaded", 0);
        this.metrics.set("stringray_codex_violations_total", 0);
        // Performance budget metrics
        this.metrics.set("stringray_performance_budget_violations_total", 0);
        this.metrics.set("stringray_bundle_size_bytes", 0);
    }
    /**
     * Start periodic metrics collection
     */
    startCollection() {
        setInterval(() => {
            this.collectMetrics();
        }, 15000); // Collect every 15 seconds
    }
    /**
     * Collect current metrics
     */
    async collectMetrics() {
        try {
            // Memory metrics
            const memUsage = process.memoryUsage();
            this.metrics.set("stringray_memory_heap_used_bytes", memUsage.heapUsed);
            this.metrics.set("stringray_memory_heap_total_bytes", memUsage.heapTotal);
            this.metrics.set("stringray_memory_external_bytes", memUsage.external);
            // Orchestrator metrics
            const orchestratorStatus = strRayOrchestrator.getStatus();
            this.metrics.set("stringray_orchestrator_active_tasks", orchestratorStatus.activeTasks);
            // Performance metrics (if system is initialized)
            if (performanceSystem) {
                try {
                    const perfStatus = await performanceSystem.getStatus();
                    if (perfStatus) {
                        this.metrics.set("stringray_performance_budget_violations_total", perfStatus.recentViolations);
                    }
                }
                catch (error) {
                    // Performance system not available
                }
            }
            // Framework uptime
            const uptime = process.uptime();
            this.metrics.set("stringray_uptime_seconds", uptime);
        }
        catch (error) {
            console.error("Metrics collection error:", error);
            this.metrics.set("stringray_up", 0);
        }
    }
    /**
     * Generate Prometheus metrics format
     */
    generateMetrics() {
        const lines = [];
        // Help and type definitions
        lines.push("# HELP stringray_up Framework health status (1=up, 0=down)");
        lines.push("# TYPE stringray_up gauge");
        lines.push(`stringray_up ${this.metrics.get("stringray_up") || 0}`);
        lines.push("# HELP stringray_uptime_seconds Time since framework started");
        lines.push("# TYPE stringray_uptime_seconds counter");
        lines.push(`stringray_uptime_seconds ${this.metrics.get("stringray_uptime_seconds") || 0}`);
        lines.push("# HELP stringray_memory_heap_used_bytes Memory heap used in bytes");
        lines.push("# TYPE stringray_memory_heap_used_bytes gauge");
        lines.push(`stringray_memory_heap_used_bytes ${this.metrics.get("stringray_memory_heap_used_bytes") || 0}`);
        lines.push("# HELP stringray_orchestrator_active_tasks Number of active orchestrator tasks");
        lines.push("# TYPE stringray_orchestrator_active_tasks gauge");
        lines.push(`stringray_orchestrator_active_tasks ${this.metrics.get("stringray_orchestrator_active_tasks") || 0}`);
        lines.push("# HELP stringray_performance_budget_violations_total Total performance budget violations");
        lines.push("# TYPE stringray_performance_budget_violations_total counter");
        lines.push(`stringray_performance_budget_violations_total ${this.metrics.get("stringray_performance_budget_violations_total") || 0}`);
        return lines.join("\n") + "\n";
    }
    /**
     * Health check endpoint
     */
    async healthCheck() {
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
//# sourceMappingURL=metrics-endpoint.js.map