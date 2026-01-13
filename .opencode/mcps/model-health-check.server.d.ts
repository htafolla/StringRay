/**
 * StrRay Model Health Check MCP Server
 *
 * Advanced model compatibility validation and dynamic health assessment
 */
declare class StrRayModelHealthCheckServer {
  private server;
  constructor();
  private setupToolHandlers;
  private handleModelHealthCheck;
  private checkModelHealth;
  private generateCompatibilityMatrix;
  private generateHealthReport;
  start(): Promise<void>;
}
export default StrRayModelHealthCheckServer;
//# sourceMappingURL=model-health-check.server.d.ts.map
