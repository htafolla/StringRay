/**
 * Session Security Validator
 * Validates session-level security controls and access patterns
 */
export class SessionSecurityValidator {
    sessionCoordinator;
    stateManager;
    securityScanner;
    constructor(sessionCoordinator, stateManager, securityScanner) {
        this.sessionCoordinator = sessionCoordinator;
        this.stateManager = stateManager;
        this.securityScanner = securityScanner;
    }
    /**
     * Validate session access control
     */
    async validateAccessControl(sessionId) {
        const issues = [];
        // Check session ownership
        const sessionStatus = this.sessionCoordinator.getSessionStatus(sessionId);
        if (!sessionStatus) {
            issues.push(`Session ${sessionId} not found`);
            return {
                valid: false,
                issues,
                permissions: { readAccess: [], writeAccess: [], adminAccess: [] },
            };
        }
        // Validate agent permissions (simplified for now - would need agent list from session status)
        const permissions = {
            readAccess: [],
            writeAccess: [],
            adminAccess: [],
        };
        // For now, assume standard agent permissions
        // This would be expanded with actual agent permission tracking
        const agents = [`agent-1`, `agent-2`]; // Placeholder
        for (const agent of agents) {
            const agentPerms = this.getAgentPermissions(sessionId, agent);
            if (agentPerms.read)
                permissions.readAccess.push(agent);
            if (agentPerms.write)
                permissions.writeAccess.push(agent);
            if (agentPerms.admin)
                permissions.adminAccess.push(agent);
            // Check for security violations
            if (agentPerms.admin && !this.isTrustedAgent(agent)) {
                issues.push(`Untrusted agent ${agent} has admin access`);
            }
        }
        // Check for missing permissions
        if (permissions.adminAccess.length === 0) {
            issues.push("No agents have admin access to session");
        }
        // Validate permission consistency
        const totalAgents = agents.length;
        const hasAccess = permissions.readAccess.length +
            permissions.writeAccess.length +
            permissions.adminAccess.length;
        if (hasAccess < totalAgents * 0.5) {
            // Less than 50% have any access
            issues.push(`Insufficient access distribution: only ${((hasAccess / totalAgents) * 100).toFixed(1)}% of agents have permissions`);
        }
        return {
            valid: issues.length === 0,
            issues,
            permissions,
        };
    }
    /**
     * Validate session data encryption and integrity
     */
    async validateDataIntegrity(sessionId) {
        const issues = [];
        let integrityScore = 1.0;
        const encryptedFields = [];
        // Check session state encryption
        const sessionState = this.stateManager.get(`session:${sessionId}:state`);
        if (sessionState) {
            const stateIntegrity = this.validateStateIntegrity(sessionState);
            if (!stateIntegrity.valid) {
                issues.push(...stateIntegrity.issues);
                integrityScore -= 0.2;
            }
            if (!this.isEncrypted(sessionState)) {
                issues.push("Session state not properly encrypted");
                integrityScore -= 0.3;
            }
            else {
                encryptedFields.push("session-state");
            }
        }
        // Check context encryption
        const sharedContext = this.sessionCoordinator.getSharedContext(sessionId, "*");
        if (sharedContext) {
            for (const [key, value] of Object.entries(sharedContext)) {
                if (this.containsSensitiveData(key, value)) {
                    if (!this.isEncrypted(value)) {
                        issues.push(`Sensitive context field '${key}' not encrypted`);
                        integrityScore -= 0.1;
                    }
                    else {
                        encryptedFields.push(`context.${key}`);
                    }
                }
            }
        }
        // Check communication encryption
        const communications = this.sessionCoordinator.getCommunications(sessionId);
        if (communications && communications.length > 0) {
            const unencryptedCount = communications.filter((comm) => !comm.encrypted).length;
            if (unencryptedCount > 0) {
                issues.push(`${unencryptedCount} communications not encrypted`);
                integrityScore -= 0.15;
            }
        }
        // Validate checksums
        const checksumValid = await this.validateChecksums(sessionId);
        if (!checksumValid) {
            issues.push("Session data checksum validation failed");
            integrityScore -= 0.2;
        }
        return {
            valid: issues.length === 0 && integrityScore >= 0.8,
            issues,
            integrityScore,
            encryptedFields,
        };
    }
    /**
     * Validate session isolation and containment
     */
    async validateIsolation(sessionId) {
        const issues = [];
        const boundaryViolations = [];
        // Check for cross-session data leakage
        const sessionData = this.collectSessionData(sessionId);
        const leakedData = this.detectDataLeakage(sessionId, sessionData);
        if (leakedData.length > 0) {
            boundaryViolations.push(...leakedData);
            issues.push(`Data leakage detected: ${leakedData.join(", ")}`);
        }
        // Check for unauthorized access attempts
        const accessAttempts = this.monitorAccessAttempts(sessionId);
        const unauthorizedAttempts = accessAttempts.filter((attempt) => !attempt.authorized);
        if (unauthorizedAttempts.length > 0) {
            issues.push(`${unauthorizedAttempts.length} unauthorized access attempts detected`);
            boundaryViolations.push(`unauthorized-access-${unauthorizedAttempts.length}`);
        }
        // Check resource isolation
        const resourceUsage = this.checkResourceIsolation(sessionId);
        if (!resourceUsage.isolated) {
            issues.push("Session resources not properly isolated");
            boundaryViolations.push("resource-contamination");
        }
        // Determine isolation level
        let isolationLevel = "strong";
        if (boundaryViolations.length > 5) {
            isolationLevel = "weak";
        }
        else if (boundaryViolations.length > 0) {
            isolationLevel = "moderate";
        }
        return {
            valid: boundaryViolations.length === 0,
            issues,
            isolationLevel,
            boundaryViolations,
        };
    }
    /**
     * Validate session security audit trail
     */
    async validateAuditTrail(sessionId) {
        const issues = [];
        const gaps = [];
        // Get session events
        const events = this.getSessionEvents(sessionId);
        const totalEvents = events.length;
        // Check audit coverage for different event types
        const eventTypes = [
            "access",
            "modification",
            "communication",
            "state_change",
        ];
        let auditedEvents = 0;
        for (const eventType of eventTypes) {
            const typeEvents = events.filter((e) => e.type === eventType);
            const auditedTypeEvents = typeEvents.filter((e) => e.audited);
            if (auditedTypeEvents.length < typeEvents.length) {
                const gapCount = typeEvents.length - auditedTypeEvents.length;
                gaps.push(`${gapCount} ${eventType} events not audited`);
                auditedEvents += auditedTypeEvents.length;
            }
            else {
                auditedEvents += auditedTypeEvents.length;
            }
        }
        const auditCoverage = totalEvents > 0 ? auditedEvents / totalEvents : 1.0;
        if (auditCoverage < 0.95) {
            // Less than 95% coverage
            issues.push(`Insufficient audit coverage: ${(auditCoverage * 100).toFixed(1)}%`);
        }
        // Check for audit log tampering
        const tamperingDetected = this.detectAuditTampering(sessionId);
        if (tamperingDetected) {
            issues.push("Audit log tampering detected");
            gaps.push("audit-integrity-compromised");
        }
        return {
            valid: issues.length === 0 && auditCoverage >= 0.95,
            issues,
            auditCoverage,
            gaps,
        };
    }
    getAgentPermissions(sessionId, agentId) {
        // Check state manager for agent permissions
        const perms = this.stateManager.get(`session:${sessionId}:permissions:${agentId}`);
        return perms || { read: false, write: false, admin: false };
    }
    isTrustedAgent(agentId) {
        // Check if agent is in trusted list
        const trustedAgents = this.stateManager.get("system:trusted-agents") || [];
        return trustedAgents.includes(agentId);
    }
    validateStateIntegrity(state) {
        const issues = [];
        // Check for required fields
        if (!state.sessionId)
            issues.push("Missing sessionId in state");
        if (!state.createdAt)
            issues.push("Missing createdAt in state");
        // Check timestamp validity
        if (state.createdAt && state.createdAt > Date.now()) {
            issues.push("Invalid future timestamp in state");
        }
        return { valid: issues.length === 0, issues };
    }
    isEncrypted(data) {
        // Simple check for encrypted data (would use proper crypto validation)
        if (typeof data === "string" && data.startsWith("encrypted:")) {
            return true;
        }
        return false;
    }
    containsSensitiveData(key, value) {
        const sensitiveKeys = ["password", "token", "secret", "key", "credential"];
        return sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive));
    }
    async validateChecksums(sessionId) {
        // Validate data integrity checksums
        const checksum = this.stateManager.get(`session:${sessionId}:checksum`);
        if (!checksum)
            return false;
        // Recalculate and compare
        const data = this.collectSessionData(sessionId);
        const calculatedChecksum = this.calculateChecksum(data);
        return calculatedChecksum === checksum;
    }
    collectSessionData(sessionId) {
        return {
            state: this.stateManager.get(`session:${sessionId}:state`),
            context: this.sessionCoordinator.getSharedContext(sessionId, "*"),
            communications: this.sessionCoordinator.getCommunications(sessionId),
        };
    }
    detectDataLeakage(sessionId, sessionData) {
        const leaks = [];
        // Check for cross-session references
        const otherSessions = this.getAllSessions().filter((id) => id !== sessionId);
        for (const otherSessionId of otherSessions) {
            if (this.containsReference(sessionData, otherSessionId)) {
                leaks.push(`cross-session-reference-${otherSessionId}`);
            }
        }
        return leaks;
    }
    monitorAccessAttempts(sessionId) {
        // Return access attempt history (would be populated by security monitoring)
        return this.stateManager.get(`session:${sessionId}:access-attempts`) || [];
    }
    checkResourceIsolation(sessionId) {
        // Check if session resources are properly isolated
        const sessionResources = this.stateManager.get(`session:${sessionId}:resources`);
        const globalResources = this.stateManager.get("system:resources");
        // Simple isolation check
        const isolated = !this.hasResourceOverlap(sessionResources, globalResources);
        return {
            isolated,
            issues: isolated ? [] : ["Resource overlap detected"],
        };
    }
    getSessionEvents(sessionId) {
        return this.stateManager.get(`session:${sessionId}:events`) || [];
    }
    detectAuditTampering(sessionId) {
        // Check for audit log integrity
        const auditLog = this.getSessionEvents(sessionId);
        const expectedHash = this.stateManager.get(`session:${sessionId}:audit-hash`);
        if (!expectedHash)
            return false;
        const calculatedHash = this.calculateHash(auditLog);
        return calculatedHash !== expectedHash;
    }
    getAllSessions() {
        // Get list of all active sessions
        return this.stateManager.get("system:active-sessions") || [];
    }
    containsReference(data, sessionId) {
        const dataStr = JSON.stringify(data);
        return dataStr.includes(sessionId);
    }
    hasResourceOverlap(sessionResources, globalResources) {
        if (!sessionResources || !globalResources)
            return false;
        // Check for overlapping resource identifiers
        const sessionIds = Object.keys(sessionResources);
        const globalIds = Object.keys(globalResources);
        return sessionIds.some((id) => globalIds.includes(id));
    }
    calculateChecksum(data) {
        const crypto = require("crypto");
        const hash = crypto.createHash("sha256");
        hash.update(JSON.stringify(data));
        return hash.digest("hex");
    }
    calculateHash(data) {
        return this.calculateChecksum(data);
    }
}
//# sourceMappingURL=session-security-validator.js.map