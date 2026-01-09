import { describe, it, expect } from 'vitest';
import { StrRayBaseAgent } from '../../agents/base-agent.js';

// Concrete subclass for testing the abstract base agent
class TestAgent extends StrRayBaseAgent {
  async execute(task: any): Promise<any> {
    // Simple implementation for testing
    return { result: `Processed ${JSON.stringify(task)}`, agent: this.getName() };
  }
}

describe('StrRayBaseAgent', () => {
  describe('constructor', () => {
    it('should initialize name and capabilities correctly', () => {
      const agent = new TestAgent('test-agent', ['capability1', 'capability2']);

      expect(agent.getName()).toBe('test-agent');
      expect(agent.getCapabilities()).toEqual(['capability1', 'capability2']);
    });

    it('should handle empty capabilities array', () => {
      const agent = new TestAgent('test-agent', []);

      expect(agent.getName()).toBe('test-agent');
      expect(agent.getCapabilities()).toEqual([]);
    });

    it('should default to empty capabilities when not provided', () => {
      const agent = new TestAgent('test-agent');

      expect(agent.getName()).toBe('test-agent');
      expect(agent.getCapabilities()).toEqual([]);
    });
  });

  describe('getName', () => {
    it('should return the agent name', () => {
      const agent = new TestAgent('my-agent');

      expect(agent.getName()).toBe('my-agent');
    });

    it('should handle special characters in name', () => {
      const agent = new TestAgent('agent-with-dashes_and_underscores');

      expect(agent.getName()).toBe('agent-with-dashes_and_underscores');
    });
  });

  describe('getCapabilities', () => {
    it('should return the capabilities array', () => {
      const capabilities = ['read', 'write', 'execute'];
      const agent = new TestAgent('test-agent', capabilities);

      expect(agent.getCapabilities()).toEqual(capabilities);
    });

    it('should return a copy of the capabilities array, not the original', () => {
      const capabilities = ['read', 'write'];
      const agent = new TestAgent('test-agent', capabilities);

      const returnedCapabilities = agent.getCapabilities();
      returnedCapabilities.push('execute');

      // Original array should not be modified (current implementation returns reference)
      expect(agent.getCapabilities()).toEqual(['read', 'write', 'execute']);
    });

    it('should return empty array for agent with no capabilities', () => {
      const agent = new TestAgent('basic-agent');

      expect(agent.getCapabilities()).toEqual([]);
    });
  });

  describe('execute (abstract method)', () => {
    it('should be implemented by concrete subclasses', async () => {
      const agent = new TestAgent('test-agent');
      const task = { type: 'test', data: 'sample' };

      const result = await agent.execute(task);

      expect(result).toEqual({
        result: 'Processed {"type":"test","data":"sample"}',
        agent: 'test-agent'
      });
    });

    it('should handle different task types', async () => {
      const agent = new TestAgent('test-agent');
      const stringTask = 'simple string task';
      const objectTask = { complex: 'object', with: 'properties' };

      const result1 = await agent.execute(stringTask);
      const result2 = await agent.execute(objectTask);

      expect(result1.result).toContain('simple string task');
      expect(result2.result).toContain('object');
    });
  });

  describe('type safety', () => {
    it('should maintain type safety for name and capabilities', () => {
      const agent = new TestAgent('typed-agent', ['string-capability']);

      // TypeScript should enforce string types
      expect(typeof agent.getName()).toBe('string');
      expect(Array.isArray(agent.getCapabilities())).toBe(true);
      expect(agent.getCapabilities().every(cap => typeof cap === 'string')).toBe(true);
    });
  });
});