/**
 * Processor Implementations Index
 *
 * Exports all processor implementations for registration.
 *
 * @module processors/implementations
 * @version 1.0.0
 */

// Pre-processors
export { PreValidateProcessor } from "./pre-validate-processor.js";
export { CodexComplianceProcessor } from "./codex-compliance-processor.js";
export { VersionComplianceProcessor } from "./version-compliance-processor.js";
export { ErrorBoundaryProcessor } from "./error-boundary-processor.js";
export { LogProtectionProcessor, logProtectionProcessor } from "./log-protection-processor.js";

// Post-processors
export { TestExecutionProcessor } from "./test-execution-processor.js";
export { RegressionTestingProcessor } from "./regression-testing-processor.js";
export { StateValidationProcessor } from "./state-validation-processor.js";
export { RefactoringLoggingProcessor } from "./refactoring-logging-processor.js";
export { TestAutoCreationProcessor } from "./test-auto-creation-processor.js";
export { CoverageAnalysisProcessor } from "./coverage-analysis-processor.js";
export { AgentsMdValidationProcessor } from "./agents-md-validation-processor.js";
export { InferenceImprovementProcessor } from "./inference-improvement-processor.js";
