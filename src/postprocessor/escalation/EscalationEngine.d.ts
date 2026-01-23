/**
 * Escalation Engine for Post-Processor
 * Handles incident reporting, manual intervention triggers, and alerting
 */
import { PostProcessorContext, EscalationResult, IncidentReport } from "../types";
export interface EscalationConfig {
    manualInterventionThreshold: number;
    rollbackThreshold: number;
    emergencyThreshold: number;
    alertChannels: string[];
    incidentReporting: boolean;
}
export interface AlertMessage {
    level: "info" | "warning" | "error" | "critical";
    title: string;
    message: string;
    context: PostProcessorContext;
    metadata?: any;
}
export declare class EscalationEngine {
    private config;
    private incidents;
    constructor(config?: Partial<EscalationConfig>);
    /**
     * Evaluate if escalation is needed based on failure context
     */
    evaluateEscalation(context: PostProcessorContext, attempts: number, error: string, monitoringResults: any[]): Promise<EscalationResult | null>;
    /**
     * Create a detailed incident report
     */
    private createIncidentReport;
    /**
     * Send alerts through configured channels
     */
    private sendAlerts;
    /**
     * Send alert to specific channel
     */
    private sendAlertToChannel;
    /**
     * Get emoji for alert level
     */
    private getAlertEmoji;
    /**
     * Map escalation level to severity
     */
    private mapLevelToSeverity;
    /**
     * Map escalation level to alert level
     */
    private mapLevelToAlertLevel;
    /**
     * Get incident report by ID
     */
    getIncidentReport(incidentId: string): IncidentReport | undefined;
    /**
     * Get all active incidents
     */
    getActiveIncidents(): IncidentReport[];
    /**
     * Resolve an incident
     */
    resolveIncident(incidentId: string, resolution: string): boolean;
    /**
     * Get escalation statistics
     */
    getStats(): {
        totalIncidents: number;
        activeIncidents: number;
        escalationsByLevel: Record<string, number>;
    };
}
//# sourceMappingURL=EscalationEngine.d.ts.map