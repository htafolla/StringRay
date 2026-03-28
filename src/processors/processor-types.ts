/**
 * Processor Types
 *
 * Type definitions for the processor activation system.
 * Replaces `any` types with proper interfaces for type safety.
 * This file is the central source of truth for shared processor types
 * to avoid circular dependencies.
 *
 * @version 1.2.0
 * @since 2026-01-07
 */

/**
 * Processor execution context - used by processors to understand their environment
 */
export interface ProcessorContext {
  /** Tool input (for pre-processors) */
  toolInput?: {
    tool?: string;
    args?: {
      filePath?: string;
      content?: string;
      [key: string]: unknown;
    };
  };
  /** File path being processed */
  filePath?: string;
  /** Operation being performed */
  operation?: string;
  /** Content being processed */
  content?: string;
  /** Additional context */
  [key: string]: unknown;
}

/**
 * Standard result returned by all processors
 */
export interface ProcessorResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration: number;
  processorName: string;
}

export interface PreValidateContext {
  operation: string;
  data?: string;
  syntaxCheck?: boolean;
  codexCompliance?: boolean;
  agentName?: string;
  filesChanged?: string[];
  riskLevel?: "low" | "medium" | "high" | "critical";
  [key: string]: unknown;
}

export interface PostValidateContext {
  operation: string;
  data?: unknown;
  preResults: ProcessorExecutionResult[];
  testResults?: TestResults;
  regressionResults?: RegressionResults;
  stateValidation?: boolean;
  [key: string]: unknown;
}

export interface ProcessorHook {
  name: string;
  execute: (context: PreValidateContext | PostValidateContext) => Promise<ProcessorExecutionResult>;
  priority: number;
  enabled: boolean;
  before?: (context: PreValidateContext | PostValidateContext) => Promise<void>;
  after?: (result: ProcessorExecutionResult) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
}

export interface ProcessorRegistration {
  name: string;
  type: "pre" | "post";
  hook: ProcessorHook;
}

export interface ProcessorExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
  processorName: string;
  data?: unknown;
}

export interface ProcessorHealthCheck {
  name: string;
  status: "healthy" | "degraded" | "failed";
  lastRun: number;
  successRate: number;
  averageExecutionTime: number;
  totalRuns: number;
  failedRuns: number;
}

// Additional types for better type safety
export interface TestResults {
  passed: number;
  failed: number;
  total: number;
  duration: number;
}

export interface RegressionResults {
  issues: string[];
  passed: boolean;
}
