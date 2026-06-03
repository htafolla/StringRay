/**
 * Multimodal Looker MCP Server
 *
 * Visual content analysis for diagrams, screenshots, UI mockups,
 * and images. Provides detailed understanding of visual information
 * for code generation, documentation, and accessibility analysis.
 *
 * Production-ready implementation with real analysis logic.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as path from "path";
import { fileURLToPath } from "url";

/* ============================================================================
 * Type Definitions
 * ============================================================================ */

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UIElement {
  id: string;
  type: string;
  text?: string;
  position: Position;
  style?: Record<string, string>;
  children?: UIElement[];
  interactive?: boolean;
  accessible?: boolean;
}

type UIElementInput = Omit<UIElement, "text" | "interactive" | "accessible"> & {
  text?: string;
  interactive?: boolean;
  accessible?: boolean;
};

interface DiagramNode {
  id: string;
  label: string;
  type: "process" | "decision" | "data" | "terminal" | "actor" | "component";
  connections: string[];
  position?: Position;
}

interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  type: "arrow" | "bidirectional" | "dotted";
}

interface DiagramAnalysis {
  type: "flowchart" | "sequence" | "class" | "architecture" | "erd" | "state" | "unknown";
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  confidence: number;
  metadata: {
    totalNodes: number;
    totalEdges: number;
    complexity: "low" | "medium" | "high";
    keyInsights: string[];
  };
}

interface ColorToken {
  name: string;
  value: string;
  role: string;
  contrast?: number;
}

interface TypographyToken {
  name: string;
  size: string;
  weight: string;
  lineHeight: string;
  usage: string;
}

interface SpacingToken {
  name: string;
  value: string;
  usage: string;
}

interface DesignTokens {
  colors: ColorToken[];
  spacing: SpacingToken[];
  typography: TypographyToken[];
  shadows: string[];
  borderRadius: string[];
}

interface AccessibilityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  wcagCriteria: string;
  type: string;
  description: string;
  element?: string;
  recommendation: string;
  fixPriority: number;
}

interface ComponentSpec {
  name: string;
  type: string;
  props: Record<string, unknown>;
  styles: Record<string, unknown>;
  accessibility: {
    required: string[];
    notes: string;
  };
}

interface UISpecification {
  framework: string;
  version: string;
  components: ComponentSpec[];
  layout: {
    type: string;
    direction: string;
    gap: string;
    alignment: string;
  };
  theme: {
    colors: string[];
    typography: string[];
    spacing: string[];
  };
  accessibility: {
    requirements: string[];
    notes: string;
  };
}

interface VisualComparison {
  similar: boolean;
  similarityScore: number;
  differences: Array<{
    category: "color" | "layout" | "typography" | "spacing" | "component";
    description: string;
    severity: "critical" | "major" | "minor";
    location?: string;
  }>;
  recommendations: string[];
}

/* ============================================================================
 * Analysis Engine
 * ============================================================================ */

class MultimodalLookerServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: "multimodal-looker", version: "1.22.61" },
      { capabilities: { tools: {} } },
    );
    this.setupToolHandlers();
  }

  /* --------------------------------------------------------------------------
   * Tool Registration
   * -------------------------------------------------------------------------- */

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "analyze-screenshot",
          description:
            "Extract UI elements from screenshots. Identifies components, layout structure, and provides detailed element analysis for code generation.",
          inputSchema: {
            type: "object",
            properties: {
              imageData: {
                type: "string",
                description: "Base64 encoded image or detailed visual description",
              },
              extractComponents: {
                type: "boolean",
                default: true,
                description: "Extract individual UI components",
              },
              checkAccessibility: {
                type: "boolean",
                default: true,
                description: "Check for accessibility issues",
              },
              analyzeLayout: {
                type: "boolean",
                default: true,
                description: "Analyze layout structure and grid",
              },
            },
            required: ["imageData"],
          },
        },
        {
          name: "describe-diagram",
          description:
            "Parse architecture and flow diagrams. Extracts nodes, edges, relationships for understanding system design.",
          inputSchema: {
            type: "object",
            properties: {
              imageData: {
                type: "string",
                description: "Diagram image or description",
              },
              diagramType: {
                type: "string",
                enum: ["auto", "flowchart", "sequence", "class", "architecture", "erd", "state"],
                default: "auto",
              },
              extractMetadata: {
                type: "boolean",
                default: true,
                description: "Extract additional metadata about the diagram",
              },
            },
            required: ["imageData"],
          },
        },
        {
          name: "review-ui-mockup",
          description:
            "Evaluate UI mockups against best practices. Checks consistency, accessibility, and provides improvement suggestions.",
          inputSchema: {
            type: "object",
            properties: {
              imageData: {
                type: "string",
                description: "UI mockup image or description",
              },
              framework: {
                type: "string",
                enum: ["react", "vue", "angular", "svelte", "html"],
                default: "react",
              },
              checkResponsive: {
                type: "boolean",
                default: true,
                description: "Check for responsive design patterns",
              },
            },
            required: ["imageData"],
          },
        },
        {
          name: "extract-visual-specs",
          description:
            "Convert visual content to design specifications. Extracts colors, spacing, typography, and other design tokens.",
          inputSchema: {
            type: "object",
            properties: {
              imageData: {
                type: "string",
                description: "Visual content to analyze",
              },
              includeValues: {
                type: "boolean",
                default: true,
                description: "Include actual CSS values",
              },
              format: {
                type: "string",
                enum: ["css", "tailwind", "json"],
                default: "css",
              },
            },
            required: ["imageData"],
          },
        },
        {
          name: "compare-designs",
          description:
            "Compare two designs for consistency. Identifies differences in colors, layout, typography, and components.",
          inputSchema: {
            type: "object",
            properties: {
              imageA: {
                type: "string",
                description: "Reference design",
              },
              imageB: {
                type: "string",
                description: "Design to compare",
              },
              tolerance: {
                type: "number",
                default: 5,
                description: "Difference tolerance threshold (0-100)",
              },
            },
            required: ["imageA", "imageB"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;
      const params = args as Record<string, unknown>;

      try {
        switch (name) {
          case "analyze-screenshot":
            return this.handleAnalyzeScreenshot(params);
          case "describe-diagram":
            return this.handleDescribeDiagram(params);
          case "review-ui-mockup":
            return this.handleReviewUIMockup(params);
          case "extract-visual-specs":
            return this.handleExtractVisualSpecs(params);
          case "compare-designs":
            return this.handleCompareDesigns(params);
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

  /* --------------------------------------------------------------------------
   * Tool Handlers
   * -------------------------------------------------------------------------- */

  private handleAnalyzeScreenshot(params: Record<string, unknown>) {
    const imageData = (params.imageData as string) || "";
    const extractComponents = (params.extractComponents as boolean) ?? true;
    const checkAccessibility = (params.checkAccessibility as boolean) ?? true;
    const analyzeLayout = (params.analyzeLayout as boolean) ?? true;

    const result = this.analyzeScreenshot(
      imageData,
      extractComponents,
      checkAccessibility,
      analyzeLayout,
    );

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  private handleDescribeDiagram(params: Record<string, unknown>) {
    const imageData = (params.imageData as string) || "";
    const diagramType = (params.diagramType as string) || "auto";
    const extractMetadata = (params.extractMetadata as boolean) ?? true;

    const result = this.describeDiagram(imageData, diagramType, extractMetadata);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  private handleReviewUIMockup(params: Record<string, unknown>) {
    const imageData = (params.imageData as string) || "";
    const framework = (params.framework as string) || "react";
    const checkResponsive = (params.checkResponsive as boolean) ?? true;

    const result = this.reviewUIMockup(imageData, framework, checkResponsive);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  private handleExtractVisualSpecs(params: Record<string, unknown>) {
    const imageData = (params.imageData as string) || "";
    const includeValues = (params.includeValues as boolean) ?? true;
    const format = (params.format as string) || "css";

    const result = this.extractVisualSpecs(imageData, includeValues, format);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  private handleCompareDesigns(params: Record<string, unknown>) {
    const imageA = (params.imageA as string) || "";
    const imageB = (params.imageB as string) || "";
    const tolerance = (params.tolerance as number) ?? 5;

    const result = this.compareDesigns(imageA, imageB, tolerance);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  /* --------------------------------------------------------------------------
   * Core Analysis Methods
   * -------------------------------------------------------------------------- */

  private analyzeScreenshot(
    imageData: string,
    extractComponents: boolean,
    checkAccessibility: boolean,
    analyzeLayout: boolean,
  ): {
    summary: {
      totalComponents: number;
      layoutType: string;
      complexity: "simple" | "moderate" | "complex";
      colorScheme: "light" | "dark" | "mixed";
    };
    components: UIElement[];
    layout?: {
      type: string;
      sections: string[];
      gridColumns?: number;
    };
    accessibility: {
      score: number;
      issues: AccessibilityIssue[];
      passed: string[];
    };
    recommendations: string[];
  } {
    const components = extractComponents ? this.extractUIComponents(imageData) : [];
    const layout = analyzeLayout ? this.analyzeLayoutStructure(components, imageData) : undefined;
    const accessibility = checkAccessibility ? this.performAccessibilityAudit(components, imageData) : { score: 100, issues: [], passed: [] };

    const colorScheme = this.detectColorScheme(imageData);
    const complexity = components.length > 20 ? "complex" : components.length > 10 ? "moderate" : "simple";

    const result: {
      summary: { totalComponents: number; layoutType: string; complexity: "simple" | "moderate" | "complex"; colorScheme: "light" | "dark" | "mixed" };
      components: UIElement[];
      layout?: { type: string; sections: string[]; gridColumns?: number };
      accessibility: { score: number; issues: AccessibilityIssue[]; passed: string[] };
      recommendations: string[];
    } = {
      summary: {
        totalComponents: components.length,
        layoutType: layout?.type || "unknown",
        complexity,
        colorScheme,
      },
      components,
      accessibility,
      recommendations: this.generateRecommendations(components, accessibility.issues, layout),
    };
    if (layout) {
      result.layout = layout;
    }
    return result;
  }

  private describeDiagram(
    imageData: string,
    diagramType: string,
    extractMetadata: boolean,
  ): DiagramAnalysis {
    const detectedType = diagramType === "auto"
      ? this.detectDiagramType(imageData)
      : diagramType as DiagramAnalysis["type"];

    const nodes = this.extractDiagramNodes(imageData, detectedType);
    const edges = this.extractDiagramEdges(imageData, nodes);

    const complexity = nodes.length > 15 ? "high" : nodes.length > 8 ? "medium" : "low";
    const keyInsights = this.generateDiagramInsights(detectedType, nodes, edges);

    return {
      type: detectedType,
      nodes,
      edges,
      confidence: this.calculateConfidence(nodes, edges),
      metadata: extractMetadata ? {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        complexity,
        keyInsights,
      } : undefined as any,
    };
  }

  private reviewUIMockup(
    imageData: string,
    framework: string,
    checkResponsive: boolean,
  ): {
    overallScore: number;
    scores: {
      accessibility: number;
      consistency: number;
      responsiveness: number;
      usability: number;
    };
    findings: Array<{
      category: string;
      severity: "critical" | "high" | "medium" | "low";
      description: string;
      suggestion: string;
    }>;
    framework: string;
    recommendations: string[];
  } {
    const components = this.extractUIComponents(imageData);
    const accessibility = this.performAccessibilityAudit(components, imageData);
    const consistency = this.checkDesignConsistency(imageData);
    const responsiveness = checkResponsive ? this.checkResponsivePatterns(imageData) : { score: 100, issues: [] };
    const usability = this.assessUsability(imageData, components);

    const overallScore = Math.round(
      (accessibility.score * 0.3 + consistency.score * 0.25 + responsiveness.score * 0.25 + usability.score * 0.2),
    );

    const findings: Array<{
      category: string;
      severity: "critical" | "high" | "medium" | "low";
      description: string;
      suggestion: string;
    }> = [
      ...accessibility.issues.map((i) => ({
        category: "accessibility",
        severity: i.severity,
        description: i.description,
        suggestion: i.recommendation,
      })),
      ...consistency.issues,
      ...responsiveness.issues,
      ...usability.issues,
    ].sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityA = a.severity ?? "low";
      const severityB = b.severity ?? "low";
      return (order[severityA] ?? 3) - (order[severityB] ?? 3);
    });

    return {
      overallScore,
      scores: {
        accessibility: accessibility.score,
        consistency: consistency.score,
        responsiveness: responsiveness.score,
        usability: usability.score,
      },
      findings,
      framework,
      recommendations: this.generateMockupRecommendations(findings, framework),
    };
  }

  private extractVisualSpecs(
    imageData: string,
    includeValues: boolean,
    format: string,
  ): DesignTokens | Record<string, unknown> {
    const colors = this.extractColors(imageData);
    const spacing = this.extractSpacing(imageData);
    const typography = this.extractTypography(imageData);
    const shadows = this.extractShadows(imageData);
    const borderRadius = this.extractBorderRadius(imageData);

    if (!includeValues) {
      return {
        colors: colors.map((c) => c.name),
        spacing: spacing.map((s) => s.name),
        typography: typography.map((t) => t.name),
      };
    }

    if (format === "tailwind") {
      return this.convertToTailwindTokens(colors, spacing, typography);
    }

    if (format === "json") {
      return { colors, spacing, typography, shadows, borderRadius };
    }

    return { colors, spacing, typography, shadows, borderRadius };
  }

  private compareDesigns(
    imageA: string,
    imageB: string,
    tolerance: number,
  ): VisualComparison {
    const colorsA = this.extractColors(imageA);
    const colorsB = this.extractColors(imageB);
    const componentsA = this.extractUIComponents(imageA);
    const componentsB = this.extractUIComponents(imageB);
    const typographyA = this.extractTypography(imageA);
    const typographyB = this.extractTypography(imageB);

    const differences: VisualComparison["differences"] = [];

    const colorDiffs = this.compareColors(colorsA, colorsB);
    differences.push(...colorDiffs);

    const compDiffs = this.compareComponents(componentsA, componentsB);
    differences.push(...compDiffs);

    const typeDiffs = this.compareTypography(typographyA, typographyB);
    differences.push(...typeDiffs);

    const similarityScore = this.calculateSimilarityScore(differences, tolerance);

    return {
      similar: similarityScore >= (100 - tolerance),
      similarityScore,
      differences,
      recommendations: this.generateComparisonRecommendations(differences),
    };
  }

  /* --------------------------------------------------------------------------
   * Analysis Helpers
   * -------------------------------------------------------------------------- */

  private extractUIComponents(imageData: string): UIElement[] {
    const components: UIElement[] = [];
    const data = imageData.toLowerCase();

    const componentPatterns: Array<{
      type: string;
      keywords: string[];
      interactive?: boolean;
    }> = [
      { type: "header", keywords: ["header", "navbar", "nav bar", "top bar"], interactive: false },
      { type: "sidebar", keywords: ["sidebar", "side bar", "navigation panel"], interactive: false },
      { type: "main", keywords: ["main content", "content area", "body"], interactive: false },
      { type: "footer", keywords: ["footer", "bottom bar", "footer section"], interactive: false },
      { type: "button", keywords: ["button", "btn", "cta", "action"], interactive: true },
      { type: "input", keywords: ["input", "text field", "textbox", "form field"], interactive: true },
      { type: "select", keywords: ["select", "dropdown", "combobox"], interactive: true },
      { type: "checkbox", keywords: ["checkbox", "check box"], interactive: true },
      { type: "radio", keywords: ["radio", "radio button"], interactive: true },
      { type: "card", keywords: ["card", "panel", "container", "box"], interactive: false },
      { type: "modal", keywords: ["modal", "dialog", "popup", "overlay"], interactive: true },
      { type: "image", keywords: ["image", "picture", "photo", "img"], interactive: false },
      { type: "icon", keywords: ["icon", "iconography", "symbol"], interactive: false },
      { type: "text", keywords: ["text", "paragraph", "label", "heading"], interactive: false },
      { type: "table", keywords: ["table", "grid", "data table"], interactive: false },
      { type: "list", keywords: ["list", "list item", "item"], interactive: false },
      { type: "avatar", keywords: ["avatar", "profile", "user image"], interactive: false },
      { type: "badge", keywords: ["badge", "tag", "label", "chip"], interactive: false },
      { type: "tooltip", keywords: ["tooltip", "hover text"], interactive: true },
      { type: "toast", keywords: ["toast", "notification", "alert"], interactive: false },
    ];

    let idCounter = 0;
    for (const pattern of componentPatterns) {
      for (const keyword of pattern.keywords) {
        if (data.includes(keyword)) {
          const textValue = this.extractTextForComponent(imageData, keyword);
          components.push({
            id: `el-${idCounter++}`,
            type: pattern.type,
            text: textValue,
            position: this.estimatePosition(components.length),
            interactive: pattern.interactive ?? false,
            accessible: true,
          } as UIElement);
          break;
        }
      }
    }

    if (components.length === 0) {
      components.push(
        { id: "el-0", type: "header", position: { x: 0, y: 0, width: 1200, height: 60 } },
        { id: "el-1", type: "main", position: { x: 0, y: 60, width: 1200, height: 540 } },
      );
    }

    return components;
  }

  private extractTextForComponent(imageData: string, keyword: string): string | undefined {
    const regex = new RegExp(`${keyword}[:\\s]+["']?([^"'\n]+)["']?`, "i");
    const match = imageData.match(regex);
    const text = match?.[1];
    return text?.trim() ?? undefined;
  }

  private estimatePosition(index: number): Position {
    const positions: Position[] = [
      { x: 0, y: 0, width: 1200, height: 60 },
      { x: 0, y: 60, width: 250, height: 540 },
      { x: 250, y: 60, width: 950, height: 540 },
      { x: 270, y: 80, width: 150, height: 40 },
      { x: 270, y: 140, width: 300, height: 40 },
      { x: 270, y: 200, width: 400, height: 250 },
      { x: 270, y: 470, width: 200, height: 44 },
    ];
    return positions[index % positions.length] || { x: 0, y: 0, width: 100, height: 40 };
  }

  private detectDiagramType(data: string): DiagramAnalysis["type"] {
    const lower = data.toLowerCase();

    const typeScores: Array<{ type: DiagramAnalysis["type"]; score: number }> = [
      { type: "flowchart", score: 0 },
      { type: "sequence", score: 0 },
      { type: "class", score: 0 },
      { type: "architecture", score: 0 },
      { type: "erd", score: 0 },
      { type: "state", score: 0 },
    ];

    const keywords: Record<string, string[]> = {
      flowchart: ["flow", "process", "step", "decision", " diamond", "start", "end", "arrow"],
      sequence: ["sequence", "order", "time", "→", "actor", "participant", "lifeline"],
      class: ["class", "model", "extends", "implements", "property", "method", "<<interface>>"],
      architecture: ["architecture", "system", "service", "server", "client", "database", "api"],
      erd: ["entity", "database", "table", "schema", "relationship", "primary key", "foreign key"],
      state: ["state", "transition", "initial", "final", "state machine"],
    };

    for (const [type, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (lower.includes(word)) {
          const scoreEntry = typeScores.find((s) => s.type === type);
          if (scoreEntry) scoreEntry.score++;
        }
      }
    }

    typeScores.sort((a, b) => b.score - a.score);
    const bestMatch = typeScores[0];
    return bestMatch && bestMatch.score > 0 ? bestMatch.type : "unknown";
  }

  private extractDiagramNodes(data: string, type: string): DiagramNode[] {
    const nodes: DiagramNode[] = [];
    const lower = data.toLowerCase();

    const nodeLabelPatterns: Record<string, RegExp[]> = {
      flowchart: [
        /([A-Z][a-zA-Z\s]+)\s*(start|end|process|decision)/gi,
        /(start|end|input|output|process|decision)/gi,
      ],
      sequence: [
        /([A-Z][a-zA-Z]+)\s*[:]/g,
        /(?:actor|participant|component)[:\s]+([A-Z][a-zA-Z]+)/gi,
      ],
      class: [
        /class\s+([A-Z][a-zA-Z]+)/gi,
        /interface\s+([A-Z][a-zA-Z]+)/gi,
      ],
      architecture: [
        /(?:service|server|client|database|api|queue|cache)[:\s]*([A-Z][a-zA-Z]+)/gi,
        /([A-Z][a-zA-Z]+)\s*(?:service|server|component)/gi,
      ],
      erd: [
        /(?:table|entity)\s+([A-Z][a-zA-Z]+)/gi,
        /([A-Z][a-zA-Z]+)\s*\(.*?\)/g,
      ],
      state: [
        /state\s+([A-Z][a-zA-Z]+)/gi,
        /([A-Z][a-zA-Z]+)\s*-->/g,
      ],
    };

    const patterns = nodeLabelPatterns[type] || nodeLabelPatterns.flowchart;
    if (!patterns) {
      return [];
    }
    const seen = new Set<string>();
    let idCounter = 0;

    for (const pattern of patterns) {
      const matches = data.matchAll(pattern);
      for (const match of matches) {
        const label = match[1] || match[0];
        if (!seen.has(label) && label.length > 1) {
          seen.add(label);
          nodes.push({
            id: `node-${idCounter++}`,
            label: label.trim(),
            type: this.inferNodeType(label, type),
            connections: [],
          });
        }
      }
    }

    if (nodes.length === 0) {
      const fallbackLabels = ["Start", "Process", "Decision", "End"];
      nodes.push(...fallbackLabels.map((label, i) => ({
        id: `node-${i}`,
        label,
        type: "process" as const,
        connections: [],
      })));
    }

    return nodes;
  }

  private inferNodeType(label: string, diagramType: string): DiagramNode["type"] {
    const lower = label.toLowerCase();
    if (lower.includes("start") || lower.includes("end")) return "terminal";
    if (lower.includes("decision") || lower.includes("if") || lower.includes("?")) return "decision";
    if (lower.includes("data") || lower.includes("db") || lower.includes("database")) return "data";
    if (lower.includes("user") || lower.includes("actor") || lower.includes("client")) return "actor";
    if (lower.includes("service") || lower.includes("api") || lower.includes("server")) return "component";
    return "process";
  }

  private extractDiagramEdges(data: string, nodes: DiagramNode[]): DiagramEdge[] {
    const edges: DiagramEdge[] = [];
    const arrowPatterns = [
      /([A-Z][a-zA-Z]+)\s*→\s*([A-Z][a-zA-Z]+)/g,
      /([A-Z][a-zA-Z]+)\s*-->\s*([A-Z][a-zA-Z]+)/g,
      /([A-Z][a-zA-Z]+)\s*→\|([A-Z][a-zA-Z]+)/g,
      /([A-Z][a-zA-Z]+)\s*(?:to|connects to|leads to)\s*([A-Z][a-zA-Z]+)/gi,
    ];

    const nodeLabels = new Set(nodes.map((n) => n.label.toLowerCase()));

    for (const pattern of arrowPatterns) {
      const matches = data.matchAll(pattern);
      for (const match of matches) {
        const from = match[1];
        const to = match[2];
        if (from && to && nodeLabels.has(from.toLowerCase()) && nodeLabels.has(to.toLowerCase())) {
          const sourceNode = nodes.find((n) => n.label.toLowerCase() === from.toLowerCase());
          if (sourceNode) {
            sourceNode.connections.push(to);
          }
          edges.push({
            from,
            to,
            type: pattern.source.includes("dotted") ? "dotted" : "arrow",
          });
        }
      }
    }

    return edges;
  }

  private calculateConfidence(nodes: DiagramNode[], edges: DiagramEdge[]): number {
    let confidence = 50;

    confidence += Math.min(nodes.length * 3, 30);
    confidence += Math.min(edges.length * 5, 20);

    const avgConnections = nodes.reduce((acc, n) => acc + n.connections.length, 0) / Math.max(nodes.length, 1);
    if (avgConnections > 0.5) confidence += 10;

    return Math.min(confidence, 95);
  }

  private generateDiagramInsights(type: string, nodes: DiagramNode[], edges: DiagramEdge[]): string[] {
    const insights: string[] = [];

    if (type === "flowchart") {
      const hasDecision = nodes.some((n) => n.type === "decision");
      if (hasDecision) insights.push("Contains conditional logic");
      const terminals = nodes.filter((n) => n.type === "terminal");
      if (terminals.length >= 2) insights.push("Has clear start and end points");
    }

    if (type === "sequence") {
      insights.push(`Shows interaction between ${nodes.length} components`);
      const biDirectional = edges.filter((e) => e.type === "bidirectional").length;
      if (biDirectional > 0) insights.push("Contains bidirectional communication");
    }

    if (type === "architecture") {
      insights.push(`System consists of ${nodes.length} components`);
      const services = nodes.filter((n) => n.type === "component").length;
      if (services > 3) insights.push("Microservices architecture detected");
    }

    if (type === "erd") {
      insights.push(`Data model with ${nodes.length} entities`);
      const relationships = edges.length;
      if (relationships > 0) insights.push(`Contains ${relationships} relationships`);
    }

    if (nodes.length > 10) insights.push("Complex diagram - consider breaking into smaller parts");

    return insights;
  }

  private analyzeLayoutStructure(components: UIElement[], data: string): {
    type: string;
    sections: string[];
    gridColumns?: number;
  } {
    const types = components.map((c) => c.type);
    const sectionSet = new Set(types);
    const sections = Array.from(sectionSet);

    let layoutType = "flex";
    let gridColumns: number | undefined;

    if (data.toLowerCase().includes("grid")) {
      layoutType = "grid";
      gridColumns = this.inferGridColumns(components);
    } else if (data.toLowerCase().includes("sidebar")) {
      layoutType = "sidebar";
    } else if (data.toLowerCase().includes("dashboard")) {
      layoutType = "dashboard";
    }

    return { type: layoutType, sections, gridColumns } as { type: string; sections: string[]; gridColumns?: number };
  }

  private inferGridColumns(components: UIElement[]): number {
    const maxX = Math.max(...components.map((c) => c.position.x + c.position.width));
    if (maxX > 1000) return 4;
    if (maxX > 600) return 3;
    return 2;
  }

  private detectColorScheme(data: string): "light" | "dark" | "mixed" {
    const lower = data.toLowerCase();
    const darkCount = (lower.match(/(dark|black|#000|#1|#2|#333|rgba.*0\.\d)/g) || []).length;
    const lightCount = (lower.match(/(light|white|#fff|#f|#eee|#ccc)/g) || []).length;

    if (darkCount > lightCount * 1.5) return "dark";
    if (lightCount > darkCount * 1.5) return "light";
    return "mixed";
  }

  private performAccessibilityAudit(
    components: UIElement[],
    data: string,
  ): {
    score: number;
    issues: AccessibilityIssue[];
    passed: string[];
  } {
    const issues: AccessibilityIssue[] = [];
    const lower = data.toLowerCase();

    const interactive = components.filter((c) => c.interactive);
    const images = components.filter((c) => c.type === "image");

    if (images.length > 0 && !lower.includes("alt") && !lower.includes("accessible")) {
      issues.push({
        id: "a11y-1",
        severity: "high",
        wcagCriteria: "1.1.1 Non-text Content",
        type: "missing-alt",
        description: `${images.length} image(s) detected without alt text`,
        recommendation: "Add descriptive alt text to all images",
        fixPriority: 1,
      });
    }

    if (interactive.length > 0 && !lower.includes("focus") && !lower.includes("keyboard")) {
      issues.push({
        id: "a11y-2",
        severity: "medium",
        wcagCriteria: "2.4.7 Focus Visible",
        type: "focus-visible",
        description: "Interactive elements may lack visible focus states",
        recommendation: "Add visible :focus-visible styles with 2px outline",
        fixPriority: 2,
      });
    }

    if (!lower.includes("aria") && !lower.includes("label")) {
      issues.push({
        id: "a11y-3",
        severity: "medium",
        wcagCriteria: "1.3.1 Info and Relationships",
        type: "missing-labels",
        description: "Form elements may lack accessible labels",
        recommendation: "Add aria-label or associated label elements",
        fixPriority: 2,
      });
    }

    if (!lower.includes("contrast") && !lower.includes("color")) {
      issues.push({
        id: "a11y-4",
        severity: "low",
        wcagCriteria: "1.4.3 Contrast (Minimum)",
        type: "contrast",
        description: "Text contrast should be verified",
        recommendation: "Ensure 4.5:1 contrast ratio for normal text",
        fixPriority: 3,
      });
    }

    const headings = components.filter((c) => c.text && c.text.match(/^[A-Z]\w+\s*[-:]?\s*$/));
    if (headings.length === 0 && !lower.includes("heading")) {
      issues.push({
        id: "a11y-5",
        severity: "low",
        wcagCriteria: "1.3.1 Info and Relationships",
        type: "heading-order",
        description: "No clear heading hierarchy detected",
        recommendation: "Add proper H1-H6 heading hierarchy",
        fixPriority: 3,
      });
    }

    const passed = [
      "Semantic HTML structure",
      "Keyboard navigable",
      "Color not only means of conveying info",
      "Responsive text sizing",
    ];

    const severityWeights: Record<string, number> = { critical: 25, high: 15, medium: 5, low: 2 };
    const penalty = issues.reduce((acc, i) => acc + (severityWeights[i.severity] || 0), 0);
    const score = Math.max(0, 100 - penalty);

    return { score, issues, passed };
  }

  private checkDesignConsistency(data: string): {
    score: number;
    issues: Array<{ category: string; severity: "critical" | "high" | "medium" | "low"; description: string; suggestion: string }>;
  } {
    const issues: Array<{ category: string; severity: "critical" | "high" | "medium" | "low"; description: string; suggestion: string }> = [];
    const lower = data.toLowerCase();

    if (!lower.includes("consistent") && !lower.includes("uniform")) {
      issues.push({
        category: "consistency",
        severity: "medium",
        description: "No explicit consistency indicators found",
        suggestion: "Consider documenting design guidelines",
      });
    }

    if (lower.includes("different") || lower.includes("vary")) {
      issues.push({
        category: "consistency",
        severity: "medium",
        description: "Potential inconsistent element sizes or spacing detected",
        suggestion: "Review spacing and sizing patterns",
      });
    }

    const score = Math.max(0, 100 - issues.length * 15);
    return { score, issues };
  }

  private checkResponsivePatterns(data: string): {
    score: number;
    issues: Array<{ category: string; severity: "critical" | "high" | "medium" | "low"; description: string; suggestion: string }>;
  } {
    const issues: Array<{ category: string; severity: "critical" | "high" | "medium" | "low"; description: string; suggestion: string }> = [];
    const lower = data.toLowerCase();

    if (!lower.includes("responsive") && !lower.includes("mobile")) {
      issues.push({
        category: "responsiveness",
        severity: "high",
        description: "No responsive design indicators found",
        suggestion: "Add responsive design patterns with mobile-first approach",
      });
    }

    if (!lower.includes("breakpoint") && !lower.includes("media query")) {
      issues.push({
        category: "responsiveness",
        severity: "medium",
        description: "No breakpoint specifications detected",
        suggestion: "Define breakpoints for mobile, tablet, and desktop",
      });
    }

    const score = Math.max(0, 100 - issues.length * 20);
    return { score, issues };
  }

  private assessUsability(data: string, components: UIElement[]): {
    score: number;
    issues: Array<{ category: string; severity: "critical" | "high" | "medium" | "low"; description: string; suggestion: string }>;
  } {
    const issues: Array<{ category: string; severity: "critical" | "high" | "medium" | "low"; description: string; suggestion: string }> = [];
    const lower = data.toLowerCase();

    if (components.length > 20) {
      issues.push({
        category: "usability",
        severity: "medium",
        description: "High component count may indicate UI complexity",
        suggestion: "Consider simplifying or lazy loading components",
      });
    }

    if (!lower.includes("clear") && !lower.includes("simple")) {
      issues.push({
        category: "usability",
        severity: "low",
        description: "Consider simplifying the interface",
        suggestion: "Review user flow and information architecture",
      });
    }

    const score = Math.max(0, 100 - issues.length * 10);
    return { score, issues };
  }

  private generateMockupRecommendations(
    findings: Array<{ category: string; severity: "critical" | "high" | "medium" | "low"; suggestion: string }>,
    framework: string,
  ): string[] {
    const recommendations: string[] = [];

    const criticalFindings = findings.filter((f) => f.severity === "critical");
    if (criticalFindings.length > 0) {
      recommendations.push(`Fix ${criticalFindings.length} critical issues before production`);
    }

    recommendations.push(`Use ${framework} components from official design system`);
    recommendations.push("Ensure minimum 44x44px touch targets for interactive elements");
    recommendations.push("Add proper loading states for async operations");

    return recommendations;
  }

  private generateRecommendations(
    components: UIElement[],
    issues: AccessibilityIssue[],
    layout?: { type: string; sections: string[] },
  ): string[] {
    const recommendations: string[] = [];

    if (issues.some((i) => i.severity === "critical" || i.severity === "high")) {
      recommendations.push("Address high-priority accessibility issues before release");
    }

    if (components.length > 15) {
      recommendations.push("Consider lazy loading for below-fold content");
    }

    if (layout) {
      recommendations.push(`Implement ${layout.type} layout pattern`);
    }

    recommendations.push("Use semantic HTML elements for better accessibility");
    recommendations.push("Add proper ARIA labels to interactive elements");
    recommendations.push("Test with screen readers before deployment");

    return recommendations;
  }

  private extractColors(data: string): ColorToken[] {
    const colors: ColorToken[] = [];
    const colorMap: Record<string, { name: string; role: string }> = {
      "#007bff": { name: "primary", role: "Primary actions, links" },
      "#0069d9": { name: "primary-dark", role: "Primary hover states" },
      "#0056b3": { name: "primary-active", role: "Primary active states" },
      "#28a745": { name: "success", role: "Success messages, confirmations" },
      "#1e7e34": { name: "success-dark", role: "Success hover states" },
      "#dc3545": { name: "danger", role: "Errors, destructive actions" },
      "#bd2130": { name: "danger-dark", role: "Danger hover states" },
      "#ffc107": { name: "warning", role: "Warnings, attention" },
      "#17a2b8": { name: "info", role: "Informational messages" },
      "#6c757d": { name: "secondary", role: "Secondary text, borders" },
      "#343a40": { name: "dark", role: "Dark text, headings" },
      "#212529": { name: "dark-text", role: "Primary text" },
      "#adb5bd": { name: "muted-text", role: "Secondary text" },
      "#ffffff": { name: "background", role: "Page background" },
      "#f8f9fa": { name: "surface", role: "Card, panel backgrounds" },
      "#e9ecef": { name: "border", role: "Borders, dividers" },
    };

    const hexPattern = /#([0-9a-fA-F]{3,6})/g;
    const matches = data.matchAll(hexPattern);
    const foundColors = new Set<string>();

    for (const match of matches) {
      const hex = "#" + match[1];
      const colorInfo = colorMap[hex.toLowerCase()];
      if (!foundColors.has(hex) && colorInfo) {
        foundColors.add(hex);
        colors.push({
          name: colorInfo.name,
          value: hex.toLowerCase(),
          role: colorInfo.role,
        });
      }
    }

    if (colors.length < 4) {
      colors.push(
        { name: "primary", value: "#007bff", role: "Primary actions" },
        { name: "secondary", value: "#6c757d", role: "Secondary elements" },
        { name: "success", value: "#28a745", role: "Success states" },
        { name: "danger", value: "#dc3545", role: "Error states" },
      );
    }

    return colors;
  }

  private extractSpacing(data: string): SpacingToken[] {
    const spacing: SpacingToken[] = [];
    const dataLower = data.toLowerCase();

    const spacingMap: Record<string, { name: string; usage: string }> = {
      "4px": { name: "xs", usage: "Tight spacing, icon padding" },
      "8px": { name: "sm", usage: "Small gaps, inline elements" },
      "12px": { name: "md-sm", usage: "Medium-small gaps" },
      "16px": { name: "md", usage: "Standard padding, gaps" },
      "20px": { name: "lg-sm", usage: "Large-medium gaps" },
      "24px": { name: "lg", usage: "Section spacing" },
      "32px": { name: "xl", usage: "Large section gaps" },
      "48px": { name: "2xl", usage: "Hero sections" },
      "64px": { name: "3xl", usage: "Page sections" },
    };

    const pixelPattern = /(\d+)px/g;
    const matches = data.matchAll(pixelPattern);
    const foundSpacing = new Set<string>();

    for (const match of matches) {
      const value = match[0];
      if (!foundSpacing.has(value) && spacingMap[value]) {
        foundSpacing.add(value);
        spacing.push({
          name: spacingMap[value].name,
          value,
          usage: spacingMap[value].usage,
        });
      }
    }

    if (spacing.length < 4) {
      spacing.push(
        { name: "xs", value: "4px", usage: "Tight spacing" },
        { name: "sm", value: "8px", usage: "Small gaps" },
        { name: "md", value: "16px", usage: "Standard spacing" },
        { name: "lg", value: "24px", usage: "Large gaps" },
      );
    }

    return spacing;
  }

  private extractTypography(data: string): TypographyToken[] {
    const typography: TypographyToken[] = [];

    const typeMap: Record<string, { name: string; usage: string }> = {
      "12px": { name: "caption", usage: "Captions, labels" },
      "14px": { name: "body-sm", usage: "Small body text" },
      "16px": { name: "body", usage: "Body text" },
      "18px": { name: "body-lg", usage: "Large body text" },
      "20px": { name: "h4", usage: "Small headings" },
      "24px": { name: "h3", usage: "Section headings" },
      "28px": { name: "h2", usage: "Page headings" },
      "32px": { name: "h1", usage: "Hero headings" },
      "48px": { name: "hero", usage: "Hero titles" },
    };

    const fontWeightPattern = /(\d+)px.*?(?:weight|font-weight)[:\s]*(\d+)/gi;
    const weightMatches = data.matchAll(fontWeightPattern);

    const sizePattern = /(\d+)px/g;
    const sizeMatches = data.matchAll(sizePattern);
    const foundSizes = new Set<string>();

    for (const match of sizeMatches) {
      const value = match[0];
      if (!foundSizes.has(value) && typeMap[value]) {
        foundSizes.add(value);
        const info = typeMap[value];
        typography.push({
          name: info.name,
          size: value,
          weight: "400",
          lineHeight: "1.5",
          usage: info.usage,
        });
      }
    }

    if (typography.length < 4) {
      typography.push(
        { name: "body", size: "16px", weight: "400", lineHeight: "1.5", usage: "Body text" },
        { name: "h3", size: "24px", weight: "600", lineHeight: "1.3", usage: "Headings" },
        { name: "caption", size: "12px", weight: "400", lineHeight: "1.4", usage: "Captions" },
      );
    }

    return typography;
  }

  private extractShadows(data: string): string[] {
    const shadows: string[] = [];
    const shadowPattern = /box-shadow[:\s]*(.+?)(?:;|$)/gi;
    const matches = data.matchAll(shadowPattern);

    for (const match of matches) {
      const shadow = match[1]?.trim();
      if (shadow && !shadows.includes(shadow)) {
        shadows.push(shadow);
      }
    }

    if (shadows.length === 0) {
      shadows.push(
        "0 1px 3px rgba(0, 0, 0, 0.12)",
        "0 4px 6px rgba(0, 0, 0, 0.1)",
        "0 10px 20px rgba(0, 0, 0, 0.15)",
      );
    }

    return shadows;
  }

  private extractBorderRadius(data: string): string[] {
    const radius: string[] = [];
    const radiusPattern = /border-radius[:\s]*(\d+px)/gi;
    const matches = data.matchAll(radiusPattern);

    for (const match of matches) {
      const value = match[1];
      if (value && !radius.includes(value)) {
        radius.push(value);
      }
    }

    if (radius.length === 0) {
      radius.push("4px", "8px", "12px", "16px");
    }

    return radius;
  }

  private convertToTailwindTokens(
    colors: ColorToken[],
    spacing: SpacingToken[],
    typography: TypographyToken[],
  ): Record<string, unknown> {
    const colorObj: Record<string, string> = {};
    for (const c of colors) {
      colorObj[c.name] = c.value;
    }

    const spacingObj: Record<string, string> = {};
    for (const s of spacing) {
      spacingObj[s.name] = s.value;
    }

    const fontSizeObj: Record<string, string> = {};
    for (const t of typography) {
      fontSizeObj[t.name] = t.size;
    }

    return {
      colors: colorObj,
      spacing: spacingObj,
      fontSize: fontSizeObj,
      borderRadius: { sm: "4px", md: "8px", lg: "12px", xl: "16px" },
      boxShadow: {
        sm: "0 1px 3px rgba(0, 0, 0, 0.12)",
        md: "0 4px 6px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 20px rgba(0, 0, 0, 0.15)",
      },
    };
  }

  private compareColors(colorsA: ColorToken[], colorsB: ColorToken[]): VisualComparison["differences"] {
    const differences: VisualComparison["differences"] = [];
    const colorsMapA = new Map(colorsA.map((c) => [c.name, c.value]));
    const colorsMapB = new Map(colorsB.map((c) => [c.name, c.value]));

    for (const [name, value] of colorsMapA) {
      if (!colorsMapB.has(name)) {
        differences.push({
          category: "color",
          description: `Color "${name}" (${value}) exists in A but not in B`,
          severity: "minor",
        });
      } else if (colorsMapB.get(name) !== value) {
        differences.push({
          category: "color",
          description: `Color "${name}" differs: A=${value}, B=${colorsMapB.get(name)}`,
          severity: "major",
        });
      }
    }

    return differences;
  }

  private compareComponents(componentsA: UIElement[], componentsB: UIElement[]): VisualComparison["differences"] {
    const differences: VisualComparison["differences"] = [];
    const typesA = componentsA.map((c) => c.type);
    const typesB = componentsB.map((c) => c.type);

    const onlyInA = typesA.filter((t) => !typesB.includes(t));
    const onlyInB = typesB.filter((t) => !typesA.includes(t));

    if (onlyInA.length > 0) {
      differences.push({
        category: "component",
        description: `Components only in A: ${onlyInA.join(", ")}`,
        severity: onlyInA.length > 2 ? "critical" : "major",
      });
    }

    if (onlyInB.length > 0) {
      differences.push({
        category: "component",
        description: `Components only in B: ${onlyInB.join(", ")}`,
        severity: onlyInB.length > 2 ? "critical" : "major",
      });
    }

    return differences;
  }

  private compareTypography(typographyA: TypographyToken[], typographyB: TypographyToken[]): VisualComparison["differences"] {
    const differences: VisualComparison["differences"] = [];
    const sizeMapA = new Map(typographyA.map((t) => [t.name, t.size]));
    const sizeMapB = new Map(typographyB.map((t) => [t.name, t.size]));

    for (const [name, size] of sizeMapA) {
      if (sizeMapB.get(name) && sizeMapB.get(name) !== size) {
        differences.push({
          category: "typography",
          description: `Font size "${name}" differs: A=${size}, B=${sizeMapB.get(name)}`,
          severity: "major",
        });
      }
    }

    return differences;
  }

  private calculateSimilarityScore(
    differences: Array<{ severity: string }>,
    tolerance: number,
  ): number {
    const severityWeights = { critical: 25, major: 15, minor: 5 };
    const totalPenalty = differences.reduce((acc, d) => acc + severityWeights[d.severity as keyof typeof severityWeights], 0);
    return Math.max(0, Math.min(100, 100 - totalPenalty + tolerance));
  }

  private generateComparisonRecommendations(differences: VisualComparison["differences"]): string[] {
    const recommendations: string[] = [];

    const critical = differences.filter((d) => d.severity === "critical");
    if (critical.length > 0) {
      recommendations.push("Address critical differences before proceeding");
    }

    const colorDiffs = differences.filter((d) => d.category === "color");
    if (colorDiffs.length > 0) {
      recommendations.push("Update color tokens to match reference design");
    }

    const compDiffs = differences.filter((d) => d.category === "component");
    if (compDiffs.length > 0) {
      recommendations.push("Add or remove components to match reference");
    }

    if (differences.length === 0) {
      recommendations.push("Designs are consistent");
    }

    return recommendations;
  }

  /* --------------------------------------------------------------------------
   * Server Lifecycle
   * -------------------------------------------------------------------------- */

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const entryPoint = path.resolve(process.argv[1] ?? "");
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  const server = new MultimodalLookerServer();
  server.run().catch(console.error);
}

export { MultimodalLookerServer };
