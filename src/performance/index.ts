/**
 * StringRay Framework v1.0.0 - Performance Module Index
 *
 * Unified exports for the comprehensive performance testing and monitoring system.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

// Core performance system orchestrator
export {
  PerformanceSystemOrchestrator,
  performanceSystem,
} from "./performance-system-orchestrator.js";

// Individual performance components
export {
  PerformanceBudgetEnforcer,
  performanceBudgetEnforcer,
  PERFORMANCE_BUDGET,
} from "./performance-budget-enforcer.js";
export {
  PerformanceRegressionTester,
  performanceRegressionTester,
} from "./performance-regression-tester.js";
export {
  PerformanceMonitoringDashboard,
  performanceDashboard,
} from "./performance-monitoring-dashboard.js";
export {
  PerformanceCIGates,
  performanceCIGates,
} from "./performance-ci-gates.js";
