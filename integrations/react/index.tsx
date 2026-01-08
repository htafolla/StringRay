/**
 * StrRay React Integration v1.0.0
 *
 * React-specific integration providing hooks, components, and utilities
 * for seamless StrRay Framework integration in React applications.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { StrRayIntegration, StrRayIntegrationConfig, FrameworkAdapter } from '../core';

// React Framework Adapter
class ReactFrameworkAdapter implements FrameworkAdapter {
  name = 'react';
  version = React.version;

  mount(container: HTMLElement, component: React.ComponentType<any>, props?: Record<string, any>): void {
    const element = React.createElement(component, props);
    ReactDOM.render(element, container);
  }

  unmount(container: HTMLElement): void {
    ReactDOM.unmountComponentAtNode(container);
  }

  createElement(type: string, props?: Record<string, any>, ...children: any[]): React.ReactElement {
    return React.createElement(type, props, ...children);
  }

  render(element: React.ReactElement, container: HTMLElement): void {
    ReactDOM.render(element, container);
  }
}

// Lazy-loaded ReactDOM to avoid SSR issues
let ReactDOM: any = null;
const loadReactDOM = async () => {
  if (!ReactDOM) {
    ReactDOM = (await import('react-dom')).default;
  }
  return ReactDOM;
};

// StrRay React Context
interface StrRayContextValue {
  integration: StrRayIntegration | null;
  isInitialized: boolean;
  error: Error | null;
}

const StrRayContext = createContext<StrRayContextValue>({
  integration: null,
  isInitialized: false,
  error: null
});

// Main StrRay Provider Component
interface StrRayProviderProps {
  config: StrRayIntegrationConfig;
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

export const StrRayProvider: React.FC<StrRayProviderProps> = ({
  config,
  children,
  fallback,
  onError
}) => {
  const [integration, setIntegration] = useState<StrRayIntegration | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initIntegration = async () => {
      try {
        await loadReactDOM();
        const strRayIntegration = new StrRayIntegration({
          ...config,
          framework: 'react'
        });

        // Override framework adapter with React-specific implementation
        (strRayIntegration as any).context.framework = new ReactFrameworkAdapter();

        await strRayIntegration.initialize();
        setIntegration(strRayIntegration);
        setIsInitialized(true);
      } catch (err) {
        const error = err as Error;
        setError(error);
        onError?.(error);
      }
    };

    initIntegration();
  }, [config, onError]);

  if (error && fallback) {
    return <>{fallback}</>;
  }

  return (
    <StrRayContext.Provider value={{ integration, isInitialized, error }}>
      {children}
    </StrRayContext.Provider>
  );
};

// Custom hooks for StrRay integration

export const useStrRay = () => {
  const context = useContext(StrRayContext);
  if (!context.integration) {
    throw new Error('useStrRay must be used within a StrRayProvider');
  }
  return context.integration;
};

export const useStrRayAgent = (agentName: string) => {
  const integration = useStrRay();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (task: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await integration.executeAgent(agentName, task);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [integration, agentName]);

  return { execute, loading, error };
};

export const useStrRayCodex = () => {
  const integration = useStrRay();
  const [codexStats, setCodexStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      const stats = await integration.getHook('codex:stats')?.();
      setCodexStats(stats);
    };
    loadStats();
  }, [integration]);

  const injectCodex = useCallback(async (code: string) => {
    const injectHook = integration.getHook('codex:inject');
    if (injectHook) {
      return await injectHook(code);
    }
  }, [integration]);

  return { codexStats, injectCodex };
};

export const useStrRayValidation = () => {
  const integration = useStrRay();

  const validateCode = useCallback(async (code: string) => {
    return await integration.validateCode(code, 'react');
  }, [integration]);

  return { validateCode };
};

export const useStrRayMonitoring = () => {
  const integration = useStrRay();

  const startMonitoring = useCallback(() => {
    const monitorHook = integration.getHook('monitor:performance');
    if (monitorHook) {
      return monitorHook();
    }
  }, [integration]);

  const trackError = useCallback((error: Error) => {
    const errorHook = integration.getHook('monitor:errors');
    if (errorHook) {
      return errorHook(error);
    }
  }, [integration]);

  return { startMonitoring, trackError };
};

export const useStrRayAnalytics = () => {
  const integration = useStrRay();

  const predict = useCallback(async (data: any) => {
    const predictHook = integration.getHook('analytics:predict');
    if (predictHook) {
      return await predictHook(data);
    }
  }, [integration]);

  const optimize = useCallback(async (task: any) => {
    const optimizeHook = integration.getHook('analytics:optimize');
    if (optimizeHook) {
      return await optimizeHook(task);
    }
  }, [integration]);

  return { predict, optimize };
};

// Higher-order component for StrRay integration
export const withStrRay = <P extends object>(
  Component: React.ComponentType<P>,
  agentName?: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const integration = useStrRay();
    const agent = agentName ? integration.getAgent(agentName) : null;

    return (
      <Component
        {...props}
        ref={ref}
        strRay={integration}
        agent={agent}
      />
    );
  });
};

// Error boundary for StrRay components
interface StrRayErrorBoundaryProps {
  fallback: React.ComponentType<{ error: Error; retry: () => void }>;
  children: ReactNode;
}

interface StrRayErrorBoundaryState {
  error: Error | null;
}

export class StrRayErrorBoundary extends React.Component<
  StrRayErrorBoundaryProps,
  StrRayErrorBoundaryState
> {
  constructor(props: StrRayErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): StrRayErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to StrRay monitoring if available
    console.error('StrRay Error Boundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Component for displaying StrRay agent responses
interface StrRayAgentResponseProps {
  agentName: string;
  task: any;
  render?: (result: any, loading: boolean, error: Error | null) => ReactNode;
}

export const StrRayAgentResponse: React.FC<StrRayAgentResponseProps> = ({
  agentName,
  task,
  render
}) => {
  const { execute, loading, error } = useStrRayAgent(agentName);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (task) {
      execute(task).then(setResult).catch(() => {});
    }
  }, [task, execute]);

  if (render) {
    return <>{render(result, loading, error)}</>;
  }

  if (loading) return <div>Loading StrRay response...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!result) return null;

  return <pre>{JSON.stringify(result, null, 2)}</pre>;
};

// Hook for imperative StrRay usage
export const useImperativeStrRay = () => {
  const integration = useStrRay();

  return useCallback((action: string, params: any = {}) => {
    switch (action) {
      case 'validate':
        return integration.validateCode(params.code, params.framework || 'react');
      case 'execute':
        return integration.executeAgent(params.agent, params.task);
      case 'codex':
        const codexHook = integration.getHook('codex:inject');
        return codexHook?.(params.code);
      default:
        throw new Error(`Unknown StrRay action: ${action}`);
    }
  }, [integration]);
};

// Export types
export type { StrRayIntegrationConfig, FrameworkAdapter };