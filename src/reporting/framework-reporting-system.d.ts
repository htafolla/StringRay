/**
 * StringRay Framework - On-Demand Reporting System
 *
 * Automated reporting infrastructure for comprehensive framework analysis.
 * Generates detailed orchestration, agent usage, and performance reports on demand.
 *
 * @version 1.0.0
 * @since 2026-01-11
 */
export interface ReportConfig {
    type: "orchestration" | "agent-usage" | "context-awareness" | "performance" | "full-analysis";
    sessionId?: string;
    jobId?: string;
    timeRange?: {
        start?: Date;
        end?: Date;
        lastHours?: number;
    };
    outputFormat: "markdown" | "json" | "html";
    outputPath?: string;
    includeCharts?: boolean;
    detailedMetrics?: boolean;
}
export interface OrchestrationMetrics {
    totalDelegations: number;
    agentUsage: Map<string, number>;
    complexityDistribution: Map<string, number>;
    successRate: number;
    averageResponseTime: number;
    contextOperations: number;
    enhancementSuccessRate: number;
    commandUsage: Map<string, number>;
    toolExecutionStats: {
        totalCommands: number;
        uniqueTools: number;
        mostUsedTool: string;
        toolSuccessRate: Map<string, {
            success: number;
            total: number;
            rate: number;
        }>;
    };
    systemOperationDetails: {
        fileOperations: number;
        searchOperations: number;
        terminalOperations: number;
        analysisOperations: number;
        orchestrationOperations: number;
    };
}
export interface ReportData {
    generatedAt: Date;
    timeRange: {
        start: Date;
        end: Date;
    };
    metrics: OrchestrationMetrics;
    chronologicalEvents: any[];
    insights: string[];
    recommendations: string[];
    summary: {
        totalEvents: number;
        activeComponents: string[];
        peakActivity: {
            timestamp: Date;
            eventsPerMinute: number;
        };
        healthScore: number;
    };
}
export declare class FrameworkReportingSystem {
    private logRetentionHours;
    private reportCache;
    /**
     * Generate on-demand report based on configuration
     */
    generateReport(config: ReportConfig): Promise<string>;
    /**
     * Schedule automated report generation
     */
    scheduleAutomatedReports(schedule: {
        frequency: "hourly" | "daily" | "weekly";
        types: ReportConfig["type"][];
        outputDir: string;
        retentionDays: number;
    }): void;
    /**
     * Get real-time framework status
     */
    getRealtimeStatus(): Promise<{
        activeComponents: string[];
        recentActivity: any[];
        healthScore: number;
        alerts: string[];
    }>;
    /**
     * Create custom report templates
     */
    createCustomReport(template: {
        name: string;
        filters: {
            components?: string[];
            actions?: string[];
            status?: string[];
            timeRange?: {
                start: Date;
                end: Date;
            };
        };
        aggregations: {
            groupBy: "component" | "action" | "status" | "hour";
            metrics: ("count" | "avgResponseTime" | "successRate")[];
        };
        visualizations: ("timeline" | "pie-chart" | "bar-chart")[];
    }): string;
    private generateReportId;
    private getCachedReport;
    private isCacheValid;
    private cacheReport;
    /**
     * Get comprehensive logs including current and rotated files
     */
    private getComprehensiveLogs;
    /**
     * Read and parse rotated log files for historical data
     */
    private readRotatedLogFiles;
    /**
     * Parse a compressed log file and extract relevant entries
     */
    private parseCompressedLogFile;
    /**
     * Read and parse the current log file
     */
    private readCurrentLogFile;
    /**
     * Parse a single log line into structured format
     */
    private parseLogLine;
    private levelToStatus;
    private inferAgent;
    private collectReportData;
    private filterLogsByConfig;
    private calculateTimeRange;
    private calculateMetrics;
    private calculatePeakActivity;
    private calculateHealthScore;
    private generateInsights;
    private generateRecommendations;
    private generateAlerts;
    private getHighFrequencyComponents;
    private formatReport;
    private formatAsMarkdown;
    private formatAsHtml;
    private saveReportToFile;
    private cleanupOldReports;
    private getIntervalMs;
}
export declare const frameworkReportingSystem: FrameworkReportingSystem;
//# sourceMappingURL=framework-reporting-system.d.ts.map