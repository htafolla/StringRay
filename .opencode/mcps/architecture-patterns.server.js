#!/usr/bin/env node

/**
 * StrRay Framework - Architecture Patterns MCP Server
 * Provides guidance on system architecture and design patterns
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

class ArchitecturePatternsServer {
	constructor() {
		this.server = new Server(
			{
				name: "architecture-patterns",
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
						name: "analyze_architecture",
						description:
							"Analyze current system architecture and identify improvement opportunities",
						inputSchema: {
							type: "object",
							properties: {
								projectType: {
									type: "string",
									description: "Type of project (web, mobile, api, etc.)",
									default: "web",
								},
								currentArchitecture: {
									type: "string",
									description: "Description of current architecture",
									default: "",
								},
								scale: {
									type: "string",
									enum: ["small", "medium", "large", "enterprise"],
									description: "Expected scale of the system",
									default: "medium",
								},
							},
						},
					},
					{
						name: "recommend_patterns",
						description: "Recommend appropriate design patterns for specific use cases",
						inputSchema: {
							type: "object",
							properties: {
								useCase: {
									type: "string",
									description: "Specific use case or problem to solve",
									default: "state management",
								},
								constraints: {
									type: "array",
									items: { type: "string" },
									description: "Technical or business constraints",
									default: [],
								},
							},
						},
					},
					{
						name: "design_system_architecture",
						description: "Design a complete system architecture based on requirements",
						inputSchema: {
							type: "object",
							properties: {
								requirements: {
									type: "string",
									description: "System requirements and goals",
									default: "",
								},
								technologies: {
									type: "array",
									items: { type: "string" },
									description: "Preferred technologies",
									default: ["react", "typescript", "node"],
								},
								scale: {
									type: "string",
									enum: ["small", "medium", "large"],
									description: "Expected system scale",
									default: "medium",
								},
							},
						},
					},
					{
						name: "evaluate_architecture_decision",
						description: "Evaluate the pros and cons of an architectural decision",
						inputSchema: {
							type: "object",
							properties: {
								decision: {
									type: "string",
									description: "The architectural decision to evaluate",
									default: "",
								},
								context: {
									type: "string",
									description: "Context and constraints for the decision",
									default: "",
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
					case "analyze_architecture":
						return await this.analyzeArchitecture(args);
					case "recommend_patterns":
						return await this.recommendPatterns(args);
					case "design_system_architecture":
						return await this.designSystemArchitecture(args);
					case "evaluate_architecture_decision":
						return await this.evaluateArchitectureDecision(args);
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

	async analyzeArchitecture(args = {}) {
		const projectType = args.projectType || "web";
		const currentArchitecture = args.currentArchitecture || "";
		const scale = args.scale || "medium";

		try {
			const analysis = this.performArchitectureAnalysis(
				projectType,
				currentArchitecture,
				scale,
			);

			return {
				content: [
					{
						type: "text",
						text: `## Architecture Analysis

**Project Type:** ${projectType}
**Scale:** ${scale}

### Current Architecture Assessment:
**Pattern:** ${analysis.currentPattern}
**Strengths:** ${analysis.strengths.join(", ")}
**Weaknesses:** ${analysis.weaknesses.join(", ")}

### Scalability Analysis:
- **Current Capacity:** ${analysis.scalability.current}
- **Growth Potential:** ${analysis.scalability.potential}
- **Bottlenecks:** ${analysis.scalability.bottlenecks.join(", ")}

### Recommended Improvements:
${analysis.improvements.map((imp, i) => `${i + 1}. **${imp.pattern}**: ${imp.reason}\n   - Benefits: ${imp.benefits}\n   - Complexity: ${imp.complexity}`).join("\n\n")}

### Migration Strategy:
${analysis.migration.map((step) => `- ${step}`).join("\n")}`,
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to analyze architecture: ${error.message}`);
		}
	}

	async recommendPatterns(args = {}) {
		const useCase = args.useCase || "state management";
		const constraints = args.constraints || [];

		try {
			const recommendations = this.getPatternRecommendations(useCase, constraints);

			return {
				content: [
					{
						type: "text",
						text: `## Design Pattern Recommendations

**Use Case:** ${useCase}
**Constraints:** ${constraints.join(", ") || "None specified"}

### Recommended Patterns:
${recommendations.patterns
	.map(
		(pattern, i) => `#### ${i + 1}. ${pattern.name} (${pattern.category})
**Why:** ${pattern.reason}
**When to Use:** ${pattern.whenToUse}
**Implementation:** ${pattern.implementation}
**Trade-offs:** ${pattern.tradeoffs}
**Example:** \`\`\`\n${pattern.example}\n\`\`\``,
	)
	.join("\n\n")}

### Alternative Approaches:
${recommendations.alternatives.map((alt) => `- **${alt.name}**: ${alt.description} (${alt.complexity})`).join("\n")}

### Best Practices:
${recommendations.bestPractices.map((practice) => `- ${practice}`).join("\n")}`,
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to recommend patterns: ${error.message}`);
		}
	}

	async designSystemArchitecture(args = {}) {
		const requirements = args.requirements || "";
		const technologies = args.technologies || ["react", "typescript", "node"];
		const scale = args.scale || "medium";

		try {
			const design = this.createSystemArchitecture(requirements, technologies, scale);

			return {
				content: [
					{
						type: "text",
						text: `## System Architecture Design

**Scale:** ${scale}
**Technologies:** ${technologies.join(", ")}

### Architecture Overview:
**Pattern:** ${design.overview.pattern}
**Description:** ${design.overview.description}

### Component Architecture:
${design.components
	.map(
		(comp) => `#### ${comp.name} (${comp.type})
- **Responsibilities:** ${comp.responsibilities.join(", ")}
- **Technologies:** ${comp.technologies.join(", ")}
- **Communication:** ${comp.communication}`,
	)
	.join("\n\n")}

### Data Flow:
${design.dataFlow.map((flow) => `1. ${flow.from} → ${flow.to}: ${flow.purpose} (${flow.protocol})`).join("\n")}

### Infrastructure Requirements:
${design.infrastructure.map((req) => `- **${req.component}**: ${req.specification} (${req.scaling})`).join("\n")}

### Deployment Strategy:
${design.deployment.map((step) => `- ${step}`).join("\n")}

### Monitoring & Observability:
${design.monitoring.map((metric) => `- ${metric}`).join("\n")}`,
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to design system architecture: ${error.message}`);
		}
	}

	async evaluateArchitectureDecision(args = {}) {
		const decision = args.decision || "";
		const context = args.context || "";

		try {
			const evaluation = this.evaluateDecision(decision, context);

			return {
				content: [
					{
						type: "text",
						text: `## Architecture Decision Evaluation

**Decision:** ${decision}
**Context:** ${context}

### Decision Analysis:
**Type:** ${evaluation.type}
**Scope:** ${evaluation.scope}
**Risk Level:** ${evaluation.risk}

### Pros:
${evaluation.pros.map((pro) => `- ${pro}`).join("\n")}

### Cons:
${evaluation.cons.map((con) => `- ${con}`).join("\n")}

### Alternatives Considered:
${evaluation.alternatives.map((alt) => `- **${alt.name}**: ${alt.description} (${alt.complexity})`).join("\n")}

### Recommendations:
${evaluation.recommendations.map((rec) => `- ${rec}`).join("\n")}

### Implementation Considerations:
${evaluation.implementation.map((consideration) => `- ${consideration}`).join("\n")}`,
					},
				],
			};
		} catch (error) {
			throw new Error(`Failed to evaluate architecture decision: ${error.message}`);
		}
	}

	performArchitectureAnalysis(projectType, currentArchitecture, scale) {
		const analyses = {
			web: {
				small: {
					currentPattern: "Simple SPA",
					strengths: ["Fast initial load", "Simple deployment", "Easy development"],
					weaknesses: [
						"Limited scalability",
						"Single point of failure",
						"No offline support",
					],
					scalability: {
						current: "1-100 concurrent users",
						potential: "Limited horizontal scaling",
						bottlenecks: ["Single server", "Client-side processing"],
					},
					improvements: [
						{
							pattern: "Microservices",
							reason: "Better scalability and maintainability",
							benefits: "Independent deployment, better fault isolation",
							complexity: "High",
						},
						{
							pattern: "Progressive Web App",
							reason: "Better user experience and offline support",
							benefits: "Offline functionality, better performance",
							complexity: "Medium",
						},
					],
					migration: [
						"Start with service extraction for critical features",
						"Implement API gateway for service coordination",
						"Add progressive enhancement features incrementally",
					],
				},
			},
		};

		return analyses[projectType]?.[scale] || analyses.web.small;
	}

	getPatternRecommendations(useCase, constraints) {
		const patternLibrary = {
			"state management": {
				patterns: [
					{
						name: "Redux",
						category: "Centralized State",
						reason: "Predictable state updates with time-travel debugging",
						whenToUse: "Complex state interactions, large teams, debugging needs",
						implementation: "Single store with actions and reducers",
						tradeoffs: "Boilerplate code, learning curve",
						example: `const store = createStore(reducer);
store.dispatch({ type: 'INCREMENT' });`,
					},
					{
						name: "Context API + useReducer",
						category: "React Native State",
						reason: "Built-in React solution without external dependencies",
						whenToUse: "Small to medium apps, React-only ecosystems",
						implementation: "React Context with useReducer hook",
						tradeoffs: "React-only, potential re-renders",
						example: `const [state, dispatch] = useReducer(reducer, initialState);`,
					},
				],
				alternatives: [
					{
						name: "Zustand",
						description: "Lightweight state management",
						complexity: "Low",
					},
					{
						name: "Recoil",
						description: "Facebook's experimental state management",
						complexity: "Medium",
					},
				],
				bestPractices: [
					"Keep state normalized and flat",
					"Use selectors for computed values",
					"Test state logic independently",
					"Document state shape and actions",
				],
			},
		};

		return (
			patternLibrary[useCase] || {
				patterns: [
					{
						name: "Layered Architecture",
						category: "Structural",
						reason: "Separation of concerns and maintainability",
						whenToUse: "Most applications with complex business logic",
						implementation: "Presentation, Business, Data layers",
						tradeoffs: "Additional complexity, more files",
						example:
							"// Presentation Layer\n// Business Logic Layer\n// Data Access Layer",
					},
				],
				alternatives: [],
				bestPractices: [
					"Keep layers loosely coupled",
					"Use dependency injection",
					"Test each layer independently",
				],
			}
		);
	}

	createSystemArchitecture(requirements, technologies, scale) {
		const architectures = {
			medium: {
				overview: {
					pattern: "Microservices with API Gateway",
					description: "Scalable architecture with independent services",
				},
				components: [
					{
						name: "API Gateway",
						type: "Entry Point",
						responsibilities: ["Request routing", "Authentication", "Rate limiting"],
						technologies: ["Express.js", "JWT"],
						communication: "REST/GraphQL",
					},
					{
						name: "User Service",
						type: "Business Service",
						responsibilities: ["User management", "Authentication", "Profile data"],
						technologies: ["Node.js", "MongoDB"],
						communication: "Message queue",
					},
					{
						name: "Frontend App",
						type: "Client",
						responsibilities: ["UI rendering", "State management", "User interactions"],
						technologies: ["React", "Redux"],
						communication: "HTTP/WebSocket",
					},
				],
				dataFlow: [
					{
						from: "Client",
						to: "API Gateway",
						purpose: "User requests",
						protocol: "HTTPS",
					},
					{
						from: "API Gateway",
						to: "Services",
						purpose: "Business logic",
						protocol: "REST",
					},
					{
						from: "Services",
						to: "Database",
						purpose: "Data persistence",
						protocol: "Database protocol",
					},
				],
				infrastructure: [
					{
						component: "Load Balancer",
						specification: "AWS ALB/Nginx",
						scaling: "Auto-scaling group",
					},
					{
						component: "Database",
						specification: "MongoDB cluster",
						scaling: "Replica set",
					},
					{ component: "Cache", specification: "Redis cluster", scaling: "Multi-node" },
				],
				deployment: [
					"Containerize services with Docker",
					"Use Kubernetes for orchestration",
					"Implement blue-green deployments",
					"Set up CI/CD pipelines",
				],
				monitoring: [
					"Application metrics (response time, error rate)",
					"Infrastructure monitoring (CPU, memory, disk)",
					"Distributed tracing (request flow)",
					"Log aggregation and analysis",
				],
			},
		};

		return architectures[scale] || architectures.medium;
	}

	evaluateDecision(decision, context) {
		// Mock decision evaluation - would analyze based on specific decision
		return {
			type: "Technology Choice",
			scope: "System-wide",
			risk: "Medium",
			pros: [
				"Improved developer experience",
				"Better ecosystem support",
				"Future-proof technology choice",
			],
			cons: [
				"Learning curve for team",
				"Potential migration complexity",
				"Vendor lock-in concerns",
			],
			alternatives: [
				{
					name: "Alternative A",
					description: "More conservative approach",
					complexity: "Low",
				},
				{
					name: "Alternative B",
					description: "More innovative approach",
					complexity: "High",
				},
			],
			recommendations: [
				"Conduct team training before adoption",
				"Start with pilot project",
				"Plan migration strategy with rollback options",
			],
			implementation: [
				"Assess team readiness and training needs",
				"Create proof of concept",
				"Develop migration plan with phases",
				"Set up monitoring and rollback procedures",
			],
		};
	}

	async run() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error("Architecture Patterns MCP server running...");
	}
}

// Run the server
const server = new ArchitecturePatternsServer();
server.run().catch(console.error);
