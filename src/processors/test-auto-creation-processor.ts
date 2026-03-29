/**
 * Test Auto-Creation Processor
 *
 * Automatically generates test files when new source files are created.
 * Supports multiple languages: TypeScript, JavaScript, Python, Go, Rust, Java, C#
 * Uses direct skill calls (no MCP overhead) for instant test generation.
 *
 * @version 1.1.0
 * @since 2026-02-15
 */

import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "../core/framework-logger.js";
import {
  detectProjectLanguage,
  getTestFilePath,
  LANGUAGE_CONFIGS,
} from "../utils/language-detector.js";
import { testAutoGenerationMonitor } from "../monitoring/test-auto-generation-monitor.js";

/**
 * Find the most recently modified TypeScript file in a directory
 * This is used as a fallback when filePath is not provided in the hook context
 * OPTIMIZED: Added caching to reduce expensive directory scans
 */

// Cache for recent file scans (30 second TTL)
const fileScanCache = new Map<string, { file: string | null; expires: number }>();
const SCAN_CACHE_TTL_MS = 30000; // 30 seconds

function findRecentlyModifiedTsFile(
  dir: string,
  maxAgeSeconds: number = 60, // Increased to 60 seconds
): string | null {
  // Check cache first
  const cacheKey = `${dir}:${maxAgeSeconds}`;
  const cached = fileScanCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return cached.file;
  }

  try {
    // Recursive walk to find all .ts files
    const files: string[] = [];

    function walkSync(dirPath: string) {
      try {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              // Skip node_modules, dist, etc.
              if (
                !item.startsWith(".") &&
                item !== "node_modules" &&
                item !== "dist"
              ) {
                walkSync(fullPath);
              }
            } else if (
              item.endsWith(".ts") &&
              !item.endsWith(".test.ts") &&
              !item.endsWith(".spec.ts")
            ) {
              files.push(fullPath);
            }
          } catch {
            // Skip files we can't stat
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }

    walkSync(dir);

    // Find most recently modified
    let mostRecent: { path: string; mtime: number } | null = null;

    for (const filePath of files) {
      try {
        const stats = fs.statSync(filePath);

        // Get relative path
        const relPath = path.relative(dir, filePath);

        if (!mostRecent || stats.mtimeMs > mostRecent.mtime) {
          mostRecent = { path: relPath, mtime: stats.mtimeMs };
        }
      } catch {
        // Skip files we can't stat
      }
    }

    const result = mostRecent?.path || null;
    
    // Cache the result
    fileScanCache.set(cacheKey, {
      file: result,
      expires: Date.now() + SCAN_CACHE_TTL_MS,
    });

    return result;
  } catch {
    return null;
  }
}

export const testAutoCreationProcessor = {
  name: "testAutoCreation",
  priority: 30,
  enabled: true,

  async execute(context: any): Promise<any> {
    const startTime = Date.now();

    try {
// Handle both direct context and context.data (from ProcessorManager)
      // ProcessorManager passes: { operation, data: { directory, filePath, ... }, preResults }
      const innerContext = context.data || context;

      const {
        tool,
        args,
        directory,
        filePath: contextFilePath,
        operation,
      } = innerContext;

      // Also check the outer context for backward compatibility
      const outerFilePath = context.filePath || contextFilePath;
      const outerDirectory = context.directory || directory;

      // SIMPLIFIED: Clear filePath resolution with explicit priority
      // Priority 1: args.filePath (explicit argument)
      // Priority 2: context.filePath (from ProcessorManager)
      // Priority 3: Scan for recent files (fallback)
      
      let filePath: string | undefined;
      let resolutionSource: string;

      // Priority 1: Explicit args.filePath
      if (args?.filePath) {
        filePath = args.filePath;
        resolutionSource = "args.filePath";
      }
      // Priority 2: Context filePath from ProcessorManager
      else if (outerFilePath) {
        filePath = outerFilePath;
        resolutionSource = "context.filePath";
      }
      // Priority 3: Fallback - scan for recent files
      else {
        const srcDir = path.join(process.cwd(), "src");
        const rootDir = process.cwd();

        // Try src first, then root
        let recentFile = findRecentlyModifiedTsFile(srcDir, 60);
        if (!recentFile) {
          recentFile = findRecentlyModifiedTsFile(rootDir, 60);
        }

        if (recentFile) {
          const isFromSrc = recentFile.startsWith(srcDir);
          filePath = isFromSrc
            ? path.relative(process.cwd(), recentFile)
            : recentFile;
          resolutionSource = "file-scan-fallback";
        } else {
          resolutionSource = "none-found";
        }
      }

      await frameworkLogger.log(
        "test-auto-creation",
        "filepath-resolution",
        "info",
        {
          message: `Resolved filePath: ${filePath || "UNDEFINED"} (source: ${resolutionSource})`,
        },
      );

      if (!filePath) {
        await frameworkLogger.log(
          "test-auto-creation",
          "skipped-no-filepath",
          "info",
          {
            message: `Skipped: no filePath found in context`,
            contextKeys: Object.keys(context),
          },
        );
        return {
          success: true,
          processorName: "testAutoCreation",
          duration: Date.now() - startTime,
        };
      }

      // Check if this looks like a write operation based on context
      const isWriteOperation =
        tool === "write" || tool === "edit" || operation === "tool_execution";
      if (!isWriteOperation) {
        await frameworkLogger.log(
          "test-auto-creation",
          "skipped-not-write",
          "info",
          { message: `Skipped: not a write operation`, tool, operation },
        );
        return {
          success: true,
          processorName: "testAutoCreation",
          duration: Date.now() - startTime,
        };
      }

      // Support multiple file types: .ts, .js, .py, .go, .rs, .java, .cs
      const supportedExtensions = [
        ".ts",
        ".js",
        ".tsx",
        ".jsx",
        ".py",
        ".go",
        ".rs",
        ".java",
        ".cs",
      ];
      const ext = path.extname(filePath);
      const isTestFile =
        filePath.endsWith(".test.ts") || filePath.endsWith(".spec.ts");

      if (!supportedExtensions.includes(ext) || isTestFile) {
        return {
          success: true,
          processorName: "testAutoCreation",
          duration: Date.now() - startTime,
        };
      }

      // Get language config for this extension
      const langConfig = LANGUAGE_CONFIGS.find((c) =>
        c.extensions.includes(ext),
      );

      // Check if test file already exists (use language-appropriate extension)
      const testFilePath = getTestFilePath(
        filePath,
        (langConfig?.language as any) || "TypeScript",
      );
      const fullTestPath = path.join(directory, testFilePath);

      if (fs.existsSync(fullTestPath)) {
        await frameworkLogger.log("test-auto-creation", "test-exists", "info", {
          message: `Test file already exists: ${testFilePath}`,
        });

        // Record skipped to monitor
        testAutoGenerationMonitor.recordEvent({
          type: "skipped",
          filePath,
          testFile: testFilePath,
          timestamp: Date.now(),
          reason: "Test file already exists",
        });

        return {
          success: true,
          processorName: "testAutoCreation",
          duration: Date.now() - startTime,
        };
      }

      // Read source file to analyze exports
      const fullSourcePath = path.resolve(directory, filePath);
      // Validate the resolved path stays within the expected directory to prevent path traversal
      const resolvedDirectory = path.resolve(directory);
      if (!fullSourcePath.startsWith(resolvedDirectory + path.sep) && fullSourcePath !== resolvedDirectory) {
        await frameworkLogger.log(
          "test-auto-creation",
          "skipped-path-traversal",
          "warning",
          {
            message: `Skipped: resolved path "${fullSourcePath}" escapes expected directory "${resolvedDirectory}"`,
            directory,
            filePath,
          },
        );
        return {
          success: false,
          processorName: "testAutoCreation",
          duration: Date.now() - startTime,
          error: `Path traversal detected: resolved path escapes expected directory`,
        };
      }
      if (!fs.existsSync(fullSourcePath)) {
        await frameworkLogger.log(
          "test-auto-creation",
          "skipped-source-not-found",
          "info",
          {
            message: `Skipped: source file not found`,
            fullSourcePath,
            directory,
            filePath,
          },
        );
        return {
          success: false,
          processorName: "testAutoCreation",
          duration: Date.now() - startTime,
        };
      }

      const sourceContent = fs.readFileSync(fullSourcePath, "utf8");

      // Extract exports to test
      const exports = extractExports(sourceContent);

      if (exports.length === 0) {
        // Record skipped to monitor
        testAutoGenerationMonitor.recordEvent({
          type: "skipped",
          filePath,
          testFile: null,
          timestamp: Date.now(),
          reason: "No exports found",
        });

        return {
          success: true,
          processorName: "testAutoCreation",
          duration: Date.now() - startTime,
        };
      }

      await frameworkLogger.log(
        "test-auto-creation",
        "generating-tests",
        "info",
        {
          message: `Auto-generating tests for ${filePath}`,
          exports: exports.map((e: { name: string }) => e.name),
          testFile: testFilePath,
        },
      );

      // Use direct test generation (no MCP - instant!)
      await createBasicTestStub(fullTestPath, filePath, exports);

      await frameworkLogger.log(
        "test-auto-creation",
        "test-stub-created",
        "success",
        {
          message: `Test stub created for ${filePath}`,
          testFile: testFilePath,
          exportsCount: exports.length,
        },
      );

      return {
        success: true,
        processorName: "testAutoCreation",
        duration: Date.now() - startTime,
        data: {
          testFile: testFilePath,
          exports: exports.map((e: { name: string }) => e.name),
        },
      };
    } catch (error) {
      await frameworkLogger.log("test-auto-creation", "error", "error", {
        message: `Test auto-creation failed: ${error instanceof Error ? error.message : String(error)}`,
      });

      // Record failure to monitor
      testAutoGenerationMonitor.recordEvent({
        type: "failed",
        filePath: "unknown",
        testFile: null,
        timestamp: Date.now(),
        reason: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        processorName: "testAutoCreation",
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * Extract exports from source file content with function signatures
 */
function extractExports(
  content: string,
): Array<{ name: string; type: string; params: string; returnType: string }> {
  const exports: Array<{
    name: string;
    type: string;
    params: string;
    returnType: string;
  }> = [];

  // Match exported functions with their full signatures
  const functionRegex =
    /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*(\w+))?/g;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    exports.push({
      name: match[1] || "anonymous",
      type: "function",
      params: match[2]?.trim() || "",
      returnType: match[3]?.trim() || "void",
    });
  }

  // Match exported classes
  const classMatches = content.match(/export\s+class\s+(\w+)/g);
  if (classMatches) {
    classMatches.forEach((m: string) => {
      const name = m.replace(/export\s+class\s+/, "").trim();
      exports.push({ name, type: "class", params: "", returnType: "" });
    });
  }

  // Match exported const/let arrow functions
  const arrowFunctionRegex =
    /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*(?::\s*(\w+))?\s*=>\s*/g;
  while ((match = arrowFunctionRegex.exec(content)) !== null) {
    exports.push({
      name: match[1] || "",
      type: "function",
      params: match[2]?.trim() || "",
      returnType: match[3]?.trim() || "void",
    });
  }

  // Match exported const/let with type annotations
  const constRegex = /export\s+const\s+(\w+)\s*:\s*([^;]+)/g;
  while ((match = constRegex.exec(content)) !== null) {
    exports.push({
      name: match[1] || "",
      type: "const",
      params: "",
      returnType: match[2]?.trim() || "",
    });
  }

  // Match default exports
  const defaultMatch = content.match(
    /export\s+default\s+(?:class|function)?\s*(\w+)/,
  );
  if (defaultMatch) {
    exports.push({
      name: defaultMatch[1] || "default",
      type: "default",
      params: "",
      returnType: "",
    });
  }

  return exports;
}

/**
 * Create a basic test stub as fallback
 */
async function createBasicTestStub(
  testFilePath: string,
  sourceFile: string,
  exports: Array<{
    name: string;
    type: string;
    params: string;
    returnType: string;
  }>,
): Promise<void> {
  const testDir = path.dirname(testFilePath);

  // Ensure test directory exists
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const relativeSourcePath = path.relative(
    testDir,
    sourceFile.replace(/\.ts$/, ""),
  );
  const importPath = relativeSourcePath.startsWith(".")
    ? relativeSourcePath
    : `./${relativeSourcePath}`;

  const testContent = generateTestStub(importPath, exports, sourceFile);

  fs.writeFileSync(testFilePath, testContent, "utf8");
}

/**
 * Generate test stub content with better test cases based on function signatures
 */
function generateTestStub(
  importPath: string,
  exports: Array<{
    name: string;
    type: string;
    params: string;
    returnType: string;
  }>,
  sourceFile: string,
): string {
  const imports = exports.map((e: { name: string }) => e.name).join(", ");

  const testCases = exports
    .map(
      (exp: {
        name: string;
        type: string;
        params: string;
        returnType: string;
      }) => {
        if (exp.type === "function") {
          // Generate sample arguments based on params
          const sampleArgs = generateSampleArgs(exp.params);
          const returnCheck = generateReturnCheck(exp.returnType);

          return `
  describe("${exp.name}", () => {
    it("should be defined", () => {
      expect(typeof ${exp.name}).toBe("function");
    });

    it("should handle basic case", async () => {
      const result = await ${exp.name}(${sampleArgs});
      ${returnCheck}
    });
  });`;
        } else if (exp.type === "class") {
          return `
  describe("${exp.name}", () => {
    it("should instantiate", () => {
      const instance = new ${exp.name}();
      expect(instance).toBeInstanceOf(${exp.name});
    });
  });`;
        } else {
          return `
  describe("${exp.name}", () => {
    it("should be defined", () => {
      expect(${exp.name}).toBeDefined();
    });
  });`;
        }
      },
    )
    .join("\n");

  return `/**
 * Auto-generated test file for ${sourceFile}
 * Generated by StringRay TestAutoCreationProcessor
 * @generated
 */

import { describe, it, expect } from "vitest";
import { ${imports} } from "${importPath}";

describe("${path.basename(sourceFile, ".ts")}", () => {${testCases}
});
`;
}

/**
 * Generate sample arguments based on function parameters
 */
function generateSampleArgs(params: string): string {
  if (!params.trim()) return "";

  const paramList = params.split(",").map((p) => p.trim());
  const sampleValues = paramList.map((param) => {
    // Extract parameter name (before type annotation if present)
    const parts = param.split(":");
    const paramName = (parts[0] || "").trim();
    const paramType = (parts[1] || "any").trim();

    // Generate sample value based on type
    if (paramType.includes("string")) return `"test"`;
    if (paramType.includes("number")) return "1";
    if (paramType.includes("boolean")) return "true";
    if (paramType.includes("array") || paramType.includes("[]")) return "[]";
    if (paramType.includes("object")) return "{}";
    if (paramType.includes("Promise")) return "Promise.resolve(undefined)";
    return "undefined";
  });

  return sampleValues.join(", ");
}

/**
 * Generate return value check based on return type
 */
function generateReturnCheck(returnType: string): string {
  if (!returnType || returnType === "void" || returnType === "undefined") {
    return "expect(result).toBeUndefined();";
  }
  if (returnType.includes("Promise")) {
    return "expect(result).toBeDefined();";
  }
  if (returnType.includes("number")) {
    return "expect(typeof result).toBe('number');";
  }
  if (returnType.includes("string")) {
    return "expect(typeof result).toBe('string');";
  }
  if (returnType.includes("boolean")) {
    return "expect(typeof result).toBe('boolean');";
  }
  if (returnType.includes("array") || returnType.includes("[]")) {
    return "expect(Array.isArray(result)).toBe(true);";
  }
  return "expect(result).toBeDefined();";
}

export default testAutoCreationProcessor;
