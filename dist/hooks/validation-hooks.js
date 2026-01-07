export const useCodexValidation = () => {
    return {
        preValidate: (data) => typeof data === 'object' && data !== null,
        postValidate: (result) => {
            if (!result)
                console.warn('Validation failed');
        },
    };
};
//# sourceMappingURL=validation-hooks.js.map