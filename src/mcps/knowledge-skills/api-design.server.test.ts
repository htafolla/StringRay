/**
 * Integration tests for API Design MCP Server
 */

import { describe, it, expect, beforeEach } from "vitest";
import StrRayApiDesignServer from "./api-design.server";

describe("api-design.server integration", () => {
  describe("module exports", () => {
    it("should export a server class", () => {
      expect(StrRayApiDesignServer).toBeDefined();
      expect(typeof StrRayApiDesignServer).toBe("function");
    });

    it("should be able to instantiate the server", () => {
      const server = new StrRayApiDesignServer();
      expect(server).toBeDefined();
    });

    it("should have run method", () => {
      const server = new StrRayApiDesignServer();
      expect(typeof server.run).toBe("function");
    });
  });

  describe("server structure", () => {
    let server: StrRayApiDesignServer;

    beforeEach(() => {
      server = new StrRayApiDesignServer();
    });

    it("should instantiate correctly", () => {
      expect(server).toBeInstanceOf(StrRayApiDesignServer);
    });

    it("should have run async method", () => {
      expect(server.run).toBeInstanceOf(Function);
    });
  });
});
