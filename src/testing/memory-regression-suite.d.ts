import { EventEmitter } from "events";
/**
 * Memory Regression Testing Suite
 * Automated testing for memory usage patterns and leak detection
 */
export interface MemoryRegressionTest {
    name: string;
    description: string;
    setup?: (() => Promise<void> | void) | undefined;
    execute: () => Promise<any> | any;
    cleanup?: (() => Promise<void> | void) | undefined;
    expectedMemoryDelta: {
        maxIncrease: number;
        acceptableLeak: number;
    };
}
export interface MemoryRegressionResult {
    testName: string;
    passed: boolean;
    memoryDelta: number;
    leakRate: number;
    duration: number;
    error?: string;
    recommendations: string[];
}
export interface RegressionSuiteConfig {
    testTimeout: number;
    memorySamplingInterval: number;
    acceptableMemoryGrowth: number;
    leakDetectionThreshold: number;
}
export declare class MemoryRegressionTester extends EventEmitter {
    private config;
    private tests;
    constructor(config?: Partial<RegressionSuiteConfig>);
    /**
     * Add a regression test
     */
    addTest(test: MemoryRegressionTest): void;
    /**
     * Run all regression tests
     */
    runAllTests(): Promise<MemoryRegressionResult[]>;
    /**
     * Run a single regression test
     */
    private runTest;
    /**
     * Create a standard memory regression test
     */
    createStandardTest(name: string, description: string, testFunction: () => Promise<any> | any, options?: {
        maxMemoryIncrease?: number;
        acceptableLeakRate?: number;
        setup?: () => Promise<void> | void;
        cleanup?: () => Promise<void> | void;
    }): MemoryRegressionTest;
    /**
     * Generate test report
     */
    generateReport(results: MemoryRegressionResult[]): string;
    /**
     * Calculate variance of memory samples
     */
    private calculateVariance;
}
export declare const memoryTestTemplates: {
    sessionOperations: (sessionCount?: number) => {
        name: string;
        description: string;
        setup: () => Promise<void>;
        execute: () => Promise<{
            id: string;
            data: {
                userId: number;
                metadata: {
                    created: number;
                    active: boolean;
                };
            };
        }[]>;
        cleanup: () => Promise<void>;
        expectedMemoryDelta: {
            maxIncrease: number;
            acceptableLeak: number;
        };
    };
    cacheOperations: (cacheSize?: number) => {
        name: string;
        description: string;
        execute: () => Promise<number>;
        expectedMemoryDelta: {
            maxIncrease: number;
            acceptableLeak: number;
        };
    };
    streamingOperations: (messageCount?: number) => {
        name: string;
        description: string;
        execute: () => Promise<number>;
        expectedMemoryDelta: {
            maxIncrease: number;
            acceptableLeak: number;
        };
    };
};
//# sourceMappingURL=memory-regression-suite.d.ts.map