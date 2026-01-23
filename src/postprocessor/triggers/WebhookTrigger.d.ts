/**
 * Webhook Trigger for Post-Processor
 */
import { PostProcessor } from "../PostProcessor";
import { PostProcessorContext } from "../types";
export declare class WebhookTrigger {
    private postProcessor;
    private initialized;
    constructor(postProcessor: PostProcessor);
    initialize(): Promise<void>;
    triggerPostProcessor(context: PostProcessorContext): Promise<void>;
}
//# sourceMappingURL=WebhookTrigger.d.ts.map