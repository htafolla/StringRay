import { StateManager } from '../../state/state-manager';
import { CodexContext, ContextLoadResult } from '../../context-loader';
/**
 * Mock State Manager implementation
 */
export declare class MockStateManager implements StateManager {
    private store;
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T): void;
    clear(key: string): void;
    /**
     * Test utilities
     */
    getAllKeys(): string[];
    getStoreSize(): number;
    clearAll(): void;
}
/**
 * Mock Context Loader
 */
export declare class MockContextLoader {
    private mockContext;
    private shouldFail;
    private loadCount;
    setMockContext(context: CodexContext | null): void;
    setShouldFail(fail: boolean): void;
    loadCodexContext(projectRoot: string): Promise<ContextLoadResult>;
    getLoadCount(): number;
    reset(): void;
}
/**
 * Mock Codex Injector Hook
 */
export declare class MockCodexInjectorHook {
    private injectedContexts;
    private hookCalls;
    getHook(): {
        name: string;
        hooks: {
            'agent.start': (sessionId: string) => void;
            'tool.execute.after': (input: any, output: any, sessionId: string) => any;
        };
    };
    getInjectedContexts(): any[];
    getHookCalls(): any[];
    reset(): void;
}
/**
 * Mock Framework Components Factory
 */
export declare class MockFrameworkFactory {
    private stateManager;
    private contextLoader;
    private codexInjector;
    constructor();
    getStateManager(): MockStateManager;
    getContextLoader(): MockContextLoader;
    getCodexInjector(): MockCodexInjectorHook;
    /**
     * Create a complete mock framework setup
     */
    createMockSetup(): {
        stateManager: MockStateManager;
        contextLoader: MockContextLoader;
        codexInjector: MockCodexInjectorHook;
        injectorHook: {
            name: string;
            hooks: {
                'agent.start': (sessionId: string) => void;
                'tool.execute.after': (input: any, output: any, sessionId: string) => any;
            };
        };
    };
    /**
     * Reset all mock components
     */
    resetAll(): void;
}
/**
 * Spy utilities for framework components
 */
export declare class FrameworkSpies {
    /**
     * Create spies for StateManager methods
     */
    static createStateManagerSpy(): StateManager & {
        spies: any;
    };
    /**
     * Create spy for ContextLoader
     */
    static createContextLoaderSpy(): {
        loadCodexContext: import("vitest").Mock<import("@vitest/spy").Procedure>;
        getTerm: import("vitest").Mock<import("@vitest/spy").Procedure>;
        getCoreTerms: import("vitest").Mock<import("@vitest/spy").Procedure>;
        validateAgainstCodex: import("vitest").Mock<import("@vitest/spy").Procedure>;
        clearCache: import("vitest").Mock<import("@vitest/spy").Procedure>;
        isContextLoaded: import("vitest").Mock<import("@vitest/spy").Procedure>;
        getContextStats: import("vitest").Mock<import("@vitest/spy").Procedure>;
    };
    /**
     * Create spy for CodexInjector hook
     */
    static createCodexInjectorSpy(): {
        hook: {
            name: string;
            hooks: {
                'agent.start': import("vitest").Mock<import("@vitest/spy").Procedure>;
                'tool.execute.after': import("vitest").Mock<import("@vitest/spy").Procedure>;
            };
        };
        spies: {
            agentStart: import("vitest").Mock<import("@vitest/spy").Procedure>;
            toolExecute: import("vitest").Mock<import("@vitest/spy").Procedure>;
        };
    };
}
/**
 * Framework interaction recorder
 */
export declare class FrameworkInteractionRecorder {
    private interactions;
    record(interaction: {
        type: string;
        component: string;
        method: string;
        args?: any[];
        result?: any;
        timestamp?: number;
    }): void;
    getInteractions(): any[];
    getInteractionsByType(type: string): any[];
    getInteractionsByComponent(component: string): any[];
    clear(): void;
    getSummary(): {
        totalInteractions: number;
        componentBreakdown: Record<string, number>;
        typeBreakdown: Record<string, number>;
    };
}
/**
 * Framework performance profiler
 */
export declare class FrameworkProfiler {
    private measurements;
    startMeasurement(name: string): void;
    endMeasurement(name: string): number;
    getMeasurements(name: string): number[];
    getAverage(name: string): number;
    getStats(name: string): {
        count: number;
        average: number;
        min: number;
        max: number;
        total: number;
    };
    clear(): void;
    getAllStats(): Record<string, ReturnType<FrameworkProfiler['getStats']>>;
}
//# sourceMappingURL=mock-framework.d.ts.map