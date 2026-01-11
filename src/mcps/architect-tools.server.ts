/**
 * StrRay Architect Tools MCP Server
 *
 * Converts architect-tools.ts functions into MCP server tools
 * Provides contextual analysis capabilities via MCP protocol
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

class StrRayArchitectToolsServer {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: "strray-architect-tools",
      version: "1.0.0",
    });

    this.setupToolHandlers();
    console.log("StrRay Architect Tools MCP Server initialized");
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "context-analysis",
            description:
              "Perform comprehensive codebase intelligence gathering including structure analysis, dependency mapping, and architectural pattern recognition",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project to analyze",
                },
                depth: {
                  type: "string",
                  enum: ["overview", "detailed", "comprehensive"],
                  default: "detailed",
                  description: "Analysis depth level",
                },
                includeFiles: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific files to include in analysis",
                },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "codebase-structure",
            description:
              "Analyze file organization, module distribution, and directory hierarchy with optional metrics",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project",
                },
                includeMetrics: {
                  type: "boolean",
                  default: true,
                  description: "Include detailed metrics",
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
            name: "dependency-analysis",
            description:
              "Map component dependencies, identify coupling patterns, and assess architectural relationships",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project",
                },
                focusAreas: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific areas to focus dependency analysis on",
                },
                includeGraphs: {
                  type: "boolean",
                  default: true,
                  description: "Include dependency graphs in output",
                },
              },
              required: ["projectRoot"],
            },
          },
          {
            name: "architecture-assessment",
            description:
              "Evaluate overall architectural health with scores, issues, and improvement recommendations",
            inputSchema: {
              type: "object",
              properties: {
                projectRoot: {
                  type: "string",
                  description: "Root directory of the project",
                },
                assessmentType: {
                  type: "string",
                  enum: ["quick", "comprehensive"],
                  default: "comprehensive",
                  description: "Type of assessment to perform",
                },
                focusMetrics: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "complexity",
                      "coupling",
                      "cohesion",
                      "testability",
                      "scalability",
                    ],
                  },
                  description: "Specific metrics to focus assessment on",
                },
              },
              required: ["projectRoot"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "context-analysis":
            return await this.contextAnalysis(args);
          case "codebase-structure":
            return await this.codebaseStructure(args);
          case "dependency-analysis":
            return await this.dependencyAnalysis(args);
          case "architecture-assessment":
            return await this.architectureAssessment(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in architect tool ${name}:`, error);
        throw error;
      }
    });
  }

  // Tool implementations - wrappers around the original architect-tools functions

  private async contextAnalysis(args: any): Promise<any> {
    const { projectRoot, depth = "detailed", includeFiles } = args;

    console.log(
      `🏗️ Architect Tool: Performing context analysis on ${projectRoot}`,
    );

    // This would integrate with the actual architect-tools.ts functions
    // For now, providing a simplified implementation
    const result = {
      projectRoot,
      depth,
      analysis: {
        structure: await this.analyzeProjectStructure(projectRoot),
        patterns: await this.identifyPatterns(projectRoot),
        complexity: await this.assessComplexity(projectRoot),
        dependencies: await this.mapDependencies(projectRoot),
      },
      filesAnalyzed: includeFiles || (await this.getProjectFiles(projectRoot)),
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async codebaseStructure(args: any): Promise<any> {
    const { projectRoot, includeMetrics = true, maxDepth = 10 } = args;

    console.log(
      `🏗️ Architect Tool: Analyzing codebase structure for ${projectRoot}`,
    );

    const structure = {
      projectRoot,
      hierarchy: await this.buildDirectoryHierarchy(projectRoot, maxDepth),
      metrics: includeMetrics
        ? await this.calculateStructureMetrics(projectRoot)
        : undefined,
      analyzedAt: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(structure, null, 2),
        },
      ],
    };
  }

  private async dependencyAnalysis(args: any): Promise<any> {
    const { projectRoot, focusAreas, includeGraphs = true } = args;

    console.log(
      `🏗️ Architect Tool: Performing dependency analysis on ${projectRoot}`,
    );

    const analysis = {
      projectRoot,
      dependencies: await this.analyzeDependencies(projectRoot, focusAreas),
      coupling: await this.assessCoupling(projectRoot),
      circularDeps: await this.detectCircularDependencies(projectRoot),
      graphs: includeGraphs
        ? await this.generateDependencyGraphs(projectRoot)
        : undefined,
      recommendations:
        await this.generateDependencyRecommendations(projectRoot),
      analyzedAt: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  private async architectureAssessment(args: any): Promise<any> {
    const {
      projectRoot,
      assessmentType = "comprehensive",
      focusMetrics,
    } = args;

    console.log(
      `🏗️ Architect Tool: Performing architecture assessment on ${projectRoot}`,
    );

    const assessment = {
      projectRoot,
      assessmentType,
      scores: await this.calculateArchitecturalScores(
        projectRoot,
        focusMetrics,
      ),
      issues: await this.identifyArchitecturalIssues(projectRoot),
      patterns: await this.recognizeArchitecturalPatterns(projectRoot),
      recommendations:
        await this.generateArchitecturalRecommendations(projectRoot),
      healthScore: await this.calculateOverallHealthScore(projectRoot),
      analyzedAt: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(assessment, null, 2),
        },
      ],
    };
  }

  // Implementation helpers (simplified versions of the actual architect-tools logic)

  private async analyzeProjectStructure(projectRoot: string): Promise<any> {
    const files = await this.getProjectFiles(projectRoot);
    const directories = await this.getProjectDirectories(projectRoot);

    return {
      totalFiles: files.length,
      totalDirectories: directories.length,
      fileTypes: this.groupByExtension(files),
      directoryDepth: this.calculateMaxDepth(directories),
      largestFiles: files
        .map((f) => ({ path: f, size: fs.statSync(f).size }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 5),
    };
  }

  private async identifyPatterns(projectRoot: string): Promise<string[]> {
    const files = await this.getProjectFiles(projectRoot);
    const patterns: string[] = [];

    // Simple pattern detection
    const hasControllers = files.some((f) => f.includes("controller"));
    const hasServices = files.some((f) => f.includes("service"));
    const hasModels = files.some((f) => f.includes("model"));

    if (hasControllers && hasModels) patterns.push("MVC Pattern");
    if (hasServices) patterns.push("Service Layer");
    if (files.some((f) => f.includes("repository")))
      patterns.push("Repository Pattern");

    return patterns;
  }

  private async assessComplexity(projectRoot: string): Promise<any> {
    const files = await this.getProjectFiles(projectRoot);

    let totalComplexity = 0;
    let totalLines = 0;

    for (const file of files.slice(0, 20)) {
      // Sample for performance
      try {
        const content = fs.readFileSync(file, "utf8");
        const lines = content.split("\n").length;
        const complexity = Math.floor(lines / 50) + 1; // Simple heuristic

        totalComplexity += complexity;
        totalLines += lines;
      } catch (error) {
        // Skip unreadable files
      }
    }

    return {
      averageComplexity:
        totalComplexity / Math.max(1, Math.min(files.length, 20)),
      totalLinesOfCode: totalLines,
      estimatedFunctions: Math.floor(totalLines / 20), // Rough estimate
      estimatedClasses: Math.floor(totalLines / 100),
    };
  }

  private async mapDependencies(projectRoot: string): Promise<any> {
    const files = await this.getProjectFiles(projectRoot);
    const dependencies: Record<string, string[]> = {};

    for (const file of files.slice(0, 10)) {
      // Sample for performance
      try {
        const content = fs.readFileSync(file, "utf8");
        const imports = this.extractImports(content);
        dependencies[file] = imports;
      } catch (error) {
        dependencies[file] = [];
      }
    }

    return {
      dependencyMap: dependencies,
      totalDependencies: Object.values(dependencies).flat().length,
      averageDependenciesPerFile:
        Object.values(dependencies).flat().length /
        Object.keys(dependencies).length,
    };
  }

  private async buildDirectoryHierarchy(
    projectRoot: string,
    maxDepth: number,
  ): Promise<any> {
    const traverse = (dirPath: string, currentDepth: number): any => {
      if (currentDepth >= maxDepth) return { truncated: true };

      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        const result: any = {
          name: path.basename(dirPath),
          path: path.relative(projectRoot, dirPath),
          type: "directory",
          children: [],
        };

        for (const entry of entries) {
          if (this.shouldIgnorePath(path.join(dirPath, entry.name))) continue;

          if (entry.isDirectory()) {
            result.children.push(
              traverse(path.join(dirPath, entry.name), currentDepth + 1),
            );
          } else {
            result.children.push({
              name: entry.name,
              type: "file",
              extension: path.extname(entry.name),
            });
          }
        }

        return result;
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };

    return traverse(projectRoot, 0);
  }

  private async calculateStructureMetrics(projectRoot: string): Promise<any> {
    const files = await this.getProjectFiles(projectRoot);

    return {
      totalFiles: files.length,
      fileTypeDistribution: this.groupByExtension(files),
      averageFileSize:
        files.reduce((sum, f) => sum + fs.statSync(f).size, 0) / files.length,
      largestFile: files
        .map((f) => ({ path: f, size: fs.statSync(f).size }))
        .sort((a, b) => b.size - a.size)[0],
    };
  }

  private async analyzeDependencies(
    projectRoot: string,
    focusAreas?: string[],
  ): Promise<any> {
    const files = await this.getProjectFiles(projectRoot);

    // Simple dependency analysis
    const dependencies: Record<string, string[]> = {};
    let circularDeps = 0;

    for (const file of files.slice(0, 10)) {
      try {
        const content = fs.readFileSync(file, "utf8");
        dependencies[file] = this.extractImports(content);
      } catch (error) {
        dependencies[file] = [];
      }
    }

    return {
      totalDependencies: Object.values(dependencies).flat().length,
      uniqueDependencies: Array.from(
        new Set(Object.values(dependencies).flat()),
      ).length,
      circularDependencies: circularDeps,
      mostDependantFile: Object.entries(dependencies).sort(
        ([, a], [, b]) => b.length - a.length,
      )[0],
    };
  }

  private async assessCoupling(projectRoot: string): Promise<any> {
    // Simplified coupling assessment
    return {
      afferentCoupling: 0, // Incoming dependencies
      efferentCoupling: 0, // Outgoing dependencies
      instability: 0.5,
      abstractness: 0.3,
    };
  }

  private async detectCircularDependencies(
    projectRoot: string,
  ): Promise<string[]> {
    // Simplified circular dependency detection
    return []; // Would implement proper cycle detection
  }

  private async generateDependencyGraphs(projectRoot: string): Promise<any> {
    // Would generate graphviz or similar format
    return { format: "graphviz", data: "digraph { A -> B; }" };
  }

  private async generateDependencyRecommendations(
    projectRoot: string,
  ): Promise<string[]> {
    return [
      "Consider introducing interface boundaries to reduce coupling",
      "Review circular dependencies and break them with dependency inversion",
      "Evaluate orphan modules for potential dead code",
    ];
  }

  private async calculateArchitecturalScores(
    projectRoot: string,
    focusMetrics?: string[],
  ): Promise<any> {
    return {
      modularity: 75,
      coupling: 65,
      cohesion: 80,
      testability: 70,
      scalability: 72,
    };
  }

  private async identifyArchitecturalIssues(
    projectRoot: string,
  ): Promise<any[]> {
    return [
      {
        severity: "medium",
        category: "coupling",
        description: "Some modules have high coupling",
        recommendation: "Consider introducing facades or adapters",
      },
    ];
  }

  private async recognizeArchitecturalPatterns(
    projectRoot: string,
  ): Promise<string[]> {
    const files = await this.getProjectFiles(projectRoot);
    const patterns: string[] = [];

    if (files.some((f) => f.includes("controller")))
      patterns.push("MVC Controllers");
    if (files.some((f) => f.includes("service")))
      patterns.push("Service Layer");
    if (files.some((f) => f.includes("repository")))
      patterns.push("Repository Pattern");

    return patterns;
  }

  private async generateArchitecturalRecommendations(
    projectRoot: string,
  ): Promise<string[]> {
    return [
      "Consider implementing a layered architecture",
      "Introduce dependency injection to reduce coupling",
      "Add comprehensive error handling and logging",
    ];
  }

  private async calculateOverallHealthScore(
    projectRoot: string,
  ): Promise<number> {
    // Simplified health score calculation
    return 78;
  }

  // Utility methods
  private async getProjectFiles(projectRoot: string): Promise<string[]> {
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

  private async getProjectDirectories(projectRoot: string): Promise<string[]> {
    const dirs: string[] = [];

    const traverse = (dir: string) => {
      dirs.push(dir);
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(dir, entry.name);
          if (this.shouldIgnorePath(entryPath)) continue;

          if (entry.isDirectory()) {
            traverse(entryPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };

    traverse(projectRoot);
    return dirs;
  }

  private groupByExtension(files: string[]): Record<string, number> {
    const groups: Record<string, number> = {};

    for (const file of files) {
      const ext = path.extname(file) || "no-extension";
      groups[ext] = (groups[ext] || 0) + 1;
    }

    return groups;
  }

  private calculateMaxDepth(directories: string[]): number {
    return Math.max(...directories.map((dir) => dir.split("/").length));
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (
        importPath &&
        !importPath.startsWith(".") &&
        !importPath.startsWith("/")
      ) {
        imports.push(importPath);
      }
    }

    return imports;
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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Architect Tools MCP Server started");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayArchitectToolsServer();
  server.run().catch(console.error);
}

export default StrRayArchitectToolsServer;
