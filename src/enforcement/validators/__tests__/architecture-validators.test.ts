/**
 * Architecture Validators Tests
 *
 * Tests for all architecture validators extracted from rule-enforcer.ts.
 *
 * @module validators/__tests__/architecture-validators
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  DependencyManagementValidator,
  SrcDistIntegrityValidator,
  ImportConsistencyValidator,
  ModuleSystemConsistencyValidator,
  ErrorResolutionValidator,
  LoopSafetyValidator,
  StateManagementPatternsValidator,
  SingleResponsibilityValidator,
} from "../architecture-validators.js";
import { RuleValidationContext } from "../../types.js";

describe("Architecture Validators", () => {
  // Helper to create context
  const createContext = (overrides: Partial<RuleValidationContext> = {}): RuleValidationContext => ({
    newCode: "",
    operation: "write",
    files: [],
    dependencies: [],
    tests: [],
    ...overrides,
  });

  describe("DependencyManagementValidator", () => {
    const validator = new DependencyManagementValidator();

    it("should validate successfully with no code", async () => {
      const context = createContext({ newCode: undefined });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("No code to validate");
    });

    it("should validate successfully with no imports", async () => {
      const context = createContext({ newCode: "const x = 1;" });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("No imports to validate");
    });

    it("should allow dynamic imports", async () => {
      const context = createContext({
        newCode: "const mod = await import('./module.js');",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("Dynamic imports are allowed");
    });

    it("should detect unused dependencies", async () => {
      const context = createContext({
        newCode: "const x = 1;",
        dependencies: ["lodash", "express"],
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Unused dependencies");
      expect(result.suggestions).toBeDefined();
    });

    it("should detect undeclared dependencies", async () => {
      const context = createContext({
        newCode: "import lodash from 'lodash';",
        dependencies: [],
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Undeclared dependencies");
    });

    it("should pass with properly declared dependencies", async () => {
      const context = createContext({
        newCode: "import lodash from 'lodash';\nimport express from 'express';",
        dependencies: ["lodash", "express"],
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("Dependencies properly declared");
    });

    it("should allow relative imports without declaration", async () => {
      const context = createContext({
        newCode: "import { helper } from './helper.js';\nimport utils from '../utils/index.js';",
        dependencies: [],
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should have correct validator metadata", () => {
      expect(validator.id).toBe("dependency-management-validator");
      expect(validator.ruleId).toBe("dependency-management");
      expect(validator.category).toBe("architecture");
      expect(validator.severity).toBe("error");
    });
  });

  describe("SrcDistIntegrityValidator", () => {
    const validator = new SrcDistIntegrityValidator();

    it("should validate successfully with no files", async () => {
      const context = createContext({ files: [] });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("No files to check");
    });

    it("should detect direct edits to dist/", async () => {
      const context = createContext({
        files: ["dist/index.js", "dist/utils.js"],
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("SRC-DIST INTEGRITY VIOLATION");
      expect(result.suggestions).toContain("Make all code changes in src/ directory");
    });

    it("should detect direct edits to .opencode/plugin/", async () => {
      const context = createContext({
        files: [".opencode/plugins/my-plugin.js"],
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("SRC-DIST INTEGRITY VIOLATION");
    });

    it("should allow files in src/ directory", async () => {
      const context = createContext({
        files: ["src/index.ts", "src/utils.ts", "./src/main.ts"],
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("Src-dist integrity maintained");
    });

    it("should ignore node_modules in dist/", async () => {
      const context = createContext({
        files: ["dist/node_modules/some-package/index.js"],
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should have correct validator metadata", () => {
      expect(validator.id).toBe("src-dist-integrity-validator");
      expect(validator.ruleId).toBe("src-dist-integrity");
      expect(validator.category).toBe("architecture");
      expect(validator.severity).toBe("error");
    });
  });

  describe("ImportConsistencyValidator", () => {
    const validator = new ImportConsistencyValidator();

    it("should validate successfully with no code", async () => {
      const context = createContext({ newCode: undefined });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should validate successfully with read operation", async () => {
      const context = createContext({
        newCode: "import { x } from './module.js';",
        operation: "read",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should allow type-only imports", async () => {
      const context = createContext({
        newCode: "import type { Config } from './types.js';",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("Type-only imports are allowed");
    });

    it("should detect imports from src/ directory", async () => {
      const context = createContext({
        newCode: "import { helper } from '../src/helpers.js';",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Import from src/ directory detected");
    });

    it("should detect imports from dist/ directory", async () => {
      const context = createContext({
        newCode: "import utils from './dist/utils.js';",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Import from dist/ directory");
    });

    it("should pass with proper relative imports", async () => {
      const context = createContext({
        newCode: "import { helper } from './helpers.js';\nimport utils from '../utils.js';",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("Import patterns are consistent");
    });

    it("should have correct validator metadata", () => {
      expect(validator.id).toBe("import-consistency-validator");
      expect(validator.ruleId).toBe("import-consistency");
      expect(validator.category).toBe("architecture");
      expect(validator.severity).toBe("error");
    });
  });

  describe("ModuleSystemConsistencyValidator", () => {
    const validator = new ModuleSystemConsistencyValidator();

    it("should validate successfully with no code", async () => {
      const context = createContext({ newCode: undefined });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should validate successfully with read operation", async () => {
      const context = createContext({
        newCode: "const x = require('x');",
        operation: "read",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should detect require.main pattern", async () => {
      const context = createContext({
        newCode: "if (require.main === module) { main(); }",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("require.main pattern");
    });

    it("should detect require() calls", async () => {
      const context = createContext({
        newCode: "const lodash = require('lodash');",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("CommonJS require() calls detected");
    });

    it("should detect __dirname usage", async () => {
      const context = createContext({
        newCode: "const path = __dirname + '/file.js';",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("__dirname/__filename usage");
    });

    it("should detect __filename usage", async () => {
      const context = createContext({
        newCode: "console.log(__filename);",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("__dirname/__filename usage");
    });

    it("should detect module.exports", async () => {
      const context = createContext({
        newCode: "module.exports = { foo: 'bar' };",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("module.exports pattern");
    });

    it("should detect exports.*", async () => {
      const context = createContext({
        newCode: "exports.foo = function() {};",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("module.exports pattern");
    });

    it("should detect global namespace usage", async () => {
      const context = createContext({
        newCode: "global.myVar = 'value';",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Global namespace usage detected");
    });

    it("should detect mixed module patterns", async () => {
      const context = createContext({
        newCode: `
          import { helper } from './helper.js';
          const x = require('x');
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Mixed ES module and CommonJS patterns");
    });

    it("should detect ES module package using CommonJS", async () => {
      const context = createContext({
        newCode: `
          "type": "module"
          const x = require('x');
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("ES module package using CommonJS patterns");
    });

    it("should pass with pure ES modules", async () => {
      const context = createContext({
        newCode: `
          import { helper } from './helper.js';
          export function foo() { return helper(); }
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("ES modules only");
    });

    it("should have correct validator metadata", () => {
      expect(validator.id).toBe("module-system-consistency-validator");
      expect(validator.ruleId).toBe("module-system-consistency");
      expect(validator.category).toBe("architecture");
      expect(validator.severity).toBe("error");
    });
  });

  describe("ErrorResolutionValidator", () => {
    const validator = new ErrorResolutionValidator();

    it("should validate successfully with no code", async () => {
      const context = createContext({ newCode: undefined });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should validate successfully with read operation", async () => {
      const context = createContext({
        newCode: "console.log('test');",
        operation: "read",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should detect console.log statements", async () => {
      const context = createContext({
        newCode: "console.log('debug message');",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("console.log");
      expect(result.suggestions).toContain(
        "Replace console.log with proper logging framework (frameworkLogger)"
      );
    });

    it("should detect async operations without try-catch", async () => {
      const context = createContext({
        newCode: `
          async function fetchData() {
            const result = await fetch('/api');
            return result.json();
          }
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Async operations without error handling");
    });

    it("should pass async operations with try-catch", async () => {
      const context = createContext({
        newCode: `
          async function fetchData() {
            try {
              const result = await fetch('/api');
              return result.json();
            } catch (error) {
              throw error;
            }
          }
        `,
      });
      const result = await validator.validate(context);

      // Should pass because it has try-catch and no console.log
      expect(result.passed).toBe(true);
      expect(result.message).toContain("properly implemented");
    });

    it("should have correct validator metadata", () => {
      expect(validator.id).toBe("error-resolution-validator");
      expect(validator.ruleId).toBe("error-resolution");
      expect(validator.category).toBe("architecture");
      expect(validator.severity).toBe("error");
    });
  });

  describe("LoopSafetyValidator", () => {
    const validator = new LoopSafetyValidator();

    it("should validate successfully with no code", async () => {
      const context = createContext({ newCode: undefined });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should validate successfully with read operation", async () => {
      const context = createContext({
        newCode: "while (true) {}",
        operation: "read",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should detect infinite for loops", async () => {
      const context = createContext({
        newCode: "for (;;) { doSomething(); }",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("infinite for loop");
    });

    it("should detect for loops with empty condition", async () => {
      const context = createContext({
        newCode: "for (let i = 0; ; i++) { doSomething(); }",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("infinite for loop");
    });

    it("should detect while(true) loops", async () => {
      const context = createContext({
        newCode: "while (true) { doSomething(); }",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("infinite while loop");
    });

    it("should detect while(1) loops", async () => {
      const context = createContext({
        newCode: "while(1) { process(); }",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("infinite while loop");
    });

    it("should allow recursive functions with base cases", async () => {
      const context = createContext({
        newCode: `
          function factorial(n) {
            if (n <= 1) return 1;
            return n * factorial(n - 1);
          }
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("proper base case allowed");
    });

    it("should detect potentially unsafe recursion", async () => {
      const context = createContext({
        newCode: `
          function recursive() {
            return recursive();
          }
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("unsafe recursion");
    });

    it("should pass with safe loops", async () => {
      const context = createContext({
        newCode: `
          for (let i = 0; i < 10; i++) {
            console.log(i);
          }
          while (condition) {
            condition = update();
          }
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("proper termination conditions");
    });

    it("should have correct validator metadata", () => {
      expect(validator.id).toBe("loop-safety-validator");
      expect(validator.ruleId).toBe("loop-safety");
      expect(validator.category).toBe("architecture");
      expect(validator.severity).toBe("error");
    });
  });

  describe("StateManagementPatternsValidator", () => {
    const validator = new StateManagementPatternsValidator();

    it("should validate successfully with no code", async () => {
      const context = createContext({ newCode: undefined });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should validate successfully with read operation", async () => {
      const context = createContext({
        newCode: "window.globalVar = 'value';",
        operation: "read",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should detect global variable assignments", async () => {
      const context = createContext({
        newCode: "window.myVar = 'value';\nglobal.otherVar = 123;",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("global variable assignments");
    });

    it("should detect direct DOM manipulation", async () => {
      const context = createContext({
        newCode: `
          document.getElementById('app').innerHTML = 'content';
          document.querySelector('.item').style.color = 'red';
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("direct DOM manipulations");
    });

    it("should detect stateful class components", async () => {
      const context = createContext({
        newCode: `
          class MyComponent extends React.Component {
            constructor() {
              this.state = { count: 0 };
            }
            render() {
              return <div>{this.state.count}</div>;
            }
          }
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Stateful class components");
    });

    it("should allow legacy class components", async () => {
      const context = createContext({
        newCode: `
          class LegacyComponent extends React.Component {
            render() { return <div>Legacy</div>; }
          }
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("Legacy patterns allowed");
    });

    it("should detect direct state mutations", async () => {
      const context = createContext({
        newCode: "state.count = state.count + 1;",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("direct state mutations");
    });

    it("should detect global state abuse", async () => {
      const context = createContext({
        newCode: `
          class GlobalStateManager {
            static global = {};
          }
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Global state abuse");
    });

    it("should pass with proper state management", async () => {
      const context = createContext({
        newCode: `
          const [count, setCount] = useState(0);
          setCount(prev => prev + 1);
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("properly implemented");
    });

    it("should have correct validator metadata", () => {
      expect(validator.id).toBe("state-management-patterns-validator");
      expect(validator.ruleId).toBe("state-management-patterns");
      expect(validator.category).toBe("architecture");
      expect(validator.severity).toBe("error");
    });
  });

  describe("SingleResponsibilityValidator", () => {
    const validator = new SingleResponsibilityValidator();

    it("should validate successfully with no code", async () => {
      const context = createContext({ newCode: undefined });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should validate successfully with read operation", async () => {
      const context = createContext({
        newCode: "class GodClass { /* many methods */ }",
        operation: "read",
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should detect classes with too many methods", async () => {
      const context = createContext({
        newCode: `
          class GodClass {
            method1() {}
            method2() {}
            method3() {}
            method4() {}
            method5() {}
            method6() {}
            method7() {}
            method8() {}
            method9() {}
            method10() {}
            method11() {}
            method12() {}
            method13() {}
            method14() {}
            method15() {}
            method16() {}
          }
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("single responsibility principle");
      expect(result.suggestions).toContain("Split class into smaller, focused classes");
    });

    it("should pass with focused classes", async () => {
      const context = createContext({
        newCode: `
          class UserService {
            getUser() {}
            updateUser() {}
            deleteUser() {}
          }
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toContain("Single responsibility principle maintained");
    });

    it("should pass with no classes", async () => {
      const context = createContext({
        newCode: `
          function helper1() {}
          function helper2() {}
          const helper3 = () => {};
        `,
      });
      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should have correct validator metadata", () => {
      expect(validator.id).toBe("single-responsibility-validator");
      expect(validator.ruleId).toBe("single-responsibility");
      expect(validator.category).toBe("architecture");
      expect(validator.severity).toBe("warning");
    });
  });
});
