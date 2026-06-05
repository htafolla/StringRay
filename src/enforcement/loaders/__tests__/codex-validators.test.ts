/**
 * Codex Loader Validator Tests
 * 
 * Tests the actual codex term validators with real codex.json
 * These tests require the real .strray/codex.json to exist
 * 
 * @module enforcement/loaders/__tests__/codex-validators.test
 */

import { describe, it, expect } from "vitest";
import { CodexLoader } from "../codex-loader.js";
import * as fs from "fs";
import * as path from "path";

const codexJsonPath = path.resolve(process.cwd(), '.strray', 'codex.json');
const codexTermsCount: number = (() => {
  try {
    const raw = JSON.parse(fs.readFileSync(codexJsonPath, 'utf-8'));
    const terms = raw.terms || raw.rules || raw.items || {};
    return typeof terms.length === 'number' ? terms.length : Object.keys(terms).length;
  } catch {
    return 0;
  }
})();

describe("CodexLoader Validators - Real Tests", () => {
  it("should load codex rules from real codex.json", async () => {
    const loader = new CodexLoader();
    const rules = await loader.load();
    expect(rules.length).toBe(codexTermsCount);
  });

  describe("Term 12: Early Returns and Guard Clauses", () => {
    it("should detect excessive nesting depth (>5 levels)", async () => {
      const loader = new CodexLoader();
      const rules = await loader.load();
      const rule = rules.find(r => r.id === "codex-12");
      
      const result = await rule!.validator({
        newCode: "function f(){\nif(a){\nif(b){\nif(c){\nif(d){\nif(e){\nif(f){\nreturn 1;}}}}}}}",
        operation: "write",
        files: []
      });
      expect(result.passed).toBe(false);
    });

    it("should pass for code with guard clauses", async () => {
      const loader = new CodexLoader();
      const rules = await loader.load();
      const rule = rules.find(r => r.id === "codex-12");
      
      const result = await rule!.validator({
        newCode: "function f() { if (!x) return error; return work(); }",
        operation: "write",
        files: []
      });
      expect(result.passed).toBe(true);
    });
  });

  describe("Term 19: Small, Focused Functions", () => {
    it("should detect functions exceeding 30 lines", async () => {
      const loader = new CodexLoader();
      const rules = await loader.load();
      const rule = rules.find(r => r.id === "codex-19");
      const longCode = "function f() {\n" + "  const x = 1;\n".repeat(35) + "}";
      
      const result = await rule!.validator({
        newCode: longCode,
        operation: "write",
        files: []
      });
      expect(result.passed).toBe(false);
    });

    it("should pass for small functions", async () => {
      const loader = new CodexLoader();
      const rules = await loader.load();
      const rule = rules.find(r => r.id === "codex-19");
      
      const result = await rule!.validator({
        newCode: "function f() { return 1; }",
        operation: "write",
        files: []
      });
      expect(result.passed).toBe(true);
    });
  });

  describe("Term 16: DRY - Don't Repeat Yourself", () => {
    it("should detect repeated code patterns", async () => {
      const loader = new CodexLoader();
      const rules = await loader.load();
      const rule = rules.find(r => r.id === "codex-16");
      
      const result = await rule!.validator({
        newCode: "const a = 1;\nconst b = 2;\nconst a = 1;\nconst b = 2;",
        operation: "write",
        files: []
      });
      expect(result.passed).toBe(false);
    });

    it("should pass for unique code", async () => {
      const loader = new CodexLoader();
      const rules = await loader.load();
      const rule = rules.find(r => r.id === "codex-16");
      
      const result = await rule!.validator({
        newCode: "const a = 1; const b = 2;",
        operation: "write",
        files: []
      });
      expect(result.passed).toBe(true);
    });
  });

  describe("Term 3: Do Not Over-Engineer", () => {
    it("should detect over-abstraction (too many interfaces vs exports)", async () => {
      const loader = new CodexLoader();
      const rules = await loader.load();
      const rule = rules.find(r => r.id === "codex-3");
      
      const result = await rule!.validator({
        newCode: "interface A{}\ninterface B{}\ninterface C{}\ninterface D{}\ninterface E{}\ninterface F{}\nexport function f() {}",
        operation: "write",
        files: []
      });
      expect(result.passed).toBe(false);
    });

    it("should pass for simple code", async () => {
      const loader = new CodexLoader();
      const rules = await loader.load();
      const rule = rules.find(r => r.id === "codex-3");
      
      const result = await rule!.validator({
        newCode: "function f() {}",
        operation: "write",
        files: []
      });
      expect(result.passed).toBe(true);
    });
  });

  describe("Term 13: Error Boundaries and Graceful Degradation", () => {
    it("should detect async without try-catch", async () => {
      const loader = new CodexLoader();
      const rules = await loader.load();
      const rule = rules.find(r => r.id === "codex-13");
      
      const result = await rule!.validator({
        newCode: "async function f() { return fetch('/').then(r => r.json()); }",
        operation: "write",
        files: []
      });
      expect(result.passed).toBe(false);
    });

    it("should pass for async with error handling", async () => {
      const loader = new CodexLoader();
      const rules = await loader.load();
      const rule = rules.find(r => r.id === "codex-13");
      
      const result = await rule!.validator({
        newCode: "async function f() { try { return await x(); } catch(e) {} }",
        operation: "write",
        files: []
      });
      expect(result.passed).toBe(true);
    });
  });
});