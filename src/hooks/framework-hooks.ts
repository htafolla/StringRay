export interface FrameworkHooks {
  onInit: () => void;
  onDestroy: () => void;
}

export const useFrameworkInitialization = (): FrameworkHooks => {
  return {
  };
};