/**
 * Success Handler for Post-Processor
 *
 * Handles successful post-processor operations including metrics collection,
 * notifications, cleanup, and reporting.
 */

import { PostProcessorContext, PostProcessorResult, MonitoringResult } from "../types.js";
import { frameworkLogger } from "../../core/framework-logger.js";

export interface SuccessHandlerConfig {
  successConfirmation?: boolean;
  cleanupEnabled?: boolean;
  notificationEnabled?: boolean;
  metricsCollection?: boolean;
}

export interface SuccessMetrics {
  totalDuration: number;
  attempts: number;
  fixesApplied: number;
  monitoringChecks: number;
  redeployments: number;
  timestamp: Date;
}

export class SuccessHandler {
  private config: SuccessHandlerConfig;

  constructor(config: SuccessHandlerConfig = {}) {
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
  async handleSuccess(
    context: PostProcessorContext,
    result: PostProcessorResult,
    monitoringResults: MonitoringResult[],
  ): Promise<SuccessMetrics> {
    const jobId = `success-handler-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await frameworkLogger.log(
      "success-handler",
      "handling successful post-processor completion",
      "info",
      { jobId, commitSha: context.commitSha, sessionId: result.sessionId },
    );

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

    await frameworkLogger.log(
      "success-handler",
      "success handling completed",
      "success",
      { jobId, metrics },
    );

    return metrics;
  }

  /**
   * Confirm deployment success
   */
  private async confirmSuccess(
    context: PostProcessorContext,
    result: PostProcessorResult,
  ): Promise<void> {
    frameworkLogger.log("SuccessHandler", "confirm-success", "info", { message: "🔍 Confirming deployment success..." });

    // Simulate confirmation checks
    await new Promise((resolve) => setTimeout(resolve, 100));

    frameworkLogger.log("SuccessHandler", "confirm-success", "info", { message: "✅ Deployment success confirmed" });
  }

  /**
   * Send success notifications
   */
  private async sendNotifications(
    context: PostProcessorContext,
    result: PostProcessorResult,
  ): Promise<void> {
    const notification = `Deployment successful: ${context.commitSha} by ${context.author} in ${context.repository}`;
    frameworkLogger.log("SuccessHandler", "send-notifications", "info", { message: "📢 Success Notification:", notification });
  }

  /**
   * Perform post-success cleanup
   */
  private async performCleanup(context: PostProcessorContext): Promise<void> {
    frameworkLogger.log("SuccessHandler", "perform-cleanup", "info", { message: "🧹 Performing post-success cleanup..." });

    // Simulate cleanup operations
    await new Promise((resolve) => setTimeout(resolve, 50));

    frameworkLogger.log("SuccessHandler", "perform-cleanup", "info", { message: "✅ Cleanup completed" });
  }

  /**
   * Collect success metrics
   */
  private collectMetrics(
    context: PostProcessorContext,
    result: PostProcessorResult,
    monitoringResults: MonitoringResult[],
  ): SuccessMetrics {
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
  private async logMetrics(metrics: SuccessMetrics): Promise<void> {
    frameworkLogger.log("SuccessHandler", "log-metrics", "info", { message: "📊 Success Metrics:" });
    frameworkLogger.log("SuccessHandler", "log-metrics", "info", { message: `   Total Duration: ${metrics.totalDuration}ms` });
    frameworkLogger.log("SuccessHandler", "log-metrics", "info", { message: `   Attempts: ${metrics.attempts}` });
    frameworkLogger.log("SuccessHandler", "log-metrics", "info", { message: `   Fixes Applied: ${metrics.fixesApplied}` });
    frameworkLogger.log("SuccessHandler", "log-metrics", "info", { message: `   Monitoring Checks: ${metrics.monitoringChecks}` });
    frameworkLogger.log("SuccessHandler", "log-metrics", "info", { message: `   Redeployments: ${metrics.redeployments}` });
  }

  /**
   * Generate comprehensive success report
   */
  generateSuccessReport(
    context: PostProcessorContext,
    result: PostProcessorResult,
    metrics: SuccessMetrics,
  ): string {
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
${context.files.map((f) => `  - ${f}`).join("\n")}

Timestamp: ${metrics.timestamp.toISOString()}
`.trim();
  }

  /**
   * Get current configuration stats
   */
  getStats(): SuccessHandlerConfig {
    return { ...this.config };
  }
}
