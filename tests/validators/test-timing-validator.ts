/**
 * Test Timing Validator
 * 
 * Analyzes test execution times to detect potential missing mocks.
 * Tests that take too long likely have unmocked external dependencies.
 * 
 * Usage:
 *   npx vitest run --reporter=json | npx ts-node tests/validators/test-timing-validator.ts
 */

import * as fs from "fs";

interface TestResult {
  name: string;
  duration: number;
  passed: boolean;
}

interface TimingAnalysis {
  testFile: string;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  slowTests: TestResult[];
}

const MAX_ACCEPTABLE_DURATION_MS = 5000; // 5 seconds per test
const SLOW_TEST_THRESHOLD_MS = 2000; // 2 seconds = "slow"

function parseVitestJsonOutput(jsonPath: string): TestResult[] {
  const content = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(content);
  
  return data.testResults?.flatMap((file: any) =>
    file.assertions?.map((a: any) => ({
      name: a.title.join(" > "),
      duration: a.duration || 0,
      passed: a.status === "passed",
    })) || [],
  ) || [];
}

function analyzeTimings(results: TestResult[]): TimingAnalysis[] {
  const byFile = new Map<string, TestResult[]>();
  
  for (const result of results) {
    const file = result.name.split(" > ")[0]; // First part is usually the file
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file)!.push(result);
  }

  return Array.from(byFile.entries()).map(([file, tests]) => {
    const durations = tests.map((t) => t.duration);
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    
    return {
      testFile: file,
      totalDuration,
      avgDuration: totalDuration / tests.length,
      maxDuration: Math.max(...durations),
      slowTests: tests.filter((t) => t.duration > SLOW_TEST_THRESHOLD_MS),
    };
  });
}

function validateTimings(analyses: TimingAnalysis[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const analysis of analyses) {
    if (analysis.maxDuration > MAX_ACCEPTABLE_DURATION_MS) {
      issues.push(
        `${analysis.testFile}: Maximum test duration (${analysis.maxDuration}ms) exceeds threshold (${MAX_ACCEPTABLE_DURATION_MS}ms)`,
      );
    }

    if (analysis.slowTests.length > 0) {
      issues.push(
        `${analysis.testFile}: ${analysis.slowTests.length} slow tests detected (>${SLOW_TEST_THRESHOLD_MS}ms)`,
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// Main execution
const jsonPath = process.argv[2] || "./vitest-report.json";

try {
  const results = parseVitestJsonOutput(jsonPath);
  const analyses = analyzeTimings(results);
  const validation = validateTimings(analyses);

  console.log("\n=== Test Timing Analysis ===\n");
  
  for (const analysis of analyses) {
    const status = analysis.maxDuration > MAX_ACCEPTABLE_DURATION_MS ? "✗" : "✓";
    console.log(`${status} ${analysis.testFile}`);
    console.log(`  Total: ${analysis.totalDuration}ms | Avg: ${analysis.avgDuration.toFixed(0)}ms | Max: ${analysis.maxDuration}ms`);
    console.log(`  Tests: ${analysis.slowTests.length} slow (>${SLOW_TEST_THRESHOLD_MS}ms)`);
    console.log();
  }

  if (!validation.valid) {
    console.log("Issues detected:");
    validation.issues.forEach((i) => console.log(`  ✗ ${i}`));
    console.log("\n💡 Tip: Slow tests may indicate missing mocks for external dependencies.\n");
    process.exit(1);
  } else {
    console.log("✅ All tests have acceptable execution times.\n");
    process.exit(0);
  }
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === "ENOENT") {
    console.log(`Error: Report file not found: ${jsonPath}`);
    console.log("Run tests with JSON reporter: npx vitest run --reporter=json");
    process.exit(1);
  }
  throw error;
}
