#!/usr/bin/env node

/**
 * StringRay Framework - Reporting Examples
 * 
 * Purpose: Provides usage examples for the framework reporting system
 * demonstrating various report types and configurations.
 * 
 * Features:
 * - Generate comprehensive orchestration reports
 * - Get real-time framework status
 * - Setup automated reporting schedules
 * - Create custom report templates
 * 
 * Usage:
 *   npx tsx scripts/demo/reporting-examples.ts <command>
 * 
 * Commands:
 *   orchestration  - Generate orchestration report
 *   status         - Get real-time framework status
 *   schedule       - Setup automated reporting
 *   custom         - Show custom report template
 * 
 * Examples:
 *   npx tsx scripts/demo/reporting-examples.ts orchestration
 *   npx tsx scripts/demo/reporting-examples.ts status
 * 
 * Output:
 * - Console output with report summaries
 * - Generated report files (if outputPath specified)
 */

import { frameworkReportingSystem } from "../../src/reporting/framework-reporting-system.js";

// Example 1: Generate a comprehensive orchestration report
async function generateOrchestrationReport() {
  console.log("📋 Generating orchestration report...");
  
  try {
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
    console.log("\n✅ Report saved to: ./reports/orchestration-report.md");
  } catch (error) {
    console.error("❌ Failed to generate orchestration report:", error);
  }
}

// Example 2: Get real-time framework status
async function getRealtimeStatus() {
  console.log("📊 Getting real-time framework status...");
  
  try {
    const status = await frameworkReportingSystem.getRealtimeStatus();

    console.log("\n🌐 Framework Status:");
    console.log("- Active Components:", status.activeComponents);
    console.log("- Health Score:", status.healthScore.toFixed(1) + "%");
    console.log("- Recent Alerts:", status.alerts.length);
    
    if (status.alerts.length > 0) {
      console.log("\n⚠️ Recent Alerts:");
      status.alerts.slice(0, 5).forEach((alert, idx) => {
        console.log(`  ${idx + 1}. ${alert}`);
      });
    }
  } catch (error) {
    console.error("❌ Failed to get real-time status:", error);
  }
}

// Example 3: Schedule automated daily reports
function setupAutomatedReporting() {
  console.log("📅 Setting up automated reporting...");
  
  try {
    frameworkReportingSystem.scheduleAutomatedReports({
      frequency: "daily",
      types: ["orchestration", "agent-usage", "performance"],
      outputDir: "./reports/daily/",
      retentionDays: 30,
    });

    console.log("✅ Automated daily reporting scheduled");
    console.log("📁 Reports will be saved to: ./reports/daily/");
    console.log("🗓️ Retention: 30 days");
  } catch (error) {
    console.error("❌ Failed to setup automated reporting:", error);
  }
}

// Example 4: Create custom report template
function createCustomReportTemplate() {
  console.log("📄 Creating custom report template...");
  
  try {
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

    console.log("✅ Custom report template created:");
    console.log(JSON.stringify(template, null, 2));
  } catch (error) {
    console.error("❌ Failed to create custom report template:", error);
  }
}

// CLI Usage Examples:
// npx tsx scripts/demo/reporting-examples.ts orchestration
// npx tsx scripts/demo/reporting-examples.ts status
// npx tsx scripts/demo/reporting-examples.ts schedule
// npx tsx scripts/demo/reporting-examples.ts custom

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
      createCustomReportTemplate();
      break;
      
    default:
      console.log(`
StrRay Framework Reporting System Examples
==========================================

Usage: npx tsx scripts/demo/reporting-examples.ts <command>

Commands:
  orchestration  Generate orchestration report
  status         Get real-time framework status
  schedule       Setup automated reporting
  custom         Show custom report template

Examples:
  npx tsx scripts/demo/reporting-examples.ts orchestration
  npx tsx scripts/demo/reporting-examples.ts status
  npx tsx scripts/demo/reporting-examples.ts schedule

Description:
  This script demonstrates the reporting capabilities of the StringRay
  framework including real-time status monitoring, automated report
  generation, and custom report templates.
      `);
  }
}
