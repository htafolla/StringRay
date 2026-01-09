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
export declare const useProcessorValidation: () => ProcessorValidationHooks;
//# sourceMappingURL=validation-hooks.d.ts.map