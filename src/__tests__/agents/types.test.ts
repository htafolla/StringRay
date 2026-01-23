import { describe, it, expect } from "vitest";
import type {
  ToolConfig,
  PermissionConfig,
  AgentConfig,
} from "../../agents/types";

describe("Agent Types", () => {
  describe("ToolConfig", () => {
    it("should allow basic include/exclude configuration", () => {
      const config: ToolConfig = {
        include: ["*.ts", "*.tsx"],
        exclude: ["*.test.ts", "*.spec.ts"],
      };

      expect(config.include).toEqual(["*.ts", "*.tsx"]);
      expect(config.exclude).toEqual(["*.test.ts", "*.spec.ts"]);
    });

    it("should allow additional properties via index signature", () => {
      const config: ToolConfig = {
        include: ["*.js"],
        customProperty: "value",
        anotherProp: 42,
      };

      expect(config.customProperty).toBe("value");
      expect(config.anotherProp).toBe(42);
    });

    it("should allow empty configuration", () => {
      const config: ToolConfig = {};

      expect(config).toEqual({});
    });
  });

  describe("PermissionConfig", () => {
    it("should support simple permission values", () => {
      const config: PermissionConfig = {
        edit: "allow",
        bash: "deny",
        webfetch: "ask",
      };

      expect(config.edit).toBe("allow");
      expect(config.bash).toBe("deny");
      expect(config.webfetch).toBe("ask");
    });

    it("should support detailed bash command permissions", () => {
      const config: PermissionConfig = {
        bash: {
          git: "allow",
          "npm install": "ask",
          "rm -rf": "deny",
        },
      };

      expect(config.bash).toEqual({
        git: "allow",
        "npm install": "ask",
        "rm -rf": "deny",
      });
    });

    it("should allow additional permission properties", () => {
      const config: PermissionConfig = {
        edit: "allow",
        customPermission: "value",
      };

      expect(config.customPermission).toBe("value");
    });
  });

  describe("AgentConfig", () => {
    const validConfig: AgentConfig = {
      name: "test-agent",
      model: "gpt-4",
      description: "A test agent",
      mode: "primary",
      system: "You are a helpful assistant",
    };

    it("should accept minimal required configuration", () => {
      expect(validConfig.name).toBe("test-agent");
      expect(validConfig.model).toBe("gpt-4");
      expect(validConfig.description).toBe("A test agent");
      expect(validConfig.mode).toBe("primary");
      expect(validConfig.system).toBe("You are a helpful assistant");
    });

    it("should support all optional fields", () => {
      const fullConfig: AgentConfig = {
        name: "full-agent",
        model: "claude-3",
        description: "Full featured agent",
        mode: "subagent",
        system: "System prompt",
        temperature: 0.7,
        top_p: 0.9,
        tools: {
          include: ["read", "write"],
          exclude: ["dangerous"],
        },
        permission: {
          edit: "allow",
          bash: "ask",
        },
        prompt: "Custom prompt",
        prompt_append: "Additional instructions",
        disable: false,
        color: "#ff0000",
      };

      expect(fullConfig.temperature).toBe(0.7);
      expect(fullConfig.top_p).toBe(0.9);
      expect(fullConfig.tools?.include).toEqual(["read", "write"]);
      expect(fullConfig.permission?.edit).toBe("allow");
      expect(fullConfig.prompt).toBe("Custom prompt");
      expect(fullConfig.prompt_append).toBe("Additional instructions");
      expect(fullConfig.disable).toBe(false);
      expect(fullConfig.color).toBe("#ff0000");
    });

    it("should support all mode values", () => {
      const primaryConfig: AgentConfig = { ...validConfig, mode: "primary" };
      const subagentConfig: AgentConfig = { ...validConfig, mode: "subagent" };
      const allConfig: AgentConfig = { ...validConfig, mode: "all" };

      expect(primaryConfig.mode).toBe("primary");
      expect(subagentConfig.mode).toBe("subagent");
      expect(allConfig.mode).toBe("all");
    });

    it("should handle disable flag", () => {
      const enabledConfig: AgentConfig = { ...validConfig, disable: false };
      const disabledConfig: AgentConfig = { ...validConfig, disable: true };

      expect(enabledConfig.disable).toBe(false);
      expect(disabledConfig.disable).toBe(true);
    });
  });

  describe("Type Safety and Serialization", () => {
    it("should serialize and deserialize AgentConfig correctly", () => {
      const config: AgentConfig = {
        name: "serialization-test",
        model: "test-model",
        description: "Testing serialization",
        mode: "primary",
        system: "Test system",
        temperature: 0.5,
        tools: { include: ["test"] },
        permission: { edit: "allow" },
      };

      const serialized = JSON.stringify(config);
      const deserialized = JSON.parse(serialized) as AgentConfig;

      expect(deserialized.name).toBe(config.name);
      expect(deserialized.model).toBe(config.model);
      expect(deserialized.temperature).toBe(config.temperature);
      expect(deserialized.tools?.include).toEqual(config.tools?.include);
      expect(deserialized.permission?.edit).toBe(config.permission?.edit);
    });

    it("should maintain type safety with complex nested structures", () => {
      const config: AgentConfig = {
        name: "complex-agent",
        model: "advanced-model",
        description: "Complex configuration test",
        mode: "all",
        system: "Complex system",
        temperature: 0.8,
        tools: {
          include: ["read", "write", "execute"],
          exclude: ["delete", "dangerous"],
          customTool: "enabled",
          timeout: 5000,
        },
        permission: {
          edit: "allow",
          bash: {
            "git status": "allow",
            "npm test": "allow",
            sudo: "deny",
          },
          webfetch: "ask",
          customPerm: "value",
        },
        prompt: "Main prompt",
        prompt_append: "Additional context",
        disable: false,
        color: "#00ff00",
      };

      // TypeScript should enforce all these types at compile time
      expect(typeof config.name).toBe("string");
      expect(typeof config.model).toBe("string");
      expect(typeof config.description).toBe("string");
      expect(["primary", "subagent", "all"]).toContain(config.mode);
      expect(typeof config.system).toBe("string");
      expect(typeof config.temperature).toBe("number"); // This field is set in the config
      expect(Array.isArray(config.tools?.include)).toBe(true);
      expect(["ask", "allow", "deny"]).toContain(config.permission?.edit);
    });
  });
});
