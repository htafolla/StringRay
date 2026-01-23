/**
 * StringRay AI v1.1.1 - Plugin Marketplace Service
 *
 * Core marketplace service implementing plugin discovery, search, and curation
 * with enterprise-grade security and performance optimizations.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { MarketplaceService, MarketplacePlugin, MarketplaceSearchQuery, MarketplaceSearchResult, PluginDownloadResult, PluginReport } from "./marketplace-types";
/**
 * Enterprise-grade marketplace service with comprehensive plugin management
 */
export declare class PluginMarketplaceService implements MarketplaceService {
    private plugins;
    private searchIndex;
    private downloadTokens;
    /**
     * Search plugins with advanced filtering and ranking
     */
    search(query: MarketplaceSearchQuery): Promise<MarketplaceSearchResult>;
    /**
     * Get plugin by ID with caching and validation
     */
    getPlugin(id: string): Promise<MarketplacePlugin | null>;
    /**
     * Get plugins by author with reputation filtering
     */
    getPluginsByAuthor(authorId: string): Promise<MarketplacePlugin[]>;
    /**
     * Get plugins by category with curation
     */
    getPluginsByCategory(category: string): Promise<MarketplacePlugin[]>;
    /**
     * Get featured plugins (curated selection)
     */
    getFeaturedPlugins(): Promise<MarketplacePlugin[]>;
    /**
     * Get trending plugins based on recent activity
     */
    getTrendingPlugins(): Promise<MarketplacePlugin[]>;
    /**
     * Get personalized recommendations
     */
    getRecommendedPlugins(userId?: string): Promise<MarketplacePlugin[]>;
    /**
     * Download plugin with secure token generation
     */
    downloadPlugin(id: string, version: string): Promise<PluginDownloadResult>;
    /**
     * Report plugin for moderation
     */
    reportPlugin(id: string, report: PluginReport): Promise<boolean>;
    /**
     * Perform advanced search with ranking
     */
    private performSearch;
    /**
     * Filter plugins by text search
     */
    private filterByText;
    /**
     * Apply advanced filters
     */
    private applyAdvancedFilters;
    /**
     * Sort search results
     */
    private sortResults;
    /**
     * Generate search facets
     */
    private generateFacets;
    /**
     * Calculate featured score for curation
     */
    private calculateFeaturedScore;
    /**
     * Calculate trend score for trending plugins
     */
    private calculateTrendScore;
    /**
     * Calculate relevance score for search
     */
    private calculateRelevanceScore;
    /**
     * Calculate security score
     */
    private calculateSecurityScore;
    /**
     * Generate secure download token
     */
    private generateDownloadToken;
    /**
     * Cleanup expired download tokens
     */
    private cleanupExpiredTokens;
    /**
     * Register plugin in marketplace
     */
    registerPlugin(plugin: MarketplacePlugin): void;
    /**
     * Update search index for plugin
     */
    private updateSearchIndex;
}
export declare const marketplaceService: PluginMarketplaceService;
//# sourceMappingURL=marketplace-service.d.ts.map