/**
 * MCP Types Tests
 * 
 * Type validation tests for MCP types.
 * Ensures type compatibility and structural correctness.
 */

import { describe, it, expect } from "vitest";
import {
  MCPClientConfig,
  MCPTool,
  MCPToolResult,
  IMcpConnection,
  IServerConfig,
  IToolRegistry,
  IProtocolHandler,
  ISimulationEngine,
  IConnectionPool,
} from "../index.js";
import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
} from "../json-rpc.types.js";
import {
  MCP_PROTOCOL_VERSION,
  JSONRPC_VERSION,
  MCP_METHODS,
  DEFAULT_TIMEOUTS,
  ERROR_CODES,
} from "../../protocol/protocol-constants.js";

describe("MCP Types", () => {
  describe("MCPClientConfig", () => {
    it("should create valid MCPClientConfig with required fields", () => {
      const config: MCPClientConfig = {
        serverName: "test-server",
        command: "node",
        args: ["server.js"],
      };

      expect(config.serverName).toBe("test-server");
      expect(config.command).toBe("node");
      expect(config.args).toEqual(["server.js"]);
      expect(config.timeout).toBeUndefined();
      expect(config.env).toBeUndefined();
      expect(config.basePath).toBeUndefined();
    });

    it("should create valid MCPClientConfig with all fields", () => {
      const config: MCPClientConfig = {
        serverName: "test-server",
        command: "node",
        args: ["server.js"],
        timeout: 30000,
        env: { NODE_ENV: "test" },
        basePath: "/path/to/server",
      };

      expect(config.timeout).toBe(30000);
      expect(config.env).toEqual({ NODE_ENV: "test" });
      expect(config.basePath).toBe("/path/to/server");
    });
  });

  describe("MCPTool", () => {
    it("should create valid MCPTool with required fields", () => {
      const tool: MCPTool = {
        name: "test-tool",
        description: "A test tool",
        inputSchema: {
          type: "object",
        },
      };

      expect(tool.name).toBe("test-tool");
      expect(tool.description).toBe("A test tool");
      expect(tool.inputSchema.type).toBe("object");
    });

    it("should create valid MCPTool with complete schema", () => {
      const tool: MCPTool = {
        name: "test-tool",
        description: "A test tool",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            count: { type: "number" },
          },
          required: ["name"],
        },
      };

      expect(tool.inputSchema.properties).toBeDefined();
      expect(tool.inputSchema.required).toEqual(["name"]);
    });
  });

  describe("MCPToolResult", () => {
    it("should create valid MCPToolResult with content", () => {
      const result: MCPToolResult = {
        content: [
          {
            type: "text",
            text: "Operation completed successfully",
          },
        ],
      };

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Operation completed successfully");
      expect(result.isError).toBeUndefined();
    });

    it("should create valid MCPToolResult with error flag", () => {
      const result: MCPToolResult = {
        content: [
          {
            type: "text",
            text: "An error occurred",
          },
        ],
        isError: true,
      };

      expect(result.isError).toBe(true);
    });

    it("should create valid MCPToolResult with data", () => {
      const result: MCPToolResult = {
        content: [
          {
            type: "data",
            data: { key: "value", count: 42 },
          },
        ],
      };

      expect(result.content[0].type).toBe("data");
      expect(result.content[0].data).toEqual({ key: "value", count: 42 });
    });
  });

  describe("JSON-RPC Types", () => {
    it("should create valid JsonRpcRequest", () => {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: { filter: "test" },
      };

      expect(request.jsonrpc).toBe("2.0");
      expect(request.id).toBe(1);
      expect(request.method).toBe("tools/list");
      expect(request.params).toEqual({ filter: "test" });
    });

    it("should create valid JsonRpcRequest with string id", () => {
      const request: JsonRpcRequest = {
        jsonrpc: "2.0",
        id: "request-123",
        method: "tools/call",
      };

      expect(request.id).toBe("request-123");
      expect(request.params).toBeUndefined();
    });

    it("should create valid JsonRpcResponse with result", () => {
      const response: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: 1,
        result: { tools: [] },
      };

      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(1);
      expect(response.result).toEqual({ tools: [] });
      expect(response.error).toBeUndefined();
    });

    it("should create valid JsonRpcResponse with error", () => {
      const error: JsonRpcError = {
        code: -32601,
        message: "Method not found",
        data: { method: "unknown" },
      };

      const response: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: 1,
        error,
      };

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32601);
      expect(response.error?.message).toBe("Method not found");
      expect(response.error?.data).toEqual({ method: "unknown" });
    });
  });

  describe("Protocol Constants", () => {
    it("should have correct MCP protocol version", () => {
      expect(MCP_PROTOCOL_VERSION).toBe("2024-11-05");
    });

    it("should have correct JSON-RPC version", () => {
      expect(JSONRPC_VERSION).toBe("2.0");
    });

    it("should have correct MCP method names", () => {
      expect(MCP_METHODS.INITIALIZE).toBe("initialize");
      expect(MCP_METHODS.TOOLS_LIST).toBe("tools/list");
      expect(MCP_METHODS.TOOLS_CALL).toBe("tools/call");
    });

    it("should have correct timeout values", () => {
      expect(DEFAULT_TIMEOUTS.CONNECTION).toBe(30000);
      expect(DEFAULT_TIMEOUTS.REQUEST).toBe(60000);
      expect(DEFAULT_TIMEOUTS.INITIALIZATION).toBe(10000);
    });

    it("should have correct error codes", () => {
      expect(ERROR_CODES.PARSE_ERROR).toBe(-32700);
      expect(ERROR_CODES.INVALID_REQUEST).toBe(-32600);
      expect(ERROR_CODES.METHOD_NOT_FOUND).toBe(-32601);
      expect(ERROR_CODES.INVALID_PARAMS).toBe(-32602);
      expect(ERROR_CODES.INTERNAL_ERROR).toBe(-32603);
      expect(ERROR_CODES.SERVER_ERROR).toBe(-32000);
    });
  });

  describe("Interface Contracts", () => {
    it("IMcpConnection interface should be implementable", () => {
      const mockConnection: IMcpConnection = {
        serverName: "test",
        isConnected: true,
        connect: async () => {},
        disconnect: async () => {},
        sendRequest: async () => ({
          jsonrpc: "2.0",
          id: 1,
          result: {},
        }),
      };

      expect(mockConnection.serverName).toBe("test");
      expect(mockConnection.isConnected).toBe(true);
      expect(typeof mockConnection.connect).toBe("function");
      expect(typeof mockConnection.disconnect).toBe("function");
      expect(typeof mockConnection.sendRequest).toBe("function");
    });

    it("IServerConfig interface should be implementable", () => {
      const mockConfig: IServerConfig = {
        serverName: "test",
        command: "node",
        args: ["server.js"],
        timeout: 30000,
        env: { KEY: "value" },
        basePath: "/path",
      };

      expect(mockConfig.timeout).toBe(30000);
    });

    it("IToolRegistry interface should be implementable", () => {
      const mockRegistry: IToolRegistry = {
        register: () => {},
        getTools: () => [],
        getTool: () => undefined,
        hasTool: () => false,
        clear: () => {},
      };

      expect(typeof mockRegistry.register).toBe("function");
      expect(typeof mockRegistry.getTools).toBe("function");
      expect(mockRegistry.getTool("server", "tool")).toBeUndefined();
    });

    it("IProtocolHandler interface should be implementable", () => {
      const mockHandler: IProtocolHandler = {
        buildInitializeRequest: () => ({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
        }),
        buildToolListRequest: () => ({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
        }),
        buildToolCallRequest: () => ({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
        }),
        parseResponse: () => ({
          jsonrpc: "2.0",
          id: 1,
          result: {},
        }),
      };

      expect(typeof mockHandler.buildInitializeRequest).toBe("function");
      expect(typeof mockHandler.parseResponse).toBe("function");
    });

    it("ISimulationEngine interface should be implementable", () => {
      const mockEngine: ISimulationEngine = {
        canSimulate: () => true,
        simulate: async () => ({
          content: [{ type: "text", text: "simulated" }],
        }),
      };

      expect(mockEngine.canSimulate("server", "tool")).toBe(true);
    });

    it("IConnectionPool interface should be implementable", async () => {
      const mockPool: IConnectionPool = {
        acquire: async () =>
          ({
            serverName: "test",
            isConnected: true,
            connect: async () => {},
            disconnect: async () => {},
            sendRequest: async () => ({ jsonrpc: "2.0", id: 1, result: {} }),
          }) as IMcpConnection,
        release: () => {},
        clear: async () => {},
      };

      expect(typeof mockPool.acquire).toBe("function");
      expect(typeof mockPool.release).toBe("function");
    });
  });
});
