export interface HookConfig {
  name: string;
  enabled: boolean;
}

export interface ValidationHook {
  validate: (data: unknown) => boolean;
}

export interface FrameworkHook {
  init: () => void;
  cleanup: () => void;
}