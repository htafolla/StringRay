/**
 * StrRay Vue Integration v1.0.0
 *
 * Vue-specific integration providing composition functions, components, and utilities
 * for seamless StrRay Framework integration in Vue applications.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { App, createApp, reactive, ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { StrRayIntegration, StrRayIntegrationConfig, FrameworkAdapter } from '../core';

// Vue Framework Adapter
class VueFrameworkAdapter implements FrameworkAdapter {
  name = 'vue';
  version = '3.x';

  mount(container: HTMLElement, component: any, props?: Record<string, any>): void {
    const app = createApp(component, props);
    app.mount(container);
  }

  unmount(container: HTMLElement): void {
    // Vue 3 unmounting is handled by the app instance
  }

  createElement(type: string, props?: Record<string, any>, ...children: any[]): any {
    return { type, props, children };
  }

  render(element: any, container: HTMLElement): void {
    const app = createApp(element);
    app.mount(container);
  }
}

// StrRay Vue Plugin
export const StrRayVuePlugin = {
  install(app: App, options: StrRayIntegrationConfig) {
    const integration = new StrRayIntegration({
      ...options,
      framework: 'vue'
    });

    // Override framework adapter with Vue-specific implementation
    (integration as any).context.framework = new VueFrameworkAdapter();

    // Provide integration globally
    app.provide('strRay', integration);
    app.config.globalProperties.$strRay = integration;
  }
};

// Composition functions for Vue 3

export function useStrRay() {
  const integration = inject<StrRayIntegration>('strRay');
  if (!integration) {
    throw new Error('StrRay plugin not installed. Use app.use(StrRayVuePlugin, config)');
  }
  return integration;
}

export function useStrRayAgent(agentName: string) {
  const integration = useStrRay();
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const result = ref<any>(null);

  const execute = async (task: any) => {
    loading.value = true;
    error.value = null;
    try {
      result.value = await integration.executeAgent(agentName, task);
      return result.value;
    } catch (err) {
      error.value = err as Error;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    execute,
    loading: readonly(loading),
    error: readonly(error),
    result: readonly(result)
  };
}

export function useStrRayCodex() {
  const integration = useStrRay();
  const codexStats = ref<any>(null);

  onMounted(async () => {
    const stats = await integration.getHook('codex:stats')?.();
    codexStats.value = stats;
  });

  const injectCodex = async (code: string) => {
    const injectHook = integration.getHook('codex:inject');
    if (injectHook) {
      return await injectHook(code);
    }
  };

  return {
    codexStats: readonly(codexStats),
    injectCodex
  };
}

export function useStrRayValidation() {
  const integration = useStrRay();

  const validateCode = async (code: string) => {
    return await integration.validateCode(code, 'vue');
  };

  return { validateCode };
}

export function useStrRayMonitoring() {
  const integration = useStrRay();

  const startMonitoring = () => {
    const monitorHook = integration.getHook('monitor:performance');
    if (monitorHook) {
      return monitorHook();
    }
  };

  const trackError = (error: Error) => {
    const errorHook = integration.getHook('monitor:errors');
    if (errorHook) {
      return errorHook(error);
    }
  };

  return { startMonitoring, trackError };
}

export function useStrRayAnalytics() {
  const integration = useStrRay();

  const predict = async (data: any) => {
    const predictHook = integration.getHook('analytics:predict');
    if (predictHook) {
      return await predictHook(data);
    }
  };

  const optimize = async (task: any) => {
    const optimizeHook = integration.getHook('analytics:optimize');
    if (optimizeHook) {
      return await optimizeHook(task);
    }
  };

  return { predict, optimize };
}

export function useStrRayStore() {
  const integration = useStrRay();

  // Reactive state for StrRay operations
  const state = reactive({
    agents: {} as Record<string, any>,
    sessions: [] as any[],
    currentSession: null as any,
    codex: {
      rules: [] as any[],
      stats: null as any
    },
    monitoring: {
      active: false,
      metrics: {} as Record<string, any>
    },
    analytics: {
      predictions: [] as any[],
      optimizations: [] as any[]
    }
  });

  // Computed properties
  const activeAgents = computed(() => {
    return Object.keys(state.agents).filter(name => state.agents[name]?.active);
  });

  const sessionCount = computed(() => state.sessions.length);

  const codexRuleCount = computed(() => state.codex.rules.length);

  // Actions
  const loadAgents = async () => {
    const agents = integration.getContext().agents;
    for (const [name, agent] of agents) {
      state.agents[name] = {
        active: true,
        instance: agent,
        lastUsed: null
      };
    }
  };

  const executeAgentAction = async (agentName: string, action: string, params: any = {}) => {
    const agent = state.agents[agentName];
    if (!agent?.active) {
      throw new Error(`Agent ${agentName} not available`);
    }

    try {
      let result;
      switch (action) {
        case 'execute':
          result = await integration.executeAgent(agentName, params.task);
          break;
        case 'validate':
          result = await integration.validateCode(params.code, 'vue');
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      agent.lastUsed = new Date();
      return result;
    } catch (error) {
      console.error(`Agent ${agentName} action failed:`, error);
      throw error;
    }
  };

  const updateCodexStats = async () => {
    const stats = await integration.getHook('codex:stats')?.();
    state.codex.stats = stats;
  };

  const startMonitoring = () => {
    const monitorHook = integration.getHook('monitor:performance');
    if (monitorHook) {
      state.monitoring.active = true;
      return monitorHook();
    }
  };

  const stopMonitoring = () => {
    state.monitoring.active = false;
  };

  // Initialize on mount
  onMounted(async () => {
    await loadAgents();
    await updateCodexStats();
  });

  return {
    // State
    state: readonly(state),

    // Computed
    activeAgents,
    sessionCount,
    codexRuleCount,

    // Actions
    loadAgents,
    executeAgentAction,
    updateCodexStats,
    startMonitoring,
    stopMonitoring
  };
}

// Vue component mixin for StrRay integration
export const StrRayMixin = {
  data() {
    return {
      strRayLoading: false,
      strRayError: null,
      strRayResult: null
    };
  },
  computed: {
    $strRay() {
      return (this as any).$strRay || null;
    }
  },
  methods: {
    async $executeStrRayAgent(agentName: string, task: any) {
      if (!this.$strRay) {
        throw new Error('StrRay not available');
      }

      this.strRayLoading = true;
      this.strRayError = null;

      try {
        this.strRayResult = await this.$strRay.executeAgent(agentName, task);
        return this.strRayResult;
      } catch (error) {
        this.strRayError = error;
        throw error;
      } finally {
        this.strRayLoading = false;
      }
    },

    async $validateStrRayCode(code: string) {
      if (!this.$strRay) {
        throw new Error('StrRay not available');
      }

      return await this.$strRay.validateCode(code, 'vue');
    }
  }
};

// Export types
export type { StrRayIntegrationConfig, FrameworkAdapter };