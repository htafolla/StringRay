import { advancedProfiler } from "../../dist/monitoring/advanced-profiler.js";
import { enterpriseMonitoringSystem } from "../../dist/monitoring/enterprise-monitoring-system.js";
// Simulate agent operations with profiling
async function simulateAgentOperations() {
  console.log("🎯 Starting Advanced Profiling Demo...\n");
  // Enable profiling
  advancedProfiler.enableProfiling();
  console.log("📊 Advanced profiler enabled\n");
  // Start monitoring system
  await enterpriseMonitoringSystem.start();
  console.log("📈 Enterprise monitoring system started\n");
  const operations = [
    { agent: "enforcer", operation: "codex-validation", duration: 150 },
    { agent: "architect", operation: "design-review", duration: 300 },
    { agent: "orchestrator", operation: "task-coordination", duration: 200 },
    {
      agent: "bug-triage-specialist",
      operation: "error-analysis",
      duration: 400,
    },
    { agent: "code-reviewer", operation: "quality-check", duration: 250 },
    {
      agent: "security-auditor",
      operation: "vulnerability-scan",
      duration: 350,
    },
    { agent: "refactorer", operation: "code-optimization", duration: 500 },
    { agent: "testing-lead", operation: "test-strategy", duration: 180 },
  ];
  console.log("🔄 Simulating agent operations...\n");
  // Simulate agent operations
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const operationId = `demo-op-${i}`;
    // Start profiling
    advancedProfiler.startProfiling(operationId, op.agent, op.operation);
    // Simulate operation
    await new Promise((resolve) => setTimeout(resolve, op.duration));
    // End profiling (simulate some failures)
    const success = Math.random() > 0.1; // 90% success rate
    advancedProfiler.endProfiling(
      operationId,
      success,
      success ? undefined : "Simulated error",
    );
  }
  console.log("\n📊 Generating performance metrics...\n");
  // Get metrics for each agent
  const agents = [
    "enforcer",
    "architect",
    "orchestrator",
    "bug-triage-specialist",
    "code-reviewer",
    "security-auditor",
    "refactorer",
    "testing-lead",
  ];
  agents.forEach((agent) => {
    const metrics = advancedProfiler.getMetrics(agent);
    console.log(`🤖 ${agent}:`);
    console.log(`   Operations: ${metrics.totalOperations}`);
    console.log(
      `   Success Rate: ${((metrics.successfulOperations / metrics.totalOperations) * 100).toFixed(1)}%`,
    );
    console.log(`   Average Duration: ${metrics.averageDuration.toFixed(2)}ms`);
    console.log(
      `   Memory Delta: ${(metrics.memoryDelta / 1024 / 1024).toFixed(2)}MB`,
    );
    console.log(`   Slowest: ${metrics.slowestOperation}`);
    console.log(`   Fastest: ${metrics.fastestOperation}\n`);
  });
  // Get system-wide metrics
  const systemMetrics = advancedProfiler.getMetrics();
  console.log("🌐 System-wide Metrics:");
  console.log(`   Total Operations: ${systemMetrics.totalOperations}`);
  console.log(
    `   Overall Success Rate: ${((systemMetrics.successfulOperations / systemMetrics.totalOperations) * 100).toFixed(1)}%`,
  );
  console.log(
    `   Average Duration: ${systemMetrics.averageDuration.toFixed(2)}ms`,
  );
  console.log(
    `   Memory Delta: ${(systemMetrics.memoryDelta / 1024 / 1024).toFixed(2)}MB\n`,
  );
  // Get monitoring status
  const status = enterpriseMonitoringSystem.getMonitoringStatus();
  console.log("📈 Monitoring System Status:");
  console.log(`   Running: ${status.running}`);
  console.log(`   Instance ID: ${status.instanceId}`);
  console.log(`   Metrics Collected: ${status.metricsCollected}`);
  console.log(`   Active Alerts: ${status.alertsActive}`);
  console.log(`   Health Checks: ${status.healthChecksPerformed}`);
  console.log(`   Cluster Nodes: ${status.clusterNodes}`);
  console.log(`   Uptime: ${Math.floor(status.uptime / 1000 / 60)} minutes\n`);
  // Wait for report generation
  console.log("⏳ Waiting for performance report generation...");
  await new Promise((resolve) => setTimeout(resolve, 65000)); // Wait for report generation
  console.log("\n🎉 Profiling demo completed successfully!");
  console.log(
    "📊 Check the .opencode/strray/profiles/ directory for performance reports",
  );
  // Cleanup
  enterpriseMonitoringSystem.stop();
  advancedProfiler.disableProfiling();
}
// Run the demo
simulateAgentOperations().catch(console.error);
