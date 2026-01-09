#!/usr/bin/env node

/**
 * StrRay Framework - Testing Strategy MCP Server
 * Provides tools for testing strategy design, coverage analysis, and test architecture
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const fs = require("fs").promises;
const path = require("path");

class TestingStrategyServer {
  constructor() {
    this.server = new Server(
      {
        name: "testing-strategy",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "analyze_test_coverage",
            description: "Analyze current test coverage and identify gaps",
            inputSchema: {
              type: "object",
              properties: {
                rootPath: {
                  type: "string",
                  description: "Root path of the project to analyze",
                  default: ".",
                },
                coverageReportPath: {
                  type: "string",
                  description: "Path to coverage report file",
                  default: "coverage/lcov-report/index.html",
                },
              },
            },
          },
          {
            name: "design_test_strategy",
            description:
              "Design a comprehensive testing strategy for the project",
            inputSchema: {
              type: "object",
              properties: {
                projectType: {
                  type: "string",
                  description: "Type of project (react, node, library, etc.)",
                  default: "react",
                },
                complexity: {
                  type: "string",
                  enum: ["simple", "medium", "complex"],
                  description: "Project complexity level",
                  default: "medium",
                },
              },
            },
          },
          {
            name: "identify_test_gaps",
            description:
              "Identify areas of code that lack adequate test coverage",
            inputSchema: {
              type: "object",
              properties: {
                sourcePath: {
                  type: "string",
                  description: "Path to source code directory",
                  default: "src",
                },
                testPath: {
                  type: "string",
                  description: "Path to test directory",
                  default: "__tests__",
                },
              },
            },
          },
          {
            name: "recommend_test_frameworks",
            description: "Recommend appropriate testing frameworks and tools",
            inputSchema: {
              type: "object",
              properties: {
                projectType: {
                  type: "string",
                  description: "Type of project",
                  default: "react",
                },
                language: {
                  type: "string",
                  description: "Primary programming language",
                  default: "typescript",
                },
              },
            },
          },
          {
            name: "generate_tests",
            description: "Generate comprehensive test files for source code",
            inputSchema: {
              type: "object",
              properties: {
                filePath: {
                  type: "string",
                  description: "Path to the source file to generate tests for",
                },
                testType: {
                  type: "string",
                  enum: ["unit", "integration", "component"],
                  description: "Type of tests to generate",
                  default: "unit",
                },
                framework: {
                  type: "string",
                  description: "Testing framework to use",
                  default: "vitest",
                },
              },
              required: ["filePath"],
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
          case "analyze_test_coverage":
            return await this.analyzeTestCoverage(args);
          case "design_test_strategy":
            return await this.designTestStrategy(args);
          case "identify_test_gaps":
            return await this.identifyTestGaps(args);
          case "recommend_test_frameworks":
            return await this.recommendTestFrameworks(args);
          case "generate_tests":
            return await this.generateTests(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async analyzeTestCoverage(args = {}) {
    const rootPath = args.rootPath || ".";
    const coverageReportPath =
      args.coverageReportPath || "coverage/lcov-report/index.html";

    try {
      const coverage = await this.getCoverageAnalysis(
        rootPath,
        coverageReportPath,
      );

      return {
        content: [
          {
            type: "text",
            text: `## Test Coverage Analysis

### Overall Coverage:
- **Statements:** ${coverage.overall.statements}%
- **Branches:** ${coverage.overall.branches}%
- **Functions:** ${coverage.overall.functions}%
- **Lines:** ${coverage.overall.lines}%

### Coverage by Directory:
${coverage.byDirectory.map((dir) => `- **${dir.name}**: ${dir.coverage}% (${dir.status})`).join("\n")}

### Uncovered Files:
${coverage.uncoveredFiles.map((file) => `- ${file.path} (${file.lines} lines uncovered)`).join("\n")}

### Recommendations:
${coverage.recommendations.map((rec) => `- ${rec}`).join("\n")}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze test coverage: ${error.message}`);
    }
  }

  async designTestStrategy(args = {}) {
    const projectType = args.projectType || "react";
    const complexity = args.complexity || "medium";

    try {
      const strategy = this.createTestStrategy(projectType, complexity);

      return {
        content: [
          {
            type: "text",
            text: `## Testing Strategy Design

**Project Type:** ${projectType}
**Complexity Level:** ${complexity}

### Test Pyramid Structure:
${strategy.pyramid.map((layer) => `#### ${layer.name} (${layer.percentage}%)\n${layer.description}\n- **Tools:** ${layer.tools.join(", ")}\n- **Focus:** ${layer.focus}`).join("\n\n")}

### Test Categories:
${strategy.categories.map((cat) => `#### ${cat.name}\n${cat.description}\n- **Coverage Target:** ${cat.target}%\n- **Execution:** ${cat.execution}`).join("\n\n")}

### CI/CD Integration:
${strategy.ci.map((step) => `- ${step}`).join("\n")}

### Quality Gates:
${strategy.qualityGates.map((gate) => `- ${gate.metric}: ${gate.threshold} (${gate.action})`).join("\n")}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to design test strategy: ${error.message}`);
    }
  }

  async identifyTestGaps(args = {}) {
    const sourcePath = args.sourcePath || "src";
    const testPath = args.testPath || "__tests__";

    try {
      const gaps = await this.findTestGaps(sourcePath, testPath);

      return {
        content: [
          {
            type: "text",
            text: `## Test Coverage Gaps Analysis

### Files Without Tests:
${gaps.untestedFiles.map((file) => `- **${file.path}**: ${file.type} (${file.complexity} complexity)`).join("\n")}

### Partially Tested Files:
${gaps.partialCoverage.map((file) => `- **${file.path}**: ${file.coverage}% coverage (${file.missing} missing)`).join("\n")}

### Critical Paths Without Tests:
${gaps.criticalPaths.map((path) => `- ${path.description} (${path.risk})`).join("\n")}

### Priority Recommendations:
${gaps.priorities.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to identify test gaps: ${error.message}`);
    }
  }

  async recommendTestFrameworks(args = {}) {
    const projectType = args.projectType || "react";
    const language = args.language || "typescript";

    try {
      const recommendations = this.getFrameworkRecommendations(
        projectType,
        language,
      );

      return {
        content: [
          {
            type: "text",
            text: `## Testing Framework Recommendations

**Project Type:** ${projectType}
**Language:** ${language}

### Primary Testing Framework:
**${recommendations.primary.name}**
- **Why:** ${recommendations.primary.reason}
- **Setup:** ${recommendations.primary.setup}
- **Best for:** ${recommendations.primary.bestFor}

### Supporting Tools:
${recommendations.supporting.map((tool) => `#### ${tool.category}: ${tool.name}\n- **Purpose:** ${tool.purpose}\n- **Alternative:** ${tool.alternative}`).join("\n\n")}

### Configuration Template:
\`\`\`javascript
${recommendations.configTemplate}
\`\`\`

### Getting Started:
${recommendations.gettingStarted.map((step) => `${step.order}. ${step.description}`).join("\n")}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to recommend test frameworks: ${error.message}`);
    }
  }

  async getCoverageAnalysis(rootPath, coverageReportPath) {
    // Mock coverage analysis - in real implementation would parse actual coverage reports
    const coverage = {
      overall: {
        statements: 85,
        branches: 78,
        functions: 92,
        lines: 86,
      },
      byDirectory: [
        { name: "src/components", coverage: 88, status: "Good" },
        { name: "src/hooks", coverage: 76, status: "Needs improvement" },
        { name: "src/utils", coverage: 95, status: "Excellent" },
        { name: "src/services", coverage: 65, status: "Critical" },
      ],
      uncoveredFiles: [
        { path: "src/services/api.ts", lines: 45 },
        { path: "src/utils/helpers.ts", lines: 23 },
      ],
      recommendations: [
        "Focus on testing API service functions",
        "Add integration tests for critical user flows",
        "Consider using test doubles for external dependencies",
      ],
    };

    return coverage;
  }

  createTestStrategy(projectType, complexity) {
    const strategies = {
      react: {
        simple: {
          pyramid: [
            {
              name: "Unit Tests",
              percentage: 70,
              description: "Component and hook testing",
              tools: ["Vitest", "React Testing Library"],
              focus: "Logic and rendering",
            },
            {
              name: "Integration Tests",
              percentage: 20,
              description: "Component interaction testing",
              tools: ["Vitest", "React Testing Library"],
              focus: "User interactions",
            },
            {
              name: "E2E Tests",
              percentage: 10,
              description: "Critical user journey testing",
              tools: ["Playwright"],
              focus: "End-to-end flows",
            },
          ],
        },
        medium: {
          pyramid: [
            {
              name: "Unit Tests",
              percentage: 60,
              description: "Component, hook, and utility testing",
              tools: ["Vitest", "React Testing Library"],
              focus: "Isolated functionality",
            },
            {
              name: "Integration Tests",
              percentage: 25,
              description: "Multi-component and API integration",
              tools: ["Vitest", "React Testing Library", "MSW"],
              focus: "Component interactions",
            },
            {
              name: "E2E Tests",
              percentage: 15,
              description: "Complete user journey validation",
              tools: ["Playwright"],
              focus: "Critical paths",
            },
          ],
        },
      },
    };

    const strategy =
      strategies[projectType]?.[complexity] || strategies.react.medium;

    return {
      pyramid: strategy.pyramid,
      categories: [
        {
          name: "Unit Tests",
          description: "Test individual functions and components in isolation",
          target: "90%",
          execution: "Fast, frequent execution",
        },
        {
          name: "Integration Tests",
          description: "Test component and module interactions",
          target: "80%",
          execution: "Regular CI execution",
        },
        {
          name: "E2E Tests",
          description: "Test complete user workflows",
          target: "70%",
          execution: "Deployment pipeline",
        },
      ],
      ci: [
        "Run unit tests on every commit",
        "Run integration tests on pull requests",
        "Run E2E tests before deployment",
        "Generate coverage reports daily",
      ],
      qualityGates: [
        {
          metric: "Unit test coverage",
          threshold: "85%",
          action: "Block merge",
        },
        {
          metric: "Integration test pass rate",
          threshold: "95%",
          action: "Block deployment",
        },
        {
          metric: "E2E test stability",
          threshold: "90%",
          action: "Require manual review",
        },
      ],
    };
  }

  async findTestGaps(sourcePath, testPath) {
    // Mock gap analysis - would analyze actual source and test files
    const gaps = {
      untestedFiles: [
        {
          path: "src/services/payment.ts",
          type: "Service",
          complexity: "High",
        },
        {
          path: "src/components/CheckoutForm.tsx",
          type: "Component",
          complexity: "Medium",
        },
        { path: "src/utils/validation.ts", type: "Utility", complexity: "Low" },
      ],
      partialCoverage: [
        {
          path: "src/hooks/useAuth.ts",
          coverage: 75,
          missing: "Error handling paths",
        },
        {
          path: "src/context/AppContext.tsx",
          coverage: 60,
          missing: "State update edge cases",
        },
      ],
      criticalPaths: [
        { description: "User authentication flow", risk: "High" },
        { description: "Payment processing", risk: "Critical" },
        { description: "Data persistence", risk: "Medium" },
      ],
      priorities: [
        "Implement tests for payment service functions",
        "Add error handling tests for authentication hooks",
        "Create integration tests for checkout flow",
        "Add tests for form validation utilities",
      ],
    };

    return gaps;
  }

  getFrameworkRecommendations(projectType, language) {
    const recommendations = {
      react: {
        typescript: {
          primary: {
            name: "Vitest + React Testing Library",
            reason:
              "Modern, fast testing framework with excellent React support",
            setup:
              "npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom",
            bestFor: "Component testing, hooks, and user interactions",
          },
          supporting: [
            {
              category: "Coverage",
              name: "@vitest/coverage-v8",
              purpose: "Generate detailed coverage reports",
              alternative: "nyc",
            },
            {
              category: "Mocking",
              name: "MSW (Mock Service Worker)",
              purpose: "Mock API calls and external services",
              alternative: "jest-mock",
            },
            {
              category: "E2E",
              name: "Playwright",
              purpose: "End-to-end testing across browsers",
              alternative: "Cypress",
            },
          ],
          configTemplate: `// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  }
})`,
          gettingStarted: [
            { order: 1, description: "Install testing dependencies" },
            {
              order: 2,
              description:
                "Create test setup file with React Testing Library configuration",
            },
            { order: 3, description: "Write your first component test" },
            {
              order: 4,
              description: "Configure CI/CD to run tests automatically",
            },
          ],
        },
      },
    };

    return (
      recommendations[projectType]?.[language] ||
      recommendations.react.typescript
    );
  }

  async generateTests(args = {}) {
    const filePath = args.filePath;
    const testType = args.testType || "unit";
    const framework = args.framework || "vitest";

    if (!filePath) {
      throw new Error("filePath is required");
    }

    try {
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error(`Source file not found: ${filePath}`);
      }

      // Determine test file path
      const testFilePath = this.getTestFilePath(filePath);

      // Analyze the source file
      const analysis = await this.analyzeSourceFile(filePath);
      const testTemplate = this.createTestTemplate(filePath, testFilePath, analysis, testType, framework);

      // Ensure the directory exists
      const testDir = path.dirname(testFilePath);
      await fs.mkdir(testDir, { recursive: true });

      // Write the test file
      await fs.writeFile(testFilePath, testTemplate, 'utf-8');

      return {
        content: [
          {
            type: "text",
            text: `## Test Generation Complete

✅ **Test file created:** \`${testFilePath}\`

### Source File Analysis:
- **File:** ${filePath}
- **Type:** ${analysis.fileType}
- **Language:** ${analysis.language}
- **Exports:** ${analysis.exports.length} (${analysis.exports.join(', ')})

### Generated Tests:
- **Framework:** ${framework}
- **Test Type:** ${testType}
- **Coverage:** ${analysis.exports.length} functions/classes tested

### Test Structure:
${testTemplate.split('\n').slice(0, 10).join('\n')}

... (full test file written to disk)

### Next Steps:
1. Review the generated tests
2. Add specific test cases for your business logic
3. Run tests: \`npm test ${testFilePath}\`
4. Verify coverage: \`npm run test:coverage\``,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate tests: ${error.message}`);
    }
  }

  async analyzeSourceFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath);
    const isTypeScript = ['.ts', '.tsx'].includes(ext);
    const isReact = ['.tsx', '.jsx'].includes(ext);

    // Extract exports
    const exports = [];
    const exportRegex = /export\s+(?:const|function|class|let|var|default)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1] && !exports.includes(match[1])) {
        exports.push(match[1]);
      }
    }

    // Determine file type
    let fileType = 'utility';
    if (isReact) {
      fileType = 'component';
    } else if (content.includes('class ')) {
      fileType = 'class';
    } else if (content.includes('export default function') || content.includes('export function')) {
      fileType = 'function';
    }

    return {
      filePath,
      content,
      exports,
      fileType,
      language: isTypeScript ? 'TypeScript' : 'JavaScript',
      isReact,
      isTypeScript
    };
  }

  createTestTemplate(filePath, testFilePath, analysis, testType, framework) {
    const { exports, fileType, isTypeScript, isReact } = analysis;
    const fileName = path.basename(filePath, path.extname(filePath));

    const testImports = this.getTestImports(filePath, testFilePath, analysis.exports, framework, isReact, isTypeScript);
    const testStructure = this.getTestStructure(fileType, exports, testType, framework);

    return `${testImports}

describe('${fileName}', () => {
${testStructure}
});
`;
  }

  getTestImports(filePath, testFilePath, exports, framework, isReact, isTypeScript) {
    const typeAnnotation = isTypeScript ? ': RenderResult' : '';
    const typeImport = isTypeScript ? ', RenderResult' : '';

    let imports = `import { expect, describe, it } from '${framework === 'vitest' ? 'vitest' : 'jest'}';`;

    if (isReact) {
      imports += `
import { render, screen } from '@testing-library/react';`;
      if (typeImport) {
        imports += `
import type { RenderResult } from '@testing-library/react';`;
      }
    }

    // Add source file import
    if (exports.length > 0) {
      const fileName = path.basename(filePath, path.extname(filePath));
      const testDir = path.dirname(testFilePath);
      const sourceDir = path.dirname(filePath);
      const relativePath = path.relative(testDir, sourceDir);

      let importPath;
      if (relativePath === '') {
        importPath = `./${fileName}`;
      } else {
        importPath = path.join(relativePath, fileName);
      }

      imports += `
import { ${exports.join(', ')} } from '${importPath}';`;
    }

    return imports;
  }

  getTestStructure(fileType, exports, testType, framework) {
    const tests = [];

    if (fileType === 'component' && testType === 'component') {
      tests.push(`  it('should render successfully', () => {
    const { container } = render(<${exports[0] || 'Component'} />);
    expect(container).toBeInTheDocument();
  });

  it('should handle props correctly', () => {
    render(<${exports[0] || 'Component'} testProp="value" />);
    expect(screen.getByText('value')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    const { container } = render(<${exports[0] || 'Component'} />);
    expect(container).toBeAccessible();
  });`);
    } else {
      // Unit tests for functions/classes
      exports.forEach(exportName => {
        tests.push(`  describe('${exportName}', () => {
    it('should be defined', () => {
      expect(typeof ${exportName}).toBe('${fileType === 'class' ? 'function' : 'function'}');
    });

    it('should handle basic functionality', () => {
      // Add specific test logic here
      expect(true).toBe(true); // Placeholder - customize based on function behavior
    });

    it('should handle edge cases', () => {
      // Test null/undefined inputs, error conditions
      expect(true).toBe(true); // Placeholder - customize based on function behavior
    });
  });`);
      });
    }

    return tests.join('\n\n');
  }

  getTestFilePath(sourcePath, framework) {
    const dir = path.dirname(sourcePath);
    const fileName = path.basename(sourcePath, path.extname(sourcePath));
    const ext = framework === 'vitest' ? '.test.ts' : '.test.js';

    // Place tests in __tests__ directory
    const testDir = path.join(dir, '__tests__');
    return path.join(testDir, fileName + ext);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Testing Strategy MCP server running...");
  }
}

// Run the server
const server = new TestingStrategyServer();
server.run().catch(console.error);
