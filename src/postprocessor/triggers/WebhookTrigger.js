/**
 * Webhook Trigger for Post-Processor
 */
export class WebhookTrigger {
    postProcessor;
    initialized = false;
    constructor(postProcessor) {
        this.postProcessor = postProcessor;
    }
    async initialize() {
        if (this.initialized)
            return;
        // Webhook initialization would go here
        // For now, this is a placeholder
        this.initialized = true;
    }
    async triggerPostProcessor(context) {
        await this.postProcessor.executePostProcessorLoop(context);
    }
}
//# sourceMappingURL=WebhookTrigger.js.map