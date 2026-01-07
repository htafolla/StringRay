# StrRay Framework API Reference

**Version**: v2.4.0 | **Last Updated**: 2026-01-05 | **Framework**: StrRay v2.4.0

## Overview

StrRay provides a comprehensive programmatic API for integration with external systems, custom tooling, and advanced automation scenarios.

## Core API Classes

### StrRayClient

Main client for framework interaction.

```typescript
import { StrRayClient } from "@strray/framework";

const client = new StrRayClient({
  apiKey: "your-api-key",
  endpoint: "https://api.strray.dev",
  timeout: 30000,
});
```

### Agent Management

#### Creating Agents

```typescript
const agent = await client.createAgent({
  type: "enforcer",
  config: {
    thresholds: {
      bundleSize: "3MB",
      testCoverage: 80,
    },
  },
});
```

#### Agent Operations

```typescript
// Run validation
const result = await agent.validate({
  files: ["src/**/*.ts"],
  rules: ["typescript-strict", "no-any-types"],
});

// Get agent status
const status = await agent.getStatus();
```

### MCP Server Integration

#### Server Management

```typescript
const server = client.getMCPServer("testing-strategy");

// Execute MCP command
const result = await server.execute({
  command: "run-tests",
  args: { pattern: "**/*.spec.ts" },
});
```

### Framework Configuration

#### Configuration Management

```typescript
// Load configuration
const config = await client.loadConfig();

// Update configuration
await client.updateConfig({
  thresholds: {
    bundleSize: { maxSize: "2MB" },
  },
});
```

## Error Handling

```typescript
try {
  const result = await client.validateProject();
} catch (error) {
  if (error instanceof StrRayValidationError) {
    console.log("Validation failed:", error.details);
  }
}
```

## Events and Hooks

```typescript
// Listen for framework events
client.on("validation-complete", (result) => {
  console.log("Validation finished:", result);
});

// Register custom hooks
client.registerHook("pre-commit", async (files) => {
  // Custom validation logic
  return await customValidator(files);
});
```

## Advanced Usage

### Custom Agent Development

```typescript
class CustomAgent extends BaseAgent {
  async validate(input: ValidationInput): Promise<ValidationResult> {
    // Custom validation logic
    return {
      success: true,
      issues: [],
      metadata: { customMetric: 95 },
    };
  }
}

// Register custom agent
client.registerAgent("custom", CustomAgent);
```

### Batch Operations

```typescript
const results = await client.batchValidate([
  { files: "src/**/*.ts", rules: ["typescript"] },
  { files: "tests/**/*.spec.ts", rules: ["jest"] },
]);
```

## Configuration Schema

```json
{
  "framework": "StrRay v1.1.0",
  "agents": {
    "enforcer": {
      "enabled": true,
      "thresholds": {
        "bundleSize": "3MB",
        "testCoverage": 80
      }
    }
  },
  "mcps": {
    "testing-strategy": {
      "enabled": true,
      "config": {}
    }
  }
}
```

## Performance Considerations

- API calls are rate-limited based on your plan
- Large file sets should be processed in batches
- Real-time validation may impact performance
- Consider caching for frequently accessed data

## Security

- API keys should be stored securely
- Validate all inputs before processing
- Use HTTPS for all API communications
- Regularly rotate authentication tokens

---

_This API reference covers StrRay Framework v1.1.0. For the latest features, check the main documentation._</content>
<parameter name="filePath">docs/framework/api/API_REFERENCE.md
