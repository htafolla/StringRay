export const useCodexValidation = () => {
    return {
        preValidate: (data) => typeof data === 'object' && data !== null,
        postValidate: (result) => {
        },
    };
};
//# sourceMappingURL=validation-hooks.js.map