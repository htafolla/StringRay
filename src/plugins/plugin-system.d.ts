/**
 * StringRay AI v1.1.1 - Plugin Ecosystem
 *
 * Secure plugin system for third-party agent extensions.
 * Provides sandboxed execution, validation, and lifecycle management.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
export interface PluginMetadata {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
    homepage?: string;
    repository?: string;
    keywords: string[];
    engines: {
        strray: string;
        node: string;
    };
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
}
export interface PluginCapabilities {
    agentTypes: string[];
    supportedTasks: string[];
    requiredPermissions: string[];
    providedServices: string[];
    configurationSchema?: any;
}
export interface PluginInterface {
    metadata: PluginMetadata;
    capabilities: PluginCapabilities;
    initialize(config: any): Promise<void>;
    activate(): Promise<void>;
    deactivate(): Promise<void>;
    dispose(): Promise<void>;
    createAgent(type: string, config: any): Promise<PluginAgent>;
    validateTask(taskType: string, parameters: any): Promise<boolean>;
    getHealthStatus(): Promise<PluginHealthStatus>;
}
export interface PluginAgent {
    id: string;
    type: string;
    executeTask(task: any): Promise<any>;
    getStatus(): Promise<AgentStatus>;
    dispose(): Promise<void>;
}
export interface AgentStatus {
    active: boolean;
    lastActivity: number;
    currentTasks: number;
    health: "healthy" | "degraded" | "unhealthy";
    metrics: Record<string, any>;
}
export interface PluginHealthStatus {
    status: "healthy" | "degraded" | "unhealthy" | "unknown";
    lastCheck: number;
    uptime: number;
    errorCount: number;
    warningCount: number;
    details: Record<string, any>;
}
export interface PluginValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    securityIssues: string[];
    compatibilityScore: number;
}
export interface PluginSandboxConfig {
    memoryLimit: number;
    timeout: number;
    allowedModules: string[];
    networkAccess: boolean;
    fileSystemAccess: boolean;
    environmentVariables: string[];
}
export declare class PluginValidator {
    private readonly requiredFields;
    private readonly securityChecks;
    /**
     * Comprehensive plugin validation
     */
    validatePlugin(pluginPath: string): Promise<PluginValidationResult>;
    private loadPackageJson;
    private validateMetadata;
    private validateCapabilities;
    private validateSecurity;
    private calculateCompatibilityScore;
}
export declare class PluginSandbox {
    private sandbox;
    private config;
    constructor(config?: Partial<PluginSandboxConfig>);
    /**
     * Execute plugin code in sandbox
     */
    executePlugin(pluginPath: string, method: string, ...args: any[]): Promise<any>;
    private createRestrictedRequire;
    private filterEnvironmentVariables;
}
export declare class PluginRegistry {
    private plugins;
    private activePlugins;
    private validator;
    private sandbox;
    constructor();
    /**
     * Register a plugin
     */
    registerPlugin(pluginPath: string): Promise<{
        success: boolean;
        errors: string[];
    }>;
    /**
     * Activate a plugin
     */
    activatePlugin(pluginId: string, config?: any): Promise<boolean>;
    /**
     * Deactivate a plugin
     */
    deactivatePlugin(pluginId: string): Promise<boolean>;
    /**
     * Get plugin instance
     */
    getPlugin(pluginId: string): PluginInterface | null;
    /**
     * List all registered plugins
     */
    listPlugins(): Array<{
        id: string;
        name: string;
        version: string;
        active: boolean;
    }>;
    /**
     * Get plugin health status
     */
    getPluginHealth(pluginId: string): Promise<PluginHealthStatus | null>;
    /**
     * Unregister a plugin
     */
    unregisterPlugin(pluginId: string): Promise<boolean>;
}
export declare const pluginValidator: PluginValidator;
export declare const pluginSandbox: PluginSandbox;
export declare const pluginRegistry: PluginRegistry;
//# sourceMappingURL=plugin-system.d.ts.map