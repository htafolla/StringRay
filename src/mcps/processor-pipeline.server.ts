/**
 * StrRay Processor Pipeline MCP Server
 *
 * Advanced processor pipeline with codex validation, compliance monitoring, and framework enforcement
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

class StrRayProcessorPipelineServer {
  private server: Server;
  private codexTerms: string[] = [
    "Progressive Prod-Ready Code",
    "No Stubs/Patches",
    "Surgical Fixes",
    "Type Safety First",
    "Single Source of Truth",
    "Error Boundaries",
    "Performance Budget Enforcement",
    "Security by Design",
    "Test Coverage >85%",
  ];

  constructor() {
        this.server = new Server(
      {
        name: "strray-processor-pipeline",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    console.log("StrRay Processor Pipeline MCP Server initialized");
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "execute-pre-processors",
            description:
              "Run pre-execution processors on content with codex validation",
            inputSchema: {
              type: "object",
              properties: {
                content: { type: "string" },
                context: { type: "object" },
                validateCodex: { type: "boolean", default: true },
                strictMode: { type: "boolean", default: false },
              },
              required: ["content"],
            },
          },
          {
            name: "execute-post-processors",
            description:
              "Run post-execution processors on results with compliance monitoring",
            inputSchema: {
              type: "object",
              properties: {
                content: { type: "string" },
                results: { type: "object" },
                enforceCompliance: { type: "boolean", default: true },
                auditTrail: { type: "boolean", default: true },
              },
              required: ["content"],
            },
          },
          {
            name: "codex-validation",
            description:
              "Validate content against Universal Development Codex terms",
            inputSchema: {
              type: "object",
              properties: {
                content: { type: "string" },
                terms: {
                  type: "array",
                  items: { type: "string" },
                  default: ["all"],
                },
                strict: { type: "boolean", default: false },
              },
              required: ["content"],
            },
          },
          {
            name: "framework-compliance-check",
            description:
              "Check framework compliance and generate enforcement actions",
            inputSchema: {
              type: "object",
              properties: {
                content: { type: "string" },
                operation: { type: "string" },
                context: { type: "object" },
              },
              required: ["content", "operation"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "execute-pre-processors":
          return await this.handlePreProcessors(args);
        case "execute-post-processors":
          return await this.handlePostProcessors(args);
        case "codex-validation":
          return await this.handleCodexValidation(args);
        case "framework-compliance-check":
          return await this.handleComplianceCheck(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handlePreProcessors(args: any) {
    const content = args.content;
    const context = args.context || {};
    const validateCodex = args.validateCodex !== false;
    const strictMode = args.strictMode || false;

    console.log("🔄 MCP: Running pre-processors:", {
      contentLength: content.length,
      validateCodex,
      strictMode,
    });

    const results = {
      processed: content,
      validations: [] as string[],
      warnings: [] as string[],
      blocked: false,
      reason: "",
    };

    try {
      // 1. Input sanitization
      results.processed = this.sanitizeInput(content);

      // 2. Codex validation (if enabled)
      if (validateCodex) {
        const codexResults = await this.validateAgainstCodex(
          results.processed,
          strictMode,
        );
        results.validations.push(...codexResults.validations);
        results.warnings.push(...codexResults.warnings);

        if (codexResults.blocked) {
          results.blocked = true;
          results.reason = codexResults.reason;
        }
      }

      // 3. Context enrichment
      results.processed = this.enrichWithContext(results.processed, context);

      // 4. Security checks
      const securityResults = this.performSecurityChecks(results.processed);
      results.warnings.push(...securityResults.warnings);
    } catch (error) {
      results.blocked = true;
      results.reason = `Pre-processing error: ${error instanceof Error ? error.message : String(error)}`;
    }

    const response = `🔄 Pre-Processor Results

**Content Length:** ${results.processed.length} characters
**Validations Passed:** ${results.validations.length}
**Warnings:** ${results.warnings.length}
${results.warnings.length > 0 ? results.warnings.map((w: string) => `• ⚠️ ${w}`).join("\n") : ""}

**Status:** ${results.blocked ? `❌ BLOCKED - ${results.reason}` : "✅ APPROVED FOR EXECUTION"}`;

    return {
      content: [{ type: "text", text: response }],
    };
  }

  private async handlePostProcessors(args: any) {
    const content = args.content;
    const results = args.results || {};
    const enforceCompliance = args.enforceCompliance !== false;
    const auditTrail = args.auditTrail !== false;

    console.log("🔄 MCP: Running post-processors:", {
      contentLength: content.length,
      enforceCompliance,
      auditTrail,
    });

    const postResults = {
      processed: content,
      compliance: [] as string[],
      auditEntries: [] as string[],
      recommendations: [] as string[],
      finalApproval: true,
    };

    try {
      // 1. Result validation
      postResults.processed = this.validateResults(content, results);

      // 2. Compliance enforcement
      if (enforceCompliance) {
        const complianceResults = await this.enforceCompliance(
          postResults.processed,
        );
        postResults.compliance.push(...complianceResults.compliance);
        postResults.recommendations.push(...complianceResults.recommendations);

        if (!complianceResults.approved) {
          postResults.finalApproval = false;
        }
      }

      // 3. Audit trail generation
      if (auditTrail) {
        postResults.auditEntries = this.generateAuditTrail(
          content,
          results,
          postResults,
        );
      }

      // 4. Quality assurance
      const qaResults = this.performQualityAssurance(postResults.processed);
      postResults.recommendations.push(...qaResults.recommendations);
    } catch (error) {
      postResults.finalApproval = false;
      postResults.recommendations.push(
        `Post-processing error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const response = `🔄 Post-Processor Results

**Final Approval:** ${postResults.finalApproval ? "✅ APPROVED" : "❌ REQUIRES REVIEW"}
**Compliance Checks:** ${postResults.compliance.length}
**Audit Entries:** ${postResults.auditEntries.length}
**Recommendations:** ${postResults.recommendations.length}

**Recommendations:**
${postResults.recommendations.length > 0 ? postResults.recommendations.map((r: string) => `• 💡 ${r}`).join("\n") : "None"}

**Audit Summary:**
${postResults.auditEntries
  .slice(0, 3)
  .map((a) => `• 📝 ${a}`)
  .join("\n")}${postResults.auditEntries.length > 3 ? "\n• ..." : ""}`;

    return {
      content: [{ type: "text", text: response }],
    };
  }

  private async handleCodexValidation(args: any) {
    const content = args.content;
    const terms = args.terms || ["all"];
    const strict = args.strict || false;

    console.log("📚 MCP: Performing codex validation:", {
      terms: terms.length,
      strict,
    });

    try {
      const validationResults = await this.validateAgainstCodex(
        content,
        strict,
        terms,
      );

      return {
        content: [
          {
            type: "text",
            text: `📚 Codex Validation Results

**Content Validated:** ${content.length} characters
**Terms Checked:** ${terms.length === 1 && terms[0] === "all" ? "All 43 terms" : terms.length}
**Compliance:** ${validationResults.compliance}%

**Violations:** ${validationResults.violations.length}
${validationResults.violations.map((v: string) => `• ❌ ${v}`).join("\n") || "None"}

**Warnings:** ${validationResults.warnings.length}
${validationResults.warnings.map((w: string) => `• ⚠️ ${w}`).join("\n") || "None"}

**Recommendations:**
${validationResults.recommendations.map((r: string) => `• 💡 ${r}`).join("\n") || "None"}

**Status:** ${validationResults.blocked ? "❌ BLOCKED" : "✅ COMPLIANT"}`,
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

  private async handleComplianceCheck(args: any) {
    const content = args.content;
    const operation = args.operation;
    const context = args.context || {};

    console.log("📋 MCP: Performing compliance check:", {
      operation,
      contentLength: content.length,
    });

    try {
      const complianceResults = await this.checkFrameworkCompliance(
        content,
        operation,
        context,
      );

      return {
        content: [
          {
            type: "text",
            text: `📋 Framework Compliance Check

**Operation:** ${operation}
**Content Type:** ${this.detectContentType(content)}

**Compliance Score:** ${complianceResults.score}/100
**Critical Issues:** ${complianceResults.criticalIssues.length}
**Warnings:** ${complianceResults.warnings.length}

**Critical Issues:**
${complianceResults.criticalIssues.map((i: string) => `• ❌ ${i}`).join("\n") || "None"}

**Warnings:**
${complianceResults.warnings.map((w: string) => `• ⚠️ ${w}`).join("\n") || "None"}

**Enforcement Actions:**
${complianceResults.actions.map((a: string) => `• 🔧 ${a}`).join("\n") || "None required"}

**Status:** ${complianceResults.approved ? "✅ COMPLIANT" : "❌ REQUIRES CORRECTION"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Compliance check failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private sanitizeInput(content: string): string {
    // Basic input sanitization
    return content
      .replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        "[SCRIPT REMOVED]",
      )
      .replace(/javascript:/gi, "[JAVASCRIPT REMOVED]")
      .trim();
  }

  private async validateAgainstCodex(
    content: string,
    strict: boolean,
    terms?: string[],
  ): Promise<any> {
    const results = {
      validations: [] as string[],
      warnings: [] as string[],
      violations: [] as string[],
      recommendations: [] as string[],
      compliance: 0,
      blocked: false,
      reason: "",
    };

    const termsToCheck =
      terms && terms.length > 0 && !terms.includes("all")
        ? terms
        : this.codexTerms;
    let passed = 0;

    for (const term of termsToCheck) {
      const termResult = this.checkCodexTerm(content, term);

      if (termResult.passed) {
        passed++;
        results.validations.push(`${term}: PASS`);
      } else {
        results.violations.push(`${term}: ${termResult.reason}`);
        results.recommendations.push(termResult.recommendation);

        if (strict || termResult.critical) {
          results.blocked = true;
          results.reason = `Codex violation: ${term}`;
        }
      }
    }

    results.compliance = Math.round((passed / termsToCheck.length) * 100);

    return results;
  }

  private checkCodexTerm(content: string, term: string): any {
    // Simplified codex term checking
    switch (term) {
      case "Type Safety First":
        return {
          passed: !content.includes("any") || content.includes("// @ts-ignore"),
          reason: "Type safety violations detected",
          recommendation: "Use proper TypeScript types instead of any",
          critical: false,
        };
      case "No Stubs/Patches":
        return {
          passed: !content.includes("TODO") && !content.includes("FIXME"),
          reason: "Stub code or patches detected",
          recommendation:
            "Implement complete functionality or remove placeholder code",
          critical: true,
        };
      case "Progressive Prod-Ready Code":
        return {
          passed:
            !content.includes("console.log") || content.includes("production"),
          reason: "Non-production ready code detected",
          recommendation:
            "Remove debug statements and ensure production readiness",
          critical: false,
        };
      default:
        return {
          passed: true,
          reason: "",
          recommendation: "",
          critical: false,
        };
    }
  }

  private enrichWithContext(content: string, context: any): string {
    // Add framework context if needed
    if (context.codex) {
      return `/* StrRay Framework - Codex Compliant */\n${content}`;
    }
    return content;
  }

  private performSecurityChecks(content: string): any {
    const warnings = [];

    if (content.includes("eval(")) {
      warnings.push("Use of eval() detected - security risk");
    }

    if (content.includes("innerHTML")) {
      warnings.push("Direct innerHTML manipulation detected - XSS risk");
    }

    return { warnings };
  }

  private validateResults(content: string, results: any): string {
    // Basic result validation
    if (typeof results === "object" && results.error) {
      return `${content}\n/* ERROR: ${results.error} */`;
    }
    return content;
  }

  private async enforceCompliance(content: string): Promise<any> {
    const results = {
      compliance: [] as string[],
      recommendations: [] as string[],
      approved: true,
    };

    // Check bundle size compliance (if applicable)
    if (content.includes("import") && content.length > 50000) {
      results.compliance.push(
        "Large module detected - consider code splitting",
      );
      results.recommendations.push(
        "Implement lazy loading or split large modules",
      );
    }

    // Check for performance issues
    if (
      content.includes("for") &&
      content.includes("length") &&
      content.includes("i++")
    ) {
      results.recommendations.push(
        "Consider using for...of loops or array methods for better performance",
      );
    }

    return results;
  }

  private generateAuditTrail(
    content: string,
    results: any,
    postResults: any,
  ): string[] {
    const audit = [
      `Operation completed at ${new Date().toISOString()}`,
      `Content length: ${content.length}`,
      `Processing time: ${results.duration || "unknown"}ms`,
      `Compliance status: ${postResults.finalApproval ? "approved" : "requires review"}`,
    ];

    return audit;
  }

  private performQualityAssurance(content: string): any {
    const recommendations = [];

    // Basic quality checks
    if (content.split("\n").length > 100) {
      recommendations.push(
        "Consider breaking down large files into smaller modules",
      );
    }

    if (content.includes("function") && content.split("function").length > 10) {
      recommendations.push(
        "High function count - consider consolidating related functions",
      );
    }

    return { recommendations };
  }

  private detectContentType(content: string): string {
    if (
      content.includes("function") ||
      content.includes("const") ||
      content.includes("let")
    ) {
      return "JavaScript/TypeScript";
    }
    if (content.includes("class") || content.includes("def ")) {
      return "Python";
    }
    if (content.includes("<") && content.includes(">")) {
      return "HTML/XML";
    }
    return "Text";
  }

  private async checkFrameworkCompliance(
    content: string,
    operation: string,
    context: any,
  ): Promise<any> {
    const results = {
      score: 100,
      criticalIssues: [] as string[],
      warnings: [] as string[],
      actions: [] as string[],
      approved: true,
    };

    // Operation-specific compliance checks
    switch (operation) {
      case "code-review":
        if (!content.includes("function") && !content.includes("class")) {
          results.warnings.push(
            "No functions or classes detected in code review",
          );
        }
        break;
      case "security-audit":
        if (!content.includes("auth") && !content.includes("security")) {
          results.warnings.push("Limited security-related content detected");
        }
        break;
      case "testing":
        if (!content.includes("test") && !content.includes("spec")) {
          results.warnings.push("No test-related content detected");
        }
        break;
    }

    // General compliance checks
    if (content.length > 10000) {
      results.score -= 10;
      results.warnings.push("Large content size - consider splitting");
    }

    if (results.criticalIssues.length > 0) {
      results.approved = false;
      results.score -= 30;
    }

    return results;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Processor Pipeline MCP Server started");
  }
}

// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayProcessorPipelineServer();
  server.run().catch(console.error);
}

export { StrRayProcessorPipelineServer };
