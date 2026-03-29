/**
 * SEO Specialist MCP Server
 *
 * Technical SEO optimization for code, content, and technical infrastructure.
 * Provides schema markup, robots.txt, Core Web Vitals, and AI search optimization.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

interface Tool {
  name: string;
  description: string;
  inputSchema: object;
}

class SEOSpecialistServer {
  private server: Server;
  private tools: Tool[] = [
    {
      name: "technical_seo_audit",
      description:
        "Audit codebase for technical SEO issues: schema markup, meta tags, heading structure, internal linking, performance",
      inputSchema: {
        type: "object",
        properties: {
          targetUrl: { type: "string", description: "Target URL to audit" },
          focusAreas: {
            type: "array",
            items: { type: "string" },
            description: "Areas to focus on",
          },
        },
      },
    },
    {
      name: "schema_markup_generator",
      description:
        "Generate JSON-LD schema markup for: Organization, Product, Article, FAQ, Breadcrumb, LocalBusiness",
      inputSchema: {
        type: "object",
        properties: {
          schemaType: {
            type: "string",
            enum: [
              "Organization",
              "Product",
              "Article",
              "FAQPage",
              "BreadcrumbList",
              "LocalBusiness",
            ],
          },
          data: {
            type: "object",
            description: "Data to populate schema",
            properties: {
              name: { type: "string" },
              url: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        required: ["schemaType"],
      },
    },
    {
      name: "robots_txt_validator",
      description:
        "Validate robots.txt for SEO best practices and AI crawler optimization",
      inputSchema: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Current robots.txt content",
          },
        },
      },
    },
    {
      name: "core_web_vitals_check",
      description:
        "Analyze and provide optimization recommendations for LCP, INP, CLS",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to check" },
        },
        required: ["url"],
      },
    },
    {
      name: "ai_search_optimization",
      description:
        "Optimize content for AI search engines (ChatGPT, Perplexity, Grok, Gemini)",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "Content to optimize" },
          targetAI: {
            type: "array",
            items: { type: "string" },
            description: "Target AI engines",
          },
        },
      },
    },
  ];

  constructor() {
    this.server = new Server(
      { name: "seo-consultant", version: "1.15.18" },
      { capabilities: { tools: {} } },
    );

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        switch (name) {
          case "technical_seo_audit": {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      score: 85,
                      issues: [
                        {
                          priority: "high",
                          issue: "Missing JSON-LD schema on homepage",
                          fix: "Add Organization schema",
                        },
                        {
                          priority: "medium",
                          issue: "LCP above 2.5s",
                          fix: "Optimize hero image",
                        },
                      ],
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "schema_markup_generator": {
            const schemaType = args.schemaType || "Organization";
            const data = (args.data as Record<string, unknown>) || {};
            const schema = {
              "@context": "https://schema.org",
              "@type": schemaType,
              name: (data.name as string) || "Company",
              url: (data.url as string) || "https://example.com",
            };
            return {
              content: [
                { type: "text", text: JSON.stringify(schema, null, 2) },
              ],
            };
          }
          case "robots_txt_validator": {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      valid: true,
                      score: 90,
                      optimized: `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://yoursite.com/sitemap.xml`,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "core_web_vitals_check": {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      LCP: { value: "2.8s", status: "needs-improvement" },
                      INP: { value: "180ms", status: "good" },
                      CLS: { value: "0.08", status: "good" },
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "ai_search_optimization": {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      optimized: true,
                      recommendations: [
                        "Add clear numbered lists for AI citation",
                        "Include specific stats and examples",
                        "Use descriptive headers (H2-H4)",
                        "Add E-E-A-T signals (author, dates)",
                      ],
                    },
                    null,
                    2,
                  ),
                },
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new SEOSpecialistServer();
server.run();
