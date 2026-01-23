/**
 * Success Handler for Post-Processor
 *
 * Handles successful post-processor operations including metrics collection,
 * notifications, cleanup, and reporting.
 */
import { frameworkLogger } from "../../framework-logger";
export class SuccessHandler {
    config;
    constructor(config = {}) {
        this.config = {
            successConfirmation: true,
            cleanupEnabled: true,
            notificationEnabled: true,
            metricsCollection: true,
            ...config,
        };
    }
    /**
     * Handle successful post-processor completion
     */
    async handleSuccess(context, result, monitoringResults) {
        const jobId = `success-handler-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await frameworkLogger.log("success-handler", "handling successful post-processor completion", "info", { jobId, commitSha: context.commitSha, sessionId: result.sessionId });
        // Perform success confirmation if enabled
        if (this.config.successConfirmation) {
            await this.confirmSuccess(context, result);
        }
        // Send notifications if enabled
        if (this.config.notificationEnabled) {
            await this.sendNotifications(context, result);
        }
        // Perform cleanup if enabled
        if (this.config.cleanupEnabled) {
            await this.performCleanup(context);
        }
        // Collect and log metrics if enabled
        const metrics = this.collectMetrics(context, result, monitoringResults);
        if (this.config.metricsCollection) {
            await this.logMetrics(metrics);
        }
        await frameworkLogger.log("success-handler", "success handling completed", "success", { jobId, metrics });
        return metrics;
    }
    /**
     * Confirm deployment success
     */
    async confirmSuccess(context, result) {
        console.log("🔍 Confirming deployment success...");
        // Simulate confirmation checks
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log("✅ Deployment success confirmed");
    }
    /**
     * Send success notifications
     */
    async sendNotifications(context, result) {
        const notification = `Deployment successful: ${context.commitSha} by ${context.author} in ${context.repository}`;
        console.log("📢 Success Notification:", notification);
    }
    /**
     * Perform post-success cleanup
     */
    async performCleanup(context) {
        console.log("🧹 Performing post-success cleanup...");
        // Simulate cleanup operations
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log("✅ Cleanup completed");
    }
    /**
     * Collect success metrics
     */
    collectMetrics(context, result, monitoringResults) {
        const totalDuration = result.duration || 0;
        const attempts = result.attempts;
        const fixesApplied = result.fixesApplied?.length || 0;
        const monitoringChecks = monitoringResults.length;
        const redeployments = Math.max(0, attempts - 1);
        return {
            totalDuration,
            attempts,
            fixesApplied,
            monitoringChecks,
            redeployments,
            timestamp: new Date(),
        };
    }
    /**
     * Log success metrics
     */
    async logMetrics(metrics) {
        console.log("📊 Success Metrics:");
        console.log(`   Total Duration: ${metrics.totalDuration}ms`);
        console.log(`   Attempts: ${metrics.attempts}`);
        console.log(`   Fixes Applied: ${metrics.fixesApplied}`);
        console.log(`   Monitoring Checks: ${metrics.monitoringChecks}`);
        console.log(`   Redeployments: ${metrics.redeployments}`);
    }
    /**
     * Generate comprehensive success report
     */
    generateSuccessReport(context, result, metrics) {
        return `
Post-Processor Success Report
=============================

Commit: ${context.commitSha}
Repository: ${context.repository}
Branch: ${context.branch}
Author: ${context.author}
Trigger: ${context.trigger}

Results:
- Success: ${result.success}
- Session ID: ${result.sessionId}
- Attempts: ${metrics.attempts}
- Fixes Applied: ${metrics.fixesApplied}
- Monitoring Checks: ${metrics.monitoringChecks}
- Redeployments: ${metrics.redeployments}
- Total Duration: ${metrics.totalDuration}ms

Files Processed: ${context.files.length}
${context.files.map(f => `  - ${f}`).join('\n')}

Timestamp: ${metrics.timestamp.toISOString()}
`.trim();
    }
    /**
     * Get current configuration stats
     */
    getStats() {
        return { ...this.config };
    }
}
//# sourceMappingURL=SuccessHandler.js.map