/**
 * StrRay Framework - On-Demand Reporting Examples
 *
 * Usage examples for the framework reporting system
 */

// Example 1: Generate a comprehensive orchestration report
import { frameworkReportingSystem } from "./src/reporting/framework-reporting-system.js";

async function generateOrchestrationReport() {
  const report = await frameworkReportingSystem.generateReport({
    type: "orchestration",
    timeRange: { lastHours: 1 },
    outputFormat: "markdown",
    outputPath: "./reports/orchestration-report.md",
    detailedMetrics: true,
  });

  console.log(
    "Orchestration report generated:",
    report.substring(0, 200) + "...",
  );
}

// Example 2: Get real-time framework status
async function getRealtimeStatus() {
  const status = await frameworkReportingSystem.getRealtimeStatus();

  console.log("Framework Status:");
  console.log("- Active Components:", status.activeComponents);
  console.log("- Health Score:", status.healthScore.toFixed(1) + "%");
  console.log("- Recent Alerts:", status.alerts.length);
}

// Example 3: Schedule automated daily reports
function setupAutomatedReporting() {
  frameworkReportingSystem.scheduleAutomatedReports({
    frequency: "daily",
    types: ["orchestration", "agent-usage", "performance"],
    outputDir: "./reports/daily/",
    retentionDays: 30,
  });

  console.log("Automated daily reporting scheduled");
}

// Example 4: Create custom report template
function createCustomReportTemplate() {
  const template = frameworkReportingSystem.createCustomReport({
    name: "Security Audit",
    filters: {
      components: ["security-auditor", "codex-injector"],
      actions: ["scan", "validate", "inject"],
      status: ["success", "error"],
    },
    aggregations: {
      groupBy: "component",
      metrics: ["count", "successRate"],
    },
    visualizations: ["pie-chart", "timeline"],
  });

  console.log("Custom report template:", template);
}

// CLI Usage Examples:
// npm run report orchestration markdown ./reports/orchestration.md
// npm run report agent-usage json
// npm run report context-awareness html ./reports/context.html

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case "orchestration":
      generateOrchestrationReport();
      break;
    case "status":
      getRealtimeStatus();
      break;
    case "schedule":
      setupAutomatedReporting();
      break;
    case "custom":
      console.log(createCustomReportTemplate());
      break;
    default:
      console.log(`
StrRay Framework Reporting System

Usage: node reporting-examples.js <command>

Commands:
  orchestration  Generate orchestration report
  status        Get real-time framework status
  schedule      Setup automated reporting
  custom        Show custom report template

Examples:
  node reporting-examples.js orchestration
  node reporting-examples.js status
      `);
  }
}
