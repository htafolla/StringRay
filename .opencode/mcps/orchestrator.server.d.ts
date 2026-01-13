/**
 * StrRay Orchestrator MCP Server
 *
 * Enterprise-grade orchestration with advanced task management and agent coordination
 */
declare class StrRayOrchestratorServer {
  private server;
  private activeTasks;
  private taskHistory;
  private agentCapabilities;
  constructor();
  private initializeAgentCapabilities;
  private setupToolHandlers;
  private handleOrchestrateTask;
  private handleAnalyzeComplexity;
  private handleGetOrchestrationStatus;
  private handleCancelOrchestration;
  private handleOptimizeOrchestration;
  private validateTasks;
  private createExecutionPlan;
  private selectAgentForTask;
  private executeOrchestrationPlan;
  private simulateTaskExecution;
  private analyzeTaskComplexity;
  private calculateTaskComplexity;
  private estimateExecutionDuration;
  private calculateParallelPotential;
  private generateComplexityRecommendations;
  private getOverallOrchestrationStatus;
  private calculateAgentUtilization;
  private calculateSystemLoad;
  private cancelSession;
  private cancelSpecificTask;
  private analyzeOrchestrationPatterns;
  private formatOrchestrationStatus;
  run(): Promise<void>;
}
export { StrRayOrchestratorServer };
//# sourceMappingURL=orchestrator.server.d.ts.map
