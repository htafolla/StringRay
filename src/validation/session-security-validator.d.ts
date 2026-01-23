/**
 * Session Security Validator
 * Validates session-level security controls and access patterns
 */
export declare class SessionSecurityValidator {
    private sessionCoordinator;
    private stateManager;
    private securityScanner;
    constructor(sessionCoordinator: any, stateManager: any, securityScanner: any);
    /**
     * Validate session access control
     */
    validateAccessControl(sessionId: string): Promise<{
        valid: boolean;
        issues: string[];
        permissions: {
            readAccess: string[];
            writeAccess: string[];
            adminAccess: string[];
        };
    }>;
    /**
     * Validate session data encryption and integrity
     */
    validateDataIntegrity(sessionId: string): Promise<{
        valid: boolean;
        issues: string[];
        integrityScore: number;
        encryptedFields: string[];
    }>;
    /**
     * Validate session isolation and containment
     */
    validateIsolation(sessionId: string): Promise<{
        valid: boolean;
        issues: string[];
        isolationLevel: "strong" | "moderate" | "weak";
        boundaryViolations: string[];
    }>;
    /**
     * Validate session security audit trail
     */
    validateAuditTrail(sessionId: string): Promise<{
        valid: boolean;
        issues: string[];
        auditCoverage: number;
        gaps: string[];
    }>;
    private getAgentPermissions;
    private isTrustedAgent;
    private validateStateIntegrity;
    private isEncrypted;
    private containsSensitiveData;
    private validateChecksums;
    private collectSessionData;
    private detectDataLeakage;
    private monitorAccessAttempts;
    private checkResourceIsolation;
    private getSessionEvents;
    private detectAuditTampering;
    private getAllSessions;
    private containsReference;
    private hasResourceOverlap;
    private calculateChecksum;
    private calculateHash;
}
//# sourceMappingURL=session-security-validator.d.ts.map