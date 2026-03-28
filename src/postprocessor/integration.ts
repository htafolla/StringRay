/**
 * StringRay Integration Layer
 *
 * Provides generic connectors for integrating StringRay's PostProcessor
 * with external applications and frameworks.
 *
 * This is framework-agnostic - works with Express, Fastify, Koa, etc.
 *
 * @version 1.0.0
 * @since 2026-03-08
 */

import { PostProcessor } from './PostProcessor.js';

import type { WebhookConfig, WebhookEvent } from './triggers/WebhookTrigger.js';
import type { APIConfig, APIRequest } from './triggers/APITrigger.js';

export { WebhookTrigger } from './triggers/WebhookTrigger.js';
export { APITrigger } from './triggers/APITrigger.js';

export type { WebhookConfig, WebhookEvent } from './triggers/WebhookTrigger.js';
export type { APIConfig, APIRequest } from './triggers/APITrigger.js';

/**
 * Generic StringRay integration for any external application
 * 
 * Provides:
 * - Webhook receivers (GitHub, GitLab, Bitbucket, Stripe)
 * - REST API triggers (manual trigger, retry, status)
 * - Framework-agnostic (works with Express, Fastify, Koa, etc.)
 *
 * @example
 * ```typescript
 * import { createStringRayIntegration } from 'strray-ai/integration';
 * 
 * const postProcessor = new PostProcessor(stateManager);
 * const integration = createStringRayIntegration(postProcessor);
 * 
 * // Get Express app for mounting
 * app.use('/webhooks', integration.getWebhookApp());
 * app.use('/api/post-process', integration.getAPIApp());
 * 
 * // Or get raw routers for Fastify/Koa
 * const webhookRouter = integration.getWebhookRouter();
 * const apiRouter = integration.getAPIRouter();
 * ```
 */
export class StringRayIntegration {
  private webhookTrigger: any;
  private apiTrigger: any;

  constructor(private postProcessor: PostProcessor) {}

  /**
   * Initialize all triggers with default configuration
   * 
   * @param config - Optional configuration for triggers
   */
  async initialize(config?: {
    webhook?: Partial<WebhookConfig>;
    api?: Partial<APIConfig>;
  }): Promise<void> {
    const { WebhookTrigger } = await import('./triggers/WebhookTrigger.js');
    const { APITrigger } = await import('./triggers/APITrigger.js');
    
    // Initialize webhook trigger with default GitHub config
    this.webhookTrigger = new WebhookTrigger(this.postProcessor, {
      provider: 'github',
      events: ['push', 'pull_request'],
      path: '/webhooks/github',
      verifySignature: true,
      ...config?.webhook
    });
    await this.webhookTrigger.initialize();

    // Initialize API trigger with default config
    this.apiTrigger = new APITrigger(this.postProcessor, {
      enabled: true,
      path: '/api/post-process',
      ...config?.api
    });
    await this.apiTrigger.initialize();
  }

  /**
   * Get webhook app for framework-specific mounting
   * 
   * Returns an Express Application. For other frameworks,
   * use getWebhookRouter() to get the router instance.
   * 
   * @example
   * ```typescript
   * // Express
   * app.use('/webhooks', integration.getWebhookApp());
   * 
   * // Fastify
   * await fastify.register(integration.getWebhookRouter(), { prefix: '/webhooks' });
   * 
   * // Koa
   * app.use(integration.getWebhookRouter().routes());
   * ```
   */
  getWebhookApp(): any {
    return this.webhookTrigger?.getApp();
  }

  /**
   * Get webhook router (raw Express router)
   * 
   * Useful for frameworks that need the router instance directly
   * rather than the full Express app.
   */
  getWebhookRouter(): any {
    return this.webhookTrigger?.getApp();
  }

  /**
   * Get API trigger app for framework-specific mounting
   * 
   * @example
   * ```typescript
   * // Express
   * app.use('/api/post-process', integration.getAPIApp());
   * 
   * // Fastify
   * await fastify.register(integration.getAPIRouter(), { prefix: '/api/post-process' });
   * ```
   */
  getAPIApp(): any {
    return this.apiTrigger?.getApp();
  }

  /**
   * Get API trigger router (raw Express router)
   * 
   * Useful for frameworks that need the router instance directly.
   */
  getAPIRouter(): any {
    return this.apiTrigger?.getApp();
  }

  /**
   * Manually trigger PostProcessor via API
   * 
   * Convenience method for programmatic triggering without
   * going through the HTTP endpoint.
   * 
   * @example
   * ```typescript
   * await integration.trigger({
   *   tool: 'test',
   *   operation: 'run',
   *   reason: 'Manual test trigger'
   * });
   * ```
   */
  async trigger(options: {
    tool: string;
    operation: string;
    filePath?: string;
    directory?: string;
    reason?: string;
  }): Promise<void> {
    const context: any = {
      tool: options.tool,
      operation: options.operation,
      filePath: options.filePath || '',
      directory: options.directory || process.cwd()
    };
    
    await this.postProcessor.executePostProcessorLoop(context);
  }

  /**
   * Shutdown all triggers
   */
  async shutdown(): Promise<void> {
    if (this.webhookTrigger) {
      this.webhookTrigger.shutdown();
    }
    if (this.apiTrigger) {
      this.apiTrigger.shutdown();
    }
  }
}

/**
 * Factory function for easy integration setup
 * 
 * @example
 * ```typescript
 * import { createStringRayIntegration } from 'strray-ai/integration';
 * 
 * // With default configuration
 * const integration = createStringRayIntegration(postProcessor);
 * await integration.initialize();
 * 
 * // With custom configuration
 * const integration = createStringRayIntegration(postProcessor);
 * await integration.initialize({
 *   webhook: {
 *     provider: 'gitlab',
 *     secret: process.env.GITLAB_WEBHOOK_SECRET,
 *     events: ['push', 'merge_request'],
 *     path: '/webhooks/gitlab'
 *   },
 *   api: {
 *     path: '/api/stray-trigger',
 *     apiKey: process.env.API_KEY
 *   }
 * });
 * ```
 */
export function createStringRayIntegration(
  postProcessor: PostProcessor
): StringRayIntegration {
  return new StringRayIntegration(postProcessor);
}
