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
class StrRayUIUXDesignServer {
  server;
  constructor() {
    this.server = new Server({
      name: "strray-ui-ux-design",
      version: "1.0.0",
    });
    this.setupToolHandlers();
    console.log("StrRay UI/UX Design MCP Server initialized");
  }
  setupToolHandlers() {
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
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }
  async analyzeUIComponent(args) {
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
      const analysis = {
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
  async designComponent(args) {
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
              `🏗️ COMPONENT STRUCTURE\n${designSpec.structure.map((item) => `• ${item}`).join("\n")}\n\n` +
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
  async auditAccessibility(args) {
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
  async generateDesignSystem(args) {
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
  extractComponentName(code, framework) {
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
  analyzeComponentCode(code, framework, checkAccessibility, checkResponsive) {
    const issues = [];
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
  checkAccessibilityIssues(code, framework) {
    const issues = [];
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
  checkResponsiveIssues(code, framework) {
    const issues = [];
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
  checkUsabilityIssues(code, framework) {
    const issues = [];
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
  checkPerformanceIssues(code, framework) {
    const issues = [];
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
  checkSemanticIssues(code, framework) {
    const issues = [];
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
  calculateAccessibilityScore(issues) {
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
  calculateUsabilityScore(issues) {
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
  generateUIRecommendations(issues, framework) {
    const recommendations = [];
    // Group issues by type
    const byType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
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
  identifyDesignPatterns(code, framework) {
    const patterns = [];
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
  generateComponentDesign(
    componentType,
    requirements,
    framework,
    accessibility,
  ) {
    const design = {
      componentType,
      requirements,
      framework,
      accessibility,
      structure: [],
      props: [],
      states: [],
      variants: [],
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
  generateComponentCode(design, framework) {
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
  generateReactComponent(design) {
    const propsInterface = design.props.map((prop) => `  ${prop};`).join("\n");
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
  generateVueComponent(design) {
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
  generateAngularComponent(design) {
    return `import { Component, Input, Output, EventEmitter } from '@angular/core';

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
  addAccessibilityFeatures(design, framework) {
    const features = [];
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
  checkWCAGCompliance(htmlContent, cssContent, level) {
    const violations = [];
    // Basic WCAG checks (simplified)
    if (!htmlContent.includes("lang=")) {
      violations.push({
        guideline: "3.1.1 Language of Page",
        severity: "medium",
        description: "Missing language attribute on html element",
      });
    }
    // Color contrast would require CSS parsing
    if (cssContent && cssContent.includes("color:")) {
      violations.push({
        guideline: "1.4.3 Contrast (Minimum)",
        severity: "info",
        description: "Color contrast should be verified manually",
      });
    }
    return violations;
  }
  calculateWCAGScore(violations, level) {
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
  generateAccessibilityRecommendations(violations) {
    const recommendations = [];
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
  createDesignSystem(
    brandGuidelines,
    targetAudience,
    platform,
    includeAccessibility,
  ) {
    // Generate a basic design system based on inputs
    const colors = {
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
    const typography = {
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
    const spacing = {
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
    const components = {
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
    const patterns = [
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
  generateDesignTokens(system) {
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
  generateDesignSystemDocs(system) {
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
    console.log("StrRay UI/UX Design MCP Server running...");
  }
}
// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StrRayUIUXDesignServer();
  server.run().catch(console.error);
}
export { StrRayUIUXDesignServer };
//# sourceMappingURL=ui-ux-design.server.js.map
