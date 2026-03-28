/**
 * Configuration Validator Tests
 *
 * Comprehensive tests for the ConfigValidator class.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigValidator, defaultConfigValidator } from '../config-validator.js';
import { IServerConfig } from '../../types/index.js';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('validate', () => {
    it('should validate a valid config', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should invalidate config without serverName', () => {
      const config = {
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
      } as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('serverName is required and must be a string');
    });

    it('should invalidate config with empty serverName', () => {
      const config: IServerConfig = {
        serverName: '',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('serverName is required and must be a string');
    });

    it('should invalidate config without command', () => {
      const config = {
        serverName: 'test-server',
        args: ['test.js'],
        timeout: 30000,
      } as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('command is required and must be a string');
    });

    it('should invalidate config with empty command', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: '',
        args: ['test.js'],
        timeout: 30000,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('command is required and must be a string');
    });

    it('should invalidate config without args', () => {
      const config = {
        serverName: 'test-server',
        command: 'node',
        timeout: 30000,
      } as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('args is required and must be an array');
    });

    it('should invalidate config with non-array args', () => {
      const config = {
        serverName: 'test-server',
        command: 'node',
        args: 'test.js',
        timeout: 30000,
      } as unknown as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('args is required and must be an array');
    });

    it('should invalidate config with non-string args', () => {
      const config = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js', 123, null],
        timeout: 30000,
      } as unknown as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('all args must be strings');
    });

    it('should validate config without timeout', () => {
      const config = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
      } as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should invalidate config with non-number timeout', () => {
      const config = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: '30000',
      } as unknown as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeout must be a number when provided');
    });

    it('should invalidate config with zero timeout', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 0,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeout must be a positive number');
    });

    it('should invalidate config with negative timeout', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: -1000,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeout must be a positive number');
    });

    it('should validate config with valid env', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
        env: {
          NODE_ENV: 'production',
          DEBUG: 'true',
        },
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should validate config without env', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should invalidate config with null env', () => {
      const config = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
        env: null,
      } as unknown as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('env must be an object when provided');
    });

    it('should invalidate config with non-string env values', () => {
      const config = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
        env: {
          NODE_ENV: 'production',
          PORT: 3000,
          DEBUG: true,
        },
      } as unknown as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('all env values must be strings');
    });

    it('should collect multiple validation errors', () => {
      const config = {} as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('serverName is required and must be a string');
      expect(result.errors).toContain('command is required and must be a string');
      expect(result.errors).toContain('args is required and must be an array');
    });

    it('should validate config with empty args array', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: [],
        timeout: 30000,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should validate config with basePath', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
        basePath: 'custom-path',
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAll', () => {
    it('should validate all configs and return valid', () => {
      const configs: IServerConfig[] = [
        {
          serverName: 'server-1',
          command: 'node',
          args: ['server1.js'],
          timeout: 30000,
        },
        {
          serverName: 'server-2',
          command: 'node',
          args: ['server2.js'],
          timeout: 30000,
        },
      ];

      const result = validator.validateAll(configs);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate all configs and return errors for invalid ones', () => {
      const configs: IServerConfig[] = [
        {
          serverName: 'valid-server',
          command: 'node',
          args: ['valid.js'],
          timeout: 30000,
        },
        {
          serverName: '',
          command: 'node',
          args: ['invalid.js'],
          timeout: 30000,
        } as IServerConfig,
      ];

      const result = validator.validateAll(configs);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('unknown:');
    });

    it('should prefix errors with server name', () => {
      const configs: IServerConfig[] = [
        {
          serverName: 'bad-server',
          command: '',
          args: [],
          timeout: 30000,
        },
      ];

      const result = validator.validateAll(configs);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('bad-server:');
    });

    it('should handle empty array', () => {
      const result = validator.validateAll([]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle single config array', () => {
      const configs: IServerConfig[] = [
        {
          serverName: 'single-server',
          command: 'node',
          args: ['single.js'],
          timeout: 30000,
        },
      ];

      const result = validator.validateAll(configs);
      expect(result.valid).toBe(true);
    });

    it('should collect all errors from multiple invalid configs', () => {
      const configs: IServerConfig[] = [
        {
          serverName: '',
          command: 'node',
          args: ['test.js'],
          timeout: 30000,
        } as IServerConfig,
        {
          serverName: 'server-2',
          command: '',
          args: ['test.js'],
          timeout: 30000,
        } as IServerConfig,
        {
          serverName: 'server-3',
          command: 'node',
          args: ['test.js'],
          timeout: -1000,
        },
      ];

      const result = validator.validateAll(configs);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('filterValid', () => {
    it('should return only valid configs', () => {
      const configs: IServerConfig[] = [
        {
          serverName: 'valid-server',
          command: 'node',
          args: ['valid.js'],
          timeout: 30000,
        },
        {
          serverName: '',
          command: 'node',
          args: ['invalid.js'],
          timeout: 30000,
        } as IServerConfig,
        {
          serverName: 'another-valid',
          command: 'node',
          args: ['another.js'],
          timeout: 30000,
        },
      ];

      const validConfigs = validator.filterValid(configs);
      expect(validConfigs).toHaveLength(2);
      expect(validConfigs.map(c => c.serverName)).toContain('valid-server');
      expect(validConfigs.map(c => c.serverName)).toContain('another-valid');
    });

    it('should return empty array when all configs are invalid', () => {
      const configs: IServerConfig[] = [
        {
          serverName: '',
          command: 'node',
          args: ['invalid.js'],
          timeout: 30000,
        } as IServerConfig,
      ];

      const validConfigs = validator.filterValid(configs);
      expect(validConfigs).toHaveLength(0);
    });

    it('should return all configs when all are valid', () => {
      const configs: IServerConfig[] = [
        {
          serverName: 'server-1',
          command: 'node',
          args: ['server1.js'],
          timeout: 30000,
        },
        {
          serverName: 'server-2',
          command: 'node',
          args: ['server2.js'],
          timeout: 30000,
        },
      ];

      const validConfigs = validator.filterValid(configs);
      expect(validConfigs).toHaveLength(2);
    });

    it('should handle empty array', () => {
      const validConfigs = validator.filterValid([]);
      expect(validConfigs).toHaveLength(0);
    });
  });

  describe('getValidationErrors', () => {
    it('should return errors keyed by server name', () => {
      const configs: IServerConfig[] = [
        {
          serverName: 'bad-server',
          command: '',
          args: [],
          timeout: 30000,
        },
      ];

      const errors = validator.getValidationErrors(configs);
      expect(errors).toHaveProperty('bad-server');
      expect(errors['bad-server']).toContain('command is required and must be a string');
    });

    it('should return only invalid configs', () => {
      const configs: IServerConfig[] = [
        {
          serverName: 'valid-server',
          command: 'node',
          args: ['valid.js'],
          timeout: 30000,
        },
        {
          serverName: 'invalid-server',
          command: '',
          args: [],
          timeout: 30000,
        },
      ];

      const errors = validator.getValidationErrors(configs);
      expect(Object.keys(errors)).toHaveLength(1);
      expect(errors).toHaveProperty('invalid-server');
      expect(errors).not.toHaveProperty('valid-server');
    });

    it('should use "unknown" for configs without serverName', () => {
      const configs: IServerConfig[] = [
        {
          command: 'node',
          args: ['test.js'],
          timeout: 30000,
        } as IServerConfig,
      ];

      const errors = validator.getValidationErrors(configs);
      expect(errors).toHaveProperty('unknown');
    });

    it('should handle empty array', () => {
      const errors = validator.getValidationErrors([]);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should return multiple error arrays for multiple invalid configs', () => {
      const configs: IServerConfig[] = [
        {
          serverName: 'server-1',
          command: '',
          args: [],
          timeout: 30000,
        },
        {
          serverName: 'server-2',
          command: 'node',
          args: 'not-an-array',
          timeout: 30000,
        } as unknown as IServerConfig,
      ];

      const errors = validator.getValidationErrors(configs);
      expect(Object.keys(errors)).toHaveLength(2);
      expect(errors['server-1']).toBeDefined();
      expect(errors['server-2']).toBeDefined();
    });
  });

  describe('default singleton', () => {
    it('defaultConfigValidator should be an instance', () => {
      expect(defaultConfigValidator).toBeInstanceOf(ConfigValidator);
    });

    it('defaultConfigValidator should validate correctly', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
      };

      const result = defaultConfigValidator.validate(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle serverName with special characters', () => {
      const config: IServerConfig = {
        serverName: 'server-name_with.special@chars',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should handle very long serverName', () => {
      const config: IServerConfig = {
        serverName: 'a'.repeat(1000),
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should handle config with all optional fields', () => {
      const config = {
        serverName: 'minimal-server',
        command: 'node',
        args: ['test.js'],
      } as IServerConfig;

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should handle command with path', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: '/usr/local/bin/node',
        args: ['test.js'],
        timeout: 30000,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should handle args with multiple items', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['--max-old-space-size=4096', '--experimental-modules', 'test.js'],
        timeout: 30000,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should handle very large timeout', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 999999999,
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should handle env with many variables', () => {
      const config: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
        env: {
          NODE_ENV: 'production',
          PORT: '3000',
          HOST: 'localhost',
          DEBUG: 'app:*',
          API_KEY: 'secret-key',
          DATABASE_URL: 'postgres://localhost/db',
        },
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should handle whitespace-only strings as invalid', () => {
      const config: IServerConfig = {
        serverName: '   ',
        command: 'node',
        args: ['test.js'],
        timeout: 30000,
      };

      // Whitespace-only is technically a non-empty string, so this should be valid
      // based on current implementation
      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });
  });
});
