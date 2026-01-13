import { ReportContentValidator } from "./dist/validation/report-content-validator.js";

async function validateAllReports() {
  console.log("🔍 Validating All Generated Reports for Hidden Issues...\n");

  const validator = new ReportContentValidator();
  const reports = [
    {
      path: "./SESSION_FIXES_REPORT_CORRECTED.md",
      type: "session" as const,
      description: "Session Management Fixes Report",
    },
    {
      path: "./SESSION_FIXES_REPORT_FINAL.md",
      type: "session" as const,
      description: "Session Management Final Report",
    },
  ];

  let totalIssues = 0;
  let totalRisk = 0;
  const riskLevels = { low: 0, medium: 0, high: 0, critical: 0 };

  for (const report of reports) {
    console.log(`📄 Validating: ${report.description}`);
    console.log(`   Path: ${report.path}`);

    try {
      const validation = await validator.validateReportContent(
        report.path,
        report.type,
      );

      console.log(`   ✅ Valid: ${validation.valid}`);
      console.log(
        `   📊 Risk Level: ${validation.summary.riskLevel.toUpperCase()}`,
      );
      console.log(`   🔴 Critical Errors: ${validation.summary.errorCount}`);
      console.log(`   🟡 Warnings: ${validation.summary.warningCount}`);
      console.log(
        `   ❌ False Positives: ${validation.summary.falsePositiveCount}`,
      );
      console.log(
        `   ⚠️ Inconsistencies: ${validation.summary.inconsistencyCount}`,
      );

      if (validation.issues.length > 0) {
        console.log("   📋 Issues Found:");
        validation.issues.forEach((issue) => console.log(`      • ${issue}`));
      }

      // Track totals
      totalIssues += validation.issues.length;
      riskLevels[validation.summary.riskLevel]++;

      // Show details for high-risk reports
      if (
        validation.summary.riskLevel === "high" ||
        validation.summary.riskLevel === "critical"
      ) {
        console.log("   📋 Critical Details:");
        if (validation.details.criticalErrors.length > 0) {
          console.log("      🔴 Critical Errors:");
          validation.details.criticalErrors.forEach((err) =>
            console.log(`         • ${err}`),
          );
        }
        if (validation.details.falsePositives.length > 0) {
          console.log("      ❌ False Positives:");
          validation.details.falsePositives.forEach((fp) =>
            console.log(`         • ${fp}`),
          );
        }
      }
    } catch (error) {
      console.log(`   ❌ Validation Failed: ${error}`);
    }

    console.log("");
  }

  // Summary
  console.log("🎯 REPORT VALIDATION SUMMARY:");
  console.log(`   📊 Total Reports Analyzed: ${reports.length}`);
  console.log(`   ⚠️ Total Issues Detected: ${totalIssues}`);
  console.log(`   📈 Risk Distribution:`);
  Object.entries(riskLevels).forEach(([level, count]) => {
    if (count > 0) console.log(`      ${level.toUpperCase()}: ${count}`);
  });

  const overallStatus =
    totalIssues === 0
      ? "✅ ALL CLEAR"
      : riskLevels.critical > 0
        ? "🚨 CRITICAL ISSUES"
        : riskLevels.high > 0
          ? "⚠️ HIGH RISK"
          : riskLevels.medium > 0
            ? "🟡 MEDIUM RISK"
            : "✅ LOW RISK";

  console.log(`   🎖️ Overall Status: ${overallStatus}`);

  // Recommendations
  if (totalIssues > 0) {
    console.log("\n💡 RECOMMENDATIONS:");
    console.log("   • Review reports with HIGH/CRITICAL risk levels");
    console.log("   • Address false positive claims in reports");
    console.log("   • Investigate inconsistencies in metrics");
    console.log("   • Consider report generation improvements");
  }
}

validateAllReports();
