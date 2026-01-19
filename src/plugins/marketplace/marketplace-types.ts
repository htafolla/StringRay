/**
 * StringRay AI v1.1.0 - Secure Plugin Marketplace Architecture
 *
 * Enterprise-grade plugin ecosystem with marketplace, version management,
 * and third-party integrations for StringRay Phase 3.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

// Core marketplace interfaces and types
export interface MarketplacePlugin {
  id: string;
  name: string;
  description: string;
  author: PluginAuthor;
  versions: PluginVersion[];
  latestVersion: string;
  category: PluginCategory;
  tags: string[];
  license: string;
  homepage?: string;
  repository?: string;
  documentation?: string;
  stats: PluginStats;
  metadata: PluginMetadata;
  security: PluginSecurityInfo;
  dependencies: PluginDependency[];
  compatibility: PluginCompatibility;
  status: PluginStatus;
  createdAt: number;
  updatedAt: number;
}

export interface PluginVersion {
  version: string;
  releaseDate: number;
  changelog: string;
  downloadUrl: string;
  checksum: string;
  size: number;
  minStringRayVersion: string;
  maxStringRayVersion?: string;
  deprecated: boolean;
  securityPatches: string[];
  breakingChanges: boolean;
}

export interface PluginAuthor {
  id: string;
  name: string;
  email: string;
  website?: string;
  verified: boolean;
  reputation: number;
  plugins: number;
  joinedAt: number;
}

export interface PluginStats {
  downloads: number;
  installs: number;
  rating: number;
  reviews: number;
  stars: number;
  forks: number;
  issues: number;
  lastDownload: number;
}

export interface PluginMetadata {
  keywords: string[];
  supportedFrameworks: string[];
  supportedPlatforms: string[];
  supportedArchitectures: string[];
  languages: string[];
  runtime: PluginRuntime;
  capabilities: PluginCapabilities;
}

export interface PluginRuntime {
  type: "javascript" | "typescript" | "wasm" | "native";
  engine: string;
  minVersion: string;
  maxVersion?: string;
}

export interface PluginCapabilities {
  hooks: boolean;
  agents: boolean;
  integrations: boolean;
  ui: boolean;
  api: boolean;
  storage: boolean;
  networking: boolean;
  filesystem: boolean;
}

export interface PluginSecurityInfo {
  verified: boolean;
  signature: string;
  lastAudit: number;
  vulnerabilities: PluginVulnerability[];
  compliance: SecurityCompliance;
  sandboxRequired: boolean;
  permissions: PluginPermission[];
}

export interface PluginVulnerability {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  description: string;
  affectedVersions: string[];
  fixedIn?: string;
  cve?: string;
  published: number;
}

export interface SecurityCompliance {
  owasp: boolean;
  gdpr: boolean;
  hipaa: boolean;
  soc2: boolean;
  iso27001: boolean;
}

export interface PluginPermission {
  resource: string;
  action: string;
  condition?: string;
}

export interface PluginDependency {
  name: string;
  version: string;
  type: "required" | "optional" | "peer";
  resolved: boolean;
}

export interface PluginCompatibility {
  strRayVersions: string[];
  nodeVersions: string[];
  os: string[];
  architecture: string[];
  conflicts: string[];
}

export type PluginCategory =
  | "agent"
  | "integration"
  | "ui"
  | "utility"
  | "security"
  | "monitoring"
  | "performance"
  | "testing"
  | "deployment"
  | "other";

export type PluginStatus =
  | "published"
  | "draft"
  | "pending-review"
  | "approved"
  | "rejected"
  | "deprecated"
  | "suspended";

// Marketplace service interfaces
export interface MarketplaceService {
  search(query: MarketplaceSearchQuery): Promise<MarketplaceSearchResult>;
  getPlugin(id: string): Promise<MarketplacePlugin | null>;
  getPluginsByAuthor(authorId: string): Promise<MarketplacePlugin[]>;
  getPluginsByCategory(category: PluginCategory): Promise<MarketplacePlugin[]>;
  getFeaturedPlugins(): Promise<MarketplacePlugin[]>;
  getTrendingPlugins(): Promise<MarketplacePlugin[]>;
  getRecommendedPlugins(userId?: string): Promise<MarketplacePlugin[]>;
  downloadPlugin(id: string, version: string): Promise<PluginDownloadResult>;
  reportPlugin(id: string, report: PluginReport): Promise<boolean>;
}

export interface MarketplaceSearchQuery {
  query?: string;
  category?: PluginCategory;
  author?: string;
  tags?: string[];
  minRating?: number;
  sortBy?: "relevance" | "downloads" | "rating" | "updated" | "created";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
  filters?: MarketplaceFilters;
}

export interface MarketplaceFilters {
  verified?: boolean;
  security?: "high" | "medium" | "low";
  compatibility?: string[];
  license?: string[];
  language?: string[];
  platform?: string[];
}

export interface MarketplaceSearchResult {
  plugins: MarketplacePlugin[];
  total: number;
  facets: SearchFacets;
  query: MarketplaceSearchQuery;
}

export interface SearchFacets {
  categories: Record<PluginCategory, number>;
  authors: Record<string, number>;
  tags: Record<string, number>;
  licenses: Record<string, number>;
  languages: Record<string, number>;
  platforms: Record<string, number>;
}

export interface PluginDownloadResult {
  success: boolean;
  downloadUrl: string;
  checksum: string;
  signature: string;
  expiresAt: number;
  error?: string;
}

export interface PluginReport {
  type:
    | "security"
    | "inappropriate"
    | "malicious"
    | "broken"
    | "spam"
    | "other";
  description: string;
  evidence?: string[];
  contactInfo?: string;
}

// Version management interfaces
export interface VersionManager {
  resolveVersion(
    pluginId: string,
    versionSpec: string,
  ): Promise<PluginVersion | null>;
  checkCompatibility(
    pluginId: string,
    version: string,
    strRayVersion: string,
  ): Promise<CompatibilityResult>;
  getVersionHistory(pluginId: string): Promise<PluginVersion[]>;
  getLatestCompatibleVersion(
    pluginId: string,
    strRayVersion: string,
  ): Promise<PluginVersion | null>;
  validateVersion(version: string): boolean;
  compareVersions(version1: string, version2: string): number;
}

export interface CompatibilityResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
  warnings: string[];
  recommendedVersion?: string;
}

export interface CompatibilityIssue {
  type: "version" | "dependency" | "platform" | "security";
  severity: "error" | "warning" | "info";
  message: string;
  resolution?: string;
}

// Plugin management interfaces
export interface PluginManager {
  install(
    pluginId: string,
    version?: string,
    options?: InstallOptions,
  ): Promise<InstallResult>;
  uninstall(pluginId: string): Promise<UninstallResult>;
  update(pluginId: string, version?: string): Promise<UpdateResult>;
  listInstalled(): Promise<InstalledPlugin[]>;
  getInstalled(pluginId: string): Promise<InstalledPlugin | null>;
  enable(pluginId: string): Promise<boolean>;
  disable(pluginId: string): Promise<boolean>;
  getHealth(pluginId: string): Promise<PluginHealth>;
  validateInstallation(pluginId: string): Promise<ValidationResult>;
  resolveDependencies(
    pluginId: string,
    version: string,
  ): Promise<DependencyResolution>;
}

export interface InstallOptions {
  force?: boolean;
  ignoreDependencies?: boolean;
  sandbox?: boolean;
  permissions?: PluginPermission[];
  config?: Record<string, any>;
}

export interface InstallResult {
  success: boolean;
  plugin: InstalledPlugin;
  dependencies: InstalledPlugin[];
  warnings: string[];
  errors: string[];
}

export interface UninstallResult {
  success: boolean;
  removed: string[];
  warnings: string[];
  errors: string[];
}

export interface UpdateResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  breakingChanges: boolean;
  changelog: string;
  warnings: string[];
  errors: string[];
}

export interface InstalledPlugin {
  id: string;
  name: string;
  version: string;
  path: string;
  status: "installed" | "enabled" | "disabled" | "error";
  config: Record<string, any>;
  permissions: PluginPermission[];
  dependencies: string[];
  dependents: string[];
  installedAt: number;
  lastUsed?: number;
  health: PluginHealth;
}

export interface PluginHealth {
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  lastCheck: number;
  uptime: number;
  errorCount: number;
  warningCount: number;
  metrics: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}

export interface DependencyResolution {
  resolved: boolean;
  dependencies: ResolvedDependency[];
  conflicts: DependencyConflict[];
  missing: string[];
}

export interface ResolvedDependency {
  name: string;
  version: string;
  resolvedVersion: string;
  path: string;
}

export interface DependencyConflict {
  dependency: string;
  requiredBy: string[];
  conflictingVersions: string[];
  resolution?: string;
}

// Security and validation interfaces
export interface SecurityValidator {
  validatePlugin(plugin: MarketplacePlugin): Promise<SecurityValidationResult>;
  validateInstallation(installPath: string): Promise<SecurityValidationResult>;
  scanForVulnerabilities(pluginPath: string): Promise<VulnerabilityScanResult>;
  verifySignature(pluginPath: string, signature: string): Promise<boolean>;
  generateChecksum(pluginPath: string): Promise<string>;
}

export interface SecurityValidationResult {
  valid: boolean;
  score: number;
  issues: SecurityIssue[];
  recommendations: string[];
  compliance: SecurityCompliance;
}

export interface SecurityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: "code" | "dependency" | "permission" | "configuration" | "runtime";
  description: string;
  location?: string;
  cve?: string;
  fix?: string;
}

export interface VulnerabilityScanResult {
  vulnerabilities: PluginVulnerability[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  scanTime: number;
}

// Third-party integration interfaces
export interface IntegrationManager {
  registerProvider(provider: IntegrationProvider): Promise<boolean>;
  getProvider(id: string): IntegrationProvider | null;
  listProviders(): IntegrationProvider[];
  authenticate(providerId: string, credentials: any): Promise<AuthResult>;
  executeIntegration(
    providerId: string,
    action: string,
    params: any,
  ): Promise<IntegrationResult>;
  getWebhooks(providerId: string): Promise<Webhook[]>;
  handleWebhook(
    providerId: string,
    webhook: WebhookPayload,
  ): Promise<WebhookResult>;
}

export interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  category:
    | "authentication"
    | "storage"
    | "communication"
    | "analytics"
    | "deployment"
    | "monitoring";
  authType: "oauth" | "api-key" | "basic" | "certificate";
  capabilities: string[];
  configSchema: any;
  webhookSupport: boolean;
  rateLimits: RateLimit;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
}

export interface IntegrationResult {
  success: boolean;
  data: any;
  metadata: Record<string, any>;
  error?: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

export interface WebhookPayload {
  event: string;
  data: any;
  signature: string;
  timestamp: number;
}

export interface WebhookResult {
  success: boolean;
  response?: any;
  error?: string;
}

export interface RateLimit {
  requests: number;
  period: number; // in seconds
  burst?: number;
}

// Registry interfaces
export interface PluginRegistry {
  register(plugin: MarketplacePlugin): Promise<boolean>;
  unregister(id: string): Promise<boolean>;
  update(id: string, updates: Partial<MarketplacePlugin>): Promise<boolean>;
  get(id: string): Promise<MarketplacePlugin | null>;
  search(query: RegistrySearchQuery): Promise<MarketplacePlugin[]>;
  getByAuthor(authorId: string): Promise<MarketplacePlugin[]>;
  getByCategory(category: PluginCategory): Promise<MarketplacePlugin[]>;
  getStats(): Promise<RegistryStats>;
}

export interface RegistrySearchQuery {
  query?: string;
  category?: PluginCategory;
  author?: string;
  tags?: string[];
  status?: PluginStatus;
  limit?: number;
  offset?: number;
}

export interface RegistryStats {
  totalPlugins: number;
  totalAuthors: number;
  totalDownloads: number;
  totalInstalls: number;
  pluginsByCategory: Record<PluginCategory, number>;
  pluginsByStatus: Record<PluginStatus, number>;
  lastUpdated: number;
}

// Discovery interfaces
export interface DiscoveryService {
  indexPlugin(plugin: MarketplacePlugin): Promise<boolean>;
  removePlugin(id: string): Promise<boolean>;
  search(query: DiscoveryQuery): Promise<DiscoveryResult>;
  getRecommendations(
    userId?: string,
    context?: any,
  ): Promise<MarketplacePlugin[]>;
  getTrending(): Promise<MarketplacePlugin[]>;
  getFeatured(): Promise<MarketplacePlugin[]>;
  getSimilar(pluginId: string): Promise<MarketplacePlugin[]>;
  updateStats(id: string, stats: Partial<PluginStats>): Promise<boolean>;
}

export interface DiscoveryQuery {
  query?: string;
  category?: PluginCategory;
  tags?: string[];
  author?: string;
  minRating?: number;
  sortBy?: "relevance" | "downloads" | "rating" | "trending";
  filters?: DiscoveryFilters;
  limit?: number;
  offset?: number;
}

export interface DiscoveryFilters {
  verified?: boolean;
  security?: "high" | "medium" | "low";
  compatibility?: string[];
  license?: string[];
  language?: string[];
  platform?: string[];
  dateRange?: {
    from: number;
    to: number;
  };
}

export interface DiscoveryResult {
  plugins: MarketplacePlugin[];
  total: number;
  facets: DiscoveryFacets;
  suggestions: string[];
  queryTime: number;
}

export interface DiscoveryFacets {
  categories: Record<PluginCategory, number>;
  tags: Record<string, number>;
  authors: Record<string, number>;
  licenses: Record<string, number>;
  languages: Record<string, number>;
  platforms: Record<string, number>;
  ratings: Record<string, number>;
}
