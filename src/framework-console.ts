import { isLoggingEnabled } from "./logging-config.js";

// Framework-aware console logging that respects logging configuration
export const frameworkConsole = {
  log: (...args: any[]) => {
    if (isLoggingEnabled()) {
      console.log(...args);
    }
  },
  info: (...args: any[]) => {
    if (isLoggingEnabled()) {
      console.info(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isLoggingEnabled()) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if (isLoggingEnabled()) {
      console.error(...args);
    }
  },
};

// Export for use throughout the framework
export default frameworkConsole;
