#!/usr/bin/env node

/**
 * Processor Mock Coverage Validator
 * 
 * Validates that processor tests have proper mocking for all external dependencies.
 * Run this before the test suite to catch missing mocks early.
 * 
 * Usage:
 *   node tests/validators/processor-mock-validator.js
 * 
 * Exit codes:
 *   0 - All processors have proper mocks
 *   1 - Missing mocks detected
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Processors that require mocks
const PROCESSORS_REQUIRING_MOCKS = {
  "TestExecutionProcessor": ["child_process", "fs", "language-detector"],
  "CodexComplianceProcessor": ["rule-enforcer"],
  "VersionComplianceProcessor": ["version-compliance-processor"],
  "RefactoringLoggingProcessor": ["fs"],
  "TestAutoCreationProcessor": ["test-auto-creation-processor"],
  "AgentsMdValidationProcessor": ["agents-md-validation-processor"],
};

function analyzeTestFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const processorName = Object.keys(PROCESSORS_REQUIRING_MOCKS).find(
    (name) => content.includes(`new ${name}()`),
  );

  if (!processorName) return null;

  const hasChildProcess = /vi\.mock\(["']child_process["']/.test(content);
  const hasFS = /vi\.mock\(["']fs["']/.test(content);
  const hasOtherMocks = /vi\.mock\(/.test(content);

  return {
    processor: processorName,
    file: filePath,
    dependencies: PROCESSORS_REQUIRING_MOCKS[processorName],
    hasChildProcess,
    hasFS,
    hasOtherMocks,
  };
}

function validateMockRequirements(testDir) {
  const errors = [];
  const warnings = [];

  // Find all processor test files
  const testFiles = execSync(
    `find "${testDir}" -name "*.test.ts" -path "*/processors/*"`,
    { encoding: "utf-8" },
  )
    .split("\n")
    .filter((f) => f.length > 0);

  for (const file of testFiles) {
    const analysis = analyzeTestFile(file);

    if (!analysis) continue;

    // Check for missing mocks
    const missingMocks = [];

    if (analysis.dependencies.includes("child_process") && !analysis.hasChildProcess) {
      missingMocks.push("child_process");
    }
    if (analysis.dependencies.includes("fs") && !analysis.hasFS) {
      missingMocks.push("fs");
    }

    if (missingMocks.length > 0) {
      errors.push(
        `${path.relative(process.cwd(), file)}: Missing mocks for ${analysis.processor}: ${missingMocks.join(", ")}`,
      );
    }

    // Warnings for incomplete mock coverage
    if (analysis.dependencies.length > 0 && !analysis.hasOtherMocks) {
      warnings.push(
        `${path.relative(process.cwd(), file)}: Processor tests should use vi.mock() for external dependencies`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// Main execution
const testDir = path.resolve(__dirname, "../../src/processors");
const result = validateMockRequirements(testDir);

console.log("\n=== Processor Mock Coverage Validation ===\n");

if (result.warnings.length > 0) {
  console.log("Warnings:");
  result.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  console.log();
}

if (!result.valid) {
  console.log("Errors:");
  result.errors.forEach((e) => console.log(`  ✗ ${e}`));
  console.log("\n❌ Validation failed. Fix missing mocks before running tests.\n");
  process.exit(1);
} else {
  console.log("✅ All processor tests have proper mocks.\n");
  process.exit(0);
}
