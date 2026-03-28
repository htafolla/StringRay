/**
 * Tool Event Emitter
 * 
 * Simple event system to capture all tool calls and route them
 * through the activity logger and skills router.
 * 
 * @version 1.0.0
 */

import { EventEmitter } from "events";
import { activity } from "./activity-logger.js";

export interface ToolEvent {
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  duration: number;
  timestamp: number;
  sessionId?: string;
}

class ToolEventEmitter extends EventEmitter {
  private static instance: ToolEventEmitter;
  
  private constructor() {
    super();
    this.setupLogging();
  }
  
  static getInstance(): ToolEventEmitter {
    if (!ToolEventEmitter.instance) {
      ToolEventEmitter.instance = new ToolEventEmitter();
    }
    return ToolEventEmitter.instance;
  }
  
  private setupLogging(): void {
    // Log all tool events to activity logger
    this.on("tool", (event: ToolEvent) => {
      activity.script("tool-executed", `Tool ${event.tool} executed`, {
        tool: event.tool,
        duration: event.duration,
        success: !event.error,
        args: Object.keys(event.args || {}),
      });
    });
    
    this.on("tool:start", (event: ToolEvent) => {
      activity.script("tool-started", `Tool ${event.tool} started`, {
        tool: event.tool,
        args: Object.keys(event.args || {}),
      });
    });
    
    this.on("tool:complete", (event: ToolEvent) => {
      const success = !event.error;
      if (success) {
        activity.success("agent", "tool-complete", `Tool ${event.tool} completed`, {
          tool: event.tool,
          duration: event.duration,
        });
      } else {
        activity.error("agent", "tool-failed", `Tool ${event.tool} failed`, {
          tool: event.tool,
          error: event.error || "unknown",
          duration: event.duration,
        });
      }
    });
  }
  
  emitToolStart(tool: string, args: Record<string, unknown>): void {
    const event: ToolEvent = {
      tool,
      args,
      duration: 0,
      timestamp: Date.now(),
    };
    this.emit("tool:start", event);
    this.emit("tool", event);
  }
  
  emitToolComplete(
    tool: string, 
    args: Record<string, unknown>, 
    result?: unknown,
    error?: string,
    duration?: number
  ): void {
    const event: ToolEvent = {
      tool,
      args,
      result,
      duration: duration || 0,
      timestamp: Date.now(),
    };
    
    // Only set error if it's defined
    if (error) {
      event.error = error;
    }
    
    this.emit("tool:complete", event);
    this.emit("tool", event);
  }
}

// Singleton export
export const toolEvents = ToolEventEmitter.getInstance();

// Convenience functions
export function logToolStart(tool: string, args: Record<string, unknown> = {}): void {
  toolEvents.emitToolStart(tool, args);
}

export function logToolComplete(
  tool: string, 
  args: Record<string, unknown> = {}, 
  result?: unknown,
  error?: string,
  duration?: number
): void {
  toolEvents.emitToolComplete(tool, args, result, error, duration);
}
