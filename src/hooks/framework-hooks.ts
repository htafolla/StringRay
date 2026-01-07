export interface FrameworkHooks {
  onInit: () => void;
  onDestroy: () => void;
}

export const useFrameworkInitialization = (): FrameworkHooks => {
  return {
    onInit: () => console.log('Framework initialized'),
    onDestroy: () => console.log('Framework destroyed'),
  };
};