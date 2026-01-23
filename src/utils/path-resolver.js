/**
 * Path Resolution Utility for StringRay Framework
 * Resolves import paths that work across development, build, and installed environments
 */
import { fileURLToPath } from "url";
import { dirname } from "path";
export class PathResolver {
    static instance;
    currentDir;
    isDevelopment;
    isBuilt;
    isInstalled;
    constructor() {
        // Determine current execution context
        this.currentDir = this.getCurrentDirectory();
        this.isDevelopment = this.detectDevelopment();
        this.isBuilt = this.detectBuilt();
        this.isInstalled = this.detectInstalled();
    }
    static getInstance() {
        if (!PathResolver.instance) {
            PathResolver.instance = new PathResolver();
        }
        return PathResolver.instance;
    }
    /**
     * Get current working directory
     */
    getCurrentDirectory() {
        try {
            // In ES modules, __dirname is not available, so we use import.meta.url
            const currentFile = fileURLToPath(import.meta.url);
            return dirname(currentFile);
        }
        catch (error) {
            // Fallback for CommonJS or other environments
            return process.cwd();
        }
    }
    /**
     * Detect if we're running in development environment (src/ directory)
     */
    detectDevelopment() {
        return (this.currentDir.includes("/src/") ||
            this.currentDir.includes("\\src\\") ||
            process.env.NODE_ENV === "development");
    }
    /**
     * Detect if we're running in built environment (dist/ directory)
     */
    detectBuilt() {
        return (this.currentDir.includes("/dist/") ||
            this.currentDir.includes("\\dist\\") ||
            (this.currentDir.includes("strray") && !this.detectDevelopment()));
    }
    /**
     * Detect if we're running in installed package environment
     */
    detectInstalled() {
        return (this.currentDir.includes("/node_modules/") ||
            this.currentDir.includes("\\node_modules\\") ||
            (this.currentDir.includes("strray") && this.detectBuilt()));
    }
    /**
     * Resolve agent import path for current environment
     */
    resolveAgentPath(agentName) {
        if (this.isDevelopment) {
            // In src/, agents are at ./agents/
            return `./agents/${agentName}.js`;
        }
        else if (this.isBuilt || this.isInstalled) {
            // In dist/ or installed, agents are at ../agents/
            return `../agents/${agentName}.js`;
        }
        else {
            // Fallback - assume built environment
            console.warn("⚠️ PathResolver: Unknown environment, using built path fallback");
            return `../agents/${agentName}.js`;
        }
    }
    /**
     * Resolve any module path for current environment
     */
    resolveModulePath(modulePath) {
        // Remove leading ./ if present
        const cleanPath = modulePath.startsWith("./")
            ? modulePath.slice(2)
            : modulePath;
        if (this.isDevelopment) {
            // In src/, modules are at ./
            return `./${cleanPath}`;
        }
        else if (this.isBuilt || this.isInstalled) {
            // In dist/ or installed, modules are relative to dist/
            return `./${cleanPath}`;
        }
        else {
            // Fallback
            console.warn("⚠️ PathResolver: Unknown environment for module path, using as-is");
            return modulePath;
        }
    }
    /**
     * Get environment information for debugging
     */
    getEnvironmentInfo() {
        return {
            currentDir: this.currentDir,
            isDevelopment: this.isDevelopment,
            isBuilt: this.isBuilt,
            isInstalled: this.isInstalled,
            nodeEnv: process.env.NODE_ENV,
        };
    }
}
// Export singleton instance
export const pathResolver = PathResolver.getInstance();
//# sourceMappingURL=path-resolver.js.map