/**
 * Default Agents Configuration Tests
 *
 * Tests for the centralized agent configuration.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_AGENTS,
  getDefaultAgents,
  getDefaultAgentByName,
} from "../../config/default-agents.js";

describe("default-agents", () => {
  describe("DEFAULT_AGENTS", () => {
    it("should export an array of agents", () => {
      expect(Array.isArray(DEFAULT_AGENTS)).toBe(true);
      expect(DEFAULT_AGENTS.length).toBeGreaterThan(0);
    });

    it("should have all required agent properties", () => {
      DEFAULT_AGENTS.forEach((agent) => {
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("capabilities");
        expect(agent).toHaveProperty("status");
        expect(agent).toHaveProperty("expertise");
        expect(agent).toHaveProperty("capacity");
        expect(agent).toHaveProperty("performance");
        expect(agent).toHaveProperty("specialties");
      });
    });

    it("should have active status for all agents", () => {
      DEFAULT_AGENTS.forEach((agent) => {
        expect(agent.status).toBe("active");
      });
    });

    it("should have numeric capacity and performance values", () => {
      DEFAULT_AGENTS.forEach((agent) => {
        expect(typeof agent.capacity).toBe("number");
        expect(typeof agent.performance).toBe("number");
        expect(agent.capacity).toBeGreaterThan(0);
        expect(agent.performance).toBeGreaterThan(0);
      });
    });

    it("should contain core agents", () => {
      const agentNames = DEFAULT_AGENTS.map((a) => a.name);
      expect(agentNames).toContain("enforcer");
      expect(agentNames).toContain("architect");
      expect(agentNames).toContain("orchestrator");
      expect(agentNames).toContain("code-reviewer");
      expect(agentNames).toContain("security-auditor");
    });
  });

  describe("getDefaultAgents", () => {
    it("should return the full list of agents", () => {
      const agents = getDefaultAgents();
      expect(agents).toEqual(DEFAULT_AGENTS);
      expect(agents.length).toBe(DEFAULT_AGENTS.length);
    });
  });

  describe("getDefaultAgentByName", () => {
    it("should return agent by valid name", () => {
      const agent = getDefaultAgentByName("enforcer");
      expect(agent).toBeDefined();
      expect(agent?.name).toBe("enforcer");
      expect(agent?.expertise).toBe("code quality enforcement");
    });

    it("should return undefined for invalid name", () => {
      const agent = getDefaultAgentByName("nonexistent-agent");
      expect(agent).toBeUndefined();
    });

    it("should find architect agent", () => {
      const agent = getDefaultAgentByName("architect");
      expect(agent).toBeDefined();
      expect(agent?.name).toBe("architect");
      expect(agent?.expertise).toBe("system architecture");
    });


  });
});
