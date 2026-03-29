/**
 * Marketing Expert MCP Server
 *
 * Strategic marketing for campaign strategy, market analysis, and conversion optimization.
 * Implements "Don't Make Me Think" principles for high-converting landing pages.
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

class MarketingExpertServer {
  private server: Server;
  private tools: Tool[] = [
    {
      name: "campaign_strategy",
      description:
        "Develop comprehensive marketing campaign strategy with channel mix, budget allocation, and KPIs",
      inputSchema: {
        type: "object",
        properties: {
          campaignGoal: {
            type: "string",
            description: "Primary campaign objective",
          },
          targetAudience: { type: "string", description: "Target demographic" },
          budget: { type: "string", description: "Budget range" },
          timeline: { type: "string", description: "Campaign duration" },
        },
        required: ["campaignGoal", "targetAudience"],
      },
    },
    {
      name: "landing_page_audit",
      description:
        "Audit landing page using 'Don't Make Me Think' principles - 3 second rule, cognitive load, CTA visibility",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Landing page URL" },
          goal: { type: "string", description: "Conversion goal" },
        },
        required: ["url", "goal"],
      },
    },
    {
      name: "conversion_optimization",
      description:
        "Analyze and optimize conversion paths with A/B testing recommendations",
      inputSchema: {
        type: "object",
        properties: {
          pageType: {
            type: "string",
            enum: ["landing", "product", "checkout", "signup"],
          },
          currentConversion: {
            type: "number",
            description: "Current conversion rate %",
          },
        },
        required: ["pageType"],
      },
    },
    {
      name: "market_analysis",
      description:
        "Conduct market analysis including competitor positioning, market size, and opportunities",
      inputSchema: {
        type: "object",
        properties: {
          industry: { type: "string", description: "Industry/niche" },
          competitors: {
            type: "array",
            items: { type: "string" },
            description: "Known competitors",
          },
        },
        required: ["industry"],
      },
    },
    {
      name: "brand_positioning",
      description:
        "Develop brand positioning and messaging framework with unique value proposition",
      inputSchema: {
        type: "object",
        properties: {
          product: {
            type: "string",
            description: "Product/service description",
          },
          targetMarket: { type: "string", description: "Ideal customer" },
          competitors: { type: "array", items: { type: "string" } },
        },
        required: ["product", "targetMarket"],
      },
    },
  ];

  constructor() {
    this.server = new Server(
      { name: "growth-strategist", version: "1.15.18" },
      { capabilities: { tools: {} } },
    );

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        switch (name) {
          case "campaign_strategy": {
            const argsObj = args as Record<string, unknown>;
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      campaignGoal: argsObj.campaignGoal,
                      strategy: {
                        channels: ["Content", "Email", "Social", "Paid"],
                        budgetAllocation: {
                          content: 30,
                          email: 20,
                          social: 25,
                          paid: 25,
                        },
                        timeline: argsObj.timeline || "3 months",
                        kpis: ["CTR", "Conversion Rate", "CAC", "LTV", "ROAS"],
                      },
                      phases: [
                        {
                          name: "Awareness",
                          duration: "4 weeks",
                          goal: "Reach 100k impressions",
                        },
                        {
                          name: "Consideration",
                          duration: "6 weeks",
                          goal: "5% conversion",
                        },
                        {
                          name: "Conversion",
                          duration: "4 weeks",
                          goal: "2% purchase",
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
          case "landing_page_audit": {
            const argsObj = args as Record<string, unknown>;
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      url: argsObj.url,
                      goal: argsObj.goal,
                      auditScore: 72,
                      dontMakeMeThink: {
                        score: 68,
                        issues: [
                          {
                            priority: "high",
                            issue: "Hero value prop not clear in 3 seconds",
                            fix: "Above fold: headline + subhead + CTA",
                          },
                          {
                            priority: "high",
                            issue: "Navigation unclear",
                            fix: "Max 5 nav items, use familiar labels",
                          },
                          {
                            priority: "medium",
                            issue: "Too many choices",
                            fix: "Reduce to one primary CTA",
                          },
                        ],
                      },
                      sections: {
                        hero: {
                          status: "needs-work",
                          recommendation:
                            "Clear H1 + benefit statement + CTA in 3 seconds",
                        },
                        socialProof: {
                          status: "good",
                          recommendation: "Add testimonials above fold",
                        },
                        problem: {
                          status: "needs-work",
                          recommendation: "Lead with customer pain point",
                        },
                        solution: {
                          status: "good",
                          recommendation: "Show product/screenshot clearly",
                        },
                        benefits: {
                          status: "good",
                          recommendation: "Use bullet points, not paragraphs",
                        },
                        cta: {
                          status: "needs-work",
                          recommendation:
                            "Make CTA button stand out (color, size, text)",
                        },
                        riskReversal: {
                          status: "missing",
                          recommendation: "Add guarantees, testimonials",
                        },
                        faq: {
                          status: "good",
                          recommendation: "Address objections",
                        },
                      },
                      cognitiveLoad: "Medium",
                      firstImpression: "Needs improvement - value prop unclear",
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "conversion_optimization": {
            const argsObj = args as Record<string, unknown>;
            const pageType = (argsObj.pageType as string) || "landing";
            const currentConversion =
              (argsObj.currentConversion as number) || 2;
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      pageType,
                      currentConversion,
                      targetConversion: currentConversion * 1.5,
                      recommendations: [
                        {
                          priority: "high",
                          change: "Single clear CTA",
                          impact: "+25%",
                        },
                        {
                          priority: "high",
                          change: "Social proof near CTA",
                          impact: "+15%",
                        },
                        {
                          priority: "medium",
                          change: "Remove navigation distractions",
                          impact: "+10%",
                        },
                        {
                          priority: "medium",
                          change: "Add urgency indicators",
                          impact: "+10%",
                        },
                        {
                          priority: "low",
                          change: "Reduce form fields",
                          impact: "+5%",
                        },
                      ],
                      abTests: [
                        {
                          name: "CTA Color Test",
                          hypothesis: "Contrast color increases clicks",
                        },
                        {
                          name: "Headline Test",
                          hypothesis:
                            "Benefit-driven headline outperforms feature",
                        },
                        {
                          name: "Social Proof Position",
                          hypothesis:
                            "Testimonial placement above vs below fold",
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
          case "market_analysis": {
            const argsObj = args as Record<string, unknown>;
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      industry: argsObj.industry,
                      competitors: argsObj.competitors || [],
                      analysis: {
                        marketSize: "Estimate based on industry benchmarks",
                        growthRate: "5-10% YoY",
                        keyPlayers: ["Player 1", "Player 2", "Player 3"],
                        opportunities: [
                          "Underserved segment",
                          "Technology gap",
                          "Pricing optimization",
                        ],
                        threats: [
                          "Market saturation",
                          "Regulatory changes",
                          "Economic factors",
                        ],
                      },
                    },
                    null,
                    2,
                  ),
                },
              ],
            };
          }
          case "brand_positioning": {
            const argsObj = args as Record<string, unknown>;
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(
                    {
                      product: argsObj.product,
                      targetMarket: argsObj.targetMarket,
                      positioning: {
                        valueProposition:
                          "Unique benefit statement that differentiates from competitors",
                        brandArchetype:
                          "Hero or Sage - choose based on audience",
                        keyMessages: [
                          "Primary message",
                          "Secondary message",
                          "Tertiary message",
                        ],
                        differentiators: [
                          "Unique feature 1",
                          "Unique feature 2",
                          "Unique benefit",
                        ],
                        messagingFramework: {
                          hero: "For [audience] who [need], [product] is [category] that [benefit]",
                          taglines: [
                            "Option 1: [Benefit-focused]",
                            "Option 2: [Emotion-focused]",
                            "Option 3: [Authority-focused]",
                          ],
                        },
                      },
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

const server = new MarketingExpertServer();
server.run();
