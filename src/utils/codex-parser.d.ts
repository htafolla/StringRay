/**
 * StringRay Codex Parser Utility
 *
 * Unified parsing utility for codex content in both JSON and Markdown formats.
 * Provides consistent parsing across all components with format detection and validation.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */
import { CodexContext } from "../context-loader";
/**
 * Content format detection result
 */
export interface FormatDetectionResult {
    format: "json" | "markdown" | "unknown";
    confidence: number;
}
/**
 * Parsing result
 */
export interface ParsingResult {
    success: boolean;
    context?: CodexContext;
    error?: string;
    warnings: string[];
}
/**
 * Detect content format
 */
export declare function detectContentFormat(content: string): FormatDetectionResult;
/**
 * Unified codex content parser
 */
export declare function parseCodexContent(content: string, sourcePath?: string): ParsingResult;
/**
 * Extract codex metadata from content (for compatibility with existing code)
 */
export declare function extractCodexMetadata(content: string): {
    version: string;
    termCount: number;
};
/**
 * Pre-modification validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Validate TypeScript code syntax
 */
export declare function validateTypeScriptSyntax(code: string, filePath?: string): Promise<ValidationResult>;
/**
 * Validate JSON syntax
 */
export declare function validateJsonSyntax(jsonString: string): ValidationResult;
/**
 * Comprehensive pre-modification validation
 */
export declare function validateBeforeModification(content: string, filePath: string): Promise<ValidationResult>;
//# sourceMappingURL=codex-parser.d.ts.map