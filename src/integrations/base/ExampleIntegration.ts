/**
 * Example Integration - Demonstrates using the BaseIntegration class
 *
 * This is a simple example showing how to create a custom integration
 * that extends the BaseIntegration class.
 *
 * @version 1.0.0
 * @since 2026-03-15
 */

import {
  BaseIntegration,
  createSimpleIntegration,
  type HealthResult,
  type IntegrationStats,
  type IntegrationConfig,
} from "./index.js";

/**
 * Example custom integration
 *
 * Demonstrates how to extend BaseIntegration with custom logic.
 */
class ExampleIntegration extends BaseIntegration {
  /** Custom property for this integration */
  private connectionString: string = "";
  private connected: boolean = false;

  /**
   * Create a new ExampleIntegration
   *
   * @param config - Optional configuration
   */
  constructor(config?: Partial<IntegrationConfig>) {
    super("example-integration", "1.0.0", {
      enabled: true,
      debug: false,
      logLevel: "info",
      ...config,
    });
  }

  /**
   * Set connection string
   */
  setConnectionString(connStr: string): void {
    this.connectionString = connStr;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  // ==========================================================================
  // Protected abstract method implementations
  // ==========================================================================

  /**
   * Perform integration-specific initialization
   */
  protected async performInitialization(): Promise<void> {
    await this.log("info", "Starting initialization...");

    // Simulate async initialization (e.g., connecting to a service)
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (this.connectionString) {
      // Would connect to external service here
      this.connected = true;
      await this.log("success", "Connected to service");
    }

    // Emit custom event
    this.emit("custom-initialized", { connected: this.connected });
  }

  /**
   * Perform integration-specific shutdown
   */
  protected async performShutdown(): Promise<void> {
    await this.log("info", "Starting shutdown...");

    // Simulate async cleanup
    await new Promise((resolve) => setTimeout(resolve, 50));

    this.connected = false;
    await this.log("success", "Shutdown complete");
  }

  /**
   * Perform integration-specific health check
   */
  protected async performHealthCheck(): Promise<HealthResult> {
    if (!this.connected) {
      return {
        healthy: false,
        message: "Not connected to service",
        details: { connectionString: !!this.connectionString },
      };
    }

    // In a real integration, you might ping the service here
    return {
      healthy: true,
      message: "Service connection healthy",
      details: { connected: true },
    };
  }
}

// ==========================================================================
// Usage Examples
// ==========================================================================

/**
 * Example 1: Using a custom integration class
 */
async function exampleCustomIntegration(): Promise<void> {
  console.log("\n--- Example 1: Custom Integration ---");

  // Create integration
  const integration = new ExampleIntegration({
    debug: true,
    logLevel: "debug",
  });

  // Set connection string
  integration.setConnectionString("http://localhost:3000");

  // Setup event listener
  integration.on("initialized", (event) => {
    console.log("Integration initialized event:", event.type);
  });

  // Initialize
  await integration.initialize();

  // Check health
  const health = await integration.healthCheck();
  console.log("Health check:", health);

  // Get stats
  const stats = integration.getStats();
  console.log("Stats:", stats);

  // Shutdown
  await integration.shutdown();
}

/**
 * Example 2: Using createSimpleIntegration factory
 */
async function exampleSimpleIntegration(): Promise<void> {
  console.log("\n--- Example 2: Simple Integration ---");

  // Create a simple integration without subclassing
  const simple = createSimpleIntegration(
    "simple-integration",
    "1.0.0",
    // Custom health check
    async () => ({
      healthy: true,
      message: "Always healthy",
    }),
    // Custom shutdown
    async () => {
      console.log("Custom cleanup performed");
    },
  );

  // Initialize
  await simple.initialize();

  // Check health
  const health = await simple.healthCheck();
  console.log("Health check:", health);

  // Shutdown
  await simple.shutdown();
}

/**
 * Example 3: Error handling
 */
async function exampleErrorHandling(): Promise<void> {
  console.log("\n--- Example 3: Error Handling ---");

  // Create integration that will fail to initialize
  class FailingIntegration extends BaseIntegration {
    constructor() {
      super("failing-integration", "1.0.0");
    }

    protected async performInitialization(): Promise<void> {
      throw new Error("Connection refused");
    }

    protected async performShutdown(): Promise<void> {
      // Cleanup even on failure
    }

    protected async performHealthCheck(): Promise<HealthResult> {
      return { healthy: false, message: "Not initialized" };
    }
  }

  const failing = new FailingIntegration();

  try {
    await failing.initialize();
  } catch (error) {
    console.log("Caught expected error:", error instanceof Error ? error.message : error);
  }
}

// Run examples if this file is executed directly
// (In a real project, you would import and use the classes)

// Export for use in other modules
export { ExampleIntegration };

// Example usage (uncomment to run):
// exampleCustomIntegration().catch(console.error);
// exampleSimpleIntegration().catch(console.error);
// exampleErrorHandling().catch(console.error);
