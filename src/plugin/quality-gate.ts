/**
 * Lightweight Quality Gate System
 *
 * Bridges plugin-level quality gates with enforcement validators.
 * Does NOT require framework boot - uses validators directly.
 *
 * @version 1.0.0
 */

import * as fs from "fs";
import * as path from "path";

export interface QualityGateContext {
  tool: string;
  args?: {
    content?: string;
    filePath?: string;
    command?: string;
  } | undefined;
}

export interface QualityGateResult {
  passed: boolean;
  violations: string[];
  checks: Array<{
    id: string;
    passed: boolean;
    message?: string;
  }>;
}

/**
 * Lightweight quality gate runner
 * Uses simple file checks without requiring framework boot
 */
export async function runQualityGate(
  context: QualityGateContext,
): Promise<QualityGateResult> {
  const result: QualityGateResult = {
    passed: true,
    violations: [],
    checks: [],
  };

  const { tool, args } = context;

  // Check 1: Tests Required
  const testsCheck = await checkTestsRequired(tool, args?.filePath);
  result.checks.push(testsCheck);
  if (!testsCheck.passed) {
    result.violations.push(testsCheck.message!);
  }

  // Check 2: Documentation Required
  const docsCheck = checkDocumentationRequired(tool, args?.filePath);
  result.checks.push(docsCheck);
  if (!docsCheck.passed) {
    result.violations.push(docsCheck.message!);
  }

  // Check 3: Debug Patterns
  const debugCheck = checkDebugPatterns(args?.content);
  result.checks.push(debugCheck);
  if (!debugCheck.passed) {
    result.violations.push(debugCheck.message!);
  }

  result.passed = result.violations.length === 0;
  return result;
}

/**
 * Check if tests are required for the file
 */
async function checkTestsRequired(
  tool: string,
  filePath?: string,
): Promise<{ id: string; passed: boolean; message?: string }> {
  const check = { id: "tests-required", passed: true };

  if (tool !== "write" || !filePath) {
    return check;
  }

  // Only check TypeScript source files
  if (
    !filePath.endsWith(".ts") ||
    filePath.includes(".test.") ||
    filePath.includes(".spec.") ||
    filePath.includes("__tests__")
  ) {
    return check;
  }

  const testPath = filePath.replace(".ts", ".test.ts");
  const specPath = filePath.replace(".ts", ".spec.ts");

  // Check if either test file exists
  const testExists = fs.existsSync(testPath);
  const specExists = fs.existsSync(specPath);

  if (!testExists && !specExists) {
    return {
      ...check,
      passed: false,
      message: `tests-required: No test file found for ${filePath} (expected ${testPath} or ${specPath})`,
    };
  }

  return check;
}

/**
 * Check if documentation exists for new features
 */
function checkDocumentationRequired(
  tool: string,
  filePath?: string,
): { id: string; passed: boolean; message?: string } {
  const check = { id: "documentation-required", passed: true };

  if (tool !== "write" || !filePath?.includes("src/")) {
    return check;
  }

  const cwd = process.cwd();
  const docsDir = path.join(cwd, "docs");
  const readmePath = path.join(cwd, "README.md");

  // Allow if either docs dir or README exists
  if (fs.existsSync(docsDir) || fs.existsSync(readmePath)) {
    return check;
  }

  return {
    ...check,
    passed: false,
    message: "documentation-required: No documentation found (docs/ directory or README.md)",
  };
}

/**
 * Check for debug/error patterns in code
 */
function checkDebugPatterns(content?: string): {
  id: string;
  passed: boolean;
  message?: string;
} {
  const check = { id: "resolve-all-errors", passed: true };

  if (!content) {
    return check;
  }

  // Patterns to check (same as original)
  const patterns = [
    { regex: /console\.log\s*\(/g, name: "console.log" },
    { regex: /TODO\s*:/gi, name: "TODO" },
    { regex: /FIXME\s*:/gi, name: "FIXME" },
    { regex: /throw\s+new\s+Error\s*\(\s*['"]test['"]\s*\)/gi, name: "test error" },
  ];

  for (const { regex, name } of patterns) {
    if (regex.test(content)) {
      return {
        ...check,
        passed: false,
        message: `resolve-all-errors: Found ${name} pattern in code`,
      };
    }
  }

  return check;
}

/**
 * Run quality gate with detailed logging
 */
export async function runQualityGateWithLogging(
  context: QualityGateContext,
  logger: { log: (msg: string) => void; error: (msg: string) => void },
): Promise<QualityGateResult> {
  logger.log("🔍 Running quality gate checks...");

  const result = await runQualityGate(context);

  // Log individual checks
  for (const check of result.checks) {
    if (check.passed) {
      logger.log(`  ✅ ${check.id}`);
    } else {
      logger.error(`  ❌ ${check.id}: ${check.message}`);
    }
  }

  if (result.passed) {
    logger.log("✅ Quality Gate PASSED");
  } else {
    logger.error(
      `🚫 Quality Gate FAILED with ${result.violations.length} violation(s)`,
    );
  }

  return result;
}
