/**
 * Configuration Loader Tests
 * 
 * Comprehensive tests for the ConfigLoader class.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigLoader, defaultConfigLoader } from '../config-loader.js';

describe('ConfigLoader', () => {
  let loader: ConfigLoader;
  const testConfigPath = '.test-mcp.json';
  const testDir = '.opencode-test';
  const testConfigPath2 = path.join(testDir, 'mcp.json');

  beforeEach(() => {
    loader = new ConfigLoader();
    // Clean up any existing test files
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (fs.existsSync(testConfigPath2)) {
      fs.unlinkSync(testConfigPath2);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
    if (fs.existsSync(testConfigPath2)) {
      fs.unlinkSync(testConfigPath2);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  describe('load', () => {
    it('should return empty array when no config file exists', async () => {
      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.configs).toEqual([]);
    });

    it('should load array format config', async () => {
      const testConfigs = [
        {
          serverName: 'test-server',
          command: 'node',
          args: ['test.js'],
          timeout: 30000,
        },
      ];
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfigs));
      loader.addConfigPath(testConfigPath);

      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(1);
      expect(result.configs?.[0].serverName).toBe('test-server');
    });

    it('should load object format with servers property', async () => {
      const testConfig = {
        servers: [
          {
            serverName: 'test-server',
            command: 'node',
            args: ['test.js'],
            timeout: 30000,
          },
        ],
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig));
      loader.addConfigPath(testConfigPath);

      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(1);
      expect(result.configs?.[0].serverName).toBe('test-server');
    });

    it('should return error for invalid JSON', async () => {
      fs.writeFileSync(testConfigPath, 'invalid json{');
      loader.addConfigPath(testConfigPath);

      const result = await loader.load();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load');
    });

    it('should check multiple paths in order', async () => {
      const testConfigs = [
        {
          serverName: 'first-server',
          command: 'node',
          args: ['first.js'],
          timeout: 30000,
        },
      ];
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfigs));
      
      const testConfigs2 = [
        {
          serverName: 'second-server',
          command: 'node',
          args: ['second.js'],
          timeout: 30000,
        },
      ];
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(testConfigPath2, JSON.stringify(testConfigs2));
      
      loader.addConfigPath(testConfigPath);
      loader.addConfigPath(testConfigPath2);

      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.configs?.[0].serverName).toBe('first-server');
    });
  });

  describe('addConfigPath', () => {
    it('should add custom config path', async () => {
      const testConfigs = [
        {
          serverName: 'custom-server',
          command: 'node',
          args: ['custom.js'],
          timeout: 30000,
        },
      ];
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfigs));
      loader.addConfigPath(testConfigPath);

      const paths = loader.getConfigPaths();
      expect(paths).toContain(testConfigPath);
    });

    it('should load from added path', async () => {
      const testConfigs = [
        {
          serverName: 'added-server',
          command: 'node',
          args: ['added.js'],
          timeout: 30000,
        },
      ];
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfigs));
      loader.addConfigPath(testConfigPath);

      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.configs?.[0].serverName).toBe('added-server');
    });
  });

  describe('getConfigPaths', () => {
    it('should return default paths', () => {
      const paths = loader.getConfigPaths();
      expect(paths).toContain('.mcp.json');
      expect(paths).toContain('.opencode/mcp.json');
      expect(paths).toContain('mcp.config.json');
    });

    it('should return added paths', () => {
      loader.addConfigPath('custom/path.json');
      const paths = loader.getConfigPaths();
      expect(paths).toContain('custom/path.json');
    });

    it('should return copy of paths array', () => {
      const paths = loader.getConfigPaths();
      paths.push('modified');
      const paths2 = loader.getConfigPaths();
      expect(paths2).not.toContain('modified');
    });
  });

  describe('resetConfigPaths', () => {
    it('should reset to default paths', () => {
      loader.addConfigPath('custom/path.json');
      loader.resetConfigPaths();
      
      const paths = loader.getConfigPaths();
      expect(paths).not.toContain('custom/path.json');
      expect(paths).toContain('.mcp.json');
    });

    it('should remove added paths after reset', async () => {
      const testConfigs = [
        {
          serverName: 'custom-server',
          command: 'node',
          args: ['custom.js'],
          timeout: 30000,
        },
      ];
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfigs));
      loader.addConfigPath(testConfigPath);
      
      loader.resetConfigPaths();
      
      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.configs).toEqual([]);
    });
  });

  describe('loadFromPath', () => {
    it('should load from specific path', async () => {
      const testConfigs = [
        {
          serverName: 'specific-server',
          command: 'node',
          args: ['specific.js'],
          timeout: 30000,
        },
      ];
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfigs));

      const result = await loader.loadFromPath(testConfigPath);
      expect(result.success).toBe(true);
      expect(result.configs?.[0].serverName).toBe('specific-server');
    });

    it('should return error for non-existent file', async () => {
      const result = await loader.loadFromPath('non-existent.json');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Config file not found');
    });

    it('should return error for invalid JSON in specific path', async () => {
      fs.writeFileSync(testConfigPath, 'invalid json');

      const result = await loader.loadFromPath(testConfigPath);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load');
    });

    it('should load object format from specific path', async () => {
      const testConfig = {
        servers: [
          {
            serverName: 'object-server',
            command: 'node',
            args: ['object.js'],
            timeout: 30000,
          },
        ],
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig));

      const result = await loader.loadFromPath(testConfigPath);
      expect(result.success).toBe(true);
      expect(result.configs?.[0].serverName).toBe('object-server');
    });
  });

  describe('hasConfigFile', () => {
    it('should return false when no config file exists', () => {
      expect(loader.hasConfigFile()).toBe(false);
    });

    it('should return true when default config file exists', () => {
      const testConfigs = [{ serverName: 'test', command: 'node', args: ['test.js'], timeout: 30000 }];
      fs.writeFileSync('.mcp.json', JSON.stringify(testConfigs));
      
      expect(loader.hasConfigFile()).toBe(true);
      
      fs.unlinkSync('.mcp.json');
    });

    it('should return true when added config file exists', () => {
      const testConfigs = [{ serverName: 'test', command: 'node', args: ['test.js'], timeout: 30000 }];
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfigs));
      loader.addConfigPath(testConfigPath);
      
      expect(loader.hasConfigFile()).toBe(true);
    });
  });

  describe('default singleton', () => {
    it('defaultConfigLoader should be an instance', () => {
      expect(defaultConfigLoader).toBeInstanceOf(ConfigLoader);
    });

    it('defaultConfigLoader should have default paths', () => {
      const paths = defaultConfigLoader.getConfigPaths();
      expect(paths).toContain('.mcp.json');
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      fs.writeFileSync(testConfigPath, '{ invalid: json }');
      loader.addConfigPath(testConfigPath);

      const result = await loader.load();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty file', async () => {
      fs.writeFileSync(testConfigPath, '');
      loader.addConfigPath(testConfigPath);

      const result = await loader.load();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null servers property', async () => {
      fs.writeFileSync(testConfigPath, JSON.stringify({ servers: null }));
      loader.addConfigPath(testConfigPath);

      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.configs).toEqual([]);
    });

    it('should handle undefined servers property', async () => {
      fs.writeFileSync(testConfigPath, JSON.stringify({ other: 'property' }));
      loader.addConfigPath(testConfigPath);

      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.configs).toEqual([]);
    });
  });
});
