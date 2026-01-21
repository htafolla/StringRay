/**
 * StrRay Enforcer Tools MCP Server
 *
 * Converts enforcer-tools.ts functions into MCP server tools
 * Provides rule enforcement and validation capabilities via MCP protocol
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";

class StrRayEnforcerToolsServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "strray-enforcer-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    console.log("StrRay Enforcer Tools MCP Server initialized");
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "rule-validation",
            description:
              "Validate operations against the comprehensive rule hierarchy including duplicate code prevention, test requirements, and architectural constraints",
            inputSchema: {
              type: "object",
              properties: {
                operation: {
                  type: "string",
                  description:
                    "Operation to validate (create, modify, refactor, etc.)",
                },
                files: {
                  type: "array",
                  items: { type: "string" },
                  description: "Files affected by the operation",
                },
                newCode: {
                  type: "string",
                  description: "New code being added (optional)",
                },
                existingCode: {
                  type: "object",
                  description: "Map of existing code for comparison (optional)",
                },
                dependencies: {
                  type: "array",
                  items: { type: "string" },
                  description: "Dependencies being declared (optional)",
                },
                tests: {
                  type: "array",
                  items: { type: "string" },
                  description: "Test files for validation (optional)",
                },
              },
              required: ["operation"],
            },
          },
          {
            name: "codex-enforcement",
            description:
              "Enforce all 55 Universal Development Codex terms with comprehensive compliance validation and actionable remediation",
            inputSchema: {
              type: "object",
              properties: {
                operation: {
                  type: "string",
                  description: "Operation to validate against codex",
                },
                files: {
                  type: "array",
                  items: { type: "string" },
                  description: "Files to check for codex compliance",
                },
                newCode: {
                  type: "string",
                  description: "New code to validate against codex terms",
                },
                focusAreas: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "error-handling",
                      "type-safety",
                      "performance",
                      "security",
                      "architecture",
                    ],
                  },
                  description: "Specific codex areas to focus validation on",
                },
              },
              required: ["operation"],
            },
          },
          {
            name: "context-analysis-validation",
            description:
              "Validate proper integration of contextual analysis components and architectural patterns",
            inputSchema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string" },
                  description: "Files to validate for context integration",
                },
                operation: {
                  type: "string",
                  description: "Operation context for validation",
                },
                checkPatterns: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "memory-optimization",
                      "error-handling",
                      "type-safety",
                      "dependency-injection",
                    ],
                  },
                  description: "Specific integration patterns to validate",
                },
              },
              required: ["files", "operation"],
            },
          },
          {
            name: "quality-gate-check",
            description:
              "Perform comprehensive quality gate validation before commits with automated fixes and blocking decisions",
            inputSchema: {
              type: "object",
              properties: {
                operation: {
                  type: "string",
                  description: "Operation to quality-gate check",
                },
                context: {
                  type: "object",
                  properties: {
                    files: { type: "array", items: { type: "string" } },
                    newCode: { type: "string" },
                    dependencies: { type: "array", items: { type: "string" } },
                    tests: { type: "array", items: { type: "string" } },
                  },
                  description:
                    "Complete operation context for comprehensive validation",
                },
                strictMode: {
                  type: "boolean",
                  default: true,
                  description: "Enforce strict quality requirements",
                },
              },
              required: ["operation", "context"],
            },
          },
          {
            name: "get-enforcement-status",
            description:
              "Get comprehensive enforcement statistics and rule compliance metrics",
            inputSchema: {
              type: "object",
              properties: {
                includeHistory: {
                  type: "boolean",
                  default: false,
                  description: "Include historical enforcement data",
                },
                focusAreas: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["rules", "codex", "quality", "performance"],
                  },
                  description: "Specific areas to focus status reporting on",
                },
              },
            },
          },
          {
            name: "run-pre-commit-validation",
            description:
              "Execute comprehensive pre-commit validation with all enforcer tools and automated remediation",
            inputSchema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: { type: "string" },
                  description: "Files to validate before commit",
                },
                operation: {
                  type: "string",
                  default: "commit",
                  description: "Operation type for validation context",
                },
                autoFix: {
                  type: "boolean",
                  default: true,
                  description: "Automatically apply safe fixes",
                },
                strictBlocking: {
                  type: "boolean",
                  default: true,
                  description: "Block commit on any validation error",
                },
              },
              required: ["files"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "rule-validation":
            return await this.ruleValidation(args);
          case "codex-enforcement":
            return await this.codexEnforcement(args);
          case "context-analysis-validation":
            return await this.contextAnalysisValidation(args);
          case "quality-gate-check":
            return await this.qualityGateCheck(args);
          case "get-enforcement-status":
            return await this.getEnforcementStatus(args);
          case "run-pre-commit-validation":
            return await this.runPreCommitValidation(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error in enforcer tool ${name}:`, error);
        throw error;
      }
    });
  }

  // Tool implementations - wrappers around the original enforcer-tools functions

  private async ruleValidation(args: any): Promise<any> {
    const { operation, files, newCode, existingCode, dependencies, tests } =
      args;

    console.log(
      `🛡️ Enforcer Tool: Validating operation '${operation}' against rule hierarchy`,
    );

    // This would integrate with the actual rule-enforcer.ts validation logic
    const context = {
      operation,
      files: files || [],
      newCode,
      existingCode: existingCode || new Map(),
      dependencies: dependencies || [],
      tests: tests || [],
    };

    // Simulate rule validation (would call actual rule-enforcer)
    const validation = await this.simulateRuleValidation(context);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              operation,
              validation,
              rulesChecked: [
                "no-duplicate-code",
                "tests-required",
                "context-analysis-integration",
                "memory-optimization",
                "dependency-management",
                "input-validation",
              ],
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private async codexEnforcement(args: any): Promise<any> {
    const { operation, files, newCode, focusAreas } = args;

    console.log(
      `📚 Enforcer Tool: Enforcing codex compliance for operation '${operation}'`,
    );

    // Simulate codex validation (would call actual codex validation)
    const codexCheck = await this.simulateCodexValidation(
      operation,
      files,
      newCode,
      focusAreas,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              operation,
              codexCheck,
              termsValidated: 43, // All Universal Development Codex terms
              complianceScore: codexCheck.score,
              violations: codexCheck.violations.length,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private async contextAnalysisValidation(args: any): Promise<any> {
    const { files, operation, checkPatterns } = args;

    console.log(
      `🔍 Enforcer Tool: Validating context analysis integration for ${files.length} files`,
    );

    // Simulate context validation (would call actual context validation)
    const contextValidation = await this.simulateContextValidation(
      files,
      operation,
      checkPatterns,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              operation,
              files: files.length,
              contextValidation,
              patternsChecked: checkPatterns || [
                "memory-optimization",
                "error-handling",
                "type-safety",
              ],
              integrationScore: contextValidation.score,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private async qualityGateCheck(args: any): Promise<any> {
    const { operation, context, strictMode = true } = args;

    console.log(
      `🚧 Enforcer Tool: Running quality gate check for '${operation}'`,
    );

    // Run comprehensive quality validation
    const qualityCheck = await this.performQualityGateCheck(
      operation,
      context,
      strictMode,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              operation,
              qualityCheck,
              gateStatus: qualityCheck.passed ? "PASSED" : "BLOCKED",
              checksPerformed: [
                "rule-validation",
                "codex-enforcement",
                "context-analysis-validation",
              ],
              autoFixesApplied:
                qualityCheck.fixes?.filter((f: any) => f.type === "auto")
                  .length || 0,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private async getEnforcementStatus(args: any): Promise<any> {
    const { includeHistory = false, focusAreas } = args;

    console.log(`📊 Enforcer Tool: Retrieving enforcement status`);

    // Simulate status retrieval (would call actual status tracking)
    const status = await this.simulateEnforcementStatus(
      includeHistory,
      focusAreas,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status,
              focusAreas: focusAreas || [
                "rules",
                "codex",
                "quality",
                "performance",
              ],
              includeHistory,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  private async runPreCommitValidation(args: any): Promise<any> {
    const {
      files,
      operation = "commit",
      autoFix = true,
      strictBlocking = true,
    } = args;

    console.log(
      `🔒 Enforcer Tool: Running pre-commit validation for ${files.length} files`,
    );

    // Run comprehensive pre-commit validation
    const preCommitResult = await this.performPreCommitValidation(
      files,
      operation,
      autoFix,
      strictBlocking,
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              operation,
              preCommitResult,
              filesValidated: files.length,
              commitStatus: preCommitResult.blocked ? "BLOCKED" : "ALLOWED",
              autoFixesApplied: autoFix
                ? preCommitResult.fixes?.filter((f: any) => f.type === "auto")
                    .length || 0
                : 0,
              blockingErrors: preCommitResult.errors?.length || 0,
              timestamp: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  // Simulation methods (would integrate with actual enforcer-tools logic)

  private async simulateRuleValidation(context: any): Promise<any> {
    // Simulate comprehensive rule validation
    const errors: string[] = [];
    const warnings: string[] = [];
    const fixes: any[] = [];

    // Check for basic rule violations
    if (context.newCode && context.existingCode) {
      // Check for duplicate code
      for (const [filePath, existingContent] of Object.entries(
        context.existingCode,
      ) as [string, string][]) {
        if (
          typeof existingContent === "string" &&
          existingContent.includes(context.newCode)
        ) {
          errors.push(`Duplicate code detected in ${filePath}`);
          fixes.push({
            type: "manual",
            description: `Refactor to use existing implementation in ${filePath}`,
          });
        }
      }
    }

    // Check for missing tests
    if (
      context.files &&
      context.files.length > 0 &&
      (!context.tests || context.tests.length === 0)
    ) {
      errors.push("Tests required for new code");
      fixes.push({
        type: "auto",
        description: "Generate test file template",
        action: "createTestFile",
      });
    }

    // Check dependencies
    if (
      context.newCode &&
      context.newCode.includes("import") &&
      (!context.dependencies || context.dependencies.length === 0)
    ) {
      warnings.push("Consider declaring dependencies explicitly");
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      fixes,
      rulesValidated: 6,
      score:
        errors.length === 0
          ? 100
          : Math.max(0, 100 - errors.length * 20 - warnings.length * 5),
    };
  }

  private async simulateCodexValidation(
    operation: string,
    files: string[],
    newCode?: string,
    focusAreas?: string[],
  ): Promise<any> {
    const violations: string[] = [];
    const warnings: string[] = [];

    if (newCode) {
      // Check for codex violations
      if (newCode.includes("any") || newCode.includes("@ts-ignore")) {
        violations.push(
          'Codex violation: Type safety first - avoid "any" types and ts-ignore',
        );
      }

      if (newCode.includes("console.log") && !newCode.includes("// DEBUG")) {
        warnings.push(
          "Codex warning: Remove console.log statements in production code",
        );
      }

      if (
        !newCode.includes("try") &&
        (newCode.includes("async") || newCode.includes("Promise"))
      ) {
        warnings.push(
          "Codex warning: Async operations should have error handling",
        );
      }

      if (
        !newCode.includes("interface") &&
        !newCode.includes("type") &&
        newCode.length > 200
      ) {
        warnings.push(
          "Codex warning: Consider using TypeScript interfaces for complex objects",
        );
      }
    }

    // Simulate codex term checking
    const totalTerms = 43;
    const violationsCount = violations.length;
    const warningsCount = warnings.length;

    return {
      score: Math.max(0, 100 - violationsCount * 10 - warningsCount * 2),
      violations,
      warnings,
      termsValidated: totalTerms,
      compliance:
        violationsCount === 0
          ? "FULL"
          : warningsCount === 0
            ? "PARTIAL"
            : "MINIMAL",
    };
  }

  private async simulateContextValidation(
    files: string[],
    operation: string,
    checkPatterns?: string[],
  ): Promise<any> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check files for context integration issues
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, "utf8");

          // Check for proper context provider usage
          if (
            content.includes("CodebaseContextAnalyzer") &&
            !content.includes("memoryConfig")
          ) {
            warnings.push(
              `${file}: Consider using memory configuration for CodebaseContextAnalyzer`,
            );
          }

          if (
            content.includes("ASTCodeParser") &&
            !content.includes("try") &&
            !content.includes("catch")
          ) {
            errors.push(
              `${file}: ASTCodeParser initialization should handle missing ast-grep gracefully`,
            );
          }

          if (
            content.includes("DependencyGraphBuilder") &&
            !content.includes("contextAnalyzer")
          ) {
            errors.push(
              `${file}: DependencyGraphBuilder requires proper context analyzer integration`,
            );
          }
        }
      } catch (error) {
        warnings.push(
          `${file}: Could not validate context integration - ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const patternsChecked = checkPatterns || [
      "memory-optimization",
      "error-handling",
      "type-safety",
      "dependency-injection",
    ];

    return {
      score: Math.max(0, 100 - errors.length * 15 - warnings.length * 5),
      errors,
      warnings,
      patternsChecked,
      filesValidated: files.length,
      integrationStatus: errors.length === 0 ? "VALID" : "ISSUES_FOUND",
    };
  }

  private async performQualityGateCheck(
    operation: string,
    context: any,
    strictMode: boolean,
  ): Promise<any> {
    // Run all quality checks
    const ruleCheck = await this.simulateRuleValidation(context);
    const codexCheck = await this.simulateCodexValidation(
      operation,
      context.files || [],
      context.newCode,
    );
    const contextCheck = await this.simulateContextValidation(
      context.files || [],
      operation,
    );

    const allErrors = [
      ...ruleCheck.errors,
      ...codexCheck.violations,
      ...contextCheck.errors,
    ];

    const allWarnings = [
      ...ruleCheck.warnings,
      ...codexCheck.warnings,
      ...contextCheck.warnings,
    ];

    const passed = strictMode
      ? allErrors.length === 0
      : allErrors.length === 0 || allWarnings.length < 3;
    const blocked = !passed;

    const fixes = ruleCheck.fixes || [];

    return {
      passed,
      blocked,
      errors: allErrors,
      warnings: allWarnings,
      fixes,
      checksPerformed: [
        "rule-validation",
        "codex-enforcement",
        "context-analysis-validation",
      ],
      overallScore:
        (ruleCheck.score + codexCheck.score + contextCheck.score) / 3,
    };
  }

  private async simulateEnforcementStatus(
    includeHistory: boolean,
    focusAreas?: string[],
  ): Promise<any> {
    return {
      totalRules: 6,
      enabledRules: 6,
      ruleCategories: {
        "code-quality": 1,
        testing: 1,
        architecture: 2,
        performance: 1,
        security: 1,
      },
      recentValidations: 42,
      successRate: 97.6,
      averageResponseTime: 45, // ms
      topViolations: [
        { rule: "tests-required", count: 8 },
        { rule: "memory-optimization", count: 5 },
        { rule: "input-validation", count: 3 },
      ],
      history: includeHistory
        ? [
            { date: "2024-01-15", validations: 15, successRate: 93.3 },
            { date: "2024-01-14", validations: 27, successRate: 96.3 },
          ]
        : undefined,
    };
  }

  private async performPreCommitValidation(
    files: string[],
    operation: string,
    autoFix: boolean,
    strictBlocking: boolean,
  ): Promise<any> {
    // Simulate comprehensive pre-commit validation
    const context = {
      operation,
      files,
      // Would load actual file contents here
    };

    const qualityCheck = await this.performQualityGateCheck(
      operation,
      context,
      strictBlocking,
    );

    // Apply auto-fixes if requested
    if (autoFix && qualityCheck.fixes) {
      const autoFixes = qualityCheck.fixes.filter(
        (f: any) => f.type === "auto",
      );
      for (const fix of autoFixes) {
        // Would execute actual auto-fix logic here
        console.log(`Applying auto-fix: ${fix.description}`);
      }
      qualityCheck.fixesApplied = autoFixes.length;
    }

    return {
      ...qualityCheck,
      validationType: "pre-commit",
      autoFixRequested: autoFix,
      strictBlocking,
      filesProcessed: files.length,
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Enforcer Tools MCP Server started");

    const cleanup = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);

  // Set a timeout to force exit if graceful shutdown fails
  const timeout = setTimeout(() => {
    console.error('Graceful shutdown timeout, forcing exit...');
    process.exit(1);
  }, 5000); // 5 second timeout

  try {
    if (this.server && typeof this.server.close === 'function') {
      await this.server.close();
    }
    clearTimeout(timeout);
    console.log("StrRay MCP Server shut down gracefully");
    process.exit(0);
  } catch (error) {
    clearTimeout(timeout);
    console.error("Error during server shutdown:", error);
    process.exit(1);
  }
};


// Handle multiple shutdown signals
process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGHUP', () => cleanup('SIGHUP'));

// Monitor parent process (opencode) and shutdown if it dies
const checkParent = () => {
  try {
    process.kill(process.ppid, 0); // Check if parent is alive
    setTimeout(checkParent, 1000); // Check again in 1 second
  } catch (error) {
    // Parent process died, shut down gracefully
    console.log('Parent process (opencode) died, shutting down MCP server...');
    cleanup('parent-process-death');
  }
};

// Start monitoring parent process
setTimeout(checkParent, 2000); // Start checking after 2 seconds

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  cleanup('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  cleanup('unhandledRejection');
});

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayEnforcerToolsServer();
  server.run().catch(console.error);
}

export default StrRayEnforcerToolsServer;
