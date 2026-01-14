import { PostProcessor } from "./dist/postprocessor/PostProcessor.js";
import { createSessionCoordinator } from "./dist/delegation/session-coordinator.js";
import { StrRayStateManager } from "./dist/state/state-manager.js";
import { createSessionCleanupManager } from "./dist/session/session-cleanup-manager.js";
import { createSessionMonitor } from "./dist/session/session-monitor.js";

console.log(
  "🚀 Running Post-Processor to trigger automated report generation...",
);

// Initialize components
const stateManager = new StrRayStateManager();
const sessionCoordinator = createSessionCoordinator(stateManager);
const cleanupManager = createSessionCleanupManager(
  stateManager,
  {
    defaultTtlMs: 86400000,
    cleanupIntervalMs: 300000,
  },
  null,
);
const sessionMonitor = createSessionMonitor(
  stateManager,
  sessionCoordinator,
  cleanupManager,
  {},
);

// Create post-processor
const postProcessor = new PostProcessor(
  stateManager,
  sessionCoordinator,
  cleanupManager,
  sessionMonitor,
  {
    reporting: {
      enabled: true,
      autoGenerate: true,
      reportThreshold: 10, // Lower threshold for testing
      reportDir: ".opencode/reports",
      retentionDays: 30,
    },
  },
);

// Simulate a post-processor context
const context = {
  commitSha: "test-commit-" + Date.now(),
  branch: "main",
  files: ["src/session/session-manager.ts", "src/state/state-manager.ts"], // Simulate session management changes
  timestamp: Date.now(),
};

console.log("📋 Running post-processor with session management context...");

// Run post-processor - this should trigger automated report generation
await postProcessor.executePostProcessorLoop(context);

console.log("✅ Post-processor completed - checking for auto-generated report");
