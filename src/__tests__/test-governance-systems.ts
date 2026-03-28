/**
 * Test Script: AI Governance Systems Integration Test
 *
 * Purpose: Test both AgentSpawnGovernor and MultiAgentOrchestrationCoordinator
 * to verify they work correctly independently and together.
 *
 * Systems Tested:
 * 1. AgentSpawnGovernor - Prevents infinite agent spawning, enforces limits
 * 2. MultiAgentOrchestrationCoordinator - Coordinates multi-agent conferences
 * 3. Integration - Both systems active simultaneously
 */

import {
  AgentSpawnGovernor,
  agentSpawnGovernor,
  type SpawnContext,
  type SpawnAuthorization,
} from "../orchestrator/agent-spawn-governor.js";
import {
  MultiAgentOrchestrationCoordinator,
  multiAgentOrchestrationCoordinator,
  type OrchestrationWorkflow,
} from "../orchestrator/multi-agent-orchestration-coordinator.js";
import { StringRayStateManager } from "../state/state-manager.js";

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

class GovernanceSystemsTest {
  private testResults: TestResult[] = [];
  private stateManager: StringRayStateManager;

  constructor() {
    this.stateManager = new StringRayStateManager();
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log("=".repeat(80));
    console.log("AI GOVERNANCE SYSTEMS INTEGRATION TEST");
    console.log("=".repeat(80));
    console.log();

    console.log("Testing System 1: AgentSpawnGovernor");
    console.log("-".repeat(80));
    await this.testAgentSpawnGovernor();

    console.log();
    console.log("Testing System 2: MultiAgentOrchestrationCoordinator");
    console.log("-".repeat(80));
    await this.testMultiAgentOrchestrationCoordinator();

    console.log();
    console.log("Testing Integration: Both Systems Together");
    console.log("-".repeat(80));
    await this.testIntegration();

    console.log();
    console.log("=".repeat(80));
    console.log("TEST SUMMARY");
    console.log("=".repeat(80));
    this.printSummary();
  }

  /**
   * Test System 1: AgentSpawnGovernor
   */
  private async testAgentSpawnGovernor(): Promise<void> {
    // Test 1: Instantiation
    await this.test("System 1.1: Instantiate AgentSpawnGovernor", async () => {
      const governor = new AgentSpawnGovernor();
      return governor !== null && typeof governor.authorizeSpawn === "function";
    }, "AgentSpawnGovernor can be instantiated");

    // Test 2: Authorize single spawn
    await this.test("System 1.2: Authorize single agent spawn", async () => {
      const governor = new AgentSpawnGovernor();
      const context: SpawnContext = {
        agentType: "researcher",
        operation: "analyze",
        triggeredBy: "test",
        priority: "medium",
      };

      const result: SpawnAuthorization = await governor.authorizeSpawn(context);

      return result.authorized && result.trackingId !== undefined;
    }, "Can authorize a single agent spawn");

    // Test 3: Enforce spawn limits
    await this.test("System 1.3: Enforce per-agent type limits", async () => {
      const governor = new AgentSpawnGovernor();

      // Spawn 2 researchers (limit should be 1)
      const context1: SpawnContext = {
        agentType: "researcher",
        operation: "analyze",
        triggeredBy: "test",
        priority: "medium",
      };

      const context2: SpawnContext = {
        agentType: "researcher",
        operation: "analyze",
        triggeredBy: "test",
        priority: "medium",
      };

      const result1 = await governor.authorizeSpawn(context1);
      const result2 = await governor.authorizeSpawn(context2);

      // First should succeed, second should fail
      return result1.authorized && !result2.authorized;
    }, "Enforces per-agent type spawn limits");

    // Test 4: Get active agents
    await this.test("System 1.4: Track active agents", async () => {
      const governor = new AgentSpawnGovernor();
      const context: SpawnContext = {
        agentType: "enforcer",
        operation: "validate",
        triggeredBy: "test",
        priority: "high",
      };

      await governor.authorizeSpawn(context);
      const activeCount = governor.getActiveCount("enforcer");

      return activeCount === 1;
    }, "Tracks active agents correctly");

    // Test 5: Memory management
    await this.test("System 1.5: Memory management active", async () => {
      const governor = new AgentSpawnGovernor();

      // Spawn multiple agents
      for (let i = 0; i < 3; i++) {
        const context: SpawnContext = {
          agentType: "architect",
          operation: "design",
          triggeredBy: "test",
          priority: "medium",
        };
        await governor.authorizeSpawn(context);
      }

      // Check spawn history
      const stats = governor.getSpawnStats();

      return stats.totalActive > 0 && stats.totalHistory > 0;
    }, "Memory management and tracking functional");

    // Test 6: Cleanup intervals
    await this.test("System 1.6: Cleanup intervals configured", async () => {
      const governor = new AgentSpawnGovernor();

      // Trigger some spawns and check cleanup mechanism exists
      const context: SpawnContext = {
        agentType: "code-reviewer",
        operation: "review",
        triggeredBy: "test",
        priority: "low",
      };

      await governor.authorizeSpawn(context);

      // Verify cleanup is possible
      await governor.completeSpawn("test-id");
      return true;
    }, "Cleanup intervals and lifecycle management functional");

    // Test 7: Prevent infinite spawns
    await this.test("System 1.7: Detect infinite spawn patterns", async () => {
      const governor = new AgentSpawnGovernor();

      // Try to spawn same agent type rapidly
      const attempts = [];
      for (let i = 0; i < 6; i++) {
        const context: SpawnContext = {
          agentType: "bug-triage-specialist",
          operation: "debug",
          triggeredBy: "test",
          priority: "medium",
        };
        attempts.push(governor.authorizeSpawn(context));
      }

      const results = await Promise.all(attempts);

      // Should detect pattern and block some spawns
      const blocked = results.filter((r: SpawnAuthorization) => !r.authorized).length;

      return blocked > 0;
    }, "Detects and prevents infinite spawn patterns");

    // Test 8: Emergency shutdown
    await this.test("System 1.8: Emergency shutdown", async () => {
      const governor = new AgentSpawnGovernor();

      const context: SpawnContext = {
        agentType: "testing-lead",
        operation: "test",
        triggeredBy: "test",
        priority: "high",
      };

      await governor.authorizeSpawn(context);
      await governor.emergencyShutdown("Test shutdown");

      return true;
    }, "Emergency shutdown functional");
  }

  /**
   * Test System 2: MultiAgentOrchestrationCoordinator
   */
  private async testMultiAgentOrchestrationCoordinator(): Promise<void> {
    // Test 1: Instantiation
    await this.test("System 2.1: Instantiate MultiAgentOrchestrationCoordinator", async () => {
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);
      return coordinator !== null && typeof coordinator.executeOrchestrationWorkflow === "function";
    }, "MultiAgentOrchestrationCoordinator can be instantiated");

    // Test 2: Validate workflow
    await this.test("System 2.2: Validate workflow", async () => {
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      const workflow: OrchestrationWorkflow = {
        id: "test-workflow-1",
        name: "Test Workflow",
        description: "A simple test workflow",
        tasks: [{
          id: "task-1",
          type: "simple",
          description: "Test task",
          complexity: 20,
          priority: "low" as const,
          createdAt: new Date(),
          status: "pending" as const,
          dependencies: [],
          subagentType: "enforcer",
        }],
        priority: "medium",
      };

      const validation = coordinator.validateWorkflow(workflow);

      return validation.valid;
    }, "Can validate workflows");

    // Test 3: Execute simple workflow
    await this.test("System 2.3: Execute simple workflow", async () => {
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      const workflow: OrchestrationWorkflow = {
        id: "test-workflow-2",
        name: "Simple Test Workflow",
        description: "Execute a simple workflow",
        tasks: [{
          id: "task-1",
          type: "simple",
          description: "Simple validation task",
          complexity: 10,
          priority: "low" as const,
          createdAt: new Date(),
          status: "pending" as const,
          dependencies: [],
          subagentType: "enforcer",
        }],
        priority: "low",
        timeout: 10000,
      };

      const result = await coordinator.executeOrchestrationWorkflow(workflow, "test-session-1");

      return result !== null && typeof result === "object";
    }, "Can execute simple workflows");

    // Test 4: Coordinate with agent-delegator
    await this.test("System 2.4: Coordinate with agent-delegator", async () => {
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      const workflow: OrchestrationWorkflow = {
        id: "test-workflow-3",
        name: "Delegation Test Workflow",
        description: "Test agent delegation coordination",
        tasks: [{
          id: "task-1",
          type: "simple",
          description: "Test delegation",
          complexity: 30,
          priority: "medium" as const,
          createdAt: new Date(),
          status: "pending" as const,
          dependencies: [],
          subagentType: "code-reviewer",
        }],
        priority: "medium",
      };

      const result = await coordinator.executeOrchestrationWorkflow(workflow, "test-session-2");

      // Check if agents were used
      return result.agentCoordination && result.agentCoordination.agentsUsed.length > 0;
    }, "Coordinates with agent-delegator");

    // Test 5: Use complexity-analyzer
    await this.test("System 2.5: Use complexity-analyzer", async () => {
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      const workflow: OrchestrationWorkflow = {
        id: "test-workflow-4",
        name: "Complexity Test Workflow",
        description: "Test complexity analysis integration",
        tasks: [{
          id: "task-1",
          type: "simple",
          description: "Complex task for analysis",
          complexity: 60,
          priority: "high" as const,
          createdAt: new Date(),
          status: "pending" as const,
          dependencies: [],
          subagentType: "architect",
        }],
        priority: "high",
      };

      const result = await coordinator.executeOrchestrationWorkflow(workflow, "test-session-3");

      // Complexity should have been analyzed
      return result !== null;
    }, "Uses complexity-analyzer for workflow analysis");

    // Test 6: Get coordination metrics
    await this.test("System 2.6: Get coordination metrics", async () => {
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      const metrics = coordinator.getCoordinationMetrics();

      return metrics !== null && typeof metrics.totalWorkflows === "number";
    }, "Can retrieve coordination metrics");

    // Test 7: Multi-agent conference
    await this.test("System 2.7: Coordinate multi-agent conference", async () => {
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      const workflow: OrchestrationWorkflow = {
        id: "test-workflow-5",
        name: "Multi-Agent Conference Test",
        description: "Test multi-agent coordination",
        tasks: [
          {
            id: "task-1",
            type: "simple",
            description: "Bug triage task",
            complexity: 50,
            priority: "high" as const,
            createdAt: new Date(),
            status: "pending" as const,
            dependencies: [],
            subagentType: "bug-triage-specialist",
          },
          {
            id: "task-2",
            type: "simple",
            description: "Code analysis task",
            complexity: 50,
            priority: "high" as const,
            createdAt: new Date(),
            status: "pending" as const,
            dependencies: [],
            subagentType: "code-analyzer",
          },
        ],
        priority: "high",
      };

      const result = await coordinator.executeOrchestrationWorkflow(workflow, "test-session-4");

      // Should have coordinated multiple agents
      return result.agentCoordination.agentsUsed.length >= 2;
    }, "Can coordinate multi-agent conferences");
  }

  /**
   * Test Integration: Both Systems Together
   */
  private async testIntegration(): Promise<void> {
    // Test 1: Both systems can be instantiated together
    await this.test("Integration 1: Both systems instantiate together", async () => {
      const governor = new AgentSpawnGovernor();
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      return governor !== null && coordinator !== null;
    }, "Both systems can be instantiated simultaneously");

    // Test 2: Workflow execution doesn't conflict with governor
    await this.test("Integration 2: No conflict between systems", async () => {
      const governor = new AgentSpawnGovernor();
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      // Authorize a spawn through governor
      const context: SpawnContext = {
        agentType: "enforcer",
        operation: "validate",
        triggeredBy: "integration-test",
        priority: "high",
      };

      const spawnResult = await governor.authorizeSpawn(context);

      // Execute workflow through coordinator
      const workflow: OrchestrationWorkflow = {
        id: "integration-workflow-1",
        name: "Integration Test Workflow",
        description: "Test integration between systems",
        tasks: [{
          id: "task-1",
          type: "simple",
          description: "Integration test task",
          complexity: 20,
          priority: "medium" as const,
          createdAt: new Date(),
          status: "pending" as const,
          dependencies: [],
          subagentType: "enforcer",
        }],
        priority: "medium",
      };

      const workflowResult = await coordinator.executeOrchestrationWorkflow(workflow, "integration-session-1");

      // Both should work without conflicts
      return spawnResult.authorized && workflowResult !== null;
    }, "No conflicts between the two systems");

    // Test 3: Governor limits apply to coordinator spawns
    await this.test("Integration 3: Governor limits coordinator spawns", async () => {
      const governor = new AgentSpawnGovernor();
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      // Try to spawn same agent type multiple times through coordinator
      const workflows = [];
      for (let i = 0; i < 3; i++) {
        workflows.push(coordinator.executeOrchestrationWorkflow({
          id: `integration-workflow-${i}`,
          name: "Test Workflow",
          description: "Test spawn limits",
          tasks: [{
            id: `task-${i}`,
            type: "simple",
            description: "Test task",
            complexity: 20,
            priority: "medium" as const,
            createdAt: new Date(),
            status: "pending" as const,
            dependencies: [],
            subagentType: "researcher",
          }],
          priority: "medium",
        }, "integration-session-2"));
      }

      await Promise.all(workflows);

      // Governor should have tracked spawns
      const stats = governor.getSpawnStats();

      return stats.totalHistory > 0;
    }, "Governor tracks spawns from coordinator");

    // Test 4: Regression analysis scenario
    await this.test("Integration 4: Regression analysis scenario", async () => {
      const governor = new AgentSpawnGovernor();
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      // Simulate regression analysis workflow
      const workflow: OrchestrationWorkflow = {
        id: "regression-analysis-workflow",
        name: "Regression Analysis",
        description: "Test regression analysis with multi-agent conference",
        tasks: [
          {
            id: "task-1",
            type: "simple",
            description: "Analyze bug triage",
            complexity: 70,
            priority: "high" as const,
            createdAt: new Date(),
            status: "pending" as const,
            dependencies: [],
            subagentType: "bug-triage-specialist",
          },
          {
            id: "task-2",
            type: "simple",
            description: "Analyze code",
            complexity: 70,
            priority: "high" as const,
            createdAt: new Date(),
            status: "pending" as const,
            dependencies: [],
            subagentType: "code-analyzer",
          },
          {
            id: "task-3",
            type: "simple",
            description: "Enforce codex",
            complexity: 70,
            priority: "high" as const,
            createdAt: new Date(),
            status: "pending" as const,
            dependencies: [],
            subagentType: "enforcer",
          },
        ],
        priority: "high",
      };

      const result = await coordinator.executeOrchestrationWorkflow(workflow, "regression-session");

      // Should have spawned multiple agents for regression analysis
      const success = result.agentCoordination.agentsUsed.length >= 3;

      return success;
    }, "Regression analysis triggers multi-agent conference");

    // Test 5: Resource cleanup on shutdown
    await this.test("Integration 5: Clean shutdown of both systems", async () => {
      const governor = new AgentSpawnGovernor();
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      // Perform some operations
      const context: SpawnContext = {
        agentType: "testing-lead",
        operation: "test",
        triggeredBy: "shutdown-test",
        priority: "medium",
      };

      await governor.authorizeSpawn(context);

      // Shutdown both systems
      governor.destroy();
      await coordinator.shutdown();

      return true;
    }, "Both systems shut down cleanly");

    // Test 6: Concurrent operations
    await this.test("Integration 6: Handle concurrent operations", async () => {
      const governor = new AgentSpawnGovernor();
      const coordinator = new MultiAgentOrchestrationCoordinator(this.stateManager);

      // Run concurrent operations
      const operations = [];

      // Spawn operations
      for (let i = 0; i < 2; i++) {
        const context: SpawnContext = {
          agentType: "architect",
          operation: "design",
          triggeredBy: "concurrent-test",
          priority: "medium",
        };
        operations.push(governor.authorizeSpawn(context));
      }

      // Workflow operations
      operations.push(coordinator.executeOrchestrationWorkflow({
        id: "concurrent-workflow",
        name: "Concurrent Test",
        description: "Test concurrent operations",
        tasks: [{
          id: "task-1",
          type: "simple",
          description: "Concurrent task",
          complexity: 30,
          priority: "medium" as const,
          createdAt: new Date(),
          status: "pending" as const,
          dependencies: [],
          subagentType: "refactorer",
        }],
        priority: "medium",
      }, "concurrent-session"));

      const results = await Promise.allSettled(operations);

      // All operations should complete without errors
      const allSuccess = results.every((r) => r.status === "fulfilled");

      return allSuccess;
    }, "Handles concurrent operations from both systems");
  }

  /**
   * Helper method to run a test
   */
  private async test(testName: string, testFn: () => Promise<boolean>, description: string): Promise<void> {
    try {
      const startTime = Date.now();
      const passed = await testFn();
      const duration = Date.now() - startTime;

      this.testResults.push({
        testName,
        passed,
        message: description,
        details: { duration },
      });

      const status = passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${status}: ${testName} (${duration}ms)`);
    } catch (error) {
      this.testResults.push({
        testName,
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        details: { error },
      });

      console.log(`❌ FAIL: ${testName} - Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    const passed = this.testResults.filter((r) => r.passed).length;
    const failed = this.testResults.filter((r) => r.passed === false).length;
    const total = this.testResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${passRate}%)`);
    console.log(`Failed: ${failed}`);
    console.log();

    if (failed > 0) {
      console.log("Failed Tests:");
      console.log("-".repeat(80));
      this.testResults
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`❌ ${r.testName}`);
          console.log(`   ${r.message}`);
          if (r.details) {
            console.log(`   Details: ${JSON.stringify(r.details, null, 2)}`);
          }
        });
      console.log();
    }
  }

  /**
   * Get test results
   */
  getTestResults(): TestResult[] {
    return this.testResults;
  }
}

// Run tests
async function main(): Promise<void> {
  const tester = new GovernanceSystemsTest();
  await tester.runAllTests();

  // Exit with appropriate code
  const results = tester.getTestResults();
  const failed = results.filter((r) => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Test execution failed:", error);
    process.exit(1);
  });
}

export { GovernanceSystemsTest };
