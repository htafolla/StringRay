/**
 * StrRay Codex Parser Utility
 *
 * Unified parsing utility for codex content in both JSON and Markdown formats.
 * Provides consistent parsing across all components with format detection and validation.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { CodexContext, CodexTerm } from "../context-loader";

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
export function detectContentFormat(content: string): FormatDetectionResult {
  if (!content || content.trim() === "") {
    return { format: "unknown", confidence: 0 };
  }

  // Check for JSON format
  const jsonConfidence = (() => {
    try {
      JSON.parse(content);
      return 1.0;
    } catch {
      return 0.0; // Not valid JSON
    }
  })();

  // Check for Markdown format
  const markdownConfidence = (() => {
    const markdownIndicators = [
      content.includes("**Version**:"),
      content.includes("**Last Updated**:"),
      content.includes("#### "), // Term headers
      content.includes("## Overview"),
      content.includes("## Critical Codex Terms"),
      content.includes("#### 1."), // Common first term
      content.includes("#### 2."), // Common second term
    ];
    return (
      markdownIndicators.filter(Boolean).length / markdownIndicators.length
    );
  })();

  // Prefer JSON as primary format, Markdown as fallback
  if (jsonConfidence >= 0.5) {
    return { format: "json", confidence: jsonConfidence };
  } else if (markdownConfidence > 0.1) {
    return { format: "markdown", confidence: markdownConfidence };
  }

  return { format: "unknown", confidence: 0 };
}

/**
 * Parse JSON format codex content
 */
function parseJsonContent(content: string): ParsingResult {
  const warnings: string[] = [];

  try {
    const jsonData = JSON.parse(content);

    // Convert terms object to Map
    const termsMap = new Map<number, CodexTerm>();
    if (jsonData.terms) {
      Object.entries(jsonData.terms).forEach(([key, term]: [string, any]) => {
        termsMap.set(parseInt(key, 10), term);
      });
    }

    // Build context from JSON data
    const context: CodexContext = {
      version: jsonData.version || "1.2.20",
      lastUpdated: jsonData.lastUpdated || new Date().toISOString(),
      terms: termsMap,
      interweaves: jsonData.interweaves || [],
      lenses: jsonData.lenses || [],
      principles: jsonData.principles || [],
      antiPatterns: jsonData.antiPatterns || [],
      validationCriteria: jsonData.validationCriteria || {},
      frameworkAlignment: jsonData.frameworkAlignment || {},
      errorPreventionTarget: jsonData.errorPreventionTarget || 0.996,
    };

    return { success: true, context, warnings };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON content: ${error instanceof Error ? error.message : String(error)}`,
      warnings,
    };
  }
}

/**
 * Parse Markdown format codex content
 */
function parseMarkdownContent(content: string): ParsingResult {
  const warnings: string[] = [];

  try {
    // Extract version
    const versionMatch = content.match(/\*\*Version\*\*:\s*([^\n]+)/);
    const version =
      versionMatch && versionMatch[1] ? versionMatch[1].trim() : "1.2.20";

    // Extract last updated
    const lastUpdatedMatch = content.match(/\*\*Last Updated\*\*:\s*([^\n]+)/);
    const lastUpdated =
      lastUpdatedMatch && lastUpdatedMatch[1]
        ? lastUpdatedMatch[1].trim()
        : new Date().toISOString();

    // Extract terms
    const termsMap = new Map<number, CodexTerm>();
    const termRegex =
      /^\s*#### (\d+)\.\s*([^\n]+)(?:\s*\n([\s\S]*?))?(?=^\s*#### \d+\.|^\s*## |$)/gm;
    let match;

    while ((match = termRegex.exec(content)) !== null) {
      const termNumber = parseInt(match[1]!, 10);
      const termTitle = match[2]!.trim();
      const termDescription = (match[3] || "").trim();

      // Infer category from term number
      let category: CodexTerm["category"];
      if (termNumber <= 10) {
        category = "core";
      } else if (termNumber <= 20) {
        category = "extended";
      } else if (termNumber <= 30) {
        category = "architecture";
      } else {
        category = "advanced";
      }

      // Check for zero tolerance indicators
      const zeroTolerance =
        termDescription.toLowerCase().includes("zero-tolerance") ||
        termDescription.toLowerCase().includes("blocking");

      // Infer enforcement level
      let enforcementLevel: "low" | "medium" | "high" | "blocking" = "low";
      if (zeroTolerance) {
        enforcementLevel = "blocking";
      } else if (termDescription.toLowerCase().includes("blocking")) {
        enforcementLevel = "blocking";
      } else if (termDescription.toLowerCase().includes("high")) {
        enforcementLevel = "high";
      } else if (termDescription.toLowerCase().includes("medium")) {
        enforcementLevel = "medium";
      }

      const term: CodexTerm = {
        number: termNumber,
        description: termDescription,
        category,
        zeroTolerance,
        enforcementLevel,
      };

      termsMap.set(termNumber, term);
    }

    // Extract interweaves, lenses, principles, anti-patterns
    const interweaves = extractSectionList(content, "Interweaves");
    const lenses = extractSectionList(content, "Lenses");
    const principles = extractSectionList(content, "Principles");
    const antiPatterns = extractSectionList(content, "Anti-Patterns");

    // Extract validation criteria (simple presence check for now)
    const validationCriteria: Record<string, boolean> = {};
    const validationSections = [
      "Code Completeness",
      "Code Quality",
      "Code Safety",
    ];
    validationSections.forEach((section) => {
      validationCriteria[section] = content.includes(`### ${section}`);
    });

    // Extract framework alignment
    const frameworkAlignment: Record<string, string> = {};
    const frameworkMatch = content.match(
      /### Framework Alignment([\s\S]*?)(?=### |$)/,
    );
    if (frameworkMatch && frameworkMatch[1]) {
      const alignmentText = frameworkMatch[1];
      const alignmentRegex = /- \*\*([^:]+)\*\*:\s*([^\n]+)/g;
      let alignmentMatch;
      while ((alignmentMatch = alignmentRegex.exec(alignmentText)) !== null) {
        if (alignmentMatch[1] && alignmentMatch[2]) {
          frameworkAlignment[alignmentMatch[1].trim()] =
            alignmentMatch[2].trim();
        }
      }
    }

    // Extract error prevention target
    const targetMatch = content.match(
      /Error Prevention Target[^:]*:\s*([\d.]+)%?/,
    );
    const errorPreventionTarget =
      targetMatch && targetMatch[1] ? parseFloat(targetMatch[1]) / 100 : 0.996;

    const context: CodexContext = {
      version,
      lastUpdated,
      terms: termsMap,
      interweaves,
      lenses,
      principles,
      antiPatterns,
      validationCriteria,
      frameworkAlignment,
      errorPreventionTarget,
    };

    return { success: true, context, warnings };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse Markdown content: ${error instanceof Error ? error.message : String(error)}`,
      warnings,
    };
  }
}

/**
 * Extract section list from markdown content
 */
function extractSectionList(content: string, sectionName: string): string[] {
  const sectionRegex = new RegExp(
    `### ${sectionName}([\\s\\S]*?)(?=### |$)`,
    "i",
  );
  const match = content.match(sectionRegex);

  if (!match || !match[1]) return [];

  const sectionContent = match[1];
  const listRegex = /- (.+)$/gm;
  const items: string[] = [];
  let listMatch;

  while ((listMatch = listRegex.exec(sectionContent)) !== null) {
    if (listMatch[1]) {
      items.push(listMatch[1].trim());
    }
  }

  return items;
}

/**
 * Unified codex content parser
 */
export function parseCodexContent(
  content: string,
  sourcePath?: string,
): ParsingResult {
  // Validate inputs
  if (!content || content.trim() === "") {
    return {
      success: false,
      error: "Invalid content provided: content cannot be empty",
      warnings: [],
    };
  }

  if (!sourcePath || sourcePath.trim() === "") {
    return {
      success: false,
      error: "Invalid source path provided",
      warnings: [],
    };
  }

  // Detect format
  const formatResult = detectContentFormat(content);

  // For .json files, try JSON parsing regardless of detection result
  const isJsonFile = sourcePath && sourcePath.endsWith(".json");

  if (formatResult.format === "unknown" && !isJsonFile) {
    return {
      success: false,
      error: `Unable to detect content format. Content appears to be neither valid JSON nor Markdown.`,
      warnings: [`Format detection confidence: ${formatResult.confidence}`],
    };
  }

  // Parse based on detected format or file extension
  const result =
    formatResult.format === "json" || isJsonFile
      ? parseJsonContent(content)
      : parseMarkdownContent(content);

  // Add source path to error if available
  if (!result.success && sourcePath && result.error) {
    result.error = `${result.error} (source: ${sourcePath})`;
  }

  return result;
}

/**
 * Extract codex metadata from content (for compatibility with existing code)
 */
export function extractCodexMetadata(content: string): {
  version: string;
  termCount: number;
} {
  const result = parseCodexContent(content, "extract-metadata");

  if (result.success && result.context) {
    return {
      version: result.context.version,
      termCount: result.context.terms.size,
    };
  }

  // Fallback to old logic for backward compatibility
  try {
    const jsonData = JSON.parse(content);
    const version = jsonData.version || "1.2.20";
    const termCount = jsonData.terms ? Object.keys(jsonData.terms).length : 0;
    return { version, termCount };
  } catch (error) {
    // Fallback for invalid content
    return { version: "1.2.20", termCount: 0 };
  }
}

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
export async function validateTypeScriptSyntax(
  code: string,
  filePath?: string,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Use a simpler syntax check for now - basic bracket matching and common syntax issues
    const bracketStack: string[] = [];
    const brackets = { "{": "}", "[": "]", "(": ")" };

    for (let i = 0; i < code.length; i++) {
      const char = code.charAt(i);

      if (char in brackets) {
        bracketStack.push(char);
      } else if (Object.values(brackets).includes(char)) {
        const lastOpen = bracketStack.pop();
        if (!lastOpen || brackets[lastOpen as keyof typeof brackets] !== char) {
          errors.push(
            `Bracket mismatch at position ${i}: expected closing bracket for '${lastOpen || "none"}', found '${char}'`,
          );
        }
      }

      // Check for common syntax issues
      if (char === ";" && i > 0 && code.charAt(i - 1) === ";") {
        warnings.push(`Double semicolon at position ${i}`);
      }
    }

    if (bracketStack.length > 0) {
      errors.push(`Unclosed brackets: ${bracketStack.join(", ")}`);
    }

    // Check for basic import/export syntax
    const importRegex = /^import\s+.*from\s+['"]/gm;
    const exportRegex = /^export\s+/gm;

    let match;
    while ((match = importRegex.exec(code)) !== null) {
      if (!match[0].includes("from")) {
        errors.push(
          `Invalid import statement at line ${code.substring(0, match.index).split("\n").length}`,
        );
      }
    }

    while ((match = exportRegex.exec(code)) !== null) {
      // Basic export validation - could be expanded
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(
      `Failed to validate TypeScript syntax: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      valid: false,
      errors,
      warnings,
    };
  }
}

/**
 * Validate JSON syntax
 */
export function validateJsonSyntax(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    JSON.parse(jsonString);
    return {
      valid: true,
      errors: [],
      warnings: [],
    };
  } catch (error) {
    errors.push(
      `Invalid JSON syntax: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      valid: false,
      errors,
      warnings,
    };
  }
}

/**
 * Comprehensive pre-modification validation
 */
export async function validateBeforeModification(
  content: string,
  filePath: string,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file extension to determine validation type
  const isTypeScript = filePath.endsWith(".ts") || filePath.endsWith(".tsx");
  const isJson = filePath.endsWith(".json");

  if (isTypeScript) {
    const tsResult = await validateTypeScriptSyntax(content, filePath);
    errors.push(...tsResult.errors);
    warnings.push(...tsResult.warnings);
  } else if (isJson) {
    const jsonResult = validateJsonSyntax(content);
    errors.push(...jsonResult.errors);
    warnings.push(...jsonResult.warnings);
  }

  // Additional content validation
  if (!content || content.trim() === "") {
    errors.push("File content is empty or contains only whitespace");
  }

  // Check for potential security issues
  if (content.includes("eval(") || content.includes("Function(")) {
    warnings.push(
      "Content contains potentially unsafe code execution patterns",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
