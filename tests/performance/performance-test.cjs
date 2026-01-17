#!/usr/bin/env node

/**
 * StrRay Framework v1.0.0 - Performance Test Script
 *
 * Measures startup time, memory usage, and bundle size performance.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 StrRay Framework - Performance Test Suite");
console.log("==========================================\n");

// Test 1: Bundle Size Analysis
console.log("📦 Bundle Size Analysis:");
try {
  const distPath = path.join(__dirname, "..", "dist");
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    let totalSize = 0;
    let totalGzipped = 0;
    let jsFiles = 0;

    files.forEach((file) => {
      if (file.endsWith(".js")) {
        const filePath = path.join(distPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        // Calculate actual gzipped size
        try {
          const gzipped = execSync(`gzip -c "${filePath}" | wc -c`, {
            encoding: "utf8",
          });
          const gzippedSize = parseInt(gzipped.trim());
          totalGzipped += gzippedSize;
          console.log(
            `  ${file}: ${(stats.size / 1024).toFixed(2)} KB (${(gzippedSize / 1024).toFixed(2)} KB gzipped)`,
          );
        } catch {
          console.log(`  ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
        }

        jsFiles++;
      }
    });

    console.log(`  Total JS bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`  Total gzipped size: ${(totalGzipped / 1024).toFixed(2)} KB`);

    const withinLimits =
      totalSize < 2 * 1024 * 1024 && totalGzipped < 700 * 1024;
    console.log(
      `  Performance budget: ${withinLimits ? "✅ PASSED" : "❌ FAILED"}\n`,
    );
  } else {
    console.log("  Dist directory not found - run npm run build first\n");
  }
} catch (error) {
  console.error("  Error analyzing bundle size:", error.message, "\n");
}

// Test 2: Startup Time Measurement
console.log("⚡ Startup Time Measurement:");
(async () => {
  try {
    const startTime = process.hrtime.bigint();

    // Dynamic import for ES modules
    await import("../dist/index.js");

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

    console.log(`  Core module import time: ${duration.toFixed(2)}ms`);

    if (duration < 100) {
      console.log("  ✅ Startup time within acceptable limits (< 100ms)\n");
    } else {
      console.log("  ⚠️ Startup time above recommended threshold\n");
    }
  } catch (error) {
    console.error("  Error measuring startup time:", error.message, "\n");
  }
})();

// Test 3: Memory Usage Analysis
console.log("🧠 Memory Usage Analysis:");
try {
  const memUsage = process.memoryUsage();
  console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(
    `  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(
    `  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(
    `  External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB\n`,
  );
} catch (error) {
  console.error("  Error analyzing memory usage:", error.message, "\n");
}

// Test 4: Test Execution Performance
console.log("🧪 Test Execution Performance:");
try {
  const testStart = process.hrtime.bigint();
  execSync("npm test", { stdio: "pipe" });
  const testEnd = process.hrtime.bigint();
  const testDuration = Number(testEnd - testStart) / 1e6;

  console.log(`  Full test suite execution: ${testDuration.toFixed(2)}ms`);

  if (testDuration < 5000) {
    console.log("  ✅ Test execution within acceptable limits (< 5s)\n");
  } else {
    console.log("  ⚠️ Test execution above recommended threshold\n");
  }
} catch (error) {
  console.error("  Error measuring test performance:", error.message, "\n");
}

// Performance Recommendations
console.log("💡 Performance Recommendations:");
console.log("  - Bundle size: Keep under 2MB uncompressed, 700KB gzipped");
console.log("  - Startup time: Target < 100ms for core functionality");
console.log("  - Test execution: Target < 5s for full suite");
console.log("  - Memory usage: Monitor heap growth during operations\n");

console.log("✅ Performance test completed!");
