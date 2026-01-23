/**
 * StringRay Framework Activation Module
 *
 * This module handles activation of StringRay framework components
 * during oh-my-opencode initialization.
 */
export interface StringRayActivationConfig {
    enableOrchestrator: boolean;
    enableBootOrchestrator: boolean;
    enableStateManagement: boolean;
    enableHooks: boolean;
    enableCodexInjection: boolean;
    enableProcessors: boolean;
    enablePostProcessor: boolean;
}
export declare const defaultStringRayConfig: StringRayActivationConfig;
export declare function activateStringRayFramework(config?: Partial<StringRayActivationConfig>): Promise<void>;
//# sourceMappingURL=strray-activation.d.ts.map