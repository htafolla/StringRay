export interface FrameworkHooks {
  onInit: () => void;
  onDestroy: () => void;
}

export const useFrameworkInitialization = (): FrameworkHooks => {
  return {
    onInit: () => {
      // Framework initialization logic
      console.log("StrRay framework initialized");
    },
    onDestroy: () => {
      // Framework cleanup logic
      console.log("StrRay framework destroyed");
    },
  };
};
