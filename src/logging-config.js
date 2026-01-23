// Default logging configuration
const defaultLoggingConfig = {
    enabled: process.env.STRRAY_LOGGING_ENABLED !== "false", // Default true, can be disabled
    level: process.env.STRRAY_LOG_LEVEL || "info",
    destinations: ["console", "file"],
    performanceMode: process.env.STRRAY_PERFORMANCE_MODE === "true",
};
// Available log levels in priority order (higher index = more verbose)
const LOG_LEVELS = ["debug", "info", "warn", "error"];
// Global logging configuration instance
let globalLoggingConfig = { ...defaultLoggingConfig };
export function getLoggingConfig() {
    return { ...globalLoggingConfig };
}
export function setLoggingConfig(config) {
    globalLoggingConfig = { ...globalLoggingConfig, ...config };
}
export function isLoggingEnabled() {
    return globalLoggingConfig.enabled;
}
export function shouldLog(level) {
    if (!globalLoggingConfig.enabled) {
        return false;
    }
    const currentLevelIndex = LOG_LEVELS.indexOf(globalLoggingConfig.level);
    const messageLevelIndex = LOG_LEVELS.indexOf(level);
    // If either level is not found, default to showing the message
    if (currentLevelIndex === -1 || messageLevelIndex === -1) {
        return true;
    }
    // Show message if its level is >= current configured level
    return messageLevelIndex >= currentLevelIndex;
}
// Environment variable configuration
if (process.env.STRRAY_LOGGING_ENABLED === "false") {
    setLoggingConfig({ enabled: false });
}
if (process.env.STRRAY_LOG_LEVEL) {
    setLoggingConfig({ level: process.env.STRRAY_LOG_LEVEL });
}
if (process.env.STRRAY_PERFORMANCE_MODE === "true") {
    setLoggingConfig({ performanceMode: true });
}
//# sourceMappingURL=logging-config.js.map