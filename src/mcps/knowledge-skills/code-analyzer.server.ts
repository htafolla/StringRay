/**
 * Code Analyzer MCP Server - CONSOLIDATED
 *
 * Comprehensive code analysis combining:
 * - Original code-analyzer (metrics, complexity, smells)
 * - explore (file search, patterns, dependencies)
 * - analyzer (pattern detection)
 *
 * This is the SINGLE source for code-level analysis.
 * Use project-analysis for project-level (structure, health).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { frameworkLogger } from "../../core/framework-logger.js";
import { createGracefulShutdown } from "../../utils/shutdown-handler.js";

interface Tool {
  name: string;
  description: string;
  inputSchema: object;
}

class CodeAnalyzerServer {
  private server: Server;
  private tools: Tool[] = [
    // ===== CODE ANALYSIS =====
    {
      name: "analyze_code",
      description:
        "Perform comprehensive static analysis on source code files",
      inputSchema: {
        type: "object",
        properties: {
          files: {
            type: "array",
            items: { type: "string" },
            description: "Files or directories to analyze",
          },
          language: {
            type: "string",
            description: "Programming language (typescript, javascript, python, etc.)",
          },
        },
        required: ["files"],
      },
    },
    {
      name: "calculate_complexity",
      description:
        "Calculate cyclomatic complexity and other code metrics",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Source code to analyze",
          },
          language: {
            type: "string",
            description: "Programming language",
          },
        },
        required: ["code"],
      },
    },
    {
      name: "detect_code_smells",
      description:
        "Detect code smells, anti-patterns, and potential issues",
      inputSchema: {
        type: "object",
        properties: {
          files: {
            type: "array",
            items: { type: "string" },
            description: "Files to analyze",
          },
          thresholds: {
            type: "object",
            description: "Detection thresholds",
            properties: {
              maxFunctionLength: { type: "number" },
              maxNestingDepth: { type: "number" },
              maxParameters: { type: "number" },
            },
          },
        },
        required: ["files"],
      },
    },
    {
      name: "extract_metrics",
      description:
        "Extract detailed code metrics (lines, functions, classes, etc.)",
      inputSchema: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "File or directory to analyze",
          },
          includeHistory: {
            type: "boolean",
            default: false,
            description: "Include historical metrics if available",
          },
        },
        required: ["filePath"],
      },
    },
    // ===== EXPLORE FEATURES =====
    {
      name: "explore_codebase",
      description:
        "Explore codebase structure and find files matching patterns. Fast file search.",
      inputSchema: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["full", "directory", "file"],
            description: "Scope of exploration",
          },
          patterns: {
            type: "array",
            items: { type: "string" },
            description: "Glob patterns to match (e.g., '**/*.ts', 'src/**/*.js')",
          },
          basePath: {
            type: "string",
            description: "Base directory to search from (defaults to current directory)",
          },
          maxResults: {
            type: "number",
            default: 50,
            description: "Maximum number of files to return",
          },
        },
        required: ["scope", "patterns"],
      },
    },
    {
      name: "find_patterns",
      description:
        "Find code patterns, functions, classes, or specific text across the codebase",
      inputSchema: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "Regex or text pattern to search for",
          },
          fileTypes: {
            type: "array",
            items: { type: "string" },
            description: "File extensions to search (e.g., ['.ts', '.js'])",
          },
          basePath: {
            type: "string",
            description: "Base directory to search from",
          },
          maxMatches: {
            type: "number",
            default: 100,
            description: "Maximum number of matches to return",
          },
        },
        required: ["pattern"],
      },
    },
    {
      name: "find_function",
      description:
        "Locate specific function definitions across the codebase",
      inputSchema: {
        type: "object",
        properties: {
          functionName: {
            type: "string",
            description: "Name of the function to find",
          },
          fileTypes: {
            type: "array",
            items: { type: "string" },
            description: "File types to search",
          },
        },
        required: ["functionName"],
      },
    },
    {
      name: "get_file_structure",
      description:
        "Get directory structure and file tree for a given path",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Directory path to explore",
          },
          maxDepth: {
            type: "number",
            default: 3,
            description: "Maximum depth to traverse",
          },
          includeFiles: {
            type: "boolean",
            default: true,
            description: "Include files in the output",
          },
        },
        required: ["path"],
      },
    },
    // ===== DEPENDENCY ANALYSIS =====
    {
      name: "analyze_dependencies",
      description:
        "Analyze import/export dependencies and generate dependency graph",
      inputSchema: {
        type: "object",
        properties: {
          rootDir: {
            type: "string",
            description: "Root directory to analyze",
          },
          maxDepth: {
            type: "number",
            default: 3,
            description: "Maximum depth for dependency traversal",
          },
        },
        required: ["rootDir"],
      },
    },
    // ===== DUPLICATE DETECTION =====
    {
      name: "find_duplicates",
      description:
        "Find duplicate or similar code patterns in the codebase",
      inputSchema: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Directory to search",
          },
          minLength: {
            type: "number",
            default: 10,
            description: "Minimum line count for duplicate detection",
          },
        },
        required: ["directory"],
      },
    },
  ];

  constructor() {
    this.server = new Server(
      { name: "code-analyzer", version: "1.15.11" },
      { capabilities: { tools: {} } },
    );

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        switch (name) {
          case "analyze_code": return this.handleAnalyzeCode(args);
          case "calculate_complexity": return this.handleCalculateComplexity(args);
          case "detect_code_smells": return this.handleDetectCodeSmells(args);
          case "extract_metrics": return this.handleExtractMetrics(args);
          case "explore_codebase": return this.handleExploreCodebase(args);
          case "find_patterns": return this.handleFindPatterns(args);
          case "find_function": return this.handleFindFunction(args);
          case "get_file_structure": return this.handleGetFileStructure(args);
          case "analyze_dependencies": return this.handleAnalyzeDependencies(args);
          case "find_duplicates": return this.handleFindDuplicates(args);
          default: throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    });
  }

  private handleAnalyzeCode(args: any) {
    const { files = [], language = "typescript" } = args;
    const results: Array<{ file: string; metrics: any }> = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        results.push({ file, metrics: this.calculateCodeMetrics(content, language) });
      } catch (e) { results.push({ file, metrics: { error: String(e) } }); }
    }
    return { content: [{ type: "text", text: JSON.stringify({ totalFiles: results.length, results }, null, 2) }] };
  }

  private calculateCodeMetrics(content: string, language: string): any {
    const lines = content.split("\n");
    return {
      totalLines: lines.length,
      nonEmptyLines: lines.filter(l => l.trim()).length,
      functions: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || []).length,
      classes: (content.match(/class\s+\w+/g) || []).length,
      interfaces: (content.match(/interface\s+\w+/g) || []).length,
      imports: (content.match(/import\s+.*?from\s+['"]/g) || []).length,
      exports: (content.match(/export\s+/g) || []).length,
      cyclomaticComplexity: this.calculateCyclomaticComplexity(content),
    };
  }

  private calculateCyclomaticComplexity(content: string): number {
    const patterns = [/\bif\s*\(/g, /\belse\s+if\s*\(/g, /\bfor\s*\(/g, /\bwhile\s*\(/g, /\bcase\s+/g, /\bcatch\s*\(/g, /\&\&/g, /\|\|/g];
    let c = 1;
    for (const p of patterns) { const m = content.match(p); if (m) c += m.length; }
    return c;
  }

  private handleCalculateComplexity(args: any) {
    const { code, language = "typescript" } = args;
    const complexity = this.calculateCyclomaticComplexity(code);
    return { content: [{ type: "text", text: JSON.stringify({ cyclomaticComplexity: complexity, complexityLevel: complexity < 10 ? "low" : complexity < 20 ? "moderate" : "high", metrics: this.calculateCodeMetrics(code, language) }, null, 2) }] };
  }

  private handleDetectCodeSmells(args: any) {
    const { files = [], thresholds = {} } = args;
    const { maxFunctionLength = 30, maxNestingDepth = 4, maxParameters = 5 } = thresholds;
    const smells: any[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        const lines = content.split("\n");
        let inFunc = false, funcStart = 0, braceCount = 0;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i] || "";
          if (line.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/)) { inFunc = true; funcStart = i; braceCount = 0; }
          if (inFunc) { braceCount += (line.match(/{/g) || []).length; braceCount -= (line.match(/}/g) || []).length; if (i - funcStart > maxFunctionLength && braceCount === 0) { smells.push({ file, type: "long-function", line: i + 1 }); inFunc = false; } }
          if ((line.match(/{/g) || []).length > maxNestingDepth) smells.push({ file, type: "deep-nesting", line: i + 1 });
        }
        const paramMatches = content.match(/function\s+\w+\s*\(([^)]*)\)/g);
        if (paramMatches) for (const m of paramMatches) { const params = m.replace(/function\s+\w+\s*\(/, "").replace(/\)/, ""); if (params.split(",").filter(p => p.trim()).length > maxParameters) smells.push({ file, type: "too-many-params" }); }
      } catch { /* skip */ }
    }
    return { content: [{ type: "text", text: JSON.stringify({ totalSmells: smells.length, smells }, null, 2) }] };
  }

  private handleExtractMetrics(args: any) {
    const { filePath } = args;
    const metrics: any = { file: filePath, analyzedAt: new Date().toISOString() };
    try { const stat = fs.statSync(filePath); metrics.size = stat.size; if (stat.isFile()) metrics.codeMetrics = this.calculateCodeMetrics(fs.readFileSync(filePath, "utf-8"), "typescript"); } catch (e) { metrics.error = String(e); }
    return { content: [{ type: "text", text: JSON.stringify(metrics, null, 2) }] };
  }

  private handleExploreCodebase(args: any) {
    const { patterns, basePath = ".", maxResults = 50 } = args;
    const results: string[] = [];
    const root = path.resolve(basePath);
    const walk = (dir: string, depth = 0) => {
      if (results.length >= maxResults || depth > 10) return;
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (results.length >= maxResults) break;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory() && !["node_modules", ".git", "dist"].includes(entry.name)) walk(full, depth + 1);
          else if (entry.isFile() && patterns.some((p: string) => this.matchesPattern(entry.name, p))) results.push(path.relative(root, full));
        }
      } catch { /* skip */ }
    };
    walk(root);
    return { content: [{ type: "text", text: JSON.stringify({ totalFound: results.length, files: results.slice(0, maxResults) }, null, 2) }] };
  }

  private matchesPattern(name: string, pattern: string): boolean {
    if (pattern.startsWith("**/")) pattern = pattern.slice(3);
    if (pattern.startsWith("*.")) return name.endsWith(pattern.slice(1));
    if (pattern.includes("*")) return new RegExp("^" + pattern.replace(/\*/g, ".*") + "$").test(name);
    return name.includes(pattern);
  }

  private handleFindPatterns(args: any) {
    const { pattern, fileTypes = [], basePath = ".", maxMatches = 100 } = args;
    const results: any[] = [];
    const root = path.resolve(basePath);
    const search = (file: string) => {
      try {
        const lines = fs.readFileSync(file, "utf-8").split("\n");
        const regex = new RegExp(pattern, "gi");
        for (let i = 0; i < lines.length && results.length < maxMatches; i++) {
          const line = lines[i];
          if (line && regex.test(line)) results.push({ file: path.relative(root, file), line: i + 1, content: line.trim().substring(0, 100) });
        }
      } catch { /* skip */ }
    };
    const walk = (dir: string, depth = 0) => {
      if (results.length >= maxMatches || depth > 10) return;
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (results.length >= maxMatches) break;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory() && !["node_modules", ".git", "dist"].includes(entry.name)) walk(full, depth + 1);
          else if (entry.isFile()) { const ext = path.extname(entry.name); if (!fileTypes.length || fileTypes.includes(ext)) search(full); }
        }
      } catch { /* skip */ }
    };
    walk(root);
    return { content: [{ type: "text", text: JSON.stringify({ totalMatches: results.length, matches: results }, null, 2) }] };
  }

  private handleFindFunction(args: any) {
    const { functionName, fileTypes = [".ts", ".js"] } = args;
    const results: any[] = [];
    const search = (file: string) => {
      try {
        const lines = fs.readFileSync(file, "utf-8").split("\n");
        const patterns = [new RegExp(`function\\s+${functionName}\\s*\\(`), new RegExp(`const\\s+${functionName}\\s*=`), new RegExp(`async\\s+function\\s+${functionName}\\s*\\(`)];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i] || "";
          for (const p of patterns) { if (p.test(line)) { results.push({ file, line: i + 1, context: lines[Math.max(0, i - 1)]?.trim().substring(0, 80) || "" }); break; } }
        }
      } catch { /* skip */ }
    };
    const walk = (dir: string, depth = 0) => {
      if (results.length >= 50 || depth > 10) return;
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (results.length >= 50) break;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory() && !["node_modules", ".git", "dist"].includes(entry.name)) walk(full, depth + 1);
          else if (entry.isFile() && fileTypes.includes(path.extname(entry.name))) search(full);
        }
      } catch { /* skip */ }
    };
    walk(".");
    return { content: [{ type: "text", text: JSON.stringify({ functionName, totalFound: results.length, definitions: results }, null, 2) }] };
  }

  private handleGetFileStructure(args: any) {
    const { path: dirPath, maxDepth = 3, includeFiles = true } = args;
    const root = path.resolve(dirPath);
    const build = (dir: string, depth: number): any => {
      if (depth > maxDepth) return null;
      try {
        const node: any = { type: "directory", name: path.basename(dir), children: [] };
        for (const entry of fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() ? !["node_modules", ".git", "dist"].includes(e.name) : includeFiles).sort((a, b) => (a.isDirectory() ? -1 : 1) - (b.isDirectory() ? -1 : 1))) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) { const child = build(full, depth + 1); if (child) node.children.push(child); }
          else try { node.children.push({ type: "file", name: entry.name, size: fs.statSync(full).size }); } catch { /* skip */ }
        }
        return node;
      } catch { return { type: "error", name: path.basename(dir) }; }
    };
    return { content: [{ type: "text", text: JSON.stringify({ structure: build(root, 0) }, null, 2) }] };
  }

  private handleAnalyzeDependencies(args: any) {
    const { rootDir, maxDepth = 3 } = args;
    const deps: Record<string, string[]> = {};
    const visited = new Set<string>();
    const process = (file: string, depth: number) => {
      if (depth > maxDepth || visited.has(file)) return;
      visited.add(file);
      try {
        const content = fs.readFileSync(file, "utf-8");
        const imports: string[] = [];
        let m;
        const ir = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
        while ((m = ir.exec(content)) !== null) { if (m[1]) imports.push(m[1]); }
        const rr = /require\s*\(\s*['"](.+?)['"]\s*\)/g;
        while ((m = rr.exec(content)) !== null) { if (m[1]) imports.push(m[1]); }
        deps[file] = imports.filter(i => !i.startsWith(".") && !i.startsWith("/"));
      } catch { /* skip */ }
    };
    const walk = (dir: string, depth: number) => {
      if (depth > maxDepth) return;
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory() && !["node_modules", ".git", "dist"].includes(entry.name)) walk(full, depth + 1);
          else if (entry.isFile() && /\.(ts|js|tsx|jsx)$/.test(entry.name)) process(full, depth);
        }
      } catch { /* skip */ }
    };
    walk(path.resolve(rootDir), 0);
    return { content: [{ type: "text", text: JSON.stringify({ totalFiles: Object.keys(deps).length, externalDependencies: [...new Set(Object.values(deps).flat())], dependencies: deps }, null, 2) }] };
  }

  private handleFindDuplicates(args: any) {
    const { directory, minLength = 10 } = args;
    const blocks = new Map<string, string[]>();
    const extract = (content: string): string[] => {
      const b: string[] = [], lines = content.split("\n");
      let current: string[] = [];
      for (const line of lines) {
        if (line.trim()) current.push(line);
        else if (current.length >= minLength) { b.push(current.join("\n")); current = []; }
        else {
          current = [];
        }
      }
      if (current.length >= minLength) b.push(current.join("\n"));
      return b;
    };
    const walk = (dir: string) => {
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory() && !["node_modules", ".git", "dist"].includes(entry.name)) walk(full);
          else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
            for (const block of extract(fs.readFileSync(full, "utf-8"))) {
              const norm = block.trim();
              const existing = blocks.get(norm) || [];
              existing.push(full);
              blocks.set(norm, existing);
            }
          }
        }
      } catch { /* skip */ }
    };
    walk(path.resolve(directory));
    const duplicates = [...blocks.entries()].filter(([_, f]) => f.length > 1).map(([block, files]) => ({ block: block.substring(0, 100) + "...", files, length: block.split("\n").length }));
    return { content: [{ type: "text", text: JSON.stringify({ totalDuplicates: duplicates.length, duplicates }, null, 2) }] };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Use centralized shutdown handler
    createGracefulShutdown({
      serverName: "code-analyzer.server",
      server: this.server,
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) { new CodeAnalyzerServer().run().catch(console.error); }
export default CodeAnalyzerServer;
