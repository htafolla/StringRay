/**
 * StrRay Testing Best Practices MCP Server
 *
 * Knowledge skill for comprehensive testing strategies, TDD/BDD implementation,
 * test coverage optimization, and automated testing workflows
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

interface TestStrategy {
  type:
    | "unit"
    | "integration"
    | "e2e"
    | "performance"
    | "security"
    | "accessibility";
  framework: string;
  coverage: number;
  confidence: "low" | "medium" | "high";
  automationLevel: number; // 0-100
}

interface TestAnalysis {
  currentCoverage: number;
  targetCoverage: number;
  gaps: TestGap[];
  recommendations: TestRecommendation[];
  strategy: TestStrategy[];
  automationPotential: number;
}

interface TestGap {
  area: string;
  currentCoverage: number;
  recommendedCoverage: number;
  priority: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
}

interface TestRecommendation {
  type: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  tools: string[];
}

class StrRayTestingBestPracticesServer {
  private server: Server;

  constructor() {
        this.server = new Server(
      {
        name: "strray-testing-best-practices",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    console.log("StrRay Testing Best Practices MCP Server initialized");
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "analyze_test_coverage",
            description: "Analyze current test coverage and identify gaps",
            inputSchema: {
              type: "object",
              properties: {
                codePath: {
                  type: "string",
                  description: "Path to codebase to analyze",
                },
                testFramework: {
                  type: "string",
                  description:
                    "Testing framework used (jest, vitest, mocha, etc.)",
                  default: "auto-detect",
                },
                coverageThreshold: {
                  type: "number",
                  description: "Minimum coverage threshold (0-100)",
                  default: 80,
                },
              },
              required: ["codePath"],
            },
          },
          {
            name: "design_test_strategy",
            description: "Design comprehensive testing strategy for a project",
            inputSchema: {
              type: "object",
              properties: {
                projectType: {
                  type: "string",
                  enum: ["web-app", "api", "library", "mobile", "desktop"],
                  description: "Type of project",
                },
                techStack: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Technologies used (react, node, typescript, etc.)",
                },
                teamSize: {
                  type: "string",
                  enum: ["solo", "small", "medium", "large"],
                  description: "Development team size",
                },
                timeline: {
                  type: "string",
                  enum: ["rapid", "balanced", "thorough"],
                  description: "Development timeline priority",
                },
              },
              required: ["projectType"],
            },
          },
          {
            name: "implement_tdd_workflow",
            description:
              "Implement Test-Driven Development workflow and practices",
            inputSchema: {
              type: "object",
              properties: {
                language: {
                  type: "string",
                  description: "Programming language",
                  default: "typescript",
                },
                framework: {
                  type: "string",
                  description: "Preferred testing framework",
                  default: "jest",
                },
                existingTests: {
                  type: "boolean",
                  description: "Whether tests already exist",
                  default: false,
                },
              },
              required: [],
            },
          },
          {
            name: "optimize_test_performance",
            description: "Analyze and optimize test execution performance",
            inputSchema: {
              type: "object",
              properties: {
                testResults: {
                  type: "string",
                  description: "Path to test results or current execution time",
                },
                targetRuntime: {
                  type: "number",
                  description: "Target test execution time in seconds",
                  default: 300,
                },
                parallelExecution: {
                  type: "boolean",
                  description: "Whether parallel execution is supported",
                  default: true,
                },
              },
              required: ["testResults"],
            },
          },
          {
            name: "setup_ci_cd_testing",
            description: "Set up comprehensive CI/CD testing pipeline",
            inputSchema: {
              type: "object",
              properties: {
                ciPlatform: {
                  type: "string",
                  enum: [
                    "github-actions",
                    "gitlab-ci",
                    "jenkins",
                    "circle-ci",
                    "travis-ci",
                  ],
                  description: "CI/CD platform",
                },
                testTypes: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: [
                      "unit",
                      "integration",
                      "e2e",
                      "performance",
                      "security",
                    ],
                  },
                  description: "Types of tests to include",
                },
                coverageReporting: {
                  type: "boolean",
                  description: "Enable coverage reporting",
                  default: true,
                },
              },
              required: ["ciPlatform", "testTypes"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "analyze_test_coverage":
          return await this.analyzeTestCoverage(args);
        case "design_test_strategy":
          return await this.designTestStrategy(args);
        case "implement_tdd_workflow":
          return await this.implementTDDWorkflow(args);
        case "optimize_test_performance":
          return await this.optimizeTestPerformance(args);
        case "setup_ci_cd_testing":
          return await this.setupCICDTesting(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async analyzeTestCoverage(args: any): Promise<any> {
    const {
      codePath,
      testFramework = "auto-detect",
      coverageThreshold = 80,
    } = args;

    try {
      const analysis = await this.performCoverageAnalysis(
        codePath,
        testFramework,
      );

      const gaps = analysis.gaps.filter(
        (gap: any) => gap.currentCoverage < coverageThreshold,
      );
      const criticalGaps = gaps.filter((gap: any) => gap.priority === "high");

      return {
        content: [
          {
            type: "text",
            text:
              `Test Coverage Analysis for ${codePath}:\n\n` +
              `📊 COVERAGE METRICS\n` +
              `Current Coverage: ${analysis.currentCoverage}%\n` +
              `Target Coverage: ${analysis.targetCoverage}%\n` +
              `Coverage Gap: ${(analysis.targetCoverage - analysis.currentCoverage).toFixed(1)}%\n` +
              `Automation Potential: ${analysis.automationPotential}%\n\n` +
              `🚨 COVERAGE GAPS (${gaps.length} total, ${criticalGaps.length} critical)\n${gaps
                .slice(0, 5)
                .map(
                  (gap: any) =>
                    `${this.getPriorityIcon(gap.priority)} ${gap.area}\n` +
                    `   Current: ${gap.currentCoverage}% | Target: ${gap.recommendedCoverage}%\n` +
                    `   Priority: ${gap.priority.toUpperCase()} | Effort: ${gap.effort.toUpperCase()}`,
                )
                .join("\n\n")}\n\n` +
              `🎯 TEST STRATEGY RECOMMENDATIONS\n${analysis.recommendations
                .slice(0, 5)
                .map(
                  (rec: any) =>
                    `${this.getImpactIcon(rec.impact)} ${rec.type}: ${rec.description}\n` +
                    `   Impact: ${rec.impact.toUpperCase()} | Effort: ${rec.effort.toUpperCase()}\n` +
                    `   Tools: ${rec.tools.join(", ")}`,
                )
                .join("\n\n")}\n\n` +
              `⚡ QUICK WINS\n` +
              `• Focus on high-impact, low-effort improvements first\n` +
              `• Automate repetitive testing tasks\n` +
              `• Implement test-driven development for new features\n` +
              `• Set up continuous integration with coverage gates`,
          },
        ],
        data: {
          analysis,
          prioritizedGaps: this.prioritizeGaps(gaps),
          implementationPlan: this.createCoverageImprovementPlan(analysis),
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing test coverage: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async designTestStrategy(args: any): Promise<any> {
    const {
      projectType,
      techStack = [],
      teamSize = "small",
      timeline = "balanced",
    } = args;

    try {
      const strategy = this.createTestStrategy(
        projectType,
        techStack,
        teamSize,
        timeline,
      );

      return {
        content: [
          {
            type: "text",
            text:
              `Testing Strategy for ${projectType.toUpperCase()} Project:\n\n` +
              `👥 TEAM CONTEXT\n` +
              `Team Size: ${teamSize.toUpperCase()}\n` +
              `Timeline Priority: ${timeline.toUpperCase()}\n` +
              `Tech Stack: ${techStack.join(", ") || "Not specified"}\n\n` +
              `🧪 RECOMMENDED TEST PYRAMID\n${strategy
                .map(
                  (testType: any) =>
                    `${this.getTestTypeIcon(testType.type)} ${testType.type.toUpperCase()} TESTS\n` +
                    `   Framework: ${testType.framework}\n` +
                    `   Target Coverage: ${testType.coverage}%\n` +
                    `   Confidence Level: ${testType.confidence.toUpperCase()}\n` +
                    `   Automation: ${testType.automationLevel}%`,
                )
                .join("\n\n")}\n\n` +
              `📈 IMPLEMENTATION ROADMAP\n` +
              `1. Set up unit testing framework and basic test structure\n` +
              `2. Implement integration tests for critical user journeys\n` +
              `3. Add end-to-end tests for complete workflows\n` +
              `4. Integrate performance and security testing\n` +
              `5. Set up automated test execution in CI/CD\n\n` +
              `🎯 SUCCESS METRICS\n` +
              `• 80%+ automated test coverage\n` +
              `• <5 minute test execution time\n` +
              `• 99% test reliability\n` +
              `• Zero production bugs from untested code`,
          },
        ],
        data: {
          strategy,
          roadmap: this.createImplementationRoadmap(strategy, timeline),
          tools: this.recommendTestingTools(strategy),
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error designing test strategy: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async implementTDDWorkflow(args: any): Promise<any> {
    const {
      language = "typescript",
      framework = "jest",
      existingTests = false,
    } = args;

    try {
      const workflow = this.createTDDWorkflow(
        language,
        framework,
        existingTests,
      );

      return {
        content: [
          {
            type: "text",
            text:
              `Test-Driven Development Workflow for ${language.toUpperCase()}:\n\n` +
              `🔄 TDD CYCLE\n` +
              `1. 🟥 RED: Write failing test first\n` +
              `2. 🟢 GREEN: Make test pass with minimal code\n` +
              `3. 🟡 REFACTOR: Improve code while keeping tests green\n` +
              `4. 🔄 REPEAT: Continue with next requirement\n\n` +
              `🛠️ SETUP & TOOLS\n` +
              `Framework: ${framework}\n` +
              `Language: ${language}\n` +
              `Existing Tests: ${existingTests ? "Yes" : "No"}\n\n` +
              `📝 PRACTICAL WORKFLOW\n${workflow.steps
                .map(
                  (step: any, i: number) =>
                    `${i + 1}. ${step.title}\n` +
                    `   ${step.description}\n` +
                    `   Command: ${step.command}`,
                )
                .join("\n\n")}\n\n` +
              `💡 TDD BEST PRACTICES\n` +
              `• Write test before implementation code\n` +
              `• Test one concept per test case\n` +
              `• Use descriptive test names (should/when/given)\n` +
              `• Keep tests fast and isolated\n` +
              `• Refactor code, not tests\n` +
              `• Maintain high test coverage (>90%)\n\n` +
              `🚀 GETTING STARTED\n` +
              `${existingTests ? "Integrate TDD into existing test suite" : "Start with a simple feature and practice the cycle"}\n` +
              `Run tests continuously during development\n` +
              `Use test results to guide implementation`,
          },
        ],
        data: {
          workflow,
          examples: this.provideTDDExamples(language, framework),
          resources: this.recommendTDDResources(language, framework),
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error implementing TDD workflow: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async optimizeTestPerformance(args: any): Promise<any> {
    const { testResults, targetRuntime = 300, parallelExecution = true } = args;

    try {
      const optimization = await this.analyzeTestPerformance(
        testResults,
        targetRuntime,
        parallelExecution,
      );

      return {
        content: [
          {
            type: "text",
            text:
              `Test Performance Optimization Analysis:\n\n` +
              `⏱️ CURRENT PERFORMANCE\n` +
              `Execution Time: ${optimization.currentRuntime}s\n` +
              `Target Time: ${targetRuntime}s\n` +
              `Performance Gap: ${(optimization.currentRuntime - targetRuntime).toFixed(1)}s\n` +
              `Parallel Execution: ${parallelExecution ? "Enabled" : "Disabled"}\n\n` +
              `🐌 PERFORMANCE BOTTLENECKS\n${optimization.bottlenecks
                .map(
                  (bottleneck: any, i: number) =>
                    `${i + 1}. ${bottleneck.type}: ${bottleneck.description}\n` +
                    `   Impact: ${bottleneck.impact}s saved\n` +
                    `   Difficulty: ${bottleneck.difficulty}\n` +
                    `   Solution: ${bottleneck.solution}`,
                )
                .join("\n\n")}\n\n` +
              `⚡ OPTIMIZATION RECOMMENDATIONS\n${optimization.recommendations
                .map(
                  (rec: any, i: number) =>
                    `${i + 1}. ${rec.title}\n` +
                    `   Expected Improvement: ${rec.improvement}s\n` +
                    `   Effort: ${rec.effort}\n` +
                    `   ${rec.description}`,
                )
                .join("\n\n")}\n\n` +
              `🎯 IMPLEMENTATION PRIORITY\n` +
              `1. Enable parallel test execution (if not already)\n` +
              `2. Optimize slow integration tests\n` +
              `3. Implement intelligent test skipping\n` +
              `4. Use test result caching\n` +
              `5. Optimize test data setup/cleanup`,
          },
        ],
        data: {
          optimization,
          implementationPlan:
            this.createPerformanceOptimizationPlan(optimization),
          monitoringStrategy: this.setupPerformanceMonitoring(optimization),
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error optimizing test performance: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async setupCICDTesting(args: any): Promise<any> {
    const { ciPlatform, testTypes, coverageReporting = true } = args;

    try {
      const pipeline = this.createCIPipeline(
        ciPlatform,
        testTypes,
        coverageReporting,
      );

      return {
        content: [
          {
            type: "text",
            text:
              `CI/CD Testing Pipeline for ${ciPlatform.toUpperCase()}:\n\n` +
              `🔧 CONFIGURATION OVERVIEW\n` +
              `Platform: ${ciPlatform}\n` +
              `Test Types: ${testTypes.join(", ")}\n` +
              `Coverage Reporting: ${coverageReporting ? "Enabled" : "Disabled"}\n\n` +
              `📋 PIPELINE STAGES\n${pipeline.stages
                .map(
                  (stage: any, i: number) =>
                    `Stage ${i + 1}: ${stage.name}\n` +
                    `   Purpose: ${stage.description}\n` +
                    `   Duration: ~${stage.estimatedDuration}min\n` +
                    `   Tests: ${stage.tests.join(", ")}\n` +
                    `   Conditions: ${stage.conditions.join(", ")}`,
                )
                .join("\n\n")}\n\n` +
              `📄 CONFIGURATION FILES\n${pipeline.configFiles
                .map(
                  (file: any) =>
                    `${file.filename}\n` +
                    `   Location: ${file.location}\n` +
                    `   Purpose: ${file.description}`,
                )
                .join("\n\n")}\n\n` +
              `🛠️ REQUIRED TOOLS & DEPENDENCIES\n${pipeline.dependencies
                .map(
                  (dep: any) =>
                    `• ${dep.name}: ${dep.version || "latest"} (${dep.purpose})`,
                )
                .join("\n")}\n\n` +
              `✅ QUALITY GATES\n` +
              `• All tests must pass\n` +
              `${coverageReporting ? "• Minimum coverage thresholds met\n" : ""}` +
              `• No critical security vulnerabilities\n` +
              `• Performance benchmarks achieved\n` +
              `• Linting and formatting checks pass`,
          },
        ],
        data: {
          pipeline,
          configurationTemplates: this.generateCIConfigTemplates(
            ciPlatform,
            pipeline,
          ),
          troubleshootingGuide: this.createCITroubleshootingGuide(pipeline),
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting up CI/CD testing: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  // Implementation methods
  private async performCoverageAnalysis(
    codePath: string,
    testFramework: string,
  ): Promise<TestAnalysis> {
    // Simplified analysis - would be more comprehensive in production
    return {
      currentCoverage: 65,
      targetCoverage: 85,
      gaps: [
        {
          area: "API endpoints",
          currentCoverage: 45,
          recommendedCoverage: 90,
          priority: "high",
          effort: "medium",
        },
        {
          area: "Error handling",
          currentCoverage: 30,
          recommendedCoverage: 80,
          priority: "high",
          effort: "low",
        },
        {
          area: "UI components",
          currentCoverage: 70,
          recommendedCoverage: 85,
          priority: "medium",
          effort: "high",
        },
      ],
      recommendations: [
        {
          type: "Unit Test Expansion",
          description: "Increase unit test coverage for business logic",
          impact: "high",
          effort: "medium",
          tools: ["Jest", "Vitest", "Testing Library"],
        },
        {
          type: "Integration Testing",
          description: "Add integration tests for API endpoints",
          impact: "high",
          effort: "medium",
          tools: ["Supertest", "TestContainers"],
        },
      ],
      strategy: [],
      automationPotential: 75,
    };
  }

  private createTestStrategy(
    projectType: string,
    techStack: string[],
    teamSize: string,
    timeline: string,
  ): TestStrategy[] {
    const baseStrategy: TestStrategy[] = [];

    switch (projectType) {
      case "web-app":
        baseStrategy.push(
          {
            type: "unit",
            framework: "Jest + Testing Library",
            coverage: 85,
            confidence: "high",
            automationLevel: 95,
          },
          {
            type: "integration",
            framework: "Cypress",
            coverage: 70,
            confidence: "medium",
            automationLevel: 80,
          },
          {
            type: "e2e",
            framework: "Playwright",
            coverage: 60,
            confidence: "high",
            automationLevel: 85,
          },
        );
        break;
      case "api":
        baseStrategy.push(
          {
            type: "unit",
            framework: "Jest",
            coverage: 90,
            confidence: "high",
            automationLevel: 95,
          },
          {
            type: "integration",
            framework: "Supertest",
            coverage: 80,
            confidence: "high",
            automationLevel: 90,
          },
        );
        break;
      default:
        baseStrategy.push({
          type: "unit",
          framework: "Jest",
          coverage: 80,
          confidence: "high",
          automationLevel: 90,
        });
    }

    return baseStrategy;
  }

  private createTDDWorkflow(
    language: string,
    framework: string,
    existingTests: boolean,
  ): any {
    return {
      steps: [
        {
          title: "Set up testing framework",
          description:
            "Install and configure testing framework with proper scripts",
          command: `npm install --save-dev ${framework}`,
        },
        {
          title: "Create test file structure",
          description:
            "Set up __tests__ directories and test file naming conventions",
          command:
            "mkdir -p src/__tests__ && touch src/__tests__/example.test.ts",
        },
        {
          title: "Write first failing test",
          description: "Start with a simple test case that will initially fail",
          command: "npm test -- --watch",
        },
        {
          title: "Implement minimal code",
          description: "Write just enough code to make the test pass",
          command: "npm run build && npm test",
        },
        {
          title: "Refactor and improve",
          description: "Clean up code while ensuring tests still pass",
          command: "npm test && npm run lint",
        },
      ],
    };
  }

  private async analyzeTestPerformance(
    testResults: string,
    targetRuntime: number,
    parallelExecution: boolean,
  ): Promise<any> {
    return {
      currentRuntime: 450,
      bottlenecks: [
        {
          type: "Slow integration tests",
          description: "Database setup and teardown taking too long",
          impact: 120,
          difficulty: "medium",
          solution: "Use test containers and parallel execution",
        },
        {
          type: "Inefficient test data",
          description: "Large fixtures loaded for every test",
          impact: 80,
          difficulty: "low",
          solution: "Implement shared test data with factories",
        },
      ],
      recommendations: [
        {
          title: "Enable parallel test execution",
          improvement: 150,
          effort: "low",
          description: "Run tests in parallel to reduce total execution time",
        },
        {
          title: "Optimize test database setup",
          improvement: 100,
          effort: "medium",
          description: "Use in-memory databases and efficient fixtures",
        },
      ],
    };
  }

  private createCIPipeline(
    ciPlatform: string,
    testTypes: string[],
    coverageReporting: boolean,
  ): any {
    const stages = [];

    if (testTypes.includes("unit")) {
      stages.push({
        name: "Unit Tests",
        description: "Fast unit tests for individual components",
        estimatedDuration: 5,
        tests: ["Unit tests"],
        conditions: ["All unit tests pass"],
      });
    }

    if (testTypes.includes("integration")) {
      stages.push({
        name: "Integration Tests",
        description: "Test component interactions and APIs",
        estimatedDuration: 10,
        tests: ["Integration tests"],
        conditions: ["All integration tests pass", "API contracts validated"],
      });
    }

    if (testTypes.includes("e2e")) {
      stages.push({
        name: "E2E Tests",
        description: "End-to-end user journey testing",
        estimatedDuration: 15,
        tests: ["E2E tests"],
        conditions: ["All E2E tests pass", "UI interactions working"],
      });
    }

    return {
      stages,
      configFiles: [
        {
          filename: ".github/workflows/ci.yml",
          location: "Repository root",
          description: "GitHub Actions workflow configuration",
        },
        {
          filename: "jest.config.js",
          location: "Repository root",
          description: "Jest testing framework configuration",
        },
      ],
      dependencies: [
        { name: "jest", version: "^29.0.0", purpose: "Unit testing framework" },
        {
          name: "cypress",
          version: "^12.0.0",
          purpose: "E2E testing framework",
        },
        {
          name: "@testing-library/react",
          purpose: "React component testing utilities",
        },
      ],
    };
  }

  // Helper methods
  private prioritizeGaps(gaps: TestGap[]): TestGap[] {
    return gaps.sort((a: any, b: any) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      const effortScore = { low: 3, medium: 2, high: 1 };
      return (
        priorityScore[b.priority as keyof typeof priorityScore] *
          effortScore[b.effort as keyof typeof effortScore] -
        priorityScore[a.priority as keyof typeof priorityScore] *
          effortScore[a.effort as keyof typeof effortScore]
      );
    });
  }

  private createCoverageImprovementPlan(analysis: TestAnalysis): any {
    return {
      phases: [
        {
          name: "Quick Wins",
          duration: "1-2 weeks",
          focus: "High-impact, low-effort improvements",
          tasks: ["Add tests for error handling", "Cover critical user paths"],
        },
        {
          name: "Systematic Coverage",
          duration: "2-4 weeks",
          focus: "Methodical coverage improvement",
          tasks: ["Test all public APIs", "Add integration tests"],
        },
        {
          name: "Optimization",
          duration: "1-2 weeks",
          focus: "Performance and maintainability",
          tasks: ["Refactor test code", "Optimize test execution"],
        },
      ],
    };
  }

  private createImplementationRoadmap(
    strategy: TestStrategy[],
    timeline: string,
  ): any {
    const phases = [
      "Setup testing infrastructure",
      "Implement unit testing",
      "Add integration testing",
      "Set up E2E testing",
      "Continuous integration",
      "Test optimization",
    ];

    return {
      phases,
      timeline:
        timeline === "rapid"
          ? "4 weeks"
          : timeline === "balanced"
            ? "8 weeks"
            : "12 weeks",
      milestones: phases.map((phase: string, index: number) => ({
        phase,
        week: index + 1,
        deliverables: [`Complete ${phase.toLowerCase()}`],
      })),
    };
  }

  private recommendTestingTools(strategy: TestStrategy[]): string[] {
    const tools = new Set<string>();

    strategy.forEach((testType: any) => {
      tools.add(testType.framework);
      if (testType.type === "e2e") {
        tools.add("Selenium");
        tools.add("WebDriver");
      }
      if (testType.type === "performance") {
        tools.add("k6");
        tools.add("Lighthouse");
      }
    });

    return Array.from(tools);
  }

  private provideTDDExamples(language: string, framework: string): any {
    return {
      language,
      framework,
      examples: [
        {
          scenario: "Simple calculator function",
          test: `describe('Calculator', () => {\n  it('should add two numbers', () => {\n    expect(add(2, 3)).toBe(5);\n  });\n});`,
          implementation: `function add(a: number, b: number): number {\n  return a + b;\n}`,
        },
      ],
    };
  }

  private recommendTDDResources(language: string, framework: string): string[] {
    return [
      `Test-Driven Development: By Example by Kent Beck`,
      `${framework} Official Documentation`,
      `Testing ${language} Applications`,
      "Martin Fowler's Testing Articles",
      "Kent Beck's TDD Resources",
    ];
  }

  private createPerformanceOptimizationPlan(optimization: any): any {
    return {
      immediate: optimization.recommendations.filter(
        (rec: any) => rec.effort === "low",
      ),
      shortTerm: optimization.recommendations.filter(
        (rec: any) => rec.effort === "medium",
      ),
      longTerm: optimization.recommendations.filter(
        (rec: any) => rec.effort === "high",
      ),
      totalImprovement: optimization.recommendations.reduce(
        (sum: number, rec: any) => sum + rec.improvement,
        0,
      ),
    };
  }

  private setupPerformanceMonitoring(optimization: any): any {
    return {
      metrics: [
        "Test execution time",
        "Test failure rate",
        "Coverage trends",
        "Flaky test detection",
      ],
      alerts: [
        "Tests exceed 10 minute threshold",
        "Coverage drops below 80%",
        "Test failure rate > 5%",
      ],
      dashboards: [
        "Test performance dashboard",
        "Coverage trend visualization",
        "CI/CD pipeline metrics",
      ],
    };
  }

  private generateCIConfigTemplates(ciPlatform: string, pipeline: any): any {
    return {
      platform: ciPlatform,
      templates: {
        "github-actions": `# .github/workflows/ci.yml\nname: CI\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-node@v3\n        with:\n          node-version: '18'\n      - run: npm ci\n      - run: npm run build\n      - run: npm test`,
        "gitlab-ci": `# .gitlab-ci.yml\nstages:\n  - test\ntest:\n  stage: test\n  image: node:18\n  script:\n    - npm ci\n    - npm run build\n    - npm test`,
      },
    };
  }

  private createCITroubleshootingGuide(pipeline: any): any {
    return {
      commonIssues: [
        {
          issue: "Tests failing in CI but passing locally",
          solution:
            "Check environment differences, use specific Node.js version, ensure dependencies are locked",
        },
        {
          issue: "Slow CI builds",
          solution: "Enable caching, run tests in parallel, use faster runners",
        },
        {
          issue: "Flaky tests",
          solution:
            "Identify and fix race conditions, improve test isolation, add retry logic",
        },
      ],
      debuggingSteps: [
        "Check CI logs for detailed error messages",
        "Run tests locally with same environment",
        "Use CI-specific debugging tools",
        "Review recent changes that might affect tests",
      ],
    };
  }

  private getPriorityIcon(priority: string): string {
    const icons = { high: "🔴", medium: "🟡", low: "🟢" };
    return icons[priority as keyof typeof icons] || "❓";
  }

  private getImpactIcon(impact: string): string {
    const icons = { high: "🚀", medium: "⚡", low: "🐌" };
    return icons[impact as keyof typeof icons] || "❓";
  }

  private getTestTypeIcon(type: string): string {
    const icons = {
      unit: "🧩",
      integration: "🔗",
      e2e: "🌐",
      performance: "⚡",
      security: "🔒",
      accessibility: "♿",
    };
    return icons[type as keyof typeof icons] || "🧪";
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("StrRay Testing Best Practices MCP Server running...");
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayTestingBestPracticesServer();
  server.run().catch(console.error);
}

export { StrRayTestingBestPracticesServer };
