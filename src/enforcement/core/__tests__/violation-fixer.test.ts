/**
 * ViolationFixer Tests
 *
 * Tests for the ViolationFixer class that handles violation fixes
 * via agent delegation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ViolationFixer } from '../violation-fixer.js';
import { Violation, RuleValidationContext } from '../../types.js';

// Mock the framework logger
vi.mock('../../../core/framework-logger.js', () => ({
  frameworkLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock the MCP client
vi.mock('../../../mcps/mcp-client.js', () => ({
  mcpClientManager: {
    callServerTool: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('ViolationFixer', () => {
  let fixer: ViolationFixer;
  let context: RuleValidationContext;

  beforeEach(() => {
    fixer = new ViolationFixer();
    context = {
      operation: 'write',
      files: ['src/index.ts'],
      newCode: 'console.log("test");',
    };
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default fix strategies', () => {
      const strategy = fixer.getFixStrategy('no-duplicate-code');
      expect(strategy).toBeDefined();
      expect(strategy?.agent).toBe('refactorer');
      expect(strategy?.skill).toBe('code-review');
    });

    it('should have strategies for all major codex rules', () => {
      const importantRules = [
        'no-duplicate-code',
        'tests-required',
        'security-by-design',
        'resolve-all-errors',
        'no-over-engineering',
        'state-management-patterns',
      ];

      importantRules.forEach(ruleId => {
        const strategy = fixer.getFixStrategy(ruleId);
        expect(strategy).toBeDefined();
        expect(strategy?.agent).toBeDefined();
        expect(strategy?.skill).toBeDefined();
      });
    });
  });

  describe('registerFixStrategy', () => {
    it('should register a new fix strategy', () => {
      const customStrategy = {
        agent: 'custom-agent',
        skill: 'custom-skill',
        tool: 'custom-tool',
        priority: 5,
      };

      fixer.registerFixStrategy('custom-rule', customStrategy);

      const strategy = fixer.getFixStrategy('custom-rule');
      expect(strategy).toEqual(customStrategy);
    });

    it('should override existing strategy', () => {
      fixer.registerFixStrategy('no-duplicate-code', {
        agent: 'custom',
        skill: 'custom',
        tool: 'custom-tool',
        priority: 1,
      });

      const strategy = fixer.getFixStrategy('no-duplicate-code');
      expect(strategy?.agent).toBe('custom');
    });
  });

  describe('getFixStrategy', () => {
    it('should return undefined for unknown rule', () => {
      const strategy = fixer.getFixStrategy('unknown-rule');
      expect(strategy).toBeUndefined();
    });

    it('should return strategy for known rule', () => {
      const strategy = fixer.getFixStrategy('tests-required');
      expect(strategy).toBeDefined();
      expect(strategy?.agent).toBe('testing-lead');
    });
  });

  describe('fixViolations', () => {
    it('should return empty array for empty violations', async () => {
      const fixes = await fixer.fixViolations([], context);
      expect(fixes).toEqual([]);
    });

    it('should fix a single violation', async () => {
      const violations: Violation[] = [
        { rule: 'no-duplicate-code', message: 'Duplicate code detected' },
      ];

      const fixes = await fixer.fixViolations(violations, context);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].ruleId).toBe('no-duplicate-code');
      expect(fixes[0].attempted).toBe(true);
      expect(fixes[0].success).toBe(true);
    });

    it('should fix multiple violations', async () => {
      const violations: Violation[] = [
        { rule: 'no-duplicate-code', message: 'Duplicate code detected' },
        { rule: 'tests-required', message: 'Tests missing' },
      ];

      const fixes = await fixer.fixViolations(violations, context);

      expect(fixes).toHaveLength(2);
      expect(fixes[0].attempted).toBe(true);
      expect(fixes[1].attempted).toBe(true);
    });

    it('should mark fix as not attempted when no strategy found', async () => {
      const violations: Violation[] = [
        { rule: 'unknown-rule', message: 'Unknown violation' },
      ];

      const fixes = await fixer.fixViolations(violations, context);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].ruleId).toBe('unknown-rule');
      expect(fixes[0].attempted).toBe(false);
      expect(fixes[0].error).toBe('No agent/skill mapping found');
    });

    it('should include violation suggestions in fix context', async () => {
      const violations: Violation[] = [
        {
          rule: 'no-duplicate-code',
          message: 'Duplicate code detected',
          suggestions: ['Extract to shared utility'],
        },
      ];

      const fixes = await fixer.fixViolations(violations, context);

      expect(fixes[0].context).toBe(context);
    });

    it('should track agent and skill used for each fix', async () => {
      const violations: Violation[] = [
        { rule: 'no-duplicate-code', message: 'Duplicate code' },
        { rule: 'security-by-design', message: 'Security issue' },
      ];

      const fixes = await fixer.fixViolations(violations, context);

      expect(fixes[0].agent).toBe('refactorer');
      expect(fixes[0].skill).toBe('code-review');
      expect(fixes[1].agent).toBe('security-auditor');
      expect(fixes[1].skill).toBe('security-audit');
    });

    it('should handle fix failures gracefully', async () => {
      const { mcpClientManager } = await import('../../../mcps/mcp-client.js');
      vi.mocked(mcpClientManager.callServerTool).mockRejectedValueOnce(
        new Error('MCP server error'),
      );

      const violations: Violation[] = [
        { rule: 'no-duplicate-code', message: 'Duplicate code detected' },
      ];

      const fixes = await fixer.fixViolations(violations, context);

      expect(fixes).toHaveLength(1);
      expect(fixes[0].attempted).toBe(true);
      expect(fixes[0].success).toBe(false);
      expect(fixes[0].error).toBe('MCP server error');
    });

    it('should handle violations with different severity levels', async () => {
      const violations: Violation[] = [
        { rule: 'tests-required', message: 'Tests missing', severity: 'error' },
        { rule: 'no-over-engineering', message: 'Too complex', severity: 'warning' },
      ];

      const fixes = await fixer.fixViolations(violations, context);

      expect(fixes).toHaveLength(2);
      fixes.forEach(fix => {
        expect(fix.attempted).toBe(true);
        expect(fix.success).toBe(true);
      });
    });
  });

  describe('strategy mapping', () => {
    it('should map code quality rules to refactorer agent', () => {
      const codeQualityRules = [
        'no-duplicate-code',
        'clean-debug-logs',
        'console-log-usage',
        'import-consistency',
      ];

      codeQualityRules.forEach(ruleId => {
        const strategy = fixer.getFixStrategy(ruleId);
        expect(strategy?.agent).toBe('refactorer');
      });
    });

    it('should map testing rules to testing-lead agent', () => {
      const testingRules = [
        'tests-required',
        'test-coverage',
        'continuous-integration',
      ];

      testingRules.forEach(ruleId => {
        const strategy = fixer.getFixStrategy(ruleId);
        expect(strategy?.agent).toBe('testing-lead');
      });
    });

    it('should map security rules to security-auditor agent', () => {
      const strategy = fixer.getFixStrategy('security-by-design');
      expect(strategy?.agent).toBe('security-auditor');
    });

    it('should map bug triage rules to bug-triage-specialist agent', () => {
      const bugTriageRules = [
        'resolve-all-errors',
        'prevent-infinite-loops',
      ];

      bugTriageRules.forEach(ruleId => {
        const strategy = fixer.getFixStrategy(ruleId);
        expect(strategy?.agent).toBe('bug-triage-specialist');
      });
    });

    it('should map architecture rules to architect agent', () => {
      const architectureRules = [
        'no-over-engineering',
        'state-management-patterns',
        'dependency-management',
      ];

      architectureRules.forEach(ruleId => {
        const strategy = fixer.getFixStrategy(ruleId);
        expect(strategy?.agent).toBe('architect');
      });
    });
  });
});
