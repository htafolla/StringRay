/**
 * StrRay Lint MCP Server
 *
 * Comprehensive ESLint validation and automated code quality checking
 */
declare class StrRayLintServer {
  private server;
  constructor();
  private setupToolHandlers;
  private handleLint;
  private handleLintCheck;
  private runEslint;
  private checkLintRules;
  private generateLintSummary;
  run(): Promise<void>;
}
export { StrRayLintServer };
//# sourceMappingURL=lint.server.d.ts.map
