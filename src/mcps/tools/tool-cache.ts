/**
 * Tool Cache
 *
 * Caches discovered tools to reduce network round-trips.
 * Part of Phase 4 refactoring - Tool Layer extraction.
 */

import { MCPTool } from '../types/index.js';

interface CacheEntry {
  tools: MCPTool[];
  timestamp: number;
}

export interface ToolCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
}

export class ToolCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private accessOrder: string[] = [];

  constructor(options: ToolCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 300000; // 5 minutes default
    this.maxEntries = options.maxEntries ?? 100;
  }

  /**
   * Get cached tools for a server
   */
  get(serverName: string): MCPTool[] | null {
    const entry = this.cache.get(serverName);

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(serverName);
      this.removeFromAccessOrder(serverName);
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(serverName);

    return entry.tools;
  }

  /**
   * Cache tools for a server
   */
  set(serverName: string, tools: MCPTool[]): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxEntries && !this.cache.has(serverName)) {
      this.evictOldest();
    }

    this.cache.set(serverName, {
      tools,
      timestamp: Date.now(),
    });

    this.updateAccessOrder(serverName);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Remove cached tools for a specific server
   */
  invalidate(serverName: string): boolean {
    this.removeFromAccessOrder(serverName);
    return this.cache.delete(serverName);
  }

  /**
   * Check if tools are cached for a server
   */
  has(serverName: string): boolean {
    const entry = this.cache.get(serverName);

    if (!entry) {
      return false;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(serverName);
      this.removeFromAccessOrder(serverName);
      return false;
    }

    return true;
  }

  /**
   * Get all cached server names
   */
  getCachedServers(): string[] {
    return Array.from(this.cache.keys()).filter((server) => this.has(server));
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxEntries: number; ttlMs: number } {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
    };
  }

  private updateAccessOrder(serverName: string): void {
    this.removeFromAccessOrder(serverName);
    this.accessOrder.push(serverName);
  }

  private removeFromAccessOrder(serverName: string): void {
    const index = this.accessOrder.indexOf(serverName);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private evictOldest(): void {
    if (this.accessOrder.length > 0) {
      const oldest = this.accessOrder.shift();
      if (oldest) {
        this.cache.delete(oldest);
      }
    }
  }
}
