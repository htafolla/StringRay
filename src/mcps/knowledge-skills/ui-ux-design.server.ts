/**
 * StrRay UI/UX Design MCP Server
 *
 * Knowledge skill for user interface and user experience design,
 * component patterns, accessibility compliance, and design system guidance
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { frameworkLogger } from "../../core/framework-logger.js";

interface UIDesignAnalysis {
  component: string;
  issues: UIIssue[];
  accessibilityScore: number;
  usabilityScore: number;
  recommendations: string[];
  designPatterns: string[];
}

interface UIIssue {
  type:
    | "accessibility"
    | "usability"
    | "performance"
    | "responsive"
    | "semantic";
  severity: "critical" | "high" | "medium" | "low";
  element?: string;
  description: string;
  wcag?: string; // WCAG guideline reference
  recommendation: string;
  codeSnippet?: string;
}

interface DesignSystem {
  colors: ColorScheme;
  typography: TypographyScale;
  spacing: SpacingScale;
  components: ComponentLibrary;
  patterns: DesignPattern[];
}

interface ColorScheme {
  primary: string[];
  secondary: string[];
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  contrastRatios: Record<string, number>;
}

interface TypographyScale {
  fontFamilies: string[];
  sizes: Record<string, string>;
  weights: Record<string, number>;
  lineHeights: Record<string, number>;
}

interface SpacingScale {
  base: number;
  scale: number[];
  names: Record<string, number>;
}

interface ComponentLibrary {
  buttons: ComponentVariant[];
  inputs: ComponentVariant[];
  navigation: ComponentVariant[];
  feedback: ComponentVariant[];
}

interface ComponentVariant {
  name: string;
  states: string[];
  accessibility: string[];
  responsive: boolean;
}

interface DesignPattern {
  name: string;
  category: "layout" | "navigation" | "interaction" | "content";
  description: string;
  useCases: string[];
  accessibility: string[];
}

class StrRayUIUXDesignServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "ui-ux-design", version: "1.15.18",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    // Server initialization - removed unnecessary startup logging
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "analyze_ui_component",
            description:
              "Analyze UI component for accessibility, usability, and design best practices",
            inputSchema: {
              type: "object",
              properties: {
                componentCode: {
                  type: "string",
                  description: "React/Vue/Angular component code to analyze",
                },
                framework: {
                  type: "string",
                  enum: ["react", "vue", "angular", "svelte"],
                  description: "UI framework being used",
                },
                checkAccessibility: {
                  type: "boolean",
                  description: "Include WCAG accessibility analysis",
                  default: true,
                },
                checkResponsive: {
                  type: "boolean",
                  description: "Include responsive design analysis",
                  default: true,
                },
              },
              required: ["componentCode", "framework"],
            },
          },
          {
            name: "design_component",
            description:
              "Design a UI component with proper accessibility and UX patterns",
            inputSchema: {
              type: "object",
              properties: {
                componentType: {
                  type: "string",
                  enum: [
                    "button",
                    "input",
                    "modal",
                    "navigation",
                    "card",
                    "form",
                  ],
                  description: "Type of component to design",
                },
                requirements: {
                  type: "string",
                  description: "Functional requirements and use cases",
                },
                framework: {
                  type: "string",
                  enum: ["react", "vue", "angular", "svelte"],
                  description: "Target UI framework",
                },
                accessibility: {
                  type: "boolean",
                  description: "Include accessibility features",
                  default: true,
                },
              },
              required: ["componentType", "requirements", "framework"],
            },
          },
          {
            name: "audit_accessibility",
            description:
              "Perform comprehensive accessibility audit using WCAG guidelines",
            inputSchema: {
              type: "object",
              properties: {
                htmlContent: {
                  type: "string",
                  description: "HTML content to audit for accessibility",
                },
                cssContent: {
                  type: "string",
                  description: "CSS styles to check for accessibility",
                },
                wcagLevel: {
                  type: "string",
                  enum: ["A", "AA", "AAA"],
                  description: "WCAG conformance level to check",
                  default: "AA",
                },
              },
              required: ["htmlContent"],
            },
          },
          {
            name: "generate_design_system",
            description:
              "Generate a comprehensive design system with colors, typography, and components",
            inputSchema: {
              type: "object",
              properties: {
                brandGuidelines: {
                  type: "string",
                  description: "Brand colors, fonts, and style guidelines",
                },
                targetAudience: {
                  type: "string",
                  description: "Target user demographics and preferences",
                },
                platform: {
                  type: "string",
                  enum: ["web", "mobile", "desktop"],
                  description: "Target platform",
                },
                includeAccessibility: {
                  type: "boolean",
                  description: "Include accessibility-compliant design tokens",
                  default: true,
                },
              },
              required: ["brandGuidelines", "platform"],
            },
          },
          {
            name: "validate_mobile_design",
            description:
              "Validate mobile-first design principles including touch targets, responsive typography, and thumb zone optimization",
            inputSchema: {
              type: "object",
              properties: {
                componentCode: {
                  type: "string",
                  description: "Component code to validate for mobile",
                },
                viewportWidth: {
                  type: "number",
                  description:
                    "Minimum viewport width to validate (default: 320)",
                  default: 320,
                },
                framework: {
                  type: "string",
                  enum: ["react", "vue", "angular", "svelte", "css"],
                  description: "UI framework or CSS",
                },
              },
              required: ["componentCode"],
            },
          },
          {
            name: "analyze_visual_hierarchy",
            description:
              "Analyze visual hierarchy and cognitive load following 'Don't Make Me Think' principles",
            inputSchema: {
              type: "object",
              properties: {
                designCode: {
                  type: "string",
                  description: "HTML/CSS/React code of the design to analyze",
                },
                pageType: {
                  type: "string",
                  enum: [
                    "landing",
                    "dashboard",
                    "form",
                    "content",
                    "ecommerce",
                  ],
                  description: "Type of page being analyzed",
                },
              },
              required: ["designCode"],
            },
          },
          {
            name: "recommend_images",
            description:
              "Recommend appropriate image libraries, styles, and optimization strategies for the design context",
            inputSchema: {
              type: "object",
              properties: {
                context: {
                  type: "string",
                  description:
                    "Design context (e.g., 'hero section', 'product gallery', 'team portraits')",
                },
                style: {
                  type: "string",
                  enum: [
                    "photography",
                    "illustration",
                    "3d",
                    "abstract",
                    "minimal",
                  ],
                  description: "Preferred visual style",
                },
                budget: {
                  type: "string",
                  enum: ["free", "low", "premium"],
                  description: "Budget constraint",
                  default: "free",
                },
              },
              required: ["context"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "analyze_ui_component":
          return await this.analyzeUIComponent(args);
        case "design_component":
          return await this.designComponent(args);
        case "audit_accessibility":
          return await this.auditAccessibility(args);
        case "generate_design_system":
          return await this.generateDesignSystem(args);
        case "validate_mobile_design":
          return await this.validateMobileDesign(args);
        case "analyze_visual_hierarchy":
          return await this.analyzeVisualHierarchy(args);
        case "recommend_images":
          return await this.recommendImages(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async analyzeUIComponent(args: any): Promise<any> {
    const {
      componentCode,
      framework,
      checkAccessibility = true,
      checkResponsive = true,
    } = args;

    try {
      const componentName = this.extractComponentName(componentCode, framework);
      const issues = this.analyzeComponentCode(
        componentCode,
        framework,
        checkAccessibility,
        checkResponsive,
      );

      const accessibilityScore = this.calculateAccessibilityScore(issues);
      const usabilityScore = this.calculateUsabilityScore(issues);
      const recommendations = this.generateUIRecommendations(issues, framework);
      const designPatterns = this.identifyDesignPatterns(
        componentCode,
        framework,
      );

      const analysis: UIDesignAnalysis = {
        component: componentName,
        issues,
        accessibilityScore,
        usabilityScore,
        recommendations,
        designPatterns,
      };

      return {
        content: [
          {
            type: "text",
            text:
              `UI Component Analysis: ${componentName}\n\n` +
              `🎯 SCORES\n` +
              `Accessibility: ${accessibilityScore}/100\n` +
              `Usability: ${usabilityScore}/100\n\n` +
              `🔍 ISSUES FOUND: ${issues.length}\n` +
              issues
                .slice(0, 5)
                .map(
                  (issue) =>
                    `${this.getSeverityIcon(issue.severity)} ${issue.type.toUpperCase()}: ${issue.description}`,
                )
                .join("\n") +
              "\n\n" +
              `💡 RECOMMENDATIONS\n${recommendations
                .slice(0, 5)
                .map((rec, i) => `${i + 1}. ${rec}`)
                .join("\n")}\n\n` +
              `🎨 DESIGN PATTERNS DETECTED\n${designPatterns
                .slice(0, 3)
                .map((pattern) => `• ${pattern}`)
                .join("\n")}`,
          },
        ],
        data: analysis,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing UI component: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async designComponent(args: any): Promise<any> {
    const {
      componentType,
      requirements,
      framework,
      accessibility = true,
    } = args;

    try {
      const designSpec = this.generateComponentDesign(
        componentType,
        requirements,
        framework,
        accessibility,
      );
      const implementation = this.generateComponentCode(designSpec, framework);
      const accessibilityFeatures = accessibility
        ? this.addAccessibilityFeatures(designSpec, framework)
        : [];

      return {
        content: [
          {
            type: "text",
            text:
              `Component Design: ${componentType.toUpperCase()}\n\n` +
              `📋 REQUIREMENTS\n${requirements.substring(0, 200)}${requirements.length > 200 ? "..." : ""}\n\n` +
              `🎨 DESIGN SPECIFICATION\n` +
              `Framework: ${framework.toUpperCase()}\n` +
              `Accessibility: ${accessibility ? "✅ Included" : "❌ Not included"}\n\n` +
              `🏗️ COMPONENT STRUCTURE\n${designSpec.structure.map((item: string) => `• ${item}`).join("\n")}\n\n` +
              `♿ ACCESSIBILITY FEATURES\n${accessibilityFeatures.map((feature) => `• ${feature}`).join("\n")}\n\n` +
              `💻 IMPLEMENTATION\n\`\`\`${framework}\n${implementation}\n\`\`\``,
          },
        ],
        data: { designSpec, implementation, accessibilityFeatures },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error designing component: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async auditAccessibility(args: any): Promise<any> {
    const { htmlContent, cssContent, wcagLevel = "AA" } = args;

    try {
      const violations = this.checkWCAGCompliance(
        htmlContent,
        cssContent,
        wcagLevel,
      );
      const score = this.calculateWCAGScore(violations, wcagLevel);
      const recommendations =
        this.generateAccessibilityRecommendations(violations);

      return {
        content: [
          {
            type: "text",
            text:
              `Accessibility Audit (WCAG ${wcagLevel})\n\n` +
              `📊 COMPLIANCE SCORE: ${score}/100\n\n` +
              `🚨 VIOLATIONS FOUND: ${violations.length}\n` +
              violations
                .slice(0, 10)
                .map(
                  (violation) =>
                    `${this.getSeverityIcon(violation.severity)} ${violation.guideline}: ${violation.description}`,
                )
                .join("\n") +
              "\n\n" +
              `💡 REMEDIATION STEPS\n${recommendations
                .slice(0, 5)
                .map((rec, i) => `${i + 1}. ${rec}`)
                .join("\n")}`,
          },
        ],
        data: { violations, score, recommendations, wcagLevel },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error auditing accessibility: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async generateDesignSystem(args: any): Promise<any> {
    const {
      brandGuidelines,
      targetAudience,
      platform,
      includeAccessibility = true,
    } = args;

    try {
      const designSystem = this.createDesignSystem(
        brandGuidelines,
        targetAudience,
        platform,
        includeAccessibility,
      );
      const tokens = this.generateDesignTokens(designSystem);
      const documentation = this.generateDesignSystemDocs(designSystem);

      return {
        content: [
          {
            type: "text",
            text:
              `Design System Generated for ${platform.toUpperCase()}\n\n` +
              `🎨 COLOR PALETTE\n` +
              `Primary: ${designSystem.colors.primary.join(", ")}\n` +
              `Semantic: Success(${designSystem.colors.semantic.success}), Warning(${designSystem.colors.semantic.warning}), Error(${designSystem.colors.semantic.error})\n\n` +
              `📝 TYPOGRAPHY SCALE\n` +
              `Fonts: ${designSystem.typography.fontFamilies.join(", ")}\n` +
              `Sizes: ${Object.entries(designSystem.typography.sizes)
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")}\n\n` +
              `📏 SPACING SYSTEM\n` +
              `Base: ${designSystem.spacing.base}px\n` +
              `Scale: ${designSystem.spacing.scale.join(", ")}\n\n` +
              `🧩 COMPONENT LIBRARY\n` +
              `Buttons: ${designSystem.components.buttons.length} variants\n` +
              `Inputs: ${designSystem.components.inputs.length} variants\n` +
              `Navigation: ${designSystem.components.navigation.length} patterns\n\n` +
              `♿ ACCESSIBILITY: ${includeAccessibility ? "✅ Included" : "❌ Not included"}\n\n` +
              `📚 DESIGN TOKENS\n\`\`\`json\n${JSON.stringify(tokens, null, 2).substring(0, 500)}...\n\`\`\``,
          },
        ],
        data: { designSystem, tokens, documentation },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error generating design system: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private extractComponentName(code: string, framework: string): string {
    // Extract component name based on framework
    switch (framework) {
      case "react":
        const reactMatch = code.match(/function\s+(\w+)|const\s+(\w+)\s*=/);
        return reactMatch
          ? reactMatch[1] || reactMatch[2] || "UnknownComponent"
          : "UnknownComponent";
      case "vue":
        const vueMatch = code.match(/name:\s*['"](\w+)['"]/);
        return vueMatch && vueMatch[1] ? vueMatch[1] : "UnknownComponent";
      case "angular":
        const angularMatch = code.match(/selector:\s*['"]([^'"]+)['"]/);
        return angularMatch && angularMatch[1]
          ? angularMatch[1].replace(/[\[\]]/g, "")
          : "UnknownComponent";
      default:
        return "UnknownComponent";
    }
  }

  private analyzeComponentCode(
    code: string,
    framework: string,
    checkAccessibility: boolean,
    checkResponsive: boolean,
  ): UIIssue[] {
    const issues: UIIssue[] = [];

    // Accessibility checks
    if (checkAccessibility) {
      issues.push(...this.checkAccessibilityIssues(code, framework));
    }

    // Responsive design checks
    if (checkResponsive) {
      issues.push(...this.checkResponsiveIssues(code, framework));
    }

    // Usability checks
    issues.push(...this.checkUsabilityIssues(code, framework));

    // Performance checks
    issues.push(...this.checkPerformanceIssues(code, framework));

    // Semantic HTML checks
    issues.push(...this.checkSemanticIssues(code, framework));

    return issues;
  }

  private checkAccessibilityIssues(code: string, framework: string): UIIssue[] {
    const issues: UIIssue[] = [];

    // Missing alt text
    if (code.includes("<img") && !code.includes("alt=")) {
      issues.push({
        type: "accessibility",
        severity: "high",
        description: "Image missing alt attribute",
        wcag: "1.1.1",
        recommendation: "Add descriptive alt text for all images",
      });
    }

    // Missing form labels
    if (
      code.includes("<input") &&
      !code.includes("aria-label") &&
      !code.includes("<label")
    ) {
      issues.push({
        type: "accessibility",
        severity: "high",
        description: "Form input missing label",
        wcag: "3.3.2",
        recommendation:
          "Associate labels with form inputs using <label> or aria-label",
      });
    }

    // Insufficient color contrast (basic check)
    if (code.includes("color:") && code.includes("background:")) {
      issues.push({
        type: "accessibility",
        severity: "medium",
        description: "Potential color contrast issues detected",
        wcag: "1.4.3",
        recommendation:
          "Ensure color contrast ratio meets WCAG AA standards (4.5:1)",
      });
    }

    // Missing focus indicators
    if (
      code.includes("<button") ||
      (code.includes("<a") && !code.includes("focus"))
    ) {
      issues.push({
        type: "accessibility",
        severity: "medium",
        description: "Interactive element may lack visible focus indicator",
        wcag: "2.4.7",
        recommendation: "Add visible focus styles for keyboard navigation",
      });
    }

    return issues;
  }

  private checkResponsiveIssues(code: string, framework: string): UIIssue[] {
    const issues: UIIssue[] = [];

    // Fixed widths/heights
    if (
      code.includes("width:") &&
      code.includes("px") &&
      !code.includes("@media")
    ) {
      issues.push({
        type: "responsive",
        severity: "medium",
        description: "Fixed pixel widths may not be responsive",
        recommendation:
          "Use relative units (%, em, rem) and media queries for responsive design",
      });
    }

    // Missing viewport meta tag (would be in HTML, not component)
    if (framework === "react" && !code.includes("viewport")) {
      issues.push({
        type: "responsive",
        severity: "low",
        description: "Ensure viewport meta tag is set in HTML head",
        recommendation:
          'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
      });
    }

    return issues;
  }

  private checkUsabilityIssues(code: string, framework: string): UIIssue[] {
    const issues: UIIssue[] = [];

    // Button text issues
    if (
      code.includes("<button") &&
      code.includes("OK") &&
      !code.includes("aria-label")
    ) {
      issues.push({
        type: "usability",
        severity: "medium",
        description: 'Button with generic text "OK" lacks context',
        recommendation:
          "Use descriptive button text or add aria-label for clarity",
      });
    }

    // Form validation feedback
    if (
      code.includes("<form") &&
      !code.includes("error") &&
      !code.includes("invalid")
    ) {
      issues.push({
        type: "usability",
        severity: "low",
        description: "Form may lack validation error feedback",
        recommendation:
          "Add visible error messages for form validation failures",
      });
    }

    return issues;
  }

  private checkPerformanceIssues(code: string, framework: string): UIIssue[] {
    const issues: UIIssue[] = [];

    // Large inline styles
    const styleMatches = code.match(/style=\{[^}]{100,}\}/g);
    if (styleMatches && styleMatches.length > 0) {
      issues.push({
        type: "performance",
        severity: "low",
        description: "Large inline style objects may impact performance",
        recommendation: "Extract styles to CSS classes or styled-components",
      });
    }

    // Excessive re-renders (React specific)
    if (
      framework === "react" &&
      code.includes("useEffect") &&
      code.includes("[]")
    ) {
      issues.push({
        type: "performance",
        severity: "medium",
        description:
          "useEffect with empty dependency array may cause unnecessary re-renders",
        recommendation:
          "Review useEffect dependencies to prevent infinite loops",
      });
    }

    return issues;
  }

  private checkSemanticIssues(code: string, framework: string): UIIssue[] {
    const issues: UIIssue[] = [];

    // Using div instead of semantic elements
    if (
      code.includes("<div") &&
      code.includes("click") &&
      !code.includes("<button")
    ) {
      issues.push({
        type: "semantic",
        severity: "medium",
        description: "Clickable div used instead of semantic button element",
        recommendation:
          "Use <button> element for clickable actions to improve accessibility",
      });
    }

    // Missing heading hierarchy
    const headingMatches = code.match(/<h[1-6]/g);
    if (headingMatches && headingMatches.length > 1) {
      // Check for proper hierarchy (simplified)
      const hasH1 = code.includes("<h1");
      const hasH2 = code.includes("<h2");
      if (!hasH1 && hasH2) {
        issues.push({
          type: "semantic",
          severity: "low",
          description: "Heading hierarchy may skip levels",
          recommendation:
            "Ensure proper heading hierarchy (h1 → h2 → h3, etc.)",
        });
      }
    }

    return issues;
  }

  private calculateAccessibilityScore(issues: UIIssue[]): number {
    const accessibilityIssues = issues.filter(
      (i) => i.type === "accessibility",
    );
    let score = 100;

    accessibilityIssues.forEach((issue) => {
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

    return Math.max(0, Math.min(100, score));
  }

  private calculateUsabilityScore(issues: UIIssue[]): number {
    const usabilityIssues = issues.filter(
      (i) => i.type === "usability" || i.type === "responsive",
    );
    let score = 100;

    usabilityIssues.forEach((issue) => {
      switch (issue.severity) {
        case "high":
          score -= 8;
          break;
        case "medium":
          score -= 4;
          break;
        case "low":
          score -= 2;
          break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  private generateUIRecommendations(
    issues: UIIssue[],
    framework: string,
  ): string[] {
    const recommendations: string[] = [];

    // Group issues by type
    const byType = issues.reduce(
      (acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    if ((byType.accessibility || 0) > 0) {
      recommendations.push(
        `Address ${byType.accessibility} accessibility issues to improve WCAG compliance`,
      );
    }

    if ((byType.responsive || 0) > 0) {
      recommendations.push(
        `Fix ${byType.responsive} responsive design issues for mobile compatibility`,
      );
    }

    if ((byType.usability || 0) > 0) {
      recommendations.push(
        `Improve ${byType.usability} usability issues for better user experience`,
      );
    }

    // Framework-specific recommendations
    switch (framework) {
      case "react":
        recommendations.push(
          "Consider using React Testing Library for accessibility testing",
        );
        break;
      case "vue":
        recommendations.push(
          "Use Vue's built-in accessibility features and vue-a11y library",
        );
        break;
      case "angular":
        recommendations.push("Leverage Angular CDK for accessible components");
        break;
    }

    recommendations.push("Run automated accessibility audits regularly");
    recommendations.push("Test with real users and assistive technologies");

    return recommendations;
  }

  private identifyDesignPatterns(code: string, framework: string): string[] {
    const patterns: string[] = [];

    // Common design patterns
    if (code.includes("useState") && code.includes("onClick")) {
      patterns.push("Controlled Component Pattern");
    }

    if (code.includes("Context") && code.includes("Provider")) {
      patterns.push("Context Provider Pattern");
    }

    if (code.includes("children") && code.includes("props")) {
      patterns.push("Render Props Pattern");
    }

    if (code.includes("forwardRef")) {
      patterns.push("Ref Forwarding Pattern");
    }

    if (code.includes("useMemo") || code.includes("useCallback")) {
      patterns.push("Memoization Pattern");
    }

    // Layout patterns
    if (code.includes("flex") || code.includes("grid")) {
      patterns.push("Modern CSS Layout (Flexbox/Grid)");
    }

    if (code.includes("media") && code.includes("query")) {
      patterns.push("Responsive Design Pattern");
    }

    return patterns;
  }

  private generateComponentDesign(
    componentType: string,
    requirements: string,
    framework: string,
    accessibility: boolean,
  ): any {
    const design = {
      componentType,
      requirements,
      framework,
      accessibility,
      structure: [] as string[],
      props: [] as string[],
      states: [] as string[],
      variants: [] as string[],
    };

    switch (componentType) {
      case "button":
        design.structure = [
          "Button container with proper spacing",
          "Icon support (optional)",
          "Loading state indicator",
          "Focus ring for accessibility",
        ];
        design.props = [
          "children: ReactNode",
          'variant: "primary" | "secondary" | "danger"',
          'size: "sm" | "md" | "lg"',
          "disabled: boolean",
          "loading: boolean",
          "onClick: () => void",
        ];
        design.states = [
          "normal",
          "hover",
          "active",
          "focus",
          "disabled",
          "loading",
        ];
        design.variants = [
          "primary",
          "secondary",
          "outline",
          "ghost",
          "danger",
        ];
        break;

      case "input":
        design.structure = [
          "Input wrapper with label",
          "Input field with proper styling",
          "Error message container",
          "Helper text support",
          "Icon support",
        ];
        design.props = [
          "label: string",
          "placeholder: string",
          "value: string",
          "error: string",
          "helperText: string",
          "required: boolean",
          "disabled: boolean",
        ];
        design.states = ["normal", "focus", "error", "disabled"];
        design.variants = ["text", "email", "password", "search", "textarea"];
        break;

      case "modal":
        design.structure = [
          "Modal overlay",
          "Modal container with backdrop",
          "Header with title and close button",
          "Content area",
          "Footer with action buttons",
          "Focus trap for accessibility",
        ];
        design.props = [
          "isOpen: boolean",
          "title: string",
          "children: ReactNode",
          "onClose: () => void",
          "actions: ActionButton[]",
        ];
        design.states = ["open", "closed", "opening", "closing"];
        design.variants = ["default", "fullscreen", "sidebar"];
        break;
    }

    return design;
  }

  private generateComponentCode(design: any, framework: string): string {
    // Generate basic component code structure
    switch (framework) {
      case "react":
        return this.generateReactComponent(design);
      case "vue":
        return this.generateVueComponent(design);
      case "angular":
        return this.generateAngularComponent(design);
      default:
        return `// Component code generation for ${framework} not yet implemented`;
    }
  }

  private generateReactComponent(design: any): string {
    const propsInterface = design.props
      .map((prop: string) => `  ${prop};`)
      .join("\n");

    return `import React from 'react';

interface ${design.componentType.charAt(0).toUpperCase() + design.componentType.slice(1)}Props {
${propsInterface}
}

export const ${design.componentType.charAt(0).toUpperCase() + design.componentType.slice(1)}: React.FC<${design.componentType.charAt(0).toUpperCase() + design.componentType.slice(1)}Props> = ({
  // props destructuring
}) => {
  return (
    <div className="${design.componentType}-container">
      {/* ${design.componentType} implementation */}
    </div>
  );
};`;
  }

  private generateVueComponent(design: any): string {
    return `<template>
  <div class="${design.componentType}-container">
    <!-- ${design.componentType} implementation -->
  </div>
</template>

<script setup lang="ts">
// Props definition would go here
</script>

<style scoped>
.${design.componentType}-container {
  /* styles */
}
</style>`;
  }

  private generateAngularComponent(design: any): string {
    return `import { Component, Input, Output, EventEmitter } from '@angular/core';
import { frameworkLogger } from "../framework-logger.js";

@Component({
  selector: 'app-${design.componentType}',
  template: \`
    <div class="${design.componentType}-container">
      <!-- ${design.componentType} implementation -->
    </div>
  \`,
  styles: [\`
    .${design.componentType}-container {
      /* styles */
    }
  \`]
})
export class ${design.componentType.charAt(0).toUpperCase() + design.componentType.slice(1)}Component {
  // Component logic
}`;
  }

  private addAccessibilityFeatures(design: any, framework: string): string[] {
    const features: string[] = [];

    switch (design.componentType) {
      case "button":
        features.push("Keyboard navigation support (Enter/Space activation)");
        features.push("ARIA pressed state for toggle buttons");
        features.push("Screen reader announcements for state changes");
        features.push("Focus management and visible focus indicators");
        break;

      case "input":
        features.push("ARIA labels and descriptions");
        features.push("Error message association with input");
        features.push("Required field indicators");
        features.push("Input validation feedback");
        break;

      case "modal":
        features.push("Focus trap within modal");
        features.push("ARIA modal role and properties");
        features.push("Escape key handling");
        features.push("Initial focus management");
        break;
    }

    return features;
  }

  private checkWCAGCompliance(
    htmlContent: string,
    cssContent: string,
    level: string,
  ): any[] {
    const violations: any[] = [];

    // Basic WCAG checks (simplified)
    if (!htmlContent.includes("lang=")) {
      violations.push({
        guideline: "3.1.1 Language of Page",
        severity: "medium",
        description: "Missing language attribute on html element",
      });
    }

    // Enhanced color contrast checking
    if (cssContent) {
      const contrastIssues = this.analyzeColorContrast(cssContent, htmlContent);
      violations.push(...contrastIssues);

      // Hero section specific checks
      const heroIssues = this.analyzeHeroSectionContrast(
        cssContent,
        htmlContent,
      );
      violations.push(...heroIssues);
    }

    return violations;
  }

  /**
   * Parse color value and convert to RGB
   */
  private parseColor(
    color: string,
  ): { r: number; g: number; b: number } | null {
    // Hex color
    const hexMatch = color.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/);
    if (hexMatch && hexMatch[1]) {
      let hex: string = hexMatch[1];
      if (hex.length === 3) {
        hex = hex
          .split("")
          .map((c) => c + c)
          .join("");
      }
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }

    // RGB/RGBA
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
      };
    }

    // Named colors
    const namedColors: Record<string, string> = {
      white: "#ffffff",
      black: "#000000",
      red: "#ff0000",
      blue: "#0000ff",
      green: "#008000",
      gray: "#808080",
      lightgray: "#d3d3d3",
      darkgray: "#a9a9a9",
    };

    const lowerColor = color.toLowerCase().trim();
    if (namedColors[lowerColor]) {
      return this.parseColor(namedColors[lowerColor]);
    }

    return null;
  }

  /**
   * Calculate relative luminance (WCAG formula)
   */
  private getLuminance(r: number, g: number, b: number): number {
    const rs = this.getLuminanceComponent(r);
    const gs = this.getLuminanceComponent(g);
    const bs = this.getLuminanceComponent(b);
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  private getLuminanceComponent(c: number): number {
    const normalized = c / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrastRatio(
    color1: string,
    color2: string,
  ): number | null {
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);

    if (!rgb1 || !rgb2) return null;

    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Analyze color contrast in CSS
   */
  private analyzeColorContrast(cssContent: string, htmlContent: string): any[] {
    const violations: any[] = [];

    // Extract color pairs from CSS
    const colorRegex = /color:\s*([^;]+)/gi;
    const bgRegex = /background(?:-color)?:\s*([^;]+)/gi;

    const colors: string[] = [];
    const backgrounds: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = colorRegex.exec(cssContent)) !== null) {
      if (match[1]) {
        colors.push(match[1].trim());
      }
    }
    while ((match = bgRegex.exec(cssContent)) !== null) {
      if (match[1]) {
        backgrounds.push(match[1].trim());
      }
    }

    // Check for known problematic combinations
    const problematicCombos = [
      { fg: "#ffffff", bg: "#f3f4f6", desc: "White text on light gray" },
      { fg: "#ffffff", bg: "#e5e7eb", desc: "White text on gray" },
      { fg: "#ffffff", bg: "#d1d5db", desc: "White text on medium gray" },
      { fg: "#000000", bg: "#1f2937", desc: "Black text on dark gray" },
      { fg: "#9ca3af", bg: "#ffffff", desc: "Light gray text on white" },
      { fg: "#d1d5db", bg: "#ffffff", desc: "Medium gray text on white" },
    ];

    problematicCombos.forEach((combo) => {
      const ratio = this.calculateContrastRatio(combo.fg, combo.bg);
      if (ratio && ratio < 4.5) {
        violations.push({
          guideline: "1.4.3 Contrast (Minimum)",
          severity: "high",
          description: `${combo.desc} has insufficient contrast (${ratio.toFixed(1)}:1, needs 4.5:1)`,
          recommendation: `Use a darker text color or lighter background to achieve 4.5:1 contrast ratio`,
        });
      }
    });

    return violations;
  }

  /**
   * Specifically analyze hero section for contrast issues
   */
  private analyzeHeroSectionContrast(
    cssContent: string,
    htmlContent: string,
  ): any[] {
    const violations: any[] = [];

    // Check for hero section patterns
    const heroPatterns = [
      /class="[^"]*hero[^"]*"/i,
      /id="[^"]*hero[^"]*"/i,
      /hero-section/i,
      /landing-hero/i,
    ];

    const hasHero = heroPatterns.some(
      (pattern) => pattern.test(htmlContent) || pattern.test(cssContent),
    );

    if (!hasHero) return violations;

    // Check for hero with background image but no overlay
    const hasBackgroundImage = /background(?:-image)?\s*:\s*url\s*\(/i.test(
      cssContent,
    );
    const hasOverlay =
      /(?:rgba?\([^)]+\)|#[a-f0-9]{3,8}).*overlay|gradient.*rgba/i.test(
        cssContent,
      );
    const hasTextShadow = /text-shadow\s*:/i.test(cssContent);

    if (hasBackgroundImage && !hasOverlay && !hasTextShadow) {
      violations.push({
        guideline: "1.4.3 Contrast (Minimum) - Hero Section",
        severity: "critical",
        description:
          "Hero section with background image lacks text overlay or shadow",
        recommendation:
          "Add a semi-transparent overlay (e.g., rgba(0,0,0,0.5)) or text-shadow to ensure text readability",
      });
    }

    // Check for light-on-light or dark-on-dark in hero
    const heroSection = this.extractHeroCSS(cssContent);
    if (heroSection) {
      const bgMatch = heroSection.match(/background(?:-color)?\s*:\s*([^;]+)/i);
      const colorMatch = heroSection.match(/color\s*:\s*([^;]+)/i);

      if (bgMatch?.[1] && colorMatch?.[1]) {
        const bg = bgMatch[1].trim();
        const color = colorMatch[1].trim();

        const ratio = this.calculateContrastRatio(color, bg);
        if (ratio && ratio < 4.5) {
          violations.push({
            guideline: "1.4.3 Contrast (Minimum) - Hero Section",
            severity: "critical",
            description: `Hero section has poor contrast (${ratio.toFixed(1)}:1, needs 4.5:1)`,
            recommendation: `Background: ${bg}, Text: ${color}. Use contrasting colors: white text on dark backgrounds or dark text on light backgrounds`,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Extract CSS for hero section
   */
  private extractHeroCSS(cssContent: string): string | null {
    const heroRegex = /(?:\.hero|#hero)[^{]*\{([^}]+)\}/gi;
    const matches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = heroRegex.exec(cssContent)) !== null) {
      if (match[1]) {
        matches.push(match[1]);
      }
    }

    return matches.length > 0 ? matches.join(" ") : null;
  }

  private calculateWCAGScore(violations: any[], level: string): number {
    let score = 100;

    violations.forEach((violation) => {
      switch (violation.severity) {
        case "critical":
          score -= 20;
          break;
        case "high":
          score -= 15;
          break;
        case "medium":
          score -= 10;
          break;
        case "low":
          score -= 5;
          break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  private generateAccessibilityRecommendations(violations: any[]): string[] {
    const recommendations: string[] = [];

    violations.forEach((violation) => {
      recommendations.push(
        `Fix ${violation.guideline}: ${violation.description}`,
      );
    });

    recommendations.push("Use automated accessibility testing tools");
    recommendations.push("Conduct manual testing with assistive technologies");
    recommendations.push("Include accessibility in design reviews");

    return recommendations;
  }

  private createDesignSystem(
    brandGuidelines: string,
    targetAudience: string,
    platform: string,
    includeAccessibility: boolean,
  ): DesignSystem {
    // Generate a basic design system based on inputs
    const colors: ColorScheme = {
      primary: ["#007bff", "#0056b3", "#004085"],
      secondary: ["#6c757d", "#545b62", "#383d41"],
      semantic: {
        success: "#28a745",
        warning: "#ffc107",
        error: "#dc3545",
        info: "#17a2b8",
      },
      contrastRatios: {},
    };

    const typography: TypographyScale = {
      fontFamilies: ["Inter", "system-ui", "-apple-system"],
      sizes: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      weights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeights: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.625,
      },
    };

    const spacing: SpacingScale = {
      base: 4,
      scale: [4, 8, 12, 16, 24, 32, 48, 64],
      names: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        "2xl": 48,
      },
    };

    const components: ComponentLibrary = {
      buttons: [
        {
          name: "primary",
          states: ["normal", "hover", "active", "disabled"],
          accessibility: ["focus-visible"],
          responsive: true,
        },
        {
          name: "secondary",
          states: ["normal", "hover", "active", "disabled"],
          accessibility: ["focus-visible"],
          responsive: true,
        },
      ],
      inputs: [
        {
          name: "text",
          states: ["normal", "focus", "error", "disabled"],
          accessibility: ["aria-label", "aria-invalid"],
          responsive: true,
        },
      ],
      navigation: [
        {
          name: "header",
          states: ["normal", "mobile-open"],
          accessibility: ["aria-expanded"],
          responsive: true,
        },
      ],
      feedback: [
        {
          name: "alert",
          states: ["info", "success", "warning", "error"],
          accessibility: ["role", "aria-live"],
          responsive: true,
        },
      ],
    };

    const patterns: DesignPattern[] = [
      {
        name: "Card Layout",
        category: "layout",
        description: "Container for related content and actions",
        useCases: ["Product display", "User profiles", "Content preview"],
        accessibility: ["Proper heading hierarchy", "Focus management"],
      },
      {
        name: "Progressive Disclosure",
        category: "interaction",
        description: "Show information gradually to reduce cognitive load",
        useCases: ["Forms", "Settings panels", "Help documentation"],
        accessibility: ["ARIA expanded states", "Keyboard navigation"],
      },
    ];

    return { colors, typography, spacing, components, patterns };
  }

  private generateDesignTokens(system: DesignSystem): any {
    return {
      colors: {
        primary: system.colors.primary,
        secondary: system.colors.secondary,
        semantic: system.colors.semantic,
      },
      typography: system.typography,
      spacing: system.spacing,
      breakpoints: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    };
  }

  private generateDesignSystemDocs(system: DesignSystem): string {
    return `# Design System Documentation

## Colors
Primary: ${system.colors.primary.join(", ")}
Secondary: ${system.colors.secondary.join(", ")}

## Typography
Fonts: ${system.typography.fontFamilies.join(", ")}

## Spacing
Base unit: ${system.spacing.base}px
Scale: ${system.spacing.scale.join(", ")}

## Components
Available: ${Object.keys(system.components).length} component types
`;
  }

  private getSeverityIcon(severity: string): string {
    const icons = {
      critical: "🚨",
      high: "🔴",
      medium: "🟡",
      low: "🟢",
    };
    return icons[severity as keyof typeof icons] || "❓";
  }

  private async validateMobileDesign(args: any): Promise<any> {
    const { componentCode, viewportWidth = 320, framework = "css" } = args;

    const issues: any[] = [];
    const recommendations: string[] = [];

    // Check touch target sizes
    const touchTargetRegex =
      /(width|height|padding|min-width|min-height):\s*(\d+)(px|rem|em)/gi;
    let match: RegExpExecArray | null;
    while ((match = touchTargetRegex.exec(componentCode)) !== null) {
      if (match[2] && match[3]) {
        const value = parseInt(match[2], 10);
        const unit = match[3];
        const pixelValue = unit === "px" ? value : value * 16;

        if (pixelValue < 44) {
          issues.push({
            type: "mobile",
            severity: "high",
            message: `Touch target ${match[1]}:${match[0]} is too small (${pixelValue}px). Minimum: 44px`,
            wcag: "2.5.5",
          });
        }
      }
    }

    // Check for responsive units
    if (
      componentCode.includes("px") &&
      !componentCode.includes("rem") &&
      !componentCode.includes("em")
    ) {
      recommendations.push(
        "Consider using rem/em instead of px for better accessibility",
      );
    }

    // Check for media queries
    if (!componentCode.includes("@media")) {
      recommendations.push(
        "Add responsive breakpoints (@media) for different viewport sizes",
      );
    }

    // Check for mobile navigation pattern
    if (
      componentCode.includes("nav") &&
      !componentCode.includes("hamburger") &&
      !componentCode.includes("menu")
    ) {
      recommendations.push(
        "Consider mobile navigation pattern (hamburger menu) for small screens",
      );
    }

    return {
      content: [
        {
          type: "text",
          text: `## Mobile Design Validation (Viewport: ${viewportWidth}px)\n\n### Issues Found: ${issues.length}\n${issues.map((i: any) => `- ${i.severity.toUpperCase()}: ${i.message} (WCAG ${i.wcag})`).join("\n") || "None"}\n\n### Recommendations:\n${recommendations.map((r: string) => `- ${r}`).join("\n") || "None"}\n\n### Mobile-First Checklist:\n- [ ] Touch targets ≥ 44px\n- [ ] Responsive typography (rem/em)\n- [ ] Media queries for breakpoints\n- [ ] Mobile navigation pattern\n- [ ] Readable without zoom (16px min)`,
        },
      ],
    };
  }

  private async analyzeVisualHierarchy(args: any): Promise<any> {
    const { designCode, pageType = "landing" } = args;

    const issues: any[] = [];
    const cognitiveLoadScore = 100;
    const recommendations: string[] = [];

    // Check heading hierarchy
    const h1Count = (designCode.match(/<h1/gi) || []).length;
    const h2Count = (designCode.match(/<h2/gi) || []).length;
    const h3Count = (designCode.match(/<h3/gi) || []).length;

    if (h1Count === 0) {
      issues.push({
        type: "hierarchy",
        severity: "critical",
        message: "Missing H1 heading - page purpose unclear",
      });
    } else if (h1Count > 1) {
      issues.push({
        type: "hierarchy",
        severity: "high",
        message: `Multiple H1 headings (${h1Count}) - confuses page structure`,
      });
    }

    if (h2Count > 7) {
      recommendations.push(
        "Consider reducing number of H2 sections (current: " +
          h2Count +
          ") - may overwhelm users",
      );
    }

    // Check for clear CTAs
    const ctaPatterns = [
      /class="[^"]*cta[^"]*"/i,
      /class="[^"]*button[^"]*"/i,
      /<button/i,
    ];
    const hasCTA = ctaPatterns.some((pattern) => pattern.test(designCode));

    if (!hasCTA && pageType === "landing") {
      issues.push({
        type: "conversion",
        severity: "high",
        message: "No clear CTA found - users don't know what to do",
      });
    }

    // Check for progressive disclosure (accordions, tabs, etc.)
    const hasProgressiveDisclosure =
      designCode.includes("accordion") ||
      designCode.includes("tab") ||
      designCode.includes("collapsible");
    if (!hasProgressiveDisclosure && designCode.length > 5000) {
      recommendations.push(
        "Consider progressive disclosure (accordions/tabs) to reduce cognitive load",
      );
    }

    // Check for "Don't Make Me Think" violations
    const unclearLabels = [/click here/i, /read more/i, /learn more$/i];
    unclearLabels.forEach((pattern) => {
      if (pattern.test(designCode)) {
        issues.push({
          type: "usability",
          severity: "medium",
          message: `Vague link text found: "${pattern.source}" - be descriptive`,
        });
      }
    });

    return {
      content: [
        {
          type: "text",
          text: `## Visual Hierarchy & Cognitive Load Analysis\n\n### "Don't Make Me Think" Score: ${Math.max(0, cognitiveLoadScore - issues.length * 10)}/100\n\n### Heading Structure:\n- H1: ${h1Count} ${h1Count === 1 ? "✅" : "❌"}\n- H2: ${h2Count}\n- H3: ${h3Count}\n\n### Issues (${issues.length}):\n${issues.map((i: any) => `- ${i.severity.toUpperCase()}: ${i.message}`).join("\n") || "None"}\n\n### Cognitive Load Recommendations:\n${recommendations.map((r: string) => `- ${r}`).join("\n") || "None"}\n\n### 3-Second Rule Checklist:\n- [ ] Page purpose immediately clear\n- [ ] Primary action obvious\n- [ ] No ambiguous labels\n- [ ] Clear visual hierarchy\n- [ ] Progressive disclosure used`,
        },
      ],
    };
  }

  private async recommendImages(args: any): Promise<any> {
    const { context, style = "photography", budget = "free" } = args;

    const recommendations: any = {
      libraries: [],
      tips: [],
      style: style,
    };

    // Context-specific recommendations
    if (context.toLowerCase().includes("hero")) {
      recommendations.tips.push(
        "Hero images should be high-impact but not compete with text",
      );
      recommendations.tips.push(
        "Use overlay/gradient to ensure text readability",
      );
      recommendations.tips.push(
        "Recommended size: 1920x1080px, optimized to < 200KB",
      );
    }

    if (
      context.toLowerCase().includes("team") ||
      context.toLowerCase().includes("portrait")
    ) {
      recommendations.tips.push(
        "Use consistent lighting and background for team photos",
      );
      recommendations.tips.push("Square or 4:5 aspect ratio works best");
    }

    if (context.toLowerCase().includes("product")) {
      recommendations.tips.push(
        "Use high-quality product photography with neutral background",
      );
      recommendations.tips.push("Include multiple angles and detail shots");
    }

    // Library recommendations based on budget and style
    if (budget === "free") {
      if (style === "photography") {
        recommendations.libraries.push({
          name: "Unsplash",
          url: "unsplash.com",
          description: "Free, high-quality photography",
        });
        recommendations.libraries.push({
          name: "Pexels",
          url: "pexels.com",
          description: "Free stock photos and videos",
        });
      } else if (style === "illustration") {
        recommendations.libraries.push({
          name: "unDraw",
          url: "undraw.co",
          description: "Customizable open-source illustrations",
        });
        recommendations.libraries.push({
          name: "Humaaans",
          url: "humaaans.com",
          description: "Mix-and-match people illustrations",
        });
      } else if (style === "3d") {
        recommendations.libraries.push({
          name: "BlenderKit",
          url: "blenderkit.com",
          description: "Free 3D assets",
        });
      }
    } else if (budget === "premium") {
      recommendations.libraries.push({
        name: "Shutterstock",
        url: "shutterstock.com",
        description: "Extensive premium catalog",
      });
      recommendations.libraries.push({
        name: "Getty Images",
        url: "gettyimages.com",
        description: "Editorial and commercial quality",
      });
    }

    // Icon recommendations
    recommendations.libraries.push({
      name: "Lucide",
      url: "lucide.dev",
      description: "Clean, consistent icon library (Free)",
    });
    recommendations.libraries.push({
      name: "Heroicons",
      url: "heroicons.com",
      description: "Beautiful SVG icons by Tailwind (Free)",
    });

    return {
      content: [
        {
          type: "text",
          text: `## Image Recommendations for: ${context}\n\n### Style: ${style}\n### Budget: ${budget}\n\n### Recommended Libraries:\n${recommendations.libraries.map((lib: any) => `- **${lib.name}** (${lib.url})\n  ${lib.description}`).join("\n")}\n\n### Context-Specific Tips:\n${recommendations.tips.map((tip: string) => `- ${tip}`).join("\n")}\n\n### Image Optimization Checklist:\n- [ ] WebP format with JPEG fallback\n- [ ] Responsive srcset for different sizes\n- [ ] Alt text describing purpose (not just "image")\n- [ ] Lazy loading for below-fold images\n- [ ] Compressed to < 200KB without quality loss\n- [ ] Consistent style across all images`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    await frameworkLogger.log(
      "ui-ux-design.server",
      "-strray-ui-ux-design-mcp-server-running-",
      "info",
      { message: "StrRay UI/UX Design MCP Server running..." },
    );

    const cleanup = async (signal: string) => {
      await frameworkLogger.log(
        "ui-ux-design.server",
        "-received-signal-shutting-down-gracefully-",
        "info",
        { message: `Received ${signal}, shutting down gracefully...` },
      );

      // Set a timeout to force exit if graceful shutdown fails
      const timeout = setTimeout(() => {
        frameworkLogger.log("mcps/ui-ux-design", "shutdown", "error", { message: "Graceful shutdown timeout, forcing exit..." });
        process.exit(1);
      }, 5000); // 5 second timeout

      try {
        if (this.server && typeof this.server.close === "function") {
          await this.server.close();
        }
        clearTimeout(timeout);
        await frameworkLogger.log(
          "ui-ux-design.server",
          "-strray-mcp-server-shut-down-gracefully-",
          "info",
          { message: "StrRay MCP Server shut down gracefully" },
        );
        process.exit(0);
      } catch (error) {
        clearTimeout(timeout);
        frameworkLogger.log("mcps/ui-ux-design", "shutdown", "error", { message: `Error during server shutdown: ${String(error)}` });
        process.exit(1);
      }
    };

    // Handle multiple shutdown signals
    process.on("SIGINT", () => cleanup("SIGINT"));
    process.on("SIGTERM", () => cleanup("SIGTERM"));
    process.on("SIGHUP", () => cleanup("SIGHUP"));

    // Monitor parent process (opencode) and shutdown if it dies
    const checkParent = async () => {
      try {
        process.kill(process.ppid, 0); // Check if parent is alive
        setTimeout(checkParent, 1000); // Check again in 1 second
      } catch (error) {
        // Parent process died, shut down gracefully
        await frameworkLogger.log(
          "ui-ux-design.server",
          "-parent-process-opencode-died-shutting-down-mcp-se",
          "info",
          {
            message:
              "Parent process (opencode) died, shutting down MCP server...",
          },
        );
        cleanup("parent-process-death");
      }
    };

    // Start monitoring parent process
    setTimeout(checkParent, 2000); // Start checking after 2 seconds

    // Handle uncaught exceptions and unhandled rejections
    process.on("uncaughtException", (error) => {
      frameworkLogger.log("mcps/ui-ux-design", "uncaughtException", "error", { error: String(error) });
      cleanup("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      frameworkLogger.log("mcps/ui-ux-design", "unhandledRejection", "error", { error: String(reason) });
      cleanup("unhandledRejection");
    });

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayUIUXDesignServer();
  server.run().catch((error) => frameworkLogger.log("mcps/ui-ux-design", "run", "error", { error: String(error) }));
}

export { StrRayUIUXDesignServer };
