/**
 * MCP Server Logger
 * Provides structured logging for MCP protocol debugging with configurable levels
 */
export declare class MCPLogger {
    private serverName;
    constructor(serverName: string);
    debug(message: string, details?: any): void;
    info(message: string, details?: any): void;
    warn(message: string, details?: any): void;
    error(message: string, error?: any): void;
    private log;
}
export declare function createMCPLogger(serverName: string): MCPLogger;
//# sourceMappingURL=mcp-logger.d.ts.map