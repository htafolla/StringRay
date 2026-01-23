/**
 * StringRay AI v1.1.1 - Performance Module Index
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
} from "./performance-system-orchestrator";

// Individual performance components
export {
  PerformanceBudgetEnforcer,
  performanceBudgetEnforcer,
  PERFORMANCE_BUDGET,
} from "./performance-budget-enforcer";
export {
  PerformanceRegressionTester,
  performanceRegressionTester,
} from "./performance-regression-tester";
export {
  PerformanceMonitoringDashboard,
  performanceDashboard,
} from "./performance-monitoring-dashboard";
export {
  PerformanceCIGates,
  performanceCIGates,
} from "./performance-ci-gates";
