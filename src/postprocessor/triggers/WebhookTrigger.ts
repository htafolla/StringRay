/**
 * Webhook Trigger for Post-Processor
 */

import { PostProcessor } from "../PostProcessor";
import { PostProcessorContext } from "../types";

export class WebhookTrigger {
  private initialized = false;

  constructor(private postProcessor: PostProcessor) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Webhook initialization would go here
    // For now, this is a placeholder
    this.initialized = true;
  }

  async triggerPostProcessor(context: PostProcessorContext): Promise<void> {
    await this.postProcessor.executePostProcessorLoop(context);
  }
}
