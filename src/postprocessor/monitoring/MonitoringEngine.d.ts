/**
 * Post-Processor Monitoring Engine
 */
import { StringRayStateManager } from "../../state/state-manager";
import { SessionMonitor } from "../../session/session-monitor";
import { MonitoringResult } from "../types";
export declare class PostProcessorMonitoringEngine {
    private stateManager;
    private sessionMonitor?;
    constructor(stateManager: StringRayStateManager, sessionMonitor?: SessionMonitor | undefined);
    initialize(): Promise<void>;
    monitorDeployment(commitSha: string): Promise<MonitoringResult>;
    private checkCIStatus;
    private checkPerformanceStatus;
    private checkSecurityStatus;
    private determineOverallStatus;
    getStatus(): Promise<any>;
}
//# sourceMappingURL=MonitoringEngine.d.ts.map