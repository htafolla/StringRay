/**
 * ARCHITECTURAL INTEGRITY ENFORCEMENT
 *
 * This module ensures that critical framework components are always active
 * and integrated, preventing the staged initialization issues that broke
 * the post-processor and rules engine enforcement.
 */
/**
 * Verify all critical components are active and integrated
 */
export declare function verifyArchitecturalIntegrity(): Promise<{
    allActive: boolean;
    issues: string[];
    recommendations: string[];
}>;
/**
 * Force activation of critical components if missing
 * This prevents staged initialization from breaking the framework
 */
export declare function ensureCriticalComponents(): Promise<void>;
//# sourceMappingURL=architectural-integrity.d.ts.map