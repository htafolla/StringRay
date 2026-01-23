/**
 * Intelligent Commit Batcher - Batches related changes for optimal commit history
 * Implements configurable thresholds for file count, time windows, and risk levels
 */
import { frameworkLogger } from "../framework-logger";
import { runCommand } from "../utils/command-runner";
export class IntelligentCommitBatcher {
    pendingChanges = [];
    lastCommitTime = Date.now();
    config;
    constructor(config) {
        this.config = {
            maxFilesPerCommit: 5,
            minFilesPerCommit: 1,
            maxTimeBetweenCommits: 5 * 60 * 1000, // 5 minutes
            minTimeBetweenCommits: 30 * 1000, // 30 seconds
            forceCommitAfter: 10 * 60 * 1000, // 10 minutes
            batchRelatedOperations: true,
            maxOperationsPerBatch: 3,
            batchLowRiskChanges: true,
            separateHighRiskChanges: true,
            batchByComponent: true,
            maxComponentsPerCommit: 2,
            autoCommit: true,
            generateCommitMessages: true,
            amendLastCommit: false,
            ...config,
        };
    }
    /**
     * Add a change to the pending batch
     */
    addChange(change) {
        this.pendingChanges.push({
            ...change,
            timestamp: change.timestamp || Date.now(),
        });
        // Check if we should commit this batch
        return this.shouldCommitBatch();
    }
    /**
     * Add multiple changes to the batch
     */
    addChanges(changes) {
        changes.forEach((change) => this.addChange(change));
        return this.shouldCommitBatch();
    }
    /**
     * Check if the current batch should be committed
     */
    shouldCommitBatch() {
        if (this.pendingChanges.length === 0)
            return false;
        const metrics = this.calculateBatchMetrics();
        // Force commit if too much time has passed
        if (metrics.timeSinceLastCommit >= this.config.forceCommitAfter) {
            return true;
        }
        // Check file count threshold
        if (metrics.fileCount >= this.config.maxFilesPerCommit) {
            return true;
        }
        // Check operation count threshold
        if (this.config.batchRelatedOperations &&
            metrics.operationCount >= this.config.maxOperationsPerBatch) {
            return true;
        }
        // Check component count threshold
        if (this.config.batchByComponent &&
            metrics.componentCount >= this.config.maxComponentsPerCommit) {
            return true;
        }
        // Check risk level separation
        if (this.config.separateHighRiskChanges && this.hasMixedRiskLevels()) {
            return true;
        }
        // Commit immediately for critical risk changes
        if (this.pendingChanges.some((c) => c.riskLevel === "critical")) {
            return true;
        }
        return false;
    }
    /**
     * Commit the current batch of changes
     */
    async commitBatch(commitMessage) {
        const jobId = `commit-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (this.pendingChanges.length === 0)
            return false;
        if (this.pendingChanges.length < this.config.minFilesPerCommit) {
            // Wait for more changes unless force commit time reached
            const metrics = this.calculateBatchMetrics();
            if (metrics.timeSinceLastCommit < this.config.forceCommitAfter) {
                return false;
            }
        }
        try {
            // Generate commit message if not provided
            const finalMessage = commitMessage || this.generateCommitMessage();
            // Stage files
            const filesToStage = this.getFilesToStage();
            await this.stageFiles(filesToStage);
            // Commit changes
            const success = await this.performGitCommit(finalMessage);
            if (success) {
                await frameworkLogger.log("commit-batcher", "batch-committed", "success", {
                    jobId,
                    filesCommitted: filesToStage.length,
                    operations: this.getOperationSummary(),
                    commitMessage: finalMessage.substring(0, 100),
                });
                // Reset batch
                this.pendingChanges = [];
                this.lastCommitTime = Date.now();
                return true;
            }
            return false;
        }
        catch (error) {
            await frameworkLogger.log("commit-batcher", "batch-commit-failed", "error", {
                jobId,
                error: error instanceof Error ? error.message : String(error),
                filesAttempted: this.pendingChanges.length,
            });
            return false;
        }
    }
    /**
     * Force commit current batch regardless of thresholds
     */
    async forceCommitBatch(commitMessage) {
        return this.commitBatch(commitMessage);
    }
    /**
     * Get current batch status and metrics
     */
    getBatchStatus() {
        const metrics = this.calculateBatchMetrics();
        return {
            pendingChanges: this.pendingChanges.length,
            metrics,
            shouldCommit: this.shouldCommitBatch(),
            estimatedCommitMessage: this.generateCommitMessage(),
        };
    }
    /**
     * Calculate metrics for the current batch
     */
    calculateBatchMetrics() {
        const uniqueFiles = new Set(this.pendingChanges.map((c) => c.filePath));
        const uniqueOperations = new Set(this.pendingChanges.map((c) => c.operation));
        const uniqueComponents = new Set(this.pendingChanges.map((c) => this.detectComponent(c.filePath)));
        const riskLevels = this.pendingChanges.map((c) => this.riskLevelToNumber(c.riskLevel));
        const averageRisk = riskLevels.reduce((a, b) => a + b, 0) / riskLevels.length;
        const timestamps = this.pendingChanges.map((c) => c.timestamp);
        const oldestTime = Math.min(...timestamps);
        const newestTime = Math.max(...timestamps);
        return {
            fileCount: uniqueFiles.size,
            operationCount: uniqueOperations.size,
            componentCount: uniqueComponents.size,
            totalLinesChanged: this.pendingChanges.reduce((sum, c) => sum + c.linesChanged, 0),
            timeSinceLastCommit: Date.now() - this.lastCommitTime,
            averageRiskLevel: averageRisk,
            oldestChangeTime: oldestTime,
            newestChangeTime: newestTime,
        };
    }
    /**
     * Check if batch has mixed risk levels that should be separated
     */
    hasMixedRiskLevels() {
        if (!this.config.separateHighRiskChanges)
            return false;
        const riskLevels = this.pendingChanges.map((c) => c.riskLevel);
        const hasHighRisk = riskLevels.some((r) => r === "high" || r === "critical");
        const hasLowRisk = riskLevels.some((r) => r === "low");
        return hasHighRisk && hasLowRisk;
    }
    /**
     * Generate intelligent commit message
     */
    generateCommitMessage() {
        if (!this.config.generateCommitMessages ||
            this.pendingChanges.length === 0) {
            return `Batch commit: ${this.pendingChanges.length} changes`;
        }
        const operations = this.pendingChanges.map((c) => c.operation);
        const changeTypes = this.pendingChanges.map((c) => c.changeType);
        const components = this.pendingChanges.map((c) => this.extractComponentName(c.filePath));
        // Determine primary operation
        const primaryOperation = this.getPrimaryOperation(operations);
        // Determine scope
        const validComponents = components.filter((c) => c && c.trim().length > 0);
        const uniqueComponents = Array.from(new Set(validComponents));
        const scope = uniqueComponents.length === 1
            ? uniqueComponents[0]
            : `${this.pendingChanges.length} files`;
        // Determine action verb
        const action = this.getActionVerb(primaryOperation, changeTypes) || primaryOperation;
        // Create commit message
        return `${action}: ${scope}`;
    }
    /**
     * Get files that should be staged for this commit
     */
    getFilesToStage() {
        return Array.from(new Set(this.pendingChanges.map((c) => c.filePath)));
    }
    /**
     * Stage files for commit
     */
    async stageFiles(files) {
        for (const file of files) {
            await runCommand(`git add "${file}"`, { silent: true });
        }
    }
    /**
     * Perform the actual git commit
     */
    async performGitCommit(message) {
        try {
            const result = await runCommand(`git commit -m "${message}"`, {
                silent: true,
            });
            return result.success;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get summary of operations in this batch
     */
    getOperationSummary() {
        const summary = {};
        this.pendingChanges.forEach((change) => {
            summary[change.operation] = (summary[change.operation] || 0) + 1;
        });
        return summary;
    }
    // Helper methods
    riskLevelToNumber(risk) {
        switch (risk) {
            case "low":
                return 1;
            case "medium":
                return 2;
            case "high":
                return 3;
            case "critical":
                return 4;
            default:
                return 2;
        }
    }
    detectComponent(filePath) {
        // Extract component from file path (e.g., src/components/Button.tsx → components)
        const parts = filePath.split("/");
        const srcIndex = parts.indexOf("src");
        if (srcIndex >= 0 && srcIndex + 1 < parts.length) {
            const component = parts[srcIndex + 1];
            return component || "root";
        }
        return "root";
    }
    extractComponentName(filePath) {
        const component = this.detectComponent(filePath);
        if (component === "root")
            return "";
        // Convert snake_case/kebab-case to Title Case
        return component
            .split(/[-_]/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }
    getPrimaryOperation(operations) {
        // Count operations and return most common
        const counts = {};
        operations.forEach((op) => {
            counts[op] = (counts[op] || 0) + 1;
        });
        let maxCount = 0;
        let primaryOp = "modify";
        for (const [op, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                primaryOp = op;
            }
        }
        return primaryOp;
    }
    getActionVerb(operation, changeTypes) {
        const primaryType = changeTypes.length === 1
            ? changeTypes[0]
            : changeTypes.includes("bug-fix")
                ? "fix"
                : changeTypes.includes("feature")
                    ? "feat"
                    : changeTypes.includes("refactor")
                        ? "refactor"
                        : changeTypes.includes("test")
                            ? "test"
                            : changeTypes.includes("config")
                                ? "config"
                                : changeTypes.includes("docs")
                                    ? "docs"
                                    : "update";
        switch (primaryType) {
            case "feat":
                return "feat";
            case "fix":
                return "fix";
            case "refactor":
                return "refactor";
            case "test":
                return "test";
            case "config":
                return "config";
            case "docs":
                return "docs";
            default:
                return operation;
        }
    }
}
// Export factory function
export const createIntelligentCommitBatcher = (config) => {
    return new IntelligentCommitBatcher(config);
};
// Export default instance
export const intelligentCommitBatcher = new IntelligentCommitBatcher();
//# sourceMappingURL=intelligent-commit-batcher.js.map