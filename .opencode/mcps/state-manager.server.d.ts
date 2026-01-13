/**
 * StrRay State Manager MCP Server
 *
 * Advanced state management with persistence, synchronization, and conflict resolution
 */
declare class StrRayStateManagerServer {
  private server;
  private state;
  private stateFile;
  private backups;
  constructor();
  private ensureStateDirectory;
  private loadState;
  private saveState;
  private setupToolHandlers;
  private handleGetState;
  private handleSetState;
  private handleDeleteState;
  private handleListState;
  private handleBackupState;
  private handleRestoreState;
  private handleValidateState;
  private validateStateValue;
  private repairStateValue;
  private findDependentKeys;
  run(): Promise<void>;
}
export { StrRayStateManagerServer };
//# sourceMappingURL=state-manager.server.d.ts.map
