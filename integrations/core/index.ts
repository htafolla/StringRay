/**
 * StrRay Cross-Framework Integration Architecture v1.0.0
 *
 * Core integration layer providing framework-agnostic StrRay functionality
 * for React, Vue, Angular, and Svelte applications.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

// Core types for cross-framework integration
export interface FrameworkAdapter {
  name: string;
  version: string;
  mount(
    container: HTMLElement,
    component: any,
    props?: Record<string, any>,
  ): void;
  unmount(container: HTMLElement): void;
  createElement(
    type: string,
    props?: Record<string, any>,
    ...children: any[]
  ): any;
  render(element: any, container: HTMLElement): void;
}

export interface StrRayIntegrationConfig {
  framework: "react" | "vue" | "angular" | "svelte";
  mode: "development" | "production";
  features: {
    agents: boolean;
    codex: boolean;
    monitoring: boolean;
    analytics: boolean;
  };
  endpoints: {
    orchestrator: string;
    codex: string;
    monitoring: string;
  };
}

export interface IntegrationContext {
  framework: FrameworkAdapter;
  config: StrRayIntegrationConfig;
  sessionId: string;
  agents: Map<string, any>;
  hooks: Map<string, Function>;
}

// Core integration class
export class StrRayIntegration {
  private context: IntegrationContext;
  private initialized = false;

  constructor(config: StrRayIntegrationConfig) {
    this.context = {
      framework: this.createFrameworkAdapter(config.framework),
      config,
      sessionId: this.generateSessionId(),
      agents: new Map(),
      hooks: new Map(),
    };
  }

  private createFrameworkAdapter(framework: string): FrameworkAdapter {
    // Framework adapters will be implemented in framework-specific packages
    throw new Error(`Framework adapter for ${framework} not implemented`);
  }

  private generateSessionId(): string {
    return `strray-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize core features based on configuration
      await Promise.all(
        [
          this.context.config.features.codex && this.loadCodex(),
          this.context.config.features.agents && this.initializeAgents(),
          this.context.config.features.monitoring && this.setupMonitoring(),
          this.context.config.features.analytics && this.setupAnalytics(),
        ].filter(Boolean),
      );

      this.initialized = true;
    } catch (error) {
      console.error("StrRay Integration initialization failed:", error);
      throw error;
    }
  }

  private async loadCodex(): Promise<void> {
    const codexInjector = await import("../src/codex-injector");
    const contextLoader = await import("../src/context-loader");

    this.context.hooks.set(
      "codex:inject",
      codexInjector.createStrRayCodexInjectorHook,
    );
    this.context.hooks.set("codex:stats", codexInjector.getCodexStats);
  }

  private async initializeAgents(): Promise<void> {
    const agents = await import("../src/agents");

    const agentTypes = [
      "enforcer",
      "architect",
      "orchestrator",
      "bug-triage-specialist",
      "code-reviewer",
      "security-auditor",
      "refactorer",
      "test-architect",
    ];

    for (const agentType of agentTypes) {
      const AgentClass = agents[agentType];
      if (AgentClass) {
        const agent = new AgentClass();
        this.context.agents.set(agentType, agent);
      }
    }
  }

  private async setupMonitoring(): Promise<void> {
    const monitoring = await import("../src/monitoring/advanced-monitor");
    this.context.hooks.set(
      "monitor:performance",
      monitoring.startPerformanceMonitoring,
    );
    this.context.hooks.set("monitor:errors", monitoring.startErrorTracking);
  }

  private async setupAnalytics(): Promise<void> {
    const analytics = await import("../src/analytics/predictive-analytics");
    this.context.hooks.set("analytics:predict", analytics.generatePrediction);
    this.context.hooks.set(
      "analytics:optimize",
      analytics.optimizeAgentAssignment,
    );
  }

  // Public API methods
  getContext(): IntegrationContext {
    return this.context;
  }

  getAgent(name: string): any {
    return this.context.agents.get(name);
  }

  getHook(name: string): Function | undefined {
    return this.context.hooks.get(name);
  }

  async executeAgent(agentName: string, task: any): Promise<any> {
    const agent = this.getAgent(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    return await agent.execute(task);
  }

  async validateCode(code: string, framework: string): Promise<any> {
    const enforcer = this.getAgent("enforcer");
    const architect = this.getAgent("architect");

    const results = await Promise.all([
      enforcer?.validate(code, framework),
      architect?.analyze(code, framework),
    ]);

    return {
      enforcement: results[0],
      architecture: results[1],
    };
  }

  destroy(): void {
    // Cleanup resources
    this.context.agents.clear();
    this.context.hooks.clear();
    this.initialized = false;
  }
}

// Factory function for creating integrations
export function createStrRayIntegration(
  config: StrRayIntegrationConfig,
): StrRayIntegration {
  return new StrRayIntegration(config);
}

// Default configuration
export const defaultIntegrationConfig: StrRayIntegrationConfig = {
  framework: "react",
  mode: "development",
  features: {
    agents: true,
    codex: true,
    monitoring: true,
    analytics: true,
  },
  endpoints: {
    orchestrator: "/api/strray/orchestrator",
    codex: "/api/strray/codex",
    monitoring: "/api/strray/monitoring",
  },
};
