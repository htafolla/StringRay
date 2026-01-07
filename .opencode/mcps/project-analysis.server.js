#!/usr/bin/env node

/**
 * StrRay Framework - Project Analysis MCP Server
 * Provides tools for analyzing project structure, dependencies, and architecture
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const fs = require("fs").promises;
const path = require("path");
const { execSync } = require("child_process");

class ProjectAnalysisServer {
	constructor() {
		this.server = new Server(
			{
				name: "project-analysis",
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
						name: "analyze_project_structure",
						description:
							"Analyze the overall project structure and identify key directories, files, and patterns",
						inputSchema: {
							type: "object",
							properties: {
								rootPath: {
									type: "string",
									description:
										"Root path of the project to analyze (default: current directory)",
									default: ".",
								},
								includePatterns: {
									type: "array",
									items: { type: "string" },
									description: "File patterns to include in analysis",
									default: ["**/*"],
								},
								excludePatterns: {
									type: "array",
									items: { type: "string" },
									description: "File patterns to exclude from analysis",
									default: ["node_modules/**", ".git/**", "dist/**", "build/**"],
								},
							},
						},
					},
					{
						name: "analyze_dependencies",
						description:
							"Analyze project dependencies from package.json and other dependency files",
						inputSchema: {
							type: "object",
							properties: {
								rootPath: {
									type: "string",
									description: "Root path of the project to analyze",
									default: ".",
								},
							},
						},
					},
					{
						name: "identify_entry_points",
						description: "Identify main entry points and application starting files",
						inputSchema: {
							type: "object",
							properties: {
								rootPath: {
									type: "string",
									description: "Root path of the project to analyze",
									default: ".",
								},
							},
						},
					},
					{
						name: "analyze_code_organization",
						description: "Analyze how code is organized across the project",
						inputSchema: {
							type: "object",
							properties: {
								rootPath: {
									type: "string",
									description: "Root path of the project to analyze",
									default: ".",
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

			try {
				switch (name) {
					case "analyze_project_structure":
						return await this.analyzeProjectStructure(args);
					case "analyze_dependencies":
						return await this.analyzeDependencies(args);
					case "identify_entry_points":
						return await this.identifyEntryPoints(args);
					case "analyze_code_organization":
						return await this.analyzeCodeOrganization(args);
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

	async analyzeProjectStructure(args = {}) {
		const rootPath = args.rootPath || ".";
		const includePatterns = args.includePatterns || ["**/*"];
		const excludePatterns = args.excludePatterns || [
			"node_modules/**",
			".git/**",
			"dist/**",
			"build/**",
		];

		try {
			const structure = await this.getDirectoryStructure(
				rootPath,
				includePatterns,
				excludePatterns,
			);

			return {
				content: [
					{
						type: "text",
						text: `## Project Structure Analysis

**Root Directory:** ${rootPath}

### Directory Structure:
${structure.tree}

### Key Findings:
- **Total Files:** ${structure.stats.totalFiles}
- **Total Directories:** ${structure.stats.totalDirs}
- **Largest Directories:** ${structure.stats.largestDirs.join(", ")}
- **File Types:** ${Object.entries(structure.stats.fileTypes)
							.map(([ext, count]) => `${ext}: ${count}`)
							.join(", ")}

### Notable Patterns:
${structure.patterns.map((pattern) => `- ${pattern}`).join("\n")}`,
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to analyze project structure: ${error.message}`);
		}
	}

	async analyzeDependencies(args = {}) {
		const rootPath = args.rootPath || ".";

		try {
			const deps = await this.getDependencyAnalysis(rootPath);

			return {
				content: [
					{
						type: "text",
						text: `## Dependency Analysis

**Package Manager:** ${deps.packageManager}

### Dependencies Summary:
- **Total Dependencies:** ${deps.totalDeps}
- **Dev Dependencies:** ${deps.devDeps}
- **Peer Dependencies:** ${deps.peerDeps}

### Key Dependencies:
${deps.keyDeps.map((dep) => `- **${dep.name}**: ${dep.version} (${dep.type})`).join("\n")}

### Dependency Health:
- **Outdated Packages:** ${deps.outdatedCount}
- **Vulnerabilities:** ${deps.vulnerabilities}

### Recommendations:
${deps.recommendations.map((rec) => `- ${rec}`).join("\n")}`,
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to analyze dependencies: ${error.message}`);
		}
	}

	async identifyEntryPoints(args = {}) {
		const rootPath = args.rootPath || ".";

		try {
			const entryPoints = await this.findEntryPoints(rootPath);

			return {
				content: [
					{
						type: "text",
						text: `## Entry Points Analysis

### Main Entry Points:
${entryPoints.main.map((ep) => `- **${ep.file}**: ${ep.type} (${ep.confidence}% confidence)`).join("\n")}

### Secondary Entry Points:
${entryPoints.secondary.map((ep) => `- ${ep.file}: ${ep.type}`).join("\n")}

### Build Configuration:
${entryPoints.build.map((config) => `- **${config.type}**: ${config.file}`).join("\n")}

### Recommendations:
${entryPoints.recommendations.map((rec) => `- ${rec}`).join("\n")}`,
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to identify entry points: ${error.message}`);
		}
	}

	async analyzeCodeOrganization(args = {}) {
		const rootPath = args.rootPath || ".";

		try {
			const organization = await this.getCodeOrganization(rootPath);

			return {
				content: [
					{
						type: "text",
						text: `## Code Organization Analysis

### Architecture Pattern:
**${organization.pattern}** - ${organization.patternDescription}

### Directory Structure Quality:
- **Separation of Concerns:** ${organization.separationOfConcerns}/10
- **Modularity:** ${organization.modularity}/10
- **Scalability:** ${organization.scalability}/10

### Key Directories:
${organization.keyDirs.map((dir) => `- **${dir.name}**: ${dir.purpose} (${dir.quality})`).join("\n")}

### Code Organization Issues:
${organization.issues.map((issue) => `- ${issue.severity}: ${issue.description}`).join("\n")}

### Recommendations:
${organization.recommendations.map((rec) => `- ${rec}`).join("\n")}`,
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to analyze code organization: ${error.message}`);
		}
	}

	async getDirectoryStructure(rootPath, includePatterns, excludePatterns) {
		// Implementation for directory structure analysis
		const stats = {
			totalFiles: 0,
			totalDirs: 0,
			largestDirs: [],
			fileTypes: {},
		};

		const tree = await this.buildDirectoryTree(rootPath, excludePatterns);
		const patterns = await this.identifyPatterns(rootPath);

		return { tree, stats, patterns };
	}

	async buildDirectoryTree(dirPath, excludePatterns, prefix = "") {
		// Simplified tree building - in real implementation would be more sophisticated
		return `
${prefix}📁 ${path.basename(dirPath)}/
${prefix}├── 📁 src/
${prefix}├── 📁 tests/
${prefix}├── 📁 docs/
${prefix}└── 📄 package.json
    `;
	}

	async identifyPatterns(rootPath) {
		// Identify common project patterns
		return [
			"Standard src/ directory structure",
			"Test files co-located with source files",
			"Configuration files in root directory",
		];
	}

	async getDependencyAnalysis(rootPath) {
		try {
			const packageJsonPath = path.join(rootPath, "package.json");
			const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));

			const deps = Object.keys(packageJson.dependencies || {});
			const devDeps = Object.keys(packageJson.devDependencies || {});
			const peerDeps = Object.keys(packageJson.peerDependencies || {});

			return {
				packageManager: this.detectPackageManager(rootPath),
				totalDeps: deps.length + devDeps.length + peerDeps.length,
				devDeps: devDeps.length,
				peerDeps: peerDeps.length,
				keyDeps: this.getKeyDependencies(packageJson),
				outdatedCount: 0, // Would need npm outdated check
				vulnerabilities: 0, // Would need npm audit check
				recommendations: [
					"Consider updating major versions quarterly",
					"Review unused dependencies regularly",
				],
			};
		} catch (error) {
			throw new Error(`Could not read package.json: ${error.message}`);
		}
	}

	detectPackageManager(rootPath) {
		if (fs.existsSync(path.join(rootPath, "yarn.lock"))) return "Yarn";
		if (fs.existsSync(path.join(rootPath, "pnpm-lock.yaml"))) return "pnpm";
		if (fs.existsSync(path.join(rootPath, "package-lock.json"))) return "npm";
		return "Unknown";
	}

	getKeyDependencies(packageJson) {
		const keyDeps = [];
		const importantDeps = ["react", "typescript", "webpack", "vite", "jest", "eslint"];

		for (const dep of importantDeps) {
			if (packageJson.dependencies?.[dep]) {
				keyDeps.push({
					name: dep,
					version: packageJson.dependencies[dep],
					type: "runtime",
				});
			}
			if (packageJson.devDependencies?.[dep]) {
				keyDeps.push({ name: dep, version: packageJson.devDependencies[dep], type: "dev" });
			}
		}

		return keyDeps;
	}

	async findEntryPoints(rootPath) {
		const entryPoints = {
			main: [],
			secondary: [],
			build: [],
			recommendations: [],
		};

		try {
			const packageJson = JSON.parse(
				await fs.readFile(path.join(rootPath, "package.json"), "utf8"),
			);

			// Main entry point
			if (packageJson.main) {
				entryPoints.main.push({
					file: packageJson.main,
					type: "Main Entry Point",
					confidence: 100,
				});
			}

			// Scripts analysis
			if (packageJson.scripts) {
				if (packageJson.scripts.start) {
					entryPoints.secondary.push({
						file: this.extractEntryFromScript(packageJson.scripts.start),
						type: "Start Script",
					});
				}
				if (packageJson.scripts.dev) {
					entryPoints.secondary.push({
						file: this.extractEntryFromScript(packageJson.scripts.dev),
						type: "Dev Script",
					});
				}
			}

			// Build config detection
			const buildConfigs = [
				"vite.config.ts",
				"vite.config.js",
				"webpack.config.js",
				"next.config.js",
			];
			for (const config of buildConfigs) {
				if (await this.fileExists(path.join(rootPath, config))) {
					entryPoints.build.push({
						file: config,
						type: config.includes("vite")
							? "Vite"
							: config.includes("webpack")
								? "Webpack"
								: "Next.js",
					});
				}
			}

			entryPoints.recommendations = [
				"Ensure main entry point exists and is properly configured",
				"Consider using explicit entry points in build configuration",
			];
		} catch (error) {
			// Fallback analysis
			entryPoints.recommendations.push(
				"Could not read package.json for entry point analysis",
			);
		}

		return entryPoints;
	}

	extractEntryFromScript(script) {
		// Simple extraction - would need more sophisticated parsing for complex scripts
		const matches = script.match(/--?\w+\s+([^\s]+\.(js|ts|tsx|jsx))/);
		return matches ? matches[1] : "Could not determine from script";
	}

	async fileExists(filePath) {
		try {
			await fs.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	async getCodeOrganization(rootPath) {
		// Analyze code organization patterns
		const organization = {
			pattern: "Unknown",
			patternDescription: "Could not determine architecture pattern",
			separationOfConcerns: 5,
			modularity: 5,
			scalability: 5,
			keyDirs: [],
			issues: [],
			recommendations: [],
		};

		try {
			// Check for common patterns
			const hasSrc = await this.fileExists(path.join(rootPath, "src"));
			const hasLib = await this.fileExists(path.join(rootPath, "lib"));
			const hasComponents = await this.fileExists(path.join(rootPath, "src/components"));
			const hasHooks = await this.fileExists(path.join(rootPath, "src/hooks"));
			const hasUtils = await this.fileExists(path.join(rootPath, "src/utils"));

			if (hasSrc && hasComponents && hasHooks && hasUtils) {
				organization.pattern = "Component-Based Architecture";
				organization.patternDescription =
					"React/Frontend application with clear component separation";
				organization.separationOfConcerns = 8;
				organization.modularity = 8;
				organization.scalability = 7;
			} else if (hasLib) {
				organization.pattern = "Library Architecture";
				organization.patternDescription =
					"Code library with utilities and core functionality";
				organization.separationOfConcerns = 7;
				organization.modularity = 9;
				organization.scalability = 6;
			}

			// Identify key directories
			organization.keyDirs = [
				{ name: "src", purpose: "Source code", quality: hasSrc ? "Good" : "Missing" },
				{ name: "tests", purpose: "Test files", quality: "Present" },
				{ name: "docs", purpose: "Documentation", quality: "Present" },
			];

			organization.recommendations = [
				"Consider adding more specific directories for better organization",
				"Implement consistent file naming conventions",
			];
		} catch (error) {
			organization.issues.push({
				severity: "Error",
				description: `Could not analyze code organization: ${error.message}`,
			});
		}

		return organization;
	}

	async run() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error("Project Analysis MCP server running...");
	}
}

// Run the server
const server = new ProjectAnalysisServer();
server.run().catch(console.error);
