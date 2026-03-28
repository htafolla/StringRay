/**
 * Analytics Module Index
 *
 * Central export for all analytics components used by the inference pipeline.
 *
 * @module analytics
 * @version 1.0.0
 */

// Pattern tracking
export { patternPerformanceTracker } from './pattern-performance-tracker.js';
export type { PatternMetrics, PatternDriftAnalysis, SystemPerformanceSummary } from './pattern-performance-tracker.js';

// Pattern analysis
export { SimplePatternAnalyzer } from './simple-pattern-analyzer.js';
export type { PatternInsights, AgentStats, TaskTypeStats, ComplexityStats } from './simple-pattern-analyzer.js';

export { promptPatternAnalyzer } from './prompt-pattern-analyzer.js';
export type { EmergingPattern } from './prompt-pattern-analyzer.js';

export { emergingPatternDetector } from './emerging-pattern-detector.js';
export type { PatternDiscoveryResult, ClusterResult } from './emerging-pattern-detector.js';

export { PatternLearningEngine } from './pattern-learning-engine.js';
export type { LearningResult as PatternLearningResult } from './pattern-learning-engine.js';

export { routingPerformanceAnalyzer } from './routing-performance-analyzer.js';
export type { AgentPerformanceMetrics, RoutingPerformanceReport } from './routing-performance-analyzer.js';

export { routingRefiner } from './routing-refiner.js';
export type { KeywordMappingSuggestion, RefinementReport } from './routing-refiner.js';
