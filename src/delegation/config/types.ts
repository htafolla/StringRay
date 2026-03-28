/**
 * Routing Types
 *
 * Type definitions for task-skill routing system.
 */

/**
 * Individual routing mapping that maps keywords to an agent/skill
 */
export interface RoutingMapping {
  /** Keywords to match against task descriptions */
  keywords: string[];
  /** Skill to invoke */
  skill: string;
  /** Agent to route to */
  agent: string;
  /** Confidence level (0-1) */
  confidence: number;
  /** Category for organization */
  category?: string;
  /** Priority level */
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Result of a routing operation
 */
export interface RoutingResult {
  skill: string;
  agent: string;
  confidence: number;
  matchedKeyword?: string;
  fromHistory?: boolean;
  reason?: string;
  operation?: string;
  context?: Record<string, unknown>;
  escalateToLlm?: boolean;
  isRelease?: boolean;
  kernelInsights?: unknown;
}

/**
 * Routing options
 */
export interface RoutingOptions {
  complexity?: number;
  taskId?: string;
  useHistoricalData?: boolean;
  sessionId?: string;
  stateManager?: any;
}

/**
 * Validation result for mappings
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  duplicateCount: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Routing outcome tracking record
 */
export interface RoutingOutcome {
  taskId: string;
  taskDescription: string;
  routedAgent: string;
  routedSkill: string;
  confidence: number;
  timestamp: Date;
  success?: boolean;
  feedback?: string;
  complexity?: number;
  predictedComplexity?: number;
  executionTimeMs?: number;
  routingMethod?: 'keyword' | 'history' | 'complexity' | 'default';
}

/**
 * Agent statistics for analytics
 */
export interface AgentStats {
  agent: string;
  total: number;
  successRate: number;
  attempts: number;
  successes: number;
}

/**
 * Prompt data point for pattern analysis
 */
export interface PromptDataPoint {
  taskId: string;
  prompt: string;
  timestamp: Date;
  complexity: number;
  keywords: string[];
  context: Record<string, unknown>;
  routingDecision?: RoutingDecision;
  outcome?: {
    success: boolean;
    agent: string;
    skill: string;
    feedback?: string;
  };
  templatePrompt?: string;
  userRequest?: string;
  generatedPrompt?: string;
  confidence?: number;
  usageMetadata?: {
    timestamp: number;
    executionTime: number;
    success: boolean;
    retryCount?: number;
  };
  routedAgent?: string;
}

/**
 * Routing decision record
 */
export interface RoutingDecision {
  taskId: string;
  agent: string;
  skill: string;
  confidence: number;
  matchedKeyword?: string;
  reason: string;
  kernelInsights?: unknown;
  timestamp: Date;
  selectedAgent?: string;
  selectedSkill?: string;
  executionTime?: number;
  keywordMatched?: string;
}

/**
 * Daily analytics summary
 */
export interface DailyAnalyticsSummary {
  totalRoutings: number;
  averageConfidence: number;
  templateMatchRate: number;
  successRate: number;
  topAgents: Array<{ agent: string; count: number; successRate: number }>;
  topKeywords: Array<{ keyword: string; count: number; successRate: number }>;
  insights: string[];
}

/**
 * Full routing analytics data
 */
export interface RoutingAnalyticsData {
  promptPatterns: {
    totalPrompts: number;
    templateMatches: number;
    templateMatchRate: number;
    gaps: Array<{ pattern: string; suggestions: string[] }>;
    emergingPatterns: Array<{ pattern: string; frequency: number }>;
  };
  routingPerformance: {
    totalRoutings: number;
    overallSuccessRate: number;
    avgConfidence: number;
    timeRange: { start: Date; end: Date };
    recommendations: string[];
    agentMetrics: Array<{ agent: string; successRate: number; count: number }>;
    keywordEffectiveness: Array<{ keyword: string; successRate: number }>;
    confidenceMetrics: Array<{ threshold: number; successRate: number }>;
  };
}

/**
 * P9 learning statistics
 */
export interface P9LearningStats {
  totalLearnings: number;
  successRate: number;
  lastLearning: Date | null;
  averageLearningTime: number;
  enabled: boolean;
}

/**
 * Pattern drift analysis result
 */
export interface PatternDriftAnalysis {
  driftDetected: boolean;
  affectedPatterns: string[];
  severity: 'low' | 'medium' | 'high';
}

/**
 * Learning result from P9 learning trigger
 */
export interface LearningResult {
  learningStarted: boolean;
  patternsAnalyzed: number;
  adaptations: number;
}

/**
 * Routing refinement change record
 */
export interface RoutingRefinementChange {
  type: 'added' | 'optimized' | 'removed';
  reason: string;
  data?: unknown;
}

/**
 * Routing refinement result
 */
export interface RoutingRefinementResult {
  appliedMappings: number;
  optimizedMappings: number;
  removedMappings: number;
  changes: RoutingRefinementChange[];
}

/**
 * Adaptive thresholds configuration
 */
export interface AdaptiveThresholds {
  overall: {
    confidenceMin: number;
    confidenceMax: number;
    frequencyMin: number;
    frequencyMax: number;
  };
  perAgent?: Record<string, unknown>;
}
