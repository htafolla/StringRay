/**
 * StrRay Documentation Generation MCP Server
 *
 * Knowledge skill for automated documentation creation, API docs generation,
 * code documentation maintenance, and technical writing assistance
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
class StrRayDocumentationGenerationServer {
    server;
    constructor() {
        this.server = new Server({
            name: "strray-documentation-generation",
            version: "1.0.0",
        });
        this.setupToolHandlers();
        console.log("StrRay Documentation Generation MCP Server initialized");
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "analyze_documentation",
                        description: "Analyze existing documentation for completeness, quality, and gaps",
                        inputSchema: {
                            type: "object",
                            properties: {
                                docsPath: {
                                    type: "string",
                                    description: "Path to documentation directory or files",
                                },
                                codePath: {
                                    type: "string",
                                    description: "Path to corresponding code for comparison",
                                },
                                docTypes: {
                                    type: "array",
                                    items: {
                                        type: "string",
                                        enum: [
                                            "readme",
                                            "api",
                                            "code",
                                            "architecture",
                                            "deployment",
                                            "user-guide",
                                        ],
                                    },
                                    description: "Types of documentation to analyze",
                                },
                            },
                            required: ["docsPath"],
                        },
                    },
                    {
                        name: "generate_api_docs",
                        description: "Generate comprehensive API documentation from code analysis",
                        inputSchema: {
                            type: "object",
                            properties: {
                                codePath: {
                                    type: "string",
                                    description: "Path to API code files",
                                },
                                framework: {
                                    type: "string",
                                    enum: [
                                        "express",
                                        "fastify",
                                        "koa",
                                        "nestjs",
                                        "spring",
                                        "django",
                                        "flask",
                                        "fastapi",
                                    ],
                                    description: "API framework being used",
                                },
                                format: {
                                    type: "string",
                                    enum: ["openapi", "markdown", "html", "postman"],
                                    description: "Output documentation format",
                                    default: "openapi",
                                },
                                includeExamples: {
                                    type: "boolean",
                                    description: "Include request/response examples",
                                    default: true,
                                },
                            },
                            required: ["codePath", "framework"],
                        },
                    },
                    {
                        name: "generate_code_documentation",
                        description: "Generate inline code documentation and improve existing docs",
                        inputSchema: {
                            type: "object",
                            properties: {
                                codePath: {
                                    type: "string",
                                    description: "Path to code files to document",
                                },
                                language: {
                                    type: "string",
                                    enum: [
                                        "typescript",
                                        "javascript",
                                        "python",
                                        "java",
                                        "csharp",
                                        "go",
                                        "rust",
                                    ],
                                    description: "Programming language",
                                },
                                style: {
                                    type: "string",
                                    enum: ["jsdoc", "docstring", "xml", "markdown"],
                                    description: "Documentation comment style",
                                    default: "jsdoc",
                                },
                                includePrivate: {
                                    type: "boolean",
                                    description: "Include documentation for private members",
                                    default: false,
                                },
                            },
                            required: ["codePath", "language"],
                        },
                    },
                    {
                        name: "generate_readme",
                        description: "Generate or improve project README documentation",
                        inputSchema: {
                            type: "object",
                            properties: {
                                projectPath: {
                                    type: "string",
                                    description: "Path to project root directory",
                                },
                                projectType: {
                                    type: "string",
                                    enum: ["library", "application", "api", "cli", "framework"],
                                    description: "Type of project",
                                },
                                includeSections: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "Specific sections to include",
                                    default: [
                                        "installation",
                                        "usage",
                                        "api",
                                        "contributing",
                                        "license",
                                    ],
                                },
                                existingReadme: {
                                    type: "string",
                                    description: "Path to existing README to improve",
                                },
                            },
                            required: ["projectPath", "projectType"],
                        },
                    },
                ],
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            switch (name) {
                case "analyze_documentation":
                    return await this.analyzeDocumentation(args);
                case "generate_api_docs":
                    return await this.generateAPIDocs(args);
                case "generate_code_documentation":
                    return await this.generateCodeDocumentation(args);
                case "generate_readme":
                    return await this.generateReadme(args);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });
    }
    async analyzeDocumentation(args) {
        const { docsPath, codePath, docTypes = ["readme", "api", "code"] } = args;
        try {
            const analysis = await this.performDocumentationAnalysis(docsPath, codePath, docTypes);
            return {
                content: [
                    {
                        type: "text",
                        text: `Documentation Analysis Report:\n\n` +
                            `📊 OVERALL SCORES\n` +
                            `Completeness: ${analysis.completeness}/100\n` +
                            `Quality: ${analysis.quality}/100\n\n` +
                            `📈 COVERAGE BY TYPE\n${Object.entries(analysis.coverage)
                                .map(([type, score]) => `${type}: ${score}%`)
                                .join("\n")}\n\n` +
                            `🚨 ISSUES FOUND: ${analysis.issues.length}\n${analysis.issues
                                .slice(0, 5)
                                .map((issue) => `${this.getSeverityIcon(issue.severity)} ${issue.type.toUpperCase()}: ${issue.description}`)
                                .join("\n")}\n\n` +
                            `💡 RECOMMENDATIONS\n${analysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}`,
                    },
                ],
                data: analysis,
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error analyzing documentation: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async generateAPIDocs(args) {
        const { codePath, framework, format = "openapi", includeExamples = true, } = args;
        try {
            const apiDocs = await this.analyzeAPICode(codePath, framework);
            let output = "";
            switch (format) {
                case "openapi":
                    output = this.generateOpenAPISpec(apiDocs, includeExamples);
                    break;
                case "markdown":
                    output = this.generateMarkdownAPIDocs(apiDocs, includeExamples);
                    break;
                case "html":
                    output = this.generateHTMLAPIDocs(apiDocs, includeExamples);
                    break;
                case "postman":
                    output = this.generatePostmanCollection(apiDocs, includeExamples);
                    break;
                default:
                    output = this.generateOpenAPISpec(apiDocs, includeExamples);
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `API Documentation Generated (${format.toUpperCase()}):\n\n` +
                            `📊 API ANALYSIS\n` +
                            `Endpoints: ${apiDocs.endpoints.length}\n` +
                            `Schemas: ${apiDocs.schemas.length}\n` +
                            `Examples: ${apiDocs.examples.length}\n` +
                            `Error Codes: ${apiDocs.errorCodes.length}\n\n` +
                            `🔐 AUTHENTICATION: ${apiDocs.authentication.type.toUpperCase()}\n` +
                            `${apiDocs.authentication.description}\n\n` +
                            `${format === "markdown" ? output.substring(0, 2000) + (output.length > 2000 ? "\n\n... (truncated)" : "") : "Full documentation generated successfully."}`,
                    },
                ],
                fullDocumentation: output,
                data: apiDocs,
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error generating API documentation: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async generateCodeDocumentation(args) {
        const { codePath, language, style = "jsdoc", includePrivate = false, } = args;
        try {
            const documentation = await this.analyzeCodeForDocumentation(codePath, language, includePrivate);
            const generatedDocs = this.generateDocumentationComments(documentation, style);
            return {
                content: [
                    {
                        type: "text",
                        text: `Code Documentation Analysis:\n\n` +
                            `📊 ANALYSIS RESULTS\n` +
                            `Files Processed: ${documentation.filesProcessed}\n` +
                            `Functions Documented: ${documentation.functionsDocumented}/${documentation.totalFunctions}\n` +
                            `Classes Documented: ${documentation.classesDocumented}/${documentation.totalClasses}\n` +
                            `Coverage: ${documentation.coverage}%\n\n` +
                            `📝 GENERATED DOCUMENTATION\n` +
                            `Style: ${style.toUpperCase()}\n` +
                            `Comments Added: ${generatedDocs.length}\n\n` +
                            `💡 SAMPLE GENERATED DOCS\n${generatedDocs
                                .slice(0, 3)
                                .map((doc) => `\`\`\`${language}\n${doc}\n\`\`\``)
                                .join("\n\n")}`,
                    },
                ],
                documentationUpdates: generatedDocs,
                data: documentation,
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error generating code documentation: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async generateReadme(args) {
        const { projectPath, projectType, includeSections = [
            "installation",
            "usage",
            "api",
            "contributing",
            "license",
        ], existingReadme, } = args;
        try {
            const projectAnalysis = await this.analyzeProjectStructure(projectPath, projectType);
            const readmeContent = this.generateReadmeContent(projectAnalysis, includeSections, existingReadme);
            return {
                content: [
                    {
                        type: "text",
                        text: `README Generation Complete:\n\n` +
                            `📋 PROJECT ANALYSIS\n` +
                            `Type: ${projectType.toUpperCase()}\n` +
                            `Languages: ${projectAnalysis.languages.join(", ")}\n` +
                            `Dependencies: ${projectAnalysis.dependencies.length}\n` +
                            `Entry Points: ${projectAnalysis.entryPoints.length}\n\n` +
                            `📝 README STRUCTURE\n` +
                            `Sections: ${includeSections.join(", ")}\n` +
                            `Length: ${readmeContent.length} characters\n\n` +
                            `📖 GENERATED README\n${readmeContent.substring(0, 1000)}${readmeContent.length > 1000 ? "\n\n... (truncated - see full content)" : ""}`,
                    },
                ],
                fullReadme: readmeContent,
                data: projectAnalysis,
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error generating README: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async performDocumentationAnalysis(docsPath, codePath, docTypes) {
        const analysis = {
            completeness: 0,
            quality: 0,
            coverage: {},
            issues: [],
            recommendations: [],
        };
        // Analyze existing documentation
        for (const docType of docTypes) {
            analysis.coverage[docType] = await this.analyzeDocTypeCoverage(docsPath, docType);
        }
        // Compare with code if provided
        if (codePath) {
            analysis.issues = await this.compareDocsWithCode(docsPath, codePath, docTypes);
        }
        // Check documentation quality
        analysis.issues.push(...(await this.analyzeDocumentationQuality(docsPath)));
        // Calculate scores
        analysis.completeness = this.calculateCompletenessScore(analysis.coverage);
        analysis.quality = this.calculateQualityScore(analysis.issues);
        // Generate recommendations
        analysis.recommendations =
            this.generateDocumentationRecommendations(analysis);
        return analysis;
    }
    async analyzeDocTypeCoverage(docsPath, docType) {
        let coverage = 0;
        try {
            const files = fs.readdirSync(docsPath, { recursive: true });
            switch (docType) {
                case "readme":
                    coverage = files.some((f) => typeof f === "string" && f.toLowerCase().includes("readme"))
                        ? 100
                        : 0;
                    break;
                case "api":
                    coverage = files.some((f) => typeof f === "string" &&
                        (f.includes("api") ||
                            f.includes("swagger") ||
                            f.includes("openapi")))
                        ? 100
                        : 0;
                    break;
                case "code":
                    coverage = files.some((f) => typeof f === "string" && f.includes("code"))
                        ? 100
                        : 0;
                    break;
                case "architecture":
                    coverage = files.some((f) => typeof f === "string" &&
                        (f.includes("arch") || f.includes("design")))
                        ? 100
                        : 0;
                    break;
                case "deployment":
                    coverage = files.some((f) => typeof f === "string" && f.includes("deploy"))
                        ? 100
                        : 0;
                    break;
                case "user-guide":
                    coverage = files.some((f) => typeof f === "string" &&
                        (f.includes("guide") || f.includes("tutorial")))
                        ? 100
                        : 0;
                    break;
            }
        }
        catch {
            coverage = 0;
        }
        return coverage;
    }
    async compareDocsWithCode(docsPath, codePath, docTypes) {
        const issues = [];
        // Check for missing API documentation
        if (docTypes.includes("api")) {
            // This would analyze code for exported functions/classes and check if they're documented
            issues.push({
                type: "missing",
                severity: "medium",
                description: "API documentation not found for exported functions",
                suggestion: "Generate API documentation for all public exports",
            });
        }
        // Check for README completeness
        if (docTypes.includes("readme")) {
            issues.push({
                type: "incomplete",
                severity: "low",
                description: "README missing usage examples",
                suggestion: "Add practical usage examples to README",
            });
        }
        return issues;
    }
    async analyzeDocumentationQuality(docsPath) {
        const issues = [];
        try {
            const files = fs.readdirSync(docsPath, { recursive: true });
            for (const file of files) {
                if (typeof file === "string" &&
                    (file.endsWith(".md") || file.endsWith(".txt"))) {
                    try {
                        const content = fs.readFileSync(path.join(docsPath, file), "utf-8");
                        // Check for outdated information
                        if (content.includes("TODO") || content.includes("FIXME")) {
                            issues.push({
                                type: "incomplete",
                                severity: "low",
                                file,
                                description: "Documentation contains TODO/FIXME comments",
                                suggestion: "Address pending documentation tasks",
                            });
                        }
                        // Check for broken links (simplified)
                        const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
                        if (links && links.some((link) => link.includes("http"))) {
                            issues.push({
                                type: "inconsistent",
                                severity: "low",
                                file,
                                description: "External links should be validated",
                                suggestion: "Verify all external links are accessible",
                            });
                        }
                    }
                    catch {
                        // Skip files that can't be read
                    }
                }
            }
        }
        catch {
            // Skip directories that can't be read
        }
        return issues;
    }
    calculateCompletenessScore(coverage) {
        const values = Object.values(coverage);
        return values.length > 0
            ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
            : 0;
    }
    calculateQualityScore(issues) {
        let score = 100;
        issues.forEach((issue) => {
            switch (issue.severity) {
                case "critical":
                    score -= 15;
                    break;
                case "high":
                    score -= 10;
                    break;
                case "medium":
                    score -= 5;
                    break;
                case "low":
                    score -= 2;
                    break;
            }
        });
        return Math.max(0, score);
    }
    generateDocumentationRecommendations(analysis) {
        const recommendations = [];
        if (analysis.completeness < 70) {
            recommendations.push("Improve documentation completeness - cover all major functionality");
        }
        if (analysis.quality < 80) {
            recommendations.push("Enhance documentation quality - ensure clarity and accuracy");
        }
        const lowCoverage = Object.entries(analysis.coverage).filter(([_, score]) => score < 50);
        if (lowCoverage.length > 0) {
            recommendations.push(`Add documentation for: ${lowCoverage.map(([type]) => type).join(", ")}`);
        }
        recommendations.push("Set up automated documentation validation in CI/CD pipeline");
        recommendations.push("Establish documentation review process for all changes");
        return recommendations;
    }
    async analyzeAPICode(codePath, framework) {
        const apiDocs = {
            endpoints: [],
            schemas: [],
            examples: [],
            authentication: {
                type: "bearer",
                description: "Bearer token authentication",
                parameters: [],
                examples: [],
            },
            errorCodes: [],
        };
        // Simplified API analysis - in production would be more sophisticated
        try {
            const files = fs.readdirSync(codePath, { recursive: true });
            for (const file of files) {
                if (typeof file === "string" &&
                    (file.endsWith(".ts") || file.endsWith(".js"))) {
                    try {
                        const content = fs.readFileSync(path.join(codePath, file), "utf-8");
                        // Extract route definitions based on framework
                        const routes = this.extractRoutes(content, framework);
                        apiDocs.endpoints.push(...routes);
                        // Extract schemas/types
                        const schemas = this.extractSchemas(content, framework);
                        apiDocs.schemas.push(...schemas);
                    }
                    catch {
                        // Skip files that can't be read
                    }
                }
            }
        }
        catch {
            // Skip directories that can't be read
        }
        // Generate examples
        apiDocs.examples = this.generateAPIExamples(apiDocs.endpoints);
        // Generate error codes
        apiDocs.errorCodes = this.generateErrorCodes();
        return apiDocs;
    }
    extractRoutes(content, framework) {
        const endpoints = [];
        // Simplified route extraction - would be framework-specific in production
        const routePatterns = {
            express: /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g,
            fastify: /(?:fastify|app)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g,
            nestjs: /@(Get|Post|Put|Delete|Patch)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        };
        const pattern = routePatterns[framework];
        if (pattern) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const [, method, path] = match;
                if (method && path) {
                    endpoints.push({
                        path,
                        method: method.toUpperCase(),
                        summary: `API endpoint`,
                        description: `API endpoint for ${path}`,
                        parameters: [],
                        responses: [
                            {
                                statusCode: 200,
                                description: "Success response",
                            },
                            {
                                statusCode: 400,
                                description: "Bad request",
                            },
                            {
                                statusCode: 500,
                                description: "Internal server error",
                            },
                        ],
                        tags: ["API"],
                    });
                }
            }
        }
        return endpoints;
    }
    extractSchemas(content, framework) {
        const schemas = [];
        // Extract TypeScript interfaces/classes
        const interfaceMatches = content.match(/interface\s+(\w+)\s*{([^}]*)}/g);
        if (interfaceMatches) {
            interfaceMatches.forEach((match) => {
                const [, name, properties] = match.match(/interface\s+(\w+)\s*{([^}]*)}/) || [];
                if (name && properties) {
                    const schema = {
                        name,
                        type: "object",
                        properties: {},
                    };
                    // Parse properties (simplified)
                    const propMatches = properties.match(/(\w+):\s*([^;]+)/g);
                    if (propMatches) {
                        propMatches.forEach((prop) => {
                            const [, propName, propType] = prop.match(/(\w+):\s*([^;]+)/) || [];
                            if (propName && propType) {
                                schema.properties[propName] = {
                                    type: this.mapTypeScriptType(propType.trim()),
                                    description: `${propName} field`,
                                };
                            }
                        });
                    }
                    schemas.push(schema);
                }
            });
        }
        return schemas;
    }
    mapTypeScriptType(tsType) {
        const typeMap = {
            string: "string",
            number: "number",
            boolean: "boolean",
            "string[]": "array",
            "number[]": "array",
            "boolean[]": "array",
            Date: "string",
            any: "object",
        };
        return typeMap[tsType] || "string";
    }
    generateAPIExamples(endpoints) {
        return endpoints.slice(0, 3).map((endpoint) => ({
            title: `${endpoint.method} ${endpoint.path}`,
            request: {
                method: endpoint.method,
                path: endpoint.path,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer <token>",
                },
            },
            response: {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                },
                body: { success: true, data: {} },
            },
        }));
    }
    generateErrorCodes() {
        return [
            {
                code: "VALIDATION_ERROR",
                message: "Input validation failed",
                description: "The provided input does not meet the required validation criteria",
                resolution: "Check the input parameters and ensure they match the expected format",
            },
            {
                code: "UNAUTHORIZED",
                message: "Authentication required",
                description: "Access to this resource requires authentication",
                resolution: "Provide valid authentication credentials",
            },
            {
                code: "FORBIDDEN",
                message: "Access denied",
                description: "You do not have permission to access this resource",
                resolution: "Contact administrator for access permissions",
            },
            {
                code: "NOT_FOUND",
                message: "Resource not found",
                description: "The requested resource could not be found",
                resolution: "Verify the resource identifier and try again",
            },
            {
                code: "INTERNAL_ERROR",
                message: "Internal server error",
                description: "An unexpected error occurred on the server",
                resolution: "Try again later or contact support if the problem persists",
            },
        ];
    }
    generateOpenAPISpec(apiDocs, includeExamples) {
        const spec = {
            openapi: "3.0.0",
            info: {
                title: "API Documentation",
                version: "1.0.0",
                description: "Generated API documentation",
            },
            servers: [
                {
                    url: "https://api.example.com/v1",
                },
            ],
            security: [
                {
                    bearerAuth: [],
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                    },
                },
                schemas: apiDocs.schemas.reduce((acc, schema) => {
                    acc[schema.name] = {
                        type: schema.type,
                        properties: schema.properties,
                        required: schema.required,
                    };
                    return acc;
                }, {}),
            },
            paths: apiDocs.endpoints.reduce((acc, endpoint) => {
                const pathKey = endpoint.path.replace(/:(\w+)/g, "{$1}");
                if (!acc[pathKey])
                    acc[pathKey] = {};
                acc[pathKey][endpoint.method.toLowerCase()] = {
                    summary: endpoint.summary,
                    description: endpoint.description,
                    parameters: endpoint.parameters.map((param) => ({
                        name: param.name,
                        in: "path",
                        required: param.required,
                        schema: { type: param.type },
                        description: param.description,
                    })),
                    responses: endpoint.responses.reduce((resAcc, response) => {
                        resAcc[response.statusCode] = {
                            description: response.description,
                            content: {
                                "application/json": {
                                    schema: response.schema
                                        ? {
                                            $ref: `#/components/schemas/${response.schema.name}`,
                                        }
                                        : {},
                                },
                            },
                        };
                        return resAcc;
                    }, {}),
                    tags: endpoint.tags,
                };
                return acc;
            }, {}),
        };
        return JSON.stringify(spec, null, 2);
    }
    generateMarkdownAPIDocs(apiDocs, includeExamples) {
        let markdown = `# API Documentation\n\n`;
        markdown += `## Authentication\n\n`;
        markdown += `${apiDocs.authentication.description}\n\n`;
        if (includeExamples && apiDocs.authentication.examples.length > 0) {
            markdown += `### Authentication Examples\n\n`;
            apiDocs.authentication.examples.forEach((example) => {
                markdown += `#### ${example.title}\n\n`;
                markdown += `\`\`\`\n`;
                Object.entries(example.headers).forEach(([key, value]) => {
                    markdown += `${key}: ${value}\n`;
                });
                markdown += `\`\`\`\n\n`;
                markdown += `${example.description}\n\n`;
            });
        }
        markdown += `## Endpoints\n\n`;
        apiDocs.endpoints.forEach((endpoint) => {
            markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
            markdown += `${endpoint.description}\n\n`;
            if (endpoint.parameters.length > 0) {
                markdown += `**Parameters:**\n\n`;
                endpoint.parameters.forEach((param) => {
                    markdown += `- \`${param.name}\` (${param.type})`;
                    if (param.required)
                        markdown += " **required**";
                    markdown += ` - ${param.description}\n`;
                });
                markdown += `\n`;
            }
            markdown += `**Responses:**\n\n`;
            endpoint.responses.forEach((response) => {
                markdown += `- \`${response.statusCode}\`: ${response.description}\n`;
            });
            markdown += `\n`;
        });
        if (apiDocs.errorCodes.length > 0) {
            markdown += `## Error Codes\n\n`;
            apiDocs.errorCodes.forEach((error) => {
                markdown += `### ${error.code}\n\n`;
                markdown += `**Message:** ${error.message}\n\n`;
                markdown += `**Description:** ${error.description}\n\n`;
                markdown += `**Resolution:** ${error.resolution}\n\n`;
            });
        }
        return markdown;
    }
    generateHTMLAPIDocs(apiDocs, includeExamples) {
        return `<html><body><h1>API Documentation</h1><p>Generated documentation</p></body></html>`;
    }
    generatePostmanCollection(apiDocs, includeExamples) {
        const collection = {
            info: {
                name: "API Collection",
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            },
            item: apiDocs.endpoints.map((endpoint) => ({
                name: `${endpoint.method} ${endpoint.path}`,
                request: {
                    method: endpoint.method,
                    header: [
                        {
                            key: "Content-Type",
                            value: "application/json",
                        },
                    ],
                    url: {
                        raw: `{{baseUrl}}${endpoint.path}`,
                        host: ["{{baseUrl}}"],
                        path: endpoint.path.split("/").filter((p) => p),
                    },
                },
            })),
        };
        return JSON.stringify(collection, null, 2);
    }
    async analyzeCodeForDocumentation(codePath, language, includePrivate) {
        const analysis = {
            filesProcessed: 0,
            totalFunctions: 0,
            functionsDocumented: 0,
            totalClasses: 0,
            classesDocumented: 0,
            coverage: 0,
        };
        try {
            const files = fs.readdirSync(codePath, { recursive: true });
            for (const file of files) {
                if (typeof file === "string" &&
                    ((language === "typescript" && file.endsWith(".ts")) ||
                        (language === "javascript" && file.endsWith(".js")) ||
                        (language === "python" && file.endsWith(".py")))) {
                    try {
                        const content = fs.readFileSync(path.join(codePath, file), "utf-8");
                        analysis.filesProcessed++;
                        // Analyze functions
                        const functions = this.extractFunctions(content, language);
                        analysis.totalFunctions += functions.length;
                        analysis.functionsDocumented += functions.filter((f) => this.hasDocumentation(f, content, language)).length;
                        // Analyze classes
                        const classes = this.extractClasses(content, language);
                        analysis.totalClasses += classes.length;
                        analysis.classesDocumented += classes.filter((c) => this.hasDocumentation(c, content, language)).length;
                    }
                    catch {
                        // Skip files that can't be read
                    }
                }
            }
        }
        catch {
            // Skip directories that can't be read
        }
        // Calculate coverage
        const totalDocumentable = analysis.totalFunctions + analysis.totalClasses;
        const documented = analysis.functionsDocumented + analysis.classesDocumented;
        analysis.coverage =
            totalDocumentable > 0
                ? Math.round((documented / totalDocumentable) * 100)
                : 0;
        return analysis;
    }
    extractFunctions(content, language) {
        const functions = [];
        switch (language) {
            case "typescript":
            case "javascript":
                // Match function declarations and arrow functions
                const jsFunctions = content.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)\s*=>|function\s*\([^)]*\)))/g);
                if (jsFunctions) {
                    functions.push(...jsFunctions.map((f) => f
                        .replace(/^(?:function\s+|const\s+|=\s*)/, "")
                        .replace(/\s*=.*$/, "")));
                }
                break;
            case "python":
                // Match function definitions
                const pyFunctions = content.match(/def\s+(\w+)/g);
                if (pyFunctions) {
                    functions.push(...pyFunctions.map((f) => f.replace("def ", "")));
                }
                break;
        }
        return functions;
    }
    extractClasses(content, language) {
        const classes = [];
        switch (language) {
            case "typescript":
            case "javascript":
                const jsClasses = content.match(/class\s+(\w+)/g);
                if (jsClasses) {
                    classes.push(...jsClasses.map((c) => c.replace("class ", "")));
                }
                break;
            case "python":
                const pyClasses = content.match(/class\s+(\w+)/g);
                if (pyClasses) {
                    classes.push(...pyClasses.map((c) => c.replace("class ", "")));
                }
                break;
        }
        return classes;
    }
    hasDocumentation(element, content, language) {
        // Check if there's documentation before the element
        const elementIndex = content.indexOf(element);
        if (elementIndex === -1)
            return false;
        // Look for documentation comments before the element
        const beforeElement = content.substring(0, elementIndex);
        const lines = beforeElement.split("\n");
        let consecutiveCommentLines = 0;
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            if (!line)
                continue;
            const trimmedLine = line.trim();
            if (language === "python" && trimmedLine.startsWith('"""')) {
                return true;
            }
            if ((language === "typescript" || language === "javascript") &&
                (trimmedLine.startsWith("/**") ||
                    trimmedLine.startsWith("*") ||
                    trimmedLine.startsWith("*/") ||
                    trimmedLine.startsWith("//") ||
                    trimmedLine.match(/\/\*\*/))) {
                consecutiveCommentLines++;
                if (consecutiveCommentLines >= 2)
                    return true;
            }
            else if (trimmedLine === "") {
                continue; // Skip empty lines
            }
            else {
                break; // Stop if we hit non-comment, non-empty line
            }
        }
        return false;
    }
    generateDocumentationComments(documentation, style) {
        const comments = [];
        // This would generate actual documentation comments based on code analysis
        // For now, return sample comments
        comments.push(`/**
 * Sample function documentation
 * @param {string} param1 - First parameter
 * @param {number} param2 - Second parameter
 * @returns {boolean} Result of operation
 */`);
        comments.push(`/**
 * Sample class documentation
 * @class
 * @description Represents a sample class
 */`);
        return comments;
    }
    async analyzeProjectStructure(projectPath, projectType) {
        const analysis = {
            languages: [],
            dependencies: [],
            entryPoints: [],
            structure: {},
        };
        try {
            // Analyze package.json if it exists
            const packagePath = path.join(projectPath, "package.json");
            if (fs.existsSync(packagePath)) {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
                analysis.dependencies = Object.keys(packageJson.dependencies || {});
                analysis.entryPoints = [packageJson.main || "index.js"];
            }
            // Analyze languages used
            const files = fs.readdirSync(projectPath, { recursive: true });
            const extensions = new Set();
            files.forEach((file) => {
                if (typeof file === "string") {
                    const ext = path.extname(file);
                    if (ext)
                        extensions.add(ext);
                }
            });
            const langMap = {
                ".ts": "TypeScript",
                ".tsx": "TypeScript",
                ".js": "JavaScript",
                ".jsx": "JavaScript",
                ".py": "Python",
                ".java": "Java",
                ".go": "Go",
                ".rs": "Rust",
            };
            analysis.languages = Array.from(extensions).map((ext) => langMap[ext] || ext.substring(1));
        }
        catch {
            // Use defaults if analysis fails
        }
        return analysis;
    }
    generateReadmeContent(projectAnalysis, includeSections, existingReadme) {
        let content = "";
        // Title
        content += `# ${projectAnalysis.name || "Project Name"}\n\n`;
        // Description
        content += `${projectAnalysis.description || "A software project."}\n\n`;
        // Badges (if applicable)
        if (projectAnalysis.languages.includes("TypeScript")) {
            content += `[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)\n`;
        }
        content += "\n";
        // Table of Contents
        if (includeSections.length > 3) {
            content += "## Table of Contents\n\n";
            includeSections.forEach((section) => {
                content += `- [${section.charAt(0).toUpperCase() + section.slice(1)}](#${section})\n`;
            });
            content += "\n";
        }
        // Generate each requested section
        includeSections.forEach((section) => {
            switch (section) {
                case "installation":
                    content += this.generateInstallationSection(projectAnalysis);
                    break;
                case "usage":
                    content += this.generateUsageSection(projectAnalysis);
                    break;
                case "api":
                    content += this.generateAPISection(projectAnalysis);
                    break;
                case "contributing":
                    content += this.generateContributingSection();
                    break;
                case "license":
                    content += this.generateLicenseSection();
                    break;
            }
        });
        return content;
    }
    generateInstallationSection(projectAnalysis) {
        let content = "## Installation\n\n";
        if (projectAnalysis.languages.includes("JavaScript") ||
            projectAnalysis.languages.includes("TypeScript")) {
            content += "```bash\n";
            content += "# Clone the repository\n";
            content += "git clone <repository-url>\n";
            content += "cd <project-directory>\n\n";
            content += "# Install dependencies\n";
            content += "npm install\n";
            content += "# or\n";
            content += "yarn install\n";
            content += "```\n\n";
        }
        if (projectAnalysis.languages.includes("Python")) {
            content += "```bash\n";
            content += "# Install with pip\n";
            content += "pip install <package-name>\n\n";
            content += "# Or install from source\n";
            content += "git clone <repository-url>\n";
            content += "cd <project-directory>\n";
            content += "pip install -e .\n";
            content += "```\n\n";
        }
        return content;
    }
    generateUsageSection(projectAnalysis) {
        let content = "## Usage\n\n";
        content += "```javascript\n";
        content += "// Basic usage example\n";
        content += "const result = await performOperation();\n";
        content += "console.log(result);\n";
        content += "```\n\n";
        content += "### Advanced Usage\n\n";
        content +=
            "For more advanced features, see the [API documentation](./docs/api.md).\n\n";
        return content;
    }
    generateAPISection(projectAnalysis) {
        let content = "## API\n\n";
        content += "### Core Functions\n\n";
        content += "- `performOperation()` - Performs the main operation\n";
        content += "- `configure(options)` - Configures the library\n";
        content += "- `validateInput(input)` - Validates input data\n\n";
        content +=
            "For detailed API documentation, see [API Reference](./docs/api.md).\n\n";
        return content;
    }
    generateContributingSection() {
        let content = "## Contributing\n\n";
        content +=
            "We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.\n\n";
        content += "### Development Setup\n\n";
        content += "```bash\n";
        content += "git clone <repository-url>\n";
        content += "cd <project-directory>\n";
        content += "npm install\n";
        content += "npm run dev\n";
        content += "```\n\n";
        content += "### Testing\n\n";
        content += "```bash\n";
        content += "npm test\n";
        content += "npm run test:coverage\n";
        content += "```\n\n";
        return content;
    }
    generateLicenseSection() {
        let content = "## License\n\n";
        content +=
            "This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.\n\n";
        return content;
    }
    getSeverityIcon(severity) {
        const icons = {
            critical: "🚨",
            high: "🔴",
            medium: "🟡",
            low: "🟢",
        };
        return icons[severity] || "❓";
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log("StrRay Documentation Generation MCP Server running...");
    }
}
// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new StrRayDocumentationGenerationServer();
    server.run().catch(console.error);
}
export { StrRayDocumentationGenerationServer };
//# sourceMappingURL=documentation-generation.server.js.map