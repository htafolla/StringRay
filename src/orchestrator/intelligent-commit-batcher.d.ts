/**
 * Intelligent Commit Batcher - Batches related changes for optimal commit history
 * Implements configurable thresholds for file count, time windows, and risk levels
 */
export interface PendingChange {
    filePath: string;
    operation: string;
    changeType: string;
    riskLevel: "low" | "medium" | "high" | "critical";
    linesChanged: number;
    timestamp: number;
    relatedFiles?: string[];
    commitMessage?: string;
    author?: string;
}
export interface CommitBatchingConfig {
    maxFilesPerCommit: number;
    minFilesPerCommit: number;
    maxTimeBetweenCommits: number;
    minTimeBetweenCommits: number;
    forceCommitAfter: number;
    batchRelatedOperations: boolean;
    maxOperationsPerBatch: number;
    batchLowRiskChanges: boolean;
    separateHighRiskChanges: boolean;
    batchByComponent: boolean;
    maxComponentsPerCommit: number;
    autoCommit: boolean;
    generateCommitMessages: boolean;
    amendLastCommit: boolean;
}
export interface BatchMetrics {
    fileCount: number;
    operationCount: number;
    componentCount: number;
    totalLinesChanged: number;
    timeSinceLastCommit: number;
    averageRiskLevel: number;
    oldestChangeTime: number;
    newestChangeTime: number;
}
export declare class IntelligentCommitBatcher {
    private pendingChanges;
    private lastCommitTime;
    private config;
    constructor(config?: Partial<CommitBatchingConfig>);
    /**
     * Add a change to the pending batch
     */
    addChange(change: PendingChange): boolean;
    /**
     * Add multiple changes to the batch
     */
    addChanges(changes: PendingChange[]): boolean;
    /**
     * Check if the current batch should be committed
     */
    shouldCommitBatch(): boolean;
    /**
     * Commit the current batch of changes
     */
    commitBatch(commitMessage?: string): Promise<boolean>;
    /**
     * Force commit current batch regardless of thresholds
     */
    forceCommitBatch(commitMessage?: string): Promise<boolean>;
    /**
     * Get current batch status and metrics
     */
    getBatchStatus(): {
        pendingChanges: number;
        metrics: BatchMetrics;
        shouldCommit: boolean;
        estimatedCommitMessage: string;
    };
    /**
     * Calculate metrics for the current batch
     */
    private calculateBatchMetrics;
    /**
     * Check if batch has mixed risk levels that should be separated
     */
    private hasMixedRiskLevels;
    /**
     * Generate intelligent commit message
     */
    private generateCommitMessage;
    /**
     * Get files that should be staged for this commit
     */
    private getFilesToStage;
    /**
     * Stage files for commit
     */
    private stageFiles;
    /**
     * Perform the actual git commit
     */
    private performGitCommit;
    /**
     * Get summary of operations in this batch
     */
    private getOperationSummary;
    private riskLevelToNumber;
    private detectComponent;
    private extractComponentName;
    private getPrimaryOperation;
    private getActionVerb;
}
export declare const createIntelligentCommitBatcher: (config?: Partial<CommitBatchingConfig>) => IntelligentCommitBatcher;
export declare const intelligentCommitBatcher: IntelligentCommitBatcher;
//# sourceMappingURL=intelligent-commit-batcher.d.ts.map