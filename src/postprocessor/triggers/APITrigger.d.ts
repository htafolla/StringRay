/**
 * API Trigger for Post-Processor
 */
import { PostProcessor } from "../PostProcessor";
import { PostProcessorContext } from "../types";
export declare class APITrigger {
    private postProcessor;
    private initialized;
    constructor(postProcessor: PostProcessor);
    initialize(): Promise<void>;
    triggerPostProcessor(context: PostProcessorContext): Promise<void>;
}
//# sourceMappingURL=APITrigger.d.ts.map