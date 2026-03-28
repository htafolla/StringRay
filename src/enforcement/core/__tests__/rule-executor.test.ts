/**
 * RuleExecutor Tests
 *
 * Tests for the RuleExecutor class that orchestrates validation execution.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RuleExecutor } from '../rule-executor.js';
import {
  RuleDefinition,
  RuleValidationContext,
  RuleValidationResult,
  IRuleRegistry,
  IRuleHierarchy,
  IValidatorRegistry,
  IValidator,
} from '../../types.js';

// Mock the framework logger
vi.mock('../../../core/framework-logger.js', () => ({
  frameworkLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('RuleExecutor', () => {
  let executor: RuleExecutor;
  let mockRegistry: IRuleRegistry;
  let mockHierarchy: IRuleHierarchy;
  let mockValidatorRegistry: IValidatorRegistry;

  beforeEach(() => {
    // Create mock implementations
    mockRegistry = {
      addRule: vi.fn(),
      getRules: vi.fn().mockReturnValue([]),
      getRule: vi.fn(),
      enableRule: vi.fn(),
      disableRule: vi.fn(),
      isRuleEnabled: vi.fn(),
      getRuleCount: vi.fn().mockReturnValue(0),
      getRuleStats: vi.fn(),
      hasRule: vi.fn(),
      removeRule: vi.fn(),
      clearRules: vi.fn(),
    };

    mockHierarchy = {
      addDependency: vi.fn(),
      getDependencies: vi.fn().mockReturnValue([]),
      getDependents: vi.fn().mockReturnValue([]),
      getExecutionOrder: vi.fn((ids: string[]) => ids),
      hasCircularDependencies: vi.fn().mockReturnValue(false),
      findCircularDependencies: vi.fn().mockReturnValue([]),
      isDependencySatisfied: vi.fn().mockReturnValue(true),
    };

    mockValidatorRegistry = {
      register: vi.fn(),
      getValidator: vi.fn(),
      getValidatorsByCategory: vi.fn(),
      getAllValidators: vi.fn().mockReturnValue([]),
      hasValidator: vi.fn(),
      unregister: vi.fn(),
      clear: vi.fn(),
      getCount: vi.fn().mockReturnValue(0),
    };

    executor = new RuleExecutor(mockRegistry, mockHierarchy, mockValidatorRegistry);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with dependencies', () => {
      expect(executor).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should return passing report when no rules', async () => {
      const context: RuleValidationContext = {
        operation: 'write',
        files: ['src/test.ts'],
      };

      const report = await executor.execute('write', context);

      expect(report.passed).toBe(true);
      expect(report.errors).toEqual([]);
      expect(report.warnings).toEqual([]);
      expect(report.results).toEqual([]);
      expect(report.operation).toBe('write');
      expect(report.timestamp).toBeInstanceOf(Date);
    });

    it('should execute applicable rules', async () => {
      const passingValidator = vi.fn().mockResolvedValue({
        passed: true,
        message: 'All good',
      });

      const rules: RuleDefinition[] = [
        {
          id: 'test-rule',
          name: 'Test Rule',
          description: 'A test rule',
          category: 'code-quality',
          severity: 'error',
          enabled: true,
          validator: passingValidator,
        },
      ];

      mockRegistry.getRules = vi.fn().mockReturnValue(rules);

      const context: RuleValidationContext = {
        operation: 'write',
        newCode: 'const x = 1;',
      };

      const report = await executor.execute('write', context);

      expect(passingValidator).toHaveBeenCalledWith(context);
      expect(report.passed).toBe(true);
    });

    it('should collect errors for failing rules', async () => {
      const failingValidator = vi.fn().mockResolvedValue({
        passed: false,
        message: 'Test failure',
      });

      const rules: RuleDefinition[] = [
        {
          id: 'test-rule',
          name: 'Test Rule',
          description: 'A test rule',
          category: 'code-quality',
          severity: 'error',
          enabled: true,
          validator: failingValidator,
        },
      ];

      mockRegistry.getRules = vi.fn().mockReturnValue(rules);

      const report = await executor.execute('write', { operation: 'write', newCode: 'test' });

      expect(report.passed).toBe(false);
      expect(report.errors).toHaveLength(1);
      expect(report.errors[0]).toContain('Test Rule');
      expect(report.errors[0]).toContain('Test failure');
    });

    it('should collect warnings for warning-level rules', async () => {
      const warningValidator = vi.fn().mockResolvedValue({
        passed: false,
        message: 'Test warning',
      });

      const rules: RuleDefinition[] = [
        {
          id: 'test-rule',
          name: 'Test Rule',
          description: 'A test rule',
          category: 'code-quality',
          severity: 'warning',
          enabled: true,
          validator: warningValidator,
        },
      ];

      mockRegistry.getRules = vi.fn().mockReturnValue(rules);

      const report = await executor.execute('write', { operation: 'write', newCode: 'test' });

      expect(report.passed).toBe(true); // Warnings don't fail the report
      expect(report.warnings).toHaveLength(1);
      expect(report.errors).toHaveLength(0);
    });

    it('should skip disabled rules', async () => {
      const validator = vi.fn().mockResolvedValue({ passed: true, message: 'OK' });

      const rules: RuleDefinition[] = [
        {
          id: 'disabled-rule',
          name: 'Disabled Rule',
          description: 'A disabled rule',
          category: 'code-quality',
          severity: 'error',
          enabled: false,
          validator,
        },
      ];

      mockRegistry.getRules = vi.fn().mockReturnValue(rules);

      await executor.execute('write', { operation: 'write', newCode: 'test' });

      expect(validator).not.toHaveBeenCalled();
    });

    it('should handle rule validation errors', async () => {
      const errorValidator = vi.fn().mockImplementation(() => {
        throw new Error('Validation error');
      });

      const rules: RuleDefinition[] = [
        {
          id: 'error-rule',
          name: 'Error Rule',
          description: 'A rule that errors',
          category: 'code-quality',
          severity: 'error',
          enabled: true,
          validator: errorValidator,
        },
      ];

      mockRegistry.getRules = vi.fn().mockReturnValue(rules);

      const report = await executor.execute('write', { operation: 'write', newCode: 'test' });

      expect(report.passed).toBe(false);
      expect(report.errors).toHaveLength(1);
      expect(report.errors[0]).toContain('Validation error');
    });

    it('should respect operation-specific rule applicability', async () => {
      const validator = vi.fn().mockResolvedValue({ passed: true, message: 'OK' });

      // tests-required only applies to 'write' or 'create' operations
      const rules: RuleDefinition[] = [
        {
          id: 'tests-required',
          name: 'Tests Required',
          description: 'Requires tests',
          category: 'testing',
          severity: 'error',
          enabled: true,
          validator,
        },
      ];

      mockRegistry.getRules = vi.fn().mockReturnValue(rules);

      // Should execute on 'write'
      await executor.execute('write', { operation: 'write', newCode: 'test' });
      expect(validator).toHaveBeenCalled();

      vi.clearAllMocks();

      // Should not execute on 'read'
      mockRegistry.getRules = vi.fn().mockReturnValue(rules);
      await executor.execute('read', { operation: 'read' });
      expect(validator).not.toHaveBeenCalled();
    });
  });

  describe('executeSingle', () => {
    it('should execute a single rule by ID', async () => {
      const validator = vi.fn().mockResolvedValue({
        passed: true,
        message: 'OK',
      });

      const rule: RuleDefinition = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'A test rule',
        category: 'code-quality',
        severity: 'error',
        enabled: true,
        validator,
      };

      mockRegistry.getRule = vi.fn().mockReturnValue(rule);

      const context: RuleValidationContext = { operation: 'write' };
      const result = await executor.executeSingle('test-rule', context);

      expect(result.passed).toBe(true);
      expect(validator).toHaveBeenCalledWith(context);
    });

    it('should throw error for non-existent rule', async () => {
      mockRegistry.getRule = vi.fn().mockReturnValue(undefined);

      await expect(
        executor.executeSingle('non-existent', { operation: 'write' }),
      ).rejects.toThrow('Rule with ID "non-existent" not found');
    });

    it('should throw error for disabled rule', async () => {
      const rule: RuleDefinition = {
        id: 'disabled-rule',
        name: 'Disabled Rule',
        description: 'A disabled rule',
        category: 'code-quality',
        severity: 'error',
        enabled: false,
        validator: vi.fn(),
      };

      mockRegistry.getRule = vi.fn().mockReturnValue(rule);

      await expect(
        executor.executeSingle('disabled-rule', { operation: 'write' }),
      ).rejects.toThrow('Rule "disabled-rule" is disabled');
    });
  });

  describe('executeBatch', () => {
    it('should execute multiple rules', async () => {
      const rules: RuleDefinition[] = [
        {
          id: 'rule-1',
          name: 'Rule 1',
          description: 'First rule',
          category: 'code-quality',
          severity: 'error',
          enabled: true,
          validator: vi.fn().mockResolvedValue({ passed: true, message: 'OK 1' }),
        },
        {
          id: 'rule-2',
          name: 'Rule 2',
          description: 'Second rule',
          category: 'code-quality',
          severity: 'error',
          enabled: true,
          validator: vi.fn().mockResolvedValue({ passed: true, message: 'OK 2' }),
        },
      ];

      rules.forEach(rule => {
        mockRegistry.getRule = vi.fn()
          .mockReturnValueOnce(rules[0])
          .mockReturnValueOnce(rules[1]);
      });

      // Mock getRule to return appropriate rule
      const callCount = 0;
      mockRegistry.getRule = vi.fn().mockImplementation((id) => {
        return rules.find(r => r.id === id);
      });

      const results = await executor.executeBatch(
        ['rule-1', 'rule-2'],
        { operation: 'write' },
      );

      expect(results).toHaveLength(2);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(true);
    });

    it('should skip disabled rules in batch', async () => {
      mockRegistry.getRule = vi.fn().mockImplementation((id) => {
        if (id === 'rule-1') {
          return {
            id: 'rule-1',
            name: 'Rule 1',
            description: 'First rule',
            category: 'code-quality',
            severity: 'error',
            enabled: true,
            validator: vi.fn().mockResolvedValue({ passed: true, message: 'OK' }),
          };
        }
        if (id === 'rule-2') {
          return {
            id: 'rule-2',
            name: 'Rule 2',
            description: 'Second rule',
            category: 'code-quality',
            severity: 'error',
            enabled: false,
            validator: vi.fn(),
          };
        }
        return undefined;
      });

      const results = await executor.executeBatch(
        ['rule-1', 'rule-2'],
        { operation: 'write' },
      );

      expect(results).toHaveLength(1);
    });

    it('should execute in parallel when parallel option is true', async () => {
      const validator1 = vi.fn().mockResolvedValue({ passed: true, message: 'OK 1' });
      const validator2 = vi.fn().mockResolvedValue({ passed: true, message: 'OK 2' });

      mockRegistry.getRule = vi.fn().mockImplementation((id) => {
        if (id === 'rule-1') {
          return {
            id: 'rule-1',
            name: 'Rule 1',
            description: 'First rule',
            category: 'code-quality',
            severity: 'error',
            enabled: true,
            validator: validator1,
          };
        }
        if (id === 'rule-2') {
          return {
            id: 'rule-2',
            name: 'Rule 2',
            description: 'Second rule',
            category: 'code-quality',
            severity: 'error',
            enabled: true,
            validator: validator2,
          };
        }
        return undefined;
      });

      const results = await executor.executeBatch(
        ['rule-1', 'rule-2'],
        { operation: 'write' },
        { parallel: true },
      );

      expect(results).toHaveLength(2);
      expect(validator1).toHaveBeenCalled();
      expect(validator2).toHaveBeenCalled();
    });
  });

  describe('dependency ordering', () => {
    it('should sort rules by dependency order', async () => {
      mockHierarchy.getExecutionOrder = vi.fn().mockReturnValue(['rule-a', 'rule-b']);

      const rules: RuleDefinition[] = [
        {
          id: 'rule-b',
          name: 'Rule B',
          description: 'Depends on A',
          category: 'code-quality',
          severity: 'error',
          enabled: true,
          validator: vi.fn().mockResolvedValue({ passed: true, message: 'OK' }),
        },
        {
          id: 'rule-a',
          name: 'Rule A',
          description: 'No dependencies',
          category: 'code-quality',
          severity: 'error',
          enabled: true,
          validator: vi.fn().mockResolvedValue({ passed: true, message: 'OK' }),
        },
      ];

      mockRegistry.getRules = vi.fn().mockReturnValue(rules);

      await executor.execute('write', { operation: 'write', newCode: 'test' });

      expect(mockHierarchy.getExecutionOrder).toHaveBeenCalled();
    });
  });

  describe('timeout handling', () => {
    it('should handle rule timeout', async () => {
      const slowValidator = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const rules: RuleDefinition[] = [
        {
          id: 'slow-rule',
          name: 'Slow Rule',
          description: 'A slow rule',
          category: 'code-quality',
          severity: 'error',
          enabled: true,
          validator: slowValidator,
        },
      ];

      mockRegistry.getRules = vi.fn().mockReturnValue(rules);

      // Increase timeout to allow for the test to complete
      const report = await executor.execute(
        'write',
        { operation: 'write', newCode: 'test' },
        { timeoutMs: 50 } // 50ms timeout
      );

      expect(report.passed).toBe(false);
      expect(report.errors[0]).toContain('timed out');
    });
  });

  describe('severity handling', () => {
    it('should categorize blocking severity as error', async () => {
      const blockingValidator = vi.fn().mockResolvedValue({
        passed: false,
        message: 'Blocking issue',
      });

      const rules: RuleDefinition[] = [
        {
          id: 'blocking-rule',
          name: 'Blocking Rule',
          description: 'A blocking rule',
          category: 'code-quality',
          severity: 'blocking',
          enabled: true,
          validator: blockingValidator,
        },
      ];

      mockRegistry.getRules = vi.fn().mockReturnValue(rules);

      const report = await executor.execute('write', { operation: 'write', newCode: 'test' });

      expect(report.passed).toBe(false);
      expect(report.errors).toHaveLength(1);
    });

    it('should categorize high severity as error', async () => {
      const highValidator = vi.fn().mockResolvedValue({
        passed: false,
        message: 'High severity issue',
      });

      const rules: RuleDefinition[] = [
        {
          id: 'high-rule',
          name: 'High Rule',
          description: 'A high severity rule',
          category: 'code-quality',
          severity: 'high',
          enabled: true,
          validator: highValidator,
        },
      ];

      mockRegistry.getRules = vi.fn().mockReturnValue(rules);

      const report = await executor.execute('write', { operation: 'write', newCode: 'test' });

      expect(report.passed).toBe(false);
      expect(report.errors).toHaveLength(1);
    });
  });
});
