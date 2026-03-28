/**
 * StringRay Kernel Pattern Definitions
 * 
 * Pattern definitions from v1.1.0 → v2.0 kernel update
 * Includes 35+ patterns from 80+ reflections
 * 
 * @version 2.0.0-SECURITY-ENHANCED
 */

export interface KernelPattern {
  id: string;
  trigger: string[];
  action: string;
  confidence: number;
  level: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  category: 'FATAL' | 'CASCADE' | 'PREVENTION' | 'DECISION';
}

export interface FatalAssumption {
  id: string;
  trigger: string[];
  action: string;
  reason: string;
  level: number;
}

export interface BugCascade {
  id: string;
  pattern: string;
  detection: string;
  fix: string;
  priority: number;
}

export interface KernelInferenceResult {
  pattern?: KernelPattern;
  actionRequired?: string;
  confidence: number;
  fatalAssumptions?: FatalAssumption[];
  cascadePatterns?: BugCascade[];
  level?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  recommendations?: string[];
}

export interface KernelConfig {
  enabled: boolean;
  confidenceThreshold: number;
  maxPatternsPerAnalysis: number;
  enableLearning: boolean;
  autoPrevention: boolean;
}

// NEW v2.0 interfaces for analytics and learning
export interface EmergentPattern {
  id: string;
  pattern: string;
  trigger: string[];
  action: string;
  confidence: number;
  category: 'FATAL' | 'CASCADE' | 'PREVENTION' | 'DECISION';
  frequency: number;
  lastDetected: Date;
  effectiveness: number;
  firstSeen?: Date;
  lastSeen?: Date;
  suggestedAction?: string;
  userRequest?: string;
  generatedPrompt?: string;
  templatePrompt?: string;
  evidence?: any[];
}

export interface PatternUpdate {
  patternId: string;
  type: 'CONFIDENCE' | 'FREQUENCY' | 'TRIGGER' | 'ACTION';
  oldValue: any;
  newValue: any;
  timestamp: Date;
  reason: string;
  updateType?: string;
  confidence?: number;
  validated?: boolean;
  changes?: any[];
}

export interface PatternDriftInfo {
  patternId: string;
  driftDetected: boolean;
  severity: 'low' | 'medium' | 'high';
  metrics: {
    confidenceDrift: number;
    frequencyChange: number;
    effectivenessDecline: number;
  };
}

export interface AdaptiveThresholds {
  confidenceMin: number;
  confidenceMax: number;
  frequencyMin: number;
  frequencyMax: number;
  effectivenessMin: number;
  effectivenessMax: number;
  learningRate: number;
  adaptationWindow: number; // in minutes
  perAgent?: Record<string, {
    confidenceMin: number;
    confidenceMax: number;
    frequencyMin: number;
    frequencyMax: number;
    effectivenessMin: number;
    effectivenessMax: number;
  }>;
  overall?: {
    confidenceMin: number;
    confidenceMax: number;
    frequencyMin: number;
    frequencyMax: number;
  };
}

export class KernelAnalyzer {
  private config: KernelConfig;
  private patterns: Map<string, KernelPattern> = new Map();
  private assumptions: Map<string, FatalAssumption> = new Map();
  private cascades: Map<string, BugCascade> = new Map();

  constructor(config?: Partial<KernelConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      confidenceThreshold: config?.confidenceThreshold ?? 0.75,
      maxPatternsPerAnalysis: config?.maxPatternsPerAnalysis ?? 10,
      enableLearning: config?.enableLearning ?? true,
      autoPrevention: config?.autoPrevention ?? true,
    };

    this.initializePatterns();
  }

  private initializePatterns(): void {
    // FATAL ASSUMPTIONS (A1-A9)
    this.assumptions.set('A1', {
      id: 'A1',
      trigger: ['works in dev', 'works locally', 'works on my machine'],
      action: 'TEST WHERE IT RUNS',
      reason: 'Works in dev assumption',
      level: 1
    });

    this.assumptions.set('A2', {
      id: 'A2',
      trigger: ['test pass', 'tests pass', 'all tests pass'],
      action: 'TESTS VALIDATE TESTS, NOT BUGS',
      reason: 'Test pass assumption',
      level: 1
    });

    this.assumptions.set('A3', {
      id: 'A3',
      trigger: ['code defined', 'function defined', 'code exist', 'function exist'],
      action: 'VERIFY EXECUTION NOT DEFINITION',
      reason: 'Code written assumption',
      level: 1
    });

    this.assumptions.set('A4', {
      id: 'A4',
      trigger: ['I understand', 'understand the framework'],
      action: 'FRAMEWORK SHAPES YOUR THINKING',
      reason: 'Understanding assumption',
      level: 3
    });

    this.assumptions.set('A5', {
      id: 'A5',
      trigger: ['manual process', 'manually', 'forgot to run', 'remember to'],
      action: 'AUTOMATE OR IT FAILS',
      reason: 'Manual process assumption',
      level: 1
    });

    this.assumptions.set('A6', {
      id: 'A6',
      trigger: ['more test', 'higher coverage', 'coverage increase'],
      action: 'SKIPPED TESTS = ARCHITECTURAL DEBT',
      reason: 'More tests assumption',
      level: 1
    });

    this.assumptions.set('A7', {
      id: 'A7',
      trigger: ['optimize', 'optimization', 'perfect'],
      action: '75% THRESHOLD - BEYOND COSTS MORE',
      reason: 'Optimization assumption',
      level: 2
    });

    // NEW v2.0 ASSUMPTIONS
    this.assumptions.set('A8', {
      id: 'A8',
      trigger: ['security later', 'optional security', 'after feature', 'not now security'],
      action: 'SECURITY_IS_FOUNDATION',
      reason: 'Security cannot be optional foundation',
      level: 1
    });

    this.assumptions.set('A9', {
      id: 'A9',
      trigger: ['works locally', 'localhost secure', 'tested locally'],
      action: 'PRODUCTION_ENVIRONMENT_TESTING',
      reason: 'Local ≠ production security',
      level: 2
    });

    // BUG CASCADE PATTERNS (P1-P8)
    this.cascades.set('P1', {
      id: 'P1',
      pattern: 'RECURSIVE_LOOP',
      detection: 'activity_log | spawn_governor',
      fix: 'loop breaker + consultation limit',
      priority: 1
    });

    this.cascades.set('P2', {
      id: 'P2',
      pattern: 'IMPLEMENTATION_DRIFT',
      detection: 'test_health | review_cycles',
      fix: 'regular test review cycles',
      priority: 2
    });

    this.cascades.set('P3', {
      id: 'P3',
      pattern: 'CONSUMER_PATH_TRAP',
      detection: 'fresh_test | consumer_default',
      fix: 'use consumer paths as default',
      priority: 1
    });

    this.cascades.set('P4', {
      id: 'P4',
      pattern: 'MCP_PROTOCOL_GAP',
      detection: 'timeout_despite_running | handshake',
      fix: 'add initialize request before tool calls',
      priority: 1
    });

    this.cascades.set('P5', {
      id: 'P5',
      pattern: 'VERSION_CHAOS',
      detection: 'auto_compliance | 3layer_enforce',
      fix: 'automated version enforcement system',
      priority: 2
    });

    // NEW v2.0 PATTERNS
    this.cascades.set('P6', {
      id: 'P6',
      pattern: 'SECURITY_VULNERABILITY',
      detection: 'security_audit | oauth2+api_key',
      fix: 'complete security re-architecture',
      priority: 1
    });

    this.cascades.set('P7', {
      id: 'P7',
      pattern: 'RELEASE_READINESS',
      detection: 'precommit_fails | comprehensive_validation',
      fix: '100% validation system',
      priority: 1
    });

    this.cascades.set('P8', {
      id: 'P8',
      pattern: 'INFRASTRUCTURE_HARDENING',
      detection: 'execution_failures | chmod+typecheck',
      fix: 'script permission fixes',
      priority: 2
    });
  }

  analyze(observation: string): KernelInferenceResult {
    if (!this.config.enabled) {
      return { confidence: 0, recommendations: ['Kernel is disabled'] };
    }

    const lowerObs = observation.toLowerCase();
    const result: KernelInferenceResult = {
      confidence: 0,
      recommendations: [],
      fatalAssumptions: [],
      cascadePatterns: []
    };

    // Check fatal assumptions
    for (const [id, assumption] of this.assumptions.entries()) {
      for (const trigger of assumption.trigger) {
        if (lowerObs.includes(trigger.toLowerCase())) {
          if (!result.fatalAssumptions) result.fatalAssumptions = [];
          result.fatalAssumptions.push(assumption);
          result.confidence = Math.max(result.confidence, 0.8);
          result.actionRequired = assumption.action;
          if (!result.recommendations) result.recommendations = [];
          result.recommendations.push(`Detected assumption ${id}: ${assumption.reason}`);
        }
      }
    }

    // Check cascade patterns
    for (const [id, cascade] of this.cascades.entries()) {
      if (lowerObs.includes(cascade.pattern.toLowerCase()) ||
          lowerObs.includes(cascade.detection.toLowerCase()) ||
          lowerObs.includes(cascade.id.toLowerCase())) {
        if (!result.cascadePatterns) result.cascadePatterns = [];
        result.cascadePatterns.push(cascade);
        result.confidence = Math.max(result.confidence, 0.9);
        result.actionRequired = cascade.fix;
        if (!result.recommendations) result.recommendations = [];
        result.recommendations.push(`Detected cascade ${id}: ${cascade.pattern}`);
      }
    }

    // Apply confidence threshold
    if (result.confidence < this.config.confidenceThreshold) {
      result.recommendations?.push('Low confidence - investigate manually');
    }

    // Determine inference level
    if (result.fatalAssumptions!.length > 0) {
      result.level = 'L3'; // Assumption surfacing
    } else if (result.cascadePatterns!.length > 0) {
      result.level = 'L2'; // Causal mapping
    } else {
      result.level = 'L1'; // Pattern recognition
    }

    return result;
  }

  process(task: string): KernelInferenceResult {
    const analysis = this.analyze(task);
    
    // Add meta-inference capabilities
    if (analysis.level === 'L1') {
      analysis.recommendations?.push('Pattern matched - proceed with caution');
    } else if (analysis.level === 'L2') {
      analysis.recommendations?.push('Causal analysis detected - investigate root cause');
    } else if (analysis.level === 'L3') {
      analysis.recommendations?.push('Assumptions detected - question and verify');
    }

    return analysis;
  }

  learn(outcome: { success: boolean; patternUsed: string; feedback?: string }): void {
    if (!this.config.enableLearning) return;

    // Reinforce successful patterns
    if (outcome.success) {
      const pattern = this.patterns.get(outcome.patternUsed);
      if (pattern) {
        pattern.confidence = Math.min(pattern.confidence + 0.05, 1.0);
      }
    }

    // Decrease confidence for failed patterns
    if (!outcome.success) {
      const pattern = this.patterns.get(outcome.patternUsed);
      if (pattern) {
        pattern.confidence = Math.max(pattern.confidence - 0.1, 0.1);
      }
    }
  }

  getConfig(): KernelConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<KernelConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Export singleton instance
let kernelInstance: KernelAnalyzer | null = null;

export function getKernel(): KernelAnalyzer {
  if (!kernelInstance) {
    kernelInstance = new KernelAnalyzer();
  }
  return kernelInstance;
}

export function resetKernel(): void {
  kernelInstance = null;
}