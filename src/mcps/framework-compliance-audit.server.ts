/**
 * StrRay Framework Compliance Audit MCP Server
 *
 * Comprehensive validation of all framework components and Universal Development Codex compliance
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import path from "path";

class StrRayFrameworkComplianceAuditServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "strray-framework-compliance-audit",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    console.log("StrRay Framework Compliance Audit MCP Server initialized");
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "framework-compliance-audit",
            description:
              "Comprehensive validation of all framework components and Universal Development Codex compliance",
            inputSchema: {
              type: "object",
              properties: {
                scope: {
                  type: "string",
                  enum: [
                    "full",
                    "codex",
                    "configuration",
                    "agents",
                    "performance",
                  ],
                  default: "full",
                  description: "Scope of compliance audit",
                },
                detailed: {
                  type: "boolean",
                  default: false,
                  description: "Include detailed findings and recommendations",
                },
              },
            },
          },
          {
            name: "codex-validation",
            description:
              "Validate compliance with Universal Development Codex v1.2.25",
            inputSchema: {
              type: "object",
              properties: {
                terms: {
                  type: "array",
                  items: { type: "number", minimum: 1, maximum: 43 },
                  description: "Specific codex terms to validate (1-43)",
                },
                strict: {
                  type: "boolean",
                  default: true,
                  description: "Enforce strict compliance",
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "framework-compliance-audit":
          return await this.handleFrameworkComplianceAudit(args);
        case "codex-validation":
          return await this.handleCodexValidation(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleFrameworkComplianceAudit(args: any) {
    const scope = args.scope || "full";
    const detailed = args.detailed || false;

    console.log("📋 MCP: Performing framework compliance audit:", {
      scope,
      detailed,
    });

    const auditResults = {
      passed: true,
      criticalIssues: [] as string[],
      warnings: [] as string[],
      complianceScores: {} as Record<string, any>,
      recommendations: [] as string[],
      summary: "",
    };

    try {
      // 1. Configuration Integrity Check
      if (scope === "configuration" || scope === "full") {
        const configResults = await this.auditConfigurationIntegrity();
        auditResults.criticalIssues.push(...configResults.issues);
        auditResults.complianceScores.configuration_integrity =
          configResults.score;
        auditResults.recommendations.push(...configResults.recommendations);
        if (!configResults.passed) auditResults.passed = false;
      }

      // 2. Agent Configuration Audit
      if (scope === "agents" || scope === "full") {
        const agentResults = await this.auditAgentConfigurations();
        auditResults.criticalIssues.push(...agentResults.issues);
        auditResults.complianceScores.agent_configurations = agentResults.score;
        auditResults.recommendations.push(...agentResults.recommendations);
        if (!agentResults.passed) auditResults.passed = false;
      }

      // 3. Codex Compliance Validation
      if (scope === "codex" || scope === "full") {
        const codexResults = await this.auditCodexCompliance();
        auditResults.criticalIssues.push(...codexResults.issues);
        auditResults.warnings.push(...codexResults.warnings);
        auditResults.complianceScores.codex_compliance = codexResults.score;
        auditResults.recommendations.push(...codexResults.recommendations);
        if (!codexResults.passed) auditResults.passed = false;
      }

      // 4. Performance Thresholds Check
      if (scope === "performance" || scope === "full") {
        const perfResults = await this.auditPerformanceThresholds();
        auditResults.warnings.push(...perfResults.warnings);
        auditResults.complianceScores.performance_thresholds =
          perfResults.score;
        auditResults.recommendations.push(...perfResults.recommendations);
        if (!perfResults.passed) auditResults.passed = false;
      }

      // Generate summary
      auditResults.summary = this.generateAuditSummary(auditResults);
    } catch (error) {
      console.error("Compliance audit error:", error);
      auditResults.passed = false;
      auditResults.criticalIssues.push(
        `Audit error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const response = `📋 StrRay Framework Compliance Audit Results

${auditResults.summary}

**Critical Issues:** ${auditResults.criticalIssues.length}
${auditResults.criticalIssues.length > 0 ? auditResults.criticalIssues.map((issue) => `• ❌ ${issue}`).join("\n") : "None"}

**Warnings:** ${auditResults.warnings.length}
${auditResults.warnings.length > 0 ? auditResults.warnings.map((warning) => `• ⚠️ ${warning}`).join("\n") : "None"}

**Compliance Scores:**
${Object.entries(auditResults.complianceScores)
  .map(([key, value]) => `• ${key}: ${value}`)
  .join("\n")}

**Recommendations:**
${auditResults.recommendations.length > 0 ? auditResults.recommendations.map((rec) => `• 💡 ${rec}`).join("\n") : "No recommendations"}

**Overall Status:** ${auditResults.passed ? "✅ COMPLIANT" : "❌ NON-COMPLIANT"}`;

    if (detailed) {
      // Add detailed findings
      const detailedFindings = await this.getDetailedFindings(auditResults);
      return {
        content: [
          { type: "text", text: response },
          {
            type: "text",
            text: `\n📋 Detailed Findings:\n${detailedFindings}`,
          },
        ],
      };
    }

    return {
      content: [{ type: "text", text: response }],
    };
  }

  private async handleCodexValidation(args: any) {
    const terms = args.terms || [];
    const strict = args.strict !== false;

    console.log("📚 MCP: Performing codex validation:", {
      terms: terms.length,
      strict,
    });

    try {
      const results = await this.validateCodexTerms(terms, strict);

      return {
        content: [
          {
            type: "text",
            text: `📚 Codex Validation Results

**Terms Validated:** ${results.validatedCount}/${results.totalTerms}
**Compliance:** ${results.compliancePercentage}%

**Violations:** ${results.violations.length}
${results.violations.length > 0 ? results.violations.map((v) => `• ❌ ${v}`).join("\n") : "None"}

**Recommendations:**
${results.recommendations.map((r) => `• 💡 ${r}`).join("\n")}

**Status:** ${results.passed ? "✅ COMPLIANT" : "❌ VIOLATIONS DETECTED"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Codex validation failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async auditConfigurationIntegrity() {
    const results = {
      passed: true,
      issues: [] as string[],
      score: "PASS",
      recommendations: [] as string[],
    };

    try {
      // Check for required configuration files
      const requiredFiles = [
        ".opencode/oh-my-opencode.json",
        "src/strray/config/manager.py",
        "src/agents/types.ts",
      ];

      let presentCount = 0;
      for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
          presentCount++;
        } else {
          results.issues.push(`Missing configuration file: ${file}`);
          results.recommendations.push(
            `Create ${file} with proper framework configuration`,
          );
        }
      }

      const percentage = Math.round(
        (presentCount / requiredFiles.length) * 100,
      );
      results.score = `${percentage}% (${presentCount}/${requiredFiles.length})`;

      if (percentage < 100) {
        results.passed = false;
        results.score = `FAIL: ${results.score}`;
      }
    } catch (error) {
      results.passed = false;
      results.issues.push(
        `Configuration audit error: ${error instanceof Error ? error.message : String(error)}`,
      );
      results.score = "ERROR";
    }

    return results;
  }

  private async auditAgentConfigurations() {
    const results = {
      passed: true,
      issues: [] as string[],
      score: "0%",
      recommendations: [] as string[],
    };

    try {
      const requiredAgents = [
        "enforcer",
        "architect",
        "orchestrator",
        "bug-triage-specialist",
        "code-reviewer",
        "security-auditor",
        "refactorer",
        "test-architect",
        "log-monitor",
      ];

      let presentCount = 0;
      for (const agent of requiredAgents) {
        const agentFile = `src/agents/${agent}.ts`;
        if (fs.existsSync(agentFile)) {
          presentCount++;
        } else {
          results.issues.push(`Missing agent configuration: ${agent}`);
          results.recommendations.push(
            `Create agent configuration for ${agent}`,
          );
        }
      }

      const percentage = Math.round(
        (presentCount / requiredAgents.length) * 100,
      );
      results.score = `${percentage}% (${presentCount}/${requiredAgents.length})`;

      if (percentage < 80) {
        // Allow some flexibility
        results.passed = false;
      }
    } catch (error) {
      results.passed = false;
      results.issues.push(
        `Agent audit error: ${error instanceof Error ? error.message : String(error)}`,
      );
      results.score = "ERROR";
    }

    return results;
  }

  private async auditCodexCompliance() {
    const results = {
      passed: true,
      issues: [] as string[],
      warnings: [] as string[],
      score: "0%",
      recommendations: [] as string[],
    };

    try {
      // Check if codex terms are referenced in agent configurations
      const agentFiles = [
        "src/agents/enforcer.ts",
        "src/agents/architect.ts",
        "src/agents/code-reviewer.ts",
        "src/agents/orchestrator.ts",
      ];

      let totalTerms = 0;
      let validatedTerms = 0;

      for (const file of agentFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, "utf8");

          // Check for codex term references
          const codexPatterns = [
            /codex/i,
            /Universal Development Codex/i,
            /55-terms/i,
            /error prevention/i,
            /zero-tolerance/i,
          ];

          let fileValidated = 0;
          for (const pattern of codexPatterns) {
            if (pattern.test(content)) {
              fileValidated++;
            }
          }

          validatedTerms += fileValidated;
          totalTerms += codexPatterns.length;
        }
      }

      const percentage =
        totalTerms > 0 ? Math.round((validatedTerms / totalTerms) * 100) : 0;
      results.score = `${percentage}%`;

      if (percentage < 70) {
        results.passed = false;
        results.issues.push("Low codex compliance in agent configurations");
        results.recommendations.push(
          "Enhance agent configurations with codex term references",
        );
      }

      // Check for codex validation files
      if (!fs.existsSync("src/strray/core/codex_loader.py")) {
        results.warnings.push("Missing codex loader implementation");
        results.recommendations.push(
          "Implement codex_loader.py for runtime validation",
        );
      }
    } catch (error) {
      results.passed = false;
      results.issues.push(
        `Codex audit error: ${error instanceof Error ? error.message : String(error)}`,
      );
      results.score = "ERROR";
    }

    return results;
  }

  private async auditPerformanceThresholds() {
    const results = {
      passed: true,
      warnings: [] as string[],
      score: "PASS",
      recommendations: [] as string[],
    };

    try {
      // Check bundle size (if build exists)
      if (fs.existsSync("dist")) {
        const { execSync } = await import("child_process");
        try {
          const sizeOutput = execSync('du -sh dist/ 2>/dev/null || echo "0"', {
            encoding: "utf8",
          });
          const size = sizeOutput.trim().split("	")[0] || "0";

          // Check against 2MB threshold
          if (size.includes("M") && parseFloat(size) > 2.0) {
            results.warnings.push(`Bundle size ${size} exceeds 2MB threshold`);
            results.recommendations.push(
              "Optimize bundle size through code splitting and tree shaking",
            );
            results.passed = false;
          }
        } catch (error) {
          // Size check failed
        }
      }

      // Check for performance monitoring
      if (!fs.existsSync("src/strray/performance/monitor.py")) {
        results.warnings.push("Missing performance monitoring implementation");
        results.recommendations.push(
          "Implement performance monitoring for runtime metrics",
        );
      }
    } catch (error) {
      results.warnings.push(
        `Performance audit error: ${error instanceof Error ? error.message : String(error)}`,
      );
      results.score = "WARNING";
    }

    return results;
  }

  private async validateCodexTerms(specificTerms: number[], strict: boolean) {
    const results = {
      validatedCount: 0,
      totalTerms: 43,
      compliancePercentage: 0,
      violations: [] as string[],
      recommendations: [] as string[],
      passed: true,
    };

    try {
      const termsToValidate =
        specificTerms.length > 0
          ? specificTerms
          : Array.from({ length: 43 }, (_, i) => i + 1);

      // Read agent configurations to check for term implementations
      const agentFiles = [
        "src/agents/enforcer.ts",
        "src/agents/architect.ts",
        "src/agents/code-reviewer.ts",
        "src/agents/orchestrator.ts",
      ];

      for (const term of termsToValidate) {
        let termValidated = false;

        // Check each agent file for term implementation
        for (const file of agentFiles) {
          if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, "utf8");
            if (this.checkTermImplementation(term, content)) {
              termValidated = true;
              break;
            }
          }
        }

        if (termValidated) {
          results.validatedCount++;
        } else if (strict) {
          results.violations.push(`Codex term ${term} not implemented`);
          results.passed = false;
        }
      }

      results.compliancePercentage = Math.round(
        (results.validatedCount / termsToValidate.length) * 100,
      );

      if (results.violations.length > 0) {
        results.recommendations.push(
          "Implement missing codex terms in agent configurations",
        );
      }
    } catch (error) {
      results.passed = false;
      results.violations.push(
        `Codex validation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return results;
  }

  private checkTermImplementation(term: number, content: string): boolean {
    // Simplified term checking - in a real implementation this would be more sophisticated
    const termPatterns: Record<number, RegExp[]> = {
      1: [/progressive.*ready/i, /production.*ready/i],
      2: [/no.*stubs/i, /no.*patches/i],
      3: [/over.*engineer/i, /minimal.*complexity/i],
      4: [/fit.*purpose/i, /production.*level/i],
      5: [/surgical.*fixes/i],
      7: [/resolve.*errors/i, /error.*prevention/i],
      8: [/prevent.*loops/i, /infinite.*loops/i],
      12: [/type.*safety/i],
      26: [/test.*coverage.*85/i],
      43: [/infrastructure.*code.*validation/i],
    };

    const patterns = termPatterns[term] || [];
    return patterns.some((pattern) => pattern.test(content));
  }

  private generateAuditSummary(results: any): string {
    const status = results.passed ? "✅ COMPLIANT" : "❌ NON-COMPLIANT";
    const criticalCount = results.criticalIssues.length;
    const warningCount = results.warnings.length;

    return `**Audit Summary:** ${status}
- Critical Issues: ${criticalCount}
- Warnings: ${warningCount}
- Compliance Areas: ${Object.keys(results.complianceScores).length}`;
  }

  private async getDetailedFindings(results: any): Promise<string> {
    // Generate detailed findings report
    let details = "## Detailed Compliance Findings\n\n";

    details += "### Configuration Integrity\n";
    details += `- Status: ${results.complianceScores.configuration_integrity || "Not checked"}\n\n`;

    details += "### Agent Configurations\n";
    details += `- Status: ${results.complianceScores.agent_configurations || "Not checked"}\n\n`;

    details += "### Codex Compliance\n";
    details += `- Status: ${results.complianceScores.codex_compliance || "Not checked"}\n\n`;

    details += "### Performance Thresholds\n";
    details += `- Status: ${results.complianceScores.performance_thresholds || "Not checked"}\n\n`;

    return details;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Framework Compliance Audit MCP Server started");
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayFrameworkComplianceAuditServer();
  server.run().catch(console.error);
}

export { StrRayFrameworkComplianceAuditServer };
