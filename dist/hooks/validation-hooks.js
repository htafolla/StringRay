export const useCodexValidation = () => {
    return {
        preValidate: (data) => typeof data === "object" && data !== null,
        postValidate: (result) => {
            // Post-validation logic
        },
    };
};
export const useProcessorValidation = () => {
    const registeredProcessors = new Map();
    return {
        preValidate: async (context) => {
            for (const [name, processor] of registeredProcessors) {
                if (processor.enabled && processor.priority < 100) {
                    try {
                        await processor.execute(context);
                    }
                    catch (error) {
                        console.error(`Pre-processor ${name} failed:`, error);
                        return false;
                    }
                }
            }
            return true;
        },
        postValidate: async (context) => {
            for (const [name, processor] of registeredProcessors) {
                if (processor.enabled && processor.priority >= 100) {
                    try {
                        await processor.execute(context);
                    }
                    catch (error) {
                        console.warn(`Post-processor ${name} failed:`, error);
                    }
                }
            }
        },
        registerProcessor: (hook) => {
            registeredProcessors.set(hook.name, hook);
        },
        unregisterProcessor: (name) => {
            registeredProcessors.delete(name);
        },
    };
};
//# sourceMappingURL=validation-hooks.js.map