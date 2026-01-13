/**
 * StrRay Processor Pipeline MCP Server
 *
 * Advanced processor pipeline with codex validation, compliance monitoring, and framework enforcement
 */
declare class StrRayProcessorPipelineServer {
  private server;
  private codexTerms;
  constructor();
  private setupToolHandlers;
  private handlePreProcessors;
  private handlePostProcessors;
  private handleCodexValidation;
  private handleComplianceCheck;
  private sanitizeInput;
  private validateAgainstCodex;
  private checkCodexTerm;
  private enrichWithContext;
  private performSecurityChecks;
  private validateResults;
  private enforceCompliance;
  private generateAuditTrail;
  private performQualityAssurance;
  private detectContentType;
  private checkFrameworkCompliance;
  run(): Promise<void>;
}
export { StrRayProcessorPipelineServer };
//# sourceMappingURL=processor-pipeline.server.d.ts.map
