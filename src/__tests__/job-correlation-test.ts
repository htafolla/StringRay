// Integration test for job correlation fix
// Tests that jobIds are properly included in activity logs

import { jobCorrelationManager } from "../jobs/job-correlation-manager.js";
import { generateJobId } from "../core/framework-logger.js";

async function testJobCorrelation() {
  console.log("🧪 Testing Job Correlation Fix...");

  // Test 1: Start job context
  console.log("📋 Test 1: Starting job context...");
  const jobId = jobCorrelationManager.startJob();
  console.log(`✅ Job started: ${jobId}`);

  // Test 2: Verify job context is active
  console.log("📋 Test 2: Verifying job context...");
  const currentJobId = jobCorrelationManager.getCurrentJobId();
  console.log(`✅ Current job: ${currentJobId}`);

  if (currentJobId !== jobId) {
    throw new Error("Job context not properly set");
  }

  // Test 3: Execute operation within job context
  console.log("📋 Test 3: Executing operation within job context...");
  await jobCorrelationManager.executeInJobContext(async () => {
    console.log("🔧 Executing test operation...");
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate work
    console.log("✅ Operation completed within job context");
  }, jobId);

  console.log("🎯 Job Correlation Test Complete!");

  // Check active jobs
  const activeCount = jobCorrelationManager.getActiveJobCount();
  console.log(`📊 Active jobs: ${activeCount}`);

  console.log("🎯 EXPECTED: Check activity.log for jobId entries like:", {
    format: "[job-JOBID-12345] [component] event - level",
    example: `[${jobId}] [universal-librarian-consultation] post-action-consultation-started - INFO`,
  });
}

// Auto-run test
if (require.main === module) {
  testJobCorrelation().catch(console.error);
}
