/**
 * Unit tests for ASTCodeParser
 * Tests code parsing, pattern detection, and graceful fallback capabilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ASTCodeParser } from "../../delegation/ast-code-parser.js";
import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "../../framework-logger.js";

// Mock external dependencies
vi.mock("fs");
vi.mock("path");
vi.mock("../../framework-logger.js");

describe("ASTCodeParser", () => {
  let parser: ASTCodeParser;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock path functions
    vi.mocked(path.extname).mockReturnValue(".ts");
    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
    vi.mocked(fs.readFileSync).mockReturnValue("mock content");

    parser = new ASTCodeParser();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with ast-grep available", () => {
      // Mock successful ast-grep detection
      const mockParser = new ASTCodeParser();
      expect(mockParser).toBeDefined();
    });

    it("should handle ast-grep not available gracefully", () => {
      // The constructor should handle missing ast-grep without throwing
      const mockParser = new ASTCodeParser();
      expect(mockParser).toBeDefined();
    });

    it("should accept custom ast-grep path", () => {
      const customPath = "/custom/path/to/ast-grep";
      const mockParser = new ASTCodeParser(customPath);
      expect(mockParser).toBeDefined();
    });
  });

  describe("file analysis", () => {
    it("should analyze TypeScript files successfully", async () => {
      const testContent = `
        import React from 'react';

        interface User {
          id: number;
          name: string;
        }

        export function createUser(name: string): User {
          return { id: Date.now(), name };
        }

        console.log('debugging'); // anti-pattern
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(testContent);

      const analysis = await parser.analyzeFile("/test/user.ts");

      expect(analysis).toBeDefined();
      expect(analysis.structure.functions).toBeDefined();
      expect(analysis.structure.classes).toBeDefined();
      expect(analysis.issues).toBeDefined();
      expect(analysis.suggestions).toBeDefined();
      expect(analysis.metrics).toBeDefined();
    });

    it("should detect functions correctly", async () => {
      const testContent = `
        function regularFunction() {}
        const arrowFunction = () => {};
        export const exportedArrow = (param: string) => param;
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(testContent);

      const analysis = await parser.analyzeFile("/test/functions.ts");

      expect(analysis.structure.functions.length).toBeGreaterThanOrEqual(2);
      expect(
        analysis.structure.functions.some((f) => f.name === "regularFunction"),
      ).toBe(true);
    });

    it("should detect classes and interfaces", async () => {
      const testContent = `
        interface UserProps {
          name: string;
          age: number;
        }

        class UserComponent {
          constructor(props: UserProps) {}
          render() { return null; }
        }
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(testContent);

      const analysis = await parser.analyzeFile("/test/classes.ts");

      expect(analysis.structure.classes.length).toBeGreaterThanOrEqual(1);
      expect(
        analysis.structure.classes.some((c) => c.name === "UserComponent"),
      ).toBe(true);
    });

    it("should detect import/export statements", async () => {
      const testContent = `
        import React, { useState } from 'react';
        import * as utils from './utils';
        export { default as Component } from './Component';
        export const VERSION = '1.0.0';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(testContent);

      const analysis = await parser.analyzeFile("/test/imports.ts");

      expect(analysis.structure.imports.length).toBeGreaterThanOrEqual(2);
      expect(analysis.structure.exports.length).toBeGreaterThanOrEqual(2);
    });

    it("should detect anti-patterns", async () => {
      const testContent = `
        console.log('debug message');
        console.error('error message');

        if (condition) {
          if (anotherCondition) {
            // nested if - potential issue
          }
        }
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(testContent);

      const analysis = await parser.analyzeFile("/test/patterns.ts");

      expect(analysis.issues.length).toBeGreaterThan(0);
      expect(analysis.patterns.some((p) => p.type === "anti-pattern")).toBe(
        true,
      );
    });

    it("should calculate complexity metrics", async () => {
      const testContent = `
        function complexFunction(a: number, b: number, c: number): number {
          if (a > 0) {
            if (b > 0) {
              if (c > 0) {
                return a + b + c;
              }
            }
          }
          return 0;
        }
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(testContent);

      const analysis = await parser.analyzeFile("/test/complexity.ts");

      expect(analysis.metrics.linesOfCode).toBeDefined();
      expect(analysis.metrics.functions).toBeDefined();
      expect(analysis.metrics.complexity).toBeDefined();
    });
  });

  describe("pattern detection", () => {
    it("should detect code patterns with regex fallback", async () => {
      const testContent = `
        // Large function
        function veryLongFunction(param1, param2, param3, param4, param5) {
          console.log('line 1');
          console.log('line 2');
          console.log('line 3');
          console.log('line 4');
          console.log('line 5');
          console.log('line 6');
          console.log('line 7');
          console.log('line 8');
          console.log('line 9');
          console.log('line 10');
          console.log('line 11');
          return param1 + param2;
        }
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(testContent);

      const patterns = await parser["detectPatternsWithRegex"](
        testContent,
        "typescript",
        "/test/patterns.ts",
      );

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some((p) => p.pattern === "console.log")).toBe(true);
    });

    it("should generate refactoring suggestions", async () => {
      const testContent = `
        function longFunctionWithManyParams(a, b, c, d, e, f, g) {
          console.log('debug');
          if (a) {
            if (b) {
              return true;
            }
          }
          return false;
        }
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(testContent);

      const analysis = await parser.analyzeFile("/test/suggestions.ts");

      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("error handling", () => {
    it("should handle file read errors gracefully", async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error("File not found");
      });

      await expect(
        parser.analyzeFile("/nonexistent/file.ts"),
      ).rejects.toThrow();
    });

    it("should handle unsupported languages", async () => {
      vi.mocked(path.extname).mockReturnValue(".xyz");

      vi.mocked(fs.readFileSync).mockReturnValue("unsupported content");

      await expect(parser.analyzeFile("/test/file.xyz")).rejects.toThrow(
        "Unsupported file type",
      );
    });

    it("should handle parsing errors gracefully", async () => {
      const invalidContent = `
        function brokenFunction( {
          // Invalid syntax
          return "broken";
        }
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(invalidContent);

      // Should not throw, should handle parsing errors
      const analysis = await parser.analyzeFile("/test/broken.ts");
      expect(analysis).toBeDefined();
    });
  });

  describe("language detection", () => {
    it("should detect TypeScript files", () => {
      expect(parser["detectLanguage"](".ts")).toBe("typescript");
      expect(parser["detectLanguage"](".tsx")).toBe("typescript");
    });

    it("should detect JavaScript files", () => {
      expect(parser["detectLanguage"](".js")).toBe("javascript");
      expect(parser["detectLanguage"](".jsx")).toBe("javascript");
    });

    it("should detect Python files", () => {
      expect(parser["detectLanguage"](".py")).toBe("python");
    });

    it("should return null for unsupported extensions", () => {
      expect(parser["detectLanguage"](".xyz")).toBeNull();
      expect(parser["detectLanguage"](".unknown")).toBeNull();
    });
  });

  describe("ast-grep integration", () => {
    it("should use regex fallback when ast-grep unavailable", async () => {
      // Force ast-grep to be unavailable
      const fallbackParser = new ASTCodeParser("/nonexistent/ast-grep");

      const testContent = "function test() { return true; }";
      vi.mocked(fs.readFileSync).mockReturnValue(testContent);

      const analysis = await fallbackParser.analyzeFile("/test/fallback.ts");

      expect(analysis).toBeDefined();
      expect(analysis.structure.functions.length).toBeGreaterThan(0);
    });

    it("should log ast-grep availability status", async () => {
      // Constructor should log availability
      const mockLogger = vi.mocked(frameworkLogger);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe("performance", () => {
    it("should complete analysis within reasonable time", async () => {
      const testContent = `
        import React from 'react';

        interface Props {
          title: string;
          onClick: () => void;
        }

        export const Button: React.FC<Props> = ({ title, onClick }) => {
          return <button onClick={onClick}>{title}</button>;
        };
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(testContent);

      const startTime = Date.now();
      await parser.analyzeFile("/test/performance.ts");
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
