#!/usr/bin/env node

/**
 * Hook Metrics Collector
 * Tracks and reports hook execution performance
 */

import * as fs from 'fs';
import { frameworkLogger } from "../../framework-logger.js";
import * as path from 'path';

interface HookMetrics {
  timestamp: number;
  hookType: 'post-commit' | 'post-push';
  duration: number;
  exitCode: number;
  success: boolean;
}

class HookMetricsCollector {
  private metricsFile: string;
  private metrics: HookMetrics[] = [];

  constructor() {
    this.metricsFile = path.join(process.cwd(), '.opencode', 'hook-metrics.json');
    this.loadMetrics();
  }

  /**
   * Load existing metrics from file
   */
  private loadMetrics(): void {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = fs.readFileSync(this.metricsFile, 'utf8');
        this.metrics = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load hook metrics:', error instanceof Error ? error.message : String(error));
      this.metrics = [];
    }
  }

  /**
   * Save metrics to file
   */
  private saveMetrics(): void {
    try {
      // Keep only last 1000 metrics to prevent file from growing too large
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.warn('Could not save hook metrics:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Record a hook execution
   */
  recordMetrics(hookType: 'post-commit' | 'post-push', duration: number, exitCode: number): void {
    const metric: HookMetrics = {
      timestamp: Date.now(),
      hookType,
      duration,
      exitCode,
      success: exitCode === 0
    };

    this.metrics.push(metric);
    this.saveMetrics();
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalExecutions: number;
    successRate: number;
    averageDuration: number;
    byHookType: Record<string, {
      count: number;
      successRate: number;
      averageDuration: number;
    }>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageDuration: 0,
        byHookType: {}
      };
    }

    const totalExecutions = this.metrics.length;
    const successful = this.metrics.filter(m => m.success).length;
    const successRate = (successful / totalExecutions) * 100;
    const averageDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalExecutions;

    const byHookType: Record<string, HookMetrics[]> = {};
    this.metrics.forEach(metric => {
      if (!byHookType[metric.hookType]) {
        byHookType[metric.hookType] = [];
      }
      byHookType[metric.hookType]!.push(metric);
    });

    const hookTypeSummary: Record<string, { count: number; successRate: number; averageDuration: number }> = {};
    Object.entries(byHookType).forEach(([hookType, metrics]) => {
      const count = metrics.length;
      const hookSuccessful = metrics.filter(m => m.success).length;
      const hookSuccessRate = (hookSuccessful / count) * 100;
      const hookAverageDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / count;

      hookTypeSummary[hookType] = {
        count,
        successRate: Math.round(hookSuccessRate * 100) / 100,
        averageDuration: Math.round(hookAverageDuration)
      };
    });

    return {
      totalExecutions,
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      byHookType: hookTypeSummary
    };
  }

  /**
   * Print metrics report
   */
  async printReport(): Promise<void> {
    const summary = this.getSummary();

    // Hook metrics report header - kept as console.log for user visibility
    console.log('================================');
    console.log(`Total Executions: ${summary.totalExecutions}`);
    await frameworkLogger.log("hook-metrics", "report-generated", "info", { overallSuccessRate: summary.successRate });
    console.log(`Average Duration: ${summary.averageDuration}ms`);
    console.log('');

    for (const [hookType, stats] of Object.entries(summary.byHookType)) {
      console.log(`${hookType}:`);
      console.log(`  Count: ${stats.count}`);
      await frameworkLogger.log("hook-metrics", "hook-stats", "info", { hookType, successRate: stats.successRate });
      console.log(`  Average Duration: ${stats.averageDuration}ms`);
      console.log('');
    }
  }
}

/**
 * Parse hook metrics from command line arguments
 * Usage: hook-metrics.js <hook-type> <duration> <exit-code>
 */
function parseArgs(): { hookType: 'post-commit' | 'post-push'; duration: number; exitCode: number } | null {
  const [,, hookTypeArg, durationArg, exitCodeArg] = process.argv;

  if (!hookTypeArg || !durationArg || exitCodeArg === undefined) {
    return null;
  }

  const hookType = hookTypeArg as 'post-commit' | 'post-push';
  const duration = parseInt(durationArg, 10);
  const exitCode = parseInt(exitCodeArg, 10);

  if (hookType !== 'post-commit' && hookType !== 'post-push') {
    console.error('Invalid hook type. Must be "post-commit" or "post-push"');
    return null;
  }

  if (isNaN(duration) || isNaN(exitCode)) {
    console.error('Invalid duration or exit code');
    return null;
  }

  return { hookType, duration, exitCode };
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const collector = new HookMetricsCollector();
  const args = parseArgs();

  if (args) {
    // Record metrics
    collector.recordMetrics(args.hookType, args.duration, args.exitCode);
    await frameworkLogger.log("hook-metrics", "metrics-recorded", "success", { hookType: args.hookType, duration: args.duration, exitCode: args.exitCode });
  } else {
    // Print report
    collector.printReport();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Hook metrics error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export { HookMetricsCollector, HookMetrics };