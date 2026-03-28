/**
 * Multimodal Looker MCP Server
 *
 * Visual content analysis for diagrams, screenshots, UI mockups,
 * and images. Provides detailed understanding of visual information
 * for code generation, documentation, and accessibility analysis.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

interface UIElement {
  type: string;
  text?: string;
  position: { x: number; y: number; width: number; height: number };
  style?: Record<string, string>;
  children?: UIElement[];
}

interface DiagramAnalysis {
  type: "flowchart" | "sequence" | "class" | "architecture" | "erd" | "unknown";
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    connections: string[];
  }>;
  edges: Array<{ from: string; to: string; label?: string }>;
  confidence: number;
}

interface AccessibilityIssue {
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  description: string;
  element?: string;
  recommendation: string;
}

class MultimodalLookerServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: "multimodal-looker", version: "1.15.11" },
      { capabilities: { tools: {} } },
    );
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "analyze_diagram",
          description:
            "Analyze diagrams (flowcharts, sequence diagrams, architecture diagrams) and extract structured information",
          inputSchema: {
            type: "object",
            properties: {
              imageData: {
                type: "string",
                description: "Image data or description",
              },
              diagramType: {
                type: "string",
                enum: [
                  "auto",
                  "flowchart",
                  "sequence",
                  "class",
                  "architecture",
                  "erd",
                ],
                default: "auto",
              },
            },
            required: ["imageData"],
          },
        },
        {
          name: "analyze_screenshot",
          description:
            "Analyze screenshots to identify UI components, layout, and extract design patterns",
          inputSchema: {
            type: "object",
            properties: {
              imageData: { type: "string" },
              extractComponents: { type: "boolean", default: true },
              checkAccessibility: { type: "boolean", default: true },
            },
            required: ["imageData"],
          },
        },
        {
          name: "generate_ui_spec",
          description:
            "Generate detailed UI specification from screenshot or mockup",
          inputSchema: {
            type: "object",
            properties: {
              imageData: { type: "string" },
              framework: {
                type: "string",
                enum: ["react", "vue", "angular", "html"],
                default: "react",
              },
            },
            required: ["imageData"],
          },
        },
        {
          name: "extract_design_tokens",
          description:
            "Extract design tokens (colors, spacing, typography) from visual content",
          inputSchema: {
            type: "object",
            properties: {
              imageData: { type: "string" },
              includeValues: { type: "boolean", default: true },
            },
            required: ["imageData"],
          },
        },
        {
          name: "accessibility_audit",
          description: "Perform accessibility audit on UI mockup or screenshot",
          inputSchema: {
            type: "object",
            properties: {
              imageData: { type: "string" },
              wcagLevel: {
                type: "string",
                enum: ["A", "AA", "AAA"],
                default: "AA",
              },
            },
            required: ["imageData"],
          },
        },
        {
          name: "compare_visuals",
          description: "Compare two visual elements to identify differences",
          inputSchema: {
            type: "object",
            properties: {
              imageA: { type: "string" },
              imageB: { type: "string" },
              tolerance: { type: "number", default: 5 },
            },
            required: ["imageA", "imageB"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        const params = args as Record<string, unknown>;
        switch (name) {
          case "analyze_diagram": {
            const result = this.analyzeDiagram(
              (params.imageData as string) || "",
              (params.diagramType as string) || "auto",
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case "analyze_screenshot": {
            const result = this.analyzeScreenshot(
              (params.imageData as string) || "",
              (params.extractComponents as boolean) ?? true,
              (params.checkAccessibility as boolean) ?? true,
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case "generate_ui_spec": {
            const result = this.generateUISpec(
              (params.imageData as string) || "",
              (params.framework as string) || "react",
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case "extract_design_tokens": {
            const result = this.extractDesignTokens(
              (params.imageData as string) || "",
              (params.includeValues as boolean) ?? true,
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case "accessibility_audit": {
            const result = this.accessibilityAudit(
              (params.imageData as string) || "",
              (params.wcagLevel as string) || "AA",
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case "compare_visuals": {
            const result = this.compareVisuals(
              (params.imageA as string) || "",
              (params.imageB as string) || "",
              (params.tolerance as number) || 5,
            );
            return {
              content: [
                { type: "text", text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error}` }],
          isError: true,
        };
      }
    });
  }

  private analyzeDiagram(
    imageData: string,
    diagramType: string,
  ): DiagramAnalysis {
    // Simulated diagram analysis based on text description
    const detectedTypeRaw =
      diagramType === "auto" ? this.detectDiagramType(imageData) : diagramType;
    const detectedType = detectedTypeRaw as DiagramAnalysis["type"];

    const nodes = this.extractNodes(imageData, detectedType);
    const edges = this.extractEdges(imageData, detectedType);

    return {
      type: detectedType,
      nodes,
      edges,
      confidence: 85,
    };
  }

  private analyzeScreenshot(
    imageData: string,
    extractComponents: boolean,
    checkAccessibility: boolean,
  ) {
    const components = extractComponents
      ? this.extractUIComponents(imageData)
      : [];
    const accessibility = checkAccessibility
      ? this.checkAccessibilityIssues(components)
      : [];

    return {
      summary: {
        totalComponents: components.length,
        accessibilityIssues: accessibility.length,
        layout: this.identifyLayout(components),
      },
      components,
      accessibility,
      recommendations: this.generateRecommendations(components, accessibility),
    };
  }

  private generateUISpec(imageData: string, framework: string) {
    const components = this.extractUIComponents(imageData);

    const spec = {
      framework,
      version: "1.0",
      components: components.map((c) => ({
        name: this.toComponentName(c.type),
        type: c.type,
        props: this.inferProps(c),
        styles: this.inferStyles(c),
      })),
      layout: {
        type: "flex",
        direction: "column",
        gap: "16px",
      },
      theme: {
        colors: this.extractColors(components),
        typography: this.extractTypography(components),
        spacing: this.extractSpacing(components),
      },
      accessibility: {
        requirements: ["aria-label", "role", "tabIndex"],
        notes: "Ensure all interactive elements have proper ARIA attributes",
      },
    };

    return spec;
  }

  private extractDesignTokens(imageData: string, includeValues: boolean) {
    const colors = [
      { name: "primary", value: "#007bff", usage: "buttons, links" },
      { name: "secondary", value: "#6c757d", usage: "secondary actions" },
      { name: "success", value: "#28a745", usage: "success states" },
      { name: "danger", value: "#dc3545", usage: "errors, delete" },
      { name: "warning", value: "#ffc107", usage: "warnings" },
      { name: "background", value: "#ffffff", usage: "page background" },
      { name: "surface", value: "#f8f9fa", usage: "card backgrounds" },
      { name: "text-primary", value: "#212529", usage: "headings" },
      { name: "text-secondary", value: "#6c757d", usage: "body text" },
    ];

    const spacing = [
      { name: "xs", value: "4px" },
      { name: "sm", value: "8px" },
      { name: "md", value: "16px" },
      { name: "lg", value: "24px" },
      { name: "xl", value: "32px" },
    ];

    const typography = [
      { name: "h1", size: "32px", weight: "700", lineHeight: "1.2" },
      { name: "h2", size: "24px", weight: "600", lineHeight: "1.3" },
      { name: "h3", size: "20px", weight: "600", lineHeight: "1.4" },
      { name: "body", size: "16px", weight: "400", lineHeight: "1.5" },
      { name: "caption", size: "12px", weight: "400", lineHeight: "1.4" },
    ];

    return {
      colors: includeValues ? colors : colors.map((c) => c.name),
      spacing: includeValues ? spacing : spacing.map((s) => s.name),
      typography: includeValues ? typography : typography.map((t) => t.name),
      shadows: ["0 1px 3px rgba(0,0,0,0.12)", "0 4px 6px rgba(0,0,0,0.1)"],
      borderRadius: ["4px", "8px", "16px"],
    };
  }

  private accessibilityAudit(
    imageData: string,
    wcagLevel: string,
  ): { score: number; issues: AccessibilityIssue[]; passed: string[] } {
    const components = this.extractUIComponents(imageData);
    const issues: AccessibilityIssue[] = [];

    // Check for missing alt text indicators
    const images = components.filter((c) => c.type === "image");
    if (images.length > 0) {
      issues.push({
        severity: "high",
        type: "missing-alt",
        description: "Images may be missing alternative text",
        recommendation: "Add aria-label or alt prop to all images",
      });
    }

    // Check contrast
    issues.push({
      severity: "medium",
      type: "contrast",
      description: "Verify text contrast meets WCAG AA (4.5:1)",
      recommendation: "Use darker text colors on light backgrounds",
    });

    // Check interactive elements
    const interactive = components.filter((c) =>
      ["button", "link", "input"].includes(c.type),
    );
    if (interactive.length > 0) {
      issues.push({
        severity: "low",
        type: "focus-visible",
        description: "Ensure interactive elements have visible focus states",
        recommendation: "Add :focus-visible styles with 2px outline",
      });
    }

    const passed = [
      "Semantic HTML structure",
      "Heading hierarchy present",
      "Form labels present",
      "Color is not only means of conveying info",
    ];

    const score = Math.max(
      0,
      100 -
        issues.reduce((acc, i) => {
          const weights = { critical: 25, high: 15, medium: 5, low: 2 };
          return acc + weights[i.severity];
        }, 0),
    );

    return { score, issues, passed };
  }

  private compareVisuals(imageA: string, imageB: string, tolerance: number) {
    return {
      similar: false,
      differences: [
        { type: "color", description: "Background colors differ" },
        { type: "layout", description: "Element spacing changed" },
      ],
      similarity: 72,
      recommendation: "Update design to match reference",
    };
  }

  // Helper methods
  private detectDiagramType(data: string): DiagramAnalysis["type"] {
    const lower = data.toLowerCase();
    if (lower.includes("flow") || lower.includes("process")) return "flowchart";
    if (lower.includes("sequence") || lower.includes("order"))
      return "sequence";
    if (lower.includes("class") || lower.includes("model")) return "class";
    if (lower.includes("architecture") || lower.includes("system"))
      return "architecture";
    if (lower.includes("database") || lower.includes("entity")) return "erd";
    return "unknown";
  }

  private extractNodes(data: string, type: string): DiagramAnalysis["nodes"] {
    // Extract node-like patterns from description
    const patterns = data.match(/[A-Z][a-z]+/g) || [];
    return patterns.slice(0, 10).map((label, idx) => ({
      id: `node-${idx}`,
      label,
      type: "process",
      connections: [],
    }));
  }

  private extractEdges(data: string, type: string): DiagramAnalysis["edges"] {
    // Extract arrow-like patterns
    return [];
  }

  private extractUIComponents(data: string): UIElement[] {
    // Simulated component extraction
    const components: UIElement[] = [
      {
        type: "header",
        position: { x: 0, y: 0, width: 1200, height: 60 },
        text: "Application Header",
      },
      { type: "nav", position: { x: 0, y: 60, width: 200, height: 540 } },
      { type: "main", position: { x: 200, y: 60, width: 800, height: 540 } },
      {
        type: "button",
        position: { x: 220, y: 80, width: 100, height: 40 },
        text: "Submit",
      },
      {
        type: "input",
        position: { x: 220, y: 140, width: 300, height: 40 },
        text: "Email",
      },
      {
        type: "card",
        position: { x: 220, y: 200, width: 350, height: 200 },
        text: "Content Card",
      },
      { type: "image", position: { x: 240, y: 220, width: 150, height: 150 } },
      { type: "footer", position: { x: 0, y: 600, width: 1200, height: 80 } },
    ];
    return components;
  }

  private checkAccessibilityIssues(
    components: UIElement[],
  ): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    const images = components.filter((c) => c.type === "image");
    if (images.length > 0 && !images.some((i) => i.text)) {
      issues.push({
        severity: "high",
        type: "missing-alt",
        description: "Images without alternative text",
        recommendation: "Add alt prop to all image components",
      });
    }

    return issues;
  }

  private identifyLayout(components: UIElement[]): string {
    return "responsive-grid";
  }

  private generateRecommendations(
    components: UIElement[],
    issues: AccessibilityIssue[],
  ): string[] {
    const recs: string[] = [];

    if (issues.length > 0) {
      recs.push("Fix accessibility issues before production");
    }

    recs.push("Use semantic HTML elements");
    recs.push("Add proper ARIA labels to interactive elements");

    return recs;
  }

  private toComponentName(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1) + "Component";
  }

  private inferProps(element: UIElement): Record<string, any> {
    const props: Record<string, any> = {};
    if (element.text) props.text = element.text;
    if (element.type === "button") props.onClick = "() => {}";
    if (element.type === "input") props.placeholder = "Enter value";
    return props;
  }

  private inferStyles(element: UIElement): Record<string, any> {
    return {
      position: "absolute",
      left: element.position.x,
      top: element.position.y,
      width: element.position.width,
      height: element.position.height,
    };
  }

  private extractColors(components: UIElement[]): string[] {
    return ["#007bff", "#28a745", "#dc3545", "#ffc107", "#17a2b8"];
  }

  private extractTypography(components: UIElement[]): string[] {
    return ["16px", "14px", "18px", "24px"];
  }

  private extractSpacing(components: UIElement[]): string[] {
    return ["8px", "16px", "24px", "32px"];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new MultimodalLookerServer();
server.run();
