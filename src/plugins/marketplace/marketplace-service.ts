/**
 * StringRay Framework v1.0.0 - Plugin Marketplace Service
 *
 * Core marketplace service implementing plugin discovery, search, and curation
 * with enterprise-grade security and performance optimizations.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import {
  MarketplaceService,
  MarketplacePlugin,
  MarketplaceSearchQuery,
  MarketplaceSearchResult,
  PluginDownloadResult,
  PluginReport,
  SearchFacets,
  MarketplaceFilters,
} from "./marketplace-types";
import { securityHardeningSystem } from "../../security/security-hardening-system";
import { enterpriseMonitoringSystem } from "../../monitoring/enterprise-monitoring-system";

/**
 * Enterprise-grade marketplace service with comprehensive plugin management
 */
export class PluginMarketplaceService implements MarketplaceService {
  private plugins = new Map<string, MarketplacePlugin>();
  private searchIndex = new Map<string, Set<string>>();
  private downloadTokens = new Map<
    string,
    { token: string; expires: number }
  >();

  /**
   * Search plugins with advanced filtering and ranking
   */
  async search(
    query: MarketplaceSearchQuery,
  ): Promise<MarketplaceSearchResult> {
    // Basic validation for null/undefined
    if (query == null) {
      throw new Error("Search query cannot be null or undefined");
    }

    // Input validation
    const validation = securityHardeningSystem.validateInput(
      query,
      "marketplace-search",
    );
    if (!validation.isValid) {
      throw new Error(`Invalid search query: ${validation.errors.join(", ")}`);
    }

    const sanitizedQuery = validation.sanitizedValue as MarketplaceSearchQuery;

    // Additional validation for query structure
    if (
      sanitizedQuery.limit != null &&
      (typeof sanitizedQuery.limit !== "number" ||
        sanitizedQuery.limit < 0 ||
        !Number.isFinite(sanitizedQuery.limit))
    ) {
      throw new Error("Invalid limit parameter");
    }
    if (
      sanitizedQuery.offset != null &&
      (typeof sanitizedQuery.offset !== "number" ||
        sanitizedQuery.offset < 0 ||
        !Number.isFinite(sanitizedQuery.offset))
    ) {
      throw new Error("Invalid offset parameter");
    }
    if (
      sanitizedQuery.minRating != null &&
      (typeof sanitizedQuery.minRating !== "number" ||
        sanitizedQuery.minRating < 0 ||
        sanitizedQuery.minRating > 5)
    ) {
      throw new Error("Invalid minRating parameter");
    }
    if (
      sanitizedQuery.query != null &&
      typeof sanitizedQuery.query !== "string"
    ) {
      throw new Error("Invalid query parameter");
    }

    try {
      // Perform search with ranking and filtering
      const { results, total } = await this.performSearch(sanitizedQuery);
      const facets = await this.generateFacets(results);

      // Log search metrics
      enterpriseMonitoringSystem.recordMetric("marketplace.search", {
        query: sanitizedQuery.query,
        resultCount: results.length,
        filters: sanitizedQuery.filters,
      });

      return {
        plugins: results,
        total,
        facets,
        query: sanitizedQuery,
      };
    } catch (error) {
      enterpriseMonitoringSystem.recordError("marketplace.search", error);
      throw error;
    }
  }

  /**
   * Get plugin by ID with caching and validation
   */
  async getPlugin(id: string): Promise<MarketplacePlugin | null> {
    // Input validation
    const validation = securityHardeningSystem.validateInput(id, "plugin-id");
    if (!validation.isValid) {
      throw new Error(`Invalid plugin ID: ${validation.errors.join(", ")}`);
    }

    const sanitizedId = validation.sanitizedValue as string;

    try {
      const plugin = this.plugins.get(sanitizedId);
      if (plugin) {
        // Update access metrics
        plugin.stats.lastDownload = Date.now();
        enterpriseMonitoringSystem.recordMetric("marketplace.plugin_access", {
          pluginId: sanitizedId,
          pluginName: plugin.name,
        });
      }

      return plugin || null;
    } catch (error) {
      enterpriseMonitoringSystem.recordError("marketplace.get_plugin", error);
      throw error;
    }
  }

  /**
   * Get plugins by author with reputation filtering
   */
  async getPluginsByAuthor(authorId: string): Promise<MarketplacePlugin[]> {
    // Basic validation for null/undefined
    if (authorId == null) {
      throw new Error("Author ID cannot be null or undefined");
    }

    const validation = securityHardeningSystem.validateInput(
      authorId,
      "author-id",
    );
    if (!validation.isValid) {
      throw new Error(`Invalid author ID: ${validation.errors.join(", ")}`);
    }

    const sanitizedAuthorId = validation.sanitizedValue as string;

    try {
      const plugins = Array.from(this.plugins.values()).filter(
        (plugin) =>
          plugin.author.id === sanitizedAuthorId &&
          plugin.status === "published",
      );

      return plugins.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      enterpriseMonitoringSystem.recordError(
        "marketplace.get_by_author",
        error,
      );
      throw error;
    }
  }

  /**
   * Get plugins by category with curation
   */
  async getPluginsByCategory(category: string): Promise<MarketplacePlugin[]> {
    const validation = securityHardeningSystem.validateInput(
      category,
      "plugin-category",
    );
    if (!validation.isValid) {
      throw new Error(`Invalid category: ${validation.errors.join(", ")}`);
    }

    const sanitizedCategory = validation.sanitizedValue as string;

    try {
      const plugins = Array.from(this.plugins.values()).filter(
        (plugin) =>
          plugin.category === sanitizedCategory &&
          plugin.status === "published",
      );

      // Sort by rating and downloads
      return plugins.sort((a, b) => {
        const aScore =
          a.stats.rating * 0.7 + Math.log(a.stats.downloads + 1) * 0.3;
        const bScore =
          b.stats.rating * 0.7 + Math.log(b.stats.downloads + 1) * 0.3;
        return bScore - aScore;
      });
    } catch (error) {
      enterpriseMonitoringSystem.recordError(
        "marketplace.get_by_category",
        error,
      );
      throw error;
    }
  }

  /**
   * Get featured plugins (curated selection)
   */
  async getFeaturedPlugins(): Promise<MarketplacePlugin[]> {
    try {
      const plugins = Array.from(this.plugins.values()).filter(
        (plugin) => plugin.status === "published" && plugin.stats.rating >= 4.0,
      );

      // Curate featured plugins based on multiple criteria
      const featured = plugins
        .sort((a, b) => {
          const aScore = this.calculateFeaturedScore(a);
          const bScore = this.calculateFeaturedScore(b);
          return bScore - aScore;
        })
        .slice(0, 12); // Top 12 featured plugins

      return featured;
    } catch (error) {
      enterpriseMonitoringSystem.recordError("marketplace.get_featured", error);
      throw error;
    }
  }

  /**
   * Get trending plugins based on recent activity
   */
  async getTrendingPlugins(): Promise<MarketplacePlugin[]> {
    try {
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      const plugins = Array.from(this.plugins.values())
        .filter((plugin) => plugin.status === "published")
        .map((plugin) => ({
          plugin,
          trendScore: this.calculateTrendScore(plugin, weekAgo),
        }))
        .filter((item) => item.trendScore > 0)
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 20)
        .map((item) => item.plugin);

      return plugins;
    } catch (error) {
      enterpriseMonitoringSystem.recordError("marketplace.get_trending", error);
      throw error;
    }
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendedPlugins(userId?: string): Promise<MarketplacePlugin[]> {
    try {
      // For now, return highly-rated plugins from different categories
      // In a full implementation, this would use user behavior analysis
      const plugins = Array.from(this.plugins.values()).filter(
        (plugin) => plugin.status === "published" && plugin.stats.rating >= 3.5,
      );

      // Group by category and pick top from each
      const categories = new Map<string, MarketplacePlugin[]>();
      for (const plugin of plugins) {
        if (!categories.has(plugin.category)) {
          categories.set(plugin.category, []);
        }
        categories.get(plugin.category)!.push(plugin);
      }

      const recommendations: MarketplacePlugin[] = [];
      for (const categoryPlugins of categories.values()) {
        const topPlugins = categoryPlugins
          .sort((a, b) => b.stats.rating - a.stats.rating)
          .slice(0, 3);
        recommendations.push(...topPlugins);
      }

      return recommendations.slice(0, 15);
    } catch (error) {
      enterpriseMonitoringSystem.recordError(
        "marketplace.get_recommended",
        error,
      );
      throw error;
    }
  }

  /**
   * Download plugin with secure token generation
   */
  async downloadPlugin(
    id: string,
    version: string,
  ): Promise<PluginDownloadResult> {
    const validation = securityHardeningSystem.validateInput(
      { id, version },
      "plugin-download",
    );
    if (!validation.isValid) {
      return {
        success: false,
        downloadUrl: "",
        checksum: "",
        signature: "",
        expiresAt: 0,
        error: `Invalid download request: ${validation.errors.join(", ")}`,
      };
    }

    const { id: sanitizedId, version: sanitizedVersion } =
      validation.sanitizedValue as any;

    try {
      const plugin = this.plugins.get(sanitizedId);
      if (!plugin) {
        return {
          success: false,
          downloadUrl: "",
          checksum: "",
          signature: "",
          expiresAt: 0,
          error: "Plugin not found",
        };
      }

      const pluginVersion = plugin.versions.find(
        (v) => v.version === sanitizedVersion,
      );
      if (!pluginVersion) {
        return {
          success: false,
          downloadUrl: "",
          checksum: "",
          signature: "",
          expiresAt: 0,
          error: "Version not found",
        };
      }

      // Generate secure download token
      const token = this.generateDownloadToken(sanitizedId, sanitizedVersion);
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      // Update download stats
      plugin.stats.downloads++;
      plugin.stats.lastDownload = Date.now();

      enterpriseMonitoringSystem.recordMetric("marketplace.download", {
        pluginId: sanitizedId,
        version: sanitizedVersion,
        pluginName: plugin.name,
      });

      return {
        success: true,
        downloadUrl: pluginVersion.downloadUrl,
        checksum: pluginVersion.checksum,
        signature: plugin.security.signature,
        expiresAt,
      };
    } catch (error) {
      enterpriseMonitoringSystem.recordError("marketplace.download", error);
      return {
        success: false,
        downloadUrl: "",
        checksum: "",
        signature: "",
        expiresAt: 0,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  }

  /**
   * Report plugin for moderation
   */
  async reportPlugin(id: string, report: PluginReport): Promise<boolean> {
    const validation = securityHardeningSystem.validateInput(
      { id, report },
      "plugin-report",
    );
    if (!validation.isValid) {
      throw new Error(`Invalid report: ${validation.errors.join(", ")}`);
    }

    const { id: sanitizedId, report: sanitizedReport } =
      validation.sanitizedValue as any;

    try {
      const plugin = this.plugins.get(sanitizedId);
      if (!plugin) {
        throw new Error("Plugin not found");
      }

      // In a full implementation, this would queue the report for moderation
      // For now, we'll log it and potentially flag the plugin
      enterpriseMonitoringSystem.recordMetric("marketplace.report", {
        pluginId: sanitizedId,
        reportType: sanitizedReport.type,
        pluginName: plugin.name,
      });

      console.warn(
        `Plugin reported: ${plugin.name} (${sanitizedId}) - ${sanitizedReport.type}: ${sanitizedReport.description}`,
      );

      return true;
    } catch (error) {
      enterpriseMonitoringSystem.recordError("marketplace.report", error);
      throw error;
    }
  }

  /**
   * Perform advanced search with ranking
   */
  private async performSearch(
    query: MarketplaceSearchQuery,
  ): Promise<{ results: MarketplacePlugin[]; total: number }> {
    let candidates = Array.from(this.plugins.values()).filter(
      (plugin) => plugin.status === "published",
    );

    // Apply text search
    if (query.query) {
      candidates = this.filterByText(candidates, query.query);
    }

    // Apply category filter
    if (query.category) {
      candidates = candidates.filter(
        (plugin) => plugin.category === query.category,
      );
    }

    // Apply author filter
    if (query.author) {
      candidates = candidates.filter(
        (plugin) => plugin.author.id === query.author,
      );
    }

    // Apply tag filters
    if (query.tags && query.tags.length > 0) {
      candidates = candidates.filter((plugin) =>
        query.tags!.some((tag) => plugin.tags.includes(tag)),
      );
    }

    // Apply rating filter
    if (query.minRating) {
      candidates = candidates.filter(
        (plugin) => plugin.stats.rating >= query.minRating!,
      );
    }

    // Apply advanced filters
    if (query.filters) {
      candidates = this.applyAdvancedFilters(candidates, query.filters);
    }

    // Sort results
    candidates = this.sortResults(candidates, query.sortBy, query.sortOrder);

    // Get total before pagination
    const total = candidates.length;

    // Apply pagination
    const limit = Math.min(query.limit || 50, 100); // Max 100 results
    const offset = query.offset || 0;

    return {
      results: candidates.slice(offset, offset + limit),
      total,
    };
  }

  /**
   * Filter plugins by text search
   */
  private filterByText(
    plugins: MarketplacePlugin[],
    query: string,
  ): MarketplacePlugin[] {
    const searchTerms = query.toLowerCase().split(/\s+/);

    return plugins.filter((plugin) => {
      const searchableText = [
        plugin.name,
        plugin.description,
        plugin.author.name,
        ...plugin.tags,
        plugin.category,
      ]
        .join(" ")
        .toLowerCase();

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }

  /**
   * Apply advanced filters
   */
  private applyAdvancedFilters(
    plugins: MarketplacePlugin[],
    filters: MarketplaceFilters,
  ): MarketplacePlugin[] {
    return plugins.filter((plugin) => {
      // Verified filter
      if (
        filters.verified !== undefined &&
        plugin.author.verified !== filters.verified
      ) {
        return false;
      }

      // Security level filter
      if (filters.security) {
        const securityScore = this.calculateSecurityScore(plugin);
        if (filters.security === "high" && securityScore < 80) return false;
        if (filters.security === "medium" && securityScore < 60) return false;
      }

      // Compatibility filters
      if (filters.compatibility && filters.compatibility.length > 0) {
        const compatible = filters.compatibility.some((version) =>
          plugin.compatibility.strRayVersions.includes(version),
        );
        if (!compatible) return false;
      }

      // License filters
      if (filters.license && filters.license.length > 0) {
        if (!filters.license.includes(plugin.license)) return false;
      }

      // Language filters
      if (filters.language && filters.language.length > 0) {
        const hasLanguage = filters.language.some((lang) =>
          plugin.metadata.languages.includes(lang),
        );
        if (!hasLanguage) return false;
      }

      // Platform filters
      if (filters.platform && filters.platform.length > 0) {
        const hasPlatform = filters.platform.some((platform) =>
          plugin.metadata.supportedPlatforms.includes(platform),
        );
        if (!hasPlatform) return false;
      }

      return true;
    });
  }

  /**
   * Sort search results
   */
  private sortResults(
    plugins: MarketplacePlugin[],
    sortBy?: string,
    sortOrder?: string,
  ): MarketplacePlugin[] {
    const order = sortOrder === "asc" ? 1 : -1;

    return plugins.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "downloads":
          comparison = a.stats.downloads - b.stats.downloads;
          break;
        case "rating":
          comparison = a.stats.rating - b.stats.rating;
          break;
        case "updated":
          comparison = a.updatedAt - b.updatedAt;
          break;
        case "created":
          comparison = a.createdAt - b.createdAt;
          break;
        case "relevance":
        default:
          // Default relevance scoring
          const aScore = this.calculateRelevanceScore(a);
          const bScore = this.calculateRelevanceScore(b);
          comparison = aScore - bScore;
          break;
      }

      return comparison * order;
    });
  }

  /**
   * Generate search facets
   */
  private async generateFacets(
    plugins: MarketplacePlugin[],
  ): Promise<SearchFacets> {
    const facets: SearchFacets = {
      categories: {
        agent: 0,
        integration: 0,
        ui: 0,
        utility: 0,
        security: 0,
        monitoring: 0,
        performance: 0,
        testing: 0,
        deployment: 0,
        other: 0,
      },
      authors: {},
      tags: {},
      licenses: {},
      languages: {},
      platforms: {},
    };

    for (const plugin of plugins) {
      // Categories
      facets.categories[plugin.category] =
        (facets.categories[plugin.category] || 0) + 1;

      // Authors
      facets.authors[plugin.author.name] =
        (facets.authors[plugin.author.name] || 0) + 1;

      // Tags
      for (const tag of plugin.tags) {
        facets.tags[tag] = (facets.tags[tag] || 0) + 1;
      }

      // Licenses
      facets.licenses[plugin.license] =
        (facets.licenses[plugin.license] || 0) + 1;

      // Languages
      for (const lang of plugin.metadata.languages) {
        facets.languages[lang] = (facets.languages[lang] || 0) + 1;
      }

      // Platforms
      for (const platform of plugin.metadata.supportedPlatforms) {
        facets.platforms[platform] = (facets.platforms[platform] || 0) + 1;
      }
    }

    return facets;
  }

  /**
   * Calculate featured score for curation
   */
  private calculateFeaturedScore(plugin: MarketplacePlugin): number {
    const recencyWeight = Math.max(
      0,
      1 - (Date.now() - plugin.updatedAt) / (30 * 24 * 60 * 60 * 1000),
    ); // 30 days
    const ratingWeight = plugin.stats.rating / 5.0;
    const downloadWeight = Math.min(
      1,
      Math.log(plugin.stats.downloads + 1) / Math.log(1000),
    );
    const authorWeight = plugin.author.verified ? 1.2 : 1.0;

    return (
      recencyWeight * 0.2 +
      ratingWeight * 0.4 +
      downloadWeight * 0.3 +
      authorWeight * 0.1
    );
  }

  /**
   * Calculate trend score for trending plugins
   */
  private calculateTrendScore(
    plugin: MarketplacePlugin,
    since: number,
  ): number {
    // Simplified trend calculation - in reality would use time-series data
    const recentDownloads = plugin.stats.downloads; // Would be downloads since 'since'
    const recentRating = plugin.stats.rating;

    return recentDownloads * 0.7 + recentRating * 10 * 0.3;
  }

  /**
   * Calculate relevance score for search
   */
  private calculateRelevanceScore(plugin: MarketplacePlugin): number {
    return (
      plugin.stats.rating * 0.4 +
      Math.log(plugin.stats.downloads + 1) * 0.3 +
      (plugin.author.reputation / 100) * 0.2 +
      (plugin.author.verified ? 0.1 : 0)
    );
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(plugin: MarketplacePlugin): number {
    let score = 50; // Base score

    if (plugin.security.verified) score += 20;
    if (plugin.security.compliance.owasp) score += 10;
    if (plugin.security.compliance.gdpr) score += 5;
    if (plugin.security.compliance.hipaa) score += 5;
    if (plugin.security.compliance.soc2) score += 5;
    if (plugin.security.compliance.iso27001) score += 5;

    if (plugin.security.vulnerabilities.length === 0) score += 10;
    else {
      const criticalCount = plugin.security.vulnerabilities.filter(
        (v) => v.severity === "critical",
      ).length;
      const highCount = plugin.security.vulnerabilities.filter(
        (v) => v.severity === "high",
      ).length;
      score -= criticalCount * 20 + highCount * 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate secure download token
   */
  private generateDownloadToken(pluginId: string, version: string): string {
    const crypto = require("crypto");
    const payload = `${pluginId}:${version}:${Date.now()}`;
    const token = crypto.createHash("sha256").update(payload).digest("hex");

    // Store token with expiration
    this.downloadTokens.set(token, {
      token,
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    // Cleanup expired tokens periodically
    this.cleanupExpiredTokens();

    return token;
  }

  /**
   * Cleanup expired download tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of this.downloadTokens.entries()) {
      if (data.expires < now) {
        this.downloadTokens.delete(token);
      }
    }
  }

  /**
   * Register plugin in marketplace
   */
  registerPlugin(plugin: MarketplacePlugin): void {
    this.plugins.set(plugin.id, plugin);
    this.updateSearchIndex(plugin);
  }

  /**
   * Update search index for plugin
   */
  private updateSearchIndex(plugin: MarketplacePlugin): void {
    const terms = [
      plugin.name.toLowerCase(),
      plugin.description.toLowerCase(),
      plugin.author.name.toLowerCase(),
      plugin.category.toLowerCase(),
      ...plugin.tags.map((t) => t.toLowerCase()),
    ];

    for (const term of terms) {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term)!.add(plugin.id);
    }
  }
}

// Export singleton instance
export const marketplaceService = new PluginMarketplaceService();
