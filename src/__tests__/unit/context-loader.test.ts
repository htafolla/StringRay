import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StrRayContextLoader, strRayContextLoader, CodexContext, CodexTerm } from '../../context-loader';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock path module
vi.mock('path', () => ({
  join: vi.fn(),
}));

describe('StrRayContextLoader', () => {
  let loader: StrRayContextLoader;
  let mockFs: any;
  let mockPath: any;

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new StrRayContextLoader();
    mockFs = vi.mocked(fs);
    mockPath = vi.mocked(path);
    
    // Reset singleton instance
    (StrRayContextLoader as any).instance = null;
    
    // Default path.join behavior
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
  });

  afterEach(() => {
    loader.clearCache();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = StrRayContextLoader.getInstance();
      const instance2 = StrRayContextLoader.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should export singleton instance', () => {
      const instance1 = StrRayContextLoader.getInstance();
      expect(strRayContextLoader).toStrictEqual(instance1);
    });
  });

  describe('loadCodexContext', () => {
    const mockCodexContent = `
# Universal Development Codex v1.2.20

**Version**: 1.2.20
**Last Updated**: 2026-01-06

### Core Terms (1-10)

#### 1. Progressive Prod-Ready Code
All code must be production-ready.

#### 2. No Patches/Boiler/Stubs/Bridge Code
Prohibit temporary patches.

#### 7. Resolve All Errors (90% Runtime Prevention)
Zero-tolerance for unresolved errors.

#### 8. Prevent Infinite Loops
Guarantee termination in all iterative processes.

#### 11. Type Safety First
Never use \`any\`, \`@ts-ignore\`, or \`@ts-expect-error\`.

**Error Prevention Target**: 99.6%
`;

    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);
    });

    it('should return error for invalid project root', async () => {
      const result = await loader.loadCodexContext('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid project root path');
    });

    it('should return cached context on subsequent calls', async () => {
      const firstResult = await loader.loadCodexContext('/test/project');
      expect(firstResult.success).toBe(true);
      
      // Second call should return cached result
      mockFs.existsSync.mockClear();
      mockFs.readFileSync.mockClear();
      
      const secondResult = await loader.loadCodexContext('/test/project');
      expect(secondResult.success).toBe(true);
      expect(mockFs.existsSync).not.toHaveBeenCalled();
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it('should load context from first available file', async () => {
      mockFs.existsSync.mockImplementation((path: string) => 
        path.includes('.strray/agents_template.md')
      );

      const result = await loader.loadCodexContext('/test/project');
      
      expect(result.success).toBe(true);
      expect(result.context).toBeDefined();
      expect(result.context!.version).toBe('1.2.20');
    });

    it('should try all file paths until one succeeds', async () => {
      let callCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        callCount++;
        return callCount === 2; // Second file exists
      });

      const result = await loader.loadCodexContext('/test/project');
      
      expect(result.success).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledTimes(2);
    });

    it('should return error when no files found', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await loader.loadCodexContext('/test/project');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid codex file found');
    });

    it('should handle file read errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = await loader.loadCodexContext('/test/project');
      
      expect(result.success).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Failed to parse');
    });

    it('should parse codex content correctly', async () => {
      const result = await loader.loadCodexContext('/test/project');
      
      expect(result.success).toBe(true);
      const context = result.context!;
      
      expect(context.version).toBe('1.2.20');
      expect(context.errorPreventionTarget).toBe(0.996);
      expect(context.terms.size).toBeGreaterThan(0);
      expect(context.interweaves).toContain('Error Prevention Interweave');
    });
  });

  describe('parseCodexContent', () => {
    it('should throw error for invalid content', () => {
      expect(() => {
        loader['parseCodexContent']('', 'test.md');
      }).toThrow('Invalid content provided');
    });

    it('should throw error for invalid source path', () => {
      expect(() => {
        loader['parseCodexContent']('content', '');
      }).toThrow('Invalid source path provided');
    });

    it('should parse version correctly', () => {
      const content = `
# Universal Development Codex v1.2.21
**Version**: 1.2.21
`;
      const context = loader['parseCodexContent'](content, 'test.md');
      expect(context.version).toBe('1.2.21');
    });

    it('should parse error prevention target', () => {
      const content = '**Error Prevention Target**: 95.5%';
      const context = loader['parseCodexContent'](content, 'test.md');
      expect(context.errorPreventionTarget).toBe(0.955);
    });

    it('should parse codex terms correctly', () => {
      const content = `
#### 1. Test Term One
This is the first term description.

#### 2. Test Term Two  
This is the second term description.

#### 11. Extended Term
This is an extended term.
`;

      const context = loader['parseCodexContent'](content, 'test.md');
      
      expect(context.terms.size).toBe(3);
      
      const term1 = context.terms.get(1);
      expect(term1).toBeDefined();
      expect(term1!.number).toBe(1);
      expect(term1!.description).toBe('This is the first term description.');
      expect(term1!.category).toBe('core');

      const term11 = context.terms.get(11);
      expect(term11!.category).toBe('extended');
    });

    it('should infer term categories correctly', () => {
      const content = `
#### 1. Core Term
#### 15. Extended Term
#### 25. Architecture Term
#### 35. Advanced Term
`;

      const context = loader['parseCodexContent'](content, 'test.md');
      
      expect(context.terms.get(1)!.category).toBe('core');
      expect(context.terms.get(15)!.category).toBe('extended');
      expect(context.terms.get(25)!.category).toBe('architecture');
      expect(context.terms.get(35)!.category).toBe('advanced');
    });

    it('should set enforcement levels correctly', () => {
      const content = `
#### 7. Zero Tolerance Term
Blocking level term.

#### 8. Another Zero Tolerance Term
Also blocking.

#### 11. High Enforcement Term
High level term.
`;

      const context = loader['parseCodexContent'](content, 'test.md');
      
      expect(context.terms.get(7)!.zeroTolerance).toBe(true);
      expect(context.terms.get(7)!.enforcementLevel).toBe('blocking');
      expect(context.terms.get(8)!.zeroTolerance).toBe(true);
      expect(context.terms.get(11)!.enforcementLevel).toBe('low'); // Default
    });

    it('should parse interweaves and lenses', () => {
      const content = `
## Error Prevention Interweave
Some content here.

## Code Quality Lens
More content.

## Performance Lens
Even more content.
`;

      const context = loader['parseCodexContent'](content, 'test.md');
      
      expect(context.interweaves).toContain('Error Prevention Interweave');
      expect(context.lenses).toContain('Code Quality Lens');
      expect(context.lenses).toContain('Performance Lens');
    });

    it('should parse validation criteria', () => {
      const content = `
### Code Completeness
- [ ] All functions have implementations
- [ ] No TODO comments in production code
- [ ] All error paths are handled
`;

      const context = loader['parseCodexContent'](content, 'test.md');
      
      expect(context.validationCriteria['All functions have implementations']).toBe(false);
      expect(context.validationCriteria['No TODO comments in production code']).toBe(false);
    });

    it('should fill missing core terms', () => {
      const content = `
#### 5. Term Five
Description for term 5.
`;

      const context = loader['parseCodexContent'](content, 'test.md');
      
      // Should have terms 1-10 even if not in content
      for (let i = 1; i <= 10; i++) {
        expect(context.terms.has(i)).toBe(true);
      }
    });
  });

  describe('getTerm', () => {
    let context: CodexContext;

    beforeEach(async () => {
      const result = await loader.loadCodexContext('/test/project');
      context = result.context!;
    });

    it('should return correct term by number', () => {
      const term = loader.getTerm(context, 1);
      expect(term).toBeDefined();
      expect(term!.number).toBe(1);
    });

    it('should return undefined for non-existent terms', () => {
      const term = loader.getTerm(context, 999);
      expect(term).toBeUndefined();
    });
  });

  describe('getCoreTerms', () => {
    let context: CodexContext;

    beforeEach(async () => {
      const result = await loader.loadCodexContext('/test/project');
      context = result.context!;
    });

    it('should return only core terms', () => {
      const coreTerms = loader.getCoreTerms(context);
      
      expect(coreTerms.length).toBeGreaterThan(0);
      coreTerms.forEach(term => {
        expect(term.category).toBe('core');
      });
    });

    it('should sort terms by number', () => {
      const coreTerms = loader.getCoreTerms(context);
      
      for (let i = 1; i < coreTerms.length; i++) {
        expect(coreTerms[i].number).toBeGreaterThan(coreTerms[i - 1].number);
      }
    });
  });

  describe('getZeroToleranceTerms', () => {
    let context: CodexContext;

    beforeEach(async () => {
      const result = await loader.loadCodexContext('/test/project');
      context = result.context!;
    });

    it('should return terms with zero tolerance or blocking enforcement', () => {
      const zeroToleranceTerms = loader.getZeroToleranceTerms(context);
      
      zeroToleranceTerms.forEach(term => {
        expect(term.zeroTolerance || term.enforcementLevel === 'blocking').toBe(true);
      });
    });
  });

  describe('validateAgainstCodex', () => {
    let context: CodexContext;

    beforeEach(async () => {
      const result = await loader.loadCodexContext('/test/project');
      context = result.context!;
    });

    it('should throw error for invalid context', () => {
      expect(() => {
        loader.validateAgainstCodex(null as any, 'test', {});
      }).toThrow('Invalid codex context provided');
    });

    it('should throw error for invalid action', () => {
      expect(() => {
        loader.validateAgainstCodex(context, '', {});
      }).toThrow('Invalid action provided');
    });

    it('should detect type safety violations', () => {
      const result = loader.validateAgainstCodex(context, 'test', {
      });

      expect(result.compliant).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].term.number).toBe(11);
    });

    it('should detect unresolved tasks', () => {
      const result = loader.validateAgainstCodex(context, 'test', {
        code: 'TODO: fix this later\nFIXME: another issue\nXXX: temp code'
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.term.number === 7)).toBe(true);
    });

    it('should detect over-engineered solutions', () => {
      const result = loader.validateAgainstCodex(context, 'test', {
        isOverEngineered: true
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.term.number === 3)).toBe(true);
      expect(result.recommendations).toContain('Simplify the solution');
    });

    it('should detect infinite loops', () => {
      const result = loader.validateAgainstCodex(context, 'test', {
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some(v => v.term.number === 8)).toBe(true);
      expect(result.recommendations).toContain('Add clear termination conditions');
    });

    it('should return compliant for valid code', () => {
      const result = loader.validateAgainstCodex(context, 'valid action', {
      });

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('cache management', () => {
    it('should clear cache correctly', async () => {
      await loader.loadCodexContext('/test/project');
      expect(loader.isContextLoaded()).toBe(true);

      loader.clearCache();
      expect(loader.isContextLoaded()).toBe(false);
    });
  });

  describe('context statistics', () => {
    it('should return correct stats when loaded', async () => {
      await loader.loadCodexContext('/test/project');
      const stats = loader.getContextStats();

      expect(stats.loaded).toBe(true);
      expect(stats.termCount).toBeGreaterThan(0);
      expect(typeof stats.categoryBreakdown).toBe('object');
      expect(typeof stats.zeroToleranceCount).toBe('number');
    });

    it('should return empty stats when not loaded', () => {
      const stats = loader.getContextStats();

      expect(stats.loaded).toBe(false);
      expect(stats.termCount).toBe(0);
      expect(stats.zeroToleranceCount).toBe(0);
    });
  });
});
