/**
 * API Trigger for Post-Processor
 */

import { PostProcessor } from "../PostProcessor";
import { PostProcessorContext } from "../types";

export class APITrigger {
  private initialized = false;

  constructor(private postProcessor: PostProcessor) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // API endpoint initialization would go here
    this.initialized = true;
  }

  async triggerPostProcessor(context: PostProcessorContext): Promise<void> {
    await this.postProcessor.executePostProcessorLoop(context);
  }
}
