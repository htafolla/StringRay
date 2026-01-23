import { PreValidateContext, PostValidateContext, ProcessorHook } from "../processors/processor-types";
export interface ValidationHooks {
    preValidate: (data: unknown) => boolean;
    postValidate: (result: boolean) => void;
}
export interface ProcessorValidationHooks {
    preValidate: (context: PreValidateContext) => Promise<boolean>;
    postValidate: (context: PostValidateContext) => Promise<void>;
    registerProcessor: (hook: ProcessorHook) => void;
    unregisterProcessor: (name: string) => void;
}
export declare const useCodexValidation: () => ValidationHooks;
export interface CompactionDetectionContext {
    filesChanged: string[];
    agentName: string;
    operation: string;
    riskLevel: "low" | "medium" | "high" | "critical";
}
export interface VersionValidationContext {
    filesChanged: string[];
    operation: string;
}
export declare const useVersionValidation: () => {
    validateVersionConsistency: (context: VersionValidationContext) => Promise<boolean>;
};
export declare const useCompactionPrevention: () => {
    detectCompactionResearch: (context: CompactionDetectionContext) => Promise<boolean>;
};
export declare const useProcessorValidation: () => ProcessorValidationHooks;
//# sourceMappingURL=validation-hooks.d.ts.map