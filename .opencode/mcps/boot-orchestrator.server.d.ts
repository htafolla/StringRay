/**
 * StrRay Boot Orchestrator MCP Server
 *
 * Advanced initialization orchestration with dependency management and health monitoring
 */
declare class StrRayBootOrchestratorServer {
  private server;
  private bootStatus;
  private bootSequence;
  constructor();
  private initializeDependencies;
  private setupToolHandlers;
  private handleExecuteBootSequence;
  private handleGetBootStatus;
  private handleInitializeComponent;
  private handleValidateBootDependencies;
  private handleShutdownFramework;
  private validatePrerequisites;
  private executeParallelBoot;
  private executeSequentialBoot;
  private initializeComponent;
  private initConfiguration;
  private initLogging;
  private initStateManagement;
  private initSecurity;
  private initCodexLoader;
  private initContextLoader;
  private initProcessorPipeline;
  private initAgentRegistry;
  private initOrchestrator;
  private initMCPServers;
  private initFrameworkHooks;
  private countAgentFiles;
  private countMCPFiles;
  private getComponentStatus;
  private getOverallBootStatus;
  private validateAllDependencies;
  private checkComponentExists;
  private detectCircularDependencies;
  private applyDependencyFixes;
  private executeShutdownSequence;
  private shutdownComponent;
  private saveShutdownState;
  private formatBootResults;
  private formatComponentStatus;
  private formatOverallStatus;
  run(): Promise<void>;
}
export { StrRayBootOrchestratorServer };
//# sourceMappingURL=boot-orchestrator.server.d.ts.map
