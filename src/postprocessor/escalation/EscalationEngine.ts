/**
 * Escalation Engine for Post-Processor
 * Handles incident reporting, manual intervention triggers, and alerting
 */

import {
  PostProcessorContext,
  EscalationResult,
  IncidentReport,
  EventTimeline,
} from "../types.js";

export interface EscalationConfig {
  manualInterventionThreshold: number;
  rollbackThreshold: number;
  emergencyThreshold: number;
  alertChannels: string[];
  incidentReporting: boolean;
  reportingEndpoints?: ReportingEndpoint[];
}

export interface ReportingEndpoint {
  name: string;
  url: string;
  type: "webhook" | "pagerduty" | "slack" | "email" | "custom";
  enabled: boolean;
  priorityThreshold?: "low" | "medium" | "high" | "critical";
  headers?: Record<string, string>;
}

export interface AlertMessage {
  level: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  context: PostProcessorContext;
  metadata?: any;
}

export interface IncidentReportPayload {
  incident: IncidentReport;
  formattedMessage: string;
  affectedSystems: string[];
  recommendedActions: string[];
}

export class EscalationEngine {
  private config: EscalationConfig;
  private incidents: Map<string, IncidentReport> = new Map();
  private reportingHistory: Array<{
    incidentId: string;
    endpoint: string;
    success: boolean;
    timestamp: number;
    response?: string;
  }> = [];

  constructor(config: Partial<EscalationConfig> = {}) {
    this.config = {
      manualInterventionThreshold: 2,
      rollbackThreshold: 3,
      emergencyThreshold: 5,
      alertChannels: ["console", "log"],
      incidentReporting: true,
      ...config,
    };
  }

  /**
   * Evaluate if escalation is needed based on failure context
   */
  async evaluateEscalation(
    context: PostProcessorContext,
    attempts: number,
    error: string,
    monitoringResults: any[],
  ): Promise<EscalationResult | null> {
    let escalationLevel: "manual-intervention" | "rollback" | "emergency";
    let reason: string;
    let recommendations: string[];

    if (attempts >= this.config.emergencyThreshold) {
      escalationLevel = "emergency";
      reason = `Emergency threshold exceeded (${attempts}/${this.config.emergencyThreshold} attempts)`;
      recommendations = [
        "Immediate manual intervention required",
        "Consider rolling back to previous stable version",
        "Escalate to senior engineering team",
        "Review deployment pipeline for systemic issues",
      ];
    } else if (attempts >= this.config.rollbackThreshold) {
      escalationLevel = "rollback";
      reason = `Rollback threshold exceeded (${attempts}/${this.config.rollbackThreshold} attempts)`;
      recommendations = [
        "Automatic rollback initiated",
        "Review fix validation logic",
        "Check for environmental issues",
        "Monitor system stability post-rollback",
      ];
    } else if (attempts >= this.config.manualInterventionThreshold) {
      escalationLevel = "manual-intervention";
      reason = `Manual intervention threshold exceeded (${attempts}/${this.config.manualInterventionThreshold} attempts)`;
      recommendations = [
        "Human review of failure analysis required",
        "Verify auto-fix confidence scores",
        "Check deployment environment health",
        "Consider temporary deployment pause",
      ];
    } else {
      // No escalation needed
      return null;
    }

    const incidentReport = await this.createIncidentReport(
      context,
      escalationLevel,
      reason,
      error,
      attempts,
      monitoringResults,
    );

    // Send alerts
    await this.sendAlerts(escalationLevel, context, reason, recommendations);

    return {
      level: escalationLevel,
      reason,
      recommendations,
      incidentReport,
    };
  }

  /**
   * Create a detailed incident report
   */
  private async createIncidentReport(
    context: PostProcessorContext,
    level: string,
    reason: string,
    error: string,
    attempts: number,
    monitoringResults: any[],
  ): Promise<IncidentReport> {
    const incidentId = `incident-${context.commitSha}-${Date.now()}`;

    const timeline: EventTimeline[] = [
      {
        timestamp: new Date(),
        event: "Incident Created",
        details: `Post-processor escalation triggered: ${reason}`,
      },
      {
        timestamp: new Date(Date.now() - attempts * 60000), // Estimate start time
        event: "Post-Processor Started",
        details: `Started monitoring commit ${context.commitSha}`,
      },
    ];

    // Add monitoring results to timeline
    monitoringResults.forEach((result, index) => {
      timeline.push({
        timestamp: new Date(result.timestamp),
        event: `Monitoring Attempt ${index + 1}`,
        details: `Status: ${result.overallStatus}, Duration: ${result.duration}ms`,
      });
    });

    const incidentReport: IncidentReport = {
      id: incidentId,
      commitSha: context.commitSha,
      timestamp: new Date(),
      severity: this.mapLevelToSeverity(level),
      affectedSystems: ["ci-cd-pipeline", "deployment-system"],
      rootCause: error,
      impact: `CI/CD pipeline failures preventing deployment of commit ${context.commitSha}`,
      resolution: "Pending manual intervention",
      timeline,
    };

    this.incidents.set(incidentId, incidentReport);

    if (this.config.incidentReporting) {
      await this.reportIncidentToExternalSystems(incidentReport);
    }

    return incidentReport;
  }

  /**
   * Report incident to configured external systems
   */
  private async reportIncidentToExternalSystems(incident: IncidentReport): Promise<void> {
    const endpoints = this.config.reportingEndpoints || [];

    if (endpoints.length === 0) {
      console.log(`[EscalationEngine] Incident ${incident.id} created (no external endpoints configured)`);
      return;
    }

    const severityLevel = incident.severity;
    const priorityOrder = ["low", "medium", "high", "critical"];
    const incidentPriorityIndex = priorityOrder.indexOf(severityLevel);

    for (const endpoint of endpoints) {
      if (!endpoint.enabled) continue;

      const thresholdIndex = priorityOrder.indexOf(endpoint.priorityThreshold || "low");
      if (incidentPriorityIndex < thresholdIndex) continue;

      try {
        const success = await this.sendToEndpoint(endpoint, incident);
        this.reportingHistory.push({
          incidentId: incident.id,
          endpoint: endpoint.name,
          success,
          timestamp: Date.now(),
        });

        if (success) {
          console.log(`[EscalationEngine] Incident ${incident.id} reported to ${endpoint.name}`);
        }
      } catch (error) {
        this.reportingHistory.push({
          incidentId: incident.id,
          endpoint: endpoint.name,
          success: false,
          timestamp: Date.now(),
          response: String(error),
        });
        console.error(`[EscalationEngine] Failed to report incident to ${endpoint.name}:`, error);
      }
    }
  }

  /**
   * Send incident to a specific endpoint
   */
  private async sendToEndpoint(endpoint: ReportingEndpoint, incident: IncidentReport): Promise<boolean> {
    const payload = this.buildIncidentPayload(incident);

    switch (endpoint.type) {
      case "slack":
        return this.sendToSlack(endpoint, payload);
      case "pagerduty":
        return this.sendToPagerDuty(endpoint, payload);
      case "webhook":
        return this.sendWebhook(endpoint, payload);
      case "email":
        return this.sendEmail(endpoint, payload);
      default:
        return this.sendWebhook(endpoint, payload);
    }
  }

  /**
   * Build incident payload for reporting
   */
  private buildIncidentPayload(incident: IncidentReport): IncidentReportPayload {
    return {
      incident,
      formattedMessage: this.formatIncidentMessage(incident),
      affectedSystems: incident.affectedSystems,
      recommendedActions: this.getRecommendedActions(incident.severity),
    };
  }

  /**
   * Format incident message for external systems
   */
  private formatIncidentMessage(incident: IncidentReport): string {
    const lines = [
      `🚨 Incident Report: ${incident.id}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Severity: ${incident.severity.toUpperCase()}`,
      `Time: ${incident.timestamp instanceof Date ? incident.timestamp.toISOString() : incident.timestamp}`,
      `Commit: ${incident.commitSha}`,
      ``,
      `Impact: ${incident.impact}`,
      `Root Cause: ${incident.rootCause}`,
      ``,
      `Timeline:`,
      ...incident.timeline.map(
        (t) =>
          `  • ${t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp} - ${t.event}: ${t.details}`
      ),
      ``,
      `Resolution: ${incident.resolution}`,
    ];

    return lines.join("\n");
  }

  /**
   * Get recommended actions based on severity
   */
  private getRecommendedActions(severity: string): string[] {
    switch (severity) {
      case "critical":
        return [
          "Immediately notify on-call engineer",
          "Begin incident response procedure",
          "Consider rolling back to last stable version",
          "Notify engineering leadership",
        ];
      case "high":
        return [
          "Notify development team lead",
          "Begin root cause analysis",
          "Prepare rollback plan if needed",
          "Schedule post-mortem review",
        ];
      case "medium":
        return [
          "Add to sprint backlog",
          "Assign to appropriate developer",
          "Schedule code review",
        ];
      default:
        return [
          "Document in issue tracker",
          "Review during next sprint planning",
        ];
    }
  }

  /**
   * Send to Slack webhook
   */
  private async sendToSlack(endpoint: ReportingEndpoint, payload: IncidentReportPayload): Promise<boolean> {
    const body = {
      text: payload.formattedMessage,
      attachments: [
        {
          color: this.getSeverityColor(payload.incident.severity),
          fields: [
            { title: "Severity", value: payload.incident.severity, short: true },
            { title: "Commit", value: payload.incident.commitSha, short: true },
          ],
        },
      ],
    };

    return this.sendWebhook(endpoint, body);
  }

  /**
   * Send to PagerDuty
   */
  private async sendToPagerDuty(endpoint: ReportingEndpoint, payload: IncidentReportPayload): Promise<boolean> {
    const body = {
      routing_key: endpoint.headers?.["routing-key"] || "",
      event_action: "trigger",
      payload: {
        summary: `[${payload.incident.severity.toUpperCase()}] ${payload.incident.impact}`,
        severity: payload.incident.severity === "critical" ? "critical" : "error",
        source: "StringRay EscalationEngine",
        timestamp: payload.incident.timestamp instanceof Date
          ? payload.incident.timestamp.toISOString()
          : new Date().toISOString(),
        custom_details: {
          incident_id: payload.incident.id,
          commit_sha: payload.incident.commitSha,
          root_cause: payload.incident.rootCause,
          affected_systems: payload.incident.affectedSystems.join(", "),
          recommended_actions: payload.recommendedActions.join("\n"),
        },
      },
    };

    return this.sendWebhook(endpoint, body);
  }

  /**
   * Send generic webhook
   */
  private async sendWebhook(endpoint: ReportingEndpoint, payload: any): Promise<boolean> {
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...endpoint.headers,
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error(`Webhook failed: ${error}`);
      return false;
    }
  }

  /**
   * Send email notification (placeholder - would need SMTP configuration)
   */
  private async sendEmail(endpoint: ReportingEndpoint, payload: IncidentReportPayload): Promise<boolean> {
    console.log(`[EscalationEngine] Email notification would be sent to ${endpoint.url}`);
    console.log(`Subject: [${payload.incident.severity.toUpperCase()}] Incident ${payload.incident.id}`);
    console.log(`Body: ${payload.formattedMessage}`);

    return true;
  }

  /**
   * Get color for severity level (for Slack attachments)
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "critical":
        return "#FF0000";
      case "high":
        return "#FFA500";
      case "medium":
        return "#FFFF00";
      default:
        return "#00FF00";
    }
  }

  /**
   * Get reporting history
   */
  getReportingHistory(): ReadonlyArray<{
    incidentId: string;
    endpoint: string;
    success: boolean;
    timestamp: number;
    response?: string;
  }> {
    return [...this.reportingHistory];
  }

  /**
   * Clear reporting history
   */
  clearReportingHistory(): void {
    this.reportingHistory = [];
  }

  /**
   * Add reporting endpoint dynamically
   */
  addReportingEndpoint(endpoint: ReportingEndpoint): void {
    if (!this.config.reportingEndpoints) {
      this.config.reportingEndpoints = [];
    }
    this.config.reportingEndpoints.push(endpoint);
  }

  /**
   * Remove reporting endpoint
   */
  removeReportingEndpoint(name: string): boolean {
    if (!this.config.reportingEndpoints) return false;
    const index = this.config.reportingEndpoints.findIndex((e) => e.name === name);
    if (index >= 0) {
      this.config.reportingEndpoints.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get configured reporting endpoints
   */
  getReportingEndpoints(): ReportingEndpoint[] {
    return [...(this.config.reportingEndpoints || [])];
  }

  /**
   * Send alerts through configured channels
   */
  private async sendAlerts(
    level: string,
    context: PostProcessorContext,
    reason: string,
    recommendations: string[],
  ): Promise<void> {
    const alertMessage: AlertMessage = {
      level: this.mapLevelToAlertLevel(level),
      title: `CI/CD Escalation: ${level.toUpperCase()}`,
      message: `Post-processor escalation triggered for commit ${context.commitSha}`,
      context,
      metadata: {
        reason,
        recommendations,
        timestamp: new Date().toISOString(),
      },
    };

    for (const channel of this.config.alertChannels) {
      await this.sendAlertToChannel(channel, alertMessage);
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendAlertToChannel(
    channel: string,
    alert: AlertMessage,
  ): Promise<void> {
    const emoji = this.getAlertEmoji(alert.level);

    switch (channel) {
      case "console":
        if (alert.metadata?.reason) {
          console.log(`${emoji} ${alert.message} - ${alert.metadata.reason}`);
        }
        break;

      case "log":
        // In a real system, this would write to a logging service
        break;

      default:
        console.warn(`Unknown alert channel: ${channel}`);
    }
  }

  /**
   * Get emoji for alert level
   */
  private getAlertEmoji(level: string): string {
    switch (level) {
      case "critical":
        return "🚨";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  }

  /**
   * Map escalation level to severity
   */
  private mapLevelToSeverity(level: string): string {
    switch (level) {
      case "emergency":
        return "critical";
      case "rollback":
        return "high";
      case "manual-intervention":
        return "medium";
      default:
        return "low";
    }
  }

  /**
   * Map escalation level to alert level
   */
  private mapLevelToAlertLevel(
    level: string,
  ): "info" | "warning" | "error" | "critical" {
    switch (level) {
      case "emergency":
        return "critical";
      case "rollback":
        return "error";
      case "manual-intervention":
        return "warning";
      default:
        return "info";
    }
  }

  /**
   * Get incident report by ID
   */
  getIncidentReport(incidentId: string): IncidentReport | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Get all active incidents
   */
  getActiveIncidents(): IncidentReport[] {
    return Array.from(this.incidents.values()).filter(
      (incident) => incident.resolution === "Pending manual intervention",
    );
  }

  /**
   * Resolve an incident
   */
  resolveIncident(incidentId: string, resolution: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (incident) {
      incident.resolution = resolution;
      incident.timeline.push({
        timestamp: new Date(),
        event: "Incident Resolved",
        details: resolution,
      });
      return true;
    }
    return false;
  }

  /**
   * Get escalation statistics
   */
  getStats(): {
    totalIncidents: number;
    activeIncidents: number;
    escalationsByLevel: Record<string, number>;
  } {
    const incidents = Array.from(this.incidents.values());
    const escalationsByLevel: Record<string, number> = {};

    incidents.forEach((incident) => {
      const level = incident.severity;
      escalationsByLevel[level] = (escalationsByLevel[level] || 0) + 1;
    });

    return {
      totalIncidents: incidents.length,
      activeIncidents: incidents.filter(
        (i) => i.resolution === "Pending manual intervention",
      ).length,
      escalationsByLevel,
    };
  }
}
