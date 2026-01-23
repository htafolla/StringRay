/**
 * Escalation Engine for Post-Processor
 * Handles incident reporting, manual intervention triggers, and alerting
 */
export class EscalationEngine {
    config;
    incidents = new Map();
    constructor(config = {}) {
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
    async evaluateEscalation(context, attempts, error, monitoringResults) {
        let escalationLevel;
        let reason;
        let recommendations;
        if (attempts >= this.config.emergencyThreshold) {
            escalationLevel = "emergency";
            reason = `Emergency threshold exceeded (${attempts}/${this.config.emergencyThreshold} attempts)`;
            recommendations = [
                "Immediate manual intervention required",
                "Consider rolling back to previous stable version",
                "Escalate to senior engineering team",
                "Review deployment pipeline for systemic issues",
            ];
        }
        else if (attempts >= this.config.rollbackThreshold) {
            escalationLevel = "rollback";
            reason = `Rollback threshold exceeded (${attempts}/${this.config.rollbackThreshold} attempts)`;
            recommendations = [
                "Automatic rollback initiated",
                "Review fix validation logic",
                "Check for environmental issues",
                "Monitor system stability post-rollback",
            ];
        }
        else if (attempts >= this.config.manualInterventionThreshold) {
            escalationLevel = "manual-intervention";
            reason = `Manual intervention threshold exceeded (${attempts}/${this.config.manualInterventionThreshold} attempts)`;
            recommendations = [
                "Human review of failure analysis required",
                "Verify auto-fix confidence scores",
                "Check deployment environment health",
                "Consider temporary deployment pause",
            ];
        }
        else {
            // No escalation needed
            return null;
        }
        const incidentReport = await this.createIncidentReport(context, escalationLevel, reason, error, attempts, monitoringResults);
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
    async createIncidentReport(context, level, reason, error, attempts, monitoringResults) {
        const incidentId = `incident-${context.commitSha}-${Date.now()}`;
        const timeline = [
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
        const incidentReport = {
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
            // TODO: Implement incident reporting to external systems
            console.log(`Incident reported: ${incidentId}`);
        }
        return incidentReport;
    }
    /**
     * Send alerts through configured channels
     */
    async sendAlerts(level, context, reason, recommendations) {
        const alertMessage = {
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
    async sendAlertToChannel(channel, alert) {
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
    getAlertEmoji(level) {
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
    mapLevelToSeverity(level) {
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
    mapLevelToAlertLevel(level) {
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
    getIncidentReport(incidentId) {
        return this.incidents.get(incidentId);
    }
    /**
     * Get all active incidents
     */
    getActiveIncidents() {
        return Array.from(this.incidents.values()).filter((incident) => incident.resolution === "Pending manual intervention");
    }
    /**
     * Resolve an incident
     */
    resolveIncident(incidentId, resolution) {
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
    getStats() {
        const incidents = Array.from(this.incidents.values());
        const escalationsByLevel = {};
        incidents.forEach((incident) => {
            const level = incident.severity;
            escalationsByLevel[level] = (escalationsByLevel[level] || 0) + 1;
        });
        return {
            totalIncidents: incidents.length,
            activeIncidents: incidents.filter((i) => i.resolution === "Pending manual intervention").length,
            escalationsByLevel,
        };
    }
}
//# sourceMappingURL=EscalationEngine.js.map