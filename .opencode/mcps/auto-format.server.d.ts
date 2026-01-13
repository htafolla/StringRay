/**
 * StrRay Auto Format MCP Server
 *
 * Automated code formatting hook with Prettier and framework-specific formatters
 */
declare class StrRayAutoFormatServer {
  private server;
  constructor();
  private setupToolHandlers;
  private handleAutoFormat;
  private handleFormatCheck;
  private runPrettier;
  private runEslintFix;
  private runTypeScriptFormat;
  private checkFormatting;
  private generateFormatSummary;
  run(): Promise<void>;
}
export { StrRayAutoFormatServer };
//# sourceMappingURL=auto-format.server.d.ts.map
