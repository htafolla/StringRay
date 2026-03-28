/**
 * OpenClaw Integration Tests
 *
 * Tests for OpenClawIntegration basic properties.
 *
 * @version 1.0.0
 * @since 2026-03-15
 */

import { describe, test, expect } from 'vitest';
import { OpenClawIntegration } from './index.js';

describe('OpenClawIntegration', () => {
  describe('Basic Properties', () => {
    test('has correct name', () => {
      const integration = new OpenClawIntegration();
      expect(integration.name).toBe('openclaw');
    });

    test('has correct version', () => {
      const integration = new OpenClawIntegration();
      expect(integration.version).toBe('1.0.0');
    });

    test('starts in uninitialized status', () => {
      const integration = new OpenClawIntegration();
      expect(integration.status).toBe('uninitialized');
    });
  });

  describe('Getters (before initialization)', () => {
    test('getAPIServer returns null before initialization', () => {
      const integration = new OpenClawIntegration();
      expect(integration.getAPIServer()).toBeNull();
    });

    test('getClient returns null before initialization', () => {
      const integration = new OpenClawIntegration();
      expect(integration.getClient()).toBeNull();
    });

    test('getHooksManager returns null before initialization', () => {
      const integration = new OpenClawIntegration();
      expect(integration.getHooksManager()).toBeNull();
    });

    test('getAgentInvoker returns null when not set', () => {
      const integration = new OpenClawIntegration();
      expect(integration.getAgentInvoker()).toBeNull();
    });

    test('setAgentInvoker works', () => {
      const integration = new OpenClawIntegration();
      const mockInvoker = { invoke: async () => ({}) };
      
      integration.setAgentInvoker(mockInvoker as any);
      
      expect(integration.getAgentInvoker()).toBe(mockInvoker);
    });
  });
});
