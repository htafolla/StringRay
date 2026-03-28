/**
 * OpenClaw Hooks Manager Tests
 *
 * Tests for tool event hooks, buffering, and filtering.
 *
 * @version 1.0.0
 * @since 2026-03-15
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  OpenClawHooksManager,
  createOpenClawHooksManager,
  OpenClawHooksConfig,
  StringRayToolEvent,
} from './strray-hooks.js';
import { OpenClawClient } from '../client.js';

// Mock OpenClawClient
const mockClient = {
  isConnected: vi.fn().mockReturnValue(true),
  sendRequest: vi.fn().mockResolvedValue({}),
  onStateChange: vi.fn(),
  disconnect: vi.fn(),
  getState: vi.fn().mockReturnValue('connected'),
};

describe('OpenClawHooksManager', () => {
  let hooksManager: OpenClawHooksManager;
  let mockOpenClawClient: OpenClawClient;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh mock client for each test
    mockOpenClawClient = {
      isConnected: vi.fn().mockReturnValue(true),
      sendRequest: vi.fn().mockResolvedValue({}),
      onStateChange: vi.fn(),
      disconnect: vi.fn(),
      getState: vi.fn().mockReturnValue('connected'),
    } as unknown as OpenClawClient;

    hooksManager = new OpenClawHooksManager({
      enabled: true,
      toolBefore: true,
      toolAfter: true,
      includeArgs: true,
      includeResult: true,
    });
  });

  describe('Initialization', () => {
    test('initializes successfully with default config', async () => {
      await hooksManager.initialize();
      expect(hooksManager.isInitialized()).toBe(true);
    });

    test('initializes with toolFilter config', async () => {
      const managerWithFilter = new OpenClawHooksManager({
        enabled: true,
        toolBefore: true,
        toolAfter: true,
        includeArgs: true,
        includeResult: true,
        toolFilter: ['read', 'write'],
      });
      
      await managerWithFilter.initialize();
      expect(managerWithFilter.isInitialized()).toBe(true);
    });

    test('does not initialize when disabled', async () => {
      const disabledManager = new OpenClawHooksManager({
        enabled: false,
        toolBefore: true,
        toolAfter: true,
        includeArgs: true,
        includeResult: true,
      });
      
      await disabledManager.initialize();
      expect(disabledManager.isInitialized()).toBe(false);
    });

    test('prevents double initialization', async () => {
      await hooksManager.initialize();
      await hooksManager.initialize();
      expect(hooksManager.isInitialized()).toBe(true);
    });
  });

  describe('toolFilter', () => {
    beforeEach(async () => {
      hooksManager.setClient(mockOpenClawClient);
      await hooksManager.initialize();
    });

    test('allows all tools when toolFilter is undefined', async () => {
      const event: StringRayToolEvent = {
        toolName: 'any-tool',
        toolId: 'test-id',
        args: {},
        duration: 100,
        timestamp: Date.now(),
      };

      // Should not throw - event passes through
      await hooksManager.onToolBefore(event);
      expect(mockOpenClawClient.sendRequest).toHaveBeenCalled();
    });

    test('allows tools in toolFilter array', async () => {
      const filteredManager = new OpenClawHooksManager({
        enabled: true,
        toolBefore: true,
        toolAfter: true,
        includeArgs: true,
        includeResult: true,
        toolFilter: ['read', 'write'],
      });
      
      filteredManager.setClient(mockOpenClawClient);
      await filteredManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'read',
        toolId: 'test-id',
        args: {},
        duration: 100,
        timestamp: Date.now(),
      };

      await filteredManager.onToolBefore(event);
      expect(mockOpenClawClient.sendRequest).toHaveBeenCalled();
    });

    test('blocks tools not in toolFilter array', async () => {
      const filteredManager = new OpenClawHooksManager({
        enabled: true,
        toolBefore: true,
        toolAfter: true,
        includeArgs: true,
        includeResult: true,
        toolFilter: ['read', 'write'],
      });
      
      filteredManager.setClient(mockOpenClawClient);
      await filteredManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'delete',
        toolId: 'test-id',
        args: {},
        duration: 100,
        timestamp: Date.now(),
      };

      await filteredManager.onToolBefore(event);
      expect(mockOpenClawClient.sendRequest).not.toHaveBeenCalled();
    });
  });

  describe('Event Queue Buffering', () => {
    test('queues events when client is not connected', async () => {
      // Set up client that is NOT connected
      const disconnectedClient = {
        isConnected: vi.fn().mockReturnValue(false),
        sendRequest: vi.fn().mockResolvedValue({}),
      } as unknown as OpenClawClient;

      hooksManager.setClient(disconnectedClient);
      await hooksManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'test-tool',
        toolId: 'test-id',
        args: { foo: 'bar' },
        duration: 100,
        timestamp: Date.now(),
      };

      await hooksManager.onToolBefore(event);

      // Event should be queued, not sent
      expect(disconnectedClient.sendRequest).not.toHaveBeenCalled();
      expect(hooksManager.getQueueSize()).toBe(1);
    });

    test('does not queue when client is connected', async () => {
      hooksManager.setClient(mockOpenClawClient);
      await hooksManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'test-tool',
        toolId: 'test-id',
        args: {},
        duration: 100,
        timestamp: Date.now(),
      };

      await hooksManager.onToolBefore(event);

      // Event should be sent directly
      expect(mockOpenClawClient.sendRequest).toHaveBeenCalled();
      expect(hooksManager.getQueueSize()).toBe(0);
    });

    test('drops oldest event when queue exceeds max size', async () => {
      const disconnectedClient = {
        isConnected: vi.fn().mockReturnValue(false),
        sendRequest: vi.fn().mockResolvedValue({}),
      } as unknown as OpenClawClient;

      hooksManager.setClient(disconnectedClient);
      await hooksManager.initialize();

      // Add events until queue overflows (maxQueueSize is 100)
      for (let i = 0; i < 105; i++) {
        const event: StringRayToolEvent = {
          toolName: `tool-${i}`,
          toolId: `test-id-${i}`,
          args: {},
          duration: 100,
          timestamp: Date.now(),
        };
        await hooksManager.onToolBefore(event);
      }

      // Queue should be at max size (100), oldest events dropped
      expect(hooksManager.getQueueSize()).toBe(100);
    });

    test('flushes queue when client reconnects', async () => {
      // Start with disconnected client
      const disconnectedClient = {
        isConnected: vi.fn().mockReturnValue(false),
        sendRequest: vi.fn().mockResolvedValue({}),
      } as unknown as OpenClawClient;

      hooksManager.setClient(disconnectedClient);
      await hooksManager.initialize();

      // Queue an event
      const event: StringRayToolEvent = {
        toolName: 'test-tool',
        toolId: 'test-id',
        args: {},
        duration: 100,
        timestamp: Date.now(),
      };
      await hooksManager.onToolBefore(event);
      expect(hooksManager.getQueueSize()).toBe(1);

      // Simulate reconnection - set client to connected
      hooksManager.setClient(mockOpenClawClient);
      (mockOpenClawClient.isConnected as ReturnType<typeof vi.fn>).mockReturnValue(true);
      
      // Trigger reconnect handling
      await hooksManager.handleReconnect();

      // Queue should be flushed
      expect(mockOpenClawClient.sendRequest).toHaveBeenCalled();
      expect(hooksManager.getQueueSize()).toBe(0);
    });

    test('getQueueSize returns 0 initially', () => {
      expect(hooksManager.getQueueSize()).toBe(0);
    });
  });

  describe('tool.before event', () => {
    beforeEach(async () => {
      hooksManager.setClient(mockOpenClawClient);
      await hooksManager.initialize();
    });

    test('sends tool.before event to OpenClaw', async () => {
      const event: StringRayToolEvent = {
        toolName: 'read',
        toolId: 'read-123',
        args: { filePath: '/test/file.ts' },
        duration: 50,
        timestamp: Date.now(),
        sessionId: 'session-1',
        agent: 'researcher',
      };

      await hooksManager.onToolBefore(event);

      expect(mockOpenClawClient.sendRequest).toHaveBeenCalledWith(
        'event.tool.before',
        expect.objectContaining({
          eventType: 'tool.before',
          toolName: 'read',
          toolId: 'read-123',
          sessionId: 'session-1',
          agent: 'researcher',
        })
      );
    });

    test('respects includeArgs config', async () => {
      const noArgsManager = new OpenClawHooksManager({
        enabled: true,
        toolBefore: true,
        toolAfter: true,
        includeArgs: false, // Don't include args
        includeResult: true,
      });
      
      noArgsManager.setClient(mockOpenClawClient);
      await noArgsManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'read',
        toolId: 'test-id',
        args: { secret: 'password' },
        duration: 100,
        timestamp: Date.now(),
      };

      await noArgsManager.onToolBefore(event);

      expect(mockOpenClawClient.sendRequest).toHaveBeenCalledWith(
        'event.tool.before',
        expect.objectContaining({
          args: {}, // Should be empty when includeArgs is false
        })
      );
    });

    test('does not send when toolBefore is disabled', async () => {
      const noBeforeManager = new OpenClawHooksManager({
        enabled: true,
        toolBefore: false, // Disabled
        toolAfter: true,
        includeArgs: true,
        includeResult: true,
      });
      
      noBeforeManager.setClient(mockOpenClawClient);
      await noBeforeManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'test',
        toolId: 'test-id',
        args: {},
        duration: 100,
        timestamp: Date.now(),
      };

      await noBeforeManager.onToolBefore(event);
      expect(mockOpenClawClient.sendRequest).not.toHaveBeenCalled();
    });
  });

  describe('tool.after event', () => {
    beforeEach(async () => {
      hooksManager.setClient(mockOpenClawClient);
      await hooksManager.initialize();
    });

    test('sends tool.after event on success', async () => {
      const event: StringRayToolEvent = {
        toolName: 'write',
        toolId: 'write-456',
        args: { filePath: '/test/output.ts' },
        result: { success: true },
        duration: 150,
        timestamp: Date.now(),
        sessionId: 'session-2',
        agent: 'code-review',
      };

      await hooksManager.onToolAfter(event);

      expect(mockOpenClawClient.sendRequest).toHaveBeenCalledWith(
        'event.tool.after',
        expect.objectContaining({
          eventType: 'tool.after',
          toolName: 'write',
          success: true,
        })
      );
    });

    test('sends tool.after event on error', async () => {
      const event: StringRayToolEvent = {
        toolName: 'read',
        toolId: 'read-789',
        args: {},
        error: 'File not found',
        duration: 50,
        timestamp: Date.now(),
      };

      await hooksManager.onToolAfter(event);

      expect(mockOpenClawClient.sendRequest).toHaveBeenCalledWith(
        'event.tool.after',
        expect.objectContaining({
          eventType: 'tool.after',
          toolName: 'read',
          error: 'File not found',
          success: false,
        })
      );
    });

    test('respects includeResult config', async () => {
      const noResultManager = new OpenClawHooksManager({
        enabled: true,
        toolBefore: true,
        toolAfter: true,
        includeArgs: true,
        includeResult: false, // Don't include result
      });
      
      noResultManager.setClient(mockOpenClawClient);
      await noResultManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'test',
        toolId: 'test-id',
        args: {},
        result: { sensitive: 'data' },
        duration: 100,
        timestamp: Date.now(),
      };

      await noResultManager.onToolAfter(event);

      expect(mockOpenClawClient.sendRequest).toHaveBeenCalledWith(
        'event.tool.after',
        expect.objectContaining({
          result: undefined, // Should be undefined when includeResult is false
        })
      );
    });
  });

  describe('Callback Registration', () => {
    test('registers and calls tool.before callback', async () => {
      const callback = vi.fn();
      hooksManager.registerToolBefore(callback);
      
      hooksManager.setClient(mockOpenClawClient);
      await hooksManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'test',
        toolId: 'test-id',
        args: {},
        duration: 100,
        timestamp: Date.now(),
      };

      await hooksManager.onToolBefore(event);

      expect(callback).toHaveBeenCalledWith(event);
    });

    test('registers and calls tool.after callback', async () => {
      const callback = vi.fn();
      hooksManager.registerToolAfter(callback);
      
      hooksManager.setClient(mockOpenClawClient);
      await hooksManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'test',
        toolId: 'test-id',
        args: {},
        result: {},
        duration: 100,
        timestamp: Date.now(),
      };

      await hooksManager.onToolAfter(event);

      expect(callback).toHaveBeenCalledWith(event);
    });

    test('unregisters tool.before callback', async () => {
      const callback = vi.fn();
      hooksManager.registerToolBefore(callback);
      hooksManager.unregisterToolBefore(callback);
      
      hooksManager.setClient(mockOpenClawClient);
      await hooksManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'test',
        toolId: 'test-id',
        args: {},
        duration: 100,
        timestamp: Date.now(),
      };

      await hooksManager.onToolBefore(event);

      expect(callback).not.toHaveBeenCalled();
    });

    test('unregisters tool.after callback', async () => {
      const callback = vi.fn();
      hooksManager.registerToolAfter(callback);
      hooksManager.unregisterToolAfter(callback);
      
      hooksManager.setClient(mockOpenClawClient);
      await hooksManager.initialize();

      const event: StringRayToolEvent = {
        toolName: 'test',
        toolId: 'test-id',
        args: {},
        result: {},
        duration: 100,
        timestamp: Date.now(),
      };

      await hooksManager.onToolAfter(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    test('clears queue on shutdown', async () => {
      const disconnectedClient = {
        isConnected: vi.fn().mockReturnValue(false),
        sendRequest: vi.fn().mockResolvedValue({}),
      } as unknown as OpenClawClient;

      hooksManager.setClient(disconnectedClient);
      await hooksManager.initialize();

      // Queue some events
      const event: StringRayToolEvent = {
        toolName: 'test',
        toolId: 'test-id',
        args: {},
        duration: 100,
        timestamp: Date.now(),
      };
      await hooksManager.onToolBefore(event);
      expect(hooksManager.getQueueSize()).toBe(1);

      // Shutdown should clear the queue
      await hooksManager.shutdown();
      expect(hooksManager.getQueueSize()).toBe(0);
    });

    test('sets initialized to false on shutdown', async () => {
      await hooksManager.initialize();
      expect(hooksManager.isInitialized()).toBe(true);

      await hooksManager.shutdown();
      expect(hooksManager.isInitialized()).toBe(false);
    });

    test('clears client reference on shutdown', async () => {
      hooksManager.setClient(mockOpenClawClient);
      await hooksManager.initialize();

      await hooksManager.shutdown();

      // Client should be cleared - events should be queued (not sent)
      const event: StringRayToolEvent = {
        toolName: 'test',
        toolId: 'test-id',
        args: {},
        duration: 100,
        timestamp: Date.now(),
      };
      
      await hooksManager.onToolBefore(event);
      expect(hooksManager.getQueueSize()).toBe(1);
    });
  });

  describe('Configuration', () => {
    test('updateConfig modifies config', async () => {
      await hooksManager.initialize();

      hooksManager.updateConfig({
        toolFilter: ['custom-tool'],
      });

      const config = hooksManager.getConfig();
      expect(config.toolFilter).toEqual(['custom-tool']);
    });

    test('getConfig returns current config', async () => {
      await hooksManager.initialize();

      const config = hooksManager.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.toolBefore).toBe(true);
      expect(config.toolAfter).toBe(true);
      expect(config.includeArgs).toBe(true);
      expect(config.includeResult).toBe(true);
    });
  });

  describe('Factory Function', () => {
    test('createOpenClawHooksManager creates manager with config', async () => {
      const config: OpenClawHooksConfig = {
        enabled: true,
        toolBefore: true,
        toolAfter: false,
        includeArgs: true,
        includeResult: true,
        toolFilter: ['read'],
      };

      const manager = createOpenClawHooksManager(config);
      await manager.initialize();

      expect(manager.isInitialized()).toBe(true);
      expect(manager.getConfig().toolAfter).toBe(false);
      expect(manager.getConfig().toolFilter).toEqual(['read']);
    });
  });
});
