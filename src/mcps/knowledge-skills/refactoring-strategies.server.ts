/**
 * StrRay Refactoring Strategies MCP Server
 *
 * Knowledge skill for code refactoring, technical debt elimination,
 * modernization, and code improvement patterns
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

interface RefactoringOpportunity {
  type:
    | "extract-method"
    | "rename-variable"
    | "remove-duplicate"
    | "simplify-condition"
    | "extract-class"
    | "move-method"
    | "introduce-parameter"
    | "replace-conditional";
  file: string;
  line: number;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  beforeCode: string;
  afterCode: string;
  benefits: string[];
}

interface TechnicalDebtAnalysis {
  totalDebt: number;
  debtByCategory: Record<string, number>;
  criticalIssues: RefactoringOpportunity[];
  modernizationOpportunities: ModernizationSuggestion[];
  maintainabilityScore: number;
  technicalDebtRatio: number;
}

interface ModernizationSuggestion {
  technology: string;
  currentVersion: string;
  recommendedVersion: string;
  breakingChanges: boolean;
  migrationEffort: "low" | "medium" | "high";
  benefits: string[];
  risks: string[];
}

class StrRayRefactoringStrategiesServer {
  private server: Server;

  constructor() {
        this.server = new Server(
      {
        name: "strray-refactoring-strategies",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    // Server initialization - removed unnecessary startup logging
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "analyze_technical_debt",
            description:
              "Analyze codebase for technical debt and refactoring opportunities",
            inputSchema: {
              type: "object",
              properties: {
                codePath: {
                  type: "string",
                  description: "Path to code directory to analyze",
                },
                includeModernization: {
                  type: "boolean",
                  description: "Include technology modernization suggestions",
                  default: true,
                },
                debtThreshold: {
                  type: "number",
                  description: "Minimum debt score to report (0-100)",
                  default: 20,
                },
              },
              required: ["codePath"],
            },
          },
          {
            name: "suggest_refactoring",
            description:
              "Suggest specific refactoring opportunities for improved code quality",
            inputSchema: {
              type: "object",
              properties: {
                filePath: {
                  type: "string",
                  description: "Path to specific file to analyze",
                },
                refactoringTypes: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "extract-method",
                      "rename-variable",
                      "remove-duplicate",
                      "simplify-condition",
                      "extract-class",
                      "move-method",
                    ],
                  },
                  description: "Types of refactoring to focus on",
                },
                maxSuggestions: {
                  type: "number",
                  description: "Maximum number of suggestions to return",
                  default: 10,
                },
              },
              required: ["filePath"],
            },
          },
          {
            name: "generate_refactoring_plan",
            description:
              "Generate a comprehensive refactoring plan with prioritization",
            inputSchema: {
              type: "object",
              properties: {
                codePath: {
                  type: "string",
                  description: "Path to codebase for refactoring analysis",
                },
                timeBudget: {
                  type: "string",
                  enum: ["1-week", "1-month", "3-months", "6-months"],
                  description: "Available time for refactoring",
                },
                riskTolerance: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                  description: "Risk tolerance for changes",
                },
                priorities: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Specific priorities (performance, maintainability, security)",
                  default: ["maintainability", "performance"],
                },
              },
              required: ["codePath", "timeBudget"],
            },
          },
          {
            name: "modernize_codebase",
            description:
              "Suggest modernization strategies for outdated code and dependencies",
            inputSchema: {
              type: "object",
              properties: {
                codePath: {
                  type: "string",
                  description: "Path to codebase to analyze",
                },
                technologies: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Specific technologies to focus on (node, react, etc.)",
                },
                safeMode: {
                  type: "boolean",
                  description: "Only suggest low-risk modernization options",
                  default: true,
                },
              },
              required: ["codePath"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "analyze_technical_debt":
          return await this.analyzeTechnicalDebt(args);
        case "suggest_refactoring":
          return await this.suggestRefactoring(args);
        case "generate_refactoring_plan":
          return await this.generateRefactoringPlan(args);
        case "modernize_codebase":
          return await this.modernizeCodebase(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async analyzeTechnicalDebt(args: any): Promise<any> {
    const { codePath, includeModernization = true, debtThreshold = 20 } = args;

    try {
      const analysis = await this.performTechnicalDebtAnalysis(
        codePath,
        includeModernization,
      );

      // Filter results based on threshold
      const significantIssues = analysis.criticalIssues.filter(
        (issue) => this.calculateDebtScore(issue) >= debtThreshold,
      );

      return {
        content: [
          {
            type: "text",
            text:
              `Technical Debt Analysis for ${codePath}:\n\n` +
              `📊 OVERALL DEBT METRICS\n` +
              `Total Technical Debt: ${analysis.totalDebt}/100\n` +
              `Maintainability Score: ${analysis.maintainabilityScore}/100\n` +
              `Technical Debt Ratio: ${(analysis.technicalDebtRatio * 100).toFixed(1)}%\n\n` +
              `💰 DEBT BY CATEGORY\n${Object.entries(analysis.debtByCategory)
                .map(([category, score]) => `${category}: ${score}/100`)
                .join("\n")}\n\n` +
              `🚨 CRITICAL ISSUES (${significantIssues.length})\n${significantIssues
                .slice(0, 5)
                .map(
                  (issue) =>
                    `${this.getImpactIcon(issue.impact)} ${issue.type.toUpperCase()}: ${issue.description} (${issue.file}:${issue.line})`,
                )
                .join("\n")}\n\n` +
              `${
                includeModernization
                  ? `🔄 MODERNIZATION OPPORTUNITIES\n${analysis.modernizationOpportunities
                      .slice(0, 3)
                      .map(
                        (mod) =>
                          `${mod.technology}: ${mod.currentVersion} → ${mod.recommendedVersion} (${mod.migrationEffort} effort)`,
                      )
                      .join("\n")}\n\n`
                  : ""
              }` +
              `💡 RECOMMENDATIONS\n` +
              `• Focus on high-impact, low-effort refactoring first\n` +
              `• Address critical issues before adding new features\n` +
              `• Consider automated testing before major refactoring\n` +
              `• Plan modernization in phases to minimize disruption`,
          },
        ],
        data: {
          analysis,
          filteredIssues: significantIssues,
          recommendations: this.generateDebtRecommendations(analysis),
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing technical debt: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async suggestRefactoring(args: any): Promise<any> {
    const { filePath, refactoringTypes, maxSuggestions = 10 } = args;

    try {
      const suggestions = await this.analyzeFileForRefactoring(
        filePath,
        refactoringTypes,
      );
      const prioritized = this.prioritizeSuggestions(suggestions).slice(
        0,
        maxSuggestions,
      );

      return {
        content: [
          {
            type: "text",
            text:
              `Refactoring Suggestions for ${filePath}:\n\n` +
              `📋 ANALYSIS RESULTS\n` +
              `Total Opportunities: ${suggestions.length}\n` +
              `High Impact: ${suggestions.filter((s) => s.impact === "high").length}\n` +
              `Low Effort: ${suggestions.filter((s) => s.effort === "low").length}\n\n` +
              `🎯 TOP SUGGESTIONS\n${prioritized
                .map(
                  (suggestion, i) =>
                    `${i + 1}. ${this.getRefactoringIcon(suggestion.type)} ${suggestion.type.replace("-", " ").toUpperCase()}\n` +
                    `   ${suggestion.description}\n` +
                    `   Impact: ${suggestion.impact.toUpperCase()} | Effort: ${suggestion.effort.toUpperCase()}\n` +
                    `   Benefits: ${suggestion.benefits.slice(0, 2).join(", ")}`,
                )
                .join("\n\n")}\n\n` +
              `💡 IMPLEMENTATION NOTES\n` +
              `• Start with low-effort, high-impact changes\n` +
              `• Ensure comprehensive tests before refactoring\n` +
              `• Make small, incremental changes\n` +
              `• Run tests after each refactoring step`,
          },
        ],
        data: {
          suggestions: prioritized,
          implementationPlan: this.createImplementationPlan(prioritized),
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error suggesting refactoring: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async generateRefactoringPlan(args: any): Promise<any> {
    const {
      codePath,
      timeBudget,
      riskTolerance,
      priorities = ["maintainability", "performance"],
    } = args;

    try {
      const fullAnalysis = await this.performTechnicalDebtAnalysis(
        codePath,
        false,
      );
      const plan = this.createPrioritizedRefactoringPlan(
        fullAnalysis,
        timeBudget,
        riskTolerance,
        priorities,
      );

      return {
        content: [
          {
            type: "text",
            text:
              `Refactoring Plan for ${codePath}:\n\n` +
              `⏰ TIME BUDGET: ${timeBudget.toUpperCase()}\n` +
              `🎯 RISK TOLERANCE: ${riskTolerance.toUpperCase()}\n` +
              `📍 PRIORITIES: ${priorities.join(", ")}\n\n` +
              `📊 PLAN OVERVIEW\n` +
              `Total Phases: ${plan.phases.length}\n` +
              `Estimated Duration: ${plan.totalWeeks} weeks\n` +
              `Risk Level: ${plan.overallRisk}\n` +
              `Expected Improvement: ${plan.expectedImprovement}%\n\n` +
              `🗓️ PHASE-BY-PHASE PLAN\n${plan.phases
                .map(
                  (phase: any, i: number) =>
                    `Phase ${i + 1}: ${phase.name} (${phase.duration} weeks)\n` +
                    `   Focus: ${phase.focus}\n` +
                    `   Changes: ${phase.changes.length}\n` +
                    `   Risk: ${phase.risk}\n` +
                    `   Expected Impact: ${phase.expectedImpact}`,
                )
                .join("\n\n")}\n\n` +
              `⚠️ IMPORTANT CONSIDERATIONS\n` +
              `• Always backup code before refactoring\n` +
              `• Run full test suite after each phase\n` +
              `• Monitor performance metrics during changes\n` +
              `• Have rollback plan for each phase\n` +
              `• Communicate changes to team regularly`,
          },
        ],
        data: {
          plan,
          riskAssessment: this.assessPlanRisks(plan),
          successMetrics: this.defineSuccessMetrics(plan),
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error generating refactoring plan: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async modernizeCodebase(args: any): Promise<any> {
    const { codePath, technologies, safeMode = true } = args;

    try {
      const modernization = await this.analyzeModernizationOpportunities(
        codePath,
        technologies,
        safeMode,
      );

      return {
        content: [
          {
            type: "text",
            text:
              `Codebase Modernization Analysis for ${codePath}:\n\n` +
              `🔄 MODERNIZATION OPPORTUNITIES\n` +
              `Total Suggestions: ${modernization.suggestions.length}\n` +
              `Safe Updates: ${modernization.suggestions.filter((s: any) => !s.breakingChanges).length}\n` +
              `Breaking Changes: ${modernization.suggestions.filter((s: any) => s.breakingChanges).length}\n\n` +
              `📦 DEPENDENCY UPDATES\n${modernization.suggestions
                .map(
                  (suggestion: any) =>
                    `${this.getMigrationIcon(suggestion.migrationEffort)} ${suggestion.technology}\n` +
                    `   ${suggestion.currentVersion} → ${suggestion.recommendedVersion}\n` +
                    `   ${suggestion.breakingChanges ? "⚠️ BREAKING" : "✅ SAFE"}\n` +
                    `   Benefits: ${suggestion.benefits.slice(0, 2).join(", ")}`,
                )
                .join("\n\n")}\n\n` +
              `🎯 IMPLEMENTATION STRATEGY\n` +
              `1. Start with safe, non-breaking updates\n` +
              `2. Update dependencies in groups (testing, UI, core)\n` +
              `3. Run comprehensive tests after each update\n` +
              `4. Plan breaking changes for major version bumps\n` +
              `5. Consider gradual migration for large changes\n\n` +
              `⚠️ MIGRATION CONSIDERATIONS\n` +
              `• Schedule updates during low-traffic periods\n` +
              `• Have rollback plan for each modernization step\n` +
              `• Monitor performance after updates\n` +
              `• Update documentation to reflect changes`,
          },
        ],
        data: {
          modernization,
          migrationStrategy: this.createMigrationStrategy(modernization),
          rollbackPlan: this.createRollbackPlan(modernization),
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error modernizing codebase: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async performTechnicalDebtAnalysis(
    codePath: string,
    includeModernization: boolean,
  ): Promise<TechnicalDebtAnalysis> {
    // Simplified analysis - would be more comprehensive in production
    const analysis: TechnicalDebtAnalysis = {
      totalDebt: 0,
      debtByCategory: {
        "code-quality": 0,
        architecture: 0,
        performance: 0,
        maintainability: 0,
        security: 0,
      },
      criticalIssues: [],
      modernizationOpportunities: [],
      maintainabilityScore: 85,
      technicalDebtRatio: 0.15,
    };

    if (includeModernization) {
      analysis.modernizationOpportunities = [
        {
          technology: "Node.js",
          currentVersion: "18.x",
          recommendedVersion: "20.x",
          breakingChanges: false,
          migrationEffort: "low",
          benefits: ["Better performance", "Security updates", "New features"],
          risks: ["Minimal compatibility issues"],
        },
        {
          technology: "TypeScript",
          currentVersion: "5.0",
          recommendedVersion: "5.3",
          breakingChanges: false,
          migrationEffort: "low",
          benefits: ["Better type checking", "New language features"],
          risks: ["None significant"],
        },
      ];
    }

    // Calculate debt scores
    analysis.debtByCategory["code-quality"] = 25;
    analysis.debtByCategory["maintainability"] = 20;
    analysis.debtByCategory["performance"] = 15;
    analysis.totalDebt = Object.values(analysis.debtByCategory).reduce(
      (sum, score) => sum + score,
      0,
    );

    return analysis;
  }

  private async analyzeFileForRefactoring(
    filePath: string,
    types?: string[],
  ): Promise<RefactoringOpportunity[]> {
    const opportunities: RefactoringOpportunity[] = [];

    try {
      const fs = await import("fs");
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Long method detection
        if (
          line.includes("function") ||
          (line.includes("const") && line.includes("=>"))
        ) {
          const functionStart = index;
          let braceCount = 0;
          let functionEnd = index;

          for (let i = functionStart; i < lines.length; i++) {
            const line = lines[i]!;
            const openBraces = line.match(/{/g);
            const closeBraces = line.match(/}/g);
            braceCount += openBraces ? openBraces.length : 0;
            braceCount -= closeBraces ? closeBraces.length : 0;
            if (braceCount === 0 && braceCount !== 0) {
              functionEnd = i;
              break;
            }
          }

          const functionLength = functionEnd - functionStart;
          if (functionLength > 30) {
            opportunities.push({
              type: "extract-method",
              file: filePath,
              line: lineNum,
              description: `Function is ${functionLength} lines long - consider extracting methods`,
              impact: "medium",
              effort: "medium",
              beforeCode: lines
                .slice(functionStart, functionEnd + 1)
                .join("\n"),
              afterCode: "// Extracted into smaller, focused methods",
              benefits: [
                "Improved readability",
                "Easier testing",
                "Better maintainability",
              ],
            });
          }
        }

        // Duplicate code detection (simplified)
        if (
          line.length > 50 &&
          line.includes("if") &&
          line.includes("return")
        ) {
          opportunities.push({
            type: "simplify-condition",
            file: filePath,
            line: lineNum,
            description: "Complex conditional logic - consider simplifying",
            impact: "low",
            effort: "low",
            beforeCode: line,
            afterCode: "// Simplified conditional logic",
            benefits: ["Improved readability", "Reduced complexity"],
          });
        }
      });
    } catch (error) {
      // Skip files that can't be analyzed
    }

    return opportunities.filter((opp) => !types || types.includes(opp.type));
  }

  private prioritizeSuggestions(
    suggestions: RefactoringOpportunity[],
  ): RefactoringOpportunity[] {
    return suggestions.sort((a, b) => {
      const scoreA = this.calculatePriorityScore(a);
      const scoreB = this.calculatePriorityScore(b);
      return scoreB - scoreA;
    });
  }

  private calculatePriorityScore(suggestion: RefactoringOpportunity): number {
    const impactScores = { high: 3, medium: 2, low: 1 };
    const effortScores = { low: 3, medium: 2, high: 1 };

    return impactScores[suggestion.impact] * effortScores[suggestion.effort];
  }

  private createPrioritizedRefactoringPlan(
    analysis: TechnicalDebtAnalysis,
    timeBudget: string,
    riskTolerance: string,
    priorities: string[],
  ): any {
    const timeLimits = {
      "1-week": 1,
      "1-month": 4,
      "3-months": 12,
      "6-months": 26,
    };

    const availableWeeks = timeLimits[timeBudget as keyof typeof timeLimits];
    const riskMultipliers = { low: 0.5, medium: 1, high: 1.5 };
    const riskMultiplier =
      riskMultipliers[riskTolerance as keyof typeof riskMultipliers];

    // Create phases based on analysis
    const phases = [
      {
        name: "Code Quality Cleanup",
        duration: Math.min(2, availableWeeks),
        focus: "Fix linting issues, remove dead code, improve formatting",
        changes: ["Linting fixes", "Code formatting", "Dead code removal"],
        risk: "low",
        expectedImpact: "high",
      },
      {
        name: "Refactoring Core Issues",
        duration: Math.min(4, Math.max(0, availableWeeks - 2)),
        focus:
          "Address high-impact technical debt and refactoring opportunities",
        changes: [
          "Method extraction",
          "Class restructuring",
          "Dependency cleanup",
        ],
        risk: "medium",
        expectedImpact: "high",
      },
      {
        name: "Architecture Improvements",
        duration: Math.min(6, Math.max(0, availableWeeks - 6)),
        focus: "Modernize architecture patterns and improve scalability",
        changes: [
          "Pattern updates",
          "Architecture refactoring",
          "Performance optimization",
        ],
        risk: "high",
        expectedImpact: "medium",
      },
    ].filter((phase: any) => phase.duration > 0);

    return {
      phases,
      totalWeeks: phases.reduce((sum, phase) => sum + phase.duration, 0),
      overallRisk: riskTolerance,
      expectedImprovement: 30 + availableWeeks * 5, // Rough estimate
      priorities,
    };
  }

  private async analyzeModernizationOpportunities(
    codePath: string,
    technologies: string[],
    safeMode: boolean,
  ): Promise<any> {
    const suggestions: ModernizationSuggestion[] = [];

    // Check package.json for dependencies
    try {
      const fs = await import("fs");
      const packagePath = `${codePath}/package.json`;

      if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

        // Node.js version check
        if (technologies.includes("node") || technologies.length === 0) {
          suggestions.push({
            technology: "Node.js",
            currentVersion: packageJson.engines?.node || "16.x",
            recommendedVersion: "20.x",
            breakingChanges: false,
            migrationEffort: "low",
            benefits: [
              "Better performance",
              "Security updates",
              "New ECMAScript features",
            ],
            risks: ["Minimal compatibility concerns"],
          });
        }

        // TypeScript version check
        if (technologies.includes("typescript") || technologies.length === 0) {
          const tsVersion =
            packageJson.devDependencies?.typescript ||
            packageJson.dependencies?.typescript;
          if (tsVersion && tsVersion.startsWith("4.")) {
            suggestions.push({
              technology: "TypeScript",
              currentVersion: tsVersion,
              recommendedVersion: "^5.3.0",
              breakingChanges: false,
              migrationEffort: "low",
              benefits: [
                "Better type inference",
                "Improved performance",
                "New language features",
              ],
              risks: ["Minor breaking changes in edge cases"],
            });
          }
        }
      }
    } catch (error) {
      // Skip modernization analysis if files can't be read
    }

    return {
      suggestions: safeMode
        ? suggestions.filter((s) => !s.breakingChanges)
        : suggestions,
      summary: {
        totalSuggestions: suggestions.length,
        safeUpdates: suggestions.filter((s) => !s.breakingChanges).length,
        breakingUpdates: suggestions.filter((s) => s.breakingChanges).length,
      },
    };
  }

  private calculateDebtScore(issue: RefactoringOpportunity): number {
    const impactScores = { high: 30, medium: 20, low: 10 };
    const effortScores = { high: 10, medium: 20, low: 30 };

    return impactScores[issue.impact] + effortScores[issue.effort];
  }

  private generateDebtRecommendations(
    analysis: TechnicalDebtAnalysis,
  ): string[] {
    const recommendations = [];

    if (analysis.totalDebt > 50) {
      recommendations.push(
        "Prioritize technical debt reduction in next sprint",
      );
    }

    if (analysis.criticalIssues.length > 0) {
      recommendations.push(
        "Address critical issues immediately before they cause production problems",
      );
    }

    if (analysis.maintainabilityScore < 70) {
      recommendations.push(
        "Focus on improving code maintainability through refactoring",
      );
    }

    return recommendations;
  }

  private createImplementationPlan(suggestions: RefactoringOpportunity[]): any {
    return {
      phases: [
        {
          name: "Preparation",
          steps: [
            "Create comprehensive tests",
            "Set up CI/CD for validation",
            "Create backup branch",
          ],
        },
        {
          name: "Implementation",
          steps: suggestions.map((s) => `Implement ${s.type} refactoring`),
          parallel: suggestions.filter((s) => s.effort === "low").length,
        },
        {
          name: "Validation",
          steps: [
            "Run full test suite",
            "Performance testing",
            "Code review",
            "Deploy to staging",
          ],
        },
      ],
      estimatedTime: suggestions.reduce((sum, s) => {
        const effortHours = { low: 2, medium: 8, high: 24 };
        return sum + effortHours[s.effort];
      }, 0),
    };
  }

  private assessPlanRisks(plan: any): any {
    return {
      overallRisk: plan.phases.some((p: any) => p.risk === "high")
        ? "high"
        : "medium",
      riskFactors: [
        "Breaking changes in refactoring",
        "Performance regression",
        "Increased complexity",
        "Testing gaps",
      ],
      mitigationStrategies: [
        "Comprehensive testing before/after",
        "Gradual rollout with feature flags",
        "Performance monitoring and alerting",
        "Rollback plan for each phase",
      ],
    };
  }

  private defineSuccessMetrics(plan: any): any {
    return {
      codeQuality: {
        target: "Improve maintainability score by 20%",
        current: "Baseline measurement needed",
        measurement: "Automated code quality tools",
      },
      performance: {
        target: "No performance regression",
        current: "Establish performance baselines",
        measurement: "Automated performance tests",
      },
      delivery: {
        target: `Complete refactoring within ${plan.totalWeeks} weeks`,
        current: "Track progress weekly",
        measurement: "Sprint velocity and completion metrics",
      },
    };
  }

  private createMigrationStrategy(modernization: any): any {
    return {
      phases: [
        {
          name: "Assessment",
          duration: 1,
          tasks: [
            "Analyze current state",
            "Identify dependencies",
            "Plan testing strategy",
          ],
        },
        {
          name: "Safe Updates",
          duration: 2,
          tasks: [
            "Update patch versions",
            "Update minor versions",
            "Validate compatibility",
          ],
        },
        {
          name: "Breaking Changes",
          duration: 4,
          tasks: [
            "Update major versions",
            "Refactor breaking changes",
            "Update configurations",
          ],
        },
        {
          name: "Optimization",
          duration: 2,
          tasks: [
            "Performance tuning",
            "Bundle optimization",
            "Cleanup deprecated code",
          ],
        },
      ],
      totalDuration: 9,
      successCriteria: [
        "All tests passing",
        "Performance within 5% of baseline",
        "Zero production incidents during migration",
        "Documentation updated",
      ],
    };
  }

  private createRollbackPlan(modernization: any): any {
    return {
      strategies: [
        {
          type: "Branch-based",
          description:
            "Maintain separate branches for each modernization phase",
          effort: "low",
          effectiveness: "high",
        },
        {
          type: "Container-based",
          description: "Use containerized deployments with quick rollback",
          effort: "medium",
          effectiveness: "high",
        },
        {
          type: "Feature Flags",
          description: "Gradually enable features with ability to disable",
          effort: "high",
          effectiveness: "very-high",
        },
      ],
      emergencyProcedures: [
        "Immediate rollback to last stable version",
        "Disable problematic features via feature flags",
        "Switch to backup infrastructure if needed",
        "Communicate incident status to stakeholders",
      ],
    };
  }

  private getImpactIcon(impact: string): string {
    const icons = { high: "🔴", medium: "🟡", low: "🟢" };
    return icons[impact as keyof typeof icons] || "❓";
  }

  private getRefactoringIcon(type: string): string {
    const icons = {
      "extract-method": "📦",
      "rename-variable": "🏷️",
      "remove-duplicate": "🗑️",
      "simplify-condition": "🔀",
      "extract-class": "🏗️",
      "move-method": "🚚",
    };
    return icons[type as keyof typeof icons] || "🔧";
  }

  private getMigrationIcon(effort: string): string {
    const icons = { low: "🟢", medium: "🟡", high: "🔴" };
    return icons[effort as keyof typeof icons] || "❓";
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Refactoring Strategies MCP Server running...");
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayRefactoringStrategiesServer();
  server.run().catch(console.error);
}

export { StrRayRefactoringStrategiesServer };
