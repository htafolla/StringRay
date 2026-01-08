/**
 * StringRay Codex Injection Plugin for oh-my-opencode
 *
 * This plugin integrates StringRay's Universal Development Codex
 * into the oh-my-opencode framework, providing systematic error prevention
 * and production-ready development practices.
 */

import { CodexInjector } from "../src/codex-injector";
import { StrRayContextLoader } from "../src/context-loader";

export interface PluginConfig {
  enabled: boolean;
  codexVersion: string;
  cacheTtlSeconds: number;
  autoReloadOnChange: boolean;
}

export class StrRayCodexInjectionPlugin {
  private injector: CodexInjector;
  private contextLoader: StrRayContextLoader;
  private config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
    this.injector = new CodexInjector();
    this.contextLoader = StrRayContextLoader.getInstance();
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log("🛡️ StringRay Codex Plugin: Disabled");
      return;
    }

    console.log("🛡️ StringRay Codex Plugin: Initializing...");

    try {
      // Load codex context
      const context = await this.contextLoader.loadCodexContext(process.cwd());
      if (context.success) {
        console.log(
          `✅ StringRay Codex loaded: ${context.context?.terms.size || 0} terms (v${context.context?.version || "unknown"})`,
        );
      } else {
        console.warn("⚠️ StringRay Codex loading failed:", context.error);
      }

      console.log("🛡️ StringRay Codex Plugin: Ready");
    } catch (error) {
      console.error("❌ StringRay Codex Plugin initialization failed:", error);
    }
  }

  async injectCodex(action: string, context: any): Promise<any> {
    if (!this.config.enabled) {
      return context;
    }

    try {
      // Inject codex rules into the action context
      const enhancedContext = await this.injector.injectCodexRules(context, {
        action,
        sessionId: `strray-${Date.now()}`,
        priority: "high",
      });

      return enhancedContext;
    } catch (error) {
      console.warn("⚠️ StringRay Codex injection failed:", error);
      return context;
    }
  }

  getCodexStats() {
    return this.injector.getCodexStats();
  }
}

// Export for oh-my-opencode plugin system
export default {
  name: "strray-codex-injection",
  version: "1.0.0",
  description:
    "StringRay Codex Injection Plugin for systematic error prevention",
  author: "StringRay Framework Team",

  initialize: async (config: PluginConfig) => {
    const plugin = new StrRayCodexInjectionPlugin(config);
    await plugin.initialize();
    return plugin;
  },
};
