/**
 * Estimation Validator
 * 
 * Tracks estimates vs. actuals and provides calibrated estimates
 * Prevents the "always estimate high" syndrome by learning from history
 */

import { frameworkLogger } from '../core/framework-logger.js';

interface EstimationRecord {
  taskId: string;
  description: string;
  category: string;
  estimatedMinutes: number;
  actualMinutes: number;
  timestamp: string;
  confidence: 'high' | 'medium' | 'low';
}

interface CalibrationFactor {
  category: string;
  avgRatio: number; // actual / estimated
  sampleSize: number;
  lastUpdated: string;
}

/**
 * Estimation Validator
 * Tracks estimates and learns from actuals to improve future predictions
 */
export class EstimationValidator {
  private estimations: Map<string, EstimationRecord> = new Map();
  private calibrations: Map<string, CalibrationFactor> = new Map();
  private readonly STORAGE_KEY = 'strray-estimations';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Start tracking an estimate
   */
  startEstimate(
    taskId: string,
    description: string,
    category: string,
    estimatedMinutes: number,
    confidence: 'high' | 'medium' | 'low' = 'medium'
  ): void {
    this.estimations.set(taskId, {
      taskId,
      description,
      category,
      estimatedMinutes,
      actualMinutes: 0,
      timestamp: new Date().toISOString(),
      confidence,
    });

    void frameworkLogger.log('estimation-validator', 'estimate-started', 'info', {
      taskId,
      category,
      estimatedMinutes,
      confidence,
    });
  }

  /**
   * Complete tracking and record actual time
   */
  completeEstimate(taskId: string): void {
    const estimation = this.estimations.get(taskId);
    if (!estimation) {
      void frameworkLogger.log('estimation-validator', 'complete-failed', 'warning', {
        taskId,
        error: 'No estimate found for task',
      });
      return;
    }

    const startTime = new Date(estimation.timestamp).getTime();
    const actualMinutes = Math.round((Date.now() - startTime) / 60000);

    estimation.actualMinutes = actualMinutes;
    
    // Update calibration for this category
    this.updateCalibration(estimation);

    // Log the result
    const ratio = actualMinutes / estimation.estimatedMinutes;
    const variance = Math.round((ratio - 1) * 100);
    
    void frameworkLogger.log('estimation-validator', 'estimate-completed', 'info', {
      taskId,
      category: estimation.category,
      estimated: estimation.estimatedMinutes,
      actual: actualMinutes,
      variance: `${variance > 0 ? '+' : ''}${variance}%`,
    });

    this.saveToStorage();
  }

  /**
   * Get calibrated estimate based on historical data
   */
  getCalibratedEstimate(
    category: string,
    baseEstimate: number,
    confidence: 'high' | 'medium' | 'low' = 'medium'
  ): { calibratedEstimate: number; calibrationFactor: number; confidence: number } {
    const calibration = this.calibrations.get(category);
    
    if (!calibration || calibration.sampleSize < 3) {
      // Not enough data - apply default calibration based on confidence
      const factor = confidence === 'high' ? 0.5 : confidence === 'low' ? 2.0 : 1.0;
      return {
        calibratedEstimate: Math.round(baseEstimate * factor),
        calibrationFactor: factor,
        confidence: calibration?.sampleSize || 0,
      };
    }

    // Use historical calibration
    return {
      calibratedEstimate: Math.round(baseEstimate * calibration.avgRatio),
      calibrationFactor: calibration.avgRatio,
      confidence: Math.min(calibration.sampleSize / 10, 1), // Max confidence at 10 samples
    };
  }

  /**
   * Check if an estimate needs adjustment
   */
  validateEstimate(
    category: string,
    estimate: number
  ): { isReasonable: boolean; suggestedEstimate: number; warning?: string } {
    const calibration = this.calibrations.get(category);
    
    if (!calibration || calibration.sampleSize < 3) {
      return { 
        isReasonable: true, 
        suggestedEstimate: estimate,
        warning: `No calibration data for "${category}". Consider tracking actuals.` 
      };
    }

    const ratio = calibration.avgRatio;
    
    // If consistently underestimating by >50%
    if (ratio > 1.5) {
      return {
        isReasonable: false,
        suggestedEstimate: Math.round(estimate * ratio),
        warning: `Historical data shows tasks in "${category}" take ${Math.round(ratio * 100)}% of estimates. Consider ${Math.round(estimate * ratio)} minutes.`,
      };
    }

    // If consistently overestimating by >50%
    if (ratio < 0.5) {
      return {
        isReasonable: false,
        suggestedEstimate: Math.round(estimate * ratio),
        warning: `Historical data shows tasks in "${category}" take only ${Math.round(ratio * 100)}% of estimates. Consider ${Math.round(estimate * ratio)} minutes.`,
      };
    }

    return { isReasonable: true, suggestedEstimate: estimate };
  }

  /**
   * Get estimation accuracy report
   */
  getAccuracyReport(): {
    overallAccuracy: number;
    categoryBreakdown: Array<{
      category: string;
      sampleSize: number;
      avgRatio: number;
      trend: 'over' | 'under' | 'accurate';
    }>;
    recommendations: string[];
  } {
    const categories: string[] = [];
    
    // Collect all categories
    for (const estimation of this.estimations.values()) {
      if (!categories.includes(estimation.category)) {
        categories.push(estimation.category);
      }
    }

    const categoryBreakdown = categories.map(cat => {
      const calibration = this.calibrations.get(cat);
      if (!calibration) return null;
      
      let trend: 'over' | 'under' | 'accurate' = 'accurate';
      if (calibration.avgRatio > 1.2) trend = 'under';
      if (calibration.avgRatio < 0.8) trend = 'over';

      return {
        category: cat,
        sampleSize: calibration.sampleSize,
        avgRatio: calibration.avgRatio,
        trend,
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null);

    // Calculate overall accuracy
    const totalRatio = categoryBreakdown.reduce((sum, c) => sum + c.avgRatio, 0);
    const overallAccuracy = categoryBreakdown.length > 0 
      ? 1 / (totalRatio / categoryBreakdown.length)
      : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    
    const underEstimators = categoryBreakdown.filter(c => c.trend === 'under');
    if (underEstimators.length > 0) {
      recommendations.push(
        `You're consistently underestimating: ${underEstimators.map(c => c.category).join(', ')}`
      );
    }

    const overEstimators = categoryBreakdown.filter(c => c.trend === 'over');
    if (overEstimators.length > 0) {
      recommendations.push(
        `You're consistently overestimating: ${overEstimators.map(c => c.category).join(', ')}`
      );
    }

    const lowConfidence = categoryBreakdown.filter(c => c.sampleSize < 3);
    if (lowConfidence.length > 0) {
      recommendations.push(
        `Need more data for: ${lowConfidence.map(c => c.category).join(', ')}`
      );
    }

    return { overallAccuracy, categoryBreakdown, recommendations };
  }

  private updateCalibration(estimation: EstimationRecord): void {
    const existing = this.calibrations.get(estimation.category);
    
    if (!existing) {
      this.calibrations.set(estimation.category, {
        category: estimation.category,
        avgRatio: estimation.actualMinutes / estimation.estimatedMinutes,
        sampleSize: 1,
        lastUpdated: new Date().toISOString(),
      });
      return;
    }

    // Update running average
    const newRatio = estimation.actualMinutes / estimation.estimatedMinutes;
    const newAvg = (existing.avgRatio * existing.sampleSize + newRatio) / (existing.sampleSize + 1);
    
    existing.avgRatio = newAvg;
    existing.sampleSize++;
    existing.lastUpdated = new Date().toISOString();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.estimations = new Map(Object.entries(parsed.estimations || {}));
        this.calibrations = new Map(Object.entries(parsed.calibrations || {}));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        estimations: Object.fromEntries(this.estimations),
        calibrations: Object.fromEntries(this.calibrations),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }
}

// Singleton
let validatorInstance: EstimationValidator | null = null;

export function getEstimationValidator(): EstimationValidator {
  if (!validatorInstance) {
    validatorInstance = new EstimationValidator();
  }
  return validatorInstance;
}

/**
 * Decorator for async functions to track estimates
 */
export function trackEstimate(
  taskId: string,
  description: string,
  category: string,
  estimatedMinutes: number
) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const validator = getEstimationValidator();
      validator.startEstimate(taskId, description, category, estimatedMinutes);
      
      try {
        const result = await originalMethod.apply(this, args);
        validator.completeEstimate(taskId);
        return result;
      } catch (error) {
        validator.completeEstimate(taskId);
        throw error;
      }
    };

    return descriptor;
  };
}
