/**
 * Import Resolver Utility
 * Dynamically resolves module imports across different environments
 *
 * This solves the systemic path resolution issue where hardcoded paths
 * break between development, built, and deployed environments.
 */
export declare class ImportResolver {
    private static instance;
    private currentDir;
    private projectRoot;
    private isDevelopment;
    private isBuilt;
    private isInstalled;
    private isTesting;
    private constructor();
    static getInstance(): ImportResolver;
    private getCurrentDirectory;
    private findProjectRoot;
    private fileExists;
    private detectDevelopment;
    private detectBuilt;
    private detectInstalled;
    private detectTesting;
    /**
     * Resolve module import path for any module
     */
    resolveModulePath(moduleName: string, subPath?: string): string;
    /**
     * Resolve agent import path (special case for agents)
     */
    resolveAgentPath(agentName: string): string;
    /**
     * Dynamic import with comprehensive environment resolution
     */
    importModule(moduleName: string, subPath?: string): Promise<any>;
    /**
     * Generate alternative import paths for fallback
     */
    private generateAlternativePaths;
    /**
     * Get comprehensive environment information
     */
    getEnvironmentInfo(): {
        currentDir: string;
        projectRoot: string;
        isDevelopment: boolean;
        isBuilt: boolean;
        isInstalled: boolean;
        isTesting: boolean;
        nodeEnv: string | undefined;
    };
}
export declare const importResolver: ImportResolver;
//# sourceMappingURL=import-resolver.d.ts.map