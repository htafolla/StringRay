/**
 * Tests for Enhanced Multi-Agent Orchestrator type interfaces
 *
 * @version 1.0.0
 * @since 2026-03-23
 */

import { describe, it, expect } from "vitest";
import {
  AgentSpawnRequest,
  AgentExecutionResult,
  SpawnedAgent,
  AgentOrchestrationState,
  ExecutionContext,
  OrchestrationDelegationRequest,
  OrchestrationDelegationResult,
} from "./enhanced-multi-agent-orchestrator.js";

describe("Enhanced Multi-Agent Orchestrator Interfaces", () => {
  describe("AgentSpawnRequest", () => {
    it("should define minimal spawn request", () => {
      const request: AgentSpawnRequest = {
        agentType: "testing-lead",
        task: "Run test suite",
      };

      expect(request.agentType).toBe("testing-lead");
      expect(request.task).toBe("Run test suite");
    });

    it("should include optional context and priority", () => {
      const request: AgentSpawnRequest = {
        agentType: "refactorer",
        task: "Optimize code",
        context: { complexity: 5 },
        priority: "high",
        timeout: 30000,
        dependencies: ["task-1"],
      };

      expect(request.context).toBeDefined();
      expect(request.priority).toBe("high");
      expect(request.timeout).toBe(30000);
      expect(request.dependencies).toEqual(["task-1"]);
    });

    it("should support all priority levels", () => {
      const priorities: AgentSpawnRequest["priority"][] = [
        "low",
        "medium",
        "high",
        "critical",
      ];

      priorities.forEach((priority) => {
        const request: AgentSpawnRequest = {
          agentType: "agent",
          task: "task",
          priority,
        };
        expect(request.priority).toBe(priority);
      });
    });
  });

  describe("AgentExecutionResult", () => {
    it("should represent successful execution", () => {
      const result: AgentExecutionResult = {
        success: true,
        agentType: "testing-lead",
        task: "Run tests",
        executionTime: 5000,
        complexity: 25,
        result: { testsRun: 100, passed: 95 },
      };

      expect(result.success).toBe(true);
      expect(result.executionTime).toBe(5000);
    });

    it("should include delegation result if available", () => {
      const result: AgentExecutionResult = {
        success: true,
        agentType: "refactorer",
        task: "Refactor",
        delegationResult: {
          success: true,
          totalTime: 3000,
        },
      };

      expect(result.delegationResult).toBeDefined();
    });
  });

  describe("SpawnedAgent", () => {
    it("should track agent lifecycle status", () => {
      const statuses: SpawnedAgent["status"][] = [
        "spawning",
        "active",
        "completed",
        "failed",
        "cancelled",
      ];

      statuses.forEach((status) => {
        const agent: SpawnedAgent = {
          id: "agent-1",
          agentType: "testing-lead",
          task: "Test task",
          status,
          startTime: Date.now(),
          progress: status === "completed" ? 100 : status === "spawning" ? 0 : 50,
          clickable: true,
          monitorable: true,
          cleanupRequired: true,
        };
        expect(agent.status).toBe(status);
      });
    });

    it("should include result on completion", () => {
      const agent: SpawnedAgent = {
        id: "agent-2",
        agentType: "orchestrator",
        task: "Coordinate",
        status: "completed",
        startTime: Date.now(),
        endTime: Date.now(),
        progress: 100,
        result: {
          success: true,
          agentType: "orchestrator",
          task: "Coordinate",
          executionTime: 10000,
        },
        clickable: true,
        monitorable: true,
        cleanupRequired: true,
      };

      expect(agent.status).toBe("completed");
      expect(agent.result).toBeDefined();
      expect(agent.endTime).toBeDefined();
    });

    it("should include error on failure", () => {
      const agent: SpawnedAgent = {
        id: "agent-3",
        agentType: "testing-lead",
        task: "Test",
        status: "failed",
        startTime: Date.now(),
        endTime: Date.now(),
        error: "Connection timeout",
        progress: 30,
        clickable: true,
        monitorable: true,
        cleanupRequired: true,
      };

      expect(agent.status).toBe("failed");
      expect(agent.error).toBe("Connection timeout");
    });
  });

  describe("AgentOrchestrationState", () => {
    it("should track multiple agent pools", () => {
      const state: AgentOrchestrationState = {
        activeAgents: new Map(),
        pendingSpawns: [],
        completedAgents: new Map(),
        failedAgents: new Map(),
        agentDependencies: new Map(),
        monitoringEnabled: true,
        cleanupInterval: 300000,
        isMainOrchestrator: true,
      };

      expect(state.activeAgents).toBeInstanceOf(Map);
      expect(state.monitoringEnabled).toBe(true);
      expect(state.isMainOrchestrator).toBe(true);
    });
  });

  describe("ExecutionContext", () => {
    it("should track execution stack", () => {
      const context: ExecutionContext = {
        isExecutingAsSubagent: false,
        currentAgentId: "main-orchestrator",
        spawnStack: [],
      };

      expect(context.isExecutingAsSubagent).toBe(false);
      expect(context.spawnStack).toEqual([]);
    });

    it("should indicate subagent execution", () => {
      const context: ExecutionContext = {
        isExecutingAsSubagent: true,
        currentAgentId: "sub-agent-1",
        spawnStack: ["main-orchestrator"],
      };

      expect(context.isExecutingAsSubagent).toBe(true);
      expect(context.spawnStack).toContain("main-orchestrator");
    });
  });

  describe("OrchestrationDelegationRequest", () => {
    it("should define delegation request", () => {
      const request: OrchestrationDelegationRequest = {
        operation: "execute",
        description: "Run comprehensive test suite",
        context: {
          priority: "high",
        },
      };

      expect(request.operation).toBe("execute");
      expect(request.description).toBeDefined();
    });
  });

  describe("OrchestrationDelegationResult", () => {
    it("should represent successful delegation", () => {
      const result: OrchestrationDelegationResult = {
        success: true,
        results: [
          { agent: "agent-1", output: "Task completed", executionTime: 1000 },
          { agent: "agent-2", output: "Analysis done", executionTime: 500 },
        ],
        totalTime: 1500,
        agents: ["agent-1", "agent-2"],
      };

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.totalTime).toBe(1500);
    });

    it("should handle delegation with errors", () => {
      const result: OrchestrationDelegationResult = {
        success: false,
        results: [
          { agent: "agent-1", output: "Task completed", executionTime: 1000 },
        ],
        totalTime: 1000,
        errors: ["Agent agent-2 failed: timeout"],
      };

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
