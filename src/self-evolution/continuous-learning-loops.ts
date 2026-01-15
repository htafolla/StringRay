/**
 * Continuous Learning Loops - Automated Learning Cycles with Feedback Integration
 *
 * This module implements automated learning cycles that continuously analyze framework
 * performance, gather feedback from all operations, and apply systematic improvements.
 * Creates a self-sustaining improvement loop that evolves the framework over time.
 *
 * Key Capabilities:
 * - Automated learning cycle orchestration
 * - Multi-source feedback integration
 * - Performance trend analysis and prediction
 * - Adaptive improvement strategies
 * - Learning outcome validation and measurement
 * - Continuous optimization pipelines
 */

import { EventEmitter } from 'events';
// Temporary imports - will be replaced with actual framework components
interface Logger {
  info(component: string, message: string, details?: any): void;
  debug(component: string, message: string, details?: any): void;
  warn(component: string, message: string, details?: any): void;
  error(component: string, message: string, details?: any): void;
}

interface MetricsCollector {
  recordMetric(name: string, value: number): void;
}

// Temporary imports - will be replaced with actual framework components
interface InferenceEngine {
  generateInference(): any;
}

interface SelfReflectionSystem {
  getArchitecturalHealth(): any;
}

export interface LearningCycle {
  id: string;
  phase: LearningPhase;
  startTime: Date;
  endTime?: Date;
  objectives: string[];
  dataSources: string[];
  strategies: LearningStrategy[];
  outcomes: LearningOutcome[];
  status: 'active' | 'completed' | 'failed';
  metadata: Record<string, any>;
}

export interface LearningStrategy {
  name: string;
  type: 'exploration' | 'exploitation' | 'validation' | 'optimization';
  parameters: Record<string, any>;
  priority: number;
  constraints: string[];
  expectedImpact: number;
}

export interface LearningOutcome {
  metric: string;
  baseline: number;
  current: number;
  improvement: number;
  confidence: number;
  significance: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface FeedbackSource {
  name: string;
  type: 'performance' | 'user' | 'system' | 'external';
  priority: number;
  reliability: number;
  lastUpdated: Date;
  data: FeedbackData[];
}

export interface FeedbackData {
  timestamp: Date;
  metrics: Record<string, number>;
  context: Record<string, any>;
  quality: number;
  source: string;
}

export interface LearningPipeline {
  name: string;
  stages: PipelineStage[];
  triggers: PipelineTrigger[];
  successCriteria: SuccessCriterion[];
  isActive: boolean;
  lastExecution?: Date;
  performance: PipelinePerformance;
}

export interface PipelineStage {
  name: string;
  type: 'data_collection' | 'analysis' | 'strategy_selection' | 'implementation' | 'validation';
  duration: number; // milliseconds
  dependencies: string[];
  successRate: number;
  lastExecutionTime?: number;
}

export interface PipelineTrigger {
  condition: string;
  threshold: number;
  cooldown: number; // milliseconds
  lastTriggered?: Date;
}

export interface SuccessCriterion {
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  value: number;
  weight: number;
}

export interface PipelinePerformance {
  totalExecutions: number;
  successfulExecutions: number;
  averageDuration: number;
  successRate: number;
  lastImprovement: number;
}

export type LearningPhase =
  | 'data_collection'
  | 'analysis'
  | 'strategy_formulation'
  | 'implementation'
  | 'validation'
  | 'reflection'
  | 'optimization';

export class ContinuousLearningLoops extends EventEmitter {
  private activeCycles: Map<string, LearningCycle> = new Map();
  private feedbackSources: Map<string, FeedbackSource> = new Map();
  private learningPipelines: Map<string, LearningPipeline> = new Map();
  private learningHistory: LearningCycle[] = [];
  private readonly maxHistorySize = 1000;

  constructor(
    private logger: Logger,
    private metrics: MetricsCollector,
    private inferenceEngine: InferenceEngine,
    private reflectionSystem: SelfReflectionSystem
  ) {
    super();
    this.initializeLearningSystem();
  }

  private initializeLearningSystem(): void {
    this.logger.info('ContinuousLearningLoops', 'Initializing continuous learning system');

    this.setupDefaultFeedbackSources();
    this.setupDefaultPipelines();

    // Set up learning cycle triggers
    setInterval(() => this.checkPipelineTriggers(), 60000); // Check every minute
    setInterval(() => this.executeActiveCycles(), 300000); // Execute cycles every 5 minutes
    setInterval(() => this.optimizePipelines(), 3600000); // Optimize pipelines hourly

    this.metrics.recordMetric('learning_system_initialized', 1);
  }

  private setupDefaultFeedbackSources(): void {
    const sources: FeedbackSource[] = [
      {
        name: 'performance_metrics',
        type: 'performance',
        priority: 10,
        reliability: 0.95,
        lastUpdated: new Date(),
        data: []
      },
      {
        name: 'system_health',
        type: 'system',
        priority: 8,
        reliability: 0.90,
        lastUpdated: new Date(),
        data: []
      },
      {
        name: 'user_interactions',
        type: 'user',
        priority: 7,
        reliability: 0.85,
        lastUpdated: new Date(),
        data: []
      },
      {
        name: 'error_patterns',
        type: 'system',
        priority: 9,
        reliability: 0.92,
        lastUpdated: new Date(),
        data: []
      }
    ];

    sources.forEach(source => this.feedbackSources.set(source.name, source));
  }

  private setupDefaultPipelines(): void {
    const pipelines: LearningPipeline[] = [
      {
        name: 'performance_optimization',
        stages: [
          {
            name: 'collect_performance_data',
            type: 'data_collection',
            duration: 30000,
            dependencies: [],
            successRate: 0.98
          },
          {
            name: 'analyze_performance_trends',
            type: 'analysis',
            duration: 60000,
            dependencies: ['collect_performance_data'],
            successRate: 0.95
          },
          {
            name: 'select_optimization_strategy',
            type: 'strategy_selection',
            duration: 30000,
            dependencies: ['analyze_performance_trends'],
            successRate: 0.90
          },
          {
            name: 'implement_optimization',
            type: 'implementation',
            duration: 120000,
            dependencies: ['select_optimization_strategy'],
            successRate: 0.85
          },
          {
            name: 'validate_improvement',
            type: 'validation',
            duration: 60000,
            dependencies: ['implement_optimization'],
            successRate: 0.92
          }
        ],
        triggers: [
          {
            condition: 'performance_degradation',
            threshold: 0.05,
            cooldown: 3600000 // 1 hour
          },
          {
            condition: 'scheduled_performance_check',
            threshold: 0,
            cooldown: 86400000 // 24 hours
          }
        ],
        successCriteria: [
          {
            metric: 'performance_improvement',
            operator: 'gt',
            value: 0.01,
            weight: 1.0
          }
        ],
        isActive: true,
        performance: {
          totalExecutions: 0,
          successfulExecutions: 0,
          averageDuration: 0,
          successRate: 0,
          lastImprovement: 0
        }
      },
      {
        name: 'architectural_improvement',
        stages: [
          {
            name: 'assess_architectural_health',
            type: 'analysis',
            duration: 90000,
            dependencies: [],
            successRate: 0.96
          },
          {
            name: 'identify_improvement_opportunities',
            type: 'analysis',
            duration: 60000,
            dependencies: ['assess_architectural_health'],
            successRate: 0.93
          },
          {
            name: 'formulate_improvement_strategy',
            type: 'strategy_selection',
            duration: 45000,
            dependencies: ['identify_improvement_opportunities'],
            successRate: 0.88
          },
          {
            name: 'implement_architectural_change',
            type: 'implementation',
            duration: 180000,
            dependencies: ['formulate_improvement_strategy'],
            successRate: 0.80
          },
          {
            name: 'validate_architectural_improvement',
            type: 'validation',
            duration: 90000,
            dependencies: ['implement_architectural_change'],
            successRate: 0.89
          }
        ],
        triggers: [
          {
            condition: 'architectural_health_decline',
            threshold: 0.10,
            cooldown: 43200000 // 12 hours
          },
          {
            condition: 'weekly_architectural_review',
            threshold: 0,
            cooldown: 604800000 // 1 week
          }
        ],
        successCriteria: [
          {
            metric: 'architectural_health_improvement',
            operator: 'gt',
            value: 0.05,
            weight: 1.0
          }
        ],
        isActive: true,
        performance: {
          totalExecutions: 0,
          successfulExecutions: 0,
          averageDuration: 0,
          successRate: 0,
          lastImprovement: 0
        }
      }
    ];

    pipelines.forEach(pipeline => this.learningPipelines.set(pipeline.name, pipeline));
  }

  /**
   * Start a new learning cycle
   */
  public startLearningCycle(
    objectives: string[],
    dataSources: string[] = [],
    initialStrategies: LearningStrategy[] = []
  ): string {
    const cycleId = `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const cycle: LearningCycle = {
      id: cycleId,
      phase: 'data_collection',
      startTime: new Date(),
      objectives,
      dataSources: dataSources.length > 0 ? dataSources : Array.from(this.feedbackSources.keys()),
      strategies: initialStrategies,
      outcomes: [],
      status: 'active',
      metadata: {}
    };

    this.activeCycles.set(cycleId, cycle);
    this.logger.info('ContinuousLearningLoops', `Started learning cycle: ${cycleId}`);

    this.emit('cycleStarted', cycle);
    return cycleId;
  }

  /**
   * Submit feedback data from various sources
   */
  public submitFeedback(
    sourceName: string,
    metrics: Record<string, number>,
    context: Record<string, any> = {},
    quality: number = 1.0
  ): void {
    const source = this.feedbackSources.get(sourceName);
    if (!source) {
      this.logger.warn('ContinuousLearningLoops', `Unknown feedback source: ${sourceName}`);
      return;
    }

    const feedback: FeedbackData = {
      timestamp: new Date(),
      metrics,
      context,
      quality,
      source: sourceName
    };

    source.data.push(feedback);
    source.lastUpdated = new Date();

    // Maintain data buffer size (keep last 1000 entries per source)
    if (source.data.length > 1000) {
      source.data = source.data.slice(-1000);
    }

    this.logger.debug('ContinuousLearningLoops', `Received feedback from ${sourceName}`, metrics);
  }

  /**
   * Check pipeline triggers and start learning cycles as needed
   */
  private checkPipelineTriggers(): void {
    for (const pipeline of Array.from(this.learningPipelines.values())) {
      if (!pipeline.isActive) continue;

      for (const trigger of pipeline.triggers) {
        if (this.shouldTriggerPipeline(pipeline, trigger)) {
          this.startPipelineExecution(pipeline);
          break; // Only start one execution per pipeline per check
        }
      }
    }
  }

  private shouldTriggerPipeline(pipeline: LearningPipeline, trigger: PipelineTrigger): boolean {
    const now = Date.now();
    const lastTriggered = trigger.lastTriggered?.getTime() || 0;

    // Check cooldown
    if (now - lastTriggered < trigger.cooldown) return false;

    // Evaluate trigger condition
    switch (trigger.condition) {
      case 'performance_degradation':
        return this.detectPerformanceDegradation() > trigger.threshold;
      case 'architectural_health_decline':
        return this.detectArchitecturalHealthDecline() > trigger.threshold;
      case 'scheduled_performance_check':
      case 'weekly_architectural_review':
        return true; // Time-based triggers
      default:
        return false;
    }
  }

  private detectPerformanceDegradation(): number {
    // Simplified performance degradation detection
    // Would integrate with actual performance metrics
    return Math.random() * 0.1; // Placeholder
  }

  private detectArchitecturalHealthDecline(): number {
    const health = this.reflectionSystem.getArchitecturalHealth();
    const baselineHealth = 0.8; // Would be learned over time
    return Math.max(0, baselineHealth - health.overallScore);
  }

  /**
   * Start pipeline execution
   */
  private startPipelineExecution(pipeline: LearningPipeline): void {
    const objectives = [`Execute ${pipeline.name} pipeline`];
    const cycleId = this.startLearningCycle(objectives, [], []);

    pipeline.lastExecution = new Date();

    pipeline.triggers.forEach(trigger => {
      trigger.lastTriggered = new Date();
    });

    this.logger.info('ContinuousLearningLoops', `Started pipeline execution: ${pipeline.name}`);
  }

  /**
   * Execute active learning cycles
   */
  private executeActiveCycles(): void {
    for (const cycle of Array.from(this.activeCycles.values())) {
      if (cycle.status !== 'active') continue;

      try {
        this.executeCyclePhase(cycle);
      } catch (error) {
        this.logger.error('ContinuousLearningLoops', `Cycle execution failed: ${cycle.id}`, error);
        cycle.status = 'failed';
        cycle.endTime = new Date();
      }
    }
  }

  private executeCyclePhase(cycle: LearningCycle): void {
    switch (cycle.phase) {
      case 'data_collection':
        this.executeDataCollection(cycle);
        break;
      case 'analysis':
        this.executeAnalysis(cycle);
        break;
      case 'strategy_formulation':
        this.executeStrategyFormulation(cycle);
        break;
      case 'implementation':
        this.executeImplementation(cycle);
        break;
      case 'validation':
        this.executeValidation(cycle);
        break;
      case 'reflection':
        this.executeReflection(cycle);
        break;
      case 'optimization':
        this.executeOptimization(cycle);
        break;
    }
  }

  private executeDataCollection(cycle: LearningCycle): void {
    // Collect data from all specified sources
    const collectedData: Record<string, any> = {};

    for (const sourceName of cycle.dataSources) {
      const source = this.feedbackSources.get(sourceName);
      if (source && source.data.length > 0) {
        collectedData[sourceName] = source.data.slice(-50); // Last 50 data points
      }
    }

    cycle.metadata.collectedData = collectedData;
    cycle.phase = 'analysis';

    this.logger.debug('ContinuousLearningLoops', `Completed data collection for cycle ${cycle.id}`);
  }

  private executeAnalysis(cycle: LearningCycle): void {
    // Perform analysis using inference engine
    const inference: any = this.inferenceEngine.generateInference();

    // Analyze architectural health
    const health: any = this.reflectionSystem.getArchitecturalHealth();

    cycle.metadata.analysis = {
      inference,
      health,
      insights: this.generateCycleInsights(inference, health)
    };

    cycle.phase = 'strategy_formulation';

    this.logger.debug('ContinuousLearningLoops', `Completed analysis for cycle ${cycle.id}`);
  }

  private generateCycleInsights(inference: any, health: any): any[] {
    const insights = [];

    // Generate insights based on inference results and health data
    if (inference.confidence > 0.8) {
      insights.push({
        type: 'inference',
        confidence: inference.confidence,
        recommendations: inference.recommendations.slice(0, 3)
      });
    }

    if (health.overallScore < 0.7) {
      insights.push({
        type: 'health',
        score: health.overallScore,
        issues: health.criticalIssues
      });
    }

    return insights;
  }

  private executeStrategyFormulation(cycle: LearningCycle): void {
    const analysis = cycle.metadata.analysis;
    const strategies: LearningStrategy[] = [];

    // Formulate strategies based on analysis
    if (analysis.inference.recommendations.length > 0) {
      strategies.push({
        name: 'inference_based_optimization',
        type: 'optimization',
        parameters: { recommendations: analysis.inference.recommendations },
        priority: 8,
        constraints: [],
        expectedImpact: analysis.inference.confidence
      });
    }

    if (analysis.health.score < 0.8) {
      strategies.push({
        name: 'architectural_health_improvement',
        type: 'optimization',
        parameters: { healthIssues: analysis.health.issues },
        priority: 9,
        constraints: [],
        expectedImpact: 0.7
      });
    }

    cycle.strategies = strategies;
    cycle.phase = 'implementation';

    this.logger.debug('ContinuousLearningLoops', `Formulated ${strategies.length} strategies for cycle ${cycle.id}`);
  }

  private executeImplementation(cycle: LearningCycle): void {
    // Execute the highest priority strategy
    const strategy = cycle.strategies.sort((a, b) => b.priority - a.priority)[0];

    if (strategy) {
      const success = this.implementStrategy(strategy);
      cycle.metadata.implementationResult = { strategy: strategy.name, success };

      if (success) {
        cycle.phase = 'validation';
      } else {
        cycle.status = 'failed';
        cycle.endTime = new Date();
      }
    } else {
      cycle.phase = 'validation'; // No strategies to implement
    }

    this.logger.debug('ContinuousLearningLoops', `Executed implementation for cycle ${cycle.id}`);
  }

  private implementStrategy(strategy: LearningStrategy): boolean {
    // Simplified strategy implementation
    // In practice, this would integrate with the actual framework components
    this.logger.info('ContinuousLearningLoops', `Implementing strategy: ${strategy.name}`);

    // Simulate implementation success/failure
    return Math.random() > 0.2; // 80% success rate
  }

  private executeValidation(cycle: LearningCycle): void {
    // Validate the implemented changes
    const outcomes = this.measureOutcomes(cycle);
    cycle.outcomes = outcomes;

    cycle.metadata.validationResults = {
      outcomes,
      overallSuccess: this.evaluateCycleSuccess(cycle, outcomes)
    };

    cycle.phase = 'reflection';

    this.logger.debug('ContinuousLearningLoops', `Completed validation for cycle ${cycle.id}`);
  }

  private measureOutcomes(cycle: LearningCycle): LearningOutcome[] {
    const outcomes: LearningOutcome[] = [];

    // Measure key metrics before/after implementation
    // Simplified measurement - would use actual baseline tracking
    const metrics = ['performance', 'reliability', 'efficiency'];

    metrics.forEach(metric => {
      const baseline = Math.random() * 0.8 + 0.2; // Simulated baseline
      const current = Math.random() * 0.9 + 0.1; // Simulated current
      const improvement = current - baseline;

      outcomes.push({
        metric,
        baseline,
        current,
        improvement,
        confidence: 0.85,
        significance: improvement > 0.1 ? 'high' : improvement > 0.05 ? 'medium' : 'low',
        timestamp: new Date()
      });
    });

    return outcomes;
  }

  private evaluateCycleSuccess(cycle: LearningCycle, outcomes: LearningOutcome[]): boolean {
    const avgImprovement = outcomes.reduce((sum, o) => sum + o.improvement, 0) / outcomes.length;
    const avgConfidence = outcomes.reduce((sum, o) => sum + o.confidence, 0) / outcomes.length;

    return avgImprovement > 0.02 && avgConfidence > 0.8;
  }

  private executeReflection(cycle: LearningCycle): void {
    // Reflect on the cycle outcomes and update learning
    const reflection = {
      cycleId: cycle.id,
      duration: Date.now() - cycle.startTime.getTime(),
      success: cycle.metadata.validationResults.overallSuccess,
      keyOutcomes: cycle.outcomes.filter(o => o.significance === 'high' || o.significance === 'critical'),
      lessonsLearned: this.extractLessons(cycle)
    };

    cycle.metadata.reflection = reflection;
    cycle.phase = 'optimization';

    this.logger.debug('ContinuousLearningLoops', `Completed reflection for cycle ${cycle.id}`);
  }

  private extractLessons(cycle: LearningCycle): string[] {
    const lessons: string[] = [];

    if (cycle.metadata.validationResults.overallSuccess) {
      lessons.push('Successfully applied optimization strategy');
    } else {
      lessons.push('Strategy implementation needs refinement');
    }

    const highImpactOutcomes = cycle.outcomes.filter(o => o.significance === 'high');
    if (highImpactOutcomes.length > 0) {
      lessons.push(`Achieved significant improvements in: ${highImpactOutcomes.map(o => o.metric).join(', ')}`);
    }

    return lessons;
  }

  private executeOptimization(cycle: LearningCycle): void {
    // Optimize future learning based on cycle results
    this.updatePipelinePerformance(cycle);

    cycle.status = 'completed';
    cycle.endTime = new Date();

    this.learningHistory.push(cycle);
    if (this.learningHistory.length > this.maxHistorySize) {
      this.learningHistory = this.learningHistory.slice(-this.maxHistorySize);
    }

    this.activeCycles.delete(cycle.id);

    this.emit('cycleCompleted', cycle);
    this.logger.info('ContinuousLearningLoops', `Completed learning cycle: ${cycle.id}`);
  }

  private updatePipelinePerformance(cycle: LearningCycle): void {
    // Find the pipeline this cycle was part of and update its performance
    const pipeline = Array.from(this.learningPipelines.values())
      .find(p => p.lastExecution && cycle.startTime.getTime() - p.lastExecution.getTime() < 600000); // Within 10 minutes

    if (pipeline) {
      pipeline.performance.totalExecutions++;
      if (cycle.metadata.validationResults?.overallSuccess) {
        pipeline.performance.successfulExecutions++;
      }

      const duration = cycle.endTime!.getTime() - cycle.startTime.getTime();
      pipeline.performance.averageDuration =
        (pipeline.performance.averageDuration * (pipeline.performance.totalExecutions - 1) + duration) /
        pipeline.performance.totalExecutions;

      pipeline.performance.successRate = pipeline.performance.successfulExecutions / pipeline.performance.totalExecutions;

      const avgImprovement = cycle.outcomes.reduce((sum, o) => sum + o.improvement, 0) / cycle.outcomes.length;
      pipeline.performance.lastImprovement = avgImprovement;
    }
  }

  /**
   * Optimize learning pipelines based on performance data
   */
  private optimizePipelines(): void {
    for (const pipeline of Array.from(this.learningPipelines.values())) {
      if (pipeline.performance.totalExecutions > 5) {
        this.optimizePipeline(pipeline);
      }
    }

    this.logger.debug('ContinuousLearningLoops', 'Optimized learning pipelines');
  }

  private optimizePipeline(pipeline: LearningPipeline): void {
    // Adjust stage durations based on performance
    pipeline.stages.forEach(stage => {
      if (stage.lastExecutionTime) {
        // Adjust duration estimate based on actual execution time
        const adjustmentFactor = stage.lastExecutionTime / stage.duration;
        stage.duration = Math.round(stage.duration * 0.9 + stage.lastExecutionTime * 0.1); // Weighted average
      }
    });

    // Adjust trigger thresholds based on success rate
    if (pipeline.performance.successRate < 0.7) {
      // Lower thresholds to trigger more frequently
      pipeline.triggers.forEach(trigger => {
        trigger.threshold *= 0.9;
      });
    } else if (pipeline.performance.successRate > 0.9) {
      // Raise thresholds to avoid over-triggering
      pipeline.triggers.forEach(trigger => {
        trigger.threshold *= 1.1;
      });
    }
  }

  /**
   * Get all active learning cycles
   */
  public getActiveCycles(): LearningCycle[] {
    return Array.from(this.activeCycles.values());
  }

  /**
   * Get learning cycle by ID
   */
  public getCycle(cycleId: string): LearningCycle | undefined {
    return this.activeCycles.get(cycleId) ||
           this.learningHistory.find(c => c.id === cycleId);
  }

  /**
   * Get all learning pipelines
   */
  public getPipelines(): LearningPipeline[] {
    return Array.from(this.learningPipelines.values());
  }

  /**
   * Get recent learning history
   */
  public getLearningHistory(limit: number = 50): LearningCycle[] {
    return this.learningHistory.slice(-limit);
  }

  /**
   * Get feedback sources
   */
  public getFeedbackSources(): FeedbackSource[] {
    return Array.from(this.feedbackSources.values());
  }

  /**
   * Manually trigger a learning pipeline
   */
  public triggerPipeline(pipelineName: string): boolean {
    const pipeline = this.learningPipelines.get(pipelineName);
    if (!pipeline || !pipeline.isActive) return false;

    this.startPipelineExecution(pipeline);
    return true;
  }

  /**
   * Clear all learning data (for testing/reset purposes)
   */
  public clearLearningData(): void {
    this.activeCycles.clear();
    this.learningHistory = [];
    this.feedbackSources.forEach(source => {
      source.data = [];
    });

    this.logger.info('ContinuousLearningLoops', 'Cleared all learning data');
  }

  /**
   * Get system statistics
   */
  public getStatistics(): Record<string, any> {
    const activeCycles = this.activeCycles.size;
    const completedCycles = this.learningHistory.length;
    const totalCycles = activeCycles + completedCycles;

    const avgCycleDuration = completedCycles > 0
      ? this.learningHistory.reduce((sum, c) => sum + (c.endTime!.getTime() - c.startTime.getTime()), 0) / completedCycles
      : 0;

    const pipelineStats = Array.from(this.learningPipelines.values()).map(p => ({
      name: p.name,
      executions: p.performance.totalExecutions,
      successRate: p.performance.successRate,
      avgDuration: p.performance.averageDuration
    }));

    return {
      activeCycles,
      completedCycles,
      totalCycles,
      avgCycleDuration,
      pipelineStats,
      feedbackSources: this.feedbackSources.size,
      totalFeedbackData: Array.from(this.feedbackSources.values())
        .reduce((sum, s) => sum + s.data.length, 0)
    };
  }
}