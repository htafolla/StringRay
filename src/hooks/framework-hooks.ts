export interface FrameworkHooks {
  onInit: () => void;
  onDestroy: () => void;
}

export const useFrameworkInitialization = (): FrameworkHooks => {
  return {
    onInit: () => {
      // Framework initialization logic
      },
    onDestroy: () => {
      // Framework cleanup logic
      },
  };
};
