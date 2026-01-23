/**
 * Path Resolution Utility for StringRay Framework
 * Resolves import paths that work across development, build, and installed environments
 */
export declare class PathResolver {
    private static instance;
    private currentDir;
    private isDevelopment;
    private isBuilt;
    private isInstalled;
    private constructor();
    static getInstance(): PathResolver;
    /**
     * Get current working directory
     */
    private getCurrentDirectory;
    /**
     * Detect if we're running in development environment (src/ directory)
     */
    private detectDevelopment;
    /**
     * Detect if we're running in built environment (dist/ directory)
     */
    private detectBuilt;
    /**
     * Detect if we're running in installed package environment
     */
    private detectInstalled;
    /**
     * Resolve agent import path for current environment
     */
    resolveAgentPath(agentName: string): string;
    /**
     * Resolve any module path for current environment
     */
    resolveModulePath(modulePath: string): string;
    /**
     * Get environment information for debugging
     */
    getEnvironmentInfo(): {
        currentDir: string;
        isDevelopment: boolean;
        isBuilt: boolean;
        isInstalled: boolean;
        nodeEnv: string | undefined;
    };
}
export declare const pathResolver: PathResolver;
//# sourceMappingURL=path-resolver.d.ts.map