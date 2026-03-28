/**
 * Security Validators Tests
 *
 * Comprehensive test suite for security validators extracted during Phase 3 refactoring.
 * Tests cover input validation patterns, security vulnerabilities, and edge cases.
 *
 * @module validators/__tests__/security-validators
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  InputValidationValidator,
  SecurityByDesignValidator,
} from "../security-validators.js";
import { RuleValidationContext } from "../../types.js";

describe("InputValidationValidator", () => {
  let validator: InputValidationValidator;

  beforeEach(() => {
    validator = new InputValidationValidator();
  });

  describe("metadata", () => {
    it("should have correct validator metadata", () => {
      expect(validator.id).toBe("input-validation-validator");
      expect(validator.ruleId).toBe("input-validation");
      expect(validator.category).toBe("security");
      expect(validator.severity).toBe("blocking");
    });
  });

  describe("basic validation", () => {
    it("should pass when no code is provided", async () => {
      const context: RuleValidationContext = {
        operation: "write",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for input validation");
    });

    it("should pass when operation is not write", async () => {
      const context: RuleValidationContext = {
        operation: "read",
        newCode: "function test() { return req.body.name; }",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for input validation");
    });

    it("should pass for internal utility functions", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function internalHelper(data) {
            return data.trim();
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe(
        "Internal utility functions may skip validation",
      );
    });

    it("should pass for helper functions", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function utilityParse(input) {
            return JSON.parse(input);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });

  describe("user input validation", () => {
    it("should fail when req.body is used without validation", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function processRequest(req) {
            return req.body.name;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toBe("User input handling requires validation");
      expect(result.suggestions).toContain("Add input validation");
      expect(result.suggestions).toContain("Sanitize user inputs");
    });

    it("should fail when req.query is used without validation", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function handleQuery(req) {
            return req.query.search;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toBe("User input handling requires validation");
    });

    it("should pass when validation is present with req.body", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function processRequest(req) {
            const validated = validate(req.body);
            return validated.name;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("Input validation implemented where needed");
    });

    it("should pass when sanitize is used with req.query", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function handleQuery(req) {
            return sanitize(req.query.search);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should pass when zod is used for validation", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          import { z } from 'zod';
          function processRequest(req) {
            const schema = z.object({ name: z.string() });
            return schema.parse(req.body);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should pass when joi is used for validation", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          import Joi from 'joi';
          function processRequest(req) {
            const schema = Joi.object({ name: Joi.string() });
            return schema.validate(req.body);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });

  describe("parameter validation", () => {
    it("should fail when function parameters lack validation", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function processData(input: string) {
            return input.toUpperCase();
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("lacks input validation for parameters");
      expect(result.suggestions).toContain("Add parameter validation");
    });

    it("should pass when function has if statements for validation", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function processData(input: string) {
            if (!input) {
              throw new Error("Input required");
            }
            return input.toUpperCase();
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should pass when function has throw for validation", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function processData(input: any) {
            if (typeof input !== 'string') {
              throw new Error("Invalid input");
            }
            return input.toUpperCase();
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should handle arrow functions with parameters", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          const processData = (input: string) => {
            return input.toUpperCase();
          }
        `,
      };

      const result = await validator.validate(context);

      // Should detect lack of validation in arrow function
      expect(result.passed).toBe(false);
      expect(result.message).toContain("lacks input validation for parameters");
    });
  });

  describe("edge cases", () => {
    it("should pass when no functions with parameters exist", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          const config = {
            port: 3000,
            host: 'localhost'
          };
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No functions with parameters to validate");
    });

    it("should handle multiple functions correctly", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function validFunction(input: string) {
            if (!input) throw new Error("Required");
            return input;
          }
          
          function anotherValid(data: any) {
            if (data) return data;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });
});

describe("SecurityByDesignValidator", () => {
  let validator: SecurityByDesignValidator;

  beforeEach(() => {
    validator = new SecurityByDesignValidator();
  });

  describe("metadata", () => {
    it("should have correct validator metadata", () => {
      expect(validator.id).toBe("security-by-design-validator");
      expect(validator.ruleId).toBe("security-by-design");
      expect(validator.category).toBe("security");
      expect(validator.severity).toBe("blocking");
    });
  });

  describe("basic validation", () => {
    it("should pass when no code is provided", async () => {
      const context: RuleValidationContext = {
        operation: "write",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for security");
    });

    it("should pass when operation is not write", async () => {
      const context: RuleValidationContext = {
        operation: "delete",
        newCode: "const password = 'secret123';",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
      expect(result.message).toBe("No code to validate for security");
    });
  });

  describe("user input without validation", () => {
    it("should fail when req.body is used without validation", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          app.post('/api', (req, res) => {
            const data = req.body;
            res.json(data);
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain(
        "User input handling detected without validation",
      );
      expect(result.suggestions).toContain("Add input validation and sanitization");
    });

    it("should pass when validation framework is used", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          app.post('/api', (req, res) => {
            const data = validate(req.body);
            res.json(data);
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should pass when sanitize is used", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          app.post('/api', (req, res) => {
            const data = sanitize(req.body.input);
            res.json(data);
          });
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should skip validation for internal contexts", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function internalProcess(req) {
            return req.body.data;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should skip validation for performance contexts", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function optimizedHandler(req) {
            return req.body.data;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });

  describe("SQL injection prevention", () => {
    it("should detect SQL injection with template literals", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function getUser(id) {
            return db.query(\`SELECT * FROM users WHERE id = \${id}\`);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("SQL injection vulnerability");
      expect(result.suggestions).toContain(
        "Use parameterized queries or prepared statements",
      );
    });

    it("should detect SQL injection with string concatenation", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function searchUsers(name) {
            return db.query("SELECT * FROM users WHERE name = '" + name + "'");
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("SQL injection vulnerability");
    });

    it("should pass with parameterized queries", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function getUser(id) {
            return db.query('SELECT * FROM users WHERE id = ?', [id]);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });

  describe("XSS prevention", () => {
    it("should detect innerHTML with user input", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function displayContent(userContent) {
            element.innerHTML = userContent;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("XSS vulnerability");
      expect(result.suggestions).toContain("Avoid using innerHTML with user input");
    });

    it("should detect document.write with user input", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function renderPage(content) {
            document.write(content);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("XSS vulnerability");
    });

    it("should detect eval usage", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function executeCode(code) {
            eval(code);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("XSS vulnerability");
    });

    it("should pass when using textContent", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function displayContent(userContent) {
            element.textContent = userContent;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });

  describe("credential security", () => {
    it("should detect short hardcoded passwords", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          const config = {
            password: '123456'
          };
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("credential");
      expect(result.suggestions).toContain("Use environment variables for credentials");
    });

    it("should detect short hardcoded tokens", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          const apiConfig = {
            token: 'abc123'
          };
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("credential");
    });

    it("should detect hardcoded secrets", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          const secret = 'mysecretkey';
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("credential");
    });

    it("should pass with environment variables", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          const config = {
            password: process.env.DB_PASSWORD,
            token: process.env.API_TOKEN
          };
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });

  describe("cryptographic randomness", () => {
    it("should detect Math.random for security tokens", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function generateToken() {
            return Math.random().toString(36);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Math.random()");
      expect(result.suggestions).toContain(
        "Use crypto.randomBytes() or crypto.randomUUID() for security tokens",
      );
    });

    it("should detect Math.random for passwords", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function generatePassword() {
            return Math.random().toString(36).slice(2);
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Math.random()");
    });

    it("should pass when using crypto module", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          import { randomBytes } from 'crypto';
          function generateToken() {
            return randomBytes(32).toString('hex');
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should pass Math.random in non-security contexts", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function getRandomColor() {
            return Math.random() * 255;
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });

  describe("multiple violations", () => {
    it("should report all security violations", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          function insecureHandler(req) {
            const token = 'short';
            db.query(\`SELECT * FROM users WHERE id = \${req.body.id}\`);
            return Math.random();
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain("Security violations:");
      // Should contain multiple violations
      expect(result.message!.length).toBeGreaterThan(20);
    });
  });

  describe("edge cases", () => {
    it("should handle empty code", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: "",
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should handle code with only comments", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          // This is a comment
          /* Multi-line
             comment */
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });

    it("should handle complex nested code", async () => {
      const context: RuleValidationContext = {
        operation: "write",
        newCode: `
          class UserService {
            async createUser(req) {
              if (!req.body || !req.body.name) {
                throw new Error('Invalid input');
              }
              const validated = sanitize(req.body);
              return await db.query('INSERT INTO users (name) VALUES (?)', [validated.name]);
            }
          }
        `,
      };

      const result = await validator.validate(context);

      expect(result.passed).toBe(true);
    });
  });
});
