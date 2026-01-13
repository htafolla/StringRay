/**
 * StrRay Security Scan MCP Server
 *
 * Automated security vulnerability scanning with dependency and code analysis
 */
declare class StrRaySecurityScanServer {
  private server;
  constructor();
  private setupToolHandlers;
  private handleSecurityScan;
  private handleDependencyAudit;
  private scanDependencies;
  private scanCodeSecurity;
  private findCodeFiles;
  private analyzeFileForSecurity;
  private generateSecuritySummary;
  run(): Promise<void>;
}
export { StrRaySecurityScanServer };
//# sourceMappingURL=security-scan.server.d.ts.map
