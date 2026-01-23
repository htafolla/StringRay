import { isLoggingEnabled } from "./logging-config";
// Framework-aware console logging that respects logging configuration
export const frameworkConsole = {
    log: (...args) => {
        if (isLoggingEnabled()) {
            console.log(...args);
        }
    },
    info: (...args) => {
        if (isLoggingEnabled()) {
            console.info(...args);
        }
    },
    warn: (...args) => {
        if (isLoggingEnabled()) {
            console.warn(...args);
        }
    },
    error: (...args) => {
        if (isLoggingEnabled()) {
            console.error(...args);
        }
    },
};
// Export for use throughout the framework
export default frameworkConsole;
//# sourceMappingURL=framework-console.js.map