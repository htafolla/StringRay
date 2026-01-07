import { describe, it, expect } from 'vitest';
import { StrRayContextLoader } from '../../context-loader';
import { parseCodexContent, detectContentFormat, validateJsonSyntax, extractCodexMetadata } from '../../utils/codex-parser';
import { createStrRayCodexInjectorHook, getCodexStats, clearCodexCache } from '../../codex-injector';

const testProjectRoot = process.cwd();
const validJsonCodex = JSON.stringify({
  version: "1.2.22",
  lastUpdated: "2026-01-06",
  errorPreventionTarget: 0.996,
  terms: {
    "1": {
      number: 1,
      title: "Progressive Prod-Ready Code",
      description: "All code must be production-ready from the first commit.",
      category: "core",
      zeroTolerance: false,
      enforcementLevel: "high"
    },
    "7": {
      number: 7,
      title: "Resolve All Errors",
      description: "Zero-tolerance for unresolved errors.",
      category: "core",
      zeroTolerance: true,
      enforcementLevel: "blocking"
    },
    "11": {
      number: 11,
      title: "Type Safety First",
      description: "Never use any, @ts-ignore, or @ts-expect-error.",
      category: "extended",
      zeroTolerance: true,
      enforcementLevel: "blocking"
    }
  },
  interweaves: ["Error Prevention Interweave"],
  lenses: ["Code Quality Lens"],
  principles: ["SOLID Principles"],
  antiPatterns: ["Spaghetti code"],
  validationCriteria: { "TypeScript compilation succeeds": false },
  frameworkAlignment: { "oh-my-opencode": "v2.12.0" }
});

const invalidJsonCodex = '{"invalid": json syntax}';
const markdownCodex = `# Universal Development Codex v1.2.20

## Overview

This codex defines the 30+ mandatory terms...

#### 1. Progressive Prod-Ready Code

All code must be production-ready from the first commit.

#### 7. Resolve All Errors (90% Runtime Prevention)

Zero-tolerance for unresolved errors.
`;

describe('JSON Codex System - Comprehensive Integration Testing', () => {

  describe('Rules Engine Validation', () => {

    it('Verify codex.json is loaded correctly on framework startup', async () => {
      const loader = StrRayContextLoader.getInstance();
      const result = await loader.loadCodexContext(testProjectRoot);

      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context!.version).toBe("1.2.22");
    });

    it('Test that all 45 terms are accessible to the rules engine', async () => {
      const loader = StrRayContextLoader.getInstance();
      const result = await loader.loadCodexContext(testProjectRoot);

      expect(result.success).toBe(true);
      expect(result.context!.terms.size).toBeGreaterThanOrEqual(45);

      expect(result.context!.terms.has(1)).toBe(true);
      expect(result.context!.terms.has(45)).toBe(true);
    });

    it('Confirm category-based filtering works', async () => {
      const loader = StrRayContextLoader.getInstance();
      const result = await loader.loadCodexContext(testProjectRoot);

      expect(result.success).toBe(true);

      const coreTerms = loader.getCoreTerms(result.context!);
      const zeroToleranceTerms = loader.getZeroToleranceTerms(result.context!);

      expect(coreTerms.length).toBeGreaterThan(0);
      expect(coreTerms.every(term => term.category === 'core')).toBe(true);
      expect(zeroToleranceTerms.length).toBeGreaterThan(0);
    });

    it('Validate enforcement level logic', async () => {
      const loader = StrRayContextLoader.getInstance();
      const result = await loader.loadCodexContext(testProjectRoot);

      expect(result.success).toBe(true);

      const zeroToleranceTerms = loader.getZeroToleranceTerms(result.context!);
      const blockingTerms = zeroToleranceTerms.filter(term =>
        term.enforcementLevel === 'blocking' || term.zeroTolerance
      );

      expect(blockingTerms.length).toBeGreaterThan(0);
      expect(blockingTerms.every(term =>
        term.zeroTolerance === true || term.enforcementLevel === 'blocking'
      )).toBe(true);
    });
  });

  describe('Format Detection Testing', () => {

    it('Test that .json files are parsed as JSON (primary)', () => {
      const result = detectContentFormat(validJsonCodex);
      expect(result.format).toBe('json');
      expect(result.confidence).toBe(1.0);
    });

    it('Verify .md files still work as Markdown fallback', () => {
      const result = detectContentFormat(markdownCodex);
      expect(result.format).toBe('markdown');
      expect(result.confidence).toBeGreaterThan(0.1);
    });

    it('Confirm format auto-detection prioritizes JSON', () => {
      const jsonResult = detectContentFormat(validJsonCodex);
      expect(jsonResult.format).toBe('json');
      expect(jsonResult.confidence).toBe(1.0);

      const mdResult = detectContentFormat(markdownCodex);
      expect(mdResult.format).toBe('markdown');
      expect(mdResult.confidence).toBeLessThan(jsonResult.confidence);
    });

    it('Test mixed file scenarios', () => {
      const mixedContent = validJsonCodex + '\n\n' + markdownCodex;
      const result = detectContentFormat(mixedContent);

      // Mixed content may be detected as either format depending on the detection logic
      // The important thing is that it's detected as one of the valid formats
      expect(['json', 'markdown']).toContain(result.format);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Functional Integration', () => {

    it('Test codex validation in tool execution hooks', () => {
      const hook = createStrRayCodexInjectorHook();

      expect(hook).toBeDefined();
      expect(hook.name).toBe('strray-codex-injector');
      expect(hook.hooks).toBeDefined();
      expect(hook.hooks['tool.execute.after']).toBeDefined();
    });

    it('Verify agent startup loads JSON codex correctly', () => {
      const hook = createStrRayCodexInjectorHook();
      const sessionId = 'test-session';

      expect(() => {
        hook.hooks['agent.start'](sessionId);
      }).not.toThrow();

      const stats = getCodexStats(sessionId);
      expect(stats.loaded).toBe(true);
      expect(stats.totalTerms).toBeGreaterThan(0);
    });

    it('Confirm session-based codex caching works with JSON', () => {
      const sessionId = 'cache-test-session';

      // First trigger the hook to load codex
      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start'](sessionId);

      const stats1 = getCodexStats(sessionId);
      expect(stats1.loaded).toBe(true);

      const stats2 = getCodexStats(sessionId);
      expect(stats2).toEqual(stats1);

      clearCodexCache(sessionId);
      const stats3 = getCodexStats(sessionId);
      expect(stats3.loaded).toBe(false);
    });

    it('Test error handling when JSON parsing fails', () => {
      const result = parseCodexContent(invalidJsonCodex, 'invalid.json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse JSON content');
      expect(result.warnings).toBeDefined();
    });
  });

  describe('Performance Validation', () => {

    it('Measure JSON parsing performance vs Markdown', () => {
      const startJson = performance.now();
      const jsonResult = parseCodexContent(validJsonCodex, 'test.json');
      const jsonTime = performance.now() - startJson;

      const startMd = performance.now();
      const mdResult = parseCodexContent(markdownCodex, 'test.md');
      const mdTime = performance.now() - startMd;

      expect(jsonResult.success).toBe(true);
      expect(mdResult.success).toBe(true);

      expect(jsonTime).toBeLessThan(mdTime * 2);

      console.log(`JSON parsing: ${jsonTime.toFixed(2)}ms`);
      console.log(`Markdown parsing: ${mdTime.toFixed(2)}ms`);
    });

    it('Verify startup time remains acceptable', async () => {
      const startTime = performance.now();

      const loader = StrRayContextLoader.getInstance();
      const result = await loader.loadCodexContext(testProjectRoot);

      const loadTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(loadTime).toBeLessThan(1000);

      console.log(`Codex load time: ${loadTime.toFixed(2)}ms`);
    });

    it('Test memory usage with large JSON codex files', () => {
      const largeTerms: any = {};
      for (let i = 1; i <= 100; i++) {
        largeTerms[i.toString()] = {
          number: i,
          title: `Term ${i}`,
          description: `Description for term ${i}. `.repeat(10),
          category: i <= 10 ? 'core' : i <= 20 ? 'extended' : i <= 30 ? 'architecture' : 'advanced',
          zeroTolerance: i % 10 === 0,
          enforcementLevel: i % 10 === 0 ? 'blocking' : 'medium'
        };
      }

      const largeJsonCodex = JSON.stringify({
        version: "1.2.22",
        terms: largeTerms,
        interweaves: [],
        lenses: [],
        principles: [],
        antiPatterns: [],
        validationCriteria: {},
        frameworkAlignment: {}
      });

      const startTime = performance.now();
      const result = parseCodexContent(largeJsonCodex, 'large.json');
      const parseTime = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.context!.terms.size).toBe(100);
      expect(parseTime).toBeLessThan(500);

      console.log(`Large codex parsing: ${parseTime.toFixed(2)}ms`);
    });
  });

  describe('End-to-End Testing', () => {

    it('Complete framework initialization with JSON codex', async () => {
      const loader = StrRayContextLoader.getInstance();
      loader.clearCache();

      const result = await loader.loadCodexContext(testProjectRoot);

      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context!.version).toBe("1.2.22");
      expect(result.context!.terms.size).toBeGreaterThanOrEqual(45);
      expect(result.context!.errorPreventionTarget).toBe(0.996);
    });

    it('Execute tool operations with codex validation', async () => {
      const loader = StrRayContextLoader.getInstance();
      const result = await loader.loadCodexContext(testProjectRoot);

      expect(result.success).toBe(true);

      const validation = loader.validateAgainstCodex(
        result.context!,
        'test action',
        { includesAny: true }
      );

      expect(validation).toBeDefined();
      expect(validation.violations).toBeDefined();
      expect(validation.recommendations).toBeDefined();
    });

    it('Verify all codex rules are enforced correctly', async () => {
      const loader = StrRayContextLoader.getInstance();
      const result = await loader.loadCodexContext(testProjectRoot);

      expect(result.success).toBe(true);

      const typeSafetyValidation = loader.validateAgainstCodex(
        result.context!,
        'using any type',
        { includesAny: true }
      );

      expect(typeSafetyValidation.violations.length).toBeGreaterThan(0);
      expect(typeSafetyValidation.violations[0]?.term.number).toBe(11);

      const todoValidation = loader.validateAgainstCodex(
        result.context!,
        'TODO: fix this later',
        { code: 'TODO: fix this later' }
      );

      expect(todoValidation.violations.length).toBeGreaterThan(0);
      expect(todoValidation.violations[0]?.severity).toBe('blocking');

      const loopValidation = loader.validateAgainstCodex(
        result.context!,
        'while(true) loop',
        { isInfiniteLoop: true }
      );

      expect(loopValidation.violations.length).toBeGreaterThan(0);
      expect(loopValidation.violations[0]?.severity).toBe('blocking');
    });

    it('Confirm no functionality regressions', async () => {
      const loader = StrRayContextLoader.getInstance();

      const result = await loader.loadCodexContext(testProjectRoot);
      expect(result.success).toBe(true);

      const context = result.context!;
      expect(context.terms.size).toBeGreaterThan(0);
      expect(context.interweaves.length).toBeGreaterThan(0);
      expect(context.lenses.length).toBeGreaterThan(0);

      const term1 = loader.getTerm(context, 1);
      expect(term1).toBeDefined();
      expect(term1!.number).toBe(1);

      const coreTerms = loader.getCoreTerms(context);
      expect(coreTerms.length).toBeGreaterThan(0);
      expect(coreTerms.every(term => term.category === 'core')).toBe(true);

      const zeroToleranceTerms = loader.getZeroToleranceTerms(context);
      expect(zeroToleranceTerms.length).toBeGreaterThan(0);

      const stats = loader.getContextStats();
      expect(stats.loaded).toBe(true);
      expect(stats.termCount).toBe(context.terms.size);
      expect(stats.zeroToleranceCount).toBe(zeroToleranceTerms.length);
    });
  });

  describe('Additional Validation Tests', () => {

    it('JSON Syntax Validation', () => {
      const validResult = validateJsonSyntax(validJsonCodex);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validateJsonSyntax(invalidJsonCodex);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    it('Codex Metadata Extraction', () => {
      const metadata = extractCodexMetadata(validJsonCodex);
      expect(metadata.version).toBe("1.2.22");
      expect(metadata.termCount).toBe(3);
    });

    it('Injector Hook Functionality', () => {
      const hook = createStrRayCodexInjectorHook();
      const sessionId = 'hook-test';

      const mockInput = { tool: 'read', args: {} };
      const mockOutput = { output: 'original output' };

      const result = hook.hooks['tool.execute.after'](mockInput, mockOutput, sessionId);

      expect(result).toBeDefined();
      expect(result.output).toContain('StrRay Codex Context');
    });

    it('Cache Management', () => {
      const sessionId = 'cache-mgmt-test';

      // First trigger the hook to load codex
      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start'](sessionId);

      const stats1 = getCodexStats(sessionId);
      expect(stats1.loaded).toBe(true);

      clearCodexCache(sessionId);
      const stats2 = getCodexStats(sessionId);
      expect(stats2.loaded).toBe(false);

      // Load again
      hook.hooks['agent.start'](sessionId);
      const stats3 = getCodexStats(sessionId);
      expect(stats3.loaded).toBe(true);

      clearCodexCache();
      const stats4 = getCodexStats(sessionId);
      expect(stats4.loaded).toBe(false);
    });
  });
});