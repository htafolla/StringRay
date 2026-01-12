/**
 * StrRay Testing Strategy MCP Server
 *
 * Knowledge skill for test planning, coverage optimization,
 * and testing methodology recommendations
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
class StrRayTestingStrategyServer {
    server;
    constructor() {
        this.server = new Server({
            name: "strray-testing-strategy",
            version: "1.0.0",
        });
        this.setupToolHandlers();
        console.log("StrRay Testing Strategy MCP Server initialized");
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "analyze-test-coverage",
                        description: "Analyze current test coverage and identify gaps",
                        inputSchema: {
                            type: "object",
                            properties: {
                                projectRoot: { type: "string" },
                                includeBreakdown: { type: "boolean", default: true },
                                coverageThreshold: { type: "number", default: 80 },
                            },
                            required: ["projectRoot"],
                        },
                    },
                    {
                        name: "design-test-strategy",
                        description: "Design comprehensive testing strategy for the project",
                        inputSchema: {
                            type: "object",
                            properties: {
                                projectRoot: { type: "string" },
                                projectType: {
                                    type: "string",
                                    enum: ["web", "api", "mobile", "desktop"],
                                },
                                complexity: {
                                    type: "string",
                                    enum: ["simple", "medium", "complex"],
                                },
                                timeline: {
                                    type: "string",
                                    enum: ["agile", "waterfall", "continuous"],
                                },
                            },
                            required: ["projectRoot"],
                        },
                    },
                    {
                        name: "identify-test-gaps",
                        description: "Identify untested code and recommend test cases",
                        inputSchema: {
                            type: "object",
                            properties: {
                                projectRoot: { type: "string" },
                                sourceFiles: { type: "array", items: { type: "string" } },
                                existingTests: { type: "array", items: { type: "string" } },
                            },
                            required: ["projectRoot"],
                        },
                    },
                    {
                        name: "optimize-test-coverage",
                        description: "Analyze and optimize test coverage patterns",
                        inputSchema: {
                            type: "object",
                            properties: {
                                projectRoot: { type: "string" },
                                currentCoverage: { type: "number" },
                                targetCoverage: { type: "number", default: 85 },
                                focusAreas: { type: "array", items: { type: "string" } },
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
                    case "analyze-test-coverage":
                        return await this.analyzeTestCoverage(args);
                    case "design-test-strategy":
                        return await this.designTestStrategy(args);
                    case "identify-test-gaps":
                        return await this.identifyTestGaps(args);
                    case "optimize-test-coverage":
                        return await this.optimizeTestCoverage(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                console.error(`Error in testing strategy tool ${name}:`, error);
                throw error;
            }
        });
    }
    async analyzeTestCoverage(args) {
        const { projectRoot, includeBreakdown = true, coverageThreshold = 80, } = args;
        const analysis = this.performTestCoverageAnalysis(projectRoot);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        projectRoot,
                        analysis,
                        threshold: coverageThreshold,
                        status: analysis.coverage >= coverageThreshold
                            ? "adequate"
                            : "insufficient",
                        analyzedAt: new Date().toISOString(),
                    }, null, 2),
                },
            ],
        };
    }
    async designTestStrategy(args) {
        const { projectRoot, projectType, complexity, timeline } = args;
        const strategy = this.generateTestStrategy(projectRoot, projectType, complexity, timeline);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        projectRoot,
                        strategy,
                        recommendations: this.generateStrategyRecommendations(strategy, projectType),
                        implementation: this.createImplementationPlan(strategy, timeline),
                        analyzedAt: new Date().toISOString(),
                    }, null, 2),
                },
            ],
        };
    }
    async identifyTestGaps(args) {
        const { projectRoot, sourceFiles, existingTests } = args;
        const gaps = this.analyzeTestGaps(sourceFiles || [], existingTests || []);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        projectRoot,
                        gaps,
                        coverage: this.calculateGapCoverage(gaps, sourceFiles?.length || 0),
                        recommendations: this.generateGapRecommendations(gaps),
                        analyzedAt: new Date().toISOString(),
                    }, null, 2),
                },
            ],
        };
    }
    async optimizeTestCoverage(args) {
        const { projectRoot, currentCoverage, targetCoverage = 85, focusAreas, } = args;
        const optimization = this.createCoverageOptimizationPlan(projectRoot, currentCoverage, targetCoverage, focusAreas);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        projectRoot,
                        optimization,
                        timeline: this.estimateOptimizationTimeline(optimization),
                        roi: this.calculateOptimizationROI(optimization),
                        analyzedAt: new Date().toISOString(),
                    }, null, 2),
                },
            ],
        };
    }
    // Helper methods
    performTestCoverageAnalysis(projectRoot) {
        const testFiles = this.findTestFiles(projectRoot);
        const sourceFiles = this.findSourceFiles(projectRoot);
        const analysis = {
            coverage: this.calculateCoverage(testFiles, sourceFiles),
            testTypes: this.categorizeTests(testFiles),
            testFrameworks: this.detectTestFrameworks(testFiles),
            testPatterns: this.analyzeTestPatterns(testFiles),
            gaps: this.identifyCoverageGaps(sourceFiles, testFiles),
            recommendations: [],
        };
        analysis.recommendations = this.generateCoverageRecommendations(analysis);
        return analysis;
    }
    generateTestStrategy(projectRoot, projectType, complexity, timeline) {
        const baseTests = this.estimateBaseTestCounts(projectType, complexity);
        // Adjust for timeline
        const multiplier = timeline === "agile" ? 1.2 : timeline === "continuous" ? 1.4 : 1.0;
        return {
            unitTests: Math.round(baseTests.unit * multiplier),
            integrationTests: Math.round(baseTests.integration * multiplier),
            e2eTests: Math.round(baseTests.e2e * multiplier),
            performanceTests: Math.round(baseTests.performance * multiplier),
            securityTests: Math.round(baseTests.security * multiplier),
            totalEstimated: 0, // Will be calculated
        };
    }
    analyzeTestGaps(sourceFiles, existingTests) {
        const gaps = [];
        for (const sourceFile of sourceFiles) {
            const expectedTest = this.generateExpectedTestFile(sourceFile);
            const hasTest = existingTests.some((test) => test.includes(expectedTest));
            if (!hasTest) {
                gaps.push({
                    sourceFile,
                    expectedTest,
                    type: this.inferTestType(sourceFile),
                    priority: this.calculateTestPriority(sourceFile),
                    complexity: this.estimateTestComplexity(sourceFile),
                });
            }
        }
        return gaps.sort((a, b) => b.priority - a.priority);
    }
    createCoverageOptimizationPlan(projectRoot, currentCoverage, targetCoverage, focusAreas) {
        const gap = targetCoverage - currentCoverage;
        const plan = {
            currentCoverage,
            targetCoverage,
            gap,
            phases: [],
            estimatedEffort: this.estimateOptimizationEffort(gap),
            priorityAreas: this.identifyPriorityAreas(projectRoot, focusAreas),
        };
        // Create optimization phases
        if (gap > 0) {
            plan.phases = this.createOptimizationPhases(gap, focusAreas);
        }
        return plan;
    }
    // Implementation helpers
    findTestFiles(projectRoot) {
        return this.findFiles(projectRoot, (file) => file.includes(".test.") ||
            file.includes(".spec.") ||
            file.includes("/__tests__/"));
    }
    findSourceFiles(projectRoot) {
        return this.findFiles(projectRoot, (file) => {
            const ext = path.extname(file);
            return ([".ts", ".js", ".tsx", ".jsx", ".py", ".java"].includes(ext) &&
                !file.includes(".test.") &&
                !file.includes(".spec.") &&
                !file.includes("/__tests__/"));
        });
    }
    findFiles(projectRoot, filter) {
        const files = [];
        const traverse = (dir) => {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const entryPath = path.join(dir, entry.name);
                    if (this.shouldIgnorePath(entryPath))
                        continue;
                    if (entry.isFile() && filter(entryPath)) {
                        files.push(entryPath);
                    }
                    else if (entry.isDirectory()) {
                        traverse(entryPath);
                    }
                }
            }
            catch (error) {
                // Skip inaccessible directories
            }
        };
        traverse(projectRoot);
        return files;
    }
    calculateCoverage(testFiles, sourceFiles) {
        if (sourceFiles.length === 0)
            return 0;
        return Math.min(100, Math.round((testFiles.length / sourceFiles.length) * 100));
    }
    categorizeTests(testFiles) {
        const categories = {
            unit: 0,
            integration: 0,
            e2e: 0,
            performance: 0,
            security: 0,
        };
        for (const testFile of testFiles) {
            const content = fs.readFileSync(testFile, "utf8").toLowerCase();
            if (content.includes("integration") || content.includes("e2e")) {
                categories.integration = (categories.integration || 0) + 1;
            }
            else if (content.includes("performance") ||
                content.includes("benchmark")) {
                categories.performance = (categories.performance || 0) + 1;
            }
            else if (content.includes("security") || content.includes("auth")) {
                categories.security = (categories.security || 0) + 1;
            }
            else {
                categories.unit = (categories.unit || 0) + 1;
            }
        }
        return categories;
    }
    detectTestFrameworks(testFiles) {
        const frameworks = [];
        const sampleFiles = testFiles.slice(0, 5);
        for (const file of sampleFiles) {
            try {
                const content = fs.readFileSync(file, "utf8");
                if (content.includes("describe(") && content.includes("it(")) {
                    if (content.includes("vitest"))
                        frameworks.push("vitest");
                    else if (content.includes("jest"))
                        frameworks.push("jest");
                    else
                        frameworks.push("mocha/chai");
                }
                if (content.includes("pytest"))
                    frameworks.push("pytest");
                if (content.includes("junit"))
                    frameworks.push("junit");
            }
            catch (error) {
                // Skip
            }
        }
        return Array.from(new Set(frameworks));
    }
    analyzeTestPatterns(testFiles) {
        const patterns = [];
        const sampleFiles = testFiles.slice(0, 3);
        for (const file of sampleFiles) {
            try {
                const content = fs.readFileSync(file, "utf8");
                if (content.includes("beforeEach") || content.includes("afterEach")) {
                    patterns.push("setup/teardown");
                }
                if (content.includes("mock") || content.includes("stub")) {
                    patterns.push("mocking");
                }
                if (content.includes("fixture") || content.includes("factory")) {
                    patterns.push("test data factories");
                }
            }
            catch (error) {
                // Skip
            }
        }
        return Array.from(new Set(patterns));
    }
    identifyCoverageGaps(sourceFiles, testFiles) {
        const gaps = [];
        for (const sourceFile of sourceFiles) {
            const hasTest = testFiles.some((testFile) => testFile
                .replace(".test.", ".")
                .replace(".spec.", ".")
                .replace("/__tests__/", "/")
                .includes(path.basename(sourceFile, path.extname(sourceFile))));
            if (!hasTest) {
                gaps.push(sourceFile);
            }
        }
        return gaps;
    }
    generateCoverageRecommendations(analysis) {
        const recommendations = [];
        if (analysis.coverage < 70) {
            recommendations.push("Increase test coverage to at least 80%");
        }
        if ((analysis.testTypes.unit || 0) < (analysis.testTypes.integration || 0)) {
            recommendations.push("Focus more on unit tests before integration tests");
        }
        if (analysis.gaps.length > 5) {
            recommendations.push(`Address ${analysis.gaps.length} files without test coverage`);
        }
        return recommendations;
    }
    estimateBaseTestCounts(projectType, complexity) {
        const baseMultipliers = {
            web: { unit: 10, integration: 3, e2e: 2, performance: 1, security: 1 },
            api: { unit: 8, integration: 4, e2e: 1, performance: 2, security: 2 },
            mobile: { unit: 12, integration: 5, e2e: 3, performance: 1, security: 1 },
            desktop: {
                unit: 15,
                integration: 4,
                e2e: 2,
                performance: 1,
                security: 1,
            },
        };
        const complexityMultipliers = {
            simple: 0.7,
            medium: 1.0,
            complex: 1.5,
        };
        const base = baseMultipliers[projectType] ||
            baseMultipliers.web;
        const multiplier = complexityMultipliers[complexity] ||
            1.0;
        return {
            unit: Math.round(base.unit * multiplier),
            integration: Math.round(base.integration * multiplier),
            e2e: Math.round(base.e2e * multiplier),
            performance: Math.round(base.performance * multiplier),
            security: Math.round(base.security * multiplier),
        };
    }
    generateStrategyRecommendations(strategy, projectType) {
        const recommendations = [];
        if (strategy.unitTests < strategy.integrationTests) {
            recommendations.push("Prioritize unit tests for better test pyramid balance");
        }
        if (projectType === "api" && strategy.e2eTests < 2) {
            recommendations.push("Increase E2E tests for API contract validation");
        }
        return recommendations;
    }
    createImplementationPlan(strategy, timeline) {
        const phases = timeline === "agile"
            ? ["sprint1", "sprint2", "sprint3"]
            : timeline === "continuous"
                ? ["week1", "week2", "week3", "week4"]
                : ["phase1", "phase2", "phase3"];
        return {
            phases: phases.map((phase, index) => ({
                name: phase,
                focus: index === 0
                    ? "unit-tests"
                    : index === 1
                        ? "integration-tests"
                        : "e2e-tests",
                estimatedTests: Math.round(strategy.totalEstimated / phases.length),
            })),
            timeline,
            milestones: this.generateMilestones(strategy, timeline),
        };
    }
    generateExpectedTestFile(sourceFile) {
        const ext = path.extname(sourceFile);
        const baseName = path.basename(sourceFile, ext);
        const dir = path.dirname(sourceFile);
        return path.join(dir, "__tests__", `${baseName}.test${ext}`);
    }
    inferTestType(sourceFile) {
        const content = fs.readFileSync(sourceFile, "utf8");
        if (content.includes("export") && content.includes("function")) {
            return "unit";
        }
        if (content.includes("router") || content.includes("endpoint")) {
            return "integration";
        }
        if (content.includes("component") || content.includes("render")) {
            return "component";
        }
        return "unit";
    }
    calculateTestPriority(sourceFile) {
        const content = fs.readFileSync(sourceFile, "utf8");
        let priority = 1;
        // Critical business logic gets higher priority
        if (content.includes("auth") ||
            content.includes("security") ||
            content.includes("payment")) {
            priority += 3;
        }
        // Complex functions get higher priority
        if ((content.match(/function/g) || []).length > 5) {
            priority += 2;
        }
        // Public APIs get higher priority
        if (content.includes("export")) {
            priority += 1;
        }
        return Math.min(priority, 5);
    }
    estimateTestComplexity(sourceFile) {
        const content = fs.readFileSync(sourceFile, "utf8");
        const functions = (content.match(/function|class|interface/g) || []).length;
        const branches = (content.match(/if|switch|catch/g) || []).length;
        const asyncOps = (content.match(/async|await|Promise/g) || []).length;
        return Math.min(Math.round((functions + branches + asyncOps) / 3), 5);
    }
    calculateGapCoverage(gaps, totalFiles) {
        if (totalFiles === 0)
            return 100;
        return Math.round(((totalFiles - gaps.length) / totalFiles) * 100);
    }
    generateGapRecommendations(gaps) {
        const recommendations = [];
        const highPriorityGaps = gaps.filter((g) => g.priority >= 4);
        if (highPriorityGaps.length > 0) {
            recommendations.push(`Address ${highPriorityGaps.length} high-priority test gaps first`);
        }
        const complexGaps = gaps.filter((g) => g.complexity >= 4);
        if (complexGaps.length > 0) {
            recommendations.push(`Plan additional time for ${complexGaps.length} complex test implementations`);
        }
        return recommendations;
    }
    estimateOptimizationEffort(gap) {
        if (gap <= 10)
            return "1-2 days";
        if (gap <= 20)
            return "3-5 days";
        if (gap <= 30)
            return "1-2 weeks";
        return "2-4 weeks";
    }
    identifyPriorityAreas(projectRoot, focusAreas) {
        const areas = focusAreas || [
            "authentication",
            "data-validation",
            "api-endpoints",
            "ui-components",
        ];
        // Analyze codebase to identify actual priority areas
        const sourceFiles = this.findSourceFiles(projectRoot);
        const priorityAreas = [];
        for (const area of areas) {
            const relevantFiles = sourceFiles.filter((file) => fs
                .readFileSync(file, "utf8")
                .toLowerCase()
                .includes(area.toLowerCase()));
            if (relevantFiles.length > 0) {
                priorityAreas.push(`${area} (${relevantFiles.length} files)`);
            }
        }
        return priorityAreas;
    }
    createOptimizationPhases(gap, focusAreas) {
        const phases = [];
        if (gap > 30) {
            phases.push({
                name: "Phase 1: Critical Paths",
                focus: "authentication, security, payment flows",
                targetCoverage: 70,
                estimatedTests: Math.round(gap * 0.4),
            });
        }
        if (gap > 20) {
            phases.push({
                name: "Phase 2: Core Functionality",
                focus: "main business logic, data validation",
                targetCoverage: 80,
                estimatedTests: Math.round(gap * 0.4),
            });
        }
        phases.push({
            name: "Phase 3: Edge Cases & UI",
            focus: "error handling, ui components, edge cases",
            targetCoverage: 85,
            estimatedTests: Math.round(gap * 0.2),
        });
        return phases;
    }
    estimateOptimizationTimeline(optimization) {
        const baseDays = optimization.phases.length * 3;
        const complexityMultiplier = optimization.gap > 20 ? 1.5 : 1.0;
        return {
            estimatedDays: Math.round(baseDays * complexityMultiplier),
            phases: optimization.phases.map((phase) => ({
                name: phase.name,
                estimatedDays: Math.round(phase.estimatedTests / 5), // 5 tests per day estimate
            })),
        };
    }
    calculateOptimizationROI(optimization) {
        const effortDays = optimization.estimatedEffort.includes("days")
            ? parseInt(optimization.estimatedEffort)
            : 14;
        const coverageIncrease = optimization.gap;
        return {
            coverageIncrease: `${coverageIncrease}%`,
            effortDays,
            bugsPrevented: Math.round(coverageIncrease * 0.8), // Rough estimate
            confidenceIncrease: `${Math.min(coverageIncrease * 2, 90)}%`,
        };
    }
    generateMilestones(strategy, timeline) {
        const totalTests = strategy.unitTests +
            strategy.integrationTests +
            strategy.e2eTests +
            strategy.performanceTests +
            strategy.securityTests;
        strategy.totalEstimated = totalTests;
        if (timeline === "agile") {
            return [
                {
                    milestone: "Sprint 1 Complete",
                    tests: Math.round(totalTests * 0.3),
                    focus: "unit tests",
                },
                {
                    milestone: "Sprint 2 Complete",
                    tests: Math.round(totalTests * 0.6),
                    focus: "integration tests",
                },
                {
                    milestone: "Sprint 3 Complete",
                    tests: totalTests,
                    focus: "e2e and performance tests",
                },
            ];
        }
        return [
            {
                milestone: "Phase 1 Complete",
                tests: Math.round(totalTests * 0.4),
                focus: "foundation tests",
            },
            {
                milestone: "Phase 2 Complete",
                tests: Math.round(totalTests * 0.75),
                focus: "feature tests",
            },
            {
                milestone: "Phase 3 Complete",
                tests: totalTests,
                focus: "complete coverage",
            },
        ];
    }
    shouldIgnorePath(filePath) {
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
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log("StrRay Testing Strategy MCP Server started");
    }
}
// Start the server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new StrRayTestingStrategyServer();
    server.run().catch(console.error);
}
export default StrRayTestingStrategyServer;
//# sourceMappingURL=testing-strategy.server.js.map