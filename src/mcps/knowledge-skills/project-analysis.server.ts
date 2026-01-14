/**
 * StrRay Project Analysis MCP Server
 *
 * Knowledge skill for project structure analysis, complexity assessment,
 * and pattern recognition - provides deep project intelligence
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

interface ProjectMetrics {
  totalFiles: number;
  totalLinesOfCode: number;
  languages: Record<string, number>;
  fileTypes: Record<string, number>;
  directoryDepth: number;
  largestFile: { path: string; size: number };
  mostComplexFile: { path: string; complexity: number };
}

interface ComplexityAnalysis {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  halsteadMetrics: {
    volume: number;
    difficulty: number;
    effort: number;
  };
}

class StrRayProjectAnalysisServer {
  private server: Server;

  constructor() {
        this.server = new Server(
      {
        name: "strray-project-analysis",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    console.log("StrRay Project Analysis MCP Server initialized");
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "analyze-project-structure",
            description:
              "Analyze complete project structure including file organization, directory hierarchy, and module distribution",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project to analyze",
                },
                includeMetrics: {
                  type: "boolean",
                  default: true,
                  description: "Include detailed metrics in analysis",
                },
                maxDepth: {
                  type: "number",
                  default: 10,
                  description: "Maximum directory depth to analyze",
                },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "assess-project-complexity",
            description:
              "Assess overall project complexity including code metrics, maintainability, and technical debt indicators",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project",
                },
                includeBreakdown: {
                  type: "boolean",
                  default: true,
                  description: "Include per-file complexity breakdown",
                },
                focusAreas: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["functions", "classes", "imports", "dependencies"],
                  },
                  description: "Specific areas to focus complexity analysis on",
                },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "identify-project-patterns",
            description:
              "Identify architectural patterns, code patterns, and structural patterns in the project",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project",
                },
                patternTypes: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "architectural",
                      "code",
                      "structural",
                      "anti-patterns",
                    ],
                  },
                  description: "Types of patterns to identify",
                },
                confidenceThreshold: {
                  type: "number",
                  default: 0.7,
                  description: "Minimum confidence for pattern detection",
                },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "analyze-project-health",
            description:
              "Provide comprehensive project health assessment including quality metrics and improvement recommendations",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project",
                },
                includeTrends: {
                  type: "boolean",
                  default: false,
                  description: "Include historical trend analysis",
                },
                focusMetrics: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "complexity",
                      "coverage",
                      "maintainability",
                      "dependencies",
                      "patterns",
                    ],
                  },
                  description: "Specific health metrics to focus on",
                },
              },
              required: ["projectRoot"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "analyze-project-structure":
            return await this.analyzeProjectStructure(args);
          case "assess-project-complexity":
            return await this.assessProjectComplexity(args);
          case "identify-project-patterns":
            return await this.identifyProjectPatterns(args);
          case "analyze-project-health":
            return await this.analyzeProjectHealth(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in project analysis tool ${name}:`, error);
        throw error;
      }
    });
  }

  private async analyzeProjectStructure(args: any): Promise<any> {
    const { projectRoot, includeMetrics = true, maxDepth = 10 } = args;

    console.log(`🔍 Analyzing project structure: ${projectRoot}`);

    const structure = this.analyzeDirectoryStructure(projectRoot, maxDepth);
    const metrics = includeMetrics
      ? this.calculateProjectMetrics(projectRoot, structure)
      : null;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectRoot,
              structure,
              metrics,
              analyzedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private async assessProjectComplexity(args: any): Promise<any> {
    const { projectRoot, includeBreakdown = true, focusAreas } = args;

    console.log(`🧠 Assessing project complexity: ${projectRoot}`);

    const files = this.getProjectFiles(projectRoot);
    const complexityAnalysis = this.analyzeComplexity(files, focusAreas);

    if (includeBreakdown) {
      complexityAnalysis.fileBreakdown = files.map((file) => ({
        file: path.relative(projectRoot, file),
        complexity: this.calculateFileComplexity(file),
        size: fs.statSync(file).size,
      }));
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectRoot,
              overallComplexity: complexityAnalysis,
              analyzedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private async identifyProjectPatterns(args: any): Promise<any> {
    const {
      projectRoot,
      patternTypes = ["architectural", "code"],
      confidenceThreshold = 0.7,
    } = args;

    console.log(`🔍 Identifying project patterns: ${projectRoot}`);

    const patterns = await this.detectPatterns(
      projectRoot,
      patternTypes,
      confidenceThreshold,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectRoot,
              patterns,
              patternTypes,
              confidenceThreshold,
              analyzedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private async analyzeProjectHealth(args: any): Promise<any> {
    const { projectRoot, includeTrends = false, focusMetrics } = args;

    console.log(`🏥 Analyzing project health: ${projectRoot}`);

    const healthAssessment = await this.assessProjectHealth(
      projectRoot,
      focusMetrics,
    );

    if (includeTrends) {
      healthAssessment.trends = this.calculateHealthTrends(projectRoot);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              projectRoot,
              healthAssessment,
              recommendations:
                this.generateHealthRecommendations(healthAssessment),
              analyzedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  // Helper methods
  private analyzeDirectoryStructure(
    dirPath: string,
    maxDepth: number,
    currentDepth = 0,
  ): any {
    if (currentDepth >= maxDepth) return { type: "directory", truncated: true };

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const structure: any = {
        type: "directory",
        path: path.relative(process.cwd(), dirPath),
        children: [],
      };

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        // Skip common ignore patterns
        if (this.shouldIgnorePath(entryPath)) continue;

        if (entry.isDirectory()) {
          structure.children.push(
            this.analyzeDirectoryStructure(
              entryPath,
              maxDepth,
              currentDepth + 1,
            ),
          );
        } else if (entry.isFile()) {
          structure.children.push({
            type: "file",
            name: entry.name,
            extension: path.extname(entry.name),
            size: fs.statSync(entryPath).size,
          });
        }
      }

      return structure;
    } catch (error) {
      return {
        type: "directory",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private calculateProjectMetrics(
    projectRoot: string,
    structure: any,
  ): ProjectMetrics {
    const metrics: ProjectMetrics = {
      totalFiles: 0,
      totalLinesOfCode: 0,
      languages: {},
      fileTypes: {},
      directoryDepth: 0,
      largestFile: { path: "", size: 0 },
      mostComplexFile: { path: "", complexity: 0 },
    };

    this.traverseStructure(structure, (item, depth) => {
      if (item.type === "file") {
        metrics.totalFiles++;
        metrics.directoryDepth = Math.max(metrics.directoryDepth, depth);

        const ext = item.extension || path.extname(item.name);
        metrics.fileTypes[ext] = (metrics.fileTypes[ext] || 0) + 1;

        // Estimate lines of code
        metrics.totalLinesOfCode += Math.max(1, Math.floor(item.size / 50));

        // Track largest file
        if (item.size > metrics.largestFile.size) {
          metrics.largestFile = { path: item.name, size: item.size };
        }

        // Estimate complexity
        const complexity = Math.floor(item.size / 200) + 1;
        if (complexity > metrics.mostComplexFile.complexity) {
          metrics.mostComplexFile = { path: item.name, complexity };
        }

        // Detect language
        const language = this.detectLanguage(ext);
        if (language) {
          metrics.languages[language] = (metrics.languages[language] || 0) + 1;
        }
      }
    });

    return metrics;
  }

  private getProjectFiles(projectRoot: string): string[] {
    const files: string[] = [];

    const traverse = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(dir, entry.name);
          if (this.shouldIgnorePath(entryPath)) continue;

          if (entry.isFile()) {
            files.push(entryPath);
          } else if (entry.isDirectory()) {
            traverse(entryPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };

    traverse(projectRoot);
    return files;
  }

  private analyzeComplexity(files: string[], focusAreas?: string[]): any {
    const analysis = {
      averageComplexity: 0,
      maxComplexity: 0,
      totalFunctions: 0,
      totalClasses: 0,
      totalImports: 0,
      maintainabilityIndex: 85, // Placeholder
      technicalDebtRatio: 0.15, // Placeholder
    };

    let totalComplexity = 0;
    let processedFiles = 0;

    for (const file of files.slice(0, 50)) {
      // Limit for performance
      try {
        const fileComplexity = this.calculateFileComplexity(file);
        totalComplexity += fileComplexity.complexity;
        analysis.totalFunctions += fileComplexity.functions;
        analysis.totalClasses += fileComplexity.classes;
        analysis.totalImports += fileComplexity.imports;
        analysis.maxComplexity = Math.max(
          analysis.maxComplexity,
          fileComplexity.complexity,
        );
        processedFiles++;
      } catch (error) {
        // Skip files that can't be analyzed
      }
    }

    if (processedFiles > 0) {
      analysis.averageComplexity = Math.round(totalComplexity / processedFiles);
    }

    return analysis;
  }

  private calculateFileComplexity(filePath: string): any {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content.split("\n");

      return {
        complexity: Math.max(
          1,
          Math.floor(lines.length / 20) + Math.floor(content.length / 1000),
        ),
        functions: (
          content.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) ||
          []
        ).length,
        classes: (content.match(/class\s+\w+/g) || []).length,
        imports: (content.match(/import\s+.*?\s+from\s+['"]/g) || []).length,
      };
    } catch (error) {
      return { complexity: 1, functions: 0, classes: 0, imports: 0 };
    }
  }

  private async detectPatterns(
    projectRoot: string,
    patternTypes: string[],
    confidenceThreshold: number,
  ): Promise<any[]> {
    const patterns: any[] = [];

    if (patternTypes.includes("architectural")) {
      patterns.push(
        ...this.detectArchitecturalPatterns(projectRoot, confidenceThreshold),
      );
    }

    if (patternTypes.includes("code")) {
      patterns.push(
        ...this.detectCodePatterns(projectRoot, confidenceThreshold),
      );
    }

    if (patternTypes.includes("anti-patterns")) {
      patterns.push(
        ...this.detectAntiPatterns(projectRoot, confidenceThreshold),
      );
    }

    return patterns;
  }

  private detectArchitecturalPatterns(
    projectRoot: string,
    threshold: number,
  ): any[] {
    const patterns: any[] = [];
    const files = this.getProjectFiles(projectRoot);

    // MVC Pattern
    const hasControllers = files.some((f) => f.includes("controller"));
    const hasModels = files.some((f) => f.includes("model"));
    const hasViews = files.some(
      (f) => f.includes("view") || f.includes("component"),
    );
    if (hasControllers && hasModels && hasViews) {
      patterns.push({
        type: "architectural",
        pattern: "MVC",
        confidence: 0.85,
        description: "Model-View-Controller architectural pattern detected",
      });
    }

    // Repository Pattern
    const hasRepositories = files.some((f) => f.includes("repository"));
    if (hasRepositories) {
      patterns.push({
        type: "architectural",
        pattern: "Repository",
        confidence: 0.9,
        description: "Repository pattern for data access detected",
      });
    }

    return patterns.filter((p) => p.confidence >= threshold);
  }

  private detectCodePatterns(projectRoot: string, threshold: number): any[] {
    const patterns: any[] = [];
    const files = this.getProjectFiles(projectRoot);

    // Check for common patterns in a sample of files
    const sampleFiles = files.slice(0, 10);
    let asyncUsage = 0;
    let errorHandling = 0;
    let typeUsage = 0;

    for (const file of sampleFiles) {
      try {
        const content = fs.readFileSync(file, "utf8");
        if (content.includes("async") || content.includes("await"))
          asyncUsage++;
        if (content.includes("try") && content.includes("catch"))
          errorHandling++;
        if (
          content.includes(": ") ||
          content.includes("<") ||
          content.includes("interface")
        )
          typeUsage++;
      } catch (error) {
        // Skip
      }
    }

    const sampleSize = sampleFiles.length;
    if (sampleSize > 0) {
      if (asyncUsage / sampleSize > 0.5) {
        patterns.push({
          type: "code",
          pattern: "Async/Await Usage",
          confidence: Math.min(0.95, asyncUsage / sampleSize),
          description: "Heavy usage of async/await patterns",
        });
      }

      if (errorHandling / sampleSize > 0.3) {
        patterns.push({
          type: "code",
          pattern: "Error Handling",
          confidence: Math.min(0.9, errorHandling / sampleSize),
          description: "Good error handling practices detected",
        });
      }

      if (typeUsage / sampleSize > 0.4) {
        patterns.push({
          type: "code",
          pattern: "Type Safety",
          confidence: Math.min(0.95, typeUsage / sampleSize),
          description: "Strong typing patterns detected",
        });
      }
    }

    return patterns.filter((p) => p.confidence >= threshold);
  }

  private detectAntiPatterns(projectRoot: string, threshold: number): any[] {
    const patterns: any[] = [];
    const files = this.getProjectFiles(projectRoot);

    // Check for anti-patterns in sample files
    const sampleFiles = files.slice(0, 20);
    let longFunctions = 0;
    let deepNesting = 0;
    let globalVariables = 0;

    for (const file of sampleFiles) {
      try {
        const content = fs.readFileSync(file, "utf8");
        const lines = content.split("\n");

        // Check for long functions
        let currentFunctionLines = 0;
        let inFunction = false;
        for (const line of lines) {
          if (
            line.includes("function") ||
            line.includes("=>") ||
            (line.includes("const") && line.includes("="))
          ) {
            if (inFunction && currentFunctionLines > 30) longFunctions++;
            inFunction = true;
            currentFunctionLines = 0;
          } else if (inFunction) {
            currentFunctionLines++;
            if (line.includes("}") && currentFunctionLines > 30)
              longFunctions++;
          }
        }

        // Check for deep nesting
        const maxNesting = this.calculateMaxNesting(content);
        if (maxNesting > 4) deepNesting++;

        // Check for global variables (simplified)
        if (content.includes("global.") || content.includes("window."))
          globalVariables++;
      } catch (error) {
        // Skip
      }
    }

    if (longFunctions > 0) {
      patterns.push({
        type: "anti-pattern",
        pattern: "Long Functions",
        confidence: Math.min(0.9, longFunctions / sampleFiles.length),
        description: "Functions exceeding recommended length",
        severity: "medium",
      });
    }

    if (deepNesting > 0) {
      patterns.push({
        type: "anti-pattern",
        pattern: "Deep Nesting",
        confidence: Math.min(0.85, deepNesting / sampleFiles.length),
        description: "Excessive nesting levels detected",
        severity: "high",
      });
    }

    if (globalVariables > 0) {
      patterns.push({
        type: "anti-pattern",
        pattern: "Global Variables",
        confidence: Math.min(0.95, globalVariables / sampleFiles.length),
        description: "Usage of global variables detected",
        severity: "medium",
      });
    }

    return patterns.filter((p) => p.confidence >= threshold);
  }

  private async assessProjectHealth(
    projectRoot: string,
    focusMetrics?: string[],
  ): Promise<any> {
    const health = {
      overall: "good",
      scores: {
        complexity: 75,
        maintainability: 80,
        testability: 70,
        reliability: 85,
        security: 75,
      },
      issues: [] as any[],
      metrics: {} as any,
    };

    const files = this.getProjectFiles(projectRoot);
    const metrics = this.analyzeComplexity(files);

    health.metrics = metrics;

    // Calculate health scores based on metrics
    if (metrics.averageComplexity > 10) {
      health.scores.complexity -= 20;
      health.issues.push({
        type: "complexity",
        severity: "high",
        description: "High average complexity detected",
      });
    }

    if (metrics.maintainabilityIndex < 50) {
      health.scores.maintainability -= 30;
      health.issues.push({
        type: "maintainability",
        severity: "critical",
        description: "Low maintainability index",
      });
    }

    // Calculate overall health
    const avgScore =
      Object.values(health.scores).reduce((a: number, b: number) => a + b, 0) /
      Object.values(health.scores).length;
    if (avgScore >= 80) health.overall = "excellent";
    else if (avgScore >= 70) health.overall = "good";
    else if (avgScore >= 60) health.overall = "fair";
    else if (avgScore >= 50) health.overall = "poor";
    else health.overall = "critical";

    return health;
  }

  private calculateHealthTrends(projectRoot: string): any {
    // Placeholder for trend analysis
    return {
      complexity: { trend: "stable", change: 0 },
      maintainability: { trend: "improving", change: 5 },
      issues: { trend: "decreasing", change: -2 },
    };
  }

  private generateHealthRecommendations(health: any): string[] {
    const recommendations: string[] = [];

    if (health.scores.complexity < 70) {
      recommendations.push(
        "Refactor complex functions into smaller, focused units",
      );
    }

    if (health.scores.maintainability < 70) {
      recommendations.push("Improve code documentation and naming conventions");
    }

    if (health.issues.some((i: any) => i.severity === "critical")) {
      recommendations.push("Address critical health issues immediately");
    }

    return recommendations;
  }

  private traverseStructure(
    structure: any,
    callback: (item: any, depth: number) => void,
    depth = 0,
  ): void {
    callback(structure, depth);
    if (structure.children) {
      for (const child of structure.children) {
        this.traverseStructure(child, callback, depth + 1);
      }
    }
  }

  private shouldIgnorePath(filePath: string): boolean {
    const ignorePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /\.next/,
      /\.nuxt/,
      /\.cache/,
      /\.temp/,
      /coverage/,
      /\.nyc_output/,
      /logs/,
      /\.DS_Store/,
      /Thumbs\.db/,
    ];

    return ignorePatterns.some((pattern) => pattern.test(filePath));
  }

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
      ".swift": "swift",
      ".kt": "kotlin",
      ".scala": "scala",
    };

    return languageMap[extension] || null;
  }

  private calculateMaxNesting(content: string): number {
    let maxNesting = 0;
    let currentNesting = 0;

    for (const char of content) {
      if (char === "{" || char === "(" || char === "[") {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === "}" || char === ")" || char === "]") {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }

    return maxNesting;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Project Analysis MCP Server started");
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayProjectAnalysisServer();
  server.run().catch(console.error);
}

export default StrRayProjectAnalysisServer;
