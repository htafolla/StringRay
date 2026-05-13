/**
 * Server Configuration Registry - Plugin Extension
 *
 * Extends ServerConfigRegistry with plugin support for Phase 2.
 * Enables automatic MCP server registration from plugins.
 *
 * @version 1.2.0
 */
import { ServerConfigRegistry, defaultServerRegistry } from "./server-config-registry.js";
import { PluginType } from "../../integrations/plugins/plugin-integration.js";
import { frameworkLogger } from "../../core/framework-logger.js";
/**
 * ServerConfigRegistry with plugin support
 */
export class PluginServerConfigRegistry {
    registry;
    registeredPluginServers = new Map();
    pluginRegistryRef;
    constructor(registry) {
        // If no registry provided, use default
        if (registry) {
            this.registry = registry;
        }
        else {
            // Create new registry with default configs copied
            this.registry = new ServerConfigRegistry();
            const defaultConfigs = defaultServerRegistry.getAll();
            for (const config of defaultConfigs) {
                this.registry.register(config);
            }
        }
    }
    /**
     * Set the plugin registry reference for dynamic updates
     */
    setPluginRegistry(registry) {
        this.pluginRegistryRef = registry;
    }
    /**
     * Get the plugin registry reference
     */
    getPluginRegistry() {
        return this.pluginRegistryRef;
    }
    /**
     * Register a plugin's MCP server configuration
     */
    registerPluginServer(plugin, options = {}) {
        const config = plugin.getMcpServerConfig();
        if (!config) {
            frameworkLogger.log("plugin-server-registry", "no-mcp-config", "warning", { plugin: plugin.name, reason: "Not an MCP server type" });
            return false;
        }
        const pluginConfig = {
            serverName: config.serverName,
            command: config.command,
            args: config.args ?? [],
            timeout: config.timeout ?? 30000,
            ...(config.env ? { env: config.env } : {}),
            pluginName: plugin.name,
            pluginVersion: plugin.version,
            capabilities: plugin.getCapabilities() ?? [],
        };
        // Check for overwrite
        const existing = this.registry.get(pluginConfig.serverName);
        if (existing && !options.overwrite) {
            frameworkLogger.log("plugin-server-registry", "server-exists", "warning", { serverName: pluginConfig.serverName, plugin: plugin.name });
            return false;
        }
        this.registry.register(pluginConfig);
        this.registeredPluginServers.set(pluginConfig.serverName, pluginConfig);
        frameworkLogger.log("plugin-server-registry", "server-registered", "info", {
            serverName: pluginConfig.serverName,
            plugin: pluginConfig.pluginName,
            version: pluginConfig.pluginVersion
        });
        return true;
    }
    /**
     * Register all MCP server plugins from a plugin registry
     */
    registerAllPluginServers(pluginRegistry, options = {}) {
        const plugins = pluginRegistry.getPluginsByType(PluginType.MCP_SERVER);
        let registered = 0;
        for (const plugin of plugins) {
            if (this.registerPluginServer(plugin, options)) {
                registered++;
            }
        }
        frameworkLogger.log("plugin-server-registry", "all-servers-registered", "info", { count: registered, total: plugins.length });
        return registered;
    }
    /**
     * Get a server configuration by name
     */
    get(serverName) {
        return this.registry.get(serverName);
    }
    /**
     * Check if a server configuration exists
     */
    has(serverName) {
        return this.registry.has(serverName);
    }
    /**
     * Get all registered server configurations
     */
    getAll() {
        return this.registry.getAll();
    }
    /**
     * Get all registered server names
     */
    getServerNames() {
        return this.registry.getServerNames();
    }
    /**
     * Get plugin server configuration by server name
     */
    getPluginServer(serverName) {
        return this.registeredPluginServers.get(serverName);
    }
    /**
     * Get all registered plugin servers
     */
    getAllPluginServers() {
        return Array.from(this.registeredPluginServers.values());
    }
    /**
     * Check if a server is from a plugin
     */
    isPluginServer(serverName) {
        return this.registeredPluginServers.has(serverName);
    }
    /**
     * Unregister a plugin server
     */
    unregisterPluginServer(serverName) {
        const config = this.registeredPluginServers.get(serverName);
        if (!config)
            return false;
        // Remove from internal map
        this.registeredPluginServers.delete(serverName);
        // Remove from registry by recreating without that server
        const allServers = this.registry.getAll();
        this.registry.clear();
        for (const server of allServers) {
            if (server.serverName !== serverName) {
                this.registry.register(server);
            }
        }
        frameworkLogger.log("plugin-server-registry", "server-unregistered", "info", { serverName, plugin: config.pluginName });
        return true;
    }
    /**
     * Get servers by capability
     */
    getServersByCapability(capability) {
        return this.getAllPluginServers().filter(config => config.capabilities?.includes(capability));
    }
    /**
     * Get registry statistics
     */
    getRegistryStats() {
        const allConfigs = this.getAll();
        const pluginConfigs = this.getAllPluginServers();
        const defaultCount = allConfigs.length - pluginConfigs.length;
        return {
            totalServers: allConfigs.length,
            defaultServers: defaultCount,
            pluginServers: pluginConfigs.length,
            pluginServerDetails: pluginConfigs.map(c => ({
                name: c.serverName,
                plugin: c.pluginName,
                version: c.pluginVersion,
            })),
        };
    }
    /**
     * Clear all plugin server registrations (keep default servers)
     */
    clearPluginServers() {
        const count = this.registeredPluginServers.size;
        // Get all non-plugin servers and re-register them
        const nonPluginServers = this.getAll().filter(server => !this.registeredPluginServers.has(server.serverName));
        this.registry.clear();
        for (const server of nonPluginServers) {
            this.registry.register(server);
        }
        this.registeredPluginServers.clear();
        frameworkLogger.log("plugin-server-registry", "plugin-servers-cleared", "info", { count });
        return count;
    }
    /**
     * Register a server configuration
     */
    register(config) {
        this.registry.register(config);
    }
    /**
     * Clear all registrations
     */
    clear() {
        this.registry.clear();
        this.registeredPluginServers.clear();
    }
    /**
     * Create dynamic config for unknown server
     */
    createDynamicConfig(serverName) {
        return this.registry.createDynamicConfig(serverName);
    }
}
/**
 * Default singleton instance
 */
export const defaultPluginServerRegistry = new PluginServerConfigRegistry();
/**
 * Create a new PluginServerConfigRegistry
 */
export function createPluginServerRegistry(baseRegistry) {
    return new PluginServerConfigRegistry(baseRegistry);
}
//# sourceMappingURL=plugin-server-registry.js.map