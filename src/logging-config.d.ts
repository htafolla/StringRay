export interface LoggingConfig {
    enabled: boolean;
    level: "debug" | "info" | "warn" | "error";
    destinations: ("console" | "file" | "monitoring")[];
    performanceMode: boolean;
}
export declare function getLoggingConfig(): LoggingConfig;
export declare function setLoggingConfig(config: Partial<LoggingConfig>): void;
export declare function isLoggingEnabled(): boolean;
export declare function shouldLog(level: string): boolean;
//# sourceMappingURL=logging-config.d.ts.map