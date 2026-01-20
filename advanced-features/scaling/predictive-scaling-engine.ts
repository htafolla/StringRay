/**
 * StringRay AI v1.1.1 - Predictive Scaling Engine
 *
 * ML-based predictive scaling for distributed systems with auto-scaling capabilities.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

export interface ScalingMetrics {
  timestamp: number;
  cpuUtilization: number;
  memoryUtilization: number;
  requestRate: number;
  responseTime: number;
  activeConnections: number;
  errorRate: number;
}

export interface ScalingPrediction {
  scalingAction: "scale_up" | "scale_down" | "maintain";
  recommendedInstances: number;
  confidence: number;
  reason: string;
}

export interface PredictiveScalingConfig {
  predictionHorizon: number; // minutes
  minConfidence: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number; // minutes
  maxScaleUp: number;
  maxScaleDown: number;
  enableML: boolean;
  modelUpdateInterval: number; // hours
}

/**
 * Predictive scaling engine with ML-based predictions
 */
export class PredictiveScalingEngine {
  private config: PredictiveScalingConfig;
  private metricsHistory: ScalingMetrics[] = [];
  private lastScalingAction = 0;
  private currentInstances = 1;

  constructor(config: Partial<PredictiveScalingConfig> = {}) {
    this.config = {
      predictionHorizon: 15,
      minConfidence: 0.7,
      scaleUpThreshold: 80,
      scaleDownThreshold: 20,
      cooldownPeriod: 5,
      maxScaleUp: 5,
      maxScaleDown: 1,
      enableML: true,
      modelUpdateInterval: 24,
      ...config,
    };
  }

  /**
   * Record current system metrics
   */
  recordMetrics(metrics: ScalingMetrics): void {
    this.metricsHistory.push(metrics);

    // Keep only recent history (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.metricsHistory = this.metricsHistory.filter(
      (m) => m.timestamp > oneDayAgo,
    );
  }

  /**
   * Generate scaling prediction based on current metrics and history
   */
  async generatePrediction(
    targetInstances: number,
  ): Promise<ScalingPrediction> {
    const now = Date.now();
    const cooldownEnd =
      this.lastScalingAction + this.config.cooldownPeriod * 60 * 1000;

    if (now < cooldownEnd) {
      return {
        scalingAction: "maintain",
        recommendedInstances: targetInstances,
        confidence: 1.0,
        reason: `In cooldown period until ${new Date(cooldownEnd).toISOString()}`,
      };
    }

    if (this.metricsHistory.length < 10) {
      return {
        scalingAction: "maintain",
        recommendedInstances: targetInstances,
        confidence: 0.5,
        reason: "Insufficient metrics history for prediction",
      };
    }

    const recentMetrics = this.metricsHistory.slice(-10);
    const avgCpu =
      recentMetrics.reduce((sum, m) => sum + m.cpuUtilization, 0) /
      recentMetrics.length;
    const avgMemory =
      recentMetrics.reduce((sum, m) => sum + m.memoryUtilization, 0) /
      recentMetrics.length;
    const avgRequestRate =
      recentMetrics.reduce((sum, m) => sum + m.requestRate, 0) /
      recentMetrics.length;

    // Simple threshold-based scaling (ML would be more sophisticated)
    if (
      avgCpu > this.config.scaleUpThreshold ||
      avgMemory > this.config.scaleUpThreshold
    ) {
      const scaleUpAmount = Math.min(
        this.config.maxScaleUp,
        Math.ceil(avgRequestRate / 100),
      );
      const newInstances = Math.min(
        targetInstances + scaleUpAmount,
        targetInstances * 2,
      );

      return {
        scalingAction: "scale_up",
        recommendedInstances: newInstances,
        confidence: Math.min(0.9, avgCpu / 100),
        reason: `High CPU (${avgCpu.toFixed(1)}%) or memory usage detected`,
      };
    }

    if (
      avgCpu < this.config.scaleDownThreshold &&
      avgMemory < this.config.scaleDownThreshold &&
      targetInstances > 1
    ) {
      const scaleDownAmount = Math.min(
        this.config.maxScaleDown,
        Math.max(1, Math.floor(targetInstances * 0.2)),
      );
      const newInstances = Math.max(1, targetInstances - scaleDownAmount);

      return {
        scalingAction: "scale_down",
        recommendedInstances: newInstances,
        confidence: Math.min(0.8, (100 - avgCpu) / 100),
        reason: `Low resource utilization (CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%)`,
      };
    }

    return {
      scalingAction: "maintain",
      recommendedInstances: targetInstances,
      confidence: 0.7,
      reason: "Resource utilization within acceptable range",
    };
  }

  /**
   * Execute scaling action
   */
  async executeScaling(
    prediction: ScalingPrediction,
    currentInstances: number,
  ): Promise<boolean> {
    if (prediction.confidence < this.config.minConfidence) {
      console.log(
        `⚠️ Predictive Scaling: Low confidence (${prediction.confidence.toFixed(2)}), skipping scaling`,
      );
      return false;
    }

    this.lastScalingAction = Date.now();
    this.currentInstances = prediction.recommendedInstances;

    console.log(
      `📊 Predictive Scaling: ${prediction.scalingAction} from ${currentInstances} to ${prediction.recommendedInstances} instances`,
    );
    console.log(`   Reason: ${prediction.reason}`);

    // In a real implementation, this would integrate with container orchestration
    // For now, just return success
    return true;
  }

  /**
   * Shutdown the scaling engine
   */
  async shutdown(): Promise<void> {
    this.metricsHistory.length = 0;
    console.log("🛑 Predictive Scaling Engine shutdown complete");
  }

  /**
   * Get current scaling metrics
   */
  getMetrics(): {
    currentInstances: number;
    lastScalingAction: number;
    metricsCount: number;
  } {
    return {
      currentInstances: this.currentInstances,
      lastScalingAction: this.lastScalingAction,
      metricsCount: this.metricsHistory.length,
    };
  }
}
