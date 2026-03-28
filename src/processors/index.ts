/**
 * StringRay AI v1.3.4 - Processors Module
 *
 * Exports all processor-related functionality.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

export * from "./processor-manager.js";
export type {
  ProcessorContext,
  PreValidateContext,
  PostValidateContext,
  ProcessorExecutionResult,
  ProcessorHealthCheck,
  TestResults,
  RegressionResults,
} from "./processor-types.js";
