/**
 * Rule Enforcement Core Components
 *
 * This module exports the core components of the rule enforcement system.
 * These components handle rule storage, hierarchy, execution, and fixing.
 *
 * Phase 5 refactoring: Extracted from RuleEnforcer.
 *
 * @module enforcement/core
 * @version 1.0.0
 */

// Rule storage and management
export { RuleRegistry } from './rule-registry.js';

// Rule dependency management
export { RuleHierarchy } from './rule-hierarchy.js';

// Validation execution orchestration
export { RuleExecutor } from './rule-executor.js';

// Violation fix delegation
export { ViolationFixer } from './violation-fixer.js';
