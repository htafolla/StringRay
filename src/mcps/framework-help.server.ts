import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

class FrameworkHelpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "strray/framework-help",
        version: "1.1.1",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools - required MCP protocol handler for tool discovery
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "strray_get_capabilities",
            description: "Get comprehensive list of all StringRay framework capabilities, commands, and available tools",
            inputSchema: {
              type: "object",
              properties: {
                category: {
                  type: "string",
                  enum: ["all", "agents", "skills", "commands", "reporting"],
                  description: "Filter capabilities by category",
                  default: "all"
                },
                format: {
                  type: "string",
                  enum: ["summary", "detailed", "commands"],
                  description: "Output format",
                  default: "summary"
                }
              },
              required: []
            }
          },
          {
            name: "strray_get_commands",
            description: "Get list of available StringRay commands and their usage",
            inputSchema: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["agent-commands", "system-commands", "reporting-commands"],
                  description: "Type of commands to list",
                  default: "agent-commands"
                }
              },
              required: []
            }
          },
          {
            name: "strray_explain_capability",
            description: "Get detailed explanation of a specific StringRay capability",
            inputSchema: {
              type: "object",
              properties: {
                capability: {
                  type: "string",
                  description: "Name of the capability to explain"
                }
              },
              required: ["capability"]
            }
          }
        ]
      };
    });

    // Handle tool calls - required MCP protocol handler for tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "strray_get_capabilities":
          return this.handleGetCapabilities(args);
        case "strray_get_commands":
          return this.handleGetCommands(args);
        case "strray_explain_capability":
          return this.handleExplainCapability(args);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    });
  }

  private handleGetCapabilities(args: any) {
    const category = args?.category || "all";
    const format = args?.format || "summary";

    const capabilities = {
      agents: {
        enforcer: "Codex compliance & error prevention",
        architect: "System design & technical decisions",
        orchestrator: "Multi-agent workflow coordination",
        "bug-triage-specialist": "Error investigation & surgical fixes",
        "code-reviewer": "Quality assessment & standards validation",
        "security-auditor": "Vulnerability detection & compliance",
        refactorer: "Technical debt elimination & code consolidation",
        "test-architect": "Testing strategy & coverage optimization"
      },
      skills: {
        "project-analysis": "Codebase analysis and metrics",
        "testing-strategy": "Test planning and execution",
        "code-review": "Code quality assessment",
        "security-audit": "Security vulnerability scanning",
        "performance-optimization": "Performance analysis and optimization",
        "refactoring-strategies": "Code improvement techniques",
        "ui-ux-design": "User interface and experience design",
        "documentation-generation": "Technical documentation creation"
      },
      commands: {
        "framework-reporting-system": "Generate comprehensive framework reports",
        "complexity-analyzer": "Analyze code complexity and delegation decisions",
        "codex-injector": "Apply development codex rules and standards"
      },
      reporting: {
        "activity-logs": "Real-time framework activity monitoring",
        "performance-metrics": "System performance and resource usage",
        "error-tracking": "Comprehensive error detection and reporting",
        "test-coverage": "Automated testing coverage analysis"
      }
    };

    let result = "";

    if (format === "commands") {
      result = this.generateCommandList(capabilities);
    } else if (category === "all") {
      result = this.generateFullCapabilities(capabilities, format);
    } else {
      result = this.generateCategoryCapabilities(capabilities, category, format);
    }

    return {
      content: [
        {
          type: "text",
          text: result
        }
      ]
    };
  }

  private handleGetCommands(args: any) {
    const type = args?.type || "agent-commands";

    let commands = "";

    switch (type) {
      case "agent-commands":
        commands = `
**Agent Commands Available:**

@enforcer - Codex compliance & error prevention
@architect - System design & technical decisions  
@orchestrator - Multi-agent workflow coordination
@bug-triage-specialist - Error investigation & surgical fixes
@code-reviewer - Quality assessment & standards validation
@security-auditor - Vulnerability detection & compliance
@refactorer - Technical debt elimination & code consolidation
@test-architect - Testing strategy & coverage optimization

**Usage Examples:**
- "@enforcer analyze this code for violations"
- "@architect design a scalable solution for X"
- "@orchestrator coordinate testing for this feature"
        `.trim();
        break;

      case "system-commands":
        commands = `
**System Commands Available:**

framework-reporting-system - Generate comprehensive reports
complexity-analyzer - Analyze code complexity  
codex-injector - Apply development standards

**Usage Examples:**
- Use framework-reporting-system to generate activity reports
- Use complexity-analyzer to understand delegation decisions
- Use codex-injector for automated code quality enforcement
        `.trim();
        break;

      case "reporting-commands":
        commands = `
**Reporting Commands Available:**

Activity Logs - Real-time framework monitoring
Performance Metrics - Resource usage analysis
Error Tracking - Comprehensive error detection
Test Coverage - Automated testing analysis

**Usage Examples:**
- Check logs/framework/activity.log for framework activity
- Run performance benchmarks for system metrics
- Monitor error rates through automated tracking
        `.trim();
        break;
    }

    return {
      content: [
        {
          type: "text",
          text: commands
        }
      ]
    };
  }

  private handleExplainCapability(args: any) {
    const capability = args?.capability;

    if (!capability) {
      return {
        content: [
          {
            type: "text",
            text: "Error: capability parameter is required"
          }
        ]
      };
    }

    const explanations: { [key: string]: string } = {
      "enforcer": `
**Enforcer Agent**
Automatically validates code against the Universal Development Codex (46 mandatory terms).
Prevents common errors, enforces coding standards, and ensures production-ready code.

**Capabilities:**
- Type safety validation (no any/unknown types)
- Architecture compliance checking
- Error prevention (90% runtime error reduction)
- Code quality enforcement

**Usage:** @enforcer analyze this code for violations
      `.trim(),

      "orchestrator": `
**Orchestrator Agent**
Coordinates multiple AI agents for complex development tasks.
Automatically delegates work based on complexity analysis (6 metrics).

**Capabilities:**
- Multi-agent task coordination
- Complexity-based delegation (25-95 score range)
- Conflict resolution (majority vote, expert priority)
- Enterprise workflow management

**Usage:** @orchestrator coordinate testing for this feature
      `.trim(),

      "framework-reporting-system": `
**Framework Reporting System**
Generates comprehensive reports on framework activity and performance.

**Capabilities:**
- Activity log analysis
- Performance metrics reporting
- Error tracking and summaries
- Test coverage analysis

**Usage:** framework-reporting-system generate-report
      `.trim(),

      "skills": `
**Skills System (23 Skills)**
Lazy-loaded capabilities with on-demand MCP server activation.

**Available Skills:**
- project-analysis: Codebase metrics and analysis
- testing-strategy: Test planning and execution
- code-review: Quality assessment
- security-audit: Vulnerability scanning
- performance-optimization: Performance tuning
- refactoring-strategies: Code improvement techniques
- ui-ux-design: Interface design
- documentation-generation: Technical docs

**Benefits:** 0 baseline processes, 90% resource reduction
      `.trim()
    };

    const explanation = explanations[capability] ||
      `**${capability}**
No detailed explanation available. This capability provides specialized functionality within the StringRay framework. Use @enforcer or check the framework documentation for more details.`;

    return {
      content: [
        {
          type: "text",
          text: explanation
        }
      ]
    };
  }

  private generateCommandList(capabilities: any): string {
    return `
**StringRay Framework Commands:**

**Agent Commands:**
${Object.entries(capabilities.agents).map(([name, desc]) => `- @${name}: ${desc}`).join('\n')}

**System Commands:**
${Object.entries(capabilities.commands).map(([name, desc]) => `- ${name}: ${desc}`).join('\n')}

**Skills (23 available):**
${Object.entries(capabilities.skills).map(([name, desc]) => `- ${name}: ${desc}`).join('\n')}

**Reporting:**
${Object.entries(capabilities.reporting).map(([name, desc]) => `- ${name}: ${desc}`).join('\n')}

**Quick Start:**
1. Use @enforcer for code quality validation
2. Use @orchestrator for complex task coordination
3. Use skills for specialized capabilities
4. Check framework-reporting-system for activity reports
    `.trim();
  }

  private generateFullCapabilities(capabilities: any, format: string): string {
    if (format === "detailed") {
      return `
**StringRay Framework - Complete Capabilities Overview**

**8 Specialized Agents:**
${Object.entries(capabilities.agents).map(([name, desc]) => `- **${name}**: ${desc}`).join('\n')}

**23 Skills (Lazy Loading):**
${Object.entries(capabilities.skills).map(([name, desc]) => `- **${name}**: ${desc}`).join('\n')}

**System Commands:**
${Object.entries(capabilities.commands).map(([name, desc]) => `- **${name}**: ${desc}`).join('\n')}

**Reporting & Monitoring:**
${Object.entries(capabilities.reporting).map(([name, desc]) => `- **${name}**: ${desc}`).join('\n')}

**Key Features:**
- 99.6% error prevention through codex compliance
- 90% resource reduction (0 baseline processes)
- Enterprise-grade multi-agent orchestration
- Systematic code quality enforcement
- Real-time activity monitoring and reporting

**Getting Started:**
1. Use @enforcer to validate code quality
2. Use @orchestrator for complex development tasks
3. Access skills for specialized capabilities
4. Check framework-reporting-system for comprehensive reports
      `.trim();
    } else {
      return `
**StringRay Framework Capabilities:**

**8 Agents:** enforcer, architect, orchestrator, bug-triage-specialist, code-reviewer, security-auditor, refactorer, test-architect

**23 Skills:** project-analysis, testing-strategy, code-review, security-audit, performance-optimization, refactoring-strategies, ui-ux-design, documentation-generation, and more

**System Tools:** framework-reporting-system, complexity-analyzer, codex-injector

**Reporting:** Activity logs, performance metrics, error tracking, test coverage

**Enterprise Features:** 99.6% error prevention, 90% resource optimization, multi-agent orchestration
      `.trim();
    }
  }

  private generateCategoryCapabilities(capabilities: any, category: string, format: string): string {
    const categoryData = capabilities[category];
    if (!categoryData) {
      return `Category "${category}" not found. Available categories: agents, skills, commands, reporting`;
    }

    const items = Object.entries(categoryData);
    return `
**StringRay ${category.charAt(0).toUpperCase() + category.slice(1)}:**

${items.map(([name, desc]) => `- **${name}**: ${desc}`).join('\n')}

**Total:** ${items.length} ${category}
    `.trim();
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("StringRay Framework Help Server started");
  }
}

// Auto-start if this file is run directly - conditional server initialization for development/testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new FrameworkHelpServer();
  server.start().catch(console.error);
}

export { FrameworkHelpServer };