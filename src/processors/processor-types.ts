/**
 * StringRay AI v1.1.1 - Processor Types
 *
 * Type definitions for the processor activation system.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

export interface PreValidateContext {
  operation: string;
  data: any;
  syntaxCheck?: boolean;
  codexCompliance?: boolean;
  agentName?: string;
  filesChanged?: string[];
  riskLevel?: "low" | "medium" | "high" | "critical";
}

export interface PostValidateContext {
  operation: string;
  data: any;
  preResults: any[];
  testResults?: any;
  regressionResults?: any;
  stateValidation?: boolean;
}

export interface ProcessorHook {
  name: string;
  execute: (context: PreValidateContext | PostValidateContext) => Promise<any>;
  priority: number;
  enabled: boolean;
}

export interface ProcessorRegistration {
  name: string;
  type: "pre" | "post";
  hook: ProcessorHook;
}

export interface ProcessorExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
  processorName: string;
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
