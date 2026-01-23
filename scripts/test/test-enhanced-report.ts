/**
 * Quick Report Generation Test
 */

import { frameworkReportingSystem } from "./src/reporting/framework-reporting-system";

async function testReport() {
  console.log("🧪 TESTING ENHANCED REPORTING SYSTEM");
  console.log("====================================");

  // Generate a comprehensive report
  const report = await frameworkReportingSystem.generateReport({
    type: "full-analysis",
    timeRange: { lastHours: 1 },
    outputFormat: "markdown",
    detailedMetrics: true,
  });

  console.log("\n📊 FULL ANALYSIS REPORT:");
  console.log("========================");
  console.log(report);
}

testReport().catch(console.error);
