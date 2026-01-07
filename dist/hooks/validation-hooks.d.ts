export interface ValidationHooks {
    preValidate: (data: unknown) => boolean;
    postValidate: (result: boolean) => void;
}
export declare const useCodexValidation: () => ValidationHooks;
//# sourceMappingURL=validation-hooks.d.ts.map