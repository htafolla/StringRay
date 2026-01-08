/**
 * StrRay Svelte Integration v1.0.0
 *
 * Svelte-specific integration providing stores, actions, and utilities
 * for seamless StrRay Framework integration in Svelte applications.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { writable, readable, derived, get } from "svelte/store";
import {
  StrRayIntegration,
  StrRayIntegrationConfig,
  FrameworkAdapter,
} from "../core";

// Svelte Framework Adapter
class SvelteFrameworkAdapter implements FrameworkAdapter {
  name = "svelte";
  version = "4.x";

  mount(
    container: HTMLElement,
    component: any,
    props?: Record<string, any>,
  ): void {
    // Svelte components are mounted by Svelte's runtime
    // This would typically be handled by Svelte's mount function
  }

  unmount(container: HTMLElement): void {
    // Svelte handles component destruction automatically
  }

  createElement(
    type: string,
    props?: Record<string, any>,
    ...children: any[]
  ): any {
    return { type, props, children };
  }

  render(element: any, container: HTMLElement): void {
    // Svelte rendering is handled by the compiler
  }
}

// StrRay Svelte Store
class StrRayStore {
  private integration: StrRayIntegration | null = null;

  // Reactive stores
  public integrationStore = writable<StrRayIntegration | null>(null);
  public errorStore = writable<Error | null>(null);
  public loadingStore = writable(false);

  // Derived stores
  public isInitialized = derived(
    this.integrationStore,
    ($integration) => $integration !== null,
  );
  public agents = derived(this.integrationStore, ($integration) => {
    if (!$integration) return new Map();
    return $integration.getContext().agents;
  });

  constructor() {}

  async initialize(config: StrRayIntegrationConfig): Promise<void> {
    this.loadingStore.set(true);
    this.errorStore.set(null);

    try {
      this.integration = new StrRayIntegration({
        ...config,
        framework: "svelte",
      });

      // Override framework adapter with Svelte-specific implementation
      (this.integration as any).context.framework =
        new SvelteFrameworkAdapter();

      await this.integration.initialize();
      this.integrationStore.set(this.integration);
    } catch (error) {
      this.errorStore.set(error as Error);
      throw error;
    } finally {
      this.loadingStore.set(false);
    }
  }

  getIntegration(): StrRayIntegration | null {
    return get(this.integrationStore);
  }

  async executeAgent(agentName: string, task: any): Promise<any> {
    const integration = this.getIntegration();
    if (!integration) {
      throw new Error("StrRay integration not initialized");
    }
    return await integration.executeAgent(agentName, task);
  }

  async validateCode(code: string): Promise<any> {
    const integration = this.getIntegration();
    if (!integration) {
      throw new Error("StrRay integration not initialized");
    }
    return await integration.validateCode(code, "svelte");
  }
}

// Create singleton store instance
export const strRayStore = new StrRayStore();

// Action creators for Svelte
export function createStrRayAction(actionType: string) {
  return async (params: any = {}) => {
    const integration = strRayStore.getIntegration();
    if (!integration) {
      throw new Error("StrRay integration not initialized");
    }

    switch (actionType) {
      case "executeAgent":
        return await integration.executeAgent(params.agentName, params.task);
      case "validateCode":
        return await integration.validateCode(params.code, "svelte");
      case "injectCodex":
        const injectHook = integration.getHook("codex:inject");
        return injectHook ? await injectHook(params.code) : null;
      case "getCodexStats":
        const statsHook = integration.getHook("codex:stats");
        return statsHook ? await statsHook() : null;
      case "startMonitoring":
        const monitorHook = integration.getHook("monitor:performance");
        return monitorHook ? monitorHook() : null;
      case "trackError":
        const errorHook = integration.getHook("monitor:errors");
        return errorHook ? errorHook(params.error) : null;
      case "generatePrediction":
        const predictHook = integration.getHook("analytics:predict");
        return predictHook ? await predictHook(params.data) : null;
      case "optimizeAssignment":
        const optimizeHook = integration.getHook("analytics:optimize");
        return optimizeHook ? await optimizeHook(params.task) : null;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  };
}

// Svelte stores for specific functionality
export const codexStats = derived(
  strRayStore.integrationStore,
  async ($integration, set) => {
    if (!$integration) {
      set(null);
      return;
    }

    try {
      const statsHook = $integration.getHook("codex:stats");
      const stats = statsHook ? await statsHook() : null;
      set(stats);
    } catch (error) {
      console.error("Failed to load codex stats:", error);
      set(null);
    }
  },
);

export const agentList = derived(strRayStore.agents, ($agents) => {
  return Array.from($agents.keys()).map((name) => ({
    name,
    active: true,
    instance: $agents.get(name),
  }));
});

// Svelte actions
export function strrayValidate(node: HTMLElement, code: string) {
  let currentCode = code;

  const validate = async () => {
    try {
      const result = await strRayStore.validateCode(currentCode);
      node.dispatchEvent(new CustomEvent("validation", { detail: result }));
    } catch (error) {
      node.dispatchEvent(new CustomEvent("validation", { detail: { error } }));
    }
  };

  const update = (newCode: string) => {
    currentCode = newCode;
    validate();
  };

  validate();

  return {
    update,
    destroy() {
      // Cleanup if needed
    },
  };
}

// Svelte component stores for reactive updates
export function createAgentStore(agentName: string) {
  const result = writable<any>(null);
  const loading = writable(false);
  const error = writable<Error | null>(null);

  const execute = async (task: any) => {
    loading.set(true);
    error.set(null);
    try {
      const res = await strRayStore.executeAgent(agentName, task);
      result.set(res);
      return res;
    } catch (err) {
      error.set(err as Error);
      throw err;
    } finally {
      loading.set(false);
    }
  };

  return {
    result: { subscribe: result.subscribe },
    loading: { subscribe: loading.subscribe },
    error: { subscribe: error.subscribe },
    execute,
  };
}

// Export types
export type { StrRayIntegrationConfig, FrameworkAdapter };
