/**
 * Tests for async-pattern-processor.ts
 *
 * Enforces codex term #31: Async Pattern Detection.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  AsyncPatternProcessor,
  runAsyncPatternCheck,
  type AsyncViolation,
} from "../../processors/async-pattern-processor.js";

describe("async-pattern-processor", () => {
  let processor: AsyncPatternProcessor;

  beforeEach(() => {
    processor = new AsyncPatternProcessor();
  });

  // -----------------------------------------------------------------------
  // Callback pattern detection
  // -----------------------------------------------------------------------

  describe("callback pattern detection", () => {
    it("should detect node-style err-first callback", () => {
      const content = `
fs.readFile("file.txt", function(err, data) {
  if (err) throw err;
  console.log(data);
});
`;
      expect(processor.hasCallbackPattern(content)).toBe(true);
    });

    it("should detect inline function callbacks", () => {
      const content = `
array.map( function(item) {
  return item * 2;
});
`;
      expect(processor.hasCallbackPattern(content)).toBe(true);
    });

    it("should return callbackPattern violation via checkCode", () => {
      const content = `
fs.readFile("file.txt", function(err, data) {
  if (err) throw err;
});
`;
      const violations = processor.checkCode(content);
      expect(violations.some((v) => v.type === "callbackPattern")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Long promise chain detection
  // -----------------------------------------------------------------------

  describe("long promise chain detection", () => {
    it("should detect chains with more than 3 .then() calls", () => {
      const content = `
fetch("/api")
  .then(res => res.json())
  .then(data => processData(data))
  .then(result => save(result))
  .then(() => console.log("done"))
  .catch(err => console.error(err));
`;
      expect(processor.hasLongPromiseChain(content)).toBe(true);
    });

    it("should not flag chains with 3 or fewer .then() calls", () => {
      const content = `
fetch("/api")
  .then(res => res.json())
  .then(data => processData(data))
  .then(result => save(result))
  .catch(err => console.error(err));
`;
      expect(processor.hasLongPromiseChain(content)).toBe(false);
    });

    it("should return longPromiseChain violation via checkCode", () => {
      const content = `
Promise.resolve()
  .then(() => 1)
  .then(x => x + 1)
  .then(x => x + 1)
  .then(x => x + 1);
`;
      const violations = processor.checkCode(content);
      expect(violations.some((v) => v.type === "longPromiseChain")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Missing await detection
  // -----------------------------------------------------------------------

  describe("missing await detection", () => {
    it("should detect missing await for .then() inside async function", () => {
      const content = `
async function fetchData() {
  fetch("/api")
    .then(res => res.json())
    .then(data => {
      return data;
    });
}
`;
      expect(processor.hasMissingAwait(content)).toBe(true);
    });

    it("should detect new Promise without await in async function", () => {
      const content = `
async function processData() {
  new Promise((resolve) => {
    resolve(42);
  });
}
`;
      expect(processor.hasMissingAwait(content)).toBe(true);
    });

    it("should return missingAwait violation via checkCode", () => {
      const content = `
async function bad() {
  somePromise().then(x => x);
}
`;
      const violations = processor.checkCode(content);
      expect(violations.some((v) => v.type === "missingAwait")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Clean async/await code passes
  // -----------------------------------------------------------------------

  describe("clean async/await code", () => {
    it("should pass for proper async/await usage", () => {
      const content = `
async function fetchData() {
  const response = await fetch("/api");
  const data = await response.json();
  return data;
}
`;
      const violations = processor.checkCode(content);
      expect(violations).toHaveLength(0);
    });

    it("should pass for synchronous code with no async", () => {
      const content = `
function add(a: number, b: number) {
  return a + b;
}
`;
      const violations = processor.checkCode(content);
      expect(violations).toHaveLength(0);
    });

    it("should pass for promise chain with <= 3 .then() and no async", () => {
      const content = `
fetch("/api")
  .then(res => res.json())
  .then(data => processData(data));
`;
      const violations = processor.checkCode(content);
      // No async function, so no missingAwait; chain <= 3, so no longPromiseChain
      expect(violations).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe("edge cases", () => {
    it("should handle empty code without errors", () => {
      const violations = processor.checkCode("");
      expect(violations).toHaveLength(0);
    });

    it("should handle code with no async functions", () => {
      const content = `
function syncFn() {
  return 42;
}
const x = syncFn();
`;
      expect(processor.hasMissingAwait(content)).toBe(false);
    });

    it("should handle code with only comments", () => {
      const content = `
// This is a comment
// async function fake() { .then() }
`;
      const violations = processor.checkCode(content);
      expect(violations).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Mixed callback + async detection
  // -----------------------------------------------------------------------

  describe("mixed callback/async detection", () => {
    it("should detect callbacks inside async functions", () => {
      const content = `
async function mixed() {
  fs.readFile("file.txt", function(err, data) {
    if (err) throw err;
    return data;
  });
}
`;
      expect(processor.hasMixedCallbackAsync(content)).toBe(true);
    });

    it("should return mixedCallbackAsync violation via checkCode", () => {
      const content = `
async function mixed() {
  fs.readFile("file.txt", function(err, data) {
    return data;
  });
}
`;
      const violations = processor.checkCode(content);
      expect(violations.some((v) => v.type === "mixedCallbackAsync")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Violation structure
  // -----------------------------------------------------------------------

  describe("violation structure", () => {
    it("should include required fields on violations", () => {
      const content = `
fs.readFile("file.txt", function(err, data) {
  if (err) throw err;
});
`;
      const violations = processor.checkCode(content);
      for (const v of violations) {
        expect(v).toHaveProperty("type");
        expect(v).toHaveProperty("message");
        expect(typeof v.type).toBe("string");
        expect(typeof v.message).toBe("string");
      }
    });
  });

  // -----------------------------------------------------------------------
  // runAsyncPatternCheck (standalone runner)
  // -----------------------------------------------------------------------

  describe("runAsyncPatternCheck", () => {
    it("should return success for clean code", async () => {
      const result = await runAsyncPatternCheck({
        operation: "write",
        data: "async function clean() { return await fetch('/api'); }",
        filesChanged: ["clean.ts"],
      });
      expect(result.success).toBe(true);
      expect(result.processorName).toBe("async-pattern-processor");
    });

    it("should return failure for callback pattern", async () => {
      const result = await runAsyncPatternCheck({
        operation: "write",
        data: 'fs.readFile("f", function(err, d) {});',
        filesChanged: ["bad.ts"],
      });
      expect(result.success).toBe(false);
      expect(result.result).toBeDefined();
    });
  });
});
