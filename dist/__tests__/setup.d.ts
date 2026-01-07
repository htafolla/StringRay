declare global {
    var testUtils: {
        createTempDir: () => string;
        cleanupTempDir: (dirPath: string) => void;
        createMockCodexContent: (version?: string) => string;
        mockFs: {
            existsSync: (path: string) => boolean;
            readFileSync: (path: string, encoding: string) => string;
            writeFileSync: () => void;
            mkdirSync: () => void;
            rmSync: () => void;
        };
    };
}
declare module 'vitest' {
    interface Assertion<T = any> {
        toBeValidCodexTerm(): T;
        toHaveCodexViolations(): T;
        toBeCompliantWithCodex(): T;
    }
}
export {};
//# sourceMappingURL=setup.d.ts.map