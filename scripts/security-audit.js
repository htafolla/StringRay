#!/usr/bin/env node

/**
 * StrRay Framework Security Audit Runner
 *
 * Runs comprehensive security audit on the framework codebase.
 */

import { securityAuditor } from "../src/security/security-auditor";

async function main() {
  console.log("🔒 StrRay Framework Security Audit");
  console.log("=====================================\n");

  try {
    const result = await securityAuditor.auditProject();

    console.log(`📊 Audit Results:`);
    console.log(`   Files scanned: ${result.totalFiles}`);
    console.log(`   Security score: ${result.score}/100`);
    console.log(`   Issues found: ${result.issues.length}`);
    console.log(`   - Critical: ${result.summary.critical}`);
    console.log(`   - High: ${result.summary.high}`);
    console.log(`   - Medium: ${result.summary.medium}`);
    console.log(`   - Low: ${result.summary.low}`);
    console.log(`   - Info: ${result.summary.info}\n`);

    if (result.issues.length > 0) {
      console.log("🚨 Top Security Issues:");
      const topIssues = result.issues
        .sort((a, b) => {
          const severityOrder = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
            info: 0,
          };
          return severityOrder[b.severity] - severityOrder[a.severity];
        })
        .slice(0, 10);

      for (const issue of topIssues) {
        console.log(
          `   ${issue.severity.toUpperCase()}: ${issue.category} in ${issue.file}${issue.line ? `:${issue.line}` : ""}`,
        );
        console.log(`      ${issue.description}`);
      }

      console.log("\n💡 Run with --report for detailed report");
    } else {
      console.log("✅ No security issues found!");
    }

    // Exit with appropriate code
    process.exit(result.score >= 80 ? 0 : 1);
  } catch (error) {
    console.error("❌ Security audit failed:", error);
    process.exit(1);
  }
}

main();
