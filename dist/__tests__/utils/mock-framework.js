// Mock implementations for StrRay Framework components
import { vi } from 'vitest';
/**
 * Mock State Manager implementation
 */
export class MockStateManager {
    store = new Map();
    get(key) {
        return this.store.get(key);
    }
    set(key, value) {
        this.store.set(key, value);
    }
    clear(key) {
        this.store.delete(key);
    }
    /**
     * Test utilities
     */
    getAllKeys() {
        return Array.from(this.store.keys());
    }
    getStoreSize() {
        return this.store.size;
    }
    clearAll() {
        this.store.clear();
    }
}
/**
 * Mock Context Loader
 */
export class MockContextLoader {
    mockContext = null;
    shouldFail = false;
    loadCount = 0;
    setMockContext(context) {
        this.mockContext = context;
    }
    setShouldFail(fail) {
        this.shouldFail = fail;
    }
    async loadCodexContext(projectRoot) {
        this.loadCount++;
        if (this.shouldFail) {
            return {
                success: false,
                error: 'Mock context loader failure',
                warnings: ['Mock warning']
            };
        }
        if (!this.mockContext) {
            return {
                success: false,
                error: 'No mock context set',
                warnings: []
            };
        }
        return {
            success: true,
            context: this.mockContext,
            warnings: []
        };
    }
    getLoadCount() {
        return this.loadCount;
    }
    reset() {
        this.mockContext = null;
        this.shouldFail = false;
        this.loadCount = 0;
    }
}
/**
 * Mock Codex Injector Hook
 */
export class MockCodexInjectorHook {
    injectedContexts = [];
    hookCalls = [];
    getHook() {
        return {
            name: 'mock-strray-codex-injector',
            hooks: {
                'agent.start': (sessionId) => {
                    this.hookCalls.push({ type: 'agent.start', sessionId });
                },
                'tool.execute.after': (input, output, sessionId) => {
                    this.hookCalls.push({ type: 'tool.execute.after', input, output, sessionId });
                    // Mock injection
                    const injectedOutput = {
                        ...output,
                        output: `Mock injected content\n${output.output || ''}`
                    };
                    this.injectedContexts.push({ input, output: injectedOutput, sessionId });
                    return injectedOutput;
                }
            }
        };
    }
    getInjectedContexts() {
        return this.injectedContexts;
    }
    getHookCalls() {
        return this.hookCalls;
    }
    reset() {
        this.injectedContexts = [];
        this.hookCalls = [];
    }
}
/**
 * Mock Framework Components Factory
 */
export class MockFrameworkFactory {
    stateManager;
    contextLoader;
    codexInjector;
    constructor() {
        this.stateManager = new MockStateManager();
        this.contextLoader = new MockContextLoader();
        this.codexInjector = new MockCodexInjectorHook();
    }
    getStateManager() {
        return this.stateManager;
    }
    getContextLoader() {
        return this.contextLoader;
    }
    getCodexInjector() {
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
            injectorHook: this.codexInjector.getHook()
        };
    }
    /**
     * Reset all mock components
     */
    resetAll() {
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
    static createStateManagerSpy() {
        const spies = {
            get: vi.fn(),
            set: vi.fn(),
            clear: vi.fn()
        };
        const stateManager = {
            get: spies.get,
            set: spies.set,
            clear: spies.clear,
            spies
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
            getContextStats: vi.fn()
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
                name: 'spy-strray-codex-injector',
                hooks: {
                    'agent.start': agentStartSpy,
                    'tool.execute.after': toolExecuteSpy
                }
            },
            spies: {
                agentStart: agentStartSpy,
                toolExecute: toolExecuteSpy
            }
        };
    }
}
/**
 * Framework interaction recorder
 */
export class FrameworkInteractionRecorder {
    interactions = [];
    record(interaction) {
        this.interactions.push({
            ...interaction,
            timestamp: interaction.timestamp || Date.now()
        });
    }
    getInteractions() {
        return [...this.interactions];
    }
    getInteractionsByType(type) {
        return this.interactions.filter(i => i.type === type);
    }
    getInteractionsByComponent(component) {
        return this.interactions.filter(i => i.component === component);
    }
    clear() {
        this.interactions = [];
    }
    getSummary() {
        const componentBreakdown = {};
        const typeBreakdown = {};
        this.interactions.forEach(interaction => {
            componentBreakdown[interaction.component] = (componentBreakdown[interaction.component] || 0) + 1;
            typeBreakdown[interaction.type] = (typeBreakdown[interaction.type] || 0) + 1;
        });
        return {
            totalInteractions: this.interactions.length,
            componentBreakdown,
            typeBreakdown
        };
    }
}
/**
 * Framework performance profiler
 */
export class FrameworkProfiler {
    measurements = new Map();
    startMeasurement(name) {
        if (!this.measurements.has(name)) {
            this.measurements.set(name, []);
        }
        // Store start time
        this.measurements.get(name).startTime = performance.now();
    }
    endMeasurement(name) {
        const measurements = this.measurements.get(name);
        if (!measurements || !measurements.startTime) {
            throw new Error(`No active measurement for ${name}`);
        }
        const duration = performance.now() - measurements.startTime;
        measurements.push(duration);
        delete measurements.startTime;
        return duration;
    }
    getMeasurements(name) {
        return this.measurements.get(name) || [];
    }
    getAverage(name) {
        const measurements = this.getMeasurements(name);
        if (measurements.length === 0)
            return 0;
        return measurements.reduce((sum, duration) => sum + duration, 0) / measurements.length;
    }
    getStats(name) {
        const measurements = this.getMeasurements(name);
        if (measurements.length === 0) {
            return { count: 0, average: 0, min: 0, max: 0, total: 0 };
        }
        return {
            count: measurements.length,
            average: this.getAverage(name),
            min: Math.min(...measurements),
            max: Math.max(...measurements),
            total: measurements.reduce((sum, duration) => sum + duration, 0)
        };
    }
    clear() {
        this.measurements.clear();
    }
    getAllStats() {
        const stats = {};
        for (const name of this.measurements.keys()) {
            stats[name] = this.getStats(name);
        }
        return stats;
    }
}
//# sourceMappingURL=mock-framework.js.map