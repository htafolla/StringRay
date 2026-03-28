/**
 * Rule Hierarchy - Manage rule dependencies and execution order
 *
 * This class manages rule dependencies and calculates execution order.
 * It uses topological sorting to ensure dependencies are validated before dependents.
 *
 * Phase 5 refactoring: Extracted from RuleEnforcer.
 *
 * @module enforcement/core
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * const hierarchy = new RuleHierarchy();
 * hierarchy.addDependency('tests-required', ['no-duplicate-code']);
 * hierarchy.addDependency('memory-optimization', ['context-analysis-integration']);
 *
 * const order = hierarchy.getExecutionOrder(['tests-required', 'memory-optimization']);
 * // Result: ['no-duplicate-code', 'tests-required', 'context-analysis-integration', 'memory-optimization']
 * ```
 */

import { IRuleHierarchy } from '../types.js';

/**
 * RuleHierarchy manages rule dependency relationships and execution ordering.
 *
 * Key responsibilities:
 * - Track rule dependencies (A depends on B)
 * - Calculate execution order via topological sort
 * - Detect circular dependencies
 * - Check dependency satisfaction
 */
export class RuleHierarchy implements IRuleHierarchy {
  /** Map of rule IDs to their dependencies */
  private dependencies: Map<string, Set<string>> = new Map();

  /** Map of rule IDs to rules that depend on them */
  private dependents: Map<string, Set<string>> = new Map();

  /**
   * Add a dependency relationship.
   * The rule will be executed after all its dependencies.
   *
   * @param ruleId - The rule that depends on others
   * @param dependsOn - Array of rule IDs that must be executed first
   *
   * @example
   * ```typescript
   * hierarchy.addDependency('tests-required', ['no-duplicate-code']);
   * // tests-required will be validated after no-duplicate-code
   * ```
   */
  addDependency(ruleId: string, dependsOn: string[]): void {
    // Add forward dependency relationship
    if (!this.dependencies.has(ruleId)) {
      this.dependencies.set(ruleId, new Set());
    }
    dependsOn.forEach(dep => this.dependencies.get(ruleId)!.add(dep));

    // Track reverse relationship (dependents)
    dependsOn.forEach(dep => {
      if (!this.dependents.has(dep)) {
        this.dependents.set(dep, new Set());
      }
      this.dependents.get(dep)!.add(ruleId);
    });
  }

  /**
   * Get all dependencies for a rule.
   *
   * @param ruleId - The rule to get dependencies for
   * @returns Array of rule IDs that the rule depends on
   *
   * @example
   * ```typescript
   * const deps = hierarchy.getDependencies('tests-required');
   * console.log(deps); // ['no-duplicate-code']
   * ```
   */
  getDependencies(ruleId: string): string[] {
    const deps = this.dependencies.get(ruleId);
    return deps ? Array.from(deps) : [];
  }

  /**
   * Get all rules that depend on the given rule.
   *
   * @param ruleId - The rule to get dependents for
   * @returns Array of rule IDs that depend on this rule
   *
   * @example
   * ```typescript
   * const dependents = hierarchy.getDependents('no-duplicate-code');
   * console.log(dependents); // ['tests-required']
   * ```
   */
  getDependents(ruleId: string): string[] {
    const deps = this.dependents.get(ruleId);
    return deps ? Array.from(deps) : [];
  }

  /**
   * Get the execution order for a set of rules using topological sort.
   * Rules are returned in order such that dependencies come before dependents.
   *
   * Uses Kahn's algorithm for topological sorting.
   *
   * @param ruleIds - Array of rule IDs to order
   * @returns Sorted array of rule IDs in dependency order
   *
   * @example
   * ```typescript
   * const order = hierarchy.getExecutionOrder(['tests-required', 'no-duplicate-code']);
   * // Result: ['no-duplicate-code', 'tests-required']
   * ```
   */
  getExecutionOrder(ruleIds: string[]): string[] {
    if (ruleIds.length === 0) return [];

    // Build in-degree map for rules in the set
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, Set<string>>();

    // Initialize
    ruleIds.forEach(id => {
      inDegree.set(id, 0);
      adjacencyList.set(id, new Set());
    });

    // Calculate in-degrees and adjacency list
    ruleIds.forEach(id => {
      const deps = this.getDependencies(id);
      deps.forEach(dep => {
        // Only count dependencies that are in the rule set
        if (ruleIds.includes(dep)) {
          inDegree.set(id, (inDegree.get(id) || 0) + 1);
          adjacencyList.get(dep)!.add(id);
        }
      });
    });

    // Kahn's algorithm
    const result: string[] = [];
    const queue: string[] = [];

    // Start with nodes that have no dependencies
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const dependents = adjacencyList.get(current) || new Set();
      dependents.forEach(dependent => {
        const newDegree = (inDegree.get(dependent) || 0) - 1;
        inDegree.set(dependent, newDegree);
        if (newDegree === 0) {
          queue.push(dependent);
        }
      });
    }

    // If not all rules were processed, there's a circular dependency
    if (result.length !== ruleIds.length) {
      // Return rules in original order if topological sort fails
      // This ensures we still execute rules even with cycles
      return [...ruleIds];
    }

    return result;
  }

  /**
   * Check if any circular dependencies exist in the hierarchy.
   *
   * @returns true if circular dependencies exist, false otherwise
   *
   * @example
   * ```typescript
   * if (hierarchy.hasCircularDependencies()) {
   *   console.error('Circular dependencies detected!');
   * }
   * ```
   */
  hasCircularDependencies(): boolean {
    return this.findCircularDependencies().length > 0;
  }

  /**
   * Find all circular dependency cycles.
   * Uses DFS to detect cycles in the dependency graph.
   *
   * @returns Array of cycles, where each cycle is an array of rule IDs
   *
   * @example
   * ```typescript
   * const cycles = hierarchy.findCircularDependencies();
   * // cycles might be [['rule-a', 'rule-b', 'rule-c']]
   * ```
   */
  findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycles.push(cycle);
        }
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const deps = this.getDependencies(node);
      deps.forEach(dep => {
        dfs(dep, [...path]);
      });

      recursionStack.delete(node);
    };

    // Check all nodes
    this.dependencies.forEach((_, ruleId) => {
      if (!visited.has(ruleId)) {
        dfs(ruleId, []);
      }
    });

    return cycles;
  }

  /**
   * Check if all dependencies for a rule have been executed.
   *
   * @param ruleId - The rule to check
   * @param executedRules - Set of rule IDs that have already been executed
   * @returns true if all dependencies are satisfied, false otherwise
   *
   * @example
   * ```typescript
   * const executed = new Set(['no-duplicate-code']);
   * if (hierarchy.isDependencySatisfied('tests-required', executed)) {
   *   // Safe to execute tests-required
   * }
   * ```
   */
  isDependencySatisfied(ruleId: string, executedRules: Set<string>): boolean {
    const deps = this.getDependencies(ruleId);
    return deps.every(dep => executedRules.has(dep));
  }

  /**
   * Clear all dependency relationships.
   * Useful for testing or reinitializing.
   */
  clear(): void {
    this.dependencies.clear();
    this.dependents.clear();
  }

  /**
   * Get all rules that have dependencies registered.
   *
   * @returns Array of rule IDs with dependencies
   */
  getAllRules(): string[] {
    const rules = new Set<string>();
    this.dependencies.forEach((_, ruleId) => rules.add(ruleId));
    this.dependents.forEach((_, ruleId) => rules.add(ruleId));
    return Array.from(rules);
  }
}
