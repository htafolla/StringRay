/**
 * API Trigger for Post-Processor
 */
export class APITrigger {
    postProcessor;
    initialized = false;
    constructor(postProcessor) {
        this.postProcessor = postProcessor;
    }
    async initialize() {
        if (this.initialized)
            return;
        // API endpoint initialization would go here
        this.initialized = true;
    }
    async triggerPostProcessor(context) {
        await this.postProcessor.executePostProcessorLoop(context);
    }
}
//# sourceMappingURL=APITrigger.js.map