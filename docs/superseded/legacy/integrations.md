# StringRay Integration System

The StringRay Integration System provides a flexible, extensible framework for connecting StringRay with external services, frameworks, and protocols. It enables seamless interoperability between StringRay and various tools, platforms, and custom solutions.

## Table of Contents

1. [Overview](#overview)
2. [Integration Types](#integration-types)
3. [Architecture](#architecture)
4. [Creating Integrations](#creating-integrations)
5. [Registration & Discovery](#registration--discovery)
6. [Configuration](#configuration)
7. [Best Practices](#best-practices)
8. [Examples](#examples)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The StringRay Integration System is designed around three core principles:

- **Standardization** - All integrations follow the same lifecycle patterns (initialize, shutdown, health check)
- **Extensibility** - New integrations can be added without modifying core code
- **Observability** - Integrated logging, events, and health monitoring

### Key Components

| Component | Purpose |
|-----------|---------|
| `BaseIntegration` | Abstract base class for all integrations |
| `IntegrationRegistry` | Central management for multiple integrations |
| `IIntegration` interface | Contract that all integrations must implement |
| Type definitions | Consistent types across all integrations |

---

## Integration Types

StringRay supports three primary categories of integrations:

### 1. Framework Integrations

Framework integrations connect StringRay with frontend frameworks (React, Vue, Angular, Svelte, etc.), enabling native integration within those ecosystems.

**Location:** `src/integrations/core/`

```typescript
import { StringRayIntegration, SupportedFramework } from './core/strray-integration';

// React integration
const integration = new StringRayIntegration({
  framework: SupportedFramework.REACT,
  version: '18.2.0',
  features: {
    agents: true,
    codex: true,
    monitoring: true,
    analytics: true,
    validation: true,
    security: true,
  },
  performance: {
    lazyLoading: true,
    bundleSplitting: true,
    treeShaking: true,
    minification: true,
  },
  build: {
    target: 'production',
    sourcemaps: false,
    analyze: false,
  },
  plugins: [],
});

await integration.initialize();
```

**Supported Frameworks:**

| Framework | Status | Description |
|-----------|--------|-------------|
| React | Planned | React 18+ integration with hooks |
| Vue | Planned | Vue 3+ integration |
| Angular | Planned | Angular integration |
| Svelte | Planned | Svelte integration |
| Vanilla | Available | Plain JavaScript/TypeScript |

### 2. External Service Integrations

External service integrations connect StringRay with third-party services, APIs, and platforms.

**Location:** `src/integrations/openclaw/`

**Example: OpenClaw Integration**

```typescript
import { OpenClawIntegration } from './openclaw';

const openclaw = new OpenClawIntegration('./config/openclaw.json');
await openclaw.initialize();

// Access components
const apiServer = openclaw.getAPIServer();
const client = openclaw.getClient();
const hooks = openclaw.getHooksManager();

// Get statistics
const stats = openclaw.getStatistics();
```

**Features:**
- WebSocket client for real-time communication
- REST API server for agent invocation
- Hook system for event handling
- Auto-reconnection with configurable attempts

### 3. Protocol Bridge Integrations

Protocol bridges enable StringRay to communicate using different protocols or data formats.

**Location:** `src/integrations/cross-language-bridge.ts`

**Use Cases:**
- JSON-RPC communication
- gRPC service bridging
- WebSocket protocol translation
- Custom message formats

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     StringRay Core                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              IntegrationRegistry                    │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│  │  │  Framework  │ │   External  │ │  Protocol  │  │   │
│  │  │Integrations │ │   Services   │ │   Bridges   │  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 BaseIntegration                     │   │
│  │  • Lifecycle (init/shutdown)                        │   │
│  │  • Events (EventEmitter)                            │   │
│  │  • Logging (frameworkLogger)                        │   │
│  │  • Configuration                                     │   │
│  │  • Health Checks                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/integrations/
├── base/                          # Base system
│   ├── types.ts                   # Type definitions
│   ├── Integration.ts              # BaseIntegration class
│   ├── registry.ts                 # IntegrationRegistry
│   ├── ExampleIntegration.ts       # Example implementation
│   └── index.ts                   # Module exports
│
├── core/                          # Framework integrations
│   └── strray-integration.ts       # Cross-framework integration
│
├── openclaw/                      # External service integrations
│   ├── index.ts                   # Main integration
│   ├── client.ts                  # WebSocket client
│   ├── api-server.ts               # REST API server
│   ├── config.ts                   # Configuration loader
│   ├── types.ts                    # Type definitions
│   └── hooks/                      # Hook system
│       └── strray-hooks.ts
│
└── cross-language-bridge.ts       # Protocol bridges
```

---

## Creating Integrations

### Step 1: Define Your Integration Class

```typescript
// src/integrations/my-service/index.ts
import { 
  BaseIntegration, 
  type HealthResult, 
  type IntegrationConfig,
  type IntegrationStats 
} from '../base';

export class MyServiceIntegration extends BaseIntegration {
  private client: MyServiceClient | null = null;
  
  constructor(config?: Partial<IntegrationConfig>) {
    super('my-service', '1.0.0', config);
  }
  
  // Custom methods
  async fetchData(): Promise<Data> {
    this.ensureInitialized();
    return this.client!.fetchData();
  }
  
  // Lifecycle: Initialization
  protected async performInitialization(): Promise<void> {
    await this.log('info', 'Connecting to MyService...');
    
    const config = this.getConfig();
    this.client = new MyServiceClient({
      apiKey: config.custom?.apiKey as string,
      endpoint: config.custom?.endpoint as string,
    });
    
    await this.client.connect();
    await this.log('success', 'Connected to MyService');
    
    // Setup event handlers
    this.client.on('data', (data) => {
      this.emit('data-received', { data });
    });
  }
  
  // Lifecycle: Shutdown
  protected async performShutdown(): Promise<void> {
    await this.log('info', 'Disconnecting from MyService...');
    
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
    
    await this.log('success', 'Disconnected from MyService');
  }
  
  // Lifecycle: Health Check
  protected async performHealthCheck(): Promise<HealthResult> {
    if (!this.client) {
      return { 
        healthy: false, 
        message: 'Client not initialized' 
      };
    }
    
    try {
      const isConnected = await this.client.ping();
      
      if (isConnected) {
        return { 
          healthy: true, 
          message: 'Service connection healthy',
          details: { latency: await this.client.getLatency() }
        };
      }
      
      return { 
        healthy: false, 
        message: 'Service not responding' 
      };
    } catch (error) {
      return { 
        healthy: false, 
        message: 'Health check failed',
        details: { error: String(error) }
      };
    }
  }
}
```

### Step 2: Export the Integration

```typescript
// src/integrations/my-service/index.ts (continued)

export default new MyServiceIntegration();
```

### Step 3: Use Your Integration

```typescript
import { IntegrationRegistry } from '../base';
import { MyServiceIntegration } from './my-service';

// Direct usage
const integration = new MyServiceIntegration({
  custom: {
    apiKey: process.env.MY_SERVICE_API_KEY,
    endpoint: 'https://api.myservice.com'
  }
});

await integration.initialize();

// Or register with the registry
const registry = new IntegrationRegistry();
registry.register('my-service', new MyServiceIntegration());
await registry.load('my-service');
```

### Using the Simple Factory

For simple integrations that don't need custom logic:

```typescript
import { createSimpleIntegration } from '../base';

const simple = createSimpleIntegration(
  'simple-service',
  '1.0.0',
  async () => ({ healthy: true, message: 'OK' }),
  async () => { /* cleanup */ }
);
```

---

## Registration & Discovery

### Manual Registration

```typescript
import { IntegrationRegistry } from './base';

const registry = new IntegrationRegistry();

// Register integrations
registry.register('openclaw', new OpenClawIntegration());
registry.register('custom', new MyServiceIntegration());
```

### Auto-Discovery

The system can automatically discover integrations from a directory:

```typescript
import { discoverIntegrations, autoRegisterIntegrations } from './base';

const registry = new IntegrationRegistry();

// Discover and register all integrations
const discovered = await discoverIntegrations('./src/integrations');
// Returns: [{ name, path, module }, ...]

const count = await autoRegisterIntegrations(registry, './src/integrations');
console.log(`Auto-registered ${count} integrations`);
```

**Discovery Process:**

1. Scans the specified directory for subdirectories
2. Looks for `index.ts` files in each subdirectory
3. Validates exports using `isIntegration()` type guard
4. Extracts integration name from exports
5. Registers valid integrations with the registry

### Configuration-Based Loading

```typescript
// Load all enabled integrations from config
await registry.loadAll({
  integrations: {
    'openclaw': {
      enabled: true,
      config: {
        logLevel: 'debug'
      }
    },
    'my-service': {
      enabled: true,
      config: {
        custom: {
          apiKey: 'secret-key'
        }
      }
    },
    'disabled-service': {
      enabled: false
    }
  }
});
```

---

## Configuration

### Integration Configuration File

Create a JSON configuration file for your integrations:

```json
// config/integrations.json
{
  "integrations": {
    "openclaw": {
      "enabled": true,
      "config": {
        "gatewayUrl": "wss://gateway.openclaw.dev",
        "authToken": "${OPENCLAW_TOKEN}",
        "deviceId": "strray-device-001",
        "autoReconnect": true,
        "maxReconnectAttempts": 5,
        "reconnectDelay": 1000,
        "apiServer": {
          "enabled": true,
          "port": 3001,
          "host": "localhost"
        },
        "hooks": {
          "enabled": true,
          "toolName": "openclaw"
        }
      }
    },
    "my-service": {
      "enabled": true,
      "config": {
        "custom": {
          "apiKey": "${MY_SERVICE_KEY}",
          "endpoint": "https://api.myservice.com"
        }
      }
    }
  }
}
```

### Environment Variables

Use environment variables in configuration:

```typescript
import dotenv from 'dotenv';
dotenv.config();

// Configuration with env vars
const config = {
  integrations: {
    'openclaw': {
      enabled: true,
      config: {
        authToken: process.env.OPENCLAW_TOKEN
      }
    }
  }
};
```

### Programmatic Configuration

```typescript
import { IntegrationRegistry, type IntegrationsConfig } from './base';

const config: IntegrationsConfig = {
  integrations: {
    'my-integration': {
      enabled: true,
      config: {
        enabled: true,
        debug: true,
        logLevel: 'debug',
        custom: {
          option1: 'value1',
          option2: 42
        }
      }
    }
  }
};

const registry = new IntegrationRegistry();
await registry.loadAll(config);
```

---

## Best Practices

### 1. Follow the Lifecycle Contract

Always implement the three lifecycle methods:

```typescript
// GOOD: Proper lifecycle implementation
protected async performInitialization(): Promise<void> {
  // Setup resources
  await this.connect();
  this.registerHandlers();
}

protected async performShutdown(): Promise<void> {
  // Clean up resources (reverse order of initialization)
  this.unregisterHandlers();
  await this.disconnect();
}

protected async performHealthCheck(): Promise<HealthResult> {
  // Check if critical components are working
  const healthy = await this.ping();
  return { healthy, message: healthy ? 'OK' : 'Failed' };
}
```

### 2. Handle Errors Gracefully

```typescript
protected async performInitialization(): Promise<void> {
  try {
    await this.connect();
  } catch (error) {
    // Log the error
    await this.log('error', 'Failed to connect', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Record error for stats
    this.recordError(error instanceof Error ? error : new Error(String(error)));
    
    // Re-throw to mark integration as errored
    throw error;
  }
}
```

### 3. Use Proper Logging Levels

```typescript
// Use appropriate log levels
await this.log('info', 'Starting operation');      // Normal operations
await this.log('success', 'Operation completed');  // Successful completion
await this.log('warn', 'Potential issue');         // Warning conditions
await this.log('error', 'Operation failed', {      // Errors
  error: error.message 
});
await this.log('debug', 'Detailed info');          // Debug (only when debug: true)
```

### 4. Emit Relevant Events

```typescript
// Emit events for important state changes
this.emit('initialized', { version: this.version });
this.emit('data-received', { data: event.data });
this.emit('connection-lost', { reason: 'timeout' });

// Listen to events from external systems
externalClient.on('message', (msg) => {
  this.emit('external-message', { message: msg });
});
```

### 5. Implement Meaningful Health Checks

```typescript
protected async performHealthCheck(): Promise<HealthResult> {
  const checks = await Promise.all([
    this.checkConnection(),
    this.checkAuthToken(),
    this.checkRateLimit()
  ]);
  
  const allHealthy = checks.every(c => c.healthy);
  
  return {
    healthy: allHealthy,
    message: allHealthy ? 'All checks passed' : 'Some checks failed',
    details: {
      connection: checks[0],
      auth: checks[1],
      rateLimit: checks[2]
    }
  };
}
```

### 6. Clean Up Resources Properly

```typescript
protected async performShutdown(): Promise<void> {
  // Remove event listeners
  this.removeAllListeners();
  
  // Clear timers
  this.timers.forEach(clearTimeout);
  this.intervals.forEach(clearInterval);
  
  // Close connections
  await Promise.allSettled([
    this.client?.disconnect(),
    this.server?.close(),
  ]);
  
  // Clear caches
  this.cache.clear();
}
```

---

## Examples

### Example 1: REST API Integration

```typescript
import { BaseIntegration, type HealthResult } from './base';

class RESTAPIIntegration extends BaseIntegration {
  private baseURL: string = '';
  private apiKey: string = '';
  
  constructor() {
    super('rest-api', '1.0.0');
  }
  
  protected async performInitialization(): Promise<void> {
    const config = this.getConfig();
    this.baseURL = config.custom?.baseURL as string;
    this.apiKey = config.custom?.apiKey as string;
    
    // Test connection
    const response = await fetch(`${this.baseURL}/health`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
  }
  
  protected async performShutdown(): Promise<void> {
    // Nothing to clean up
  }
  
  protected async performHealthCheck(): Promise<HealthResult> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      return {
        healthy: response.ok,
        message: response.ok ? 'API healthy' : `API returned ${response.status}`
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
  
  // Custom API methods
  async get<T>(path: string): Promise<T> {
    this.ensureInitialized();
    const response = await fetch(`${this.baseURL}${path}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }
}
```

### Example 2: WebSocket Integration

```typescript
import { BaseIntegration, type HealthResult } from './base';

class WebSocketIntegration extends BaseIntegration {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, Function> = new Map();
  
  constructor() {
    super('websocket', '1.0.0');
  }
  
  protected async performInitialization(): Promise<void> {
    const config = this.getConfig();
    const url = config.custom?.url as string;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        this.emit('connected', {});
        resolve();
      };
      
      this.ws.onerror = (error) => {
        reject(new Error(`WebSocket error: ${error}`));
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const handler = this.messageHandlers.get(data.type);
        if (handler) {
          handler(data);
        }
        this.emit('message', { data });
      };
    });
  }
  
  protected async performShutdown(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  protected async performHealthCheck(): Promise<HealthResult> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return { healthy: false, message: 'Not connected' };
    }
    
    return { healthy: true, message: 'Connected' };
  }
  
  onMessage(type: string, handler: Function): void {
    this.messageHandlers.set(type, handler);
  }
  
  send(type: string, data: unknown): void {
    this.ensureInitialized();
    this.ws?.send(JSON.stringify({ type, data }));
  }
}
```

### Example 3: Using the Registry in Your Application

```typescript
import { IntegrationRegistry } from './base';
import { MyServiceIntegration } from './my-service';
import { RESTAPIIntegration } from './rest-api';

async function main() {
  const registry = new IntegrationRegistry();
  
  // Register integrations
  registry.register('my-service', new MyServiceIntegration());
  registry.register('rest-api', new RESTAPIIntegration());
  
  // Setup event handlers
  registry.on('integration-loaded', (event) => {
    console.log(`Loaded: ${event.integrationName}`);
  });
  
  registry.on('integration-registered', (event) => {
    console.log(`Registered: ${event.integrationName} v${event.version}`);
  });
  
  // Load all enabled integrations
  await registry.loadAll({
    integrations: {
      'my-service': { enabled: true },
      'rest-api': { enabled: true }
    }
  });
  
  // Health check all
  const health = await registry.healthCheckAll();
  console.log('Health:', health);
  
  // Get all stats
  const stats = registry.getAllStats();
  console.log('Stats:', stats);
  
  // Shutdown on exit
  process.on('SIGINT', async () => {
    await registry.unloadAll();
    process.exit(0);
  });
}

main().catch(console.error);
```

---

## Troubleshooting

### Integration Won't Initialize

**Symptoms:** `initialize()` throws an error

**Solutions:**

1. Check the error message - it usually indicates what went wrong
2. Verify configuration values are correct
3. Ensure required environment variables are set
4. Check network connectivity for external services
5. Review logs for detailed error information

```typescript
try {
  await integration.initialize();
} catch (error) {
  if (error instanceof IntegrationInitializationError) {
    console.error('Initialization failed:', error.message);
    console.error('Context:', error.context);
  }
}
```

### Integration Not Found in Registry

**Symptoms:** `IntegrationNotFoundError` when loading

**Solutions:**

1. Ensure the integration was registered first
2. Check the spelling matches exactly (case-sensitive)
3. Verify the integration module is imported

```typescript
// Check if registered before loading
if (registry.isRegistered('my-integration')) {
  await registry.load('my-integration');
} else {
  console.error('Integration not registered');
}
```

### Health Check Always Unhealthy

**Symptoms:** Integration health check returns `healthy: false`

**Solutions:**

1. Check the health check message for details
2. Verify external service connectivity
3. Check authentication credentials
4. Review recent error logs

```typescript
const health = await integration.healthCheck();
console.log(health.message);
console.log(health.details);
```

### Duplicate Registration Error

**Symptoms:** `IntegrationAlreadyRegisteredError`

**Solutions:**

1. Check if integration is already registered
2. Unregister before re-registering
3. Use a different name for each integration

```typescript
// Check first
if (!registry.isRegistered('my-integration')) {
  registry.register('my-integration', integration);
}
```

### Memory Leaks

**Symptoms:** Memory usage grows over time

**Solutions:**

1. Ensure all event listeners are removed in `performShutdown()`
2. Clear all timers and intervals
3. Close all network connections
4. Clear any caches

```typescript
protected async performShutdown(): Promise<void> {
  // Remove listeners
  this.removeAllListeners();
  
  // Clear timers
  this.timers.forEach(clearTimeout);
  
  // Close connections
  await this.client?.close();
  
  // Clear caches
  this.cache.clear();
}
```

---

## Related Documentation

- [Integration Base System](../src/integrations/base/README.md) - Core API documentation
- [API Reference](./api/API_REFERENCE.md) - Complete API documentation
- [Configuration Reference](./CONFIGURATION.md) - Configuration options
- [OpenClaw Integration](./research/openclaw/README.md) - OpenClaw-specific guide

---

## Support

For issues and questions:

- Check the [troubleshooting section](#troubleshooting) above
- Review integration logs for detailed error messages
- Examine health check results for diagnostic information
- Run with debug logging enabled for more details
