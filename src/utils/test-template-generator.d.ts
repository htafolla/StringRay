/**
 * Test Template Generator for StringRay Framework
 *
 * Automatically generates test templates for different file types
 * to ensure consistent test coverage and structure.
 */
export interface TestTemplateOptions {
    filePath: string;
    componentName?: string;
    exports?: string[];
    isReact?: boolean;
    isTypeScript?: boolean;
}
/**
 * Generate a test template based on file type and structure
 */
export declare function generateTestTemplate(options: TestTemplateOptions): string;
/**
 * Analyze a source file to extract exports for test generation
 */
export declare function analyzeSourceFile(filePath: string): {
    exports: string[];
    isReact: boolean;
    isTypeScript: boolean;
};
//# sourceMappingURL=test-template-generator.d.ts.map