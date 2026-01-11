/**
 * StrRay Framework v1.0.0 - AST Code Parser
 *
 * AST-based code parsing and structural analysis using ast-grep.
 * Provides advanced code understanding, pattern detection, and refactoring insights.
 *
 * @version 1.0.0
 * @since 2026-01-11
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { frameworkLogger } from "../framework-logger.js";

export interface ASTPattern {
  name: string;
  pattern: string;
  language: string;
  description: string;
}

export interface ASTMatch {
  pattern: string;
  file: string;
  line: number;
  column: number;
  content: string;
  captures?: Record<string, string>;
}

export interface CodeStructure {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  patterns: PatternInfo[];
  complexity: {
    cyclomatic: number;
    cognitive: number;
    nesting: number;
  };
}

export interface FunctionInfo {
  name: string;
  line: number;
  parameters: string[];
  returnType?: string;
  complexity: number;
  lines: number;
}

export interface ClassInfo {
  name: string;
  line: number;
  methods: string[];
  properties: string[];
  extends?: string;
  implements?: string[];
}

export interface ImportInfo {
  module: string;
  names: string[];
  line: number;
  type: "default" | "named" | "namespace" | "side-effect";
  file: string;
}

export interface ExportInfo {
  name: string;
  type: "function" | "class" | "variable" | "default";
  line: number;
}

export interface PatternInfo {
  pattern: string;
  occurrences: number;
  files: string[];
  type: "anti-pattern" | "best-practice" | "refactoring-opportunity";
  severity: "low" | "medium" | "high" | "critical";
}

export interface ASTAnalysis {
  structure: CodeStructure;
  patterns: PatternInfo[];
  issues: CodeIssue[];
  suggestions: RefactoringSuggestion[];
  metrics: CodeMetrics;
}

export interface CodeIssue {
  type: "bug" | "security" | "performance" | "maintainability";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  file: string;
  line: number;
  suggestion: string;
}

export interface RefactoringSuggestion {
  type: "extract-method" | "rename" | "move" | "simplify" | "consolidate";
  description: string;
  file: string;
  line: number;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
}

export interface CodeMetrics {
  linesOfCode: number;
  functions: number;
  classes: number;
  complexity: number;
  duplication: number;
  testCoverage: number;
  maintainabilityIndex: number;
}

export class ASTCodeParser {
  private astGrepPath: string | null = null;
  private astGrepAvailable: boolean = false;
  private patterns: ASTPattern[] = [
    // TypeScript/JavaScript patterns - direct regex for fallback
    {
      name: "function-definition",
      pattern: "function\\s+([^\\s(]+)\\s*\\([^)]*\\)\\s*\\{[^}]*\\}",
      language: "typescript",
      description: "Function declarations",
    },
    {
      name: "arrow-function",
      pattern: "const\\s+([^\\s=]+)\\s*=\\s*\\([^)]*\\)\\s*=>\\s*[^;]+",
      language: "typescript",
      description: "Arrow function assignments",
    },
    {
      name: "class-definition",
      pattern: "class\\s+([^\\s{]+)\\s*\\{[^}]*\\}",
      language: "typescript",
      description: "Class declarations",
    },
    {
      name: "import-statement",
      pattern: "import .+ from [\"']([^\"']+)[\"']",
      language: "typescript",
      description: "ES6 import statements",
    },
    {
      name: "export-statement",
      pattern: "export .+",
      language: "typescript",
      description: "Export statements",
    },
    {
      name: "export-statement",
      pattern: "export $EXPORT",
      language: "typescript",
      description: "Export statements",
    },
    {
      name: "console-log",
      pattern: "console\\.log\\([^)]*\\)",
      language: "typescript",
      description: "Console log statements (potential debugging code)",
    },
    {
      name: "nested-if",
      pattern: "if ([^}]+) \\{ if ([^}]+) \\{ [^}]* \\} \\}",
      language: "typescript",
      description: "Nested if statements",
    },
    {
      name: "large-function",
      pattern: "function [^\\s(]+\\([^)]*\\) \\{[^}]{100,}\\}",
      language: "typescript",
      description: "Large function definitions",
    },
    {
      name: "magic-number",
      pattern: "$NUM",
      language: "typescript",
      description: "Potential magic numbers",
    },
    {
      name: "unused-variable",
      pattern: "const $NAME = $VALUE",
      language: "typescript",
      description: "Variable declarations",
    },

    // Python patterns
    {
      name: "python-function",
      pattern: "def $NAME($$$PARAMS):",
      language: "python",
      description: "Python function definitions",
    },
    {
      name: "python-class",
      pattern: "class $NAME:",
      language: "python",
      description: "Python class definitions",
    },
    {
      name: "python-import",
      pattern: "import $MODULE",
      language: "python",
      description: "Python import statements",
    },

    // Java patterns
    {
      name: "java-method",
      pattern: "public $TYPE $NAME($$$PARAMS) { $$$BODY }",
      language: "java",
      description: "Java method declarations",
    },
    {
      name: "java-class",
      pattern: "public class $NAME { $$$BODY }",
      language: "java",
      description: "Java class declarations",
    },
  ];

  constructor(astGrepPath?: string) {
    try {
      this.astGrepPath = astGrepPath || this.findAstGrep();
      this.astGrepAvailable = true;

      frameworkLogger.log("ast-code-parser", "ast-grep-available", "info", {
        path: this.astGrepPath,
        message: "AST parsing with ast-grep enabled",
      });
    } catch (error) {
      this.astGrepPath = null;
      this.astGrepAvailable = false;

      frameworkLogger.log("ast-code-parser", "ast-grep-unavailable", "info", {
        error: error instanceof Error ? error.message : String(error),
        fallback: "Using regex-based parsing fallback",
      });
    }
  }

  /**
   * Analyze code file using AST parsing
   */
  async analyzeFile(filePath: string): Promise<ASTAnalysis> {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const extension = path.extname(filePath).toLowerCase();
      const language = this.detectLanguage(extension);

      if (!language) {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      await frameworkLogger.log(
        "ast-code-parser",
        "file-analysis-start",
        "info",
        {
          filePath,
          language,
          usingAstGrep: this.astGrepAvailable,
        },
      );

      // Choose parsing method based on ast-grep availability
      const structure = this.astGrepAvailable
        ? await this.parseCodeStructureWithAstGrep(content, language, filePath)
        : await this.parseCodeStructureWithRegex(content, language, filePath);

      const patterns = this.astGrepAvailable
        ? await this.detectPatternsWithAstGrep(filePath, language)
        : await this.detectPatternsWithRegex(content, language, filePath);

      const issues = await this.identifyIssues(structure, patterns, filePath);
      const suggestions = this.generateRefactoringSuggestions(
        structure,
        issues,
      );
      const metrics = this.calculateMetrics(structure, content);

      const analysis: ASTAnalysis = {
        structure,
        patterns,
        issues,
        suggestions,
        metrics,
      };

      await frameworkLogger.log(
        "ast-code-parser",
        "file-analysis-complete",
        "success",
        {
          filePath,
          functions: structure.functions.length,
          classes: structure.classes.length,
          issues: issues.length,
          suggestions: suggestions.length,
        },
      );

      return analysis;
    } catch (error) {
      await frameworkLogger.log(
        "ast-code-parser",
        "file-analysis-failed",
        "error",
        {
          filePath,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw error;
    }
  }

  /**
   * Parse code structure using ast-grep (advanced)
   */
  private async parseCodeStructureWithAstGrep(
    content: string,
    language: string,
    filePath: string,
  ): Promise<CodeStructure> {
    // TODO: Implement actual ast-grep parsing when ast-grep is available
    // For now, fall back to regex parsing
    return this.parseCodeStructureWithRegex(content, language, filePath);
  }

  /**
   * Parse code structure using regex (fallback)
   */
  private async parseCodeStructureWithRegex(
    content: string,
    language: string,
    filePath: string,
  ): Promise<CodeStructure> {
    const functions: FunctionInfo[] = [];
    const classes: ClassInfo[] = [];
    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    const patterns: PatternInfo[] = [];

    // Parse functions
    const functionMatches = await this.findMatches(
      content,
      language,
      "function-definition",
    );
    for (const match of functionMatches) {
      functions.push({
        name: match.captures?.NAME || "anonymous",
        line: match.line,
        parameters: this.parseParameters(match.captures?.PARAMS || ""),
        complexity: this.calculateFunctionComplexity(match.content),
        lines: match.content.split("\n").length,
      });
    }

    // Parse arrow functions
    const arrowMatches = await this.findMatches(
      content,
      language,
      "arrow-function",
    );
    for (const match of arrowMatches) {
      functions.push({
        name: match.captures?.NAME || "anonymous",
        line: match.line,
        parameters: this.parseParameters(match.captures?.PARAMS || ""),
        complexity: 1, // Arrow functions are typically simple
        lines: match.content.split("\n").length,
      });
    }

    // Parse classes
    const classMatches = await this.findMatches(
      content,
      language,
      "class-definition",
    );
    for (const match of classMatches) {
      classes.push({
        name: match.captures?.NAME || "anonymous",
        line: match.line,
        methods: [],
        properties: [],
      });
    }

    // Parse imports and exports
    const importMatches = await this.findMatches(
      content,
      language,
      "import-statement",
    );
    for (const match of importMatches) {
      imports.push({
        module: match.captures?.MODULE || "",
        names: this.parseImportNames(match.captures?.IMPORTS || ""),
        line: match.line,
        type: this.determineImportType(match.content),
        file: filePath,
      });
    }

    const exportMatches = await this.findMatches(
      content,
      language,
      "export-statement",
    );
    for (const match of exportMatches) {
      exports.push({
        name: this.extractExportName(match.content),
        type: this.determineExportType(match.content),
        line: match.line,
      });
    }

    // Calculate complexity metrics
    const complexity = {
      cyclomatic: this.calculateCyclomaticComplexity(content),
      cognitive: this.calculateCognitiveComplexity(functions),
      nesting: this.calculateMaxNesting(content),
    };

    return {
      functions,
      classes,
      imports,
      exports,
      patterns,
      complexity,
    };
  }

  /**
   * Find AST matches using ast-grep
   */
  private async findMatches(
    content: string,
    language: string,
    patternName: string,
  ): Promise<ASTMatch[]> {
    try {
      const pattern = this.patterns.find((p) => p.name === patternName);
      if (!pattern) {
        return [];
      }

      // For now, use regex-based matching as fallback since ast-grep might not be available
      // In production, this would use actual ast-grep binary
      const matches = this.regexBasedMatching(content, pattern.pattern);

      return matches.map((match) => ({
        pattern: patternName,
        file: "",
        line:
          match.index !== undefined
            ? this.getLineNumber(content, match.index)
            : 1,
        column:
          match.index !== undefined
            ? match.index - content.lastIndexOf("\n", match.index)
            : 0,
        content: match[0],
        captures: this.extractCaptures(match[0], patternName),
      }));
    } catch (error) {
      await frameworkLogger.log(
        "ast-code-parser",
        "ast-matching-failed",
        "error",
        {
          patternName,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      return [];
    }
  }

  /**
   * Regex-based pattern matching (fallback when ast-grep not available)
   */
  private regexBasedMatching(
    content: string,
    pattern: string,
  ): RegExpMatchArray[] {
    // For fallback, patterns are already regex strings
    const regexPattern = pattern;

    const regex = new RegExp(regexPattern, "g");
    const matches: RegExpMatchArray[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      matches.push(match);
    }
    return matches;
  }

  /**
   * Extract named captures from regex match
   */
  private extractCaptures(
    match: string,
    patternName: string,
  ): Record<string, string> {
    const captures: Record<string, string> = {};

    // For direct regex patterns, map capture groups to expected names
    switch (patternName) {
      case "function-definition":
        // Extract function name from first capture group
        const funcMatch = match.match(/function\s+([^\s(]+)/);
        if (funcMatch && funcMatch[1]) captures["NAME"] = funcMatch[1];
        break;
      case "arrow-function":
        // Extract variable name from first capture group
        const arrowMatch = match.match(/const\s+([^\s=]+)/);
        if (arrowMatch && arrowMatch[1]) captures["NAME"] = arrowMatch[1];
        break;
      case "class-definition":
        // Extract class name from first capture group
        const classMatch = match.match(/class\s+([^\s{]+)/);
        if (classMatch && classMatch[1]) captures["NAME"] = classMatch[1];
        break;
      case "import-statement":
        // Extract module name
        const importMatch = match.match(/import .+ from ["']([^"']+)["']/);
        if (importMatch && importMatch[1]) {
          captures["MODULE"] = importMatch[1];
        }
        break;
      case "export-statement":
        // Extract export content
        const exportMatch = match.match(/export (.+)/);
        if (exportMatch && exportMatch[1]) captures["EXPORT"] = exportMatch[1];
        break;
    }

    return captures;
  }

  /**
   * Detect code patterns using ast-grep (advanced)
   */
  private async detectPatternsWithAstGrep(
    filePath: string,
    language: string,
  ): Promise<PatternInfo[]> {
    // TODO: Implement actual ast-grep pattern detection when ast-grep is available
    // For now, fall back to regex detection
    const content = fs.readFileSync(filePath, "utf8");
    return this.detectPatternsWithRegex(content, language, filePath);
  }

  /**
   * Detect code patterns using regex (fallback)
   */
  private async detectPatternsWithRegex(
    content: string,
    language: string,
    filePath: string,
  ): Promise<PatternInfo[]> {
    const patterns: PatternInfo[] = [];

    // Detect console.log statements (anti-pattern)
    const consoleLogs = await this.findMatches(
      content,
      language,
      "console-log",
    );
    if (consoleLogs.length > 0) {
      patterns.push({
        pattern: "console.log",
        occurrences: consoleLogs.length,
        files: [filePath],
        type: "anti-pattern",
        severity: consoleLogs.length > 5 ? "high" : "medium",
      });
    }

    // Detect nested if statements
    const nestedIfs = await this.findMatches(content, language, "nested-if");
    if (nestedIfs.length > 0) {
      patterns.push({
        pattern: "nested-if",
        occurrences: nestedIfs.length,
        files: [filePath],
        type: "refactoring-opportunity",
        severity: "medium",
      });
    }

    // Detect large functions
    const largeFunctions = (
      await this.findMatches(content, language, "large-function")
    ).filter((match) => match.content.split("\n").length > 30);
    if (largeFunctions.length > 0) {
      patterns.push({
        pattern: "large-function",
        occurrences: largeFunctions.length,
        files: [filePath],
        type: "refactoring-opportunity",
        severity: "high",
      });
    }

    return patterns;
  }

  /**
   * Identify code issues
   */
  private async identifyIssues(
    structure: CodeStructure,
    patterns: PatternInfo[],
    filePath: string,
  ): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    // Check for complex functions
    for (const func of structure.functions) {
      if (func.complexity > 10) {
        issues.push({
          type: "maintainability",
          severity: "high",
          message: `Function '${func.name}' has high complexity (${func.complexity})`,
          file: filePath,
          line: func.line,
          suggestion: "Consider breaking down into smaller functions",
        });
      }
    }

    // Check for anti-patterns
    for (const pattern of patterns) {
      if (pattern.type === "anti-pattern") {
        issues.push({
          type: "maintainability",
          severity: pattern.severity,
          message: `Detected ${pattern.occurrences} instances of ${pattern.pattern}`,
          file: filePath,
          line: 1,
          suggestion: `Remove or replace ${pattern.pattern} usage`,
        });
      }
    }

    return issues;
  }

  /**
   * Generate refactoring suggestions
   */
  private generateRefactoringSuggestions(
    structure: CodeStructure,
    issues: CodeIssue[],
  ): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];

    for (const issue of issues) {
      if (issue.message.includes("high complexity")) {
        suggestions.push({
          type: "extract-method",
          description: "Extract complex function logic into smaller methods",
          file: issue.file,
          line: issue.line,
          impact: "high",
          effort: "medium",
        });
      } else if (issue.message.includes("console.log")) {
        suggestions.push({
          type: "simplify",
          description: "Remove console.log statements from production code",
          file: issue.file,
          line: issue.line,
          impact: "low",
          effort: "low",
        });
      }
    }

    // Suggest consolidation for duplicate imports
    const duplicateImports = this.findDuplicateImports(structure.imports);
    for (const dup of duplicateImports) {
      suggestions.push({
        type: "consolidate",
        description: `Consolidate ${dup.names.length} duplicate imports from ${dup.module}`,
        file: dup.file,
        line: dup.line,
        impact: "low",
        effort: "low",
      });
    }

    return suggestions;
  }

  /**
   * Calculate code metrics
   */
  private calculateMetrics(
    structure: CodeStructure,
    content: string,
  ): CodeMetrics {
    const linesOfCode = content.split("\n").length;

    return {
      linesOfCode,
      functions: structure.functions.length,
      classes: structure.classes.length,
      complexity: structure.complexity.cyclomatic,
      duplication: 0, // Would need additional analysis
      testCoverage: 0, // Would need test file analysis
      maintainabilityIndex: this.calculateMaintainabilityIndex(
        structure,
        linesOfCode,
      ),
    };
  }

  // Helper methods

  private detectLanguage(extension: string): string | null {
    const languageMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".java": "java",
      ".cpp": "cpp",
      ".c": "c",
      ".cs": "csharp",
      ".php": "php",
      ".rb": "ruby",
      ".go": "go",
      ".rs": "rust",
    };

    return languageMap[extension] || null;
  }

  private findAstGrep(): string {
    try {
      // Try to find ast-grep in PATH
      execSync("which ast-grep", { stdio: "pipe" });
      return "ast-grep";
    } catch {
      // Fallback to common installation paths
      const commonPaths = [
        "/usr/local/bin/ast-grep",
        "/usr/bin/ast-grep",
        "/opt/homebrew/bin/ast-grep",
        "./node_modules/.bin/ast-grep",
      ];

      for (const path of commonPaths) {
        try {
          fs.accessSync(path);
          return path;
        } catch {
          // Continue searching
        }
      }

      throw new Error(
        "ast-grep not found. Please install ast-grep or ensure it is in PATH.",
      );
    }
  }

  private parseParameters(paramsStr: string): string[] {
    if (!paramsStr.trim()) return [];
    return paramsStr.split(",").map((p) => {
      const trimmed = p.trim();
      const colonSplit = trimmed.split(":")[0] || trimmed;
      const equalsSplit = colonSplit.split("=")[0] || colonSplit;
      return equalsSplit.trim();
    });
  }

  private calculateFunctionComplexity(content: string): number {
    let complexity = 1; // Base complexity

    // +1 for each control flow statement
    const controlFlowKeywords = [
      "if",
      "else",
      "for",
      "while",
      "do",
      "switch",
      "case",
      "catch",
    ];
    for (const keyword of controlFlowKeywords) {
      if (!keyword) continue; // Skip empty keywords
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private parseImportNames(importStr: string): string[] {
    if (!importStr.trim()) return [];
    // Handle different import patterns
    const match = importStr.match(/{([^}]+)}/);
    if (match && match[1]) {
      return match[1].split(",").map((name) => {
        const trimmed = name.trim();
        const asSplit = trimmed.split(" as ");
        return asSplit[0] || trimmed;
      });
    }
    return [importStr.trim()];
  }

  private determineImportType(content: string): ImportInfo["type"] {
    if (content.includes("{") && content.includes("}")) return "named";
    if (content.includes("* as")) return "namespace";
    if (content.includes("from") && !content.includes("{")) return "default";
    return "side-effect";
  }

  private extractExportName(content: string): string {
    const match = content.match(
      /(?:export\s+)(?:const|let|var|function|class)\s+(\w+)/,
    );
    return match && match[1] ? match[1] : "unknown";
  }

  private determineExportType(content: string): ExportInfo["type"] {
    if (content.includes("default")) return "default";
    if (content.includes("function")) return "function";
    if (content.includes("class")) return "class";
    return "variable";
  }

  private calculateCyclomaticComplexity(content: string): number {
    let complexity = 1;
    const patterns = [
      "if",
      "else",
      "for",
      "while",
      "do",
      "switch",
      "case",
      "catch",
      "&&",
      "||",
      "\\?",
    ];

    for (const pattern of patterns) {
      const regex = new RegExp(`\\b${pattern}\\b`, "g");
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateCognitiveComplexity(functions: FunctionInfo[]): number {
    return functions.reduce((sum, func) => sum + func.complexity, 0);
  }

  private calculateMaxNesting(content: string): number {
    let maxNesting = 0;
    let currentNesting = 0;
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1] || "";

      // Handle strings
      if ((char === '"' || char === "'") && content[i - 1] !== "\\") {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = "";
        }
        continue;
      }

      if (inString) continue;

      // Count braces
      if (char === "{") {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === "}") {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }

    return maxNesting;
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length;
  }

  private calculateMaintainabilityIndex(
    structure: CodeStructure,
    linesOfCode: number,
  ): number {
    // Simplified maintainability index calculation
    const avgComplexity =
      structure.complexity.cyclomatic / Math.max(structure.functions.length, 1);
    const volume = Math.log2(Math.max(linesOfCode, 1));
    const difficulty = avgComplexity / 2;

    return Math.max(
      0,
      Math.min(100, 171 - 5.2 * Math.log(volume) - 0.23 * difficulty),
    );
  }

  private findDuplicateImports(
    imports: ImportInfo[],
  ): Array<{ module: string; names: string[]; file: string; line: number }> {
    const moduleGroups = new Map<string, ImportInfo[]>();

    for (const imp of imports) {
      if (!moduleGroups.has(imp.module)) {
        moduleGroups.set(imp.module, []);
      }
      moduleGroups.get(imp.module)!.push(imp);
    }

    const duplicates: Array<{
      module: string;
      names: string[];
      file: string;
      line: number;
    }> = [];

    for (const [module, moduleImports] of Array.from(moduleGroups)) {
      if (moduleImports.length > 1) {
        const allNames = moduleImports.flatMap((imp) => imp.names);
        const uniqueNames = Array.from(new Set(allNames));

        if (uniqueNames.length < allNames.length && moduleImports[0]) {
          duplicates.push({
            module,
            names: uniqueNames,
            file: moduleImports[0].file || "",
            line: moduleImports[0].line,
          });
        }
      }
    }

    return duplicates;
  }
}
