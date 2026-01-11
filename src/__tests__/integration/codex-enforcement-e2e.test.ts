/**
 * End-to-End Enforcement Testing
 *
 * Validates that codex enforcement works correctly in production builds
 * Tests the complete pipeline: operation → processor → rule enforcer → blocking
 */

import { ruleEnforcer } from "../../enforcement/rule-enforcer.js";

describe("Codex Enforcement E2E", () => {
  describe("Over-Engineering Detection", () => {
    it("should block over-engineered code with excessive abstractions", async () => {
      const overEngineeredCode = `
        class AbstractFactoryStrategyObserver implements Strategy, Observer, Decorator {
          private observers: Observer[] = [];
          private strategies: Map<string, any> = new Map();

          executeComplex(data: any): any {
            if (data) {
              if (data.type === 'strategy') {
                if (data.config) {
                  if (data.config.enabled) {
                    return this.createStrategy(data.config);
                  }
                }
              }
            }
            return null;
          }

          private createStrategy(config: any): any {
            if (config.type === 'advanced') {
              return new AdvancedStrategy();
            } else if (config.type === 'basic') {
              return new BasicStrategy();
            } else {
              return new DefaultStrategy();
            }
          }
        }
      `;

      const result = await ruleEnforcer.validateOperation("write", {
        operation: "write",
        newCode: overEngineeredCode,
        files: ["src/over-engineered.ts"],
      });

      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some(
          (error) =>
            error.includes("over-engineering") || error.includes("nesting"),
        ),
      ).toBe(true);
    });

    it("should allow simple, well-structured code", async () => {
      const simpleCode = `
        export class UserService {
          private users: Map<string, User> = new Map();

          createUser(name: string, email: string): User {
            if (!name || !email) {
              throw new Error('Name and email required');
            }
            const user = { id: Date.now().toString(), name, email };
            this.users.set(user.id, user);
            return user;
          }

          getUser(id: string): User | undefined {
            return this.users.get(id);
          }
        }

        interface User {
          id: string;
          name: string;
          email: string;
        }
      `;

      const result = await ruleEnforcer.validateOperation("write", {
        operation: "write",
        newCode: simpleCode,
        files: ["src/simple-service.ts"],
      });

      expect(result.passed).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe("Error Resolution Enforcement", () => {
    it("should block improper error handling", async () => {
      const badErrorCode = `
        function processData() {
          try {
            riskyOperation();
          } catch (error) {
            console.log(error); // Improper error handling
          }
        }
      `;

      const result = await ruleEnforcer.validateOperation("write", {
        operation: "write",
        newCode: badErrorCode,
        files: ["src/bad-errors.ts"],
      });

      expect(result.passed).toBe(false);
      expect(
        result.errors.some(
          (error) => error.includes("error") || error.includes("console.log"),
        ),
      ).toBe(true);
    });
  });

  describe("Infinite Loop Prevention", () => {
    it("should block infinite loops", async () => {
      const infiniteLoopCode = `
        function badFunction() {
          while (true) { // Infinite loop
            console.log('forever');
          }
        }
      `;

      const result = await ruleEnforcer.validateOperation("write", {
        operation: "write",
        newCode: infiniteLoopCode,
        files: ["src/infinite-loop.ts"],
      });

      expect(result.passed).toBe(false);
      expect(
        result.errors.some(
          (error) => error.includes("infinite") || error.includes("loop"),
        ),
      ).toBe(true);
    });
  });

  describe("State Management Patterns", () => {
    it("should block global state abuse", async () => {
      const globalStateCode = `
        class BadService {
          static globalCounter = 0; // Global state

          updateUI() {
            document.getElementById('counter').innerHTML = BadService.globalCounter; // DOM manipulation
          }
        }
      `;

      const result = await ruleEnforcer.validateOperation("write", {
        operation: "write",
        newCode: globalStateCode,
        files: ["src/global-state.ts"],
      });

      expect(result.passed).toBe(false);
      expect(
        result.errors.some(
          (error) => error.includes("state") || error.includes("global"),
        ),
      ).toBe(true);
    });
  });

  describe("Rule Statistics", () => {
    it("should provide accurate rule statistics", () => {
      const stats = ruleEnforcer.getRuleStats();

      expect(stats.totalRules).toBeGreaterThan(8); // Should have our new rules
      expect(stats.enabledRules).toBeGreaterThan(0);
      expect(stats.ruleCategories).toBeDefined();
      expect(stats.ruleCategories["architecture"]).toBeGreaterThan(2); // Should have our new architecture rules
    });

    it("should have all critical rules registered", () => {
      const stats = ruleEnforcer.getRuleStats();

      // Should have the critical rules we added
      expect(stats.totalRules).toBe(11); // 8 original + 3 new
      expect(Object.keys(stats.ruleCategories)).toContain("architecture");
      expect(Object.keys(stats.ruleCategories)).toContain("code-quality");
      expect(Object.keys(stats.ruleCategories)).toContain("security");
    });
  });
});
