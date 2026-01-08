// Mock implementations for StrRay Framework components

import { vi } from "vitest";
import { StateManager } from "../../state/state-manager";
import { CodexContext, ContextLoadResult } from "../../context-loader";

/**
 * Mock State Manager implementation
 */
export class MockStateManager implements StateManager {
  private store = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  clear(key: string): void {
    this.store.delete(key);
  }

  /**
   * Test utilities
   */
  getAllKeys(): string[] {
    return Array.from(this.store.keys());
  }

  getStoreSize(): number {
    return this.store.size;
  }

  clearAll(): void {
    this.store.clear();
  }
}

/**
 * Mock Context Loader
 */
export class MockContextLoader {
  private mockContext: CodexContext | null = null;
  private shouldFail = false;
  private loadCount = 0;

  setMockContext(context: CodexContext | null): void {
    this.mockContext = context;
  }

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  async loadCodexContext(projectRoot: string): Promise<ContextLoadResult> {
    this.loadCount++;

    if (this.shouldFail) {
      return {
        success: false,
        error: "Mock context loader failure",
        warnings: ["Mock warning"],
      };
    }

    if (!this.mockContext) {
      return {
        success: false,
        error: "No mock context set",
        warnings: [],
      };
    }

    return {
      success: true,
      context: this.mockContext,
      warnings: [],
    };
  }

  getLoadCount(): number {
    return this.loadCount;
  }

  reset(): void {
    this.mockContext = null;
    this.shouldFail = false;
    this.loadCount = 0;
  }
}

/**
 * Mock Codex Injector Hook
 */
export class MockCodexInjectorHook {
  private injectedContexts: any[] = [];
  private hookCalls: any[] = [];

  getHook() {
    return {
      name: "mock-strray-codex-injector",
      hooks: {
        "agent.start": (sessionId: string) => {
          this.hookCalls.push({ type: "agent.start", sessionId });
        },
        "tool.execute.after": (input: any, output: any, sessionId: string) => {
          this.hookCalls.push({
            type: "tool.execute.after",
            input,
            output,
            sessionId,
          });

          // Mock injection
          const injectedOutput = {
            ...output,
            output: `Mock injected content\n${output.output || ""}`,
          };

          this.injectedContexts.push({
            input,
            output: injectedOutput,
            sessionId,
          });

          return injectedOutput;
        },
      },
    };
  }

  getInjectedContexts(): any[] {
    return this.injectedContexts;
  }

  getHookCalls(): any[] {
    return this.hookCalls;
  }

  reset(): void {
    this.injectedContexts = [];
    this.hookCalls = [];
  }
}

/**
 * Mock Framework Components Factory
 */
export class MockFrameworkFactory {
  private stateManager: MockStateManager;
  private contextLoader: MockContextLoader;
  private codexInjector: MockCodexInjectorHook;

  constructor() {
    this.stateManager = new MockStateManager();
    this.contextLoader = new MockContextLoader();
    this.codexInjector = new MockCodexInjectorHook();
  }

  getStateManager(): MockStateManager {
    return this.stateManager;
  }

  getContextLoader(): MockContextLoader {
    return this.contextLoader;
  }

  getCodexInjector(): MockCodexInjectorHook {
    return this.codexInjector;
  }

  /**
   * Create a complete mock framework setup
   */
  createMockSetup() {
    return {
      stateManager: this.stateManager,
      contextLoader: this.contextLoader,
      codexInjector: this.codexInjector,
      injectorHook: this.codexInjector.getHook(),
    };
  }

  /**
   * Reset all mock components
   */
  resetAll(): void {
    this.stateManager.clearAll();
    this.contextLoader.reset();
    this.codexInjector.reset();
  }
}

/**
 * Spy utilities for framework components
 */
export class FrameworkSpies {
  /**
   * Create spies for StateManager methods
   */
  static createStateManagerSpy(): StateManager & { spies: any } {
    const spies = {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
    };

    const stateManager = {
      get: spies.get,
      set: spies.set,
      clear: spies.clear,
      spies,
    };

    return stateManager;
  }

  /**
   * Create spy for ContextLoader
   */
  static createContextLoaderSpy() {
    return {
      loadCodexContext: vi.fn(),
      getTerm: vi.fn(),
      getCoreTerms: vi.fn(),
      validateAgainstCodex: vi.fn(),
      clearCache: vi.fn(),
      isContextLoaded: vi.fn(),
      getContextStats: vi.fn(),
    };
  }

  /**
   * Create spy for CodexInjector hook
   */
  static createCodexInjectorSpy() {
    const agentStartSpy = vi.fn();
    const toolExecuteSpy = vi.fn();

    return {
      hook: {
        name: "spy-strray-codex-injector",
        hooks: {
          "agent.start": agentStartSpy,
          "tool.execute.after": toolExecuteSpy,
        },
      },
      spies: {
        agentStart: agentStartSpy,
        toolExecute: toolExecuteSpy,
      },
    };
  }
}

/**
 * Framework interaction recorder
 */
export class FrameworkInteractionRecorder {
  private interactions: any[] = [];

  record(interaction: {
    type: string;
    component: string;
    method: string;
    args?: any[];
    result?: any;
    timestamp?: number;
  }): void {
    this.interactions.push({
      ...interaction,
      timestamp: interaction.timestamp || Date.now(),
    });
  }

  getInteractions(): any[] {
    return [...this.interactions];
  }

  getInteractionsByType(type: string): any[] {
    return this.interactions.filter((i) => i.type === type);
  }

  getInteractionsByComponent(component: string): any[] {
    return this.interactions.filter((i) => i.component === component);
  }

  clear(): void {
    this.interactions = [];
  }

  getSummary(): {
    totalInteractions: number;
    componentBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
  } {
    const componentBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};

    this.interactions.forEach((interaction) => {
      componentBreakdown[interaction.component] =
        (componentBreakdown[interaction.component] || 0) + 1;
      typeBreakdown[interaction.type] =
        (typeBreakdown[interaction.type] || 0) + 1;
    });

    return {
      totalInteractions: this.interactions.length,
      componentBreakdown,
      typeBreakdown,
    };
  }
}

/**
 * Framework performance profiler
 */
export class FrameworkProfiler {
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string): void {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    // Store start time
    (this.measurements.get(name)! as any).startTime = performance.now();
  }

  endMeasurement(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || !(measurements as any).startTime) {
      throw new Error(`No active measurement for ${name}`);
    }

    const duration = performance.now() - (measurements as any).startTime;
    measurements.push(duration);
    delete (measurements as any).startTime;

    return duration;
  }

  getMeasurements(name: string): number[] {
    return this.measurements.get(name) || [];
  }

  getAverage(name: string): number {
    const measurements = this.getMeasurements(name);
    if (measurements.length === 0) return 0;

    return (
      measurements.reduce((sum, duration) => sum + duration, 0) /
      measurements.length
    );
  }

  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    total: number;
  } {
    const measurements = this.getMeasurements(name);
    if (measurements.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, total: 0 };
    }

    return {
      count: measurements.length,
      average: this.getAverage(name),
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      total: measurements.reduce((sum, duration) => sum + duration, 0),
    };
  }

  clear(): void {
    this.measurements.clear();
  }

  getAllStats(): Record<string, ReturnType<FrameworkProfiler["getStats"]>> {
    const stats: Record<string, ReturnType<FrameworkProfiler["getStats"]>> = {};

    for (const name of this.measurements.keys()) {
      stats[name] = this.getStats(name);
    }

    return stats;
  }
}
