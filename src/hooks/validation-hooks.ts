import {
  PreValidateContext,
  PostValidateContext,
  ProcessorHook,
} from "../processors/processor-types";

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

export const useCodexValidation = (): ValidationHooks => {
  return {
    preValidate: (data: unknown) => typeof data === "object" && data !== null,
    postValidate: (result: boolean) => {
      // Post-validation logic
    },
  };
};

export const useProcessorValidation = (): ProcessorValidationHooks => {
  const registeredProcessors = new Map<string, ProcessorHook>();

  return {
    preValidate: async (context: PreValidateContext): Promise<boolean> => {
      for (const [name, processor] of registeredProcessors) {
        if (processor.enabled && processor.priority < 100) {
          try {
            await processor.execute(context);
          } catch (error) {
            console.error(`Pre-processor ${name} failed:`, error);
            return false;
          }
        }
      }
      return true;
    },

    postValidate: async (context: PostValidateContext): Promise<void> => {
      for (const [name, processor] of registeredProcessors) {
        if (processor.enabled && processor.priority >= 100) {
          try {
            await processor.execute(context);
          } catch (error) {
            console.warn(`Post-processor ${name} failed:`, error);
          }
        }
      }
    },

    registerProcessor: (hook: ProcessorHook): void => {
      registeredProcessors.set(hook.name, hook);
    },

    unregisterProcessor: (name: string): void => {
      registeredProcessors.delete(name);
    },
  };
};
