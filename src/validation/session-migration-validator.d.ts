/**
 * Session Migration Validator
 * Validates session migration operations and state integrity
 */
export declare class SessionMigrationValidator {
    private stateManager;
    private sessionCoordinator;
    constructor(stateManager: any, sessionCoordinator: any);
    /**
     * Validate migration plan before execution
     */
    validateMigrationPlan(plan: any): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    /**
     * Validate migration execution results
     */
    validateMigrationResult(plan: any, success: boolean): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    /**
     * Validate rollback capability
     */
    validateRollbackCapability(plan: any): {
        canRollback: boolean;
        reason?: string;
    };
}
//# sourceMappingURL=session-migration-validator.d.ts.map