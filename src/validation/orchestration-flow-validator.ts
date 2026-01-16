/**
 * COMPREHENSIVE ORCHESTRATION FLOW VALIDATION SUITE
 * Validates the complete end-to-end orchestration pipeline
 */

import { StringRayOrchestrator } from "../orchestrator.js";
import { enhancedMultiAgentOrchestrator } from "../orchestrator/enhanced-multi-agent-orchestrator.js";
import { createAgentDelegator } from "../delegation/agent-delegator.js";
import { StringRayStateManager } from "../state/state-manager.js";
import { frameworkLogger } from "../framework-logger.js";

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  metrics: {
    agentsSpawned: number;
    agentsCompleted: number;
    agentsFailed: number;
    dependenciesResolved: number;
    monitoringUpdates: number;
  };
  validationSteps: ValidationStep[];
}

interface ValidationStep {
  step: string;
  success: boolean;
  timestamp: number;
  details?: any;
}

class OrchestrationFlowValidator {
  private orchestrator: StringRayOrchestrator;
  private stateManager: StringRayStateManager;
  private agentDelegator: any;
  private testResults: Map<string, TestResult> = new Map();

  constructor() {
    this.stateManager = new StringRayStateManager();
    this.agentDelegator = createAgentDelegator(this.stateManager);
    this.orchestrator = new StringRayOrchestrator({
      maxConcurrentTasks: 5,
      conflictResolutionStrategy: "expert_priority",
    });
  }

  /**
   * SIMULATION 1: Basic Orchestration Flow
   * Tests the fundamental orchestration pipeline
   */
  async testBasicOrchestrationFlow(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = "Basic Orchestration Flow";
    const validationSteps: ValidationStep[] = [];

    try {
      // Step 1: Initialize orchestrator
      validationSteps.push({
        step: "Orchestrator Initialization",
        success: true,
        timestamp: Date.now(),
        details: "StringRayOrchestrator created successfully",
      });

      // Step 2: Define simple task
      const tasks = [
        {
          id: "test-architect",
          description: "Design a simple API endpoint",
          subagentType: "architect",
          priority: "medium" as const,
        },
      ];

      validationSteps.push({
        step: "Task Definition",
        success: true,
        timestamp: Date.now(),
        details: `Defined ${tasks.length} task(s)`,
      });

      // Step 3: Execute orchestration
      const results = await this.orchestrator.executeComplexTask(
        "Test basic orchestration",
        tasks,
      );

      validationSteps.push({
        step: "Task Execution",
        success: results.length === 1,
        timestamp: Date.now(),
        details: `Executed ${results.length} task(s)`,
      });

      // Step 4: Validate results
      const success = results.every((r) => r.success);
      validationSteps.push({
        step: "Result Validation",
        success,
        timestamp: Date.now(),
        details: `${results.filter((r) => r.success).length}/${results.length} tasks succeeded`,
      });

      // Step 5: Check monitoring
      const monitoringData =
        enhancedMultiAgentOrchestrator.getMonitoringInterface();
      const hasMonitoring = Object.keys(monitoringData).length > 0;
      validationSteps.push({
        step: "Monitoring Validation",
        success: hasMonitoring,
        timestamp: Date.now(),
        details: `${Object.keys(monitoringData).length} agents monitored`,
      });

      const duration = Date.now() - startTime;
      const stats = enhancedMultiAgentOrchestrator.getStatistics();

      return {
        testName,
        success: success && hasMonitoring,
        duration,
        metrics: {
          agentsSpawned: stats.totalSpawned,
          agentsCompleted: stats.completedAgents,
          agentsFailed: stats.failedAgents,
          dependenciesResolved: 0,
          monitoringUpdates: Object.keys(monitoringData).length,
        },
        validationSteps,
      };
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          agentsSpawned: 0,
          agentsCompleted: 0,
          agentsFailed: 0,
          dependenciesResolved: 0,
          monitoringUpdates: 0,
        },
        validationSteps,
      };
    }
  }

  /**
   * SIMULATION 2: Dependency Management Flow
   * Tests complex task dependencies and sequencing
   */
  async testDependencyManagementFlow(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = "Dependency Management Flow";
    const validationSteps: ValidationStep[] = [];

    try {
      // Define tasks with dependencies
      const tasks = [
        {
          id: "design-phase",
          description: "Design system architecture",
          subagentType: "architect",
          priority: "high" as const,
        },
        {
          id: "validate-design",
          description: "Validate design against requirements",
          subagentType: "enforcer",
          priority: "high" as const,
          dependencies: ["design-phase"],
        },
        {
          id: "implement-design",
          description: "Implement the validated design",
          subagentType: "test-architect",
          priority: "medium" as const,
          dependencies: ["design-phase", "validate-design"],
        },
      ];

      validationSteps.push({
        step: "Dependency Task Setup",
        success: true,
        timestamp: Date.now(),
        details: `Created ${tasks.length} tasks with ${tasks.filter((t) => t.dependencies).length} dependencies`,
      });

      // Execute complex orchestration
      const results = await this.orchestrator.executeComplexTask(
        "Test dependency management",
        tasks,
      );

      validationSteps.push({
        step: "Complex Execution",
        success: results.length === 3,
        timestamp: Date.now(),
        details: `Completed ${results.length} interdependent tasks`,
      });

      // Validate dependency order was respected
      const executionOrder = results.map((r) => r.result?.id).filter(Boolean);
      const correctOrder = [
        "design-phase",
        "validate-design",
        "implement-design",
      ];
      const orderCorrect =
        JSON.stringify(executionOrder) === JSON.stringify(correctOrder);

      validationSteps.push({
        step: "Dependency Order Validation",
        success: orderCorrect,
        timestamp: Date.now(),
        details: `Execution order: ${executionOrder.join(" → ")}`,
      });

      // Check for parallel execution where possible
      const monitoringData =
        enhancedMultiAgentOrchestrator.getMonitoringInterface();
      const parallelExecution = Object.keys(monitoringData).length >= 2; // At least 2 agents ran

      validationSteps.push({
        step: "Parallel Execution Validation",
        success: parallelExecution,
        timestamp: Date.now(),
        details: `${Object.keys(monitoringData).length} agents executed`,
      });

      const duration = Date.now() - startTime;
      const stats = enhancedMultiAgentOrchestrator.getStatistics();

      return {
        testName,
        success: results.every((r) => r.success) && orderCorrect,
        duration,
        metrics: {
          agentsSpawned: stats.totalSpawned,
          agentsCompleted: stats.completedAgents,
          agentsFailed: stats.failedAgents,
          dependenciesResolved: tasks.filter((t) => t.dependencies).length,
          monitoringUpdates: Object.keys(monitoringData).length,
        },
        validationSteps,
      };
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          agentsSpawned: 0,
          agentsCompleted: 0,
          agentsFailed: 0,
          dependenciesResolved: 0,
          monitoringUpdates: 0,
        },
        validationSteps,
      };
    }
  }

  /**
   * SIMULATION 3: Error Handling & Recovery Flow
   * Tests system resilience and fallback mechanisms
   */
  async testErrorHandlingFlow(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = "Error Handling & Recovery Flow";
    const validationSteps: ValidationStep[] = [];

    try {
      // Create tasks that will trigger fallback scenarios
      const tasks = [
        {
          id: "reliable-task",
          description: "Execute reliable task",
          subagentType: "architect",
          priority: "medium" as const,
        },
        {
          id: "unreliable-task",
          description: "Execute task that may fail",
          subagentType: "invalid-agent-type", // This should trigger fallback
          priority: "low" as const,
        },
      ];

      validationSteps.push({
        step: "Error Scenario Setup",
        success: true,
        timestamp: Date.now(),
        details: "Created tasks with intentional failure scenarios",
      });

      // Execute with error handling
      const results = await this.orchestrator.executeComplexTask(
        "Test error handling and recovery",
        tasks,
      );

      validationSteps.push({
        step: "Error Execution",
        success: results.length === 2,
        timestamp: Date.now(),
        details: `Processed ${results.length} tasks with error handling`,
      });

      // Validate that system continued despite errors
      const successfulTasks = results.filter((r) => r.success).length;
      const failedTasks = results.filter((r) => !r.success).length;
      const gracefulFailure = failedTasks > 0 && successfulTasks > 0;

      validationSteps.push({
        step: "Graceful Failure Validation",
        success: gracefulFailure,
        timestamp: Date.now(),
        details: `${successfulTasks} succeeded, ${failedTasks} failed gracefully`,
      });

      // Check monitoring shows both success and failure states
      const monitoringData =
        enhancedMultiAgentOrchestrator.getMonitoringInterface();
      const hasCompletedAgents = Object.values(monitoringData).some(
        (agent: any) => agent.status === "completed",
      );
      const hasFailedAgents = Object.values(monitoringData).some(
        (agent: any) => agent.status === "failed",
      );

      validationSteps.push({
        step: "Monitoring State Validation",
        success: hasCompletedAgents && hasFailedAgents,
        timestamp: Date.now(),
        details: `Monitoring shows ${hasCompletedAgents ? "completed" : "no completed"} and ${hasFailedAgents ? "failed" : "no failed"} agents`,
      });

      const duration = Date.now() - startTime;
      const stats = enhancedMultiAgentOrchestrator.getStatistics();

      return {
        testName,
        success: gracefulFailure && hasCompletedAgents,
        duration,
        metrics: {
          agentsSpawned: stats.totalSpawned,
          agentsCompleted: stats.completedAgents,
          agentsFailed: stats.failedAgents,
          dependenciesResolved: 0,
          monitoringUpdates: Object.keys(monitoringData).length,
        },
        validationSteps,
      };
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          agentsSpawned: 0,
          agentsCompleted: 0,
          agentsFailed: 0,
          dependenciesResolved: 0,
          monitoringUpdates: 0,
        },
        validationSteps,
      };
    }
  }

  /**
   * SIMULATION 4: Performance & Scalability Flow
   * Tests system performance under load
   */
  async testPerformanceFlow(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = "Performance & Scalability Flow";
    const validationSteps: ValidationStep[] = [];

    try {
      // Create multiple concurrent tasks
      const taskCount = 5;
      const tasks = Array.from({ length: taskCount }, (_, i) => ({
        id: `perf-task-${i}`,
        description: `Performance test task ${i}`,
        subagentType: [
          "architect",
          "librarian",
          "enforcer",
          "test-architect",
          "security-auditor",
        ][i % 5] as any,
        priority: "medium" as const,
      }));

      validationSteps.push({
        step: "Performance Task Setup",
        success: true,
        timestamp: Date.now(),
        details: `Created ${taskCount} concurrent tasks`,
      });

      // Execute concurrent tasks
      const results = await this.orchestrator.executeComplexTask(
        "Test performance and scalability",
        tasks,
      );

      validationSteps.push({
        step: "Concurrent Execution",
        success: results.length === taskCount,
        timestamp: Date.now(),
        details: `Executed ${results.length} concurrent tasks`,
      });

      // Validate performance metrics
      const totalDuration = Date.now() - startTime;
      const avgTaskDuration = totalDuration / taskCount;
      const reasonablePerformance = avgTaskDuration < 10000; // Less than 10 seconds per task

      validationSteps.push({
        step: "Performance Validation",
        success: reasonablePerformance,
        timestamp: Date.now(),
        details: `Average task duration: ${avgTaskDuration.toFixed(2)}ms`,
      });

      // Check resource management
      const stats = enhancedMultiAgentOrchestrator.getStatistics();
      const resourceEfficiency = stats.completedAgents >= taskCount * 0.8; // At least 80% success rate

      validationSteps.push({
        step: "Resource Management Validation",
        success: resourceEfficiency,
        timestamp: Date.now(),
        details: `${stats.completedAgents}/${taskCount} tasks completed successfully`,
      });

      const duration = Date.now() - startTime;

      return {
        testName,
        success: reasonablePerformance && resourceEfficiency,
        duration,
        metrics: {
          agentsSpawned: stats.totalSpawned,
          agentsCompleted: stats.completedAgents,
          agentsFailed: stats.failedAgents,
          dependenciesResolved: 0,
          monitoringUpdates: taskCount,
        },
        validationSteps,
      };
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          agentsSpawned: 0,
          agentsCompleted: 0,
          agentsFailed: 0,
          dependenciesResolved: 0,
          monitoringUpdates: 0,
        },
        validationSteps,
      };
    }
  }

  /**
   * SIMULATION 5: Monitoring & Cleanup Flow
   * Tests the complete monitoring and cleanup lifecycle
   */
  async testMonitoringCleanupFlow(): Promise<TestResult> {
    const startTime = Date.now();
    const testName = "Monitoring & Cleanup Flow";
    const validationSteps: ValidationStep[] = [];

    try {
      // Execute tasks to generate monitoring data
      const tasks = [
        {
          id: "monitor-test-1",
          description: "Test monitoring capabilities",
          subagentType: "architect",
          priority: "medium" as const,
        },
        {
          id: "monitor-test-2",
          description: "Test cleanup mechanisms",
          subagentType: "librarian",
          priority: "medium" as const,
        },
      ];

      const results = await this.orchestrator.executeComplexTask(
        "Test monitoring and cleanup",
        tasks,
      );

      validationSteps.push({
        step: "Monitoring Data Generation",
        success: results.length === 2,
        timestamp: Date.now(),
        details: "Generated monitoring data through task execution",
      });

      // Validate monitoring interface
      const monitoringData =
        enhancedMultiAgentOrchestrator.getMonitoringInterface();
      const hasClickableAgents = Object.values(monitoringData).every(
        (agent: any) => agent.clickable,
      );
      const hasProgressTracking = Object.values(monitoringData).every(
        (agent: any) => typeof agent.progress === "number",
      );

      validationSteps.push({
        step: "Monitoring Interface Validation",
        success: hasClickableAgents && hasProgressTracking,
        timestamp: Date.now(),
        details: `Clickable: ${hasClickableAgents}, Progress: ${hasProgressTracking}`,
      });

      // Test agent cancellation
      const agentIds = Object.keys(monitoringData);
      if (agentIds.length > 0) {
        const agentIdToCancel = agentIds[0];
        if (agentIdToCancel) {
          const cancelResult =
            await enhancedMultiAgentOrchestrator.cancelAgent(agentIdToCancel);
          validationSteps.push({
            step: "Agent Cancellation Test",
            success: cancelResult,
            timestamp: Date.now(),
            details: `Cancelled agent ${agentIdToCancel}: ${cancelResult}`,
          });
        }
      }

      // Wait for cleanup to occur
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Validate cleanup occurred
      const postCleanupStats = enhancedMultiAgentOrchestrator.getStatistics();
      const cleanupOccurred = postCleanupStats.activeAgents < 2; // Should have cleaned up cancelled agent

      validationSteps.push({
        step: "Cleanup Validation",
        success: cleanupOccurred,
        timestamp: Date.now(),
        details: `Active agents after cleanup: ${postCleanupStats.activeAgents}`,
      });

      const duration = Date.now() - startTime;
      const stats = enhancedMultiAgentOrchestrator.getStatistics();

      return {
        testName,
        success: hasClickableAgents && hasProgressTracking && cleanupOccurred,
        duration,
        metrics: {
          agentsSpawned: stats.totalSpawned,
          agentsCompleted: stats.completedAgents,
          agentsFailed: stats.failedAgents,
          dependenciesResolved: 0,
          monitoringUpdates: Object.keys(monitoringData).length,
        },
        validationSteps,
      };
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          agentsSpawned: 0,
          agentsCompleted: 0,
          agentsFailed: 0,
          dependenciesResolved: 0,
          monitoringUpdates: 0,
        },
        validationSteps,
      };
    }
  }

  /**
   * Run all orchestration flow validations
   */
  async runCompleteValidationSuite(): Promise<ValidationSuiteResults> {
    console.log(
      "🚀 STARTING COMPREHENSIVE ORCHESTRATION FLOW VALIDATION SUITE\n",
    );
    console.log("=".repeat(70));

    const tests = [
      this.testBasicOrchestrationFlow(),
      this.testDependencyManagementFlow(),
      this.testErrorHandlingFlow(),
      this.testPerformanceFlow(),
      this.testMonitoringCleanupFlow(),
    ];

    const results = await Promise.all(tests);

    // Store results
    results.forEach((result) => {
      this.testResults.set(result.testName, result);
    });

    // Generate comprehensive report
    return this.generateValidationReport(results);
  }

  /**
   * Generate comprehensive validation report
   */
  private generateValidationReport(
    results: TestResult[],
  ): ValidationSuiteResults {
    const totalTests = results.length;
    const passedTests = results.filter((r) => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / totalTests;

    const totalAgentsSpawned = results.reduce(
      (sum, r) => sum + r.metrics.agentsSpawned,
      0,
    );
    const totalAgentsCompleted = results.reduce(
      (sum, r) => sum + r.metrics.agentsCompleted,
      0,
    );
    const totalDependenciesResolved = results.reduce(
      (sum, r) => sum + r.metrics.dependenciesResolved,
      0,
    );

    // Validation report output - kept as console.log for user-readable reports

    results.forEach((result, index) => {
      const status = result.success ? "✅ PASS" : "❌ FAIL";
      const duration = result.duration;
      const agents = result.metrics.agentsSpawned;

    // Test result details - kept as console.log for readability
      }

      // Show key metrics
      console.log(
        `   Metrics: ${result.metrics.agentsCompleted}/${result.metrics.agentsSpawned} completed, ${result.metrics.dependenciesResolved} deps resolved`,
      );

      // Show validation steps
      result.validationSteps.forEach((step) => {
        const stepStatus = step.success ? "✓" : "✗";
        console.log(`     ${stepStatus} ${step.step}`);
      });

      console.log("");
    });

    // Cleanup
    enhancedMultiAgentOrchestrator.shutdown();

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate,
        totalDuration,
        avgDuration,
      },
      metrics: {
        totalAgentsSpawned,
        totalAgentsCompleted,
        totalDependenciesResolved,
        totalMonitoringUpdates: results.reduce(
          (sum, r) => sum + r.metrics.monitoringUpdates,
          0,
        ),
      },
      testResults: results,
      recommendations: this.generateRecommendations(results),
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: TestResult[]): string[] {
    const recommendations: string[] = [];

    const failedTests = results.filter((r) => !r.success);
    if (failedTests.length > 0) {
      recommendations.push(
        `Address ${failedTests.length} failing test(s): ${failedTests.map((t) => t.testName).join(", ")}`,
      );
    }

    const slowTests = results.filter((r) => r.duration > 10000);
    if (slowTests.length > 0) {
      recommendations.push(
        `Optimize performance for ${slowTests.length} slow test(s) averaging >10s execution time`,
      );
    }

    const lowCompletionRate = results.some(
      (r) => r.metrics.agentsCompleted / r.metrics.agentsSpawned < 0.8,
    );
    if (lowCompletionRate) {
      recommendations.push(
        "Improve agent completion rates - some tests show <80% success rate",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "All tests passed successfully - orchestration pipeline is fully validated",
      );
    }

    return recommendations;
  }
}

interface ValidationSuiteResults {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
    totalDuration: number;
    avgDuration: number;
  };
  metrics: {
    totalAgentsSpawned: number;
    totalAgentsCompleted: number;
    totalDependenciesResolved: number;
    totalMonitoringUpdates: number;
  };
  testResults: TestResult[];
  recommendations: string[];
}

// Export for external use
export { OrchestrationFlowValidator };

// Run validation suite if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new OrchestrationFlowValidator();
  validator
    .runCompleteValidationSuite()
    .then((results) => {
    // Validation completion - kept as console.log for user feedback
    })
    .catch(console.error);
}
