/**
 * Git Hook Trigger for Post-Processor
 */
import { PostProcessor } from "../PostProcessor";
import { PostProcessorContext } from "../types";
export { cleanupLogFiles };
declare function cleanupLogFiles(config: any): Promise<{
    cleaned: number;
    errors: string[];
}>;
export declare class GitHookTrigger {
    private postProcessor;
    private initialized;
    constructor(postProcessor: PostProcessor);
    initialize(): Promise<void>;
    private installHook;
    private generateHookScript;
    private activateGitHooks;
    private backupExistingHook;
    triggerPostProcessor(context: PostProcessorContext): Promise<void>;
}
//# sourceMappingURL=GitHookTrigger.d.ts.map