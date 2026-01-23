export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}
export interface MCPToolResult {
    content: Array<{
        type: string;
        text: string;
    }>;
}
export interface MCPClientConfig {
    serverName: string;
    command: string;
    args: string[];
    timeout?: number;
}
/**
 * MCP Client Layer
 *
 * Enables framework components to call MCP servers programmatically.
 * This implements the missing "piping" mechanism between agents and MCP servers.
 */
export declare class MCPClient {
    private config;
    private tools;
    constructor(config: MCPClientConfig);
    /**
     * Initialize MCP client by connecting to server and discovering tools
     */
    initialize(): Promise<void>;
    /**
     * Call a specific MCP server tool
     */
    callTool(toolName: string, args?: any): Promise<MCPToolResult>;
    /**
     * Get list of available tools
     */
    getAvailableTools(): MCPTool[];
    /**
     * Discover available tools from MCP server
     * In a real implementation, this would use MCP protocol to query server capabilities
     */
    private discoverTools;
    /**
     * Simulate tool execution (placeholder for real MCP protocol implementation)
     */
    private simulateToolCall;
}
/**
 * MCP Client Manager
 *
 * Manages MCP client instances and provides unified interface
 * for framework components to access MCP server capabilities
 */
export declare class MCPClientManager {
    private static instance;
    private clients;
    private constructor();
    static getInstance(): MCPClientManager;
    /**
     * Get or create MCP client for a server
     */
    getClient(serverName: string): Promise<MCPClient>;
    /**
     * Load MCP server configuration from .mcp.json
     * COMMENTED OUT: No longer loading from .mcp.json for lazy loading approach
     */
    /**
     * Create client configuration for a server
     */
    createClientConfig(serverName: string): MCPClientConfig;
    /**
     * Call MCP server tool
     */
    callServerTool(serverName: string, toolName: string, args?: any): Promise<MCPToolResult>;
    /**
     * Get all available MCP server tools
     */
    getAllAvailableTools(): Promise<Record<string, MCPTool[]>>;
}
export declare const mcpClientManager: MCPClientManager;
//# sourceMappingURL=mcp-client.d.ts.map