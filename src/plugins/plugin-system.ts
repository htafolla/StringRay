/**
 * StrRay Framework v1.0.0 - Plugin Ecosystem
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

  // Lifecycle methods
  initialize(config: any): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  dispose(): Promise<void>;

  // Core functionality
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
  health: 'healthy' | 'degraded' | 'unhealthy';
  metrics: Record<string, any>;
}

export interface PluginHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
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
  memoryLimit: number; // MB
  timeout: number; // ms
  allowedModules: string[];
  networkAccess: boolean;
  fileSystemAccess: boolean;
  environmentVariables: string[];
}

export class PluginValidator {
  private readonly requiredFields = [
    'id', 'name', 'version', 'description', 'author', 'license', 'engines'
  ];

  private readonly securityChecks = [
    'validatePackageName',
    'validateDependencies',
    'validatePermissions',
    'validateCodeSecurity',
    'validateResourceLimits'
  ];

  /**
   * Comprehensive plugin validation
   */
  async validatePlugin(pluginPath: string): Promise<PluginValidationResult> {
    const result: PluginValidationResult = {
      valid: false,
      errors: [],
      warnings: [],
      securityIssues: [],
      compatibilityScore: 0
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

      result.valid = result.errors.length === 0 && result.securityIssues.length === 0;

    } catch (error) {
      result.errors.push(`Validation failed: ${error}`);
    }

    return result;
  }

  private async loadPackageJson(pluginPath: string): Promise<any> {
    const fs = require('fs').promises;
    const path = require('path');

    const packagePath = path.join(pluginPath, 'package.json');
    const content = await fs.readFile(packagePath, 'utf-8');
    return JSON.parse(content);
  }

  private validateMetadata(packageJson: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of this.requiredFields) {
      if (!packageJson[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (packageJson.version && !/^\d+\.\d+\.\d+/.test(packageJson.version)) {
      errors.push('Invalid version format (expected semver)');
    }

    if (!packageJson.engines?.strray) {
      errors.push('Missing StrRay engine requirement');
    }

    const suspiciousKeywords = ['hack', 'exploit', 'malware', 'virus', 'trojan'];
    const keywords = packageJson.keywords || [];
    for (const keyword of keywords) {
      if (suspiciousKeywords.some(s => keyword.toLowerCase().includes(s))) {
        warnings.push(`Suspicious keyword detected: ${keyword}`);
      }
    }

    return { errors, warnings };
  }

  private validateCapabilities(packageJson: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const capabilities = packageJson.strrayCapabilities;
    if (!capabilities) {
      errors.push('Missing strrayCapabilities in package.json');
      return { errors, warnings };
    }

    if (!capabilities.agentTypes || !Array.isArray(capabilities.agentTypes)) {
      errors.push('Missing or invalid agentTypes in capabilities');
    }

    if (!capabilities.supportedTasks || !Array.isArray(capabilities.supportedTasks)) {
      errors.push('Missing or invalid supportedTasks in capabilities');
    }

    if (!capabilities.requiredPermissions || !Array.isArray(capabilities.requiredPermissions)) {
      warnings.push('Missing requiredPermissions - assuming minimal permissions');
    }

    return { errors, warnings };
  }

  private async validateSecurity(pluginPath: string, packageJson: any): Promise<{ issues: string[]; errors: string[] }> {
    const issues: string[] = [];
    const errors: string[] = [];

    const dangerousDeps = [
      'eval', 'child_process', 'fs', 'net', 'http', 'https',
      'crypto', 'tls', 'cluster', 'worker_threads'
    ];

    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    for (const dep of Object.keys(allDeps)) {
      if (dangerousDeps.includes(dep)) {
        issues.push(`Potentially dangerous dependency: ${dep}`);
      }
    }

    const scripts = packageJson.scripts || {};
    for (const [name, script] of Object.entries(scripts)) {
      if (typeof script === 'string') {
        if (script.includes('rm -rf') || script.includes('sudo') || script.includes('chmod +x')) {
          issues.push(`Potentially dangerous script: ${name}`);
        }
      }
    }

    const fs = require('fs').promises;
    const path = require('path');

    try {
      const files = await fs.readdir(pluginPath);
      const hasIndex = files.includes('index.js') || files.includes('index.ts');

      if (!hasIndex) {
        errors.push('Plugin must have an index.js or index.ts file');
      }

      for (const file of files) {
        const stat = await fs.stat(path.join(pluginPath, file));
        if (stat.isFile() && (stat.mode & parseInt('111', 8))) {
          issues.push(`Executable file detected: ${file}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to validate plugin structure: ${error}`);
    }

    return { issues, errors };
  }

  private calculateCompatibilityScore(packageJson: any): number {
    let score = 0;

    const strrayEngine = packageJson.engines?.strray;
    if (strrayEngine) {
      if (strrayEngine === '^1.0.0') score += 30;
      else if (strrayEngine.startsWith('^1.')) score += 20;
      else if (strrayEngine.startsWith('~1.')) score += 15;
      else score += 5;
    }

    const nodeEngine = packageJson.engines?.node;
    if (nodeEngine) {
      if (nodeEngine === '^18.0.0' || nodeEngine === '>=18.0.0') score += 20;
      else if (nodeEngine.startsWith('^18.')) score += 15;
      else score += 5;
    }

    const keywords = packageJson.keywords || [];
    const relevantKeywords = ['strray', 'plugin', 'agent', 'ai', 'framework'];
    const relevantCount = keywords.filter((k: string) =>
      relevantKeywords.some(r => k.toLowerCase().includes(r))
    ).length;
    score += Math.min(relevantCount * 5, 25);

    if (packageJson.description) score += 10;
    if (packageJson.homepage) score += 5;
    if (packageJson.repository) score += 5;

    return Math.min(score, 100);
  }
}

export class PluginSandbox {
  private sandbox: any = null;
  private config: PluginSandboxConfig;

  constructor(config: Partial<PluginSandboxConfig> = {}) {
    this.config = {
      memoryLimit: 50, // 50MB
      timeout: 30000, // 30 seconds
      allowedModules: ['util', 'events', 'stream', 'buffer', 'string_decoder'],
      networkAccess: false,
      fileSystemAccess: false,
      environmentVariables: [],
      ...config
    };
  }

  /**
   * Execute plugin code in sandbox
   */
  async executePlugin(pluginPath: string, method: string, ...args: any[]): Promise<any> {
    const vm = require('vm');
    const fs = require('fs').promises;
    const path = require('path');

    const pluginCode = await fs.readFile(path.join(pluginPath, 'index.js'), 'utf-8');

    const context = vm.createContext({
      console: {
        log: (...args: any[]) => console.log('[PLUGIN]', ...args),
        error: (...args: any[]) => console.error('[PLUGIN]', ...args),
        warn: (...args: any[]) => console.warn('[PLUGIN]', ...args)
      },
      require: this.createRestrictedRequire(),
      process: {
        env: this.filterEnvironmentVariables(),
        version: process.version,
        platform: process.platform
      },
      Buffer: Buffer,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval
    });

    const script = new vm.Script(pluginCode);
    const pluginInstance = script.runInContext(context);

    return Promise.race([
      pluginInstance[method](...args),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Plugin execution timeout')), this.config.timeout)
      )
    ]);
  }

  private createRestrictedRequire() {
    const Module = require('module');
    const originalRequire = Module.prototype.require;

    return (id: string) => {
      if (!this.config.allowedModules.includes(id)) {
        throw new Error(`Module '${id}' is not allowed in plugin sandbox`);
      }
      return originalRequire.call(this, id);
    };
  }

  private filterEnvironmentVariables(): Record<string, string> {
    const filtered: Record<string, string> = {};

    for (const key of this.config.environmentVariables) {
      if (process.env[key]) {
        filtered[key] = process.env[key]!;
      }
    }

    return filtered;
  }
}

export class PluginRegistry {
  private plugins = new Map<string, PluginInterface>();
  private activePlugins = new Set<string>();
  private validator: PluginValidator;
  private sandbox: PluginSandbox;

  constructor() {
    this.validator = new PluginValidator();
    this.sandbox = new PluginSandbox();
  }

  /**
   * Register a plugin
   */
  async registerPlugin(pluginPath: string): Promise<{ success: boolean; errors: string[] }> {
    try {
      const validation = await this.validator.validatePlugin(pluginPath);
      if (!validation.valid) {
        return {
          success: false,
          errors: [...validation.errors, ...validation.securityIssues]
        };
      }

      const pluginInstance = await this.sandbox.executePlugin(pluginPath, 'createPlugin');

      this.plugins.set(pluginInstance.metadata.id, pluginInstance);

      console.log(`✅ Plugin registered: ${pluginInstance.metadata.name} v${pluginInstance.metadata.version}`);

      return { success: true, errors: [] };

    } catch (error) {
      return {
        success: false,
        errors: [`Plugin registration failed: ${error}`]
      };
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginId: string, config: any = {}): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`Plugin ${pluginId} not found`);
      return false;
    }

    try {
      await plugin.initialize(config);
      await plugin.activate();
      this.activePlugins.add(pluginId);

      console.log(`✅ Plugin activated: ${plugin.metadata.name}`);
      return true;

    } catch (error) {
      console.error(`❌ Plugin activation failed: ${error}`);
      return false;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    try {
      await plugin.deactivate();
      this.activePlugins.delete(pluginId);

      console.log(`✅ Plugin deactivated: ${plugin.metadata.name}`);
      return true;

    } catch (error) {
      console.error(`❌ Plugin deactivation failed: ${error}`);
      return false;
    }
  }

  /**
   * Get plugin instance
   */
  getPlugin(pluginId: string): PluginInterface | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * List all registered plugins
   */
  listPlugins(): Array<{ id: string; name: string; version: string; active: boolean }> {
    return Array.from(this.plugins.entries()).map(([id, plugin]) => ({
      id,
      name: plugin.metadata.name,
      version: plugin.metadata.version,
      active: this.activePlugins.has(id)
    }));
  }

  /**
   * Get plugin health status
   */
  async getPluginHealth(pluginId: string): Promise<PluginHealthStatus | null> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return null;

    try {
      return await plugin.getHealthStatus();
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: Date.now(),
        uptime: 0,
        errorCount: 1,
        warningCount: 0,
        details: { error: String(error) }
      };
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    if (this.activePlugins.has(pluginId)) {
      await this.deactivatePlugin(pluginId);
    }

    try {
      await plugin.dispose();
    } catch (error) {
      console.warn(`Plugin disposal failed: ${error}`);
    }

    this.plugins.delete(pluginId);
    console.log(`✅ Plugin unregistered: ${plugin.metadata.name}`);

    return true;
  }
}

export const pluginValidator = new PluginValidator();
export const pluginSandbox = new PluginSandbox();
export const pluginRegistry = new PluginRegistry();