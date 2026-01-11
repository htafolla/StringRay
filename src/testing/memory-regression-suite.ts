import { EventEmitter } from "events";

/**
 * Memory Regression Testing Suite
 * Automated testing for memory usage patterns and leak detection
 */

export interface MemoryRegressionTest {
  name: string;
  description: string;
  setup?: (() => Promise<void> | void) | undefined;
  execute: () => Promise<any> | any;
  cleanup?: (() => Promise<void> | void) | undefined;
  expectedMemoryDelta: {
    maxIncrease: number;
    acceptableLeak: number;
  };
}

export interface MemoryRegressionResult {
  testName: string;
  passed: boolean;
  memoryDelta: number; // MB
  leakRate: number; // MB per minute
  duration: number; // milliseconds
  error?: string;
  recommendations: string[];
}

export interface RegressionSuiteConfig {
  testTimeout: number; // milliseconds
  memorySamplingInterval: number; // milliseconds
  acceptableMemoryGrowth: number; // MB
  leakDetectionThreshold: number; // MB per minute
}

export class MemoryRegressionTester extends EventEmitter {
  private config: RegressionSuiteConfig;
  private tests: MemoryRegressionTest[] = [];

  constructor(config: Partial<RegressionSuiteConfig> = {}) {
    super();

    this.config = {
      testTimeout: 30000, // 30 seconds
      memorySamplingInterval: 1000, // 1 second
      acceptableMemoryGrowth: 10, // 10MB
      leakDetectionThreshold: 1, // 1MB per minute
      ...config,
    };
  }

  /**
   * Add a regression test
   */
  addTest(test: MemoryRegressionTest): void {
    this.tests.push(test);
  }

  /**
   * Run all regression tests
   */
  async runAllTests(): Promise<MemoryRegressionResult[]> {
    const results: MemoryRegressionResult[] = [];

    for (const test of this.tests) {
      try {
        const result = await this.runTest(test);
        results.push(result);
      } catch (error) {
        results.push({
          testName: test.name,
          passed: false,
          memoryDelta: 0,
          leakRate: 0,
          duration: 0,
          error: error instanceof Error ? error.message : String(error),
          recommendations: [
            "Check test implementation",
            "Verify memory cleanup",
          ],
        });
      }
    }

    return results;
  }

  /**
   * Run a single regression test
   */
  private async runTest(
    test: MemoryRegressionTest,
  ): Promise<MemoryRegressionResult> {
    const startTime = Date.now();

    try {
      // Setup
      if (test.setup) {
        await Promise.resolve(test.setup());
      }

      // Memory sampling during test
      const samples: number[] = [];
      const samplingInterval = setInterval(() => {
        const memUsage = process.memoryUsage();
        samples.push(memUsage.heapUsed);
      }, this.config.memorySamplingInterval);

      // Execute test with timeout
      const testPromise = test.execute();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Test timeout")),
          this.config.testTimeout,
        ),
      );

      await Promise.race([testPromise, timeoutPromise]);
      clearInterval(samplingInterval);

      // Calculate results
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (samples.length === 0) {
        throw new Error("No memory samples collected");
      }

      const startMemory = samples[0]!;
      const endMemory = samples[samples.length - 1]!;
      const memoryDelta = (endMemory - startMemory) / 1024 / 1024; // MB

      // Calculate leak rate (MB per minute)
      const leakRate = duration > 0 ? memoryDelta / (duration / 1000 / 60) : 0;

      // Determine pass/fail
      const passed =
        Math.abs(memoryDelta) <= test.expectedMemoryDelta.maxIncrease &&
        Math.abs(leakRate) <= test.expectedMemoryDelta.acceptableLeak;

      // Generate recommendations
      const recommendations: string[] = [];
      if (memoryDelta > test.expectedMemoryDelta.maxIncrease) {
        recommendations.push(
          `Memory increased by ${memoryDelta.toFixed(2)}MB (expected ≤${test.expectedMemoryDelta.maxIncrease}MB)`,
        );
      }
      if (leakRate > test.expectedMemoryDelta.acceptableLeak) {
        recommendations.push(
          `Memory leak rate: ${leakRate.toFixed(2)}MB/min (expected ≤${test.expectedMemoryDelta.acceptableLeak}MB/min)`,
        );
      }
      if (samples.length > 10) {
        const variance = this.calculateVariance(samples);
        if (variance > 5 * 1024 * 1024) {
          // 5MB variance
          recommendations.push(
            "High memory variance detected - consider stabilizing allocations",
          );
        }
      }

      // Cleanup
      if (test.cleanup) {
        await Promise.resolve(test.cleanup());
      }

      return {
        testName: test.name,
        passed,
        memoryDelta,
        leakRate,
        duration,
        recommendations,
      };
    } catch (error) {
      // Cleanup on error
      if (test.cleanup) {
        try {
          await test.cleanup();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }

      throw error;
    }
  }

  /**
   * Create a standard memory regression test
   */
  createStandardTest(
    name: string,
    description: string,
    testFunction: () => Promise<any> | any,
    options: {
      maxMemoryIncrease?: number;
      acceptableLeakRate?: number;
      setup?: () => Promise<void> | void;
      cleanup?: () => Promise<void> | void;
    } = {},
  ): MemoryRegressionTest {
    return {
      name,
      description,
      setup: options.setup,
      execute: testFunction,
      cleanup: options.cleanup,
      expectedMemoryDelta: {
        maxIncrease:
          options.maxMemoryIncrease || this.config.acceptableMemoryGrowth,
        acceptableLeak:
          options.acceptableLeakRate || this.config.leakDetectionThreshold,
      },
    };
  }

  /**
   * Generate test report
   */
  generateReport(results: MemoryRegressionResult[]): string {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;

    let report = `# Memory Regression Test Report\n\n`;
    report += `**Summary:** ${passed}/${results.length} tests passed (${failed} failed)\n\n`;

    if (failed > 0) {
      report += `## Failed Tests\n\n`;
      results
        .filter((r) => !r.passed)
        .forEach((result) => {
          report += `### ${result.testName}\n`;
          report += `- Memory Delta: ${result.memoryDelta.toFixed(2)}MB\n`;
          report += `- Leak Rate: ${result.leakRate.toFixed(2)}MB/min\n`;
          report += `- Duration: ${result.duration}ms\n`;
          if (result.error) {
            report += `- Error: ${result.error}\n`;
          }
          if (result.recommendations.length > 0) {
            report += `- Recommendations:\n`;
            result.recommendations.forEach((rec) => {
              report += `  - ${rec}\n`;
            });
          }
          report += `\n`;
        });
    }

    report += `## Performance Metrics\n\n`;
    const avgDelta =
      results.reduce((sum, r) => sum + r.memoryDelta, 0) / results.length;
    const avgLeakRate =
      results.reduce((sum, r) => sum + r.leakRate, 0) / results.length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    report += `- Average Memory Delta: ${avgDelta.toFixed(2)}MB\n`;
    report += `- Average Leak Rate: ${avgLeakRate.toFixed(2)}MB/min\n`;
    report += `- Total Test Duration: ${totalDuration}ms\n`;

    return report;
  }

  /**
   * Calculate variance of memory samples
   */
  private calculateVariance(samples: number[]): number {
    const mean = samples.reduce((sum, s) => sum + s, 0) / samples.length;
    const variance =
      samples.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
      samples.length;
    return variance;
  }
}

// Pre-configured test templates
export const memoryTestTemplates = {
  sessionOperations: (sessionCount: number = 100) => ({
    name: "Session Operations Memory Test",
    description: `Test memory usage during ${sessionCount} session operations`,
    setup: async () => {
      // Setup would initialize session manager
      console.log(`Setting up ${sessionCount} sessions for testing...`);
    },
    execute: async () => {
      // Simulate session operations
      const operations = [];
      for (let i = 0; i < sessionCount; i++) {
        operations.push({
          id: `session-${i}`,
          data: { userId: i, metadata: { created: Date.now(), active: true } },
        });
      }
      return operations;
    },
    cleanup: async () => {
      // Cleanup sessions
      console.log("Cleaning up test sessions...");
    },
    expectedMemoryDelta: {
      maxIncrease: sessionCount * 0.01, // ~10KB per session
      acceptableLeak: 0.1, // 0.1MB per minute
    },
  }),

  cacheOperations: (cacheSize: number = 1000) => ({
    name: "Cache Operations Memory Test",
    description: `Test memory usage during ${cacheSize} cache operations`,
    execute: async () => {
      const cache = new Map();
      for (let i = 0; i < cacheSize; i++) {
        cache.set(`key-${i}`, {
          data: `value-${i}`.repeat(10), // ~100 bytes per entry
          timestamp: Date.now(),
        });
      }
      // Simulate cache operations
      for (let i = 0; i < cacheSize / 2; i++) {
        cache.get(`key-${i}`);
      }
      return cache.size;
    },
    expectedMemoryDelta: {
      maxIncrease: (cacheSize * 0.1) / 1024 / 1024, // ~100KB total
      acceptableLeak: 0.05, // 0.05MB per minute
    },
  }),

  streamingOperations: (messageCount: number = 1000) => ({
    name: "Streaming Operations Memory Test",
    description: `Test memory usage during ${messageCount} streaming operations`,
    execute: async () => {
      const messages = [];
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          id: i,
          payload: Buffer.from(`message-${i}-`.repeat(50)), // ~500 bytes per message
          timestamp: Date.now(),
        });
        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
      return messages.length;
    },
    expectedMemoryDelta: {
      maxIncrease: (messageCount * 0.5) / 1024 / 1024, // ~500KB total
      acceptableLeak: 0.2, // 0.2MB per minute
    },
  }),
};
