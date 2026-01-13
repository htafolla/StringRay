/**
 * Post-Processor Type Definitions
 */

export interface PostProcessorConfig {
  // Trigger configuration
  triggers: {
    gitHooks: boolean;
    webhooks: boolean;
    api: boolean;
  };

  // Monitoring configuration
  monitoring: {
    enabled: boolean;
    interval: number; // milliseconds
    timeout: number; // milliseconds
  };

  // Auto-fix configuration
  autoFix: {
    enabled: boolean;
    confidenceThreshold: number; // 0.0 to 1.0
    maxAttempts: number;
  };

  // Retry configuration
  maxAttempts: number;
  retryDelay: number; // milliseconds

  // Escalation configuration
  escalation: {
    manualInterventionThreshold: number;
    rollbackThreshold: number;
    emergencyThreshold: number;
  };

  // Redeploy configuration
  redeploy: {
    maxRetries: number;
    retryDelay: number;
    backoffStrategy: "linear" | "exponential";
    canaryEnabled: boolean;
    canaryPhases: number;
    canaryTrafficIncrement: number;
    healthCheckTimeout: number;
    rollbackOnFailure: boolean;
  };

  // Success handling configuration
  success: {
    successConfirmation: boolean;
    cleanupEnabled: boolean;
    notificationEnabled: boolean;
    metricsCollection: boolean;
  };

  // Reporting configuration
  reporting: {
    enabled: boolean;
    autoGenerate: boolean;
    reportThreshold: number; // Minimum complexity score to trigger auto-report
    reportDir: string;
    retentionDays: number;
  };
}

export interface PostProcessorContext {
  commitSha: string;
  repository: string;
  branch: string;
  author: string;
  files: string[];
  trigger: "git-hook" | "webhook" | "api" | "manual";
}

export interface PostProcessorResult {
  success: boolean;
  commitSha: string;
  sessionId: string;
  attempts: number;
  monitoringResults?: any[];
  fixesApplied?: any[];
  error?: string;
  duration?: number;
}

export interface MonitoringResult {
  commitSha: string;
  overallStatus: "success" | "failure" | "running";
  timestamp: Date;
  ciStatus?: CIStatus;
  performanceStatus?: PerformanceStatus;
  securityStatus?: SecurityStatus;
  failedJobs?: string[];
  duration: number;
}

export interface CIStatus {
  status: "success" | "failure" | "running";
  failedJobs: string[];
  totalJobs: number;
  duration: number;
}

export interface PerformanceStatus {
  status: "passed" | "failed" | "warning";
  score: number;
  regressions: string[];
  duration: number;
}

export interface SecurityStatus {
  status: "passed" | "failed" | "warning";
  vulnerabilities: number;
  criticalVulnerabilities: number;
  scanDuration: number;
}

export interface FailureAnalysis {
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  rootCause: string;
  recommendedActions: string[];
  suggestedFixes: SuggestedFix[];
}

export interface SuggestedFix {
  type:
    | "dependency-update"
    | "code-fix"
    | "config-change"
    | "test-regeneration";
  confidence: number;
  description: string;
  files: string[];
  changes: any[];
}

export interface FixResult {
  success: boolean;
  appliedFixes: AppliedFix[];
  requiresManualIntervention: boolean;
  confidence: number;
  rollbackAvailable: boolean;
}

export interface AppliedFix {
  type: string;
  files: string[];
  description: string;
  timestamp: Date;
  rollbackData?: any;
}

export interface EscalationResult {
  level: "manual-intervention" | "rollback" | "emergency";
  reason: string;
  recommendations: string[];
  incidentReport: IncidentReport;
}

export interface IncidentReport {
  id: string;
  commitSha: string;
  timestamp: Date;
  severity: string;
  affectedSystems: string[];
  rootCause: string;
  impact: string;
  resolution: string;
  timeline: EventTimeline[];
}

export interface EventTimeline {
  timestamp: Date;
  event: string;
  details: string;
}

export interface RedeployResult {
  success: boolean;
  deploymentId: string;
  commitSha: string;
  environment: string;
  duration: number;
  error?: string;
  rollbackPerformed?: boolean;
  canaryResults?: CanaryResult[];
}

export interface CanaryResult {
  phase: number;
  trafficPercentage: number;
  success: boolean;
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  duration: number;
}

export type PostProcessorEvent =
  | { type: "initialized"; config: PostProcessorConfig }
  | { type: "loop-started"; context: PostProcessorContext }
  | { type: "monitoring-completed"; result: MonitoringResult }
  | { type: "failure-detected"; analysis: FailureAnalysis }
  | { type: "fix-applied"; result: FixResult }
  | { type: "redeployment-initiated"; commitSha: string }
  | { type: "loop-completed"; result: PostProcessorResult }
  | { type: "escalation-triggered"; result: EscalationResult }
  | { type: "error"; error: Error; context: PostProcessorContext };
