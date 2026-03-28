/**
 * Server Configuration Registry Tests
 * 
 * Comprehensive tests for the ServerConfigRegistry class.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ServerConfigRegistry, defaultServerRegistry } from '../server-config-registry.js';

describe('ServerConfigRegistry', () => {
  let registry: ServerConfigRegistry;

  beforeEach(() => {
    registry = new ServerConfigRegistry();
  });

  describe('registration', () => {
    it('should register a server config', () => {
      registry.register({
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
      });

      expect(registry.has('test-server')).toBe(true);
    });

    it('should retrieve a registered config', () => {
      const config = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
      };
      registry.register(config);

      const retrieved = registry.get('test-server');
      expect(retrieved).toEqual(config);
    });

    it('should return undefined for unknown server', () => {
      expect(registry.get('unknown-server')).toBeUndefined();
    });

    it('should return false for unknown server in has()', () => {
      expect(registry.has('unknown-server')).toBe(false);
    });

    it('should overwrite existing config on re-register', () => {
      registry.register({
        serverName: 'test-server',
        command: 'node',
        args: ['old.js'],
        timeout: 30000,
      });

      registry.register({
        serverName: 'test-server',
        command: 'python',
        args: ['new.py'],
        timeout: 45000,
      });

      const retrieved = registry.get('test-server');
      expect(retrieved?.command).toBe('python');
      expect(retrieved?.args).toEqual(['new.py']);
      expect(retrieved?.timeout).toBe(45000);
    });
  });

  describe('default servers', () => {
    it('should have code-review server registered by default', () => {
      expect(registry.has('code-review')).toBe(true);
      const config = registry.get('code-review');
      expect(config?.command).toBe('node');
      expect(config?.timeout).toBe(30000);
    });

    it('should have security-audit server registered by default', () => {
      expect(registry.has('security-audit')).toBe(true);
      const config = registry.get('security-audit');
      expect(config?.timeout).toBe(45000);
    });

    it('should have security-auditor alias registered by default', () => {
      expect(registry.has('security-auditor')).toBe(true);
      const config = registry.get('security-auditor');
      expect(config?.timeout).toBe(45000);
    });

    it('should have researcher server registered by default', () => {
      expect(registry.has('researcher')).toBe(true);
      const config = registry.get('researcher');
      expect(config?.timeout).toBe(60000);
    });

    it('should have framework-help server registered by default', () => {
      expect(registry.has('framework-help')).toBe(true);
      const config = registry.get('framework-help');
      expect(config?.timeout).toBe(15000);
    });

    it('should have orchestrator server registered by default', () => {
      expect(registry.has('orchestrator')).toBe(true);
      const config = registry.get('orchestrator');
      expect(config?.timeout).toBe(60000);
    });

    it('should have architect server registered by default', () => {
      expect(registry.has('architect')).toBe(true);
      const config = registry.get('architect');
      expect(config?.timeout).toBe(45000);
    });

    it('should have enforcer server registered by default', () => {
      expect(registry.has('enforcer')).toBe(true);
      const config = registry.get('enforcer');
      expect(config?.timeout).toBe(30000);
    });

    it('should have all default servers registered', () => {
      const names = registry.getServerNames();
      expect(names.length).toBeGreaterThanOrEqual(15);
    });

    it('should include aliases in default registrations', () => {
      expect(registry.has('code-reviewer')).toBe(true);
      expect(registry.has('testing-lead')).toBe(true);
    });
  });

  describe('bulk operations', () => {
    it('should get all server names', () => {
      const names = registry.getServerNames();
      expect(names.length).toBeGreaterThan(0);
      expect(names).toContain('code-review');
      expect(names).toContain('security-audit');
      expect(names).toContain('orchestrator');
    });

    it('should get all server configs', () => {
      const configs = registry.getAll();
      expect(configs.length).toBeGreaterThan(0);
      
      const codeReview = configs.find(c => c.serverName === 'code-review');
      expect(codeReview).toBeDefined();
      expect(codeReview?.command).toBe('node');
    });

    it('should clear all configs', () => {
      registry.clear();
      expect(registry.getAll()).toHaveLength(0);
      expect(registry.getServerNames()).toHaveLength(0);
    });
  });

  describe('dynamic config creation', () => {
    it('should create dynamic config for unknown server', () => {
      const config = registry.createDynamicConfig('custom-server');
      expect(config.serverName).toBe('custom-server');
      expect(config.command).toBe('node');
      expect(config.args[0]).toContain('custom-server.server.js');
      expect(config.timeout).toBe(30000);
    });

    it('should use STRRAY_DEV_PATH env var in dynamic config', () => {
      const originalEnv = process.env.STRRAY_DEV_PATH;
      process.env.STRRAY_DEV_PATH = 'custom-dist';
      
      const config = registry.createDynamicConfig('test-server');
      expect(config.args[0]).toContain('custom-dist');
      
      process.env.STRRAY_DEV_PATH = originalEnv;
    });
  });

  describe('environment path handling', () => {
    it('should use default node_modules path when STRRAY_DEV_PATH is not set', () => {
      const originalEnv = process.env.STRRAY_DEV_PATH;
      delete process.env.STRRAY_DEV_PATH;
      
      const freshRegistry = new ServerConfigRegistry();
      const config = freshRegistry.get('code-review');
      expect(config?.args[0]).toContain('node_modules/strray-ai/dist');
      
      process.env.STRRAY_DEV_PATH = originalEnv;
    });

    it('should use STRRAY_DEV_PATH when set', () => {
      const originalEnv = process.env.STRRAY_DEV_PATH;
      process.env.STRRAY_DEV_PATH = 'dist';
      
      const freshRegistry = new ServerConfigRegistry();
      const config = freshRegistry.get('code-review');
      expect(config?.args[0]).toContain('dist/');
      
      process.env.STRRAY_DEV_PATH = originalEnv;
    });
  });

  describe('default singleton', () => {
    it('defaultServerRegistry should be an instance', () => {
      expect(defaultServerRegistry).toBeInstanceOf(ServerConfigRegistry);
    });

    it('defaultServerRegistry should have default servers', () => {
      expect(defaultServerRegistry.has('code-review')).toBe(true);
    });
  });

  describe('config structure', () => {
    it('should have correct structure for all configs', () => {
      const configs = registry.getAll();
      
      for (const config of configs) {
        expect(config).toHaveProperty('serverName');
        expect(config).toHaveProperty('command');
        expect(config).toHaveProperty('args');
        expect(config).toHaveProperty('timeout');
        expect(typeof config.serverName).toBe('string');
        expect(typeof config.command).toBe('string');
        expect(Array.isArray(config.args)).toBe(true);
        expect(typeof config.timeout).toBe('number');
      }
    });

    it('should have valid timeouts for all configs', () => {
      const configs = registry.getAll();
      
      for (const config of configs) {
        expect(config.timeout).toBeGreaterThan(0);
        expect(config.timeout).toBeLessThanOrEqual(60000);
      }
    });

    it('should use node command for all servers', () => {
      const configs = registry.getAll();
      
      for (const config of configs) {
        expect(config.command).toBe('node');
      }
    });

    it('should have .js extension in all args', () => {
      const configs = registry.getAll();
      
      for (const config of configs) {
        expect(config.args[0]).toMatch(/\.js$/);
      }
    });
  });
});
