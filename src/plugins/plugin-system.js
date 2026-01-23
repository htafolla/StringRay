/**
 * StringRay AI v1.1.1 - Plugin Ecosystem
 *
 * Secure plugin system for third-party agent extensions.
 * Provides sandboxed execution, validation, and lifecycle management.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { frameworkLogger, generateJobId } from "../framework-logger";
export class PluginValidator {
    requiredFields = [
        "id",
        "name",
        "version",
        "description",
        "author",
        "license",
        "engines",
    ];
    securityChecks = [
        "validatePackageName",
        "validateDependencies",
        "validatePermissions",
        "validateCodeSecurity",
        "validateResourceLimits",
    ];
    /**
     * Comprehensive plugin validation
     */
    async validatePlugin(pluginPath) {
        const result = {
            valid: false,
            errors: [],
            warnings: [],
            securityIssues: [],
            compatibilityScore: 0,
        };
        try {
            const packageJson = await this.loadPackageJson(pluginPath);
            const metadataValidation = this.validateMetadata(packageJson);
            result.errors.push(...metadataValidation.errors);
            result.warnings.push(...metadataValidation.warnings);
            const capabilitiesValidation = this.validateCapabilities(packageJson);
            result.errors.push(...capabilitiesValidation.errors);
            result.warnings.push(...capabilitiesValidation.warnings);
            const securityValidation = await this.validateSecurity(pluginPath, packageJson);
            result.securityIssues.push(...securityValidation.issues);
            result.errors.push(...securityValidation.errors);
            result.compatibilityScore = this.calculateCompatibilityScore(packageJson);
            result.valid =
                result.errors.length === 0 && result.securityIssues.length === 0;
        }
        catch (error) {
            result.errors.push(`Validation failed: ${error}`);
        }
        return result;
    }
    async loadPackageJson(pluginPath) {
        const fs = require("fs").promises;
        const path = require("path");
        const packagePath = path.join(pluginPath, "package.json");
        const content = await fs.readFile(packagePath, "utf-8");
        return JSON.parse(content);
    }
    validateMetadata(packageJson) {
        const errors = [];
        const warnings = [];
        for (const field of this.requiredFields) {
            if (!packageJson[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        if (packageJson.version && !/^\d+\.\d+\.\d+/.test(packageJson.version)) {
            errors.push("Invalid version format (expected semver)");
        }
        if (!packageJson.engines?.strray) {
            errors.push("Missing StringRay engine requirement");
        }
        const suspiciousKeywords = [
            "hack",
            "exploit",
            "malware",
            "virus",
            "trojan",
        ];
        const keywords = packageJson.keywords || [];
        for (const keyword of keywords) {
            if (suspiciousKeywords.some((s) => keyword.toLowerCase().includes(s))) {
                warnings.push(`Suspicious keyword detected: ${keyword}`);
            }
        }
        return { errors, warnings };
    }
    validateCapabilities(packageJson) {
        const errors = [];
        const warnings = [];
        const capabilities = packageJson.stringrayCapabilities;
        if (!capabilities) {
            errors.push("Missing stringrayCapabilities in package.json");
            return { errors, warnings };
        }
        if (!capabilities.agentTypes || !Array.isArray(capabilities.agentTypes)) {
            errors.push("Missing or invalid agentTypes in capabilities");
        }
        if (!capabilities.supportedTasks ||
            !Array.isArray(capabilities.supportedTasks)) {
            errors.push("Missing or invalid supportedTasks in capabilities");
        }
        if (!capabilities.requiredPermissions ||
            !Array.isArray(capabilities.requiredPermissions)) {
            warnings.push("Missing requiredPermissions - assuming minimal permissions");
        }
        return { errors, warnings };
    }
    async validateSecurity(pluginPath, packageJson) {
        const issues = [];
        const errors = [];
        const dangerousDeps = [
            "eval",
            "child_process",
            "fs",
            "net",
            "http",
            "https",
            "crypto",
            "tls",
            "cluster",
            "worker_threads",
        ];
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };
        for (const dep of Object.keys(allDeps)) {
            if (dangerousDeps.includes(dep)) {
                issues.push(`Potentially dangerous dependency: ${dep}`);
            }
        }
        const scripts = packageJson.scripts || {};
        for (const [name, script] of Object.entries(scripts)) {
            if (typeof script === "string") {
                if (script.includes("rm -rf") ||
                    script.includes("sudo") ||
                    script.includes("chmod +x")) {
                    issues.push(`Potentially dangerous script: ${name}`);
                }
            }
        }
        const fs = require("fs").promises;
        const path = require("path");
        try {
            const files = await fs.readdir(pluginPath);
            const hasIndex = files.includes("index.js") || files.includes("index.ts");
            if (!hasIndex) {
                errors.push("Plugin must have an index.js or index.ts file");
            }
            for (const file of files) {
                const stat = await fs.stat(path.join(pluginPath, file));
                if (stat.isFile() && stat.mode & parseInt("111", 8)) {
                    issues.push(`Executable file detected: ${file}`);
                }
            }
        }
        catch (error) {
            errors.push(`Failed to validate plugin structure: ${error}`);
        }
        return { issues, errors };
    }
    calculateCompatibilityScore(packageJson) {
        let score = 0;
        const strrayEngine = packageJson.engines?.strray;
        if (strrayEngine) {
            if (strrayEngine === "^1.0.0")
                score += 30;
            else if (strrayEngine.startsWith("^1."))
                score += 20;
            else if (strrayEngine.startsWith("~1."))
                score += 15;
            else
                score += 5;
        }
        const nodeEngine = packageJson.engines?.node;
        if (nodeEngine) {
            if (nodeEngine === "^18.0.0" || nodeEngine === ">=18.0.0")
                score += 20;
            else if (nodeEngine.startsWith("^18."))
                score += 15;
            else
                score += 5;
        }
        const keywords = packageJson.keywords || [];
        const relevantKeywords = ["strray", "plugin", "agent", "ai", "framework"];
        const relevantCount = keywords.filter((k) => relevantKeywords.some((r) => k.toLowerCase().includes(r))).length;
        score += Math.min(relevantCount * 5, 25);
        if (packageJson.description)
            score += 10;
        if (packageJson.homepage)
            score += 5;
        if (packageJson.repository)
            score += 5;
        return Math.min(score, 100);
    }
}
export class PluginSandbox {
    sandbox = null;
    config;
    constructor(config = {}) {
        this.config = {
            memoryLimit: 50, // 50MB
            timeout: 30000, // 30 seconds
            allowedModules: ["util", "events", "stream", "buffer", "string_decoder"],
            networkAccess: false,
            fileSystemAccess: false,
            environmentVariables: [],
            ...config,
        };
    }
    /**
     * Execute plugin code in sandbox
     */
    async executePlugin(pluginPath, method, ...args) {
        const vm = require("vm");
        const fs = require("fs").promises;
        const path = require("path");
        const pluginCode = await fs.readFile(path.join(pluginPath, "index.js"), "utf-8");
        const context = vm.createContext({
            console: {
                log: async (...args) => await frameworkLogger.log('plugin-system', '-plugin-args-error-args-any-console-error-plugin-a', 'error', { message: "[PLUGIN]", ...args }),
                error: (...args) => console.error("[PLUGIN]", ...args),
                warn: (...args) => console.warn("[PLUGIN]", ...args),
            },
            require: this.createRestrictedRequire(),
            process: {
                env: this.filterEnvironmentVariables(),
                version: process.version,
                platform: process.platform,
            },
            Buffer: Buffer,
            setTimeout: setTimeout,
            clearTimeout: clearTimeout,
            setInterval: setInterval,
            clearInterval: clearInterval,
        });
        const script = new vm.Script(pluginCode);
        const pluginInstance = script.runInContext(context);
        return Promise.race([
            pluginInstance[method](...args),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Plugin execution timeout")), this.config.timeout)),
        ]);
    }
    createRestrictedRequire() {
        const Module = require("module");
        const originalRequire = Module.prototype.require;
        return (id) => {
            if (!this.config.allowedModules.includes(id)) {
                throw new Error(`Module '${id}' is not allowed in plugin sandbox`);
            }
            return originalRequire.call(this, id);
        };
    }
    filterEnvironmentVariables() {
        const filtered = {};
        for (const key of this.config.environmentVariables) {
            if (process.env[key]) {
                filtered[key] = process.env[key];
            }
        }
        return filtered;
    }
}
export class PluginRegistry {
    plugins = new Map();
    activePlugins = new Set();
    validator;
    sandbox;
    constructor() {
        this.validator = new PluginValidator();
        this.sandbox = new PluginSandbox();
    }
    /**
     * Register a plugin
     */
    async registerPlugin(pluginPath) {
        try {
            const validation = await this.validator.validatePlugin(pluginPath);
            if (!validation.valid) {
                return {
                    success: false,
                    errors: [...validation.errors, ...validation.securityIssues],
                };
            }
            const pluginInstance = await this.sandbox.executePlugin(pluginPath, "createPlugin");
            this.plugins.set(pluginInstance.metadata.id, pluginInstance);
            const jobId = generateJobId('plugin-system-register');
            frameworkLogger.log("plugin-system", "plugin registered", "success", {
                name: pluginInstance.metadata.name,
                version: pluginInstance.metadata.version
            }, undefined, jobId);
            return { success: true, errors: [] };
        }
        catch (error) {
            return {
                success: false,
                errors: [`Plugin registration failed: ${error}`],
            };
        }
    }
    /**
     * Activate a plugin
     */
    async activatePlugin(pluginId, config = {}) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            console.error(`Plugin ${pluginId} not found`);
            return false;
        }
        try {
            await plugin.initialize(config);
            await plugin.activate();
            this.activePlugins.add(pluginId);
            const jobId = generateJobId('plugin-system-activate');
            frameworkLogger.log("plugin-system", "plugin activated", "success", {
                name: plugin.metadata.name
            }, undefined, jobId);
            return true;
        }
        catch (error) {
            console.error(`❌ Plugin activation failed: ${error}`);
            return false;
        }
    }
    /**
     * Deactivate a plugin
     */
    async deactivatePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin)
            return false;
        try {
            await plugin.deactivate();
            this.activePlugins.delete(pluginId);
            const jobId = generateJobId('plugin-system-deactivate');
            frameworkLogger.log("plugin-system", "plugin deactivated", "success", {
                name: plugin.metadata.name
            }, undefined, jobId);
            return true;
        }
        catch (error) {
            console.error(`❌ Plugin deactivation failed: ${error}`);
            return false;
        }
    }
    /**
     * Get plugin instance
     */
    getPlugin(pluginId) {
        return this.plugins.get(pluginId) || null;
    }
    /**
     * List all registered plugins
     */
    listPlugins() {
        return Array.from(this.plugins.entries()).map(([id, plugin]) => ({
            id,
            name: plugin.metadata.name,
            version: plugin.metadata.version,
            active: this.activePlugins.has(id),
        }));
    }
    /**
     * Get plugin health status
     */
    async getPluginHealth(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin)
            return null;
        try {
            return await plugin.getHealthStatus();
        }
        catch (error) {
            return {
                status: "unhealthy",
                lastCheck: Date.now(),
                uptime: 0,
                errorCount: 1,
                warningCount: 0,
                details: { error: String(error) },
            };
        }
    }
    /**
     * Unregister a plugin
     */
    async unregisterPlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin)
            return false;
        if (this.activePlugins.has(pluginId)) {
            await this.deactivatePlugin(pluginId);
        }
        try {
            await plugin.dispose();
        }
        catch (error) {
            console.warn(`Plugin disposal failed: ${error}`);
        }
        this.plugins.delete(pluginId);
        const jobId = generateJobId('plugin-system-unregister');
        frameworkLogger.log("plugin-system", "plugin unregistered", "success", {
            name: plugin.metadata.name
        }, undefined, jobId);
        return true;
    }
}
export const pluginValidator = new PluginValidator();
export const pluginSandbox = new PluginSandbox();
export const pluginRegistry = new PluginRegistry();
//# sourceMappingURL=plugin-system.js.map