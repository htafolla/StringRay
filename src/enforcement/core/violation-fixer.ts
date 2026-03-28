/**
 * Violation Fixer - Handle violation fixes via agent delegation
 *
 * This class maps rule violations to appropriate agents/skills and attempts
 * automatic fixes. It serves as the central governance point for all
 * violation remediation in the StringRay framework.
 *
 * Phase 5 refactoring: Extracted from RuleEnforcer.
 *
 * @module enforcement/core
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * const fixer = new ViolationFixer();
 * 
 * // Register a custom fix strategy
 * fixer.registerFixStrategy('my-rule', {
 *   agent: 'refactorer',
 *   skill: 'code-review',
 *   tool: 'analyze_code_quality',
 *   priority: 1
 * });
 *
 * // Fix violations
 * const fixes = await fixer.fixViolations(violations, context);
 * ```
 */

import { frameworkLogger } from '../../core/framework-logger.js';
import {
  IViolationFixer,
  Violation,
  ViolationFix,
  FixStrategy,
  RuleValidationContext,
} from '../types.js';

/**
 * ViolationFixer handles violation fixes by delegating to appropriate agents/skills.
 *
 * Key responsibilities:
 * - Map violations to agents/skills
 * - Attempt automatic fixes via MCP skill invocation
 * - Track fix success/failure
 * - Handle fix strategies
 *
 * This is the central governance point for all codex compliance actions.
 */
export class ViolationFixer implements IViolationFixer {
  /** Map of rule IDs to their fix strategies */
  private fixStrategies: Map<string, FixStrategy> = new Map();

  /** Default tool mapping for skills */
  private toolMappings: Map<string, string> = new Map([
    ['code-review', 'analyze_code_quality'],
    ['security-audit', 'scan_vulnerabilities'],
    ['performance-optimization', 'analyze_performance'],
    ['testing-strategy', 'analyze_test_coverage'],
    ['project-analysis', 'analyze-project-health'],
    ['refactoring-strategies', 'suggest_refactorings'],
    ['architecture-patterns', 'validate_architecture'],
    ['git-workflow', 'analyze_git_history'],
  ]);

  constructor() {
    this.initializeFixStrategies();
  }

  /**
   * Attempt to fix violations by delegating to appropriate agents/skills.
   *
   * For each violation:
   * - Finds the appropriate agent/skill mapping
   * - Invokes the skill via MCP
   * - Tracks the result
   *
   * @param violations - Array of violations to fix
   * @param context - Validation context with code and operation info
   * @returns Array of fix attempts with results
   *
   * @example
   * ```typescript
   * const violations = [{ rule: 'no-duplicate-code', message: 'Duplicate detected' }];
   * const fixes = await fixer.fixViolations(violations, context);
   * console.log(fixes[0].success); // true if fix succeeded
   * ```
   */
  async fixViolations(
    violations: Violation[],
    context: RuleValidationContext,
  ): Promise<ViolationFix[]> {
    const fixes: ViolationFix[] = [];

    for (const violation of violations) {
      try {
        await frameworkLogger.log(
          'violation-fixer',
          'attempting-fix',
          'info',
          {
            rule: violation.rule,
            message: violation.message,
          },
        );

        const strategy = this.getFixStrategy(violation.rule);
        if (!strategy) {
          await frameworkLogger.log(
            'violation-fixer',
            'no-strategy-found',
            'error',
            {
              rule: violation.rule,
              message: `No fix strategy found for rule: ${violation.rule}`,
            },
          );
          fixes.push({
            ruleId: violation.rule,
            agent: '',
            skill: '',
            context,
            attempted: false,
            error: 'No agent/skill mapping found',
          });
          continue;
        }

        const { agent, skill, tool } = strategy;

        // Import MCP client manager dynamically to avoid circular dependencies
        const { mcpClientManager } = await import('../../mcps/mcp-client.js');
        
        const result = await mcpClientManager.callServerTool(
          'skill-invocation',
          'invoke-skill',
          {
            skillName: skill,
            toolName: tool,
            args: {
              code: context.files || [],
              language: 'typescript',
              context: {
                rule: violation.rule,
                message: violation.message,
                files: context.files,
                newCode: context.newCode,
              },
            },
          },
        );

        await frameworkLogger.log(
          'violation-fixer',
          'fix-attempted',
          'success',
          {
            rule: violation.rule,
            agent,
            skill,
            message: `Agent ${agent} attempted fix for rule: ${violation.rule}`,
          },
        );

        fixes.push({
          ruleId: violation.rule,
          agent,
          skill,
          context,
          attempted: true,
          success: true,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        await frameworkLogger.log(
          'violation-fixer',
          'fix-failed',
          'error',
          {
            rule: violation.rule,
            error: errorMessage,
            message: `Failed to fix rule ${violation.rule}: ${errorMessage}`,
          },
        );

        fixes.push({
          ruleId: violation.rule,
          agent: this.getFixStrategy(violation.rule)?.agent || '',
          skill: this.getFixStrategy(violation.rule)?.skill || '',
          context,
          attempted: true,
          success: false,
          error: errorMessage,
        });
      }
    }

    return fixes;
  }

  /**
   * Register a custom fix strategy for a rule.
   *
   * @param ruleId - The rule ID to register the strategy for
   * @param strategy - The fix strategy configuration
   *
   * @example
   * ```typescript
   * fixer.registerFixStrategy('custom-rule', {
   *   agent: 'refactorer',
   *   skill: 'code-review',
   *   tool: 'analyze_code_quality',
   *   priority: 1
   * });
   * ```
   */
  registerFixStrategy(ruleId: string, strategy: FixStrategy): void {
    this.fixStrategies.set(ruleId, strategy);
  }

  /**
   * Get the fix strategy for a rule.
   *
   * @param ruleId - The rule ID to get the strategy for
   * @returns The fix strategy or undefined if not found
   */
  getFixStrategy(ruleId: string): FixStrategy | undefined {
    return this.fixStrategies.get(ruleId);
  }

  /**
   * Get the appropriate tool name for a skill.
   * Uses internal tool mappings or defaults to analyze_code_quality.
   *
   * @param skill - The skill name
   * @returns The tool name to use
   */
  private getToolForSkill(skill: string): string {
    return this.toolMappings.get(skill) || 'analyze_code_quality';
  }

  /**
   * Initialize default fix strategies for all known rules.
   * This maps rule IDs to their corresponding agents/skills.
   *
   * Central governance mapping for all codex compliance actions.
   */
  private initializeFixStrategies(): void {
    const strategies: Record<string, FixStrategy> = {
      // Code quality rules
      'no-duplicate-code': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'clean-debug-logs': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'console-log-usage': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'documentation-required': {
        agent: 'researcher',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 2,
      },

      // Architecture rules
      'no-over-engineering': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'state-management-patterns': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'import-consistency': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'dependency-management': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'src-dist-integrity': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'single-responsibility': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },

      // Security rules
      'input-validation': {
        agent: 'testing-lead',
        skill: 'testing-strategy',
        tool: 'analyze_test_coverage',
        priority: 1,
      },
      'security-by-design': {
        agent: 'security-auditor',
        skill: 'security-audit',
        tool: 'scan_vulnerabilities',
        priority: 1,
      },

      // Bug triage rules
      'resolve-all-errors': {
        agent: 'bug-triage-specialist',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'prevent-infinite-loops': {
        agent: 'bug-triage-specialist',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'error-resolution': {
        agent: 'bug-triage-specialist',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'loop-safety': {
        agent: 'bug-triage-specialist',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },

      // Testing rules
      'tests-required': {
        agent: 'testing-lead',
        skill: 'testing-strategy',
        tool: 'analyze_test_coverage',
        priority: 1,
      },
      'test-coverage': {
        agent: 'testing-lead',
        skill: 'testing-strategy',
        tool: 'analyze_test_coverage',
        priority: 1,
      },
      'continuous-integration': {
        agent: 'testing-lead',
        skill: 'testing-strategy',
        tool: 'analyze_test_coverage',
        priority: 1,
      },
      'test-failure-reporting': {
        agent: 'testing-lead',
        skill: 'testing-strategy',
        tool: 'analyze_test_coverage',
        priority: 1,
      },
      'deployment-safety': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },

      // Refactoring rules
      'dry-dont-repeat-yourself': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'immutability-where-possible': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'small-focused-functions': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'consistent-code-style': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'async-await-over-callbacks': {
        agent: 'refactorer',
        skill: 'refactoring-strategies',
        tool: 'suggest_refactorings',
        priority: 1,
      },
      'performance-budget-enforcement': {
        agent: 'refactorer',
        skill: 'performance-optimization',
        tool: 'analyze_performance',
        priority: 1,
      },

      // Additional codex terms (44-59)
      'type-safety-first': {
        agent: 'enforcer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'progressive-prod-ready-code': {
        agent: 'code-reviewer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'no-patches-stubs-bridge-code': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'fit-for-purpose-and-prod-level-code': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'surgical-fixes-where-needed': {
        agent: 'bug-triage-specialist',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'batched-introspection-cycles': {
        agent: 'researcher',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'use-shared-global-state': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'single-source-of-truth': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'early-returns-guard-clauses': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'error-boundaries-graceful-degradation': {
        agent: 'bug-triage-specialist',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'separation-of-concerns': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'yagni-you-arent-gonna-need-it': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'meaningful-naming': {
        agent: 'code-reviewer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'dependency-injection': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'interface-segregation': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'open-closed-principle': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'single-responsibility-principle': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'code-rot-prevention': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'fast-feedback-loops': {
        agent: 'testing-lead',
        skill: 'testing-strategy',
        tool: 'analyze_test_coverage',
        priority: 1,
      },
      'accessibility-first': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'proper-error-handling': {
        agent: 'bug-triage-specialist',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'logging-and-monitoring': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'documentation-updates': {
        agent: 'researcher',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'version-control-best-practices': {
        agent: 'researcher',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'configuration-management': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'functionality-retention': {
        agent: 'testing-lead',
        skill: 'testing-strategy',
        tool: 'analyze_test_coverage',
        priority: 1,
      },
      'gradual-refactoring': {
        agent: 'refactorer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'modular-design': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'code-review-standards': {
        agent: 'code-reviewer',
        skill: 'code-review',
        tool: 'analyze_code_quality',
        priority: 1,
      },
      'infrastructure-as-code-validation': {
        agent: 'architect',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'test-execution-optimization': {
        agent: 'testing-lead',
        skill: 'testing-strategy',
        tool: 'analyze_test_coverage',
        priority: 1,
      },

      // Additional codex terms 44-59
      'system-integrity-cross-check': {
        agent: 'researcher',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'integration-testing-mandate': {
        agent: 'testing-lead',
        skill: 'testing-strategy',
        tool: 'analyze_test_coverage',
        priority: 1,
      },
      'path-resolution-abstraction': {
        agent: 'refactorer',
        skill: 'refactoring-strategies',
        tool: 'suggest_refactorings',
        priority: 1,
      },
      'feature-completeness-validation': {
        agent: 'architect',
        skill: 'architecture-patterns',
        tool: 'validate_architecture',
        priority: 1,
      },
      'architecture-review-requirements': {
        agent: 'architect',
        skill: 'architecture-patterns',
        tool: 'validate_architecture',
        priority: 1,
      },
      'self-evolution-safety-framework': {
        agent: 'architect',
        skill: 'architecture-patterns',
        tool: 'validate_architecture',
        priority: 1,
      },
      'ci-cd-pipeline-enforcement': {
        agent: 'testing-lead',
        skill: 'testing-strategy',
        tool: 'analyze_test_coverage',
        priority: 1,
      },
      'npm-package-publishing-compliance': {
        agent: 'researcher',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'version-bumping-restrictions': {
        agent: 'researcher',
        skill: 'git-workflow',
        tool: 'analyze_git_history',
        priority: 1,
      },
      'framework-command-orchestration': {
        agent: 'orchestrator',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
      'universal-librarian-consultation': {
        agent: 'researcher',
        skill: 'project-analysis',
        tool: 'analyze-project-health',
        priority: 1,
      },
    };

    // Register all strategies
    Object.entries(strategies).forEach(([ruleId, strategy]) => {
      this.fixStrategies.set(ruleId, strategy);
    });
  }
}
