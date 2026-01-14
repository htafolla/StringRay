export const useFrameworkInitialization = () => {
    return {
        onInit: () => {
            // Framework initialization logic
            console.log("StringRay framework initialized");
        },
        onDestroy: () => {
            // Framework cleanup logic
            console.log("StringRay framework destroyed");
        },
    };
};
//# sourceMappingURL=framework-hooks.js.map