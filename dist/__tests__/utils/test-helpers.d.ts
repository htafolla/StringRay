import * as fs from 'fs';
import * as path from 'path';
import { CodexContext, CodexTerm } from '../../context-loader';
/**
 * Mock file system utilities for testing
 */
export declare class MockFileSystem {
    private files;
    private directories;
    constructor();
    /**
     * Add a mock file
     */
    addFile(filePath: string, content: string): void;
    /**
     * Add a mock directory
     */
    addDirectory(dirPath: string): void;
    /**
     * Reset the mock file system
     */
    reset(): void;
    /**
     * Get mock fs implementation
     */
    getMockFs(): typeof fs;
    /**
     * Get mock path implementation
     */
    getMockPath(): typeof path;
}
/**
 * Mock codex content generators
 */
export declare class MockCodexGenerator {
    /**
     * Generate a complete mock codex content
     */
    static createCompleteCodex(version?: string): string;
    /**
     * Generate minimal codex content for testing
     */
    static createMinimalCodex(): string;
    /**
     * Generate codex with specific violations for testing
     */
    static createCodexWithViolations(): string;
    /**
     * Generate invalid codex content for error testing
     */
    static createInvalidCodex(): string;
}
/**
 * Mock context creation utilities
 */
export declare class MockContextFactory {
    /**
     * Create a mock codex context
     */
    static createMockContext(overrides?: Partial<CodexContext>): CodexContext;
    /**
     * Create a mock codex term
     */
    static createMockTerm(overrides?: Partial<CodexTerm>): CodexTerm;
}
/**
 * Test data factories
 */
export declare class TestDataFactory {
    /**
     * Create mock validation results
     */
    static createValidationResult(compliant?: boolean, violationCount?: number): {
        compliant: boolean;
        violations: {
            term: CodexTerm;
            reason: string;
            severity: "low" | "medium" | "high" | "blocking";
        }[];
        recommendations: string[];
    };
    /**
     * Create mock tool execution data
     */
    static createToolExecution(tool?: string, hasOutput?: boolean): {
        input: {
            tool: string;
            args: {
                filePath: string;
            };
        };
        output: {
            output: string;
        } | {
            output?: never;
        };
    };
    /**
     * Create mock session data
     */
    static createSessionData(sessionId?: string): {
        sessionId: string;
        startTime: number;
        componentStates: {
            contextLoader: string;
            stateManager: string;
            codexInjector: string;
        };
    };
}
/**
 * Performance testing utilities
 */
export declare class PerformanceTestUtils {
    /**
     * Measure execution time of a function
     */
    static measureExecutionTime<T>(fn: () => T): {
        result: T;
        duration: number;
    };
    /**
     * Run performance test with multiple iterations
     */
    static runPerformanceTest<T>(fn: () => T, iterations?: number): {
        results: T[];
        totalDuration: number;
        averageDuration: number;
    };
    /**
     * Assert performance requirements
     */
    static assertPerformance(duration: number, maxDuration: number, operation: string): void;
}
/**
 * Memory testing utilities
 */
export declare class MemoryTestUtils {
    /**
     * Get current memory usage
     */
    static getMemoryUsage(): NodeJS.MemoryUsage;
    /**
     * Monitor memory usage during operation
     */
    static monitorMemoryUsage<T>(fn: () => T): {
        result: T;
        memoryDelta: number;
    };
    /**
     * Force garbage collection (if available)
     */
    static forceGC(): void;
}
/**
 * Async testing utilities
 */
export declare class AsyncTestUtils {
    /**
     * Wait for a specified amount of time
     */
    static delay(ms: number): Promise<void>;
    /**
     * Retry an async operation with backoff
     */
    static retry<T>(fn: () => Promise<T>, maxAttempts?: number, delayMs?: number): Promise<T>;
    /**
     * Test async operation timeout
     */
    static withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T>;
}
//# sourceMappingURL=test-helpers.d.ts.map