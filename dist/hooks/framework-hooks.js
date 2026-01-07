export const useFrameworkInitialization = () => {
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
//# sourceMappingURL=framework-hooks.js.map