/**
 * Tool Cache Tests
 *
 * Comprehensive test suite for the ToolCache class.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolCache } from '../tool-cache.js';
import { MCPTool } from '../../types/index.js';

describe('ToolCache', () => {
  let cache: ToolCache;

  beforeEach(() => {
    cache = new ToolCache();
  });

  describe('get', () => {
    it('should return cached tools', () => {
      const tools: MCPTool[] = [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
      ];

      cache.set('server1', tools);
      const cached = cache.get('server1');

      expect(cached).toEqual(tools);
    });

    it('should return null for non-existent server', () => {
      const result = cache.get('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for expired cache entry', () => {
      const tools: MCPTool[] = [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
      ];

      cache = new ToolCache({ ttlMs: -1 }); // Already expired
      cache.set('server1', tools);

      const result = cache.get('server1');

      expect(result).toBeNull();
    });

    it('should remove expired entry on get', () => {
      const tools: MCPTool[] = [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
      ];

      cache = new ToolCache({ ttlMs: -1 });
      cache.set('server1', tools);
      cache.get('server1');

      expect(cache.has('server1')).toBe(false);
    });
  });

  describe('set', () => {
    it('should cache tools', () => {
      const tools: MCPTool[] = [
        { name: 'tool1', description: 'Test', inputSchema: { type: 'object' } },
      ];

      cache.set('server1', tools);

      expect(cache.has('server1')).toBe(true);
    });

    it('should update existing cache entry', () => {
      const tools1: MCPTool[] = [
        { name: 'tool1', description: 'Test 1', inputSchema: { type: 'object' } },
      ];
      const tools2: MCPTool[] = [
        { name: 'tool1', description: 'Test 2', inputSchema: { type: 'object' } },
      ];

      cache.set('server1', tools1);
      cache.set('server1', tools2);

      expect(cache.get('server1')).toEqual(tools2);
    });

    it('should evict oldest entry when at capacity', () => {
      cache = new ToolCache({ maxEntries: 2 });

      cache.set('server1', [{ name: 'tool1', description: 'Test', inputSchema: { type: "object" } }]);
      cache.set('server2', [{ name: 'tool2', description: 'Test', inputSchema: { type: "object" } }]);
      cache.set('server3', [{ name: 'tool3', description: 'Test', inputSchema: { type: "object" } }]);

      expect(cache.has('server1')).toBe(false);
      expect(cache.has('server2')).toBe(true);
      expect(cache.has('server3')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('server1', [{ name: 'tool1', description: 'Test', inputSchema: { type: "object" } }]);
      cache.set('server2', [{ name: 'tool2', description: 'Test', inputSchema: { type: "object" } }]);

      cache.clear();

      expect(cache.has('server1')).toBe(false);
      expect(cache.has('server2')).toBe(false);
      expect(cache.getCachedServers()).toEqual([]);
    });
  });

  describe('invalidate', () => {
    it('should remove specific server entry', () => {
      cache.set('server1', [{ name: 'tool1', description: 'Test', inputSchema: { type: "object" } }]);

      const result = cache.invalidate('server1');

      expect(result).toBe(true);
      expect(cache.has('server1')).toBe(false);
    });

    it('should return false for non-existent server', () => {
      const result = cache.invalidate('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for valid cached entry', () => {
      cache.set('server1', [{ name: 'tool1', description: 'Test', inputSchema: { type: "object" } }]);

      expect(cache.has('server1')).toBe(true);
    });

    it('should return false for non-existent entry', () => {
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should return false for expired entry', () => {
      cache = new ToolCache({ ttlMs: -1 });
      cache.set('server1', [{ name: 'tool1', description: 'Test', inputSchema: { type: "object" } }]);

      expect(cache.has('server1')).toBe(false);
    });
  });

  describe('getCachedServers', () => {
    it('should return all cached server names', () => {
      cache.set('server1', [{ name: 'tool1', description: 'Test', inputSchema: { type: "object" } }]);
      cache.set('server2', [{ name: 'tool2', description: 'Test', inputSchema: { type: "object" } }]);

      const servers = cache.getCachedServers();

      expect(servers).toContain('server1');
      expect(servers).toContain('server2');
      expect(servers).toHaveLength(2);
    });

    it('should not include expired servers', () => {
      cache = new ToolCache({ ttlMs: -1 });
      cache.set('server1', [{ name: 'tool1', description: 'Test', inputSchema: { type: "object" } }]);

      expect(cache.getCachedServers()).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set('server1', [{ name: 'tool1', description: 'Test', inputSchema: { type: "object" } }]);
      cache.set('server2', [{ name: 'tool2', description: 'Test', inputSchema: { type: "object" } }]);

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxEntries).toBe(100);
      expect(stats.ttlMs).toBe(300000);
    });

    it('should return custom configuration', () => {
      cache = new ToolCache({ maxEntries: 50, ttlMs: 60000 });

      const stats = cache.getStats();

      expect(stats.maxEntries).toBe(50);
      expect(stats.ttlMs).toBe(60000);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry', () => {
      cache = new ToolCache({ maxEntries: 2 });

      cache.set('server1', [{ name: 'tool1', description: 'Test', inputSchema: { type: "object" } }]);
      cache.set('server2', [{ name: 'tool2', description: 'Test', inputSchema: { type: "object" } }]);
      cache.get('server1'); // Access server1 to make it recently used
      cache.set('server3', [{ name: 'tool3', description: 'Test', inputSchema: { type: "object" } }]);

      expect(cache.has('server1')).toBe(true); // Recently accessed, kept
      expect(cache.has('server2')).toBe(false); // Least recently used, evicted
      expect(cache.has('server3')).toBe(true);
    });
  });
});
