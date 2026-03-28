# OpenClaw Integration Removal

## Status

The OpenClaw integration has been **removed** as of version 1.8.0.

## Reason for Removal

The integration was based on a fundamental misunderstanding of OpenClaw's API:

### What OpenClaw Actually Is

- **Self-hosted local AI assistant** - not a cloud service
- Runs locally on `127.0.0.1:18789` (loopback only)
- Provides **inbound webhook endpoints** for external triggers
- Receives requests FROM external services to take actions

### What Our Implementation Assumed

- Cloud API service at `https://api.openclaw.io/v1/webhooks/events`
- Sending events TO OpenClaw for file monitoring
- Outbound webhook delivery system

### The Problem

1. **The API endpoint does not exist** - returns 404
2. **Architecture is fundamentally inverted** - we send events to a service that expects to receive events FROM external sources
3. **No file monitoring capabilities** - OpenClaw has no support for file operation tracking
4. **Incorrect authentication** - OpenClaw uses `Authorization: Bearer <token>`, not `X-API-Key`
5. **No signature verification** - OpenClaw does not use HMAC signatures

**Result:** The integration cannot work, regardless of any architectural fixes.

## Alternatives

If you need file operation monitoring, consider these alternatives:

### Option 1: Framework-Level Logging

StringRay automatically logs all tool executions, including file operations. No configuration needed.

```typescript
// Logs are automatically created at:
// .opencode/logs/framework/activity.log

// Or access programmatically:
import { frameworkLogger } from './src/core/framework-logger.js';

// All file operations are logged automatically
// when StringRay tools are executed
```

**View logs:**
```bash
# View recent framework logs
tail -100 .opencode/logs/framework/activity.log

# Follow logs in real-time
tail -f .opencode/logs/framework/activity.log

# Search for file operations
grep "file\." .opencode/logs/framework/activity.log
```

### Option 2: Custom Webhook Integration

Create a custom integration that sends events to your monitoring service:

```typescript
// webhook-monitor.ts
interface FileEvent {
  operation: 'read' | 'write' | 'create' | 'delete';
  filePath: string;
  timestamp: number;
  sessionId?: string;
  agent?: string;
  contentSnippet?: string;
  fileSize?: number;
  fileHash?: string;
}

class WebhookMonitor {
  constructor(
    private webhookUrl: string,
    private apiKey?: string,
  ) {}

  async sendEvent(event: FileEvent): Promise<void> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send webhook event:', error);
      throw error;
    }
  }

  async sendBatch(events: FileEvent[]): Promise<void> {
    await Promise.allSettled(events.map(e => this.sendEvent(e)));
  }
}

export { WebhookMonitor, FileEvent };
```

### Option 3: File System Watcher

Use Node.js `fs.watch` for direct file system monitoring:

```typescript
// file-watcher.ts
import * as fs from 'fs';
import * as path from 'path';

interface FileWatchEvent {
  eventType: 'rename' | 'change';
  filename: string;
  timestamp: number;
}

class FileWatcher {
  private watchers: Map<string, fs.FSWatcher> = new Map();

  watchDirectory(dirPath: string, callback: (event: FileWatchEvent) => void): void {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory does not exist: ${dirPath}`);
    }

    const watcher = fs.watch(dirPath, (eventType, filename) => {
      if (filename) {
        callback({
          eventType: eventType as 'rename' | 'change',
          filename: path.join(dirPath, filename),
          timestamp: Date.now(),
        });
      }
    });

    this.watchers.set(dirPath, watcher);
  }

  watchFiles(filePaths: string[], callback: (event: FileWatchEvent) => void): void {
    const dirPaths = new Set(filePaths.map(f => path.dirname(f)));

    dirPaths.forEach(dir => {
      this.watchDirectory(dir, callback);
    });
  }

  stop(): void {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers.clear();
  }
}

// Usage example:
const watcher = new FileWatcher();
watcher.watchFiles(['./src/**/*.ts'], (event) => {
  console.log(`File ${event.eventType}: ${event.filename}`);
});

// Clean up when done
process.on('SIGINT', () => {
  watcher.stop();
  process.exit(0);
});
```

### Option 4: Generic Webhook Sender

Use the pattern from the best practices guide to create a configurable webhook sender:

```typescript
// generic-webhook-sender.ts
import * as crypto from 'crypto';
import pLimit from 'p-limit';

interface WebhookConfig {
  url: string;
  apiKey?: string;
  secret?: string;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimitPerMinute?: number;
}

class GenericWebhookSender {
  private config: WebhookConfig;
  private queue: any[] = [];
  private rateLimiter: pLimit.Limit;

  constructor(config: WebhookConfig) {
    this.config = {
      retryAttempts: 5,
      retryDelay: 1000,
      rateLimitPerMinute: 60,
      ...config,
    };

    this.rateLimiter = pLimit(this.config.rateLimitPerMinute!);
  }

  async send(payload: any): Promise<void> {
    const event = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      payload,
    };

    await this.rateLimiter(() => this.sendWithRetry(event));
  }

  private async sendWithRetry(event: any, attempt = 1): Promise<void> {
    try {
      const body = JSON.stringify(event);
      const signature = this.config.secret
        ? this.generateSignature(body)
        : undefined;

      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
          ...(signature && { 'X-Webhook-Signature': signature }),
        },
        body,
      });

      if (!response.ok) {
        // Don't retry 4xx errors
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Non-retryable error: ${response.status}`);
        }

        // Retry 5xx and 429 errors
        if (attempt < this.config.retryAttempts!) {
          await this.delay(this.config.retryDelay! * Math.pow(2, attempt - 1));
          return this.sendWithRetry(event, attempt + 1);
        }
      }
    } catch (error) {
      if (attempt < this.config.retryAttempts!) {
        await this.delay(this.config.retryDelay! * Math.pow(2, attempt - 1));
        return this.sendWithRetry(event, attempt + 1);
      }
      throw error;
    }
  }

  private generateSignature(payload: string): string {
    const hmac = crypto.createHmac('sha256', this.config.secret!);
    const timestamp = Math.floor(Date.now() / 1000);
    hmac.update(`${timestamp}.${payload}`);
    return `t=${timestamp},v1=${hmac.digest('hex')}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Migration Steps

### Step 1: Remove OpenClaw Configuration

```bash
# Remove configuration directory
rm -rf .opencode/openclaw/

# Remove from any custom config files
# (Edit your config files and remove openclaw sections)
```

### Step 2: Remove OpenClaw Imports

```typescript
// REMOVE from your code:
import { initializeOpenClawIntegration } from './integrations/openclaw/index.js';
```

### Step 3: Choose an Alternative

1. Review the alternatives above
2. Select the one that best fits your needs
3. Follow the implementation example
4. Test with your monitoring service

### Step 4: Update Your Workflows

1. Update any automated workflows that depended on OpenClaw events
2. Replace with chosen alternative
3. Test thoroughly in development environment
4. Deploy to production after validation

## Questions?

If you have questions about this removal or need help migrating:

1. Check the [File Monitoring Best Practices Guide](../guides/file-monitoring.md)
2. Review [Example Implementations](../../examples/file-monitoring/)
3. Open an issue on the StringRay GitHub repository
4. Join the StringRay community discussions

## Additional Resources

- [StringRay Documentation](../../README.md)
- [Framework Logger API](../../docs/api/framework-logger.md)
- [Event System Documentation](../../docs/api/events.md)
- [Custom Integration Guide](../../docs/guides/custom-integrations.md)
