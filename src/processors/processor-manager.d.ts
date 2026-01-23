/**
 * StringRay AI v1.1.1 - Processor Manager
 *
 * Centralized processor management for pre/post processing operations.
 * Implements lifecycle management, performance monitoring, and conflict resolution.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { StringRayStateManager } from "../state/state-manager";
import { ProcessorRegistration } from "./processor-types";
export interface ProcessorConfig {
    name: string;
    type: "pre" | "post";
    priority: number;
    enabled: boolean;
    timeout?: number;
    retryAttempts?: number;
    hook?: any;
}
export interface ProcessorResult {
    success: boolean;
    data?: any;
    error?: string;
    duration: number;
    processorName: string;
}
export interface ProcessorHealth {
    name: string;
    status: "healthy" | "degraded" | "failed";
    lastExecution: number;
    successRate: number;
    averageDuration: number;
    errorCount: number;
}
export interface ProcessorMetrics {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    lastExecutionTime: number;
    healthStatus: ProcessorHealth["status"];
}
export declare class ProcessorManager {
    private processors;
    private metrics;
    private stateManager;
    private activeProcessors;
    constructor(stateManager: StringRayStateManager);
    /**
     * Register a processor with the manager
     */
    registerProcessorWithHook(registration: ProcessorRegistration): void;
    registerProcessor(config: ProcessorConfig): void;
    /**
     * Unregister a processor
     */
    unregisterProcessor(name: string): void;
    /**
     * Initialize all registered processors
     */
    initializeProcessors(): Promise<boolean>;
    /**
     * Initialize a specific processor
     */
    private initializeProcessor;
    /**
     * Execute pre-processors for a given operation
     */
    executePreProcessors(input: {
        tool: string;
        args?: any;
        context?: any;
    }): Promise<{
        success: boolean;
        results: ProcessorResult[];
    }>;
    /**
     * Execute post-processors for a given operation
     */
    executePostProcessors(operation: string, data: any, preResults: ProcessorResult[]): Promise<ProcessorResult[]>;
    /**
     * Execute a specific processor
     */
    private executeProcessor;
    /**
     * Update processor metrics
     */
    private updateMetrics;
    /**
     * Get processor health status
     */
    getProcessorHealth(): ProcessorHealth[];
    /**
     * Resolve processor conflicts
     */
    resolveProcessorConflicts(conflicts: ProcessorResult[]): ProcessorResult;
    /**
     * Cleanup all processors
     */
    cleanupProcessors(): Promise<void>;
    /**
     * Cleanup a specific processor
     */
    private cleanupProcessor;
    private initializePreValidateProcessor;
    private initializeCodexComplianceProcessor;
    private initializeErrorBoundaryProcessor;
    private initializeTestExecutionProcessor;
    private initializeRegressionTestingProcessor;
    private initializeStateValidationProcessor;
    private executePreValidate;
    private executeCodexCompliance;
    private executeErrorBoundary;
    private executeTestExecution;
    private executeRegressionTesting;
    private executeStateValidation;
    private executeRefactoringLogging;
    /**
     * Attempt to fix rule violations by calling appropriate agents/skills
     */
    private attemptRuleViolationFixes;
    /**
     * Get the appropriate agent/skill for a rule violation
     */
    private getAgentForRule;
}
//# sourceMappingURL=processor-manager.d.ts.map