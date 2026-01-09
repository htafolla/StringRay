import { describe, it, expect } from 'vitest';
import { testArchitect } from '../../agents/test-architect.js';
import type { AgentConfig } from '../../agents/types.js';

describe('Test Architect Agent Configuration', () => {
  it('should be a valid AgentConfig object', () => {
    const config: AgentConfig = testArchitect;
    expect(config).toBeDefined();
  });

  describe('Basic Configuration', () => {
    it('should have correct name and model', () => {
      expect(testArchitect.name).toBe('test-architect');
      expect(testArchitect.model).toBe('opencode/grok-code');
    });

    it('should be configured as subagent mode', () => {
      expect(testArchitect.mode).toBe('subagent');
    });

    it('should have low temperature for consistent testing decisions', () => {
      expect(testArchitect.temperature).toBe(0.1);
    });
  });

  describe('Description and System Prompt', () => {
    it('should have appropriate test architect description', () => {
      expect(testArchitect.description).toContain('StrRay Framework test architect');
      expect(testArchitect.description).toContain('coverage optimization');
      expect(testArchitect.description).toContain('behavioral testing');
    });

    it('should have comprehensive test architect system prompt', () => {
      const system = testArchitect.system;
      expect(system).toContain('StrRay Test Architect');
      expect(system).toContain('comprehensive testing strategy');
      expect(system).toContain('quality assurance');
    });
  });

  describe('Core Responsibilities', () => {
    it('should define 5 core testing responsibilities', () => {
      const system = testArchitect.system;
      expect(system).toContain('Test Strategy Design');
      expect(system).toContain('Coverage Optimization');
      expect(system).toContain('Behavioral Testing');
      expect(system).toContain('Performance Validation');
      expect(system).toContain('Quality Assurance');
    });

    it('should specify test strategy design capabilities', () => {
      const system = testArchitect.system;
      expect(system).toContain('comprehensive testing plans');
      expect(system).toContain('unit, integration, and E2E scenarios');
    });

    it('should include coverage optimization focus', () => {
      const system = testArchitect.system;
      expect(system).toContain('Maximize test coverage');
      expect(system).toContain('minimizing redundancy');
      expect(system).toContain('maintenance overhead');
    });

    it('should specify behavioral testing approach', () => {
      const system = testArchitect.system;
      expect(system).toContain('behavior validation');
      expect(system).toContain('implementation details');
    });

    it('should include performance validation', () => {
      const system = testArchitect.system;
      expect(system).toContain('performance requirements');
      expect(system).toContain('scalability');
    });

    it('should specify quality assurance goals', () => {
      const system = testArchitect.system;
      expect(system).toContain('85%+ test coverage');
      expect(system).toContain('reliable, maintainable test suites');
    });
  });

  describe('Key Facilities', () => {
    it('should specify test coverage tracking', () => {
      const system = testArchitect.system;
      expect(system).toContain('Test coverage tracking');
      expect(system).toContain('coverage_trends');
      expect(system).toContain('test_execution_time');
      expect(system).toContain('flaky_test_rate');
    });

    it('should include performance analytics', () => {
      const system = testArchitect.system;
      expect(system).toContain('Performance analytics');
      expect(system).toContain('execution timing patterns');
      expect(system).toContain('failure prediction models');
    });

    it('should define testing processor pipeline', () => {
      const system = testArchitect.system;
      expect(system).toContain('Processor pipeline');
      expect(system).toContain('test-validation');
      expect(system).toContain('coverage-analysis');
      expect(system).toContain('performance-testing');
      expect(system).toContain('integration-testing');
    });

    it('should specify alert thresholds', () => {
      const system = testArchitect.system;
      expect(system).toContain('Alert thresholds');
      expect(system).toContain('40s response time');
      expect(system).toContain('2% error rate');
      expect(system).toContain('400MB memory usage');
    });

    it('should specify parallel execution capabilities', () => {
      const system = testArchitect.system;
      expect(system).toContain('Parallel test execution');
      expect(system).toContain('4+ worker threads');
    });
  });

  describe('Testing Strategy', () => {
    it('should define 5-level testing strategy', () => {
      const system = testArchitect.system;
      expect(system).toContain('Testing Strategy');
      expect(system).toContain('Unit Testing');
      expect(system).toContain('Integration Testing');
      expect(system).toContain('End-to-End Testing');
      expect(system).toContain('Performance Testing');
      expect(system).toContain('Security Testing');
    });

    it('should specify unit testing focus', () => {
      const system = testArchitect.system;
      expect(system).toContain('Pure functions');
      expect(system).toContain('component isolation');
      expect(system).toContain('edge case coverage');
    });

    it('should include integration testing', () => {
      const system = testArchitect.system;
      expect(system).toContain('Component interaction');
      expect(system).toContain('API validation');
      expect(system).toContain('data flow testing');
    });

    it('should specify end-to-end testing', () => {
      const system = testArchitect.system;
      expect(system).toContain('Complete user workflows');
      expect(system).toContain('critical path validation');
    });

    it('should include performance testing', () => {
      const system = testArchitect.system;
      expect(system).toContain('Load testing');
      expect(system).toContain('scalability validation');
      expect(system).toContain('bottleneck identification');
    });

    it('should specify security testing', () => {
      const system = testArchitect.system;
      expect(system).toContain('Input validation');
      expect(system).toContain('authentication');
      expect(system).toContain('authorization testing');
    });
  });

  describe('Testing Guidelines', () => {
    it('should prioritize behavior over implementation', () => {
      const system = testArchitect.system;
      expect(system).toContain('behavior over implementation details');
    });

    it('should specify coverage requirements', () => {
      const system = testArchitect.system;
      expect(system).toContain('85%+ coverage');
      expect(system).toContain('all test types');
    });

    it('should emphasize parallel execution', () => {
      const system = testArchitect.system;
      expect(system).toContain('parallel execution');
      expect(system).toContain('efficiency');
    });

    it('should include predictive models', () => {
      const system = testArchitect.system;
      expect(system).toContain('predictive models');
      expect(system).toContain('failure prevention');
    });

    it('should validate both positive and negative scenarios', () => {
      const system = testArchitect.system;
      expect(system).toContain('positive and negative test scenarios');
    });
  });

  describe('Integration Points', () => {
    it('should define comprehensive testing integration points', () => {
      const system = testArchitect.system;
      expect(system).toContain('Integration Points');
      expect(system).toContain('Automated testing frameworks');
      expect(system).toContain('Coverage analysis');
      expect(system).toContain('Performance monitoring');
      expect(system).toContain('CI/CD pipeline integration');
      expect(system).toContain('Test result analysis');
    });
  });

  describe('Tools Configuration', () => {
    it('should have essential testing tools', () => {
      expect(testArchitect.tools?.include).toContain('read');
      expect(testArchitect.tools?.include).toContain('grep');
      expect(testArchitect.tools?.include).toContain('lsp_*');
      expect(testArchitect.tools?.include).toContain('run_terminal_cmd');
    });

    it('should have 5 testing-specific tools', () => {
      expect(testArchitect.tools?.include).toHaveLength(5);
    });
  });

  describe('Permissions Configuration', () => {
    it('should allow edit operations', () => {
      expect(testArchitect.permission?.edit).toBe('allow');
    });

    it('should have comprehensive testing permissions', () => {
      const bashPerms = testArchitect.permission?.bash;
      expect(bashPerms).toBeDefined();
      expect(typeof bashPerms).toBe('object');

      expect((bashPerms as any)?.git).toBe('allow');
      expect((bashPerms as any)?.npm).toBe('allow');
      expect((bashPerms as any)?.bun).toBe('allow');
      expect((bashPerms as any)?.test).toBe('allow');
      expect((bashPerms as any)?.coverage).toBe('allow');
    });
  });

  describe('Testing Goal', () => {
    it('should define clear testing assurance goal', () => {
      const system = testArchitect.system;
      expect(system).toContain('comprehensive test coverage');
      expect(system).toContain('reliable validation');
      expect(system).toContain('system behavior');
      expect(system).toContain('performance');
    });
  });
});