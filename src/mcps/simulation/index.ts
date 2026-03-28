/**
 * Simulation Module Barrel Export
 *
 * Centralized export for all MCP simulation functionality.
 *
 * @example
 * ```typescript
 * import { SimulationEngine, getAllServerSimulations } from './simulation/index.js';
 * ```
 */

export { SimulationEngine, type SimulatorFunction } from './simulation-engine.js';
export {
  getAllServerSimulations,
  codeReviewSimulations,
  securityAuditSimulations,
  performanceOptimizationSimulations,
  testingStrategySimulations,
  researcherSimulations,
  frameworkHelpSimulations,
  skillInvocationSimulations,
  type ServerSimulations,
} from './server-simulations.js';
