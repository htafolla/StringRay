export interface ValidationHooks {
  preValidate: (data: unknown) => boolean;
  postValidate: (result: boolean) => void;
}

export const useCodexValidation = (): ValidationHooks => {
  return {
    preValidate: (data: unknown) => typeof data === 'object' && data !== null,
    postValidate: (result: boolean) => {
    },
  };
};