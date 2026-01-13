/**
 * StrRay Enforcer Tools MCP Server
 *
 * Converts enforcer-tools.ts functions into MCP server tools
 * Provides rule enforcement and validation capabilities via MCP protocol
 */
declare class StrRayEnforcerToolsServer {
  private server;
  constructor();
  private setupToolHandlers;
  private ruleValidation;
  private codexEnforcement;
  private contextAnalysisValidation;
  private qualityGateCheck;
  private getEnforcementStatus;
  private runPreCommitValidation;
  private simulateRuleValidation;
  private simulateCodexValidation;
  private simulateContextValidation;
  private performQualityGateCheck;
  private simulateEnforcementStatus;
  private performPreCommitValidation;
  run(): Promise<void>;
}
export default StrRayEnforcerToolsServer;
//# sourceMappingURL=enforcer-tools.server.d.ts.map
