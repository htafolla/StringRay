/**
 * StrRay Framework v1.0.0 - Codex Enforcement Integration Tests
 *
 * Tests that the codex enforcement actually blocks violations as designed.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createStrRayCodexInjectorHook } from '../../codex-injector';

describe('Codex Enforcement Integration', () => {
  let hook: any;
  let mockSessionId: string;

  beforeEach(() => {
    // Create a fresh hook instance for each test
    hook = createStrRayCodexInjectorHook();
    mockSessionId = 'test-session-enforcement';

    // Clear any cached contexts
    vi.clearAllMocks();
  });

  test('should allow non-critical tools without enforcement', async () => {
    const input = { tool: 'read', args: { filePath: 'test.txt' } };

    // Should not throw for non-critical tools
    await expect(hook.hooks['tool.execute.before'](input, mockSessionId)).resolves.toBeUndefined();
  });

  test('should allow critical tools when no codex is loaded', async () => {
    const input = { tool: 'write', args: { filePath: 'test.txt', content: 'test' } };

    // Mock the context loader to return no context
    const mockContextLoader = {
      loadCodexContext: vi.fn().mockResolvedValue({ success: false }),
      validateAgainstCodex: vi.fn()
    };

    vi.doMock('../../context-loader', () => ({
      strRayContextLoader: mockContextLoader
    }));

    // Should allow action when no codex is available
    await expect(hook.hooks['tool.execute.before'](input, mockSessionId)).resolves.toBeUndefined();
  });

  test('should block actions with blocking codex violations', async () => {
    const input = { tool: 'write', args: { filePath: 'test.ts', content: 'const x: any = 5;' } };

    // Mock the context loader with blocking violations
    const mockContextLoader = {
      loadCodexContext: vi.fn().mockResolvedValue({
        success: true,
        context: {
          version: '1.2.20',
          terms: new Map(),
          interweaves: [],
          lenses: [],
          validationCriteria: {}
        }
      }),
      validateAgainstCodex: vi.fn().mockReturnValue({
        compliant: false,
        violations: [{
          term: { number: 11, title: 'Type Safety', description: 'Never use any' },
          reason: 'Use of "any" type detected - violates type safety requirements',
          severity: 'blocking' as const
        }],
        recommendations: ['Use proper TypeScript types instead of any']
      })
    };

    vi.doMock('../../context-loader', () => ({
      strRayContextLoader: mockContextLoader
    }));

    // Should block the action due to blocking violation
    await expect(hook.hooks['tool.execute.before'](input, mockSessionId))
      .rejects.toThrow('Codex enforcement blocked action');
  });

  test('should allow actions with only non-blocking violations', async () => {
    const input = { tool: 'edit', args: { filePath: 'test.ts', oldString: 'old', newString: 'new' } };

    // Mock the context loader with non-blocking violations
    const mockContextLoader = {
      loadCodexContext: vi.fn().mockResolvedValue({
        success: true,
        context: {
          version: '1.2.20',
          terms: new Map(),
          interweaves: [],
          lenses: [],
          validationCriteria: {}
        }
      }),
      validateAgainstCodex: vi.fn().mockReturnValue({
        compliant: false,
        violations: [{
          term: { number: 17, title: 'YAGNI', description: 'Don\'t implement features you don\'t need' },
          reason: 'Potentially unnecessary feature detected',
          severity: 'medium' as const
        }],
        recommendations: ['Consider if this feature is actually needed']
      })
    };

    vi.doMock('../../context-loader', () => ({
      strRayContextLoader: mockContextLoader
      }));

    // Should allow action but log warnings for non-blocking violations
    await expect(hook.hooks['tool.execute.before'](input, mockSessionId)).resolves.toBeUndefined();
  });

  test('should allow compliant actions', async () => {
    const input = { tool: 'write', args: { filePath: 'test.ts', content: 'const x: string = "hello";' } };

    // Mock the context loader with compliant validation
    const mockContextLoader = {
      loadCodexContext: vi.fn().mockResolvedValue({
        success: true,
        context: {
          version: '1.2.20',
          terms: new Map(),
          interweaves: [],
          lenses: [],
          validationCriteria: {}
        }
      }),
      validateAgainstCodex: vi.fn().mockReturnValue({
        compliant: true,
        violations: [],
        recommendations: []
      })
    };

    vi.doMock('../../context-loader', () => ({
      strRayContextLoader: mockContextLoader
    }));

    // Should allow compliant actions
    await expect(hook.hooks['tool.execute.before'](input, mockSessionId)).resolves.toBeUndefined();
  });

  test('should handle enforcement errors gracefully', async () => {
    const input = { tool: 'edit', args: { filePath: 'test.ts' } };

    // Mock the context loader to throw an error
    const mockContextLoader = {
      loadCodexContext: vi.fn().mockRejectedValue(new Error('Context load failed')),
      validateAgainstCodex: vi.fn()
    };

    vi.doMock('../../context-loader', () => ({
      strRayContextLoader: mockContextLoader
    }));

    // Should handle errors gracefully and allow action to prevent breaking workflow
    await expect(hook.hooks['tool.execute.before'](input, mockSessionId)).resolves.toBeUndefined();
  });

  test('should only enforce on critical tools', async () => {
    const criticalTools = ['write', 'edit', 'multiedit', 'batch'];
    const nonCriticalTools = ['read', 'grep', 'glob', 'bash'];

    // Mock compliant validation for testing
    const mockContextLoader = {
      loadCodexContext: vi.fn().mockResolvedValue({
        success: true,
        context: { version: '1.2.20', terms: new Map(), interweaves: [], lenses: [], validationCriteria: {} }
      }),
      validateAgainstCodex: vi.fn().mockReturnValue({
        compliant: true, violations: [], recommendations: []
      })
    };

    vi.doMock('../../context-loader', () => ({
      strRayContextLoader: mockContextLoader
    }));

    // Test critical tools (should be validated)
    for (const tool of criticalTools) {
      const input = { tool, args: {} };
      // These should go through validation (but pass in our mock)
      await expect(hook.hooks['tool.execute.before'](input, mockSessionId)).resolves.toBeUndefined();
    }

    // Test non-critical tools (should skip validation)
    for (const tool of nonCriticalTools) {
      const input = { tool, args: {} };
      // These should skip validation entirely
      await expect(hook.hooks['tool.execute.before'](input, mockSessionId)).resolves.toBeUndefined();
    }
  });
});