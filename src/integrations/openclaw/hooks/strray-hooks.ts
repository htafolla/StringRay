/**
 * OpenClaw StringRay Hooks Integration
 *
 * Integrates OpenClaw with StringRay's tool.before and tool.after hooks
 * to send tool execution events to OpenClaw Gateway.
 *
 * @version 1.0.0
 * @since 2026-03-14
 */

import {
  ToolBeforeEvent,
  ToolAfterEvent,
} from '../types.js';
import { OpenClawClient } from '../client.js';

/**
 * Hooks configuration
 */
export interface OpenClawHooksConfig {
  enabled: boolean;
  toolBefore: boolean;
  toolAfter: boolean;
  includeArgs: boolean;
  includeResult: boolean;
  toolFilter?: string[];
}

/**
 * StringRay tool event
 */
export interface StringRayToolEvent {
  toolName: string;
  toolId: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  duration: number;
  timestamp: number;
  sessionId?: string;
  agent?: string;
}

/**
 * Hook event callback type
 */
export type ToolEventCallback = (event: StringRayToolEvent) => void | Promise<void>;

/**
 * OpenClaw Hooks Manager
 */
export class OpenClawHooksManager {
  private client: OpenClawClient | null = null;
  private config: OpenClawHooksConfig;
  private initialized = false;
  private toolBeforeCallbacks: Set<ToolEventCallback> = new Set();
  private toolAfterCallbacks: Set<ToolEventCallback> = new Set();
  private logger: Console;
  
  // Offline event buffering
  private eventQueue: Array<{ type: string; event: ToolBeforeEvent | ToolAfterEvent }> = [];
  private maxQueueSize = 100;
  private isFlushing = false;

  constructor(config: OpenClawHooksConfig) {
    this.config = {
      enabled: config.enabled ?? true,
      toolBefore: config.toolBefore ?? true,
      toolAfter: config.toolAfter ?? true,
      includeArgs: config.includeArgs ?? true,
      includeResult: config.includeResult ?? true,
      toolFilter: config.toolFilter,
    };
    this.logger = console;
  }

  /**
   * Set the OpenClaw client
   */
  setClient(client: OpenClawClient): void {
    this.client = client;
  }

  /**
   * Initialize hooks - registers with StringRay's event system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('[OpenClawHooks] Already initialized');
      return;
    }

    if (!this.config.enabled) {
      this.logger.info('[OpenClawHooks] Hooks disabled in configuration');
      return;
    }

    this.logger.info('[OpenClawHooks] Initializing StringRay tool hooks...');
    
    // Register with StringRay's event system
    // The integration should call registerToolBefore and registerToolAfter
    // to connect to StringRay's actual tool execution events
    
    this.initialized = true;
    this.logger.info('[OpenClawHooks] Hooks initialized successfully');
  }

  /**
   * Register a callback for tool.before events
   * Call this to connect to StringRay's tool.before event system
   */
  registerToolBefore(callback: ToolEventCallback): void {
    this.toolBeforeCallbacks.add(callback);
  }

  /**
   * Unregister a tool.before callback
   */
  unregisterToolBefore(callback: ToolEventCallback): void {
    this.toolBeforeCallbacks.delete(callback);
  }

  /**
   * Register a callback for tool.after events
   * Call this to connect to StringRay's tool.after event system
   */
  registerToolAfter(callback: ToolEventCallback): void {
    this.toolAfterCallbacks.add(callback);
  }

  /**
   * Unregister a tool.after callback
   */
  unregisterToolAfter(callback: ToolEventCallback): void {
    this.toolAfterCallbacks.delete(callback);
  }

  /**
   * Handle tool.before event from StringRay
   */
  async onToolBefore(event: StringRayToolEvent): Promise<void> {
    if (!this.config.enabled || !this.config.toolBefore) {
      return;
    }

    // Filter by tool name if configured
    if (this.config.toolFilter && !this.config.toolFilter.includes(event.toolName)) {
      return;
    }

    try {
      const hookEvent: ToolBeforeEvent = {
        eventType: 'tool.before',
        toolName: event.toolName,
        toolId: event.toolId,
        args: this.config.includeArgs ? event.args : {},
        duration: event.duration,
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        agent: event.agent,
      };

      // Send to OpenClaw if connected, otherwise queue
      if (this.client?.isConnected()) {
        await this.client.sendRequest('event.tool.before', hookEvent as unknown as Record<string, unknown>);
        // Try to flush any queued events
        await this.flushEventQueue();
      } else {
        // Queue event for later when connection is restored
        this.queueEvent('tool.before', hookEvent);
      }

      // Also notify registered callbacks
      for (const callback of this.toolBeforeCallbacks) {
        try {
          await callback(event);
        } catch (error) {
          this.logger.error('[OpenClawHooks] Callback error in tool.before:', error);
        }
      }

      this.logger.debug(`[OpenClawHooks] tool.before: ${event.toolName}`);
    } catch (error) {
      this.logger.error('[OpenClawHooks] Error handling tool.before:', error);
    }
  }

  /**
   * Handle tool.after event from StringRay
   */
  async onToolAfter(event: StringRayToolEvent): Promise<void> {
    if (!this.config.enabled || !this.config.toolAfter) {
      return;
    }

    // Filter by tool name if configured
    if (this.config.toolFilter && !this.config.toolFilter.includes(event.toolName)) {
      return;
    }

    try {
      const hookEvent: ToolAfterEvent = {
        eventType: 'tool.after',
        toolName: event.toolName,
        toolId: event.toolId,
        args: this.config.includeArgs ? event.args : {},
        result: this.config.includeResult ? event.result : undefined,
        error: event.error,
        success: !event.error,
        duration: event.duration,
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        agent: event.agent,
      };

      // Send to OpenClaw if connected, otherwise queue
      if (this.client?.isConnected()) {
        await this.client.sendRequest('event.tool.after', hookEvent as unknown as Record<string, unknown>);
        // Try to flush any queued events
        await this.flushEventQueue();
      } else {
        // Queue event for later when connection is restored
        this.queueEvent('tool.after', hookEvent);
      }

      // Also notify registered callbacks
      for (const callback of this.toolAfterCallbacks) {
        try {
          await callback(event);
        } catch (error) {
          this.logger.error('[OpenClawHooks] Callback error in tool.after:', error);
        }
      }

      this.logger.debug(`[OpenClawHooks] tool.after: ${event.toolName} (${event.error ? 'error' : 'success'})`);
    } catch (error) {
      this.logger.error('[OpenClawHooks] Error handling tool.after:', error);
    }
  }

  /**
   * Queue an event for later delivery when connection is restored
   */
  private queueEvent(type: string, event: ToolBeforeEvent | ToolAfterEvent): void {
    if (this.eventQueue.length >= this.maxQueueSize) {
      // Remove oldest event to make room
      this.eventQueue.shift();
      this.logger.warn('[OpenClawHooks] Event queue full, dropping oldest event');
    }
    this.eventQueue.push({ type, event });
    this.logger.debug(`[OpenClawHooks] Queued ${type} event (queue size: ${this.eventQueue.length})`);
  }

  /**
   * Flush queued events to OpenClaw Gateway
   */
  private async flushEventQueue(): Promise<void> {
    if (this.isFlushing || !this.client?.isConnected() || this.eventQueue.length === 0) {
      return;
    }

    this.isFlushing = true;
    const queue = [...this.eventQueue];
    this.eventQueue.length = 0;

    try {
      for (const item of queue) {
        try {
          if (item.type === 'tool.before') {
            await this.client.sendRequest('event.tool.before', item.event as unknown as Record<string, unknown>);
          } else {
            await this.client.sendRequest('event.tool.after', item.event as unknown as Record<string, unknown>);
          }
        } catch (error) {
          this.logger.error(`[OpenClawHooks] Failed to send queued ${item.type} event:`, error);
          // Re-queue failed events
          this.eventQueue.push(item);
        }
      }
      this.logger.info(`[OpenClawHooks] Flushed ${queue.length} queued events`);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Get the current queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Called when client reconnects - flush the event queue
   */
  async handleReconnect(): Promise<void> {
    if (this.eventQueue.length > 0) {
      this.logger.info(`[OpenClawHooks] Client reconnected, flushing ${this.eventQueue.length} queued events...`);
      await this.flushEventQueue();
    }
  }

  /**
   * Shutdown hooks
   */
  async shutdown(): Promise<void> {
    // Clear the event queue on shutdown
    const queuedCount = this.eventQueue.length;
    this.eventQueue.length = 0;
    
    this.initialized = false;
    this.client = null;
    this.logger.info(`[OpenClawHooks] Hooks shutdown complete (${queuedCount} queued events dropped)`);
  }

  /**
   * Check if hooks are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OpenClawHooksConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): OpenClawHooksConfig {
    return { ...this.config };
  }
}

/**
 * Factory function to create hooks manager
 */
export function createOpenClawHooksManager(config: OpenClawHooksConfig): OpenClawHooksManager {
  return new OpenClawHooksManager(config);
}
