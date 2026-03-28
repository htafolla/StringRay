/**
 * RuleHierarchy Tests
 *
 * Tests for the RuleHierarchy class that manages rule dependencies
 * and execution ordering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RuleHierarchy } from '../rule-hierarchy.js';

describe('RuleHierarchy', () => {
  let hierarchy: RuleHierarchy;

  beforeEach(() => {
    hierarchy = new RuleHierarchy();
  });

  describe('addDependency', () => {
    it('should add single dependency', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);

      expect(hierarchy.getDependencies('rule-b')).toEqual(['rule-a']);
      expect(hierarchy.getDependents('rule-a')).toEqual(['rule-b']);
    });

    it('should add multiple dependencies', () => {
      hierarchy.addDependency('rule-c', ['rule-a', 'rule-b']);

      const deps = hierarchy.getDependencies('rule-c');
      expect(deps).toContain('rule-a');
      expect(deps).toContain('rule-b');
      expect(deps).toHaveLength(2);
    });

    it('should accumulate dependencies when called multiple times', () => {
      hierarchy.addDependency('rule-c', ['rule-a']);
      hierarchy.addDependency('rule-c', ['rule-b']);

      const deps = hierarchy.getDependencies('rule-c');
      expect(deps).toContain('rule-a');
      expect(deps).toContain('rule-b');
      expect(deps).toHaveLength(2);
    });

    it('should track reverse dependency relationship', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-c', ['rule-a']);

      const dependents = hierarchy.getDependents('rule-a');
      expect(dependents).toContain('rule-b');
      expect(dependents).toContain('rule-c');
    });
  });

  describe('getDependencies', () => {
    it('should return empty array for rule with no dependencies', () => {
      expect(hierarchy.getDependencies('rule-a')).toEqual([]);
    });

    it('should return dependencies in insertion order', () => {
      hierarchy.addDependency('rule-c', ['rule-a', 'rule-b']);

      const deps = hierarchy.getDependencies('rule-c');
      expect(deps).toEqual(['rule-a', 'rule-b']);
    });
  });

  describe('getDependents', () => {
    it('should return empty array for rule with no dependents', () => {
      expect(hierarchy.getDependents('rule-a')).toEqual([]);
    });

    it('should return all rules that depend on this rule', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-c', ['rule-a']);
      hierarchy.addDependency('rule-d', ['rule-b']); // rule-d depends on rule-b, not rule-a

      const dependents = hierarchy.getDependents('rule-a');
      expect(dependents).toContain('rule-b');
      expect(dependents).toContain('rule-c');
      expect(dependents).not.toContain('rule-d');
      expect(dependents).toHaveLength(2);
    });
  });

  describe('getExecutionOrder', () => {
    it('should return empty array for empty input', () => {
      expect(hierarchy.getExecutionOrder([])).toEqual([]);
    });

    it('should return rules in input order when no dependencies', () => {
      const rules = ['rule-a', 'rule-b', 'rule-c'];
      expect(hierarchy.getExecutionOrder(rules)).toEqual(rules);
    });

    it('should order rules by dependency (dependencies first)', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);

      const order = hierarchy.getExecutionOrder(['rule-b', 'rule-a']);
      expect(order).toEqual(['rule-a', 'rule-b']);
    });

    it('should handle complex dependency chains', () => {
      // rule-c depends on rule-b, which depends on rule-a
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-c', ['rule-b']);

      const order = hierarchy.getExecutionOrder(['rule-c', 'rule-a', 'rule-b']);
      expect(order).toEqual(['rule-a', 'rule-b', 'rule-c']);
    });

    it('should handle multiple independent chains', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-d', ['rule-c']);

      const order = hierarchy.getExecutionOrder(['rule-d', 'rule-b', 'rule-a', 'rule-c']);
      // rule-a and rule-c have no dependencies, so they can be in any order
      expect(order.indexOf('rule-a')).toBeLessThan(order.indexOf('rule-b'));
      expect(order.indexOf('rule-c')).toBeLessThan(order.indexOf('rule-d'));
    });

    it('should handle diamond dependency pattern', () => {
      //     rule-a
      //    /      \
      // rule-b   rule-c
      //    \      /
      //     rule-d
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-c', ['rule-a']);
      hierarchy.addDependency('rule-d', ['rule-b', 'rule-c']);

      const order = hierarchy.getExecutionOrder(['rule-d', 'rule-c', 'rule-b', 'rule-a']);
      expect(order.indexOf('rule-a')).toBeLessThan(order.indexOf('rule-b'));
      expect(order.indexOf('rule-a')).toBeLessThan(order.indexOf('rule-c'));
      expect(order.indexOf('rule-b')).toBeLessThan(order.indexOf('rule-d'));
      expect(order.indexOf('rule-c')).toBeLessThan(order.indexOf('rule-d'));
    });

    it('should filter out dependencies not in the rule set', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-b', ['external-rule']);

      // external-rule is not in the execution set
      const order = hierarchy.getExecutionOrder(['rule-b', 'rule-a']);
      expect(order).toContain('rule-a');
      expect(order).toContain('rule-b');
      expect(order).toHaveLength(2);
    });
  });

  describe('hasCircularDependencies', () => {
    it('should return false for empty hierarchy', () => {
      expect(hierarchy.hasCircularDependencies()).toBe(false);
    });

    it('should return false for acyclic dependencies', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-c', ['rule-b']);

      expect(hierarchy.hasCircularDependencies()).toBe(false);
    });

    it('should return true for self-referencing rule', () => {
      hierarchy.addDependency('rule-a', ['rule-a']);

      expect(hierarchy.hasCircularDependencies()).toBe(true);
    });

    it('should return true for simple cycle (a -> b -> a)', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-a', ['rule-b']);

      expect(hierarchy.hasCircularDependencies()).toBe(true);
    });

    it('should return true for complex cycle (a -> b -> c -> a)', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-c', ['rule-b']);
      hierarchy.addDependency('rule-a', ['rule-c']);

      expect(hierarchy.hasCircularDependencies()).toBe(true);
    });
  });

  describe('findCircularDependencies', () => {
    it('should return empty array for empty hierarchy', () => {
      expect(hierarchy.findCircularDependencies()).toEqual([]);
    });

    it('should return empty array for acyclic dependencies', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      expect(hierarchy.findCircularDependencies()).toEqual([]);
    });

    it('should detect self-referencing cycle', () => {
      hierarchy.addDependency('rule-a', ['rule-a']);

      const cycles = hierarchy.findCircularDependencies();
      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toContain('rule-a');
    });

    it('should detect simple cycle (a -> b -> a)', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-a', ['rule-b']);

      const cycles = hierarchy.findCircularDependencies();
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should detect complex cycle (a -> b -> c -> a)', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.addDependency('rule-c', ['rule-b']);
      hierarchy.addDependency('rule-a', ['rule-c']);

      const cycles = hierarchy.findCircularDependencies();
      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('isDependencySatisfied', () => {
    it('should return true for rule with no dependencies', () => {
      expect(hierarchy.isDependencySatisfied('rule-a', new Set())).toBe(true);
    });

    it('should return true when all dependencies are satisfied', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);

      expect(hierarchy.isDependencySatisfied('rule-b', new Set(['rule-a']))).toBe(true);
    });

    it('should return false when dependencies are not satisfied', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);

      expect(hierarchy.isDependencySatisfied('rule-b', new Set())).toBe(false);
    });

    it('should return false when only some dependencies are satisfied', () => {
      hierarchy.addDependency('rule-c', ['rule-a', 'rule-b']);

      expect(hierarchy.isDependencySatisfied('rule-c', new Set(['rule-a']))).toBe(false);
    });

    it('should return true when all dependencies are satisfied in complex case', () => {
      hierarchy.addDependency('rule-c', ['rule-a', 'rule-b']);

      expect(hierarchy.isDependencySatisfied('rule-c', new Set(['rule-a', 'rule-b']))).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all dependencies', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);
      hierarchy.clear();

      expect(hierarchy.getDependencies('rule-b')).toEqual([]);
      expect(hierarchy.getDependents('rule-a')).toEqual([]);
    });
  });

  describe('getAllRules', () => {
    it('should return empty array for empty hierarchy', () => {
      expect(hierarchy.getAllRules()).toEqual([]);
    });

    it('should return all rules with dependencies', () => {
      hierarchy.addDependency('rule-b', ['rule-a']);

      const rules = hierarchy.getAllRules();
      expect(rules).toContain('rule-a');
      expect(rules).toContain('rule-b');
    });

    it('should return unique rules only', () => {
      hierarchy.addDependency('rule-c', ['rule-a', 'rule-b']);

      const rules = hierarchy.getAllRules();
      expect(rules).toHaveLength(3);
    });
  });
});
