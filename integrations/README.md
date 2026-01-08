# StrRay Cross-Framework Integration Architecture v1.0.0

## Overview

The StrRay Cross-Framework Integration Architecture provides seamless integration of the StrRay Framework's agentic AI capabilities across React, Vue, Angular, and Svelte applications. This comprehensive system enables developers to leverage StrRay's 99.6% error prevention and production-ready code generation within their preferred frontend framework.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Framework     │    │   Core Layer     │    │   StrRay Core   │
│   Adapters      │◄──►│   Integration    │◄──►│   Framework     │
│                 │    │                  │    │                 │
│ • React Adapter │    │ • Agent Mgmt     │    │ • Agents        │
│ • Vue Adapter   │    │ • State Sync     │    │ • Codex         │
│ • Angular Adapt │    │ • Plugin System  │    │ • Monitoring    │
│ • Svelte Adapt  │    │                  │    │ • Analytics     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Shared Library │    │  Cross-Framework │    │   Build Tools   │
│                 │    │    Features      │    │                 │
│ • Components    │    │                  │    │ • Vite          │
│ • Theming       │    │ • i18n           │    │ • Webpack       │
│ • Accessibility │    │ • A11y           │    │ • Rollup        │
│ • Performance   │    │ • Components     │    │ • esbuild       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Framework-Specific Implementations

### React Integration

#### Installation

```bash
npm install @strray/react
```

#### Basic Usage

```tsx
import { StrRayProvider, useStrRay, useStrRayAgent } from "@strray/react";

function App() {
  return (
    <StrRayProvider
      config={{
        framework: "react",
        features: { agents: true, codex: true },
      }}
    >
      <MyComponent />
    </StrRayProvider>
  );
}

function MyComponent() {
  const integration = useStrRay();
  const { execute, loading, error } = useStrRayAgent("enforcer");

  const validateCode = async () => {
    const result = await execute({
      task: "validate",
      code: "const x = 1;",
      framework: "react",
    });
    console.log(result);
  };

  return (
    <div>
      <button onClick={validateCode} disabled={loading}>
        {loading ? "Validating..." : "Validate Code"}
      </button>
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

#### Advanced Features

```tsx
import {
  useStrRayCodex,
  useStrRayMonitoring,
  useStrRayValidation,
  StrRayErrorBoundary,
} from "@strray/react";

function AdvancedComponent() {
  const { codexStats, injectCodex } = useStrRayCodex();
  const { validateCode } = useStrRayValidation();
  const { startMonitoring, trackError } = useStrRayMonitoring();

  // Component logic here

  return (
    <StrRayErrorBoundary
      fallback={({ error, retry }) => (
        <div>
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <button onClick={retry}>Try Again</button>
        </div>
      )}
    >
      {/* Component content */}
    </StrRayErrorBoundary>
  );
}
```

### Vue Integration

#### Installation

```bash
npm install @strray/vue
```

#### Basic Usage

```vue
<template>
  <div>
    <button @click="validateCode" :disabled="loading">
      {{ loading ? "Validating..." : "Validate Code" }}
    </button>
    <div v-if="error">Error: {{ error.message }}</div>
    <pre v-if="result">{{ result }}</pre>
  </div>
</template>

<script setup>
import { useStrRayAgent } from "@strray/vue";

const { execute, loading, error, result } = useStrRayAgent("enforcer");

const validateCode = async () => {
  result.value = await execute({
    task: "validate",
    code: "const x = 1;",
    framework: "vue",
  });
};
</script>
```

#### Plugin Installation

```ts
import { createApp } from "vue";
import { StrRayVuePlugin } from "@strray/vue";
import App from "./App.vue";

const app = createApp(App);

app.use(StrRayVuePlugin, {
  framework: "vue",
  features: { agents: true, codex: true, monitoring: true },
});

app.mount("#app");
```

### Angular Integration

#### Installation

```bash
npm install @strray/angular
```

#### Module Setup

```ts
import { NgModule } from "@angular/core";
import { StrRayModule } from "@strray/angular";

@NgModule({
  imports: [
    StrRayModule.forRoot({
      framework: "angular",
      features: { agents: true, codex: true },
    }),
  ],
})
export class AppModule {}
```

#### Component Usage

```ts
import { Component } from "@angular/core";
import { StrRayService } from "@strray/angular";

@Component({
  selector: "app-strray-demo",
  template: `
    <strray-agent-response
      agentName="enforcer"
      [task]="task"
      (resultChange)="onResult($event)"
    >
    </strray-agent-response>

    <button (click)="validateCode()" [disabled]="loading">
      {{ loading ? "Validating..." : "Validate Code" }}
    </button>
  `,
})
export class StrRayDemoComponent {
  task = { code: "const x = 1;", framework: "angular" };
  loading = false;

  constructor(private strRayService: StrRayService) {}

  async validateCode() {
    this.loading = true;
    try {
      const result = await this.strRayService.validateCode("const x = 1;");
      console.log(result);
    } finally {
      this.loading = false;
    }
  }

  onResult(result: any) {
    console.log("Validation result:", result);
  }
}
```

### Svelte Integration

#### Installation

```bash
npm install @strray/svelte
```

#### Basic Usage

```svelte
<script>
  import { strRayStore, createStrRayAction } from '@strray/svelte';

  // Initialize store
  strRayStore.initialize({
    framework: 'svelte',
    features: { agents: true, codex: true }
  });

  const validateAction = createStrRayAction('executeAgent');

  let loading = false;
  let result = null;
  let error = null;

  async function validateCode() {
    loading = true;
    error = null;
    try {
      result = await validateAction({
        agentName: 'enforcer',
        task: { code: 'const x = 1;', framework: 'svelte' }
      });
    } catch (err) {
      error = err;
    } finally {
      loading = false;
    }
  }
</script>

<button on:click={validateCode} disabled={loading}>
  {#if loading}
    Validating...
  {:else}
    Validate Code
  {/if}
</button>

{#if error}
  <div>Error: {error.message}</div>
{/if}

{#if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}
```

#### Store Integration

```svelte
<script>
  import { codexStats, agentList } from '@strray/svelte';

  // Reactive stores
  $: console.log('Codex stats:', $codexStats);
  $: console.log('Available agents:', $agentList);
</script>

<div>
  <h2>Codex Statistics</h2>
  <pre>{JSON.stringify($codexStats, null, 2)}</pre>

  <h2>Available Agents</h2>
  <ul>
    {#each $agentList as agent (agent.name)}
      <li>{agent.name} - {agent.active ? 'Active' : 'Inactive'}</li>
    {/each}
  </ul>
</div>
```

## Cross-Framework Features

### Component Library

The StrRay component library provides framework-agnostic UI components with unified theming, accessibility, and performance optimizations.

#### Usage Across Frameworks

**React:**

```tsx
import { Button, Card } from "@strray/components/react";

function MyComponent() {
  return (
    <Card>
      <Button variant="primary">Click me</Button>
    </Card>
  );
}
```

**Vue:**

```vue
<template>
  <Card>
    <Button variant="primary">Click me</Button>
  </Card>
</template>

<script>
import { Button, Card } from "@strray/components/vue";
</script>
```

**Angular:**

```ts
import { ButtonComponent, CardComponent } from '@strray/components/angular';

@Component({
  template: `
    <strray-card>
      <strray-button variant="primary">Click me</strray-button>
    </strray-card>
  `
})
```

**Svelte:**

```svelte
<script>
  import { Button, Card } from '@strray/components/svelte';
</script>

<Card>
  <Button variant="primary">Click me</Button>
</Card>
```

### Theming System

```ts
import { defaultStrRayTheme, mergeThemes, componentRegistry } from '@strray/shared';

// Custom theme
const customTheme = mergeThemes(defaultStrRayTheme, {
  colors: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4'
  }
});

// Register custom theme
componentRegistry.registerTheme('custom', customTheme);

// Use in components
<Button theme="custom">Custom Themed Button</Button>
```

### Internationalization

```ts
import { strRayI18n, createStrRayI18n } from "@strray/shared";

// Use global instance
const message = strRayI18n.t("strray.loading");

// Create custom instance
const customI18n = createStrRayI18n({
  locale: "fr",
  messages: {
    fr: {
      custom: { message: "Message personnalisé" },
    },
  },
});

const customMessage = customI18n.t("custom.message");
```

### Accessibility

```ts
import { strRayA11y, ariaPatterns } from "@strray/shared";

// Create accessible button
const buttonProps = strRayA11y.createAriaProps({
  "aria-label": "Close dialog",
  "aria-expanded": false,
});

// Use ARIA patterns
const menuProps = ariaPatterns.menu({ label: "Main navigation" });

// Focus management
const cleanup = strRayA11y.trapFocus(dialogElement, {
  restoreFocus: true,
  initialFocus: firstInputElement,
});

// Screen reader announcements
strRayA11y.announce("Form submitted successfully", "polite");
```

## Developer Experience

### CLI Tools

```bash
# Initialize StrRay in project
npx @strray/cli init

# Generate framework-specific components
npx @strray/cli generate component Button --framework react

# Add StrRay agent integration
npx @strray/cli add agent enforcer --framework vue

# Setup testing utilities
npx @strray/cli test setup --framework angular
```

### TypeScript Support

All integrations provide full TypeScript support with comprehensive type definitions:

```ts
import type {
  StrRayIntegrationConfig,
  FrameworkAdapter,
  ComponentTheme,
  AriaProps,
} from "@strray/core";

interface CustomConfig extends StrRayIntegrationConfig {
  customFeature: boolean;
}
```

### Hot Reload Development

```ts
// Development configuration
const devConfig: StrRayIntegrationConfig = {
  framework: "react",
  mode: "development",
  features: {
    agents: true,
    codex: true,
    monitoring: true,
    analytics: true,
  },
  hotReload: {
    enabled: true,
    debounceMs: 300,
    ignorePatterns: ["*.test.*", "*.spec.*"],
  },
};
```

### Testing Utilities

```ts
// Framework-specific testing
import { renderWithStrRay, mockStrRayAgent } from '@strray/test-utils/react';

const mockAgent = mockStrRayAgent('enforcer', {
  validate: { success: true, violations: [] }
});

test('validates code correctly', async () => {
  const { result } = renderWithStrRay(<ValidationComponent />, {
    agents: [mockAgent]
  });

  // Test assertions
});
```

## Deployment & Production

### Build Optimization

```ts
// Vite configuration
import { strRayVitePlugin } from "@strray/build/vite";

export default {
  plugins: [
    strRayVitePlugin({
      framework: "react",
      features: ["agents", "codex"],
      minify: true,
      sourcemap: false,
    }),
  ],
};
```

### Bundle Splitting

```ts
// Dynamic imports for better code splitting
const loadStrRayFeatures = async () => {
  const [agents, codex] = await Promise.all([
    import("@strray/core/agents"),
    import("@strray/core/codex"),
  ]);

  return { agents, codex };
};
```

### Tree Shaking

StrRay integrations are designed for optimal tree shaking:

```ts
// Only imports what you use
import { useStrRayAgent } from "@strray/react"; // Only agent hook
import { StrRayProvider } from "@strray/react"; // Only provider

// Not imported: monitoring, analytics, codex hooks, etc.
```

### SSR Support

```ts
// Next.js example
import { StrRayProvider } from '@strray/react';

export default function App({ Component, pageProps }) {
  return (
    <StrRayProvider
      config={{
        framework: 'react',
        mode: typeof window === 'undefined' ? 'server' : 'client'
      }}
    >
      <Component {...pageProps} />
    </StrRayProvider>
  );
}
```

### CDN Integration

```html
<!-- Optimized CDN delivery -->
<script src="https://cdn.strray.dev/v1.0.0/core.js"></script>
<script src="https://cdn.strray.dev/v1.0.0/react.js"></script>
<link rel="stylesheet" href="https://cdn.strray.dev/v1.0.0/theme.css" />
```

## Performance Optimization

### Bundle Size Monitoring

```ts
// Performance budgets
const performanceBudget = {
  core: "50KB", // Core integration
  react: "75KB", // React adapter
  components: "120KB", // Component library
  total: "200KB", // Total budget
};
```

### Runtime Performance

- **Lazy Loading**: All features load on-demand
- **Memoization**: Expensive operations are cached
- **Virtual Scrolling**: Large lists are optimized
- **Debouncing**: User input is debounced
- **Web Workers**: Heavy computations run in background

### Monitoring Integration

```ts
// Performance monitoring
import { useStrRayMonitoring } from '@strray/react';

function App() {
  const { startMonitoring } = useStrRayMonitoring();

  useEffect(() => {
    startMonitoring();
  }, []);

  return <div>{/* App content */}</div>;
}
```

## Migration Guide

### From Framework-Specific Libraries

```ts
// Before: Direct framework usage
import { SomeLibrary } from "some-library";

// After: StrRay-wrapped
import { SomeLibrary } from "@strray/wrapped/some-library";
```

### Version Compatibility

| StrRay Version | React | Vue  | Angular | Svelte | Node.js |
| -------------- | ----- | ---- | ------- | ------ | ------- |
| 1.0.0          | 16.8+ | 3.0+ | 12.0+   | 3.0+   | 18.0+   |
| 1.1.0          | 17.0+ | 3.2+ | 13.0+   | 4.0+   | 18.0+   |

## Best Practices

### Code Organization

```ts
// Recommended structure
src/
├── components/
│   ├── ui/           # StrRay components
│   └── custom/       # Custom components
├── hooks/            # StrRay hooks
├── services/         # StrRay services
├── utils/            # StrRay utilities
└── strray/           # StrRay configuration
    ├── config.ts
    ├── themes.ts
    └── i18n.ts
```

### Error Handling

```ts
// Comprehensive error boundaries
<StrRayErrorBoundary
  fallback={({ error, retry }) => (
    <ErrorFallback error={error} onRetry={retry} />
  )}
>
  <App />
</StrRayErrorBoundary>
```

### Performance Patterns

```ts
// Memoization for expensive operations
const memoizedValidation = useMemo(() => {
  return debounce(validateCode, 300);
}, [code]);

// Lazy loading for heavy features
const HeavyComponent = lazy(() => import("@strray/components/HeavyChart"));
```

## Troubleshooting

### Common Issues

1. **Integration not initializing**
   - Check framework-specific configuration
   - Verify bundle includes all required modules

2. **TypeScript errors**
   - Update to latest StrRay types
   - Check framework compatibility

3. **Bundle size issues**
   - Use dynamic imports for unused features
   - Configure tree shaking properly

### Debug Mode

```ts
const debugConfig: StrRayIntegrationConfig = {
  framework: "react",
  mode: "development",
  debug: {
    enabled: true,
    logLevel: "verbose",
    performanceTracing: true,
  },
};
```

## Contributing

1. Choose target framework
2. Follow framework-specific patterns
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

## License

MIT License - see LICENSE file for details.
