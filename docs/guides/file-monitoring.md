# File Operation Monitoring in StringRay

## Overview

StringRay provides several ways to monitor file operations during AI agent execution. This guide covers best practices for implementing file monitoring in your StringRay-powered projects.

## Built-in Monitoring

### Automatic Tool Logging

StringRay's framework automatically logs all tool executions, including file operations. No configuration is required.

```typescript
// All tool executions are automatically logged
// When you use:
await stringray.tool.read('./file.ts');
await stringray.tool.write('./file.ts', 'content');

// The framework logs:
// - Tool name
// - Arguments
// - Execution time
// - Success/failure status
// - Session ID
// - Agent that executed the tool
```

### Accessing Framework Logs

```bash
# View recent framework activity
tail -100 .opencode/logs/framework/activity.log

# Follow logs in real-time
tail -f .opencode/logs/framework/activity.log

# Search for file operations
grep -E "(read|write|edit|create)" .opencode/logs/framework/activity.log

# Search for specific file
grep "src/components/" .opencode/logs/framework/activity.log
```

### Log Format

```
2026-03-13T10:30:45.123Z [framework-component] action - STATUS
  jobId: unique-job-id
  details: { ... }
```

Example:
```
2026-03-13T10:30:45.123Z [tool-execution] file-read - INFO
  jobId: job-1678702245123-abc123
  details: {
    tool: 'read',
    filePath: './src/index.ts',
    duration: 15,
    success: true
  }
```

## Custom Monitoring Integration

### Architecture Pattern

When implementing custom file monitoring, follow this pattern:

```
┌─────────────────────────────────────────┐
│   Your Application / Agent           │
│                                     │
│   ┌─────────────────────────┐         │
│   │  File Operations       │────────▶│  Monitoring Events
│   │  (read, write, etc.) │         │
│   └─────────────────────────┘         │
│                                     │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Event Queue / Rate Limiter        │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Webhook Sender / API Client       │
└─────────────────────────────────────────┘
               │
               ▼
        ┌──────────┴──────────┐
        │         External        │
        │         Services       │
        │  (Datadog, etc.)  │
        └─────────────────────────┘
```

### Step 1: Define Your Event Schema

```typescript
// file-events.ts
export interface FileEvent {
  // Unique event identifier
  eventId: string;

  // Event timestamp
  timestamp: number;

  // Operation type
  operation: 'read' | 'write' | 'edit' | 'create' | 'delete';

  // File information
  filePath: string;
  fileSize?: number;
  fileHash?: string;

  // Context
  sessionId?: string;
  agent?: string;
  toolName?: string;

  // Content (optional, for text files)
  contentSnippet?: string; // First N characters
  lineNumbers?: {
    start: number;
    end: number;
  };

  // Custom metadata
  metadata?: Record<string, any>;
}

// Event batch for efficiency
export interface FileEventBatch {
  events: FileEvent[];
  batchId: string;
  timestamp: number;
}
```

### Step 2: Implement Monitoring Service

```typescript
// file-monitor-service.ts
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { FileEvent } from './file-events.js';

export interface MonitoringConfig {
  webhookUrl: string;
  apiKey?: string;
  secret?: string;
  batchSize?: number;
  retryAttempts?: number;
  rateLimitPerMinute?: number;
  rateLimitPerHour?: number;
}

export class FileMonitorService {
  private config: Required<MonitoringConfig>;
  private eventQueue: FileEvent[] = [];
  private minuteBuckets = new Map<number, number>();
  private hourBuckets = new Map<number, number>();

  constructor(config: MonitoringConfig) {
    this.config = {
      batchSize: 10,
      retryAttempts: 5,
      rateLimitPerMinute: 60,
      rateLimitPerHour: 1000,
      ...config,
    };
  }

  async trackOperation(event: FileEvent): Promise<void> {
    // Add to queue
    this.eventQueue.push(event);

    // Check if batch is ready
    if (this.eventQueue.length >= this.config.batchSize!) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch: FileEventBatch = {
      events: [...this.eventQueue],
      batchId: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    this.eventQueue = [];

    try {
      await this.sendBatch(batch);
    } catch (error) {
      console.error('Failed to send file event batch:', error);
      // Re-queue for retry
      this.eventQueue.unshift(...batch.events);
    }
  }

  private async sendBatch(batch: FileEventBatch): Promise<void> {
    const payload = JSON.stringify(batch);
    const signature = this.config.secret
      ? this.generateSignature(payload)
      : undefined;

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'StringRay-FileMonitor/1.0.0',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        ...(signature && { 'X-Webhook-Signature': signature }),
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private generateSignature(payload: string): string {
    const hmac = crypto.createHmac('sha256', this.config.secret!);
    const timestamp = Math.floor(Date.now() / 1000);
    hmac.update(`${timestamp}.${payload}`);
    return `t=${timestamp},v1=${hmac.digest('hex')}`;
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const currentHour = Math.floor(now / 3600000);

    const minuteCount = this.minuteBuckets.get(currentMinute) || 0;
    const hourCount = this.hourBuckets.get(currentHour) || 0;

    return minuteCount < this.config.rateLimitPerMinute! &&
           hourCount < this.config.rateLimitPerHour!;
  }

  private recordEventSent(): void {
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const currentHour = Math.floor(now / 3600000);

    this.minuteBuckets.set(
      currentMinute,
      (this.minuteBuckets.get(currentMinute) || 0) + 1
    );

    this.hourBuckets.set(
      currentHour,
      (this.hourBuckets.get(currentHour) || 0) + 1
    );

    // Clean old buckets periodically
    if (this.minuteBuckets.size > 60) {
      const oldMinute = currentMinute - 60;
      this.minuteBuckets.delete(oldMinute);
    }
    if (this.hourBuckets.size > 24) {
      const oldHour = currentHour - 24;
      this.hourBuckets.delete(oldHour);
    }
  }
}
```

### Step 3: Hook into StringRay's Event System

```typescript
// file-monitor-hooks.ts
import { FileEvent, FileMonitorService } from './file-monitor-service.js';

export function registerFileMonitor(monitor: FileMonitorService): void {
  // Register for tool.before events
  // (if you want to track operations about to start)
  // Note: StringRay's event system is in development
  // You may need to wrap tool calls manually

  // Alternative: Wrap StringRay tools
  wrapStringRayTool('read', async (filePath, options) => {
    const startTime = Date.now();

    try {
      const result = await originalRead(filePath, options);

      const event: FileEvent = {
        eventId: crypto.randomUUID(),
        timestamp: Date.now(),
        operation: 'read',
        filePath,
        fileSize: options?.limit || 1024,
        toolName: 'read',
      };

      await monitor.trackOperation(event);
      return result;
    } catch (error) {
      const event: FileEvent = {
        eventId: crypto.randomUUID(),
        timestamp: Date.now(),
        operation: 'read',
        filePath,
        toolName: 'read',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      };

      await monitor.trackOperation(event);
      throw error;
    }
  });
}
```

## Best Practices

### 1. Rate Limiting

**Always implement rate limiting** to avoid overwhelming your monitoring service:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(60); // Max 60 concurrent requests

async sendEvent(event: FileEvent) {
  await limit(() => fetch(monitoringServiceUrl, {
    method: 'POST',
    body: JSON.stringify(event),
  }));
}
```

### 2. Retry Logic

**Implement exponential backoff** for network failures:

```typescript
async sendWithRetry(event: FileEvent, attempt = 1): Promise<void> {
  try {
    await fetch(monitoringServiceUrl, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  } catch (error) {
    if (attempt < maxAttempts) {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await sleep(delay);
      return sendWithRetry(event, attempt + 1);
    }
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Don't retry client errors:**

```typescript
if (error.response?.status >= 400 && error.response?.status < 500) {
  // 4xx errors are client errors - don't retry
  throw error;
}
```

### 3. Circuit Breaker Pattern

**Prevent cascading failures** when monitoring service is down:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000; // 1 minute

  canAttempt(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      console.warn('Circuit breaker opened due to repeated failures');
    }
  }
}
```

### 4. Async File Operations

**Use async operations** to avoid blocking the event loop:

```typescript
// BAD: Synchronous
const stats = fs.statSync(filePath);
const content = fs.readFileSync(filePath);

// GOOD: Asynchronous
const stats = await fs.promises.stat(filePath);
const content = await fs.promises.readFile(filePath);
```

### 5. Streaming for Large Files

**Don't load entire files into memory:**

```typescript
// BAD: Loads entire file
const content = fs.readFileSync(largeFile);
const hash = crypto.createHash('sha256').update(content).digest('hex');

// GOOD: Uses streaming
const hash = crypto.createHash('sha256');
const stream = fs.createReadStream(largeFile);

await new Promise((resolve, reject) => {
  stream.on('data', (chunk) => hash.update(chunk));
  stream.on('end', () => resolve(hash.digest('hex')));
  stream.on('error', reject);
});
```

### 6. Content Snippets

**Only send limited content** for privacy and performance:

```typescript
function getContentSnippet(filePath: string, maxLength: number): string | undefined {
  try {
    // Read only what we need
    const fd = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(maxLength + 100);

    const { bytesRead } = await fd.read(buffer, 0, buffer.length, 0);
    await fd.close();

    // Find safe break point (don't split emoji or multi-byte chars)
    const content = buffer.toString('utf-8').replace(/\0/g, '');
    const safeBreak = findSafeBreak(content, maxLength);

    return content.substring(0, safeBreak) + (content.length > maxLength ? '...' : '');
  } catch {
    return undefined;
  }
}

function findSafeBreak(content: string, maxLength: number): number {
  const safeIndex = Math.min(maxLength, content.length);

  // Don't break in the middle of multi-byte sequences
  for (let i = safeIndex - 10; i < safeIndex; i++) {
    const charCode = content.charCodeAt(i);
    // If we're in a multi-byte sequence, go back
    if (charCode >= 0xD800 && charCode <= 0xDFFF) {
      return i;
    }
  }

  return safeIndex;
}
```

### 7. File Filtering

**Filter what to track** for efficiency:

```typescript
import minimatch from 'minimatch';

class FileFilter {
  private includePatterns: minimatch.IMinimatch[];
  private excludePatterns: minimatch.IMinimatch[];
  private maxFileSize: number;
  private allowedExtensions: Set<string>;

  constructor(config: {
    includePatterns?: string[];
    excludePatterns?: string[];
    maxFileSize?: number;
    allowedExtensions?: string[];
  }) {
    // Pre-compile patterns for performance
    this.includePatterns = (config.includePatterns || [])
      .map(p => new minimatch.Minimatch(p));
    this.excludePatterns = (config.excludePatterns || [])
      .map(p => new minimatch.Minimatch(p));
    this.maxFileSize = config.maxFileSize || Infinity;
    this.allowedExtensions = new Set(config.allowedExtensions || []);
  }

  shouldTrack(filePath: string, fileSize?: number): boolean {
    const ext = path.extname(filePath);

    // Check extension
    if (this.allowedExtensions.size > 0) {
      if (!this.allowedExtensions.has(ext)) return false;
    }

    // Check file size
    if (fileSize && fileSize > this.maxFileSize) return false;

    // Check include patterns
    if (this.includePatterns.length > 0) {
      const isIncluded = this.includePatterns.some(p => p.match(filePath));
      if (!isIncluded) return false;
    }

    // Check exclude patterns
    if (this.excludePatterns.length > 0) {
      const isExcluded = this.excludePatterns.some(p => p.match(filePath));
      if (isExcluded) return false;
    }

    return true;
  }
}
```

### 8. Error Handling

**Handle errors gracefully:**

```typescript
async trackWithRetry(
  monitor: FileMonitorService,
  event: FileEvent,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await monitor.trackOperation(event);
      return true; // Success
    } catch (error) {
      const isRetryable = isRetryableError(error);

      if (!isRetryable) {
        // Log and give up
        console.error('Non-retryable error:', error);
        return false;
      }

      if (attempt === maxRetries) {
        // Last attempt failed
        console.error('Max retries reached for event:', event.eventId);
        return false;
      }

      // Wait before retry
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
    }
  }
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors are retryable
    if (error.message.includes('ECONNREFUSED')) return true;
    if (error.message.includes('ETIMEDOUT')) return true;
    if (error.message.includes('ENOTFOUND')) return true;

    // 5xx errors are retryable
    const httpError = error as any;
    if (httpError.status >= 500) return true;
    if (httpError.status === 429) return true;
  }

  return false;
}
```

## Example: Complete Implementation

See [`examples/file-monitoring/`](../../examples/file-monitoring/) for a complete working example.

## Common Monitoring Services

### Datadog

```typescript
// https://docs.datadoghq.com/logs/
const datadogClient = new DatadogLogs({
  apiKey: process.env.DATADOG_API_KEY,
  site: 'datadoghq.com',
});

await datadogClient.log({
  message: 'File operation',
  ddsource: 'stringray',
  dd: {
    operation: 'write',
    filePath: './src/index.ts',
  },
});
```

### New Relic

```typescript
// https://docs.newrelic.com/docs/logs/log-api/introduction-log-api/
const newrelicClient = new NewRelicLog({
  apiKey: process.env.NEWRELIC_LICENSE_KEY,
});

await newrelicClient.log({
  message: 'File operation',
  logName: 'FileOperations',
  customAttributes: {
    operation: 'write',
    filePath: './src/index.ts',
  },
});
```

### Logstash

```typescript
// https://www.elastic.co/guide/en/logstash/current/index.html
await fetch('http://logstash:5044', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    '@timestamp': new Date().toISOString(),
    message: 'File operation',
    operation: 'write',
    filePath: './src/index.ts',
  }),
});
```

### Custom Webhook Receiver

If you need a custom webhook receiver, consider these options:

- **ngrok** - Quick tunneling for local development
- **webhook.site** - Free webhook URLs
- **localtunnel.me** - Simple tunneling service
- **Railway** - Deploy webhook endpoint quickly

## Troubleshooting

### Events Not Being Sent

**Symptom:** File operations not appearing in monitoring service

**Solutions:**
1. Check if file filtering is too restrictive
2. Verify webhook URL is correct
3. Check API key/credentials
4. Review logs for errors
5. Test webhook endpoint independently

### Rate Limiting Issues

**Symptom:** 429 errors from monitoring service

**Solutions:**
1. Increase rate limits in monitoring service
2. Implement batching to send fewer requests
3. Use exponential backoff with jitter
4. Consider circuit breaker pattern

### Performance Issues

**Symptom:** Slow agent execution

**Solutions:**
1. Use async file operations
2. Stream large files instead of loading entirely
3. Implement batching
4. Pre-compile glob patterns
5. Cache file metadata when possible

## Questions?

For more help:
- [StringRay Documentation](../../README.md)
- [Migration Guide](../migrations/openclaw-removal.md)
- [Open an issue](https://github.com/htafolla/stringray/issues)
