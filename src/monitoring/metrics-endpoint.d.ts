/**
 * StringRay Framework - Application Metrics Endpoint
 *
 * Production-ready metrics endpoint for Prometheus monitoring
 * Exposes key performance and health metrics
 */
export declare class MetricsEndpoint {
    private metrics;
    constructor();
    /**
     * Initialize core metrics
     */
    private initializeMetrics;
    /**
     * Start periodic metrics collection
     */
    private startCollection;
    /**
     * Collect current metrics
     */
    private collectMetrics;
    /**
     * Generate Prometheus metrics format
     */
    generateMetrics(): string;
    /**
     * Health check endpoint
     */
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        memory: {
            heapUsed: number;
            heapTotal: number;
            external: number;
        };
    }>;
}
export declare const metricsEndpoint: MetricsEndpoint;
//# sourceMappingURL=metrics-endpoint.d.ts.map