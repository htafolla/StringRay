# Integration Base System

The Integration Base System provides a standardized foundation for creating and managing StringRay integrations. It includes the `BaseIntegration` class, `IntegrationRegistry`, and supporting types that ensure consistent lifecycle management, event handling, and configuration across all integrations.

## Overview

The integration framework is designed around three core concepts:

1. **BaseIntegration** - Abstract base class providing lifecycle management, event emission, logging, and configuration handling
2. **IntegrationRegistry** - Central registry for managing multiple integrations (registration, loading, unloading, health checking)
3. **Type System** - Standardized interfaces and types for all integrations

## Architecture

```
src/integrations/
├── base/                  # Integration base system
│   ├── types.ts           # TypeScript interfaces and types
│   ├── Integration.ts     # BaseIntegration abstract class
│   ├── registry.ts        # IntegrationRegistry class
│   ├── ExampleIntegration.ts  # Example implementation
│   └── index.ts           # Module exports
├── core/                  # Core framework integrations
│   └── strray-integration.ts  # Cross-framework integration
└── openclaw/              # External service integrations
    ├── index.ts
    ├── client.ts
    ├── api-server.ts
    └── hooks/
```

## Quick Start

### Creating a Basic Integration

```typescript
import { BaseIntegration, type HealthResult, type IntegrationConfig } from './base';

class MyIntegration extends BaseIntegration {
  constructor(config?: Partial<IntegrationConfig>) {
    super('my-integration', '1.0.0', config);
  }

  protected async performInitialization(): Promise<void> {
    await this.log('info', 'Starting initialization...');
    // Custom initialization logic
  }

  protected async performShutdown(): Promise<void> {
    await this.log('info', 'Starting shutdown...');
    // Custom cleanup logic
  }

  protected async performHealthCheck(): Promise<HealthResult> {
    return { healthy: true, message: 'OK' };
  }
}

// Usage
const integration = new MyIntegration({ debug: true });
await integration.initialize();
const health = await integration.healthCheck();
await integration.shutdown();
```

### Using the Registry

```typescript
import { IntegrationRegistry } from './base';

const registry = new IntegrationRegistry();

// Register an integration
registry.register('my-integration', new MyIntegration());

// Load from configuration
await registry.loadAll({
  integrations: {
    'my-integration': { 
      enabled: true,
      config: { debug: true }
    }
  }
});

// Check health of all integrations
const healthResults = await registry.healthCheckAll();

// Unload all
await registry.unloadAll();
```

## BaseIntegration Class

The `BaseIntegration` class is an abstract base class that provides:

### Lifecycle Management

| Method | Description |
|--------|-------------|
| `initialize(config?)` | Initialize the integration with optional configuration |
| `shutdown()` | Gracefully shutdown the integration |
| `healthCheck()` | Perform a health check |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Unique name of the integration |
| `version` | `string` | Version string |
| `status` | `IntegrationStatus` | Current lifecycle status |

### Status Values

```typescript
type IntegrationStatus = 
  | "uninitialized"    // Initial state, not yet initialized
  | "initializing"     // Currently initializing
  | "initialized"      // Fully initialized and operational
  | "error"            // Error state (initialization failed)
  | "shutting-down"    // Currently shutting down
  | "shutdown"        // Fully shutdown
```

### Configuration

```typescript
interface IntegrationConfig {
  enabled: boolean;    // Whether the integration is active
  debug: boolean;      // Enable debug logging
  logLevel: LogLevel; // Log verbosity level
  custom?: Record<string, unknown>; // Custom configuration
}

type LogLevel = "error" | "warn" | "info" | "debug";
```

### Events

The `BaseIntegration` extends `EventEmitter` and emits the following events:

```typescript
type IntegrationEventType =
  | "initialized"      // Integration initialized successfully
  | "initializing"      // Initialization started
  | "shutdown"         // Shutdown complete
  | "shutting-down"     // Shutdown started
  | "error"            // Error occurred
  | "health-check"     // Health check performed
  | "config-updated";  // Configuration updated
```

### Protected Methods for Subclasses

| Method | Description |
|--------|-------------|
| `ensureInitialized()` | Throws if integration not initialized |
| `recordError(error?)` | Record an error in statistics |
| `updateCustomStats(stats)` | Update custom statistics |
| `getConfig()` | Get current configuration |
| `updateConfig(config)` | Update configuration |
| `log(status, message, details?)` | Log a message |

### Factory Function

For simple integrations that don't need much logic, use `createSimpleIntegration`:

```typescript
import { createSimpleIntegration } from './base';

const simple = createSimpleIntegration(
  'simple-integration',
  '1.0.0',
  async () => ({ healthy: true, message: 'OK' }),
  async () => { /* cleanup */ }
);

await simple.initialize();
await simple.shutdown();
```

## IntegrationRegistry Class

The `IntegrationRegistry` manages registration, loading, and lifecycle of integrations.

### Registration Methods

```typescript
// Register an integration
registry.register('name', integrationInstance);

// Unregister an integration
registry.unregister('name');
```

### Accessor Methods

```typescript
// Get integration by name
const integration = registry.get('name');

// Check if registered
const isRegistered = registry.isRegistered('name');

// List all registered
const names = registry.list();

// List all loaded
const loadedNames = registry.listLoaded();
```

### Lifecycle Methods

```typescript
// Load a single integration
await registry.load('name', { debug: true });

// Unload a single integration
await registry.unload('name');

// Load all enabled from config
await registry.loadAll({
  integrations: {
    'integration-a': { enabled: true },
    'integration-b': { enabled: false }
  }
});

// Unload all
await registry.unloadAll();
```

### Health and Stats

```typescript
// Health check single
const health = await registry.healthCheck('name');

// Health check all
const allHealth = await registry.healthCheckAll();

// Get stats for single
const stats = registry.getStats('name');

// Get stats for all
const allStats = registry.getAllStats();

// Get status
const status = registry.getStatus('name');
const allStatuses = registry.getAllStatuses();

// Registry statistics
const registryStats = registry.getRegistryStats();
```

### Events

```typescript
type RegistryEventType =
  | "integration-registered"
  | "integration-unregistered"
  | "integration-loaded"
  | "integration-unloaded"
  | "load-complete"
  | "unload-complete"
  | "health-check-complete"
  | "error";
```

### Auto-Discovery

The registry supports automatic discovery of integrations from a directory:

```typescript
import { discoverIntegrations, autoRegisterIntegrations } from './base';

const discovered = await discoverIntegrations('./src/integrations');
// Returns: { name, path, module }[]

const count = await autoRegisterIntegrations(registry, './src/integrations');
// Auto-registers all discovered integrations
```

## Type System

### Core Interfaces

```typescript
// Base interface all integrations must implement
interface IIntegration {
  readonly name: string;
  readonly version: string;
  readonly status: IntegrationStatus;
  
  initialize(config?: Partial<IntegrationConfig>): Promise<void>;
  shutdown(): Promise<void>;
  healthCheck(): Promise<HealthResult>;
  getStats(): IntegrationStats;
}

// Extended interface with event support
interface IEventedIntegration extends IIntegration {
  getEventEmitter(): EventEmitter;
}
```

### Utility Types

```typescript
// Type guard to check if object is an integration
isIntegration(value: unknown): value is IIntegration;

// Check if health result is healthy
isHealthy(result: HealthResult): boolean;
```

### Error Types

```typescript
// Base error for integration issues
class IntegrationError extends Error {
  code: string;
  recoverable: boolean;
  context?: Record<string, unknown>;
}

// Specific error types
class IntegrationNotInitializedError extends IntegrationError {}
class IntegrationAlreadyInitializedError extends IntegrationError {}
class IntegrationInitializationError extends IntegrationError {}

// Registry errors
class IntegrationNotFoundError extends Error {}
class IntegrationAlreadyRegisteredError extends Error {}
```

## Configuration File Format

Integrations can be configured via JSON configuration:

```json
{
  "integrations": {
    "my-integration": {
      "enabled": true,
      "config": {
        "debug": true,
        "logLevel": "debug",
        "custom": {
          "apiKey": "secret-key"
        }
      }
    },
    "other-integration": {
      "enabled": false
    }
  }
}
```

## Best Practices

### 1. Always Handle Errors

```typescript
protected async performInitialization(): Promise<void> {
  try {
    await this.connect();
  } catch (error) {
    this.recordError(error instanceof Error ? error : new Error(String(error)));
    throw error; // Re-throw to trigger error state
  }
}
```

### 2. Implement Proper Health Checks

```typescript
protected async performHealthCheck(): Promise<HealthResult> {
  const connected = await this.checkConnection();
  
  if (!connected) {
    return {
      healthy: false,
      message: 'Connection lost',
      details: { lastConnected: this.lastConnectedTime }
    };
  }
  
  return { healthy: true, message: 'Operational' };
}
```

### 3. Clean Up Resources

```typescript
protected async performShutdown(): Promise<void> {
  // Remove event listeners
  this.off('event', this.handleEvent);
  
  // Close connections
  await this.client?.disconnect();
  
  // Clear timers
  this.timers.forEach(clearTimeout);
}
```

### 4. Use Logging Appropriately

```typescript
await this.log('info', 'Starting operation...');
await this.log('success', 'Operation completed');
await this.log('error', 'Operation failed', { error: error.message });
await this.log('debug', 'Debug information', { data });
```

## Example Integration

See [`ExampleIntegration.ts`](./ExampleIntegration.ts) for a complete example demonstrating:

- Custom integration class extending `BaseIntegration`
- Using `createSimpleIntegration` factory
- Event handling
- Error handling
- Health checks
- Configuration management

## Testing

The base system includes comprehensive test coverage:

```bash
# Run integration tests
npm test -- src/integrations/base

# Test specific integration
npm test -- src/integrations/base/Integration.test.ts
npm test -- src/integrations/base/registry.test.ts
```

## Related Documentation

- [Integration System Guide](../../docs/integrations.md) - Comprehensive integration guide
- [API Reference](../../docs/api/API_REFERENCE.md) - Complete API documentation
- [Configuration Reference](../../docs/CONFIGURATION.md) - Configuration options
