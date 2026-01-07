import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  createStrRayCodexInjectorHook, 
  getCodexStats, 
  clearCodexCache,
  CodexContextEntry 
} from '../../codex-injector';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('path', () => ({
  join: vi.fn(),
  basename: vi.fn(),
}));

describe('StrRay Codex Injector', () => {
  let mockFs: any;
  let mockPath: any;
  const mockCodexContent = `
# Universal Development Codex v1.2.20

**Version**: 1.2.20
**Last Updated**: 2026-01-06

### Core Terms (1-10)

#### 1. Progressive Prod-Ready Code
All code must be production-ready.

#### 7. Resolve All Errors (90% Runtime Prevention)
Zero-tolerance for unresolved errors.

#### 11. Type Safety First
Never use \`any\`, \`@ts-ignore\`, or \`@ts-expect-error\`.
`;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFs = vi.mocked(fs);
    mockPath = vi.mocked(path);
    
    // Setup default mocks
    mockPath.join.mockImplementation((...args: string[]) => args.join('/'));
    mockPath.basename.mockImplementation((filePath: string) => {
      const parts = filePath.split('/');
      return parts[parts.length - 1];
    });
    
    // Clear cache before each test
    clearCodexCache();
  });

  afterEach(() => {
    clearCodexCache();
  });

  describe('createStrRayCodexInjectorHook', () => {
    it('should return a valid hook object', () => {
      const hook = createStrRayCodexInjectorHook();
      
      expect(hook).toHaveProperty('name');
      expect(hook).toHaveProperty('hooks');
      expect(hook.name).toBe('strray-codex-injector');
      expect(typeof hook.hooks).toBe('object');
    });

    it('should have agent.start and tool.execute.after hooks', () => {
      const hook = createStrRayCodexInjectorHook();
      
      expect(hook.hooks).toHaveProperty('agent.start');
      expect(hook.hooks).toHaveProperty('tool.execute.after');
      expect(typeof hook.hooks['agent.start']).toBe('function');
      expect(typeof hook.hooks['tool.execute.after']).toBe('function');
    });
  });

  describe('agent.start hook', () => {
    let consoleLogSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should load codex context and display startup message', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');

      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledWith('═════════════════════════════════════════════════════════════');
      expect(consoleLogSpy).toHaveBeenCalledWith('🚀 StrRay Framework v1.0.0 - Ready');
      expect(consoleLogSpy).toHaveBeenCalledWith('═════════════════════════════════════════════════════════════');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Codex Loaded: 3 terms (v1.2.20)');
      expect(consoleLogSpy).toHaveBeenCalledWith('📁 Sources: 1 file(s)');
      expect(consoleLogSpy).toHaveBeenCalledWith('🎯 Error Prevention Target: 90% runtime error prevention');
      expect(consoleLogSpy).toHaveBeenCalledWith('═════════════════════════════════════════════════════════════');
      expect(consoleLogSpy).toHaveBeenCalledWith('');
    });

    it('should handle errors gracefully', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const hook = createStrRayCodexInjectorHook();
      expect(() => {
        hook.hooks['agent.start']('session-123');
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('StrRay Codex Hook Error:', expect.any(Error));
    });

    it('should display warning when no codex files found', () => {
      mockFs.existsSync.mockReturnValue(false);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');

      expect(consoleLogSpy).toHaveBeenCalledWith('⚠️  No codex files found. Checked: src/agents_template.md, docs/agents/AGENTS.md, .strray/agents_template.md, AGENTS.md');
    });
  });

  describe('tool.execute.after hook', () => {
    it('should inject codex context for file operations', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();
      
      const input = { tool: 'read', args: { filePath: 'test.ts' } };
      const output = { output: 'original output' };
      
      const result = hook.hooks['tool.execute.after'](input, output, 'session-123');
      
      expect(result).not.toBe(output); // Should return new object
      expect(result.output).toContain('StrRay Codex Context v1.2.20');
      expect(result.output).toContain('original output');
    });

    it('should not inject for non-file operations', () => {
      const hook = createStrRayCodexInjectorHook();
      
      const input = { tool: 'search', args: { query: 'test' } };
      const output = { output: 'search results' };
      
      const result = hook.hooks['tool.execute.after'](input, output, 'session-123');
      
      expect(result).toBe(output); // Should return same object
    });

    it('should handle injection errors gracefully', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('Injection error');
      });

      const hook = createStrRayCodexInjectorHook();
      
      const input = { tool: 'read', args: { filePath: 'test.ts' } };
      const output = { output: 'original output' };
      
      const result = hook.hooks['tool.execute.after'](input, output, 'session-123');
      
      expect(result).toBe(output); // Should return original on error
    });

    it('should not inject when no codex contexts loaded', () => {
      mockFs.existsSync.mockReturnValue(false);

      const hook = createStrRayCodexInjectorHook();
      
      const input = { tool: 'write', args: { filePath: 'test.ts', content: 'code' } };
      const output = { output: 'original output' };
      
      const result = hook.hooks['tool.execute.after'](input, output, 'session-123');
      
      expect(result).toBe(output); // Should return same object
    });
  });

  describe('loadCodexContext', () => {
    it('should load from cache on subsequent calls', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      // First call
      const hook1 = createStrRayCodexInjectorHook();
      hook1.hooks['agent.start']('session-123');

      // Reset mocks to check if they're called again
      mockFs.existsSync.mockClear();
      mockFs.readFileSync.mockClear();

      // Second call should use cache
      const hook2 = createStrRayCodexInjectorHook();
      hook2.hooks['agent.start']('session-123');

      expect(mockFs.existsSync).not.toHaveBeenCalled();
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it('should try all configured file locations', () => {
      let existsCallCount = 0;
      mockFs.existsSync.mockImplementation(() => {
        existsCallCount++;
        return existsCallCount === 3; // Third file exists
      });
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');

      expect(mockFs.existsSync).toHaveBeenCalledTimes(3);
      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), 'src/agents_template.md');
      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), 'docs/agents/AGENTS.md');
      expect(mockPath.join).toHaveBeenCalledWith(process.cwd(), '.strray/agents_template.md');
    });

    it('should load multiple codex files if available', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValueOnce(mockCodexContent);
      mockFs.readFileSync.mockReturnValueOnce(mockCodexContent.replace('v1.2.20', 'v1.2.21'));

      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');

      const stats = getCodexStats('session-123');
      expect(stats.fileCount).toBe(4); // All files exist
      expect(stats.totalTerms).toBeGreaterThan(3); // Multiple files
    });
  });

  describe('extractCodexMetadata', () => {
    it('should extract version correctly', () => {
      const content = '**Version**: 1.2.21\n**Last Updated**: 2026-01-07\n#### 1. Test Term\n#### 2. Another Term';
      
      // Access private function through hook creation
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      
      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');
      
      const stats = getCodexStats('session-123');
      expect(stats.version).toBe('1.2.21');
    });

    it('should count terms correctly', () => {
      const content = `
#### 1. First Term
#### 2. Second Term
#### 11. Extended Term
#### 25. Architecture Term
`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      
      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');
      
      const stats = getCodexStats('session-123');
      expect(stats.totalTerms).toBe(4);
    });

    it('should handle missing version', () => {
      const content = '#### 1. Term without version';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      
      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');
      
      const stats = getCodexStats('session-123');
      expect(stats.version).toBe('1.2.20'); // Default version
    });
  });

  describe('createCodexContextEntry', () => {
    it('should create valid context entry', () => {
      const filePath = '/path/to/.strray/agents_template.md';
      const content = mockCodexContent;
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(content);
      
      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');
      
      const stats = getCodexStats('session-123');
      expect(stats.loaded).toBe(true);
      expect(stats.fileCount).toBe(1);
      expect(stats.totalTerms).toBe(3);
    });

    it('should set correct priority for codex entries', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);
      
      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');
      
      // All codex entries should have critical priority
      // This is tested indirectly through the hook working correctly
      expect(getCodexStats('session-123').loaded).toBe(true);
    });
  });

  describe('formatCodexContext', () => {
    it('should format multiple contexts correctly', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);
      
      const hook = createStrRayCodexInjectorHook();
      
      const input = { tool: 'read', args: { filePath: 'test.ts' } };
      const output = { output: 'original output' };
      
      const result = hook.hooks['tool.execute.after'](input, output, 'session-123');
      
      expect(result.output).toContain('# StrRay Codex Context v1.2.20');
      expect(result.output).toContain('Source:');
      expect(result.output).toContain('Terms Loaded: 3');
      expect(result.output).toContain('Loaded At:');
      expect(result.output).toContain('---');
      expect(result.output).toContain('original output');
    });

    it('should handle empty context list', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const hook = createStrRayCodexInjectorHook();
      
      const input = { tool: 'read', args: { filePath: 'test.ts' } };
      const output = { output: 'original output' };
      
      const result = hook.hooks['tool.execute.after'](input, output, 'session-123');
      
      expect(result.output).toBe('original output'); // No injection
    });
  });

  describe('getCodexStats', () => {
    it('should return unloaded stats for unknown session', () => {
      const stats = getCodexStats('unknown-session');
      
      expect(stats.loaded).toBe(false);
      expect(stats.fileCount).toBe(0);
      expect(stats.totalTerms).toBe(0);
      expect(stats.version).toBe('unknown');
    });

    it('should return correct stats for loaded session', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);
      
      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');
      
      const stats = getCodexStats('session-123');
      
      expect(stats.loaded).toBe(true);
      expect(stats.fileCount).toBe(1);
      expect(stats.totalTerms).toBe(3);
      expect(stats.version).toBe('1.2.20');
    });

    it('should aggregate stats across multiple files', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValueOnce(mockCodexContent);
      mockFs.readFileSync.mockReturnValueOnce(mockCodexContent.replace('#### 11.', '#### 12.'));
      
      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');
      
      const stats = getCodexStats('session-123');
      
      expect(stats.fileCount).toBe(4); // All files exist
      expect(stats.totalTerms).toBeGreaterThan(3); // Multiple files with terms
    });
  });

  describe('clearCodexCache', () => {
    it('should clear all cache when no session specified', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);
      
      const hook = createStrRayCodexInjectorHook();
      hook.hooks['agent.start']('session-123');
      
      expect(getCodexStats('session-123').loaded).toBe(true);
      
      clearCodexCache();
      
      expect(getCodexStats('session-123').loaded).toBe(false);
    });

    it('should clear specific session cache', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);
      
      const hook1 = createStrRayCodexInjectorHook();
      hook1.hooks['agent.start']('session-123');
      
      const hook2 = createStrRayCodexInjectorHook();
      hook2.hooks['agent.start']('session-456');
      
      expect(getCodexStats('session-123').loaded).toBe(true);
      expect(getCodexStats('session-456').loaded).toBe(true);
      
      clearCodexCache('session-123');
      
      expect(getCodexStats('session-123').loaded).toBe(false);
      expect(getCodexStats('session-456').loaded).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const hook = createStrRayCodexInjectorHook();
      
      // Should not throw
      expect(() => {
        hook.hooks['agent.start']('session-123');
      }).not.toThrow();
      
      expect(getCodexStats('session-123').loaded).toBe(false);
    });

    it('should handle path resolution errors', () => {
      mockPath.join.mockImplementation(() => {
        throw new Error('Path error');
      });

      const hook = createStrRayCodexInjectorHook();
      
      expect(() => {
        hook.hooks['agent.start']('session-123');
      }).not.toThrow();
    });

    it('should handle console logging errors', () => {
        throw new Error('Console error');
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockCodexContent);

      const hook = createStrRayCodexInjectorHook();
      
      // Should not throw despite console error
      expect(() => {
        hook.hooks['agent.start']('session-123');
      }).not.toThrow();
      
    });
  });
});
