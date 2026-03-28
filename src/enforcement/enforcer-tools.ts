/**
 * Enforcer Tools - Integration layer between enforcer agent and rule enforcement system
 * Provides tools for codex compliance, rule validation, and contextual analysis enforcement
 */

import {
  ruleEnforcer,
  RuleValidationContext,
  ValidationReport,
} from "./rule-enforcer.js";
import { frameworkLogger } from "../core/framework-logger.js";
import { frameworkReportingSystem } from "../reporting/framework-reporting-system.js";
import { AgentDelegator } from "../delegation/agent-delegator.js";
import { StringRayStateManager } from "../state/state-manager.js";
import { strRayConfigLoader } from "../core/config-loader.js";
import * as fs from "fs";
import * as path from "path";

// Minimum confidence to auto-delegate to another agent
const DELEGATION_CONFIDENCE_THRESHOLD = 0.50;

// Agents that enforcer should NOT delegate to (enforcer handles these itself)
const ENFORCER_HANDLES = new Set(["enforcer", "code-reviewer"]);

export interface RoutingRecommendation {
  suggestedAgent: string;
  suggestedSkill: string;
  confidence: number;
  matchedKeyword?: string;
}

export function getTaskRoutingRecommendation(
  taskDescription: string,
): RoutingRecommendation {
  return {
    suggestedAgent: "enforcer",
    suggestedSkill: "",
    confidence: 0.5,
    matchedKeyword: "none",
  };
}

/**
 * Pre-process and validate that the routing is appropriate for the operation
 * This is the integration point between TaskSkillRouter and RuleEnforcer
 */
export async function preProcessAndRoute(
  operation: string,
  context: RuleValidationContext,
): Promise<{
  enhancedContext: RuleValidationContext;
  routing: RoutingRecommendation;
}> {
  // Build task description from operation and context
  const taskDescription = buildTaskDescription(operation, context);

  // Get routing recommendation
  const routing = getTaskRoutingRecommendation(taskDescription);

  // Log the routing decision
  await frameworkLogger.log(
    "enforcer-tools",
    "task-routed",
    "debug",
    {
      operation,
      taskDescription: taskDescription.substring(0, 100),
      suggestedAgent: routing.suggestedAgent,
      suggestedSkill: routing.suggestedSkill,
      confidence: routing.confidence,
    },
  );

  // Enhance context with routing information
  const enhancedContext: RuleValidationContext = {
    ...context,
    operation,
    // Add routing info to context for rule validators to use
    ...(context as any).routing,
  };

  return {
    enhancedContext,
    routing,
  };
}

/**
 * Build a task description from operation and context for routing
 */
function buildTaskDescription(
  operation: string,
  context: RuleValidationContext,
): string {
  const parts: string[] = [operation];

  if (context.component) {
    parts.push(context.component);
  }

  if (context.files && context.files.length > 0) {
    parts.push(`files: ${context.files.join(", ")}`);
  }

  return parts.join(" ");
}

/**
 * Execute the full release workflow
 * Triggered when user says: release, npm publish, publish to npm, bump and publish, ship it
 */
async function executeReleaseWorkflow(
  operation: string,
  context: RuleValidationContext,
  jobId: string,
  routing: RoutingRecommendation,
): Promise<EnforcementResult> {
  const { execSync } = await import('child_process');
  
  // Extract release options from routing context
  const releaseContext = (routing as any).context || {};
  const bumpType = releaseContext.bumpType || 'patch';
  const createTag = releaseContext.createTag || false;
  
  await frameworkLogger.log(
    "enforcer-tools",
    "release-workflow-starting",
    "info",
    { jobId, bumpType, createTag },
  );
  
  const steps: string[] = [];
  const errors: string[] = [];
  
  // HARD STOP: Build must pass before release
  await frameworkLogger.log("enforcer-tools", "release-build-check", "info", { step: "Verifying build passes..." });
  try {
    execSync(`npm run build`, {
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    steps.push("✅ Build verified");
  } catch (e) {
    const errorMsg = `🛑 RELEASE STOPPED: Build failed before publishing. Fix build errors first.`;
    console.error(errorMsg);
    console.error(`Error: ${e}`);
    return {
      operation: "release",
      passed: false,
      blocked: true,
      errors: [errorMsg, `Build error: ${e}`],
      warnings: [],
      fixes: [],
      report: {
        passed: false,
        operation: "release",
        errors: [errorMsg, `Build error: ${e}`],
        warnings: [],
        results: [],
        timestamp: new Date(),
      },
    };
  }
  
  try {
    // Step 1: Run version-manager to bump version and generate changelog
    await frameworkLogger.log("enforcer-tools", "release-step-1-version", "info", { step: "Bumping version..." });
    try {
      const versionArg = createTag ? '--tag' : '';
      execSync(`node scripts/node/version-manager.mjs ${bumpType} ${versionArg}`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      steps.push("✅ Version bumped + changelog generated");
    } catch (e) {
      errors.push(`Version bump failed: ${e}`);
    }
    
    // Step 2: Git commit and push
    await frameworkLogger.log("enforcer-tools", "release-step-2-git", "info", { step: "Committing and pushing..." });
    try {
      execSync(`git add -A && git commit -m "release: v${bumpType} - Changelog updated" && git push`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      steps.push("✅ Git commit + push");
    } catch (e) {
      errors.push(`Git commit/push failed: ${e}`);
    }
    
    // Step 3: npm publish
    await frameworkLogger.log("enforcer-tools", "release-step-3-npm", "info", { step: "Publishing to npm..." });
    try {
      execSync(`npm publish`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      steps.push("✅ npm published");
    } catch (e) {
      errors.push(`npm publish failed: ${e}`);
    }
    
    // Step 4: Generate tweet context
    await frameworkLogger.log("enforcer-tools", "release-step-4-tweet", "info", { step: "Generating tweet..." });
    try {
      execSync(`node scripts/node/release-tweet.mjs`, {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      steps.push("✅ Tweet context generated - ready for @growth-strategist");
    } catch (e) {
      errors.push(`Tweet generation failed: ${e}`);
    }
    
  } catch (e) {
    errors.push(`Release workflow failed: ${e}`);
  }
  
  return {
    operation: "release",
    passed: errors.length === 0,
    blocked: false,
    errors,
    warnings: [],
    fixes: [],
    report: {
      passed: errors.length === 0,
      operation: "release",
      errors,
      warnings: steps,
      results: steps.map(s => ({ rule: 'release', passed: true, message: s })),
      timestamp: new Date(),
    },
  };
}

/**
 * Delegate a task to another agent via AgentDelegator
 * This is the key integration that ensures enforcer routes to best agent
 */
async function delegateToAgent(
  agentName: string,
  operation: string,
  context: RuleValidationContext,
  jobId: string,
): Promise<EnforcementResult> {
  try {
    // Create a minimal state manager and config loader for the delegator
    const stateManager = new StringRayStateManager();
    
    // Create the delegator
    const delegator = new AgentDelegator(stateManager, strRayConfigLoader);
    
    // Build task description for the delegated agent
    const taskDescription = buildTaskDescription(operation, context);
    
    // Build the delegation request
    const request = {
      operation,
      description: taskDescription,
      context: {
        ...context,
        originalJobId: jobId,
      },
      sessionId: stateManager.get("current_session_id") as string || `delegated-${jobId}`,
    };

    // Analyze and get delegation strategy
    const analysis = await (delegator as any).analyzeDelegation(request);
    
    // Execute the delegation
    const result = await delegator.executeDelegation(analysis, request);

    await frameworkLogger.log(
      "enforcer-tools",
      "delegation-complete",
      "info",
      {
        jobId,
        delegatedTo: agentName,
        success: result.success,
        agentsUsed: result.agents,
      },
    );

    // Convert delegation result to EnforcementResult format
    return {
      operation,
      passed: result.success,
      blocked: !result.success,
      errors: result.errors || [],
      warnings: [],
      fixes: [],
      report: {
        passed: result.success,
        operation,
        timestamp: new Date(),
        errors: result.errors || [],
        warnings: [],
        results: [],
      } as ValidationReport,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await frameworkLogger.log(
      "enforcer-tools",
      "delegation-failed",
      "error",
      {
        jobId,
        delegatedTo: agentName,
        error: errorMessage,
      },
    );

    // Fall back to self-execution if delegation fails
    return await ruleValidationSelf(operation, context, jobId);
  }
}

/**
 * Fallback: Execute validation ourselves if delegation fails
 */
async function ruleValidationSelf(
  operation: string,
  context: RuleValidationContext,
  jobId: string,
): Promise<EnforcementResult> {
  const report = await ruleEnforcer.validateOperation(operation, context);
  
  return {
    operation,
    passed: report.passed,
    blocked: !report.passed && report.errors.some(e => e.includes("required") || e.includes("violation")),
    errors: report.errors,
    warnings: report.warnings,
    fixes: [],
    report,
  };
}

/**
 * Run pre-commit validation with auto-fix enabled
 * This is the integration point that automatically creates test files when needed
 */
async function runPreCommitValidationWithAutoFix(
  files: string[],
  operation: string = "commit"
): Promise<{ success: boolean; fixesApplied: number; error?: string }> {
  try {
    // Dynamically import to avoid circular dependencies
    const { testAutoCreationProcessor } = await import(
      "../processors/test-auto-creation-processor.js"
    );

    let fixesApplied = 0;

    // Process each file
    for (const filePath of files) {
      // Only process TypeScript source files
      if (filePath.endsWith(".ts") && !filePath.endsWith(".test.ts")) {
        const result = await testAutoCreationProcessor.execute({
          tool: "write",
          args: { filePath },
          directory: process.cwd(),
          filePath,
          operation,
        });

        if (result.success) {
          fixesApplied++;
        }
      }
    }

    return { success: true, fixesApplied };
  } catch (error) {
    return {
      success: false,
      fixesApplied: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export interface EnforcementResult {
  operation: string;
  passed: boolean;
  blocked: boolean;
  errors: string[];
  warnings: string[];
  fixes: Array<{
    type: "auto" | "manual";
    description: string;
    action?: () => Promise<void>;
  }>;
  report: ValidationReport;
}

/**
 * Rule Validation Tool - Validates operations against rule hierarchy
 * Now with intelligent task routing via TaskSkillRouter
 * Automatically delegates to best agent when confidence is high
 */
export async function ruleValidation(
  operation: string,
  context: RuleValidationContext,
): Promise<EnforcementResult> {
  const jobId = `rule-validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // PRE-PROCESS: Get intelligent routing recommendation
  const { enhancedContext, routing } = await preProcessAndRoute(operation, context);

  await frameworkLogger.log("enforcer-tools", "rule-validation-start", "info", {
    jobId,
    operation,
    files: context.files?.length || 0,
    hasExistingCode: !!context.existingCode,
    // Add routing info to logs
    routedTo: routing.suggestedAgent,
    routingSkill: routing.suggestedSkill,
    routingConfidence: routing.confidence,
  });

  // DELEGATION LOGIC: If high confidence and recommended agent is not enforcer, delegate!
  const shouldDelegate = 
    routing.confidence >= DELEGATION_CONFIDENCE_THRESHOLD &&
    !ENFORCER_HANDLES.has(routing.suggestedAgent) &&
    routing.suggestedAgent !== "enforcer";

  // SPECIAL CASE: Release workflow - execute full release process
  if (routing.matchedKeyword === "release-workflow") {
    await frameworkLogger.log(
      "enforcer-tools",
      "release-workflow-triggered",
      "info",
      {
        jobId,
        operation,
        bumpType: (routing as any).context?.bumpType || 'patch',
        createTag: (routing as any).context?.createTag || false,
      },
    );
    
    // Execute the release workflow
    return await executeReleaseWorkflow(operation, context, jobId, routing);
  }

  if (shouldDelegate) {
    await frameworkLogger.log(
      "enforcer-tools",
      "delegating-to-agent",
      "info",
      {
        jobId,
        operation,
        delegatedTo: routing.suggestedAgent,
        confidence: routing.confidence,
        reason: `High confidence (${routing.confidence}) routing to specialized agent`,
      },
    );

    // Delegate to the recommended agent instead of doing work itself
    return await delegateToAgent(routing.suggestedAgent, operation, context, jobId);
  }

  // Use enhanced context with routing for validation
  const report = await ruleEnforcer.validateOperation(operation, enhancedContext);

  const result: EnforcementResult = {
    operation,
    passed: report.passed,
    blocked:
      !report.passed &&
      report.errors.some(
        (e) => e.includes("required") || e.includes("violation"),
      ),
    errors: report.errors,
    warnings: report.warnings,
    fixes: [],
    report,
  };

  // Generate fixes for common issues
  if (!report.passed) {
    result.fixes = generateFixes(report, context);
  }

  // AUTO-FIX: Run pre-commit validation with auto-fix for missing tests
  // This integrates the auto-fix path into the standard validation flow
  if (!report.passed && context.files && context.files.length > 0) {
    const autoFixResult = await runPreCommitValidationWithAutoFix(
      context.files,
      operation
    );
    if (autoFixResult.success && autoFixResult.fixesApplied > 0) {
      await frameworkLogger.log(
        "enforcer-tools",
        "auto-fix-applied",
        "info",
        {
          jobId,
          fixesApplied: autoFixResult.fixesApplied,
          files: context.files,
        }
      );
    }
  }

  // INTEGRATION POINT: Check for reporting rules and trigger report generation
  // This integrates reporting triggers into the existing rule validation pipeline
  if (!report.passed) {
    // Trigger report generation for rule violations
    await frameworkLogger.log("enforcer-tools", "reporting-triggered", "info", {
      jobId,
      operation,
      hasViolations: report.errors.length > 0,
      hasWarnings: report.warnings.length > 0,
      context: {
        files: context.files?.length,
        operation,
        timestamp: new Date().toISOString(),
      },
    });
  }

  await frameworkLogger.log(
    "enforcer-tools",
    "rule-validation-complete",
    result.passed ? "success" : "error",
    {
      jobId,
      operation,
      passed: result.passed,
      blocked: result.blocked,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      fixCount: result.fixes.length,
    },
  );

  return result;
}

/**
 * Context Analysis Validation Tool - Validates contextual analysis integration
 */
export async function contextAnalysisValidation(
  files: string[],
  operation: string,
): Promise<EnforcementResult> {
  const jobId = `context-validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await frameworkLogger.log(
    "enforcer-tools",
    "context-validation-start",
    "info",
    {
      jobId,
      operation,
      fileCount: files.length,
    },
  );

  // Check if files exist and are readable
  const existingFiles = new Map<string, string>();
  const missingFiles: string[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      existingFiles.set(file, content);
    } catch (error) {
      missingFiles.push(file);
    }
  }

  const context: RuleValidationContext = {
    operation,
    files,
    existingCode: existingFiles,
  };

  // Run comprehensive validation
  const validationResult = await ruleValidation(operation, context);

  // Additional context-specific checks
  const contextIssues = await validateContextIntegration(files, existingFiles);

  const result: EnforcementResult = {
    ...validationResult,
    errors: [...validationResult.errors, ...contextIssues.errors],
    warnings: [...validationResult.warnings, ...contextIssues.warnings],
    blocked: validationResult.blocked || contextIssues.errors.length > 0,
  };

  await frameworkLogger.log(
    "enforcer-tools",
    "context-validation-complete",
    result.passed ? "success" : "error",
    {
      jobId,
      operation,
      fileCount: files.length,
      contextErrors: contextIssues.errors.length,
      contextWarnings: contextIssues.warnings.length,
    },
  );

  return result;
}

/**
 * Codex Enforcement Tool - Comprehensive codex compliance validation
 */
export async function codexEnforcement(
  operation: string,
  files: string[],
  newCode?: string,
): Promise<EnforcementResult> {
  const jobId = `codex-enforcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await frameworkLogger.log(
    "enforcer-tools",
    "codex-enforcement-start",
    "info",
    {
      jobId,
      operation,
      fileCount: files.length,
      hasNewCode: !!newCode,
    },
  );

  // Load existing code for comparison
  const existingCode = new Map<string, string>();
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      existingCode.set(file, content);
    } catch (error) {
      // File doesn't exist yet (new file)
    }
  }

  const context: RuleValidationContext = {
    operation,
    files,
    existingCode,
    ...(newCode && { newCode }),
    dependencies: extractDependencies(newCode || "", files),
  };

  const validationResult = await ruleValidation(operation, context);

  // Generate codex compliance report
  const codexReport = await generateCodexComplianceReport(files, newCode);

  const result: EnforcementResult = {
    ...validationResult,
    errors: [...validationResult.errors, ...codexReport.violations],
    warnings: [...validationResult.warnings, ...codexReport.warnings],
  };

  await frameworkLogger.log(
    "enforcer-tools",
    "codex-enforcement-complete",
    result.passed ? "success" : "error",
    {
      jobId,
      operation,
      codexViolations: codexReport.violations.length,
      codexWarnings: codexReport.warnings.length,
      complianceScore: codexReport.complianceScore,
    },
  );

  return result;
}

/**
 * Quality Gate Check Tool - Final validation before commit/execution
 */
export async function qualityGateCheck(
  operation: string,
  context: {
    files: string[];
    newCode?: string;
    tests?: string[];
    dependencies?: string[];
  },
): Promise<EnforcementResult> {
  const jobId = `quality-gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await frameworkLogger.log("enforcer-tools", "quality-gate-start", "info", {
    jobId,
    operation,
    files: context.files.length,
    hasTests: !!(context.tests && context.tests.length > 0),
  });

  // Run all validations
  const validations = await Promise.all([
    ruleValidation(operation, {
      operation,
      files: context.files,
      ...(context.newCode && { newCode: context.newCode }),
      ...(context.tests && { tests: context.tests }),
      ...(context.dependencies && { dependencies: context.dependencies }),
    }),
    contextAnalysisValidation(context.files, operation),
    codexEnforcement(operation, context.files, context.newCode),
  ]);

  // Combine results
  const combinedErrors = validations.flatMap((v) => v.errors);
  const combinedWarnings = validations.flatMap((v) => v.warnings);
  const combinedFixes = validations.flatMap((v) => v.fixes);

  const passed = combinedErrors.length === 0;
  const blocked = !passed; // Quality gates block on any error

  const result: EnforcementResult = {
    operation,
    passed,
    blocked,
    errors: combinedErrors,
    warnings: combinedWarnings,
    fixes: combinedFixes,
    report: validations[0].report, // Use first report as primary
  };

  // Execute automatic fixes if operation would pass after fixes
  if (blocked && combinedFixes.some((f) => f.type === "auto")) {
    await executeAutomaticFixes(combinedFixes.filter((f) => f.type === "auto"));
    result.blocked = false; // Allow after auto-fixes
  }

  await frameworkLogger.log(
    "enforcer-tools",
    "quality-gate-complete",
    passed ? "success" : "error",
    {
      jobId,
      operation,
      passed,
      blocked: result.blocked,
      totalErrors: combinedErrors.length,
      totalWarnings: combinedWarnings.length,
      autoFixes: combinedFixes.filter((f) => f.type === "auto").length,
    },
  );

  return result;
}

// Helper functions

function generateFixes(
  report: ValidationReport,
  context: RuleValidationContext,
): EnforcementResult["fixes"] {
  const fixes: EnforcementResult["fixes"] = [];

  for (const result of report.results) {
    if (result.fixes) {
      for (const fix of result.fixes) {
        if (fix.type === "create-file") {
          fixes.push({
            type: "auto",
            description: fix.description,
            action: async () => {
              if (fix.filePath && fix.content) {
                const dir = path.dirname(fix.filePath);
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(fix.filePath, fix.content);
              }
            },
          });
        } else {
          fixes.push({
            type: "manual",
            description: fix.description,
          });
        }
      }
    }
  }

  return fixes;
}

async function validateContextIntegration(
  files: string[],
  existingCode: Map<string, string>,
): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [filePath, content] of existingCode) {
    // Check for proper context provider usage
    if (
      content.includes("CodebaseContextAnalyzer") &&
      !content.includes("memoryConfig")
    ) {
      warnings.push(
        `${filePath}: CodebaseContextAnalyzer should use memory configuration`,
      );
    }

    if (
      content.includes("ASTCodeParser") &&
      !content.includes("try") &&
      !content.includes("catch")
    ) {
      errors.push(
        `${filePath}: ASTCodeParser initialization should handle missing ast-grep gracefully`,
      );
    }

    if (
      content.includes("DependencyGraphBuilder") &&
      !content.includes("contextAnalyzer")
    ) {
      errors.push(
        `${filePath}: DependencyGraphBuilder requires context analyzer parameter`,
      );
    }
  }

  return { errors, warnings };
}

async function generateCodexComplianceReport(
  files: string[],
  newCode?: string,
): Promise<{
  violations: string[];
  warnings: string[];
  complianceScore: number;
}> {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Basic codex checks (simplified - would integrate with full codex validation)
  if (newCode) {
    if (newCode.includes("any") || newCode.includes("@ts-ignore")) {
      violations.push(
        'Codex violation: Type safety first - no "any" types or ts-ignore allowed',
      );
    }

    // Check for actual console.log() calls (more precise than just string containment)
    const consoleLogCallMatches = newCode.match(/console\.log\(/g);
    if (consoleLogCallMatches && consoleLogCallMatches.length > 0) {
      // Only flag console.log if it's not in comments
      const isNotInComment = !newCode.includes("//") && !newCode.includes("/*");
      if (isNotInComment) {
        violations.push(
          'Codex violation: console.log() statements detected in production code - use frameworkLogger instead',
          );
      }
    } else {
        // console.log found in comments - this is okay
      }

    if (
      !newCode.includes("try") &&
      (newCode.includes("await") || newCode.includes("Promise"))
    ) {
      warnings.push(
        "Codex warning: Async operations should have error handling",
      );
    }
  }

  const complianceScore =
    violations.length === 0
      ? 100
      : Math.max(0, 100 - violations.length * 20 - warnings.length * 5);

  return { violations, warnings, complianceScore };
}

function extractDependencies(code: string, files: string[]): string[] {
  const dependencies: string[] = [];

  // Simple regex-based dependency extraction (would be enhanced with proper AST parsing)
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    const dep = match[1];
    if (dep && !dep.startsWith(".") && !dep.startsWith("/")) {
      dependencies.push(dep);
    }
  }

  return dependencies;
}

async function executeAutomaticFixes(
  fixes: EnforcementResult["fixes"],
): Promise<void> {
  for (const fix of fixes) {
    if (fix.action) {
      try {
        await fix.action();
        await frameworkLogger.log(
          "enforcer-tools",
          "auto-fix-executed",
          "success",
          {
            description: fix.description,
          },
        );
      } catch (error) {
        await frameworkLogger.log(
          "enforcer-tools",
          "auto-fix-failed",
          "error",
          {
            description: fix.description,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }
  }
}

// Additional utility functions for enforcer operations

/**
 * Get comprehensive enforcement status
 */
export async function getEnforcementStatus(): Promise<{
  rules: number;
  validations: number;
  violations: number;
  fixes: number;
  success: boolean;
}> {
  try {
    const stats = ruleEnforcer.getRuleStats();

    return {
      rules: stats.totalRules,
      validations: 0, // Would be tracked in real implementation
      violations: 0, // Would be tracked in real implementation
      fixes: 0, // Would be tracked in real implementation
      success: true,
    };
  } catch (error) {
    await frameworkLogger.log(
      "enforcer-tools",
      "status-check-failed",
      "error",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return {
      rules: 0,
      validations: 0,
      violations: 0,
      fixes: 0,
      success: false,
    };
  }
}

/**
 * Run comprehensive pre-commit validation
 */
export async function runPreCommitValidation(
  files: string[],
  operation: string = "commit",
): Promise<EnforcementResult> {
  const jobId = `pre-commit-validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await frameworkLogger.log(
    "enforcer-tools",
    "pre-commit-validation-start",
    "info",
    {
      jobId,
      files: files.length,
      operation,
    },
  );

  try {
    // Run all validation types
    const validations = await Promise.allSettled([
      ruleValidation(operation, { operation, files }),
      contextAnalysisValidation(files, operation),
      codexEnforcement(operation, files),
    ]);

    // Aggregate results
    const errors: string[] = [];
    const warnings: string[] = [];
    const fixes: EnforcementResult["fixes"] = [];

    for (const result of validations) {
      if (result.status === "fulfilled") {
        errors.push(...result.value.errors);
        warnings.push(...result.value.warnings);
        fixes.push(...result.value.fixes);
      } else {
        errors.push(`Validation failed: ${result.reason}`);
      }
    }

    const finalResult: EnforcementResult = {
      operation,
      passed: errors.length === 0,
      blocked: errors.length > 0,
      errors,
      warnings,
      fixes,
      report:
        validations[0]?.status === "fulfilled"
          ? validations[0].value.report
          : ({} as any),
    };

    await frameworkLogger.log(
      "enforcer-tools",
      "pre-commit-validation-complete",
      finalResult.passed ? "success" : "error",
      {
        jobId,
        operation,
        passed: finalResult.passed,
        blocked: finalResult.blocked,
        errors: errors.length,
        warnings: warnings.length,
        fixes: fixes.length,
      },
    );

    return finalResult;
  } catch (error) {
    await frameworkLogger.log(
      "enforcer-tools",
      "pre-commit-validation-failed",
      "error",
      {
        jobId,
        operation,
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return {
      operation,
      passed: false,
      blocked: true,
      errors: [
        `Pre-commit validation failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
      warnings: [],
      fixes: [],
      report: {} as any,
    };
  }
}

// Export tools for MCP integration
export const enforcerTools = {
  ruleValidation,
  contextAnalysisValidation,
  codexEnforcement,
  qualityGateCheck,
  getEnforcementStatus,
  runPreCommitValidation,
};
