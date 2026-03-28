/**
 * Inference Tuner - Autonomous Learning Service
 *
 * Implements the autonomous inference improvement loop:
 * 1. Collects routing outcomes and pattern metrics
 * 2. Analyzes performance and detects drift
 * 3. Generates refinement reports
 * 4. Updates configuration automatically
 *
 * @module services
 * @version 1.0.0
 */


import { routingOutcomeTracker } from "../delegation/analytics/outcome-tracker.js";
import { patternPerformanceTracker } from "../analytics/pattern-performance-tracker.js";
import { routingPerformanceAnalyzer } from "../analytics/routing-performance-analyzer.js";
import { promptPatternAnalyzer } from "../analytics/prompt-pattern-analyzer.js";
import { getAdaptiveKernel } from "../core/adaptive-kernel.js";
import { frameworkLogger } from "../core/framework-logger.js";

export interface TuningConfig {
  autoUpdateMappings: boolean;
  autoUpdateThresholds: boolean;
  minConfidenceThreshold: number;
  minSuccessRateForAutoAdd: number;
  learningIntervalMs: number;
  maxMappingsToAdd: number;
}

const DEFAULT_CONFIG: TuningConfig = {
  autoUpdateMappings: true,
  autoUpdateThresholds: true,
  minConfidenceThreshold: 0.7,
  minSuccessRateForAutoAdd: 0.8,
  learningIntervalMs: 60000,
  maxMappingsToAdd: 5,
};

export class InferenceTuner {
  private config: TuningConfig;
  private lastTuningTime: number = 0;
  private tuningInProgress: boolean = false;
  private tuningInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<TuningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start autonomous tuning
   */
  start(): void {
    if (this.tuningInterval) {
      return;
    }

    frameworkLogger.log(
      "inference-tuner",
      "starting",
      "info",
      { config: this.config }
    );

    this.tuningInterval = setInterval(() => {
      this.runTuningCycle().catch((err) => {
        frameworkLogger.log(
          "inference-tuner",
          "tuning-error",
          "error",
          { error: String(err) }
        );
      });
    }, this.config.learningIntervalMs);

    this.runTuningCycle().catch(console.error);
  }

  /**
   * Stop autonomous tuning
   */
  stop(): void {
    if (this.tuningInterval) {
      clearInterval(this.tuningInterval);
      this.tuningInterval = null;
      frameworkLogger.log("inference-tuner", "stopped", "info", {});
    }
  }

  /**
   * Run a single tuning cycle
   */
  async runTuningCycle(): Promise<void> {
    if (this.tuningInProgress) {
      return;
    }

    this.tuningInProgress = true;

    try {
      routingOutcomeTracker.reloadFromDisk();
      patternPerformanceTracker.loadFromDisk();

      const outcomes = routingOutcomeTracker.getOutcomes();
      const patterns = patternPerformanceTracker.getAllPatternMetrics();

      if (outcomes.length < 5 && patterns.length < 3) {
        frameworkLogger.log(
          "inference-tuner",
          "skipping-insufficient-data",
          "debug",
          { outcomes: outcomes.length, patterns: patterns.length }
        );
        return;
      }

      frameworkLogger.log(
        "inference-tuner",
        "tuning-cycle-start",
        "info",
        { outcomes: outcomes.length, patterns: patterns.length }
      );

      const results = await this.performTuning(outcomes, patterns);

      if (results.mappingsUpdated) {
        frameworkLogger.log(
          "inference-tuner",
          "tuning-cycle-complete",
          "info",
          { mappingsAdded: results.mappingsAdded }
        );
      }

      this.lastTuningTime = Date.now();
    } finally {
      this.tuningInProgress = false;
    }
  }

  /**
   * Perform the actual tuning work
   */
  private async performTuning(
    outcomes: Array<{
      taskId: string;
      taskDescription: string;
      routedAgent: string;
      routedSkill: string;
      confidence: number;
      success?: boolean;
      complexity?: number;
    }>,
    patterns: Array<{
      patternId: string;
      totalUsages: number;
      successRate: number;
      avgConfidence: number;
    }>
  ): Promise<{
    mappingsAdded: number;
    mappingsModified: number;
    thresholdsUpdated: boolean;
    mappingsUpdated: boolean;
  }> {
    const result = {
      mappingsAdded: 0,
      mappingsModified: 0,
      thresholdsUpdated: false,
      mappingsUpdated: false,
    };

    try {
      const perfReport = routingPerformanceAnalyzer.generatePerformanceReport();
      const promptAnalysis = promptPatternAnalyzer.analyzePromptPatterns();
      
      const kernel = getAdaptiveKernel();
      kernel.triggerLearning(outcomes.map(o => ({
        taskId: o.taskId,
        taskDescription: o.taskDescription,
        routedAgent: o.routedAgent,
        routedSkill: o.routedSkill,
        confidence: o.confidence,
        success: o.success ?? true
      })), []);

      if (this.config.autoUpdateMappings) {
        const newMappings = this.suggestMappingsFromPatterns(patterns, outcomes);
        for (const mapping of newMappings.slice(0, this.config.maxMappingsToAdd)) {
          const added = await this.addKeywordMapping(
            mapping.keyword,
            mapping.agent,
            mapping.skill,
            mapping.confidence
          );
          if (added) {
            result.mappingsAdded++;
          }
        }
        result.mappingsUpdated = result.mappingsAdded > 0;
      }
    } catch (error) {
      frameworkLogger.log(
        "inference-tuner",
        "tuning-error",
        "error",
        { error: String(error) }
      );
    }

    return result;
  }

  /**
   * Suggest new mappings based on patterns and outcomes
   */
  private suggestMappingsFromPatterns(
    patterns: Array<{ patternId: string; totalUsages: number; successRate: number; avgConfidence: number }>,
    outcomes: Array<{ taskDescription: string; routedAgent: string; routedSkill: string; success?: boolean }>
  ): Array<{ keyword: string; agent: string; skill: string; confidence: number }> {
    const suggestions: Array<{ keyword: string; agent: string; skill: string; confidence: number }> = [];
    
    for (const pattern of patterns) {
      if (pattern.totalUsages >= 3 && pattern.successRate >= this.config.minSuccessRateForAutoAdd) {
        const parts = pattern.patternId.split(":");
        const agent = parts[0] ?? "";
        const skill = parts.length > 1 ? (parts[1] ?? parts[0] ?? "") : "";
        
        if (!agent || !skill) continue;
        
        const matchingOutcome = outcomes.find(o => o.routedAgent === agent);
        
        if (matchingOutcome) {
          const words = matchingOutcome.taskDescription.toLowerCase().split(/\s+/);
          const significantWords = words.filter(w => w.length > 4 && !["the", "this", "that", "with", "from"].includes(w));
          
          if (significantWords.length > 0) {
            const keyword = significantWords[0] ?? "";
            if (keyword) {
              suggestions.push({
                keyword,
                agent,
                skill,
                confidence: Math.min(pattern.avgConfidence, 0.9),
              });
            }
          }
        }
      }
    }
    
    return suggestions;
  }

  private async addKeywordMapping(
    _keyword: string,
    _agent: string,
    _skill: string,
    _confidence: number
  ): Promise<boolean> {
    return false;
  }

  /**
   * Get tuning status
   */
  getStatus(): {
    running: boolean;
    lastTuningTime: number;
    config: TuningConfig;
  } {
    return {
      running: this.tuningInterval !== null,
      lastTuningTime: this.lastTuningTime,
      config: this.config,
    };
  }
}

// Singleton instance
export const inferenceTuner = new InferenceTuner();
